import type * as OrtTypes from 'onnxruntime-web';
import type {
  AiModelEngine,
  ResizeSettings,
  RuntimeBackend,
  SharpenLevel,
  UpscaleEngine,
} from '../types/index';
import { yieldWithoutBackgroundThrottle } from '../utils/backgroundKeepAlive';
import {
  applyAdaptiveUnsharpMask,
  computeMeanSobelMagnitude,
  getAdaptiveUnsharpRadius,
  resampleTileSubregionLanczos3,
} from '../utils/lanczosResampler';

export interface UpscaleWorkerLimits {
  readonly maxLongEdge: number;
  readonly maxPixels: number;
  readonly isMobile: boolean;
  readonly deviceLabel: string;
}

export type UpscaleWorkerRequest =
  | {
      readonly type: 'run';
      readonly jobId: number;
      readonly file: File;
      readonly settings: ResizeSettings;
      readonly mimeType: string;
      readonly limits: UpscaleWorkerLimits;
    }
  | {
      readonly type: 'cancel';
      readonly jobId: number;
    };

export type UpscaleWorkerResponse =
  | {
      readonly type: 'progress';
      readonly jobId: number;
      readonly percent: number;
      readonly statusText: string;
    }
  | {
      readonly type: 'done';
      readonly jobId: number;
      readonly blob: Blob;
      readonly width: number;
      readonly height: number;
      readonly size: number;
      readonly wasCappedForMemory: boolean;
      readonly usedEngine: UpscaleEngine;
      readonly runtimeBackend: RuntimeBackend;
      readonly sharpnessGainPercent: number;
    }
  | {
      readonly type: 'aborted';
      readonly jobId: number;
    }
  | {
      readonly type: 'error';
      readonly jobId: number;
      readonly message: string;
    };

interface ModelSpec {
  readonly fileName: string;
  readonly expectedBytes: number;
  readonly sizeLabel: string;
  readonly label: string;
  readonly isFp16: boolean;
}

interface GpuAdapterLike {
  readonly features?: {
    has(feature: string): boolean;
  };
}

interface WorkerNavigatorLike {
  readonly gpu?: {
    requestAdapter(): Promise<GpuAdapterLike | null>;
  };
}

interface WorkerScopeLike {
  readonly location?: { readonly origin?: string };
  readonly caches?: CacheStorage;
  onmessage: ((event: MessageEvent<UpscaleWorkerRequest>) => void) | null;
  postMessage(message: UpscaleWorkerResponse): void;
}

interface OrtSessionBundle {
  readonly session: OrtTypes.InferenceSession;
  readonly backend: RuntimeBackend;
}

const MODEL_REGISTRY: Readonly<Record<AiModelEngine, ModelSpec>> = {
  'ai-realesrgan-v3': {
    fileName: 'realesr-general-x4v3.onnx',
    expectedBytes: 4866417,
    sizeLabel: '4.6 MB',
    label: 'Real-ESRGAN v3',
    isFp16: false,
  },
  'ai-realesrgan-x4plus': {
    fileName: 'realesrgan_x4plus_fp16.onnx',
    expectedBytes: 33754434,
    sizeLabel: '32.2 MB',
    label: 'Real-ESRGAN x4plus',
    isFp16: true,
  },
};

const MODEL_CACHE_NAME = 'veranex-realesrgan-v1';
const MODEL_SCALE = 4;
const TILE_CORE = 108;
const TILE_PAD = 10;
const TILE_INPUT = TILE_CORE + TILE_PAD * 2; // 128
const TILE_OUTPUT = TILE_INPUT * MODEL_SCALE; // 512

const workerScope = self as unknown as WorkerScopeLike;

const cancelledJobIds = new Set<number>();
const activeFetchControllers = new Map<number, AbortController>();
const sessionCache = new Map<AiModelEngine, Promise<OrtSessionBundle>>();

let capabilitiesPromise: Promise<{ hasWebGpu: boolean; hasShaderF16: boolean }> | null = null;
let ortModulePromise: Promise<typeof OrtTypes> | null = null;
let webGpuDisabled = false;
let jobQueue: Promise<void> = Promise.resolve();

function postToMain(message: UpscaleWorkerResponse): void {
  workerScope.postMessage(message);
}

function getNormalizedBaseUrl(): string {
  const baseUrl = import.meta.env.BASE_URL || '/app/image-resizer/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function getFullBaseUrl(): string {
  const normalized = getNormalizedBaseUrl();
  const origin = workerScope.location?.origin;
  if (origin && origin !== 'null') {
    return `${origin}${normalized}`;
  }
  return normalized;
}

function getModelUrl(engine: AiModelEngine): string {
  return `${getFullBaseUrl()}models/${MODEL_REGISTRY[engine].fileName}`;
}

