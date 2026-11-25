import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { DbHarness } from './db-harness.js';
import { createAuthenticatedUser, HttpClient } from './http-client.js';
import { UiSession } from './next-harness.js';
import { ServerHarness } from './server-harness.js';
import { smokeTests } from './suites/smoke.js';
import { tier1Tests } from './suites/tier1.js';
import { tier2Tests } from './suites/tier2.js';
import { tier3Tests } from './suites/tier3.js';
import { tier4Tests } from './suites/tier4.js';
import type {
  E2ESummaryReport,
  E2ETestCase,
  E2ETestContext,
  E2ETestResult,
  FeatureCode,
  TestTier,
  UiSessionLike,
} from './types.js';

const ALL_TESTS: E2ETestCase[] = [
  ...smokeTests,
  ...tier1Tests,
  ...tier2Tests,
  ...tier3Tests,
  ...tier4Tests,
];

const VALID_TIERS = new Set(['smoke', '1', '2', '3', '4', 'all']);
const VALID_FEATURES = new Set<FeatureCode>([
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
]);

function parseTierValue(raw: string | undefined): 'all' | TestTier {
  const normalized = (raw ?? 'all').trim().toLowerCase();
  if (!VALID_TIERS.has(normalized)) {
    throw new Error(
      `Invalid --tier="${raw}". Allowed values: smoke, 1, 2, 3, 4, all`
    );
  }
  if (normalized === 'smoke' || normalized === 'all') return normalized;
  return Number(normalized) as 1 | 2 | 3 | 4;
}

function parseFeatureValue(raw: string | undefined): FeatureCode | null {
  if (!raw) return null;
  const normalized = raw.trim().toUpperCase() as FeatureCode;
  if (!VALID_FEATURES.has(normalized)) {
    throw new Error(
      `Invalid --feature="${raw}". Allowed values: F1..F12`
    );
  }
  return normalized;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      tier: { type: 'string' },
      feature: { type: 'string' },
      'json-out': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  });

  const tierFilter = parseTierValue(values.tier);
  const featureFilter = parseFeatureValue(values.feature);
  const jsonOutPath = values['json-out'];

  const matched = ALL_TESTS.filter((tc) => {
    const tierMatches = tierFilter === 'all' || tc.tier === tierFilter;
    const featureMatches = !featureFilter || tc.feature === featureFilter;
    return tierMatches && featureMatches;
  });

  if (matched.length === 0) {
    const msg = `[E2E Runner] ERROR: 0 tests matched filter (tier=${String(tierFilter)}, feature=${featureFilter ?? 'any'}). Refusing to report false pass.`;
    console.error(msg);

    if (jsonOutPath) {
      const emptyReport: E2ESummaryReport = {
        tierFilter: String(tierFilter),
        featureFilter,
        totalMatched: 0,
        executed: 0,
        passed: 0,
        failed: 0,
        durationMs: 0,
        results: [],
      };
      fs.mkdirSync(path.dirname(path.resolve(jsonOutPath)), { recursive: true });
      fs.writeFileSync(path.resolve(jsonOutPath), JSON.stringify(emptyReport, null, 2), 'utf8');
    }

    process.exitCode = 1;
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, '..', '..');

  const db = new DbHarness('e2e-azit-garden-');
  db.initializeBaseline();

  const server = new ServerHarness({
    repoRoot,
    dbPath: db.dbPath,
  });

  const runStart = Date.now();
  const results: E2ETestResult[] = [];
  let passed = 0;
  let failed = 0;

  let uiSessionPromise: Promise<UiSessionLike> | null = null;
  let uiSessionInstance: UiSession | null = null;

  try {
    console.log(
      `[E2E Runner] Starting ephemeral api-server with isolated DB (${db.dbPath})...`
    );
    await server.start();
    console.log(
      `[E2E Runner] Server ready at ${server.baseUrl} (PID=${server.pid ?? 'unknown'}). Running ${matched.length} test(s)...`
    );

    const ctx: E2ETestContext = {
      repoRoot,
      db,
      server,
      baseUrl: server.baseUrl,
      createClient: () => new HttpClient(server.baseUrl),
      createAuthenticatedUser: (opts) =>
        createAuthenticatedUser(db, server.baseUrl, opts),
      getUiSession: () => {
        if (!uiSessionPromise) {
          const session = new UiSession(repoRoot, server.baseUrl);
          uiSessionInstance = session;
          uiSessionPromise = session.start().then(() => session);
        }
        return uiSessionPromise;
      },
    };

    for (const tc of matched) {
      const t0 = Date.now();
      try {
        await tc.run(ctx);
        const durationMs = Date.now() - t0;
        passed++;
        results.push({
          id: tc.id,
          tier: tc.tier,
          feature: tc.feature,
          name: tc.name,
          status: 'pass',
          durationMs,
        });
        console.log(`  [PASS] ${tc.id} (${durationMs}ms) - ${tc.name}`);
      } catch (err: unknown) {
        const durationMs = Date.now() - t0;
        failed++;
        const errMessage =
          err instanceof Error ? err.stack ?? err.message : String(err);
        results.push({
          id: tc.id,
          tier: tc.tier,
          feature: tc.feature,
          name: tc.name,
          status: 'fail',
          durationMs,
          error: errMessage,
        });
        console.error(`  [FAIL] ${tc.id} (${durationMs}ms) - ${tc.name}\n${errMessage}`);
      }
    }
  } finally {
    const activeUi = uiSessionInstance as UiSession | null;
    if (activeUi) {
      await activeUi.stop();
    }
    await server.stop();
    await db.cleanup();
  }

  const totalDurationMs = Date.now() - runStart;
  const summary: E2ESummaryReport = {
    tierFilter: String(tierFilter),
    featureFilter,
    totalMatched: matched.length,
    executed: results.length,
    passed,
    failed,
    durationMs: totalDurationMs,
    results,
  };

  if (jsonOutPath) {
    fs.mkdirSync(path.dirname(path.resolve(jsonOutPath)), { recursive: true });
    fs.writeFileSync(path.resolve(jsonOutPath), JSON.stringify(summary, null, 2), 'utf8');
  }

  console.log(
    `\n[E2E Summary] tier=${String(tierFilter)} feature=${featureFilter ?? 'any'} | matched=${matched.length} executed=${results.length} passed=${passed} failed=${failed} duration=${totalDurationMs}ms`
  );

  process.exitCode = results.length > 0 && failed === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error('[E2E Runner] Fatal error:', err);
  process.exitCode = 1;
});
