// 뉴스 소스 진단 (읽기 전용 + 외부 피드 연결 테스트)
// 사용법: 서버 프로젝트 루트에서  node diag_news_sources.cjs
// - DB에서 "최근 수집된" 기사의 소스 분포를 시간대별로 보여줌
// - 서버에서 각 RSS 피드가 실제로 응답하는지 테스트 (구글뉴스가 서버에서 막히는지 확인)

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'faith-portal.db');
if (!fs.existsSync(dbPath)) { console.error(`DB 없음: ${dbPath}`); process.exit(1); }
const db = new Database(dbPath, { readonly: true });
console.log(`[Diag] DB: ${dbPath}\n`);

function bySource(whereClause, label) {
    const rows = db.prepare(
        `SELECT COALESCE(source,'(없음)') src, COUNT(*) c
         FROM news WHERE (hidden IS NULL OR hidden = 0) ${whereClause}
         GROUP BY source ORDER BY c DESC LIMIT 15`
    ).all();
    const total = rows.reduce((a, r) => a + r.c, 0);
    console.log(`=== ${label} (총 ${total}건) ===`);
    if (rows.length === 0) console.log('  (없음)');
    rows.forEach(r => console.log(`  ${String(r.src).padEnd(16)} ${r.c}`));
    console.log('');
}

bySource("AND created_at >= datetime('now','-1 day')", '최근 24시간 수집 소스');
bySource("AND created_at >= datetime('now','-3 day')", '최근 3일 수집 소스');
bySource('', '전체 소스');

// 가장 최근 수집 시각
const last = db.prepare('SELECT MAX(created_at) m FROM news').get().m;
console.log(`가장 최근 수집(created_at): ${last}\n`);
db.close();

// ---- 외부 피드 연결 테스트 (서버 네트워크 기준) ----
const feeds = {
    'Google general': 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    'Google economy': 'https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNR2RtY0hNekVnSnJieWdBUAE?hl=ko&gl=KR&ceid=KR:ko',
    '경향 total': 'https://www.khan.co.kr/rss/rssdata/total_news.xml',
    '동아 total': 'https://rss.donga.com/total.xml',
    '매경 30100041': 'https://www.mk.co.kr/rss/30100041/',
};

(async () => {
    console.log('=== 서버에서 RSS 피드 연결 테스트 ===');
    for (const [name, url] of Object.entries(feeds)) {
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 8000);
            const r = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml,text/xml,application/xml' },
                signal: ctrl.signal,
            });
            clearTimeout(t);
            const txt = await r.text();
            const items = (txt.match(/<item>/g) || []).length;
            const flag = (r.status === 200 && items > 0) ? 'OK' : '⚠️  비정상';
            console.log(`  ${name.padEnd(16)} status ${r.status} | items ${items}  ${flag}`);
        } catch (e) {
            console.log(`  ${name.padEnd(16)} FAIL ${e.name} (${e.message}) ← 이 피드가 서버에서 막힘`);
        }
    }
    console.log('\n해석: 구글 피드가 FAIL/0이면, 구글뉴스가 서버에서 차단된 것 → 언론사 피드(경향 등)만 수집되어 한쪽으로 쏠림.');
})();