function getOrtWasmBasePath(): string {
  return `${getFullBaseUrl()}ort-wasm/`;
}

function createAbortError(): DOMException {
  return new DOMException('작업이 중단되었습니다.', 'AbortError');
}

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err && typeof err === 'object' && 'name' in err) {
    return (err as { readonly name: unknown }).name === 'AbortError';
  }
  return false;
}

function throwIfJobCancelled(jobId: number): void {
  if (cancelledJobIds.has(jobId)) {
    throw createAbortError();
  }
}

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.round(value);
}

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function isValidOnnxPayload(bytes: Uint8Array, expectedBytes: number): boolean {
  if (bytes.byteLength < Math.floor(expectedBytes * 0.99)) {
    return false;
  }
  if (bytes.byteLength > 0 && bytes[0] === 0x3c) {
    return false;
  }
  return true;
}

function calculateUpscaleTarget(
  origW: number,
  origH: number,
  settings: Pick<ResizeSettings, 'upscaleTarget'>,
  limits: UpscaleWorkerLimits
): { targetW: number; targetH: number; wasCappedForMemory: boolean } {
  const safeW = Math.max(1, origW);
  const safeH = Math.max(1, origH);
  const origLong = Math.max(safeW, safeH);

  let rawW = safeW;
  let rawH = safeH;

  switch (settings.upscaleTarget) {
    case '1x':
      rawW = safeW;
      rawH = safeH;
      break;
    case '2x':
      rawW = safeW * 2;
      rawH = safeH * 2;
      break;
    case '3x':
      rawW = safeW * 3;
      rawH = safeH * 3;
      break;
    case '4x':
      rawW = safeW * 4;
      rawH = safeH * 4;
      break;
    case '6x':
      rawW = safeW * 6;
      rawH = safeH * 6;
      break;
    case '8x':
      rawW = safeW * 8;
      rawH = safeH * 8;
      break;
    case 'fhd':
    case '4k':
    case '8k': {
      const targetEdge =
        settings.upscaleTarget === 'fhd' ? 1920 : settings.upscaleTarget === '4k' ? 3840 : 7680;
      if (origLong >= targetEdge) {
        rawW = safeW;
        rawH = safeH;
      } else {
        const ratio = targetEdge / origLong;
        rawW = Math.round(safeW * ratio);
        rawH = Math.round(safeH * ratio);
      }
      break;
    }
  }

  let targetW = Math.max(1, rawW);
  let targetH = Math.max(1, rawH);
  let wasCappedForMemory = false;

  const targetLong = Math.max(targetW, targetH);
  const totalPixels = targetW * targetH;
  if (targetLong > limits.maxLongEdge || totalPixels > limits.maxPixels) {
    const edgeRatio = targetLong > limits.maxLongEdge ? limits.maxLongEdge / targetLong : 1;
    const pixelRatio =
      totalPixels > limits.maxPixels ? Math.sqrt(limits.maxPixels / totalPixels) : 1;
    const capRatio = Math.min(edgeRatio, pixelRatio);
    targetW = Math.max(1, Math.floor(targetW * capRatio));
    targetH = Math.max(1, Math.floor(targetH * capRatio));
    wasCappedForMemory = true;
  }

  return { targetW, targetH, wasCappedForMemory };
}

async function detectWebGpuCapabilities(): Promise<{ hasWebGpu: boolean; hasShaderF16: boolean }> {
  if (!capabilitiesPromise) {
    capabilitiesPromise = (async () => {
      if (typeof navigator === 'undefined') {
        return { hasWebGpu: false, hasShaderF16: false };
      }
      const gpuNav = navigator as unknown as WorkerNavigatorLike;
      if (!gpuNav.gpu || typeof gpuNav.gpu.requestAdapter !== 'function') {
        return { hasWebGpu: false, hasShaderF16: false };
      }
      try {
        const adapter = await gpuNav.gpu.requestAdapter();
        if (!adapter) {
          return { hasWebGpu: false, hasShaderF16: false };
        }
        const hasShaderF16 = Boolean(adapter.features && adapter.features.has('shader-f16'));
        return { hasWebGpu: true, hasShaderF16 };
      } catch {
        return { hasWebGpu: false, hasShaderF16: false };
      }
    })();
  }
  return capabilitiesPromise;
}

async function loadOrtModule(): Promise<typeof OrtTypes> {
  if (!ortModulePromise) {
    ortModulePromise = import('onnxruntime-web').then((mod) => {
      mod.env.logLevel = 'error';
      mod.env.wasm.wasmPaths = getOrtWasmBasePath();
      mod.env.wasm.numThreads = 1;
      mod.env.wasm.proxy = false;
      return mod;
    });
  }
  return ortModulePromise;
}

