import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

export const baseballRoutes = new Hono<{ Variables: { user?: { id: string; email: string } } }>();

// 모든 야구 API에 세션 인증 미들웨어 적용 (로그인 회원 식별)
baseballRoutes.use('*', optionalAuth);

// 1. 내 구단 프로필 & 전적 조회
baseballRoutes.get('/api/games/baseball/profile', async (c) => {
    const DB = getDB(c);
    const user = c.get('user');

    if (!user) {
        return c.json({
            success: true,
            isMember: false,
            profile: {
                teamName: '베라 마린스',
                wins: 0,
                losses: 0,
                shutouts: 0,
                totalInnings: 0,
                winRate: 0.0,
            }
        });
    }

    try {
        let profile = await DB.prepare(`
            SELECT user_id, team_name, wins, losses, shutouts, total_innings, win_rate
            FROM baseball_profiles
            WHERE user_id = ?
        `).bind(user.id).first();

        if (!profile) {
            // 최초 접속 회원의 경우 기본 구단명으로 프로필 생성
            await DB.prepare(`
                INSERT INTO baseball_profiles (user_id, team_name, wins, losses, shutouts, total_innings, win_rate)
                VALUES (?, '베라 마린스', 0, 0, 0, 0, 0.0)
                ON CONFLICT (user_id) DO NOTHING
            `).bind(user.id).run();

            profile = {
                user_id: user.id,
                team_name: '베라 마린스',
                wins: 0,
                losses: 0,
                shutouts: 0,
                total_innings: 0,
                win_rate: 0.0,
            };
        }

        return c.json({
            success: true,
            isMember: true,
            profile: {
                teamName: profile.team_name,
                wins: Number(profile.wins) || 0,
                losses: Number(profile.losses) || 0,
                shutouts: Number(profile.shutouts) || 0,
                totalInnings: Number(profile.total_innings) || 0,
                winRate: Number(profile.win_rate) || 0.0,
            }
        });
    } catch (error) {
        console.error('[Baseball] Profile error:', error);
        return c.json({ success: false, message: '프로필 조회 중 오류가 발생했습니다.' }, 500);
    }
});

// 2. 구단명 변경 (로그인 회원 전용, 최대 10자)
baseballRoutes.put('/api/games/baseball/team-name', requireAuth, async (c) => {
    const DB = getDB(c);
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: '로그인이 필요합니다.' }, 401);

    try {
        const { teamName } = await c.req.json();
        const trimmed = (teamName || '').trim();

        if (!trimmed || trimmed.length < 2 || trimmed.length > 10) {
            return c.json({ success: false, message: '구단명은 2자 이상 10자 이내로 입력해주세요.' }, 400);
        }

        // 특수문자 기본 방어
        const sanitized = trimmed.replace(/[<>"'/]/g, '');

        await DB.prepare(`
            INSERT INTO baseball_profiles (user_id, team_name)
            VALUES (?, ?)
            ON CONFLICT (user_id) DO UPDATE SET
                team_name = EXCLUDED.team_name,
                updated_at = CURRENT_TIMESTAMP
        `).bind(user.id, sanitized).run();

        return c.json({ success: true, teamName: sanitized });
    } catch (error) {
        console.error('[Baseball] Update team name error:', error);
        return c.json({ success: false, message: '구단명 변경 중 오류가 발생했습니다.' }, 500);
    }
});

