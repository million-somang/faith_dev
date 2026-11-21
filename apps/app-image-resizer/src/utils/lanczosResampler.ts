import type { SharpenLevel } from '../types/index';

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
 * 휘도(Y) 채널 적응형 언샤프 마스크 (엣지 경계만 선명화해 평탄 영역 노이즈 억제)
 */
export function applyAdaptiveUnsharpMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  level: SharpenLevel
): Uint8ClampedArray {
  if (level === 'none' || width < 3 || height < 3) {
    return pixels;
  }

  const amount = level === 'crisp' ? 0.85 : 0.45;
  const threshold = 4;

  const totalPixels = width * height;
  const luma = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i += 1) {
    const pIdx = i * 4;
    luma[i] = 0.299 * pixels[pIdx]! + 0.587 * pixels[pIdx + 1]! + 0.114 * pixels[pIdx + 2]!;
  }

  const result = new Uint8ClampedArray(pixels);

  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const idx = row + x;
      const pIdx = idx * 4;
      if (pixels[pIdx + 3]! === 0) continue;

      const blurY =
        (luma[idx - width - 1]! +
          luma[idx - width]! * 2 +
          luma[idx - width + 1]! +
          luma[idx - 1]! * 2 +
          luma[idx]! * 4 +
          luma[idx + 1]! * 2 +
          luma[idx + width - 1]! +
          luma[idx + width]! * 2 +
          luma[idx + width + 1]!) /
        16;

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
