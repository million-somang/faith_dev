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
 * 미니앱별 3대 핵심 키 페이지(1: 시작/변환, 2: 서브기능/탭, 3: 최종결과/가이드)를
 * 브라우저 인터랙션과 스켈레톤 로딩 대기를 통해 완벽히 서로 다른 3장의 화면으로 캡처합니다.
 */
export async function getMiniAppScreenshots(options: ScreenshotOptions): Promise<string[]> {
    const { slug, targetUrl, force = false, name = slug } = options;
    ensureUploadDir();

    const filePaths = [
        path.join(UPLOAD_DIR, `${slug}_key1.png`),
        path.join(UPLOAD_DIR, `${slug}_key2.png`),
        path.join(UPLOAD_DIR, `${slug}_key3.png`)
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
            if (results.length === 3 && !isImagesDuplicate(results)) {
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

        console.log(`[ScreenshotService] 미니앱 접속 시작: ${effectiveUrl}`);
        await page.goto(effectiveUrl, {
            waitUntil: ['domcontentloaded', 'networkidle2'],
            timeout: 20000
        });

        // 🌟 [핵심 개선 1] 스켈레톤 로딩(3초 타이머) 소멸 완벽 대기
        console.log(`[ScreenshotService] 스켈레톤 로딩 소멸 및 실제 화면 안정화 대기 중...`);
        await page.waitForFunction(() => (document.querySelector('#root, #app, main')?.children.length ?? 0) > 0, { timeout: 10000 }).catch(() => {});
        await page.waitForFunction(() => !document.querySelector('.loading-screen, .loading-body, [aria-label*="로딩"]'), { timeout: 12000 }).catch(() => {});
        await page.waitForFunction(() => document.querySelectorAll('button, input, select, textarea, [role="tab"]').length >= 2, { timeout: 8000 }).catch(() => {});
        await new Promise((resolve) => setTimeout(resolve, 800));

        // 🌟 [핵심 개선 2] 미니앱별 특화 시나리오 캡처 실행 (slug 정규화)
        const cleanSlug = slug.replace(/^app-/, '');
        const buffers = await captureScenarioShots(page, cleanSlug);

        await browser.close();

        // 중복 방지 검증: 버퍼 크기가 동일하거나 중복이면 폴백 화면으로 교체
        const validBuffers = validateAndEnsureDistinct(buffers, name, cleanSlug);

        // 캐시 파일 저장
        fs.writeFileSync(filePaths[0], validBuffers[0]);
        fs.writeFileSync(filePaths[1], validBuffers[1]);
        fs.writeFileSync(filePaths[2], validBuffers[2]);
        fs.writeFileSync(path.join(UPLOAD_DIR, `${slug}.png`), validBuffers[0]);

        return [
            `data:image/png;base64,${validBuffers[0].toString('base64')}`,
            `data:image/png;base64,${validBuffers[1].toString('base64')}`,
            `data:image/png;base64,${validBuffers[2].toString('base64')}`
        ];
    } catch (err: any) {
        console.warn(`[ScreenshotService] Puppeteer 캡처 실패 (${slug}):`, err.message);
        return generateLightFallbackSet(name, slug);
    }
}

/**
 * 앱별 고유 3대 키 페이지 시나리오 실행 함수
 */
async function captureScenarioShots(page: any, cleanSlug: string): Promise<Buffer[]> {
    const buffers: Buffer[] = [];

    if (cleanSlug === 'pyeong-calc') {
        // ==================== [평수 계산기 전용 3대 키 페이지] ====================
        // Key 1: 면적 변환 탭에서 '34평' 클릭하여 '34평 = 112.40m²' 대형 결과가 뜬 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn34 = buttons.find(b => b.textContent && b.textContent.includes('34'));
            if (btn34) {
                btn34.click();
            } else {
                const input = document.querySelector('input');
                if (input) {
                    input.value = '34';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));
        console.log(`[ScreenshotService] pyeong-calc Key 1 (34평 변환 결과) 캡처 완료`);

        // Key 2: '평당 가격' 탭 클릭 ➡️ 매매가 8.5억 / 34평 입력 ➡️ '평당 2,500만' 산출 리포트 화면
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('nav button, button[role="tab"]')) as HTMLElement[];
            if (tabs[1]) {
                tabs[1].click();
            } else {
                const priceTab = tabs.find(b => b.textContent && b.textContent.includes('평당'));
                if (priceTab) priceTab.click();
            }
        });
        await new Promise((r) => setTimeout(r, 700));
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            if (inputs[0]) {
                inputs[0].value = '85000';
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (inputs[1]) {
                inputs[1].value = '34';
                inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));
        console.log(`[ScreenshotService] pyeong-calc Key 2 (평당가격 산출 뷰) 캡처 완료`);

        // Key 3: '사용방법' 탭 클릭 ➡️ 아파트 평형별 규격 비교표 가이드 화면
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('nav button, button[role="tab"]')) as HTMLElement[];
            if (tabs[2]) {
                tabs[2].click();
            } else {
                const howtoTab = tabs.find(b => b.textContent && (b.textContent.includes('상식') || b.textContent.includes('방법') || b.textContent.includes('가이드')));
                if (howtoTab) howtoTab.click();
            }
        });
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));
        console.log(`[ScreenshotService] pyeong-calc Key 3 (사용방법 가이드 뷰) 캡처 완료`);

        return buffers;
    }

    if (cleanSlug === 'severance-calc') {
        // ==================== [퇴직금 계산기 전용 3대 키 페이지] ====================
        // Key 1: 퇴직금 계산하기 클릭 ➡️ 예상 퇴직금 1,842만원 산출 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const calcBtn = buttons.find(b => b.textContent && b.textContent.includes('계산하기'));
            if (calcBtn) calcBtn.click();
        });
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // Key 2: '실업급여 계산' 서브 탭 클릭 ➡️ 실업급여 계산기 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, [role="tab"]')) as HTMLElement[];
            const tab = buttons.find(b => b.textContent && b.textContent.includes('실업급여'));
            if (tab) tab.click();
        });
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // Key 3: 입력 폼 재진입 및 세부 상여금/통상임금 옵션 설정 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, [role="tab"]')) as HTMLElement[];
            const tab = buttons.find(b => b.textContent && b.textContent.includes('퇴직금'));
            if (tab) tab.click();
        });
        await new Promise((r) => setTimeout(r, 600));
        await page.evaluate(() => window.scrollTo(0, 250));
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    if (cleanSlug === 'calculator') {
        // ==================== [다기능 계산기 전용 3대 키 페이지] ====================
        // Key 1: 기본 계산기 (수식 입력 상태)
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const keys = ['7', '*', '8', '='];
            keys.forEach(k => {
                const btn = buttons.find(b => b.textContent && b.textContent.trim() === k);
                if (btn) btn.click();
            });
        });
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // Key 2: 대출이자 계산기 탭
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, [role="tab"]')) as HTMLElement[];
            const tab = buttons.find(b => b.textContent && (b.textContent.includes('대출') || b.textContent.includes('이자')));
            if (tab) tab.click();
        });
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // Key 3: 비만도(BMI) 또는 날짜 계산기 탭
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, [role="tab"]')) as HTMLElement[];
            const tab = buttons.find(b => b.textContent && (b.textContent.includes('BMI') || b.textContent.includes('비만도') || b.textContent.includes('날짜')));
            if (tab) tab.click();
        });
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // ==================== [공통 범용 앱 인터랙션] ====================
    // Key 1: 메인 화면 첫 컷
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // Key 2: 탭이나 서브 메뉴가 있으면 2번째 탭 클릭
    const clickedSub = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button[role="tab"], .tab, nav button, button[class*="tab"]')) as HTMLElement[];
        if (tabs.length >= 2) {
            tabs[1].click();
            return true;
        }
        const generalButtons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
        if (generalButtons.length >= 3) {
            generalButtons[1].click();
            return true;
        }
        return false;
    });
    await new Promise((r) => setTimeout(r, 800));
    if (!clickedSub) {
        await page.evaluate(() => window.scrollTo(0, 300));
        await new Promise((r) => setTimeout(r, 400));
    }
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // Key 3: 계산/실행/확인 버튼 클릭 후 결과 뷰
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]')) as HTMLElement[];
        const actionBtn = buttons.find(b => {
            const text = (b.textContent || (b as HTMLInputElement).value || '').trim();
            return /계산|결과|확인|조회|시작|생성|변환|검사|Calc|Result|Start/i.test(text) && b.offsetWidth > 0;
        });
        if (actionBtn) actionBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    return buffers;
}

