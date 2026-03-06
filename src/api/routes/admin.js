import { Hono } from 'hono';
import { getDB } from '../../db/adapter';
import * as fs from 'fs';
const adminRoutes = new Hono();
// 관리자 권한 미들웨어 (간이)
const requireAdmin = async (c, next) => {
    const DB = getDB(c);
    const authHeader = c.req.header('Authorization');
    if (!authHeader)
        return c.json({ success: false, message: '인증이 필요합니다.' }, 401);
    try {
        const token = authHeader.replace('Bearer ', '');
        // Resilience: 'true' 혹은 빈 값인 경우 미인증 처리
        if (token === 'true' || !token) {
            fs.appendFileSync('admin_auth_debug.log', `[${new Date().toISOString()}] Rejected legacy 'true' or empty token\n---\n`);
            return c.json({ success: false, message: '인증이 필요합니다.' }, 401);
        }
        const decoded = Buffer.from(token, 'base64').toString();
        const userId = decoded.split(':')[0];
        if (!userId) {
            fs.appendFileSync('admin_auth_debug.log', `[${new Date().toISOString()}] Rejected invalid decoded userId\n---\n`);
            return c.json({ success: false, message: '인증이 필요합니다.' }, 401);
        }
        const logMsg = `[${new Date().toISOString()}] Admin Auth Debug\n` +
            `Header: ${authHeader}\n` +
            `Decoded: ${decoded}, UserId: ${userId}\n`;
        fs.appendFileSync('admin_auth_debug.log', logMsg);
        const admin = await DB.prepare('SELECT level, status FROM users WHERE id = ?').bind(userId).first();
        fs.appendFileSync('admin_auth_debug.log', `DB Result: ${JSON.stringify(admin)}\n`);
        if (!admin || admin.level < 6 || admin.status !== 'active') {
            const deniedMsg = `Access Denied: !admin=${!admin}, level=${admin?.level}, status=${admin?.status}\n---\n`;
            fs.appendFileSync('admin_auth_debug.log', deniedMsg);
            return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403);
        }
        fs.appendFileSync('admin_auth_debug.log', `Access Granted\n---\n`);
        c.set('adminUserId', userId);
        await next();
    }
    catch (e) {
        fs.appendFileSync('admin_auth_debug.log', `Error: ${e.message}\n---\n`);
        return c.json({ success: false, message: '인증 오류' }, 401);
    }
};
// 헬퍼 함수
async function logActivity(db, userId, action, description, ip) {
    try {
        await db.prepare('INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)')
            .bind(userId, action, description, ip || null).run();
    }
    catch (error) {
        console.error('Log activity error:', error);
    }
}
async function createNotification(db, type, title, message, targetUserId, priority = 'normal') {
    try {
        await db.prepare('INSERT INTO notifications (type, title, message, target_user_id, priority) VALUES (?, ?, ?, ?, ?)')
            .bind(type, title, message, targetUserId || null, priority).run();
    }
    catch (error) {
        console.error('Create notification error:', error);
    }
}
// ==================== API: 관리자 통계 ====================
adminRoutes.get('/api/admin/stats', requireAdmin, async (c) => {
    const DB = getDB(c);
    try {
        const totalUsers = await DB.prepare("SELECT COUNT(*) as count FROM users WHERE status != 'deleted'").first();
        const activeUsers = await DB.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").first();
        const suspendedUsers = await DB.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'suspended'").first();
        const todaySignups = await DB.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE('now')").first();
        const levelDistribution = await DB.prepare("SELECT level, COUNT(*) as count FROM users WHERE status != 'deleted' GROUP BY level ORDER BY level").all();
        const recentUsers = await DB.prepare("SELECT id, email, name, level, created_at FROM users WHERE status != 'deleted' ORDER BY created_at DESC LIMIT 10").all();
        return c.json({
            success: true,
            totalUsers: totalUsers.count,
            activeUsers: activeUsers.count,
            suspendedUsers: suspendedUsers.count,
            todaySignups: todaySignups.count,
            levelDistribution: levelDistribution.results,
            recentUsers: recentUsers.results
        });
    }
    catch (error) {
        console.error('Admin Stats Error:', error);
        fs.appendFileSync('admin_auth_debug.log', `[${new Date().toISOString()}] Stats API Error: ${error.message}\nStack: ${error.stack}\n---\n`);
        return c.json({ success: false, message: '서버 오류: ' + error.message }, 500);
    }
});
// ==================== API: 회원 목록 조회 ====================
adminRoutes.get('/api/admin/users', requireAdmin, async (c) => {
    const DB = getDB(c);
    const search = c.req.query('search') || '', level = c.req.query('level') || '', status = c.req.query('status') || '';
    try {
        let query = 'SELECT id, email, name, phone, level, status, created_at FROM users WHERE 1=1';
        const bindings = [];
        if (search) {
            query += ' AND (email LIKE ? OR name LIKE ?)';
            bindings.push(`%${search}%`, `%${search}%`);
        }
        if (level) {
            query += ' AND level = ?';
            bindings.push(parseInt(level));
        }
        if (status) {
            query += ' AND status = ?';
            bindings.push(status);
        }
        else {
            query += " AND status != 'deleted'";
        }
        query += ' ORDER BY created_at DESC LIMIT 100';
        fs.appendFileSync('admin_auth_debug.log', `[${new Date().toISOString()}] Users API Query: ${query}\nBindings: ${JSON.stringify(bindings)}\n`);
        const users = await DB.prepare(query).bind(...bindings).all();
        fs.appendFileSync('admin_auth_debug.log', `[${new Date().toISOString()}] Users API Success: ${users.results?.length || 0} rows found\n`);
        return c.json({ success: true, users: users.results });
    }
    catch (error) {
        fs.appendFileSync('admin_auth_debug.log', `[${new Date().toISOString()}] Users API Error: ${error.message}\nStack: ${error.stack}\n---\n`);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 회원 상세 조회 ====================
adminRoutes.get('/api/admin/users/:id', requireAdmin, async (c) => {
    const DB = getDB(c), targetUserId = c.req.param('id');
    try {
        const user = await DB.prepare('SELECT id, email, name, phone, level, status, created_at, last_login FROM users WHERE id = ?').bind(targetUserId).first();
        if (!user)
            return c.json({ success: false, message: '회원을 찾을 수 없습니다.' }, 404);
        return c.json({ success: true, user });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 회원 정보 수정 ====================
adminRoutes.put('/api/admin/users/:id', requireAdmin, async (c) => {
    const DB = getDB(c), targetUserId = c.req.param('id'), userId = c.get('adminUserId');
    try {
        const { name, phone, level } = await c.req.json();
        const targetUser = await DB.prepare('SELECT email FROM users WHERE id = ?').bind(targetUserId).first();
        await DB.prepare('UPDATE users SET name = ?, phone = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(name, phone, level, targetUserId).run();
        await logActivity(DB, userId, 'admin_action', `회원 정보 수정: ${targetUser?.email}`);
        return c.json({ success: true, message: '회원 정보가 수정되었습니다.' });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 회원 상태 변경 ====================
adminRoutes.patch('/api/admin/users/:id/status', requireAdmin, async (c) => {
    const DB = getDB(c), targetUserId = c.req.param('id'), userId = c.get('adminUserId');
    try {
        const { status } = await c.req.json();
        if (!['active', 'suspended'].includes(status))
            return c.json({ success: false, message: '올바르지 않은 상태' }, 400);
        const targetUser = await DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(targetUserId).first();
        await DB.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, targetUserId).run();
        await logActivity(DB, userId, 'admin_action', `회원 상태 변경: ${targetUser?.email} → ${status}`);
        if (status === 'suspended') {
            await createNotification(DB, 'user_suspended', '회원 정지', `${targetUser?.name}(${targetUser?.email})님의 계정이 정지되었습니다.`, undefined, 'high');
        }
        return c.json({ success: true, message: '회원 상태가 변경되었습니다.' });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 회원 삭제 ====================
adminRoutes.delete('/api/admin/users/:id', requireAdmin, async (c) => {
    const DB = getDB(c), targetUserId = c.req.param('id'), userId = c.get('adminUserId');
    try {
        const targetUser = await DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(targetUserId).first();
        await DB.prepare('UPDATE users SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(targetUserId).run();
        await logActivity(DB, userId, 'admin_action', `회원 삭제: ${targetUser?.email}`);
        await createNotification(DB, 'user_deleted', '회원 삭제', `${targetUser?.name}(${targetUser?.email})님의 계정이 삭제되었습니다.`, undefined, 'high');
        return c.json({ success: true, message: '회원이 삭제되었습니다.' });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 고급 통계 ====================
adminRoutes.get('/api/admin/stats/trends', requireAdmin, async (c) => {
    const DB = getDB(c);
    try {
        const dailySignups = await DB.prepare("SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= DATE('now', '-30 days') GROUP BY DATE(created_at) ORDER BY date").all();
        const monthlySignups = await DB.prepare("SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM users WHERE created_at >= DATE('now', '-12 months') GROUP BY strftime('%Y-%m', created_at) ORDER BY month").all();
        const dailyLogins = await DB.prepare("SELECT DATE(created_at) as date, COUNT(*) as count FROM activity_logs WHERE action = 'login' AND created_at >= DATE('now', '-30 days') GROUP BY DATE(created_at) ORDER BY date").all();
        const levelActivity = await DB.prepare("SELECT u.level, COUNT(al.id) as activity_count FROM users u LEFT JOIN activity_logs al ON u.id = al.user_id AND al.created_at >= DATE('now', '-30 days') WHERE u.status = 'active' GROUP BY u.level ORDER BY u.level").all();
        return c.json({ success: true, dailySignups: dailySignups.results, monthlySignups: monthlySignups.results, dailyLogins: dailyLogins.results, levelActivity: levelActivity.results });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 활동 로그 조회 ====================
adminRoutes.get('/api/admin/activity-logs', requireAdmin, async (c) => {
    const DB = getDB(c), limit = parseInt(c.req.query('limit') || '50'), action = c.req.query('action') || '';
    try {
        let query = 'SELECT al.*, u.email, u.name FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
        const bindings = [];
        if (action) {
            query += ' AND al.action = ?';
            bindings.push(action);
        }
        query += ' ORDER BY al.created_at DESC LIMIT ?';
        bindings.push(limit);
        const logs = await DB.prepare(query).bind(...bindings).all();
        return c.json({ success: true, logs: logs.results });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 알림 목록 조회 ====================
adminRoutes.get('/api/admin/notifications', requireAdmin, async (c) => {
    const DB = getDB(c), userId = c.get('adminUserId');
    try {
        const notifications = await DB.prepare('SELECT * FROM notifications WHERE (target_user_id IS NULL OR target_user_id = ?) ORDER BY created_at DESC LIMIT 50').bind(userId).all();
        const unreadCount = await DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE (target_user_id IS NULL OR target_user_id = ?) AND is_read = 0').bind(userId).first();
        return c.json({ success: true, notifications: notifications.results, unreadCount: unreadCount.count });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 알림 읽음 처리 ====================
adminRoutes.patch('/api/admin/notifications/:id/read', requireAdmin, async (c) => {
    const DB = getDB(c), notificationId = c.req.param('id');
    try {
        await DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').bind(notificationId).run();
        return c.json({ success: true, message: '알림이 읽음 처리되었습니다.' });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: 회원 일괄 처리 ====================
adminRoutes.post('/api/admin/users/batch', requireAdmin, async (c) => {
    const DB = getDB(c), userId = c.get('adminUserId');
    try {
        const { action, userIds, value } = await c.req.json();
        if (!action || !userIds || !Array.isArray(userIds))
            return c.json({ success: false, message: '올바르지 않은 요청' }, 400);
        let query = '', bindings = [];
        switch (action) {
            case 'change_level':
                query = `UPDATE users SET level = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${userIds.map(() => '?').join(',')})`;
                bindings = [value, ...userIds];
                break;
            case 'change_status':
                query = `UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${userIds.map(() => '?').join(',')})`;
                bindings = [value, ...userIds];
                break;
            case 'delete':
                query = `UPDATE users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id IN (${userIds.map(() => '?').join(',')})`;
                bindings = userIds;
                break;
            default: return c.json({ success: false, message: '올바르지 않은 작업' }, 400);
        }
        await DB.prepare(query).bind(...bindings).run();
        await logActivity(DB, userId, 'admin_action', `일괄 처리: ${action} (${userIds.length}명)`);
        return c.json({ success: true, message: `${userIds.length}명의 회원이 일괄 처리되었습니다.` });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
// ==================== API: CSV 내보내기 ====================
adminRoutes.get('/api/admin/users/export', requireAdmin, async (c) => {
    const DB = getDB(c);
    try {
        const users = await DB.prepare("SELECT id, email, name, phone, level, status, created_at, last_login FROM users WHERE status != 'deleted' ORDER BY created_at DESC").all();
        let csv = 'ID,이메일,이름,휴대전화,등급,상태,가입일,최근로그인\n';
        for (const user of users.results) {
            csv += `${user.id},"${user.email}","${user.name}","${user.phone || ''}",${user.level},"${user.status}","${user.created_at}","${user.last_login || ''}"\n`;
        }
        return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"` } });
    }
    catch (error) {
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
export { adminRoutes, logActivity, createNotification };
