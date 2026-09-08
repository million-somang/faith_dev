import fs from 'fs';
import path from 'path';

export interface ScreenshotOptions {
    slug: string;
    targetUrl: string;
    force?: boolean;
    name?: string;
}

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/marketing/screenshots');

function ensureUploadDir(): void {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}

/**
 * 미니앱의 실제 화면을 모바일 뷰포트(430x860)로 캡처하여 Base64 Data URI로 반환합니다.
 * 캐시가 존재하면 즉시 캐시를 반환하며, Puppeteer 실행 불가 시 밝은 테마 목업으로 안전하게 폴백합니다.
 */
export async function getMiniAppScreenshot(options: ScreenshotOptions): Promise<string> {
    const { slug, targetUrl, force = false, name = slug } = options;
    ensureUploadDir();

    const cacheFilePath = path.join(UPLOAD_DIR, `${slug}.png`);

    // 1. 캐시가 이미 존재하고 강제 갱신이 아닌 경우 캐시 반환
    if (!force && fs.existsSync(cacheFilePath)) {
        try {
            const buffer = fs.readFileSync(cacheFilePath);
            if (buffer.length > 0) {
                return `data:image/png;base64,${buffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn(`[ScreenshotService] 캐시 읽기 실패: ${slug}`, e);
        }
    }

    // 2. Puppeteer를 이용한 실제 브라우저 캡처 시도
    try {
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({
            width: 430,
            height: 860,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true
        });

        // 접속 시도 (타임아웃 15초)
        const effectiveUrl = targetUrl.startsWith('http')
            ? targetUrl
            : `https://veranex.app${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;

        console.log(`[ScreenshotService] 미니앱 캡처 시작: ${effectiveUrl}`);
        await page.goto(effectiveUrl, {
            waitUntil: ['domcontentloaded', 'networkidle2'],
            timeout: 15000
        });

        // 렌더링 애니메이션 및 폰트 로딩 대기
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const screenshotBuffer = await page.screenshot({
            type: 'png',
            fullPage: false
        }) as Buffer;

        await browser.close();

        // 캐시 파일 저장
        fs.writeFileSync(cacheFilePath, screenshotBuffer);
        console.log(`[ScreenshotService] 미니앱 캡처 완료 및 캐시 저장: ${cacheFilePath}`);

        return `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
    } catch (err: any) {
        console.warn(`[ScreenshotService] Puppeteer 캡처 실패 (${slug}):`, err.message);
        // 3. 브라우저 캡처 실패 시 Clean Neumorphism 라이트 테마 목업으로 폴백
        return generateLightFallbackDataUri(name, slug);
    }
}

/**
 * 캡처 불가 시 사용할 밝은 뉴모피즘 기반 미니앱 UI 목업 SVG Data URI 생성
 */
export function generateLightFallbackDataUri(name: string, slug: string): string {
    const cleanName = escapeXml(name || slug);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="860" height="1720" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="screenBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#64748B" flood-opacity="0.12" />
    </filter>
  </defs>

  <!-- Screen Background -->
  <rect width="430" height="860" fill="url(#screenBg)" />

  <!-- App Header / Status Bar -->
  <g transform="translate(20, 30)">
    <rect width="390" height="56" rx="16" fill="#FFFFFF" filter="url(#softShadow)" />
    <circle cx="28" cy="28" r="14" fill="#EEF2FF" />
    <text x="28" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="900" fill="#4F46E5" text-anchor="middle">V</text>
    <text x="56" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">${cleanName}</text>
    <rect x="330" y="16" width="46" height="24" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="353" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="10" font-weight="700" fill="#64748B" text-anchor="middle">LIVE</text>
  </g>

  <!-- Main Hero Card -->
  <g transform="translate(20, 106)">
    <rect width="390" height="160" rx="20" fill="#FFFFFF" filter="url(#softShadow)" />
    <rect x="20" y="20" width="70" height="24" rx="12" fill="#EEF2FF" />
    <text x="55" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle">초간편 유틸</text>
    <text x="20" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="22" font-weight="900" fill="#0F172A">${cleanName}</text>
    <text x="20" y="104" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="500" fill="#64748B">원클릭으로 즉시 실행되는 스마트 도구</text>
    <rect x="20" y="122" width="350" height="24" rx="6" fill="#F8FAFC" />
    <text x="30" y="138" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="600" fill="#4F46E5">veranex.app/app/${escapeXml(slug)}</text>
  </g>

  <!-- Input / Interaction Section Mockup -->
  <g transform="translate(20, 286)">
    <rect width="390" height="280" rx="20" fill="#FFFFFF" filter="url(#softShadow)" />
    <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#0F172A">주요 입력 &amp; 설정</text>
    
    <!-- Input Box 1 -->
    <rect x="24" y="56" width="342" height="48" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="40" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="500" fill="#94A3B8">기본 옵션을 손쉽게 입력하세요</text>

    <!-- Input Box 2 -->
    <rect x="24" y="116" width="342" height="48" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="40" y="146" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="500" fill="#94A3B8">세부 설정 및 조건 선택</text>

    <!-- Interactive Primary Button -->
    <rect x="24" y="184" width="342" height="56" rx="16" fill="url(#btnGrad)" />
    <text x="195" y="219" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">결과 즉시 확인하기 ⚡</text>
  </g>

  <!-- Output / Result Highlight Box -->
  <g transform="translate(20, 586)">
    <rect width="390" height="230" rx="20" fill="#FFFFFF" filter="url(#softShadow)" />
    <rect x="24" y="24" width="342" height="120" rx="16" fill="#F0FDF4" stroke="#BBF7D0" />
    <text x="44" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#166534">✨ 계산 및 분석 완료</text>
    <text x="44" y="94" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="28" font-weight="900" fill="#15803D">100% 정상 산출</text>
    <text x="44" y="124" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="600" fill="#166534">모든 항목이 정확하게 계산되었습니다.</text>

    <!-- Chip Row -->
    <rect x="24" y="164" width="105" height="34" rx="17" fill="#F1F5F9" />
    <text x="76" y="186" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">무료 이용</text>
    
    <rect x="139" y="164" width="105" height="34" rx="17" fill="#F1F5F9" />
    <text x="191" y="186" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">회원가입 無</text>

    <rect x="254" y="164" width="112" height="34" rx="17" fill="#EEF2FF" />
    <text x="310" y="186" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle">초고속 처리</text>
  </g>

  <defs>
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
  </defs>
</svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