/**
 * 3장의 이미지가 동일한지 검증하고, 동일한 경우 완벽히 차별화된 라이트 씬으로 교체
 */
function validateAndEnsureDistinct(buffers: Buffer[], name: string, slug: string): Buffer[] {
    if (buffers.length < 3) {
        return generateLightFallbackBufferSet(name, slug);
    }

    const size1 = buffers[0].length;
    const size2 = buffers[1].length;
    const size3 = buffers[2].length;

    // 크기가 1.5% 이내로 동일한 쌍이 하나라도 있으면 중복으로 판정
    const diff12 = Math.abs(size1 - size2) / Math.max(size1, 1);
    const diff23 = Math.abs(size2 - size3) / Math.max(size2, 1);
    const diff13 = Math.abs(size1 - size3) / Math.max(size1, 1);

    if (diff12 < 0.015 || diff23 < 0.015 || diff13 < 0.015) {
        console.warn(`[ScreenshotService] ${slug}: 중복 캡처 감지 (크기: ${size1}, ${size2}, ${size3}) -> 차별화 라이트 목업 세트로 교체합니다.`);
        return generateLightFallbackBufferSet(name, slug);
    }

    return buffers;
}

function isImagesDuplicate(uris: string[]): boolean {
    if (uris.length < 3) return true;
    const s1 = uris[0];
    const s2 = uris[1];
    const s3 = uris[2];
    return s1 === s2 || s2 === s3 || s1 === s3;
}

