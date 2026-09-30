import { Hono } from 'hono';
import { checkSession } from '../middleware/auth.js';
import { getDB } from '../db/adapter.js';

const router = new Hono<{ Variables: { user?: any } }>();

export function calculateTier(rating: number): string {
    if (rating >= 1800) return '다이아몬드';
    if (rating >= 1600) return '플래티넘';
    if (rating >= 1400) return '골드 I';
    if (rating >= 1200) return '골드 II';
    if (rating >= 1050) return '실버';
    return '브론즈';
}

export async function initOmokDatabase() {
    const db = await getDB(null as any);
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS omok_user_stats (
            user_id INTEGER PRIMARY KEY,
            rating INTEGER DEFAULT 1200,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            tier TEXT DEFAULT '골드 II',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
}

initOmokDatabase().catch(err => console.error('[SQLite] Omok DB Init Failed:', err));

// 1. 유저 프로필 및 전적 조회
router.get('/profile', async (c) => {
    const user = await checkSession(c);
    const db = await getDB(c);

    if (!user) {
        return c.json({
            success: true,
            isLoggedIn: false,
            profile: {
                id: 0,
                name: '게스트_' + Math.floor(1000 + Math.random() * 9000),
                rating: 1200,
                tier: '골드 II',
                wins: 0,
                losses: 0
            }
        });
    }

    let stats = await db.prepare('SELECT * FROM omok_user_stats WHERE user_id = ?').bind(user.id).first();
    if (!stats) {
        await db.prepare(
            'INSERT INTO omok_user_stats (user_id, rating, wins, losses, tier) VALUES (?, 1200, 0, 0, ?)'
        ).bind(user.id, '골드 II').run();
        stats = { user_id: user.id, rating: 1200, wins: 0, losses: 0, tier: '골드 II' };
    }

    return c.json({
        success: true,
        isLoggedIn: true,
        profile: {
            id: user.id,
            name: user.name || user.email?.split('@')[0] || '베라플레이어',
            rating: stats.rating,
            tier: stats.tier,
            wins: stats.wins,
            losses: stats.losses
        }
    });
});

// 2. 랭킹 리더보드 TOP 10
router.get('/leaderboard', async (c) => {
    const db = await getDB(c);
    try {
        const res = await db.prepare(`
            SELECT s.rating, s.tier, s.wins, s.losses, u.name, u.email
            FROM omok_user_stats s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.rating DESC, s.wins DESC
            LIMIT 10
        `).all();

        const leaderboard = (res.results || []).map((row: any, idx: number) => ({
            rank: idx + 1,
            name: row.name || row.email?.split('@')[0] || `플레이어#${idx + 1}`,
            rating: row.rating,
            tier: row.tier,
            wins: row.wins,
            losses: row.losses
        }));

        return c.json({ success: true, leaderboard });
    } catch (e: any) {
        return c.json({ success: false, leaderboard: [] });
    }
});

export default router;
