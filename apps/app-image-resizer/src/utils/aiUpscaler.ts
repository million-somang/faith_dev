import type { Tensor3D } from '@tensorflow/tfjs';
import type Upscaler from 'upscaler';
import { MAX_AI_LONG_EDGE, type SharpenLevel } from '../types/index';
import {
  applyAdaptiveUnsharpMask,
  resampleImageDataLanczos3,
} from './lanczosResampler';

type EsrganScale = 2 | 3 | 4;

interface UpscalerResultCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly wasCappedForMemory: boolean;
}

const upscalerCache = new Map<EsrganScale, Promise<Upscaler>>();
let tfReadyPromise: Promise<typeof import('@tensorflow/tfjs')> | null = null;

async function ensureTfReady(): Promise<typeof import('@tensorflow/tfjs')> {
  if (!tfReadyPromise) {
    tfReadyPromise = (async () => {
      const tf = await import('@tensorflow/tfjs');
      try {
        await tf.ready();
        if (tf.getBackend() !== 'webgl') {
          try {
            await tf.setBackend('webgl');
            await tf.ready();
          } catch {
            await tf.setBackend('cpu');
            await tf.ready();
          }
        }
      } catch {
        await tf.setBackend('cpu');
        await tf.ready();
      }
      return tf;
    })();
  }
  return tfReadyPromise;
}

async function loadBaseModelDef(scale: EsrganScale) {
  if (scale === 2) {
    return (await import('@upscalerjs/esrgan-slim/2x')).default;
  }
  if (scale === 3) {
    return (await import('@upscalerjs/esrgan-slim/3x')).default;
  }
  return (await import('@upscalerjs/esrgan-slim/4x')).default;
}

function getSelfHostedModelPath(scale: EsrganScale): string {
  const baseUrl = import.meta.env.BASE_URL || '/app/image-resizer/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}models/esrgan-slim/x${scale}/model.json`;
}

async function getUpscalerInstance(scale: EsrganScale): Promise<Upscaler> {
  const cached = upscalerCache.get(scale);
  if (cached) return cached;

  const loaderPromise = (async () => {
    await ensureTfReady();
    const [{ default: UpscalerCtor }, baseModelDef] = await Promise.all([
      import('upscaler'),
      loadBaseModelDef(scale),
    ]);

    return new UpscalerCtor({
      model: {
        ...baseModelDef,
        path: getSelfHostedModelPath(scale),
      },
    });
  })().catch((err: unknown) => {
    upscalerCache.delete(scale);
    throw err;
  });

  upscalerCache.set(scale, loaderPromise);
  return loaderPromise;
}

function canvasFromRgba(rgba: Uint8ClampedArray, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D Context를 생성할 수 없습니다.');
  const imgData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function hasTransparentPixels(rgba: Uint8ClampedArray): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i]! < 255) return true;
  }
  return false;
}

export function selectEsrganScaleForRatio(ratio: number): EsrganScale {
  if (ratio <= 2.15) return 2;
  if (ratio <= 3.15) return 3;
  return 4;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('작업이 중단되었습니다.', 'AbortError');
  }
}

/**
 * 100% 브라우저 CSR AI(ESRGAN-Slim) 초해상도 업스케일링
 * - 지연 로딩 + 동일 출처 가중치 캐시
 * - 타일 분할(Patch 64px) 실시간 진행률 보고 + AbortSignal 즉시 중단
 * - 최대 4K(4096px) 안전 상한 및 투명 PNG/WebP 알파 채널 보존
 */
