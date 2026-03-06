import Database from 'better-sqlite3';
import { parseRSSXML } from '../utils/stockNewsCollector';
const DB_PATH = process.env.DATABASE_PATH || './faith-portal.db';
// 카테고리별 RSS URL 설정
const CATEGORY_RSS_URLS = {
    general: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    politics: 'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=ko&gl=KR&ceid=KR:ko',
    economy: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko',
    tech: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ko&gl=KR&ceid=KR:ko',
    sports: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=ko&gl=KR&ceid=KR:ko',
    entertainment: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=ko&gl=KR&ceid=KR:ko',
    stock: 'https://news.google.com/rss/search?q=%EC%A3%BC%EC%8B%9D+%ED%8A%B9%EC%A7%95%EC%A3%BC&hl=ko&gl=KR&ceid=KR:ko' // '주식 특징주' 검색 결과
};
export async function fetchAndSaveNews() {
    console.log(`[${new Date().toISOString()}] 뉴스 수집 시작...`);
    const db = new Database(DB_PATH);
    try {
        for (const [category, url] of Object.entries(CATEGORY_RSS_URLS)) {
            await processCategory(db, category, url);
        }
    }
    catch (error) {
        console.error('뉴스 수집 중 치명적 오류:', error);
    }
    finally {
        db.close();
        console.log(`[${new Date().toISOString()}] 뉴스 수집 완료`);
    }
}
async function processCategory(db, category, rssUrl) {
    try {
        console.log(`- ${category} 카테고리 수집 중...`);
        const response = await fetch(rssUrl);
        if (!response.ok) {
            console.error(`${category} RSS 요청 실패: ${response.status}`);
            return;
        }
        const xmlText = await response.text();
        const items = parseRSSXML(xmlText);
        if (items.length === 0) {
            console.log(`  > ${category}: 새로운 뉴스 없음`);
            return;
        }
        let savedCount = 0;
        const stmt = db.prepare(`
      INSERT OR IGNORE INTO news (
        category, title, summary, link, thumbnail, source, published_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
        const insertMany = db.transaction((newsItems) => {
            for (const item of newsItems) {
                // 이미지가 없으면 기본 이미지 사용 (선택 사항)
                const imageUrl = extractImageUrl(item.summary) || null;
                // 날짜 변환
                let pubDate = new Date().toISOString();
                try {
                    if (item.pubDate) {
                        pubDate = new Date(item.pubDate).toISOString();
                    }
                }
                catch (e) { /* ignore date error */ }
                const result = stmt.run(category, item.title, stripHtml(item.summary), // 요약에서 HTML 태그 제거
                item.link, imageUrl, // thumbnail 컬럼이 아니라 image_url?? 아까 thumbnail로 바꿨는데...
                item.source, pubDate);
                if (result.changes > 0)
                    savedCount++;
            }
        });
        insertMany(items);
        console.log(`  > ${category}: ${items.length}개 수집, ${savedCount}개 저장됨`);
    }
    catch (error) {
        console.error(`${category} 수집 중 오류:`, error);
    }
}
// 헬퍼 함수: HTML 태그 제거
function stripHtml(html) {
    return html
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '');
}
// 헬퍼 함수: 설명에서 이미지 URL 추출 (간단 버전)
function extractImageUrl(description) {
    const match = description.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
}