async function readModelFromCache(url: string, expectedBytes: number): Promise<Uint8Array | null> {
  const cachesApi = workerScope.caches;
  if (!cachesApi) return null;
  try {
    const cache = await cachesApi.open(MODEL_CACHE_NAME);
    const cached = await cache.match(url);
    if (!cached) return null;
    const buf = await cached.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (!isValidOnnxPayload(bytes, expectedBytes)) {
      await cache.delete(url);
      return null;
    }
    return bytes;
  } catch {
    return null;
  }
}

async function writeModelToCache(url: string, bytes: Uint8Array): Promise<void> {
  const cachesApi = workerScope.caches;
  if (!cachesApi) return;
  try {
    const cache = await cachesApi.open(MODEL_CACHE_NAME);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const res = new Response(copy, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(copy.byteLength),
      },
    });
    await cache.put(url, res);
  } catch {
    // 저장 공간 부족·사생활 보호 모드에서는 캐시 쓰기만 건너뛰고 정상 진행
  }
}

async function loadModelBytes(
  jobId: number,
  engine: AiModelEngine,
  onProgress: (percent: number, statusText: string) => void
): Promise<Uint8Array> {
  throwIfJobCancelled(jobId);
  const spec = MODEL_REGISTRY[engine];
  const url = getModelUrl(engine);

  const cached = await readModelFromCache(url, spec.expectedBytes);
  throwIfJobCancelled(jobId);
  if (cached) {
    onProgress(10, `${spec.label} 모델 캐시 로드 완료 (${spec.sizeLabel})`);
    return cached;
  }

  onProgress(4, `${spec.label} 모델 다운로드 중... (0.0 / ${spec.sizeLabel})`);
  const fetchController = new AbortController();
  activeFetchControllers.set(jobId, fetchController);

  try {
    const res = await fetch(url, {
      signal: fetchController.signal,
      credentials: 'same-origin',
    });
    if (!res.ok) {
      throw new Error(`${spec.label} AI 모델 파일을 불러오지 못했습니다. (HTTP ${res.status})`);
    }

    const totalHeader = Number(res.headers.get('content-length') || spec.expectedBytes);
    const totalBytes = totalHeader > 0 ? totalHeader : spec.expectedBytes;

    let merged: Uint8Array;
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        throwIfJobCancelled(jobId);
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.byteLength > 0) {
          chunks.push(value);
          received += value.byteLength;
          const frac = Math.min(1, received / totalBytes);
          const pct = 4 + Math.round(frac * 10);
          onProgress(
            pct,
            `${spec.label} 모델 다운로드 중... (${formatMb(received)} / ${formatMb(totalBytes)} MB)`
          );
        }
      }

      merged = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
    } else {
      const buf = await res.arrayBuffer();
      merged = new Uint8Array(buf);
    }

    throwIfJobCancelled(jobId);
    if (!isValidOnnxPayload(merged, spec.expectedBytes)) {
      throw new Error(`${spec.label} 모델 파일 무결성 검증에 실패했습니다.`);
    }

    await writeModelToCache(url, merged);
    onProgress(14, `${spec.label} 모델 다운로드 및 캐시 저장 완료`);
    return merged;
  } finally {
    activeFetchControllers.delete(jobId);
  }
}

async function getOrCreateSession(
  jobId: number,
  engine: AiModelEngine,
  onProgress: (percent: number, statusText: string) => void
): Promise<OrtSessionBundle> {
  const existing = sessionCache.get(engine);
  if (existing) {
    onProgress(14, `${MODEL_REGISTRY[engine].label} AI 세션 준비 중...`);
    return existing;
  }

  const spec = MODEL_REGISTRY[engine];
  const creationPromise = (async (): Promise<OrtSessionBundle> => {
    const [ort, caps, modelBytes] = await Promise.all([
      loadOrtModule(),
      detectWebGpuCapabilities(),
      loadModelBytes(jobId, engine, onProgress),
    ]);
    throwIfJobCancelled(jobId);

    const canTryWebGpu =
      !webGpuDisabled && (spec.isFp16 ? caps.hasWebGpu && caps.hasShaderF16 : caps.hasWebGpu);
    if (canTryWebGpu) {
      onProgress(15, `${spec.label} WebGPU GPU 세션 컴파일 중...`);
      try {
        const session = await ort.InferenceSession.create(modelBytes, {
          executionProviders: ['webgpu'],
        });
        return { session, backend: 'webgpu' };
      } catch (err: unknown) {
        console.warn('[Worker Real-ESRGAN] WebGPU 초기화 실패, WASM으로 전환:', err);
      }
    }

    onProgress(15, `${spec.label} WASM CPU 세션 초기화 중...`);
    const session = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'],
    });
    return { session, backend: 'wasm' };
  })().catch((err: unknown) => {
    sessionCache.delete(engine);
    throw err;
  });

  sessionCache.set(engine, creationPromise);
  return creationPromise;
}

