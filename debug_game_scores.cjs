const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DB 파일 찾기
let dbPath = path.join(process.cwd(), 'faith-portal.db');
if (!fs.existsSync(dbPath)) {
    dbPath = path.join(__dirname, 'faith-portal.db');
}
console.log('[DB 경로]', dbPath);
console.log('[DB 존재 여부]', fs.existsSync(dbPath));

const db = new Database(dbPath);

// 1. 테이블 존재 여부
console.log('\n=== 1. 테이블 목록 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(tables.map(t => t.name).join(', '));

// 2. game_scores 테이블 체크
try {
    const count = db.prepare('SELECT count(*) as cnt FROM game_scores').get();
    console.log('\n=== 2. game_scores 레코드 수 ===', count.cnt);
    
    if (count.cnt > 0) {
        console.log('\n=== 3. game_scores TOP 5 ===');
        const rows = db.prepare(`
            SELECT g.score, u.email, g.created_at, g.game_id 
            FROM game_scores g 
            JOIN users u ON g.user_id = u.id 
            ORDER BY g.score DESC LIMIT 5
        `).all();
        console.log(rows);
    }
} catch (e) {
    console.log('\n=== game_scores 테이블 없음! ===');
    console.log('에러:', e.message);
    
    // 마이그레이션 상태 확인
    try {
        const migs = db.prepare('SELECT * FROM migrations_history').all();
        console.log('\n=== 마이그레이션 히스토리 ===');
        console.log(migs);
    } catch (e2) {
        console.log('migrations_history 테이블도 없음:', e2.message);
    }
}

// 3. tetris_scores 테이블 체크
try {
    const count = db.prepare('SELECT count(*) as cnt FROM tetris_scores').get();
    console.log('\n=== tetris_scores 레코드 수 ===', count.cnt);
} catch (e) {
    console.log('\n=== tetris_scores 테이블 없음 ===', e.message);
}

// 4. users 테이블 체크
try {
    const count = db.prepare('SELECT count(*) as cnt FROM users').get();
    console.log('\n=== users 레코드 수 ===', count.cnt);
} catch (e) {
    console.log('\n=== users 테이블 없음 ===', e.message);
}

db.close();
console.log('\n[완료] 디버깅 종료');
