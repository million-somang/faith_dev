import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

const cwdDbPath = path.join(process.cwd(), 'faith-portal.db');
const explicitDbPath = process.env.DATABASE_PATH?.trim() || '';
const createdTempDb = !explicitDbPath && !fs.existsSync(cwdDbPath);
const tempDbPath = path.join(
    os.tmpdir(),
    `azit-m2-test-${Date.now()}-${process.pid}.sqlite`
);
const isolatedBootstrapPath = explicitDbPath || (createdTempDb ? tempDbPath : '');

if (createdTempDb) {
    process.env.DATABASE_PATH = tempDbPath;
}

if (isolatedBootstrapPath) {
    fs.mkdirSync(path.dirname(isolatedBootstrapPath), { recursive: true });
    const bootstrapDb = new Database(isolatedBootstrapPath);
    bootstrapDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            level INTEGER DEFAULT 1,
            status TEXT DEFAULT 'active',
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            title TEXT,
            summary TEXT,
            link TEXT,
            source TEXT,
            thumbnail TEXT,
            published_at TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    bootstrapDb.close();
}

type DatabaseModule = typeof import('../packages/database/src/index.js');
type CatalogModule = typeof import('../apps/api-server/src/services/azit-game.catalog.js');
type ServiceModule = typeof import('../apps/api-server/src/services/azit-game.service.js');
type RoutesModule = typeof import('../apps/api-server/src/routes/azit-game.routes.js');
type SchedulerModule = typeof import('../apps/api-server/src/services/azit-farmer-scheduler.js');

interface ApiJsonResponse {
    success?: boolean;
    code?: string;
    message?: string;
    data?: Record<string, unknown>;
    error?: {
        code?: number;
        errorCode?: string;
        message?: string;
    };
}

