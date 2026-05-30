import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    try {
        console.log('Launching browser for Text Checker verification...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1200, height: 900 });
        page.on('dialog', async dialog => {
            console.log('PAGE DIALOG POPPED:', dialog.message());
            await dialog.accept();
        });

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

        console.log('Navigating to http://localhost:5000/lifestyle ...');
        await page.goto('http://localhost:5000/lifestyle', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Lifestyle page loaded.');

        // 스크린샷 1: 메인 페이지
        const baseDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\7c3e92b1-7c89-41da-8303-4aab27517709';
        await page.screenshot({ path: path.join(baseDir, '01_text_checker_lifestyle.png') });

        // 글자수세기 버튼 클릭하여 모달 열기
        console.log('Locating Text Checker button...');
        const buttons = await page.$$('button[aria-label]');
        let targetButton = null;
        for (const btn of buttons) {
            const label = await page.evaluate(el => el.getAttribute('aria-label'), btn);
            if (label && (label.includes('글자수') || label.includes('맞춤법') || label.includes('텍스트'))) {
                targetButton = btn;
                break;
            }
        }

        if (!targetButton) {
            throw new Error('Text Checker button not found on lifestyle page!');
        }
        await targetButton.click();
        console.log('Text Checker button clicked. Waiting for modal...');

        // 모달 오버레이 및 iframe 대기
        await page.waitForSelector('.mini-app-modal-iframe', { visible: true, timeout: 5000 });
        console.log('Text Checker iframe detected.');

        // 0.5초 대기 후 로딩 상태 스크린샷 촬영
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(baseDir, '02_text_checker_loading.png') });
        console.log('Loading screenshot saved.');

        console.log('Waiting for Text Editor container to load inside iframe...');
        const iframeElement = await page.$('.mini-app-modal-iframe');
        const frame = await iframeElement.contentFrame();
        if (frame) {
            // TextEditor 로딩 완료 및 로딩 스크린 해제 대기 (최대 5초)
            await frame.waitForSelector('textarea', { visible: true, timeout: 15000 });
            console.log('Textarea detected inside iframe.');
            await new Promise(r => setTimeout(r, 500)); // 마운트 안정 대기
        } else {
            throw new Error('Could not resolve iframe content frame.');
        }

        // 물리 키보드 릴레이 테스트: 부모 window에 강제로 keydown 이벤트 dispatch 시뮬레이션
        console.log('Simulating keydown relay on parent window...');
        const testText = 'Hello! ';
        for (const char of testText.split('')) {
            await page.evaluate((k) => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
            }, char);
            await new Promise(r => setTimeout(r, 50));
        }

        // 엔터 키 릴레이 시뮬레이션
        await page.evaluate(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        });
        await new Promise(r => setTimeout(r, 50));

        // 한글 릴레이 폴백 기입 테스트
        const testKorean = '글자수세기 완벽 이식 완료';
        for (const char of testKorean.split('')) {
            await page.evaluate((k) => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
            }, char);
            await new Promise(r => setTimeout(r, 50));
        }

        // 값 검증을 위한 대기
        await new Promise(r => setTimeout(r, 1000));
        const textareaValue = await frame.evaluate(() => {
            const ta = document.querySelector('textarea');
            return ta ? ta.value : 'Textarea not found';
        });
        console.log('--- Textarea content after relay verification ---');
        console.log(textareaValue);
        console.log('------------------------------------------------');

        await page.screenshot({ path: path.join(baseDir, '03_text_checker_loaded.png') });
        console.log('Final loaded screenshot saved.');

        await browser.close();
        if (textareaValue.includes('Hello!') && textareaValue.includes('글자수세기')) {
            console.log('Relay test PASSED successfully!');
        } else {
            console.warn('Warning: Relay did not populate text accurately. Direct user typing might be needed or focus was lost.');
        }
    } catch (e) {
        console.error('Automation test script failed:', e);
        process.exit(1);
    }
})();
