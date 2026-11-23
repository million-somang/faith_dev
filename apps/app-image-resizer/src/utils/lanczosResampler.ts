import type { SharpenLevel } from '../types/index';
import { yieldWithoutBackgroundThrottle } from './backgroundKeepAlive';

const LANCZOS_RADIUS = 3;

function sinc(x: number): number {
  if (x === 0) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

function lanczos3Kernel(x: number): number {
  const ax = Math.abs(x);
  if (ax >= LANCZOS_RADIUS) return 0;
  if (ax === 0) return 1;
  return sinc(x) * sinc(x / LANCZOS_RADIUS);
}

interface FilterAxisPlan {
  readonly dstSize: number;
  readonly maxTaps: number;
  readonly startIndices: Int32Array;
  readonly tapCounts: Uint16Array;
  readonly weights: Float32Array;
}

function buildFilterAxisPlan(srcSize: number, dstSize: number): FilterAxisPlan {
  const ratio = srcSize / dstSize;
  const supportScale = ratio > 1 ? ratio : 1;
  const radius = LANCZOS_RADIUS * supportScale;
  const maxTaps = Math.max(1, Math.ceil(radius * 2) + 2);

  const startIndices = new Int32Array(dstSize);
  const tapCounts = new Uint16Array(dstSize);
  const weights = new Float32Array(dstSize * maxTaps);

  for (let dst = 0; dst < dstSize; dst += 1) {
    const center = (dst + 0.5) * ratio - 0.5;
    const left = Math.floor(center - radius);
    const right = Math.ceil(center + radius);

    startIndices[dst] = left;
    let weightSum = 0;
    let count = 0;
    const baseOffset = dst * maxTaps;

    for (let src = left; src <= right && count < maxTaps; src += 1) {
      const dist = (src - center) / supportScale;
      const w = lanczos3Kernel(dist);
      weights[baseOffset + count] = w;
      weightSum += w;
      count += 1;
    }

    tapCounts[dst] = count;
    if (weightSum !== 0) {
      const invSum = 1 / weightSum;
      for (let t = 0; t < count; t += 1) {
        weights[baseOffset + t] *= invSum;
      }
    } else if (count > 0) {
      weights[baseOffset] = 1;
    }
  }

  return {
    dstSize,
    maxTaps,
    startIndices,
    tapCounts,
    weights,
  };
}

function clampCoord(coord: number, max: number): number {
  if (coord < 0) return 0;
  if (coord > max) return max;
  return coord;
}

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.round(value);
}

/**
 * 분리형(Separable) Lanczos-3 RGBA 리샘플링
 * - Premultiplied Alpha 중간 Float32 버퍼로 투명 경계 검은 테두리(Dark Halo)와 양자화 밴딩 방지
 */
