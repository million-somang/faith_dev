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
    
    console.log(`[Game] Score save request: gameId=${gameId}, user=`, user ? `id=${user.id}, email=${user.email}` : 'NULL');
    
    if (!user) {
        console.log('[Game] Score save BLOCKED - no user (requireAuth should have caught this)');
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    try {
        const { score, metadata } = await c.req.json();
        const metadataJson = metadata ? JSON.stringify(metadata) : null;

        console.log(`[Game] Saving score: gameId=${gameId}, userId=${user.id}, score=${score}`);

        await DB.prepare("INSERT INTO game_scores (game_id, user_id, score, metadata) VALUES (?, ?, ?, ?)")
            .bind(gameId, user.id, score, metadataJson)
            .run();

        console.log(`[Game] ✅ Score saved successfully: ${gameId} / ${user.email} / ${score}점`);
        return c.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Game] ❌ Score save error (${gameId}):`, message);
        if (error instanceof Error) console.error('[Game] Stack:', error.stack);
        return c.json({ success: false, message: '서버 오류: ' + message }, 500);
    }
});

// ⚠️ 통합 리더보드는 반드시 :gameId/leaderboard 보다 먼저 선언!
// (Hono가 '/api/games/leaderboard/all'을 :gameId='leaderboard'로 매칭하지 않도록)
gameRoutes.get('/api/games/leaderboard/all', async (c) => {
    const DB = getDB(c);

    try {
        const result = await DB.prepare(`
            SELECT score, email, game_id, created_at FROM (
                SELECT g.score, u.email, g.game_id, g.created_at
                FROM game_scores g
                JOIN users u ON g.user_id = u.id
                UNION ALL
                SELECT t.score, u.email, 'tetris' as game_id, t.created_at
                FROM tetris_scores t
                JOIN users u ON t.user_id = u.id
            ) combined
            ORDER BY score DESC
            LIMIT 10
        `).all();

        console.log(`[Game] Unified leaderboard: ${(result.results || []).length}건`);
        return c.json({ success: true, leaderboard: result.results || [] });
    } catch (error) {
        console.error('[Game] Unified leaderboard error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 게임별 리더보드 조회 (TOP 10)
gameRoutes.get('/api/games/:gameId/leaderboard', async (c) => {
    const DB = getDB(c);
    const gameId = c.req.param('gameId');

    console.log(`[Game] Leaderboard request: gameId=${gameId}`);

    try {
        let result;
        if (gameId === 'tetris') {
            result = await DB.prepare(`
                SELECT score, email, created_at, metadata FROM (
                    SELECT g.score, u.email, g.created_at, g.metadata
                    FROM game_scores g
                    JOIN users u ON g.user_id = u.id
                    WHERE g.game_id = 'tetris'
                    UNION ALL
                    SELECT t.score, u.email, t.created_at, NULL as metadata
                    FROM tetris_scores t
                    JOIN users u ON t.user_id = u.id
                ) combined
                ORDER BY score DESC
                LIMIT 10
            `).all();
        } else {
            result = await DB.prepare(`
                SELECT g.score, u.email, g.created_at, g.metadata
                FROM game_scores g
                JOIN users u ON g.user_id = u.id
                WHERE g.game_id = ?
                ORDER BY g.score DESC
                LIMIT 10
            `).bind(gameId).all();
        }

        console.log(`[Game] Leaderboard ${gameId}: ${(result.results || []).length}건`);
        return c.json({ success: true, leaderboard: result.results || [] });
    } catch (error) {
        console.error(`[Game] Leaderboard error (${gameId}):`, error);
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