export async function upscaleCanvasWithEsrgan(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  sharpenLevel: SharpenLevel,
  onProgress?: (percent: number, statusText: string) => void,
  signal?: AbortSignal
): Promise<UpscalerResultCanvas> {
  throwIfAborted(signal);

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const desiredRatio = Math.max(targetW / origW, targetH / origH);
  const modelScale = selectEsrganScaleForRatio(desiredRatio);

  // AI 출력 기준 최대 4K(4096px) 메모리 보호 상한 계산
  const aiInputMaxLong = Math.max(16, Math.floor(MAX_AI_LONG_EDGE / modelScale));
  const origLong = Math.max(origW, origH);
  let wasCapped = false;
  let aiInW = origW;
  let aiInH = origH;

  if (origLong > aiInputMaxLong) {
    const capScale = aiInputMaxLong / origLong;
    aiInW = Math.max(16, Math.round(origW * capScale));
    aiInH = Math.max(16, Math.round(origH * capScale));
    wasCapped = true;
  }

  if (onProgress) {
    onProgress(4, 'WebGL2 GPU 추론 엔진 초기화 중...');
  }

  const tf = await ensureTfReady();
  throwIfAborted(signal);

  if (onProgress) {
    onProgress(9, `AI 초해상도(${modelScale}×) 모델 가중치 불러오는 중...`);
  }

  const upscaler = await getUpscalerInstance(modelScale);
  throwIfAborted(signal);

  // 원본 캔버스 추출
  if (onProgress) {
    onProgress(13, '타일 분할 및 알파 채널 분석 중...');
  }

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = aiInW;
  rawCanvas.height = aiInH;
  const rawCtx = rawCanvas.getContext('2d');
  if (!rawCtx) throw new Error('입력 캔버스 컨텍스트 초기화에 실패했습니다.');
  rawCtx.imageSmoothingEnabled = true;
  rawCtx.imageSmoothingQuality = 'high';
  rawCtx.drawImage(img, 0, 0, origW, origH, 0, 0, aiInW, aiInH);

  const srcImageData = rawCtx.getImageData(0, 0, aiInW, aiInH);
  const hasAlpha = hasTransparentPixels(srcImageData.data);

  // 투명 영역이 검은색으로 번지지 않도록 AI 입력용 불투명 캔버스 구성
  const aiInputCanvas = document.createElement('canvas');
  aiInputCanvas.width = aiInW;
  aiInputCanvas.height = aiInH;
  const aiInputCtx = aiInputCanvas.getContext('2d');
  if (!aiInputCtx) throw new Error('AI 입력 캔버스 생성에 실패했습니다.');
  if (hasAlpha) {
    aiInputCtx.fillStyle = '#FFFFFF';
    aiInputCtx.fillRect(0, 0, aiInW, aiInH);
  }
  aiInputCtx.drawImage(rawCanvas, 0, 0);

  if (onProgress) {
    onProgress(16, `AI 초해상도 타일 복원 시작 (${modelScale}×)...`);
  }

  let upscaledTensor: Tensor3D | null = null;
  let finalRgba: Uint8ClampedArray;
  let aiOutW = aiInW * modelScale;
  let aiOutH = aiInH * modelScale;

  try {
    const result = await upscaler.execute(aiInputCanvas, {
      output: 'tensor',
      patchSize: 64,
      padding: 4,
      awaitNextFrame: true,
      signal,
      progress: (amount: number) => {
        if (signal?.aborted) return;
        if (onProgress) {
          const scaledPct = Math.min(88, 16 + Math.round(amount * 72));
          onProgress(scaledPct, `AI 디테일 신경망 복원 중 (${Math.round(amount * 100)}%)`);
        }
      },
    });

    throwIfAborted(signal);

    if (typeof result === 'string') {
      throw new Error('예기치 않은 AI 출력 형식입니다.');
    }

    upscaledTensor = result;
    const [tH, tW] = result.shape;
    aiOutH = tH;
    aiOutW = tW;

    const rgbData = await result.data();
    throwIfAborted(signal);

    const totalPx = aiOutW * aiOutH;
    finalRgba = new Uint8ClampedArray(totalPx * 4);
    for (let i = 0; i < totalPx; i += 1) {
      const sIdx = i * 3;
      const dIdx = i * 4;
      finalRgba[dIdx] = Math.max(0, Math.min(255, Math.round(rgbData[sIdx] ?? 0)));
      finalRgba[dIdx + 1] = Math.max(0, Math.min(255, Math.round(rgbData[sIdx + 1] ?? 0)));
      finalRgba[dIdx + 2] = Math.max(0, Math.min(255, Math.round(rgbData[sIdx + 2] ?? 0)));
      finalRgba[dIdx + 3] = 255;
    }
  } finally {
    if (upscaledTensor) {
      upscaledTensor.dispose();
    }
    // WebGL 메모리 압박 방지를 위한 중간 텐서 정리 기회 부여
    void tf.getBackend();
  }

  throwIfAborted(signal);

  // 목표 치수(예: FHD/4K 정확 맞춤 또는 4K 상한) 맞추기
  const safeTargetLong = Math.max(targetW, targetH);
  let outW = targetW;
  let outH = targetH;
  if (safeTargetLong > MAX_AI_LONG_EDGE) {
    const ratio = MAX_AI_LONG_EDGE / safeTargetLong;
    outW = Math.max(1, Math.round(targetW * ratio));
    outH = Math.max(1, Math.round(targetH * ratio));
    wasCapped = true;
  }

  if (onProgress) {
    onProgress(91, '목표 해상도 맞춤 및 알파 합성 중...');
  }

  let normalizedRgba: Uint8ClampedArray;
  if (aiOutW !== outW || aiOutH !== outH) {
    normalizedRgba = resampleImageDataLanczos3(finalRgba, aiOutW, aiOutH, outW, outH);
  } else {
    normalizedRgba = finalRgba;
  }

  throwIfAborted(signal);

  // 투명 PNG/WebP 알파 채널 무손실 재합성
  if (hasAlpha) {
    const upscaledAlphaRgba = resampleImageDataLanczos3(
      srcImageData.data,
      aiInW,
      aiInH,
      outW,
      outH
    );
    for (let i = 3; i < normalizedRgba.length; i += 4) {
      normalizedRgba[i] = upscaledAlphaRgba[i] ?? 255;
    }
  }

  throwIfAborted(signal);

  if (onProgress) {
    onProgress(95, '엣지 선명화 후처리 적용 중...');
  }

  // 선택적 적응형 엣지 선명화
  const polishedRgba = applyAdaptiveUnsharpMask(normalizedRgba, outW, outH, sharpenLevel);
  if (onProgress) {
    onProgress(98, '고화질 이미지 포맷 인코딩 중...');
  }

  return {
    canvas: canvasFromRgba(polishedRgba, outW, outH),
    wasCappedForMemory: wasCapped,
  };
}
