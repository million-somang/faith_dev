import { ErrorCorrectionLevel, QrMatrixResult } from '../types';

/**
 * ISO/IEC 18004 표준 QR Code Matrix Encoder (100% Client-Side, Zero External API)
 * - 지원 버전: Version 1 (21x21) ~ Version 40 (177x177)
 * - 지원 인코딩: UTF-8 Byte Mode (한글·다국어·이모지 완벽 보존)
 * - 오류 복원 레벨: L (7%), M (15%), Q (25%), H (30%)
 * - Reed-Solomon GF(256) 다항식 나눗셈 및 8종 마스크 패턴 자동 최적화
 */

const EC_CODEWORDS_PER_BLOCK: Record<ErrorCorrectionLevel, number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};

const NUM_ERROR_CORRECTION_BLOCKS: Record<ErrorCorrectionLevel, number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

const EC_FORMAT_BITS: Record<ErrorCorrectionLevel, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

function getBit(val: number, i: number): boolean {
  return ((val >>> i) & 1) !== 0;
}

function appendBits(val: number, len: number, bb: number[]): void {
  for (let i = len - 1; i >= 0; i--) {
    bb.push((val >>> i) & 1);
  }
}

function getNumRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) {
      result -= 36;
    }
  }
  return result;
}

function getNumDataCodewords(ver: number, ecl: ErrorCorrectionLevel): number {
  return (
    Math.floor(getNumRawDataModules(ver) / 8) -
    EC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver]
  );
}

function reedSolomonMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function reedSolomonComputeDivisor(degree: number): Uint8Array {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < degree) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    divisor.forEach((v, i) => {
      result[i] ^= reedSolomonMultiply(v, factor);
    });
  }
  return result;
}

function addEccAndInterleave(data: Uint8Array, ver: number, ecl: ErrorCorrectionLevel): Uint8Array {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][ver];
  const blockEccLen = EC_CODEWORDS_PER_BLOCK[ecl][ver];
  const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const blocks: Uint8Array[] = [];
  const rsDiv = reedSolomonComputeDivisor(blockEccLen);
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.subarray(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
    k += dat.length;
    const ecc = reedSolomonComputeRemainder(dat, rsDiv);
    if (i < numShortBlocks) {
      const block = new Uint8Array(shortBlockLen + 1);
      block.set(dat, 0);
      block.set(ecc, shortBlockLen - blockEccLen + 1);
      blocks.push(block);
    } else {
      const block = new Uint8Array(shortBlockLen + 1);
      block.set(dat, 0);
      block.set(ecc, shortBlockLen - blockEccLen + 1);
      blocks.push(block);
    }
  }

  const result = new Uint8Array(rawCodewords);
  for (let i = 0, k = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
        result[k] = block[i];
        k++;
      }
    });
  }
  return result;
}

