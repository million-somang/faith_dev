export interface CardDesignOptions {
    title: string;
    subtitle: string;
    tag?: string;
    domain?: string;
    slug?: string;
    screenshots?: string[]; // 최소 3개 이상의 실행 화면 이미지 배열
    screenshotUri?: string; // 단일 호환용
    slideIndex?: number; // 1: 시작, 2: 조작, 3: 결과
}

/**
 * FaithPortal Clean Neumorphism 디자인 시스템 기반
 * 미니앱 실화면 1:1 고해상도 카드뉴스 렌더러
 */
export function generateCardSvg(options: CardDesignOptions): string {
    const slide = options.slideIndex || 1;
    if (slide === 2) {
        return generateSlide2(options);
    } else if (slide === 3) {
        return generateSlide3(options);
    }
    return generateSlide1(options);
}

function resolveScreenshots(options: CardDesignOptions): [string, string, string] {
    const list = options.screenshots || [];
    const fallback = options.screenshotUri || '';
    const img1 = list[0] || fallback;
    const img2 = list[1] || img1;
    const img3 = list[2] || img2;
    return [img1, img2, img3];
}

/**
 * [Slide 1] Screen 1 전용 뷰 (메인 시작/입력 화면을 1080x1080 캔버스 중앙에 단독 풀사이즈 노출)
 */
function generateSlide1(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '베라넥스 스마트 유틸리티');
    const subtitle = escapeXml(options.subtitle || '로그인 없이 브라우저에서 즉시 실행');
    const tag = escapeXml(options.tag || '무료 도구');
    const domain = escapeXml(options.domain || 'veranex.app');
    const [img1] = resolveScreenshots(options);

    const titleLines = wrapText(title, 20);
    const titleTspans = titleLines.map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 50}">${line}</tspan>`).join('');

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="50%" stop-color="#EEF2F6" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <linearGradient id="accentGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <filter id="phoneShadow1" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="28" flood-color="#0F172A" flood-opacity="0.20" />
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#4F46E5" flood-opacity="0.10" />
    </filter>
    <clipPath id="clipPhone1">
      <rect x="0" y="0" width="460" height="740" rx="36" />
    </clipPath>
  </defs>

  <!-- Clean Neumorphic Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad1)" />
  <circle cx="180" cy="180" r="300" fill="#E0E7FF" opacity="0.6" filter="blur(60px)" />
  <circle cx="900" cy="900" r="320" fill="#EDE9FE" opacity="0.6" filter="blur(60px)" />

  <!-- HEADER -->
  <g transform="translate(80, 55)">
    <rect x="0" y="0" width="160" height="42" rx="21" fill="#FFFFFF" />
    <circle cx="24" cy="21" r="11" fill="url(#accentGrad1)" />
    <text x="24" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="44" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#0F172A">${domain}</text>

    <rect x="740" y="0" width="180" height="42" rx="21" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1.5" />
    <text x="830" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#4F46E5" text-anchor="middle">✨ ${tag}</text>

    <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="42" font-weight="900" fill="#0F172A" letter-spacing="-0.03em">
      ${titleTspans}
    </text>
    <text x="0" y="${96 + titleLines.length * 48}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" fill="#64748B">
      ${subtitle}
    </text>
  </g>

  <!-- PROMINENT SINGLE SCREEN (Screen 1) -->
  <g transform="translate(310, 260)" filter="url(#phoneShadow1)">
    <rect x="-12" y="-12" width="484" height="764" rx="46" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5" />
    <rect x="0" y="0" width="460" height="740" rx="36" fill="#F8FAFC" />
    <g clip-path="url(#clipPhone1)">
      ${img1 ? `
        <image href="${img1}" x="0" y="0" width="460" height="740" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="460" height="740" fill="#F1F5F9" />
        <text x="230" y="370" font-family="sans-serif" font-size="18" fill="#94A3B8" text-anchor="middle">시작 화면 1</text>
      `}
    </g>
    <!-- Screen 1 Tag Badge -->
    <rect x="20" y="20" width="120" height="34" rx="17" fill="#0F172A" opacity="0.85" />
    <text x="80" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">1. 시작 · 입력</text>
  </g>

  <!-- Bottom Indicator -->
  <g transform="translate(80, 1025)">
    <rect x="0" y="0" width="36" height="8" rx="4" fill="#4F46E5" />
    <rect x="44" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="64" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <text x="920" y="9" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">1 / 3</text>
  </g>
