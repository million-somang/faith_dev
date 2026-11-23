import JSZip from 'jszip';
import {
  FitMode,
  ImageFileItem,
  MAX_ANDROID_LONG_EDGE,
  MAX_ANDROID_PIXELS,
  MAX_DESKTOP_LONG_EDGE,
  MAX_DESKTOP_PIXELS,
  MAX_IOS_LONG_EDGE,
  MAX_IOS_PIXELS,
  ResizeSettings,
  UpscaleEngine,
} from '../types/index';
import { resampleCanvasLanczos3Streamed } from './lanczosResampler';
import { upscaleCanvasWithEsrgan } from './aiUpscaler';

export interface BrowserCanvasLimits {
  readonly maxLongEdge: number;
  readonly maxPixels: number;
  readonly isMobile: boolean;
  readonly deviceLabel: string;
}

export function getBrowserCanvasLimits(): BrowserCanvasLimits {
  if (typeof navigator === 'undefined') {
    return {
      maxLongEdge: MAX_DESKTOP_LONG_EDGE,
      maxPixels: MAX_DESKTOP_PIXELS,
      isMobile: false,
      deviceLabel: 'PC 브라우저',
    };
  }
  const ua = navigator.userAgent || '';
  const isIos =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIos) {
    return {
      maxLongEdge: MAX_IOS_LONG_EDGE,
      maxPixels: MAX_IOS_PIXELS,
      isMobile: true,
      deviceLabel: 'iOS Safari',
    };
  }
  if (/Android/i.test(ua)) {
    return {
      maxLongEdge: MAX_ANDROID_LONG_EDGE,
      maxPixels: MAX_ANDROID_PIXELS,
      isMobile: true,
      deviceLabel: '모바일 Chrome',
    };
  }
  return {
    maxLongEdge: MAX_DESKTOP_LONG_EDGE,
    maxPixels: MAX_DESKTOP_PIXELS,
    isMobile: false,
    deviceLabel: 'PC 브라우저',
  };
}

export interface UpscalePlan {
  readonly targetW: number;
  readonly targetH: number;
  readonly effectiveScale: number;
  readonly pixelMultiplier: number;
  readonly wasCappedForMemory: boolean;
  readonly alreadyExceedsTarget: boolean;
  readonly isTwoStageAi: boolean;
  readonly maxLongEdge: number;
  readonly maxPixels: number;
  readonly deviceLabel: string;
}

/**
 * 업스케일 모드 목표 해상도 및 브라우저 물리 한계 계산
 * - PC: 최대 16,384px / 250MP (원본 사전 축소 및 강제 4K/8K 절삭 없음)
 * - 모바일(iOS/Android): 기기 캔버스 물리 한계 반영
 */
