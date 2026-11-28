import { runCases, type TestCaseDefinition, type TestCaseResult } from './harness.js';
import { tier1Cases } from './tier1-features.js';
import { tier2Cases } from './tier2-boundaries.js';
import { tier3Cases } from './tier3-combinations.js';
import { tier4Cases } from './tier4-scenarios.js';

interface CliOptions {
    tiers: Set<number>;
    apiOnly: boolean;
    keepGoing: boolean;
    filter?: string;
    json: boolean;
}

function parseArgs(argv: string[]): CliOptions {
    let tiers = new Set<number>([1, 2, 3, 4]);
    let apiOnly = false;
    let keepGoing = true;
    let filter: string | undefined;
    let json = false;

    for (const arg of argv) {
        if (arg === '--api-only') {
            apiOnly = true;
        } else if (arg === '--keep-going') {
            keepGoing = true;
        } else if (arg === '--fail-fast' || arg === '--no-keep-going' || arg === '--bail') {
            keepGoing = false;
        } else if (arg === '--json') {
            json = true;
        } else if (arg.startsWith('--tier=')) {
            const raw = arg.slice('--tier='.length);
            const parsed = raw
                .split(',')
                .map((s) => Number.parseInt(s.trim(), 10))
                .filter((n) => Number.isInteger(n) && n >= 1 && n <= 4);
            if (parsed.length === 0) {
                throw new Error(`Invalid --tier argument: "${raw}". Expected comma-separated values in 1..4.`);
            }
            tiers = new Set<number>(parsed);
        } else if (arg.startsWith('--filter=')) {
            filter = arg.slice('--filter='.length);
        }
    }

    return { tiers, apiOnly, keepGoing, filter, json };
}

function collectCases(tiers: Set<number>): TestCaseDefinition[] {
    const all: TestCaseDefinition[] = [];
    if (tiers.has(1)) all.push(...tier1Cases);
    if (tiers.has(2)) all.push(...tier2Cases);
    if (tiers.has(3)) all.push(...tier3Cases);
    if (tiers.has(4)) all.push(...tier4Cases);
    return all;
}

async function main(): Promise<void> {
    const opts = parseArgs(process.argv.slice(2));
    const cases = collectCases(opts.tiers);

    if (!opts.json) {
        console.log(
            `🚀 Azit E2E Suite | Tiers: [${Array.from(opts.tiers).sort().join(',')}] | Mode: ${
                opts.apiOnly ? 'API-ONLY' : 'FULL (API + Browser)'
            }${opts.filter ? ` | Filter: "${opts.filter}"` : ''}`
        );
    }

    const results: TestCaseResult[] = await runCases(cases, {
        apiOnly: opts.apiOnly,
        filter: opts.filter,
        keepGoing: opts.keepGoing,
        silent: opts.json,
    });

    const summaryByTier: Record<number, { pass: number; fail: number; skip: number; total: number }> = {};
    for (const t of Array.from(opts.tiers).sort()) {
        const tierRows = results.filter((r) => r.tier === t);
        summaryByTier[t] = {
            pass: tierRows.filter((r) => r.status === 'PASS').length,
            fail: tierRows.filter((r) => r.status === 'FAIL').length,
            skip: tierRows.filter((r) => r.status === 'SKIP').length,
            total: tierRows.length,
        };
    }

    const totalPass = results.filter((r) => r.status === 'PASS').length;
    const totalFail = results.filter((r) => r.status === 'FAIL').length;
    const totalSkip = results.filter((r) => r.status === 'SKIP').length;
    const unexpectedSkips = !opts.apiOnly && totalSkip > 0;

    if (opts.json) {
        console.log(
            JSON.stringify(
                {
                    mode: opts.apiOnly ? 'api-only' : 'full',
                    totals: { pass: totalPass, fail: totalFail, skip: totalSkip, total: results.length },
                    tiers: summaryByTier,
                    results,
                },
                null,
                2
            )
        );
    } else {
        console.log('\n==================== E2E SUMMARY ====================');
        for (const [tierKey, s] of Object.entries(summaryByTier)) {
            console.log(`Tier ${tierKey}: PASS=${s.pass} FAIL=${s.fail} SKIP=${s.skip} TOTAL=${s.total}`);
        }
        console.log(`TOTAL : PASS=${totalPass} FAIL=${totalFail} SKIP=${totalSkip} TOTAL=${results.length}`);

        const failures = results.filter((r) => r.status === 'FAIL');
        if (failures.length > 0) {
            console.log('\n------------------ FAILURE DETAILS ------------------');
            for (const f of failures) {
                console.log(`[${f.id}] ${f.description}\n  Error: ${f.error ?? 'Unknown error'}`);
            }
        }
        if (unexpectedSkips) {
            console.error('\n❌ Browser cases were skipped in non---api-only mode.');
        }
    }

    if (totalFail > 0 || unexpectedSkips) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('❌ E2E Runner fatal error:', err);
    process.exit(1);
});