function hasTransparentPixels(rgba: Uint8ClampedArray): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i]! < 255) return true;
  }
  return false;
}

function cropRgbaSubrect(
  src: Uint8ClampedArray,
  srcW: number,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(cropW * cropH * 4);
  const rowBytes = cropW * 4;
  for (let row = 0; row < cropH; row += 1) {
    const srcStart = ((cropY + row) * srcW + cropX) * 4;
    out.set(src.subarray(srcStart, srcStart + rowBytes), row * rowBytes);
  }
  return out;
}

function buildPaddedTileNchw(
  srcRgba: Uint8ClampedArray,
  origW: number,
  origH: number,
  srcPadX0: number,
  srcPadY0: number,
  hasAlpha: boolean,
  nchwOut: Float32Array
): void {
  const planeSize = TILE_INPUT * TILE_INPUT;
  const maxSrcX = origW - 1;
  const maxSrcY = origH - 1;
  const inv255 = 1 / 255;

  for (let y = 0; y < TILE_INPUT; y += 1) {
    const rawY = srcPadY0 + y;
    const sy = rawY < 0 ? 0 : rawY > maxSrcY ? maxSrcY : rawY;
    const srcRow = sy * origW;
    const dstRow = y * TILE_INPUT;

    for (let x = 0; x < TILE_INPUT; x += 1) {
      const rawX = srcPadX0 + x;
      const sx = rawX < 0 ? 0 : rawX > maxSrcX ? maxSrcX : rawX;
      const pIdx = (srcRow + sx) * 4;
      const dIdx = dstRow + x;

      if (!hasAlpha) {
        nchwOut[dIdx] = srcRgba[pIdx]! * inv255;
        nchwOut[planeSize + dIdx] = srcRgba[pIdx + 1]! * inv255;
        nchwOut[planeSize * 2 + dIdx] = srcRgba[pIdx + 2]! * inv255;
      } else {
        const alpha = srcRgba[pIdx + 3]! * inv255;
        const bg = 1 - alpha;
        nchwOut[dIdx] = srcRgba[pIdx]! * inv255 * alpha + bg;
        nchwOut[planeSize + dIdx] = srcRgba[pIdx + 1]! * inv255 * alpha + bg;
        nchwOut[planeSize * 2 + dIdx] = srcRgba[pIdx + 2]! * inv255 * alpha + bg;
      }
    }
  }
}

async function runRealEsrganTile(
  jobId: number,
  ort: typeof OrtTypes,
  session: OrtTypes.InferenceSession,
  nchwInput: Float32Array
): Promise<Uint8ClampedArray> {
  throwIfJobCancelled(jobId);
  const inputName = session.inputNames[0] ?? 'input';
  const outputName = session.outputNames[0] ?? 'output';
  const inputTensor = new ort.Tensor('float32', nchwInput, [1, 3, TILE_INPUT, TILE_INPUT]);
  let outputTensor: OrtTypes.Tensor | null = null;

  try {
    const results = await session.run({ [inputName]: inputTensor });
    const out = results[outputName];
    if (!out) {
      throw new Error('Real-ESRGAN 모델이 유효한 출력 텐서를 반환하지 않았습니다.');
    }
    outputTensor = out;
    throwIfJobCancelled(jobId);

    const outData = await out.getData();
    const planeSize = TILE_OUTPUT * TILE_OUTPUT;
    const rgba = new Uint8ClampedArray(planeSize * 4);

    for (let i = 0; i < planeSize; i += 1) {
      const dIdx = i * 4;
      const r = Number(outData[i] ?? 0) * 255;
      const g = Number(outData[planeSize + i] ?? 0) * 255;
      const b = Number(outData[planeSize * 2 + i] ?? 0) * 255;
      rgba[dIdx] = clampByte(r);
      rgba[dIdx + 1] = clampByte(g);
      rgba[dIdx + 2] = clampByte(b);
      rgba[dIdx + 3] = 255;
    }

    return rgba;
  } finally {
    inputTensor.dispose();
    if (outputTensor) {
      outputTensor.dispose();
    }
  }
}

