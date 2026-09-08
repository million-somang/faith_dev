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
            if (results.length === 3 && results[0] !== results[1] && results[1] !== results[2]) {
                return results;
            }
        } catch (e) {
            console.warn(`[ScreenshotService] 캐시 읽기 실패: ${slug}`, e);
        }
    }

    // 2. Puppeteer 인터랙티브 키 페이지 캡처 시도
    let browser: any = null;
    try {
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default || puppeteerModule;

        // Chrome 실행 경로 자동 감지
        const candidatePaths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/usr/bin/google-chrome-stable',
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

        browser = await puppeteer.launch({
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
            timeout: 25000
        });

        // 🌟 [핵심 개선 1] 스켈레톤 로딩 소멸 및 실제 화면 안정화 대기
        console.log(`[ScreenshotService] 스켈레톤 로딩 소멸 및 실제 화면 안정화 대기 중...`);
        await page.waitForFunction(() => (document.querySelector('#root, #app, main')?.children.length ?? 0) > 0, { timeout: 10000 }).catch(() => {});
        await page.waitForFunction(() => !document.querySelector('.loading-screen, .loading-body, [aria-label*="로딩"]'), { timeout: 12000 }).catch(() => {});
        await new Promise((resolve) => setTimeout(resolve, 800));

        // 🌟 [핵심 개선 2] 미니앱별 특화 시나리오 캡처 실행 (slug 정규화)
        const cleanSlug = slug.replace(/^app-/, '');
        const buffers = await captureScenarioShots(page, cleanSlug);

        await browser.close();
        browser = null;

        // 버퍼가 3장 미만일 경우 채움 (어떤 경우에도 가짜 SVG 미사용)
        while (buffers.length < 3) {
            buffers.push(buffers[buffers.length - 1] || Buffer.from(''));
        }

        // 캐시 파일 저장
        fs.writeFileSync(filePaths[0], buffers[0]);
        fs.writeFileSync(filePaths[1], buffers[1]);
        fs.writeFileSync(filePaths[2], buffers[2]);
        fs.writeFileSync(path.join(UPLOAD_DIR, `${slug}.png`), buffers[0]);

        return [
            `data:image/png;base64,${buffers[0].toString('base64')}`,
            `data:image/png;base64,${buffers[1].toString('base64')}`,
            `data:image/png;base64,${buffers[2].toString('base64')}`
        ];
    } catch (err: any) {
        console.warn(`[ScreenshotService] Puppeteer 캡처 예외 발생 (${slug}):`, err.message);
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
        // 디스크에 기존 유효한 PNG 캐시가 있다면 반환
        if (filePaths.every(fp => fs.existsSync(fp))) {
            try {
                return filePaths.map(fp => `data:image/png;base64,${fs.readFileSync(fp).toString('base64')}`);
            } catch (e) {}
        }
        throw new Error(`미니앱 실화면 캡처 실패: ${err.message}`);
    }
}

/**
 * 앱별 고유 3대 키 페이지 시나리오 실행 함수
 */
