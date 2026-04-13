import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { optionalAuth } from '../middleware/auth.js';

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

// D-Day 추가
ddayRoutes.post('/api/dday/add', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    const userId = user?.id ?? null;

    try {
        const body = await c.req.json() as {
            title: string;
            targetDate: string;
            mode: string;
            isAnniversary: boolean;
            color: string;
            emoji: string;
        };
        const { title, targetDate, mode, isAnniversary, color, emoji } = body;

        const result = await DB.prepare(
            'INSERT INTO dday (user_id, title, target_date, mode, is_anniversary, color, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(userId, title, targetDate, mode, isAnniversary ? 1 : 0, color, emoji).run();

        return c.json({ success: true, id: result.lastInsertRowid });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[D-Day] 추가 오류:', message);
        return c.json({ success: false, error: 'D-Day 추가 실패' }, 500);
    }
});

// D-Day 삭제
ddayRoutes.delete('/api/dday/:id', optionalAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    const userId = user?.id ?? null;
    const id = c.req.param('id');

    try {
        await DB.prepare(
            'DELETE FROM dday WHERE id = ? AND (user_id = ? OR user_id IS NULL)'
        ).bind(id, userId).run();

        return c.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[D-Day] 삭제 오류:', message);
        return c.json({ success: false, error: 'D-Day 삭제 실패' }, 500);
    }
});