function measureOffscreenSharpnessGainPercent(
  bitmap: ImageBitmap,
  outCanvas: OffscreenCanvas,
  outCtx: OffscreenCanvasRenderingContext2D
): number {
  const outW = outCanvas.width;
  const outH = outCanvas.height;
  const origW = bitmap.width;
  const origH = bitmap.height;
  if (outW < 16 || outH < 16 || origW < 4 || origH < 4) return 0;

  const sampleW = Math.min(384, outW);
  const sampleH = Math.min(384, outH);
  const dstX = Math.max(0, Math.floor((outW - sampleW) / 2));

  const baseCanvas = new OffscreenCanvas(sampleW, sampleH);
  const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
  if (!baseCtx) return 0;
  baseCtx.imageSmoothingEnabled = true;
  baseCtx.imageSmoothingQuality = 'high';

  const measureAtCenterY = (centerFracY: number) => {
    const dstY = Math.max(
      0,
      Math.min(outH - sampleH, Math.floor(outH * centerFracY - sampleH / 2))
    );
    const srcX = (dstX / outW) * origW;
    const srcY = (dstY / outH) * origH;
    const srcW = (sampleW / outW) * origW;
    const srcH = (sampleH / outH) * origH;

    baseCtx.clearRect(0, 0, sampleW, sampleH);
    baseCtx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, sampleW, sampleH);
    const baseData = baseCtx.getImageData(0, 0, sampleW, sampleH).data;
    const outData = outCtx.getImageData(dstX, dstY, sampleW, sampleH).data;

    return {
      baseEnergy: computeMeanSobelMagnitude(baseData, sampleW, sampleH),
      outEnergy: computeMeanSobelMagnitude(outData, sampleW, sampleH),
    };
  };

  let best = measureAtCenterY(0.5);
  if (best.baseEnergy < 1.2 && outH > sampleH * 2) {
    for (const frac of [0.25, 0.75, 0.15, 0.85]) {
      const candidate = measureAtCenterY(frac);
      if (candidate.baseEnergy > best.baseEnergy) {
        best = candidate;
      }
      if (best.baseEnergy >= 3.0) break;
    }
  }

  baseCanvas.width = 0;
  baseCanvas.height = 0;

  if (best.baseEnergy < 0.05 && best.outEnergy < 0.05) return 0;
  const gain = ((best.outEnergy - best.baseEnergy) / Math.max(0.25, best.baseEnergy)) * 100;
  return Math.max(-99, Math.min(999, Math.round(gain)));
}

