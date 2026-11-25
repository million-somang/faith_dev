import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DbHarness } from '../db-harness.js';
import { createAuthenticatedUser, HttpClient } from '../http-client.js';
import { ServerHarness } from '../server-harness.js';
import type { E2ETestCase } from '../types.js';

interface HealthPayload {
  status?: string;
  db?: string;
}

interface AzitStateEnvelope {
  success?: boolean;
  data?: {
    profile?: Record<string, unknown>;
    veraPoints?: number;
    garden?: {
      plots?: unknown[];
    };
    catalog?: Record<string, unknown>;
    serverNowMs?: number;
    nowMs?: number;
  };
}

export const smokeTests: E2ETestCase[] = [
  {
    id: 'SMOKE-01',
    tier: 'smoke',
    name: 'Ephemeral server boots cleanly with all 29 SQLite migrations applied and /health OK',
    run: async (ctx) => {
      const client = ctx.createClient();
      const healthRes = await client.get<HealthPayload>('/health');
      assert.equal(healthRes.status, 200, `Expected /health 200, got ${healthRes.status}`);
      assert.equal(healthRes.json?.status, 'ok');
      assert.equal(healthRes.json?.db, 'connected');

      const migrationRow = ctx.db.queryOne<{ cnt: number }>(
        'SELECT COUNT(*) AS cnt FROM migrations_history'
      );
      assert.ok(migrationRow, 'Expected migrations_history table to exist');
      assert.equal(
        migrationRow.cnt,
        29,
        `Expected all 29 migrations applied in temp DB, got ${migrationRow.cnt}`
      );
    },
  },
  {
    id: 'SMOKE-02',
    tier: 'smoke',
    name: 'Unauthenticated GET /api/azit-game/state returns 401',
    run: async (ctx) => {
      const client = ctx.createClient();
      const res = await client.get<{ success?: boolean }>('/api/azit-game/state');
      assert.equal(res.status, 401, `Expected 401 for unauthenticated request, got ${res.status}`);
      assert.equal(res.json?.success, false);
    },
  },
  {
    id: 'SMOKE-03',
    tier: 'smoke',
    name: 'Disposable user signup and seeded user login authenticate with session_id cookie',
    run: async (ctx) => {
      const signupUser = await ctx.createAuthenticatedUser({ viaSignup: true });
      assert.ok(
        signupUser.cookie.startsWith('session_id='),
        `Expected session_id cookie from signup, got: ${signupUser.cookie}`
      );
      const signupCheck = await signupUser.client.get<{
        success?: boolean;
        loggedIn?: boolean;
        user?: { id?: number; email?: string };
      }>('/api/auth/check');
      assert.equal(signupCheck.status, 200);
      assert.equal(signupCheck.json?.success, true);
      assert.equal(signupCheck.json?.loggedIn, true);
      assert.equal(signupCheck.json?.user?.id, signupUser.userId);

      const loginUser = await ctx.createAuthenticatedUser({
        viaSignup: false,
        points: 500,
      });
      assert.ok(
        loginUser.cookie.startsWith('session_id='),
        `Expected session_id cookie from login, got: ${loginUser.cookie}`
      );
      const loginCheck = await loginUser.client.get<{
        success?: boolean;
        loggedIn?: boolean;
        user?: { id?: number; email?: string };
      }>('/api/auth/check');
      assert.equal(loginCheck.status, 200);
      assert.equal(loginCheck.json?.success, true);
      assert.equal(loginCheck.json?.loggedIn, true);
      assert.equal(loginCheck.json?.user?.id, loginUser.userId);
    },
  },
  {
    id: 'SMOKE-04',
    tier: 'smoke',
    name: 'Authenticated GET /api/azit-game/state returns 200 with expected envelope and seeded points',
    run: async (ctx) => {
      const seededPoints = 2500;
      const user = await ctx.createAuthenticatedUser({
        points: seededPoints,
      });

      const stateRes = await user.client.get<AzitStateEnvelope>('/api/azit-game/state');
      assert.equal(
        stateRes.status,
        200,
        `Expected 200 from /api/azit-game/state, got ${stateRes.status}: ${stateRes.text}`
      );
      assert.equal(stateRes.json?.success, true);

      const data = stateRes.json?.data;
      assert.ok(data, 'Expected data object in state response');
      assert.ok(data.profile && typeof data.profile === 'object', 'Expected data.profile');
      assert.ok(data.garden && Array.isArray(data.garden.plots), 'Expected data.garden.plots');
      assert.ok(data.catalog && typeof data.catalog === 'object', 'Expected data.catalog');
      assert.equal(
        data.veraPoints,
        seededPoints,
        `Expected veraPoints=${seededPoints}, got ${data.veraPoints}`
      );

      const nowMs = data.serverNowMs ?? data.nowMs;
      assert.equal(
        typeof nowMs === 'number' && Number.isFinite(nowMs) && nowMs > 0,
        true,
        `Expected positive numeric serverNowMs or nowMs, got ${String(nowMs)}`
      );
    },
  },
  {
    id: 'SMOKE-05',
    tier: 'smoke',
    name: 'Isolated server & temp DB teardown removes test.db/-wal/-shm and leaves zero orphan process',
    run: async (ctx) => {
      const isolatedDb = new DbHarness('e2e-azit-smoke-teardown-');
      isolatedDb.initializeBaseline();
      const isolatedServer = new ServerHarness({
        repoRoot: ctx.repoRoot,
        dbPath: isolatedDb.dbPath,
      });

      let capturedPid: number | undefined;
      try {
        await isolatedServer.start();
        capturedPid = isolatedServer.pid;
        assert.ok(capturedPid && capturedPid > 0, 'Expected spawned child PID');

        const client = new HttpClient(isolatedServer.baseUrl);
        const session = await createAuthenticatedUser(isolatedDb, isolatedServer.baseUrl, {
          points: 100,
        });
        const stateRes = await session.client.get<AzitStateEnvelope>('/api/azit-game/state');
        assert.equal(stateRes.status, 200);

        const healthRes = await client.get<HealthPayload>('/health');
        assert.equal(healthRes.status, 200);
        assert.ok(
          fs.existsSync(path.join(isolatedDb.tempDir, 'test.db')),
          'Expected test.db to exist while server is running'
        );
      } finally {
        await isolatedServer.stop();
        await isolatedDb.cleanup();
      }

      assert.equal(
        fs.existsSync(isolatedDb.tempDir),
        false,
        `Expected temp directory ${isolatedDb.tempDir} to be completely removed after cleanup`
      );

      if (capturedPid) {
        let stillAlive = true;
        try {
          process.kill(capturedPid, 0);
        } catch {
          stillAlive = false;
        }
        assert.equal(
          stillAlive,
          false,
          `Expected child PID ${capturedPid} to be terminated after stop()`
        );
      }
    },
  },
];
