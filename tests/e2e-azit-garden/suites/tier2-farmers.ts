import assert from 'node:assert/strict';
import {
  GARDEN_WATER_COOLDOWN_MS,
  MAX_FERTILIZER_PER_CROP,
  assertAzitLevelLockedError,
  assertErrorStatus,
  fetchAzitState,
  getFarmerCatalog,
  pickEligibleFarmers,
  postAzitAction,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { ApiEnvelope, OwnedFarmerPayload } from '../helpers/azit-helpers.js';
import type { E2ETestCase, HttpClientLike } from '../types.js';

async function upgradeFarmerToLevel(
  client: HttpClientLike,
  farmerCode: string,
  targetLevel: number
): Promise<OwnedFarmerPayload> {
  let state = await fetchAzitState(client);
  let farmer = (state.farmers ?? []).find((f) => f.farmerCode === farmerCode);
  assert.ok(farmer, `Expected farmer ${farmerCode} to be hired`);

  while (farmer.level < targetLevel) {
    const res = await postAzitAction(client, '/api/azit-game/farmers/upgrade', { farmerCode });
    state = res.state;
    farmer = (state.farmers ?? []).find((f) => f.farmerCode === farmerCode);
    assert.ok(farmer, `Expected farmer ${farmerCode} after upgrade`);
  }
  return farmer;
}

export const tier2FarmerTests: E2ETestCase[] = [
  // ==================== F7: Farmer Employment Gate & Validation Boundaries (5) ====================
  {
    id: 'T2-F7-01',
    tier: 2,
    feature: 'F7',
    name: 'Lv 19 user attempting POST /farmers/hire is rejected with HTTP 400 AZIT_LEVEL_LOCKED',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        points: 10000,
      });
      const state = await fetchAzitState(user.client);
      const firstCode = state.catalog.farmers?.[0]?.farmerCode ?? 'farmer-rookie';

      const res = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
        farmerCode: firstCode,
      });
      assertAzitLevelLockedError(res, 'Lv 19 farmers/hire');
    },
  },
  {
    id: 'T2-F7-02',
    tier: 2,
    feature: 'F7',
    name: 'Lv 20 user (maxFarmers=1) cannot hire a 2nd distinct farmer (400)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 20000,
      });
      const state = await fetchAzitState(user.client);
      const eligible = pickEligibleFarmers(state, 20);
      assert.ok(eligible.length >= 1, 'Expected at least 1 eligible farmer at Lv 20');

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: eligible[0].farmerCode,
      });

      const allFarmers = getFarmerCatalog(state);
      const secondFarmer = allFarmers.find((f) => f.farmerCode !== eligible[0].farmerCode);
      assert.ok(secondFarmer, 'Expected a 2nd farmer in catalog.farmers');

      const res2 = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
        farmerCode: secondFarmer.farmerCode,
      });
      assertErrorStatus(res2, 400, 'Lv 20 hiring 2nd farmer beyond maxFarmers=1');
    },
  },
  {
    id: 'T2-F7-03',
    tier: 2,
    feature: 'F7',
    name: 'Duplicate POST /farmers/hire for already-hired farmerCode is rejected (400/409) without double charge',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        points: 20000,
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 35)[0];
      assert.ok(first, 'Expected eligible farmer at Lv 35');

      const hired = await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      const pointsAfterHire = hired.state.veraPoints;

      const dupRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      assertErrorStatus(dupRes, [400, 409], 'duplicate farmers/hire');

      const after = await fetchAzitState(user.client);
      assert.equal(after.veraPoints, pointsAfterHire);
      assert.equal(after.farmers?.length, 1);
    },
  },
  {
    id: 'T2-F7-04',
    tier: 2,
    feature: 'F7',
    name: 'POST /farmers/hire rejects empty/unknown farmerCode and hireCost-1 points with 400',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 0,
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 20)[0];
      assert.ok(first, 'Expected eligible farmer at Lv 20');

      const emptyRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
        farmerCode: '',
      });
      assertErrorStatus(emptyRes, 400, 'farmers/hire empty farmerCode');

      const unknownRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
        farmerCode: 'farmer-does-not-exist',
      });
      assertErrorStatus(unknownRes, 400, 'farmers/hire unknown farmerCode');

      if (first.hireCost > 0) {
        ctx.db.seedUserPoints(user.userId, first.hireCost - 1);
        const poorRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
          farmerCode: first.farmerCode,
        });
        assertErrorStatus(poorRes, 400, 'farmers/hire hireCost-1');
      }

      const after = await fetchAzitState(user.client);
      assert.equal(after.farmers?.length ?? 0, 0);
    },
  },
  {
    id: 'T2-F7-05',
    tier: 2,
    feature: 'F7',
    name: 'Lv 35 user (maxFarmers=2) cannot exceed 2 farmers and gated farmers reject below requiredAzitLevel',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        points: 50000,
      });
      const state0 = await fetchAzitState(user.client);
      const eligible = pickEligibleFarmers(state0, 35);
      assert.ok(eligible.length >= 2, 'Expected >= 2 eligible farmers at Lv 35');

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: eligible[0].farmerCode,
      });
      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: eligible[1].farmerCode,
      });

      const third = getFarmerCatalog(state0).find(
        (f) => f.farmerCode !== eligible[0].farmerCode && f.farmerCode !== eligible[1].farmerCode
      );
      if (third) {
        const res3 = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
          farmerCode: third.farmerCode,
        });
        assertErrorStatus(res3, 400, 'Lv 35 hiring 3rd farmer beyond maxFarmers=2');
      } else {
        // Also check gated farmer if one requires > Lv 20
        const gated = getFarmerCatalog(state0).find((f) => (f.requiredAzitLevel ?? 20) > 20);
        if (gated) {
          const u20 = await ctx.createAuthenticatedUser({
            azitLevel: 20,
            azitXp: xpForLevel(20),
            points: 50000,
          });
          const r = await u20.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
            farmerCode: gated.farmerCode,
          });
          assertErrorStatus(r, 400, 'hiring gated farmer below requiredAzitLevel');
        } else {
          const dup = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/hire', {
            farmerCode: eligible[0].farmerCode,
          });
          assertErrorStatus(dup, [400, 409], 'cannot exceed maxFarmers=2');
        }
      }
    },
  },

  // ==================== F8: Farmer Growth & Grade Boundaries (5) ====================
  {
    id: 'T2-F8-01',
    tier: 2,
    feature: 'F8',
    name: 'POST /farmers/upgrade rejects empty, unknown, and un-hired farmerCode (400/404)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 10000,
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 25)[0];
      assert.ok(first);

      const emptyRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/upgrade', {
        farmerCode: '',
      });
      assertErrorStatus(emptyRes, 400, 'farmers/upgrade empty farmerCode');

      const unknownRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/upgrade', {
        farmerCode: 'farmer-unknown-99',
      });
      assertErrorStatus(unknownRes, [400, 404], 'farmers/upgrade unknown farmerCode');

      const unhiredRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/upgrade', {
        farmerCode: first.farmerCode,
      });
      assertErrorStatus(unhiredRes, [400, 404], 'farmers/upgrade un-hired farmerCode');
    },
  },
  {
    id: 'T2-F8-02',
    tier: 2,
    feature: 'F8',
    name: 'POST /farmers/upgrade rejects upgrading Lv 20 farmer beyond max cap (400)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 30,
        azitXp: xpForLevel(30),
        points: 200000,
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 30)[0];
      assert.ok(first);

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      const lv20 = await upgradeFarmerToLevel(user.client, first.farmerCode, 20);
      assert.equal(lv20.level, 20);
      assert.equal(lv20.upgradeCost, null);

      const overRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/upgrade', {
        farmerCode: first.farmerCode,
      });
      assertErrorStatus(overRes, 400, 'farmers/upgrade Lv 20 -> 21');
    },
  },
  {
    id: 'T2-F8-03',
    tier: 2,
    feature: 'F8',
    name: 'POST /farmers/upgrade with upgradeCost-1 points returns 400 and preserves level & points',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 5000,
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 20)[0];
      assert.ok(first);

      const hiredRes = await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      const farmer = hiredRes.state.farmers![0];
      const cost = farmer.upgradeCost!;
      assert.ok(cost > 0);

      ctx.db.seedUserPoints(user.userId, cost - 1);
      const poorRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/upgrade', {
        farmerCode: first.farmerCode,
      });
      assertErrorStatus(poorRes, 400, 'farmers/upgrade upgradeCost-1');

      const after = await fetchAzitState(user.client);
      assert.equal(after.veraPoints, cost - 1);
      assert.equal(after.farmers![0].level, 1);
    },
  },
  {
    id: 'T2-F8-04',
    tier: 2,
    feature: 'F8',
    name: 'Grade 1 never harvests mature plots and Grade 2 never plants empty plots during catch-up',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 100000,
        crops: { 'crop-carrot': { seedQty: 5 } },
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
          { plotIndex: 1, cropId: null, stage: 0, isUnlocked: 1 },
        ],
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 25)[0];
      assert.ok(first);

      const hiredRes = await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        autoEnabled: true,
        preferredCropId: 'crop-carrot',
      });

      // Grade 1 tick should NOT harvest plot 0 or plant plot 1
      ctx.db.backdateFarmerTick(
        user.userId,
        first.farmerCode,
        Date.now() - hiredRes.state.farmers![0].workIntervalMs * 3
      );
      const s1 = await fetchAzitState(user.client);
      assert.equal(s1.garden.plots[0].stage, 3, 'Grade 1 must NOT harvest mature plot 0');
      assert.equal(s1.garden.plots[1].stage, 0, 'Grade 1 must NOT plant empty plot 1');

      // Upgrade to Grade 2 (Lv 5): harvests plot 0, but still must NOT plant empty plots
      const lv5 = await upgradeFarmerToLevel(user.client, first.farmerCode, 5);
      ctx.db.backdateFarmerTick(
        user.userId,
        first.farmerCode,
        Date.now() - lv5.workIntervalMs * 3
      );
      const s2 = await fetchAzitState(user.client);
      assert.equal(s2.garden.plots[0].stage, 0, 'Grade 2 should harvest mature plot 0');
      assert.equal(s2.garden.plots[1].stage, 0, 'Grade 2 must NOT plant empty plot 1');
      assert.equal(s2.garden.seedCounts['crop-carrot'], 5);
    },
  },
  {
    id: 'T2-F8-05',
    tier: 2,
    feature: 'F8',
    name: 'Grade 3 farmer never consumes fertilizer even when autoFertilize=true',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 100000,
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
      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 2,
      });

      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 25)[0];
      assert.ok(first);

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      const lv10 = await upgradeFarmerToLevel(user.client, first.farmerCode, 10);
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        autoEnabled: true,
        autoFertilize: true,
      });

      ctx.db.backdateFarmerTick(
        user.userId,
        first.farmerCode,
        Date.now() - lv10.workIntervalMs * 3
      );
      const after = await fetchAzitState(user.client);
      assert.equal(after.garden.fertilizerCounts['fert-basic'], 2);
      assert.equal(after.garden.plots[0].fertilizerUsedCount, 0);
    },
  },

  // ==================== F9: Farmer Automation & Config Boundaries (5) ====================
  {
    id: 'T2-F9-01',
    tier: 2,
    feature: 'F9',
    name: 'autoEnabled=false blocks catch-up automation and farmerLogs even after 24h backdate',
    run: async (ctx) => {
      const pastMs = Date.now() - 60_000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 10000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
        ],
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 25)[0];
      assert.ok(first);

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        autoEnabled: false,
      });

      ctx.db.backdateFarmerTick(
        user.userId,
        first.farmerCode,
        Date.now() - 24 * 60 * 60 * 1000
      );
      const after = await fetchAzitState(user.client);
      assert.equal(after.garden.plots[0].stage, 1);
      assert.equal(after.farmers![0].totalWatered, 0);
      assert.equal(after.farmerLogs?.length ?? 0, 0);
    },
  },
  {
    id: 'T2-F9-02',
    tier: 2,
    feature: 'F9',
    name: 'Grade 3 farmer with preferredCropId=null or 0 seeds skips auto-plant cleanly',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 100000,
        crops: { 'crop-carrot': { seedQty: 0 } },
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 25)[0];
      assert.ok(first);

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      const lv10 = await upgradeFarmerToLevel(user.client, first.farmerCode, 10);

      // preferredCropId: null
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        autoEnabled: true,
        preferredCropId: null,
      });
      ctx.db.backdateFarmerTick(user.userId, first.farmerCode, Date.now() - lv10.workIntervalMs * 2);
      const s1 = await fetchAzitState(user.client);
      assert.equal(s1.garden.plots[0].stage, 0);

      // preferredCropId with 0 seeds
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        autoEnabled: true,
        preferredCropId: 'crop-carrot',
      });
      ctx.db.backdateFarmerTick(user.userId, first.farmerCode, Date.now() - lv10.workIntervalMs * 2);
      const s2 = await fetchAzitState(user.client);
      assert.equal(s2.garden.plots[0].stage, 0);
      assert.equal(s2.garden.seedCounts['crop-carrot'], 0);
    },
  },
  {
    id: 'T2-F9-03',
    tier: 2,
    feature: 'F9',
    name: 'Grade 4 farmer with autoFertilize=true skips fertilizing when 0 qty, max-used (4), or mature plot',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 30,
        azitXp: xpForLevel(30),
        points: 200000,
        plots: [
          {
            plotIndex: 0,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: futureMs,
            fertilizerUsedCount: MAX_FERTILIZER_PER_CROP,
            isUnlocked: 1,
          },
          {
            plotIndex: 1,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: futureMs,
            fertilizerUsedCount: 0,
            isUnlocked: 1,
          },
          {
            plotIndex: 2,
            cropId: 'crop-carrot',
            stage: 3,
            waterCount: 3,
            fertilizerUsedCount: 0,
            isUnlocked: 1,
          },
        ],
      });

      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 30)[0];
      assert.ok(first);

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      const lv15 = await upgradeFarmerToLevel(user.client, first.farmerCode, 15);
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        autoEnabled: true,
        autoFertilize: true,
      });

      // 1) 0 fertilizer inventory -> cooldown plot 1 stays unfertilized (used=0), plot 2 harvested
      ctx.db.backdateFarmerTick(user.userId, first.farmerCode, Date.now() - lv15.workIntervalMs * 2);
      const s1 = await fetchAzitState(user.client);
      assert.equal(s1.garden.plots[0].fertilizerUsedCount, MAX_FERTILIZER_PER_CROP);
      assert.equal(s1.garden.plots[1].fertilizerUsedCount, 0);
      assert.equal(s1.garden.plots[1].nextWaterAtMs, futureMs);
      assert.equal(s1.garden.plots[2].stage, 0);

      // 2) Clear plot 1 so only plot 0 (used=4) and empty plot 2 exist; buy 1 fertilizer -> must NOT be consumed
      await postAzitAction(user.client, '/api/azit-game/garden/clear', { plotIndex: 1 });
      await postAzitAction(user.client, '/api/azit-game/garden/fertilizer/buy', {
        fertilizerId: 'fert-basic',
        quantity: 1,
      });
      ctx.db.backdateFarmerTick(user.userId, first.farmerCode, Date.now() - lv15.workIntervalMs * 2);
      const s2 = await fetchAzitState(user.client);
      assert.equal(s2.garden.fertilizerCounts['fert-basic'], 1);
      assert.equal(s2.garden.plots[0].fertilizerUsedCount, MAX_FERTILIZER_PER_CROP);
    },
  },
  {
    id: 'T2-F9-04',
    tier: 2,
    feature: 'F9',
    name: 'POST /farmers/config rejects un-hired/unknown farmerCode and invalid preferredCropId (400/404)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 10000,
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 25)[0];
      assert.ok(first);

      const unhiredRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        autoEnabled: false,
      });
      assertErrorStatus(unhiredRes, [400, 404], 'farmers/config un-hired');

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });

      const badCropRes = await user.client.post<ApiEnvelope>('/api/azit-game/farmers/config', {
        farmerCode: first.farmerCode,
        preferredCropId: 'crop-not-real',
      });
      assertErrorStatus(badCropRes, 400, 'farmers/config invalid preferredCropId');
    },
  },
  {
    id: 'T2-F9-05',
    tier: 2,
    feature: 'F9',
    name: 'Extreme 7-day last_auto_tick_ms backdate is bounded/capped without stalling or overflowing logs',
    run: async (ctx) => {
      const pastMs = Date.now() - 60_000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 100000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
        ],
      });
      const state0 = await fetchAzitState(user.client);
      const first = pickEligibleFarmers(state0, 25)[0];
      assert.ok(first);

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: first.farmerCode,
      });
      await upgradeFarmerToLevel(user.client, first.farmerCode, 10);

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      ctx.db.backdateFarmerTick(user.userId, first.farmerCode, sevenDaysAgo);

      const t0 = Date.now();
      const state = await fetchAzitState(user.client);
      const elapsed = Date.now() - t0;

      assert.ok(elapsed < 5000, `Expected bounded catch-up < 5000ms, took ${elapsed}ms`);
      assert.ok((state.farmerLogs ?? []).length <= 30);
    },
  },
];
