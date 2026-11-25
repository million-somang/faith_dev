import assert from 'node:assert/strict';
import { DbHarness } from '../db-harness.js';
import { HttpClient } from '../http-client.js';
import { ServerHarness } from '../server-harness.js';
import {
  GARDEN_HARVEST_AZIT_XP,
  GARDEN_WATER_COOLDOWN_MS,
  PLOT_UNLOCK_SCHEDULE,
  assertAzitLevelLockedError,
  assertErrorStatus,
  fetchAzitState,
  getServerNowMs,
  hireFirstEligibleFarmer,
  postAzitAction,
  queryAzitLedger,
  seedMaterials,
  unlockedPlotsSeed,
  upgradeFarmerToLevel,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { ApiEnvelope } from '../helpers/azit-helpers.js';
import type { E2ETestCase } from '../types.js';

export const tier3Tests: E2ETestCase[] = [
  {
    id: 'T3-01',
    tier: 3,
    feature: 'F2',
    name: '[F1+F2] Lv 4 harvest promotes Azit to Lv 5 and immediately unlocks plot 6',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 4,
        azitXp: xpForLevel(5) - GARDEN_HARVEST_AZIT_XP, // 820 - 8 = 812 (Lv 4)
        points: 200,
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 3,
            waterCount: 3,
            isUnlocked: 1,
          },
        ],
      });

      const lockedRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', {
        plotIndex: 6,
      });
      assertErrorStatus(lockedRes, 400, 'Lv 4 cannot unlock plot 6');

      const harvestRes = await postAzitAction(user.client, '/api/azit-game/garden/harvest', {
        plotIndex: 0,
      });
      assert.equal(harvestRes.state.profile.azitXp, xpForLevel(5));
      assert.equal(harvestRes.state.profile.azitLevel, 5);
      assert.equal(harvestRes.state.profile.limits.maxGardenPlots, 7);

      const unlockRes = await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', {
        plotIndex: 6,
      });
      assert.equal(unlockRes.state.veraPoints, 200 - PLOT_UNLOCK_SCHEDULE[0].unlockCost);
      assert.equal(unlockRes.state.garden.plots[6].isUnlocked, true);
      assert.equal(unlockRes.state.garden.unlockedPlotCount, 7);
    },
  },
  {
    id: 'T3-02',
    tier: 3,
    feature: 'F5',
    name: '[F2+F5] Unlocking plot 12 at Lv 35, upgrading soil to Lv 5, and harvesting yields soil bonus & ledger audit',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        points: 3000,
        crops: { 'crop-carrot': { seedQty: 1 } },
      });

      await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 12 });
      for (let step = 0; step < 5; step += 1) {
        await postAzitAction(user.client, '/api/azit-game/garden/upgrade-soil', { plotIndex: 12 });
      }

      const prePlant = await fetchAzitState(user.client);
      assert.equal(prePlant.garden.plots[12].soilLevel, 5);
      assert.equal(prePlant.veraPoints, 250);

      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 12,
        cropId: 'crop-carrot',
      });

      const pastMs = Date.now() - 60_000;
      ctx.db.backdatePlotTimers(user.userId, 12, { nextWaterAtMs: pastMs });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 12 });
      ctx.db.backdatePlotTimers(user.userId, 12, { nextWaterAtMs: pastMs });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 12 });

      const harvestRes = await postAzitAction<{
        harvestedYield?: number;
        bonusYield?: number;
      }>(user.client, '/api/azit-game/garden/harvest', { plotIndex: 12 });

      const harvestedYield = harvestRes.harvestedYield ?? 0;
      const bonusYield = harvestRes.bonusYield ?? 0;
      assert.ok(
        harvestedYield >= 4 && harvestedYield <= 5,
        `Expected soil Lv 5 carrot yield in 4..5, got ${harvestedYield}`
      );
      assert.ok(bonusYield >= 2, `Expected soil Lv 5 bonusYield >= 2, got ${bonusYield}`);
      assert.equal(harvestRes.state.garden.plots[12].soilLevel, 5);
      assert.equal(harvestRes.state.veraPoints, 250);

      const ledger = queryAzitLedger(ctx.db, user.userId);
      const unlockRows = ledger.filter((r) => r.tx_type === 'plot_unlock' && r.ref_id === '12');
      const soilRows = ledger.filter((r) => r.tx_type === 'soil_upgrade');
      assert.equal(unlockRows.length, 1);
      assert.equal(soilRows.length, 5);
    },
  },
  {
    id: 'T3-03',
    tier: 3,
    feature: 'F3',
    name: '[F3+F5] Rapid fertilizer + Lv 4 soil speeds Lv 20 blueberry growth to harvest while preserving soilLevel',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 300,
        crops: { 'crop-blueberry': { seedQty: 1 } },
        plots: [{ plotIndex: 0, isUnlocked: 1, soilLevel: 4, stage: 0 }],
      });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-rapid',
        quantity: 2,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-blueberry',
      });

      const f1 = await postAzitAction<{ canWaterNow?: boolean }>(
        user.client,
        '/api/azit-game/garden/fertilize',
        { plotIndex: 0, fertilizerId: 'fert-rapid' }
      );
      assert.equal(f1.canWaterNow, true);
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });

      const f2 = await postAzitAction<{ canWaterNow?: boolean }>(
        user.client,
        '/api/azit-game/garden/fertilize',
        { plotIndex: 0, fertilizerId: 'fert-rapid' }
      );
      assert.equal(f2.canWaterNow, true);
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });

      const harvestRes = await postAzitAction(user.client, '/api/azit-game/garden/harvest', {
        plotIndex: 0,
      });
      assert.equal(harvestRes.state.garden.fertilizerCounts['fert-rapid'], 0);
      assert.ok(
        harvestRes.state.garden.harvestCounts['crop-blueberry'] >= 4,
        `Expected soil Lv 4 blueberry harvest >= 4, got ${harvestRes.state.garden.harvestCounts['crop-blueberry']}`
      );
      assert.equal(harvestRes.state.garden.plots[0].fertilizerUsedCount, 0);
      assert.equal(harvestRes.state.garden.plots[0].soilLevel, 4);
    },
  },
  {
    id: 'T3-04',
    tier: 3,
    feature: 'F4',
    name: '[F3+F4] Rapid fertilizer makes only fertilized plots eligible for bulk water-all',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        points: 200,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: futureMs, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: futureMs, isUnlocked: 1 },
          { plotIndex: 2, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: futureMs, isUnlocked: 1 },
        ],
      });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-rapid',
        quantity: 2,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-rapid',
      });
      await postAzitAction(user.client, '/api/azit-game/garden/fertilize', {
        plotIndex: 2,
        fertilizerId: 'fert-rapid',
      });

      const waterAllRes = await postAzitAction<{
        wateredCount?: number;
        wateredPlotIndices?: number[];
      }>(user.client, '/api/azit-game/garden/water-all', {});

      assert.equal(waterAllRes.wateredCount, 2);
      assert.deepEqual(waterAllRes.wateredPlotIndices, [0, 2]);
      assert.equal(waterAllRes.state.garden.plots[0].stage, 2);
      assert.equal(waterAllRes.state.garden.plots[1].stage, 1);
      assert.equal(waterAllRes.state.garden.plots[2].stage, 2);
    },
  },
  {
    id: 'T3-05',
    tier: 3,
    feature: 'F4',
    name: '[F4+F5] Bulk harvest-all aggregates heterogeneous soil bonuses across unlocked plots',
    run: async (ctx) => {
      const plots = unlockedPlotsSeed(10);
      const soilMap: Record<number, number> = { 0: 0, 1: 2, 6: 4, 9: 5 };
      for (const [idxStr, soil] of Object.entries(soilMap)) {
        const idx = Number(idxStr);
        plots[idx] = {
          plotIndex: idx,
          isUnlocked: 1,
          soilLevel: soil,
          cropId: 'crop-strawberry',
          stage: 3,
          waterCount: 3,
        };
      }

      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        unlockedPlots: 10,
        plots,
      });

      const res = await postAzitAction<{
        harvestedPlots?: number;
        totalYield?: number;
        totalBonusYield?: number;
        xpGained?: number;
      }>(user.client, '/api/azit-game/garden/harvest-all', {});

      assert.equal(res.harvestedPlots, 4);
      assert.ok((res.totalBonusYield ?? 0) >= 5, `Expected totalBonusYield >= 5, got ${res.totalBonusYield}`);
      assert.ok((res.totalYield ?? 0) >= 13, `Expected totalYield >= 13, got ${res.totalYield}`);
      assert.equal(res.xpGained, 32);
      assert.equal(res.state.garden.harvestCounts['crop-strawberry'], res.totalYield);
      assert.equal(res.state.garden.plots[0].soilLevel, 0);
      assert.equal(res.state.garden.plots[1].soilLevel, 2);
      assert.equal(res.state.garden.plots[6].soilLevel, 4);
      assert.equal(res.state.garden.plots[9].soilLevel, 5);
    },
  },
  {
    id: 'T3-06',
    tier: 3,
    feature: 'F6',
    name: '[F4+F6] Bulk plant-all allocates partial Lv 25 seeds to empty expanded plots and blocks Lv 30 seeds',
    run: async (ctx) => {
      const futureMs = Date.now() + 3_600_000;
      const plots = unlockedPlotsSeed(11);
      for (let i = 0; i <= 3; i += 1) {
        plots[i] = {
          plotIndex: i,
          isUnlocked: 1,
          cropId: 'crop-carrot',
          stage: 1,
          waterCount: 1,
          nextWaterAtMs: futureMs,
        };
      }

      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        unlockedPlots: 11,
        points: 1000,
        plots,
      });

      await postAzitAction(user.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-pumpkin',
        quantity: 5,
      });

      const plantRes = await postAzitAction<{
        plantedCount?: number;
        plantedPlotIndices?: number[];
      }>(user.client, '/api/azit-game/garden/plant-all', { cropId: 'crop-pumpkin' });

      assert.equal(plantRes.plantedCount, 5);
      assert.deepEqual(plantRes.plantedPlotIndices, [4, 5, 6, 7, 8]);
      assert.equal(plantRes.state.garden.seedCounts['crop-pumpkin'], 0);
      assert.equal(plantRes.state.garden.plots[9].stage, 0);
      assert.equal(plantRes.state.garden.plots[10].stage, 0);

      const lockedRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', {
        cropId: 'crop-melon',
      });
      assertErrorStatus(lockedRes, 400, 'Lv 25 plant-all crop-melon (Lv 30)');

      const after = await fetchAzitState(user.client);
      assert.equal(after.garden.plots[9].stage, 0);
      assert.equal(after.garden.plots[10].stage, 0);
    },
  },
  {
    id: 'T3-07',
    tier: 3,
    feature: 'F2',
    name: '[F2+F6] Lv 50 plot 15 grows crop-moonfruit for dish-moon-elixir cook & sell economy pipeline',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 2000,
        crops: { 'crop-truffle': { harvestQty: 1 } },
      });
      await fetchAzitState(user.client);
      seedMaterials(ctx.db, user.userId, { 'mat-dragon-powder': 1 });

      await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 15 });
      await postAzitAction(user.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-moonfruit',
        quantity: 2,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 15,
        cropId: 'crop-moonfruit',
      });

      const pastMs = Date.now() - 60_000;
      ctx.db.backdatePlotTimers(user.userId, 15, { nextWaterAtMs: pastMs });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 15 });
      ctx.db.backdatePlotTimers(user.userId, 15, { nextWaterAtMs: pastMs });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 15 });

      const harvestRes = await postAzitAction(user.client, '/api/azit-game/garden/harvest', {
        plotIndex: 15,
      });
      assert.equal(harvestRes.state.garden.harvestCounts['crop-moonfruit'], 2);

      const startCook = await postAzitAction(user.client, '/api/azit-game/kitchen/start', {
        slotIndex: 0,
        recipeId: 'dish-moon-elixir',
      });
      assert.equal(startCook.state.garden.harvestCounts['crop-moonfruit'], 0);

      ctx.db.execute(
        'UPDATE azit_kitchen_slots SET ends_at_ms = ? WHERE user_id = ? AND slot_index = 0 AND is_deleted = 0',
        [Date.now() - 5000, user.userId]
      );
      const claimRes = await postAzitAction<{ producedQty?: number }>(
        user.client,
        '/api/azit-game/kitchen/claim',
        { slotIndex: 0 }
      );
      assert.equal(claimRes.producedQty, 1);

      const sellRes = await postAzitAction(user.client, '/api/azit-game/dishes/sell', {
        recipeId: 'dish-moon-elixir',
        quantity: 1,
      });
      assert.equal(sellRes.state.veraPoints, 2840);

      const dishSellRows = queryAzitLedger(ctx.db, user.userId, 'dish_sell');
      assert.equal(dishSellRows.length, 1);
      assert.equal(dishSellRows[0].delta_points, 2200);
    },
  },
  {
    id: 'T3-08',
    tier: 3,
    feature: 'F7',
    name: '[F7+F8] Two hired farmers at Lv 35 execute Grade 1 (water only) vs Grade 2 (harvest) roles independently',
    run: async (ctx) => {
      const pastMs = Date.now() - 60_000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        points: 15000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
        ],
      });

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: 'farmer-bomi',
      });
      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: 'farmer-dori',
      });

      const bomiLv5 = await upgradeFarmerToLevel(user.client, 'farmer-bomi', 5);
      const stateMid = await fetchAzitState(user.client);
      const doriLv1 = stateMid.farmers!.find((f) => f.farmerCode === 'farmer-dori')!;
      assert.equal(doriLv1.grade, 1);

      // Tick only farmer-dori (Grade 1): should water plot 1, must NOT harvest plot 0
      ctx.db.backdateFarmerTick(
        user.userId,
        'farmer-dori',
        Date.now() - doriLv1.workIntervalMs * 2
      );
      const afterDori = await fetchAzitState(user.client);
      assert.equal(afterDori.garden.plots[1].stage, 2);
      assert.equal(afterDori.garden.plots[0].stage, 3);

      // Now tick farmer-bomi (Grade 2): should harvest plot 0
      ctx.db.backdateFarmerTick(
        user.userId,
        'farmer-bomi',
        Date.now() - bomiLv5.workIntervalMs * 2
      );
      const afterBomi = await fetchAzitState(user.client);
      assert.equal(afterBomi.garden.plots[0].stage, 0);
      const bomiUpdated = afterBomi.farmers!.find((f) => f.farmerCode === 'farmer-bomi')!;
      assert.ok(bomiUpdated.totalHarvested >= 1);
    },
  },
  {
    id: 'T3-09',
    tier: 3,
    feature: 'F5',
    name: '[F5+F9] Grade 2 farmer automated harvest honors per-plot soilLevel bonus without resetting soilLevel',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 15000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 3, waterCount: 3, soilLevel: 5, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-pepper', stage: 3, waterCount: 3, soilLevel: 2, isUnlocked: 1 },
        ],
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 20);
      const lv5 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 5);
      ctx.db.backdateFarmerTick(user.userId, lv5.farmerCode, Date.now() - lv5.workIntervalMs * 3);

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.plots[0].stage, 0);
      assert.equal(state.garden.plots[1].stage, 0);
      assert.equal(state.garden.plots[0].soilLevel, 5);
      assert.equal(state.garden.plots[1].soilLevel, 2);
      assert.ok(state.garden.harvestCounts['crop-carrot'] >= 4);
      assert.ok(state.garden.harvestCounts['crop-pepper'] >= 3);

      const harvestLogs = ctx.db.queryAll<{ action_type: string }>(
        `SELECT action_type FROM azit_farmer_logs
         WHERE user_id = ? AND farmer_code = ? AND action_type = 'harvest'`,
        [user.userId, lv5.farmerCode]
      );
      assert.equal(harvestLogs.length, 2);
    },
  },
  {
    id: 'T3-10',
    tier: 3,
    feature: 'F9',
    name: '[F6+F9] Grade 3 farmer preferredCropId enforces Azit level gate and auto-plants Lv 20 seeds only',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 50000,
        crops: {
          'crop-blueberry': { seedQty: 2 },
          'crop-pumpkin': { seedQty: 2 },
        },
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 20);
      const lv10 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 10);

      const lockedRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/config', {
        farmerCode: lv10.farmerCode,
        preferredCropId: 'crop-pumpkin',
      });
      assertAzitLevelLockedError(lockedRes, 'Lv 20 preferredCropId crop-pumpkin (Lv 25)');

      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: lv10.farmerCode,
        autoEnabled: true,
        preferredCropId: 'crop-blueberry',
      });
      ctx.db.backdateFarmerTick(user.userId, lv10.farmerCode, Date.now() - lv10.workIntervalMs * 3);

      const after = await fetchAzitState(user.client);
      assert.equal(after.garden.plots[0].cropId, 'crop-blueberry');
      assert.equal(after.garden.plots[1].cropId, 'crop-blueberry');
      assert.equal(after.garden.seedCounts['crop-blueberry'], 0);
      assert.equal(after.garden.seedCounts['crop-pumpkin'], 2);

      const plantLogs = ctx.db.queryAll<{ crop_id: string | null }>(
        `SELECT crop_id FROM azit_farmer_logs
         WHERE user_id = ? AND farmer_code = ? AND action_type = 'plant'`,
        [user.userId, lv10.farmerCode]
      );
      assert.ok(plantLogs.length >= 2);
      assert.ok(plantLogs.every((l) => l.crop_id === 'crop-blueberry'));
    },
  },
  {
    id: 'T3-11',
    tier: 3,
    feature: 'F8',
    name: '[F3+F8+F9] Grade 4 auto-fertilize respects MAX_FERTILIZER_PER_CROP=4 across automated and manual calls',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 30,
        azitXp: xpForLevel(30),
        points: 150000,
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: futureMs,
            fertilizerUsedCount: 3,
            isUnlocked: 1,
          },
          {
            plotIndex: 1,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: futureMs,
            fertilizerUsedCount: 4,
            isUnlocked: 1,
          },
        ],
      });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 2,
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 30);
      const lv15 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 15);
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: lv15.farmerCode,
        autoEnabled: true,
        autoFertilize: true,
      });

      ctx.db.backdateFarmerTick(user.userId, lv15.farmerCode, Date.now() - lv15.workIntervalMs * 2);

      const after = await fetchAzitState(user.client);
      assert.equal(after.garden.plots[0].fertilizerUsedCount, 4);
      assert.ok(
        (after.garden.plots[0].nextWaterAtMs ?? Infinity) <= futureMs - 4 * 3600_000 + 2000,
        'Expected plot 0 nextWaterAtMs reduced by 4h via fert-basic'
      );
      assert.equal(after.garden.plots[1].fertilizerUsedCount, 4);
      assert.equal(after.garden.plots[1].nextWaterAtMs, futureMs);
      assert.equal(after.garden.fertilizerCounts['fert-basic'], 1);

      const fertLog = (after.farmerLogs ?? []).find(
        (l) => l.actionType === 'fertilize' && l.plotIndex === 0
      );
      assert.ok(fertLog, 'Expected fertilize log for plot 0');

      const manualOver = await user.client.post<ApiEnvelope>('/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-basic',
      });
      assertErrorStatus(manualOver, 400, 'manual fertilize on plot at cap 4');
    },
  },
  {
    id: 'T3-12',
    tier: 3,
    feature: 'F12',
    name: '[F1+F7+F12] Legacy user migration syncs Lv 11, gates Lv 20 hire, then persists hired farmer across restart',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-t3-12-');
      isoDb.initializeBaseline();
      const server1 = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });
      let email = '';
      let password = '';
      let userId = 0;

      try {
        try {
          await server1.start();
          const legacy = isoDb.seedLegacyUserFixture({
            points: 3000,
            azitLevel: 10,
            azitXp: 8500,
            gardenMigrated: 0,
            legacyMinihomeHandle: 't3_12_room',
            legacyMinihomeLayoutJson: {
              theme: 'wooden-cabin',
              furniture: [{ id: 'sofa-t3', x: 1, y: 1 }],
              garden: {
                plots: [{ plotIndex: 0, cropId: 'crop-tomato', stage: 2, waterCount: 2 }],
              },
            },
          });
          email = legacy.email;
          password = legacy.password;
          userId = legacy.userId;

          const c1 = new HttpClient(server1.baseUrl);
          const loginRes = await c1.login({ email, password });
          assert.equal(loginRes.status, 200);

          const s1 = await fetchAzitState(c1);
          assert.equal(s1.profile.azitLevel, 11);
          assert.equal(s1.garden.plots[0].cropId, 'crop-tomato');

          const hireLocked = await c1.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
            farmerCode: 'farmer-bomi',
          });
          assertAzitLevelLockedError(hireLocked, 'Lv 11 legacy user hire');

          isoDb.seedAzitProgress(userId, { azitXp: xpForLevel(20) });
          const hireOk = await postAzitAction(c1, '/api/azit-game/farmers/hire', {
            farmerCode: 'farmer-bomi',
          });
          assert.equal(hireOk.state.farmers?.length, 1);
          assert.equal(hireOk.state.profile.azitLevel, 20);
        } finally {
          await server1.stop();
        }

        const server2 = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });
        try {
          await server2.start();
          const c2 = new HttpClient(server2.baseUrl);
          const login2 = await c2.login({ email, password });
          assert.equal(login2.status, 200);

          const s2 = await fetchAzitState(c2);
          assert.equal(s2.profile.azitLevel, 20);
          assert.equal(s2.farmers?.length, 1);
          assert.equal(s2.farmers![0].farmerCode, 'farmer-bomi');

          const room = isoDb.queryOne<{ layout_json: string }>(
            'SELECT layout_json FROM user_minihomes WHERE user_id = ?',
            [userId]
          );
          const parsed = JSON.parse(room!.layout_json) as {
            furniture?: Array<{ id: string }>;
          };
          assert.equal(parsed.furniture?.[0]?.id, 'sofa-t3');
        } finally {
          await server2.stop();
        }
      } finally {
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T3-13',
    tier: 3,
    feature: 'F4',
    name: '[F4+F9+F12] Concurrent state catch-up + harvest-all + water-all + plant-all serialize cleanly without duplicates',
    run: async (ctx) => {
      const pastMs = Date.now() - 60_000;
      const plots = unlockedPlotsSeed(12);
      for (let i = 0; i <= 5; i += 1) {
        plots[i] = { plotIndex: i, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 };
      }
      for (let i = 6; i <= 9; i += 1) {
        plots[i] = {
          plotIndex: i,
          cropId: 'crop-carrot',
          stage: 1,
          waterCount: 1,
          nextWaterAtMs: pastMs,
          isUnlocked: 1,
        };
      }

      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        unlockedPlots: 12,
        points: 150000,
        crops: { 'crop-carrot': { seedQty: 4 } },
        plots,
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 35);
      const lv15 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 15);
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: lv15.farmerCode,
        autoEnabled: true,
        preferredCropId: 'crop-carrot',
      });

      ctx.db.backdateFarmerTick(user.userId, lv15.farmerCode, Date.now() - lv15.workIntervalMs * 4);

      const responses = await Promise.all([
        user.client.get<ApiEnvelope>('/api/azit-game/state'),
        user.client.post<ApiEnvelope>('/api/azit-game/garden/harvest-all', {}),
        user.client.post<ApiEnvelope>('/api/azit-game/garden/water-all', {}),
        user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', { cropId: 'crop-carrot' }),
      ]);

      for (const r of responses) {
        assert.ok(r.status < 500, `Expected no 5xx during concurrent burst, got ${r.status}: ${r.text}`);
      }

      const finalState = await fetchAzitState(user.client);
      assert.ok(finalState.garden.seedCounts['crop-carrot'] >= 0);
      assert.equal(finalState.garden.totalHarvested, 12);
      assert.equal(finalState.garden.harvestCounts['crop-carrot'], 12);
      assert.equal(
        finalState.profile.azitXp,
        xpForLevel(35) + GARDEN_HARVEST_AZIT_XP * 6
      );
    },
  },
  {
    id: 'T3-14',
    tier: 3,
    feature: 'F10',
    name: '[F3+F6+F10] Fertilizing Lv 30 crop-melon returns serverNowMs, reduced nextWaterAtMs, and matching catalog/limits',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 30,
        azitXp: xpForLevel(30),
        points: 500,
        crops: { 'crop-melon': { seedQty: 1 } },
      });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 1,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-melon',
      });
      const fertRes = await postAzitAction(user.client, '/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-basic',
      });

      const nowMs = getServerNowMs(fertRes.state);
      const plot0 = fertRes.state.garden.plots[0];
      assert.equal(plot0.fertilizerUsedCount, 1);
      assert.ok(
        typeof plot0.nextWaterAtMs === 'number' &&
          plot0.nextWaterAtMs - nowMs <= 4 * 3600_000 + 2000,
        `Expected nextWaterAtMs - serverNowMs <= 4h, got ${(plot0.nextWaterAtMs ?? 0) - nowMs}`
      );
      assert.equal(
        fertRes.state.catalog.crops.some(
          (c) => c.cropId === 'crop-melon' && c.requiredAzitLevel === 30
        ),
        true
      );
      assert.equal(
        fertRes.state.profile.limits.unlockedPlots,
        fertRes.state.garden.unlockedPlotCount
      );
    },
  },
];