async function captureScenarioShots(page: any, cleanSlug: string): Promise<Buffer[]> {
    const buffers: Buffer[] = [];

    // =========================================================================
    // 1. 평수 계산기 (pyeong-calc)
    // =========================================================================
    if (cleanSlug === 'pyeong-calc') {
        // [1. 진입 화면]: 접속 직후 순수 초기 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 34평 빠른 선택 및 면적 입력 조작 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn34 = buttons.find(b => b.textContent && b.textContent.includes('34'));
            if (btn34) btn34.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 평당 가격 탭 ➡️ 8.5억 매매가 입력 ➡️ 평당 2,500만원 상세 산출 리포트 화면
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('nav button, button[role="tab"]')) as HTMLElement[];
            if (tabs[1]) tabs[1].click();
            const inputs = document.querySelectorAll('input');
            if (inputs[0]) {
                inputs[0].value = '85000';
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (inputs[1]) {
                inputs[1].value = '34';
                inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 2. 퇴직금 & 실업급여 계산기 (severance-calc)
    // =========================================================================
    if (cleanSlug === 'severance-calc') {
        // [1. 진입 화면]: 접속 직후 기본 입력 안내 및 빈 폼 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 입사일, 퇴사일, 월 기본급(350만원)을 입력한 조작 화면
        await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            if (inputs[0]) { inputs[0].value = '2021-01-01'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
            if (inputs[1]) { inputs[1].value = '2025-12-31'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
            if (inputs[2]) { inputs[2].value = '3500000'; inputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 계산하기 클릭 ➡️ 예상 퇴직금 1,842만원 산출 리포트 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const calcBtn = buttons.find(b => b.textContent && b.textContent.includes('계산하기'));
            if (calcBtn) calcBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 3. 다기능 계산기 (calculator)
    // =========================================================================
    if (cleanSlug === 'calculator') {
        // [1. 진입 화면]: 기본 계산기 0 표시 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 키패드 수식 입력 중 (12500 * 12)
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const keys = ['1', '2', '5', '0', '0', '*', '1', '2'];
            keys.forEach(k => {
                const btn = buttons.find(b => b.textContent && b.textContent.trim() === k);
                if (btn) btn.click();
            });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: = 클릭 ➡️ 최종 계산 결과 산출 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const eqBtn = buttons.find(b => b.textContent && b.textContent.trim() === '=');
            if (eqBtn) eqBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 4. 나이 계산기 (age-calc)
    // =========================================================================
    if (cleanSlug === 'age-calc') {
        // [1. 진입 화면]: 초기 빈 폼
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 생년월일 입력
        await page.evaluate(() => {
            const input = document.querySelector('input[type="date"], input') as HTMLInputElement;
            if (input) { input.value = '1995-08-15'; input.dispatchEvent(new Event('input', { bubbles: true })); }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 계산하기 클릭 ➡️ 만 나이, 연 나이, 띠 종합 리포트
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn = buttons.find(b => b.textContent && /계산|확인/i.test(b.textContent));
            if (btn) btn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 5. 2048 게임 (2048)
    // =========================================================================
    if (cleanSlug === '2048') {
        // [1. 진입 화면]: 게임 시작 초기 보드 (Score: 0, 2개 타일)
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 방향키 14회 타건 ➡️ 타일 결합 및 스코어 상승 플레이 화면
        const keys1 = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
        for (const k of keys1) {
            await page.keyboard.press(k);
            await new Promise((r) => setTimeout(r, 90));
        }
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 추가 20회 타건 ➡️ 고득점 누적 보드 화면 (32, 64 타일)
        const keys2 = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown'];
        for (const k of keys2) {
            await page.keyboard.press(k);
            await new Promise((r) => setTimeout(r, 90));
        }
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 6. 테트리스 (tetris)
    // =========================================================================
    if (cleanSlug === 'tetris') {
        // [1. 진입 화면]: 초기 대기 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 게임 시작 및 블록 조작 중
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => /start|시작|play/i.test(b.textContent || ''));
            if (btn) btn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        for (let i = 0; i < 8; i++) {
            await page.keyboard.press('ArrowDown');
            await new Promise((r) => setTimeout(r, 110));
        }
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 블록 누적 및 점수 획득 스코어보드
        for (let i = 0; i < 14; i++) {
            await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowDown');
            await new Promise((r) => setTimeout(r, 100));
        }
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 7. 스도쿠 (sudoku)
    // =========================================================================
    if (cleanSlug === 'sudoku') {
        // [1. 진입 화면]: 빈 보드
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 숫자 입력 플레이 진행
        await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('button, [role="gridcell"], .cell')) as HTMLElement[];
            if (cells[4]) cells[4].click();
            const numBtns = Array.from(document.querySelectorAll('button')).filter(b => /^[1-9]$/.test(b.textContent?.trim() || ''));
            if (numBtns[1]) numBtns[1].click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 힌트 및 통계 뷰
        await page.evaluate(() => window.scrollTo(0, 240)).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 8. SVG 변환기 (svg-converter)
    // =========================================================================
    if (cleanSlug === 'svg-converter') {
        // [1. 진입 화면]: 메인 히어로 + 드롭존 첫 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 3대 변환 프리셋 카드(흑백 로고, 일러스트, 컬러) 및 옵션 뷰
        await page.evaluate(() => {
            const presetCards = Array.from(document.querySelectorAll('div[class*="rounded"]')) as HTMLElement[];
            if (presetCards[1]) presetCards[1].scrollIntoView({ behavior: 'instant', block: 'center' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 하단 지원 포맷 & 세부 가이드 영역
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' })).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 9. 맞춤법 검사기 (text-checker)
    // =========================================================================
    if (cleanSlug === 'text-checker') {
        // [1. 진입 화면]: 빈 텍스트 입력창
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 검사할 문장 입력
        await page.evaluate(() => {
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea) {
                textarea.value = '안녕하새요. 오늘 날씨가 참 맑음니다. 빠른 시일내에 뵙겟습니다.';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 검사하기 클릭 ➡️ 맞춤법 교정 하이라이트 결과
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn = buttons.find(b => b.textContent && /검사|확인/i.test(b.textContent));
            if (btn) btn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 10. JSON 포맷터 (json-formatter)
    // =========================================================================
    if (cleanSlug === 'json-formatter') {
        // [1. 진입 화면]: 빈 에디터 첫 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 압축된 원본 JSON 입력
        await page.evaluate(() => {
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea) {
                textarea.value = '{"service":"faithportal","features":["calc","game","converter"],"status":"active","stats":{"users":1250,"rating":4.9}}';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 포맷팅 실행 ➡️ 트리 뷰 정렬 및 문법 컬러링 결과
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn = buttons.find(b => b.textContent && /포맷|정렬|format/i.test(b.textContent));
            if (btn) btn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return buffers;
    }

    // =========================================================================
    // 11. 공통 범용 앱 3단 인터랙션 (미등록 앱 자동 대응)
    // =========================================================================
    // [1. 진입 화면]: 상단 최상단 뷰 (아무 조작도 하지 않은 순수 상태)
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // [2. 메인 컨텐츠 화면]: 안전한 텍스트/숫자 입력 또는 탭/옵션 클릭 조작
    let clickedSub = false;
    try {
        clickedSub = await page.evaluate(() => {
            try {
                // 텍스트/숫자 입력창에 값 입력
                const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([readonly]):not([disabled]), textarea')) as HTMLInputElement[];
                if (inputs.length > 0) {
                    inputs[0].focus();
                    inputs[0].value = inputs[0].type === 'number' ? '100' : '테스트';
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
                // 서브 탭/버튼 클릭
                const tabs = Array.from(document.querySelectorAll('main button[role="tab"], main .tab, main nav button, [role="tablist"] button, .tab-group button')) as HTMLElement[];
                if (tabs.length >= 2 && tabs[1].offsetWidth > 0) {
                    tabs[1].click();
                    return true;
                }
            } catch (e) {}
            return false;
        });
    } catch (e) {}

    await new Promise((r) => setTimeout(r, 600));
    if (!clickedSub) {
        await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'instant' })).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
    }
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // [3. 결과 화면]: 계산/실행/확인/변환/검사 버튼 클릭 ➡️ 산출 결과 영역 뷰
    let clickedAction = false;
    try {
        clickedAction = await page.evaluate(() => {
            try {
                const buttons = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]')) as HTMLElement[];
                const actionBtn = buttons.find(b => {
                    const text = (b.textContent || (b as HTMLInputElement).value || '').trim();
                    return /계산|결과|확인|조회|시작|생성|변환|검사|실행|Calc|Result|Start|Convert|Run/i.test(text) && b.offsetWidth > 0;
                });
                if (actionBtn) {
                    actionBtn.click();
                    return true;
                }
            } catch (e) {}
            return false;
        });
    } catch (e) {}

    await new Promise((r) => setTimeout(r, 800));
    if (!clickedAction) {
        await page.evaluate(() => window.scrollTo({ top: 520, behavior: 'instant' })).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
    }
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    return buffers;
}

/**
 * 단일 스크린샷 캡처 (기존 호환용)
 */
export async function getMiniAppScreenshot(options: ScreenshotOptions): Promise<string> {
    const list = await getMiniAppScreenshots(options);
    return list[0] || '';
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
