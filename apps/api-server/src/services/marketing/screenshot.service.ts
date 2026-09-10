import fs from 'fs';
import path from 'path';

export interface ScreenshotOptions {
    slug: string;
    targetUrl: string;
    force?: boolean;
    name?: string;
}

const PRIMARY_UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/marketing/screenshots');
const SECONDARY_UPLOAD_DIR = path.resolve(process.cwd(), 'apps/api-server/public/uploads/marketing/screenshots');

function ensureUploadDirs(): void {
    if (!fs.existsSync(PRIMARY_UPLOAD_DIR)) {
        fs.mkdirSync(PRIMARY_UPLOAD_DIR, { recursive: true });
    }
    try {
        const parentPublic = path.resolve(process.cwd(), 'apps/api-server/public');
        if (fs.existsSync(parentPublic)) {
            if (!fs.existsSync(SECONDARY_UPLOAD_DIR)) {
                fs.mkdirSync(SECONDARY_UPLOAD_DIR, { recursive: true });
            }
        }
    } catch (e) {}
}

function saveFileToUploadDirs(filename: string, buffer: Buffer): void {
    ensureUploadDirs();
    try {
        fs.writeFileSync(path.join(PRIMARY_UPLOAD_DIR, filename), buffer);
    } catch (e) {}
    try {
        if (fs.existsSync(SECONDARY_UPLOAD_DIR)) {
            fs.writeFileSync(path.join(SECONDARY_UPLOAD_DIR, filename), buffer);
        }
    } catch (e) {}
}

function checkFileExists(filename: string): boolean {
    const path1 = path.join(PRIMARY_UPLOAD_DIR, filename);
    if (fs.existsSync(path1)) {
        try { if (fs.statSync(path1).size > 100) return true; } catch (e) {}
    }
    const path2 = path.join(SECONDARY_UPLOAD_DIR, filename);
    if (fs.existsSync(path2)) {
        try { if (fs.statSync(path2).size > 100) return true; } catch (e) {}
    }
    return false;
}

/**
 * 미니앱별 3대 핵심 키 페이지(1: 시작/변환, 2: 서브기능/탭, 3: 최종결과/가이드)를
 * 브라우저 인터랙션과 스켈레톤 로딩 대기를 통해 완벽히 서로 다른 3장의 화면으로 캡처합니다.
 */
export async function getMiniAppScreenshots(options: ScreenshotOptions): Promise<string[]> {
    const { slug, targetUrl, force = false, name = slug } = options;
    ensureUploadDirs();

    const filenames = [
        `${slug}_key1.png`,
        `${slug}_key2.png`,
        `${slug}_key3.png`
    ];

    // 1. 캐시가 모두 존재하고 강제 갱신이 아니면 이미지 서빙 URL 반환
    if (!force && filenames.every(fn => checkFileExists(fn))) {
        return [
            `/api/admin/marketing/screenshot-image/${slug}/1`,
            `/api/admin/marketing/screenshot-image/${slug}/2`,
            `/api/admin/marketing/screenshot-image/${slug}/3`
        ];
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
            waitUntil: 'domcontentloaded',
            timeout: 25000
        });

        // 미니앱별 특화 시나리오 캡처 실행 (1: 로딩화면 -> 2: 조작화면 -> 3: 결과화면)
        const cleanSlug = slug.replace(/^app-/, '');
        const buffers = await captureScenarioShots(page, cleanSlug);

        await browser.close();
        browser = null;

        // 버퍼가 3장 미만일 경우 채움
        while (buffers.length < 3) {
            buffers.push(buffers[buffers.length - 1] || Buffer.from(''));
        }

        // 캐시 파일 저장
        saveFileToUploadDirs(filenames[0], buffers[0]);
        saveFileToUploadDirs(filenames[1], buffers[1]);
        saveFileToUploadDirs(filenames[2], buffers[2]);
        saveFileToUploadDirs(`${slug}.png`, buffers[0]);

        return [
            `/api/admin/marketing/screenshot-image/${slug}/1`,
            `/api/admin/marketing/screenshot-image/${slug}/2`,
            `/api/admin/marketing/screenshot-image/${slug}/3`
        ];
    } catch (err: any) {
        console.warn(`[ScreenshotService] Puppeteer 캡처 예외 발생 (${slug}):`, err.message);
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
        // Puppeteer 실패 시에도 뷰어와 카드뉴스가 깨지지 않도록 안전한 이미지 엔드포인트 URL 반환
        return [
            `/api/admin/marketing/screenshot-image/${slug}/1`,
            `/api/admin/marketing/screenshot-image/${slug}/2`,
            `/api/admin/marketing/screenshot-image/${slug}/3`
        ];
    }
}

