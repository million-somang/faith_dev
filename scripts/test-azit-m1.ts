import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AzitCropId, AzitMaterialId } from '../apps/api-server/src/services/azit-game.catalog.js';

async function main() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-azit-m1-'));
    const tmpDbPath = path.join(tmpDir, 'test-azit-m1.db');
    process.env.DATABASE_PATH = tmpDbPath;

    // Seed core portal base tables (users, sessions, user_points, user_minihomes) BEFORE @faithportal/database runs migrations
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
            title TEXT,
            summary TEXT,
            published_at TEXT
        );
    `);
    bootstrapDb.close();

    // Dynamic imports AFTER setting DATABASE_PATH so @faithportal/database opens the temp DB once as a singleton
    const dbMod = await import('@faithportal/database');
    const pool = dbMod.pool;
    const catalog = await import('../apps/api-server/src/services/azit-game.catalog.js');
    const serviceMod = await import('../apps/api-server/src/services/azit-game.service.js');
    const routesMod = await import('../apps/api-server/src/routes/azit-game.routes.js');
    const { Hono } = await import('hono');

    const { AzitGameService, AzitGameError, calculateSoilHarvestYield } = serviceMod;
    const { azitGameRoutes } = routesMod;

    let passed = 0;
    const step = (name: string) => {
        passed += 1;
        console.log(`✅ [${passed}] ${name}`);
    };

    const insertTestUser = async (userId: number, email: string, name: string, initialPoints: number) => {
        await pool.query(
            `INSERT INTO users (id, email, name, password_hash, role, level, status)
             VALUES ($1, $2, $3, 'hash', 'user', 1, 'active')
             ON CONFLICT (id) DO NOTHING`,
            [userId, email, name]
        );
        await pool.query(
            `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
             VALUES ($1, $2, 0, 0, 0)
             ON CONFLICT (user_id) DO UPDATE SET points = $3`,
            [userId, initialPoints, initialPoints]
        );
    };

    try {
        // =========================================================================
        // 1. Legacy Pre-M1 Non-Destructive Migration & Level > 10 XP Sync
        //    (Run BEFORE AzitGameService.ensureTables() is ever called!)
        // =========================================================================
        await insertTestUser(1001, 'legacy@test.local', 'LegacyUser', 5000);

        await pool.query(`
            CREATE TABLE azit_profiles (
                user_id INTEGER PRIMARY KEY,
                azit_level INTEGER NOT NULL DEFAULT 1,
                azit_xp INTEGER NOT NULL DEFAULT 0,
                garden_migrated INTEGER NOT NULL DEFAULT 0,
                total_crops_sold INTEGER NOT NULL DEFAULT 0,
                total_dishes_cooked INTEGER NOT NULL DEFAULT 0,
                total_expeditions_won INTEGER NOT NULL DEFAULT 0,
                total_expeditions_lost INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE TABLE azit_garden_plots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plot_index INTEGER NOT NULL,
                crop_id TEXT,
                stage INTEGER NOT NULL DEFAULT 0,
                water_count INTEGER NOT NULL DEFAULT 0,
                planted_at TEXT,
                last_watered_at TEXT,
                water_notified_at TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, plot_index)
            );
        `);

        const twoHoursAgoIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const twoHoursAgoMs = Date.parse(twoHoursAgoIso);

        await pool.query(
            `INSERT INTO azit_profiles (user_id, azit_level, azit_xp, garden_migrated)
             VALUES (1001, 10, 15000, 1)`
        );
        await pool.query(
            `INSERT INTO azit_garden_plots (user_id, plot_index, crop_id, stage, water_count, planted_at, last_watered_at)
             VALUES (1001, 0, 'crop-carrot', 1, 1, $1, $2)`,
            [twoHoursAgoIso, twoHoursAgoIso]
        );
        await pool.query(
            `INSERT INTO azit_garden_plots (user_id, plot_index, crop_id, stage, water_count, planted_at, last_watered_at)
             VALUES (1001, 1, 'crop-pepper', 3, 3, $1, $2)`,
            [twoHoursAgoIso, twoHoursAgoIso]
        );

        const legacyState = await AzitGameService.getState(1001);
        assert.equal(legacyState.profile.azitXp, 15000);
        assert.equal(legacyState.profile.azitLevel, 13); // 15000 XP >= 13400 (Lv 13) & < 16400 (Lv 14)
        assert.equal(legacyState.veraPoints, 5000);

        const dbLegacyProfile = await pool.query('SELECT azit_level, garden_migrated FROM azit_profiles WHERE user_id = 1001');
        assert.equal(Number(dbLegacyProfile.rows[0].azit_level), 13);
        assert.equal(Number(dbLegacyProfile.rows[0].garden_migrated), 1);

        assert.equal(legacyState.garden.plots.length, 16);
        assert.equal(legacyState.garden.unlockedPlotCount, 6);
        assert.equal(legacyState.garden.maxPlotCount, 16);
        assert.equal(legacyState.garden.plots[0].isUnlocked, true);
        assert.equal(legacyState.garden.plots[0].cropId, 'crop-carrot');
        assert.equal(legacyState.garden.plots[0].stage, 1);
        assert.equal(legacyState.garden.plots[0].soilLevel, 0);
        assert.equal(
            legacyState.garden.plots[0].nextWaterAtMs,
            twoHoursAgoMs + catalog.GARDEN_WATER_COOLDOWN_MS
        );
        assert.equal(legacyState.garden.plots[1].cropId, 'crop-pepper');
        assert.equal(legacyState.garden.plots[1].stage, 3);
        assert.equal(legacyState.garden.plots[1].nextWaterAtMs, null);
        for (let i = 6; i < 16; i += 1) {
            assert.equal(legacyState.garden.plots[i].isUnlocked, false, `Plot ${i} should start locked`);
        }
        step('Legacy pre-M1 non-destructive migration & azit_xp > 6200 level sync');

        // =========================================================================
        // 2. Catalog Invariants & Soil Yield Formula
        // =========================================================================
        assert.equal(catalog.MAX_AZIT_LEVEL, 50);
        assert.equal(catalog.AZIT_LEVEL_TABLE.length, 50);
        const lv1To10Xp = [0, 80, 220, 460, 820, 1350, 2100, 3100, 4400, 6200];
        for (let i = 0; i < 10; i += 1) {
            assert.equal(catalog.AZIT_LEVEL_TABLE[i].level, i + 1);
            assert.equal(catalog.AZIT_LEVEL_TABLE[i].requiredXp, lv1To10Xp[i]);
        }
        assert.equal(catalog.AZIT_LEVEL_TABLE[18].maxFarmers, 0); // Lv 19
        assert.equal(catalog.AZIT_LEVEL_TABLE[19].maxFarmers, 1); // Lv 20
        assert.equal(catalog.AZIT_LEVEL_TABLE[33].maxFarmers, 1); // Lv 34
        assert.equal(catalog.AZIT_LEVEL_TABLE[34].maxFarmers, 2); // Lv 35
        assert.equal(catalog.AZIT_LEVEL_TABLE[49].gardenPlots, 16); // Lv 50
        assert.equal(catalog.AZIT_PLOT_UNLOCKS.length, 16);
        assert.equal(catalog.AZIT_CROPS.length, 12);
        assert.equal(catalog.AZIT_RECIPES.length, 14);

        for (const crop of catalog.AZIT_CROPS) {
            assert.ok(crop.harvestYield * crop.sellPrice > crop.seedPrice, `Positive margin on ${crop.cropId}`);
        }
        const validMaterials = new Set(catalog.AZIT_MATERIALS.map((m) => m.materialId));
        const validCrops = new Set(catalog.AZIT_CROPS.map((c) => c.cropId));
        for (const recipe of catalog.AZIT_RECIPES) {
            let rawCropVal = 0;
            for (const ing of recipe.ingredients) {
                if (ing.kind === 'crop') {
                    assert.ok(validCrops.has(ing.id as AzitCropId));
                    const c = catalog.getCropDef(ing.id)!;
                    rawCropVal += c.sellPrice * ing.qty;
                } else {
                    assert.ok(validMaterials.has(ing.id as AzitMaterialId));
                }
            }
            assert.ok(recipe.sellPrice > rawCropVal, `Recipe ${recipe.recipeId} sellPrice exceeds raw crop value`);
        }

        // Soil formula deterministic boundaries
        const carrot = catalog.getCropDef('crop-carrot')!;
        assert.deepEqual(calculateSoilHarvestYield(carrot, 0, () => 1), {
            baseYield: 2,
            guaranteedBonus: 0,
            chanceBonus: 0,
            totalBonus: 0,
            totalYield: 2,
            soilLevel: 0,
            luckyBonus: 0,
        });
        assert.equal(calculateSoilHarvestYield(carrot, 1, () => 25).totalYield, 3);
        assert.equal(calculateSoilHarvestYield(carrot, 1, () => 26).totalYield, 2);
        assert.equal(calculateSoilHarvestYield(carrot, 2, () => 100).totalYield, 3); // +1 guaranteed
        assert.equal(calculateSoilHarvestYield(carrot, 5, () => 60).totalYield, 5); // +2 guaranteed +1 lucky
        assert.equal(calculateSoilHarvestYield(carrot, 5, () => 61).totalYield, 4); // +2 guaranteed only
        step('Catalog invariants (Lv 1–50, 12 crops, 14 recipes, soil yield bounds)');

        // =========================================================================
        // 3. Plot Unlock Gates & Expanded Plot Operations
        // =========================================================================
        await insertTestUser(1002, 'tester@test.local', 'Tester', 20000);
        const initState = await AzitGameService.getState(1002);
        assert.equal(initState.profile.azitLevel, 1);

        await assert.rejects(() => AzitGameService.unlockPlot(1002, 0), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);
        await assert.rejects(() => AzitGameService.unlockPlot(1002, 6), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);
        await assert.rejects(() => AzitGameService.plantCrop(1002, 6, 'crop-carrot'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);

        // Promote user 1002 to Lv 5 (820 XP)
        await pool.query('UPDATE azit_profiles SET azit_xp = 820, azit_level = 5 WHERE user_id = 1002');
        const unlockRes = await AzitGameService.unlockPlot(1002, 6);
        assert.equal(unlockRes.plotIndex, 6);
        assert.equal(unlockRes.state.garden.unlockedPlotCount, 7);
        assert.equal(unlockRes.state.profile.limits.unlockedPlots, 7);
        assert.equal(unlockRes.state.garden.plots[6].isUnlocked, true);
        assert.equal(unlockRes.state.veraPoints, 20000 - 60);

        // Duplicate unlock -> 409
        await assert.rejects(() => AzitGameService.unlockPlot(1002, 6), (e: unknown) => e instanceof AzitGameError && e.statusCode === 409);

        // Plant, water, harvest, clear on unlocked plot 6
        await AzitGameService.buySeed(1002, 'crop-carrot', 2);
        const plant6 = await AzitGameService.plantCrop(1002, 6, 'crop-carrot');
        assert.equal(plant6.state.garden.plots[6].cropId, 'crop-carrot');
        assert.equal(plant6.state.garden.plots[6].stage, 1);

        // Fast-forward cooldowns to test water & harvest on expanded plot 6
        const pastMs = Date.now() - 1000;
        await pool.query('UPDATE azit_garden_plots SET next_water_at_ms = $1 WHERE user_id = 1002 AND plot_index = 6', [pastMs]);
        const water6a = await AzitGameService.waterPlot(1002, 6);
        assert.equal(water6a.state.garden.plots[6].stage, 2);

        await pool.query('UPDATE azit_garden_plots SET next_water_at_ms = $1 WHERE user_id = 1002 AND plot_index = 6', [pastMs]);
        const water6b = await AzitGameService.waterPlot(1002, 6);
        assert.equal(water6b.state.garden.plots[6].stage, 3);

        const harvest6 = await AzitGameService.harvestPlot(1002, 6);
        assert.equal(harvest6.harvestedYield, 2);
        assert.equal(harvest6.state.garden.plots[6].stage, 0);

        await AzitGameService.plantCrop(1002, 6, 'crop-carrot');
        const clear6 = await AzitGameService.clearPlot(1002, 6);
        assert.equal(clear6.state.garden.plots[6].cropId, null);

        // Locked plot 15 still blocked
        await assert.rejects(() => AzitGameService.plantCrop(1002, 15, 'crop-carrot'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);
        step('Plot 0..15 unlock gates, duplicate 409, and expanded plot CRUD');

        // =========================================================================
        // 4. Fertilizer System (Buy, Guards, Reduction, Push Sync)
        // =========================================================================
        const buyBasic = await AzitGameService.buyFertilizer(1002, 'fert-basic', 3);
        assert.equal(buyBasic.state.garden.fertilizerCounts['fert-basic'], 3);
        const buyRapid = await AzitGameService.buyFertilizer(1002, 'fert-rapid', 2);
        assert.equal(buyRapid.state.garden.fertilizerCounts['fert-rapid'], 2);

        // Guards on empty (plot 4) & locked (plot 15)
        await assert.rejects(() => AzitGameService.fertilizePlot(1002, 4, 'fert-basic'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);
        await assert.rejects(() => AzitGameService.fertilizePlot(1002, 15, 'fert-basic'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);

        // Plant on plot 4 -> scheduled push job created
        await AzitGameService.buySeed(1002, 'crop-carrot', 5);
        const planted4 = await AzitGameService.plantCrop(1002, 4, 'crop-carrot');
        const initialNextMs = planted4.state.garden.plots[4].nextWaterAtMs!;
        assert.ok(initialNextMs > Date.now() + 7 * 3600_000);

        const pushBefore = await pool.query(
            `SELECT status, scheduled_at_ms FROM notification_jobs WHERE user_id = 1002 AND dedupe_key = 'azit:garden:plot:4' AND is_deleted = 0`
        );
        assert.equal(pushBefore.rows.length, 1);
        assert.equal(pushBefore.rows[0].status, 'pending');

        // Apply 1x fert-basic (-4h)
        const fert1 = await AzitGameService.fertilizePlot(1002, 4, 'fert-basic');
        assert.equal(fert1.canWaterNow, false);
        assert.equal(fert1.fertilizerUsedCount, 1);
        assert.equal(fert1.nextWaterAtMs, initialNextMs - 4 * 3600_000);
        assert.equal(fert1.state.garden.fertilizerCounts['fert-basic'], 2);

        const pushAfter1 = await pool.query(
            `SELECT status, scheduled_at_ms FROM notification_jobs WHERE user_id = 1002 AND dedupe_key = 'azit:garden:plot:4' AND is_deleted = 0`
        );
        assert.equal(pushAfter1.rows.length, 1);
        assert.equal(Number(pushAfter1.rows[0].scheduled_at_ms), fert1.nextWaterAtMs);

        // Still cannot water before cooldown expires
        await assert.rejects(() => AzitGameService.waterPlot(1002, 4), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);

        // Apply 2nd fert-basic (-4h) -> now waterable, push cancelled!
        const fert2 = await AzitGameService.fertilizePlot(1002, 4, 'fert-basic');
        assert.equal(fert2.canWaterNow, true);
        assert.equal(fert2.fertilizerUsedCount, 2);

        const pushAfter2 = await pool.query(
            `SELECT status, is_deleted FROM notification_jobs WHERE user_id = 1002 AND dedupe_key = 'azit:garden:plot:4' ORDER BY id DESC LIMIT 1`
        );
        assert.equal(pushAfter2.rows[0].status, 'cancelled');
        assert.equal(Number(pushAfter2.rows[0].is_deleted), 1);

        // Guard on already-waterable plot
        await assert.rejects(() => AzitGameService.fertilizePlot(1002, 4, 'fert-basic'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);

        // Now watering plot 4 succeeds immediately
        const watered4 = await AzitGameService.waterPlot(1002, 4);
        assert.equal(watered4.state.garden.plots[4].stage, 2);

        // Guard on max fertilizer count (4)
        await pool.query('UPDATE azit_garden_plots SET fertilizer_used_count = 4 WHERE user_id = 1002 AND plot_index = 4');
        await assert.rejects(() => AzitGameService.fertilizePlot(1002, 4, 'fert-basic'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);

        // Guard on mature plot
        await pool.query('UPDATE azit_garden_plots SET stage = 3, fertilizer_used_count = 0 WHERE user_id = 1002 AND plot_index = 4');
        await assert.rejects(() => AzitGameService.fertilizePlot(1002, 4, 'fert-basic'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);
        await AzitGameService.clearPlot(1002, 4);
        step('Fertilizer buy, apply, all 5 guards, cooldown reduction & push sync');

        // =========================================================================
        // 5. Soil Upgrade & Bonus Harvest Yield Persistence
        // =========================================================================
        await assert.rejects(() => AzitGameService.upgradeSoil(1002, 15), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);
        const soil1 = await AzitGameService.upgradeSoil(1002, 4);
        assert.equal(soil1.soilLevel, 1);
        const soil2 = await AzitGameService.upgradeSoil(1002, 4);
        assert.equal(soil2.soilLevel, 2);
        // Lv 3 soil requires Azit Lv 12 -> fails at Lv 5
        await assert.rejects(() => AzitGameService.upgradeSoil(1002, 4), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);

        // Mature crop on soil Lv 2 (+1 guaranteed)
        await AzitGameService.plantCrop(1002, 4, 'crop-carrot');
        await pool.query('UPDATE azit_garden_plots SET stage = 3, next_water_at_ms = NULL WHERE user_id = 1002 AND plot_index = 4');
        const beforeHarv = (await AzitGameService.getState(1002)).garden.harvestCounts['crop-carrot'];
        const harvSoil = await AzitGameService.harvestPlot(1002, 4);
        assert.equal(harvSoil.harvestedYield, 3);
        assert.equal(harvSoil.bonusYield, 1);
        assert.equal(harvSoil.state.garden.harvestCounts['crop-carrot'], beforeHarv + 3);
        // Soil level preserved after harvest
        assert.equal(harvSoil.state.garden.plots[4].soilLevel, 2);
        step('Soil upgrade level/unlock gates, harvest bonus yield & persistence');

        // =========================================================================
        // 6. Bulk Actions (plantAll, waterAll, harvestAll)
        // =========================================================================
        await insertTestUser(1003, 'bulk@test.local', 'BulkUser', 30000);
        await pool.query('UPDATE azit_profiles SET azit_xp = 0, garden_migrated = 1 WHERE user_id = 1003');
        await AzitGameService.getState(1003);
        // Clear all 6 starter plots so all 0..5 are empty
        for (let idx = 0; idx < 6; idx += 1) {
            await AzitGameService.clearPlot(1003, idx);
        }

        // Buy 4 pepper seeds -> plantAll should plant exactly 4 plots (0..3) and leave 4..5 empty
        await AzitGameService.buySeed(1003, 'crop-pepper', 4);
        const bulkPlant = await AzitGameService.plantAll(1003, 'crop-pepper');
        assert.equal(bulkPlant.plantedCount, 4);
        assert.deepEqual(bulkPlant.plantedPlotIndices, [0, 1, 2, 3]);
        assert.equal(bulkPlant.state.garden.seedCounts['crop-pepper'], 0);
        assert.equal(bulkPlant.state.garden.plots[4].cropId, null);

        // Make plots 0 & 2 waterable, keep plots 1 & 3 on cooldown
        const pastTime = Date.now() - 5000;
        await pool.query('UPDATE azit_garden_plots SET next_water_at_ms = $1 WHERE user_id = 1003 AND plot_index IN (0, 2)', [pastTime]);
        const bulkWater = await AzitGameService.waterAll(1003);
        assert.equal(bulkWater.wateredCount, 2);
        assert.deepEqual(bulkWater.wateredPlotIndices, [0, 2]);
        assert.equal(bulkWater.state.garden.plots[0].stage, 2);
        assert.equal(bulkWater.state.garden.plots[1].stage, 1);

        // Upgrade plot 0 soil to Lv 2 (needs Azit Lv 5) and mature plots 0 & 1
        await pool.query('UPDATE azit_profiles SET azit_xp = 820, azit_level = 5 WHERE user_id = 1003');
        await AzitGameService.upgradeSoil(1003, 0);
        await AzitGameService.upgradeSoil(1003, 0);
        await pool.query('UPDATE azit_garden_plots SET stage = 3, next_water_at_ms = NULL WHERE user_id = 1003 AND plot_index IN (0, 1)');
        const bulkHarv = await AzitGameService.harvestAll(1003);
        assert.equal(bulkHarv.harvestedPlots, 2);
        assert.equal(bulkHarv.totalYield, 5); // plot 0 (soil Lv2 => 3) + plot 1 (soil Lv0 => 2)
        assert.equal(bulkHarv.totalBonusYield, 1);
        assert.equal(bulkHarv.xpGained, 16);
        assert.equal(bulkHarv.state.garden.plots[0].soilLevel, 2);
        assert.equal(bulkHarv.state.garden.plots[0].stage, 0);
        step('Bulk convenience actions (plantAll, waterAll, harvestAll)');

        // =========================================================================
        // 7. Lv 20–50 Crops & Recipes Integration
        // =========================================================================
        await insertTestUser(1004, 'highlv@test.local', 'HighLvUser', 100000);
        await AzitGameService.getState(1004);
        // Set Lv 19 (35900 XP) -> Lv 20 crop rejected
        await pool.query('UPDATE azit_profiles SET azit_xp = 35900, azit_level = 19 WHERE user_id = 1004');
        await assert.rejects(() => AzitGameService.buySeed(1004, 'crop-blueberry', 1), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);
        await assert.rejects(() => AzitGameService.plantAll(1004, 'crop-blueberry'), (e: unknown) => e instanceof AzitGameError && e.statusCode === 400);

        // Promote to Lv 50 (397200 XP)
        await pool.query('UPDATE azit_profiles SET azit_xp = 397200, azit_level = 50 WHERE user_id = 1004');
        const lv50State = await AzitGameService.getState(1004);
        assert.equal(lv50State.profile.azitLevel, 50);
        assert.equal(lv50State.profile.limits.maxGardenPlots, 16);
        assert.equal(lv50State.profile.limits.maxFarmers, 2);

        // Unlock plot 15 (Lv 50, 1000P) & buy/plant/water/harvest/sell crop-moonfruit
        await AzitGameService.unlockPlot(1004, 15);
        await AzitGameService.buySeed(1004, 'crop-moonfruit', 2);
        await AzitGameService.plantCrop(1004, 15, 'crop-moonfruit');
        await pool.query('UPDATE azit_garden_plots SET stage = 3, next_water_at_ms = NULL WHERE user_id = 1004 AND plot_index = 15');
        await AzitGameService.harvestPlot(1004, 15);
        const beforeSellPts = (await AzitGameService.getState(1004)).veraPoints;
        const sellMoon = await AzitGameService.sellCrop(1004, 'crop-moonfruit', 1);
        assert.equal(sellMoon.state.veraPoints, beforeSellPts + 220);

        // Cook & sell Lv 50 recipe (dish-moon-elixir: 2x moonfruit, 1x truffle, 1x mat-dragon-powder)
        await pool.query(
            `UPDATE azit_crop_inventory SET harvest_qty = 5 WHERE user_id = 1004 AND crop_id IN ('crop-moonfruit', 'crop-truffle')`
        );
        await pool.query(
            `INSERT INTO azit_material_inventory (user_id, material_id, qty)
             VALUES (1004, 'mat-dragon-powder', 2)
             ON CONFLICT (user_id, material_id) DO UPDATE SET qty = 2`
        );
        const cookStart = await AzitGameService.startCooking(1004, 0, 'dish-moon-elixir', null);
        assert.equal(cookStart.state.kitchenSlots[0].recipeId, 'dish-moon-elixir');
        await pool.query('UPDATE azit_kitchen_slots SET ends_at_ms = $1 WHERE user_id = 1004 AND slot_index = 0', [Date.now() - 2000]);
        const cookClaim = await AzitGameService.claimCooking(1004, 0);
        assert.equal(cookClaim.state.dishes['dish-moon-elixir'], 1);
        const preDishSellPts = cookClaim.state.veraPoints;
        const dishSell = await AzitGameService.sellDish(1004, 'dish-moon-elixir', 1);
        assert.equal(dishSell.state.veraPoints, preDishSellPts + 2200);
        step('Lv 20–50 crops & recipes (gating, planting, harvesting, selling, cooking)');

        // =========================================================================
        // 8. Per-User Mutex Concurrency (Double-Harvest & Point Ledger Consistency)
        // =========================================================================
        await insertTestUser(1005, 'conc@test.local', 'ConcUser', 10000);
        await AzitGameService.getState(1005);
        await pool.query(
            `UPDATE azit_garden_plots SET crop_id = 'crop-carrot', stage = 3, water_count = 3, next_water_at_ms = NULL WHERE user_id = 1005 AND plot_index = 0`
        );
        const doubleHarvest = await Promise.allSettled([
            AzitGameService.harvestPlot(1005, 0),
            AzitGameService.harvestPlot(1005, 0),
        ]);
        const fulfilledCount = doubleHarvest.filter((r) => r.status === 'fulfilled').length;
        const rejectedCount = doubleHarvest.filter((r) => r.status === 'rejected').length;
        assert.equal(fulfilledCount, 1);
        assert.equal(rejectedCount, 1);

        // Parallel point deductions
        await Promise.all([
            AzitGameService.buyFertilizer(1005, 'fert-basic', 1), // -40
            AzitGameService.buyFertilizer(1005, 'fert-basic', 1), // -40
            AzitGameService.buySeed(1005, 'crop-pepper', 1),      // -12
            AzitGameService.buyFertilizer(1005, 'fert-rapid', 1), // -75
        ]);
        const concState = await AzitGameService.getState(1005);
        assert.equal(concState.veraPoints, 10000 - (40 + 40 + 12 + 75));
        const ledgerRows = await pool.query(
            `SELECT delta_points, balance_after FROM azit_point_ledger WHERE user_id = 1005 ORDER BY id ASC`
        );
        assert.equal(ledgerRows.rows.length, 4);
        let runningBalance = 10000;
        for (const r of ledgerRows.rows) {
            runningBalance += Number(r.delta_points);
            assert.equal(Number(r.balance_after), runningBalance);
        }
        step('Per-user async mutex concurrency (double-harvest & monotonic ledger)');

        // =========================================================================
        // 9. Hono Route HTTP Contract (POST 200/400/409 & 401 unauthenticated)
        // =========================================================================
        await insertTestUser(1006, 'http@test.local', 'HttpUser', 20000);
        await AzitGameService.getState(1006);
        await pool.query('UPDATE azit_profiles SET azit_xp = 19700, azit_level = 15 WHERE user_id = 1006');
        const sessionId = 'test-session-m1-1006';
        await pool.query(
            `INSERT INTO sessions (session_id, user_id, expires_at) VALUES ($1, 1006, $2)`,
            [sessionId, new Date(Date.now() + 3600_000).toISOString()]
        );

        const app = new Hono();
        app.route('/', azitGameRoutes);

        // Unauthenticated -> 401
        const unauthRes = await app.request('/api/azit-game/garden/unlock-plot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plotIndex: 6 }),
        });
        assert.equal(unauthRes.status, 401);

        const authHeaders = {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionId}`,
        };

        // GET /state -> 200
        const getStateRes = await app.request('/api/azit-game/state', { headers: { Cookie: `session_id=${sessionId}` } });
        assert.equal(getStateRes.status, 200);
        const stateBody = (await getStateRes.json()) as { success: boolean; data: { profile: { azitLevel: number } } };
        assert.equal(stateBody.success, true);
        assert.equal(stateBody.data.profile.azitLevel, 15);

        // POST unlock-plot invalid -> 400, valid -> 200, duplicate -> 409
        const badUnlock = await app.request('/api/azit-game/garden/unlock-plot', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ plotIndex: 99 }),
        });
        assert.equal(badUnlock.status, 400);

        const okUnlock = await app.request('/api/azit-game/garden/unlock-plot', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ plotIndex: 6 }),
        });
        assert.equal(okUnlock.status, 200);

        const dupUnlock = await app.request('/api/azit-game/garden/unlock-plot', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ plotIndex: 6 }),
        });
        assert.equal(dupUnlock.status, 409);

        // POST fertilizer/buy invalid -> 400, valid -> 200
        const badFertBuy = await app.request('/api/azit-game/garden/fertilizer/buy', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ fertilizerId: 'fert-basic', quantity: 0 }),
        });
        assert.equal(badFertBuy.status, 400);

        const okFertBuy = await app.request('/api/azit-game/garden/fertilizer/buy', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ fertilizerId: 'fert-basic', quantity: 2 }),
        });
        assert.equal(okFertBuy.status, 200);

        // POST upgrade-soil -> 200
        const okSoil = await app.request('/api/azit-game/garden/upgrade-soil', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ plotIndex: 6 }),
        });
        assert.equal(okSoil.status, 200);

        // POST plant-all -> buy seeds then plant-all -> 200
        await AzitGameService.buySeed(1006, 'crop-carrot', 5);
        const okPlantAll = await app.request('/api/azit-game/garden/plant-all', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ cropId: 'crop-carrot' }),
        });
        assert.equal(okPlantAll.status, 200);

        // POST fertilize on newly planted plot 4 -> 200
        const okFert = await app.request('/api/azit-game/garden/fertilize', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ plotIndex: 4, fertilizerId: 'fert-basic' }),
        });
        assert.equal(okFert.status, 200);

        // Fast-forward plot 4 cooldown & POST water-all -> 200
        await pool.query('UPDATE azit_garden_plots SET next_water_at_ms = $1 WHERE user_id = 1006 AND plot_index = 4', [Date.now() - 1000]);
        const okWaterAll = await app.request('/api/azit-game/garden/water-all', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({}),
        });
        assert.equal(okWaterAll.status, 200);

        // POST harvest-all (plot 1 from starter has stage 3) -> 200
        const okHarvestAll = await app.request('/api/azit-game/garden/harvest-all', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({}),
        });
        assert.equal(okHarvestAll.status, 200);

        // Negative HTTP fuzz contract checks (must all return 400 without mutating points/plots)
        const pointsBeforeFuzz = (await AzitGameService.getState(1006)).veraPoints;
        const plot0BeforeFuzz = (await AzitGameService.getState(1006)).garden.plots[0];

        const badPlotValues: unknown[] = [null, '', '   ', false, [], {}, 1.5, -1, 16];
        for (const badPlot of badPlotValues) {
            for (const endpoint of [
                '/api/azit-game/garden/clear',
                '/api/azit-game/garden/water',
                '/api/azit-game/garden/harvest',
            ]) {
                const res = await app.request(endpoint, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ plotIndex: badPlot }),
                });
                assert.equal(res.status, 400, `${endpoint} should reject plotIndex=${JSON.stringify(badPlot)}`);
            }
            const plantRes = await app.request('/api/azit-game/garden/plant', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ plotIndex: badPlot, cropId: 'crop-carrot' }),
            });
            assert.equal(plantRes.status, 400, `/garden/plant should reject plotIndex=${JSON.stringify(badPlot)}`);
        }

        for (const badQty of [0, -5, 1.5, 51, 999999, null, '']) {
            const seedRes = await app.request('/api/azit-game/garden/buy-seed', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ cropId: 'crop-pepper', quantity: badQty }),
            });
            assert.equal(seedRes.status, 400, `/garden/buy-seed should reject quantity=${JSON.stringify(badQty)}`);

            const fertQtyRes = await app.request('/api/azit-game/garden/fertilizer/buy', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ fertilizerId: 'fert-basic', quantity: badQty }),
            });
            assert.equal(fertQtyRes.status, 400, `/garden/fertilizer/buy should reject quantity=${JSON.stringify(badQty)}`);
        }

        for (const badSellQty of [0, -5, 1.5, 1000, 999999, null, '']) {
            const cropSellRes = await app.request('/api/azit-game/crops/sell', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ cropId: 'crop-pepper', quantity: badSellQty }),
            });
            assert.equal(cropSellRes.status, 400, `/crops/sell should reject quantity=${JSON.stringify(badSellQty)}`);

            const dishSellRes = await app.request('/api/azit-game/dishes/sell', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ recipeId: 'dish-carrot-soup', quantity: badSellQty }),
            });
            assert.equal(dishSellRes.status, 400, `/dishes/sell should reject quantity=${JSON.stringify(badSellQty)}`);
        }

        for (const badFertId of [123, '', '   ', [], {}, null]) {
            const fertBuyIdRes = await app.request('/api/azit-game/garden/fertilizer/buy', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ fertilizerId: badFertId, quantity: 1 }),
            });
            assert.equal(fertBuyIdRes.status, 400, `/garden/fertilizer/buy should reject fertilizerId=${JSON.stringify(badFertId)}`);

            const fertilizeIdRes = await app.request('/api/azit-game/garden/fertilize', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ plotIndex: 4, fertilizerId: badFertId }),
            });
            assert.equal(fertilizeIdRes.status, 400, `/garden/fertilize should reject fertilizerId=${JSON.stringify(badFertId)}`);
        }

        const stateAfterFuzz = await AzitGameService.getState(1006);
        assert.equal(stateAfterFuzz.veraPoints, pointsBeforeFuzz, 'Fuzz rejections must not mutate points');
        assert.deepEqual(stateAfterFuzz.garden.plots[0], plot0BeforeFuzz, 'Fuzz rejections must not mutate plot 0');

        step('Hono HTTP routes (401/200/400/409 contract across all POST endpoints & fuzz vectors)');
        console.log(`\n🎉 ALL ${passed} M1 TEST SUITES PASSED!`);
    } finally {
        await pool.end();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

main().catch((err) => {
    console.error('❌ M1 test failure:', err);
    process.exit(1);
});
