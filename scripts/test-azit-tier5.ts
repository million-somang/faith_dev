import assert from 'node:assert/strict';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
    GARDEN_WATER_COOLDOWN_MS,
    getAzitLevelInfo,
} from '../apps/api-server/src/services/azit-game.catalog.js';
import { ensureGardenState } from '../apps/next-portal/src/data/minihomeCatalogData';

function sleepMs(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function killTreeSync(child: ChildProcess | null): void {
    if (!child?.pid) return;
    try {
        if (process.platform === 'win32') {
            execFileSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], {
                stdio: 'ignore',
                windowsHide: true,
            });
        } else {
            child.kill('SIGKILL');
        }
    } catch {
        // already exited
    }
}

async function rmDirWithRetry(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) return;
    for (let i = 0; i < 20; i += 1) {
        try {
            fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
            return;
        } catch (err: unknown) {
            const code = (err as NodeJS.ErrnoException)?.code;
            if (code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY') {
                await sleepMs(150);
                continue;
            }
            throw err;
        }
    }
}

async function findFreePort(host = '127.0.0.1'): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const srv = net.createServer();
        srv.unref();
        srv.on('error', reject);
        srv.listen(0, host, () => {
            const addr = srv.address();
            if (!addr || typeof addr === 'string') {
                srv.close(() => reject(new Error('Failed to resolve free port')));
                return;
            }
            const port = addr.port;
            srv.close((err) => (err ? reject(err) : resolve(port)));
        });
    });
}

function initBaselineDb(dbPath: string): void {
    const db = new Database(dbPath);
    try {
        db.pragma('busy_timeout = 5000');
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                password TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                phone TEXT,
                role TEXT DEFAULT 'user',
                status TEXT DEFAULT 'active',
                level INTEGER DEFAULT 1,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS login_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT,
                summary TEXT,
                source TEXT,
                link TEXT,
                published_at TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ai_summary TEXT,
                sentiment TEXT,
                ai_processed INTEGER DEFAULT 0,
                vote_up INTEGER DEFAULT 0,
                vote_down INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                popularity_score INTEGER DEFAULT 0,
                thumbnail TEXT,
                tags TEXT,
                author TEXT,
                source_url TEXT,
                description TEXT
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL DEFAULT 'system',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                target_user_id INTEGER,
                priority TEXT DEFAULT 'normal',
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS mini_apps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                icon_url TEXT DEFAULT '',
                description TEXT DEFAULT '',
                app_url TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                require_auth INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                category TEXT DEFAULT 'utility',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } finally {
        db.close();
    }
}

interface ApiResult {
    status: number;
    json: Record<string, any>;
    rawText: string;
}

async function rawPost(
    baseUrl: string,
    urlPath: string,
    sessionId: string,
    rawBody?: string,
    contentType = 'application/json'
): Promise<ApiResult> {
    const headers: Record<string, string> = {
        Cookie: `session_id=${sessionId}`,
        'User-Agent': 'FaithPortal-Tier5/1.0',
    };
    if (rawBody !== undefined) {
        headers['Content-Type'] = contentType;
    }
    const res = await fetch(`${baseUrl}${urlPath}`, {
        method: 'POST',
        headers,
        body: rawBody,
    });
    const rawText = await res.text();
    let json: Record<string, any> = {};
    try {
        json = JSON.parse(rawText) as Record<string, any>;
    } catch {
        json = { rawText };
    }
    return { status: res.status, json, rawText };
}

async function jsonGet(baseUrl: string, urlPath: string, sessionId?: string): Promise<ApiResult> {
    const headers: Record<string, string> = {
        'User-Agent': 'FaithPortal-Tier5/1.0',
    };
    if (sessionId) {
        headers.Cookie = `session_id=${sessionId}`;
    }
    const res = await fetch(`${baseUrl}${urlPath}`, { headers });
    const rawText = await res.text();
    let json: Record<string, any> = {};
    try {
        json = JSON.parse(rawText) as Record<string, any>;
    } catch {
        json = { rawText };
    }
    return { status: res.status, json, rawText };
}