</svg>
    `.trim();
}

/**
 * [Slide 2] Screen 2 전용 뷰 (실제 조작/실행/플레이 화면을 1080x1080 캔버스 중앙에 단독 풀사이즈 노출)
 */
function generateSlide2(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '실시간 조작 및 기능 실행');
    const tag = escapeXml(options.tag || '핵심 기능');
    const domain = escapeXml(options.domain || 'veranex.app');
    const [, img2] = resolveScreenshots(options);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="50%" stop-color="#EEF2F6" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <filter id="phoneShadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="28" flood-color="#0F172A" flood-opacity="0.20" />
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#059669" flood-opacity="0.10" />
    </filter>
    <clipPath id="clipPhone2">
      <rect x="0" y="0" width="460" height="740" rx="36" />
    </clipPath>
  </defs>

  <rect width="1080" height="1080" fill="url(#bgGrad2)" />
  <circle cx="180" cy="180" r="300" fill="#D1FAE5" opacity="0.5" filter="blur(60px)" />
  <circle cx="900" cy="900" r="320" fill="#E0F2FE" opacity="0.5" filter="blur(60px)" />

  <!-- HEADER -->
  <g transform="translate(80, 55)">
    <rect x="0" y="0" width="160" height="42" rx="21" fill="#FFFFFF" />
    <circle cx="24" cy="21" r="11" fill="#059669" />
    <text x="24" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="44" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#0F172A">${domain}</text>

    <rect x="740" y="0" width="180" height="42" rx="21" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5" />
    <text x="830" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#059669" text-anchor="middle">⚡ ${tag}</text>

    <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="42" font-weight="900" fill="#0F172A">
      실시간 조작 및 기능 실행
    </text>
    <text x="0" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" fill="#64748B">
      별도 설치 없이 손쉬운 인터랙션으로 즉시 분석
    </text>
  </g>

  <!-- PROMINENT SINGLE SCREEN (Screen 2) -->
  <g transform="translate(310, 260)" filter="url(#phoneShadow2)">
    <rect x="-12" y="-12" width="484" height="764" rx="46" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="2.5" />
    <rect x="0" y="0" width="460" height="740" rx="36" fill="#F8FAFC" />
    <g clip-path="url(#clipPhone2)">
      ${img2 ? `
        <image href="${img2}" x="0" y="0" width="460" height="740" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="460" height="740" fill="#F1F5F9" />
        <text x="230" y="370" font-family="sans-serif" font-size="18" fill="#94A3B8" text-anchor="middle">실행 화면 2</text>
      `}
    </g>
    <!-- Screen 2 Tag Badge -->
    <rect x="20" y="20" width="130" height="34" rx="17" fill="#059669" opacity="0.9" />
    <text x="85" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">2. 실시간 조작</text>
  </g>

  <!-- Bottom Indicator -->
  <g transform="translate(80, 1025)">
    <rect x="0" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="20" y="0" width="36" height="8" rx="4" fill="#059669" />
    <rect x="64" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <text x="920" y="9" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">2 / 3</text>
  </g>
</svg>
    `.trim();
}

/**
 * [Slide 3] Screen 3 전용 뷰 (최종 결과/산출/가이드 화면을 1080x1080 캔버스 중앙에 단독 풀사이즈 노출 + 바로가기)
 */
function generateSlide3(options: CardDesignOptions): string {
    const tag = escapeXml(options.tag || '결과 확인');
    const domain = escapeXml(options.domain || 'veranex.app');
    const slug = escapeXml(options.slug || 'app');
    const [, , img3] = resolveScreenshots(options);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="50%" stop-color="#EEF2F6" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <filter id="phoneShadow3" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="28" flood-color="#0F172A" flood-opacity="0.20" />
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#D97706" flood-opacity="0.10" />
    </filter>
    <clipPath id="clipPhone3">
      <rect x="0" y="0" width="460" height="680" rx="36" />
    </clipPath>
  </defs>

  <rect width="1080" height="1080" fill="url(#bgGrad3)" />
  <circle cx="180" cy="180" r="300" fill="#FEF3C7" opacity="0.5" filter="blur(60px)" />
  <circle cx="900" cy="900" r="320" fill="#FDE68A" opacity="0.4" filter="blur(60px)" />

  <!-- HEADER -->
  <g transform="translate(80, 55)">
    <rect x="0" y="0" width="160" height="42" rx="21" fill="#FFFFFF" />
    <circle cx="24" cy="21" r="11" fill="#D97706" />
    <text x="24" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="44" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#0F172A">${domain}</text>

    <rect x="740" y="0" width="180" height="42" rx="21" fill="#FEF3C7" stroke="#FDE68A" stroke-width="1.5" />
    <text x="830" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#B45309" text-anchor="middle">🎯 ${tag}</text>

    <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="42" font-weight="900" fill="#0F172A">
      최종 산출 결과 및 가이드
    </text>
    <text x="0" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" fill="#64748B">
      지금 브라우저 주소창에서 바로 무료로 실행해보세요
    </text>
  </g>

  <!-- PROMINENT SINGLE SCREEN (Screen 3) -->
  <g transform="translate(310, 240)" filter="url(#phoneShadow3)">
    <rect x="-12" y="-12" width="484" height="704" rx="46" fill="#FFFFFF" stroke="#FDE68A" stroke-width="2.5" />
    <rect x="0" y="0" width="460" height="680" rx="36" fill="#F8FAFC" />
    <g clip-path="url(#clipPhone3)">
      ${img3 ? `
        <image href="${img3}" x="0" y="0" width="460" height="680" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="460" height="680" fill="#F1F5F9" />
        <text x="230" y="340" font-family="sans-serif" font-size="18" fill="#94A3B8" text-anchor="middle">결과 화면 3</text>
      `}
    </g>
    <!-- Screen 3 Tag Badge -->
    <rect x="20" y="20" width="130" height="34" rx="17" fill="#D97706" opacity="0.9" />
    <text x="85" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">3. 최종 결과</text>
  </g>

  <!-- CTA URL BAR (Bottom) -->
  <g transform="translate(180, 955)">
    <rect width="720" height="54" rx="27" fill="#0F172A" />
    <text x="360" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="19" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      👉 https://${domain}/app/${slug} 바로가기
    </text>
  </g>

  <!-- Bottom Indicator -->
  <g transform="translate(80, 1025)">
    <rect x="0" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="20" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="40" y="0" width="36" height="8" rx="4" fill="#D97706" />
    <text x="920" y="9" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">3 / 3</text>
  </g>
</svg>
    `.trim();
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines.slice(0, 3);
}
