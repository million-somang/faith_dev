import JSZip from 'jszip';
import {
  FitMode,
  ImageFileItem,
  MAX_AI_LONG_EDGE,
  MAX_LANCZOS_LONG_EDGE,
  ResizeSettings,
  SharpenLevel,
  UpscaleEngine,
} from '../types/index';
import type {
  LanczosWorkerRequest,
  LanczosWorkerResponse,
} from '../workers/lanczosUpscaler.worker';
import { applyAdaptiveUnsharpMask, resampleImageDataLanczos3 } from './lanczosResampler';
import { upscaleCanvasWithEsrgan } from './aiUpscaler';

export interface UpscalePlan {
  readonly targetW: number;
  readonly targetH: number;
  readonly effectiveScale: number;
  readonly wasCappedForMemory: boolean;
  readonly maxLongEdge: number;
}

/**
 * 업스케일 모드 목표 해상도 및 브라우저 메모리 안전 상한(AI 4K / Lanczos 8K) 계산
 */
export function calculateUpscalePlan(
  origW: number,
  origH: number,
  settings: Pick<ResizeSettings, 'upscaleEngine' | 'upscaleTarget'>
): UpscalePlan {
  const safeW = Math.max(1, origW);
  const safeH = Math.max(1, origH);
  const origLong = Math.max(safeW, safeH);
  const maxLongEdge =
    settings.upscaleEngine === 'ai-esrgan' ? MAX_AI_LONG_EDGE : MAX_LANCZOS_LONG_EDGE;

  let rawW = safeW;
  let rawH = safeH;

  switch (settings.upscaleTarget) {
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
    case 'fhd': {
      const targetLong = Math.max(origLong, 1920);
      const ratio = targetLong / origLong;
      rawW = Math.round(safeW * ratio);
      rawH = Math.round(safeH * ratio);
      break;
    }
    case '4k': {
      const targetLong = Math.max(origLong, 3840);
      const ratio = targetLong / origLong;
      rawW = Math.round(safeW * ratio);
      rawH = Math.round(safeH * ratio);
      break;
    }
  }

  let targetW = Math.max(1, rawW);
  let targetH = Math.max(1, rawH);
  let wasCappedForMemory = false;

  const targetLong = Math.max(targetW, targetH);
  if (targetLong > maxLongEdge) {
    const capRatio = maxLongEdge / targetLong;
    targetW = Math.max(1, Math.round(targetW * capRatio));
    targetH = Math.max(1, Math.round(targetH * capRatio));
    wasCappedForMemory = true;
  }

  return {
    targetW,
    targetH,
    effectiveScale: Math.max(targetW / safeW, targetH / safeH),
    wasCappedForMemory,
    maxLongEdge,
  };
}

/**
 * 이미지 파일의 너비, 높이 및 프리뷰 URL 획득
 */
export function loadImageDimensions(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        previewUrl,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error('이미지를 읽을 수 없습니다. 지원되지 않는 포맷이거나 파일이 손상되었습니다.'));
    };
    img.src = previewUrl;
  });
}

/**
 * 목표 리사이즈 치수 계산
 */
export function calculateTargetSize(
  origW: number,
  origH: number,
  settings: ResizeSettings
): { targetW: number; targetH: number } {
  let targetW = settings.width;
  let targetH = settings.height;

  switch (settings.unit) {
    case 'upscale': {
      const plan = calculateUpscalePlan(origW, origH, settings);
      targetW = plan.targetW;
      targetH = plan.targetH;
      break;
    }

    case 'pixel':
      targetW = Math.max(1, Math.round(settings.width));
      targetH = Math.max(1, Math.round(settings.height));
      break;

    case 'percent': {
      const scale = Math.max(1, settings.percent) / 100;
      targetW = Math.max(1, Math.round(origW * scale));
      targetH = Math.max(1, Math.round(origH * scale));
      break;
    }

    case 'longest': {
      const longest = Math.max(1, settings.longestSide);
      if (origW >= origH) {
        targetW = longest;
        targetH = Math.max(1, Math.round((origH * longest) / origW));
      } else {
        targetH = longest;
        targetW = Math.max(1, Math.round((origW * longest) / origH));
      }
      break;
    }

    case 'target_kb':
      // 기본적으로 원본 해상도에서 시작 (이후 용량 최적화 루프에서 조정)
      targetW = origW;
      targetH = origH;
      break;
  }

  // 원본보다 크게 확대 금지 옵션 체크
  if (settings.preventUpscale && (settings.unit === 'pixel' || settings.unit === 'longest')) {
    if (targetW > origW && targetH > origH) {
      targetW = origW;
      targetH = origH;
    }
  }

  return { targetW, targetH };
}