function seedAuthenticatedUser(
    dbPath: string,
    opts: {
        label: string;
        points?: number;
    }
): { userId: number; sessionId: string; email: string } {
    const db = new Database(dbPath);
    try {
        db.pragma('busy_timeout = 5000');
        const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${opts.label}`;
        const email = `tier5-${suffix}@test.local`;
        const name = `Tier5_${opts.label}`;
        const uRes = db
            .prepare(
                `INSERT INTO users (email, password, name, role, status, level)
                 VALUES (?, 'unused-hash', ?, 'user', 'active', 1)`
            )
            .run(email, name);
        const userId = Number(uRes.lastInsertRowid);
        const sessionId = `sess-tier5-${suffix}`;
        const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
        db.prepare(`INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`).run(
            sessionId,
            userId,
            expiresAt
        );
        db.prepare(
            `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
             VALUES (?, ?, 0, 0, 0)
             ON CONFLICT(user_id) DO UPDATE SET points = excluded.points`
        ).run(userId, opts.points ?? 1000);

        return { userId, sessionId, email };
    } finally {
        db.close();
    }
}

async function seedAndInitUser(
    apiBaseUrl: string,
    dbPath: string,
    opts: {
        label: string;
        points?: number;
        azitXp?: number;
        azitLevel?: number;
    }
): Promise<{ userId: number; sessionId: string; email: string }> {
    const user = seedAuthenticatedUser(dbPath, opts);
    const initRes = await jsonGet(apiBaseUrl, '/api/azit-game/state', user.sessionId);
    assert.equal(initRes.status, 200, `Init /state failed for ${opts.label}: ${initRes.rawText}`);
    if (opts.azitXp !== undefined || opts.azitLevel !== undefined) {
        const azitXp = opts.azitXp ?? 0;
        const azitLevel = opts.azitLevel ?? getAzitLevelInfo(azitXp).level;
        withDb(dbPath, (db) => {
            db.prepare(
                `UPDATE azit_profiles
                 SET azit_xp = ?, azit_level = ?, garden_migrated = 1
                 WHERE user_id = ?`
            ).run(azitXp, azitLevel, user.userId);
        });
    }
    return user;
}

function withDb(dbPath: string, fn: (db: Database.Database) => void): void {
    const db = new Database(dbPath);
    try {
        db.pragma('busy_timeout = 5000');
        fn(db);
    } finally {
        db.close();
    }
}

async function startNextProxy(
    repoRoot: string,
    apiBaseUrl: string
): Promise<{ nextChild: ChildProcess; proxyServer: http.Server; baseUrl: string }> {
    const nextPortalDir = path.join(repoRoot, 'apps', 'next-portal');
    const buildIdPath = path.join(nextPortalDir, '.next', 'BUILD_ID');
    if (!fs.existsSync(buildIdPath)) {
        throw new Error(`Missing built Next.js artifact: ${buildIdPath}. Run next build first.`);
    }

    const internalPort = await findFreePort('127.0.0.1');
    const proxyPort = await findFreePort('127.0.0.1');
    const nextBin = path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

    const nextChild = spawn(
        process.execPath,
        [nextBin, 'start', '-H', '127.0.0.1', '-p', String(internalPort)],
        {
            cwd: nextPortalDir,
            shell: false,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                NODE_ENV: 'production',
                PORT: String(internalPort),
                API_SERVER_URL: apiBaseUrl,
            },
        }
    );

    const nextDeadline = Date.now() + 25_000;
    let nextReady = false;
    while (Date.now() < nextDeadline) {
        try {
            const res = await fetch(`http://127.0.0.1:${internalPort}/minihome/me`, {
                signal: AbortSignal.timeout(1500),
                redirect: 'manual',
            });
            if (res.status >= 200 && res.status < 400) {
                nextReady = true;
                break;
            }
        } catch {
            // starting
        }
        await sleepMs(150);
    }
    if (!nextReady) {
        killTreeSync(nextChild);
        throw new Error('Timed out waiting for next start');
    }

    const apiTarget = new URL(apiBaseUrl);
    const shouldProxyToApi = (reqUrl: string): boolean => {
        const pathname = reqUrl.split('?', 1)[0] ?? '/';
        return (
            pathname === '/api' ||
            pathname.startsWith('/api/') ||
            pathname.startsWith('/uploads/') ||
            pathname.startsWith('/app/') ||
            pathname.startsWith('/onlinegame/') ||
            pathname === '/admin' ||
            pathname.startsWith('/admin/')
        );
    };

    const proxyServer = http.createServer((req, res) => {
        const reqUrl = req.url ?? '/';
        const toApi = shouldProxyToApi(reqUrl);
        const targetHost = toApi ? apiTarget.hostname : '127.0.0.1';
        const targetPort = toApi ? Number(apiTarget.port || 80) : internalPort;
        const headers: http.OutgoingHttpHeaders = { ...req.headers, host: `${targetHost}:${targetPort}` };
        const proxyReq = http.request(
            { hostname: targetHost, port: targetPort, path: reqUrl, method: req.method, headers },
            (proxyRes) => {
                res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
                proxyRes.pipe(res);
            }
        );
        proxyReq.on('error', (err) => {
            if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
            if (!res.destroyed) res.end(JSON.stringify({ success: false, error: { code: 502, message: err.message } }));
        });
        req.on('aborted', () => proxyReq.destroy());
        req.pipe(proxyReq);
    });

    await new Promise<void>((resolve, reject) => {
        proxyServer.once('error', reject);
        proxyServer.listen(proxyPort, '127.0.0.1', () => {
            proxyServer.off('error', reject);
            resolve();
        });
    });

    return { nextChild, proxyServer, baseUrl: `http://127.0.0.1:${proxyPort}` };
}

