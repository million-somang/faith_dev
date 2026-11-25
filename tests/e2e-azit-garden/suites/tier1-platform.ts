import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DbHarness } from '../db-harness.js';
import { createAuthenticatedUser, HttpClient } from '../http-client.js';
import { runNextTypecheck } from '../next-harness.js';
import { ServerHarness } from '../server-harness.js';
import {
  assertErrorStatus,
  clickAndWaitForApiResponse,
  clickButtonByText,
  fetchAzitState,
  getExpeditionZones,
  getServerNowMs,
  postAzitAction,
  unlockedPlotsSeed,
  waitForTextOnPage,
  xpForLevel,
} from '../helpers/azit-helpers.js';
import type { E2ETestCase } from '../types.js';

export const tier1PlatformTests: E2ETestCase[] = [
  // ==================== F10: Frontend Types, Hooks & Dynamic Coordinates (5) ====================
  {
    id: 'T1-F10-01',
    tier: 1,
    feature: 'F10',
    name: 'apps/next-portal passes tsc --noEmit and has valid .next build artifacts',
    run: async (ctx) => {
      const tc = await runNextTypecheck(ctx.repoRoot);
      assert.equal(
        tc.ok,
        true,
        `Expected apps/next-portal tsc --noEmit exit 0, got ${tc.exitCode}:\n${tc.output}`
      );

      const nextDir = path.join(ctx.repoRoot, 'apps', 'next-portal', '.next');
      assert.equal(fs.existsSync(path.join(nextDir, 'BUILD_ID')), true, 'Missing .next/BUILD_ID');
      assert.equal(
        fs.existsSync(path.join(nextDir, 'routes-manifest.json')),
        true,
        'Missing .next/routes-manifest.json'
      );
    },
  },
  {
    id: 'T1-F10-02',
    tier: 1,
    feature: 'F10',
    name: 'GET /api/azit-game/state fulfills AzitFullGameState profile/limits/clock/catalog contract',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 1000,
      });
      const state = await fetchAzitState(user.client);

      const nowMs = getServerNowMs(state);
      assert.ok(nowMs > 1_700_000_000_000, `Expected valid epoch ms, got ${nowMs}`);
      assert.equal(state.profile.azitLevel, 25);
      assert.equal(typeof state.profile.limits.maxGardenPlots, 'number');
      assert.equal(typeof state.profile.limits.unlockedPlots, 'number');
      assert.equal(typeof state.profile.limits.maxFarmers, 'number');
      assert.equal(state.catalog.levels.length, 50);
      assert.ok(getExpeditionZones(state).length > 0);
    },
  },
  {
    id: 'T1-F10-03',
    tier: 1,
    feature: 'F10',
    name: 'GET /api/azit-game/state exposes 16 plots (0..15), fertilizerCounts, and full M1/M2 catalogs',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 20,
        azitXp: xpForLevel(20),
      });
      const state = await fetchAzitState(user.client);

      assert.equal(state.garden.plots.length, 16);
      assert.deepEqual(
        state.garden.plots.map((p) => p.plotIndex),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
      );
      assert.equal(state.garden.maxPlotCount, 16);
      assert.equal(state.garden.unlockedPlotCount, 6);
      assert.equal(typeof state.garden.fertilizerCounts['fert-basic'], 'number');
      assert.equal(typeof state.garden.fertilizerCounts['fert-rapid'], 'number');
      assert.equal(state.catalog.crops.length, 12);
      assert.equal(state.catalog.fertilizers.length, 2);
      assert.equal(state.catalog.soilLevels.length, 6);
      assert.equal(state.catalog.plotUnlocks.length, 16);
      assert.equal(state.catalog.recipes.length, 14);
      assert.ok(Array.isArray(state.catalog.farmers) && state.catalog.farmers.length > 0);
    },
  },
  {
    id: 'T1-F10-04',
    tier: 1,
    feature: 'F10',
    name: 'Browser hydrates Lv 50 user with 16 unlocked plots (plot 15 crop-moonfruit) and hired farmer cleanly',
    run: async (ctx) => {
      const plots = unlockedPlotsSeed(16);
      plots[15] = {
        plotIndex: 15,
        isUnlocked: 1,
        soilLevel: 3,
        cropId: 'crop-moonfruit',
        stage: 2,
        waterCount: 2,
        nextWaterAtMs: Date.now() + 3600_000,
      };
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 50,
        azitXp: xpForLevel(50),
        points: 10000,
        plots,
      });

      const state = await fetchAzitState(user.client);
      const firstFarmer = state.catalog.farmers?.[0];
      assert.ok(firstFarmer, 'Expected at least 1 farmer in catalog.farmers');
      await postAzitAction(user.client, '/api/azit-game/farmers/hire', {
        farmerCode: firstFarmer.farmerCode,
      });

      const ui = await ctx.getUiSession();
      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.50');

        const pageInfo = await page.evaluate(() => {
          const text = document.body.innerText;
          const html = document.body.innerHTML;
          return {
            hasLv50: text.includes('Lv.50'),
            has16PlotsInfo: text.includes('16/16') || text.includes('16칸') || html.includes('달빛'),
            hasMoonEmojiOrLabel: html.includes('🌙') || text.includes('달빛'),
          };
        });

        assert.equal(pageInfo.hasLv50, true, 'Expected Lv.50 rendered in UI');
        assert.equal(
          pageInfo.has16PlotsInfo || pageInfo.hasMoonEmojiOrLabel,
          true,
          'Expected 16-plot / moonfruit UI rendering after hydration'
        );
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
        assert.deepEqual(telemetry.sameOriginConsoleErrors, []);
      });
    },
  },
  {
    id: 'T1-F10-05',
    tier: 1,
    feature: 'F10',
    name: 'Fertilized plot with <1h remaining nextWaterAtMs reflects shortened countdown in live browser UI',
    run: async (ctx) => {
      const remainMs = 25 * 60 * 1000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 10,
        azitXp: xpForLevel(10),
        points: 500,
        plots: [
          {
            plotIndex: 0,
            isUnlocked: 1,
            cropId: 'crop-carrot',
            stage: 1,
            waterCount: 1,
            nextWaterAtMs: Date.now() + remainMs,
            fertilizerUsedCount: 1,
          },
        ],
      });

      const ui = await ctx.getUiSession();
      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.10');

        const countdownPattern = '(?:2[0-6]분|0시간\\s*2[0-6]분|00:2[0-6](?::\\d{2})?)';
        let foundCountdown = false;
        try {
          await page.waitForFunction(
            (pattern: string) => {
              const combined = document.body.innerText + '\n' + document.body.innerHTML;
              return new RegExp(pattern).test(combined);
            },
            { timeout: 3500 },
            countdownPattern
          );
          foundCountdown = true;
        } catch {
          // If M4 moved countdown into plot action bubble, open plot 0 bubble and re-check
          const openedBubble = await page.evaluate(() => {
            const plotEl = document.querySelector('[data-garden-plot="0"]');
            if (!plotEl) return false;
            plotEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return true;
          });
          if (openedBubble) {
            await page.waitForFunction(
              (pattern: string) => {
                const combined = document.body.innerText + '\n' + document.body.innerHTML;
                return new RegExp(pattern).test(combined);
              },
              { timeout: 5000 },
              countdownPattern
            );
            foundCountdown = true;
          }
        }

        assert.equal(
          foundCountdown,
          true,
          'Expected shortened ~25m countdown (HH:MM:SS / 20-26분) in rendered garden UI'
        );
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },

  // ==================== F11: Garden & Azit Production UI Integration (5) ====================
  {
    id: 'T1-F11-01',
    tier: 1,
    feature: 'F11',
    name: 'Authenticated Lv 1 user /mypage renders Lv.1, starter/locked plot indicators, and zero console/5xx errors',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({ points: 500 });
      const ui = await ctx.getUiSession();

      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.1');

        const content = await page.evaluate(() => document.body.innerText + '\n' + document.body.innerHTML);
        assert.equal(content.includes('Lv.1'), true);
        assert.equal(content.includes('🔒') || content.includes('잠금'), true);
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
        assert.deepEqual(telemetry.sameOriginConsoleErrors, []);
      });
    },
  },
  {
    id: 'T1-F11-02',
    tier: 1,
    feature: 'F11',
    name: 'Lv 25 user unlocks plot 6 via /mypage UI and change persists in SQLite across reload',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 5000,
      });
      const ui = await ctx.getUiSession();

      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.25');

        let unlockFired = false;
        const unlockResPromise = page
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
        unlockResPromise.catch(() => undefined);

        // Click unlock button/element for plot 6 (labeled #7 / 7번 / 해금 / 확장)
        const triggered = await page.evaluate(() => {
          const candidates = Array.from(document.querySelectorAll('button, [role="button"], g'));
          const unlockBtn = candidates.find((el) => {
            const txt = (el.textContent || '').trim();
            return txt.includes('해금') || txt.includes('확장') || txt.includes('60P');
          });
          if (!unlockBtn) return false;
          (unlockBtn as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return true;
        });
        assert.equal(triggered, true, 'Expected unlock control in Lv 25 garden UI');

        // If a confirmation bubble/button opened without firing POST yet, click confirm 해금 button
        if (!unlockFired) {
          try {
            await page.waitForFunction(
              () =>
                Array.from(document.querySelectorAll('button')).some(
                  (btn) => !btn.disabled && (btn.innerText || btn.textContent || '').includes('해금')
                ),
              { timeout: 1500 }
            );
            if (!unlockFired) {
              await clickButtonByText(page, '해금');
            }
          } catch {
            // Confirm button did not appear; wait on unlockResPromise
          }
        }

        const unlockRes = await unlockResPromise;
        assert.equal(
          unlockRes.status(),
          200,
          `Expected POST /api/azit-game/garden/unlock-plot 200, got ${unlockRes.status()}`
        );

        await page.waitForFunction(
          () => /7\s*\/\s*16/.test(document.body.innerText),
          { timeout: 10000 }
        );

        const row = ctx.db.queryOne<{ is_unlocked: number }>(
          'SELECT is_unlocked FROM azit_garden_plots WHERE user_id = ? AND plot_index = 6',
          [user.userId]
        );
        assert.equal(row?.is_unlocked, 1, 'Expected plot 6 unlocked in SQLite after UI action');

        await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
        await waitForTextOnPage(page, 'Lv.25');
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },
  {
    id: 'T1-F11-03',
    tier: 1,
    feature: 'F11',
    name: 'Lv 25 user opens Farmer Guild modal from header badge, hires a farmer, and persists across reload',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 25,
        azitXp: xpForLevel(25),
        points: 10000,
      });
      const ui = await ctx.getUiSession();

      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.25');

        const opened = await clickButtonByText(page, '농부');
        assert.equal(opened, true, 'Expected 농부 button in AzitLevelHeaderBadge');

        await waitForTextOnPage(page, '고용');
        const hired = await clickButtonByText(page, '고용');
        assert.equal(hired, true, 'Expected 고용 button inside Farmer Guild modal');

        await page.waitForFunction(
          () => document.body.innerText.includes('1/1') || document.body.innerText.includes('Lv.1'),
          { timeout: 10000 }
        );

        const farmerRows = ctx.db.queryAll(
          'SELECT farmer_code FROM azit_farmers WHERE user_id = ? AND is_deleted = 0',
          [user.userId]
        );
        assert.equal(farmerRows.length, 1, 'Expected 1 hired farmer persisted in azit_farmers');

        await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
        await waitForTextOnPage(page, 'Lv.25');
        const headerText = await page.evaluate(() => document.body.innerText);
        assert.equal(headerText.includes('1/1'), true, 'Expected 1/1 farmer badge after reload');
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },
  {
    id: 'T1-F11-04',
    tier: 1,
    feature: 'F11',
    name: 'Bulk toolbar buttons (일괄 심기 / 전체 물주기 / 일괄 수확) mutate live state via UI',
    run: async (ctx) => {
      const pastMs = Date.now() - 60_000;
      const user = await ctx.createAuthenticatedUser({
        azitLevel: 10,
        azitXp: xpForLevel(10),
        points: 1000,
        crops: { 'crop-carrot': { seedQty: 5 } },
        plots: [
          { plotIndex: 0, cropId: 'crop-carrot', stage: 1, waterCount: 1, nextWaterAtMs: pastMs, isUnlocked: 1 },
          { plotIndex: 1, cropId: 'crop-carrot', stage: 3, waterCount: 3, isUnlocked: 1 },
        ],
      });
      const ui = await ctx.getUiSession();

      await ui.withPage({ sessionCookie: user.cookie }, async (page, telemetry) => {
        await page.goto(`${ui.nextBaseUrl}/mypage?section=dashboard&zone=garden`, {
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        await waitForTextOnPage(page, 'Lv.10');

        await clickAndWaitForApiResponse(
          page,
          '/api/azit-game/garden/water-all',
          () => clickButtonByText(page, '전체 물주기')
        );

        await clickAndWaitForApiResponse(
          page,
          '/api/azit-game/garden/harvest-all',
          () => clickButtonByText(page, '일괄 수확')
        );

        let plantAllFired = false;
        const plantAllResPromise = page
          .waitForResponse(
            (res) =>
              res.url().includes('/api/azit-game/garden/plant-all') &&
              res.request().method() === 'POST',
            { timeout: 10000 }
          )
          .then((res) => {
            plantAllFired = true;
            return res;
          });
        plantAllResPromise.catch(() => undefined);

        const clickedPlantAll = await clickButtonByText(page, '일괄 심기');
        assert.equal(clickedPlantAll, true, 'Expected 일괄 심기 button in bulk toolbar');

        if (!plantAllFired) {
          try {
            await page.waitForFunction(
              () =>
                Array.from(document.querySelectorAll('button')).some(
                  (btn) => !btn.disabled && (btn.innerText || btn.textContent || '').includes('당근')
                ),
              { timeout: 1500 }
            );
            if (!plantAllFired) {
              await clickButtonByText(page, '당근');
            }
          } catch {
            // Direct plant-all without seed picker popover; await plantAllResPromise
          }
        }

        const plantAllRes = await plantAllResPromise;
        assert.equal(
          plantAllRes.status(),
          200,
          `Expected POST /api/azit-game/garden/plant-all 200, got ${plantAllRes.status()}`
        );

        const plot0 = ctx.db.queryOne<{ stage: number }>(
          'SELECT stage FROM azit_garden_plots WHERE user_id = ? AND plot_index = 0',
          [user.userId]
        );
        const plot1 = ctx.db.queryOne<{ stage: number; crop_id: string | null }>(
          'SELECT stage, crop_id FROM azit_garden_plots WHERE user_id = ? AND plot_index = 1',
          [user.userId]
        );
        const carrotInv = ctx.db.queryOne<{ harvest_qty: number }>(
          'SELECT harvest_qty FROM azit_crop_inventory WHERE user_id = ? AND crop_id = ?',
          [user.userId, 'crop-carrot']
        );
        assert.equal(plot0?.stage, 2, 'Expected plot 0 watered to stage 2 via 전체 물주기');
        assert.ok(plot1, 'Expected plot 1 row');
        assert.equal(plot1.stage, 1, 'Expected plot 1 replanted to stage 1 via 일괄 심기');
        assert.equal(
          plot1.crop_id,
          'crop-carrot',
          'Expected plot 1 planted with crop-carrot via 일괄 심기'
        );
        assert.ok(
          (carrotInv?.harvest_qty ?? 0) >= 2,
          `Expected harvest_qty >= 2 after 일괄 수확, got ${carrotInv?.harvest_qty}`
        );
        assert.deepEqual(telemetry.pageErrors, []);
        assert.deepEqual(telemetry.sameOrigin5xx, []);
      });
    },
  },
  {
    id: 'T1-F11-05',
    tier: 1,
    feature: 'F11',
    name: '/mypage and /minihome/<handle> maintain PortalNavbar max-w-6xl mx-auto px-3 sm:px-4 width parity on desktop & mobile',
    run: async (ctx) => {
      const user = await ctx.createAuthenticatedUser({ points: 500 });
      await user.client.get('/api/minihome/room/me');
      const roomRes = await user.client.get<{ success?: boolean; data?: { profile?: { handle?: string } } }>(
        '/api/minihome/room/me'
      );
      const handle = roomRes.json?.data?.profile?.handle ?? 'me';

      const ui = await ctx.getUiSession();
      for (const viewport of [
        { width: 1280, height: 800 },
        { width: 390, height: 844 },
      ]) {
        for (const route of ['/mypage', `/minihome/${encodeURIComponent(handle)}`]) {
          await ui.withPage({ sessionCookie: user.cookie, viewport }, async (page, telemetry) => {
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
              if (!nav || !pageContainer) {
                return { found: false as const };
              }
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
                `${route} (${viewport.width}px): horizontal overflow scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`
              );
              assert.equal(metrics.pageClass.includes('px-3'), true);
              assert.equal(metrics.pageClass.includes('sm:px-4'), true);
            }
            assert.deepEqual(telemetry.pageErrors, []);
            assert.deepEqual(telemetry.sameOrigin5xx, []);
          });
        }
      }
    },
  },

  // ==================== F12: Non-Destructive Migration (5, Isolated DB+Server) ====================
  {
    id: 'T1-F12-01',
    tier: 1,
    feature: 'F12',
    name: 'Pre-M1 azit_profiles and azit_garden_plots evolve via ALTER TABLE preserving points, seeds & harvests',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-01-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const legacy = isoDb.seedLegacyUserFixture({
          points: 4321,
          azitLevel: 5,
          azitXp: 820,
          gardenMigrated: 1,
          crops: {
            'crop-strawberry': { seedQty: 7, harvestQty: 11 },
          },
          plots: [
            { plotIndex: 0, cropId: 'crop-carrot', stage: 2, waterCount: 2, plantedAt: '2026-10-01T00:00:00.000Z', lastWateredAt: '2026-10-01T00:00:00.000Z' },
          ],
        });

        const client = new HttpClient(isoServer.baseUrl);
        const loginRes = await client.login({ email: legacy.email, password: legacy.password });
        assert.equal(loginRes.status, 200);

        const state = await fetchAzitState(client);
        assert.equal(state.veraPoints, 4321);
        assert.equal(state.garden.seedCounts['crop-strawberry'], 7);
        assert.equal(state.garden.harvestCounts['crop-strawberry'], 11);
        assert.equal(state.garden.plots.length, 16);
        assert.equal(state.garden.plots[0].isUnlocked, true);
        assert.equal(state.garden.plots[0].cropId, 'crop-carrot');
        assert.equal(state.garden.plots[6].isUnlocked, false);
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T1-F12-02',
    tier: 1,
    feature: 'F12',
    name: 'Legacy Lv 10 user with 8300 XP (>6200) syncs to Lv 11 while preserving plots 0..5 and adding locked 6..15',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-02-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const legacy = isoDb.seedLegacyUserFixture({
          points: 2000,
          azitLevel: 10,
          azitXp: 8300,
          gardenMigrated: 1,
          plots: [
            { plotIndex: 0, cropId: 'crop-tomato', stage: 3, waterCount: 3 },
            { plotIndex: 1, cropId: 'crop-potato', stage: 1, waterCount: 1, lastWateredAt: '2026-10-01T00:00:00.000Z' },
            { plotIndex: 2, cropId: null, stage: 0, waterCount: 0 },
            { plotIndex: 3, cropId: 'crop-lettuce', stage: 2, waterCount: 2, lastWateredAt: '2026-10-01T00:00:00.000Z' },
            { plotIndex: 4, cropId: null, stage: 0, waterCount: 0 },
            { plotIndex: 5, cropId: 'crop-pepper', stage: 3, waterCount: 3 },
          ],
        });

        const client = new HttpClient(isoServer.baseUrl);
        await client.login({ email: legacy.email, password: legacy.password });
        const state = await fetchAzitState(client);

        assert.equal(state.profile.azitLevel, 11);
        assert.equal(state.profile.azitXp, 8300);
        assert.equal(state.garden.plots[0].cropId, 'crop-tomato');
        assert.equal(state.garden.plots[0].stage, 3);
        assert.equal(state.garden.plots[5].cropId, 'crop-pepper');
        for (let i = 0; i < 6; i += 1) {
          assert.equal(state.garden.plots[i].isUnlocked, true);
        }
        for (let i = 6; i < 16; i += 1) {
          assert.equal(state.garden.plots[i].isUnlocked, false);
        }
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T1-F12-03',
    tier: 1,
    feature: 'F12',
    name: 'Legacy user_minihomes.layout_json.garden (garden_migrated=0) migrates once without overwriting room furniture',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-03-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const legacy = isoDb.seedLegacyUserFixture({
          points: 1500,
          azitLevel: 4,
          azitXp: 500,
          gardenMigrated: 0,
          legacyMinihomeHandle: 'legacy_room_keep',
          legacyMinihomeLayoutJson: {
            furniture: [{ id: 'sofa-01', x: 3, y: 4 }],
            theme: 'cozy-wood',
            garden: {
              seedCounts: { 'crop-tomato': 5 },
              harvestCounts: { 'crop-potato': 9 },
              plots: [
                { plotIndex: 0, cropId: 'crop-tomato', stage: 2, waterCount: 2 },
              ],
            },
          },
        });

        const client = new HttpClient(isoServer.baseUrl);
        await client.login({ email: legacy.email, password: legacy.password });
        const state = await fetchAzitState(client);

        assert.equal(state.garden.seedCounts['crop-tomato'], 5);
        assert.equal(state.garden.harvestCounts['crop-potato'], 9);
        assert.equal(state.garden.plots[0].cropId, 'crop-tomato');
        assert.equal(state.garden.plots[0].stage, 2);

        const roomRow = isoDb.queryOne<{ layout_json: string }>(
          'SELECT layout_json FROM user_minihomes WHERE user_id = ?',
          [legacy.userId]
        );
        const parsed = JSON.parse(roomRow!.layout_json) as {
          theme?: string;
          furniture?: Array<{ id: string }>;
        };
        assert.equal(parsed.theme, 'cozy-wood');
        assert.equal(parsed.furniture?.[0]?.id, 'sofa-01');
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T1-F12-04',
    tier: 1,
    feature: 'F12',
    name: 'Repeated GET /api/azit-game/state after migration is idempotent and preserves mutations',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-04-');
      isoDb.initializeBaseline();
      const isoServer = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });

      try {
        await isoServer.start();
        const legacy = isoDb.seedLegacyUserFixture({
          points: 1000,
          azitLevel: 5,
          azitXp: xpForLevel(5),
          gardenMigrated: 0,
          legacyMinihomeLayoutJson: {
            garden: {
              harvestCounts: { 'crop-carrot': 4 },
            },
          },
        });

        const client = new HttpClient(isoServer.baseUrl);
        await client.login({ email: legacy.email, password: legacy.password });

        const s1 = await fetchAzitState(client);
        assert.equal(s1.garden.harvestCounts['crop-carrot'], 4);

        await postAzitAction(client, '/api/azit-game/crops/sell', {
          cropId: 'crop-carrot',
          quantity: 4,
        });

        const s2 = await fetchAzitState(client);
        const s3 = await fetchAzitState(client);
        assert.equal(s2.garden.harvestCounts['crop-carrot'], 0);
        assert.equal(s3.garden.harvestCounts['crop-carrot'], 0);
        assert.equal(s3.veraPoints, 1000 + 32);
      } finally {
        await isoServer.stop();
        await isoDb.cleanup();
      }
    },
  },
  {
    id: 'T1-F12-05',
    tier: 1,
    feature: 'F12',
    name: 'Expanded plots, fertilizer inventory, soil levels, and Lv 20+ crops persist across ServerHarness restart',
    run: async (ctx) => {
      const isoDb = new DbHarness('e2e-azit-f12-05-');
      isoDb.initializeBaseline();
      const server1 = new ServerHarness({ repoRoot: ctx.repoRoot, dbPath: isoDb.dbPath });
      let email = '';
      let password = '';

      try {
        try {
          await server1.start();
          const s1 = await createAuthenticatedUser(isoDb, server1.baseUrl, {
            azitLevel: 25,
            azitXp: xpForLevel(25),
            points: 5000,
          });
          email = s1.email;
          password = s1.password;

          await postAzitAction(s1.client, '/api/azit-game/garden/unlock-plot', { plotIndex: 6 });
          await postAzitAction(s1.client, '/api/azit-game/garden/upgrade-soil', { plotIndex: 6 });
          await postAzitAction(s1.client, '/api/azit-game/garden/fertilizer/buy', {
            fertilizerId: 'fert-basic',
            quantity: 3,
          });
          await postAzitAction(s1.client, '/api/azit-game/garden/buy-seed', {
            cropId: 'crop-blueberry',
            quantity: 2,
          });
          await postAzitAction(s1.client, '/api/azit-game/garden/plant', {
            plotIndex: 6,
            cropId: 'crop-blueberry',
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
          assert.equal(state2.garden.unlockedPlotCount, 7);
          assert.equal(state2.garden.plots[6].isUnlocked, true);
          assert.equal(state2.garden.plots[6].soilLevel, 1);
          assert.equal(state2.garden.plots[6].cropId, 'crop-blueberry');
          assert.equal(state2.garden.fertilizerCounts['fert-basic'], 3);
          assert.equal(state2.garden.seedCounts['crop-blueberry'], 1);
        } finally {
          await server2.stop();
        }
      } finally {
        await isoDb.cleanup();
      }
    },
  },
];

// Keep unused import lint-free if assertErrorStatus needed in extensions
void assertErrorStatus;
