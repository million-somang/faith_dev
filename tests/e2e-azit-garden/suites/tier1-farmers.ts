import assert from 'node:assert/strict';
import { DbHarness } from '../db-harness.js';
import { createAuthenticatedUser, HttpClient } from '../http-client.js';
import { ServerHarness } from '../server-harness.js';
import {
  GARDEN_HARVEST_AZIT_XP,
  GARDEN_WATER_COOLDOWN_MS,
  fetchAzitState,
  getFarmerCatalog,
  pickEligibleFarmers,
  postAzitAction,
  unlockedPlotsSeed,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { E2ETestCase } from '../types.js';
import type {
  AzitStatePayload,
  FarmerCatalogItem,
  OwnedFarmerPayload,
} from '../helpers/azit-helpers.js';

async function hireFirstEligibleFarmer(
  userClient: ReturnType<typeof Object>,
  azitLevel: number
): Promise<{ farmerDef: FarmerCatalogItem; hired: OwnedFarmerPayload; state: AzitStatePayload }> {
  const client = userClient as import('../types.js').HttpClientLike;
  const initialState = await fetchAzitState(client);
  const eligible = pickEligibleFarmers(initialState, azitLevel);
  assert.ok(eligible.length >= 1, `Expected at least 1 eligible farmer at Lv ${azitLevel}`);
  const farmerDef = eligible[0];

  const res = await postAzitAction(client, '/api/azit-game/farmers/hire', {
    farmerCode: farmerDef.farmerCode,
  });
  const hired = (res.state.farmers ?? []).find((f) => f.farmerCode === farmerDef.farmerCode);
  assert.ok(hired, `Expected hired farmer ${farmerDef.farmerCode} in state.farmers`);
  return { farmerDef, hired, state: res.state };
}

async function upgradeFarmerToLevel(
  client: import('../types.js').HttpClientLike,
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

export const tier1FarmerTests: E2ETestCase[] = [
  // ==================== F7: Farmer Employment (Lv 20+ Gate) (5) ====================
  {
    id: 'T1-F7-01',
    tier: 1,
    feature: 'F7',
    name: 'Lv 20 GET /state exposes catalog.farmers, empty farmers/farmerLogs, and maxFarmers=1',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 5000,
      });

      const state = await fetchAzitState(user.client);
      assert.equal(state.profile.azitLevel, 20);
      assert.equal(state.profile.limits.maxFarmers, 1);
      assert.ok(Array.isArray(state.farmers), 'Expected state.farmers array');
      assert.equal(state.farmers.length, 0);
      assert.ok(Array.isArray(state.farmerLogs), 'Expected state.farmerLogs array');
      assert.equal(state.farmerLogs.length, 0);

      const catalogFarmers = getFarmerCatalog(state);
      assert.ok(catalogFarmers.length >= 2, 'Expected >= 2 farmer definitions in catalog.farmers');
    },
  },
  {
    id: 'T1-F7-02',
    tier: 1,
    feature: 'F7',
    name: 'Lv 20 user hires 1st farmer via POST /farmers/hire, deducting hireCost and persisting in azit_farmers',
    run: async (ctx) => {
      const initialPoints = 5000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: initialPoints,
      });

      const { farmerDef, hired, state } = await hireFirstEligibleFarmer(user.client, 20);
      assert.equal(state.veraPoints, initialPoints - farmerDef.hireCost);
      assert.equal(state.farmers?.length, 1);
      assert.equal(hired.farmerCode, farmerDef.farmerCode);

      const dbRow = ctx.db.queryOne<{ farmer_code: string; level: number; grade: number; is_deleted: number }>(
        'SELECT farmer_code, level, grade, is_deleted FROM azit_farmers WHERE user_id = ? AND farmer_code = ?',
        [user.userId, farmerDef.farmerCode]
      );
      assert.ok(dbRow, 'Expected row in azit_farmers');
      assert.equal(dbRow.is_deleted, 0);
      assert.equal(dbRow.level, 1);
      assert.equal(dbRow.grade, 1);
    },
  },
  {
    id: 'T1-F7-03',
    tier: 1,
    feature: 'F7',
    name: 'Lv 35 user (maxFarmers=2) hires 2 distinct farmers from catalog.farmers',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 35,
        azitXp: xpForLevel(35),
        points: 20000,
      });

      const state0 = await fetchAzitState(user.client);
      assert.equal(state0.profile.limits.maxFarmers, 2);
      const eligible = pickEligibleFarmers(state0, 35);
      assert.ok(eligible.length >= 2, 'Expected >= 2 eligible farmers at Lv 35');

      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: eligible[0].farmerCode,
      });
      const res2 = await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: eligible[1].farmerCode,
      });

      assert.equal(res2.state.farmers?.length, 2);
      const codes = new Set(res2.state.farmers?.map((f) => f.farmerCode));
      assert.equal(codes.has(eligible[0].farmerCode), true);
      assert.equal(codes.has(eligible[1].farmerCode), true);
      assert.equal(res2.state.veraPoints, 20000 - eligible[0].hireCost - eligible[1].hireCost);
    },
  },
  {
    id: 'T1-F7-04',
    tier: 1,
    feature: 'F7',
    name: 'Newly hired Grade 1 Lv 1 farmer has expected initial roles, interval (90s..120s), and reduction (2..6%)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 5000,
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 20);
      assert.equal(hired.grade, 1);
      assert.equal(hired.level, 1);
      assert.equal(hired.autoEnabled, true);
      assert.deepEqual(hired.roles, ['water']);
      assert.ok(
        hired.workIntervalMs >= 90_000 && hired.workIntervalMs <= 120_000,
        `Expected Grade 1 workIntervalMs in 90000..120000, got ${hired.workIntervalMs}`
      );
      assert.ok(
        hired.waterCooldownReductionPct >= 2 && hired.waterCooldownReductionPct <= 6,
        `Expected Grade 1 waterCooldownReductionPct in 2..6, got ${hired.waterCooldownReductionPct}`
      );
      assert.ok(typeof hired.upgradeCost === 'number' && hired.upgradeCost > 0);
    },
  },
  {
    id: 'T1-F7-05',
    tier: 1,
    feature: 'F7',
    name: 'Hired farmer and config persist in azit_farmers across full ServerHarness restart',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-farmer-persist-');
      isoDb.initializeBaseline();
      const server1 = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });
      let email = '';
      let password = '';
      let hiredCode = '';

      try {
        try {
          await server1.start();
          const session1 = await createAuthenticatedUser(isoDb, server1.baseUrl, {
            azitLevel: 25,
            azitXp: xpForLevel(25),
            points: 10000,
          });
          email = session1.email;
          password = session1.password;

          const { farmerDef } = await hireFirstEligibleFarmer(session1.client, 25);
          hiredCode = farmerDef.farmerCode;

          await postAzitAction(session1.client, '/api/azit-game/farmers/config', {
            farmerCode: hiredCode,
            autoEnabled: false,
            preferredCropId: 'crop-blueberry',
            autoFertilize: true,
          });
        } finally {
          await server1.stop();
        }

        const server2 = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });
        try {
          await server2.start();
          const client2 = new HttpClient(server2.baseUrl);
          const loginRes = await client2.login({ email, password });
          assert.equal(loginRes.status, 200);

          const state2 = await fetchAzitState(client2);
          const farmer = (state2.farmers ?? []).find((f) => f.farmerCode === hiredCode);
          assert.ok(farmer, 'Expected hired farmer to persist across server restart');
          assert.equal(farmer.autoEnabled, false);
          assert.equal(farmer.preferredCropId, 'crop-blueberry');
          assert.equal(farmer.autoFertilize, true);
        } finally {
          await server2.stop();
        }
      } finally {
        await isoDb.cleanup();
      }
    },
  },

  // ==================== F8: Farmer Growth, Grades, Speed & Role Scope (5) ====================
  {
    id: 'T1-F8-01',
    tier: 1,
    feature: 'F8',
    name: 'POST /farmers/upgrade trains farmer Lv 1->4, deducting points and speeding up workIntervalMs',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 30000,
      });

      const { hired: lv1 } = await hireFirstEligibleFarmer(user.client, 20);
      const lv4 = await upgradeFarmerToLevel(user.client, lv1.farmerCode, 4);

      assert.equal(lv4.level, 4);
      assert.equal(lv4.grade, 1);
      assert.deepEqual(lv4.roles, ['water']);
      assert.ok(
        lv4.workIntervalMs < lv1.workIntervalMs,
        `Expected Lv 4 workIntervalMs (${lv4.workIntervalMs}) < Lv 1 (${lv1.workIntervalMs})`
      );
      assert.ok(
        lv4.waterCooldownReductionPct > lv1.waterCooldownReductionPct,
        `Expected Lv 4 reduction (${lv4.waterCooldownReductionPct}) > Lv 1 (${lv1.waterCooldownReductionPct})`
      );
    },
  },
  {
    id: 'T1-F8-02',
    tier: 1,
    feature: 'F8',
    name: 'Upgrading farmer to Lv 5 unlocks Grade 2 (harvest role, 50s..75s interval, 8..14% reduction)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 50000,
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 20);
      const lv5 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 5);

      assert.equal(lv5.level, 5);
      assert.equal(lv5.grade, 2);
      assert.ok(lv5.roles.includes('water') && lv5.roles.includes('harvest'));
      assert.equal(lv5.roles.includes('plant'), false);
      assert.ok(
        lv5.workIntervalMs >= 50_000 && lv5.workIntervalMs <= 75_000,
        `Expected Grade 2 workIntervalMs in 50000..75000, got ${lv5.workIntervalMs}`
      );
      assert.ok(
        lv5.waterCooldownReductionPct >= 8 && lv5.waterCooldownReductionPct <= 14,
        `Expected Grade 2 reduction in 8..14, got ${lv5.waterCooldownReductionPct}`
      );
    },
  },
  {
    id: 'T1-F8-03',
    tier: 1,
    feature: 'F8',
    name: 'Upgrading farmer to Lv 10 unlocks Grade 3 (plant role, 25s..40s interval, 15..22% reduction)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 100000,
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 25);
      const lv10 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 10);

      assert.equal(lv10.level, 10);
      assert.equal(lv10.grade, 3);
      assert.ok(
        lv10.roles.includes('water') &&
          lv10.roles.includes('harvest') &&
          lv10.roles.includes('plant')
      );
      assert.equal(lv10.roles.includes('fertilize'), false);
      assert.ok(
        lv10.workIntervalMs >= 25_000 && lv10.workIntervalMs <= 40_000,
        `Expected Grade 3 workIntervalMs in 25000..40000, got ${lv10.workIntervalMs}`
      );
      assert.ok(
        lv10.waterCooldownReductionPct >= 15 && lv10.waterCooldownReductionPct <= 22,
        `Expected Grade 3 reduction in 15..22, got ${lv10.waterCooldownReductionPct}`
      );
    },
  },
  {
    id: 'T1-F8-04',
    tier: 1,
    feature: 'F8',
    name: 'Upgrading farmer to Lv 15..20 unlocks Grade 4 (fertilize role, 10s..20s interval, Lv 20 upgradeCost=null)',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 30,
        azitXp: xpForLevel(30),
        points: 200000,
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 30);
      const lv15 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 15);
      assert.equal(lv15.grade, 4);
      assert.ok(
        lv15.roles.includes('water') &&
          lv15.roles.includes('harvest') &&
          lv15.roles.includes('plant') &&
          lv15.roles.includes('fertilize')
      );
      assert.ok(
        lv15.workIntervalMs >= 10_000 && lv15.workIntervalMs <= 20_000,
        `Expected Grade 4 workIntervalMs in 10000..20000, got ${lv15.workIntervalMs}`
      );
      assert.ok(
        lv15.waterCooldownReductionPct >= 24 && lv15.waterCooldownReductionPct <= 30,
        `Expected Grade 4 reduction in 24..30, got ${lv15.waterCooldownReductionPct}`
      );

      const lv20 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 20);
      assert.equal(lv20.level, 20);
      assert.equal(lv20.grade, 4);
      assert.equal(lv20.workIntervalMs, 10_000);
      assert.equal(lv20.waterCooldownReductionPct, 30);
      assert.equal(lv20.upgradeCost, null);
    },
  },
  {
    id: 'T1-F8-05',
    tier: 1,
    feature: 'F8',
    name: 'Automated farmer work awards farmer XP and progresses level/xp in azit_farmers',
    run: async (ctx) => {
      const pastMs = Date.now() - 3_600_000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 5000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
          { plotIndex: 2, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
        ],
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 20);
      ctx.db.backdateFarmerTick(user.userId, hired.farmerCode, Date.now() - hired.workIntervalMs * 4);

      const state = await fetchAzitState(user.client);
      const updated = (state.farmers ?? []).find((f) => f.farmerCode === hired.farmerCode)!;
      assert.ok(
        updated.xp > 0 || updated.level > 1,
        `Expected farmer XP > 0 or level > 1 after automated work, got lv=${updated.level} xp=${updated.xp}`
      );
    },
  },

  // ==================== F9: Server-Side Farmer Automation & Logs (5) ====================
  {
    id: 'T1-F9-01',
    tier: 1,
    feature: 'F9',
    name: 'Grade 1 lazy catch-up waters cooldown-ready plot, increments totalWatered, and records water log',
    run: async (ctx) => {
      const pastMs = Date.now() - 3_600_000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 5000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
        ],
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 20);
      ctx.db.backdateFarmerTick(user.userId, hired.farmerCode, Date.now() - hired.workIntervalMs * 2);

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.plots[0].stage, 2, 'Expected Grade 1 farmer to water plot 0 to stage 2');
      assert.equal(state.garden.plots[0].waterCount, 2);

      const updatedFarmer = (state.farmers ?? []).find((f) => f.farmerCode === hired.farmerCode)!;
      assert.ok(updatedFarmer.totalWatered >= 1);

      const waterLog = (state.farmerLogs ?? []).find(
        (l) => l.farmerCode === hired.farmerCode && l.actionType === 'water' && l.plotIndex === 0
      );
      assert.ok(waterLog, 'Expected water action entry in state.farmerLogs');
    },
  },
  {
    id: 'T1-F9-02',
    tier: 1,
    feature: 'F9',
    name: 'Grade 2 catch-up auto-harvests stage-3 plot with soil bonus, Azit XP, and harvest log',
    run: async (ctx) => {
      const baseXp = xpForLevel(20);
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: baseXp,
        points: 50000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1, soilLevel: 2 },
        ],
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 20);
      const lv5 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 5);
      ctx.db.backdateFarmerTick(user.userId, lv5.farmerCode, Date.now() - lv5.workIntervalMs * 2);

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.plots[0].stage, 0, 'Expected Grade 2 farmer to harvest mature plot 0');
      assert.equal(state.garden.plots[0].cropId, null);
      assert.ok(
        state.garden.harvestCounts['crop-carrot'] >= 3,
        `Expected soil Lv 2 harvest yield >= 3, got ${state.garden.harvestCounts['crop-carrot']}`
      );
      assert.equal(state.profile.azitXp, baseXp + GARDEN_HARVEST_AZIT_XP);

      const updatedFarmer = (state.farmers ?? []).find((f) => f.farmerCode === lv5.farmerCode)!;
      assert.ok(updatedFarmer.totalHarvested >= 1);
      const harvestLog = (state.farmerLogs ?? []).find(
        (l) => l.farmerCode === lv5.farmerCode && l.actionType === 'harvest' && l.plotIndex === 0
      );
      assert.ok(harvestLog, 'Expected harvest action entry in state.farmerLogs');
    },
  },
  {
    id: 'T1-F9-03',
    tier: 1,
    feature: 'F9',
    name: 'Grade 3 farmer configured with preferredCropId auto-plants empty plot using owned seeds',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 100000,
        crops: { 'crop-blueberry': { seedQty: 3 } },
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 25);
      const lv10 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 10);
      await postAzitAction(user.client, '/api/azit-game/farmers/config', {
        farmerCode: lv10.farmerCode,
        autoEnabled: true,
        preferredCropId: 'crop-blueberry',
      });

      ctx.db.backdateFarmerTick(user.userId, lv10.farmerCode, Date.now() - lv10.workIntervalMs - 1000);

      const state = await fetchAzitState(user.client);
      const updatedFarmer = (state.farmers ?? []).find((f) => f.farmerCode === lv10.farmerCode)!;
      assert.ok(updatedFarmer.totalPlanted >= 1);
      assert.equal(state.garden.plots[0].cropId, 'crop-blueberry');
      assert.equal(state.garden.plots[0].stage, 1);
      assert.equal(state.garden.seedCounts['crop-blueberry'], 3 - updatedFarmer.totalPlanted);

      const plantLog = (state.farmerLogs ?? []).find(
        (l) => l.farmerCode === lv10.farmerCode && l.actionType === 'plant'
      );
      assert.ok(plantLog, 'Expected plant action entry in state.farmerLogs');
    },
  },
  {
    id: 'T1-F9-04',
    tier: 1,
    feature: 'F9',
    name: 'Grade 4 farmer with autoFertilize=true consumes fertilizer on cooldown plot and logs fertilize',
    run: async (ctx) => {
      const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 30,
        azitXp: xpForLevel(30),
        points: 200000,
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: futureMs, isUnlocked: 1 },
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

      ctx.db.backdateFarmerTick(user.userId, lv15.farmerCode, Date.now() - lv15.workIntervalMs - 1000);

      const state = await fetchAzitState(user.client);
      assert.ok(
        state.garden.plots[0].fertilizerUsedCount >= 1,
        'Expected Grade 4 farmer to fertilize cooldown plot 0'
      );
      assert.ok(
        (state.garden.plots[0].nextWaterAtMs ?? Infinity) < futureMs,
        'Expected nextWaterAtMs to decrease after auto-fertilize'
      );
      assert.equal(
        state.garden.fertilizerCounts['fert-basic'],
        2 - state.garden.plots[0].fertilizerUsedCount
      );

      const fertLog = (state.farmerLogs ?? []).find(
        (l) => l.farmerCode === lv15.farmerCode && l.actionType === 'fertilize'
      );
      assert.ok(fertLog, 'Expected fertilize action entry in state.farmerLogs');
    },
  },
  {
    id: 'T1-F9-05',
    tier: 1,
    feature: 'F9',
    name: 'farmerLogs caps at <= 30 recent entries and farmer watering applies waterCooldownReductionPct',
    run: async (ctx) => {
      const pastMs = Date.now() - 3_600_000;
      const allUnlockedPlots = unlockedPlotsSeed(16).map((p) => ({
        ...p,
        cropId: 'crop-carrot',
        stage: 1,
        waterCount: 1,
        nextWaterAtMs: pastMs,
      }));
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 200000,
        plots: allUnlockedPlots,
      });

      const { hired } = await hireFirstEligibleFarmer(user.client, 50);
      const lv15 = await upgradeFarmerToLevel(user.client, hired.farmerCode, 15);

      // Batch 1: 16 plots stage 1 -> stage 2 (generates 16 water logs + reduced nextWaterAtMs)
      ctx.db.backdateFarmerTick(
        user.userId,
        lv15.farmerCode,
        Date.now() - lv15.workIntervalMs * 20
      );
      const midState = await fetchAzitState(user.client);
      const plot0NextWater = midState.garden.plots[0].nextWaterAtMs!;
      const expectedReducedMax =
        Date.now() +
        GARDEN_WATER_COOLDOWN_MS * (1 - lv15.waterCooldownReductionPct / 100) +
        15_000;
      assert.ok(
        plot0NextWater <= expectedReducedMax,
        `Expected farmer water cooldown reduction (${lv15.waterCooldownReductionPct}%), got nextWaterAtMs=${plot0NextWater} > ${expectedReducedMax}`
      );

      // Batch 2: Backdate all 16 plots again so farmer waters stage 2 -> stage 3 (16 more logs = 32 total)
      const past2 = Date.now() - 3_600_000;
      for (let i = 0; i < 16; i += 1) {
        ctx.db.backdatePlotTimers(user.userId, i, { nextWaterAtMs: past2 });
      }
      ctx.db.backdateFarmerTick(
        user.userId,
        lv15.farmerCode,
        Date.now() - lv15.workIntervalMs * 20
      );
      const finalState = await fetchAzitState(user.client);

      assert.equal(
        (finalState.farmerLogs ?? []).length,
        30,
        `Expected farmerLogs capped at exactly 30 entries after >30 actions, got ${(finalState.farmerLogs ?? []).length}`
      );
      const updatedFarmer = (finalState.farmers ?? []).find(
        (f) => f.farmerCode === lv15.farmerCode
      )!;
      assert.ok(
        updatedFarmer.totalWatered >= 20 && updatedFarmer.totalHarvested >= 5,
        `Expected totalWatered >= 20 and totalHarvested >= 5, got watered=${updatedFarmer.totalWatered} harvested=${updatedFarmer.totalHarvested}`
      );
    },
  },
];
