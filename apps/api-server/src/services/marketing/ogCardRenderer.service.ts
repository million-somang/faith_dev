export interface CardDesignOptions {
    title: string;
    subtitle: string;
    tag?: string;
    domain?: string;
    theme?: 'dark' | 'gradient' | 'neon';
}

export function generateCardSvg(options: CardDesignOptions): string {
    const title = escapeXml(options.title || '베라넥스 스마트 유틸리티');
    const subtitle = escapeXml(options.subtitle || '로그인 없이 브라우저에서 즉시 실행');
    const tag = escapeXml(options.tag || '무료 도구');
    const domain = escapeXml(options.domain || 'veranex.app');

    const titleLines = wrapText(title, 14);
    const subtitleLines = wrapText(subtitle, 24);

    const titleTspans = titleLines.map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 78}">${line}</tspan>`).join('');
    const subtitleTspans = subtitleLines.map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 50}">${line}</tspan>`).join('');

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>

    <!-- Glow Orb 1 -->
    <radialGradient id="glow1" cx="20%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0" />
    </radialGradient>

    <!-- Glow Orb 2 -->
    <radialGradient id="glow2" cx="80%" cy="80%" r="60%">
      <stop offset="0%" stop-color="#818CF8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#818CF8" stop-opacity="0" />
    </radialGradient>

    <!-- Card Background Shadow -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad)" />
  <rect width="1080" height="1080" fill="url(#glow1)" />
  <rect width="1080" height="1080" fill="url(#glow2)" />

  <!-- Grid Pattern Overlay for Tech vibe -->
  <g opacity="0.07" stroke="#94A3B8" stroke-width="1">
    <line x1="0" y1="180" x2="1080" y2="180" />
    <line x1="0" y1="360" x2="1080" y2="360" />
    <line x1="0" y1="540" x2="1080" y2="540" />
    <line x1="0" y1="720" x2="1080" y2="720" />
    <line x1="0" y1="900" x2="1080" y2="900" />
    <line x1="180" y1="0" x2="180" y2="1080" />
    <line x1="360" y1="0" x2="360" y2="1080" />
    <line x1="540" y1="0" x2="540" y2="1080" />
    <line x1="720" y1="0" x2="720" y2="1080" />
    <line x1="900" y1="0" x2="900" y2="1080" />
  </g>

  <!-- Inner Glass Container Box -->
  <rect x="70" y="70" width="940" height="940" rx="48" fill="#1E293B" fill-opacity="0.45" stroke="#334155" stroke-width="2" filter="url(#cardShadow)" />

  <!-- Header: Domain Brand & Category Tag -->
  <g transform="translate(130, 150)">
    <!-- Brand Logo Text -->
    <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="34" font-weight="900" fill="#38BDF8" letter-spacing="0.5">
      ${domain}
    </text>

    <!-- Tag Badge -->
    <rect x="660" y="-8" width="160" height="52" rx="26" fill="#38BDF8" fill-opacity="0.15" stroke="#38BDF8" stroke-width="1.5" />
    <text x="740" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="22" font-weight="700" fill="#7DD3FC" text-anchor="middle">
      ${tag}
    </text>
  </g>

  <!-- Decorative Accent Bar -->
  <rect x="130" y="240" width="80" height="8" rx="4" fill="#38BDF8" />

  <!-- Center Content: Title & Subtitle -->
  <g transform="translate(130, 390)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" line-height="1.25">
      ${titleTspans}
    </text>

    <text x="0" y="230" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="34" font-weight="500" fill="#94A3B8">
      ${subtitleTspans}
    </text>
  </g>

  <!-- Feature Checklist Chips -->
  <g transform="translate(130, 770)">
    <rect x="0" y="0" width="260" height="60" rx="30" fill="#0F172A" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
    <text x="130" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="22" font-weight="600" fill="#E2E8F0" text-anchor="middle">
      ⚡ NO 설치 · 즉시 실행
    </text>

    <rect x="280" y="0" width="240" height="60" rx="30" fill="#0F172A" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
    <text x="400" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="22" font-weight="600" fill="#E2E8F0" text-anchor="middle">
      🔒 NO 회원가입
    </text>

    <rect x="540" y="0" width="220" height="60" rx="30" fill="#0F172A" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
    <text x="650" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="22" font-weight="600" fill="#38BDF8" text-anchor="middle">
      🎁 100% 무료
    </text>
  </g>

  <!-- Footer Banner: Call to Action -->
  <g transform="translate(130, 910)">
    <line x1="0" y1="0" x2="820" y2="0" stroke="#334155" stroke-width="1.5" />
    <text x="0" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="26" font-weight="700" fill="#38BDF8">
      🔥 지금 바로 브라우저에서 사용해보세요
    </text>
    <text x="820" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" font-size="22" font-weight="600" fill="#64748B" text-anchor="end">
      스마트 웹 툴킷
    </text>
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
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [text];
}
