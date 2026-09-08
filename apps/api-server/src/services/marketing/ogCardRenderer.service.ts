export interface CardDesignOptions {
    title: string;
    subtitle: string;
    tag?: string;
    domain?: string;
    slug?: string;
    screenshotUri?: string; // base64 data URI 또는 정적 이미지 URL
    slideIndex?: number; // 1: 메인 커버, 2: 기능 디테일, 3: CTA 바로가기
}

/**
 * FaithPortal 미니앱 디자인 시스템(Clean Neumorphism) 기반 1080x1080 고해상도 카드뉴스 SVG 생성
 * 다크 테마 완전 배제, 밝은 배경 + 대형 모바일 목업 실화면 80% 비중
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

/**
 * [Slide 1] 메인 커버: 후킹 카피 + 대형 스마트폰 목업 실화면 (비주얼 80%)
 */
function generateSlide1(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '베라넥스 스마트 유틸리티');
    const subtitle = escapeXml(options.subtitle || '로그인 없이 브라우저에서 즉시 실행');
    const tag = escapeXml(options.tag || '무료 도구');
    const domain = escapeXml(options.domain || 'veranex.app');
    const screenshot = options.screenshotUri || '';

    const titleLines = wrapText(title, 18);
    const titleTspans = titleLines.map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 54}">${line}</tspan>`).join('');

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <!-- Light Neumorphic Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="50%" stop-color="#EEF2F6" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>

    <!-- Accent Gradient -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>

    <!-- Soft Phone Mockup 3D Shadow -->
    <filter id="phoneShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="30" flood-color="#0F172A" flood-opacity="0.18" />
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#4F46E5" flood-opacity="0.08" />
    </filter>

    <!-- Card Soft Shadow -->
    <filter id="softPillShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.06" />
    </filter>

    <!-- Rounded Screen Clip for Phone View -->
    <clipPath id="phoneScreenClip">
      <rect x="0" y="0" width="560" height="820" rx="36" />
    </clipPath>
  </defs>

  <!-- Clean Neumorphic Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad)" />

  <!-- Subtle Ambient Glow Orbs (Light & Airy) -->
  <circle cx="200" cy="180" r="320" fill="#E0E7FF" opacity="0.6" filter="blur(60px)" />
  <circle cx="920" cy="880" r="360" fill="#EDE9FE" opacity="0.6" filter="blur(60px)" />

  <!-- Subtle Grid Texture -->
  <g opacity="0.04" stroke="#0F172A" stroke-width="1.2">
    <line x1="0" y1="120" x2="1080" y2="120" />
    <line x1="0" y1="240" x2="1080" y2="240" />
    <line x1="0" y1="360" x2="1080" y2="360" />
    <line x1="0" y1="480" x2="1080" y2="480" />
    <line x1="0" y1="600" x2="1080" y2="600" />
    <line x1="0" y1="720" x2="1080" y2="720" />
    <line x1="0" y1="840" x2="1080" y2="840" />
    <line x1="0" y1="960" x2="1080" y2="960" />
    <line x1="120" y1="0" x2="120" y2="1080" />
    <line x1="240" y1="0" x2="240" y2="1080" />
    <line x1="360" y1="0" x2="360" y2="1080" />
    <line x1="480" y1="0" x2="480" y2="1080" />
    <line x1="600" y1="0" x2="600" y2="1080" />
    <line x1="720" y1="0" x2="720" y2="1080" />
    <line x1="840" y1="0" x2="840" y2="1080" />
    <line x1="960" y1="0" x2="960" y2="1080" />
  </g>

  <!-- ==================== HEADER (TOP 20%) ==================== -->
  <g transform="translate(70, 70)">
    <!-- Brand Logo Pill -->
    <rect x="0" y="0" width="160" height="44" rx="22" fill="#FFFFFF" filter="url(#softPillShadow)" />
    <circle cx="24" cy="22" r="12" fill="url(#accentGrad)" />
    <text x="24" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="44" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">${domain}</text>

    <!-- Tag Badge -->
    <rect x="760" y="0" width="180" height="44" rx="22" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1.5" />
    <text x="850" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#4F46E5" text-anchor="middle">✨ ${tag}</text>

    <!-- Punchy Headline -->
    <text x="0" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="44" font-weight="900" fill="#0F172A" letter-spacing="-0.03em">
      ${titleTspans}
    </text>

    <!-- Subtitle -->
    <text x="0" y="${108 + titleLines.length * 52}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="22" font-weight="600" fill="#64748B">
      ${subtitle}
    </text>
  </g>

  <!-- ==================== MAIN VISUAL: 3D DEVICE MOCKUP (80% AREA) ==================== -->
  <g transform="translate(260, 275)" filter="url(#phoneShadow)">
    <!-- Outer Device Bezel (Silver / White Glass) -->
    <rect x="-14" y="-14" width="588" height="848" rx="50" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5" />

    <!-- Inner Screen Frame -->
    <rect x="0" y="0" width="560" height="820" rx="36" fill="#F8FAFC" />

    <!-- Actual Mini-App Live Screenshot Image -->
    <g clip-path="url(#phoneScreenClip)">
      ${screenshot ? `
        <image href="${screenshot}" x="0" y="0" width="560" height="820" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="560" height="820" fill="#F1F5F9" />
        <text x="280" y="410" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="700" fill="#94A3B8" text-anchor="middle">앱 실행 화면 미리보기</text>
      `}
    </g>

    <!-- Dynamic Island / Speaker Notch -->
    <rect x="205" y="14" width="150" height="30" rx="15" fill="#0F172A" opacity="0.95" />
    <circle cx="320" cy="29" r="6" fill="#1E293B" />
  </g>

  <!-- Floating Feature Chips On Left & Right for Depth -->
  <!-- Floating Chip 1 (Left) -->
  <g transform="translate(70, 480)" filter="url(#phoneShadow)">
    <rect width="210" height="66" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
    <circle cx="34" cy="33" r="16" fill="#ECFDF5" />
    <text x="34" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" text-anchor="middle">⚡</text>
    <text x="62" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#0F172A">즉시 실행</text>
    <text x="62" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="500" fill="#10B981">설치/가입 없음</text>
  </g>

  <!-- Floating Chip 2 (Left Lower) -->
  <g transform="translate(70, 580)" filter="url(#phoneShadow)">
    <rect width="210" height="66" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
    <circle cx="34" cy="33" r="16" fill="#EEF2FF" />
    <text x="34" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" text-anchor="middle">🎁</text>
    <text x="62" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#0F172A">100% 무료</text>
    <text x="62" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="500" fill="#4F46E5">제한 없는 이용</text>
  </g>

  <!-- Floating CTA Chip (Right Lower) -->
  <g transform="translate(780, 890)" filter="url(#phoneShadow)">
    <rect width="230" height="64" rx="32" fill="url(#accentGrad)" />
    <text x="115" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="800" fill="#FFFFFF" text-anchor="middle">
      지금 사용해보기 👉
    </text>
  </g>

  <!-- Bottom Mini Slide Indicator -->
  <g transform="translate(70, 1010)">
    <rect x="0" y="0" width="36" height="8" rx="4" fill="#4F46E5" />
    <rect x="44" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="64" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <text x="940" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">1 / 3</text>
  </g>