// 3. 게임 경기 결과 기록 (승/패 및 소모 이닝)
baseballRoutes.post('/api/games/baseball/record', async (c) => {
    const DB = getDB(c);
    const user = c.get('user');

    try {
        const body = await c.req.json();
        const isWin = Boolean(body.won ?? body.isWin);
        const innings = Math.min(Math.max(Number(body.innings ?? body.inningsUsed) || 1, 1), 9);
        const secretLength = Number(body.secretLength) || 3;

        // 비회원은 전적 저장 없이 가상 결과만 반환
        if (!user) {
            return c.json({
                success: true,
                isMember: false,
                isWin,
                inningsUsed: innings,
                badge: isWin ? (innings <= 3 ? '완봉승' : innings <= 6 ? '퀄리티 스타트' : '승리') : '패배',
            });
        }

        // 회원: 기존 전적 조회
        const profile = await DB.prepare(`
            SELECT wins, losses, shutouts, total_innings
            FROM baseball_profiles
            WHERE user_id = ?
        `).bind(user.id).first();

        const currentWins = (Number(profile?.wins) || 0) + (isWin ? 1 : 0);
        const currentLosses = (Number(profile?.losses) || 0) + (!isWin ? 1 : 0);
        const totalGames = currentWins + currentLosses;
        const newWinRate = totalGames > 0 ? ((currentWins / totalGames) * 100).toFixed(1) : '0.0';
        const isShutout = isWin && innings <= 3;
        const isQualityStart = isWin && innings > 3 && innings <= 6;
        const badge = isWin ? (isShutout ? '완봉승' : isQualityStart ? '퀄리티 스타트' : '승리') : '패배';

        // 뱃지 및 점수 포인트 계산
        let earnedPoints = 10;
        let score = 50;
        if (isWin) {
            if (isShutout) {
                earnedPoints = 50;
                score = 300;
            } else if (isQualityStart) {
                earnedPoints = 30;
                score = 200;
            } else {
                earnedPoints = 20;
                score = 120;
            }
        }

        // 1) baseball_profiles 업데이트
        await DB.prepare(`
            INSERT INTO baseball_profiles (user_id, wins, losses, shutouts, total_innings, win_rate)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (user_id) DO UPDATE SET
                wins = EXCLUDED.wins,
                losses = EXCLUDED.losses,
                shutouts = baseball_profiles.shutouts + EXCLUDED.shutouts,
                total_innings = baseball_profiles.total_innings + EXCLUDED.total_innings,
                win_rate = EXCLUDED.win_rate,
                updated_at = CURRENT_TIMESTAMP
        `).bind(
            user.id,
            currentWins,
            currentLosses,
            isShutout ? 1 : 0,
            innings,
            Number(newWinRate)
        ).run();

        // 2) game_scores 통합 랭킹 테이블 기록
        try {
            await DB.prepare(`
                INSERT INTO game_scores (game_id, user_id, score, metadata)
                VALUES ('baseball', ?, ?, ?)
            `).bind(
                user.id,
                score,
                JSON.stringify({ isWin, inningsUsed: innings, badge, earnedPoints, secretLength })
            ).run();
        } catch (e) {
            console.warn('[Baseball] Game scores insert warning:', e);
        }

        // 3) user_points 적립
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
            } catch (pErr) {
                console.warn('[Baseball] Points update warning:', pErr);
            }
        }

        return c.json({
            success: true,
            isMember: true,
            badge,
            earnedPoints,
            score,
            profile: {
                wins: currentWins,
                losses: currentLosses,
                winRate: Number(newWinRate),
                shutouts: (Number(profile?.shutouts) || 0) + (isShutout ? 1 : 0),
            }
        });
    } catch (error) {
        console.error('[Baseball] Record game error:', error);
        return c.json({ success: false, message: '경기 기록 저장 중 오류가 발생했습니다.' }, 500);
    }
});

// 4. 주간 정규 시즌 리그 순위 (TOP 20)
// 1순위: 승률 DESC, 2순위: 다승 DESC, 3순위: 평균 소모 이닝 ASC
baseballRoutes.get('/api/games/baseball/leaderboard', async (c) => {
    const DB = getDB(c);

    try {
        const result = await DB.prepare(`
            SELECT 
                bp.user_id,
                bp.team_name,
                bp.wins,
                bp.losses,
                bp.shutouts,
                bp.total_innings,
                bp.win_rate,
                COALESCE(u.name, '선수') as player_name,
                ROUND(CAST(bp.total_innings AS REAL) / NULLIF(bp.wins + bp.losses, 0), 2) as avg_innings
            FROM baseball_profiles bp
            JOIN users u ON bp.user_id = u.id
            WHERE (bp.wins + bp.losses) > 0
            ORDER BY 
                bp.win_rate DESC,
                bp.wins DESC,
                (CAST(bp.total_innings AS REAL) / NULLIF(bp.wins + bp.losses, 0)) ASC
            LIMIT 20
        `).all();

        const leaderboard = (result.results || []).map((row: any, idx: number) => ({
            rank: idx + 1,
            userId: row.user_id,
            teamName: row.team_name || '베라 마린스',
            playerName: row.player_name || '선수',
            wins: Number(row.wins) || 0,
            losses: Number(row.losses) || 0,
            shutouts: Number(row.shutouts) || 0,
            winRate: Number(row.win_rate) || 0.0,
            avgInnings: row.avg_innings ? Number(row.avg_innings) : 0,
        }));

        return c.json({ success: true, data: leaderboard, leaderboard });
    } catch (error) {
        console.error('[Baseball] Leaderboard error:', error);
        return c.json({ success: false, message: '순위표 조회 중 오류가 발생했습니다.' }, 500);
    }
});
