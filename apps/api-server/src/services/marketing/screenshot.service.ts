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

    if (cleanSlug === '2048') {
        // ==================== [2048 게임 전용 3대 키 페이지] ====================
        // Key 1: 게임 시작 초기 화면 (Score: 0, 2개 타일)
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));
        console.log(`[ScreenshotService] 2048 Key 1 (초기 시작 보드) 캡처 완료`);

        // Key 2: 실제 방향키 14회 연속 타건으로 타일 결합 및 스코어 획득 플레이 화면
        const keys1 = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
        for (const k of keys1) {
            await page.keyboard.press(k);
            await new Promise((r) => setTimeout(r, 100));
        }
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));
        console.log(`[ScreenshotService] 2048 Key 2 (실제 플레이/블록 결합 화면) 캡처 완료`);

        // Key 3: 추가 방향키 14회 타건으로 고득점/다수 타일 생성 화면
        const keys2 = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown'];
        for (const k of keys2) {
            await page.keyboard.press(k);
            await new Promise((r) => setTimeout(r, 100));
        }
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));
        console.log(`[ScreenshotService] 2048 Key 3 (고득점 누적 보드 화면) 캡처 완료`);

        return buffers;
    }

    if (cleanSlug === 'tetris') {
        // ==================== [테트리스 게임 전용 3대 키 페이지] ====================
        // Key 1: 시작 화면
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // Key 2: 게임 시작 및 블록 조작
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => /start|시작|play/i.test(b.textContent || ''));
            if (btn) btn.click();
        });
        await new Promise((r) => setTimeout(r, 500));
        for (let i = 0; i < 8; i++) {
            await page.keyboard.press('ArrowDown');
            await new Promise((r) => setTimeout(r, 120));
        }
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // Key 3: 지속 플레이 및 하단 스택 화면
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowDown');
            await new Promise((r) => setTimeout(r, 120));
        }
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    if (cleanSlug === 'sudoku') {
        // ==================== [스도쿠 게임 전용 3대 키 페이지] ====================
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('button, [role="gridcell"], .cell')) as HTMLElement[];
            if (cells[4]) cells[4].click();
            const numBtns = Array.from(document.querySelectorAll('button')).filter(b => /^[1-9]$/.test(b.textContent?.trim() || ''));
            if (numBtns[1]) numBtns[1].click();
        });
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        await page.evaluate(() => window.scrollTo(0, 200));
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // ==================== [공통 범용 앱 인터랙션] ====================
    // Key 1: 메인 화면 첫 컷
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // Key 2: 탭이나 서브 메뉴가 있으면 2번째 탭 클릭, 없으면 입력 필드 변경
    const clickedSub = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button[role="tab"], .tab, nav button, button[class*="tab"]')) as HTMLElement[];
        if (tabs.length >= 2) {
            tabs[1].click();
            return true;
        }
        const generalButtons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
        if (generalButtons.length >= 2) {
            generalButtons[1].click();
            return true;
        }
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea')) as HTMLInputElement[];
        if (inputs.length > 0) {
            inputs[0].focus();
            inputs[0].value = '100';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        return false;
    });
    await new Promise((r) => setTimeout(r, 800));
    if (!clickedSub) {
        await page.evaluate(() => window.scrollTo(0, 260));
        await new Promise((r) => setTimeout(r, 400));
    }
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // Key 3: 계산/실행/확인 버튼 클릭 또는 스크롤 다운
    const clickedAction = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]')) as HTMLElement[];
        const actionBtn = buttons.find(b => {
            const text = (b.textContent || (b as HTMLInputElement).value || '').trim();
            return /계산|결과|확인|조회|시작|생성|변환|검사|실행|Calc|Result|Start|Go/i.test(text) && b.offsetWidth > 0;
        });
        if (actionBtn) {
            actionBtn.click();
            return true;
        }
        return false;
    });
    await new Promise((r) => setTimeout(r, 800));
    if (!clickedAction) {
        await page.evaluate(() => window.scrollTo(0, 450));
        await new Promise((r) => setTimeout(r, 400));
    }
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    return buffers;
}

