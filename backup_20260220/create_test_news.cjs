
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');

try {
    // publisher 컬럼 제거, description 사용
    const stmt = db.prepare(`
        INSERT INTO news (title, description, link, category)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
        '[테스트] 환율 급등! 달러 1400원 돌파 (팩트체크용)',
        '원/달러 환율이 급등하여 경제에 비상등이 켜졌습니다. 전문가들의 분석을 확인해보세요.',
        'https://example.com/test-news',
        'economy'
    );

    console.log('SUCCESS: Test news created with ID:', result.lastInsertRowid);
} catch (error) {
    console.error('ERROR:', error.message);
}
