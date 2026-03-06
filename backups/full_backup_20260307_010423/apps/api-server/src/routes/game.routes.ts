import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAuth } from '../middleware/auth.js';

export const gameRoutes = new Hono<{ Variables: { user?: { id: string; email: string } } }>();

// ==================== 통합 게임 점수 API ====================

// 점수 저장 (범용)
gameRoutes.post('/api/games/:gameId/score', requireAuth, async (c) => {
    const DB = getDB(c);
    const gameId = c.req.param('gameId');
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    try {
        const { score, metadata } = await c.req.json();
        const metadataJson = metadata ? JSON.stringify(metadata) : null;

        await DB.prepare("INSERT INTO game_scores (game_id, user_id, score, metadata) VALUES (?, ?, ?, ?)")
            .bind(gameId, user.id, score, metadataJson)
            .run();

        return c.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Game] Score save error (${gameId}):`, message);
        return c.json({ success: false, message: '서버 오류: ' + message }, 500);
    }
});

// 게임별 리더보드 조회 (TOP 10)
gameRoutes.get('/api/games/:gameId/leaderboard', async (c) => {
    const DB = getDB(c);
    const gameId = c.req.param('gameId');

    try {
        const result = await DB.prepare(`
            SELECT g.score, u.email, g.created_at, g.metadata
            FROM game_scores g
            JOIN users u ON g.user_id = u.id
            WHERE g.game_id = ?
            ORDER BY g.score DESC
            LIMIT 10
        `).bind(gameId).all();

        return c.json({ success: true, leaderboard: result.results || [] });
    } catch (error) {
        console.error(`[Game] Leaderboard error (${gameId}):`, error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 통합 리더보드 (전체 게임, 각 유저의 각 게임별 최고점만 추출 후 합산 TOP 10)
gameRoutes.get('/api/games/leaderboard/all', async (c) => {
    const DB = getDB(c);

    try {
        const result = await DB.prepare(`
            SELECT g.score, u.email, g.game_id, g.created_at
            FROM game_scores g
            JOIN users u ON g.user_id = u.id
            ORDER BY g.score DESC
            LIMIT 10
        `).all();

        return c.json({ success: true, leaderboard: result.results || [] });
    } catch (error) {
        console.error('[Game] Unified leaderboard error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 개인 최고점 조회
gameRoutes.get('/api/games/:gameId/highscore/:userId', async (c) => {
    const DB = getDB(c);
    const gameId = c.req.param('gameId');
    const userId = c.req.param('userId');

    try {
        const result = await DB.prepare("SELECT MAX(score) as highScore FROM game_scores WHERE game_id = ? AND user_id = ?")
            .bind(gameId, userId)
            .first();

        return c.json({ success: true, highScore: result?.highScore || 0 });
    } catch (error) {
        console.error(`[Game] Highscore error (${gameId}):`, error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
