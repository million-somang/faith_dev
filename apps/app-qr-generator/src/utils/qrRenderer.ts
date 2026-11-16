import {
  CenterBadgeType,
  DotStyle,
  EyeStyle,
  QrDesignSettings,
  QrMatrixResult,
} from '../types';
import { isFinderPatternModule } from './qrMatrixEncoder';

/**
 * 두 HEX 컬러 간 명암 대비율(WCAG Contrast Ratio) 계산
 * QR 스캐너 인식률 보장 여부를 실시간 진단합니다.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const getLum = (hex: string): number => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2) || '00', 16) / 255;
    const g = parseInt(clean.substring(2, 4) || '00', 16) / 255;
    const b = parseInt(clean.substring(4, 6) || '00', 16) / 255;
    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLum(hex1);
  const l2 = getLum(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 10) / 10;
}

const BADGE_EMOJI_MAP: Record<Exclude<CenterBadgeType, 'none' | 'custom'>, string> = {
  link: '🔗',
  wifi: '📶',
  vcard: '👤',
  message: '💬',
  star: '⭐',
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
}

function drawFinderEyeCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  cellSize: number,
  eyeStyle: EyeStyle,
  fgColor: string,
  bgColor: string
) {
  const outerSize = cellSize * 7;
  const middleSize = cellSize * 5;
  const innerSize = cellSize * 3;

  const outerRadius =
    eyeStyle === 'circle' ? outerSize / 2 : eyeStyle === 'rounded' ? cellSize * 1.8 : 0;
  const middleRadius =
    eyeStyle === 'circle' ? middleSize / 2 : eyeStyle === 'rounded' ? cellSize * 1.2 : 0;
  const innerRadius =
    eyeStyle === 'circle' ? innerSize / 2 : eyeStyle === 'rounded' ? cellSize * 0.8 : 0;

  ctx.fillStyle = fgColor;
  drawRoundedRect(ctx, startX, startY, outerSize, outerSize, outerRadius);

  ctx.fillStyle = bgColor;
  drawRoundedRect(
    ctx,
    startX + cellSize,
    startY + cellSize,
    middleSize,
    middleSize,
    middleRadius
  );

  ctx.fillStyle = fgColor;
  drawRoundedRect(
    ctx,
    startX + cellSize * 2,
    startY + cellSize * 2,
    innerSize,
    innerSize,
    innerRadius
  );
}

/**
 * HTML5 Canvas에 고해상도 QR 코드 및 선택적 안내 프레임/중앙 로고를 렌더링합니다.
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  matrix: QrMatrixResult,
  settings: QrDesignSettings
): Promise<void> {
  const qrPixelSize = settings.size;
  const hasFrame = settings.showFrameLabel && (settings.frameTitle.trim() || settings.frameSubtitle.trim());
  const frameHeaderHeight = hasFrame ? Math.round(qrPixelSize * 0.16) : 0;
  const frameFooterHeight = hasFrame && settings.frameSubtitle.trim() ? Math.round(qrPixelSize * 0.11) : 0;
  const framePadding = hasFrame ? Math.round(qrPixelSize * 0.05) : 0;

  const totalWidth = qrPixelSize + framePadding * 2;
  const totalHeight = qrPixelSize + frameHeaderHeight + frameFooterHeight + framePadding * 2;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. 전체 배경 렌더링
  ctx.fillStyle = settings.bgColor;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  if (hasFrame) {
    ctx.strokeStyle = settings.fgColor + '22';
    ctx.lineWidth = Math.max(2, Math.round(qrPixelSize * 0.006));
    ctx.strokeRect(
      ctx.lineWidth / 2,
      ctx.lineWidth / 2,
      totalWidth - ctx.lineWidth,
      totalHeight - ctx.lineWidth
    );

    // 상단 프레임 타이틀
    if (settings.frameTitle.trim()) {
      ctx.fillStyle = settings.fgColor;
      ctx.font = `900 ${Math.round(qrPixelSize * 0.058)}px Pretendard, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        settings.frameTitle.trim(),
        totalWidth / 2,
        framePadding + frameHeaderHeight * 0.55
      );
    }
  }

  const qrOffsetX = framePadding;
  const qrOffsetY = framePadding + frameHeaderHeight;

  const totalModules = matrix.size + settings.margin * 2;
  const cellSize = qrPixelSize / totalModules;
  const marginPx = settings.margin * cellSize;

  // 중앙 배지 영역 계산 (배지가 활성화된 경우 중앙 모듈 비움)
  const hasCenterBadge =
    settings.centerBadge !== 'none' &&
    (settings.centerBadge !== 'custom' || Boolean(settings.customLogoDataUrl));
  const centerRatio = 0.21;
  const centerModuleSpan = hasCenterBadge ? Math.ceil(matrix.size * centerRatio) : 0;
  const centerMin = Math.floor((matrix.size - centerModuleSpan) / 2);
  const centerMax = centerMin + centerModuleSpan - 1;

  // 2. 3개 코너 파인더(Eye) 렌더링
  drawFinderEyeCanvas(
    ctx,
    qrOffsetX + marginPx,
    qrOffsetY + marginPx,
    cellSize,
    settings.eyeStyle,
    settings.fgColor,
    settings.bgColor
  );
  drawFinderEyeCanvas(
    ctx,
    qrOffsetX + marginPx + (matrix.size - 7) * cellSize,
    qrOffsetY + marginPx,
    cellSize,
    settings.eyeStyle,
    settings.fgColor,
    settings.bgColor
  );
  drawFinderEyeCanvas(
    ctx,
    qrOffsetX + marginPx,
    qrOffsetY + marginPx + (matrix.size - 7) * cellSize,
    cellSize,
    settings.eyeStyle,
    settings.fgColor,
    settings.bgColor
  );

  // 3. 일반 데이터 모듈 렌더링
  ctx.fillStyle = settings.fgColor;
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.modules[y][x]) continue;
      if (isFinderPatternModule(x, y, matrix.size)) continue;
      if (hasCenterBadge && x >= centerMin && x <= centerMax && y >= centerMin && y <= centerMax) {
        continue;
      }

      const px = qrOffsetX + marginPx + x * cellSize;
      const py = qrOffsetY + marginPx + y * cellSize;

      if (settings.dotStyle === 'dots') {
        const r = (cellSize * 0.88) / 2;
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (settings.dotStyle === 'rounded') {
        drawRoundedRect(ctx, px + cellSize * 0.04, py + cellSize * 0.04, cellSize * 0.92, cellSize * 0.92, cellSize * 0.34);
      } else {
        // square (미세 오버랩으로 인쇄 시 흰 줄 방지)
        ctx.fillRect(px, py, Math.ceil(cellSize), Math.ceil(cellSize));
      }
    }
  }

  // 4. 중앙 로고 / 배지 렌더링
  if (hasCenterBadge) {
    const badgeBoxSize = qrPixelSize * 0.19;
    const badgeX = qrOffsetX + (qrPixelSize - badgeBoxSize) / 2;
    const badgeY = qrOffsetY + (qrPixelSize - badgeBoxSize) / 2;

    // 배경 카드
    ctx.fillStyle = settings.bgColor;
    drawRoundedRect(
      ctx,
      badgeX - cellSize * 0.6,
      badgeY - cellSize * 0.6,
      badgeBoxSize + cellSize * 1.2,
      badgeBoxSize + cellSize * 1.2,
      badgeBoxSize * 0.28
    );

    // 테두리
    ctx.strokeStyle = settings.fgColor;
    ctx.lineWidth = Math.max(2, cellSize * 0.32);
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeBoxSize, badgeBoxSize, badgeBoxSize * 0.24);
    ctx.stroke();

    if (settings.centerBadge === 'custom' && settings.customLogoDataUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const pad = badgeBoxSize * 0.12;
          ctx.drawImage(
            img,
            badgeX + pad,
            badgeY + pad,
            badgeBoxSize - pad * 2,
            badgeBoxSize - pad * 2
          );
          resolve();
        };
        img.onerror = () => resolve();
        img.src = settings.customLogoDataUrl!;
      });
    } else if (settings.centerBadge !== 'custom' && settings.centerBadge !== 'none') {
      const emoji = BADGE_EMOJI_MAP[settings.centerBadge];
      ctx.font = `${Math.round(badgeBoxSize * 0.56)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = settings.fgColor;
      ctx.fillText(emoji, qrOffsetX + qrPixelSize / 2, qrOffsetY + qrPixelSize / 2 + badgeBoxSize * 0.03);
    }
  }

  // 5. 하단 프레임 서브타이틀
  if (hasFrame && settings.frameSubtitle.trim()) {
    ctx.fillStyle = settings.fgColor + 'CC';
    ctx.font = `700 ${Math.round(qrPixelSize * 0.036)}px Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      settings.frameSubtitle.trim(),
      totalWidth / 2,
      qrOffsetY + qrPixelSize + frameFooterHeight * 0.5
    );
  }
}

/**
 * 인쇄·디자인 프로그램용 순수 벡터 SVG 코드 문자열을 생성합니다.
 */
