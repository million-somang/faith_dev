
import { findRelatedStocks } from './src/utils/stockMapper';
import { fetchBatchStockData } from './src/utils/stockDataFetcher';

async function testRelatedStocks() {
    const testTitles = [
        "삼성전자 갤럭시 S24 출시 임박",
        // "Apple iPhone 16 leaks",
        // "테슬라 모델Y 가격 인하",
        // "SK하이닉스 HBM3E 양산 성공",
        // "네이버, 검색 점유율 확대",
        // "반도체 시장 전망 밝다", 
        // "이차전지 관련주 급등", 
        // "Nothing related here"
    ];

    console.log("--- Testing findRelatedStocks (Weighted) ---");
    for (const title of testTitles) {
        // Simple mock for content and tags for testing
        const related = findRelatedStocks(title, "", "");
        console.log(`Title: "${title}" -> Related Tickers: ${JSON.stringify(related)}`);

        if (related.length > 0) {
            const stockData = await fetchBatchStockData(related);
            console.log(`   -> Stock Data Found: ${stockData.length} items`);
            stockData.forEach(s => console.log(`      - ${s.name} (${s.ticker}): ${s.price}`));
        } else {
            console.log(`   -> No related stocks found.`);
        }
        console.log("---");
        console.log("--- Direct String Match Test ---");
        const t = "삼성전자 갤럭시 S24 출시 임박".toLowerCase();
        const k = "삼성전자".toLowerCase();
        console.log(`Text: '${t}'`);
        console.log(`Keyword: '${k}'`);
        console.log(`Includes check: ${t.includes(k)}`);
        console.log("--------------------------------");

        // testRelatedStocks(); // Comment out main test to focus on this
    } // End of for loop
} // End of function

testRelatedStocks();