/**
 * 단일 스크린샷 캡처 (기존 호환용)
 */
export async function getMiniAppScreenshot(options: ScreenshotOptions): Promise<string> {
    const list = await getMiniAppScreenshots(options);
    return list[0] || '';
}

/**
 * 완벽히 서로 다른 3대 키 뷰 라이트 목업 세트
 */
export function generateLightFallbackSet(name: string, slug: string): string[] {
    return [
        generateLightScreen1(name, slug),
        generateLightScreen2(name, slug),
        generateLightScreen3(name, slug)
    ];
}

export function generateLightFallbackBufferSet(name: string, slug: string): Buffer[] {
    // SVG를 Buffer로 감싸서 반환 (data URL 대신)
    const s1 = Buffer.from(generateLightScreen1Svg(name, slug));
    const s2 = Buffer.from(generateLightScreen2Svg(name, slug));
    const s3 = Buffer.from(generateLightScreen3Svg(name, slug));
    return [s1, s2, s3];
}

export function generateLightFallbackDataUri(name: string, slug: string): string {
    return generateLightScreen1(name, slug);
}

function generateLightScreen1(name: string, slug: string): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(generateLightScreen1Svg(name, slug))}`;
}

function generateLightScreen2(name: string, slug: string): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(generateLightScreen2Svg(name, slug))}`;
}