export function resampleImageDataLanczos3(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  onProgress?: (percent: number) => void
): Uint8ClampedArray {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
    throw new Error('유효하지 않은 이미지 해상도입니다.');
  }

  if (srcW === dstW && srcH === dstH) {
    if (onProgress) onProgress(100);
    return new Uint8ClampedArray(srcData);
  }

  const hPlan = buildFilterAxisPlan(srcW, dstW);
  const vPlan = buildFilterAxisPlan(srcH, dstH);

  // 중간 버퍼: 가로 리사이즈 결과 (dstW × srcH, Premultiplied RGBA Float32)
  const temp = new Float32Array(dstW * srcH * 4);
  const maxSrcX = srcW - 1;
  const maxSrcY = srcH - 1;

  for (let y = 0; y < srcH; y += 1) {
    const srcRowBase = y * srcW;
    const dstRowBase = y * dstW;

    for (let dx = 0; dx < dstW; dx += 1) {
      const left = hPlan.startIndices[dx]!;
      const taps = hPlan.tapCounts[dx]!;
      const wBase = dx * hPlan.maxTaps;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;

      for (let t = 0; t < taps; t += 1) {
        const sx = clampCoord(left + t, maxSrcX);
        const w = hPlan.weights[wBase + t]!;
        if (w === 0) continue;

        const pIdx = (srcRowBase + sx) * 4;
        const aNorm = srcData[pIdx + 3]! / 255;
        sumR += srcData[pIdx]! * aNorm * w;
        sumG += srcData[pIdx + 1]! * aNorm * w;
        sumB += srcData[pIdx + 2]! * aNorm * w;
        sumA += srcData[pIdx + 3]! * w;
      }

      const tIdx = (dstRowBase + dx) * 4;
      temp[tIdx] = sumR;
      temp[tIdx + 1] = sumG;
      temp[tIdx + 2] = sumB;
      temp[tIdx + 3] = sumA;
    }

    if (onProgress && y % 32 === 0) {
      onProgress(Math.min(45, 5 + Math.round((y / srcH) * 40)));
    }
  }

  const output = new Uint8ClampedArray(dstW * dstH * 4);

  for (let dy = 0; dy < dstH; dy += 1) {
    const top = vPlan.startIndices[dy]!;
    const taps = vPlan.tapCounts[dy]!;
    const wBase = dy * vPlan.maxTaps;
    const outRowBase = dy * dstW;

    for (let dx = 0; dx < dstW; dx += 1) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;

      for (let t = 0; t < taps; t += 1) {
        const sy = clampCoord(top + t, maxSrcY);
        const w = vPlan.weights[wBase + t]!;
        if (w === 0) continue;

        const tIdx = (sy * dstW + dx) * 4;
        sumR += temp[tIdx]! * w;
        sumG += temp[tIdx + 1]! * w;
        sumB += temp[tIdx + 2]! * w;
        sumA += temp[tIdx + 3]! * w;
      }

      const outA = clampByte(sumA);
      const outIdx = (outRowBase + dx) * 4;
      if (outA === 0) {
        output[outIdx] = 0;
        output[outIdx + 1] = 0;
        output[outIdx + 2] = 0;
        output[outIdx + 3] = 0;
      } else {
        const invAlpha = 255 / Math.max(1, sumA);
        output[outIdx] = clampByte(sumR * invAlpha);
        output[outIdx + 1] = clampByte(sumG * invAlpha);
        output[outIdx + 2] = clampByte(sumB * invAlpha);
        output[outIdx + 3] = outA;
      }
    }

    if (onProgress && dy % 32 === 0) {
      onProgress(Math.min(90, 45 + Math.round((dy / dstH) * 45)));
    }
  }

  if (onProgress) onProgress(90);
  return output;
}

/**
 * 배율에 비례하는 분리형 가우시안 언샤프 마스크 반경 계산
 * - 2×~8× 확대 시 고정 3×3(반경 1px) 커널이 무력해지는 문제를 방지
 */
export function getAdaptiveUnsharpSigma(effectiveScale: number): number {
  return Math.max(0.85, Math.min(2.4, 0.85 * Math.sqrt(Math.max(1, effectiveScale))));
}

export function getAdaptiveUnsharpRadius(effectiveScale: number): number {
  const sigma = getAdaptiveUnsharpSigma(effectiveScale);
  return Math.max(1, Math.min(6, Math.ceil(sigma * 2.5)));
}

function buildGaussianKernel1D(sigma: number, radius: number): Float32Array {
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);
  const twoSigmaSq = 2 * sigma * sigma;
  let sum = 0;

  for (let k = -radius; k <= radius; k += 1) {
    const w = Math.exp(-(k * k) / twoSigmaSq);
    kernel[k + radius] = w;
    sum += w;
  }

  if (sum > 0) {
    const invSum = 1 / sum;
    for (let i = 0; i < size; i += 1) {
      kernel[i] *= invSum;
    }
  }
  return kernel;
}

/**
 * 휘도(Y) 채널 배율 비례 분리형 가우시안 언샤프 마스크
 * - 엣지 경계만 선명화해 평탄 영역 노이즈·링잉 억제
 */
export function applyAdaptiveUnsharpMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  level: SharpenLevel,
  effectiveScale = 1,
  isAiOutput = false
): Uint8ClampedArray {
  if (level === 'none' || width < 3 || height < 3) {
    return pixels;
  }

  const amount = isAiOutput
    ? level === 'crisp'
      ? 0.6
      : 0.28
    : level === 'crisp'
      ? 1.35
      : 0.75;
  const threshold = 3;

  const sigma = getAdaptiveUnsharpSigma(effectiveScale);
  const radius = Math.max(1, Math.min(6, Math.ceil(sigma * 2.5)));
  const kernel = buildGaussianKernel1D(sigma, radius);

  const totalPixels = width * height;
  const luma = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i += 1) {
    const pIdx = i * 4;
    luma[i] = 0.299 * pixels[pIdx]! + 0.587 * pixels[pIdx + 1]! + 0.114 * pixels[pIdx + 2]!;
  }

  // 1패스: 수평 1D 가우시안 블러
  const horizBlur = new Float32Array(totalPixels);
  const maxX = width - 1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sx = x + k < 0 ? 0 : x + k > maxX ? maxX : x + k;
        acc += luma[row + sx]! * kernel[k + radius]!;
      }
      horizBlur[row + x] = acc;
    }
  }

  // 2패스: 수직 1D 가우시안 블러 + 휘도 적응형 코어링 샤프닝
  const result = new Uint8ClampedArray(pixels);
  const maxY = height - 1;

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const idx = row + x;
      const pIdx = idx * 4;
      if (pixels[pIdx + 3]! === 0) continue;

      let blurY = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sy = y + k < 0 ? 0 : y + k > maxY ? maxY : y + k;
        blurY += horizBlur[sy * width + x]! * kernel[k + radius]!;
      }

      const diff = luma[idx]! - blurY;
      const absDiff = Math.abs(diff);
      if (absDiff <= threshold) continue;

      const coring = diff > 0 ? diff - threshold : diff + threshold;
      const delta = coring * amount;

      result[pIdx] = clampByte(pixels[pIdx]! + delta);
      result[pIdx + 1] = clampByte(pixels[pIdx + 1]! + delta);
      result[pIdx + 2] = clampByte(pixels[pIdx + 2]! + delta);
    }
  }

  return result;
}

export function computeMeanSobelMagnitude(rgba: Uint8ClampedArray, w: number, h: number): number {
  if (w < 3 || h < 3) return 0;
  const luma = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const idx = i * 4;
    luma[i] = 0.299 * rgba[idx]! + 0.587 * rgba[idx + 1]! + 0.114 * rgba[idx + 2]!;
  }

  let totalGrad = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y += 1) {
    const rowPrev = (y - 1) * w;
    const rowCurr = y * w;
    const rowNext = (y + 1) * w;
    for (let x = 1; x < w - 1; x += 1) {
      const gx =
        -luma[rowPrev + x - 1]! +
        luma[rowPrev + x + 1]! -
        2 * luma[rowCurr + x - 1]! +
        2 * luma[rowCurr + x + 1]! -
        luma[rowNext + x - 1]! +
        luma[rowNext + x + 1]!;
      const gy =
        -luma[rowPrev + x - 1]! -
        2 * luma[rowPrev + x]! -
        luma[rowPrev + x + 1]! +
        luma[rowNext + x - 1]! +
        2 * luma[rowNext + x]! +
        luma[rowNext + x + 1]!;
      totalGrad += Math.hypot(gx, gy);
      count += 1;
    }
  }
  return count > 0 ? totalGrad / count : 0;
}

/**
 * 원본 이중선형 기준선 대비 결과 캔버스의 실측 엣지 선명도 개선율(%) 계산
 * - 가짜 수치 없이 실제 픽셀 Sobel 그래디언트 에너지만 비교
 */
