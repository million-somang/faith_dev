import type { Tensor3D } from '@tensorflow/tfjs';
import type Upscaler from 'upscaler';
import type { SharpenLevel } from '../types/index';
import {
  applyAdaptiveUnsharpMask,
  resampleCanvasLanczos3Streamed,
  resampleTileSubregionLanczos3,
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
    const dstStart = row * rowBytes;
    out.set(src.subarray(srcStart, srcStart + rowBytes), dstStart);
  }
  return out;
}

function hasTransparentPixels(rgba: Uint8ClampedArray): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i]! < 255) return true;
  }
  return false;
}

export function resolveEsrganStages(effectiveScale: number): readonly EsrganScale[] {
  if (effectiveScale <= 1.001) return [];
  if (effectiveScale <= 2.05) return [2];
  if (effectiveScale <= 3.05) return [3];
  if (effectiveScale <= 4.05) return [4];
  if (effectiveScale <= 6.05) return [3, 2];
  return [4, 2];
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

async function runSingleEsrganStage(
  upscaler: Upscaler,
  inputCanvas: HTMLCanvasElement,
  signal?: AbortSignal,
  onPatchProgress?: (amount: number) => void
): Promise<{ readonly rgba: Uint8ClampedArray; readonly width: number; readonly height: number }> {
  throwIfAborted(signal);
  const maxDim = Math.max(inputCanvas.width, inputCanvas.height);

  let upscaledTensor: Tensor3D | null = null;
  try {
    const result = await upscaler.execute(inputCanvas, {
      output: 'tensor',
      ...(maxDim > 64 ? { patchSize: 64, padding: 4 } : {}),
      awaitNextFrame: true,
      signal,
      progress: (amount: number) => {
        if (signal?.aborted) return;
        onPatchProgress?.(amount);
      },
    });

    throwIfAborted(signal);
    if (typeof result === 'string') {
      throw new Error('예기치 않은 AI 출력 형식입니다.');
    }

    upscaledTensor = result;
    const [tH, tW] = result.shape;
    const rgbData = await result.data();
    throwIfAborted(signal);

    const totalPx = tW * tH;
    const rgba = new Uint8ClampedArray(totalPx * 4);
    for (let i = 0; i < totalPx; i += 1) {
      const sIdx = i * 3;
      const dIdx = i * 4;
      rgba[dIdx] = Math.max(0, Math.min(255, Math.round(rgbData[sIdx] ?? 0)));
      rgba[dIdx + 1] = Math.max(0, Math.min(255, Math.round(rgbData[sIdx + 1] ?? 0)));
      rgba[dIdx + 2] = Math.max(0, Math.min(255, Math.round(rgbData[sIdx + 2] ?? 0)));
      rgba[dIdx + 3] = 255;
    }

    return { rgba, width: tW, height: tH };
  } finally {
    if (upscaledTensor) {
      upscaledTensor.dispose();
    }
  }
}

/**
 * 100% 브라우저 CSR AI(ESRGAN-Slim) 타일 스트리밍 초해상도 업스케일링
 * - 원본 사전 축소 없이 원본 픽셀 100% 그대로 타일 분할 추론
 * - 6×(3×→2×) · 8×(4×→2×)는 타일별 2단 연쇄 AI 추론 후 텐서 즉시 해제
 * - 최대 16K 캔버스까지 출력 캔버스에 타일 단위 직접 합성 + 알파 채널 보존
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
  const effectiveScale = Math.max(targetW / Math.max(1, origW), targetH / Math.max(1, origH));
  const stages = resolveEsrganStages(effectiveScale);

  // 원본이 이미 목표 해상도(FHD/4K/8K) 이상인 경우 축소·재확대 없이 원본 보존 + 선택적 선명화만 수행
  if (stages.length === 0) {
    const canvas = await resampleCanvasLanczos3Streamed(
      img,
      origW,
      origH,
      sharpenLevel,
      onProgress,
      signal
    );
    return { canvas, wasCappedForMemory: false };
  }

  if (onProgress) {
    onProgress(4, 'WebGL2 GPU 추론 엔진 초기화 중...');
  }

  const tf = await ensureTfReady();
  throwIfAborted(signal);

  const uniqueStages = Array.from(new Set(stages));
  const stageLabel = stages.map((s) => `${s}×`).join('→');

  if (onProgress) {
    onProgress(8, `AI 초해상도(${stageLabel}) 모델 가중치 불러오는 중...`);
  }

  const loadedModels = new Map<EsrganScale, Upscaler>();
  for (const s of uniqueStages) {
    loadedModels.set(s, await getUpscalerInstance(s));
    throwIfAborted(signal);
  }

  if (onProgress) {
    onProgress(12, '알파 채널 분석 및 타일 그리드 구성 중...');
  }

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('원본 캔버스 컨텍스트 초기화에 실패했습니다.');
  srcCtx.drawImage(img, 0, 0, origW, origH);
  const srcCheckRgba = srcCtx.getImageData(0, 0, origW, origH).data;
  const hasAlpha = hasTransparentPixels(srcCheckRgba);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('출력 캔버스 컨텍스트 초기화에 실패했습니다.');

  const combinedAiScale = stages.reduce((acc, s) => acc * s, 1);
  const isExactIntegerScale =
    targetW === origW * combinedAiScale && targetH === origH * combinedAiScale;
  const isTwoStage = stages.length === 2;
  const inputTileCore = isTwoStage ? 128 : 192;
  const inputOverlap = isTwoStage ? 8 : 12;
  const dstTileSize = inputTileCore * combinedAiScale;

  const cols = Math.max(1, Math.ceil(targetW / dstTileSize));
  const rows = Math.max(1, Math.ceil(targetH / dstTileSize));
  const totalTiles = cols * rows;
  const scaleX = targetW / Math.max(1, origW);
  const scaleY = targetH / Math.max(1, origH);

  let completedTiles = 0;

  for (let ty = 0; ty < rows; ty += 1) {
    for (let tx = 0; tx < cols; tx += 1) {
      throwIfAborted(signal);

      const tileNumber = completedTiles + 1;
      const dstX0 = tx * dstTileSize;
      const dstY0 = ty * dstTileSize;
      const dstX1 = Math.min(targetW, dstX0 + dstTileSize);
      const dstY1 = Math.min(targetH, dstY0 + dstTileSize);
      const outTileW = dstX1 - dstX0;
      const outTileH = dstY1 - dstY0;

      const srcCoreX0 = isExactIntegerScale
        ? dstX0 / combinedAiScale
        : Math.max(0, Math.floor(dstX0 / scaleX));
      const srcCoreX1 = isExactIntegerScale
        ? dstX1 / combinedAiScale
        : Math.min(origW, Math.ceil(dstX1 / scaleX));
      const srcCoreY0 = isExactIntegerScale
        ? dstY0 / combinedAiScale
        : Math.max(0, Math.floor(dstY0 / scaleY));
      const srcCoreY1 = isExactIntegerScale
        ? dstY1 / combinedAiScale
        : Math.min(origH, Math.ceil(dstY1 / scaleY));

      const srcPadX0 = Math.max(0, srcCoreX0 - inputOverlap);
      const srcPadY0 = Math.max(0, srcCoreY0 - inputOverlap);
      const srcPadX1 = Math.min(origW, srcCoreX1 + inputOverlap);
      const srcPadY1 = Math.min(origH, srcCoreY1 + inputOverlap);
      const padW = Math.max(1, srcPadX1 - srcPadX0);
      const padH = Math.max(1, srcPadY1 - srcPadY0);

      const tileInputCanvas = document.createElement('canvas');
      tileInputCanvas.width = padW;
      tileInputCanvas.height = padH;
      const tileInputCtx = tileInputCanvas.getContext('2d');
      if (!tileInputCtx) throw new Error('타일 입력 캔버스 생성에 실패했습니다.');
      if (hasAlpha) {
        tileInputCtx.fillStyle = '#FFFFFF';
        tileInputCtx.fillRect(0, 0, padW, padH);
      }
      tileInputCtx.drawImage(srcCanvas, srcPadX0, srcPadY0, padW, padH, 0, 0, padW, padH);

      const stage1Scale = stages[0]!;
      const stage1Upscaler = loadedModels.get(stage1Scale)!;

      const stage1Out = await runSingleEsrganStage(
        stage1Upscaler,
        tileInputCanvas,
        signal,
        (patchAmt) => {
          if (!onProgress) return;
          const tileFraction = isTwoStage ? patchAmt * 0.2 : patchAmt;
          const overall = Math.min(93, 14 + Math.round(((completedTiles + tileFraction) / totalTiles) * 79));
          onProgress(
            overall,
            isTwoStage
              ? `AI 1단계 복원 (${stage1Scale}×) · 타일 ${tileNumber}/${totalTiles}`
              : `AI 초해상도 복원 (${stage1Scale}×) · 타일 ${tileNumber}/${totalTiles}`
          );
        }
      );

      let finalAi = stage1Out;

      if (isTwoStage) {
        throwIfAborted(signal);
        const stage2Scale = stages[1]!;
        const stage2Upscaler = loadedModels.get(stage2Scale)!;
        const stage1Canvas = canvasFromRgba(stage1Out.rgba, stage1Out.width, stage1Out.height);

        finalAi = await runSingleEsrganStage(
          stage2Upscaler,
          stage1Canvas,
          signal,
          (patchAmt) => {
            if (!onProgress) return;
            const tileFraction = 0.2 + patchAmt * 0.8;
            const overall = Math.min(
              93,
              14 + Math.round(((completedTiles + tileFraction) / totalTiles) * 79)
            );
            onProgress(
              overall,
              `AI 2단 초해상도 복원 (${stageLabel}) · 타일 ${tileNumber}/${totalTiles}`
            );
          }
        );
      }

      throwIfAborted(signal);

      let validTileRgba: Uint8ClampedArray;
      if (isExactIntegerScale) {
        const sharpenedAi = applyAdaptiveUnsharpMask(
          finalAi.rgba,
          finalAi.width,
          finalAi.height,
          sharpenLevel
        );
        const cropX = Math.max(
          0,
          Math.min(finalAi.width - outTileW, (srcCoreX0 - srcPadX0) * combinedAiScale)
        );
        const cropY = Math.max(
          0,
          Math.min(finalAi.height - outTileH, (srcCoreY0 - srcPadY0) * combinedAiScale)
        );
        validTileRgba = cropRgbaSubrect(
          sharpenedAi,
          finalAi.width,
          cropX,
          cropY,
          outTileW,
          outTileH
        );
      } else {
        const mX0 = Math.max(0, dstX0 - 1);
        const mY0 = Math.max(0, dstY0 - 1);
        const mX1 = Math.min(targetW, dstX1 + 1);
        const mY1 = Math.min(targetH, dstY1 + 1);
        const mW = mX1 - mX0;
        const mH = mY1 - mY0;

        const resampledMargin = resampleTileSubregionLanczos3({
          aiRgba: finalAi.rgba,
          aiW: finalAi.width,
          aiH: finalAi.height,
          origW,
          origH,
          targetW,
          targetH,
          srcPadX0,
          srcPadY0,
          combinedAiScale,
          dstX0: mX0,
          dstY0: mY0,
          outW: mW,
          outH: mH,
        });
        const sharpenedMargin = applyAdaptiveUnsharpMask(resampledMargin, mW, mH, sharpenLevel);
        validTileRgba = cropRgbaSubrect(
          sharpenedMargin,
          mW,
          dstX0 - mX0,
          dstY0 - mY0,
          outTileW,
          outTileH
        );
      }

      if (hasAlpha) {
        const rawPadAlpha = srcCtx.getImageData(srcPadX0, srcPadY0, padW, padH).data;
        const alphaTile = resampleTileSubregionLanczos3({
          aiRgba: rawPadAlpha,
          aiW: padW,
          aiH: padH,
          origW,
          origH,
          targetW,
          targetH,
          srcPadX0,
          srcPadY0,
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

      completedTiles += 1;
      void tf.getBackend();
      await yieldUiFrame();
    }
  }

  if (onProgress) {
    const mp = (targetW * targetH) / 1_000_000;
    onProgress(
      96,
      mp >= 40
        ? '초고해상도 파일 인코딩 중... (수 초 소요될 수 있습니다)'
        : '고화질 이미지 포맷 인코딩 중...'
    );
  }

  return {
    canvas: outCanvas,
    wasCappedForMemory: false,
  };
}
