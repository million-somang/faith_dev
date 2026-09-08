export interface CardDesignOptions {
    title: string;
    subtitle: string;
    tag?: string;
    domain?: string;
    slug?: string;
    screenshots?: string[]; // 최소 3개 이상의 실행 화면 이미지 배열
    screenshotUri?: string; // 단일 호환용
    slideIndex?: number; // 1: 3-디바이스 입체 씬, 2: 3-스텝 상세 씬, 3: 3-그리드 CTA 씬
}

/**
 * FaithPortal Clean Neumorphism 디자인 시스템 기반
 * 카드 1장당 실제 실행 화면 이미지가 최소 3개 이상 한눈에 들어오는 1080x1080 고해상도 SVG 렌더러
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
    const img2 = list[1] || list[0] || fallback;
    const img3 = list[2] || list[1] || list[0] || fallback;
    return [img1, img2, img3];
}

/**
 * [Slide 1] 3-디바이스 입체 씬 (좌측 폰 + 중앙 메인 폰 + 우측 폰: 3개 화면 동시 노출)
 */
function generateSlide1(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '베라넥스 스마트 유틸리티');
    const subtitle = escapeXml(options.subtitle || '로그인 없이 브라우저에서 즉시 실행');
    const tag = escapeXml(options.tag || '무료 도구');
    const domain = escapeXml(options.domain || 'veranex.app');
    const [img1, img2, img3] = resolveScreenshots(options);

    const titleLines = wrapText(title, 20);
    const titleTspans = titleLines.map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 50}">${line}</tspan>`).join('');

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <!-- Background Gradient -->
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

    <!-- 3D Phone Shadows -->
    <filter id="mainPhoneShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="28" flood-color="#0F172A" flood-opacity="0.22" />
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#4F46E5" flood-opacity="0.10" />
    </filter>

    <filter id="sidePhoneShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#0F172A" flood-opacity="0.15" />
    </filter>

    <!-- Clip Paths for Screens -->
    <clipPath id="clipCenter">
      <rect x="0" y="0" width="450" height="740" rx="36" />
    </clipPath>
    <clipPath id="clipSide">
      <rect x="0" y="0" width="370" height="640" rx="30" />
    </clipPath>
  </defs>

  <!-- Clean Neumorphic Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad)" />

  <!-- Ambient Glow -->
  <circle cx="180" cy="180" r="300" fill="#E0E7FF" opacity="0.6" filter="blur(60px)" />
  <circle cx="900" cy="900" r="320" fill="#EDE9FE" opacity="0.6" filter="blur(60px)" />

  <!-- ==================== HEADER (TOP 18%) ==================== -->
  <g transform="translate(70, 60)">
    <!-- Brand Pill -->
    <rect x="0" y="0" width="160" height="42" rx="21" fill="#FFFFFF" />
    <circle cx="24" cy="21" r="11" fill="url(#accentGrad)" />
    <text x="24" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="44" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#0F172A">${domain}</text>

    <!-- Category Tag Badge -->
    <rect x="760" y="0" width="180" height="42" rx="21" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1.5" />
    <text x="850" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#4F46E5" text-anchor="middle">✨ ${tag}</text>

    <!-- Headline -->
    <text x="0" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="42" font-weight="900" fill="#0F172A" letter-spacing="-0.03em">
      ${titleTspans}
    </text>

    <text x="0" y="${98 + titleLines.length * 48}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" fill="#64748B">
      ${subtitle}
    </text>
  </g>

  <!-- ==================== 3-DEVICE MULTI-MOCKUP SCENE (82% AREA) ==================== -->
  <!-- 1. LEFT PHONE MOCKUP (Screen 1: 시작/입력 화면) -->
  <g transform="translate(60, 360) rotate(-7)" filter="url(#sidePhoneShadow)">
    <rect x="-10" y="-10" width="390" height="660" rx="38" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
    <rect x="0" y="0" width="370" height="640" rx="30" fill="#F8FAFC" />
    <g clip-path="url(#clipSide)">
      ${img1 ? `
        <image href="${img1}" x="0" y="0" width="370" height="640" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="370" height="640" fill="#F1F5F9" />
        <text x="185" y="320" font-family="sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">실행 화면 1</text>
      `}
    </g>
    <!-- Label Tag -->
    <rect x="20" y="20" width="110" height="32" rx="16" fill="#0F172A" opacity="0.8" />
    <text x="75" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">1. 간편 입력</text>
  </g>

  <!-- 2. RIGHT PHONE MOCKUP (Screen 2: 서브 기능/옵션 탭 화면) -->
  <g transform="translate(650, 320) rotate(7)" filter="url(#sidePhoneShadow)">
    <rect x="-10" y="-10" width="390" height="660" rx="38" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
    <rect x="0" y="0" width="370" height="640" rx="30" fill="#F8FAFC" />
    <g clip-path="url(#clipSide)">
      ${img2 ? `
        <image href="${img2}" x="0" y="0" width="370" height="640" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="370" height="640" fill="#F1F5F9" />
        <text x="185" y="320" font-family="sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">서브 기능 2</text>
      `}
    </g>
    <!-- Label Tag -->
    <rect x="220" y="20" width="130" height="32" rx="16" fill="#4F46E5" opacity="0.9" />
    <text x="285" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">2. 맞춤 기능 탭</text>
  </g>

  <!-- 3. CENTER MAIN PHONE MOCKUP (Screen 3: 최종 산출 결과 화면 - Z-INDEX TOP) -->
  <g transform="translate(315, 270)" filter="url(#mainPhoneShadow)">
    <!-- Outer Bezel -->
    <rect x="-12" y="-12" width="474" height="764" rx="46" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5" />
    <rect x="0" y="0" width="450" height="740" rx="36" fill="#F8FAFC" />
    
    <!-- Screen Image (실제 최종 결과 화면) -->
    <g clip-path="url(#clipCenter)">
      ${img3 ? `
        <image href="${img3}" x="0" y="0" width="450" height="740" preserveAspectRatio="xMidYMin slice" />
      ` : `
        <rect width="450" height="740" fill="#F1F5F9" />
        <text x="225" y="370" font-family="sans-serif" font-size="18" fill="#94A3B8" text-anchor="middle">최종 결과 3</text>
      `}
    </g>

    <!-- Dynamic Island Notch -->
    <rect x="160" y="14" width="130" height="26" rx="13" fill="#0F172A" />
    <circle cx="260" cy="27" r="5" fill="#1E293B" />

    <!-- Center Badge -->
    <rect x="140" y="680" width="170" height="36" rx="18" fill="#16A34A" />
    <text x="225" y="703" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">✨ 최종 산출 결과 확인</text>
  </g>

  <!-- Bottom Mini Slide Indicator -->
  <g transform="translate(70, 1020)">
    <rect x="0" y="0" width="36" height="8" rx="4" fill="#4F46E5" />
    <rect x="44" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="64" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <text x="940" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">1 / 3</text>
  </g>
