const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath = path.join(process.cwd(), 'faith-portal.db');
if (!fs.existsSync(dbPath)) dbPath = path.join(__dirname, 'faith-portal.db');

console.log('[DB 경로]', dbPath);
const db = new Database(dbPath);

// 1. game_scores 데이터
try {
    const cnt = db.prepare('SELECT count(*) as cnt FROM game_scores').get();
    console.log('\n=== game_scores 레코드 수 ===', cnt.cnt);
    if (cnt.cnt > 0) {
        const rows = db.prepare(`
            SELECT g.score, u.email, g.game_id, g.created_at 
            FROM game_scores g JOIN users u ON g.user_id = u.id 
            ORDER BY g.score DESC LIMIT 5
        `).all();
        console.log('Top 5:', rows);
    }
} catch (e) { console.log('game_scores 없음:', e.message); }

// 2. tetris_scores 데이터  
try {
    const cnt = db.prepare('SELECT count(*) as cnt FROM tetris_scores').get();
    console.log('\n=== tetris_scores 레코드 수 ===', cnt.cnt);
    if (cnt.cnt > 0) {
        const rows = db.prepare(`
            SELECT t.score, u.email, t.created_at 
            FROM tetris_scores t JOIN users u ON t.user_id = u.id 
            ORDER BY t.score DESC LIMIT 5
        `).all();
        console.log('Top 5:', rows);
    }
} catch (e) { console.log('tetris_scores 없음:', e.message); }

// 3. sessions 테이블 (현재 활성 세션)
try {
    const cnt = db.prepare("SELECT count(*) as cnt FROM sessions WHERE expires_at > datetime('now')").get();
    console.log('\n=== 활성 세션 수 ===', cnt.cnt);
    if (cnt.cnt > 0) {
        const rows = db.prepare(`
            SELECT s.session_id, u.email, s.expires_at 
            FROM sessions s JOIN users u ON s.user_id = u.id 
            WHERE s.expires_at > datetime('now')
        `).all();
        rows.forEach(r => console.log(`  세션: ${r.session_id.substring(0,8)}... | ${r.email} | 만료: ${r.expires_at}`));
    }
} catch (e) { console.log('sessions 테이블 없음:', e.message); }

// 4. users 목록
try {
    const users = db.prepare('SELECT id, email, name, role, level FROM users').all();
    console.log('\n=== 전체 사용자 ===');
    users.forEach(u => console.log(`  [${u.id}] ${u.email} (${u.name}) role=${u.role} level=${u.level}`));
} catch (e) { console.log('users 없음:', e.message); }

// 5. UNION ALL 쿼리 테스트 (통합 리더보드와 동일)
try {
    const result = db.prepare(`
        SELECT score, email, game_id, created_at FROM (
            SELECT g.score, u.email, g.game_id, g.created_at
            FROM game_scores g JOIN users u ON g.user_id = u.id
            UNION ALL
            SELECT t.score, u.email, 'tetris' as game_id, t.created_at
            FROM tetris_scores t JOIN users u ON t.user_id = u.id
        ) combined ORDER BY score DESC LIMIT 10
    `).all();
    console.log('\n=== 통합 리더보드 (UNION ALL) ===');
    result.forEach((r, i) => console.log(`  ${i+1}위: ${r.email} | ${r.game_id} | ${r.score}점 | ${r.created_at}`));
} catch (e) { console.log('통합 쿼리 실패:', e.message); }

db.close();
console.log('\n[완료]');