</svg>
    `.trim();
}

/**
 * [Slide 2] 기능 집중: 실제 화면 줌인 뷰 + 특장점 하이라이트
 */
function generateSlide2(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '핵심 기능 살펴보기');
    const tag = escapeXml(options.tag || '실시간 확인');
    const domain = escapeXml(options.domain || 'veranex.app');
    const screenshot = options.screenshotUri || '';

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <linearGradient id="accentGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <filter id="softShadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="#0F172A" flood-opacity="0.12" />
    </filter>
    <clipPath id="zoomClip">
      <rect x="0" y="0" width="820" height="660" rx="32" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad2)" />

  <!-- Header -->
  <g transform="translate(70, 70)">
    <rect x="0" y="0" width="160" height="44" rx="22" fill="#FFFFFF" />
    <circle cx="24" cy="22" r="12" fill="url(#accentGrad2)" />
    <text x="24" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="44" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">${domain}</text>

    <rect x="760" y="0" width="180" height="44" rx="22" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1.5" />
    <text x="850" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#4F46E5" text-anchor="middle">🔍 ${tag}</text>

    <text x="0" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="44" font-weight="900" fill="#0F172A">
      이렇게 간편하게 동작합니다
    </text>
    <text x="0" y="142" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="22" font-weight="600" fill="#64748B">
      ${title}의 실제 구동 화면 및 산출 결과
    </text>
  </g>

  <!-- Main Zoomed Screenshot Mockup (Centered & Huge) -->
  <g transform="translate(130, 240)" filter="url(#softShadow2)">
    <!-- Window Frame -->
    <rect x="-10" y="-40" width="840" height="710" rx="36" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
    <!-- Window Controls -->
    <circle cx="20" cy="-16" r="7" fill="#EF4444" />
    <circle cx="42" cy="-16" r="7" fill="#F59E0B" />
    <circle cx="64" cy="-16" r="7" fill="#10B981" />
    <text x="410" y="-10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#64748B" text-anchor="middle">실제 실행 화면</text>

    <!-- Screenshot Clipped -->
    <g clip-path="url(#zoomClip)">
      ${screenshot ? `
        <image href="${screenshot}" x="0" y="-60" width="820" height="1100" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="820" height="660" fill="#F1F5F9" />
        <text x="410" y="330" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="24" font-weight="700" fill="#94A3B8" text-anchor="middle">고해상도 실화면 줌인</text>
      `}
    </g>
  </g>

  <!-- Bottom Indicator -->
  <g transform="translate(70, 1010)">
    <rect x="0" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="20" y="0" width="36" height="8" rx="4" fill="#4F46E5" />
    <rect x="64" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <text x="940" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">2 / 3</text>
  </g>
</svg>
    `.trim();
}

