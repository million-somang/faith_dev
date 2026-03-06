import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAdmin, logActivity } from './admin.routes.js';

export const miniappRoutes = new Hono<{ Variables: { adminUserId: string } }>();

// ==================== API: 공개 (프론트엔드용) ====================

// 활성 미니앱 목록 조회
miniappRoutes.get('/api/mini-apps', async (c) => {
    const DB = getDB(c);
    try {
        const apps = await DB.prepare("SELECT * FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
        return c.json({ success: true, apps: apps.results });
    } catch (error) {
        console.error('MiniApp API Error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 미니앱 실행 로그 기록
miniappRoutes.post('/api/mini-apps/:id/log', async (c) => {
    const DB = getDB(c);
    const appId = c.req.param('id');
    try {
        const body = await c.req.json();
        const actionType = body.action_type || 'LAUNCH';
        const userId = body.user_id || null;

        await DB.prepare("INSERT INTO mini_app_logs (mini_app_id, user_id, action_type) VALUES (?, ?, ?)")
            .bind(appId, userId, actionType)
            .run();

        return c.json({ success: true });
    } catch (error) {
        console.error('MiniApp Log Error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// ==================== API: 관리자용 ====================

// 관리자: 전체 미니앱 목록 조회
miniappRoutes.get('/api/admin/mini-apps', requireAdmin, async (c) => {
    const DB = getDB(c);
    try {
        const apps = await DB.prepare("SELECT * FROM mini_apps ORDER BY sort_order ASC").all();
        return c.json({ success: true, apps: apps.results });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 관리자: 미니앱 등록
miniappRoutes.post('/api/admin/mini-apps', requireAdmin, async (c) => {
    const DB = getDB(c);
    const userId = c.get('adminUserId');
    try {
        const { name, slug, icon_url, description, app_url, status, require_auth, sort_order } = await c.req.json();

        const result = await DB.prepare(`
            INSERT INTO mini_apps (name, slug, icon_url, description, app_url, status, require_auth, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(name, slug, icon_url || '', description || '', app_url, status || 'active', require_auth ? 1 : 0, parseInt(sort_order) || 0).run();

        await logActivity(DB, userId, 'admin_action', `미니앱 등록: ${name}`);
        return c.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
        console.error('MiniApp Create Error:', error);
        return c.json({ success: false, message: '서버 오류: ' + error.message }, 500);
    }
});

// 관리자: 미니앱 수정
miniappRoutes.put('/api/admin/mini-apps/:id', requireAdmin, async (c) => {
    const DB = getDB(c);
    const id = c.req.param('id');
    const userId = c.get('adminUserId');
    try {
        const { name, slug, icon_url, description, app_url, status, require_auth, sort_order } = await c.req.json();

        await DB.prepare(`
            UPDATE mini_apps 
            SET name=?, slug=?, icon_url=?, description=?, app_url=?, status=?, require_auth=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `).bind(name, slug, icon_url || '', description || '', app_url, status || 'active', require_auth ? 1 : 0, parseInt(sort_order) || 0, id).run();

        await logActivity(DB, userId, 'admin_action', `미니앱 수정: ${name}`);
        return c.json({ success: true });
    } catch (error: any) {
        console.error('MiniApp Update Error:', error);
        return c.json({ success: false, message: '서버 오류: ' + error.message }, 500);
    }
});

// 관리자: 미니앱 상태 토글
miniappRoutes.patch('/api/admin/mini-apps/:id/status', requireAdmin, async (c) => {
    const DB = getDB(c);
    const id = c.req.param('id');
    const userId = c.get('adminUserId');
    try {
        const { status } = await c.req.json();
        await DB.prepare("UPDATE mini_apps SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status, id).run();
        await logActivity(DB, userId, 'admin_action', `미니앱 상태 변경 (ID: ${id}) -> ${status}`);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 관리자: 미니앱 삭제
miniappRoutes.delete('/api/admin/mini-apps/:id', requireAdmin, async (c) => {
    const DB = getDB(c);
    const id = c.req.param('id');
    const userId = c.get('adminUserId');
    try {
        await DB.prepare("DELETE FROM mini_app_logs WHERE mini_app_id=?").bind(id).run();
        await DB.prepare("DELETE FROM mini_apps WHERE id=?").bind(id).run();
        await logActivity(DB, userId, 'admin_action', `미니앱 삭제 (ID: ${id})`);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 관리자: 미니앱 통계
miniappRoutes.get('/api/admin/mini-apps/stats', requireAdmin, async (c) => {
    const DB = getDB(c);
    try {
        const stats = await DB.prepare(`
            SELECT 
                m.id, 
                m.name, 
                COUNT(l.id) as total_launches,
                COUNT(DISTINCT l.user_id) as unique_users,
                MAX(l.created_at) as last_launched
            FROM mini_apps m
            LEFT JOIN mini_app_logs l ON m.id = l.mini_app_id
            GROUP BY m.id
            ORDER BY total_launches DESC
        `).all();

        return c.json({ success: true, stats: stats.results });
    } catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
