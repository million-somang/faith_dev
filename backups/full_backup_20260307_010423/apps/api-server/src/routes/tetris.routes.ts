import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAuth } from '../middleware/auth.js';

export const tetrisRoutes = new Hono<{ Variables: { user?: any } }>();

tetrisRoutes.post('/api/tetris/score', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) {
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    try {
        const { score, lines, level } = await c.req.json();
        console.log('[Tetris] Saving score for user:', user.id, 'score:', score, 'lines:', lines, 'level:', level);

        await DB.prepare("INSERT INTO tetris_scores (user_id, score, \"lines\", level) VALUES (?, ?, ?, ?)")
            .bind(user.id, score, lines, level)
            .run();

        console.log('[Tetris] Score saved successfully!');
        return c.json({ success: true });
    } catch (error: any) {
        console.error('Tetris Score Error:', error.message, error.stack);
        return c.json({ success: false, message: 'Server error: ' + error.message }, 500);
    }
});

tetrisRoutes.get('/api/tetris/highscore/:userId', async (c) => {
    const DB = getDB(c);
    const userId = c.req.param('userId');

    try {
        const result = await DB.prepare("SELECT MAX(score) as highScore FROM tetris_scores WHERE user_id = ?").bind(userId).first();
        return c.json({ success: true, highScore: result?.highScore || 0 });
    } catch (error) {
        console.error('Tetris Highscore Error:', error);
        return c.json({ success: false, message: 'Server error' }, 500);
    }
});

tetrisRoutes.get('/api/tetris/leaderboard', async (c) => {
    const DB = getDB(c);

    try {
        const result = await DB.prepare(`
            SELECT t.score, u.email, t.created_at
            FROM tetris_scores t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.score DESC
            LIMIT 10
        `).all();

        return c.json({ success: true, leaderboard: result.results || [] });
    } catch (error) {
        console.error('Tetris Leaderboard Error:', error);
        return c.json({ success: false, message: 'Server error' }, 500);
    }
});
