import assert from 'node:assert/strict';
import {
  AZIT_LEVEL_XP,
  GARDEN_WATER_COOLDOWN_MS,
  MAX_FERTILIZER_PER_CROP,
  assertErrorStatus,
  fetchAzitState,
  postAzitAction,
  seedMaterials,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { ApiEnvelope } from '../helpers/azit-helpers.js';
import type { E2ETestCase } from '../types.js';

export const tier2GardenTests: E2ETestCase[] = [
  // ==================== F1: Azit Lv 50 Level Table & Sync Boundaries (5) ====================
  {
    id: 'T2-F1-01',
    tier: 2,
    feature: 'F1',
    name: 'Exact XP boundary transitions Lv 1->2 (79 vs 80) and Lv 9->10 (6199 vs 6200)',
    run: async (ctx) => {
      const cases = [
        { xp: 79, expectedLv: 1 },
        { xp: 80, expectedLv: 2 },
        { xp: 6199, expectedLv: 9 },
        { xp: 6200, expectedLv: 10 },
        { xp: 6201, expectedLv: 10 },
      ];
      for (const c of cases) {
        const user = await ctx.createAuthenticatedUser({ azitXp: c.xp });
        const state = await fetchAzitState(user.client);
        assert.equal(
          state.profile.azitLevel,
          c.expectedLv,
          `azitXp=${c.xp}: expected Lv ${c.expectedLv}, got ${state.profile.azitLevel}`
        );
      }
    },
  },
  {
    id: 'T2-F1-02',
    tier: 2,
    feature: 'F1',
    name: 'Lv 19->20 XP boundary (40699 vs 40700) flips maxFarmers from 0 to 1',
    run: async (ctx) => {
      const u19 = await ctx.createAuthenticatedUser({ azitXp: AZIT_LEVEL_XP[20] - 1 });
      const s19 = await fetchAzitState(u19.client);
      assert.equal(s19.profile.azitLevel, 19);
      assert.equal(s19.profile.limits.maxFarmers, 0);

      const u20 = await ctx.createAuthenticatedUser({ azitXp: AZIT_LEVEL_XP[20] });
      const s20 = await fetchAzitState(u20.client);
      assert.equal(s20.profile.azitLevel, 20);
      assert.equal(s20.profile.limits.maxFarmers, 1);
    },
  },
  {
    id: 'T2-F1-03',
    tier: 2,
    feature: 'F1',
    name: 'Lv 34->35 XP boundary (162199 vs 162200) flips maxFarmers from 1 to 2',
    run: async (ctx) => {
      const u34 = await ctx.createAuthenticatedUser({ azitXp: AZIT_LEVEL_XP[35] - 1 });
      const s34 = await fetchAzitState(u34.client);
      assert.equal(s34.profile.azitLevel, 34);
      assert.equal(s34.profile.limits.maxFarmers, 1);

      const u35 = await ctx.createAuthenticatedUser({ azitXp: AZIT_LEVEL_XP[35] });
      const s35 = await fetchAzitState(u35.client);
      assert.equal(s35.profile.azitLevel, 35);
      assert.equal(s35.profile.limits.maxFarmers, 2);
    },
  },
  {
    id: 'T2-F1-04',
    tier: 2,
    feature: 'F1',
    name: 'Overflow XP (999999999) safely caps at Lv 50 with nextLevelXp=null and progressPct=100',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: 999_999_999,
      });
      const state = await fetchAzitState(user.client);
      assert.equal(state.profile.azitLevel, 50);
      assert.equal(state.profile.nextLevelXp, null);
      assert.equal(state.profile.progressPct, 100);
      assert.equal(state.profile.limits.maxGardenPlots, 16);
      assert.equal(state.profile.limits.maxFarmers, 2);
    },
  },
  {
    id: 'T2-F1-05',
    tier: 2,
    feature: 'F1',
    name: 'Negative azit_xp (-500) in SQLite safely clamps to Lv 1 with progressPct=0',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 1,
        azitXp: -500,
      });
      const state = await fetchAzitState(user.client);
      assert.equal(state.profile.azitLevel, 1);
      assert.equal(state.profile.progressPct, 0);
      assert.equal(state.profile.limits.maxGardenPlots, 6);
    },
  },

  // ==================== F2: Level-Scaled Garden Plot Expansion Boundaries (5) ====================
  {
    id: 'T2-F2-01',
    tier: 2,
    feature: 'F2',
    name: 'POST /garden/unlock-plot rejects invalid plotIndex (-1, 16, 1.5, abc, missing) with 400',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 5000,
      });

      for (const bad of [-1, 16, 1.5, 'abc', null, undefined]) {
        const res = await user.client.post<ApiEnvelope>(
          '/api/azit-game/garden/unlock-plot',
          bad === undefined ? {} : { plotIndex: bad }
        );
        assertErrorStatus(res, 400, `unlock-plot plotIndex=${String(bad)}`);
      }
    },
  },
  {
    id: 'T2-F2-02',
    tier: 2,
    feature: 'F2',
    name: 'POST /garden/unlock-plot rejects starter plots (0, 5) with 400 and duplicate unlock on 6 with 409',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        points: 1000,
      });

      for (const starterIdx of [0, 5]) {
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', {
          plotIndex: starterIdx,
        });
        assertErrorStatus(res, 400, `unlock-plot starter ${starterIdx}`);
      }

      await postAzitAction(user.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 6 });
      const dupRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', {
        plotIndex: 6,
      });
      assertErrorStatus(dupRes, 409, 'duplicate unlock-plot 6');
    },
  },
  {
    id: 'T2-F2-03',
    tier: 2,
    feature: 'F2',
    name: 'POST /garden/unlock-plot rejects unlocking below unlockLevel (Lv 4->plot 6, Lv 19->plot 9, Lv 49->plot 15)',
    run: async (ctx) => {
      const checks = [
        { level: 4, plotIndex: 6 },
        { level: 19, plotIndex: 9 },
        { level: 49, plotIndex: 15 },
      ];
      for (const c of checks) {
        const user = await ctx.createAuthenticatedUser({
          azitLevel: c.level,
          azitXp: xpForLevel(c.level),
          points: 5000,
        });
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', {
          plotIndex: c.plotIndex,
        });
        assertErrorStatus(res, 400, `Lv ${c.level} unlock plot ${c.plotIndex}`);
      }
    },
  },
  {
    id: 'T2-F2-04',
    tier: 2,
    feature: 'F2',
    name: 'POST /garden/unlock-plot with unlockCost-1 (59P for plot 6) returns 400 and preserves points',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        points: 59,
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', {
        plotIndex: 6,
      });
      assertErrorStatus(res, 400, 'unlock-plot insufficient 59P');

      const state = await fetchAzitState(user.client);
      assert.equal(state.veraPoints, 59);
      assert.equal(state.garden.plots[6].isUnlocked, false);
    },
  },
  {
    id: 'T2-F2-05',
    tier: 2,
    feature: 'F2',
    name: 'plant, water, harvest, and clear reject locked plot 6 with 400 without consuming seeds',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 10,
        azitXp: xpForLevel(10),
        crops: { 'crop-carrot': { seedQty: 3 } },
      });

      const plantRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant', {
        plotIndex: 6,
        cropId: 'crop-carrot',
      });
      assertErrorStatus(plantRes, 400, 'plant on locked plot 6');

      const waterRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/water', {
        plotIndex: 6,
      });
      assertErrorStatus(waterRes, 400, 'water on locked plot 6');

      const harvestRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/harvest', {
        plotIndex: 6,
      });
      assertErrorStatus(harvestRes, 400, 'harvest on locked plot 6');

      const clearRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/clear', {
        plotIndex: 6,
      });
      assertErrorStatus(clearRes, 400, 'clear on locked plot 6');

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.seedCounts['crop-carrot'], 3);
    },
  },

  // ==================== F3: Consumable Fertilizer Boundaries (5) ====================
  {
    id: 'T2-F3-01',
    tier: 2,
    feature: 'F3',
    name: 'POST /garden/fertilizer/buy rejects invalid ID, bad quantities (0, -1, 51, 1.5), and price-1 points',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({ points: 39 });

      const badPayloads = [
        { fertilizerId: 'fert-nonexistent', quantity: 1 },
        { fertilizerId: '', quantity: 1 },
        { fertilizerId: 'fert-basic', quantity: 0 },
        { fertilizerId: 'fert-basic', quantity: -1 },
        { fertilizerId: 'fert-basic', quantity: 51 },
        { fertilizerId: 'fert-basic', quantity: 1.5 },
        { fertilizerId: 'fert-basic', quantity: 1 }, // 39P < 40P
      ];

      for (const payload of badPayloads) {
        const res = await user.client.post<ApiEnvelope>(
          '/api/azit-game/garden/fertilizer/buy',
          payload
        );
        assertErrorStatus(res, 400, `fertilizer/buy ${JSON.stringify(payload)}`);
      }

      const state = await fetchAzitState(user.client);
      assert.equal(state.veraPoints, 39);
      assert.equal(state.garden.fertilizerCounts['fert-basic'], 0);
    },
  },
  {
    id: 'T2-F3-02',
    tier: 2,
    feature: 'F3',
    name: 'POST /garden/fertilize rejects locked, empty, mature plots and invalid plotIndex without consuming qty',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        points: 200,
        plots: [
          { plotIndex: 0, cropId: null, stage: 0, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
        ],
      });
      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 2,
      });

      for (const badIdx of [-1, 16, 6, 0, 1]) {
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/fertilize', {
          plotIndex: badIdx,
          fertilizerId: 'fert-basic',
        });
        assertErrorStatus(res, 400, `fertilize plotIndex=${badIdx}`);
      }

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.fertilizerCounts['fert-basic'], 2);
    },
  },
  {
    id: 'T2-F3-03',
    tier: 2,
    feature: 'F3',
    name: 'POST /garden/fertilize rejects a plot already ready for watering (nextWaterAtMs <= nowMs)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        points: 200,
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: Date.now() - 60_000,
            isUnlocked: 1,
          },
        ],
      });
      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 1,
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-basic',
      });
      assertErrorStatus(res, 400, 'fertilize already-waterable plot');

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.fertilizerCounts['fert-basic'], 1);
    },
  },
  {
    id: 'T2-F3-04',
    tier: 2,
    feature: 'F3',
    name: 'POST /garden/fertilize succeeds up to MAX_FERTILIZER_PER_CROP=4 and rejects 5th attempt with 400',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        points: 500,
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: Date.now() + GARDEN_WATER_COOLDOWN_MS,
            fertilizerUsedCount: MAX_FERTILIZER_PER_CROP - 1,
            isUnlocked: 1,
          },
        ],
      });
      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 2,
      });

      const fourth = await postAzitAction<{ fertilizerUsedCount?: number }>(
        user.client,
        '/api/azit-game/garden/fertilize',
        { plotIndex: 0, fertilizerId: 'fert-basic' }
      );
      assert.equal(fourth.fertilizerUsedCount, MAX_FERTILIZER_PER_CROP);
      assert.equal(fourth.state.garden.fertilizerCounts['fert-basic'], 1);

      const fifth = await user.client.post<ApiEnvelope>('/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-basic',
      });
      assertErrorStatus(fifth, 400, '5th fertilize exceeding MAX_FERTILIZER_PER_CROP');

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.fertilizerCounts['fert-basic'], 1);
      assert.equal(state.garden.plots[0].fertilizerUsedCount, MAX_FERTILIZER_PER_CROP);
    },
  },
  {
    id: 'T2-F3-05',
    tier: 2,
    feature: 'F3',
    name: 'POST /garden/fertilize with 0 fertilizer inventory returns 400 without modifying plot timers',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: futureMs,
            isUnlocked: 1,
          },
        ],
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/fertilize', {
        plotIndex: 0,
        fertilizerId: 'fert-basic',
      });
      assertErrorStatus(res, 400, 'fertilize with 0 inventory');

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.plots[0].nextWaterAtMs, futureMs);
      assert.equal(state.garden.plots[0].fertilizerUsedCount, 0);
    },
  },

  // ==================== F4: Bulk Convenience Boundaries (5) ====================
  {
    id: 'T2-F4-01',
    tier: 2,
    feature: 'F4',
    name: 'POST /garden/water-all returns 400 when all growing plots are within 8h cooldown',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: futureMs, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-pepper', stage: 2, waterCount: 2, nextWaterAtMs: futureMs, isUnlocked: 1 },
        ],
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/water-all', {});
      assertErrorStatus(res, 400, 'water-all during cooldown');
    },
  },
  {
    id: 'T2-F4-02',
    tier: 2,
    feature: 'F4',
    name: 'POST /garden/water-all returns 400 when plots are only empty, mature, or locked',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        plots: [
          { plotIndex: 0, cropId: null, stage: 0, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
        ],
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/water-all', {});
      assertErrorStatus(res, 400, 'water-all with no growing plots');
    },
  },
  {
    id: 'T2-F4-03',
    tier: 2,
    feature: 'F4',
    name: 'POST /garden/harvest-all returns 400 when zero unlocked plots are mature (stage >= 3)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 2, waterCount: 2, isUnlocked: 1 },
        ],
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/harvest-all', {});
      assertErrorStatus(res, 400, 'harvest-all with no mature plots');
    },
  },
  {
    id: 'T2-F4-04',
    tier: 2,
    feature: 'F4',
    name: 'POST /garden/plant-all rejects missing/unknown/locked cropId and 0 seeds with 400',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        crops: {
          'crop-carrot': { seedQty: 0 },
          'crop-blueberry': { seedQty: 3 },
        },
      });

      const missingRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', {});
      assertErrorStatus(missingRes, 400, 'plant-all missing cropId');

      const unknownRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', {
        cropId: 'crop-unknown-xyz',
      });
      assertErrorStatus(unknownRes, 400, 'plant-all unknown cropId');

      const zeroSeedRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', {
        cropId: 'crop-carrot',
      });
      assertErrorStatus(zeroSeedRes, 400, 'plant-all 0 seeds');

      const lockedCropRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', {
        cropId: 'crop-blueberry',
      });
      assertErrorStatus(lockedCropRes, 400, 'plant-all locked crop at Lv 19');
    },
  },
  {
    id: 'T2-F4-05',
    tier: 2,
    feature: 'F4',
    name: 'POST /garden/plant-all returns 400 when all unlocked plots (0..5) are occupied, ignoring locked 6..15',
    run: async (ctx) => {
      const occupiedPlots = [0, 1, 2, 3, 4, 5].map((idx) => ({
        plotIndex: idx,
        cropId: 'crop-carrot',
        stage: 1,
        waterCount: 1,
        isUnlocked: 1,
      }));
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 10,
        azitXp: xpForLevel(10),
        plots: occupiedPlots,
        crops: { 'crop-carrot': { seedQty: 5 } },
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', {
        cropId: 'crop-carrot',
      });
      assertErrorStatus(res, 400, 'plant-all when all unlocked plots occupied');

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.seedCounts['crop-carrot'], 5);
    },
  },

  // ==================== F5: Plot Soil Upgrade Boundaries (5) ====================
  {
    id: 'T2-F5-01',
    tier: 2,
    feature: 'F5',
    name: 'POST /garden/upgrade-soil rejects locked plot 6 and invalid plotIndex (-1, 16, x) with 400',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 5000,
      });

      for (const bad of [-1, 16, 'x', 6]) {
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/upgrade-soil', {
          plotIndex: bad,
        });
        assertErrorStatus(res, 400, `upgrade-soil plotIndex=${String(bad)}`);
      }
    },
  },
  {
    id: 'T2-F5-02',
    tier: 2,
    feature: 'F5',
    name: 'POST /garden/upgrade-soil rejects upgrading beyond max soilLevel=5 with 400',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 5000,
        plots: [{ plotIndex: 0, isUnlocked: 1, soilLevel: 5 }],
      });

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/upgrade-soil', {
        plotIndex: 0,
      });
      assertErrorStatus(res, 400, 'upgrade-soil beyond Lv 5');

      const state = await fetchAzitState(user.client);
      assert.equal(state.veraPoints, 5000);
      assert.equal(state.garden.plots[0].soilLevel, 5);
    },
  },
  {
    id: 'T2-F5-03',
    tier: 2,
    feature: 'F5',
    name: 'POST /garden/upgrade-soil enforces requiredAzitLevel gates (Lv 4->soil 2, Lv 11->soil 3, Lv 21->soil 4, Lv 34->soil 5)',
    run: async (ctx) => {
      const gates = [
        { azitLevel: 4, currentSoil: 1 },
        { azitLevel: 11, currentSoil: 2 },
        { azitLevel: 21, currentSoil: 3 },
        { azitLevel: 34, currentSoil: 4 },
      ];
      for (const g of gates) {
        const user = await ctx.createAuthenticatedUser({
          azitLevel: g.azitLevel,
          azitXp: xpForLevel(g.azitLevel),
          points: 5000,
          plots: [{ plotIndex: 0, isUnlocked: 1, soilLevel: g.currentSoil }],
        });
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/upgrade-soil', {
          plotIndex: 0,
        });
        assertErrorStatus(
          res,
          400,
          `upgrade-soil Lv ${g.azitLevel} from soil ${g.currentSoil}`
        );
      }
    },
  },
  {
    id: 'T2-F5-04',
    tier: 2,
    feature: 'F5',
    name: 'POST /garden/upgrade-soil with upgradeCost-1 (79P for Lv 1) returns 400 and preserves soilLevel & points',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({ points: 79 });
      const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/upgrade-soil', {
        plotIndex: 0,
      });
      assertErrorStatus(res, 400, 'upgrade-soil 79P < 80P');

      const state = await fetchAzitState(user.client);
      assert.equal(state.veraPoints, 79);
      assert.equal(state.garden.plots[0].soilLevel, 0);
    },
  },
  {
    id: 'T2-F5-05',
    tier: 2,
    feature: 'F5',
    name: 'Upgrading soil mid-growth preserves cropId/stage/timers and applies bonus yield upon harvest',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 5,
        azitXp: xpForLevel(5),
        points: 500,
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 2,
            waterCount: 2,
            nextWaterAtMs: futureMs,
            isUnlocked: 1,
            soilLevel: 0,
          },
        ],
      });

      await postAzitAction(user.client, '/api/azit-game/garden/upgrade-soil', { plotIndex: 0 });
      const mid = await postAzitAction(user.client, '/api/azit-game/garden/upgrade-soil', {
        plotIndex: 0,
      });

      assert.equal(mid.state.garden.plots[0].soilLevel, 2);
      assert.equal(mid.state.garden.plots[0].cropId, 'crop-carrot');
      assert.equal(mid.state.garden.plots[0].stage, 2);
      assert.equal(mid.state.garden.plots[0].nextWaterAtMs, futureMs);

      ctx.db.backdatePlotTimers(user.userId, 0, { nextWaterAtMs: Date.now() - 60_000 });
      await postAzitAction(user.client, '/api/azit-game/garden/water', { plotIndex: 0 });
      const harvested = await postAzitAction<{ harvestedYield?: number; bonusYield?: number }>(
        user.client,
        '/api/azit-game/garden/harvest',
        { plotIndex: 0 }
      );
      assert.equal(harvested.bonusYield, 1);
      assert.equal(harvested.harvestedYield, 3);
    },
  },

  // ==================== F6: High-Level Lv 20-50 Crops & Recipes Boundaries (5) ====================
  {
    id: 'T2-F6-01',
    tier: 2,
    feature: 'F6',
    name: 'POST /garden/buy-seed rejects Lv 20..50 crops below requiredAzitLevel (Lv 19->blueberry, Lv 49->moonfruit)',
    run: async (ctx) => {
      const u19 = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        points: 5000,
      });
      const r19 = await userClientPost(u19.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-blueberry',
        quantity: 1,
      });
      assertErrorStatus(r19, 400, 'Lv 19 buy crop-blueberry');

      const u49 = await ctx.createAuthenticatedUser({
        azitLevel: 49,
        azitXp: xpForLevel(49),
        points: 5000,
      });
      const r49 = await userClientPost(u49.client, '/api/azit-game/garden/buy-seed', {
        cropId: 'crop-moonfruit',
        quantity: 1,
      });
      assertErrorStatus(r49, 400, 'Lv 49 buy crop-moonfruit');
    },
  },
  {
    id: 'T2-F6-02',
    tier: 2,
    feature: 'F6',
    name: 'plant and plant-all reject pre-seeded Lv 20 seeds when user is Lv 19 without consuming seeds',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        crops: { 'crop-blueberry': { seedQty: 4 } },
      });

      const r1 = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant', {
        plotIndex: 0,
        cropId: 'crop-blueberry',
      });
      assertErrorStatus(r1, 400, 'plant Lv 20 crop at Lv 19');

      const r2 = await user.client.post<ApiEnvelope>('/api/azit-game/garden/plant-all', {
        cropId: 'crop-blueberry',
      });
      assertErrorStatus(r2, 400, 'plant-all Lv 20 crop at Lv 19');

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.seedCounts['crop-blueberry'], 4);
    },
  },
  {
    id: 'T2-F6-03',
    tier: 2,
    feature: 'F6',
    name: 'kitchen/start rejects Lv 20 recipe at Lv 19 and compensates/preserves crops if material missing',
    run: async (ctx) => {
      const u19 = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        crops: {
          'crop-blueberry': { harvestQty: 2 },
          'crop-strawberry': { harvestQty: 1 },
        },
      });
      await fetchAzitState(u19.client);
      seedMaterials(ctx.db, u19.userId, { 'mat-forest-honey': 1 });

      const lockedRes = await u19.client.post<ApiEnvelope>('/api/azit-game/kitchen/start', {
        slotIndex: 0,
        recipeId: 'dish-blueberry-parfait',
      });
      assertErrorStatus(lockedRes, 400, 'kitchen/start Lv 20 recipe at Lv 19');

      // Lv 20 user with crops but missing mat-forest-honey -> 400 and crops rolled back
      const u20 = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        crops: {
          'crop-blueberry': { harvestQty: 2 },
          'crop-strawberry': { harvestQty: 1 },
        },
      });
      const missingMatRes = await u20.client.post<ApiEnvelope>('/api/azit-game/kitchen/start', {
        slotIndex: 0,
        recipeId: 'dish-blueberry-parfait',
      });
      assertErrorStatus(missingMatRes, 400, 'kitchen/start missing material');

      const s20 = await fetchAzitState(u20.client);
      assert.equal(s20.garden.harvestCounts['crop-blueberry'], 2);
      assert.equal(s20.garden.harvestCounts['crop-strawberry'], 1);
    },
  },
  {
    id: 'T2-F6-04',
    tier: 2,
    feature: 'F6',
    name: 'crops/sell and dishes/sell reject 0/-1/1000/unknown/excess quantities with 400',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        crops: { 'crop-blueberry': { harvestQty: 1 } },
      });

      for (const bad of [
        { cropId: 'crop-blueberry', quantity: 0 },
        { cropId: 'crop-blueberry', quantity: -1 },
        { cropId: 'crop-blueberry', quantity: 1000 },
        { cropId: 'crop-blueberry', quantity: 2 },
        { cropId: 'crop-invalid', quantity: 1 },
      ]) {
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/crops/sell', bad);
        assertErrorStatus(res, 400, `crops/sell ${JSON.stringify(bad)}`);
      }

      for (const badDish of [
        { recipeId: 'dish-blueberry-parfait', quantity: 0 },
        { recipeId: 'dish-blueberry-parfait', quantity: 1 },
        { recipeId: 'dish-invalid', quantity: 1 },
      ]) {
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/dishes/sell', badDish);
        assertErrorStatus(res, 400, `dishes/sell ${JSON.stringify(badDish)}`);
      }
    },
  },
  {
    id: 'T2-F6-05',
    tier: 2,
    feature: 'F6',
    name: 'buy-seed rejects invalid quantities (0, 51, 1.5) and seedPrice-1 points (54P for blueberry)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 54,
      });

      for (const qty of [0, 51, 1.5]) {
        const res = await user.client.post<ApiEnvelope>('/api/azit-game/garden/buy-seed', {
          cropId: 'crop-carrot',
          quantity: qty,
        });
        assertErrorStatus(res, 400, `buy-seed qty=${qty}`);
      }

      const insufficient = await user.client.post<ApiEnvelope>('/api/azit-game/garden/buy-seed', {
        cropId: 'crop-blueberry',
        quantity: 1,
      });
      assertErrorStatus(insufficient, 400, 'buy-seed blueberry 54P < 55P');

      const state = await fetchAzitState(user.client);
      assert.equal(state.veraPoints, 54);
      assert.equal(state.garden.seedCounts['crop-blueberry'], 0);
    },
  },
];

async function userClientPost(
  client: import('../types.js').HttpClientLike,
  reqPath: string,
  body: unknown
) {
  return client.post<ApiEnvelope>(reqPath, body);
}
