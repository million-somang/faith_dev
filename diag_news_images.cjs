// 뉴스 이미지(썸네일) 진단 스크립트 (읽기 전용 — 데이터 변경 없음)
// 사용법: 프로젝트 루트에서  node diag_news_images.cjs

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'faith-portal.db');
if (!fs.existsSync(dbPath)) {
    console.error(`DB 파일을 찾을 수 없습니다: ${dbPath}`);
    process.exit(1);
}
const db = new Database(dbPath, { readonly: true });
console.log(`[Diag] DB: ${dbPath}\n`);

// 1. news 테이블 컬럼 확인
const cols = db.prepare('PRAGMA table_info(news)').all().map(c => c.name);
console.log('=== news 컬럼 ===');
console.log(cols.join(', '));
const hasThumb = cols.includes('thumbnail');
console.log(`\nthumbnail 컬럼 존재: ${hasThumb ? 'YES' : 'NO ← 이미지 저장 불가, 이게 원인'}`);

if (!hasThumb) {
    console.log('\n→ thumbnail 컬럼이 없어 이미지가 전혀 저장될 수 없는 상태입니다.');
    db.close();
    process.exit(0);
}

// 2. 전체/이미지 보유 건수
const total = db.prepare('SELECT COUNT(*) c FROM news').get().c;
const withThumb = db.prepare("SELECT COUNT(*) c FROM news WHERE thumbnail IS NOT NULL AND thumbnail != ''").get().c;
const visible = db.prepare("SELECT COUNT(*) c FROM news WHERE (hidden IS NULL OR hidden = 0)").get().c;
const visibleWithThumb = db.prepare("SELECT COUNT(*) c FROM news WHERE (hidden IS NULL OR hidden = 0) AND thumbnail IS NOT NULL AND thumbnail != ''").get().c;
console.log('\n=== 건수 ===');
console.log(`전체: ${total}  (이미지 보유: ${withThumb}, ${pct(withThumb, total)})`);
console.log(`노출(hidden=0): ${visible}  (이미지 보유: ${visibleWithThumb}, ${pct(visibleWithThumb, visible)})`);

// 3. 소스별 이미지 보유율
console.log('\n=== 소스별 이미지 보유율 (노출 기사 기준) ===');
const bySource = db.prepare(`
    SELECT COALESCE(source,'(없음)') src,
           COUNT(*) total,
           SUM(CASE WHEN thumbnail IS NOT NULL AND thumbnail != '' THEN 1 ELSE 0 END) withImg
    FROM news WHERE (hidden IS NULL OR hidden = 0)
    GROUP BY source ORDER BY total DESC LIMIT 20
`).all();
for (const r of bySource) {
    console.log(`  ${r.src.padEnd(16)} ${String(r.withImg).padStart(4)}/${String(r.total).padStart(4)}  (${pct(r.withImg, r.total)})`);
}

// 4. 최근 노출 기사 20건 중 이미지 유무
console.log('\n=== 최근 노출 기사 20건 ===');
const recent = db.prepare(`
    SELECT id, source, substr(title,1,30) title,
           CASE WHEN thumbnail IS NOT NULL AND thumbnail != '' THEN 'IMG' ELSE ' . ' END img
    FROM news WHERE (hidden IS NULL OR hidden = 0)
    ORDER BY published_at DESC, created_at DESC LIMIT 20
`).all();
for (const r of recent) {
    console.log(`  [${r.img}] ${String(r.source||'').padEnd(12)} ${r.title}`);
}

// 5. 샘플 thumbnail URL (도메인 확인용)
console.log('\n=== thumbnail URL 샘플 (최대 5건) ===');
const samples = db.prepare("SELECT thumbnail FROM news WHERE thumbnail IS NOT NULL AND thumbnail != '' LIMIT 5").all();
if (samples.length === 0) console.log('  (이미지 보유 기사 없음)');
samples.forEach(s => console.log('  ' + s.thumbnail));

db.close();

function pct(n, d) { return d ? Math.round(n / d * 100) + '%' : '0%'; }