export function renderQrToSvgString(
  matrix: QrMatrixResult,
  settings: QrDesignSettings
): string {
  const qrPixelSize = settings.size;
  const totalModules = matrix.size + settings.margin * 2;
  const cellSize = qrPixelSize / totalModules;
  const marginPx = settings.margin * cellSize;

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const elements: string[] = [];
  elements.push(
    `<rect width="100%" height="100%" fill="${escapeXml(settings.bgColor)}" />`
  );

  const renderEyeSvg = (startX: number, startY: number) => {
    const outerSize = cellSize * 7;
    const middleSize = cellSize * 5;
    const innerSize = cellSize * 3;
    const outerR =
      settings.eyeStyle === 'circle'
        ? outerSize / 2
        : settings.eyeStyle === 'rounded'
        ? cellSize * 1.8
        : 0;
    const middleR =
      settings.eyeStyle === 'circle'
        ? middleSize / 2
        : settings.eyeStyle === 'rounded'
        ? cellSize * 1.2
        : 0;
    const innerR =
      settings.eyeStyle === 'circle'
        ? innerSize / 2
        : settings.eyeStyle === 'rounded'
        ? cellSize * 0.8
        : 0;

    elements.push(
      `<rect x="${startX.toFixed(2)}" y="${startY.toFixed(2)}" width="${outerSize.toFixed(2)}" height="${outerSize.toFixed(2)}" rx="${outerR.toFixed(2)}" fill="${escapeXml(settings.fgColor)}" />`
    );
    elements.push(
      `<rect x="${(startX + cellSize).toFixed(2)}" y="${(startY + cellSize).toFixed(2)}" width="${middleSize.toFixed(2)}" height="${middleSize.toFixed(2)}" rx="${middleR.toFixed(2)}" fill="${escapeXml(settings.bgColor)}" />`
    );
    elements.push(
      `<rect x="${(startX + cellSize * 2).toFixed(2)}" y="${(startY + cellSize * 2).toFixed(2)}" width="${innerSize.toFixed(2)}" height="${innerSize.toFixed(2)}" rx="${innerR.toFixed(2)}" fill="${escapeXml(settings.fgColor)}" />`
    );
  };

  renderEyeSvg(marginPx, marginPx);
  renderEyeSvg(marginPx + (matrix.size - 7) * cellSize, marginPx);
  renderEyeSvg(marginPx, marginPx + (matrix.size - 7) * cellSize);

  const hasCenterBadge =
    settings.centerBadge !== 'none' &&
    (settings.centerBadge !== 'custom' || Boolean(settings.customLogoDataUrl));
  const centerModuleSpan = hasCenterBadge ? Math.ceil(matrix.size * 0.21) : 0;
  const centerMin = Math.floor((matrix.size - centerModuleSpan) / 2);
  const centerMax = centerMin + centerModuleSpan - 1;

  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.modules[y][x]) continue;
      if (isFinderPatternModule(x, y, matrix.size)) continue;
      if (hasCenterBadge && x >= centerMin && x <= centerMax && y >= centerMin && y <= centerMax) {
        continue;
      }

      const px = marginPx + x * cellSize;
      const py = marginPx + y * cellSize;

      if (settings.dotStyle === 'dots') {
        const r = (cellSize * 0.88) / 2;
        elements.push(
          `<circle cx="${(px + cellSize / 2).toFixed(2)}" cy="${(py + cellSize / 2).toFixed(2)}" r="${r.toFixed(2)}" fill="${escapeXml(settings.fgColor)}" />`
        );
      } else if (settings.dotStyle === 'rounded') {
        const s = cellSize * 0.92;
        const r = cellSize * 0.34;
        elements.push(
          `<rect x="${(px + cellSize * 0.04).toFixed(2)}" y="${(py + cellSize * 0.04).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" rx="${r.toFixed(2)}" fill="${escapeXml(settings.fgColor)}" />`
        );
      } else {
        elements.push(
          `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${(cellSize + 0.35).toFixed(2)}" height="${(cellSize + 0.35).toFixed(2)}" fill="${escapeXml(settings.fgColor)}" />`
        );
      }
    }
  }

  if (hasCenterBadge && settings.centerBadge !== 'custom' && settings.centerBadge !== 'none') {
    const badgeBoxSize = qrPixelSize * 0.19;
    const badgeX = (qrPixelSize - badgeBoxSize) / 2;
    const badgeY = (qrPixelSize - badgeBoxSize) / 2;
    const emoji = BADGE_EMOJI_MAP[settings.centerBadge];
    elements.push(
      `<rect x="${badgeX.toFixed(2)}" y="${badgeY.toFixed(2)}" width="${badgeBoxSize.toFixed(2)}" height="${badgeBoxSize.toFixed(2)}" rx="${(badgeBoxSize * 0.24).toFixed(2)}" fill="${escapeXml(settings.bgColor)}" stroke="${escapeXml(settings.fgColor)}" stroke-width="${Math.max(2, cellSize * 0.32).toFixed(2)}" />`
    );
    elements.push(
      `<text x="${(qrPixelSize / 2).toFixed(2)}" y="${(qrPixelSize / 2 + badgeBoxSize * 0.18).toFixed(2)}" font-size="${Math.round(badgeBoxSize * 0.52)}" text-anchor="middle">${emoji}</text>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qrPixelSize} ${qrPixelSize}" width="${qrPixelSize}" height="${qrPixelSize}">\n  ${elements.join('\n  ')}\n</svg>`;
}