async function main() {
    const dbMod: DatabaseModule = await import('../packages/database/src/index.js');
    const catalogMod: CatalogModule = await import('../apps/api-server/src/services/azit-game.catalog.js');
    const serviceMod: ServiceModule = await import('../apps/api-server/src/services/azit-game.service.js');
    const routesMod: RoutesModule = await import('../apps/api-server/src/routes/azit-game.routes.js');
    const schedulerMod: SchedulerModule = await import('../apps/api-server/src/services/azit-farmer-scheduler.js');

    const { pool } = dbMod;
    if (isolatedBootstrapPath) {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                points INTEGER DEFAULT 0,
                pending_amount INTEGER DEFAULT 0,
                attendance_points INTEGER DEFAULT 0,
                activity_points INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_minihomes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                handle TEXT NOT NULL UNIQUE,
                owner_name TEXT NOT NULL,
                room_title TEXT NOT NULL DEFAULT '사이좋은 사람들의 따뜻한 미니룸',
                status_mood TEXT NOT NULL DEFAULT 'happy',
                status_message TEXT NOT NULL DEFAULT '오늘도 내 방에 놀러와줘서 고마워요!',
                bgm_track_id TEXT NOT NULL DEFAULT 'bgm-orgel',
                layout_json TEXT NOT NULL,
                today_visitors INTEGER NOT NULL DEFAULT 1,
                total_visitors INTEGER NOT NULL DEFAULT 1,
                last_visit_date TEXT NOT NULL DEFAULT ( date('now') ),
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
    const {
        AZIT_FARMERS,
        FARMER_TASK_XP,
        GARDEN_HARVEST_AZIT_XP,
        GARDEN_WATER_COOLDOWN_MS,
        MAX_FARMER_LEVEL,
        getAzitLevelInfo,
        getCropDef,
        getFarmerDef,
        getFarmerLevelStats,
        getFarmerNextLevelXp,
        getFarmerUpgradeCost,
    } = catalogMod;
    const { AzitGameError, AzitGameService } = serviceMod;
    const { azitGameRoutes } = routesMod;
    const { runAzitFarmerTick, startAzitFarmerScheduler, stopAzitFarmerScheduler } = schedulerMod;

    const createdUserIds: number[] = [];
    const createdSessionIds: string[] = [];

    async function createTestUser(label: string, azitXp: number, points: number): Promise<{ userId: number; sessionId: string }> {
        const suffix = `${Date.now()}-${crypto.randomInt(100000, 999999)}-${label}`;
        const email = `azit-m2-${suffix}@test.local`;
        const insertRes = await pool.query(
            `INSERT INTO users (email, password, name, phone, level, status, role)
             VALUES ($1, $2, $3, NULL, 1, 'active', 'user')`,
            [email, 'test-hash-unused', `M2Test-${label}`]
        );
        const userId = Number(insertRes.lastInsertRowid);
        assert.ok(userId > 0, 'Test user must be created');
        createdUserIds.push(userId);

        const sessionId = `sess-m2-${suffix}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
            `INSERT INTO sessions (session_id, user_id, expires_at) VALUES ($1, $2, $3)`,
            [sessionId, userId, expiresAt]
        );
        createdSessionIds.push(sessionId);

        await AzitGameService.ensureUserInitialized(userId);
        const lvInfo = getAzitLevelInfo(azitXp);
        await pool.query(
            `UPDATE azit_profiles SET azit_xp = $1, azit_level = $2 WHERE user_id = $3`,
            [azitXp, lvInfo.level, userId]
        );
        await pool.query(
            `UPDATE user_points SET points = $1 WHERE user_id = $2`,
            [points, userId]
        );

        return { userId, sessionId };
    }

    async function callApi(
        method: string,
        urlPath: string,
        sessionId: string | null,
        body?: unknown
    ): Promise<{ status: number; json: ApiJsonResponse }> {
        const headers = new Headers();
        if (sessionId) {
            headers.set('Cookie', `session_id=${sessionId}`);
        }
        let bodyInit: string | undefined;
        if (body !== undefined) {
            headers.set('Content-Type', 'application/json');
            bodyInit = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const res = await azitGameRoutes.request(`http://localhost${urlPath}`, {
            method,
            headers,
            body: bodyInit,
        });
        const text = await res.text();
        let json: ApiJsonResponse = {};
        try {
            json = JSON.parse(text) as ApiJsonResponse;
        } catch (_) {
            json = { message: text };
        }
        return { status: res.status, json };
    }

    try {
        console.log('=== M2 Test Suite 1: Lv < 20 Farmer Lock & Catalog Verification ===');
        assert.ok(AZIT_FARMERS.length >= 3, 'AZIT_FARMERS must define at least 3 farmers');
        for (const f of AZIT_FARMERS) {
            assert.ok(f.requiredAzitLevel >= 20, `Farmer ${f.farmerCode} must require Azit Lv >= 20`);
            assert.equal(getFarmerDef(f.farmerCode)?.farmerCode, f.farmerCode);
        }
        assert.ok(getFarmerDef('farmer-bomi'), 'farmer-bomi must exist');
        assert.ok(getFarmerDef('farmer-dori'), 'farmer-dori must exist');
        assert.ok(getFarmerDef('farmer-eldin'), 'farmer-eldin must exist');

        const lv1User = await createTestUser('lv1', 0, 5000);
        const lv19User = await createTestUser('lv19', 35900, 5000);

        const lv1State = await AzitGameService.getState(lv1User.userId);
        assert.equal(lv1State.profile.azitLevel, 1);
        assert.equal(lv1State.profile.limits.maxFarmers, 0);
        assert.deepEqual(lv1State.farmers, []);
        assert.deepEqual(lv1State.farmerLogs, []);
        assert.equal(lv1State.catalog.farmers.length, AZIT_FARMERS.length);

        const lv19State = await AzitGameService.getState(lv19User.userId);
        assert.equal(lv19State.profile.azitLevel, 19);
        assert.equal(lv19State.profile.limits.maxFarmers, 0);

        await assert.rejects(
            () => AzitGameService.hireFarmer(lv1User.userId, 'farmer-bomi'),
            (err: unknown) =>
                err instanceof AzitGameError &&
                err.statusCode === 400 &&
                err.errorCode === 'AZIT_LEVEL_LOCKED'
        );

        const lv19HttpLock = await callApi('POST', '/api/azit-game/farmers/hire', lv19User.sessionId, {
            farmerCode: 'farmer-bomi',
        });
        assert.equal(lv19HttpLock.status, 400);
        assert.equal(lv19HttpLock.json.success, false);
        assert.equal(lv19HttpLock.json.code, 'AZIT_LEVEL_LOCKED');
        assert.equal(lv19HttpLock.json.error?.code, 400);
        assert.equal(lv19HttpLock.json.error?.errorCode, 'AZIT_LEVEL_LOCKED');

        console.log('=== M2 Test Suite 2: Lv 20+ Hire, maxFarmers & Point Ledger ===');
        const lv20User = await createTestUser('lv20', 40700, 5000);
        const lv20State0 = await AzitGameService.getState(lv20User.userId);
        assert.equal(lv20State0.profile.azitLevel, 20);
        assert.equal(lv20State0.profile.limits.maxFarmers, 1);

        // farmer-dori requires Lv 30, so Lv 20 must reject with AZIT_LEVEL_LOCKED
        await assert.rejects(
            () => AzitGameService.hireFarmer(lv20User.userId, 'farmer-dori'),
            (err: unknown) =>
                err instanceof AzitGameError &&
                err.statusCode === 400 &&
                err.errorCode === 'AZIT_LEVEL_LOCKED'
        );

        const bomiDef = getFarmerDef('farmer-bomi');
        assert.ok(bomiDef);
        const hireRes = await AzitGameService.hireFarmer(lv20User.userId, 'farmer-bomi');
        assert.equal(hireRes.state.farmers.length, 1);
        assert.equal(hireRes.state.farmers[0].farmerCode, 'farmer-bomi');
        assert.equal(hireRes.state.farmers[0].level, 1);
        assert.equal(hireRes.state.farmers[0].grade, 1);
        assert.equal(hireRes.state.farmers[0].autoEnabled, true);
        assert.equal(hireRes.state.veraPoints, 5000 - bomiDef.hireCost);

        // Verify ledger accuracy
        const ledgerTop = hireRes.state.recentLedger[0];
        assert.equal(ledgerTop.txType, 'farmer_hire');
        assert.equal(ledgerTop.deltaPoints, -bomiDef.hireCost);
        assert.equal(ledgerTop.balanceAfter, 5000 - bomiDef.hireCost);

        // Duplicate hire rejected
        await assert.rejects(
            () => AzitGameService.hireFarmer(lv20User.userId, 'farmer-bomi'),
            (err: unknown) => err instanceof AzitGameError && err.statusCode === 400
        );

        // Raise to Lv 35 -> maxFarmers = 2
        await pool.query(`UPDATE azit_profiles SET azit_xp = $1 WHERE user_id = $2`, [162200, lv20User.userId]);
        const lv35State = await AzitGameService.getState(lv20User.userId);
        assert.equal(lv35State.profile.azitLevel, 35);
        assert.equal(lv35State.profile.limits.maxFarmers, 2);

        const doriRes = await AzitGameService.hireFarmer(lv20User.userId, 'farmer-dori');
        assert.equal(doriRes.state.farmers.length, 2);

        // Raise to Lv 42 -> still maxFarmers = 2, so 3rd farmer rejected
        await pool.query(`UPDATE azit_profiles SET azit_xp = $1 WHERE user_id = $2`, [255600, lv20User.userId]);
        await assert.rejects(
            () => AzitGameService.hireFarmer(lv20User.userId, 'farmer-eldin'),
            (err: unknown) => err instanceof AzitGameError && err.statusCode === 400
        );

        console.log('=== M2 Test Suite 3: Farmer Growth & Upgrades Lv 1..20, Grades 1..4 ===');
        const lv1Stats = getFarmerLevelStats(1);
        assert.equal(lv1Stats.grade, 1);
        assert.equal(lv1Stats.gradeName, '견습 농부');
        assert.deepEqual(lv1Stats.roles, ['water']);
        assert.equal(lv1Stats.workIntervalMs, 120_000);
        assert.equal(lv1Stats.waterCooldownReductionPct, 2);

        const lv4Stats = getFarmerLevelStats(4);
        assert.equal(lv4Stats.grade, 1);
        assert.equal(lv4Stats.workIntervalMs, 90_000);
        assert.equal(lv4Stats.waterCooldownReductionPct, 6);

        const lv5Stats = getFarmerLevelStats(5);
        assert.equal(lv5Stats.grade, 2);
        assert.equal(lv5Stats.gradeName, '숙련 농부');
        assert.deepEqual(lv5Stats.roles, ['water', 'harvest']);
        assert.equal(lv5Stats.workIntervalMs, 75_000);
        assert.equal(lv5Stats.waterCooldownReductionPct, 8);

        const lv9Stats = getFarmerLevelStats(9);
        assert.equal(lv9Stats.grade, 2);
        assert.equal(lv9Stats.workIntervalMs, 50_000);
        assert.equal(lv9Stats.waterCooldownReductionPct, 14);

        const lv10Stats = getFarmerLevelStats(10);
        assert.equal(lv10Stats.grade, 3);
        assert.equal(lv10Stats.gradeName, '전문 농부');
        assert.deepEqual(lv10Stats.roles, ['water', 'harvest', 'plant']);
        assert.equal(lv10Stats.workIntervalMs, 40_000);
        assert.equal(lv10Stats.waterCooldownReductionPct, 15);

        const lv14Stats = getFarmerLevelStats(14);
        assert.equal(lv14Stats.grade, 3);
        assert.equal(lv14Stats.workIntervalMs, 25_000);
        assert.equal(lv14Stats.waterCooldownReductionPct, 22);

        const lv15Stats = getFarmerLevelStats(15);
        assert.equal(lv15Stats.grade, 4);
        assert.equal(lv15Stats.gradeName, '마스터 농부');
        assert.deepEqual(lv15Stats.roles, ['water', 'harvest', 'plant', 'fertilize']);
        assert.equal(lv15Stats.workIntervalMs, 20_000);
        assert.equal(lv15Stats.waterCooldownReductionPct, 24);

        const lv20FarmerStats = getFarmerLevelStats(20);
        assert.equal(lv20FarmerStats.grade, 4);
        assert.equal(lv20FarmerStats.workIntervalMs, 10_000);
        assert.equal(lv20FarmerStats.waterCooldownReductionPct, 30);

        const trainUser = await createTestUser('train', 40700, 100_000);
        await AzitGameService.hireFarmer(trainUser.userId, 'farmer-bomi');
        let expectedPoints = 100_000 - bomiDef.hireCost;
        for (let lv = 1; lv < MAX_FARMER_LEVEL; lv += 1) {
            const cost = getFarmerUpgradeCost(lv);
            const upg = await AzitGameService.upgradeFarmer(trainUser.userId, 'farmer-bomi');
            expectedPoints -= cost;
            const farmer = upg.state.farmers[0];
            assert.equal(farmer.level, lv + 1);
            assert.equal(farmer.grade, getFarmerLevelStats(lv + 1).grade);
            assert.equal(upg.state.veraPoints, expectedPoints);
            if (lv + 1 === MAX_FARMER_LEVEL) {
                assert.equal(farmer.xp, 0);
                assert.equal(farmer.upgradeCost, null);
            }
        }
        await assert.rejects(
            () => AzitGameService.upgradeFarmer(trainUser.userId, 'farmer-bomi'),
            (err: unknown) => err instanceof AzitGameError && err.statusCode === 400
        );

        console.log('=== M2 Test Suite 4: Automation Across Grades 1–4, XP Leveling, Logs & Minihome Sync ===');
        const autoUser = await createTestUser('auto', 40700, 50_000);
        const minihomeHandle = `m2-room-${autoUser.userId}`;
        await pool.query(
            `INSERT INTO user_minihomes (user_id, handle, owner_name, layout_json)
             VALUES ($1, $2, $3, $4)`,
            [autoUser.userId, minihomeHandle, 'AutoTester', JSON.stringify({ items: [] })]
        );

        await AzitGameService.hireFarmer(autoUser.userId, 'farmer-bomi');
        const baseTimeMs = Date.now();
        // Reset plots deterministically for controlled automation test:
        // plot 0: stage 1 crop-carrot ready to water
        // plot 1: stage 3 crop-pepper (mature, soil_level = 2)
        // plots 2..5: empty
        await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = NULL, stage = 0, water_count = 0, soil_level = 0,
                 planted_at = NULL, last_watered_at = NULL, next_water_at_ms = NULL, fertilizer_used_count = 0
             WHERE user_id = $1`,
            [autoUser.userId]
        );
        const tPast = new Date(baseTimeMs - 10_000).toISOString();
        await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = 'crop-carrot', stage = 1, water_count = 1,
                 planted_at = $1, last_watered_at = $2, next_water_at_ms = $3
             WHERE user_id = $4 AND plot_index = 0`,
            [tPast, tPast, baseTimeMs - 5_000, autoUser.userId]
        );
        await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = 'crop-pepper', stage = 3, water_count = 3, soil_level = 2,
                 planted_at = $1, last_watered_at = $2, next_water_at_ms = NULL
             WHERE user_id = $3 AND plot_index = 1`,
            [tPast, tPast, autoUser.userId]
        );

        // Set last_auto_tick_ms so 1 tick (120s) has elapsed
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [baseTimeMs - 120_000, autoUser.userId]
        );

        const g1Run = await AzitGameService.processFarmerAutomation(autoUser.userId, baseTimeMs);
        assert.equal(g1Run.tasksExecuted, 1, 'Grade 1 farmer should execute 1 water task');
        assert.equal(g1Run.actions[0].actionType, 'water');
        assert.equal(g1Run.actions[0].plotIndex, 0);

        const afterG1State = await AzitGameService.getState(autoUser.userId);
        // Plot 0 watered to stage 2 with 2% cooldown reduction
        assert.equal(afterG1State.garden.plots[0].stage, 2);
        const expectedReducedMs = Math.round(GARDEN_WATER_COOLDOWN_MS * (1 - 2 / 100));
        assert.equal(afterG1State.garden.plots[0].nextWaterAtMs, baseTimeMs + expectedReducedMs);
        // Plot 1 (stage 3) MUST NOT be harvested by Grade 1 farmer
        assert.equal(afterG1State.garden.plots[1].stage, 3);
        assert.equal(afterG1State.garden.plots[1].cropId, 'crop-pepper');
        assert.equal(afterG1State.farmers[0].xp, FARMER_TASK_XP);
        assert.equal(afterG1State.farmers[0].totalWatered, 1);
        assert.equal(afterG1State.farmers[0].totalHarvested, 0);

        // Verify minihome layout_json.garden synced
        const mhRes1 = await pool.query(`SELECT layout_json FROM user_minihomes WHERE user_id = $1`, [autoUser.userId]);
        const mhJson1 = JSON.parse(String(mhRes1.rows[0].layout_json)) as { garden?: { plots?: Array<{ stage?: number }> } };
        assert.equal(mhJson1.garden?.plots?.[0]?.stage, 2);

        // Upgrade farmer to Lv 5 (Grade 2: water + harvest)
        for (let lv = 1; lv < 5; lv += 1) {
            await AzitGameService.upgradeFarmer(autoUser.userId, 'farmer-bomi');
        }
        const beforePepperQty = afterG1State.garden.harvestCounts['crop-pepper'];
        const beforeAzitXp = afterG1State.profile.azitXp;
        const g2TimeMs = baseTimeMs + 75_000;
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [baseTimeMs, autoUser.userId]
        );
        const g2Run = await AzitGameService.processFarmerAutomation(autoUser.userId, g2TimeMs);
        assert.equal(g2Run.tasksExecuted, 1);
        assert.equal(g2Run.actions[0].actionType, 'harvest');
        assert.equal(g2Run.actions[0].plotIndex, 1);

        const afterG2State = await AzitGameService.getState(autoUser.userId);
        const pepperDef = getCropDef('crop-pepper');
        assert.ok(pepperDef);
        // Soil level 2 gives guaranteed +1 bonus yield on top of baseYield
        assert.equal(afterG2State.garden.plots[1].stage, 0);
        assert.equal(
            afterG2State.garden.harvestCounts['crop-pepper'],
            beforePepperQty + pepperDef.harvestYield + 1
        );
        assert.equal(afterG2State.profile.azitXp, beforeAzitXp + GARDEN_HARVEST_AZIT_XP);
        assert.equal(afterG2State.farmers[0].totalHarvested, 1);

        // Upgrade farmer to Lv 10 (Grade 3: +plant) and test preferredCropId & fallback
        for (let lv = 5; lv < 10; lv += 1) {
            await AzitGameService.upgradeFarmer(autoUser.userId, 'farmer-bomi');
        }
        await pool.query(
            `UPDATE azit_crop_inventory SET seed_qty = 2 WHERE user_id = $1 AND crop_id = 'crop-tomato'`,
            [autoUser.userId]
        );
        await pool.query(
            `UPDATE azit_crop_inventory SET seed_qty = 2 WHERE user_id = $1 AND crop_id = 'crop-carrot'`,
            [autoUser.userId]
        );
        await AzitGameService.configureFarmer(autoUser.userId, {
            farmerCode: 'farmer-bomi',
            preferredCropId: 'crop-tomato',
        });

        const g3Time1 = g2TimeMs + 40_000;
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [g2TimeMs, autoUser.userId]
        );
        const g3Run1 = await AzitGameService.processFarmerAutomation(autoUser.userId, g3Time1);
        assert.equal(g3Run1.tasksExecuted, 1);
        assert.equal(g3Run1.actions[0].actionType, 'plant');
        assert.equal(g3Run1.actions[0].plotIndex, 1); // plot 1 was emptied by harvest
        assert.equal(g3Run1.actions[0].cropId, 'crop-tomato');

        // Now set preferredCropId = null -> fallback to first unlocked owned seed (crop-carrot)
        await AzitGameService.configureFarmer(autoUser.userId, {
            farmerCode: 'farmer-bomi',
            preferredCropId: null,
        });
        const g3Time2 = g3Time1 + 40_000;
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [g3Time1, autoUser.userId]
        );
        const g3Run2 = await AzitGameService.processFarmerAutomation(autoUser.userId, g3Time2);
        assert.equal(g3Run2.tasksExecuted, 1);
        assert.equal(g3Run2.actions[0].actionType, 'plant');
        assert.equal(g3Run2.actions[0].plotIndex, 2);
        assert.equal(g3Run2.actions[0].cropId, 'crop-carrot');

        // Upgrade farmer to Lv 15 (Grade 4: +fertilize), enable autoFertilize, buy basic fertilizer
        for (let lv = 10; lv < 15; lv += 1) {
            await AzitGameService.upgradeFarmer(autoUser.userId, 'farmer-bomi');
        }
        await AzitGameService.buyFertilizer(autoUser.userId, 'fert-basic', 2);
        await AzitGameService.configureFarmer(autoUser.userId, {
            farmerCode: 'farmer-bomi',
            autoFertilize: true,
        });

        const beforeFertState = await AzitGameService.getState(autoUser.userId);
        const plot0NextBefore = beforeFertState.garden.plots[0].nextWaterAtMs;
        assert.ok(plot0NextBefore !== null);
        const g4Time = g3Time2 + 20_000;
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [g3Time2, autoUser.userId]
        );
        const g4Run = await AzitGameService.processFarmerAutomation(autoUser.userId, g4Time);
        assert.equal(g4Run.tasksExecuted, 1);
        assert.equal(g4Run.actions[0].actionType, 'fertilize');
        assert.equal(g4Run.actions[0].plotIndex, 0);

        const afterG4State = await AzitGameService.getState(autoUser.userId);
        assert.equal(afterG4State.garden.fertilizerCounts['fert-basic'], 1);
        assert.equal(afterG4State.garden.plots[0].fertilizerUsedCount, 1);
        assert.ok((afterG4State.garden.plots[0].nextWaterAtMs ?? Infinity) < plot0NextBefore);

        // Verify +5 XP auto-leveling when farmer XP crosses nextLevelXp
        const preXpLv = afterG4State.farmers[0].level;
        const neededXp = getFarmerNextLevelXp(preXpLv);
        await pool.query(
            `UPDATE azit_farmers SET xp = $1, last_auto_tick_ms = $2 WHERE user_id = $3 AND farmer_code = 'farmer-bomi'`,
            [neededXp - FARMER_TASK_XP, g4Time, autoUser.userId]
        );
        const xpUpTime = g4Time + 20_000;
        const xpRun = await AzitGameService.processFarmerAutomation(autoUser.userId, xpUpTime);
        assert.equal(xpRun.tasksExecuted, 1);
        const afterXpState = await AzitGameService.getState(autoUser.userId);
        assert.equal(afterXpState.farmers[0].level, preXpLv + 1);
        assert.equal(afterXpState.farmers[0].xp, 0);

        // Verify farmerLogs capped at <= 30 and newest-first
        assert.ok(afterXpState.farmerLogs.length >= 5);
        assert.ok(afterXpState.farmerLogs.length <= 30);
        for (let i = 1; i < afterXpState.farmerLogs.length; i += 1) {
            assert.ok(afterXpState.farmerLogs[i - 1].id > afterXpState.farmerLogs[i].id);
        }

        console.log('=== M2 Test Suite 5: CAS Duplicate-Tick Prevention & Bounded Catch-up ===');
        const casUser = await createTestUser('cas', 40700, 50_000);
        await AzitGameService.hireFarmer(casUser.userId, 'farmer-bomi');
        for (let lv = 1; lv < 15; lv += 1) {
            await AzitGameService.upgradeFarmer(casUser.userId, 'farmer-bomi');
        }
        // Clear plots and give 30 carrot seeds so catch-up can plant at most 10 unlocked plots or 24 tasks
        await pool.query(
            `UPDATE azit_garden_plots SET crop_id = NULL, stage = 0, water_count = 0, next_water_at_ms = NULL WHERE user_id = $1`,
            [casUser.userId]
        );
        await pool.query(
            `UPDATE azit_crop_inventory SET seed_qty = 40 WHERE user_id = $1 AND crop_id = 'crop-carrot'`,
            [casUser.userId]
        );
        // Unlock all 16 plots and enable autoFertilize with 20 fert-basic so >24 tasks are eligible over 10 hours
        const casBase = Date.now();
        await AzitGameService.buyFertilizer(casUser.userId, 'fert-basic', 20);
        await AzitGameService.configureFarmer(casUser.userId, {
            farmerCode: 'farmer-bomi',
            autoFertilize: true,
        });
        await pool.query(
            `UPDATE azit_garden_plots SET is_unlocked = 1 WHERE user_id = $1 AND plot_index <= 15`,
            [casUser.userId]
        );
        const casPastIso = new Date(casBase - 10 * 3600_000).toISOString();
        for (let p = 0; p < 16; p += 1) {
            await pool.query(
                `UPDATE azit_garden_plots
                 SET crop_id = 'crop-carrot', stage = 1, water_count = 1,
                     planted_at = $1, last_watered_at = $2, next_water_at_ms = $3
                 WHERE user_id = $4 AND plot_index = $5`,
                [casPastIso, casPastIso, casBase - 10 * 3600_000, casUser.userId, p]
            );
        }
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [casBase - 10 * 3600_000, casUser.userId]
        );

        // Concurrent calls at identical timestamp: only one executes bounded catch-up (= 24 tasks), the other executes 0!
        const [rA, rB] = await Promise.all([
            AzitGameService.processFarmerAutomation(casUser.userId, casBase),
            AzitGameService.processFarmerAutomation(casUser.userId, casBase),
        ]);
        const totalTasks = rA.tasksExecuted + rB.tasksExecuted;
        assert.equal(totalTasks, 24, `Bounded catch-up must cap at 24 tasks, got ${totalTasks}`);
        assert.equal(Math.min(rA.tasksExecuted, rB.tasksExecuted), 0, 'Duplicate concurrent call must execute 0 tasks');

        const casRow = await pool.query(
            `SELECT last_auto_tick_ms FROM azit_farmers WHERE user_id = $1 AND farmer_code = 'farmer-bomi'`,
            [casUser.userId]
        );
        assert.equal(Number(casRow.rows[0].last_auto_tick_ms), casBase, 'Bounded catch-up must advance last_auto_tick_ms to nowMs');

        // Regression 5a: Downtime capped catch-up (prevTickMs = nowMs - 10h, plot next_water_at_ms = nowMs - 1h)
        const downtimeUser = await createTestUser('downtime', 40700, 50_000);
        await AzitGameService.hireFarmer(downtimeUser.userId, 'farmer-bomi');
        for (let lv = 1; lv < 15; lv += 1) {
            await AzitGameService.upgradeFarmer(downtimeUser.userId, 'farmer-bomi');
        }
        await pool.query(
            `UPDATE azit_garden_plots SET crop_id = NULL, stage = 0, water_count = 0, next_water_at_ms = NULL WHERE user_id = $1`,
            [downtimeUser.userId]
        );
        await pool.query(
            `UPDATE azit_crop_inventory SET seed_qty = 0 WHERE user_id = $1`,
            [downtimeUser.userId]
        );
        const downtimeNowMs = Date.now();
        const downtimePastIso = new Date(downtimeNowMs - 9 * 3600_000).toISOString();
        await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = 'crop-carrot', stage = 1, water_count = 1,
                 planted_at = $1, last_watered_at = $2, next_water_at_ms = $3
             WHERE user_id = $4 AND plot_index = 0`,
            [downtimePastIso, downtimePastIso, downtimeNowMs - 3600_000, downtimeUser.userId]
        );
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [downtimeNowMs - 10 * 3600_000, downtimeUser.userId]
        );
        const downtimeRun = await AzitGameService.processFarmerAutomation(downtimeUser.userId, downtimeNowMs);
        assert.ok(
            downtimeRun.tasksExecuted >= 1,
            `Capped catch-up must execute overdue task (expected >= 1, got ${downtimeRun.tasksExecuted})`
        );
        assert.equal(downtimeRun.actions[0].actionType, 'water');
        assert.equal(downtimeRun.actions[0].plotIndex, 0);
        const downtimeState = await AzitGameService.getState(downtimeUser.userId);
        assert.equal(downtimeState.garden.plots[0].stage, 2, 'Overdue plot must advance to stage 2 after capped catch-up');

        // Regression 5b: Mid-window cooldown expiry (Lv 15 workIntervalMs = 20_000, t0 + 25_000 expiry, invoked at t0 + 40_000)
        const midWinUser = await createTestUser('midwin', 40700, 50_000);
        await AzitGameService.hireFarmer(midWinUser.userId, 'farmer-bomi');
        for (let lv = 1; lv < 15; lv += 1) {
            await AzitGameService.upgradeFarmer(midWinUser.userId, 'farmer-bomi');
        }
        await pool.query(
            `UPDATE azit_garden_plots SET crop_id = NULL, stage = 0, water_count = 0, next_water_at_ms = NULL WHERE user_id = $1`,
            [midWinUser.userId]
        );
        await pool.query(
            `UPDATE azit_crop_inventory SET seed_qty = 0 WHERE user_id = $1`,
            [midWinUser.userId]
        );
        const t0 = Date.now() - 40_000;
        const midPastIso = new Date(t0 - 60_000).toISOString();
        await pool.query(
            `UPDATE azit_garden_plots
             SET crop_id = 'crop-carrot', stage = 1, water_count = 1,
                 planted_at = $1, last_watered_at = $2, next_water_at_ms = $3
             WHERE user_id = $4 AND plot_index = 0`,
            [midPastIso, midPastIso, t0 + 25_000, midWinUser.userId]
        );
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [t0, midWinUser.userId]
        );
        const midWinRun = await AzitGameService.processFarmerAutomation(midWinUser.userId, t0 + 40_000);
        assert.equal(
            midWinRun.tasksExecuted,
            1,
            `Mid-window cooldown expiry at t0+25s must be processed at t0+40s, got ${midWinRun.tasksExecuted}`
        );
        assert.equal(midWinRun.actions[0].actionType, 'water');
        assert.equal(midWinRun.actions[0].plotIndex, 0);
        const midWinState = await AzitGameService.getState(midWinUser.userId);
        assert.equal(midWinState.garden.plots[0].stage, 2, 'Plot 0 must advance to stage 2 on mid-window tick');

        console.log('=== M2 Test Suite 6: configureFarmer Validation & autoEnabled Toggle ===');
        // Locked crop at Lv 20 (crop-moonfruit requires Lv 50)
        await assert.rejects(
            () =>
                AzitGameService.configureFarmer(casUser.userId, {
                    farmerCode: 'farmer-bomi',
                    preferredCropId: 'crop-moonfruit',
                }),
            (err: unknown) => err instanceof AzitGameError && err.statusCode === 400
        );

        // Disable autoEnabled -> time passes -> 0 tasks run
        await AzitGameService.configureFarmer(casUser.userId, {
            farmerCode: 'farmer-bomi',
            autoEnabled: false,
        });
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [casBase - 500_000, casUser.userId]
        );
        const disabledRun = await AzitGameService.processFarmerAutomation(casUser.userId, casBase);
        assert.equal(disabledRun.tasksExecuted, 0);

        // Re-enable autoEnabled -> resets last_auto_tick_ms to ~nowMs so disabled downtime is NOT replayed
        const beforeReenableMs = Date.now();
        const reenabled = await AzitGameService.configureFarmer(casUser.userId, {
            farmerCode: 'farmer-bomi',
            autoEnabled: true,
        });
        assert.equal(reenabled.state.farmers[0].autoEnabled, true);
        assert.ok(reenabled.state.farmers[0].lastAutoTickMs >= beforeReenableMs);

        console.log('=== M2 Test Suite 7: HTTP Routes (POST-only, requireAuth, 400 Validation) & Scheduler ===');
        const unauthState = await callApi('GET', '/api/azit-game/state', null);
        assert.equal(unauthState.status, 401);
        const unauthHire = await callApi('POST', '/api/azit-game/farmers/hire', null, { farmerCode: 'farmer-bomi' });
        assert.equal(unauthHire.status, 401);

        const httpUser = await createTestUser('http', 40700, 10_000);
        // PATCH must not be mounted
        const patchRes = await callApi('PATCH', '/api/azit-game/farmers/config', httpUser.sessionId, {
            farmerCode: 'farmer-bomi',
            autoEnabled: false,
        });
        assert.equal(patchRes.status, 404);

        // Invalid payloads -> 400
        const badHire = await callApi('POST', '/api/azit-game/farmers/hire', httpUser.sessionId, { farmerCode: 123 });
        assert.equal(badHire.status, 400);
        const okHire = await callApi('POST', '/api/azit-game/farmers/hire', httpUser.sessionId, { farmerCode: 'farmer-bomi' });
        assert.equal(okHire.status, 200);
        assert.equal(okHire.json.success, true);

        const badConfigs: unknown[] = [
            { farmerCode: 'farmer-bomi' },
            { farmerCode: 'farmer-bomi', autoEnabled: 'true' },
            { farmerCode: 'farmer-bomi', autoFertilize: 1 },
            { farmerCode: 'farmer-bomi', preferredCropId: '' },
            { farmerCode: 'farmer-bomi', preferredCropId: 999 },
            { farmerCode: '', autoEnabled: false },
        ];
        for (const payload of badConfigs) {
            const badCfg = await callApi('POST', '/api/azit-game/farmers/config', httpUser.sessionId, payload);
            assert.equal(badCfg.status, 400, `Expected 400 for payload ${JSON.stringify(payload)}`);
        }

        const okCfg = await callApi('POST', '/api/azit-game/farmers/config', httpUser.sessionId, {
            farmerCode: 'farmer-bomi',
            autoEnabled: true,
            autoFertilize: true,
            preferredCropId: 'crop-carrot',
        });
        assert.equal(okCfg.status, 200);

        const badUpg = await callApi('POST', '/api/azit-game/farmers/upgrade', httpUser.sessionId, { farmerCode: null });
        assert.equal(badUpg.status, 400);
        const okUpg = await callApi('POST', '/api/azit-game/farmers/upgrade', httpUser.sessionId, { farmerCode: 'farmer-bomi' });
        assert.equal(okUpg.status, 200);

        // Scheduler tick & concurrency guard & lifecycle
        await pool.query(
            `UPDATE azit_farmers SET last_auto_tick_ms = $1 WHERE user_id = $2 AND farmer_code = 'farmer-bomi'`,
            [Date.now() - 120_000, httpUser.userId]
        );
        const [tick1, tick2] = await Promise.all([runAzitFarmerTick(), runAzitFarmerTick()]);
        assert.ok(tick1.processedUsers + tick2.processedUsers >= 1);
        assert.equal(
            Math.min(tick1.processedUsers, tick2.processedUsers),
            0,
            'isTicking guard must prevent overlapping ticks'
        );

        startAzitFarmerScheduler();
        stopAzitFarmerScheduler();

        console.log('ALL 7 M2 TEST SUITES PASSED!');
    } finally {
        stopAzitFarmerScheduler();
        for (const sid of createdSessionIds) {
            await pool.query(
                `UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z' WHERE session_id = $1`,
                [sid]
            );
        }
        for (const uid of createdUserIds) {
            await pool.query(
                `UPDATE azit_farmers SET is_deleted = 1, auto_enabled = 0, deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
                [uid]
            );
            await pool.query(
                `UPDATE azit_profiles SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
                [uid]
            );
            await pool.query(
                `UPDATE user_minihomes SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
                [uid]
            );
            await pool.query(
                `UPDATE users SET status = 'deleted' WHERE id = $1`,
                [uid]
            );
        }
        await pool.end();

        if (createdTempDb) {
            for (const suffix of ['', '-wal', '-shm']) {
                const target = `${tempDbPath}${suffix}`;
                if (fs.existsSync(target)) {
                    fs.unlinkSync(target);
                }
            }
        }
    }
}

main().catch((err) => {
    console.error('M2 test suite failed:', err);
    process.exit(1);
});