export function measureSharpnessGainPercent(
  origImg: HTMLImageElement,
  outCanvas: HTMLCanvasElement
): number {
  const outW = outCanvas.width;
  const outH = outCanvas.height;
  const origW = origImg.naturalWidth || origImg.width;
  const origH = origImg.naturalHeight || origImg.height;
  if (outW < 16 || outH < 16 || origW < 4 || origH < 4) return 0;

  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return 0;

  const sampleW = Math.min(384, outW);
  const sampleH = Math.min(384, outH);
  const dstX = Math.max(0, Math.floor((outW - sampleW) / 2));

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = sampleW;
  baseCanvas.height = sampleH;
  const baseCtx = baseCanvas.getContext('2d');
  if (!baseCtx) return 0;
  baseCtx.imageSmoothingEnabled = true;
  baseCtx.imageSmoothingQuality = 'high';

  const measureAtCenterY = (centerFracY: number) => {
    const dstY = Math.max(0, Math.min(outH - sampleH, Math.floor(outH * centerFracY - sampleH / 2)));
    const srcX = (dstX / outW) * origW;
    const srcY = (dstY / outH) * origH;
    const srcW = (sampleW / outW) * origW;
    const srcH = (sampleH / outH) * origH;

    baseCtx.clearRect(0, 0, sampleW, sampleH);
    baseCtx.drawImage(origImg, srcX, srcY, srcW, srcH, 0, 0, sampleW, sampleH);
    const baseData = baseCtx.getImageData(0, 0, sampleW, sampleH).data;
    const outData = outCtx.getImageData(dstX, dstY, sampleW, sampleH).data;

    return {
      baseEnergy: computeMeanSobelMagnitude(baseData, sampleW, sampleH),
      outEnergy: computeMeanSobelMagnitude(outData, sampleW, sampleH),
    };
  };

  let best = measureAtCenterY(0.5);
  // 중앙이 빈 여백(예: 긴 상세페이지 흰 구분선)이면 상·하단 본문 영역을 자동 탐색
  if (best.baseEnergy < 1.2 && outH > sampleH * 2) {
    for (const frac of [0.25, 0.75, 0.15, 0.85]) {
      const candidate = measureAtCenterY(frac);
      if (candidate.baseEnergy > best.baseEnergy) {
        best = candidate;
      }
      if (best.baseEnergy >= 3.0) break;
    }
  }

  if (best.baseEnergy < 0.05 && best.outEnergy < 0.05) return 0;
  const gain = ((best.outEnergy - best.baseEnergy) / Math.max(0.25, best.baseEnergy)) * 100;
  return Math.max(-99, Math.min(999, Math.round(gain)));
}

/**
 * AI 타일 버퍼의 비정수 배율 출력 서브영역을 Lanczos-3로 정밀 샘플링
 */
