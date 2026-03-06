
const http = require('http');

function checkUrl(url, keyword) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (data.includes(keyword)) {
                    console.log(`[PASS] Found "${keyword}" in ${url}`);
                    resolve(true);
                } else {
                    console.log(`[FAIL] NOT Found "${keyword}" in ${url}`);
                    console.log('Preview:', data.substring(0, 200));
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log(`[ERROR] ${url}: ${err.message}`);
            resolve(false);
        });
    });
}

async function run() {
    // Check News List Link
    const listCheck = await checkUrl('http://localhost:5000/', 'href="/news/');

    // Check Chart.js in Detail Page (using ID 164342)
    const detailCheck = await checkUrl('http://localhost:5000/news/164342', 'chart.js');

    if (listCheck && detailCheck) {
        console.log('ALL CHECKS PASSED');
    } else {
        console.log('SOME CHECKS FAILED');
    }
}

run();