/**
 * 캔버스에 이미지를 맞춤 방식(Cover, Contain, Stretch)으로 렌더링
 */
function drawImageToCanvas(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  fitMode: FitMode
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D Context를 초기화할 수 없습니다.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (fitMode === 'stretch') {
    ctx.drawImage(img, 0, 0, origW, origH, 0, 0, targetW, targetH);
  } else if (fitMode === 'cover') {
    const scale = Math.max(targetW / origW, targetH / origH);
    const srcW = targetW / scale;
    const srcH = targetH / scale;
    const srcX = (origW - srcW) / 2;
    const srcY = (origH - srcH) / 2;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);
  } else {
    // contain: 비율 유지하고 영역 내에 온전히 포함
    const scale = Math.min(targetW / origW, targetH / origH);
    const destW = Math.round(origW * scale);
    const destH = Math.round(origH * scale);
    const destX = Math.round((targetW - destW) / 2);
    const destY = Math.round((targetH - destH) / 2);

    // 투명 배경 유지
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, origW, origH, destX, destY, destW, destH);
  }

  return canvas;
}

/**
 * 캔버스를 지정된 포맷과 품질의 Blob으로 변환
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob 변환에 실패했습니다.'));
      },
      mimeType,
      quality
    );
  });
}

interface PendingWorkerJob {
  resolve: (data: { buffer: ArrayBuffer; width: number; height: number }) => void;
  reject: (err: Error) => void;
  onProgress?: (percent: number, statusText: string) => void;
}

let lanczosWorker: Worker | null = null;
let workerJobSeq = 0;
const pendingWorkerJobs = new Map<number, PendingWorkerJob>();

function getOrCreateLanczosWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!lanczosWorker) {
    try {
      lanczosWorker = new Worker(
        new URL('../workers/lanczosUpscaler.worker.ts', import.meta.url),
        { type: 'module' }
      );
      lanczosWorker.onmessage = (event: MessageEvent<LanczosWorkerResponse>) => {
        const msg = event.data;
        const job = pendingWorkerJobs.get(msg.id);
        if (!job) return;
        if (msg.type === 'progress') {
          if (job.onProgress) {
            job.onProgress(msg.percent, `Lanczos-3 정밀 보간 중 (${msg.percent}%)`);
          }
          return;
        }
        pendingWorkerJobs.delete(msg.id);
        if (msg.type === 'done') {
          job.resolve({ buffer: msg.buffer, width: msg.width, height: msg.height });
        } else {
          job.reject(new Error(msg.message));
        }
      };
      lanczosWorker.onerror = () => {
        for (const [id, job] of pendingWorkerJobs.entries()) {
          pendingWorkerJobs.delete(id);
          job.reject(new Error('Web Worker 실행 중 오류가 발생했습니다.'));
        }
        lanczosWorker?.terminate();
        lanczosWorker = null;
      };
    } catch {
      return null;
    }
  }
  return lanczosWorker;
}

async function upscaleCanvasWithLanczos(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  sharpenLevel: SharpenLevel,
  onProgress?: (percent: number, statusText: string) => void
): Promise<HTMLCanvasElement> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('원본 캔버스 컨텍스트를 생성할 수 없습니다.');
  srcCtx.drawImage(img, 0, 0, origW, origH);
  const srcImgData = srcCtx.getImageData(0, 0, origW, origH);

  let outPixels: Uint8ClampedArray;
  const worker = getOrCreateLanczosWorker();

  if (worker) {
    try {
      if (onProgress) onProgress(10, '초고속 Lanczos-3 워커 시작...');
      const jobId = ++workerJobSeq;
      const transferCopy = new Uint8ClampedArray(srcImgData.data);
      const result = await new Promise<{ buffer: ArrayBuffer; width: number; height: number }>(
        (resolve, reject) => {
          pendingWorkerJobs.set(jobId, { resolve, reject, onProgress });
          const payload: LanczosWorkerRequest = {
            id: jobId,
            buffer: transferCopy.buffer,
            srcW: origW,
            srcH: origH,
            dstW: targetW,
            dstH: targetH,
            sharpenLevel,
          };
          worker.postMessage(payload, [payload.buffer]);
        }
      );
      outPixels = new Uint8ClampedArray(result.buffer);
    } catch {
      const resampled = resampleImageDataLanczos3(
        srcImgData.data,
        origW,
        origH,
        targetW,
        targetH,
        (pct) => {
          if (onProgress) onProgress(pct, `Lanczos-3 정밀 보간 중 (${pct}%)`);
        }
      );
      outPixels = applyAdaptiveUnsharpMask(resampled, targetW, targetH, sharpenLevel);
    }
  } else {
    const resampled = resampleImageDataLanczos3(
      srcImgData.data,
      origW,
      origH,
      targetW,
      targetH,
      (pct) => {
        if (onProgress) onProgress(pct, `Lanczos-3 정밀 보간 중 (${pct}%)`);
      }
    );
    outPixels = applyAdaptiveUnsharpMask(resampled, targetW, targetH, sharpenLevel);
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('출력 캔버스 컨텍스트를 생성할 수 없습니다.');
  outCtx.putImageData(new ImageData(new Uint8ClampedArray(outPixels), targetW, targetH), 0, 0);
  return outCanvas;
}

function flattenTransparentToWhiteIfJpeg(
  canvas: HTMLCanvasElement,
  mimeType: string
): HTMLCanvasElement {
  if (mimeType !== 'image/jpeg') return canvas;
  const flattened = document.createElement('canvas');
  flattened.width = canvas.width;
  flattened.height = canvas.height;
  const ctx = flattened.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, flattened.width, flattened.height);
  ctx.drawImage(canvas, 0, 0);
  return flattened;
}

/**
 * 개별 이미지 리사이징 및 CSR 업스케일 실행
 */
