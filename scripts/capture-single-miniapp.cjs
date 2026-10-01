const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * VeraNex 신규 미니앱 단일 화면 자동 캡처 CLI 도구
 * 사용법:
 *   node scripts/capture-single-miniapp.cjs <slug> [targetUrl]
 *   npm run capture:app <slug>
 *   npm run capture:app <slug> http://localhost:5002
 */

const slugArg = process.argv[2];
const urlArg = process.argv[3];

if (!slugArg) {
    console.error('❌ 사용법: node scripts/capture-single-miniapp.cjs <slug> [targetUrl]');
    console.error('예: node scripts/capture-single-miniapp.cjs calculator');
    console.error('예: node scripts/capture-single-miniapp.cjs calculator http://localhost:5002');
    process.exit(1);
}

// slug 정규화 (app-calculator -> calculator)
const cleanSlug = slugArg.replace(/^app-/, '').trim();

// 기본 URL 설정 (로컬 또는 운영 도메인)
let targetUrl = urlArg;
if (!targetUrl) {
    targetUrl = `https://veranex.app/app/${cleanSlug}/`;
}

const UPLOAD_DIRS = [
    path.resolve(__dirname, '../public/uploads/marketing/screenshots'),
    path.resolve(__dirname, '../apps/api-server/public/uploads/marketing/screenshots')
];

for (const dir of UPLOAD_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveImages(slug, buffers) {
    for (let i = 0; i < 3; i++) {
        const buf = buffers[i] || buffers[0];
        if (!buf) continue;
        const step = i + 1;
        const files = [
            `${slug}_step${step}.png`,
            `${slug}_key${step}.png`
        ];
        if (step === 1) files.push(`${slug}.png`);

        for (const fn of files) {
            for (const dir of UPLOAD_DIRS) {
                fs.writeFileSync(path.join(dir, fn), buf);
            }
        }
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log(`\n==================================================`);
    console.log(`📸 [VeraNex Mini-App Screenshot Capture]`);
    console.log(`   Slug : ${cleanSlug}`);
    console.log(`   URL  : ${targetUrl}`);
    console.log(`==================================================\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    const page = await browser.newPage();
    const buffers = [];

    try {
        await page.setViewport({
            width: 430,
            height: 860,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true
        });

        // alert / confirm 무조건 자동 처리
        page.on('dialog', async d => { try { await d.dismiss(); } catch (e) {} });

        // 리액트 State 트리거 헬퍼 주입
        await page.evaluateOnNewDocument(() => {
            window.alert = () => {};
            window.confirm = () => true;
            window.setReactVal = (el, val) => {
                if (!el) return;
                const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                const desc = Object.getOwnPropertyDescriptor(proto, 'value');
                if (desc && desc.set) desc.set.call(el, val);
                else el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            };
        });

        console.log(`⏳ 1. 접속 및 스플래시 로딩 대기...`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

        // 스플래시 로더 해제 대기
        await page.waitForFunction(() => {
            const loader = document.querySelector('.loading-screen, .loading-body, [aria-label*="로딩"], .loading-container');
            return !loader || loader.offsetWidth === 0;
        }, { timeout: 7000 }).catch(() => {});
        await sleep(1500);

        // 1단계 캡처
        console.log(`📸 [1단계: 진입 화면] 캡처 중...`);
        const shot1 = await page.screenshot({ type: 'png' });
        buffers.push(shot1);

        // 2단계 조작 (Action)
        console.log(`⚡ 2. 조작 단계 (data-screenshot-input / action 감지)...`);
        await page.evaluate(() => {
            // 1순위: miniapp.md 표준 data-screenshot-input 속성
            const inputs = document.querySelectorAll('[data-screenshot-input]');
            if (inputs.length > 0) {
                inputs.forEach(inp => {
                    const sample = inp.getAttribute('data-screenshot-input') || '100';
                    if (window.setReactVal) window.setReactVal(inp, sample);
                });
            } else {
                // 스마트 폴백: 첫 번째 보이는 text/number input에 값 입력
                const firstInp = document.querySelector('input[type="text"], input[type="number"], textarea');
                if (firstInp && window.setReactVal) {
                    window.setReactVal(firstInp, firstInp.placeholder || '1000');
                }
            }

            // 1순위: miniapp.md 표준 data-screenshot-click="action" 버튼 클릭
            const actionBtn = document.querySelector('[data-screenshot-click="action"]');
            if (actionBtn) {
                actionBtn.click();
            } else {
                // 스마트 폴백: 프리셋 칩이나 버튼 클릭
                const chip = document.querySelector('button[class*="preset"], button[class*="chip"], button');
                if (chip && !chip.textContent.includes('결과')) {
                    chip.click();
                }
            }
        }).catch(err => console.warn('조작 단계 경고:', err.message));
        await sleep(1500);

        console.log(`📸 [2단계: 조작 화면] 캡처 중...`);
        const shot2 = await page.screenshot({ type: 'png' });
        buffers.push(shot2);

        // 3단계 결과 (Result)
        console.log(`🎯 3. 결과 산출 단계 (data-screenshot-click="result" 감지)...`);
        await page.evaluate(() => {
            // 1순위: miniapp.md 표준 data-screenshot-click="result" 버튼 클릭
            const resBtn = document.querySelector('[data-screenshot-click="result"]');
            if (resBtn) {
                resBtn.click();
            } else {
                // 스마트 폴백: 계산, 결과, 변환, 실행 등의 텍스트를 가진 버튼 클릭
                const buttons = Array.from(document.querySelectorAll('button'));
                const targetBtn = buttons.find(b => {
                    const txt = (b.textContent || '').trim();
                    return txt.includes('계산') || txt.includes('변환') || txt.includes('결과') || txt.includes('실행') || txt.includes('확인');
                });
                if (targetBtn) targetBtn.click();
            }

            // 결과 포인트가 있으면 스크롤 포커스
            const resPoint = document.querySelector('[data-screenshot-point="result"]');
            if (resPoint) resPoint.scrollIntoView({ behavior: 'instant', block: 'start' });
        }).catch(err => console.warn('결과 단계 경고:', err.message));
        await sleep(1800);

        console.log(`📸 [3단계: 결과 화면] 캡처 중...`);
        const shot3 = await page.screenshot({ type: 'png' });
        buffers.push(shot3);

        // 이미지 저장
        saveImages(cleanSlug, buffers);

        console.log(`\n🎉 [완료] ${cleanSlug} 3단계 실제 화면 캡처 저장 성공!`);
        console.log(`   - 1단계 진입: ${cleanSlug}_step1.png (${(shot1.length / 1024).toFixed(1)} KB)`);
        console.log(`   - 2단계 조작: ${cleanSlug}_step2.png (${(shot2.length / 1024).toFixed(1)} KB)`);
        console.log(`   - 3단계 결과: ${cleanSlug}_step3.png (${(shot3.length / 1024).toFixed(1)} KB)`);
        console.log(`   - 저장 디렉터리:`);
        UPLOAD_DIRS.forEach(d => console.log(`     📁 ${d}`));
    } catch (err) {
        console.error(`❌ 캡처 실패:`, err.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main();
