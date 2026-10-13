const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'faith-portal.db');
const db = new Database(dbPath);

try {
    const app = {
        name: '이미지 크기 조정 & 일괄 변환기',
        slug: 'image-resizer',
        icon_url: 'fas fa-images',
        description: 'SNS 권장 규격 및 픽셀, 비율, 용량(KB) 단위 최대 50장 다중 이미지 일괄 리사이즈 & WebP/JPG/PNG 변환기',
        app_url: '/app/image-resizer/',
        category: 'calc',
        sort_order: 2
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
