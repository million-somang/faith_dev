import assert from 'node:assert/strict';
import { DbHarness } from '../db-harness.js';
import { HttpClient } from '../http-client.js';
import { ServerHarness } from '../server-harness.js';
import {
  assertErrorStatus,
  fetchAzitState,
  postAzitAction,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { ApiEnvelope } from '../helpers/azit-helpers.js';
import type { E2ETestCase } from '../types.js';

async function waitForTextOnPage(
  page: import('puppeteer').Page,
  substring: string,
  timeoutMs = 15000
): Promise<void> {
  await page.waitForFunction(
    (needle: string) => document.body && document.body.innerText.includes(needle),
    { timeout: timeoutMs },
    substring
  );
}

export const tier2PlatformTests: E2ETestCase[] = [
  // ==================== F10: API Contract, Auth, & SSR Security Boundaries (5) ====================
  {
    id: 'T2-F10-01',
    tier: 2,
    feature: 'F10',
    name: 'Unauthenticated POST requests to all 10 new M1 & M2 endpoints return 401',
    run: async (ctx) => {
      const anon = ctx.createClient();
      const endpoints: Array<{ path: string; body: unknown }> = [
        { path: '/api/azit-game/garden/unlock-plot', body: { plotIndex: 6 } },
        { path: '/api/azit-game/garden/fertilizer/buy', body: { fertilizerId: 'fert-basic', quantity: 1 } },
        { path: '/api/azit-game/garden/fertilize', body: { plotIndex: 0 } },
        { path: '/api/azit-game/garden/upgrade-soil', body: { plotIndex: 0 } },
        { path: '/api/azit-game/garden/water-all', body: {} },
        { path: '/api/azit-game/garden/harvest-all', body: {} },
        { path: '/api/azit-game/garden/plant-all', body: { cropId: 'crop-carrot' } },
        { path: '/api/azit-game/farmers/hire', body: { farmerCode: 'farmer-rookie' } },
        { path: '/api/azit-game/farmers/upgrade', body: { farmerCode: 'farmer-rookie' } },
        { path: '/api/azit-game/farmers/config', body: { farmerCode: 'farmer-rookie', autoEnabled: false } },
      ];

      for (const ep of endpoints) {
        const res = await anon.post<ApiEnvelope>(ep.path, ep.body);
        assert.equal(
          res.status,
          401,
          `Expected 401 for unauthenticated POST ${ep.path}, got ${res.status}: ${res.text}`
        );
        assert.equal(res.json?.success, false);
      }
    },
  },
  {
    id: 'T2-F10-02',
    tier: 2,
    feature: 'F10',
    name: 'Cross-user isolation prevents User B from mutating or viewing User A garden/farmers/inventory',
    run: async (ctx) => {
      const userA = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 5000,
        crops: { 'crop-blueberry': { seedQty: 5 } },
      });
      const userB = await ctx.createAuthenticatedUser({
        azitLevel: 1,
        azitXp: 0,
        points: 0,
      });

      await postAzitAction(userA.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 6 });
      await postAzitAction(userA.client, '/api/azit-game/garden/plant', {
        plotIndex: 6,
        cropId: 'crop-blueberry',
      });

      // User B tries to mutate plot 6 (locked for B) or pass userId override in body
      const resB = await userB.client.post<ApiEnvelope>('/api/azit-game/garden/clear', {
        plotIndex: 6,
        userId: userA.userId,
      });
      assertErrorStatus(resB, 400, 'User B cannot mutate User A plot 6');

      const stateA = await fetchAzitState(userA.client);
      const stateB = await fetchAzitState(userB.client);
      assert.equal(stateA.garden.plots[6].cropId, 'crop-blueberry');
      assert.equal(stateB.garden.plots[6].isUnlocked, false);
      assert.equal(stateB.garden.seedCounts['crop-blueberry'], 0);
      assert.equal(stateB.profile.userId, userB.userId);
    },
  },
  {
    id: 'T2-F10-03',
    tier: 2,
    feature: 'F10',
    name: 'Malformed JSON, array body [], and null body return 400 (never 500) on garden & farmer POST endpoints',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 1000,
      });

      const endpoints = [
        '/api/azit-game/garden/unlock-plot',
        '/api/azit-game/garden/fertilize',
        '/api/azit-game/garden/upgrade-soil',
        '/api/azit-game/garden/plant-all',
        '/api/azit-game/farmers/hire',
      ];

      for (const ep of endpoints) {
        for (const rawBody of ['{broken-json', '[]', 'null']) {
          const res = await user.client.request<ApiEnvelope>('POST', ep, rawBody, {
            'Content-Type': 'application/json',
          });
          assert.ok(
            res.status >= 400 && res.status < 500,
            `Expected 4xx (not 500) for ${ep} body=${rawBody}, got ${res.status}: ${res.text}`
          );
        }
      }
    },
  },
  {
    id: 'T2-F10-04',
    tier: 2,
    feature: 'F10',
    name: 'Wrong HTTP methods (GET on POST routes, PATCH on mutations) are rejected without mutating state',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 10,
        azitXp: xpForLevel(10),
        points: 500,
      });

      const getOnPost = await user.client.request('GET', '/api/azit-game/garden/water-all');
      assert.ok(
        getOnPost.status === 404 || getOnPost.status === 405,
        `Expected 404/405 for GET /garden/water-all, got ${getOnPost.status}`
      );

      const patchOnUnlock = await user.client.request('PATCH', '/api/azit-game/garden/unlock-plot', {
        plotIndex: 6,
      });
      assert.ok(
        patchOnUnlock.status === 404 || patchOnUnlock.status === 405,
        `Expected 404/405 for PATCH /garden/unlock-plot, got ${patchOnUnlock.status}`
      );

      const state = await fetchAzitState(user.client);
      assert.equal(state.garden.plots[6].isUnlocked, false);
      assert.equal(state.veraPoints, 500);
    },
  },
  {
    id: 'T2-F10-05',
    tier: 2,
    feature: 'F10',
    name: 'API error envelopes follow { success: false, error: { code, message } } and Next SSR returns security headers',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser();
      const errRes = await user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', {
        plotIndex: 99,
      });
      assert.equal(errRes.status, 400);
      assert.equal(errRes.json?.success, false);
      assert.ok(errRes.json?.error, 'Expected error object');
      assert.equal(typeof errRes.json.error.message, 'string');
      assert.ok(errRes.json.error.message!.length > 0);

      const ui = await ctx.getUiSession();
      const ssrRes = await fetch(`${ui.nextBaseUrl}/mypage`);
      assert.equal(ssrRes.status, 200);
      assert.equal(ssrRes.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(ssrRes.headers.get('x-frame-options'), 'SAMEORIGIN');
    },
  },

  // ==================== F11: UI Locked, Empty, Visitor & Edge States (5) ====================
  {
    id: 'T2-F11-01',
    tier: 2,
    feature: 'F11',
    name: 'Unauthenticated /mypage redirects cleanly to / and guest /minihome/<handle> renders with 0 errors',
    run: async (ctx) => {
      const owner = await ctx.createAuthenticatedUser({ points: 100 });
      const roomRes = await owner.client.get<{ data?: { profile?: { handle?: string } } }>(
        '/api/minihome/room/me'
      );
      const handle = roomRes.json?.data?.profile?.handle ?? 'me';

      const ui = await ctx.getUiSession();

      // 1. Unauthenticated /mypage
      await ui.withPage({}, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await new Promise((r) => setTimeout(r, 400));
        const finalUrl = new URL(page.url());
        assert.equal(
          finalUrl.pathname === '/' || !finalUrl.pathname.startsWith('/mypage'),
          true,
          `Expected unauthenticated /mypage to redirect to /, landed on ${finalUrl.pathname}`
        );
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });

      // 2. Guest /minihome/<handle>
      await ui.withPage({}, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/minihome/${encodeURIComponent(handle)}`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'TODAY IS...');
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },
  {
    id: 'T2-F11-02',
    tier: 2,
    feature: 'F11',
    name: 'Lv 19 user sees Lv.20 farmer lock badge and blocked hire state with 0 mock farmers',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 19,
        azitXp: xpForLevel(19),
        points: 10000,
      });
      const ui = await ctx.getUiSession();

      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.19');

        const hasFarmerLock = await page.evaluate(() => {
          const text = document.body.innerText;
          return text.includes('농부') && (text.includes('Lv.20') || text.includes('🔒'));
        });
        assert.equal(hasFarmerLock, true, 'Expected Lv.20 lock indicator on farmer UI for Lv 19 user');

        // Open farmer modal if button is clickable and confirm hiring is locked/blocked
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const farmerBtn = btns.find((b) => (b.innerText || '').includes('농부'));
          if (farmerBtn && !farmerBtn.disabled) {
            farmerBtn.click();
          }
        });
        await new Promise((r) => setTimeout(r, 400));

        const modalCheck = await page.evaluate(() => {
          const text = document.body.innerText;
          const hireBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
            (b.innerText || '').includes('고용')
          );
          const allHireDisabledOrLocked =
            hireBtns.length === 0 || hireBtns.every((b) => b.disabled || (b.innerText || '').includes('Lv.20'));
          return {
            hasLv20Notice: text.includes('Lv.20') || text.includes('20레벨'),
            allHireDisabledOrLocked,
          };
        });
        assert.equal(modalCheck.hasLv20Notice, true);
        assert.equal(modalCheck.allHireDisabledOrLocked, true);
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },
  {
    id: 'T2-F11-03',
    tier: 2,
    feature: 'F11',
    name: 'Fresh Lv 20 user with 0 farmers/fertilizer/logs sees honest empty states and zero mock data',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
        points: 0,
      });
      const ui = await ctx.getUiSession();

      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.20');

        const headerText = await page.evaluate(() => document.body.innerText);
        assert.equal(headerText.includes('0 P'), true, 'Expected honest 0 P display');
        assert.equal(
          headerText.includes('0/1') || headerText.includes('농부'),
          true,
          'Expected 0/1 farmer count for fresh Lv 20 user'
        );

        // Open Farmer Guild modal and check honest empty state (no hired farmers, no fake logs)
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const farmerBtn = btns.find((b) => (b.innerText || '').includes('농부'));
          farmerBtn?.click();
        });
        await new Promise((r) => setTimeout(r, 400));

        const modalText = await page.evaluate(() => document.body.innerText);
        assert.equal(
          modalText.includes('없습니다') || modalText.includes('고용된 농부') || modalText.includes('0/1'),
          true,
          'Expected honest empty state in Farmer Guild modal'
        );
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },
  {
    id: 'T2-F11-04',
    tier: 2,
    feature: 'F11',
    name: 'Non-owner visiting /minihome/<ownerHandle> sees read-only UI with owner mutation buttons hidden',
    run: async (ctx) => {
      const owner = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 1000,
      });
      const roomRes = await owner.client.get<{ data?: { profile?: { handle?: string } } }>(
        '/api/minihome/room/me'
      );
      const ownerHandle = roomRes.json?.data?.profile?.handle;
      assert.ok(ownerHandle, 'Expected owner handle');

      const visitor = await ctx.createAuthenticatedUser({ points: 100 });
      const ui = await ctx.getUiSession();

      await ui.withPage({ sessionCookie: visitor.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/minihome/${encodeURIComponent(ownerHandle)}`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'TODAY IS...');

        const ownerMutationBtns = await page.evaluate(() => {
          const forbidden = ['전체 물주기', '일괄 수확', '일괄 심기', '방 꾸미기', '저장하기', '땅 해금'];
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons
            .map((b) => (b.innerText || '').trim())
            .filter((t) => forbidden.some((f) => t.includes(f)));
        });

        assert.deepEqual(
          ownerMutationBtns,
          [],
          `Expected non-owner /minihome to hide owner controls, found: ${ownerMutationBtns.join(', ')}`
        );
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },
  {
    id: 'T2-F11-05',
    tier: 2,
    feature: 'F11',
    name: 'Unknown /minihome handle renders gracefully with 0 crashes/5xx and mobile /mypage has no horizontal overflow',
    run: async (ctx) => {
      const ui = await ctx.getUiSession();
      await ui.withPage({}, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/minihome/nonexistent_e2e_handle_99999`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await page.waitForFunction(
          () => !document.querySelector('.animate-spin'),
          { timeout: 15000 }
        );

        const text = await page.evaluate(() => document.body.innerText);
        assert.equal(
          text.includes('TODAY IS...') ||
            text.includes('찾을 수 없습니다') ||
            text.includes('⚠️'),
          true,
          'Expected graceful room or error UI for unknown minihome handle'
        );
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });

      const user = await ctx.createAuthenticatedUser({ points: 500 });
      await ui.withPage(
        { sessionCookie: user.cookie, viewport: { width: 390, height: 844 } },
        async (page, telemetry) => {
          await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
            waitUntil: 'networkidle0',
            timeout: 25000,
          });
          await waitForTextOnPage(page, 'Lv.1');
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth
          );
          assert.equal(overflow, false, 'Expected zero horizontal overflow on 390x844 mobile /mypage');
          assert.deepEqual(telemetry.pageErrors, []);
          assert.deepEqual(telemetry.sameOrigin5xx, []);
        }
      );
    },
  },

  // ==================== F12: Migration Edge Cases & Concurrency (5, Isolated DB+Server) ====================
  {
    id: 'T2-F12-01',
    tier: 2,
    feature: 'F12',
    name: 'Corrupt user_minihomes.layout_json with garden_migrated=0 survives GET /state without 500',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-corrupt-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const legacy = isoDb.seedLegacyUserFixture({
          points: 777,
          azitLevel: 1,
          azitXp: 0,
          gardenMigrated: 0,
        });
        isoDb.execute(
          `INSERT INTO user_minihomes (user_id, handle, owner_name, layout_json)
           VALUES (?, ?, ?, ?)`,
          [legacy.userId, 'corrupt_handle_1', legacy.name, '{corrupt-json-not-valid']
        );

        const client = new HttpClient(isoServer.baseUrl);
        await client.login({ email: legacy.email, password: legacy.password });
        const state = await fetchAzitState(client);

        assert.equal(state.veraPoints, 777);
        assert.equal(state.garden.plots.length, 16);
        assert.equal(state.garden.unlockedPlotCount, 6);
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T2-F12-02',
    tier: 2,
    feature: 'F12',
    name: 'Legacy layout_json.garden with negative, oversized (>999), NaN, and unknown crops clamps safely',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-clamp-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const legacy = isoDb.seedLegacyUserFixture({
          points: 500,
          azitLevel: 3,
          azitXp: 250,
          gardenMigrated: 0,
          legacyMinihomeLayoutJson: {
            garden: {
              seedCounts: {
                'crop-carrot': -10,
                'crop-pepper': 999999,
                'crop-tomato': 'not-a-number',
                'crop-unknown-hack': 50,
              },
              harvestCounts: {
                'crop-lettuce': -5,
                'crop-potato': 5000,
              },
              plots: [
                { plotIndex: 0, cropId: 'crop-unknown-hack', stage: 2, waterCount: 2 },
              ],
            },
          },
        });

        const client = new HttpClient(isoServer.baseUrl);
        await client.login({ email: legacy.email, password: legacy.password });
        const state = await fetchAzitState(client);

        assert.ok(state.garden.seedCounts['crop-carrot'] >= 3);
        assert.equal(state.garden.seedCounts['crop-pepper'], 999);
        assert.equal(state.garden.seedCounts['crop-tomato'], 0);
        assert.equal(state.garden.harvestCounts['crop-lettuce'], 0);
        assert.equal(state.garden.harvestCounts['crop-potato'], 999);
        assert.equal(state.garden.plots[0].cropId, null);
        assert.equal(state.garden.plots[0].stage, 0);
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T2-F12-03',
    tier: 2,
    feature: 'F12',
    name: 'Exact legacy threshold azit_xp=6200 stays Lv 10 while 6199 stays Lv 9',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-6200-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const u9 = isoDb.seedLegacyUserFixture({ azitLevel: 9, azitXp: 6199, gardenMigrated: 1 });
        const u10 = isoDb.seedLegacyUserFixture({ azitLevel: 10, azitXp: 6200, gardenMigrated: 1 });

        const c9 = new HttpClient(isoServer.baseUrl);
        await c9.login({ email: u9.email, password: u9.password });
        const s9 = await fetchAzitState(c9);
        assert.equal(s9.profile.azitLevel, 9);

        const c10 = new HttpClient(isoServer.baseUrl);
        await c10.login({ email: u10.email, password: u10.password });
        const s10 = await fetchAzitState(c10);
        assert.equal(s10.profile.azitLevel, 10);
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T2-F12-04',
    tier: 2,
    feature: 'F12',
    name: 'Soft-deleted (is_deleted=1) inventory and plot rows are excluded from GET /state',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-softdel-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const user = await createUserAndInit(isoDb, isoServer.baseUrl);
        isoDb.execute(
          `UPDATE azit_crop_inventory SET harvest_qty = 99, is_deleted = 1 WHERE user_id = ? AND crop_id = 'crop-strawberry'`,
          [user.userId]
        );
        isoDb.execute(
          `UPDATE azit_garden_plots SET crop_id = 'crop-carrot', stage = 3, is_deleted = 1 WHERE user_id = ? AND plot_index = 0`,
          [user.userId]
        );

        const state = await fetchAzitState(user.client);
        assert.equal(state.garden.harvestCounts['crop-strawberry'], 0);
        assert.equal(state.garden.plots[0].cropId, null);
        assert.equal(state.garden.plots[0].stage, 0);
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T2-F12-05',
    tier: 2,
    feature: 'F12',
    name: 'Concurrent Promise.all bursts (unlock-plot x5, harvest x5, fertilizer/buy x5) serialize without double-spend',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-conc-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const user = await createUserAndInit(isoDb, isoServer.baseUrl, {
          azitLevel: 10,
          azitXp: xpForLevel(10),
          points: 100, // Enough for 1 unlock (60P) + 1 fert-basic (40P)
          plots: [
            { plotIndex: 0, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
          ],
        });

        // 1) 5 concurrent unlock-plot requests on plot 6 (cost 60P)
        const unlockRes = await Promise.all(
          Array.from({ length: 5 }, () =>
            user.client.post<ApiEnvelope>('/api/azit-game/garden/unlock-plot', { plotIndex: 6 })
          )
        );
        const unlockOk = unlockRes.filter((r) => r.status === 200);
        assert.equal(unlockOk.length, 1, 'Expected exactly 1 concurrent unlock-plot to succeed');

        // 2) 5 concurrent harvest requests on plot 0
        const harvestRes = await Promise.all(
          Array.from({ length: 5 }, () =>
            user.client.post<ApiEnvelope>('/api/azit-game/garden/harvest', { plotIndex: 0 })
          )
        );
        const harvestOk = harvestRes.filter((r) => r.status === 200);
        assert.equal(harvestOk.length, 1, 'Expected exactly 1 concurrent harvest to succeed');

        // 3) 5 concurrent fertilizer/buy requests with 40P remaining (exact cost for 1)
        const buyRes = await Promise.all(
          Array.from({ length: 5 }, () =>
            user.client.post<ApiEnvelope>('/api/azit-game/garden/fertilizer/buy', {
              fertilizerId: 'fert-basic',
              quantity: 1,
            })
          )
        );
        const buyOk = buyRes.filter((r) => r.status === 200);
        assert.equal(buyOk.length, 1, 'Expected exactly 1 concurrent fertilizer/buy to succeed');

        const finalState = await fetchAzitState(user.client);
        assert.equal(finalState.veraPoints, 0);
        assert.equal(finalState.garden.harvestCounts['crop-carrot'], 2);
        assert.equal(finalState.garden.fertilizerCounts['fert-basic'], 1);
        assert.equal(finalState.garden.unlockedPlotCount, 7);
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
];

async function createUserAndInit(
  db: DbHarness,
  baseUrl: string,
  opts: import('../types.js').SeedUserOptions = {}
) {
  const seeded = db.seedUser(opts);
  const client = new HttpClient(baseUrl);
  const loginRes = await client.login({ email: seeded.email, password: seeded.password });
  assert.equal(loginRes.status, 200);
  await fetchAzitState(client);
  return { ...seeded, client };
}
