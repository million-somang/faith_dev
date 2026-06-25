import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAuth } from '../middleware/auth.js';
import { bodyLimit } from 'hono/body-limit';

export const sfcRoutes = new Hono<{ Variables: { user?: any } }>();

// 1. 세이브 데이터 저장 (POST /api/sfc/save) — SNES 세이브 스테이트는 base64로 수 MB
sfcRoutes.post('/api/sfc/save', bodyLimit({ maxSize: 20 * 1024 * 1024 }), requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
    }

    try {
        const { gameName, saveData } = await c.req.json();
        
        if (!gameName || !saveData) {
            return c.json({ success: false, error: { code: 400, message: 'Bad Request: gameName and saveData are required' } }, 400);
        }

        console.log('[SFC] Saving state for user:', user.id, 'game:', gameName);

        await DB.prepare(`
            INSERT INTO sfc_saves (user_id, game_name, save_data, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, game_name) DO UPDATE SET
                save_data = excluded.save_data,
                updated_at = CURRENT_TIMESTAMP
        `).bind(user.id, gameName, saveData).run();

        return c.json({
            success: true,
            data: {
                gameName,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('[SFC Save Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});

// 2. 세이브 데이터 로드 (GET /api/sfc/load)
sfcRoutes.get('/api/sfc/load', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
    }

    const gameName = c.req.query('gameName');
    if (!gameName) {
        return c.json({ success: false, error: { code: 400, message: 'Bad Request: gameName is required' } }, 400);
    }

    try {
        console.log('[SFC] Loading state for user:', user.id, 'game:', gameName);

        const result = await DB.prepare(`
            SELECT game_name, save_data, updated_at
            FROM sfc_saves
            WHERE user_id = ? AND game_name = ?
        `).bind(user.id, gameName).first();

        if (!result) {
            return c.json({ success: false, error: { code: 404, message: 'Save state not found' } }, 404);
        }

        return c.json({
            success: true,
            data: {
                gameName: result.game_name,
                saveData: result.save_data,
                updatedAt: new Date(result.updated_at).toISOString()
            }
        });
    } catch (error: any) {
        console.error('[SFC Load Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});
