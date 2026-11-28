import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

interface ApiEnvelope<T = Record<string, unknown>> {
    success: boolean;
    code?: string;
    message?: string;
    data?: T;
    error?: {
        code?: number;
        errorCode?: string;
        message?: string;
    };
}

async function main() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-azit-r-api-'));
    const tmpDbPath = path.join(tmpDir, 'test-azit-r-api.db');
    process.env.DATABASE_PATH = tmpDbPath;

    const { default: BetterSqlite3 } = await import('better-sqlite3');
    const bootstrapDb = new BetterSqlite3(tmpDbPath);
    bootstrapDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            level INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS user_points (
            user_id INTEGER PRIMARY KEY,
            points INTEGER NOT NULL DEFAULT 0,
            pending_amount INTEGER NOT NULL DEFAULT 0,
            attendance_points INTEGER NOT NULL DEFAULT 0,
            activity_points INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS user_minihomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            layout_json TEXT,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    const dbMod = await import('@faithportal/database');
    const pool = dbMod.pool;
    const catalog = await import('../apps/api-server/src/services/azit-game.catalog.js');
    const engine = await import('../apps/api-server/src/services/azit-combat.engine.js');
    const serviceMod = await import('../apps/api-server/src/services/azit-game.service.js');
    const routesMod = await import('../apps/api-server/src/routes/azit-game.routes.js');

    const { AzitGameService, AzitGameError } = serviceMod;
    const { azitGameRoutes } = routesMod;

    let passed = 0;
    const step = (label: string) => {
        passed += 1;
        console.log(`✅ [${passed}] ${label}`);
    };

    async function seedUser(userId: number, label: string, points: number, azitXp = 0): Promise<string> {
        await pool.query(
            `INSERT INTO users (id, email, name, password_hash, role, level, status)
             VALUES ($1, $2, $3, 'hash', 'user', 1, 'active')
             ON CONFLICT (id) DO NOTHING`,
            [userId, `azit-r-api-${userId}-${label}@test.local`, `Tester-${label}`]
        );
        await pool.query(
            `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
             VALUES ($1, $2, 0, 0, 0)
             ON CONFLICT (user_id) DO UPDATE SET points = $3`,
            [userId, points, points]
        );
        const sessionId = `sess-${userId}-${crypto.randomUUID()}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
            `INSERT INTO sessions (session_id, user_id, expires_at) VALUES ($1, $2, $3)`,
            [sessionId, userId, expiresAt]
        );
        if (azitXp > 0) {
            await AzitGameService.ensureUserInitialized(userId);
            await pool.query(
                `UPDATE azit_profiles SET azit_xp = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
                [azitXp, userId]
            );
        }
        return sessionId;
    }

    async function callApi<T = Record<string, unknown>>(
        method: 'GET' | 'POST',
        urlPath: string,
        sessionId: string | null,
        body?: unknown
    ): Promise<{ status: number; json: ApiEnvelope<T> }> {
        const headers: Record<string, string> = {};
        if (sessionId) {
            headers.Cookie = `session_id=${sessionId}`;
        }
        let bodyStr: string | undefined;
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
            bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const res = await azitGameRoutes.request(`http://localhost${urlPath}`, {
            method,
            headers,
            body: bodyStr,
        });
        const json = (await res.json()) as ApiEnvelope<T>;
        return { status: res.status, json };
    }

    try {
        // =====================================================================
        // S1: Legacy Pre-M2 Schema Migration & Initial State Contract (F6)
        // =====================================================================
        const legacyUserId = 2001;
        const legacySession = await seedUser(legacyUserId, 'legacy', 5000);

        // Simulate legacy pre-M2 tables BEFORE AzitGameService.ensureTables() is called
        await pool.query(`
            CREATE TABLE azit_mercenaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                merc_code TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                xp INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'idle',
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, merc_code)
            );
        `);
        await pool.query(`
            CREATE TABLE azit_expeditions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                zone_id TEXT NOT NULL,
                party_merc_codes_json TEXT NOT NULL,
                dish_recipe_id TEXT NOT NULL,
                entry_cost INTEGER NOT NULL,
                predicted_win_rate INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                started_at_ms INTEGER NOT NULL,
                ends_at_ms INTEGER NOT NULL,
                claimed_at DATETIME,
                reward_points INTEGER NOT NULL DEFAULT 0,
                reward_xp INTEGER NOT NULL DEFAULT 0,
                reward_materials_json TEXT,
                battle_log_json TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(
            `INSERT INTO azit_mercenaries (user_id, merc_code, level, xp, status)
             VALUES ($1, 'merc-leo', 3, 20, 'expedition')`,
            [legacyUserId]
        );
        const legacyStart = Date.now() - 10000;
        const legacyEnd = legacyStart + 3600 * 1000;
        await pool.query(
            `INSERT INTO azit_expeditions (
                user_id, zone_id, party_merc_codes_json, dish_recipe_id,
                entry_cost, predicted_win_rate, status, started_at_ms, ends_at_ms
             )
             VALUES ($1, 'zone-slime', '["merc-leo"]', 'dish-carrot-soup', 10, 80, 'running', $2, $3)`,
            [legacyUserId, legacyStart, legacyEnd]
        );

        const legacyStateRes = await callApi<serviceMod.AzitFullGameState>('GET', '/api/azit-game/state', legacySession);
        assert.equal(legacyStateRes.status, 200);
        assert.equal(legacyStateRes.json.success, true);
        const legacyState = legacyStateRes.json.data!;

        assert.deepEqual(legacyState.groups, []);
        assert.equal(legacyState.items.length, catalog.AZIT_ITEMS.length);
        assert.ok(legacyState.items.every((it) => it.qty === 0));
        assert.deepEqual(legacyState.tower, {
            highestClearedFloor: 0,
            maxFloor: 200,
            totalClears: 0,
            totalAttempts: 0,
        });
        assert.equal(legacyState.mercenaries.length, 1);
        assert.equal(legacyState.mercenaries[0].mercCode, 'merc-leo');
        assert.equal(legacyState.mercenaries[0].upgradeCost, null);
        assert.equal(legacyState.mercenaries[0].mainSkill.level, 1);
        assert.equal(legacyState.mercenaries[0].subSkill.level, 1);
        assert.equal(legacyState.mercenaries[0].mainSkill.maxLevel, 10);
        assert.equal(legacyState.activeExpeditions.length, 1);
        assert.equal(legacyState.activeExpeditions[0].durationSec, 3600);
        assert.ok((legacyState.activeExpeditions[0].partySnapshot?.length ?? 0) === 1);
        assert.equal(legacyState.catalog.items.length, 5);
        assert.equal(legacyState.catalog.craftRecipes.length, 5);
        assert.equal(legacyState.catalog.towerThemes.length, 5);
        assert.equal(legacyState.catalog.towerFloorsSummary.length, 200);
        step('S1: Legacy pre-M2 schema non-destructively migrated & initial state contract verified');

        // =====================================================================
        // S2: Auth Enforcement & Gold Upgrade Disablement (F8)
        // =====================================================================
        const unauthChecks: Array<['GET' | 'POST', string, unknown?]> = [
            ['GET', '/api/azit-game/state'],
            ['GET', '/api/azit-game/tower/floors'],
            ['POST', '/api/azit-game/groups/save', { name: 'A', mercCodes: ['merc-leo'] }],
            ['POST', '/api/azit-game/groups/delete', { groupId: 1 }],
            ['POST', '/api/azit-game/mercenaries/upgrade', { mercCode: 'merc-leo' }],
            ['POST', '/api/azit-game/mercenaries/revive', { mercCode: 'merc-leo', itemId: 'item-revival-herb' }],
            ['POST', '/api/azit-game/mercenaries/skills/upgrade', { mercCode: 'merc-leo', skillSlot: 'main' }],
            ['POST', '/api/azit-game/shop/buy', { itemId: 'item-revival-herb', qty: 1 }],
            ['POST', '/api/azit-game/craft', { recipeId: 'craft-revival-herb', qty: 1 }],
            ['POST', '/api/azit-game/tower/battle', { floor: 1, partyMercCodes: ['merc-leo'] }],
        ];
        for (const [method, urlPath, body] of unauthChecks) {
            const r = await callApi(method, urlPath, null, body);
            assert.equal(r.status, 401, `Unauthenticated ${method} ${urlPath} must return 401`);
        }

        const upgWithCode = await callApi('POST', '/api/azit-game/mercenaries/upgrade', legacySession, {
            mercCode: 'merc-leo',
        });
        assert.equal(upgWithCode.status, 403);
        assert.equal(upgWithCode.json.success, false);
        assert.equal(upgWithCode.json.code, 'GOLD_UPGRADE_DISABLED');
        assert.equal(upgWithCode.json.error?.errorCode, 'GOLD_UPGRADE_DISABLED');

        const upgEmpty = await callApi('POST', '/api/azit-game/mercenaries/upgrade', legacySession, {});
        assert.equal(upgEmpty.status, 403);
        assert.equal(upgEmpty.json.code, 'GOLD_UPGRADE_DISABLED');

        await assert.rejects(
            () => AzitGameService.upgradeMercenary(legacyUserId, 'merc-leo'),
            (err: unknown) =>
                err instanceof AzitGameError &&
                err.statusCode === 403 &&
                err.errorCode === 'GOLD_UPGRADE_DISABLED'
        );

        const afterUpgState = await AzitGameService.getState(legacyUserId);
        assert.equal(afterUpgState.veraPoints, 5000);
        assert.equal(afterUpgState.mercenaries[0].level, 3);
        step('S2: 401 Auth & 403 GOLD_UPGRADE_DISABLED verified (zero gold/level mutation)');

        // =====================================================================
        // S3: Group CRUD, Soft Delete & Validation (F7)
        // =====================================================================
        const userId = 2002;
        const session = await seedUser(userId, 'main', 20000);
        const hireLeo = await callApi('POST', '/api/azit-game/mercenaries/hire', session, { mercCode: 'merc-leo' });
        assert.equal(hireLeo.status, 200);
        const hireRina = await callApi('POST', '/api/azit-game/mercenaries/hire', session, { mercCode: 'merc-rina' });
        assert.equal(hireRina.status, 200);

        // At Lv1 maxPartySize = 2; create two separate groups for simultaneous expeditions
        const saveG1 = await callApi<{ group: serviceMod.AzitMercenaryGroupRecord; state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/groups/save',
            session,
            { name: '선봉 1조', slotIndex: 0, mercCodes: ['merc-leo'] }
        );
        assert.equal(saveG1.status, 200);
        const group1Id = saveG1.json.data!.group.id;
        assert.deepEqual(saveG1.json.data!.group.mercCodes, ['merc-leo']);

        const saveG2 = await callApi<{ group: serviceMod.AzitMercenaryGroupRecord }>(
            'POST',
            '/api/azit-game/groups/save',
            session,
            { name: '정찰 2조', slotIndex: 1, mercCodes: ['merc-rina'] }
        );
        assert.equal(saveG2.status, 200);
        const group2Id = saveG2.json.data!.group.id;

        // Update group 1
        const updG1 = await callApi<{ group: serviceMod.AzitMercenaryGroupRecord }>(
            'POST',
            '/api/azit-game/groups/save',
            session,
            { id: group1Id, name: '선봉 1조-수정', mercCodes: ['merc-leo'] }
        );
        assert.equal(updG1.status, 200);
        assert.equal(updG1.json.data!.group.name, '선봉 1조-수정');

        // Validation rejects
        const badUnowned = await callApi('POST', '/api/azit-game/groups/save', session, {
            name: '미영입',
            mercCodes: ['merc-aria'],
        });
        assert.equal(badUnowned.status, 400);

        const badEmptyGroup = await callApi('POST', '/api/azit-game/groups/save', session, {
            name: '빈그룹',
            mercCodes: [],
        });
        assert.equal(badEmptyGroup.status, 400);

        // Delete missing -> 404
        const delMissing = await callApi('POST', '/api/azit-game/groups/delete', session, { groupId: 99999 });
        assert.equal(delMissing.status, 404);

        // Soft delete group 2, then recreate at same slotIndex 1
        const delG2 = await callApi('POST', '/api/azit-game/groups/delete', session, { groupId: group2Id });
        assert.equal(delG2.status, 200);
        const softRow = await pool.query(
            `SELECT is_deleted, deleted_at FROM azit_mercenary_groups WHERE id = $1`,
            [group2Id]
        );
        assert.equal(softRow.rows.length, 1);
        assert.equal(Number(softRow.rows[0].is_deleted), 1);
        assert.ok(softRow.rows[0].deleted_at !== null);

        const recreateG2 = await callApi<{ group: serviceMod.AzitMercenaryGroupRecord }>(
            'POST',
            '/api/azit-game/groups/save',
            session,
            { name: '재편성 2조', slotIndex: 1, mercCodes: ['merc-rina'] }
        );
        assert.equal(recreateG2.status, 200);
        const activeGroup2Id = recreateG2.json.data!.group.id;
        assert.notEqual(activeGroup2Id, group2Id);
        step('S3: Group CRUD, validation, soft-delete & slot reuse verified');

        // =====================================================================
        // S4: Multi-Expedition 1-8h Dispatch, Combat Settlement & Casualties
        // =====================================================================
        // Seed dishes & buy battle elixir
        await pool.query(
            `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
             VALUES ($1, 'dish-carrot-soup', 5, 5), ($2, 'dish-dragon-elixir', 3, 3)
             ON CONFLICT (user_id, recipe_id) DO UPDATE SET qty = 5, special_qty = 5`,
            [userId, userId]
        );
        const buyElixir = await callApi('POST', '/api/azit-game/shop/buy', session, {
            itemId: 'item-battle-elixir',
            qty: 2,
        });
        assert.equal(buyElixir.status, 200);

        // Dispatch 1: group1Id (merc-leo) to zone-slime (1h = 3600s) with special dish (speed buff must still clamp >= 3600s!)
        const expStart1 = await callApi<{ state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/expeditions/start',
            session,
            {
                zoneId: 'zone-slime',
                groupId: group1Id,
                dishRecipeId: 'dish-carrot-soup',
                useSpecialDish: true,
                elixirItemId: 'item-battle-elixir',
            }
        );
        assert.equal(expStart1.status, 200);
        assert.equal(expStart1.json.data!.state.activeExpeditions.length, 1);
        const exp1 = expStart1.json.data!.state.activeExpeditions[0];
        assert.equal(exp1.groupId, group1Id);
        assert.equal(exp1.durationSec, 3600);
        assert.equal(exp1.dishQuality, 'special');
        assert.equal(exp1.zoneTheme, 'theme-slime-marsh');
        assert.ok((exp1.monsters?.length ?? 0) > 0);
        assert.ok((exp1.partySnapshot?.length ?? 0) === 1);

        // Deleting group on active expedition -> 409
        const delActiveGroup = await callApi('POST', '/api/azit-game/groups/delete', session, {
            groupId: group1Id,
        });
        assert.equal(delActiveGroup.status, 409);

        // Dispatch 2: simultaneously dispatch activeGroup2Id (merc-rina) to zone-goblin (2h = 7200s)
        const expStart2 = await callApi<{ state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/expeditions/start',
            session,
            {
                zoneId: 'zone-goblin',
                groupId: activeGroup2Id,
                dishRecipeId: 'dish-carrot-soup',
                dishQuality: 'normal',
            }
        );
        assert.equal(expStart2.status, 200);
        assert.equal(expStart2.json.data!.state.activeExpeditions.length, 2);
        const exp2 = expStart2.json.data!.state.activeExpeditions.find((e) => e.zoneId === 'zone-goblin')!;
        assert.equal(exp2.durationSec, 7200);

        // Verify 3rd expedition at Lv1 (maxActiveExpeditions = 2) fails
        const expStart3 = await callApi('POST', '/api/azit-game/expeditions/start', session, {
            zoneId: 'zone-slime',
            partyMercCodes: ['merc-leo'],
            dishRecipeId: 'dish-carrot-soup',
        });
        assert.equal(expStart3.status, 400);

        // Fast-forward exp1 & claim
        await pool.query(
            `UPDATE azit_expeditions SET ends_at_ms = $1 WHERE id = $2`,
            [Date.now() - 5000, exp1.id]
        );
        const claim1 = await callApi<{ report: Record<string, unknown>; state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/expeditions/claim',
            session,
            { expeditionId: exp1.id }
        );
        assert.equal(claim1.status, 200);
        const report1 = claim1.json.data!.report;
        assert.equal(report1.won, true);
        assert.ok(Number(report1.rewardPoints) > 0);
        assert.ok(Number(report1.rewardMercXp) > 0);
        assert.ok(Array.isArray(report1.battleFrames) && (report1.battleFrames as unknown[]).length >= 2);
        assert.ok(Array.isArray(report1.battleLog) && (report1.battleLog as unknown[]).length >= 2);
        assert.ok(typeof report1.mvpMercCode === 'string');
        assert.ok(
            claim1.json.data!.state.mercenaries.some((m) => m.mercCode === 'merc-leo' && m.level > 1),
            'Combat EXP from expedition claim must level up Lv1 mercenary'
        );

        // Verify DB persisted replay & reward JSON
        const dbExp1 = await pool.query(`SELECT * FROM azit_expeditions WHERE id = $1`, [exp1.id]);
        assert.ok(dbExp1.rows[0].battle_replay_json);
        assert.ok(Number(dbExp1.rows[0].reward_merc_xp) > 0);

        // Fast-forward exp2 & claim to free merc-rina
        await pool.query(`UPDATE azit_expeditions SET ends_at_ms = $1 WHERE id = $2`, [Date.now() - 5000, exp2.id]);
        const claim2 = await callApi('POST', '/api/azit-game/expeditions/claim', session, { expeditionId: exp2.id });
        assert.equal(claim2.status, 200);

        // 8h expedition + oversize group reject + deterministic casualty test on high-level user
        const highUserId = 2003;
        const highSession = await seedUser(highUserId, 'high', 50000, 12000); // Azit Lv12+
        await callApi('POST', '/api/azit-game/mercenaries/hire', highSession, { mercCode: 'merc-leo' });
        await callApi('POST', '/api/azit-game/mercenaries/hire', highSession, { mercCode: 'merc-rina' });
        await callApi('POST', '/api/azit-game/mercenaries/hire', highSession, { mercCode: 'merc-kael' });
        await callApi('POST', '/api/azit-game/mercenaries/hire', highSession, { mercCode: 'merc-serena' });

        // Oversize group (> maxPartySize = 3) must fail
        const badOversize = await callApi('POST', '/api/azit-game/groups/save', highSession, {
            name: '초과편성',
            mercCodes: ['merc-leo', 'merc-rina', 'merc-kael', 'merc-serena'],
        });
        assert.equal(badOversize.status, 400);
        await pool.query(
            `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
             VALUES ($1, 'dish-dragon-elixir', 3, 0)
             ON CONFLICT (user_id, recipe_id) DO UPDATE SET qty = 3`,
            [highUserId]
        );
        // Ensure merc-kael is Lv1 for high death chance in zone-dragon (8h = 28800s)
        const startDragon = await callApi<{ state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/expeditions/start',
            highSession,
            {
                zoneId: 'zone-dragon',
                partyMercCodes: ['merc-kael'],
                dishRecipeId: 'dish-dragon-elixir',
                dishQuality: 'normal',
            }
        );
        assert.equal(startDragon.status, 200);
        const dragonExp = startDragon.json.data!.state.activeExpeditions[0];
        const dragonZone = catalog.getZoneDef('zone-dragon')!;
        const dragonRecipe = catalog.getRecipeDef('dish-dragon-elixir')!;
        const dragonBuffs = catalog.getDishEffectiveBuffs(dragonRecipe, 'normal');
        const expectedDragonSec = Math.max(
            3600,
            Math.min(28800, Math.round(dragonZone.durationSec * (1 - dragonBuffs.expeditionSpeedBonusPct / 100)))
        );
        assert.equal(dragonExp.durationSec, expectedDragonSec);
        assert.ok(dragonExp.durationSec! >= 3600 && dragonExp.durationSec! <= 28800);

        // Pick a deterministic seed where runCombatSimulation produces a casualty on zone-dragon
        const kaelSnap = [catalog.buildMercCombatUnit({ mercCode: 'merc-kael', level: 1, unitId: 'ally-0-merc-kael' })];
        const dragonEnemies = catalog.buildZoneEnemyUnits(dragonZone);
        let casualtySeed = 0;
        for (let s = 1; s <= 50; s += 1) {
            const probe = engine.runCombatSimulation({
                mode: 'expedition',
                seed: s,
                allies: kaelSnap,
                enemies: dragonEnemies,
                dishBuffs: dragonBuffs,
                deathRiskPct: dragonZone.deathRiskPct,
                recordFrames: false,
            });
            if (!probe.won && probe.casualties.includes('merc-kael')) {
                casualtySeed = s;
                break;
            }
        }
        assert.ok(casualtySeed > 0, 'Must find deterministic casualty seed for Lv1 merc-kael vs zone-dragon');

        await pool.query(
            `UPDATE azit_expeditions SET ends_at_ms = $1, battle_seed = $2 WHERE id = $3`,
            [Date.now() - 5000, casualtySeed, dragonExp.id]
        );
        const claimDragon = await callApi<{ report: Record<string, unknown>; state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/expeditions/claim',
            highSession,
            { expeditionId: dragonExp.id }
        );
        assert.equal(claimDragon.status, 200);
        assert.equal(claimDragon.json.data!.report.won, false);
        assert.deepEqual(claimDragon.json.data!.report.casualties, ['merc-kael']);
        const deadKael = claimDragon.json.data!.state.mercenaries.find((m) => m.mercCode === 'merc-kael')!;
        assert.equal(deadKael.status, 'dead');
        assert.equal(deadKael.hp, 0);
        assert.ok(deadKael.diedAt !== null);
        assert.equal(deadKael.deathZoneId, 'zone-dragon');

        // Dead merc cannot be dispatched to expedition or tower
        const dispatchDeadExp = await callApi('POST', '/api/azit-game/expeditions/start', highSession, {
            zoneId: 'zone-slime',
            partyMercCodes: ['merc-kael'],
            dishRecipeId: 'dish-dragon-elixir',
        });
        assert.equal(dispatchDeadExp.status, 400);
        assert.equal(dispatchDeadExp.json.code, 'MERCENARY_DEAD');

        const dispatchDeadTower = await callApi('POST', '/api/azit-game/tower/battle', highSession, {
            floor: 1,
            partyMercCodes: ['merc-kael'],
        });
        assert.equal(dispatchDeadTower.status, 400);
        assert.equal(dispatchDeadTower.json.code, 'MERCENARY_DEAD');
        step('S4: Multi-expedition 1h-8h dispatch, combat settlement & casualty death verified');

        // =====================================================================
        // S5: Shop, Craft Rollback, Item-Only Revival & Skill Upgrades (F9)
        // =====================================================================
        // Shop rejects skill mats (shopPrice === null) & invalid qty & level locked item
        const buyStone = await callApi('POST', '/api/azit-game/shop/buy', session, {
            itemId: 'item-skill-stone',
            qty: 1,
        });
        assert.equal(buyStone.status, 400);
        assert.equal(buyStone.json.code, 'ITEM_NOT_PURCHASABLE');

        const buyPhoenixLv1 = await callApi('POST', '/api/azit-game/shop/buy', session, {
            itemId: 'item-phoenix-feather',
            qty: 1,
        });
        assert.equal(buyPhoenixLv1.status, 400);
        assert.equal(buyPhoenixLv1.json.code, 'AZIT_LEVEL_LOCKED');

        const herbsBeforeBuy =
            (await AzitGameService.getState(userId)).items.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0;
        const buyHerb = await callApi<{ state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/shop/buy',
            session,
            { itemId: 'item-revival-herb', qty: 2 }
        );
        assert.equal(buyHerb.status, 200);
        assert.equal(
            buyHerb.json.data!.state.items.find((i) => i.itemId === 'item-revival-herb')?.qty,
            herbsBeforeBuy + 2
        );

        // Craft rollback test: seed ingredients for craft-revival-herb (lettuce x2 + slime jelly x2, needs 40P)
        const poorUserId = 2004;
        const poorSession = await seedUser(poorUserId, 'poor', 10); // < 40P
        await AzitGameService.ensureUserInitialized(poorUserId);
        await pool.query(
            `UPDATE azit_crop_inventory SET harvest_qty = 2 WHERE user_id = $1 AND crop_id = 'crop-lettuce'`,
            [poorUserId]
        );
        await pool.query(
            `INSERT INTO azit_material_inventory (user_id, material_id, qty) VALUES ($1, 'mat-slime-jelly', 2)
             ON CONFLICT (user_id, material_id) DO UPDATE SET qty = 2`,
            [poorUserId]
        );
        const failCraft = await callApi('POST', '/api/azit-game/craft', poorSession, {
            recipeId: 'craft-revival-herb',
            qty: 1,
        });
        assert.equal(failCraft.status, 400);
        const poorState = await AzitGameService.getState(poorUserId);
        assert.equal(poorState.garden.harvestCounts['crop-lettuce'], 2, 'Crops must rollback on craft failure');
        assert.equal(poorState.materials['mat-slime-jelly'], 2, 'Materials must rollback on craft failure');
        assert.equal(poorState.veraPoints, 10);

        // Successful crafting for highUserId: craft-revival-herb & craft-skill-stone & craft-skill-tome
        await pool.query(
            `UPDATE azit_crop_inventory SET harvest_qty = 10 WHERE user_id = $1 AND crop_id IN ('crop-lettuce', 'crop-potato')`,
            [highUserId]
        );
        await pool.query(
            `INSERT INTO azit_material_inventory (user_id, material_id, qty)
             VALUES ($1, 'mat-slime-jelly', 10), ($2, 'mat-goblin-spice', 10), ($3, 'mat-forest-honey', 10), ($4, 'mat-wyvern-jerky', 10)
             ON CONFLICT (user_id, material_id) DO UPDATE SET qty = 10`,
            [highUserId, highUserId, highUserId, highUserId]
        );
        const craftHerb = await callApi('POST', '/api/azit-game/craft', highSession, {
            recipeId: 'craft-revival-herb',
            qty: 1,
        });
        assert.equal(craftHerb.status, 200);
        const craftStones = await callApi('POST', '/api/azit-game/craft', highSession, {
            recipeId: 'craft-skill-stone',
            qty: 3,
        });
        assert.equal(craftStones.status, 200);
        const craftTome = await callApi('POST', '/api/azit-game/craft', highSession, {
            recipeId: 'craft-skill-tome',
            qty: 1,
        });
        assert.equal(craftTome.status, 200);

        // Revival validations on dead merc-kael (highUserId)
        const revGold = await callApi('POST', '/api/azit-game/mercenaries/revive', highSession, {
            mercCode: 'merc-kael',
            itemId: 'item-revival-herb',
            useGold: true,
        });
        assert.equal(revGold.status, 400);
        assert.equal(revGold.json.code, 'GOLD_REVIVAL_DISABLED');

        const revWrongItem = await callApi('POST', '/api/azit-game/mercenaries/revive', highSession, {
            mercCode: 'merc-kael',
            itemId: 'item-skill-stone',
        });
        assert.equal(revWrongItem.status, 400);
        assert.equal(revWrongItem.json.code, 'INVALID_REVIVAL_ITEM');

        const revOk = await callApi<{ state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/mercenaries/revive',
            highSession,
            { mercCode: 'merc-kael', itemId: 'item-revival-herb' }
        );
        assert.equal(revOk.status, 200);
        const revivedKael = revOk.json.data!.state.mercenaries.find((m) => m.mercCode === 'merc-kael')!;
        assert.equal(revivedKael.status, 'idle');
        assert.equal(revivedKael.diedAt, null);
        assert.equal(revivedKael.deathZoneId, null);
        assert.equal(revOk.json.data!.state.items.find((i) => i.itemId === 'item-revival-herb')?.qty, 0);

        // Living merc cannot be revived
        const revLiving = await callApi('POST', '/api/azit-game/mercenaries/revive', highSession, {
            mercCode: 'merc-kael',
            itemId: 'item-revival-herb',
        });
        assert.equal(revLiving.status, 400);
        assert.equal(revLiving.json.code, 'MERCENARY_NOT_DEAD');

        // Phoenix Feather revival grants +30 bonus merc XP
        await callApi('POST', '/api/azit-game/shop/buy', highSession, {
            itemId: 'item-phoenix-feather',
            qty: 1,
        });
        await pool.query(
            `UPDATE azit_mercenaries SET status = 'dead', died_at = CURRENT_TIMESTAMP, xp = 0 WHERE user_id = $1 AND merc_code = 'merc-kael'`,
            [highUserId]
        );
        const revPhoenix = await callApi<{ bonusXpApplied: number; state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/mercenaries/revive',
            highSession,
            { mercCode: 'merc-kael', itemId: 'item-phoenix-feather' }
        );
        assert.equal(revPhoenix.status, 200);
        assert.equal(revPhoenix.json.data!.bonusXpApplied, 30);
        const phoenixKael = revPhoenix.json.data!.state.mercenaries.find((m) => m.mercCode === 'merc-kael')!;
        assert.equal(phoenixKael.status, 'idle');
        assert.equal(phoenixKael.xp, 30);

        // Skill upgrades (main with tome, sub with stone) + Lv10 cap
        const beforePowerMain = phoenixKael.mainSkill.powerPct;
        const beforePowerSub = phoenixKael.subSkill.powerPct;
        const upgMain = await callApi<{ newLevel: number; state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/mercenaries/skills/upgrade',
            highSession,
            { mercCode: 'merc-kael', skillSlot: 'main' }
        );
        assert.equal(upgMain.status, 200);
        assert.equal(upgMain.json.data!.newLevel, 2);

        const upgSub = await callApi<{ newLevel: number; state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/mercenaries/skills/upgrade',
            highSession,
            { mercCode: 'merc-kael', skillSlot: 'sub' }
        );
        assert.equal(upgSub.status, 200);
        assert.equal(upgSub.json.data!.newLevel, 2);

        const skilledKael = upgSub.json.data!.state.mercenaries.find((m) => m.mercCode === 'merc-kael')!;
        assert.ok(skilledKael.mainSkill.powerPct > beforePowerMain);
        assert.ok(skilledKael.subSkill.powerPct > beforePowerSub);

        // Lv10 cap test
        await pool.query(
            `UPDATE azit_mercenaries SET sub_skill_level = 10 WHERE user_id = $1 AND merc_code = 'merc-kael'`,
            [highUserId]
        );
        await pool.query(
            `UPDATE azit_item_inventory SET qty = 5 WHERE user_id = $1 AND item_id = 'item-skill-stone'`,
            [highUserId]
        );
        const upgCap = await callApi('POST', '/api/azit-game/mercenaries/skills/upgrade', highSession, {
            mercCode: 'merc-kael',
            skillSlot: 'sub',
        });
        assert.equal(upgCap.status, 400);
        assert.equal(upgCap.json.code, 'MAX_SKILL_LEVEL');
        const checkStone = await AzitGameService.getState(highUserId);
        assert.equal(checkStone.items.find((i) => i.itemId === 'item-skill-stone')?.qty, 5, 'Lv10 cap must not consume item');
        step('S5: Shop, craft rollback, item-only revival & skill upgrades verified');

        // =====================================================================
        // S6: Vera's Tower 1-200F, Penalty-Free Defeat & Rewards (F10)
        // =====================================================================
        const floorsRes = await callApi<{
            floors: catalog.AzitTowerFloorSummary[];
            themes: catalog.AzitTowerThemeDef[];
            progress: serviceMod.AzitTowerProgressState;
            totalFloors: number;
        }>('GET', '/api/azit-game/tower/floors?from=1&to=50', session);
        assert.equal(floorsRes.status, 200);
        assert.equal(floorsRes.json.data!.floors.length, 50);
        assert.equal(floorsRes.json.data!.themes.length, 5);
        assert.equal(floorsRes.json.data!.totalFloors, 200);

        const badFloors = await callApi('GET', '/api/azit-game/tower/floors?from=50&to=10', session);
        assert.equal(badFloors.status, 400);

        // Floor 2 locked at highestClearedFloor = 0
        const lockedTower = await callApi('POST', '/api/azit-game/tower/battle', session, {
            floor: 2,
            groupId: group1Id,
        });
        assert.equal(lockedTower.status, 400);
        assert.equal(lockedTower.json.code, 'TOWER_FLOOR_LOCKED');

        // Clear Floor 1 (first clear)
        const pointsBeforeTower = (await AzitGameService.getState(userId)).veraPoints;
        const tower1 = await callApi<{
            won: boolean;
            floor: number;
            isFirstClear: boolean;
            frames: unknown[];
            battleLog: string[];
            rewards: catalog.AzitTowerRewardBundle;
            state: serviceMod.AzitFullGameState;
        }>('POST', '/api/azit-game/tower/battle', session, {
            floor: 1,
            groupId: group1Id,
        });
        assert.equal(tower1.status, 200);
        assert.equal(tower1.json.data!.won, true);
        assert.equal(tower1.json.data!.floor, 1);
        assert.equal(tower1.json.data!.isFirstClear, true);
        assert.ok(tower1.json.data!.frames.length >= 2);
        assert.ok(tower1.json.data!.battleLog.length >= 2);
        assert.equal(tower1.json.data!.state.tower.highestClearedFloor, 1);
        assert.equal(tower1.json.data!.state.tower.totalClears, 1);
        assert.ok(tower1.json.data!.rewards.veraPoints > 0);
        assert.equal(
            tower1.json.data!.state.veraPoints,
            pointsBeforeTower + tower1.json.data!.rewards.veraPoints
        );

        // Repeat clear Floor 1
        const tower1Repeat = await callApi<{
            won: boolean;
            isFirstClear: boolean;
            rewards: catalog.AzitTowerRewardBundle;
            state: serviceMod.AzitFullGameState;
        }>('POST', '/api/azit-game/tower/battle', session, {
            floor: 1,
            groupId: group1Id,
        });
        assert.equal(tower1Repeat.status, 200);
        assert.equal(tower1Repeat.json.data!.won, true);
        assert.equal(tower1Repeat.json.data!.isFirstClear, false);
        assert.ok(tower1Repeat.json.data!.rewards.veraPoints < tower1.json.data!.rewards.veraPoints);
        assert.equal(tower1Repeat.json.data!.state.tower.totalClears, 2);

        // Penalty-free defeat at 100F with Lv1 mercs
        await pool.query(
            `UPDATE azit_tower_progress SET highest_cleared_floor = 99 WHERE user_id = $1`,
            [userId]
        );
        const herbsBeforeDefeat = (await AzitGameService.getState(userId)).items.find(
            (i) => i.itemId === 'item-revival-herb'
        )!.qty;
        const tower100 = await callApi<{
            won: boolean;
            rewards: catalog.AzitTowerRewardBundle;
            state: serviceMod.AzitFullGameState;
        }>('POST', '/api/azit-game/tower/battle', session, {
            floor: 100,
            partyMercCodes: ['merc-rina'],
        });
        assert.equal(tower100.status, 200);
        assert.equal(tower100.json.data!.won, false);
        assert.equal(tower100.json.data!.rewards.veraPoints, 0);
        assert.equal(tower100.json.data!.rewards.mercXp, 0);
        assert.ok(
            tower100.json.data!.state.mercenaries.every((m) => m.status === 'idle'),
            'Tower defeat MUST NOT kill mercenaries'
        );
        assert.equal(
            tower100.json.data!.state.items.find((i) => i.itemId === 'item-revival-herb')!.qty,
            herbsBeforeDefeat,
            'Tower defeat MUST NOT consume revival items'
        );
        // Immediate retry on 1F succeeds cleanly
        const retry1F = await callApi<{ won: boolean }>('POST', '/api/azit-game/tower/battle', session, {
            floor: 1,
            partyMercCodes: ['merc-rina'],
        });
        assert.equal(retry1F.status, 200);
        assert.equal(retry1F.json.data!.won, true);

        // 200F reachability check
        await pool.query(
            `UPDATE azit_tower_progress SET highest_cleared_floor = 199 WHERE user_id = $1`,
            [userId]
        );
        const tower200 = await callApi<{ floor: number; frames: unknown[] }>(
            'POST',
            '/api/azit-game/tower/battle',
            session,
            { floor: 200, groupId: group1Id }
        );
        assert.equal(tower200.status, 200);
        assert.equal(tower200.json.data!.floor, 200);
        assert.ok(tower200.json.data!.frames.length >= 2);

        const towerRunsRes = await pool.query(`SELECT COUNT(*) AS cnt FROM azit_tower_runs WHERE user_id = $1`, [
            userId,
        ]);
        assert.ok(Number(towerRunsRes.rows[0].cnt) >= 5);
        step('S6: Vera Tower 1-200F progression, rewards & penalty-free defeat verified');

        // =====================================================================
        // S7: Concurrency & Input Fuzzing
        // =====================================================================
        const concUserId = 2005;
        const concSession = await seedUser(concUserId, 'conc', 150); // Exact points for 1 item-revival-herb (150P)
        await AzitGameService.ensureUserInitialized(concUserId);

        // Concurrent shop/buy with exact 150P -> only 1 succeeds
        const [buyA, buyB] = await Promise.all([
            callApi('POST', '/api/azit-game/shop/buy', concSession, { itemId: 'item-revival-herb', qty: 1 }),
            callApi('POST', '/api/azit-game/shop/buy', concSession, { itemId: 'item-revival-herb', qty: 1 }),
        ]);
        const buySuccesses = [buyA, buyB].filter((r) => r.status === 200);
        const buyFailures = [buyA, buyB].filter((r) => r.status !== 200);
        assert.equal(buySuccesses.length, 1);
        assert.equal(buyFailures.length, 1);
        assert.equal((await AzitGameService.getState(concUserId)).veraPoints, 0);

        // Concurrent revive with 2 herbs & 1 dead merc -> only 1 herb consumed
        await pool.query(
            `INSERT INTO azit_mercenaries (user_id, merc_code, level, xp, status, died_at)
             VALUES ($1, 'merc-leo', 1, 0, 'dead', CURRENT_TIMESTAMP)`,
            [concUserId]
        );
        await pool.query(
            `UPDATE azit_item_inventory SET qty = 2 WHERE user_id = $1 AND item_id = 'item-revival-herb'`,
            [concUserId]
        );
        const [revA, revB] = await Promise.all([
            callApi('POST', '/api/azit-game/mercenaries/revive', concSession, {
                mercCode: 'merc-leo',
                itemId: 'item-revival-herb',
            }),
            callApi('POST', '/api/azit-game/mercenaries/revive', concSession, {
                mercCode: 'merc-leo',
                itemId: 'item-revival-herb',
            }),
        ]);
        assert.equal([revA, revB].filter((r) => r.status === 200).length, 1);
        assert.equal([revA, revB].filter((r) => r.status === 400).length, 1);
        const concState = await AzitGameService.getState(concUserId);
        assert.equal(concState.items.find((i) => i.itemId === 'item-revival-herb')?.qty, 1);

        // Concurrent double claimExpedition
        await pool.query(
            `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty) VALUES ($1, 'dish-carrot-soup', 1)
             ON CONFLICT (user_id, recipe_id) DO UPDATE SET qty = 1`,
            [concUserId]
        );
        await pool.query(`UPDATE user_points SET points = 1000 WHERE user_id = $1`, [concUserId]);
        const concExpStart = await callApi<{ state: serviceMod.AzitFullGameState }>(
            'POST',
            '/api/azit-game/expeditions/start',
            concSession,
            {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            }
        );
        assert.equal(concExpStart.status, 200);
        const concExpId = concExpStart.json.data!.state.activeExpeditions[0].id;
        await pool.query(`UPDATE azit_expeditions SET ends_at_ms = $1 WHERE id = $2`, [Date.now() - 5000, concExpId]);
        const [claimA, claimB] = await Promise.all([
            callApi('POST', '/api/azit-game/expeditions/claim', concSession, { expeditionId: concExpId }),
            callApi('POST', '/api/azit-game/expeditions/claim', concSession, { expeditionId: concExpId }),
        ]);
        assert.equal([claimA, claimB].filter((r) => r.status === 200).length, 1);
        assert.equal([claimA, claimB].filter((r) => r.status === 409).length, 1);

        // Input fuzzing (zero 500 errors)
        const fuzzRequests: Array<{ path: string; body: unknown }> = [
            { path: '/api/azit-game/groups/save', body: '' },
            { path: '/api/azit-game/groups/save', body: 'not-json' },
            { path: '/api/azit-game/groups/save', body: [] },
            { path: '/api/azit-game/groups/save', body: { name: "'; DROP TABLE users;--", mercCodes: ['unknown'] } },
            { path: '/api/azit-game/shop/buy', body: { itemId: 'item-revival-herb', qty: -5 } },
            { path: '/api/azit-game/shop/buy', body: { itemId: 'item-revival-herb', qty: 1.5 } },
            { path: '/api/azit-game/craft', body: { recipeId: 'bad-recipe', qty: 0 } },
            { path: '/api/azit-game/tower/battle', body: { floor: 0, partyMercCodes: ['merc-leo'] } },
            { path: '/api/azit-game/tower/battle', body: { floor: 201, partyMercCodes: ['merc-leo'] } },
            { path: '/api/azit-game/tower/battle', body: { floor: 1.5, partyMercCodes: ['merc-leo'] } },
        ];
        for (const f of fuzzRequests) {
            const res = await callApi('POST', f.path, concSession, f.body);
            assert.ok(res.status >= 400 && res.status < 500, `Fuzz ${f.path} expected 4xx, got ${res.status}`);
        }
        step('S7: Concurrency serialization & input fuzzing (zero 500s) verified');

        console.log(`\n🎉 ALL ${passed} AZIT M2 API & INTEGRATION SUITES PASSED!`);
    } finally {
        await pool.end();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

main().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
});
