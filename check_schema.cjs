const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let rootDir = process.cwd();
while (!fs.existsSync(path.join(rootDir, 'faith-portal.db')) && rootDir !== path.parse(rootDir).root) {
    rootDir = path.dirname(rootDir);
}
const db = new Database(path.join(rootDir, 'faith-portal.db'));

// 테이블 목록
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('=== 테이블 목록 ===');
tables.forEach(t => console.log(' -', t.name));

// 방문 관련 테이블 확인
const visitTables = ['page_views', 'visits', 'visitors', 'analytics', 'usage_tracking', 'app_usage'];
for (const t of visitTables) {
    try {
        const count = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
        console.log(`\n[${t}] 존재 - ${count.c}건`);
        const cols = db.prepare(`PRAGMA table_info(${t})`).all();
        cols.forEach(c => console.log(`  ${c.name} (${c.type})`));
    } catch(e) {
        // 테이블 없음
    }
}

// activity_logs 구조
console.log('\n=== activity_logs 구조 ===');
const alCols = db.prepare("PRAGMA table_info(activity_logs)").all();
alCols.forEach(c => console.log(`  ${c.name} (${c.type})`));

const alCount = db.prepare("SELECT COUNT(*) as c FROM activity_logs").get();
console.log(`  총 ${alCount.c}건`);

const actions = db.prepare("SELECT action, COUNT(*) as c FROM activity_logs GROUP BY action ORDER BY c DESC").all();
console.log('\n=== activity_logs 액션별 통계 ===');
actions.forEach(a => console.log(`  ${a.action}: ${a.c}건`));

// news 테이블
try {
    const newsCount = db.prepare("SELECT COUNT(*) as c FROM news").get();
    console.log(`\n=== news: ${newsCount.c}건 ===`);
} catch(e) {}

// game_scores
try {
    const scoreCount = db.prepare("SELECT COUNT(*) as c FROM game_scores").get();
    console.log(`=== game_scores: ${scoreCount.c}건 ===`);
} catch(e) {}

// users
try {
    const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get();
    console.log(`=== users: ${userCount.c}건 ===`);
} catch(e) {}

db.close();
