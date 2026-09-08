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
 * 미니앱의 3단계 멀티 컷(1: 메인 홈, 2: 입력/폼, 3: 결과/상세) 화면을 캡처하여 Base64 Data URI 배열로 반환합니다.
 */
export async function getMiniAppScreenshots(options: ScreenshotOptions): Promise<string[]> {
    const { slug, targetUrl, force = false, name = slug } = options;
    ensureUploadDir();

    const filePaths = [
        path.join(UPLOAD_DIR, `${slug}_1.png`),
        path.join(UPLOAD_DIR, `${slug}_2.png`),
        path.join(UPLOAD_DIR, `${slug}_3.png`)
    ];

    // 1. 캐시가 모두 존재하고 강제 갱신이 아니면 캐시 반환
    if (!force && filePaths.every(fp => fs.existsSync(fp))) {
        try {
            const results: string[] = [];
            for (const fp of filePaths) {
                const buffer = fs.readFileSync(fp);
                if (buffer.length > 0) {
                    results.push(`data:image/png;base64,${buffer.toString('base64')}`);
                }
            }
            if (results.length === 3) {
                return results;
            }
        } catch (e) {
            console.warn(`[ScreenshotService] 캐시 읽기 실패: ${slug}`, e);
        }
    }

    // 2. Puppeteer 멀티 컷 캡처 시도
    try {
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        // Chrome 실행 경로 자동 감지
        const candidatePaths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/root/.cache/puppeteer/chrome/linux-145.0.7632.77/chrome-linux64/chrome',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium'
        ].filter(Boolean) as string[];

        let executablePath: string | undefined;
        for (const cp of candidatePaths) {
            if (fs.existsSync(cp)) {
                executablePath = cp;
                break;
            }
        }

        const browser = await puppeteer.launch({
            headless: true,
            executablePath,
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

        const effectiveUrl = targetUrl.startsWith('http')
            ? targetUrl
            : `https://veranex.app${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;

        console.log(`[ScreenshotService] 미니앱 3컷 캡처 시작: ${effectiveUrl}`);
        await page.goto(effectiveUrl, {
            waitUntil: ['domcontentloaded', 'networkidle2'],
            timeout: 15000
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Cut 1: 상단 메인 뷰
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((resolve) => setTimeout(resolve, 300));
        const buf1 = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
        fs.writeFileSync(filePaths[0], buf1);

        // Cut 2: 중간 인터랙션 / 입력 영역 뷰
        await page.evaluate(() => window.scrollTo(0, 200));
        await new Promise((resolve) => setTimeout(resolve, 300));
        const buf2 = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
        fs.writeFileSync(filePaths[1], buf2);

        // Cut 3: 하단 산출 결과 / 디테일 뷰
        await page.evaluate(() => window.scrollTo(0, 420));
        await new Promise((resolve) => setTimeout(resolve, 300));
        const buf3 = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
        fs.writeFileSync(filePaths[2], buf3);

        await browser.close();

        // 단일 호환용 메인 캐시도 저장
        fs.writeFileSync(path.join(UPLOAD_DIR, `${slug}.png`), buf1);

        return [
            `data:image/png;base64,${buf1.toString('base64')}`,
            `data:image/png;base64,${buf2.toString('base64')}`,
            `data:image/png;base64,${buf3.toString('base64')}`
        ];
    } catch (err: any) {
        console.warn(`[ScreenshotService] Puppeteer 캡처 실패 (${slug}):`, err.message);
        return generateLightFallbackSet(name, slug);
    }
}

/**
 * 단일 스크린샷 캡처 (기존 호환용)
 */
export async function getMiniAppScreenshot(options: ScreenshotOptions): Promise<string> {
    const list = await getMiniAppScreenshots(options);
    return list[0] || '';
}

/**
 * 3개의 서로 다른 화면(1: 메인 화면, 2: 입력 화면, 3: 결과 화면) 라이트 목업 세트 생성
 */
export function generateLightFallbackSet(name: string, slug: string): string[] {
    return [
        generateLightScreen1(name, slug),
        generateLightScreen2(name, slug),
        generateLightScreen3(name, slug)
    ];
}

export function generateLightFallbackDataUri(name: string, slug: string): string {
    return generateLightScreen1(name, slug);
}

function generateLightScreen1(name: string, slug: string): string {
    const cleanName = escapeXml(name || slug);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="430" height="860" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="sBg1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <filter id="sh1" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#64748B" flood-opacity="0.12" />
    </filter>
  </defs>
  <rect width="430" height="860" fill="url(#sBg1)" />
  <g transform="translate(20, 30)">
    <rect width="390" height="56" rx="16" fill="#FFFFFF" filter="url(#sh1)" />
    <circle cx="28" cy="28" r="14" fill="#EEF2FF" />
    <text x="28" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="900" fill="#4F46E5" text-anchor="middle">V</text>
    <text x="56" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">${cleanName}</text>
  </g>
  <g transform="translate(20, 106)">
    <rect width="390" height="180" rx="20" fill="#FFFFFF" filter="url(#sh1)" />
    <rect x="20" y="20" width="80" height="26" rx="13" fill="#EEF2FF" />
    <text x="60" y="37" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle">1초 실행</text>
    <text x="20" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="24" font-weight="900" fill="#0F172A">${cleanName}</text>
    <text x="20" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="500" fill="#64748B">브라우저에서 로그인 없이 즉시 사용</text>
  </g>
  <g transform="translate(20, 306)">
    <rect width="390" height="240" rx="20" fill="#FFFFFF" filter="url(#sh1)" />
    <text x="24" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">주요 옵션 선택</text>
    <rect x="24" y="60" width="342" height="50" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="40" y="91" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#94A3B8">기본 조건 설정</text>
    <rect x="24" y="124" width="342" height="50" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="40" y="155" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#94A3B8">상세 옵션 선택</text>
  </g>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateLightScreen2(name: string, slug: string): string {
    const cleanName = escapeXml(name || slug);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="430" height="860" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="sBg2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EEF2F6" />
    </linearGradient>
    <linearGradient id="btnG2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
    <filter id="sh2" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#64748B" flood-opacity="0.12" />
    </filter>
  </defs>
  <rect width="430" height="860" fill="url(#sBg2)" />
  <g transform="translate(20, 30)">
    <rect width="390" height="56" rx="16" fill="#FFFFFF" filter="url(#sh2)" />
    <text x="28" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#4F46E5">STEP 2</text>
    <text x="90" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#0F172A">실시간 계산 &amp; 분석</text>
  </g>
  <g transform="translate(20, 106)">
    <rect width="390" height="420" rx="20" fill="#FFFFFF" filter="url(#sh2)" />
    <rect x="24" y="24" width="342" height="70" rx="14" fill="#EEF2FF" stroke="#C7D2FE" />
    <text x="44" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#4F46E5">입력 데이터 분석 진행 중</text>
    <text x="44" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">최신 공식을 적용합니다</text>
    <rect x="24" y="114" width="342" height="180" rx="14" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="44" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#0F172A">세부 산출 파라미터</text>
    <line x1="44" y1="168" x2="346" y2="168" stroke="#E2E8F0" stroke-width="1" />
    <text x="44" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#64748B">기준 산정액</text>
    <text x="346" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="end">자동 반영</text>
    <text x="44" y="232" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#64748B">공제율 / 감면율</text>
    <text x="346" y="232" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="end">최적 적용</text>
    <rect x="24" y="324" width="342" height="60" rx="16" fill="url(#btnG2)" />
    <text x="195" y="360" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">결과 도출 완료 ⚡</text>
  </g>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateLightScreen3(name: string, slug: string): string {
    const cleanName = escapeXml(name || slug);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="430" height="860" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="sBg3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <filter id="sh3" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#64748B" flood-opacity="0.12" />
    </filter>
  </defs>
  <rect width="430" height="860" fill="url(#sBg3)" />
  <g transform="translate(20, 30)">
    <rect width="390" height="56" rx="16" fill="#FFFFFF" filter="url(#sh3)" />
    <text x="28" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#16A34A">STEP 3</text>
    <text x="90" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" fill="#0F172A">최종 결과 리포트</text>
  </g>
  <g transform="translate(20, 106)">
    <rect width="390" height="280" rx="20" fill="#FFFFFF" filter="url(#sh3)" />
    <rect x="24" y="24" width="342" height="150" rx="16" fill="#F0FDF4" stroke="#BBF7D0" />
    <text x="44" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#166534">✨ 최종 산출 결과</text>
    <text x="44" y="104" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="34" font-weight="900" fill="#15803D">정확도 100%</text>
    <text x="44" y="138" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="600" fill="#166534">회원가입 없이 즉시 다운로드 가능</text>
    <rect x="24" y="196" width="160" height="54" rx="14" fill="#F1F5F9" />
    <text x="104" y="228" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="middle">결과 공유</text>
    <rect x="196" y="196" width="170" height="54" rx="14" fill="#EEF2FF" />
    <text x="281" y="228" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#4F46E5" text-anchor="middle">상세 저장</text>
  </g>
</svg>`.trim();
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