export function calculateUpscalePlan(
  origW: number,
  origH: number,
  settings: Pick<ResizeSettings, 'upscaleEngine' | 'upscaleTarget'>,
  limits: BrowserCanvasLimits = getBrowserCanvasLimits()
): UpscalePlan {
  const safeW = Math.max(1, origW);
  const safeH = Math.max(1, origH);
  const origLong = Math.max(safeW, safeH);

  let rawW = safeW;
  let rawH = safeH;
  let alreadyExceedsTarget = false;

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
        alreadyExceedsTarget = true;
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

  const effectiveScale = Math.max(targetW / safeW, targetH / safeH);
  const pixelMultiplier = (targetW * targetH) / (safeW * safeH);
  const isTwoStageAi = settings.upscaleEngine === 'ai-esrgan' && effectiveScale > 4.05;

  return {
    targetW,
    targetH,
    effectiveScale,
    pixelMultiplier,
    wasCappedForMemory,
    alreadyExceedsTarget,
    isTwoStageAi,
    maxLongEdge: limits.maxLongEdge,
    maxPixels: limits.maxPixels,
    deviceLabel: limits.deviceLabel,
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

export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err && typeof err === 'object' && 'name' in err) {
    return (err as { readonly name: unknown }).name === 'AbortError';
  }
  return false;
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
function createAbortError(): DOMException {
  return new DOMException('작업이 중단되었습니다.', 'AbortError');
}

export async function resizeSingleImage(
  item: ImageFileItem,
  settings: ResizeSettings,
  onProgress?: (percent: number, statusText: string) => void,
  signal?: AbortSignal
): Promise<{
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
  wasCappedForMemory: boolean;
  usedEngine: UpscaleEngine | 'canvas';
}> {
  if (signal?.aborted) throw createAbortError();

  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(item.file);
    const img = new Image();
    img.onload = async () => {
      try {
        if (signal?.aborted) throw createAbortError();

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
              onProgress,
              signal
            );
            outCanvas = aiResult.canvas;
            wasCapped = wasCapped || aiResult.wasCappedForMemory;
            usedEngine = 'ai-esrgan';
          } else {
            outCanvas = await resampleCanvasLanczos3Streamed(
              img,
              plan.targetW,
              plan.targetH,
              settings.sharpenLevel,
              onProgress,
              signal
            );
            usedEngine = 'lanczos3';
          }

          if (signal?.aborted) throw createAbortError();
          const outMp = (outCanvas.width * outCanvas.height) / 1_000_000;
          if (onProgress) {
            onProgress(
              97,
              outMp >= 40
                ? '초고해상도 파일 인코딩 중... (수 초 소요될 수 있습니다)'
                : '고화질 이미지 포맷 인코딩 중...'
            );
          }
          const finalCanvas = flattenTransparentToWhiteIfJpeg(outCanvas, mimeType);
          const blob = await canvasToBlob(finalCanvas, mimeType, settings.quality);
          if (signal?.aborted) throw createAbortError();

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

        if (onProgress) onProgress(18, '이미지 리사이즈 캔버스 구성 중...');
        const { targetW, targetH } = calculateTargetSize(origW, origH, settings);
        let canvas = drawImageToCanvas(img, targetW, targetH, settings.fitMode);
        let blob: Blob;

        if (settings.unit === 'target_kb') {
          if (onProgress) onProgress(42, '목표 용량(KB) 최적 화질 탐색 중...');
          const targetBytes = settings.targetKb * 1024;
          let minQ = 0.1;
          let maxQ = 0.95;
          let bestBlob: Blob | null = null;
          let currentScale = 1.0;

          for (let i = 0; i < 5; i++) {
            if (signal?.aborted) throw createAbortError();
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
            if (onProgress) onProgress(45 + i * 7, '목표 용량(KB) 수렴 계산 중...');
          }

          if (!bestBlob || bestBlob.size > targetBytes) {
            for (let step = 0; step < 4; step++) {
              if (signal?.aborted) throw createAbortError();
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

          if (onProgress) onProgress(95, '목표 용량 파일 인코딩 중...');
          blob =
            bestBlob ||
            (await canvasToBlob(flattenTransparentToWhiteIfJpeg(canvas, mimeType), mimeType, 0.5));
        } else {
          if (onProgress) onProgress(65, '해상도 보간 및 포맷 변환 중...');
          blob = await canvasToBlob(
            flattenTransparentToWhiteIfJpeg(canvas, mimeType),
            mimeType,
            settings.quality
          );
          if (onProgress) onProgress(96, '포맷 인코딩 완료 중...');
        }

        if (signal?.aborted) throw createAbortError();

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

interface SaveFileHandleLike {
  name?: string;
  createWritable(): Promise<WritableFileStreamLike>;
}

interface SaveFilePickerType {
  readonly description: string;
  readonly accept: Readonly<Record<string, readonly string[]>>;
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: readonly SaveFilePickerType[];
    excludeAcceptAllOption?: boolean;
  }) => Promise<SaveFileHandleLike>;
}

export type FilePickerSaveResult =
  | { readonly status: 'saved'; readonly fileName: string }
  | { readonly status: 'cancelled' }
  | { readonly status: 'unsupported' };

/**
 * File System Access API 단일 파일 저장 대화상자(showSaveFilePicker) 지원 여부 확인
 * (showDirectoryPicker와 달리 바탕화면·다운로드·사진·문서 등 일반 폴더에서 시스템 파일 차단 오류가 발생하지 않음)
 */
export function supportsSaveFilePicker(): boolean {
  if (typeof window === 'undefined') return false;
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker;
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

function buildSavePickerTypes(filename: string, mimeType: string): SaveFilePickerType[] {
  const lower = filename.toLowerCase();
  if (mimeType === 'application/zip' || lower.endsWith('.zip')) {
    return [{ description: 'ZIP 압축 파일', accept: { 'application/zip': ['.zip'] } }];
  }
  if (mimeType === 'image/png' || lower.endsWith('.png')) {
    return [{ description: 'PNG 이미지', accept: { 'image/png': ['.png'] } }];
  }
  if (mimeType === 'image/webp' || lower.endsWith('.webp')) {
    return [{ description: 'WebP 이미지', accept: { 'image/webp': ['.webp'] } }];
  }
  return [{ description: 'JPEG 이미지', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }];
}

export function downloadBlobDirectly(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * OS 네이티브 "다른 이름으로 저장" 대화상자로 단일 파일(이미지 또는 ZIP) 저장
 * - 바탕화면·다운로드·사진·문서 등 어느 폴더를 선택해도 보안 차단 없이 저장됨
 */
export async function saveBlobWithFilePicker(
  blob: Blob,
  suggestedName: string,
  mimeType: string
): Promise<FilePickerSaveResult> {
  if (!supportsSaveFilePicker()) return { status: 'unsupported' };
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker;
  if (!picker) return { status: 'unsupported' };

  let fileHandle: SaveFileHandleLike;
  try {
    fileHandle = await picker({
      suggestedName,
      types: buildSavePickerTypes(suggestedName, mimeType),
    });
  } catch (err: unknown) {
    const errName =
      err && typeof err === 'object' && 'name' in err
        ? String((err as { name: unknown }).name)
        : '';
    if (errName === 'AbortError' || errName === 'NotAllowedError') {
      return { status: 'cancelled' };
    }
    if (errName === 'SecurityError') {
      return { status: 'unsupported' };
    }
    throw err;
  }

  const writable = await fileHandle.createWritable();
  try {
    await writable.write(blob);
  } finally {
    await writable.close();
  }

  return {
    status: 'saved',
    fileName: fileHandle.name || suggestedName,
  };
}

export function getZipArchiveFilename(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `veranex_resized_${dateStr}.zip`;
}

/**
 * 변환된 이미지들을 단일 ZIP 파일 1개로 즉시 다운로드
 */
export async function downloadAllAsSingleZip(
  items: ImageFileItem[],
  settings: ResizeSettings,
  onProgress?: (percent: number) => void
): Promise<number> {
  const validItems = items.filter((item) => item.status === 'done' && item.resizedBlob);
  if (validItems.length === 0) return 0;

  const zipBlob = await createZipArchive(validItems, settings, onProgress);
  downloadBlobDirectly(zipBlob, getZipArchiveFilename());
  return validItems.length;
}

/**
 * 변환된 이미지들을 압축 없이 1장씩 순차 다운로드
 */
export async function downloadAllIndividually(
  items: ImageFileItem[],
  settings: ResizeSettings,
  onProgress?: (saved: number, total: number) => void
): Promise<number> {
  const validItems = items.filter((item) => item.status === 'done' && item.resizedBlob);
  if (validItems.length === 0) return 0;

  const usedNames = new Set<string>();
  for (let i = 0; i < validItems.length; i += 1) {
    const item = validItems[i];
    if (!item?.resizedBlob) continue;
    const filename = makeUniqueFilename(getOutputFilename(item.name, settings), usedNames);
    downloadBlobDirectly(item.resizedBlob, filename);
    if (onProgress) onProgress(i + 1, validItems.length);
    if (i < validItems.length - 1) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 180));
    }
  }
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
