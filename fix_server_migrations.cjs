// 서버 DB 마이그레이션 복구 스크립트 (1회 실행용)
// 사용법: 프로젝트 루트에서  node fix_server_migrations.cjs
//
// - migrations_history에 기록되지 않은 마이그레이션을 순서대로 실행
// - 각 파일을 트랜잭션으로 묶어 부분 적용 방지
// - 010의 ALTER TABLE(hidden 컬럼)이 이미 적용된 경우 해당 구문만 건너뜀
// - 데이터 삭제 없음 (CREATE / ALTER / UPDATE만 수행)

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'faith-portal.db');
if (!fs.existsSync(dbPath)) {
    console.error(`DB 파일을 찾을 수 없습니다: ${dbPath}`);
    process.exit(1);
}
const db = new Database(dbPath);
console.log(`[Fix] DB 연결: ${dbPath}`);

db.exec(`
    CREATE TABLE IF NOT EXISTS migrations_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

const hasColumn = (table, column) => {
    try {
        return db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
    } catch { return false; }
};
const hasTable = (table) =>
    !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table);

const migrationsDir = path.join(__dirname, 'packages', 'database', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

let failed = false;
for (const file of files) {
    const done = db.prepare('SELECT id FROM migrations_history WHERE filename = ?').get(file);
    if (done) { console.log(`[Skip] ${file} (이미 실행됨)`); continue; }

    let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    // 010: hidden 컬럼이 이미 존재하면(과거 부분 적용) ALTER 구문만 제거
    if (file.startsWith('010') && hasColumn('news', 'hidden')) {
        console.log('[Fix] news.hidden 컬럼이 이미 존재 → ALTER TABLE 구문 건너뜀');
        sql = sql.replace(/ALTER TABLE news ADD COLUMN hidden INTEGER DEFAULT 0;/, '');
    }

    console.log(`[Run] ${file} ...`);
    db.exec('BEGIN');
    try {
        db.exec(sql);
        db.prepare('INSERT INTO migrations_history (filename) VALUES (?)').run(file);
        db.exec('COMMIT');
        console.log(`[OK]  ${file}`);
    } catch (e) {
        db.exec('ROLLBACK');
        console.error(`[FAIL] ${file}: ${e.message}`);
        failed = true;
        break; // 순서 보장을 위해 실패 시 중단
    }
}

// 010 재실행 시 생길 수 있는 category 중복 토큰 정리 (예: 'stock,general,stock' → 'stock,general')
if (!failed && hasColumn('news', 'category')) {
    const rows = db.prepare("SELECT id, category FROM news WHERE category LIKE '%,%'").all();
    const upd = db.prepare('UPDATE news SET category = ? WHERE id = ?');
    let fixedCount = 0;
    for (const r of rows) {
        const deduped = [...new Set(r.category.split(',').map(s => s.trim()).filter(Boolean))].join(',');
        if (deduped !== r.category) { upd.run(deduped, r.id); fixedCount++; }
    }
    if (fixedCount > 0) console.log(`[Fix] category 중복 토큰 정리: ${fixedCount}건`);
}

// 최종 스키마 검증
console.log('\n=== 검증 ===');
console.log('banner_slots 테이블:', hasTable('banner_slots') ? 'OK' : '없음');
console.log('banners 테이블:', hasTable('banners') ? 'OK' : '없음');
console.log('news.hidden 컬럼:', hasColumn('news', 'hidden') ? 'OK' : '없음');
console.log('user_homepage_config 테이블:', hasTable('user_homepage_config') ? 'OK' : '없음');
const history = db.prepare('SELECT filename FROM migrations_history ORDER BY filename').all();
console.log('실행된 마이그레이션:', history.map(h => h.filename).join(', '));

db.close();
process.exit(failed ? 1 : 0);