function getAlignmentPatternPositions(ver: number): number[] {
  if (ver === 1) return [];
  const numAlign = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result: number[] = [6];
  for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

export function encodeQrMatrix(text: string, ecLevel: ErrorCorrectionLevel = 'M'): QrMatrixResult {
  const safeText = text && text.trim().length > 0 ? text : 'https://veranex.app';
  const utf8Bytes = new TextEncoder().encode(safeText);
  const dataLen = utf8Bytes.length;

  // 적절한 최소 Version (1 ~ 40) 탐색
  let version = 1;
  for (let v = 1; v <= 40; v++) {
    const capacityBits = getNumDataCodewords(v, ecLevel) * 8;
    const charCountBits = v <= 9 ? 8 : 16;
    const neededBits = 4 + charCountBits + dataLen * 8;
    if (neededBits <= capacityBits) {
      version = v;
      break;
    }
    if (v === 40) {
      throw new Error('입력된 데이터가 QR코드 최대 용량을 초과했습니다. 텍스트 길이를 줄이거나 복원 레벨을 낮춰주세요.');
    }
  }

  // 데이터 비트 스트림 생성 (Byte Mode = 0100)
  const bb: number[] = [];
  appendBits(0b0100, 4, bb);
  appendBits(dataLen, version <= 9 ? 8 : 16, bb);
  for (const b of utf8Bytes) {
    appendBits(b, 8, bb);
  }

  const dataCapacityBits = getNumDataCodewords(version, ecLevel) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - (bb.length % 8)) % 8, bb);

  for (let padByte = 0xec; bb.length < dataCapacityBits; padByte ^= 0xec ^ 0x11) {
    appendBits(padByte, 8, bb);
  }

  const dataCodewords = new Uint8Array(bb.length / 8);
  for (let i = 0; i < bb.length; i++) {
    dataCodewords[i >>> 3] |= bb[i] << (7 - (i & 7));
  }

  const allCodewords = addEccAndInterleave(dataCodewords, version, ecLevel);
  const size = version * 4 + 17;

  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (x: number, y: number, isDark: boolean) => {
    modules[y][x] = isDark;
    isFunction[y][x] = true;
  };

  // 1. 타이밍 패턴
  for (let i = 0; i < size; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // 2. 3개 코너 파인더 패턴 (7x7 + 1px separator)
  const drawFinderPattern = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = cx + dx;
        const yy = cy + dy;
        if (0 <= xx && xx < size && 0 <= yy && yy < size) {
          setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };
  drawFinderPattern(3, 3);
  drawFinderPattern(size - 4, 3);
  drawFinderPattern(3, size - 4);

  // 3. 얼라인먼트 패턴
  const alignPatPos = getAlignmentPatternPositions(version);
  const numAlign = alignPatPos.length;
  for (let i = 0; i < numAlign; i++) {
    for (let j = 0; j < numAlign; j++) {
      if (!((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))) {
        const cx = alignPatPos[i];
        const cy = alignPatPos[j];
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            setFunctionModule(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
          }
        }
      }
    }
  }

  // 4. 포맷 정보 영역 예약 & 다크 모듈
  const drawFormatBits = (mask: number) => {
    const data = (EC_FORMAT_BITS[ecLevel] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getBit(bits, i));
    setFunctionModule(8, 7, getBit(bits, 6));
    setFunctionModule(8, 8, getBit(bits, 7));
    setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getBit(bits, i));

    for (let i = 0; i < 8; i++) setFunctionModule(size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) setFunctionModule(8, size - 15 + i, getBit(bits, i));
    setFunctionModule(8, size - 8, true);
  };

  drawFormatBits(0);

  // 5. 버전 정보 (Version >= 7)
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, color);
      setFunctionModule(b, a, color);
    }
  }

  // 6. 지그재그 데이터 코드워드 배치
  let iBit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && iBit < allCodewords.length * 8) {
          modules[y][x] = getBit(allCodewords[iBit >>> 3], 7 - (iBit & 7));
          iBit++;
        }
      }
    }
  }

  // 7. 마스크 패턴(0~7) 적용 및 최소 페널티 마스크 선정
  const applyMask = (mask: number) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!isFunction[y][x]) {
          let invert = false;
          switch (mask) {
            case 0: invert = (x + y) % 2 === 0; break;
            case 1: invert = y % 2 === 0; break;
            case 2: invert = x % 3 === 0; break;
            case 3: invert = (x + y) % 3 === 0; break;
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
            case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
            case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          }
          if (invert) modules[y][x] = !modules[y][x];
        }
      }
    }
  };

  const getPenaltyScore = (): number => {
    let result = 0;
    // 인접 동일 색상 모듈 페널티
    for (let y = 0; y < size; y++) {
      let runColor = false;
      let runX = 0;
      for (let x = 0; x < size; x++) {
        if (x === 0 || modules[y][x] !== runColor) {
          runColor = modules[y][x];
          runX = 1;
        } else {
          runX++;
          if (runX === 5) result += 3;
          else if (runX > 5) result++;
        }
      }
    }
    for (let x = 0; x < size; x++) {
      let runColor = false;
      let runY = 0;
      for (let y = 0; y < size; y++) {
        if (y === 0 || modules[y][x] !== runColor) {
          runColor = modules[y][x];
          runY = 1;
        } else {
          runY++;
          if (runY === 5) result += 3;
          else if (runY > 5) result++;
        }
      }
    }
    // 2x2 블록 페널티
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
          result += 3;
        }
      }
    }
    return result;
  };

  let bestMask = 0;
  let minPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m);
    drawFormatBits(m);
    const penalty = getPenaltyScore();
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestMask = m;
    }
    applyMask(m); // 원복
  }

  applyMask(bestMask);
  drawFormatBits(bestMask);

  return {
    modules,
    isFunction,
    size,
    version,
    ecLevel,
    byteLength: dataLen,
    mask: bestMask,
  };
}

/**
 * 파인더 패턴(좌상, 우상, 좌하 7x7 코너) 내부 영역 판별 헬퍼
 */
export function isFinderPatternModule(x: number, y: number, matrixSize: number): boolean {
  const inTopLeft = x >= 0 && x < 7 && y >= 0 && y < 7;
  const inTopRight = x >= matrixSize - 7 && x < matrixSize && y >= 0 && y < 7;
  const inBottomLeft = x >= 0 && x < 7 && y >= matrixSize - 7 && y < matrixSize;
  return inTopLeft || inTopRight || inBottomLeft;
}
