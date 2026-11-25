import assert from 'node:assert/strict';
import {
  AZIT_LEVEL_XP,
  FERTILIZER_SCHEDULE,
  GARDEN_HARVEST_AZIT_XP,
  GARDEN_WATER_COOLDOWN_MS,
  HIGH_LEVEL_CROPS,
  HIGH_LEVEL_RECIPES,
  PLOT_UNLOCK_SCHEDULE,
  SOIL_LEVEL_SCHEDULE,
  STARTER_CROP_IDS,
  fetchAzitState,
  postAzitAction,
  seedMaterials,
  unlockedPlotsSeed,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { E2ETestCase } from '../types.js';

export const tier1GardenTests: E2ETestCase[] = [
  // ==================== F1: Azit Lv 50 Level Table & Sync (5) ====================
  {
    id: 'T1-F1-01',
    tier: 1,
    feature: 'F1',
    name: 'catalog.levels exposes full Lv 1..50 schedule while preserving Lv 1..10 XP thresholds',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({ points: 100 });
      const state = await fetchAzitState(user.client);

      assert.equal(state.catalog.levels.length, 50, 'Expected 50 level steps in catalog.levels');
      for (let lv = 1; lv <= 50; lv += 1) {
        const step = state.catalog.levels.find((s) => s.level === lv);
        assert.ok(step, `Missing level ${lv} in catalog.levels`);
        assert.equal(
          step.requiredXp,
          AZIT_LEVEL_XP[lv],
          `Mismatch in requiredXp for level ${lv}`
        );
        assert.ok(step.title.length > 0, `Expected non-empty title for level ${lv}`);
      }
    },
  },
  {
    id: 'T1-F1-02',
    tier: 1,
    feature: 'F1',
    name: 'profile.limits scales maxGardenPlots (6..16) and maxFarmers (0/1/2) across Lv 1..50 milestones',
    run: async (ctx) => {
      const milestones: Array<{ level: number; maxPlots: number; maxFarmers: number }> = [
        { level: 1, maxPlots: 6, maxFarmers: 0 },
        { level: 5, maxPlots: 7, maxFarmers: 0 },
        { level: 10, maxPlots: 8, maxFarmers: 0 },
        { level: 15, maxPlots: 9, maxFarmers: 0 },
        { level: 20, maxPlots: 10, maxFarmers: 1 },
        { level: 25, maxPlots: 11, maxFarmers: 1 },
        { level: 30, maxPlots: 12, maxFarmers: 1 },
        { level: 35, maxPlots: 13, maxFarmers: 2 },
        { level: 40, maxPlots: 14, maxFarmers: 2 },
        { level: 45, maxPlots: 15, maxFarmers: 2 },
        { level: 50, maxPlots: 16, maxFarmers: 2 },
      ];

      for (const m of milestones) {
        const user = await ctx.createAuthenticatedUser({
          azitLevel: m.level,
          azitXp: xpForLevel(m.level),
        });
        const state = await fetchAzitState(user.client);
        assert.equal(state.profile.azitLevel, m.level, `Expected azitLevel=${m.level}`);
        assert.equal(
          state.profile.limits.maxGardenPlots,
          m.maxPlots,
          `Lv ${m.level}: expected maxGardenPlots=${m.maxPlots}`
        );
        assert.equal(
          state.profile.limits.maxFarmers,
          m.maxFarmers,
          `Lv ${m.level}: expected maxFarmers=${m.maxFarmers}`
        );
      }
    },
  },
  {
    id: 'T1-F1-03',
    tier: 1,
    feature: 'F1',
    name: 'Existing user with azit_level=10 and azit_xp=8300 (>6200) auto-syncs to Lv 11 on GET /state',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 10,
        azitXp: 8300,
      });

      const state = await fetchAzitState(user.client);
      assert.equal(state.profile.azitLevel, 11, 'Expected auto-sync from Lv 10 to Lv 11 for 8300 XP');
      assert.equal(state.profile.azitXp, 8300);
      assert.equal(state.profile.nextLevelXp, AZIT_LEVEL_XP[12]);

      const dbRow = ctx.db.queryOne<{ azit_level: number; azit_xp: number }>(
        'SELECT azit_level, azit_xp FROM azit_profiles WHERE user_id = ?',
        [user.userId]
      );
      assert.equal(dbRow?.azit_level, 11, 'Expected azit_profiles.azit_level persisted as 11');
      assert.equal(dbRow?.azit_xp, 8300);
    },
  },
  {
    id: 'T1-F1-04',
    tier: 1,
    feature: 'F1',
    name: 'Lv 50 user reaches level cap with nextLevelXp=null, progressPct=100, and maxGardenPlots=16',
    run: async (ctx) => {
      const lv50Xp = xpForLevel(50);
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: lv50Xp,
      });
      const state = await fetchAzitState(user.client);

      assert.equal(state.profile.azitLevel, 50);
      assert.equal(state.profile.azitXp, lv50Xp);
      assert.equal(state.profile.nextLevelXp, null);
      assert.equal(state.profile.progressPct, 100);
      assert.equal(state.profile.limits.maxGardenPlots, 16);
      assert.equal(state.profile.limits.maxFarmers, 2);
      assert.ok(state.profile.title.length > 0);
    },
  },
  {
    id: 'T1-F1-05',
    tier: 1,
    feature: 'F1',
    name: 'Harvesting mature crop grants +8 Azit XP and triggers level-up across threshold',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 1,
        azitXp: 74,
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

      const res = await postAzitAction(user.client, '/api/azit-game/garden/harvest', {
        plotIndex: 0,
      });

      assert.equal(res.state.profile.azitXp, 74 + GARDEN_HARVEST_AZIT_XP);
      assert.equal(res.state.profile.azitLevel, 2, 'Expected 82 XP to trigger level-up to Lv 2');
    },
  },

  // ==================== F2: Level-Scaled Garden Plot Expansion (5) ====================
  {
    id: 'T1-F2-01',
    tier: 1,
    feature: 'F2',
    name: 'New user starts with plots 0..5 unlocked, plots 6..15 locked, and full 16-slot plotUnlocks catalog',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser();
      const state = await fetchAzitState(user.client);

      assert.equal(state.garden.plots.length, 16);
      assert.equal(state.garden.unlockedPlotCount, 6);
      assert.equal(state.garden.maxPlotCount, 16);
      assert.equal(state.catalog.plotUnlocks.length, 16);

      for (const plot of state.garden.plots) {
        if (plot.plotIndex < 6) {
          assert.equal(plot.isUnlocked, true, `Plot ${plot.plotIndex} should start unlocked`);
          assert.equal(plot.unlockLevel, 1);
          assert.equal(plot.unlockCost, 0);
        } else {
          assert.equal(plot.isUnlocked, false, `Plot ${plot.plotIndex} should start locked`);
          const expected = PLOT_UNLOCK_SCHEDULE.find((p) => p.plotIndex === plot.plotIndex)!;
          assert.equal(plot.unlockLevel, expected.unlockLevel);
          assert.equal(plot.unlockCost, expected.unlockCost);
        }
      }
    },
  },
  {
    id: 'T1-F2-02',
    tier: 1,
    feature: 'F2',
    name: 'Lv 5 user unlocks plot 6 via POST /garden/unlock-plot, deducting 60P and recording ledger',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        points: 500,
      });

      const res = await postAzitAction<{ plotIndex?: number }>(
        user.client,
        '/api/azit-game/garden/unlock-plot',
        { plotIndex: 6 }
      );

      assert.equal(res.plotIndex, 6);
      assert.equal(res.state.veraPoints, 500 - 60);
      assert.equal(res.state.garden.unlockedPlotCount, 7);
      assert.equal(res.state.profile.limits.unlockedPlots, 7);
      assert.equal(res.state.garden.plots[6].isUnlocked, true);
      assert.equal(res.state.garden.plots[7].isUnlocked, false);

      const ledgerEntry = res.state.recentLedger.find((l) => l.txType === 'plot_unlock');
      assert.ok(ledgerEntry, 'Expected plot_unlock entry in recentLedger');
      assert.equal(ledgerEntry.deltaPoints, -60);
      assert.equal(ledgerEntry.balanceAfter, 440);
    },
  },
  {
    id: 'T1-F2-03',
    tier: 1,
    feature: 'F2',
    name: 'Lv 50 user unlocks final plot 15 (1000P) and unlock state persists across GET /state',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 2000,
      });

      const res = await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', {
        plotIndex: 15,
      });
      assert.equal(res.state.veraPoints, 1000);
      assert.equal(res.state.garden.plots[15].isUnlocked, true);
      assert.equal(res.state.garden.unlockedPlotCount, 7);

      const reloaded = await fetchAzitState(user.client);
      assert.equal(reloaded.garden.plots[15].isUnlocked, true);
      assert.equal(reloaded.veraPoints, 1000);
    },
  },
  {
    id: 'T1-F2-04',
    tier: 1,
    feature: 'F2',
    name: 'Planting, watering (x2), and harvesting succeed end-to-end on newly unlocked plots 6 and 15',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 3000,
        crops: { 'crop-carrot': { seedQty: 4, harvestQty: 0 } },
      });

      await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 6 });
      await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 15 });

      for (const idx of [6, 15]) {
        const planted = await postAzitAction(user.client, '/api/azit-game/garden/plant', {
          plotIndex: idx,
          cropId: 'crop-carrot',
        });
        assert.equal(planted.state.garden.plots[idx].cropId, 'crop-carrot');
        assert.equal(planted.state.garden.plots[idx].stage, 1);

        ctx.db.backdatePlotTimers(user.userId, idx, { nextWaterAtMs: Date.now() - 60_000 });
        const w1 = await postAzitAction(user.client, '/api/azit-game/garden/water', {
          plotIndex: idx,
        });
        assert.equal(w1.state.garden.plots[idx].stage, 2);

        ctx.db.backdatePlotTimers(user.userId, idx, { nextWaterAtMs: Date.now() - 60_000 });
        const w2 = await postAzitAction(user.client, '/api/azit-game/garden/water', {
          plotIndex: idx,
        });
        assert.equal(w2.state.garden.plots[idx].stage, 3);

        const harvested = await postAzitAction(user.client, '/api/azit-game/garden/harvest', {
          plotIndex: idx,
        });
        assert.equal(harvested.state.garden.plots[idx].stage, 0);
        assert.equal(harvested.state.garden.plots[idx].cropId, null);
      }

      const finalState = await fetchAzitState(user.client);
      assert.equal(finalState.garden.harvestCounts['crop-carrot'], 4);
      assert.equal(finalState.profile.azitXp, xpForLevel(50) + GARDEN_HARVEST_AZIT_XP * 2);
    },
  },
  {
    id: 'T1-F2-05',
    tier: 1,
    feature: 'F2',
    name: 'Clearing an expanded unlocked plot resets crop while preserving unlocked status',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        points: 500,
        crops: { 'crop-carrot': { seedQty: 2 } },
      });
      await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 6 });
      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 6,
        cropId: 'crop-carrot',
      });

      const cleared = await postAzitAction(user.client, '/api/azit-game/garden/clear', {
        plotIndex: 6,
      });
      assert.equal(cleared.state.garden.plots[6].isUnlocked, true);
      assert.equal(cleared.state.garden.plots[6].cropId, null);
      assert.equal(cleared.state.garden.plots[6].stage, 0);
      assert.equal(cleared.state.garden.plots[6].waterCount, 0);
    },
  },

  // ==================== F3: Consumable Fertilizer System (5) ====================
  {
    id: 'T1-F3-01',
    tier: 1,
    feature: 'F3',
    name: 'catalog.fertilizers exposes fert-basic (40P, -4h) and fert-rapid (75P, -8h)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser();
      const state = await fetchAzitState(user.client);

      assert.equal(state.catalog.fertilizers.length, 2);
      const basic = state.catalog.fertilizers.find((f) => f.fertilizerId === 'fert-basic');
      const rapid = state.catalog.fertilizers.find((f) => f.fertilizerId === 'fert-rapid');
      assert.ok(basic);
      assert.ok(rapid);
      assert.equal(basic.price, FERTILIZER_SCHEDULE['fert-basic'].price);
      assert.equal(basic.reductionMs, FERTILIZER_SCHEDULE['fert-basic'].reductionMs);
      assert.equal(rapid.price, FERTILIZER_SCHEDULE['fert-rapid'].price);
      assert.equal(rapid.reductionMs, FERTILIZER_SCHEDULE['fert-rapid'].reductionMs);
    },
  },
  {
    id: 'T1-F3-02',
    tier: 1,
    feature: 'F3',
    name: 'Buying fertilizers deducts points, updates fertilizerCounts & SQLite, and logs fertilizer_buy',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({ points: 500 });

      const buyRes = await postAzitAction<{ fertilizerId?: string; quantity?: number }>(
        user.client,
        '/api/azit-game/garden/fertilizer/buy',
        { fertilizerId: 'fert-basic', quantity: 3 }
      );

      assert.equal(buyRes.fertilizerId, 'fert-basic');
      assert.equal(buyRes.quantity, 3);
      assert.equal(buyRes.state.veraPoints, 500 - 120);
      assert.equal(buyRes.state.garden.fertilizerCounts['fert-basic'], 3);
      assert.equal(buyRes.state.garden.fertilizerCounts['fert-rapid'], 0);

      const ledger = buyRes.state.recentLedger.find((l) => l.txType === 'fertilizer_buy');
      assert.ok(ledger, 'Expected fertilizer_buy ledger entry');
      assert.equal(ledger.deltaPoints, -120);
      assert.equal(ledger.balanceAfter, 380);
    },
  },
  {
    id: 'T1-F3-03',
    tier: 1,
    feature: 'F3',
    name: 'POST /garden/fertilizer/buy with empty body defaults to fert-basic quantity=1',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({ points: 100 });
      const res = await postAzitAction<{ fertilizerId?: string; quantity?: number }>(
        user.client,
        '/api/azit-game/garden/fertilizer/buy',
        {}
      );
      assert.equal(res.fertilizerId, 'fert-basic');
      assert.equal(res.quantity, 1);
      assert.equal(res.state.veraPoints, 60);
      assert.equal(res.state.garden.fertilizerCounts['fert-basic'], 1);
    },
  },
  {
    id: 'T1-F3-04',
    tier: 1,
    feature: 'F3',
    name: 'Applying fert-basic reduces plot nextWaterAtMs by 4 hours and increments fertilizerUsedCount',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        points: 300,
        crops: { 'crop-carrot': { seedQty: 1 } },
      });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 2,
      });
      const planted = await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-carrot',
      });
      const beforeNextWater = planted.state.garden.plots[0].nextWaterAtMs!;
      assert.ok(beforeNextWater > Date.now());

      const fertRes = await postAzitAction<{
        nextWaterAtMs?: number;
        canWaterNow?: boolean;
        fertilizerUsedCount?: number;
      }>(user.client, '/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-basic',
      });

      const afterNextWater = fertRes.state.garden.plots[0].nextWaterAtMs!;
      const delta = beforeNextWater - afterNextWater;
      assert.equal(
        delta,
        FERTILIZER_SCHEDULE['fert-basic'].reductionMs,
        `Expected 4h reduction (${FERTILIZER_SCHEDULE['fert-basic'].reductionMs}ms), got ${delta}ms`
      );
      assert.equal(fertRes.fertilizerUsedCount, 1);
      assert.equal(fertRes.state.garden.plots[0].fertilizerUsedCount, 1);
      assert.equal(fertRes.state.garden.fertilizerCounts['fert-basic'], 1);
      assert.equal(fertRes.canWaterNow, false);
    },
  },
  {
    id: 'T1-F3-05',
    tier: 1,
    feature: 'F3',
    name: 'Applying fert-rapid (-8h) clamps nextWaterAtMs to nowMs and enables immediate watering',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        points: 300,
        crops: { 'crop-carrot': { seedQty: 1 } },
      });

      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-rapid',
        quantity: 1,
      });
      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-carrot',
      });

      const fertRes = await postAzitAction<{ canWaterNow?: boolean; nextWaterAtMs?: number }>(
        user.client,
        '/api/azit-game/garden/fertilize',
        { plotIndex: 0, fertilizerId: 'fert-rapid' }
      );
      assert.equal(fertRes.canWaterNow, true);
      assert.ok((fertRes.nextWaterAtMs ?? Infinity) <= Date.now() + 2000);

      const waterRes = await postAzitAction(user.client, '/api/azit-game/garden/water', {
        plotIndex: 0,
      });
      assert.equal(waterRes.state.garden.plots[0].stage, 2);
      assert.equal(waterRes.state.garden.plots[0].waterCount, 2);
    },
  },

  // ==================== F4: Bulk Convenience Actions (5) ====================
  {
    id: 'T1-F4-01',
    tier: 1,
    feature: 'F4',
    name: 'POST /garden/plant-all fills all empty unlocked plots when seedQty >= empty plots',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        crops: { 'crop-carrot': { seedQty: 10 } },
      });

      const res = await postAzitAction<{
        plantedCount?: number;
        plantedPlotIndices?: number[];
      }>(user.client, '/api/azit-game/garden/plant-all', { cropId: 'crop-carrot' });

      assert.equal(res.plantedCount, 6);
      assert.deepEqual(res.plantedPlotIndices, [0, 1, 2, 3, 4, 5]);
      assert.equal(res.state.garden.seedCounts['crop-carrot'], 4);
      for (let i = 0; i < 6; i += 1) {
        assert.equal(res.state.garden.plots[i].cropId, 'crop-carrot');
        assert.equal(res.state.garden.plots[i].stage, 1);
      }
      for (let i = 6; i < 16; i += 1) {
        assert.equal(res.state.garden.plots[i].cropId, null);
      }
    },
  },
  {
    id: 'T1-F4-02',
    tier: 1,
    feature: 'F4',
    name: 'POST /garden/plant-all with partial seeds (3 seeds across 6 plots) plants ascending plots 0..2',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        crops: { 'crop-carrot': { seedQty: 3 } },
      });

      const res = await postAzitAction<{
        plantedCount?: number;
        plantedPlotIndices?: number[];
      }>(user.client, '/api/azit-game/garden/plant-all', { cropId: 'crop-carrot' });

      assert.equal(res.plantedCount, 3);
      assert.deepEqual(res.plantedPlotIndices, [0, 1, 2]);
      assert.equal(res.state.garden.seedCounts['crop-carrot'], 0);
      assert.equal(res.state.garden.plots[2].stage, 1);
      assert.equal(res.state.garden.plots[3].stage, 0);
      assert.equal(res.state.garden.plots[3].cropId, null);
    },
  },
  {
    id: 'T1-F4-03',
    tier: 1,
    feature: 'F4',
    name: 'POST /garden/water-all waters only cooldown-ready plots and skips plots still in cooldown',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const pastMs = Date.now() - 60_000;
      const user = await ctx.createAuthenticatedUser({
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-pepper', stage: 2, waterCount: 2, nextWaterAtMs: pastMs, isUnlocked: 1 },
          { plotIndex: 2, cropId: 'crop-tomato', stage: 1, waterCount: 1, nextWaterAtMs: futureMs, isUnlocked: 1 },
          { plotIndex: 3, cropId: 'crop-lettuce', stage: 3, waterCount: 3, isUnlocked: 1 },
        ],
      });

      const res = await postAzitAction<{
        wateredCount?: number;
        wateredPlotIndices?: number[];
        maturedCount?: number;
      }>(user.client, '/api/azit-game/garden/water-all', {});

      assert.equal(res.wateredCount, 2);
      assert.deepEqual(res.wateredPlotIndices, [0, 1]);
      assert.equal(res.maturedCount, 1);
      assert.equal(res.state.garden.plots[0].stage, 2);
      assert.equal(res.state.garden.plots[1].stage, 3);
      assert.equal(res.state.garden.plots[2].stage, 1, 'Plot 2 in cooldown should remain stage 1');
      assert.equal(res.state.garden.plots[3].stage, 3);
    },
  },
  {
    id: 'T1-F4-04',
    tier: 1,
    feature: 'F4',
    name: 'POST /garden/harvest-all harvests all stage-3 plots, awards 8*N Azit XP, and leaves growing plots',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 1,
        azitXp: 0,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-pepper', stage: 3, waterCount: 3, isUnlocked: 1 },
          { plotIndex: 2, cropId: 'crop-tomato', stage: 3, waterCount: 3, isUnlocked: 1 },
          { plotIndex: 3, cropId: 'crop-lettuce', stage: 2, waterCount: 2, isUnlocked: 1 },
        ],
      });

      const res = await postAzitAction<{
        harvestedPlots?: number;
        totalYield?: number;
        xpGained?: number;
      }>(user.client, '/api/azit-game/garden/harvest-all', {});

      assert.equal(res.harvestedPlots, 3);
      assert.equal(res.totalYield, 6);
      assert.equal(res.xpGained, GARDEN_HARVEST_AZIT_XP * 3);
      assert.equal(res.state.profile.azitXp, 24);
      assert.equal(res.state.garden.plots[0].stage, 0);
      assert.equal(res.state.garden.plots[1].stage, 0);
      assert.equal(res.state.garden.plots[2].stage, 0);
      assert.equal(res.state.garden.plots[3].stage, 2, 'Growing plot 3 must stay untouched');
    },
  },
  {
    id: 'T1-F4-05',
    tier: 1,
    feature: 'F4',
    name: 'Bulk plant-all, water-all, and harvest-all span starter (0..5) and expanded (6..7) plots',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 10,
        azitXp: xpForLevel(10),
        plots: unlockedPlotsSeed(8),
        crops: { 'crop-carrot': { seedQty: 8 } },
      });

      const planted = await postAzitAction<{ plantedCount?: number }>(
        user.client,
        '/api/azit-game/garden/plant-all',
        { cropId: 'crop-carrot' }
      );
      assert.equal(planted.plantedCount, 8);

      const pastMs = Date.now() - 60_000;
      for (let i = 0; i < 8; i += 1) {
        ctx.db.backdatePlotTimers(user.userId, i, { nextWaterAtMs: pastMs });
      }
      const w1 = await postAzitAction<{ wateredCount?: number }>(
        user.client,
        '/api/azit-game/garden/water-all',
        {}
      );
      assert.equal(w1.wateredCount, 8);

      for (let i = 0; i < 8; i += 1) {
        ctx.db.backdatePlotTimers(user.userId, i, { nextWaterAtMs: pastMs });
      }
      const w2 = await postAzitAction<{ wateredCount?: number; maturedCount?: number }>(
        user.client,
        '/api/azit-game/garden/water-all',
        {}
      );
      assert.equal(w2.wateredCount, 8);
      assert.equal(w2.maturedCount, 8);

      const harvested = await postAzitAction<{ harvestedPlots?: number; totalYield?: number }>(
        user.client,
        '/api/azit-game/garden/harvest-all',
        {}
      );
      assert.equal(harvested.harvestedPlots, 8);
      assert.equal(harvested.totalYield, 16);
      assert.equal(harvested.state.garden.harvestCounts['crop-carrot'], 16);
    },
  },

  // ==================== F5: Plot Soil Upgrade & Bonus Yield (5) ====================
  {
    id: 'T1-F5-01',
    tier: 1,
    feature: 'F5',
    name: 'POST /garden/upgrade-soil upgrades plot 0 Lv 0->1 (80P) and Lv 1->2 (180P) with ledger entries',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        points: 500,
      });

      const s1 = await postAzitAction<{ soilLevel?: number }>(
        user.client,
        '/api/azit-game/garden/upgrade-soil',
        { plotIndex: 0 }
      );
      assert.equal(s1.soilLevel, 1);
      assert.equal(s1.state.garden.plots[0].soilLevel, 1);
      assert.equal(s1.state.veraPoints, 500 - 80);

      const s2 = await postAzitAction<{ soilLevel?: number }>(
        user.client,
        '/api/azit-game/garden/upgrade-soil',
        { plotIndex: 0 }
      );
      assert.equal(s2.soilLevel, 2);
      assert.equal(s2.state.garden.plots[0].soilLevel, 2);
      assert.equal(s2.state.veraPoints, 500 - 80 - 180);

      const soilLedgers = s2.state.recentLedger.filter((l) => l.txType === 'soil_upgrade');
      assert.equal(soilLedgers.length, 2);
    },
  },
  {
    id: 'T1-F5-02',
    tier: 1,
    feature: 'F5',
    name: 'Lv 35 user upgrades expanded plot 6 sequentially to max soilLevel=5 and persists in GET /state',
    run: async (ctx) => {
      const totalSoilCost = SOIL_LEVEL_SCHEDULE.reduce((acc, s) => acc + s.upgradeCost, 0);
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        points: totalSoilCost + 100,
        plots: unlockedPlotsSeed(7),
      });

      for (let expectedLv = 1; expectedLv <= 5; expectedLv += 1) {
        const res = await postAzitAction<{ soilLevel?: number }>(
          user.client,
          '/api/azit-game/garden/upgrade-soil',
          { plotIndex: 6 }
        );
        assert.equal(res.soilLevel, expectedLv);
        assert.equal(res.state.garden.plots[6].soilLevel, expectedLv);
      }

      const reloaded = await fetchAzitState(user.client);
      assert.equal(reloaded.veraPoints, 100);
      assert.equal(reloaded.garden.plots[6].soilLevel, 5);
    },
  },
  {
    id: 'T1-F5-03',
    tier: 1,
    feature: 'F5',
    name: 'Manual harvest on soilLevel=2 guarantees >= 3 yield (base 2 + guaranteedBonus 1)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 3,
            waterCount: 3,
            isUnlocked: 1,
            soilLevel: 2,
          },
        ],
      });

      const res = await postAzitAction<{ harvestedYield?: number; bonusYield?: number }>(
        user.client,
        '/api/azit-game/garden/harvest',
        { plotIndex: 0 }
      );

      assert.equal(res.bonusYield, 1);
      assert.equal(res.harvestedYield, 3);
      assert.equal(res.state.garden.harvestCounts['crop-carrot'], 3);
      assert.equal(res.state.garden.plots[0].soilLevel, 2, 'Soil upgrade must persist after harvest');
    },
  },
  {
    id: 'T1-F5-04',
    tier: 1,
    feature: 'F5',
    name: 'Manual harvest on soilLevel=4 guarantees >= 4 yield (base 2 + guaranteedBonus 2)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 22,
        azitXp: xpForLevel(22),
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-strawberry',
            stage: 3,
            waterCount: 3,
            isUnlocked: 1,
            soilLevel: 4,
          },
        ],
      });

      const res = await postAzitAction<{ harvestedYield?: number; bonusYield?: number }>(
        user.client,
        '/api/azit-game/garden/harvest',
        { plotIndex: 0 }
      );

      assert.ok((res.bonusYield ?? 0) >= 2, `Expected bonusYield >= 2, got ${res.bonusYield}`);
      assert.ok(
        (res.harvestedYield ?? 0) >= 4 && (res.harvestedYield ?? 0) <= 5,
        `Expected harvestedYield 4..5, got ${res.harvestedYield}`
      );
      assert.equal(res.state.garden.harvestCounts['crop-strawberry'], res.harvestedYield);
    },
  },
  {
    id: 'T1-F5-05',
    tier: 1,
    feature: 'F5',
    name: 'harvest-all aggregates guaranteed soil bonuses across multiple upgraded plots',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1, soilLevel: 2 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1, soilLevel: 4 },
        ],
      });

      const res = await postAzitAction<{
        harvestedPlots?: number;
        totalYield?: number;
        totalBonusYield?: number;
      }>(user.client, '/api/azit-game/garden/harvest-all', {});

      assert.equal(res.harvestedPlots, 2);
      assert.ok((res.totalBonusYield ?? 0) >= 3, `Expected totalBonusYield >= 3, got ${res.totalBonusYield}`);
      assert.ok((res.totalYield ?? 0) >= 7, `Expected totalYield >= 7, got ${res.totalYield}`);
      assert.equal(res.state.garden.harvestCounts['crop-carrot'], res.totalYield);
    },
  },

  // ==================== F6: High-Level Lv 20-50 Crops & Recipes (5) ====================
  {
    id: 'T1-F6-01',
    tier: 1,
    feature: 'F6',
    name: 'catalog exposes all 12 crops (6 starter + 6 Lv 20..50) and 14 recipes (8 starter + 6 Lv 20..50)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser();
      const state = await fetchAzitState(user.client);

      assert.equal(state.catalog.crops.length, 12);
      for (const starterId of STARTER_CROP_IDS) {
        const found = state.catalog.crops.find((c) => c.cropId === starterId);
        assert.ok(found, `Missing starter crop ${starterId}`);
        assert.equal(found.requiredAzitLevel, 1);
      }
      for (const highCrop of HIGH_LEVEL_CROPS) {
        const found = state.catalog.crops.find((c) => c.cropId === highCrop.cropId);
        assert.ok(found, `Missing high-level crop ${highCrop.cropId}`);
        assert.equal(found.requiredAzitLevel, highCrop.requiredAzitLevel);
        assert.equal(found.seedPrice, highCrop.seedPrice);
        assert.equal(found.sellPrice, highCrop.sellPrice);
      }

      assert.equal(state.catalog.recipes.length, 14);
      for (const rec of HIGH_LEVEL_RECIPES) {
        const found = state.catalog.recipes.find((r) => r.recipeId === rec.recipeId);
        assert.ok(found, `Missing high-level recipe ${rec.recipeId}`);
        assert.equal(found.requiredAzitLevel, rec.requiredAzitLevel);
        assert.equal(found.sellPrice, rec.sellPrice);
      }
    },
  },
  {
    id: 'T1-F6-02',
    tier: 1,
    feature: 'F6',
    name: 'Lv 20 user completes full crop-blueberry lifecycle: buy seed, plant, water x2, harvest, sell',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 500,
      });

      const bought = await postAzitAction(user.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-blueberry',
        quantity: 1,
      });
      assert.equal(bought.state.veraPoints, 500 - 55);
      assert.equal(bought.state.garden.seedCounts['crop-blueberry'], 1);

      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-blueberry',
      });
      ctx.db.backdatePlotTimers(user.userId, 0, { nextWaterAtMs: Date.now() - 60_000 });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });
      ctx.db.backdatePlotTimers(user.userId, 0, { nextWaterAtMs: Date.now() - 60_000 });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });

      const harvested = await postAzitAction<{ harvestedYield?: number }>(
        user.client,
        '/api/azit-game/garden/harvest',
        { plotIndex: 0 }
      );
      assert.equal(harvested.harvestedYield, 2);
      assert.equal(harvested.state.garden.harvestCounts['crop-blueberry'], 2);

      const sold = await postAzitAction(user.client, '/api/azit-game/crops/sell', {
        cropId: 'crop-blueberry',
        quantity: 2,
      });
      assert.equal(sold.state.veraPoints, 500 - 55 + 68 * 2);
      assert.equal(sold.state.garden.harvestCounts['crop-blueberry'], 0);
      assert.equal(sold.state.profile.totalCropsSold, 2);
    },
  },
  {
    id: 'T1-F6-03',
    tier: 1,
    feature: 'F6',
    name: 'Lv 50 user completes full crop-moonfruit lifecycle: buy seed, plant, water x2, harvest, sell',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 1000,
      });

      const bought = await postAzitAction(user.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-moonfruit',
        quantity: 1,
      });
      assert.equal(bought.state.veraPoints, 1000 - 180);

      await postAzitAction(user.client, '/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-moonfruit',
      });
      ctx.db.backdatePlotTimers(user.userId, 0, { nextWaterAtMs: Date.now() - 60_000 });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });
      ctx.db.backdatePlotTimers(user.userId, 0, { nextWaterAtMs: Date.now() - 60_000 });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });

      const harvested = await postAzitAction(user.client, '/api/azit-game/garden/harvest', {
        plotIndex: 0,
      });
      assert.equal(harvested.state.garden.harvestCounts['crop-moonfruit'], 2);

      const sold = await postAzitAction(user.client, '/api/azit-game/crops/sell', {
        cropId: 'crop-moonfruit',
        quantity: 2,
      });
      assert.equal(sold.state.veraPoints, 1000 - 180 + 220 * 2);
      assert.equal(sold.state.garden.harvestCounts['crop-moonfruit'], 0);
    },
  },
  {
    id: 'T1-F6-04',
    tier: 1,
    feature: 'F6',
    name: 'Lv 20 user cooks, claims, and sells dish-blueberry-parfait with harvested blueberry & material',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 100,
        crops: {
          'crop-blueberry': { harvestQty: 2 },
          'crop-strawberry': { harvestQty: 1 },
        },
      });
      await fetchAzitState(user.client);
      seedMaterials(ctx.db, user.userId, { 'mat-forest-honey': 1 });

      const started = await postAzitAction(user.client, '/api/azit-game/kitchen/start', {
        slotIndex: 0,
        recipeId: 'dish-blueberry-parfait',
      });
      assert.equal(started.state.garden.harvestCounts['crop-blueberry'], 0);
      assert.equal(started.state.garden.harvestCounts['crop-strawberry'], 0);
      assert.equal(started.state.materials['mat-forest-honey'], 0);

      ctx.db.execute(
        'UPDATE azit_kitchen_slots SET ends_at_ms = ? WHERE user_id = ? AND slot_index = 0',
        [Date.now() - 5000, user.userId]
      );

      const claimed = await postAzitAction<{ producedQty?: number }>(
        user.client,
        '/api/azit-game/kitchen/claim',
        { slotIndex: 0 }
      );
      assert.equal(claimed.producedQty, 1);
      assert.equal(claimed.state.dishes['dish-blueberry-parfait'], 1);
      assert.equal(claimed.state.profile.azitXp, xpForLevel(20) + 95);

      const sold = await postAzitAction(user.client, '/api/azit-game/dishes/sell', {
        recipeId: 'dish-blueberry-parfait',
        quantity: 1,
      });
      assert.equal(sold.state.veraPoints, 100 + 520);
      assert.equal(sold.state.dishes['dish-blueberry-parfait'], 0);
    },
  },
  {
    id: 'T1-F6-05',
    tier: 1,
    feature: 'F6',
    name: 'Lv 50 user cooks, claims, and sells dish-moon-elixir (2200P, +280 Azit XP)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 100,
        crops: {
          'crop-moonfruit': { harvestQty: 2 },
          'crop-truffle': { harvestQty: 1 },
        },
      });
      await fetchAzitState(user.client);
      seedMaterials(ctx.db, user.userId, { 'mat-dragon-powder': 1 });

      await postAzitAction(user.client, '/api/azit-game/kitchen/start', {
        slotIndex: 0,
        recipeId: 'dish-moon-elixir',
      });
      ctx.db.execute(
        'UPDATE azit_kitchen_slots SET ends_at_ms = ? WHERE user_id = ? AND slot_index = 0',
        [Date.now() - 5000, user.userId]
      );

      const claimed = await postAzitAction<{ producedQty?: number }>(
        user.client,
        '/api/azit-game/kitchen/claim',
        { slotIndex: 0 }
      );
      assert.equal(claimed.producedQty, 1);
      assert.equal(claimed.state.dishes['dish-moon-elixir'], 1);
      assert.equal(claimed.state.profile.azitXp, xpForLevel(50) + 280);

      const sold = await postAzitAction(user.client, '/api/azit-game/dishes/sell', {
        recipeId: 'dish-moon-elixir',
        quantity: 1,
      });
      assert.equal(sold.state.veraPoints, 100 + 2200);
      assert.equal(sold.state.dishes['dish-moon-elixir'], 0);
    },
  },
];
