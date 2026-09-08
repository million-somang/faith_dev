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
 * 미니앱의 3대 핵심 키 페이지(1: 시작 화면, 2: 서브기능/탭 전환, 3: 최종 산출 결과)를
 * 브라우저 인터랙션(탭 클릭, 계산 버튼 실행)을 통해 직접 시뮬레이션 캡처합니다.
 */
export async function getMiniAppScreenshots(options: ScreenshotOptions): Promise<string[]> {
    const { slug, targetUrl, force = false, name = slug } = options;
    ensureUploadDir();

    const filePaths = [
        path.join(UPLOAD_DIR, `${slug}_key1_start.png`),
        path.join(UPLOAD_DIR, `${slug}_key2_feature.png`),
        path.join(UPLOAD_DIR, `${slug}_key3_result.png`)
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

    // 2. Puppeteer 인터랙티브 키 페이지 캡처 시도
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

        console.log(`[ScreenshotService] 미니앱 3대 키 페이지 캡처 시작: ${effectiveUrl}`);
        await page.goto(effectiveUrl, {
            waitUntil: ['domcontentloaded', 'networkidle2'],
            timeout: 15000
        });

        // 폰트 및 초기 UI 로딩 대기
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // ==================== [KEY PAGE 1: 시작 / 메인 홈 화면] ====================
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((resolve) => setTimeout(resolve, 300));
        const buf1 = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
        fs.writeFileSync(filePaths[0], buf1);
        console.log(`[ScreenshotService] Key 1 (시작 화면) 캡처 완료`);

        // ==================== [KEY PAGE 2: 서브 기능 / 탭 전환 화면] ====================
        // 페이지 내의 탭 버튼이나 서브 메뉴(2번째 탭)를 탐색하여 클릭
        const clickedTab = await page.evaluate(() => {
            // 탭 형태의 버튼 목록 수집
            const tabSelectors = [
                'button[role="tab"]',
                '.tab',
                'nav button',
                'button[class*="tab"]',
                'div[role="tablist"] button',
                'div[class*="TabBar"] button'
            ];
            for (const sel of tabSelectors) {
                const tabs = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
                if (tabs.length >= 2) {
                    // 2번째 탭 클릭
                    tabs[1].click();
                    return true;
                }
            }
            // 일반 버튼 중 카테고리나 옵션 버튼 탐색
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            if (buttons.length >= 2) {
                const secondBtn = buttons.find((b, idx) => idx > 0 && b.offsetWidth > 0 && b.offsetHeight > 0);
                if (secondBtn) {
                    secondBtn.click();
                    return true;
                }
            }
            return false;
        });

        if (clickedTab) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
            // 탭이 없으면 폼의 상세 옵션 영역으로 약간 스크롤
            await page.evaluate(() => window.scrollTo(0, 260));
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const buf2 = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
        fs.writeFileSync(filePaths[1], buf2);
        console.log(`[ScreenshotService] Key 2 (서브 기능/탭 화면) 캡처 완료 (탭클릭여부: ${clickedTab})`);

        // ==================== [KEY PAGE 3: 최종 산출 / 결과 화면] ====================
        // 다시 1번 탭으로 돌아오거나(필요 시), 계산/확인/시작 버튼을 찾아 클릭하여 실제 결과 화면 도출
        const clickedAction = await page.evaluate(() => {
            // 1) 탭이 있는 경우 메인 탭(1번째 탭)을 다시 눌러서 계산 준비
            const firstTab = document.querySelector('button[role="tab"], .tab, nav button') as HTMLElement;
            if (firstTab) firstTab.click();

            // 2) 계산/결과/확인/조회/시작 주 버튼 탐색
            const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]')) as HTMLElement[];
            const actionBtn = buttons.find(b => {
                const text = (b.textContent || (b as HTMLInputElement).value || '').trim();
                const isActionText = /계산|결과|확인|조회|시작|생성|변환|검사|Calculate|Result/i.test(text);
                return isActionText && b.offsetWidth > 0 && b.offsetHeight > 0;
            });

            if (actionBtn) {
                actionBtn.click();
                return true;
            }

            // 가장 눈에 띄는 큰 버튼(Primary Button) 클릭 시도
            const primaryBtn = buttons.find(b => {
                const cls = b.className || '';
                return /bg-indigo|bg-blue|btn-primary|submit|gradient/i.test(cls) && b.offsetWidth > 60;
            });

            if (primaryBtn) {
                primaryBtn.click();
                return true;
            }

            return false;
        });

        // 결과 산출 렌더링 및 모달 애니메이션 대기
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // 결과 영역이 화면 아래에 있는 경우 결과 엘리먼트로 스크롤 유도
        await page.evaluate(() => {
            const resultEl = document.querySelector('[class*="result"], [id*="result"], [class*="Result"]');
            if (resultEl) {
                resultEl.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        });
        await new Promise((resolve) => setTimeout(resolve, 400));

        const buf3 = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
        fs.writeFileSync(filePaths[2], buf3);
        console.log(`[ScreenshotService] Key 3 (최종 결과 화면) 캡처 완료 (계산클릭여부: ${clickedAction})`);

        await browser.close();

        // 메인 단일 캐시도 1번 컷으로 저장
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
 * 3개의 서로 다른 화면(1: 메인 시작 폼, 2: 서브기능/옵션, 3: 최종 산출 결과표) 라이트 목업 세트
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
    <text x="60" y="37" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle">1. 시작 화면</text>
    <text x="20" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="24" font-weight="900" fill="#0F172A">${cleanName}</text>
    <text x="20" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="500" fill="#64748B">기본 파라미터 간편 입력 폼</text>
  </g>
  <g transform="translate(20, 306)">
    <rect width="390" height="240" rx="20" fill="#FFFFFF" filter="url(#sh1)" />
    <text x="24" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">주요 입력 필드</text>
    <rect x="24" y="60" width="342" height="50" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="40" y="91" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#94A3B8">기준 일자 / 금액 입력</text>
    <rect x="24" y="124" width="342" height="50" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="40" y="155" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#94A3B8">조건 및 옵션 설정</text>
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
    <!-- Active Sub-tab -->
    <rect x="14" y="12" width="110" height="32" rx="8" fill="#EEF2FF" />
    <text x="69" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#4F46E5" text-anchor="middle">2. 서브 기능 탭</text>
    <text x="140" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#0F172A">상세 분석 모드</text>
  </g>
  <g transform="translate(20, 106)">
    <rect width="390" height="420" rx="20" fill="#FFFFFF" filter="url(#sh2)" />
    <rect x="24" y="24" width="342" height="70" rx="14" fill="#EEF2FF" stroke="#C7D2FE" />
    <text x="44" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#4F46E5">고급 맞춤형 세부 설정</text>
    <text x="44" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">정밀 계산 옵션 조정</text>
    <rect x="24" y="114" width="342" height="180" rx="14" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="44" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#0F172A">선택 파라미터 적용</text>
    <line x1="44" y1="168" x2="346" y2="168" stroke="#E2E8F0" stroke-width="1" />
    <text x="44" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#64748B">자동 공제 계산</text>
    <text x="346" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="end">ON</text>
    <text x="44" y="232" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#64748B">최적 세율 적용</text>
    <text x="346" y="232" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="end">자동 반영</text>
    <rect x="24" y="324" width="342" height="60" rx="16" fill="url(#btnG2)" />
    <text x="195" y="360" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">결과 계산하기 ⚡</text>
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
    <rect x="14" y="12" width="120" height="32" rx="8" fill="#DCFCE7" />
    <text x="74" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#15803D" text-anchor="middle">3. 최종 결과 산출</text>
    <text x="150" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#0F172A">분석 완료 리포트</text>
  </g>
  <g transform="translate(20, 106)">
    <rect width="390" height="340" rx="20" fill="#FFFFFF" filter="url(#sh3)" />
    <rect x="24" y="24" width="342" height="170" rx="16" fill="#F0FDF4" stroke="#BBF7D0" />
    <text x="44" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#166534">✨ 최종 산출 결과표</text>
    <text x="44" y="106" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="34" font-weight="900" fill="#15803D">18,420,000원</text>
    <text x="44" y="142" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="600" fill="#166534">실수령액 및 세액 공제가 모두 계산되었습니다.</text>
    
    <rect x="24" y="214" width="160" height="54" rx="14" fill="#F1F5F9" />
    <text x="104" y="246" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="middle">상세 내역</text>
    <rect x="196" y="214" width="170" height="54" rx="14" fill="#EEF2FF" />
    <text x="281" y="246" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#4F46E5" text-anchor="middle">결과 복사하기</text>
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