export async function resizeSingleImage(
  item: ImageFileItem,
  settings: ResizeSettings,
  onProgress?: (percent: number, statusText: string) => void
): Promise<{
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
  wasCappedForMemory: boolean;
  usedEngine: UpscaleEngine | 'canvas';
}> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(item.file);
    const img = new Image();
    img.onload = async () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // 출력 MIME 타입 결정
        let mimeType = item.file.type || 'image/jpeg';
        if (settings.format !== 'original') {
          mimeType = settings.format;
        }

        if (settings.unit === 'upscale') {
          const plan = calculateUpscalePlan(origW, origH, settings);
          let outCanvas: HTMLCanvasElement;
          let wasCapped = plan.wasCappedForMemory;
          let usedEngine: UpscaleEngine = settings.upscaleEngine;

          if (settings.upscaleEngine === 'ai-esrgan') {
            const aiResult = await upscaleCanvasWithEsrgan(
              img,
              plan.targetW,
              plan.targetH,
              settings.sharpenLevel,
              onProgress
            );
            outCanvas = aiResult.canvas;
            wasCapped = wasCapped || aiResult.wasCappedForMemory;
            usedEngine = 'ai-esrgan';
          } else {
            outCanvas = await upscaleCanvasWithLanczos(
              img,
              plan.targetW,
              plan.targetH,
              settings.sharpenLevel,
              onProgress
            );
            usedEngine = 'lanczos3';
          }

          const finalCanvas = flattenTransparentToWhiteIfJpeg(outCanvas, mimeType);
          const blob = await canvasToBlob(finalCanvas, mimeType, settings.quality);
          URL.revokeObjectURL(sourceUrl);
          const url = URL.createObjectURL(blob);
          resolve({
            blob,
            url,
            width: finalCanvas.width,
            height: finalCanvas.height,
            size: blob.size,
            wasCappedForMemory: wasCapped,
            usedEngine,
          });
          return;
        }

        const { targetW, targetH } = calculateTargetSize(origW, origH, settings);
        let canvas = drawImageToCanvas(img, targetW, targetH, settings.fitMode);
        let blob: Blob;

        if (settings.unit === 'target_kb') {
          const targetBytes = settings.targetKb * 1024;
          let minQ = 0.1;
          let maxQ = 0.95;
          let bestBlob: Blob | null = null;
          let currentScale = 1.0;

          for (let i = 0; i < 5; i++) {
            const midQ = (minQ + maxQ) / 2;
            const testBlob = await canvasToBlob(
              flattenTransparentToWhiteIfJpeg(canvas, mimeType),
              mimeType,
              midQ
            );
            if (testBlob.size <= targetBytes) {
              bestBlob = testBlob;
              minQ = midQ;
            } else {
              maxQ = midQ;
            }
          }

          if (!bestBlob || bestBlob.size > targetBytes) {
            for (let step = 0; step < 4; step++) {
              currentScale *= 0.75;
              const scaledW = Math.max(100, Math.round(targetW * currentScale));
              const scaledH = Math.max(100, Math.round(targetH * currentScale));
              canvas = drawImageToCanvas(img, scaledW, scaledH, settings.fitMode);
              const testBlob = await canvasToBlob(
                flattenTransparentToWhiteIfJpeg(canvas, mimeType),
                mimeType,
                0.75
              );
              bestBlob = testBlob;
              if (testBlob.size <= targetBytes) break;
            }
          }

          blob =
            bestBlob ||
            (await canvasToBlob(flattenTransparentToWhiteIfJpeg(canvas, mimeType), mimeType, 0.5));
        } else {
          blob = await canvasToBlob(
            flattenTransparentToWhiteIfJpeg(canvas, mimeType),
            mimeType,
            settings.quality
          );
        }

        URL.revokeObjectURL(sourceUrl);
        const url = URL.createObjectURL(blob);
        resolve({
          blob,
          url,
          width: canvas.width,
          height: canvas.height,
          size: blob.size,
          wasCappedForMemory: false,
          usedEngine: 'canvas',
        });
      } catch (err) {
        URL.revokeObjectURL(sourceUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error('이미지 소스를 로드하지 못했습니다.'));
    };
    img.src = sourceUrl;
  });
}