async function runRealEsrganOffscreen(
  jobId: number,
  srcRgba: Uint8ClampedArray,
  origW: number,
  origH: number,
  targetW: number,
  targetH: number,
  engine: AiModelEngine,
  sharpenLevel: SharpenLevel,
  outCtx: OffscreenCanvasRenderingContext2D,
  onProgress: (percent: number, statusText: string) => void
): Promise<RuntimeBackend> {
  throwIfJobCancelled(jobId);
  const spec = MODEL_REGISTRY[engine];
  onProgress(2, `${spec.label} 백그라운드 추론 엔진 준비 중...`);

  const ort = await loadOrtModule();
  let bundle = await getOrCreateSession(jobId, engine, onProgress);
  throwIfJobCancelled(jobId);

  let backendTag = bundle.backend === 'webgpu' ? 'WebGPU GPU' : 'WASM CPU';
  onProgress(16, `원본 픽셀 분석 및 타일 그리드 구성 (${backendTag})`);

  const hasAlpha = hasTransparentPixels(srcRgba);
  const cols = Math.max(1, Math.ceil(origW / TILE_CORE));
  const rows = Math.max(1, Math.ceil(origH / TILE_CORE));
  const totalTiles = cols * rows;
  const scaleX = targetW / origW;
  const scaleY = targetH / origH;
  const effectiveScale = Math.max(scaleX, scaleY);
  const isExact4x = targetW === origW * MODEL_SCALE && targetH === origH * MODEL_SCALE;
  const usmMargin = Math.min(5, Math.max(2, getAdaptiveUnsharpRadius(effectiveScale)));
  const nchwBuffer = new Float32Array(3 * TILE_INPUT * TILE_INPUT);

  let completedTiles = 0;

  for (let ty = 0; ty < rows; ty += 1) {
    for (let tx = 0; tx < cols; tx += 1) {
      throwIfJobCancelled(jobId);

      const tileNumber = completedTiles + 1;
      const srcCoreX0 = tx * TILE_CORE;
      const srcCoreY0 = ty * TILE_CORE;
      const srcCoreX1 = Math.min(origW, srcCoreX0 + TILE_CORE);
      const srcCoreY1 = Math.min(origH, srcCoreY0 + TILE_CORE);
      const coreW = srcCoreX1 - srcCoreX0;
      const coreH = srcCoreY1 - srcCoreY0;
      const srcPadX0 = srcCoreX0 - TILE_PAD;
      const srcPadY0 = srcCoreY0 - TILE_PAD;

      const pctBefore = 16 + Math.round((completedTiles / totalTiles) * 78);
      onProgress(
        Math.min(94, pctBefore),
        `${spec.label} 화질 복원 중 (${backendTag}) · 타일 ${tileNumber}/${totalTiles}`
      );

      buildPaddedTileNchw(srcRgba, origW, origH, srcPadX0, srcPadY0, hasAlpha, nchwBuffer);

      let tileAiRgba: Uint8ClampedArray;
      try {
        tileAiRgba = await runRealEsrganTile(jobId, ort, bundle.session, nchwBuffer);
      } catch (err: unknown) {
        if (!isAbortError(err) && bundle.backend === 'webgpu' && !webGpuDisabled) {
          console.warn('[Worker Real-ESRGAN] WebGPU 타일 오류, WASM 세션으로 자동 복구:', err);
          webGpuDisabled = true;
          sessionCache.delete(engine);
          bundle = await getOrCreateSession(jobId, engine, onProgress);
          backendTag = bundle.backend === 'webgpu' ? 'WebGPU GPU' : 'WASM CPU';
          tileAiRgba = await runRealEsrganTile(jobId, ort, bundle.session, nchwBuffer);
        } else {
          throw err;
        }
      }

      if (isExact4x) {
        const dstX0 = srcCoreX0 * MODEL_SCALE;
        const dstY0 = srcCoreY0 * MODEL_SCALE;
        const outTileW = coreW * MODEL_SCALE;
        const outTileH = coreH * MODEL_SCALE;

        const sharpened = applyAdaptiveUnsharpMask(
          tileAiRgba,
          TILE_OUTPUT,
          TILE_OUTPUT,
          sharpenLevel,
          MODEL_SCALE,
          true
        );
        const validTileRgba = cropRgbaSubrect(
          sharpened,
          TILE_OUTPUT,
          TILE_PAD * MODEL_SCALE,
          TILE_PAD * MODEL_SCALE,
          outTileW,
          outTileH
        );

        if (hasAlpha) {
          const alphaTile = resampleTileSubregionLanczos3({
            aiRgba: srcRgba,
            aiW: origW,
            aiH: origH,
            origW,
            origH,
            targetW,
            targetH,
            srcPadX0: 0,
            srcPadY0: 0,
            combinedAiScale: 1,
            dstX0,
            dstY0,
            outW: outTileW,
            outH: outTileH,
          });
          for (let i = 3; i < validTileRgba.length; i += 4) {
            validTileRgba[i] = alphaTile[i] ?? 255;
          }
        }

        outCtx.putImageData(
          new ImageData(new Uint8ClampedArray(validTileRgba), outTileW, outTileH),
          dstX0,
          dstY0
        );
      } else {
        const dstX0 = Math.floor(srcCoreX0 * scaleX);
        const dstX1 = tx === cols - 1 ? targetW : Math.floor(srcCoreX1 * scaleX);
        const dstY0 = Math.floor(srcCoreY0 * scaleY);
        const dstY1 = ty === rows - 1 ? targetH : Math.floor(srcCoreY1 * scaleY);
        const outTileW = dstX1 - dstX0;
        const outTileH = dstY1 - dstY0;

        if (outTileW > 0 && outTileH > 0) {
          const mX0 = Math.max(0, dstX0 - usmMargin);
          const mY0 = Math.max(0, dstY0 - usmMargin);
          const mX1 = Math.min(targetW, dstX1 + usmMargin);
          const mY1 = Math.min(targetH, dstY1 + usmMargin);
          const mW = mX1 - mX0;
          const mH = mY1 - mY0;

          const resampledMargin = resampleTileSubregionLanczos3({
            aiRgba: tileAiRgba,
            aiW: TILE_OUTPUT,
            aiH: TILE_OUTPUT,
            origW,
            origH,
            targetW,
            targetH,
            srcPadX0,
            srcPadY0,
            combinedAiScale: MODEL_SCALE,
            dstX0: mX0,
            dstY0: mY0,
            outW: mW,
            outH: mH,
          });

          const sharpenedMargin = applyAdaptiveUnsharpMask(
            resampledMargin,
            mW,
            mH,
            sharpenLevel,
            effectiveScale,
            true
          );

          const validTileRgba = cropRgbaSubrect(
            sharpenedMargin,
            mW,
            dstX0 - mX0,
            dstY0 - mY0,
            outTileW,
            outTileH
          );

          if (hasAlpha) {
            const alphaTile = resampleTileSubregionLanczos3({
              aiRgba: srcRgba,
              aiW: origW,
              aiH: origH,
              origW,
              origH,
              targetW,
              targetH,
              srcPadX0: 0,
              srcPadY0: 0,
              combinedAiScale: 1,
              dstX0,
              dstY0,
              outW: outTileW,
              outH: outTileH,
            });
            for (let i = 3; i < validTileRgba.length; i += 4) {
              validTileRgba[i] = alphaTile[i] ?? 255;
            }
          }

          outCtx.putImageData(
            new ImageData(new Uint8ClampedArray(validTileRgba), outTileW, outTileH),
            dstX0,
            dstY0
          );
        }
      }

      completedTiles += 1;
      await yieldWithoutBackgroundThrottle();
    }
  }

  onProgress(95, 'AI 복원 및 해상도 정밀 합성 완료');
  return bundle.backend;
}

