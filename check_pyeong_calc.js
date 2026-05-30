import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    try {
        console.log('Launching browser for Pyeong Calculator E2E verification...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1200, height: 900 });
        page.on('dialog', async dialog => {
            console.log('PAGE DIALOG POPPED:', dialog.message());
            await dialog.accept();
        });

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

        // 부모 포털 5000번 접속
        console.log('Navigating to http://localhost:5000/lifestyle ...');
        await page.goto('http://localhost:5000/lifestyle', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Lifestyle portal page loaded successfully.');

        const baseDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\7c3e92b1-7c89-41da-8303-4aab27517709';

        // 평수계산기 버튼 찾아서 클릭
        console.log('Locating Pyeong Calculator modal button...');
        const pyeongBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.textContent?.includes('평수') || b.getAttribute('aria-label')?.includes('평수'));
        });

        if (!pyeongBtn || !(await pyeongBtn.asElement())) {
            throw new Error('Pyeong Calculator button not found!');
        }

        await pyeongBtn.asElement().click();
        console.log('Pyeong Calculator modal button clicked. Waiting for iframe modal...');

        // 모달 오버레이 및 iframe 대기
        await page.waitForSelector('.mini-app-modal-iframe', { visible: true, timeout: 5000 });
        console.log('Pyeong Calc modal iframe detected.');

        // 0.5초 대기 후 프리미엄 3초 강제 로딩 화면 상태 스크린샷 촬영
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(baseDir, '04_pyeong_modal_loading.png') });
        console.log('Modal loading screenshot saved.');

        // iframe 컨텐츠 접근
        const iframeElement = await page.$('.mini-app-modal-iframe');
        const frame = await iframeElement.contentFrame();
        if (!frame) {
            throw new Error('Could not get content frame of modal iframe!');
        }

        // 로딩 완료 대기 (3초 강제 로딩 완료 후 탭 바가 나타날 때까지 대기)
        console.log('Waiting for Pyeong Calculator App to load fully inside modal (3s forced loading)...');
        await frame.waitForSelector('nav[role="tablist"]', { visible: true, timeout: 12000 });
        console.log('Pyeong Calculator tab list detected inside modal iframe.');
        await new Promise(r => setTimeout(r, 500));

        // 스크린샷 5: 면적 변환 기본 탭 화면 캡처
        await page.screenshot({ path: path.join(baseDir, '05_pyeong_modal_convert_tab.png') });
        console.log('Pyeong Calc convert tab screenshot saved.');

        // 부모 창에 keydown 이벤트 전송하여 물리 키보드 릴레이 입력 테스트
        console.log('Testing global physical keyboard relay through parent window...');
        for (const key of ['8', '4']) {
            await page.evaluate((k) => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
            }, key);
            await new Promise(r => setTimeout(r, 80));
        }
        await new Promise(r => setTimeout(r, 600));

        // 인풋 값 추출하여 릴레이 입력 확인
        const inputValue = await frame.evaluate(() => {
            const input = document.querySelector('input[type="number"]');
            return input ? input.value : 'Input not found';
        });
        console.log('Input value inside iframe after Relay Dispatch (84):', inputValue);

        // 탭 이동 테스트: '사용방법' 탭 클릭
        console.log('Clicking HowTo (사용방법) tab inside iframe...');
        await frame.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
            const howtoBtn = buttons.find(b => b.textContent?.includes('사용방법') || b.textContent?.includes('📖'));
            if (howtoBtn) howtoBtn.click();
        });
        await new Promise(r => setTimeout(r, 1000));

        // 스크린샷 6: 사용방법 탭 캡처
        await page.screenshot({ path: path.join(baseDir, '06_pyeong_modal_howto_tab.png') });
        console.log('Pyeong Calc howto tab screenshot saved.');

        // 탭 이동 테스트: '자유토론' 탭 클릭
        console.log('Clicking Community (자유토론) tab inside iframe...');
        await frame.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
            const commBtn = buttons.find(b => b.textContent?.includes('자유토론') || b.textContent?.includes('💬'));
            if (commBtn) commBtn.click();
        });
        await new Promise(r => setTimeout(r, 1500));

        // 스크린샷 7: 자유토론 탭 캡처
        await page.screenshot({ path: path.join(baseDir, '07_pyeong_modal_community_tab.png') });
        console.log('Pyeong Calc community tab screenshot saved.');

        await browser.close();
        console.log('Pyeong Calculator E2E integration test completed successfully.');
    } catch (e) {
        console.error('E2E Integration Test Error:', e);
        process.exit(1);
    }
})();