/**
 * 다운로드 파일명 생성
 */
export function getOutputFilename(originalName: string, settings: ResizeSettings): string {
  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  let ext = lastDot > 0 ? originalName.slice(lastDot + 1).toLowerCase() : 'png';

  if (settings.format === 'image/webp') ext = 'webp';
  else if (settings.format === 'image/jpeg') ext = 'jpg';
  else if (settings.format === 'image/png') ext = 'png';

  const defaultSuffix =
    settings.unit === 'upscale' ? `_upscaled_${settings.upscaleTarget}` : '_resized';
  const suffix =
    settings.filenameSuffix && settings.filenameSuffix !== '_resized'
      ? settings.filenameSuffix
      : defaultSuffix;
  return `${baseName}${suffix}.${ext}`;
}

/**
 * JSZip을 이용한 일괄 ZIP 파일 압축 생성
 */
export async function createZipArchive(
  items: ImageFileItem[],
  settings: ResizeSettings,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('resized_images') || zip;

  const validItems = items.filter((item) => item.status === 'done' && item.resizedBlob);
  validItems.forEach((item, index) => {
    if (item.resizedBlob) {
      const filename = getOutputFilename(item.name, settings);
      // 중복 방지 인덱싱
      const safeFilename = index > 0 && validItems.some((v, vi) => vi < index && v.name === item.name)
        ? `${index + 1}_${filename}`
        : filename;
      folder.file(safeFilename, item.resizedBlob);
    }
  });

  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) onProgress(Math.round(metadata.percent));
    }
  );
}

interface WritableFileStreamLike {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

interface FileHandleLike {
  createWritable(): Promise<WritableFileStreamLike>;
}

interface DirectoryHandleLike {
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: 'desktop' | 'documents' | 'downloads' | 'pictures';
  }) => Promise<DirectoryHandleLike>;
}

export type DirectorySaveResult =
  | { status: 'saved'; folderName: string; count: number }
  | { status: 'cancelled' }
  | { status: 'unsupported' };

/**
 * File System Access API(폴더 1회 선택 일괄 저장) 지원 여부 확인
 */
export function supportsDirectoryPicker(): boolean {
  if (typeof window === 'undefined') return false;
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  return Boolean(window.isSecureContext && typeof picker === 'function');
}

