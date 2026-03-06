import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        page.on('requestfailed', request => {
            console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
        });

        console.log('Navigating to http://localhost:5012/app/tetris/ ...');
        await page.goto('http://localhost:5012/app/tetris/', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log('Page loaded successfully.');

        await browser.close();
    } catch (e) {
        console.error('Script error:', e);
        process.exit(1);
    }
})();
