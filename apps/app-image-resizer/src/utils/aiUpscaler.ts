import type * as OrtTypes from 'onnxruntime-web';
import type { AiModelEngine, RuntimeBackend, SharpenLevel } from '../types/index';
import {
  applyAdaptiveUnsharpMask,
  getAdaptiveUnsharpRadius,
  resampleTileSubregionLanczos3,
} from './lanczosResampler';

interface ModelSpec {
  readonly fileName: string;
  readonly expectedBytes: number;
  readonly sizeLabel: string;
  readonly label: string;
  readonly isFp16: boolean;
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

export interface WebGpuCapabilities {
  readonly hasWebGpu: boolean;
  readonly hasShaderF16: boolean;
}

interface GpuAdapterLike {
  readonly features?: {
    has(feature: string): boolean;
  };
}

interface NavigatorWithGpu extends Navigator {
  readonly gpu?: {
    requestAdapter(): Promise<GpuAdapterLike | null>;
  };
}

interface OrtSessionBundle {
  readonly session: OrtTypes.InferenceSession;
  readonly backend: RuntimeBackend;
}

export interface RealEsrganResultCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly wasCappedForMemory: boolean;
  readonly runtimeBackend: RuntimeBackend;
}

let capabilitiesPromise: Promise<WebGpuCapabilities> | null = null;
const sessionCache = new Map<AiModelEngine, Promise<OrtSessionBundle>>();
let ortModulePromise: Promise<typeof OrtTypes> | null = null;

function getNormalizedBaseUrl(): string {
  const baseUrl = import.meta.env.BASE_URL || '/app/image-resizer/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function getModelUrl(engine: AiModelEngine): string {
  return `${getNormalizedBaseUrl()}models/${MODEL_REGISTRY[engine].fileName}`;
}

function getOrtWasmBasePath(): string {
  return `${getNormalizedBaseUrl()}ort-wasm/`;
}

export function getModelDisplayInfo(engine: AiModelEngine): ModelSpec {
  return MODEL_REGISTRY[engine];
}

