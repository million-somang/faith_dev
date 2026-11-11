import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { optionalAuth } from '../middleware/auth.js';

export const submarineRoutes = new Hono<{ Variables: { user?: { id: string; email: string; name?: string } } }>();

submarineRoutes.use('*', optionalAuth);

let isTableInitialized = false;

async function ensureSubmarineTables(db: any) {
  if (isTableInitialized) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS submarine_profiles (
        user_id TEXT PRIMARY KEY,
        fleet_name TEXT DEFAULT '베라 제독전대',
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        best_turns INTEGER DEFAULT 99,
        total_matches INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 1200,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_submarine_rating ON submarine_profiles(rating DESC, best_turns ASC)
    `).run();

    isTableInitialized = true;
  } catch (err) {
    console.error('[Submarine DB Init Error]', err);
  }
}

// 1. 제독 프로필 조회
submarineRoutes.get('/api/games/submarine/profile', async (c) => {
  const db = getDB(c);
  await ensureSubmarineTables(db);
  const user = c.get('user');

  if (!user) {
    return c.json({
      success: true,
      isMember: false,
      profile: {
        fleetName: '게스트 기동함대',
        wins: 0,
        losses: 0,
        bestTurns: 0,
        totalMatches: 0,
        rating: 1200,
      },
    });
  }

  try {
    const userIdStr = String(user.id);
    let profile = await db
      .prepare('SELECT * FROM submarine_profiles WHERE user_id = ?')
      .bind(userIdStr)
      .first();

    if (!profile) {
      const defaultName = `${user.name || '베라'} 제독전대`;
      await db
        .prepare(`
          INSERT INTO submarine_profiles (user_id, fleet_name, wins, losses, best_turns, total_matches, rating)
          VALUES (?, ?, 0, 0, 99, 0, 1200)
          ON CONFLICT (user_id) DO NOTHING
        `)
        .bind(userIdStr, defaultName)
        .run();

      profile = {
        user_id: userIdStr,
        fleet_name: defaultName,
        wins: 0,
        losses: 0,
        best_turns: 99,
        total_matches: 0,
        rating: 1200,
      };
    }

    return c.json({
      success: true,
      isMember: true,
      profile: {
        fleetName: profile.fleet_name,
        wins: Number(profile.wins) || 0,
        losses: Number(profile.losses) || 0,
        bestTurns: Number(profile.best_turns) === 99 ? 0 : Number(profile.best_turns),
        totalMatches: Number(profile.total_matches) || 0,
        rating: Number(profile.rating) || 1200,
      },
    });
  } catch (error) {
    console.error('[Submarine Profile Error]', error);
    return c.json({ success: false, message: '프로필 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 2. 함대명 변경
submarineRoutes.put('/api/games/submarine/fleet-name', async (c) => {
  const db = getDB(c);
  await ensureSubmarineTables(db);
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, message: '로그인이 필요한 서비스입니다.' }, 401);
  }

  try {
    const userIdStr = String(user.id);
    const body = await c.req.json();
    const rawName = (body.fleetName || '').trim();
    const fleetName = rawName.replace(/[<>"'/]/g, '');

    if (fleetName.length < 2 || fleetName.length > 15) {
      return c.json({ success: false, message: '함대명은 2자 이상 15자 이내여야 합니다.' }, 400);
    }

    await db
      .prepare(`
        INSERT INTO submarine_profiles (user_id, fleet_name)
        VALUES (?, ?)
        ON CONFLICT (user_id) DO UPDATE SET
          fleet_name = EXCLUDED.fleet_name,
          updated_at = CURRENT_TIMESTAMP
      `)
      .bind(userIdStr, fleetName)
      .run();

    return c.json({ success: true, fleetName });
  } catch (error) {
    console.error('[Submarine FleetName Error]', error);
    return c.json({ success: false, message: '함대명 변경 실패' }, 500);
  }
});

// 3. 전투 결과 전적 저장
submarineRoutes.post('/api/games/submarine/record', async (c) => {
  const db = getDB(c);
  await ensureSubmarineTables(db);
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const isVictory = Boolean(body.isVictory ?? body.won);
    const turns = Math.max(1, Number(body.turns) || 1);
    const accuracy = Math.min(100, Math.max(0, Number(body.accuracy) || 0));
    const difficulty = String(body.difficulty || 'captain');
    const matchScore =
      Number(body.score) ||
      (isVictory ? Math.max(1200, 3000 - turns * 45 + accuracy * 10) : 850);

    const diffBonus = difficulty === 'admiral' ? 15 : difficulty === 'captain' ? 5 : 0;
    const ratingDelta = isVictory
      ? Math.max(15, 50 - turns + Math.round(accuracy / 10) + diffBonus)
      : -15;
    const earnedPoints = isVictory ? (turns <= 25 ? 50 : turns <= 35 ? 30 : 20) : 10;

    if (!user) {
      return c.json({
        success: true,
        isMember: false,
        isVictory,
        turns,
        accuracy,
        score: matchScore,
        ratingDelta: 0,
        earnedPoints: 0,
        message: '게스트 기록 완료',
      });
    }

    const userIdStr = String(user.id);
    const existing = await db
      .prepare('SELECT * FROM submarine_profiles WHERE user_id = ?')
      .bind(userIdStr)
      .first();

    const defaultFleetName = `${user.name || '베라'} 제독전대`;
    const fleetName = existing?.fleet_name || defaultFleetName;
    const prevWins = Number(existing?.wins) || 0;
    const prevLosses = Number(existing?.losses) || 0;
    const prevBestTurns = Number(existing?.best_turns) || 99;
    const prevMatches = Number(existing?.total_matches) || 0;
    const prevRating = Number(existing?.rating) || 1200;

    const nextWins = prevWins + (isVictory ? 1 : 0);
    const nextLosses = prevLosses + (isVictory ? 0 : 1);
    const nextBestTurns = isVictory
      ? prevBestTurns === 99 || prevBestTurns === 0
        ? turns
        : Math.min(prevBestTurns, turns)
      : prevBestTurns;
    const nextMatches = prevMatches + 1;
    const nextRating = Math.max(800, prevRating + ratingDelta);

    // 1) submarine_profiles 업데이트
    await db
      .prepare(`
        INSERT INTO submarine_profiles (user_id, fleet_name, wins, losses, best_turns, total_matches, rating, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
          wins = EXCLUDED.wins,
          losses = EXCLUDED.losses,
          best_turns = EXCLUDED.best_turns,
          total_matches = EXCLUDED.total_matches,
          rating = EXCLUDED.rating,
          updated_at = CURRENT_TIMESTAMP
      `)
      .bind(
        userIdStr,
        fleetName,
        nextWins,
        nextLosses,
        nextBestTurns,
        nextMatches,
        nextRating
      )
      .run();

    // 2) 통합 game_scores 테이블 기록 (마이페이지 내 게임 통계 & 통합 랭킹 연동)
    try {
      await db
        .prepare(`
          INSERT INTO game_scores (game_id, user_id, score, metadata)
          VALUES ('submarine', ?, ?, ?)
        `)
        .bind(
          user.id,
          matchScore,
          JSON.stringify({
            isVictory,
            turns,
            accuracy,
            difficulty,
            rating: nextRating,
            ratingDelta,
            earnedPoints,
          })
        )
        .run();
    } catch (scoreErr) {
      console.warn('[Submarine] game_scores insert warning:', scoreErr);
    }

    // 3) user_points 활동 포인트 적립
    if (earnedPoints > 0) {
      try {
        await db
          .prepare(`
            INSERT INTO user_points (user_id, points, activity_points)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              points = user_points.points + excluded.points,
              activity_points = user_points.activity_points + excluded.activity_points,
              updated_at = CURRENT_TIMESTAMP
          `)
          .bind(user.id, earnedPoints, earnedPoints)
          .run();
      } catch (ptErr) {
        console.warn('[Submarine] user_points award warning:', ptErr);
      }
    }

    return c.json({
      success: true,
      isMember: true,
      isVictory,
      score: matchScore,
      rating: nextRating,
      ratingDelta,
      earnedPoints,
      profile: {
        fleetName,
        wins: nextWins,
        losses: nextLosses,
        bestTurns: nextBestTurns === 99 ? 0 : nextBestTurns,
        totalMatches: nextMatches,
        rating: nextRating,
      },
    });
  } catch (error) {
    console.error('[Submarine Record Error]', error);
    return c.json({ success: false, message: '전적 저장 실패' }, 500);
  }
});

// 4. 명예의 전당 (제독 랭킹)
submarineRoutes.get('/api/games/submarine/leaderboard', async (c) => {
  const db = getDB(c);
  await ensureSubmarineTables(db);

  try {
    const records = await db
      .prepare(`
        SELECT
          sp.user_id,
          sp.fleet_name,
          sp.rating,
          sp.wins,
          sp.losses,
          sp.best_turns,
          sp.updated_at as created_at,
          u.email
        FROM submarine_profiles sp
        LEFT JOIN users u ON CAST(sp.user_id AS TEXT) = CAST(u.id AS TEXT)
        WHERE (sp.wins + sp.losses) > 0
        ORDER BY
          sp.rating DESC,
          sp.wins DESC,
          CASE WHEN sp.best_turns = 0 OR sp.best_turns = 99 THEN 999 ELSE sp.best_turns END ASC
        LIMIT 20
      `)
      .all();

    const rawList: any = records;
    const rows: any[] = Array.isArray(rawList) ? rawList : (rawList?.results || []);
    const dbLeaders = rows.map((row: any, idx: number) => {
      const wins = Number(row.wins) || 0;
      const losses = Number(row.losses) || 0;
      const total = wins + losses;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
      const rating = Number(row.rating) || 1200;
      return {
        rank: idx + 1,
        fleetName: row.fleet_name || '베라 제독전대',
        rating,
        score: rating,
        wins,
        losses,
        winRate,
        bestTurns: Number(row.best_turns) === 99 ? 0 : Number(row.best_turns),
        title: idx === 0 ? '해군 원수' : idx < 3 ? '기동제독' : '주력함장',
        email: row.email || null,
        created_at: row.created_at || new Date().toISOString(),
      };
    });

    return c.json({ success: true, leaderboard: dbLeaders });
  } catch (error) {
    console.error('[Submarine Leaderboard Error]', error);
    return c.json({ success: false, message: '명예의 전당 조회 실패' }, 500);
  }
});