async function openAuthedPage(
    browser: Browser,
    baseUrl: string,
    sessionId: string,
    viewport: { width: number; height: number },
    urlPath: string,
    fn: (page: Page) => Promise<void>
): Promise<void> {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    try {
        await page.setViewport(viewport);
        await page.setCookie({
            name: 'session_id',
            value: sessionId,
            url: baseUrl,
            path: '/',
        });
        await page.goto(`${baseUrl}${urlPath}`, { waitUntil: 'networkidle2', timeout: 30_000 });
        await fn(page);
    } finally {
        await page.close().catch(() => {});
        await ctx.close().catch(() => {});
    }
}

async function main(): Promise<void> {
    const repoRoot = process.cwd();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-azit-tier5-'));
    const chromeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-tier5-chrome-'));
    const dbPath = path.join(tmpDir, 'tier5.db');
    initBaselineDb(dbPath);

    let apiChild: ChildProcess | null = null;
    let nextChild: ChildProcess | null = null;
    let proxyServer: http.Server | null = null;
    let browser: Browser | null = null;

    let passed = 0;
    const step = (name: string) => {
        passed += 1;
        console.log(`✅ [Tier5 #${passed}] ${name}`);
    };

    try {
        // =====================================================================
        // 1. Rule 6 Isolated Server Boot (< 10s) & Core 3 Endpoints
        // =====================================================================
        const apiPort = await findFreePort('127.0.0.1');
        const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
        const tsxCli = path.resolve(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
        const serverEntry = path.join('apps', 'api-server', 'src', 'server.ts');

        const bootStart = Date.now();
        apiChild = spawn(process.execPath, [tsxCli, serverEntry], {
            cwd: repoRoot,
            shell: false,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PORT: String(apiPort),
                DATABASE_PATH: dbPath,
                NODE_ENV: 'test',
                ENABLE_RSS_SCHEDULER: 'false',
                TELEGRAM_BOT_TOKEN: '',
                TELEGRAM_CHAT_ID: '',
            },
        });

        const apiLogs: string[] = [];
        apiChild.stdout?.on('data', (c: Buffer) => apiLogs.push(c.toString('utf8')));
        apiChild.stderr?.on('data', (c: Buffer) => apiLogs.push(c.toString('utf8')));

        let boundMs = -1;
        while (Date.now() - bootStart < 15_000) {
            try {
                const res = await fetch(`${apiBaseUrl}/health`, { signal: AbortSignal.timeout(1000) });
                if (res.status === 200) {
                    const body = (await res.json()) as { status?: string; db?: string };
                    if (body.status === 'ok' && body.db === 'connected') {
                        boundMs = Date.now() - bootStart;
                        break;
                    }
                }
            } catch {
                // booting
            }
            await sleepMs(100);
        }
        assert.ok(boundMs >= 0 && boundMs < 10_000, `Expected <10s boot bind, got ${boundMs}ms\n${apiLogs.join('')}`);

        const healthRes = await jsonGet(apiBaseUrl, '/health');
        assert.equal(healthRes.status, 200);
        assert.equal(healthRes.json.status, 'ok');
        assert.equal(healthRes.json.db, 'connected');

        const miniAppsRes = await jsonGet(apiBaseUrl, '/api/mini-apps');
        assert.equal(miniAppsRes.status, 200);
        assert.equal(miniAppsRes.json.success, true);

        const newsRes = await jsonGet(apiBaseUrl, '/api/news?limit=1');
        assert.equal(newsRes.status, 200);
        assert.equal(newsRes.json.success, true);
        step(`Rule 6 isolated server boot (${boundMs}ms < 10,000ms) & 3 core endpoints 200`);

        // =====================================================================
        // 2. Bug #1: Malformed / Non-Object JSON Rejected (400) vs Optional Empty Body (200)
        // =====================================================================
        const userA = await seedAndInitUser(apiBaseUrl, dbPath, { label: 'bug1', points: 1000, azitXp: 20_000 });

        const pastMs = Date.now() - 60_000;
        const pastIso = new Date(pastMs).toISOString();
        withDb(dbPath, (db) => {
            db.prepare(
                `UPDATE azit_garden_plots
                 SET crop_id = NULL, stage = 0, water_count = 0,
                     planted_at = NULL, last_watered_at = NULL, next_water_at_ms = NULL
                 WHERE user_id = ?`
            ).run(userA.userId);
            db.prepare(
                `UPDATE azit_garden_plots
                 SET crop_id = 'crop-carrot', stage = 1, water_count = 1,
                     planted_at = ?, last_watered_at = ?, next_water_at_ms = ?
                 WHERE user_id = ? AND plot_index = 0`
            ).run(pastIso, pastIso, pastMs, userA.userId);
            db.prepare(
                `UPDATE azit_garden_plots
                 SET crop_id = 'crop-pepper', stage = 3, water_count = 3,
                     planted_at = ?, last_watered_at = ?, next_water_at_ms = NULL
                 WHERE user_id = ? AND plot_index = 1`
            ).run(pastIso, pastIso, userA.userId);
        });

        const invalidPayloads = ['{not-valid-json', '{bad', '[]', 'null', '"hello"', '123'];
        for (const payload of invalidPayloads) {
            for (const endpoint of [
                '/api/azit-game/garden/fertilizer/buy',
                '/api/azit-game/garden/water-all',
                '/api/azit-game/garden/harvest-all',
                '/api/azit-game/garden/buy-seed',
            ]) {
                const res = await rawPost(apiBaseUrl, endpoint, userA.sessionId, payload);
                assert.equal(res.status, 400, `${endpoint} with ${payload} must return 400 (got ${res.status})`);
                assert.equal(res.json.success, false);
                assert.ok(
                    res.json.code === 'INVALID_JSON' || res.json.code === 'INVALID_BODY',
                    `${endpoint} expected INVALID_JSON/INVALID_BODY, got ${JSON.stringify(res.json)}`
                );
            }
        }

        // Empty body on required endpoint -> 400
        const emptyRequiredRes = await rawPost(apiBaseUrl, '/api/azit-game/garden/buy-seed', userA.sessionId, '');
        assert.equal(emptyRequiredRes.status, 400);

        const stateAfterInvalid = await jsonGet(apiBaseUrl, '/api/azit-game/state', userA.sessionId);
        assert.equal(stateAfterInvalid.json.data.veraPoints, 1000, 'Malformed JSON must not deduct points');
        assert.equal(stateAfterInvalid.json.data.garden.plots[0].stage, 1, 'Malformed JSON must not water plot 0');
        assert.equal(stateAfterInvalid.json.data.garden.plots[1].stage, 3, 'Malformed JSON must not harvest plot 1');

        // Valid empty/whitespace body on optional-body endpoints -> 200
        const waterAllEmpty = await rawPost(apiBaseUrl, '/api/azit-game/garden/water-all', userA.sessionId, '');
        assert.equal(waterAllEmpty.status, 200);
        assert.equal(waterAllEmpty.json.data.wateredCount, 1);

        const harvestAllSpace = await rawPost(apiBaseUrl, '/api/azit-game/garden/harvest-all', userA.sessionId, '   ');
        assert.equal(harvestAllSpace.status, 200);
        assert.equal(harvestAllSpace.json.data.harvestedPlots, 1);

        const fertBuyEmptyObj = await rawPost(apiBaseUrl, '/api/azit-game/garden/fertilizer/buy', userA.sessionId, '{}');
        assert.equal(fertBuyEmptyObj.status, 200);
        assert.equal(fertBuyEmptyObj.json.data.state.veraPoints, 960);
        step('Bug #1: malformed/non-object JSON rejected 400 without mutation; empty optional-body endpoints work 200');

        // =====================================================================
        // 3. Bug #2: Strict Integer Parsing on Kitchen & Expedition Endpoints
        // =====================================================================
        const userB = await seedAndInitUser(apiBaseUrl, dbPath, { label: 'bug2', points: 10_000, azitXp: 40_700 });
        withDb(dbPath, (db) => {
            db.prepare(
                `UPDATE azit_crop_inventory SET harvest_qty = 10 WHERE user_id = ? AND crop_id = 'crop-carrot'`
            ).run(userB.userId);
        });

        const looseNumberInputs: unknown[] = [null, '', '   ', false, true, [], 0.5, 'NaN', '0.5'];
        for (const badVal of looseNumberInputs) {
            const startRes = await rawPost(
                apiBaseUrl,
                '/api/azit-game/kitchen/start',
                userB.sessionId,
                JSON.stringify({ slotIndex: badVal, recipeId: 'dish-carrot-soup' })
            );
            assert.equal(
                startRes.status,
                400,
                `/kitchen/start should reject slotIndex=${JSON.stringify(badVal)}, got ${startRes.status}`
            );

            const claimCookRes = await rawPost(
                apiBaseUrl,
                '/api/azit-game/kitchen/claim',
                userB.sessionId,
                JSON.stringify({ slotIndex: badVal })
            );
            assert.equal(
                claimCookRes.status,
                400,
                `/kitchen/claim should reject slotIndex=${JSON.stringify(badVal)}, got ${claimCookRes.status}`
            );

            const claimExpRes = await rawPost(
                apiBaseUrl,
                '/api/azit-game/expeditions/claim',
                userB.sessionId,
                JSON.stringify({ expeditionId: badVal })
            );
            assert.equal(
                claimExpRes.status,
                400,
                `/expeditions/claim should reject expeditionId=${JSON.stringify(badVal)}, got ${claimExpRes.status}`
            );
        }

        const stateAfterBug2 = await jsonGet(apiBaseUrl, '/api/azit-game/state', userB.sessionId);
        assert.equal(stateAfterBug2.json.data.kitchenSlots[0].status, 'idle');
        assert.equal(stateAfterBug2.json.data.garden.harvestCounts['crop-carrot'], 10);
        step('Bug #2: loose Number() coercions rejected 400 on /kitchen/start, /kitchen/claim, /expeditions/claim');

        // =====================================================================
        // 4. Bug #3: Pre-Action Farmer Catch-Up on /kitchen/start
        // =====================================================================
        const userC = await seedAndInitUser(apiBaseUrl, dbPath, { label: 'bug3', points: 10_000, azitXp: 40_700 });
        await rawPost(
            apiBaseUrl,
            '/api/azit-game/farmers/hire',
            userC.sessionId,
            JSON.stringify({ farmerCode: 'farmer-bomi' })
        );
        const oldTickMs = Date.now() - 120_000;
        const oldIso = new Date(oldTickMs).toISOString();
        withDb(dbPath, (db) => {
            // Upgrade farmer to Grade 2 (Lv 5) & backdate last_auto_tick_ms so harvest tick is overdue
            db.prepare(
                `UPDATE azit_farmers
                 SET level = 5, grade = 2, auto_enabled = 1, last_auto_tick_ms = ?
                 WHERE user_id = ? AND farmer_code = 'farmer-bomi'`
            ).run(oldTickMs, userC.userId);
            // Plot 0 mature carrot (yield 2), 0 carrots in inventory
            db.prepare(
                `UPDATE azit_garden_plots
                 SET crop_id = 'crop-carrot', stage = 3, water_count = 3, soil_level = 0,
                     planted_at = ?, last_watered_at = ?, next_water_at_ms = NULL
                 WHERE user_id = ? AND plot_index = 0`
            ).run(oldIso, oldIso, userC.userId);
            db.prepare(
                `UPDATE azit_crop_inventory SET harvest_qty = 0 WHERE user_id = ? AND crop_id = 'crop-carrot'`
            ).run(userC.userId);
        });

        // Call /kitchen/start directly WITHOUT calling /state first!
        const directCookStart = await rawPost(
            apiBaseUrl,
            '/api/azit-game/kitchen/start',
            userC.sessionId,
            JSON.stringify({ slotIndex: 0, recipeId: 'dish-carrot-soup' })
        );
        assert.equal(
            directCookStart.status,
            200,
            `Expected 200 via pre-action farmer catch-up, got ${directCookStart.status}: ${directCookStart.rawText}`
        );
        assert.equal(directCookStart.json.data.state.kitchenSlots[0].status, 'cooking');
        assert.equal(directCookStart.json.data.state.kitchenSlots[0].recipeId, 'dish-carrot-soup');
        assert.ok(
            directCookStart.json.data.state.farmerLogs.some((l: any) => l.actionType === 'harvest' && l.plotIndex === 0),
            'Farmer auto-harvest log must be recorded before kitchen start'
        );
        step('Bug #3: pre-action farmer automation catch-up enables direct /kitchen/start');

        // =====================================================================
        // 5. Bug #6: Negative azit_xp & NaN getAzitLevelInfo Guards
        // =====================================================================
        const nanInfo = getAzitLevelInfo(Number.NaN);
        assert.equal(nanInfo.level, 1);
        assert.equal(nanInfo.progressPct, 0);
        assert.ok(Number.isFinite(nanInfo.progressPct));

        const negInfo = getAzitLevelInfo(-50);
        assert.equal(negInfo.level, 1);
        assert.equal(negInfo.progressPct, 0);

        const userD = await seedAndInitUser(apiBaseUrl, dbPath, { label: 'bug6', points: 500, azitXp: -50, azitLevel: 1 });
        const negState = await jsonGet(apiBaseUrl, '/api/azit-game/state', userD.sessionId);
        assert.equal(negState.status, 200);
        assert.equal(negState.json.data.profile.azitXp, 0);
        assert.equal(negState.json.data.profile.azitLevel, 1);
        assert.equal(negState.json.data.profile.progressPct, 0);
        step('Bug #6: negative azit_xp clamped to >=0 in /state and getAzitLevelInfo(NaN) finite');

        // =====================================================================
        // 6. Bug #7: ensureGardenState Hardening
        // =====================================================================
        const sanitized = ensureGardenState({
            plots: [
                {
                    plotIndex: 0,
                    cropId: 123 as unknown as string,
                    nextWaterAtMs: -100,
                    stage: 2,
                    waterCount: 1,
                    plantedAt: null,
                    lastWateredAt: null,
                },
                {
                    plotIndex: 100,
                    cropId: 'crop-carrot',
                    stage: 1,
                    waterCount: 1,
                    plantedAt: null,
                    lastWateredAt: null,
                },
            ],
            seedCounts: {},
            harvestCounts: {},
            totalHarvested: 0,
        });
        assert.equal(sanitized.plots.length, 16);
        assert.equal(sanitized.plots[0].cropId, null);
        assert.equal(sanitized.plots[0].stage, 0);
        assert.equal(sanitized.plots[0].nextWaterAtMs, null);
        step('Bug #7: ensureGardenState strips non-string cropId, negative nextWaterAtMs, caps plotCount at 16');

        // =====================================================================
        // 7. Concurrency Locks (unlock-plot, upgrade-soil, farmers/hire, bulk)
        // =====================================================================
        const userE = await seedAndInitUser(apiBaseUrl, dbPath, { label: 'conc', points: 50_000, azitXp: 40_700 });

        const unlockBurst = await Promise.all([
            rawPost(apiBaseUrl, '/api/azit-game/garden/unlock-plot', userE.sessionId, JSON.stringify({ plotIndex: 6 })),
            rawPost(apiBaseUrl, '/api/azit-game/garden/unlock-plot', userE.sessionId, JSON.stringify({ plotIndex: 6 })),
            rawPost(apiBaseUrl, '/api/azit-game/garden/unlock-plot', userE.sessionId, JSON.stringify({ plotIndex: 6 })),
        ]);
        assert.deepEqual(unlockBurst.map((r) => r.status).sort(), [200, 409, 409]);

        const soilBurst = await Promise.all([
            rawPost(apiBaseUrl, '/api/azit-game/garden/upgrade-soil', userE.sessionId, JSON.stringify({ plotIndex: 0 })),
            rawPost(apiBaseUrl, '/api/azit-game/garden/upgrade-soil', userE.sessionId, JSON.stringify({ plotIndex: 0 })),
        ]);
        assert.deepEqual(soilBurst.map((r) => r.status), [200, 200]);
        const afterSoil = await jsonGet(apiBaseUrl, '/api/azit-game/state', userE.sessionId);
        assert.equal(afterSoil.json.data.garden.plots[0].soilLevel, 2);

        const hireBurst = await Promise.all([
            rawPost(apiBaseUrl, '/api/azit-game/farmers/hire', userE.sessionId, JSON.stringify({ farmerCode: 'farmer-bomi' })),
            rawPost(apiBaseUrl, '/api/azit-game/farmers/hire', userE.sessionId, JSON.stringify({ farmerCode: 'farmer-bomi' })),
        ]);
        assert.deepEqual(hireBurst.map((r) => r.status).sort(), [200, 400]);

        await rawPost(
            apiBaseUrl,
            '/api/azit-game/garden/buy-seed',
            userE.sessionId,
            JSON.stringify({ cropId: 'crop-carrot', quantity: 5 })
        );
        const bulkBurst = await Promise.all([
            rawPost(apiBaseUrl, '/api/azit-game/garden/harvest-all', userE.sessionId, '{}'),
            rawPost(apiBaseUrl, '/api/azit-game/garden/water-all', userE.sessionId, '{}'),
            rawPost(
                apiBaseUrl,
                '/api/azit-game/garden/plant-all',
                userE.sessionId,
                JSON.stringify({ cropId: 'crop-carrot' })
            ),
        ]);
        assert.ok(bulkBurst.every((r) => r.status === 200));
        step('Concurrency locks: unlock-plot [200,409,409], upgrade-soil [200,200->Lv2], farmers/hire [200,400], mixed bulk');

        // =====================================================================
        // 8. Headless Puppeteer UI Verification (Bugs #4, #5, #6 UI)
        // =====================================================================
        const nextSession = await startNextProxy(repoRoot, apiBaseUrl);
        nextChild = nextSession.nextChild;
        proxyServer = nextSession.proxyServer;
        const nextBaseUrl = nextSession.baseUrl;

        browser = await puppeteer.launch({
            headless: true,
            userDataDir: chromeDir,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        });

        // 8a. Bug #4: 375x812 zoomed plot bubble must stay inside container bottom
        await openAuthedPage(
            browser,
            nextBaseUrl,
            userA.sessionId,
            { width: 375, height: 812 },
            '/mypage?section=dashboard&zone=garden',
            async (page) => {
                await page.waitForSelector('[data-garden-plot="0"]', { timeout: 20_000 });
                const zoomInBtn = await page.waitForSelector('button[aria-label="화면 확대"]', { timeout: 10_000 });
                assert.ok(zoomInBtn, 'Zoom-in button must exist');
                await zoomInBtn.click();
                await sleepMs(150);
                await zoomInBtn.click();
                await sleepMs(200);

                // Ensure plot 0 is planted (seed userE or clear & plant, or click plot 0 which has crop-carrot stage 2)
                await page.click('[data-garden-plot="0"]');
                await page.waitForSelector('[data-garden-bubble="true"]', { timeout: 10_000 });
                await sleepMs(150);

                const rects = await page.evaluate(() => {
                    const bubble = document.querySelector('[data-garden-bubble="true"]');
                    const parent = bubble?.parentElement;
                    if (!bubble || !parent) return null;
                    const bRect = bubble.getBoundingClientRect();
                    const pRect = parent.getBoundingClientRect();
                    return {
                        bubbleBottom: bRect.bottom,
                        parentBottom: pRect.bottom,
                        overflowPx: bRect.bottom - pRect.bottom,
                    };
                });
                assert.ok(rects, 'Bubble & parent rects must be measurable');
                assert.ok(
                    rects.bubbleBottom <= rects.parentBottom + 0.5,
                    `Zoomed bubble overflowed parent bottom by ${rects.overflowPx}px`
                );
            }
        );
        step('UI Bug #4: zoomed 375x812 garden bubble stays within container bounds');

        // 8b. Bug #5: Two hired farmers before logs have distinct SVG coordinates
        const userTwoFarmers = await seedAndInitUser(apiBaseUrl, dbPath, {
            label: 'twofarmers',
            points: 50_000,
            azitXp: 162_200, // Lv 35 -> maxFarmers = 2
        });
        await rawPost(
            apiBaseUrl,
            '/api/azit-game/farmers/hire',
            userTwoFarmers.sessionId,
            JSON.stringify({ farmerCode: 'farmer-bomi' })
        );
        await rawPost(
            apiBaseUrl,
            '/api/azit-game/farmers/hire',
            userTwoFarmers.sessionId,
            JSON.stringify({ farmerCode: 'farmer-dori' })
        );
        const nowIso = new Date().toISOString();
        const futureMs = Date.now() + GARDEN_WATER_COOLDOWN_MS;
        withDb(dbPath, (db) => {
            // Exactly 1 planted plot (plot 0), 0 logs, fresh last_auto_tick_ms so 0 logs remain on page load
            db.prepare(
                `UPDATE azit_garden_plots
                 SET crop_id = NULL, stage = 0, water_count = 0, planted_at = NULL, last_watered_at = NULL, next_water_at_ms = NULL
                 WHERE user_id = ?`
            ).run(userTwoFarmers.userId);
            db.prepare(
                `UPDATE azit_garden_plots
                 SET crop_id = 'crop-carrot', stage = 1, water_count = 1, planted_at = ?, last_watered_at = ?, next_water_at_ms = ?
                 WHERE user_id = ? AND plot_index = 0`
            ).run(nowIso, nowIso, futureMs, userTwoFarmers.userId);
            db.prepare(
                `UPDATE azit_farmers SET last_auto_tick_ms = ? WHERE user_id = ?`
            ).run(Date.now(), userTwoFarmers.userId);
        });

        await openAuthedPage(
            browser,
            nextBaseUrl,
            userTwoFarmers.sessionId,
            { width: 1280, height: 800 },
            '/mypage?section=dashboard&zone=garden',
            async (page) => {
                await page.waitForFunction(
                    () => document.body.innerText.includes('보미') || !!Array.from(document.querySelectorAll('svg text')).find((t) => t.textContent?.includes('보미')),
                    { timeout: 20_000 }
                );
                const coords = await page.evaluate(() => {
                    const groups = Array.from(document.querySelectorAll('svg g.cursor-pointer[transform^="translate("]'));
                    const result: Array<{ name: string; transform: string }> = [];
                    for (const g of groups) {
                        const txt = g.textContent || '';
                        if (txt.includes('보미')) {
                            result.push({ name: '보미', transform: g.getAttribute('transform') || '' });
                        } else if (txt.includes('도리')) {
                            result.push({ name: '도리', transform: g.getAttribute('transform') || '' });
                        }
                    }
                    return result;
                });
                assert.equal(coords.length, 2, `Expected 2 rendered farmers, got ${JSON.stringify(coords)}`);
                assert.notEqual(
                    coords[0].transform,
                    coords[1].transform,
                    `Two farmers must not overlap at identical SVG transform: ${JSON.stringify(coords)}`
                );
            }
        );
        step('UI Bug #5: two hired farmers before logs render at distinct SVG coordinates');

        // 8c. Bug #6 UI: Negative azit_xp in DB renders non-negative XP badge
        await openAuthedPage(
            browser,
            nextBaseUrl,
            userD.sessionId,
            { width: 1280, height: 800 },
            '/mypage?section=dashboard&zone=garden',
            async (page) => {
                await page.waitForFunction(
                    () => document.body.innerText.includes('0/80 XP'),
                    { timeout: 20_000 }
                );
                const bodyText = await page.evaluate(() => document.body.innerText);
                assert.ok(bodyText.includes('0/80 XP'), 'Expected clamped 0/80 XP badge');
                assert.ok(!bodyText.includes('-50'), 'Negative -50 XP must never appear in UI');
            }
        );
        step('UI Bug #6: negative azit_xp renders clamped 0/80 XP badge without -50');

        console.log(`\n🎉 ALL ${passed} TIER 5 ADVERSARIAL REGRESSION CHECKS PASSED!`);
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
        if (proxyServer) {
            proxyServer.closeAllConnections?.();
            await new Promise<void>((resolve) => proxyServer!.close(() => resolve()));
        }
        killTreeSync(nextChild);
        killTreeSync(apiChild);
        await rmDirWithRetry(chromeDir);
        await rmDirWithRetry(tmpDir);
    }
}

main().catch((err) => {
    console.error('❌ Tier 5 test failure:', err);
    process.exit(1);
});
