
const http = require('http');

function checkUrl(url, keyword) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const found = data.includes(keyword);
                console.log(`[${found ? 'PASS' : 'FAIL'}] Searching for "${keyword}" in ${url}`);
                resolve(found);
            });
        }).on('error', (err) => {
            console.log(`[ERROR] ${url}: ${err.message}`);
            resolve(false);
        });
    });
}

async function run() {
    console.log('--- Verifying Test News (ID: 164712) ---');

    // 1. 메인 리스트에 링크가 있는지
    const linkCheck = await checkUrl('http://localhost:5000/', 'href="/news/164712"');

    // 2. 메인 리스트에 '분석됨' 배지가 있는지 (해당 뉴스 섹션에)
    // (단순 포함 여부만 체크)
    const badgeCheck = await checkUrl('http://localhost:5000/', '분석됨');

    // 3. 상세 페이지에 Chart.js가 있는지
    const chartCheck = await checkUrl('http://localhost:5000/news/164712', 'chart.js');

    // 4. 상세 페이지에 '환율' 텍스트나 보조 텍스트가 있는지
    const textCheck = await checkUrl('http://localhost:5000/news/164712', '관련 환율 정보');

    if (linkCheck && badgeCheck && chartCheck && textCheck) {
        console.log('ALL CHECKS PASSED');
    } else {
        console.log('SOME CHECKS FAILED');
    }
}

run();