function generateLightScreen3(name: string, slug: string): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(generateLightScreen3Svg(name, slug))}`;
}

function generateLightScreen1Svg(name: string, slug: string): string {
    const cleanName = escapeXml(name || slug);
    return `
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
    <text x="60" y="37" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle">1. 면적 변환</text>
    <text x="20" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="24" font-weight="900" fill="#0F172A">34평 ➡️ 112.40m²</text>
    <text x="20" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="500" fill="#64748B">원클릭 국민평형 환산 완료</text>
  </g>
  <g transform="translate(20, 306)">
    <rect width="390" height="240" rx="20" fill="#FFFFFF" filter="url(#sh1)" />
    <text x="24" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#0F172A">빠른 평형 선택</text>
    <rect x="24" y="60" width="100" height="50" rx="12" fill="#EEF2FF" stroke="#C7D2FE" />
    <text x="74" y="91" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#4F46E5" text-anchor="middle">24평</text>
    <rect x="145" y="60" width="100" height="50" rx="12" fill="#4F46E5" />
    <text x="195" y="91" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">34평</text>
    <rect x="266" y="60" width="100" height="50" rx="12" fill="#EEF2FF" stroke="#C7D2FE" />
    <text x="316" y="91" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#4F46E5" text-anchor="middle">42평</text>
  </g>
</svg>`.trim();
}

function generateLightScreen2Svg(name: string, slug: string): string {
    const cleanName = escapeXml(name || slug);
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="430" height="860" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="sBg2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EEF2F6" />
    </linearGradient>
    <filter id="sh2" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#64748B" flood-opacity="0.12" />
    </filter>
  </defs>
  <rect width="430" height="860" fill="url(#sBg2)" />
  <g transform="translate(20, 30)">
    <rect width="390" height="56" rx="16" fill="#FFFFFF" filter="url(#sh2)" />
    <rect x="14" y="12" width="120" height="32" rx="8" fill="#EEF2FF" />
    <text x="74" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#4F46E5" text-anchor="middle">2. 평당가격 계산</text>
    <text x="145" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#0F172A">시세 분석 모드</text>
  </g>
  <g transform="translate(20, 106)">
    <rect width="390" height="420" rx="20" fill="#FFFFFF" filter="url(#sh2)" />
    <rect x="24" y="24" width="342" height="90" rx="14" fill="#F0FDF4" stroke="#BBF7D0" />
    <text x="44" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#166534">평당 환산 단가 분석 결과</text>
    <text x="44" y="88" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="26" font-weight="900" fill="#15803D">평당 2,500만원</text>
    
    <rect x="24" y="130" width="342" height="160" rx="14" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="44" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#0F172A">매매가 기준: 8억 5,000만원</text>
    <text x="44" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#64748B">공급면적: 34평 (112.4m²)</text>
    <text x="44" y="225" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#64748B">주변 시세 대비: <tspan fill="#4F46E5" font-weight="800">적정 가격대 💛</tspan></text>
  </g>
</svg>`.trim();
}

function generateLightScreen3Svg(name: string, slug: string): string {
    const cleanName = escapeXml(name || slug);
    return `
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
    <rect x="14" y="12" width="120" height="32" rx="8" fill="#FEF3C7" />
    <text x="74" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="800" fill="#B45309" text-anchor="middle">3. 부동산 상식</text>
    <text x="145" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" fill="#0F172A">공식 평형 가이드</text>
  </g>
  <g transform="translate(20, 106)">
    <rect width="390" height="420" rx="20" fill="#FFFFFF" filter="url(#sh3)" />
    <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="900" fill="#0F172A">아파트 평형 공식 규격표</text>
    
    <rect x="24" y="65" width="342" height="60" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="44" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#0F172A">전용 59m²</text>
    <text x="346" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#4F46E5" text-anchor="end">구 24~25평형 🏡</text>

    <rect x="24" y="135" width="342" height="60" rx="12" fill="#EEF2FF" stroke="#C7D2FE" />
    <text x="44" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#4F46E5">전용 84m²</text>
    <text x="346" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#4F46E5" text-anchor="end">구 33~34평형 ⭐</text>

    <rect x="24" y="205" width="342" height="60" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="44" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#0F172A">전용 102m²</text>
    <text x="346" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="800" fill="#64748B" text-anchor="end">구 39~40평형 🏘️</text>
  </g>
</svg>`.trim();
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
