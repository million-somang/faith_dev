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
  clickAndWaitForApiResponse,
  clickButtonByText,
  fetchAzitState,
  getOrCreateMinihomeHandle,
  postAzitAction,
  queryAzitLedger,
  seedMaterials,
  unlockedPlotsSeed,
  upgradeFarmerToLevel,
  waitForTextOnPage,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { ApiEnvelope } from '../helpers/azit-helpers.js';
import type { E2ETestCase } from '../types.js';

export const tier4Tests: E2ETestCase[] = [
  {
    id: 'T4-S1',
    tier: 4,
    feature: 'F2',
    name: '[S1] New player progression Lv 1 -> Lv 50 unlocks plots 6..15 and harvests expanded plots',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        viaSignup: true,
        points: 10000,
      });

      const s0 = await fetchAzitState(user.client);
      assert.equal(s0.profile.azitLevel, 1);
      assert.equal(s0.garden.unlockedPlotCount, 6);
      assert.equal(s0.profile.limits.maxFarmers, 0);
      for (let i = 0; i < 6; i += 1) {
        assert.equal(s0.garden.plots[i].isUnlocked, true);
      }
      for (let i = 6; i < 16; i += 1) {
        assert.equal(s0.garden.plots[i].isUnlocked, false);
      }

      const lv1Unlock = await user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', {
        plotIndex: 6,
      });
      assertErrorStatus(lv1Unlock, 400, 'Lv 1 unlock-plot 6');

      const lv1Seed = await user.client.post<ApiEnvelope>('/api/azit-game/garden/buy-seed', {
        cropId: 'crop-blueberry',
        quantity: 1,
      });
      assertErrorStatus(lv1Seed, 400, 'Lv 1 buy-seed crop-blueberry');

      // Starter signup state seeds mature crop-pepper on plot 1
      assert.equal(s0.garden.plots[1].cropId, 'crop-pepper');
      assert.equal(s0.garden.plots[1].stage, 3);
      const starterHarvest = await postAzitAction(user.client, '/api/azit-game/garden/harvest', {
        plotIndex: 1,
      });
      assert.equal(starterHarvest.state.profile.azitXp, GARDEN_HARVEST_AZIT_XP);

      let expectedPoints = 10000;
      let expectedUnlocked = 6;
      for (const step of PLOT_UNLOCK_SCHEDULE) {
        ctx.db.seedAzitProgress(user.userId, { azitXp: xpForLevel(step.unlockLevel) });
        const unlockRes = await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', {
          plotIndex: step.plotIndex,
        });
        expectedPoints -= step.unlockCost;
        expectedUnlocked += 1;
        assert.equal(unlockRes.state.garden.unlockedPlotCount, expectedUnlocked);
        assert.equal(unlockRes.state.veraPoints, expectedPoints);
        assert.equal(unlockRes.state.garden.plots[step.plotIndex].isUnlocked, true);
      }

      const unlockLedger = queryAzitLedger(ctx.db, user.userId, 'plot_unlock');
      assert.equal(unlockLedger.length, 10);
      assert.deepEqual(
        unlockLedger.map((r) => r.ref_id),
        ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15']
      );

      const lv50State = await fetchAzitState(user.client);
      assert.equal(lv50State.profile.azitLevel, 50);
      assert.equal(lv50State.profile.nextLevelXp, null);
      assert.equal(lv50State.profile.progressPct, 100);
      assert.equal(lv50State.profile.limits.maxGardenPlots, 16);
      assert.equal(lv50State.profile.limits.maxFarmers, 2);

      await postAzitAction(user.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-moonfruit',
        quantity: 1,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-carrot',
        quantity: 1,
      });

      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 6,
        cropId: 'crop-carrot',
      });
      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 15,
        cropId: 'crop-moonfruit',
      });

      const pastMs = Date.now() - 60_000;
      for (const plotIdx of [6, 15]) {
        ctx.db.backdatePlotTimers(user.userId, plotIdx, { nextWaterAtMs: pastMs });
        await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: plotIdx });
        ctx.db.backdatePlotTimers(user.userId, plotIdx, { nextWaterAtMs: pastMs });
        await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: plotIdx });
      }

      await postAzitAction(user.client, '/api/azit-game/garden/harvest', { plotIndex: 6 });
      const finalState = (
        await postAzitAction(user.client, '/api/azit-game/garden/harvest', { plotIndex: 15 })
      ).state;

      assert.ok(finalState.garden.harvestCounts['crop-carrot'] >= 2);
      assert.ok(finalState.garden.harvestCounts['crop-moonfruit'] >= 2);
      assert.equal(finalState.garden.plots[6].stage, 0);
      assert.equal(finalState.garden.plots[6].isUnlocked, true);
      assert.equal(finalState.garden.plots[15].stage, 0);
      assert.equal(finalState.garden.plots[15].isUnlocked, true);
    },
  },
  {
    id: 'T4-S2',
    tier: 4,
    feature: 'F12',
    name: '[S2] Non-destructive legacy schema & minihome migration preserves state across ServerHarness restart',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-s2-');
      isoDb.initializeBaseline();
      const server1 = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });
      let email = '';
      let password = '';
      let userId = 0;

      try {
        try {
          await server1.start();
          const legacy = isoDb.seedLegacyUserFixture({
            points: 5000,
            azitLevel: 10,
            azitXp: 8500, // >= 8300 (Lv 11 threshold) so auto-sync promotes above Lv 10
            gardenMigrated: 0,
            legacyMinihomeHandle: 's2_legacy_room',
            legacyMinihomeLayoutJson: {
              theme: 'retro-oak',
              furniture: [{ id: 'desk-1', x: 2, y: 2 }],
              garden: {
                seedCounts: { 'crop-tomato': 4 },
                harvestCounts: { 'crop-strawberry': 6 },
                plots: [
                  { plotIndex: 0, cropId: 'crop-tomato', stage: 2, waterCount: 2 },
                  { plotIndex: 1, cropId: 'crop-pepper', stage: 3, waterCount: 3 },
                ],
              },
            },
          });
          email = legacy.email;
          password = legacy.password;
          userId = legacy.userId;

          const c1 = new HttpClient(server1.baseUrl);
          const login1 = await c1.login({ email, password });
          assert.equal(login1.status, 200);

          const s1 = await fetchAzitState(c1);

          const profileCols = isoDb
            .queryAll<{ name: string }>('PRAGMA table_info(azit_profiles)')
            .map((c) => c.name);
          assert.equal(profileCols.includes('unlocked_plots'), true);
          assert.equal(profileCols.includes('fertilizer_qty'), true);

          const plotCols = isoDb
            .queryAll<{ name: string }>('PRAGMA table_info(azit_garden_plots)')
            .map((c) => c.name);
          assert.equal(plotCols.includes('is_unlocked'), true);
          assert.equal(plotCols.includes('soil_level'), true);
          assert.equal(plotCols.includes('next_water_at_ms'), true);
          assert.equal(plotCols.includes('fertilizer_used_count'), true);

          assert.equal(s1.profile.azitLevel, 11);
          assert.equal(s1.profile.azitXp, 8500);
          assert.equal(s1.veraPoints, 5000);
          assert.equal(s1.garden.unlockedPlotCount, 6);
          assert.equal(s1.garden.plots[0].cropId, 'crop-tomato');
          assert.equal(s1.garden.plots[0].stage, 2);
          assert.equal(s1.garden.plots[1].cropId, 'crop-pepper');
          assert.equal(s1.garden.plots[1].stage, 3);
          assert.equal(s1.garden.seedCounts['crop-tomato'], 4);
          assert.equal(s1.garden.harvestCounts['crop-strawberry'], 6);

          const room1 = isoDb.queryOne<{ layout_json: string }>(
            'SELECT layout_json FROM user_minihomes WHERE user_id = ?',
            [userId]
          );
          const parsed1 = JSON.parse(room1!.layout_json) as {
            theme?: string;
            furniture?: Array<{ id: string }>;
          };
          assert.equal(parsed1.theme, 'retro-oak');
          assert.equal(parsed1.furniture?.[0]?.id, 'desk-1');

          // Mutate: unlock 6 (60P), unlock 7 (100P), soil plot 6 x2 (80+180=260P), fert-basic x2 (80P) -> total 500P
          await postAzitAction(c1, '/api/azit-game/garden/unlock-plot', { plotIndex: 6 });
          await postAzitAction(c1, '/api/azit-game/garden/unlock-plot', { plotIndex: 7 });
          await postAzitAction(c1, '/api/azit-game/garden/upgrade-soil', { plotIndex: 6 });
          await postAzitAction(c1, '/api/azit-game/garden/upgrade-soil', { plotIndex: 6 });
          await postAzitAction(c1, '/api/azit-game/garden/fertilizer/buy', {
            fertilizerId: 'fert-basic',
            quantity: 2,
          });
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
          assert.equal(s2.profile.azitLevel, 11);
          assert.equal(s2.veraPoints, 4500);
          assert.equal(s2.garden.unlockedPlotCount, 8);
          assert.equal(s2.garden.plots[6].soilLevel, 2);
          assert.equal(s2.garden.fertilizerCounts['fert-basic'], 2);
          assert.equal(s2.garden.plots[0].cropId, 'crop-tomato');
          assert.equal(s2.garden.plots[1].cropId, 'crop-pepper');

          const room2 = isoDb.queryOne<{ layout_json: string }>(
            'SELECT layout_json FROM user_minihomes WHERE user_id = ?',
            [userId]
          );
          const parsed2 = JSON.parse(room2!.layout_json) as {
            theme?: string;
            furniture?: Array<{ id: string }>;
          };
          assert.equal(parsed2.theme, 'retro-oak');
          assert.equal(parsed2.furniture?.[0]?.id, 'desk-1');
        } finally {
          await server2.stop();
        }
      } finally {
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T4-S3',
    tier: 4,
    feature: 'F9',
    name: '[S3] Farmer Guild lifecycle: Lv 19 gate -> Lv 20 hire -> Grades 1-4 -> full automation & logs',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        points: 30000,
      });

      const lockedHire = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
        farmerCode: 'farmer-bomi',
      });
      assertAzitLevelLockedError(lockedHire, 'S3 Lv 19 farmers/hire');

      ctx.db.seedAzitProgress(user.userId, { azitXp: xpForLevel(20) });
      const s20 = await fetchAzitState(user.client);
      assert.equal(s20.profile.azitLevel, 20);
      assert.equal(s20.profile.limits.maxFarmers, 1);

      const hiredRes = await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: 'farmer-bomi',
      });
      const g1 = hiredRes.state.farmers!.find((f) => f.farmerCode === 'farmer-bomi')!;
      assert.equal(g1.grade, 1);
      assert.deepEqual(g1.roles, ['water']);
      assert.ok(g1.workIntervalMs >= 90_000 && g1.workIntervalMs <= 120_000);

      const g2 = await upgradeFarmerToLevel(user.client, 'farmer-bomi', 5);
      assert.equal(g2.grade, 2);
      assert.deepEqual(g2.roles, ['water', 'harvest']);

      const g3 = await upgradeFarmerToLevel(user.client, 'farmer-bomi', 10);
      assert.equal(g3.grade, 3);
      assert.deepEqual(g3.roles, ['water', 'harvest', 'plant']);

      const g4 = await upgradeFarmerToLevel(user.client, 'farmer-bomi', 15);
      assert.equal(g4.grade, 4);
      assert.deepEqual(g4.roles, ['water', 'harvest', 'plant', 'fertilize']);
      assert.ok(g4.workIntervalMs >= 10_000 && g4.workIntervalMs <= 20_000);
      assert.ok(g4.waterCooldownReductionPct >= 24);

      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 1,
      });
      ctx.db.seedCropInventory(user.userId, 'crop-blueberry', { seedQty: 2 });
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: 'farmer-bomi',
        autoEnabled: true,
        autoFertilize: true,
        preferredCropId: 'crop-blueberry',
      });

      const pastMs = Date.now() - 3_600_000;
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      ctx.db.execute(
        `UPDATE azit_garden_plots
         SET crop_id = 'crop-carrot', stage = 3, water_count = 3, soil_level = 2, next_water_at_ms = NULL, fertilizer_used_count = 0
         WHERE user_id = ? AND plot_index = 0`,
        [user.userId]
      );
      ctx.db.execute(
        `UPDATE azit_garden_plots
         SET crop_id = 'crop-carrot', stage = 1, water_count = 1, soil_level = 0, next_water_at_ms = ?, fertilizer_used_count = 0
         WHERE user_id = ? AND plot_index = 1`,
        [futureMs, user.userId]
      );
      ctx.db.execute(
        `UPDATE azit_garden_plots
         SET crop_id = 'crop-carrot', stage = 1, water_count = 1, soil_level = 0, next_water_at_ms = ?, fertilizer_used_count = 0
         WHERE user_id = ? AND plot_index = 2`,
        [pastMs, user.userId]
      );
      ctx.db.execute(
        `UPDATE azit_garden_plots
         SET crop_id = NULL, stage = 0, water_count = 0, soil_level = 0, next_water_at_ms = NULL, fertilizer_used_count = 0
         WHERE user_id = ? AND plot_index = 3`,
        [user.userId]
      );

      ctx.db.backdateFarmerTick(
        user.userId,
        'farmer-bomi',
        Date.now() - g4.workIntervalMs * 6
      );

      const after = await fetchAzitState(user.client);
      assert.ok(after.garden.harvestCounts['crop-carrot'] >= 3);
      assert.equal(after.garden.plots[2].stage, 2);
      assert.ok(
        (after.garden.plots[2].nextWaterAtMs ?? Infinity) <=
          Date.now() + GARDEN_WATER_COOLDOWN_MS * (1 - g4.waterCooldownReductionPct / 100) + 15_000
      );
      assert.equal(after.garden.plots[1].fertilizerUsedCount, 1);
      assert.equal(after.garden.fertilizerCounts['fert-basic'], 0);
      assert.equal(after.garden.plots[3].cropId, 'crop-blueberry');

      const farmerAfter = after.farmers!.find((f) => f.farmerCode === 'farmer-bomi')!;
      assert.ok(farmerAfter.xp > 0 || farmerAfter.level > 15);
      assert.ok(farmerAfter.totalHarvested >= 1);
      assert.ok(farmerAfter.totalWatered >= 1);
      assert.ok(farmerAfter.totalPlanted >= 1);

      const actionTypes = new Set(
        ctx.db
          .queryAll<{ action_type: string }>(
            'SELECT action_type FROM azit_farmer_logs WHERE user_id = ?',
            [user.userId]
          )
          .map((r) => r.action_type)
      );
      for (const expectedAction of ['harvest', 'water', 'fertilize', 'plant']) {
        assert.equal(
          actionTypes.has(expectedAction),
          true,
          `Expected '${expectedAction}' in azit_farmer_logs`
        );
      }
    },
  },
  {
    id: 'T4-S4',
    tier: 4,
    feature: 'F6',
    name: '[S4] High-yield farm-to-kitchen economy pipeline with Lv 5 soil, rapid fertilizer, Lv 36 crop & ledger audit',
    run: async (ctx) => {
      const baseXp = xpForLevel(36);
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 36,
        azitXp: baseXp,
        points: 5000,
        unlockedPlots: 13,
        plots: unlockedPlotsSeed(13),
      });
      await fetchAzitState(user.client);
      seedMaterials(ctx.db, user.userId, { 'mat-wyvern-jerky': 1 });
      ctx.db.seedCropInventory(user.userId, 'crop-pumpkin', { harvestQty: 1 });

      for (let step = 0; step < 5; step += 1) {
        await postAzitAction(user.client, '/api/azit-game/garden/upgrade-soil', { plotIndex: 0 });
      }
      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-rapid',
        quantity: 2,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-ginseng',
        quantity: 1,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-ginseng',
      });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-rapid',
      });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-rapid',
      });
      const water2 = await postAzitAction(user.client, '/api/azit-game/garden/water', {
        plotIndex: 0,
      });
      assert.equal(water2.state.garden.plots[0].stage, 3);

      const harvestRes = await postAzitAction<{
        harvestedYield?: number;
        bonusYield?: number;
      }>(user.client, '/api/azit-game/garden/harvest', { plotIndex: 0 });

      const harvestedYield = harvestRes.harvestedYield ?? 0;
      const bonusYield = harvestRes.bonusYield ?? 0;
      assert.ok(harvestedYield >= 4 && harvestedYield <= 5, `Expected 4..5 ginseng, got ${harvestedYield}`);
      assert.ok(bonusYield >= 2, `Expected bonusYield >= 2, got ${bonusYield}`);
      assert.equal(harvestRes.state.profile.azitXp, baseXp + GARDEN_HARVEST_AZIT_XP);

      const startCook = await postAzitAction(user.client, '/api/azit-game/kitchen/start', {
        slotIndex: 0,
        recipeId: 'dish-ginseng-tonic',
      });
      assert.equal(startCook.state.garden.harvestCounts['crop-ginseng'], harvestedYield - 2);
      assert.equal(startCook.state.garden.harvestCounts['crop-pumpkin'], 0);
      assert.equal(startCook.state.materials['mat-wyvern-jerky'], 0);

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
      assert.equal(claimRes.state.dishes['dish-ginseng-tonic'], 1);
      assert.equal(
        claimRes.state.profile.azitXp,
        baseXp + GARDEN_HARVEST_AZIT_XP + 175
      );

      await postAzitAction(user.client, '/api/azit-game/dishes/sell', {
        recipeId: 'dish-ginseng-tonic',
        quantity: 1,
      });
      const finalSell = await postAzitAction(user.client, '/api/azit-game/crops/sell', {
        cropId: 'crop-ginseng',
        quantity: 1,
      });
      assert.equal(finalSell.state.veraPoints, 3895);

      const ledger = queryAzitLedger(ctx.db, user.userId);
      assert.deepEqual(
        ledger.map((r) => r.tx_type),
        [
          'soil_upgrade',
          'soil_upgrade',
          'soil_upgrade',
          'soil_upgrade',
          'soil_upgrade',
          'fertilizer_buy',
          'seed_buy',
          'dish_sell',
          'crop_sell',
        ]
      );
      const totalDelta = ledger.reduce((acc, row) => acc + row.delta_points, 0);
      assert.equal(totalDelta, -1105);
      assert.equal(ledger[ledger.length - 1].balance_after, 3895);
    },
  },
  {
    id: 'T4-S5',
    tier: 4,
    feature: 'F4',
    name: '[S5] Bulk garden operations under mixed plot states & concurrent bursts serialize safely',
    run: async (ctx) => {
      const pastMs = Date.now() - 60_000;
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const plots = unlockedPlotsSeed(12);

      // 0, 1, 2: empty
      // 3, 4: stage 1 waterable
      plots[3] = { plotIndex: 3, isUnlocked: 1, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs };
      plots[4] = { plotIndex: 4, isUnlocked: 1, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs };
      // 5, 6: stage 2 cooldown
      plots[5] = { plotIndex: 5, isUnlocked: 1, cropId: 'crop-carrot', stage: 2, waterCount: 2, nextWaterAtMs: futureMs };
      plots[6] = { plotIndex: 6, isUnlocked: 1, cropId: 'crop-carrot', stage: 2, waterCount: 2, nextWaterAtMs: futureMs };
      // 7, 8: stage 2 waterable -> mature
      plots[7] = { plotIndex: 7, isUnlocked: 1, cropId: 'crop-carrot', stage: 2, waterCount: 2, nextWaterAtMs: pastMs };
      plots[8] = { plotIndex: 8, isUnlocked: 1, cropId: 'crop-carrot', stage: 2, waterCount: 2, nextWaterAtMs: pastMs };
      // 9, 10, 11: stage 3 mature (plot 11 soilLevel 2)
      plots[9] = { plotIndex: 9, isUnlocked: 1, cropId: 'crop-carrot', stage: 3, waterCount: 3 };
      plots[10] = { plotIndex: 10, isUnlocked: 1, cropId: 'crop-carrot', stage: 3, waterCount: 3 };
      plots[11] = { plotIndex: 11, isUnlocked: 1, soilLevel: 2, cropId: 'crop-carrot', stage: 3, waterCount: 3 };

      const baseXp = xpForLevel(30);
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 30,
        azitXp: baseXp,
        unlockedPlots: 12,
        crops: { 'crop-carrot': { seedQty: 3 } },
        plots,
      });

      // 1) 4 concurrent plant-all
      const plantBursts = await Promise.all(
        Array.from({ length: 4 }, () =>
          user.client.post<
            ApiEnvelope<{
              plantedCount?: number;
              plantedPlotIndices?: number[];
              state: import('../helpers/azit-helpers.js').AzitStatePayload;
            }>
          >('/api/azit-game/garden/plant-all', { cropId: 'crop-carrot' })
        )
      );
      const plantOk = plantBursts.filter((r) => r.status === 200);
      const plantErr = plantBursts.filter((r) => r.status === 400);
      assert.equal(plantOk.length, 1);
      assert.equal(plantErr.length, 3);
      assert.equal(plantOk[0].json?.data?.plantedCount, 3);
      assert.deepEqual(plantOk[0].json?.data?.plantedPlotIndices, [0, 1, 2]);
      assert.equal(plantOk[0].json?.data?.state.garden.seedCounts['crop-carrot'], 0);

      // 2) 4 concurrent water-all
      const waterBursts = await Promise.all(
        Array.from({ length: 4 }, () =>
          user.client.post<
            ApiEnvelope<{
              wateredCount?: number;
              wateredPlotIndices?: number[];
              maturedCount?: number;
              state: import('../helpers/azit-helpers.js').AzitStatePayload;
            }>
          >('/api/azit-game/garden/water-all', {})
        )
      );
      const waterOk = waterBursts.filter((r) => r.status === 200);
      const waterErr = waterBursts.filter((r) => r.status === 400);
      assert.equal(waterOk.length, 1);
      assert.equal(waterErr.length, 3);
      assert.equal(waterOk[0].json?.data?.wateredCount, 4);
      assert.deepEqual(waterOk[0].json?.data?.wateredPlotIndices, [3, 4, 7, 8]);
      assert.equal(waterOk[0].json?.data?.maturedCount, 2);

      // 3) 4 concurrent harvest-all
      const harvestBursts = await Promise.all(
        Array.from({ length: 4 }, () =>
          user.client.post<
            ApiEnvelope<{
              harvestedPlots?: number;
              totalYield?: number;
              totalBonusYield?: number;
              xpGained?: number;
              state: import('../helpers/azit-helpers.js').AzitStatePayload;
            }>
          >('/api/azit-game/garden/harvest-all', {})
        )
      );
      const harvestOk = harvestBursts.filter((r) => r.status === 200);
      const harvestErr = harvestBursts.filter((r) => r.status === 400);
      assert.equal(harvestOk.length, 1);
      assert.equal(harvestErr.length, 3);
      assert.equal(harvestOk[0].json?.data?.harvestedPlots, 5);
      assert.equal(harvestOk[0].json?.data?.totalYield, 11);
      assert.equal(harvestOk[0].json?.data?.totalBonusYield, 1);
      assert.equal(harvestOk[0].json?.data?.xpGained, 40);

      const finalState = await fetchAzitState(user.client);
      assert.equal(finalState.garden.harvestCounts['crop-carrot'], 11);
      assert.equal(finalState.profile.azitXp, baseXp + 40);
      for (let i = 7; i <= 11; i += 1) {
        assert.equal(finalState.garden.plots[i].stage, 0);
      }
      assert.equal(finalState.garden.plots[11].soilLevel, 2);
      assert.equal(finalState.garden.plots[3].stage, 2);
      assert.equal(finalState.garden.plots[4].stage, 2);
      assert.equal(finalState.garden.plots[5].stage, 2);
      assert.equal(finalState.garden.plots[6].stage, 2);
      assert.equal(finalState.garden.plots[0].stage, 1);
      assert.equal(finalState.garden.plots[1].stage, 1);
      assert.equal(finalState.garden.plots[2].stage, 1);
    },
  },
  {
    id: 'T4-S6',
    tier: 4,
    feature: 'F11',
    name: '[S6] End-to-end UI & API parity on /mypage and /minihome/<handle> with PortalNavbar width parity',
    run: async (ctx) => {
      const ui = await ctx.getUiSession();

      // 1. Lv 19 Locked Gate
      const lv19 = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        points: 5000,
      });

      await ui.withPage(
        { sessionCookie: lv19.cookie, viewport: { width: 1280, height: 800 } },
        async (page, telemetry) => {
          await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
            waitUntil: 'networkidle0',
            timeout: 25000,
          });
          await waitForTextOnPage(page, 'Lv.19');

          const lockedUi = await page.evaluate(() => {
            const text = document.body.innerText;
            const html = document.body.innerHTML;
            return {
              hasLockedPlots: text.includes('🔒') || html.includes('🔒') || text.includes('잠금'),
              hasLockedFarmer:
                text.includes('농부') && (text.includes('Lv.20') || text.includes('🔒')),
            };
          });
          assert.equal(lockedUi.hasLockedPlots, true, 'Expected locked plot badges at Lv 19');
          assert.equal(lockedUi.hasLockedFarmer, true, 'Expected locked farmer badge at Lv 19');

          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find((b) =>
              (b.innerText || '').includes('농부')
            );
            if (btn && !btn.disabled) btn.click();
          });
          await page.waitForFunction(
            () => {
              const hireBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
                (b.innerText || '').includes('고용')
              );
              return (
                hireBtns.length === 0 ||
                hireBtns.every(
                  (b) => b.disabled || (b.innerText || '').includes('Lv.20')
                )
              );
            },
            { timeout: 5000 }
          );

          assert.deepEqual(telemetry.pageErrors, []);
          assert.deepEqual(telemetry.sameOriginConsoleErrors, []);
          assert.deepEqual(telemetry.sameOrigin5xx, []);
        }
      );

      // 2. Lv 25 Live Parity & Reload Persistence
      const pastMs = Date.now() - 60_000;
      const lv25 = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 10000,
        crops: { 'crop-carrot': { seedQty: 6 } },
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
        ],
      });

      await ui.withPage(
        { sessionCookie: lv25.cookie, viewport: { width: 1280, height: 800 } },
        async (page, telemetry) => {
          await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
            waitUntil: 'networkidle0',
            timeout: 25000,
          });
          await waitForTextOnPage(page, 'Lv.25');
          await waitForTextOnPage(page, '6/16');

          // Unlock plot 6
          let unlockFired = false;
          const unlockPromise = page
            .waitForResponse(
              (res) =>
                res.url().includes('/api/azit-game/garden/unlock-plot') &&
                res.request().method() === 'POST',
              { timeout: 10000 }
            )
            .then((res) => {
              unlockFired = true;
              return res;
            });
          unlockPromise.catch(() => undefined);

          const unlockClicked = await page.evaluate(() => {
            const candidates = Array.from(document.querySelectorAll('button, [role="button"], g'));
            const el = candidates.find((c) => {
              const t = (c.textContent || '').trim();
              return t.includes('해금') || t.includes('확장') || t.includes('60P');
            });
            if (!el) return false;
            (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return true;
          });
          assert.equal(unlockClicked, true, 'Expected plot 6 unlock control in Lv 25 UI');

          if (!unlockFired) {
            try {
              await page.waitForFunction(
                () =>
                  Array.from(document.querySelectorAll('button')).some(
                    (b) => !b.disabled && (b.innerText || '').includes('해금')
                  ),
                { timeout: 1500 }
              );
              if (!unlockFired) await clickButtonByText(page, '해금');
            } catch {
              // Ignore if already triggered
            }
          }
          const unlockRes = await unlockPromise;
          assert.equal(unlockRes.status(), 200);
          await page.waitForFunction(() => /7\s*\/\s*16/.test(document.body.innerText), {
            timeout: 10000,
          });

          const plot6Row = ctx.db.queryOne<{ is_unlocked: number }>(
            'SELECT is_unlocked FROM azit_garden_plots WHERE user_id = ? AND plot_index = 6',
            [lv25.userId]
          );
          assert.equal(plot6Row?.is_unlocked, 1);

          // Open Farmer modal & hire farmer
          const openedFarmerModal = await clickButtonByText(page, '농부');
          assert.equal(openedFarmerModal, true, 'Expected 농부 button in AzitLevelHeaderBadge');
          await waitForTextOnPage(page, '고용');
          await clickAndWaitForApiResponse(page, '/api/azit-game/farmers/hire', () =>
            clickButtonByText(page, '고용')
          );
          await waitForTextOnPage(page, '1/1');

          const farmerRows = ctx.db.queryAll(
            'SELECT farmer_code FROM azit_farmers WHERE user_id = ? AND is_deleted = 0',
            [lv25.userId]
          );
          assert.equal(farmerRows.length, 1);

          // Close Farmer Guild modal and verify closure before bulk toolbar actions
          const closedFarmerModal = await page.evaluate(() => {
            const modal = document.querySelector('div.fixed.inset-0.z-50');
            if (!modal) return false;
            const closeBtn = Array.from(modal.querySelectorAll('button')).find(
              (b) => (b.innerText || b.textContent || '').trim() === '×'
            );
            if (!closeBtn) return false;
            closeBtn.click();
            return true;
          });
          assert.equal(closedFarmerModal, true, 'Expected close button in Farmer Guild modal');
          await page.waitForFunction(
            () =>
              !document.querySelector('div.fixed.inset-0.z-50') &&
              !document.body.innerText.includes('아지트 농부 길드'),
            { timeout: 5000 }
          );

          // Bulk toolbar actions
          await clickAndWaitForApiResponse(page, '/api/azit-game/garden/water-all', () =>
            clickButtonByText(page, '전체 물주기')
          );
          await clickAndWaitForApiResponse(page, '/api/azit-game/garden/harvest-all', () =>
            clickButtonByText(page, '일괄 수확')
          );

          let plantFired = false;
          const plantPromise = page
            .waitForResponse(
              (res) =>
                res.url().includes('/api/azit-game/garden/plant-all') &&
                res.request().method() === 'POST',
              { timeout: 10000 }
            )
            .then((res) => {
              plantFired = true;
              return res;
            });
          plantPromise.catch(() => undefined);

          const clickedPlantAll = await clickButtonByText(page, '일괄 심기');
          assert.equal(clickedPlantAll, true, 'Expected 일괄 심기 button');
          if (!plantFired) {
            try {
              await page.waitForFunction(
                () =>
                  Array.from(document.querySelectorAll('button')).some(
                    (b) => !b.disabled && (b.innerText || '').includes('당근')
                  ),
                { timeout: 1500 }
              );
              if (!plantFired) await clickButtonByText(page, '당근');
            } catch {
              // Direct plant-all without popover
            }
          }
          const plantRes = await plantPromise;
          assert.equal(plantRes.status(), 200);

          // Reload persistence parity
          await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
          await waitForTextOnPage(page, 'Lv.25');
          await waitForTextOnPage(page, '1/1');
          await waitForTextOnPage(page, '7/16');

          const plot0 = ctx.db.queryOne<{ stage: number }>(
            'SELECT stage FROM azit_garden_plots WHERE user_id = ? AND plot_index = 0',
            [lv25.userId]
          );
          const plot1 = ctx.db.queryOne<{ stage: number }>(
            'SELECT stage FROM azit_garden_plots WHERE user_id = ? AND plot_index = 1',
            [lv25.userId]
          );
          const carrotInv = ctx.db.queryOne<{ harvest_qty: number }>(
            'SELECT harvest_qty FROM azit_crop_inventory WHERE user_id = ? AND crop_id = ?',
            [lv25.userId, 'crop-carrot']
          );
          assert.equal(plot0?.stage, 2);
          assert.equal(plot1?.stage, 1);
          assert.ok((carrotInv?.harvest_qty ?? 0) >= 2);

          assert.deepEqual(telemetry.pageErrors, []);
          assert.deepEqual(telemetry.sameOriginConsoleErrors, []);
          assert.deepEqual(telemetry.sameOrigin5xx, []);
        }
      );

      // 3. /minihome/<handle> & PortalNavbar width parity across desktop & mobile
      const handle = await getOrCreateMinihomeHandle(lv25.client);
      for (const viewport of [
        { width: 1280, height: 800 },
        { width: 390, height: 844 },
      ]) {
        for (const route of ['/mypage', `/minihome/${encodeURIComponent(handle)}`]) {
          await ui.withPage({ sessionCookie: lv25.cookie, viewport }, async (page, telemetry) => {
            await page.goto(`${ui.nextBaseUrl}${route}`, {
              waitUntil: 'networkidle0',
              timeout: 25000,
            });
            await page.waitForSelector('header > div.max-w-6xl', { timeout: 10000 });

            const metrics = await page.evaluate(() => {
              const nav = document.querySelector('header > div.max-w-6xl');
              const pageContainer = document.querySelector(
                'main > div.max-w-6xl, div.flex-1.max-w-6xl'
              );
              if (!nav || !pageContainer) return { found: false as const };
              const navRect = nav.getBoundingClientRect();
              const pageRect = pageContainer.getBoundingClientRect();
              return {
                found: true as const,
                navLeft: navRect.left,
                navWidth: navRect.width,
                pageLeft: pageRect.left,
                pageWidth: pageRect.width,
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                pageClass: pageContainer.className,
              };
            });

            assert.equal(metrics.found, true, `Missing container on ${route} (${viewport.width}px)`);
            if (metrics.found) {
              assert.ok(
                Math.abs(metrics.navLeft - metrics.pageLeft) <= 1.5,
                `${route} (${viewport.width}px): navLeft=${metrics.navLeft} vs pageLeft=${metrics.pageLeft}`
              );
              assert.ok(
                Math.abs(metrics.navWidth - metrics.pageWidth) <= 1.5,
                `${route} (${viewport.width}px): navWidth=${metrics.navWidth} vs pageWidth=${metrics.pageWidth}`
              );
              assert.ok(
                metrics.scrollWidth <= metrics.innerWidth,
                `${route} (${viewport.width}px): scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`
              );
              assert.equal(metrics.pageClass.includes('px-3'), true);
              assert.equal(metrics.pageClass.includes('sm:px-4'), true);
            }
            assert.deepEqual(telemetry.pageErrors, []);
            assert.deepEqual(telemetry.sameOriginConsoleErrors, []);
            assert.deepEqual(telemetry.sameOrigin5xx, []);
          });
        }
      }
    },
  },
];