</svg>
    `.trim();
}

/**
 * [Slide 2] 3-스텝 상세 뷰 (가로 3열 프레임으로 3개 화면을 순서대로 나란히 노출)
 */
function generateSlide2(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '이렇게 3단계로 간편 실행');
    const tag = escapeXml(options.tag || '초간편 사용법');
    const domain = escapeXml(options.domain || 'veranex.app');
    const [img1, img2, img3] = resolveScreenshots(options);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <filter id="stepShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.12" />
    </filter>
    <clipPath id="clipStep">
      <rect x="0" y="0" width="280" height="540" rx="24" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad2)" />

  <!-- Header -->
  <g transform="translate(70, 70)">
    <rect x="0" y="0" width="160" height="42" rx="21" fill="#FFFFFF" />
    <circle cx="24" cy="21" r="11" fill="#4F46E5" />
    <text x="24" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="44" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#0F172A">${domain}</text>

    <rect x="760" y="0" width="180" height="42" rx="21" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1.5" />
    <text x="850" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#4F46E5" text-anchor="middle">🔍 ${tag}</text>

    <text x="0" y="96" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="42" font-weight="900" fill="#0F172A">
      3초 만에 끝나는 실제 이용 과정
    </text>
    <text x="0" y="138" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" fill="#64748B">
      별도 가입 없이 누구나 즉시 결과를 도출할 수 있습니다
    </text>
  </g>

  <!-- ==================== 3 PARALLEL SCREEN CARDS ==================== -->
  <!-- Card 1: Step 1 준비 -->
  <g transform="translate(80, 260)" filter="url(#stepShadow)">
    <rect x="-8" y="-40" width="296" height="680" rx="30" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
    <rect x="12" y="-28" width="80" height="26" rx="13" fill="#EEF2FF" />
    <text x="52" y="-11" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="middle">STEP 01</text>
    <text x="105" y="-10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#0F172A">입력 &amp; 선택</text>
    
    <g clip-path="url(#clipStep)">
      ${img1 ? `
        <image href="${img1}" x="0" y="0" width="280" height="540" preserveAspectRatio="xMidYMin slice" />
      ` : `<rect width="280" height="540" fill="#F1F5F9" />`}
    </g>
    <text x="140" y="580" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#64748B" text-anchor="middle">기본 파라미터 간편 기입</text>
  </g>

  <!-- Card 2: Step 2 계산/진행 -->
  <g transform="translate(392, 260)" filter="url(#stepShadow)">
    <rect x="-8" y="-40" width="296" height="680" rx="30" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2.5" />
    <rect x="12" y="-28" width="80" height="26" rx="13" fill="#4F46E5" />
    <text x="52" y="-11" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">STEP 02</text>
    <text x="105" y="-10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#0F172A">실시간 산출</text>
    
    <g clip-path="url(#clipStep)">
      ${img2 ? `
        <image href="${img2}" x="0" y="0" width="280" height="540" preserveAspectRatio="xMidYMin slice" />
      ` : `<rect width="280" height="540" fill="#F1F5F9" />`}
    </g>
    <text x="140" y="580" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#4F46E5" text-anchor="middle">공식 기준 100% 자동 분석</text>
  </g>

  <!-- Card 3: Step 3 최종 확인 -->
  <g transform="translate(704, 260)" filter="url(#stepShadow)">
    <rect x="-8" y="-40" width="296" height="680" rx="30" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
    <rect x="12" y="-28" width="80" height="26" rx="13" fill="#DCFCE7" />
    <text x="52" y="-11" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#15803D" text-anchor="middle">STEP 03</text>
    <text x="105" y="-10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#0F172A">결과 리포트</text>
    
    <g clip-path="url(#clipStep)">
      ${img3 ? `
        <image href="${img3}" x="0" y="0" width="280" height="540" preserveAspectRatio="xMidYMin slice" />
      ` : `<rect width="280" height="540" fill="#F1F5F9" />`}
    </g>
    <text x="140" y="580" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#15803D" text-anchor="middle">상세 내역 확인 및 다운로드</text>
  </g>

  <!-- Bottom Indicator -->
  <g transform="translate(70, 1020)">
    <rect x="0" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <rect x="20" y="0" width="36" height="8" rx="4" fill="#4F46E5" />
    <rect x="64" y="0" width="12" height="8" rx="4" fill="#CBD5E1" />
    <text x="940" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="end">2 / 3</text>
  </g>
</svg>
    `.trim();
}