export function resampleTileSubregionLanczos3(params: {
  readonly aiRgba: Uint8ClampedArray;
  readonly aiW: number;
  readonly aiH: number;
  readonly origW: number;
  readonly origH: number;
  readonly targetW: number;
  readonly targetH: number;
  readonly srcPadX0: number;
  readonly srcPadY0: number;
  readonly combinedAiScale: number;
  readonly dstX0: number;
  readonly dstY0: number;
  readonly outW: number;
  readonly outH: number;
}): Uint8ClampedArray {
  const {
    aiRgba,
    aiW,
    aiH,
    origW,
    origH,
    targetW,
    targetH,
    srcPadX0,
    srcPadY0,
    combinedAiScale,
    dstX0,
    dstY0,
    outW,
    outH,
  } = params;

  const scaleX = targetW / Math.max(1, origW);
  const scaleY = targetH / Math.max(1, origH);
  const ratioX = combinedAiScale / Math.max(1e-6, scaleX);
  const ratioY = combinedAiScale / Math.max(1e-6, scaleY);
  const supportX = ratioX > 1 ? ratioX : 1;
  const supportY = ratioY > 1 ? ratioY : 1;
  const radX = LANCZOS_RADIUS * supportX;
  const radY = LANCZOS_RADIUS * supportY;
  const maxTapsX = Math.max(1, Math.ceil(radX * 2) + 2);
  const maxTapsY = Math.max(1, Math.ceil(radY * 2) + 2);

  const hStarts = new Int32Array(outW);
  const hCounts = new Uint16Array(outW);
  const hWeights = new Float32Array(outW * maxTapsX);

  let minAiX = aiW - 1;
  let maxAiX = 0;
  for (let lx = 0; lx < outW; lx += 1) {
    const dx = dstX0 + lx;
    const center = ((dx + 0.5) / scaleX - srcPadX0) * combinedAiScale - 0.5;
    const left = Math.floor(center - radX);
    const right = Math.ceil(center + radX);
    hStarts[lx] = left;
    let wSum = 0;
    let count = 0;
    const base = lx * maxTapsX;
    for (let sx = left; sx <= right && count < maxTapsX; sx += 1) {
      const w = lanczos3Kernel((sx - center) / supportX);
      hWeights[base + count] = w;
      wSum += w;
      count += 1;
    }
    hCounts[lx] = count;
    if (wSum !== 0) {
      const inv = 1 / wSum;
      for (let t = 0; t < count; t += 1) hWeights[base + t] *= inv;
    } else if (count > 0) {
      hWeights[base] = 1;
    }
    const cl = clampCoord(left, aiW - 1);
    const cr = clampCoord(left + Math.max(0, count - 1), aiW - 1);
    if (cl < minAiX) minAiX = cl;
    if (cr > maxAiX) maxAiX = cr;
  }

  const vStarts = new Int32Array(outH);
  const vCounts = new Uint16Array(outH);
  const vWeights = new Float32Array(outH * maxTapsY);

  let minAiY = aiH - 1;
  let maxAiY = 0;
  for (let ly = 0; ly < outH; ly += 1) {
    const dy = dstY0 + ly;
    const center = ((dy + 0.5) / scaleY - srcPadY0) * combinedAiScale - 0.5;
    const top = Math.floor(center - radY);
    const bottom = Math.ceil(center + radY);
    vStarts[ly] = top;
    let wSum = 0;
    let count = 0;
    const base = ly * maxTapsY;
    for (let sy = top; sy <= bottom && count < maxTapsY; sy += 1) {
      const w = lanczos3Kernel((sy - center) / supportY);
      vWeights[base + count] = w;
      wSum += w;
      count += 1;
    }
    vCounts[ly] = count;
    if (wSum !== 0) {
      const inv = 1 / wSum;
      for (let t = 0; t < count; t += 1) vWeights[base + t] *= inv;
    } else if (count > 0) {
      vWeights[base] = 1;
    }
    const ct = clampCoord(top, aiH - 1);
    const cb = clampCoord(top + Math.max(0, count - 1), aiH - 1);
    if (ct < minAiY) minAiY = ct;
    if (cb > maxAiY) maxAiY = cb;
  }

  const bandH = Math.max(1, maxAiY - minAiY + 1);
  const temp = new Float32Array(outW * bandH * 4);
  const maxAiXIdx = aiW - 1;

  for (let ay = minAiY; ay <= maxAiY; ay += 1) {
    const srcRow = ay * aiW;
    const tmpRow = (ay - minAiY) * outW;
    for (let lx = 0; lx < outW; lx += 1) {
      const left = hStarts[lx]!;
      const taps = hCounts[lx]!;
      const wBase = lx * maxTapsX;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      for (let t = 0; t < taps; t += 1) {
        const sx = clampCoord(left + t, maxAiXIdx);
        const w = hWeights[wBase + t]!;
        if (w === 0) continue;
        const pIdx = (srcRow + sx) * 4;
        const aNorm = aiRgba[pIdx + 3]! / 255;
        sumR += aiRgba[pIdx]! * aNorm * w;
        sumG += aiRgba[pIdx + 1]! * aNorm * w;
        sumB += aiRgba[pIdx + 2]! * aNorm * w;
        sumA += aiRgba[pIdx + 3]! * w;
      }
      const tIdx = (tmpRow + lx) * 4;
      temp[tIdx] = sumR;
      temp[tIdx + 1] = sumG;
      temp[tIdx + 2] = sumB;
      temp[tIdx + 3] = sumA;
    }
  }

  const output = new Uint8ClampedArray(outW * outH * 4);
  const maxAiYIdx = aiH - 1;

  for (let ly = 0; ly < outH; ly += 1) {
    const top = vStarts[ly]!;
    const taps = vCounts[ly]!;
    const wBase = ly * maxTapsY;
    const outRow = ly * outW;
    for (let lx = 0; lx < outW; lx += 1) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      for (let t = 0; t < taps; t += 1) {
        const sy = clampCoord(top + t, maxAiYIdx);
        const w = vWeights[wBase + t]!;
        if (w === 0) continue;
        const tIdx = ((sy - minAiY) * outW + lx) * 4;
        sumR += temp[tIdx]! * w;
        sumG += temp[tIdx + 1]! * w;
        sumB += temp[tIdx + 2]! * w;
        sumA += temp[tIdx + 3]! * w;
      }
      const outA = clampByte(sumA);
      const outIdx = (outRow + lx) * 4;
      if (outA === 0) {
        output[outIdx] = 0;
        output[outIdx + 1] = 0;
        output[outIdx + 2] = 0;
        output[outIdx + 3] = 0;
      } else {
        const invAlpha = 255 / Math.max(1, sumA);
        output[outIdx] = clampByte(sumR * invAlpha);
        output[outIdx + 1] = clampByte(sumG * invAlpha);
        output[outIdx + 2] = clampByte(sumB * invAlpha);
        output[outIdx + 3] = outA;
      }
    }
  }

  return output;
}

