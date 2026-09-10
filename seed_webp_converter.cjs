const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'faith-portal.db');
const db = new Database(dbPath);

try {
    const app = {
        name: '이미지 WebP 변환 & 압축기',
        slug: 'webp-converter',
        icon_url: 'fas fa-file-image',
        description: '서버 비용 $0, 브라우저 로컬 초고속 무손실 WebP 변환 & 최대 80% 용량 압축기',
        app_url: '/app/webp-converter/',
        category: 'dev',
        sort_order: 43
    };

    const insertStmt = db.prepare(`
        INSERT INTO mini_apps (name, slug, icon_url, description, app_url, status, require_auth, sort_order, category)
        SELECT ?, ?, ?, ?, ?, 'active', 0, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM mini_apps WHERE slug = ?)
    `);

    const info = insertStmt.run(
        app.name,
        app.slug,
        app.icon_url,
        app.description,
        app.app_url,
        app.sort_order,
        app.category,
        app.slug
    );

    if (info.changes > 0) {
        console.log(`[Seed] 성공적으로 등록되었습니다: ${app.name} (${app.slug})`);
    } else {
        const updateStmt = db.prepare(`
            UPDATE mini_apps
            SET name = ?, icon_url = ?, description = ?, app_url = ?, category = ?, sort_order = ?, status = 'active'
            WHERE slug = ?
        `);
        updateStmt.run(app.name, app.icon_url, app.description, app.app_url, app.category, app.sort_order, app.slug);
        console.log(`[Seed] 기존 미니앱 정보가 갱신되었습니다: ${app.name} (${app.slug})`);
    }
} catch (err) {
    console.error('[Seed] 에러 발생:', err);
} finally {
    db.close();
}