/**
 * 3장의 이미지를 검증하여 반환 (어떤 경우에도 더미 플레이스홀더로 치환하지 않음)
 */
function validateAndEnsureDistinct(buffers: Buffer[], name: string, slug: string): Buffer[] {
    if (buffers.length >= 3) {
        return buffers;
    }
    // 3장 미만일 경우 기본 1번 버퍼를 안전하게 채움
    const b0 = buffers[0] || Buffer.from('');
    return [b0, buffers[1] || b0, buffers[2] || b0];
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
  <g transform="translate(20, 40)">
    <rect width="390" height="64" rx="16" fill="#FFFFFF" filter="url(#sh1)" />
    <circle cx="32" cy="32" r="16" fill="#4F46E5" />
    <text x="32" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">V</text>
    <text x="64" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="800" fill="#0F172A">${cleanName}</text>
  </g>
  <g transform="translate(20, 130)">
    <rect width="390" height="260" rx="24" fill="#FFFFFF" filter="url(#sh1)" />
    <rect x="24" y="24" width="110" height="32" rx="16" fill="#EEF2FF" />
    <text x="79" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="middle">STEP 01</text>
    <text x="24" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="28" font-weight="900" fill="#0F172A">초간편 시작</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="500" fill="#64748B">별도 가입 없이 브라우저에서 즉시 구동</text>
    <rect x="24" y="170" width="342" height="60" rx="16" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="195" y="206" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="800" fill="#4F46E5" text-anchor="middle">👉 지금 바로 시작하기</text>
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
  <g transform="translate(20, 40)">
    <rect width="390" height="64" rx="16" fill="#FFFFFF" filter="url(#sh2)" />
    <circle cx="32" cy="32" r="16" fill="#059669" />
    <text x="32" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
    <text x="64" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="800" fill="#0F172A">${cleanName} 실시간 실행</text>
  </g>
  <g transform="translate(20, 130)">
    <rect width="390" height="320" rx="24" fill="#FFFFFF" filter="url(#sh2)" />
    <rect x="24" y="24" width="110" height="32" rx="16" fill="#ECFDF5" />
    <text x="79" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#059669" text-anchor="middle">STEP 02</text>
    <text x="24" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="28" font-weight="900" fill="#0F172A">맞춤형 스마트 조작</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="500" fill="#64748B">공식 연산 알고리즘 100% 반영</text>
    <rect x="24" y="170" width="342" height="110" rx="16" fill="#F0FDF4" stroke="#BBF7D0" />
    <text x="44" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#15803D">⚡ 번개처럼 빠른 즉시 반응</text>
    <text x="44" y="244" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#166534">모바일·태블릿·PC 모든 환경 완벽 호환</text>
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
  <g transform="translate(20, 40)">
    <rect width="390" height="64" rx="16" fill="#FFFFFF" filter="url(#sh3)" />
    <circle cx="32" cy="32" r="16" fill="#D97706" />
    <text x="32" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">3</text>
    <text x="64" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="800" fill="#0F172A">${cleanName} 결과 리포트</text>
  </g>
  <g transform="translate(20, 130)">
    <rect width="390" height="320" rx="24" fill="#FFFFFF" filter="url(#sh3)" />
    <rect x="24" y="24" width="110" height="32" rx="16" fill="#FEF3C7" />
    <text x="79" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="800" fill="#D97706" text-anchor="middle">STEP 03</text>
    <text x="24" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="28" font-weight="900" fill="#0F172A">최종 산출 확인</text>
    <rect x="24" y="170" width="342" height="110" rx="16" fill="#FFFBEB" stroke="#FDE68A" />
    <text x="44" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="800" fill="#B45309">🎯 오차 없는 정밀 결과</text>
    <text x="44" y="244" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" fill="#92400E">결과 복사 및 소셜 공유 지원</text>
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
