import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

export const ddayRoutes = new Hono<{ Variables: { user?: { id: string; email: string } } }>();

// ==================== D-Day API ====================

// D-Day 목록 조회
ddayRoutes.get('/api/dday/list', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    const userId = user?.id ?? null;

    try {
        const { results } = await DB.prepare(
            'SELECT * FROM dday WHERE user_id = ? ORDER BY target_date ASC'
        ).bind(userId).all();

        return c.json({ success: true, ddays: results || [] });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[D-Day] 조회 오류:', message);
        return c.json({ success: false, error: 'D-Day 조회 실패' }, 500);
    }
});

// D-Day 추가 (로그인 회원 전용)
ddayRoutes.post('/api/dday/add', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user?.id) return c.json({ success: false, error: '인증이 필요합니다' }, 401);

    try {
        const body = await c.req.json() as {
            title: string;
            targetDate: string;
            mode: string;
            isAnniversary: boolean;
            color: string;
            emoji: string;
        };
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const targetDate = typeof body.targetDate === 'string' ? body.targetDate.trim() : '';
        const mode = typeof body.mode === 'string' ? body.mode.trim().slice(0, 20) : 'dday';
        const isAnniversary = Boolean(body.isAnniversary);
        const color = typeof body.color === 'string' ? body.color.trim().slice(0, 20) : 'blue';
        const emoji = typeof body.emoji === 'string' ? body.emoji.trim().slice(0, 16) : '📅';

        if (!title || title.length > 80 || !/^\d{4}-\d{2}-\d{2}/.test(targetDate)) {
            return c.json({ success: false, error: '유효하지 않은 제목 또는 날짜 형식입니다.' }, 400);
        }

        const result = await DB.prepare(
            'INSERT INTO dday (user_id, title, target_date, mode, is_anniversary, color, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(user.id, title, targetDate, mode, isAnniversary ? 1 : 0, color, emoji).run();

        return c.json({ success: true, id: result.lastInsertRowid });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[D-Day] 추가 오류:', message);
        return c.json({ success: false, error: 'D-Day 추가 실패' }, 500);
    }
});

// D-Day 삭제 (본인 소유 항목만 허용)
ddayRoutes.delete('/api/dday/:id', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user?.id) return c.json({ success: false, error: '인증이 필요합니다' }, 401);
    const id = c.req.param('id');

    try {
        await DB.prepare(
            'DELETE FROM dday WHERE id = ? AND user_id = ?'
        ).bind(id, user.id).run();

        return c.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[D-Day] 삭제 오류:', message);
        return c.json({ success: false, error: 'D-Day 삭제 실패' }, 500);
    }
});