async function runLanczos3Offscreen(
  jobId: number,
  srcRgba: Uint8ClampedArray,
  origW: number,
  origH: number,
  targetW: number,
  targetH: number,
  sharpenLevel: SharpenLevel,
  bitmap: ImageBitmap,
  outCtx: OffscreenCanvasRenderingContext2D,
  onProgress: (percent: number, statusText: string) => void
): Promise<void> {
  const STRIP_ROWS = 256;
  const effectiveScale = Math.max(targetW / Math.max(1, origW), targetH / Math.max(1, origH));
  const usmMargin = getAdaptiveUnsharpRadius(effectiveScale);

  if (origW === targetW && origH === targetH) {
    if (sharpenLevel === 'none') {
      outCtx.drawImage(bitmap, 0, 0);
      onProgress(95, '원본 해상도 유지 완료');
      return;
    }

    for (let y0 = 0; y0 < targetH; y0 += STRIP_ROWS) {
      throwIfJobCancelled(jobId);
      const y1 = Math.min(targetH, y0 + STRIP_ROWS);
      const marginY0 = Math.max(0, y0 - usmMargin);
      const marginY1 = Math.min(targetH, y1 + usmMargin);
      const bandH = marginY1 - marginY0;
      const bandSlice = srcRgba.subarray(marginY0 * targetW * 4, marginY1 * targetW * 4);
      const sharpenedBand = applyAdaptiveUnsharpMask(
        bandSlice,
        targetW,
        bandH,
        sharpenLevel,
        1,
        false
      );
      const innerStart = (y0 - marginY0) * targetW * 4;
      const innerEnd = innerStart + (y1 - y0) * targetW * 4;
      const innerRgba = new Uint8ClampedArray(sharpenedBand.subarray(innerStart, innerEnd));
      outCtx.putImageData(new ImageData(innerRgba, targetW, y1 - y0), 0, y0);

      const pct = Math.min(95, 15 + Math.round((y1 / targetH) * 80));
      onProgress(pct, `선명화 보정 중 (${pct}%)`);
      await yieldWithoutBackgroundThrottle();
    }
    return;
  }

  for (let y0 = 0; y0 < targetH; y0 += STRIP_ROWS) {
    throwIfJobCancelled(jobId);
    const y1 = Math.min(targetH, y0 + STRIP_ROWS);
    const marginY0 = Math.max(0, y0 - usmMargin);
    const marginY1 = Math.min(targetH, y1 + usmMargin);
    const stripMarginH = marginY1 - marginY0;

    const stripMarginRgba = resampleTileSubregionLanczos3({
      aiRgba: srcRgba,
      aiW: origW,
      aiH: origH,
      origW,
      origH,
      targetW,
      targetH,
      srcPadX0: 0,
      srcPadY0: 0,
      combinedAiScale: 1,
      dstX0: 0,
      dstY0: marginY0,
      outW: targetW,
      outH: stripMarginH,
    });

    const sharpenedMargin = applyAdaptiveUnsharpMask(
      stripMarginRgba,
      targetW,
      stripMarginH,
      sharpenLevel,
      effectiveScale,
      false
    );

    const innerRowOffset = (y0 - marginY0) * targetW * 4;
    const innerRowBytes = (y1 - y0) * targetW * 4;
    const innerRgba = new Uint8ClampedArray(
      sharpenedMargin.subarray(innerRowOffset, innerRowOffset + innerRowBytes)
    );
    outCtx.putImageData(new ImageData(innerRgba, targetW, y1 - y0), 0, y0);

    const pct = Math.min(95, 12 + Math.round((y1 / targetH) * 83));
    onProgress(pct, `Lanczos-3 정밀 보간 중 (${pct}%)`);
    await yieldWithoutBackgroundThrottle();
  }
}

