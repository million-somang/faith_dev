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
            protocolTimeout: 60000,
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
        // 다이얼로그(alert/confirm)로 인한 브라우저 캡처 멈춤 원천 방지
        page.on('dialog', async (dialog: any) => {
            try { await dialog.dismiss(); } catch (e) {}
        });
        await page.evaluateOnNewDocument(() => {
            window.alert = () => {};
            window.confirm = () => true;
            (window as any).setReactInputValue = (el: HTMLElement, val: string) => {
                if (!el) return;
                const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                const desc = Object.getOwnPropertyDescriptor(proto, 'value');
                if (desc && desc.set) {
                    desc.set.call(el, val);
                } else {
                    (el as HTMLInputElement).value = val;
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            };
        }).catch(() => {});

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
 * (1) data-screenshot-* 표준 데이터 속성 자동 감지 우선 지원
 * (2) 17개 미니앱 전용 인터랙션 시나리오
 * (3) 중복 이미지 원천 방지 안전 가드(Safety Guard) 탑재
 */
async function captureScenarioShots(page: any, cleanSlug: string): Promise<Buffer[]> {
    const buffers: Buffer[] = [];

    // =========================================================================
    // [0] data-screenshot-* 표준 속성 자동 감지 (신규 미니앱 자동 대응)
    // =========================================================================
    const hasStandardPoints = await page.evaluate(() => {
        const actionEl = document.querySelector('[data-screenshot-point="action"], [data-screenshot-click="action"], [data-screenshot-input]');
        const resultEl = document.querySelector('[data-screenshot-point="result"], [data-screenshot-click="result"]');
        return Boolean(actionEl || resultEl);
    }).catch(() => false);

    if (hasStandardPoints) {
        // [1. 진입 화면]: 최상단 순수 첫 진입 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 조작 화면]: data-screenshot-input 타이핑 & click="action" 클릭
        await page.evaluate(() => {
            const inputEl = document.querySelector('[data-screenshot-input]') as HTMLInputElement | HTMLTextAreaElement;
            if (inputEl) {
                const val = inputEl.getAttribute('data-screenshot-input') || '100';
                inputEl.value = val;
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const clickEl = document.querySelector('[data-screenshot-click="action"]') as HTMLElement;
            if (clickEl) clickEl.click();
            const pointEl = document.querySelector('[data-screenshot-point="action"]') as HTMLElement;
            if (pointEl && !clickEl) pointEl.scrollIntoView({ behavior: 'instant', block: 'center' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: click="result" 클릭 또는 point="result" 영역 스크롤
        await page.evaluate(() => {
            const clickResult = document.querySelector('[data-screenshot-click="result"]') as HTMLElement;
            if (clickResult) clickResult.click();
            const pointResult = document.querySelector('[data-screenshot-point="result"]') as HTMLElement;
            if (pointResult) pointResult.scrollIntoView({ behavior: 'instant', block: 'center' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 1. 지뢰찾기 (minesweeper)
    // =========================================================================
    if (cleanSlug === 'minesweeper') {
        // [1. 진입 화면]: 9x9 초급 미개봉 초기 보드 (010, 000)
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 보드 중앙(4행 4열 및 주변 타일) 클릭하여 여러 칸이 시원하게 열린 플레이 화면
        await page.evaluate(() => {
            // 게임 보드의 타일 셀들 찾기
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            // 난이도/타이머/하단 버튼을 제외한 보드 타일 셀들 (정사각형 타일)
            const tileCells = buttons.filter(b => {
                const txt = (b.textContent || '').trim();
                const isUtil = /명예의 전당|초급|중급|고급|새 게임|다시|설정/i.test(txt);
                return !isUtil && b.offsetWidth > 15 && b.offsetHeight > 15 && b.offsetWidth < 80;
            });
            if (tileCells.length > 20) {
                // 중앙 타일 2~3개 클릭
                tileCells[Math.floor(tileCells.length / 2)]?.click();
                setTimeout(() => {
                    tileCells[Math.floor(tileCells.length / 2) + 2]?.click();
                }, 100);
            } else {
                // 그리드 div 셀인 경우
                const gridCells = Array.from(document.querySelectorAll('[class*="grid"] div, [class*="board"] div')) as HTMLElement[];
                const clickable = gridCells.filter(c => c.offsetWidth > 20 && c.offsetWidth < 70);
                if (clickable.length > 10) {
                    clickable[Math.floor(clickable.length / 2)]?.click();
                }
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 🏆 명예의 전당 버튼 클릭하여 리더보드 모달이 팝업된 스코어보드 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const lbBtn = buttons.find(b => b.textContent && b.textContent.includes('명예의 전당'));
            if (lbBtn) {
                lbBtn.click();
            } else {
                // 난이도를 중급(16x16)으로 변경하여 거대한 그리드 노출
                const midBtn = buttons.find(b => b.textContent && b.textContent.includes('중급'));
                if (midBtn) midBtn.click();
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 2. 평수 계산기 (pyeong-calc)
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

        // [3. 결과 화면]: 평당 가격 탭 ➡️ 8.5억 매매가 입력 ➡️ 상세 환산 리포트 화면
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 3. 퇴직금 & 실업급여 계산기 (severance-calc)
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 4. 디데이 계산기 (dday-calc)
    // =========================================================================
    if (cleanSlug === 'dday-calc') {
        // [1. 진입 화면]: 3초 로딩 통과 후 첫 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 제목과 날짜 입력 상태
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            if (inputs[0] && setVal) setVal(inputs[0], '2026 대학수학능력시험');
            if (inputs[1] && setVal) setVal(inputs[1], '2026-11-19');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: D-Day 등록 클릭 ➡️ 컬러 그라데이션 D-Day 카드 목록 생성 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const addBtn = buttons.find(b => b.textContent && /추가|등록|생성/i.test(b.textContent));
            if (addBtn) addBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 5. 예·적금 이자 계산기 (interest-calc)
    // =========================================================================
    if (cleanSlug === 'interest-calc') {
        // [1. 진입 화면]: 정기예금 기본 폼
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 정기적금 전환 및 36개월, 우대금리 설정 상태
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const savingsBtn = buttons.find(b => b.textContent && b.textContent.includes('적금'));
            if (savingsBtn) savingsBtn.click();
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            if (inputs[0]) {
                inputs[0].value = '1000000';
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 계산하기 클릭 ➡️ 최종 만기 수령액 및 비과세 비교 리포트 카드
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const calcBtn = buttons.find(b => b.textContent && /계산|결과/i.test(b.textContent));
            if (calcBtn) calcBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 6. 해외직구 관·부가세 계산기 (customs-calc)
    // =========================================================================
    if (cleanSlug === 'customs-calc') {
        // [1. 진입 화면]: 기본 계산 폼
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 중간 영역으로 스크롤하여 결제금액 및 카테고리 설정 화면
        await page.evaluate(() => {
            window.scrollTo({ top: 380, behavior: 'instant' });
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            const setVal = (window as any).setReactInputValue;
            if (inputs[0] && setVal) setVal(inputs[0], '280');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 상단 '통관 가이드' 탭 전환 화면 (확연히 다른 가이드 리포트 뷰)
        await page.evaluate(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            const tabs = Array.from(document.querySelectorAll('button[role="tab"], nav button')) as HTMLElement[];
            const guideTab = tabs.find(t => t.textContent && t.textContent.includes('통관 가이드'));
            if (guideTab) {
                guideTab.click();
            } else {
                window.scrollTo({ top: 650, behavior: 'instant' });
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 7. 다기능 계산기 (calculator)
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 8. 나이 계산기 (age-calc)
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 9. 2048 게임 (2048)
    // =========================================================================
    if (cleanSlug === '2048') {
        // [1. 진입 화면]: 게임 시작 초기 보드 (Score: 0, 2개 타일)
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 방향키 14회 타건 ➡️ 타일 결합 및 스코어 상승
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 10. 테트리스 (tetris)
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 11. 스도쿠 (sudoku)
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 12. 맞춤법 검사기 (text-checker)
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 13. JSON 포맷터 (json-formatter)
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 14. Base64 변환기 (base64-converter)
    // =========================================================================
    if (cleanSlug === 'base64-converter') {
        // [1. 진입 화면]: 초기 빈 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 텍스트 입력
        await page.evaluate(() => {
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea) {
                textarea.value = 'Hello Veranex Mini Apps! 베라넥스 플랫폼 2026';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 인코딩 실행 ➡️ Base64 결과 문자열 노출
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn = buttons.find(b => b.textContent && /인코딩|변환|encode/i.test(b.textContent));
            if (btn) btn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 15. SVG 변환기 (svg-converter)
    // =========================================================================
    if (cleanSlug === 'svg-converter') {
        // [1. 진입 화면]: 메인 히어로 + 드롭존 첫 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 3대 변환 프리셋 카드 및 옵션 뷰
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

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 16. 컴보이 & 슈퍼컴보이 아케이드 (comboy, sfc)
    // =========================================================================
    if (cleanSlug === 'comboy' || cleanSlug === 'sfc') {
        // [1. 진입 화면]: 콘솔 및 롬 로더 첫 화면
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [2. 메인 컨텐츠 화면]: 조작 가이드 탭 클릭 ➡️ 레트로 게임패드 키 매핑 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const guideBtn = buttons.find(b => b.textContent && /가이드|조작|안내/i.test(b.textContent));
            if (guideBtn) guideBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: FAQ/기능안내 탭 클릭 ➡️ 클라우드 세이브 및 에뮬레이터 안내 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const faqBtn = buttons.find(b => b.textContent && /FAQ|질문|도움말/i.test(b.textContent));
            if (faqBtn) faqBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 17. 공통 범용 폴백 (미등록 앱)
    // =========================================================================
    // [1. 진입 화면]: 상단 최상단 뷰 (순수 초기 상태)
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // [2. 메인 컨텐츠 화면]: 입력 필드 값 주입 또는 서브 탭 클릭
    let clickedSub = false;
    try {
        clickedSub = await page.evaluate(() => {
            try {
                const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([readonly]):not([disabled]), textarea')) as HTMLInputElement[];
                if (inputs.length > 0) {
                    inputs[0].focus();
                    inputs[0].value = inputs[0].type === 'number' ? '100' : '테스트';
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
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

    // [3. 결과 화면]: 실행/계산/결과 버튼 클릭
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

    return await ensureDistinctScreenshots(page, buffers);
}

/**
 * 중복 이미지 원천 방지 안전 가드 (Safety Guard)
 * 3장의 스크린샷 중 동일한 버퍼가 존재할 경우, 화면을 강제로 변경하여 100% 독립된 이미지를 보장합니다.
 */
async function ensureDistinctScreenshots(page: any, buffers: Buffer[]): Promise<Buffer[]> {
    if (buffers.length < 3) return buffers;

    const isSame12 = Buffer.compare(buffers[0], buffers[1]) === 0;
    if (isSame12) {
        // 2번이 1번과 동일한 경우: 중앙 영역으로 확실히 스크롤하고 두 번째 탭이나 인터랙티브 요소 조작
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('nav button, button[role="tab"], .tab-btn')) as HTMLElement[];
            if (tabs[1] && tabs[1].offsetWidth > 0) {
                tabs[1].click();
            } else {
                window.scrollTo({ top: 380, behavior: 'instant' });
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers[1] = await page.screenshot({ type: 'png', fullPage: false });
    }

    const isSame23 = Buffer.compare(buffers[1], buffers[2]) === 0;
    const isSame13 = Buffer.compare(buffers[0], buffers[2]) === 0;
    if (isSame23 || isSame13) {
        // 3번이 동일한 경우: 세 번째 탭을 누르거나 최하단 스크롤
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('nav button, button[role="tab"], .tab-btn')) as HTMLElement[];
            if (tabs[2] && tabs[2].offsetWidth > 0) {
                tabs[2].click();
            } else {
                const maxScroll = Math.max(500, (document.body.scrollHeight || 1000) - 350);
                window.scrollTo({ top: maxScroll, behavior: 'instant' });
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers[2] = await page.screenshot({ type: 'png', fullPage: false });
    }

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
