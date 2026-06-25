import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAuth } from '../middleware/auth.js';

export const comboyRoutes = new Hono<{ Variables: { user?: any } }>();

// 1. 세이브 데이터 저장 (POST /api/comboy/save)
comboyRoutes.post('/api/comboy/save', requireAuth, async (c) => {
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

        console.log('[Comboy] Saving state for user:', user.id, 'game:', gameName);

        // SQLite UPSERT
        await DB.prepare(`
            INSERT INTO comboy_saves (user_id, game_name, save_data, updated_at)
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
        console.error('[Comboy Save Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});

// 2. 세이브 데이터 로드 (GET /api/comboy/load)
comboyRoutes.get('/api/comboy/load', requireAuth, async (c) => {
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
        console.log('[Comboy] Loading state for user:', user.id, 'game:', gameName);

        const result = await DB.prepare(`
            SELECT game_name, save_data, updated_at
            FROM comboy_saves
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
        console.error('[Comboy Load Error]', error.message, error.stack);
        return c.json({ success: false, error: { code: 500, message: 'Internal Server Error: ' + error.message } }, 500);
    }
});