function makeUniqueFilename(rawName: string, used: Set<string>): string {
  if (!used.has(rawName)) {
    used.add(rawName);
    return rawName;
  }
  const dotIdx = rawName.lastIndexOf('.');
  const base = dotIdx > 0 ? rawName.slice(0, dotIdx) : rawName;
  const ext = dotIdx > 0 ? rawName.slice(dotIdx) : '';
  let counter = 2;
  let candidate = `${base}_${counter}${ext}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${base}_${counter}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

/**
 * 사용자가 선택한 폴더 1곳에 변환된 모든 이미지를 한꺼번에 저장
 */
export async function saveAllToSingleDirectory(
  items: ImageFileItem[],
  settings: ResizeSettings,
  onProgress?: (saved: number, total: number) => void
): Promise<DirectorySaveResult> {
  const validItems = items.filter((item) => item.status === 'done' && item.resizedBlob);
  if (validItems.length === 0) return { status: 'cancelled' };
  if (!supportsDirectoryPicker()) return { status: 'unsupported' };

  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) return { status: 'unsupported' };

  let dirHandle: DirectoryHandleLike;
  try {
    dirHandle = await picker({
      id: 'veranex-image-resizer',
      mode: 'readwrite',
      startIn: 'pictures',
    });
  } catch (err: unknown) {
    const errName = err && typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : '';
    if (errName === 'AbortError' || errName === 'NotAllowedError') {
      return { status: 'cancelled' };
    }
    if (errName === 'SecurityError') {
      return { status: 'unsupported' };
    }
    throw err;
  }

  const usedNames = new Set<string>();
  for (let i = 0; i < validItems.length; i += 1) {
    const item = validItems[i];
    if (!item?.resizedBlob) continue;
    const rawFilename = getOutputFilename(item.name, settings);
    const filename = makeUniqueFilename(rawFilename, usedNames);
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(item.resizedBlob);
    } finally {
      await writable.close();
    }
    if (onProgress) onProgress(i + 1, validItems.length);
  }

  return {
    status: 'saved',
    folderName: dirHandle.name || '선택한 폴더',
    count: validItems.length,
  };
}

/**
 * 폴더 선택 미지원 환경 또는 사용자 요청 시 단일 ZIP 파일 1개로 저장
 */
export async function downloadAllAsSingleZip(
  items: ImageFileItem[],
  settings: ResizeSettings,
  onProgress?: (percent: number) => void
): Promise<number> {
  const validItems = items.filter((item) => item.status === 'done' && item.resizedBlob);
  if (validItems.length === 0) return 0;

  const zipBlob = await createZipArchive(validItems, settings, onProgress);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const zipName = `veranex_resized_${dateStr}.zip`;
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return validItems.length;
}

/**
 * 바이트 단위를 사람이 읽기 쉬운 문자열로 변환 (예: 1.25 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * 원클릭 업스케일 체감 테스트용 저해상도(320×180) 디테일 샘플 이미지 생성
 */
export function createSampleImageFile(): File {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 320, 180);
  grad.addColorStop(0, '#1E1B4B');
  grad.addColorStop(0.5, '#4338CA');
  grad.addColorStop(1, '#6366F1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 320, 180);

  // 정밀 격자 & 곡선 디테일
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 320; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 180);
    ctx.stroke();
  }
  for (let y = 0; y <= 180; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(320, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(62, 52, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(266, 134, 48, 0, Math.PI * 2);
  ctx.fill();

  // 선명한 대각선 엣지 검증 링
  ctx.strokeStyle = '#A5B4FC';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(62, 52, 18, 0, Math.PI * 2);
  ctx.stroke();

  // 타이포그래피
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VeraNex AI Upscale Test', 160, 82);

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#FCD34D';
  ctx.fillText('320 × 180 Low-Res Original', 160, 108);

  ctx.font = '10px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('2x / 4x Super Resolution Sample', 160, 128);

  const dataUrl = canvas.toDataURL('image/png');
  const arr = dataUrl.split(',');
  const mime = arr[0]!.match(/:(.*?);/)![1];
  const bstr = atob(arr[1]!);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  return new File([blob], 'sample_veranex_320x180.png', { type: 'image/png' });
}
