import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { requireAuth } from '../middleware/auth.js';

export const gameRoutes = new Hono<{ Variables: { user?: { id: string; email: string } } }>();

type JanggiTierKey = 'beginner' | 'easy' | 'normal' | 'hard' | 'master';
interface JanggiTierCounts {
    wins: number;
    losses: number;
    draws: number;
}
type JanggiRecordsMap = Record<JanggiTierKey, JanggiTierCounts>;

const JANGGI_TIERS: JanggiTierKey[] = ['beginner', 'easy', 'normal', 'hard', 'master'];

function createEmptyJanggiRecords(): JanggiRecordsMap {
    return {
        beginner: { wins: 0, losses: 0, draws: 0 },
        easy: { wins: 0, losses: 0, draws: 0 },
        normal: { wins: 0, losses: 0, draws: 0 },
        hard: { wins: 0, losses: 0, draws: 0 },
        master: { wins: 0, losses: 0, draws: 0 },
    };
}

function aggregateJanggiRecordsFromRows(
    rows: Array<{ metadata?: string | Record<string, unknown> | null }>
): JanggiRecordsMap {
    const counted = createEmptyJanggiRecords();
    const snapshotMax = createEmptyJanggiRecords();

    for (const row of rows) {
        if (!row.metadata) continue;
        let parsed: Record<string, unknown> | null = null;
        try {
            parsed =
                typeof row.metadata === 'string'
                    ? (JSON.parse(row.metadata) as Record<string, unknown>)
                    : (row.metadata as Record<string, unknown>);
        } catch {
            parsed = null;
        }
        if (!parsed) continue;

        // 1. 개별 대국 결과 집계
        const rawDiff = String(parsed.aiDifficulty || 'normal') as JanggiTierKey;
        const diff: JanggiTierKey = JANGGI_TIERS.includes(rawDiff) ? rawDiff : 'normal';
        const winner = parsed.winner;
        const playerSide = parsed.playerSide || 'cho';
        const gameMode = parsed.gameMode || 'classic';

        if (winner === 'draw' || parsed.isDraw === true) {
            counted[diff].draws += 1;
        } else if (
            parsed.isWin === true ||
            (winner && (gameMode === 'puzzle' ? winner === 'cho' : winner === playerSide))
        ) {
            counted[diff].wins += 1;
        } else if (winner === 'cho' || winner === 'han' || parsed.isWin === false) {
            counted[diff].losses += 1;
        }

        // 2. tierRecords 스냅샷이 있는 경우 최대값 보정
        const tierRecords = parsed.tierRecords as Record<string, Partial<JanggiTierCounts>> | undefined;
        if (tierRecords && typeof tierRecords === 'object') {
            for (const t of JANGGI_TIERS) {
                const tr = tierRecords[t];
                if (tr) {
                    snapshotMax[t].wins = Math.max(snapshotMax[t].wins, Number(tr.wins) || 0);
                    snapshotMax[t].losses = Math.max(snapshotMax[t].losses, Number(tr.losses) || 0);
                    snapshotMax[t].draws = Math.max(snapshotMax[t].draws, Number(tr.draws) || 0);
                }
            }
        }
    }

    const result = createEmptyJanggiRecords();
    for (const t of JANGGI_TIERS) {
        result[t] = {
            wins: Math.max(counted[t].wins, snapshotMax[t].wins),
            losses: Math.max(counted[t].losses, snapshotMax[t].losses),
            draws: Math.max(counted[t].draws, snapshotMax[t].draws),
        };
    }
    return result;
}

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

        const earnedPoints = metadata?.earnedPoints || 0;
        if (earnedPoints > 0) {
            try {
                await DB.prepare(`
                    INSERT INTO user_points (user_id, points, activity_points)
                    VALUES (?, ?, ?)
                    ON CONFLICT(user_id) DO UPDATE SET
                        points = user_points.points + excluded.points,
                        activity_points = user_points.activity_points + excluded.activity_points,
                        updated_at = CURRENT_TIMESTAMP
                `).bind(user.id, earnedPoints, earnedPoints).run();
                console.log(`[Game] ✅ Awarded ${earnedPoints} Vera points to user ${user.id}`);
            } catch (pErr) {
                console.warn(`[Game] Point award warning:`, pErr);
            }
        }

        console.log(`[Game] ✅ Score saved successfully: ${gameId} / ${user.email} / ${score}점`);
        return c.json({ success: true, earnedPoints });
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
            SELECT g.score, u.email, g.game_id, g.created_at
            FROM game_scores g
            JOIN users u ON g.user_id = u.id
            ORDER BY g.score DESC
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
        if (gameId === 'janggi') {
            const allRowsResult = await DB.prepare(`
                SELECT g.user_id, g.score, u.email, g.created_at, g.metadata
                FROM game_scores g
                JOIN users u ON g.user_id = u.id
                WHERE g.game_id = 'janggi'
                ORDER BY g.created_at DESC
                LIMIT 500
            `).all();

            const rawRows = (allRowsResult.results || []) as Array<{
                user_id: string | number;
                score: number;
                email: string | null;
                created_at: string;
                metadata?: string | Record<string, unknown> | null;
            }>;

            const byUser = new Map<
                string,
                {
                    email: string | null;
                    created_at: string;
                    highScore: number;
                    rows: Array<{ metadata?: string | Record<string, unknown> | null }>;
                }
            >();

            for (const r of rawRows) {
                const key = String(r.user_id || r.email || '');
                if (!key) continue;
                const existing = byUser.get(key);
                if (!existing) {
                    byUser.set(key, {
                        email: r.email,
                        created_at: r.created_at,
                        highScore: Number(r.score) || 0,
                        rows: [{ metadata: r.metadata }],
                    });
                } else {
                    existing.highScore = Math.max(existing.highScore, Number(r.score) || 0);
                    existing.rows.push({ metadata: r.metadata });
                }
            }

            const janggiLeaderboard = Array.from(byUser.values())
                .map((u) => {
                    const tierRecords = aggregateJanggiRecordsFromRows(u.rows);
                    let wins = 0;
                    let losses = 0;
                    let draws = 0;
                    for (const t of JANGGI_TIERS) {
                        wins += tierRecords[t].wins;
                        losses += tierRecords[t].losses;
                        draws += tierRecords[t].draws;
                    }
                    const decided = wins + losses;
                    const winRate = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : 0;
                    return {
                        email: u.email,
                        created_at: u.created_at,
                        score: u.highScore,
                        wins,
                        losses,
                        draws,
                        winRate,
                        tierRecords,
                    };
                })
                .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                    return b.score - a.score;
                })
                .slice(0, 10);

            return c.json({ success: true, leaderboard: janggiLeaderboard });
        }

        const result = await DB.prepare(`
            SELECT g.score, u.email, g.created_at, g.metadata
            FROM game_scores g
            JOIN users u ON g.user_id = u.id
            WHERE g.game_id = ?
            ORDER BY g.score DESC
            LIMIT 10
        `).bind(gameId).all();

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

        let latestSave: Record<string, unknown> | null = null;
        let janggiRecords: JanggiRecordsMap | null = null;
        try {
            const recentRows = await DB.prepare(
                "SELECT metadata FROM game_scores WHERE game_id = ? AND user_id = ? AND metadata IS NOT NULL ORDER BY created_at DESC LIMIT 200"
            )
                .bind(gameId, userId)
                .all();

            const rows = (recentRows.results || []) as Array<{ metadata?: string | Record<string, unknown> | null }>;
            if (gameId === 'janggi') {
                janggiRecords = aggregateJanggiRecordsFromRows(rows);
            }
            for (const row of rows) {
                if (!row.metadata) continue;
                const parsed =
                    typeof row.metadata === 'string'
                        ? (JSON.parse(row.metadata) as Record<string, unknown>)
                        : (row.metadata as Record<string, unknown>);
                if (parsed && parsed.saveState && typeof parsed.saveState === 'object') {
                    latestSave = parsed.saveState as Record<string, unknown>;
                    break;
                }
            }
        } catch (saveErr) {
            console.warn(`[Game] Latest save parse warning (${gameId}):`, saveErr);
        }

        const highScoreVal = Number(result?.highScore ?? result?.highscore ?? 0) || 0;
        return c.json({ success: true, highScore: highScoreVal, latestSave, janggiRecords });
    } catch (error) {
        console.error(`[Game] Highscore error (${gameId}):`, error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// ==================== 마이페이지: 내 게임 통계 / 최근 기록 ====================
// 실제 점수는 game_scores에 저장되므로(리더보드와 동일 테이블) 여기서도 game_scores를 읽는다.

// 내 게임별 최고 기록 통계
gameRoutes.get('/api/user/games/stats', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    try {
        const result = await DB.prepare(`
            SELECT game_id as game_type,
                   MAX(score) as high_score,
                   COUNT(*) as play_count,
                   MAX(created_at) as last_played
            FROM game_scores
            WHERE user_id = ?
            GROUP BY game_id
            ORDER BY high_score DESC
        `).bind(user.id).all();

        // 마이페이지는 stats를 게임키로 순회하므로 객체 형태로 변환
        const rows = (result.results || []) as Array<{ game_type: string; high_score: number; play_count: number; last_played: string }>;
        const stats: Record<string, (typeof rows)[number]> = {};
        for (const row of rows) stats[row.game_type] = row;

        return c.json({ success: true, stats });
    } catch (error) {
        console.error('[Game] My stats error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});

// 내 최근 게임 기록
gameRoutes.get('/api/user/games/history', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '10', 10) || 10, 1), 50);

    try {
        const result = await DB.prepare(`
            SELECT game_id as game_type, score, created_at as played_at
            FROM game_scores
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `).bind(user.id, limit).all();

        // 마이페이지는 history.history 형태로 접근
        return c.json({ success: true, history: { history: result.results || [] } });
    } catch (error) {
        console.error('[Game] My history error:', error);
        return c.json({ success: false, message: '서버 오류' }, 500);
    }
});