async function processUpscaleJob(
  req: Extract<UpscaleWorkerRequest, { type: 'run' }>
): Promise<void> {
  const { jobId, file, settings, mimeType, limits } = req;

  if (cancelledJobIds.has(jobId)) {
    postToMain({ type: 'aborted', jobId });
    cancelledJobIds.delete(jobId);
    return;
  }

  let bitmap: ImageBitmap | null = null;
  let srcCanvas: OffscreenCanvas | null = null;
  let outCanvas: OffscreenCanvas | null = null;
  let finalCanvas: OffscreenCanvas | null = null;

  const emitProgress = (percent: number, statusText: string): void => {
    if (!cancelledJobIds.has(jobId)) {
      postToMain({ type: 'progress', jobId, percent, statusText });
    }
  };

  try {
    emitProgress(3, '백그라운드 워커에서 이미지 디코딩 중...');
    bitmap = await createImageBitmap(file);
    throwIfJobCancelled(jobId);

    const origW = bitmap.width;
    const origH = bitmap.height;
    const { targetW, targetH, wasCappedForMemory } = calculateUpscaleTarget(
      origW,
      origH,
      settings,
      limits
    );

    srcCanvas = new OffscreenCanvas(origW, origH);
    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
    if (!srcCtx) {
      throw new Error('워커 원본 OffscreenCanvas 컨텍스트 초기화에 실패했습니다.');
    }
    srcCtx.drawImage(bitmap, 0, 0, origW, origH);
    const srcRgba = srcCtx.getImageData(0, 0, origW, origH).data;
    srcCanvas.width = 0;
    srcCanvas.height = 0;
    srcCanvas = null;

    outCanvas = new OffscreenCanvas(targetW, targetH);
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
    if (!outCtx) {
      throw new Error('워커 출력 OffscreenCanvas 컨텍스트 초기화에 실패했습니다.');
    }

    let usedEngine: UpscaleEngine = settings.upscaleEngine;
    let runtimeBackend: RuntimeBackend = 'cpu';

    if (
      settings.upscaleEngine === 'ai-realesrgan-v3' ||
      settings.upscaleEngine === 'ai-realesrgan-x4plus'
    ) {
      runtimeBackend = await runRealEsrganOffscreen(
        jobId,
        srcRgba,
        origW,
        origH,
        targetW,
        targetH,
        settings.upscaleEngine,
        settings.sharpenLevel,
        outCtx,
        emitProgress
      );
      usedEngine = settings.upscaleEngine;
    } else {
      await runLanczos3Offscreen(
        jobId,
        srcRgba,
        origW,
        origH,
        targetW,
        targetH,
        settings.sharpenLevel,
        bitmap,
        outCtx,
        emitProgress
      );
      usedEngine = 'lanczos3';
      runtimeBackend = 'cpu';
    }

    throwIfJobCancelled(jobId);
    const sharpnessGainPercent = measureOffscreenSharpnessGainPercent(bitmap, outCanvas, outCtx);
    const outMp = (outCanvas.width * outCanvas.height) / 1_000_000;
    emitProgress(
      97,
      outMp >= 40
        ? '초고해상도 파일 인코딩 중... (수 초 소요될 수 있습니다)'
        : '고화질 이미지 포맷 인코딩 중...'
    );

    let encodeSource: OffscreenCanvas = outCanvas;
    if (mimeType === 'image/jpeg') {
      finalCanvas = new OffscreenCanvas(outCanvas.width, outCanvas.height);
      const flatCtx = finalCanvas.getContext('2d');
      if (flatCtx) {
        flatCtx.fillStyle = '#FFFFFF';
        flatCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        flatCtx.drawImage(outCanvas, 0, 0);
        encodeSource = finalCanvas;
      }
    }

    const blob = await encodeSource.convertToBlob({
      type: mimeType,
      quality: settings.quality,
    });
    throwIfJobCancelled(jobId);

    postToMain({
      type: 'done',
      jobId,
      blob,
      width: encodeSource.width,
      height: encodeSource.height,
      size: blob.size,
      wasCappedForMemory,
      usedEngine,
      runtimeBackend,
      sharpnessGainPercent,
    });
  } catch (err: unknown) {
    if (isAbortError(err) || cancelledJobIds.has(jobId)) {
      postToMain({ type: 'aborted', jobId });
    } else {
      const message =
        err instanceof Error ? err.message : '백그라운드 업스케일 처리 중 오류가 발생했습니다.';
      postToMain({ type: 'error', jobId, message });
    }
  } finally {
    if (bitmap) {
      bitmap.close();
    }
    if (srcCanvas) {
      srcCanvas.width = 0;
      srcCanvas.height = 0;
    }
    if (finalCanvas) {
      finalCanvas.width = 0;
      finalCanvas.height = 0;
    }
    if (outCanvas) {
      outCanvas.width = 0;
      outCanvas.height = 0;
    }
    activeFetchControllers.delete(jobId);
    cancelledJobIds.delete(jobId);
  }
}

workerScope.onmessage = (event: MessageEvent<UpscaleWorkerRequest>) => {
  const msg = event.data;
  if (msg.type === 'cancel') {
    cancelledJobIds.add(msg.jobId);
    activeFetchControllers.get(msg.jobId)?.abort();
    return;
  }

  if (msg.type === 'run') {
    jobQueue = jobQueue.then(() => processUpscaleJob(msg));
  }
};