/**
 * [Slide 3] 3-화면 갤러리 + 브라우저 주소창 바로가기 CTA
 */
function generateSlide3(options: CardDesignOptions): string {
    const slug = escapeXml(options.slug || 'app');
    const domain = escapeXml(options.domain || 'veranex.app');
    const [img1, img2, img3] = resolveScreenshots(options);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EEF2F6" />
    </linearGradient>
    <filter id="boxShadow3" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0F172A" flood-opacity="0.12" />
    </filter>
    <clipPath id="clipThumb">
      <rect x="0" y="0" width="280" height="380" rx="20" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad3)" />

  <!-- Top Hero Title -->
  <g transform="translate(100, 80)">
    <rect x="360" y="0" width="160" height="38" rx="19" fill="#EEF2FF" />
    <text x="440" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#4F46E5" text-anchor="middle">⚡ 100% 무료 · 무설치</text>

    <text x="440" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="44" font-weight="900" fill="#0F172A" text-anchor="middle">
      지금 브라우저에서 바로 사용해보세요
    </text>
    <text x="440" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" fill="#64748B" text-anchor="middle">
      회원가입 없이 모바일과 PC에서 즉시 열립니다
    </text>
  </g>

  <!-- ==================== 3 SCREENSHOT THUMBNAIL GALLERY ==================== -->
  <g transform="translate(80, 270)">
    <!-- Thumb 1 -->
    <g transform="translate(0, 0)" filter="url(#boxShadow3)">
      <rect x="-8" y="-8" width="296" height="396" rx="28" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
      <g clip-path="url(#clipThumb)">
        <image href="${img1}" x="0" y="0" width="280" height="380" preserveAspectRatio="xMidYMin slice" />
      </g>
    </g>

    <!-- Thumb 2 -->
    <g transform="translate(312, 0)" filter="url(#boxShadow3)">
      <rect x="-8" y="-8" width="296" height="396" rx="28" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2.5" />
      <g clip-path="url(#clipThumb)">
        <image href="${img2}" x="0" y="0" width="280" height="380" preserveAspectRatio="xMidYMin slice" />
      </g>
    </g>

    <!-- Thumb 3 -->
    <g transform="translate(624, 0)" filter="url(#boxShadow3)">
      <rect x="-8" y="-8" width="296" height="396" rx="28" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
      <g clip-path="url(#clipThumb)">
        <image href="${img3}" x="0" y="0" width="280" height="380" preserveAspectRatio="xMidYMin slice" />
      </g>
    </g>
  </g>

  <!-- ==================== CALL TO ACTION BIG BUTTON ==================== -->
  <g transform="translate(140, 750)" filter="url(#boxShadow3)">
    <!-- Big Address Bar Container -->
    <rect width="800" height="180" rx="36" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />

    <text x="400" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="700" fill="#64748B" text-anchor="middle">
      링크를 누르거나 브라우저 주소창에 입력하세요
    </text>

    <!-- Interactive URL Button -->
    <rect x="70" y="86" width="660" height="66" rx="33" fill="#0F172A" />
    <text x="400" y="128" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      👉 https://${domain}/app/${slug} 바로가기
    </text>
  </g>

  <!-- Bottom Indicator -->
  <g transform="translate(70, 1020)">
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