export async function detectWebGpuCapabilities(): Promise<WebGpuCapabilities> {
  if (!capabilitiesPromise) {
    capabilitiesPromise = (async () => {
      if (typeof navigator === 'undefined') {
        return { hasWebGpu: false, hasShaderF16: false };
      }
      const gpuNav = navigator as NavigatorWithGpu;
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

export async function getCachedModelStatus(): Promise<Record<AiModelEngine, boolean>> {
  const result: Record<AiModelEngine, boolean> = {
    'ai-realesrgan-v3': false,
    'ai-realesrgan-x4plus': false,
  };
  if (typeof window === 'undefined' || !('caches' in window)) {
    return result;
  }
  try {
    const cache = await window.caches.open(MODEL_CACHE_NAME);
    const engines: readonly AiModelEngine[] = ['ai-realesrgan-v3', 'ai-realesrgan-x4plus'];
    for (const engine of engines) {
      const matched = await cache.match(getModelUrl(engine));
      if (matched) {
        const lenHeader = Number(matched.headers.get('content-length') || '0');
        result[engine] = lenHeader === MODEL_REGISTRY[engine].expectedBytes || lenHeader === 0;
      }
    }
  } catch {
    return result;
  }
  return result;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('작업이 중단되었습니다.', 'AbortError');
  }
}

async function yieldUiFrame(): Promise<void> {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
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

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function isValidOnnxPayload(bytes: Uint8Array, expectedBytes: number): boolean {
  if (bytes.byteLength < Math.floor(expectedBytes * 0.99)) {
    return false;
  }
  // HTML 에러 페이지('<') 응답 차단
  if (bytes.byteLength > 0 && bytes[0] === 0x3c) {
    return false;
  }
  return true;
}

async function readModelFromCache(
  url: string,
  expectedBytes: number
): Promise<Uint8Array | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await window.caches.open(MODEL_CACHE_NAME);
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
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await window.caches.open(MODEL_CACHE_NAME);
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
    // 브라우저 저장 공간 부족·사생활 보호 모드에서는 캐시 쓰기만 건너뛰고 정상 실행
  }
}

async function loadModelBytes(
  engine: AiModelEngine,
  onProgress?: (percent: number, statusText: string) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  throwIfAborted(signal);
  const spec = MODEL_REGISTRY[engine];
  const url = getModelUrl(engine);

  const cached = await readModelFromCache(url, spec.expectedBytes);
  throwIfAborted(signal);
  if (cached) {
    onProgress?.(10, `${spec.label} 모델 캐시 로드 완료 (${spec.sizeLabel})`);
    return cached;
  }

  onProgress?.(4, `${spec.label} 모델 다운로드 중... (0.0 / ${spec.sizeLabel})`);
  const res = await fetch(url, { signal, credentials: 'same-origin' });
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
      throwIfAborted(signal);
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        chunks.push(value);
        received += value.byteLength;
        const frac = Math.min(1, received / totalBytes);
        const pct = 4 + Math.round(frac * 10);
        onProgress?.(
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

  throwIfAborted(signal);
  if (!isValidOnnxPayload(merged, spec.expectedBytes)) {
    throw new Error(`${spec.label} 모델 파일 무결성 검증에 실패했습니다.`);
  }

  await writeModelToCache(url, merged);
  onProgress?.(14, `${spec.label} 모델 다운로드 및 캐시 저장 완료`);
  return merged;
}

async function getOrCreateSession(
  engine: AiModelEngine,
  onProgress?: (percent: number, statusText: string) => void,
  signal?: AbortSignal
): Promise<OrtSessionBundle> {
  const existing = sessionCache.get(engine);
  if (existing) {
    onProgress?.(14, `${MODEL_REGISTRY[engine].label} AI 세션 준비 중...`);
    return existing;
  }

  const spec = MODEL_REGISTRY[engine];
  const creationPromise = (async (): Promise<OrtSessionBundle> => {
    const [ort, caps, modelBytes] = await Promise.all([
      loadOrtModule(),
      detectWebGpuCapabilities(),
      loadModelBytes(engine, onProgress, signal),
    ]);
    throwIfAborted(signal);

    const canTryWebGpu = spec.isFp16 ? caps.hasWebGpu && caps.hasShaderF16 : caps.hasWebGpu;
    if (canTryWebGpu) {
      onProgress?.(15, `${spec.label} WebGPU GPU 세션 컴파일 중...`);
      try {
        const session = await ort.InferenceSession.create(modelBytes, {
          executionProviders: ['webgpu'],
        });
        return { session, backend: 'webgpu' };
      } catch (err: unknown) {
        console.warn('[Real-ESRGAN] WebGPU 초기화 실패, WASM으로 전환:', err);
      }
    }

    onProgress?.(15, `${spec.label} WASM CPU 세션 초기화 중...`);
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

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.round(value);
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
  ort: typeof OrtTypes,
  session: OrtTypes.InferenceSession,
  nchwInput: Float32Array,
  signal?: AbortSignal
): Promise<Uint8ClampedArray> {
  throwIfAborted(signal);
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
    throwIfAborted(signal);

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

/**
 * 100% 브라우저 로컬 Real-ESRGAN (ONNX Runtime Web) 타일 스트리밍 화질 복원 · 업스케일링
 * - v3 (4.6MB) / x4plus FP16 (32.2MB) 모두 네이티브 4× 초해상도 추론
 * - 128×128 고정 입력(코어 108×108 + 경계 패딩 10px)으로 WebGPU 셰이더 1회 컴파일 & 이음매 방지
 * - 1×/2×/3×/FHD/4K/8K/6×/8×는 4× 신경망 복원 결과를 Lanczos-3 + 배율 비례 선명화로 목표 크기에 맞춤
 */
export async function upscaleCanvasWithRealEsrgan(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  engine: AiModelEngine,
  sharpenLevel: SharpenLevel,
  onProgress?: (percent: number, statusText: string) => void,
  signal?: AbortSignal
): Promise<RealEsrganResultCanvas> {
  throwIfAborted(signal);

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  if (origW <= 0 || origH <= 0 || targetW <= 0 || targetH <= 0) {
    throw new Error('유효하지 않은 이미지 해상도입니다.');
  }

  const spec = MODEL_REGISTRY[engine];
  onProgress?.(2, `${spec.label} 추론 엔진 준비 중...`);

  const [ort, bundle] = await Promise.all([
    loadOrtModule(),
    getOrCreateSession(engine, onProgress, signal),
  ]);
  throwIfAborted(signal);

  const backendTag = bundle.backend === 'webgpu' ? 'WebGPU GPU' : 'WASM CPU';
  onProgress?.(16, `원본 픽셀 분석 및 타일 그리드 구성 (${backendTag})`);

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('원본 캔버스 컨텍스트 초기화에 실패했습니다.');
  srcCtx.drawImage(img, 0, 0, origW, origH);
  const srcRgba = srcCtx.getImageData(0, 0, origW, origH).data;
  const hasAlpha = hasTransparentPixels(srcRgba);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('출력 캔버스 컨텍스트 초기화에 실패했습니다.');

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
      throwIfAborted(signal);

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
      onProgress?.(
        Math.min(94, pctBefore),
        `${spec.label} 화질 복원 중 (${backendTag}) · 타일 ${tileNumber}/${totalTiles}`
      );

      buildPaddedTileNchw(srcRgba, origW, origH, srcPadX0, srcPadY0, hasAlpha, nchwBuffer);
      const tileAiRgba = await runRealEsrganTile(ort, bundle.session, nchwBuffer, signal);

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
      await yieldUiFrame();
    }
  }

  onProgress?.(95, 'AI 복원 및 해상도 정밀 합성 완료');
  return {
    canvas: outCanvas,
    wasCappedForMemory: false,
    runtimeBackend: bundle.backend,
  };
}
