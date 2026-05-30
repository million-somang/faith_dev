import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // 뷰포트 크기를 모달 환경을 가늠하기 편하게 1200x900 설정
        await page.setViewport({ width: 1200, height: 900 });
        page.on('dialog', async dialog => {
            console.log('PAGE DIALOG POPPED:', dialog.message());
            await dialog.accept();
        });

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        page.on('requestfailed', req => {
            console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText);
        });

        console.log('Navigating to http://localhost:5000/lifestyle ...');
        await page.goto('http://localhost:5000/lifestyle', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Lifestyle page loaded successfully.');

        // 스크린샷 1: 유틸리티 메인 페이지 캡처
        const baseDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\7c3e92b1-7c89-41da-8303-4aab27517709';
        await page.screenshot({ path: path.join(baseDir, '01_lifestyle_page.png') });
        console.log('Lifestyle page screenshot saved.');

        // 계산기 버튼 클릭하여 모달 열기
        console.log('Locating calculator button...');
        const calcButton = await page.$('button[aria-label*="계산기"]');
        if (!calcButton) {
            throw new Error('Calculator button not found on lifestyle page!');
        }
        await calcButton.click();
        console.log('Calculator button clicked. Waiting for modal...');

        // 모달 오버레이 및 iframe 대기
        await page.waitForSelector('.mini-app-modal-iframe', { visible: true, timeout: 5000 });
        console.log('Calculator iframe detected.');

        // 0.5초 대기 후 로딩 상태 스크린샷 촬영
        await page.waitForTimeout ? await page.waitForTimeout(500) : new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(baseDir, '02_modal_loading.png') });
        console.log('Modal loading screenshot saved.');

        console.log('Waiting for calculator container to load...');
        const iframeElement = await page.$('.mini-app-modal-iframe');
        if (iframeElement) {
            const src = await page.evaluate(el => el.src, iframeElement);
            console.log('Calculator iframe source URL:', src);
        }
        const frame = await iframeElement.contentFrame();
        if (frame) {
            await frame.waitForSelector('.calculator-container', { visible: true, timeout: 15000 });
            console.log('Calculator container detected inside iframe.');
            // React 렌더링 및 useEffect 마운트 처리를 완벽하게 끝마치기 위한 500ms 대기 보장
            await page.waitForTimeout ? await page.waitForTimeout(500) : new Promise(r => setTimeout(r, 500));
        } else {
            console.log('Could not get iframe content frame for waiting.');
        }

        // 물리 키보드 릴레이 테스트: 부모 window에 강제로 keydown 이벤트 dispatch 시뮬레이션
        console.log('Dispatching keydown event on parent window to test Relay...');
        // React Batching 및 비동기 상태 업데이트가 안전하게 렌더링을 집행하도록 각 타건 사이에 50ms 미세 지연을 순차 부여
        for (const key of ['1', '2', '+', '3', '4', '=']) {
            await page.evaluate((k) => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
            }, key);
            await page.waitForTimeout ? await page.waitForTimeout(50) : new Promise(r => setTimeout(r, 50));
        }

        // React 리렌더링 및 DOM 플러싱이 화면에 완전히 각인될 수 있도록 1500ms 충분한 여유 대기 보장
        await page.waitForTimeout ? await page.waitForTimeout(1500) : new Promise(r => setTimeout(r, 1500));
        let displayValue = '0';
        if (frame) {
            displayValue = await frame.evaluate(() => {
                const display = document.querySelector('.calculator-display');
                return display ? display.textContent.trim() : 'Display not found';
            });
            console.log('Calculator display after Relay Dispatch:', displayValue);
        }

        // 만약 릴레이 결과가 여전히 '0'이라면, Puppeteer의 올바른 iframe 타이핑 API인 frame.type()을 사용해 다이렉트 물리 입력 검증
        if (displayValue === '0' || displayValue === 'Display not found') {
            console.log('Relay dispatch did not register. Trying direct Puppeteer frame.type() ...');
            if (frame) {
                const container = await frame.$('.calculator-container');
                if (container) {
                    await container.focus();
                    
                    // frame.type을 사용해 직접 타이핑
                    await container.type('56+78=');
                    
                    displayValue = await frame.evaluate(() => {
                        const display = document.querySelector('.calculator-display');
                        return display ? display.textContent.trim() : 'Display not found';
                    });
                    console.log('Calculator display after Direct frame.type:', displayValue);
                }
            }
        }

        await page.screenshot({ path: path.join(baseDir, '03_modal_loaded.png') });
        console.log('Modal loaded basic calculator screenshot saved.');

        await browser.close();
        console.log('Automation complete successfully.');
    } catch (e) {
        console.error('Script error:', e);
        process.exit(1);
    }
})();