/**
 * 256행 수평 스트립 스트리밍 Lanczos-3 리샘플링
 * - 전체 출력 크기(예: 12000×14400)의 Float32 버퍼를 한 번에 잡지 않아 OOM 없이 안전하게 업스케일
 */
export async function resampleCanvasLanczos3Streamed(
  img: HTMLImageElement,
  dstW: number,
  dstH: number,
  sharpenLevel: SharpenLevel,
  onProgress?: (percent: number, statusText: string) => void,
  signal?: AbortSignal
): Promise<HTMLCanvasElement> {
  if (signal?.aborted) {
    throw new DOMException('작업이 중단되었습니다.', 'AbortError');
  }

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  if (origW <= 0 || origH <= 0 || dstW <= 0 || dstH <= 0) {
    throw new Error('유효하지 않은 이미지 해상도입니다.');
  }

  if (onProgress) onProgress(8, '원본 픽셀 버퍼 준비 중...');

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('원본 캔버스 컨텍스트를 생성할 수 없습니다.');
  srcCtx.drawImage(img, 0, 0, origW, origH);
  const srcData = srcCtx.getImageData(0, 0, origW, origH).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = dstW;
  outCanvas.height = dstH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('출력 캔버스 컨텍스트를 생성할 수 없습니다.');

  const STRIP_ROWS = 256;
  const maxSrcX = origW - 1;
  const maxSrcY = origH - 1;
  const effectiveScale = Math.max(dstW / Math.max(1, origW), dstH / Math.max(1, origH));
  const usmMargin = getAdaptiveUnsharpRadius(effectiveScale);

  if (origW === dstW && origH === dstH) {
    if (sharpenLevel === 'none') {
      outCtx.drawImage(srcCanvas, 0, 0);
      if (onProgress) onProgress(96, '원본 해상도 유지 완료');
      return outCanvas;
    }

    for (let y0 = 0; y0 < dstH; y0 += STRIP_ROWS) {
      if (signal?.aborted) throw new DOMException('작업이 중단되었습니다.', 'AbortError');
      const y1 = Math.min(dstH, y0 + STRIP_ROWS);
      const marginY0 = Math.max(0, y0 - usmMargin);
      const marginY1 = Math.min(dstH, y1 + usmMargin);
      const bandH = marginY1 - marginY0;
      const bandSlice = srcData.subarray(marginY0 * dstW * 4, marginY1 * dstW * 4);
      const sharpenedBand = applyAdaptiveUnsharpMask(
        bandSlice,
        dstW,
        bandH,
        sharpenLevel,
        1,
        false
      );
      const innerStart = (y0 - marginY0) * dstW * 4;
      const innerEnd = innerStart + (y1 - y0) * dstW * 4;
      const innerRgba = new Uint8ClampedArray(sharpenedBand.subarray(innerStart, innerEnd));
      outCtx.putImageData(new ImageData(innerRgba, dstW, y1 - y0), 0, y0);

      if (onProgress) {
        const pct = Math.min(95, 15 + Math.round((y1 / dstH) * 80));
        onProgress(pct, `선명화 보정 중 (${pct}%)`);
      }
      await yieldWithoutBackgroundThrottle();
    }
    return outCanvas;
  }

  const hPlan = buildFilterAxisPlan(origW, dstW);
  const vPlan = buildFilterAxisPlan(origH, dstH);

  for (let y0 = 0; y0 < dstH; y0 += STRIP_ROWS) {
    if (signal?.aborted) {
      throw new DOMException('작업이 중단되었습니다.', 'AbortError');
    }

    const y1 = Math.min(dstH, y0 + STRIP_ROWS);
    const marginY0 = Math.max(0, y0 - usmMargin);
    const marginY1 = Math.min(dstH, y1 + usmMargin);
    const stripMarginH = marginY1 - marginY0;

    let srcYMin = maxSrcY;
    let srcYMax = 0;
    for (let dy = marginY0; dy < marginY1; dy += 1) {
      const top = vPlan.startIndices[dy]!;
      const taps = vPlan.tapCounts[dy]!;
      const cl = clampCoord(top, maxSrcY);
      const cr = clampCoord(top + Math.max(0, taps - 1), maxSrcY);
      if (cl < srcYMin) srcYMin = cl;
      if (cr > srcYMax) srcYMax = cr;
    }

    const srcBandH = Math.max(1, srcYMax - srcYMin + 1);
    const temp = new Float32Array(dstW * srcBandH * 4);

    for (let sy = srcYMin; sy <= srcYMax; sy += 1) {
      const srcRowBase = sy * origW;
      const tmpRowBase = (sy - srcYMin) * dstW;
      for (let dx = 0; dx < dstW; dx += 1) {
        const left = hPlan.startIndices[dx]!;
        const taps = hPlan.tapCounts[dx]!;
        const wBase = dx * hPlan.maxTaps;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumA = 0;
        for (let t = 0; t < taps; t += 1) {
          const sx = clampCoord(left + t, maxSrcX);
          const w = hPlan.weights[wBase + t]!;
          if (w === 0) continue;
          const pIdx = (srcRowBase + sx) * 4;
          const aNorm = srcData[pIdx + 3]! / 255;
          sumR += srcData[pIdx]! * aNorm * w;
          sumG += srcData[pIdx + 1]! * aNorm * w;
          sumB += srcData[pIdx + 2]! * aNorm * w;
          sumA += srcData[pIdx + 3]! * w;
        }
        const tIdx = (tmpRowBase + dx) * 4;
        temp[tIdx] = sumR;
        temp[tIdx + 1] = sumG;
        temp[tIdx + 2] = sumB;
        temp[tIdx + 3] = sumA;
      }
    }

    const stripMarginRgba = new Uint8ClampedArray(dstW * stripMarginH * 4);

    for (let dy = marginY0; dy < marginY1; dy += 1) {
      const top = vPlan.startIndices[dy]!;
      const taps = vPlan.tapCounts[dy]!;
      const wBase = dy * vPlan.maxTaps;
      const outRowBase = (dy - marginY0) * dstW;

      for (let dx = 0; dx < dstW; dx += 1) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumA = 0;
        for (let t = 0; t < taps; t += 1) {
          const sy = clampCoord(top + t, maxSrcY);
          const w = vPlan.weights[wBase + t]!;
          if (w === 0) continue;
          const tIdx = ((sy - srcYMin) * dstW + dx) * 4;
          sumR += temp[tIdx]! * w;
          sumG += temp[tIdx + 1]! * w;
          sumB += temp[tIdx + 2]! * w;
          sumA += temp[tIdx + 3]! * w;
        }

        const outA = clampByte(sumA);
        const outIdx = (outRowBase + dx) * 4;
        if (outA === 0) {
          stripMarginRgba[outIdx] = 0;
          stripMarginRgba[outIdx + 1] = 0;
          stripMarginRgba[outIdx + 2] = 0;
          stripMarginRgba[outIdx + 3] = 0;
        } else {
          const invAlpha = 255 / Math.max(1, sumA);
          stripMarginRgba[outIdx] = clampByte(sumR * invAlpha);
          stripMarginRgba[outIdx + 1] = clampByte(sumG * invAlpha);
          stripMarginRgba[outIdx + 2] = clampByte(sumB * invAlpha);
          stripMarginRgba[outIdx + 3] = outA;
        }
      }
    }

    const sharpenedMargin = applyAdaptiveUnsharpMask(
      stripMarginRgba,
      dstW,
      stripMarginH,
      sharpenLevel,
      effectiveScale,
      false
    );
    const innerRowOffset = (y0 - marginY0) * dstW * 4;
    const innerRowBytes = (y1 - y0) * dstW * 4;
    const innerRgba = new Uint8ClampedArray(
      sharpenedMargin.subarray(innerRowOffset, innerRowOffset + innerRowBytes)
    );
    outCtx.putImageData(new ImageData(innerRgba, dstW, y1 - y0), 0, y0);

    if (onProgress) {
      const pct = Math.min(95, 12 + Math.round((y1 / dstH) * 83));
      onProgress(pct, `Lanczos-3 정밀 보간 중 (${pct}%)`);
    }

    await yieldWithoutBackgroundThrottle();
  }

  return outCanvas;
}