/**
 * [Slide 3] 이용 안내 & CTA: 브라우저 주소창 목업 + 즉시 실행 안내
 */
function generateSlide3(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '베라넥스 스마트 유틸리티');
    const slug = escapeXml(options.slug || 'app');
    const domain = escapeXml(options.domain || 'veranex.app');
    const screenshot = options.screenshotUri || '';

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EEF2F6" />
    </linearGradient>
    <linearGradient id="accentGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <filter id="softShadow3" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="#0F172A" flood-opacity="0.1" />
    </filter>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="380" height="520" rx="28" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad3)" />

  <!-- Center Card -->
  <g transform="translate(140, 100)" filter="url(#softShadow3)">
    <rect width="800" height="840" rx="40" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />

    <!-- Top Badge -->
    <rect x="300" y="44" width="200" height="44" rx="22" fill="#EEF2FF" />
    <text x="400" y="71" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#4F46E5" text-anchor="middle">⚡ NO 회원가입 · 100% 무료</text>

    <!-- Main Title -->
    <text x="400" y="150" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="44" font-weight="900" fill="#0F172A" text-anchor="middle">
      지금 바로 사용해보세요
    </text>
    <text x="400" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" fill="#64748B" text-anchor="middle">
      별도 앱 설치 없이 모바일/PC 브라우저에서 1초 만에 실행
    </text>

    <!-- App Mini Preview Card Inside -->
    <g transform="translate(210, 240)" filter="url(#softShadow3)">
      <rect x="-10" y="-10" width="400" height="540" rx="32" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2" />
      <g clip-path="url(#cardClip)">
        ${screenshot ? `
          <image href="${screenshot}" x="0" y="0" width="380" height="520" preserveAspectRatio="xMidYMin slice" />
        ` : `
          <rect width="380" height="520" fill="#F1F5F9" />
          <text x="190" y="260" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="700" fill="#94A3B8" text-anchor="middle">미니앱 실행 화면</text>
        `}
      </g>
    </g>

    <!-- Address Bar Button -->
    <g transform="translate(100, 680)">
      <rect width="600" height="76" rx="24" fill="#0F172A" />
      <text x="300" y="46" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" text-anchor="middle">
        👉 ${domain}/app/${slug} 바로가기
      </text>
    </g>
  </g>

  <!-- Bottom Indicator -->
  <g transform="translate(70, 1010)">
    <rect x="0" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="20" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="40" y="0" width="36" height="8" rx="4" fill="#4F46E5" />
    <text x="940" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">3 / 3</text>
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
