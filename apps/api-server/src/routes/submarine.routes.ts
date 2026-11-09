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
    let profile = await db
      .prepare('SELECT * FROM submarine_profiles WHERE user_id = ?')
      .bind(user.id)
      .first();

    if (!profile) {
      const defaultName = `${user.name || '베라'} 제독전대`;
      await db
        .prepare(`
          INSERT INTO submarine_profiles (user_id, fleet_name, wins, losses, best_turns, total_matches, rating)
          VALUES (?, ?, 0, 0, 99, 0, 1200)
          ON CONFLICT (user_id) DO NOTHING
        `)
        .bind(user.id, defaultName)
        .run();

      profile = {
        user_id: user.id,
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
    const body = await c.req.json();
    const fleetName = (body.fleetName || '').trim();

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
      .bind(user.id, fleetName)
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
    const { isVictory, turns, accuracy } = await c.req.json();

    if (!user) {
      return c.json({ success: true, message: '게스트 기록 완료' });
    }

    const ratingDelta = isVictory ? Math.max(15, 45 - turns) : -15;

    await db
      .prepare(`
        INSERT INTO submarine_profiles (user_id, wins, losses, best_turns, total_matches, rating)
        VALUES (?, ?, ?, ?, 1, ?)
        ON CONFLICT (user_id) DO UPDATE SET
          wins = submarine_profiles.wins + (CASE WHEN ? = 1 THEN 1 ELSE 0 END),
          losses = submarine_profiles.losses + (CASE WHEN ? = 0 THEN 1 ELSE 0 END),
          best_turns = CASE
            WHEN ? = 1 AND (? < submarine_profiles.best_turns OR submarine_profiles.best_turns = 99) THEN ?
            ELSE submarine_profiles.best_turns
          END,
          total_matches = submarine_profiles.total_matches + 1,
          rating = MAX(800, submarine_profiles.rating + ?),
          updated_at = CURRENT_TIMESTAMP
      `)
      .bind(
        user.id,
        isVictory ? 1 : 0,
        isVictory ? 0 : 1,
        isVictory ? turns : 99,
        Math.max(800, 1200 + ratingDelta),
        isVictory ? 1 : 0,
        isVictory ? 1 : 0,
        isVictory ? 1 : 0,
        turns,
        turns,
        ratingDelta
      )
      .run();

    return c.json({ success: true });
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
        SELECT fleet_name, rating, wins, losses, best_turns
        FROM submarine_profiles
        ORDER BY rating DESC, best_turns ASC
        LIMIT 10
      `)
      .all();

    const rawList: any = records;
    const rows: any[] = Array.isArray(rawList) ? rawList : (rawList?.results || []);
    const dbLeaders = rows.map((row: any, idx: number) => ({
      rank: idx + 1,
      fleetName: row.fleet_name,
      rating: Number(row.rating) || 1200,
      wins: Number(row.wins) || 0,
      losses: Number(row.losses) || 0,
      bestTurns: Number(row.best_turns) === 99 ? 0 : Number(row.best_turns),
      title: idx === 0 ? '해군 원수' : idx < 3 ? '기동제독' : '주력함장',
    }));

    return c.json({ success: true, leaderboard: dbLeaders });
  } catch (error) {
    console.error('[Submarine Leaderboard Error]', error);
    return c.json({ success: false, message: '명예의 전당 조회 실패' }, 500);
  }
});