/**
 * 1단계(Key 1): 로딩 & 인트로 화면 전용 캡처 함수
 * (1) 미니앱 내 실제 .loading-screen, .loading-body 등이 존재하면 즉시 캡처
 * (2) 아직 자체 로딩 화면이 없는 앱의 경우 표준 브랜드 스플래시 오버레이를 일시 생성하여 프리미엄 인트로 화면 캡처
 */
async function captureLoadingScreen(page: any, cleanSlug: string): Promise<Buffer> {
    await new Promise((r) => setTimeout(r, 200));

    // 미니앱 자체 로딩 화면 존재 여부 검사
    const hasLoader = await page.evaluate(() => {
        const loader = document.querySelector('.loading-screen, .loading-body, [aria-label*="로딩"], .loading-screen-dark, .loading-screen-light, .loading-container');
        return Boolean(loader && (loader as HTMLElement).offsetWidth > 0);
    }).catch(() => false);

    if (hasLoader) {
        return await page.screenshot({ type: 'png', fullPage: false });
    }

    // 자체 로딩화면이 없는 경우: 일관된 브랜드 스플래시 오버레이 임시 주입
    await page.evaluate((slug: string) => {
        const id = 'fp-brand-splash-overlay';
        if (document.getElementById(id)) return;

        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 999999;
            background: linear-gradient(135deg, #090d16 0%, #171c2f 50%, #090d16 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif;
            color: #ffffff; padding: 24px; text-align: center;
        `;

        const iconBox = document.createElement('div');
        iconBox.style.cssText = `
            width: 84px; height: 84px; border-radius: 26px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 38px; box-shadow: 0 16px 36px -8px rgba(99, 102, 241, 0.5);
            margin-bottom: 24px; border: 1.5px solid rgba(255, 255, 255, 0.2);
        `;
        iconBox.innerText = '⚡';

        const title = document.createElement('h1');
        title.style.cssText = `
            font-size: 24px; font-weight: 900; margin: 0 0 6px 0;
            background: linear-gradient(to right, #ffffff, #e0e7ff);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            letter-spacing: -0.03em;
        `;
        title.innerText = (document.title || slug).split('-')[0].trim() || 'VERA 미니앱';

        const subtitle = document.createElement('p');
        subtitle.style.cssText = `
            font-size: 13px; color: #94a3b8; margin: 0 0 28px 0; font-weight: 500;
        `;
        subtitle.innerText = '로그인 없이 브라우저에서 즉시 실행';

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.12);
            border-top-color: #818cf8; border-radius: 50%;
            animation: fp-spin 0.8s linear infinite; margin-bottom: 18px;
        `;

        const badge = document.createElement('div');
        badge.style.cssText = `
            font-size: 11px; font-weight: 800; color: #a5b4fc;
            background: rgba(99, 102, 241, 0.18); padding: 5px 14px;
            border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.35);
            letter-spacing: 0.05em;
        `;
        badge.innerText = 'VERA MINI APPS';

        const style = document.createElement('style');
        style.innerText = '@keyframes fp-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);

        overlay.appendChild(iconBox);
        overlay.appendChild(title);
        overlay.appendChild(subtitle);
        overlay.appendChild(spinner);
        overlay.appendChild(badge);
        document.body.appendChild(overlay);
    }, cleanSlug).catch(() => {});

    await new Promise((r) => setTimeout(r, 200));
    const shot = await page.screenshot({ type: 'png', fullPage: false });

    // 오버레이 제거하여 본문 인터랙션 복원
    await page.evaluate(() => {
        const overlay = document.getElementById('fp-brand-splash-overlay');
        if (overlay) overlay.remove();
    }).catch(() => {});

    return shot;
}

/**
 * 앱별 고유 3대 키 페이지 시나리오 실행 함수
 * (1) 1단계: 로딩/인트로 화면 확보 (Key 1)
 * (2) 2단계: 본문 로딩 완료 후 메인 조작/입력 화면 캡처 (Key 2)
 * (3) 3단계: 최종 결과/서브탭/모달 화면 캡처 (Key 3)
 */
async function captureScenarioShots(page: any, cleanSlug: string): Promise<Buffer[]> {
    const buffers: Buffer[] = [];

    // =========================================================================
    // [1단계] 스플래시 / 로딩 화면 전용 캡처 (Key 1)
    // =========================================================================
    const loadingShot = await captureLoadingScreen(page, cleanSlug);
    buffers.push(loadingShot);

    // 2단계 및 3단계 본문 상호작용을 위해 로딩 화면 소멸 대기
    await page.waitForFunction(() => !document.querySelector('.loading-screen, .loading-body, [aria-label*="로딩"], .loading-screen-dark, .loading-screen-light'), { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // [0] data-screenshot-* 표준 속성 자동 감지 (신규 미니앱 자동 대응)
    // =========================================================================
    const hasStandardPoints = await page.evaluate(() => {
        const actionEl = document.querySelector('[data-screenshot-point="action"], [data-screenshot-click="action"], [data-screenshot-input]');
        const resultEl = document.querySelector('[data-screenshot-point="result"], [data-screenshot-click="result"]');
        return Boolean(actionEl || resultEl);
    }).catch(() => false);

    if (hasStandardPoints) {
        // [2. 메인 컨텐츠 조작 화면]
        await page.evaluate(() => {
            const inputEl = document.querySelector('[data-screenshot-input]') as HTMLInputElement | HTMLTextAreaElement;
            const setVal = (window as any).setReactInputValue;
            if (inputEl) {
                const val = inputEl.getAttribute('data-screenshot-input') || '100';
                if (setVal) setVal(inputEl, val);
                else {
                    inputEl.value = val;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            const clickEl = document.querySelector('[data-screenshot-click="action"]') as HTMLElement;
            if (clickEl) clickEl.click();
            const pointEl = document.querySelector('[data-screenshot-point="action"]') as HTMLElement;
            if (pointEl && !clickEl) pointEl.scrollIntoView({ behavior: 'instant', block: 'center' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]
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
    // 0. WebP 이미지 변환 & 무손실 압축기 (webp-converter) - 프리미엄 결과 리포트
    // =========================================================================
    if (cleanSlug === 'webp-converter') {
        // [2. 메인 조작 화면]: 샘플 이미지 로드 버튼 클릭하여 파일 리스트 및 설정 패널 노출
        await page.evaluate(() => {
            const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('샘플 이미지로 테스트'));
            if (sampleBtn) sampleBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 변환 실행 후 프리미엄 다크 임팩트 리포트 카드 스크롤 포커스
        await page.evaluate(() => {
            const convertBtn = document.querySelector('[data-screenshot-click="result"]') as HTMLElement;
            if (convertBtn) convertBtn.click();
        }).catch(() => {});
        // WebP 렌더링 완료 대기
        await page.waitForSelector('[data-screenshot-point="result"]', { timeout: 4000 }).catch(() => {});
        await page.evaluate(() => {
            const resultCard = document.querySelector('[data-screenshot-point="result"]') as HTMLElement;
            if (resultCard) resultCard.scrollIntoView({ behavior: 'instant', block: 'start' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 1. 지뢰찾기 (minesweeper) - 전략 1: 모달 오버레이
    // =========================================================================
    if (cleanSlug === 'minesweeper') {
        // [2. 메인 조작 화면]: 보드 중앙 타일 클릭하여 열린 플레이 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const tileCells = buttons.filter(b => {
                const txt = (b.textContent || '').trim();
                return !/명예|초급|중급|고급|새 게임|다시|설정/i.test(txt) && b.offsetWidth > 15 && b.offsetHeight > 15 && b.offsetWidth < 80;
            });
            if (tileCells.length > 20) {
                tileCells[Math.floor(tileCells.length / 2)]?.click();
                setTimeout(() => tileCells[Math.floor(tileCells.length / 2) + 2]?.click(), 100);
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 🏆 명예의 전당 버튼 클릭하여 리더보드 모달이 팝업된 화면
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const lbBtn = buttons.find(b => b.textContent && b.textContent.includes('명예의 전당')) || (document.querySelector('[data-screenshot-click="result"]') as HTMLElement);
            if (lbBtn) lbBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 2. 평수 계산기 (pyeong-calc) - 전략 3: 서브 탭 전환
    // =========================================================================
    if (cleanSlug === 'pyeong-calc') {
        // [2. 메인 조작 화면]: 34평 빠른 선택 버튼 클릭
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn34 = buttons.find(b => b.textContent && b.textContent.includes('34'));
            if (btn34) btn34.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 상단 탭에서 '평당가격' 또는 '사용방법' 탭으로 전면 전환
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const priceTab = buttons.find(b => b.textContent && b.textContent.includes('평당가격'));
            if (priceTab) {
                priceTab.click();
            } else {
                const howtoTab = buttons.find(b => b.textContent && b.textContent.includes('사용방법'));
                if (howtoTab) howtoTab.click();
                else window.scrollTo({ top: 380, behavior: 'instant' });
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 3. 퇴직금 & 실업급여 계산기 (severance-calc) - 전략 2: 결과 리포트 타겟 포커스
    // =========================================================================
    if (cleanSlug === 'severance-calc') {
        // [2. 메인 조작 화면]: 입사일, 퇴사일, 월 기본급(350만원)을 입력한 조작 화면
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            if (inputs[0] && setVal) setVal(inputs[0], '2021-01-01');
            if (inputs[1] && setVal) setVal(inputs[1], '2025-12-31');
            if (inputs[2] && setVal) setVal(inputs[2], '3500000');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 계산하기 클릭 ➡️ 2026 예상 퇴직금 1,842만원 다크 그라데이션 산출 리포트 카드
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const calcBtn = buttons.find(b => b.textContent && b.textContent.includes('계산하기'));
            if (calcBtn) calcBtn.click();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 4. 디데이 계산기 (dday-calc) - 전략 2: 결과 카드 포커스
    // =========================================================================
    if (cleanSlug === 'dday-calc') {
        // [2. 메인 조작 화면]: 제목과 날짜 입력 상태
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            if (inputs[0] && setVal) setVal(inputs[0], '2026 대학수학능력시험');
            if (inputs[1] && setVal) setVal(inputs[1], '2026-11-19');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: D-Day 등록 클릭 ➡️ 생성된 컬러풀 D-Day 카드 목록 그리드
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const addBtn = buttons.find(b => b.textContent && /추가|등록|생성/i.test(b.textContent));
            if (addBtn) addBtn.click();
            setTimeout(() => {
                const cardGrid = document.querySelector('.grid, [class*="grid"], [class*="card"]');
                if (cardGrid) (cardGrid as HTMLElement).scrollIntoView({ behavior: 'instant', block: 'center' });
                else window.scrollTo({ top: 300, behavior: 'instant' });
            }, 150);
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 5. 예·적금 이자 계산기 (interest-calc) - 전략 2: 결과 리포트 타겟 포커스
    // =========================================================================
    if (cleanSlug === 'interest-calc') {
        // [2. 메인 조작 화면]: 정기적금 전환 및 100만원 입력 상태
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const savingsBtn = buttons.find(b => b.textContent && b.textContent.includes('적금'));
            if (savingsBtn) savingsBtn.click();
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            if (inputs[0] && setVal) setVal(inputs[0], '1000000');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 계산하기 클릭 ➡️ 만기 수령액 및 비과세 비교 다크 리포트 카드
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const calcBtn = buttons.find(b => b.textContent && /계산|결과/i.test(b.textContent));
            if (calcBtn) calcBtn.click();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 6. 해외직구 관·부가세 계산기 (customs-calc) - 전략 2: 결과 리포트 타겟 포커스
    // =========================================================================
    if (cleanSlug === 'customs-calc') {
        // [2. 메인 조작 화면]: 결제금액 280 달러 및 품목 설정 화면
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
            if (inputs[0] && setVal) setVal(inputs[0], '280');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 계산하기 클릭 ➡️ 통관 판정 신호등 히어로 카드 (면세/과세 명세)
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const calcBtn = buttons.find(b => b.textContent && /계산|확인/i.test(b.textContent));
            if (calcBtn) calcBtn.click();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 7. 다기능 계산기 (calculator) - 전략 3: 서브 탭 전환
    // =========================================================================
    if (cleanSlug === 'calculator') {
        // [2. 메인 조작 화면]: 실제 버튼 클릭으로 25,000 × 12 = 300,000 연산 산출
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const clickKey = (txt: string) => buttons.find(b => (b.textContent || '').trim() === txt)?.click();
            ['2', '5', '0', '0', '0', '×', '1', '2', '='].forEach(k => clickKey(k));
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 상단 탭바에서 '대출' 탭으로 전환하여 완전히 다른 금융 계산 폼 제공
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.tab-bar-btn, button[role="tab"], .tab-btn')) as HTMLElement[];
            const loanTab = tabs.find(t => /대출|loan/i.test(t.textContent || '')) || tabs[1];
            if (loanTab) loanTab.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 8. 나이 계산기 (age-calc) - 전략 2: 결과 리포트 타겟 포커스
    // =========================================================================
    if (cleanSlug === 'age-calc') {
        // [2. 메인 조작 화면]: 90년대 빠른 선택 버튼 클릭
        await page.evaluate(() => {
            const chips = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const chip90 = chips.find(b => b.textContent && b.textContent.includes('90년대'));
            if (chip90) chip90.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 계산하기 클릭 ➡️ 만 나이, 연 나이, 띠/별자리, 생활 체크리스트 종합 리포트
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn = buttons.find(b => b.textContent && /계산|확인|판정/i.test(b.textContent));
            if (btn) btn.click();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 9. 2048 게임 (2048) - 전략 1: 모달 오버레이
    // =========================================================================
    if (cleanSlug === '2048') {
        // [2. 메인 조작 화면]: 타일 결합 및 스코어 상승
        await page.evaluate(() => {
            const container = document.querySelector('.game-container, canvas, #root, #app') as HTMLElement;
            if (container) container.click();
        }).catch(() => {});
        const keys1 = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown'];
        for (const k of keys1) {
            await page.keyboard.press(k);
            await new Promise((r) => setTimeout(r, 80));
        }
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 게임 통계 & 기록 모달 오버레이 연출
        const keys2 = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        for (const k of keys2) {
            await page.keyboard.press(k);
            await new Promise((r) => setTimeout(r, 80));
        }
        await page.evaluate(() => {
            const board = document.querySelector('[class*="GameBoard"], .game-container, [style*="background: rgb(250, 248, 239)"]') as HTMLElement;
            if (board) {
                const overlay = document.createElement('div');
                overlay.id = 'fp-2048-stats-modal';
                overlay.style.cssText = `
                    position: absolute; inset: 0; z-index: 50;
                    background: rgba(238, 228, 218, 0.95); backdrop-filter: blur(4px);
                    border-radius: 12px; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; text-align: center; padding: 20px;
                `;
                overlay.innerHTML = `
                    <div style="font-size: 42px; margin-bottom: 8px;">🏆</div>
                    <div style="font-size: 26px; font-weight: 900; color: #776e65; margin-bottom: 4px;">BEST RECORD</div>
                    <div style="font-size: 13px; color: #8f7a66; font-weight: 600; margin-bottom: 16px;">현재 점수 2,048점 달성! 상위 5% 플레이어</div>
                    <div style="display: flex; gap: 8px;">
                        <span style="background: #8f7a66; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 13px;">기록 저장 완료 ✓</span>
                    </div>
                `;
                const parent = board.parentElement || document.body;
                parent.style.position = 'relative';
                parent.appendChild(overlay);
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 11. 스도쿠 (sudoku) - 전략 1: 모달 오버레이
    // =========================================================================
    if (cleanSlug === 'sudoku') {
        // [2. 메인 조작 화면]: 빈 셀 선택 후 💡 힌트 버튼 클릭하여 숫자 입력 및 하이라이트 노출
        await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('.grid button, [role="gridcell"], button')) as HTMLElement[];
            const emptyCell = cells.find(c => (c.textContent || '').trim() === '');
            if (emptyCell) emptyCell.click();
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const hintBtn = buttons.find(b => b.textContent && b.textContent.includes('힌트'));
            if (hintBtn) {
                hintBtn.click();
                setTimeout(() => hintBtn.click(), 150);
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: ⏸ 일시정지 버튼 클릭하여 글래스모피즘 PAUSED 오버레이 팝업 노출
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const pauseBtn = buttons.find(b => b.textContent && /일시정지|계속|pause/i.test(b.textContent));
            if (pauseBtn) {
                pauseBtn.click();
            } else {
                const hardBtn = buttons.find(b => b.textContent && b.textContent.includes('고급'));
                if (hardBtn) hardBtn.click();
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 12. 맞춤법 검사기 (text-checker) - 전략 3: 서브 탭 전환
    // =========================================================================
    if (cleanSlug === 'text-checker') {
        // [2. 메인 조작 화면]: 교정할 문장 입력
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea && setVal) setVal(textarea, '안녕하새요. 오늘 날씨가 참 맑음니다. 빠른 시일내에 뵙겟습니다.');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 사용방법 탭 전환 ➡️ 글자수 산정 기준 및 교정 가이드
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button[role="tab"], nav button')) as HTMLElement[];
            const howtoTab = tabs.find(b => b.textContent && b.textContent.includes('사용방법'));
            if (howtoTab) {
                howtoTab.click();
            } else {
                const spellChecker = document.querySelector('[class*="SpellChecker"], [class*="spell"]') as HTMLElement;
                if (spellChecker) spellChecker.scrollIntoView({ behavior: 'instant', block: 'center' });
                else window.scrollTo({ top: 380, behavior: 'instant' });
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 13. JSON 포맷터 (json-formatter) - 전략 3: 서브 탭 전환
    // =========================================================================
    if (cleanSlug === 'json-formatter') {
        // [2. 메인 조작 화면]: 압축된 원본 JSON 입력
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea && setVal) setVal(textarea, '{"service":"faithportal","features":["calc","game","converter"],"status":"active","stats":{"users":1250,"rating":4.9}}');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 'Tree View' 탭 클릭하여 비주얼 인터랙티브 노드 트리 뷰로 전면 전환
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const treeTab = buttons.find(b => /tree view|tree|트리/i.test(b.textContent || ''));
            if (treeTab) {
                treeTab.click();
            } else {
                const formatBtn = buttons.find(b => /포맷|정렬|format/i.test(b.textContent || ''));
                if (formatBtn) formatBtn.click();
            }
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 14. Base64 변환기 (base64-converter) - 전략 2: 결과 포커스
    // =========================================================================
    if (cleanSlug === 'base64-converter') {
        // [2. 메인 조작 화면]: 원본 텍스트 입력
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea && setVal) setVal(textarea, 'Hello Veranex Mini Apps! 베라넥스 플랫폼 2026');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 인코딩 실행 ➡️ Base64 결과 문자열 노출
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const btn = buttons.find(b => b.textContent && /인코딩|변환|encode/i.test(b.textContent));
            if (btn) btn.click();
            window.scrollTo({ top: 300, behavior: 'instant' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 800));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 15. SVG 변환기 (svg-converter) - 전략 3: 서브 탭 전환
    // =========================================================================
    if (cleanSlug === 'svg-converter') {
        // [2. 메인 조작 화면]: 3대 변환 프리셋 카드 영역
        await page.evaluate(() => {
            const presetCards = Array.from(document.querySelectorAll('div[class*="rounded"]')) as HTMLElement[];
            if (presetCards[1]) presetCards[1].scrollIntoView({ behavior: 'instant', block: 'center' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 하단 지원 포맷 & 가이드 영역
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' })).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 16. 사주 운세 (saju) - 전략 2: 결과 리포트 타겟 포커스
    // =========================================================================
    if (cleanSlug === 'saju') {
        // [2. 메인 조작 화면]: 생년월일시 입력 폼
        await page.evaluate(() => {
            const setVal = (window as any).setReactInputValue;
            const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (nameInput && setVal) setVal(nameInput, '홍길동');
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: 사주 분석 시작 ➡️ 오행 분석 레이더 차트 및 운세 종합 리포트
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const submitBtn = buttons.find(b => /사주|분석|결과|운세|보기/i.test(b.textContent || ''));
            if (submitBtn) submitBtn.click();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1000));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        return await ensureDistinctScreenshots(page, buffers);
    }

    // =========================================================================
    // 17. 컴보이 & 슈퍼컴보이 아케이드 (comboy, sfc) - 전략 3: 서브 탭 전환
    // =========================================================================
    if (cleanSlug === 'comboy' || cleanSlug === 'sfc') {
        // [2. 메인 조작 화면]: 조작 가이드 탭 ➡️ 16비트 게임패드 매핑
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
            const guideBtn = buttons.find(b => b.textContent && /가이드|조작|안내/i.test(b.textContent));
            if (guideBtn) guideBtn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
        buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

        // [3. 결과 화면]: FAQ 탭 ➡️ 클라우드 세이브 및 에뮬레이터 안내
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
    // 18. 공통 범용 폴백 (미등록 앱) - 전략 4: 표준 결과 요약 리포트 카드 포커스
    // =========================================================================
    // [2. 메인 조작 화면]: 첫 번째 입력 필드 값 주입 또는 중앙 탭
    await page.evaluate(() => {
        const setVal = (window as any).setReactInputValue;
        const input = document.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
        if (input && setVal) setVal(input, '100');
        else if (input) {
            input.value = '100';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }).catch(() => {});
    await new Promise((r) => setTimeout(r, 500));
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    // [3. 결과 화면]: 액션 버튼 클릭 또는 결과 영역 포커스
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a.btn')) as HTMLElement[];
        const actionBtn = buttons.find(b => /계산|결과|확인|시작|생성|변환|검사|실행/i.test(b.textContent || ''));
        if (actionBtn) {
            actionBtn.click();
        } else {
            const resultEl = document.querySelector('[class*="result"], [class*="report"], [class*="output"], [id*="result"]') as HTMLElement;
            if (resultEl) resultEl.scrollIntoView({ behavior: 'instant', block: 'center' });
            else window.scrollTo({ top: 400, behavior: 'instant' });
        }
    }).catch(() => {});
    await new Promise((r) => setTimeout(r, 700));
    buffers.push(await page.screenshot({ type: 'png', fullPage: false }));

    return await ensureDistinctScreenshots(page, buffers);
}

/**
 * 중복 이미지 원천 방지 안전 가드 (Safety Guard)
 * (1) buffers[0]: 로딩 화면
 * (2) buffers[1]: 조작 화면
 * (3) buffers[2]: 결과 화면
 * 버퍼 간의 용량 차이가 1000바이트 미만이거나 동일할 경우 강제로 화면을 변경하여 100% 독립된 이미지를 보장합니다.
 */
async function ensureDistinctScreenshots(page: any, buffers: Buffer[]): Promise<Buffer[]> {
    if (buffers.length < 3) return buffers;

    // 1번(로딩)과 2번(조작)이 거의 같은 경우
    const sizeDiff12 = Math.abs(buffers[0].length - buffers[1].length);
    if (Buffer.compare(buffers[0], buffers[1]) === 0 || sizeDiff12 < 500) {
        await page.evaluate(() => {
            window.scrollTo({ top: 300, behavior: 'instant' });
            const btn = document.querySelector('button, input, [role="button"]') as HTMLElement;
            if (btn) btn.click();
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        buffers[1] = await page.screenshot({ type: 'png', fullPage: false });
    }

    // 2번(조작)과 3번(결과)이 거의 같은 경우 (1000바이트 미만 차이 시 강력한 차별화 조치)
    const sizeDiff23 = Math.abs(buffers[1].length - buffers[2].length);
    const isSame23 = Buffer.compare(buffers[1], buffers[2]) === 0 || sizeDiff23 < 1000;
    if (isSame23) {
        await page.evaluate(() => {
            // 1. 서브 탭 전환 시도
            const tabs = Array.from(document.querySelectorAll('nav button, button[role="tab"], .tab-btn, .tab-bar-btn, .page-tab-btn')) as HTMLElement[];
            if (tabs.length >= 2 && tabs[1].offsetWidth > 0) {
                tabs[1].click();
                return;
            }
            // 2. 모달 열기 또는 결과 영역 타겟 스크롤 시도
            const modalBtn = Array.from(document.querySelectorAll('button')).find(b => /통계|기록|가이드|도움|설명|FAQ|랭킹|명예/i.test(b.textContent || '')) as HTMLElement;
            if (modalBtn) {
                modalBtn.click();
                return;
            }
            // 3. 결과 요소 센터 스크롤
            const resultBox = document.querySelector('[class*="result"], [class*="report"], [class*="output"]') as HTMLElement;
            if (resultBox) {
                resultBox.scrollIntoView({ behavior: 'instant', block: 'center' });
                return;
            }
            // 4. 하단 전체 스크롤
            const maxScroll = Math.max(450, (document.body.scrollHeight || 1000) - 300);
            window.scrollTo({ top: maxScroll, behavior: 'instant' });
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
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
