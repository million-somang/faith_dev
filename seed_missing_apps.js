import Database from 'better-sqlite3';

const db = new Database('faith-portal.db');

const appsToSeed = [
    { name: '나이 계산기', slug: 'age-calc', icon_url: 'fas fa-birthday-cake', description: '만 나이, 연 나이 계산', app_url: '/app/age-calc/', category: 'calc', sort_order: 20 },
    { name: '디데이 계산기', slug: 'dday-calc', icon_url: 'fas fa-calendar-alt', description: '기념일 디데이 계산', app_url: '/app/dday-calc/', category: 'calc', sort_order: 21 },
    { name: '평수 계산기', slug: 'pyeong-calc', icon_url: 'fas fa-ruler-combined', description: '평수 ↔ 제곱미터 변환', app_url: '/app/pyeong-calc/', category: 'calc', sort_order: 22 },
    { name: '맞춤법 검사기', slug: 'text-checker', icon_url: 'fas fa-spell-check', description: '맞춤법 검사 및 글자수 세기', app_url: '/app/text-checker/', category: 'text', sort_order: 30 },
    { name: 'Base64 변환기', slug: 'base64-converter', icon_url: 'fas fa-code', description: 'Base64 인코딩/디코딩', app_url: '/app/base64-converter/', category: 'dev', sort_order: 40 },
    { name: 'JSON 포맷터', slug: 'json-formatter', icon_url: 'fas fa-brackets-curly', description: 'JSON 코드 정렬 및 검증', app_url: '/app/json-formatter/', category: 'dev', sort_order: 41 },
    { name: 'SVG 변환기', slug: 'svg-converter', icon_url: 'fas fa-image', description: 'SVG 최적화 및 변환', app_url: '/app/svg-converter/', category: 'dev', sort_order: 42 }
];

try {
    // 혹시 category 컬럼이 없을 경우를 대비하여 추가
    try {
        db.exec("ALTER TABLE mini_apps ADD COLUMN category TEXT DEFAULT 'utility'");
        console.log('category 컬럼이 추가되었습니다.');
    } catch (e) {
        // 이미 존재하면 무시
    }

    // 기존 다기능 계산기의 카테고리 업데이트
    try {
        db.exec("UPDATE mini_apps SET category = 'calc' WHERE slug = 'calculator'");
        console.log('기존 다기능 계산기 카테고리 설정 완료.');
    } catch (e) {}

    const insertStmt = db.prepare(`
        INSERT INTO mini_apps (name, slug, icon_url, description, app_url, status, require_auth, sort_order, category)
        SELECT ?, ?, ?, ?, ?, 'active', 0, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM mini_apps WHERE slug = ?)
    `);

    let insertedCount = 0;
    for (const app of appsToSeed) {
        const info = insertStmt.run(app.name, app.slug, app.icon_url, app.description, app.app_url, app.sort_order, app.category, app.slug);
        if (info.changes > 0) {
            insertedCount++;
            console.log(`추가됨: ${app.name}`);
        }
    }
    
    console.log(`총 ${insertedCount}개의 미니앱이 데이터베이스에 등록되었습니다.`);
} catch (error) {
    console.error('데이터베이스 등록 중 오류:', error);
} finally {
    db.close();
}
