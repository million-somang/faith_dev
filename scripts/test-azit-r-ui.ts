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
import { runCombatSimulation } from '../apps/api-server/src/services/azit-combat.engine.js';
import {
    buildMercCombatUnit,
    buildZoneEnemyUnits,
    getAzitLevelInfo,
    getDishEffectiveBuffs,
    getRecipeDef,
    getZoneDef,
} from '../apps/api-server/src/services/azit-game.catalog.js';

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
    json: Record<string, unknown>;
    rawText: string;
}

async function jsonGet(baseUrl: string, urlPath: string, sessionId?: string): Promise<ApiResult> {
    const headers: Record<string, string> = {
        'User-Agent': 'FaithPortal-AzitUI/1.0',
    };
    if (sessionId) {
        headers.Cookie = `session_id=${sessionId}`;
    }
    const res = await fetch(`${baseUrl}${urlPath}`, { headers });
    const rawText = await res.text();
    let json: Record<string, unknown> = {};
    try {
        json = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
        json = { rawText };
    }
    return { status: res.status, json, rawText };
}

async function jsonPost(
    baseUrl: string,
    urlPath: string,
    sessionId: string,
    body: Record<string, unknown>
): Promise<ApiResult> {
    const res = await fetch(`${baseUrl}${urlPath}`, {
        method: 'POST',
        headers: {
            Cookie: `session_id=${sessionId}`,
            'Content-Type': 'application/json',
            'User-Agent': 'FaithPortal-AzitUI/1.0',
        },
        body: JSON.stringify(body),
    });
    const rawText = await res.text();
    let json: Record<string, unknown> = {};
    try {
        json = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
        json = { rawText };
    }
    return { status: res.status, json, rawText };
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

function seedAuthenticatedUser(
    dbPath: string,
    opts: { label: string; points?: number }
): { userId: number; sessionId: string; email: string } {
    const db = new Database(dbPath);
    try {
        db.pragma('busy_timeout = 5000');
        const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${opts.label}`;
        const email = `azit-ui-${suffix}@test.local`;
        const name = `AzitUI_${opts.label}`;
        const uRes = db
            .prepare(
                `INSERT INTO users (email, password, name, role, status, level)
                 VALUES (?, 'unused-hash', ?, 'user', 'active', 1)`
            )
            .run(email, name);
        const userId = Number(uRes.lastInsertRowid);
        const sessionId = `sess-azit-ui-${suffix}`;
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
        ).run(userId, opts.points ?? 10_000);

        return { userId, sessionId, email };
    } finally {
        db.close();
    }
}

async function seedAndInitUser(
    apiBaseUrl: string,
    dbPath: string,
    opts: { label: string; points?: number; azitXp?: number; azitLevel?: number }
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
            if (!res.destroyed) {
                res.end(JSON.stringify({ success: false, error: { code: 502, message: err.message } }));
            }
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

interface PageErrorTracker {
    consoleErrors: string[];
    pageErrors: string[];
    http5xx: string[];
    assertClean: (contextLabel: string) => void;
    clear: () => void;
}

function attachErrorTracker(page: Page): PageErrorTracker {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const http5xx: string[] = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', (err) => {
        pageErrors.push(err instanceof Error ? err.message : String(err));
    });
    page.on('response', (res) => {
        if (res.status() >= 500) {
            http5xx.push(`${res.status()} ${res.url()}`);
        }
    });

    return {
        consoleErrors,
        pageErrors,
        http5xx,
        assertClean: (contextLabel: string) => {
            assert.equal(
                consoleErrors.length,
                0,
                `[${contextLabel}] Console errors detected:\n${consoleErrors.join('\n')}`
            );
            assert.equal(
                pageErrors.length,
                0,
                `[${contextLabel}] Page errors detected:\n${pageErrors.join('\n')}`
            );
            assert.equal(
                http5xx.length,
                0,
                `[${contextLabel}] HTTP 5xx responses detected:\n${http5xx.join('\n')}`
            );
        },
        clear: () => {
            consoleErrors.length = 0;
            pageErrors.length = 0;
            http5xx.length = 0;
        },
    };
}

async function openAuthedPage(
    browser: Browser,
    baseUrl: string,
    sessionId: string,
    viewport: { width: number; height: number },
    urlPath: string,
    fn: (page: Page, tracker: PageErrorTracker) => Promise<void>
): Promise<void> {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const tracker = attachErrorTracker(page);
    try {
        await page.setViewport(viewport);
        await page.setCookie({
            name: 'session_id',
            value: sessionId,
            url: baseUrl,
            path: '/',
        });
        await page.goto(`${baseUrl}${urlPath}`, { waitUntil: 'networkidle2', timeout: 30_000 });
        await fn(page, tracker);
        tracker.assertClean(`${urlPath} (${viewport.width}x${viewport.height})`);
    } finally {
        await page.close().catch(() => {});
        await ctx.close().catch(() => {});
    }
}

async function waitForText(page: Page, textSubstr: string, timeoutMs = 15_000): Promise<void> {
    await page.waitForFunction(
        (substr: string) => (document.body?.innerText ?? '').includes(substr),
        { timeout: timeoutMs },
        textSubstr
    );
}

async function clickButtonByText(page: Page, textSubstr: string, scopeSelector?: string): Promise<boolean> {
    return page.evaluate(
        ({ substr, scope }) => {
            const root: ParentNode = scope ? document.querySelector(scope) ?? document : document;
            const buttons = Array.from(root.querySelectorAll('button'));
            const match = buttons.find((b) => {
                const txt = (b.textContent ?? '').replace(/\s+/g, ' ').trim();
                return txt.includes(substr) && !b.disabled;
            });
            if (!match) return false;
            match.click();
            return true;
        },
        { substr: textSubstr, scope: scopeSelector ?? null }
    );
}

async function assertNoHorizontalOverflow(page: Page, label: string): Promise<void> {
    const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
    }));
    assert.ok(
        dims.scrollWidth <= dims.innerWidth,
        `[${label}] Horizontal overflow: scrollWidth=${dims.scrollWidth} > innerWidth=${dims.innerWidth}`
    );
}

async function assertCanvasAnimating(page: Page, selector: string, intervalMs = 500): Promise<void> {
    await page.waitForSelector(selector, { timeout: 10_000 });
    const first = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!(el instanceof HTMLCanvasElement)) return null;
        const rect = el.getBoundingClientRect();
        return {
            w: rect.width,
            h: rect.height,
            dataUrl: el.toDataURL('image/png'),
        };
    }, selector);
    assert.ok(first !== null, `Canvas ${selector} not found`);
    assert.ok(
        first.w >= 200 && first.h >= 100,
        `Canvas ${selector} rect too small: ${first.w}x${first.h}`
    );
    await sleepMs(intervalMs);
    const secondUrl = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        return el instanceof HTMLCanvasElement ? el.toDataURL('image/png') : null;
    }, selector);
    assert.ok(secondUrl !== null, `Canvas ${selector} disappeared`);
    assert.notEqual(
        first.dataUrl,
        secondUrl,
        `Canvas ${selector} pixels did not animate over ${intervalMs}ms`
    );
}

async function assertOverlayCoversViewportAndNav(page: Page, overlaySelector: string): Promise<void> {
    const check = await page.evaluate((sel: string) => {
        const overlay = document.querySelector(sel);
        if (!(overlay instanceof HTMLElement)) {
            return { found: false, z: 0, width: 0, height: 0, iw: 0, ih: 0, topOk: false, botOk: false };
        }
        const rect = overlay.getBoundingClientRect();
        const style = window.getComputedStyle(overlay);
        const z = Number.parseInt(style.zIndex || '0', 10) || 0;
        const iw = window.innerWidth;
        const ih = window.innerHeight;
        const topEl = document.elementFromPoint(Math.floor(iw / 2), 20);
        const botEl = document.elementFromPoint(Math.floor(iw / 2), Math.max(10, ih - 15));
        const topOk = Boolean(topEl && (topEl === overlay || overlay.contains(topEl)));
        const botOk = Boolean(botEl && (botEl === overlay || overlay.contains(botEl)));
        return { found: true, z, width: rect.width, height: rect.height, iw, ih, topOk, botOk };
    }, overlaySelector);

    assert.ok(check.found, `Overlay ${overlaySelector} not found`);
    assert.ok(check.z >= 70, `Expected z-index >= 70 on ${overlaySelector}, got ${check.z}`);
    assert.ok(
        check.width >= check.iw - 2 && check.height >= check.ih - 2,
        `Overlay ${overlaySelector} (${check.width}x${check.height}) does not fill ${check.iw}x${check.ih}`
    );
    assert.ok(check.topOk, 'Top viewport center (y=20) is occluded by PortalNavbar instead of Tower fullscreen');
    assert.ok(
        check.botOk,
        'Bottom viewport center (y=innerHeight-15) is occluded by MobileTabBar instead of Tower fullscreen'
    );
}

function findDeterministicCasualtySeed(mercCode: 'merc-kael'): number {
    const zone = getZoneDef('zone-dragon');
    const recipe = getRecipeDef('dish-knight-feast');
    assert.ok(zone && recipe, 'Catalog zone-dragon or dish-knight-feast missing');
    const dishBuffs = getDishEffectiveBuffs(recipe, 'normal');
    const enemies = buildZoneEnemyUnits(zone);
    const allies = [
        buildMercCombatUnit({
            mercCode,
            level: 1,
            mainSkillLevel: 1,
            subSkillLevel: 1,
            unitId: `ally-0-${mercCode}`,
        }),
    ];
    for (let seed = 1001; seed < 2000; seed += 1) {
        const res = runCombatSimulation({
            mode: 'expedition',
            seed,
            allies,
            enemies,
            dishBuffs,
            deathRiskPct: zone.deathRiskPct,
            recordFrames: false,
        });
        if (!res.won && res.casualties.includes(mercCode)) {
            return seed;
        }
    }
    throw new Error('Failed to find deterministic casualty seed for zone-dragon + merc-kael');
}

interface StateJsonEnvelope {
    success?: boolean;
    data?: {
        mercenaries?: Array<{ mercCode: string; status: string }>;
        items?: Array<{ itemId: string; qty: number }>;
        tower?: { highestClearedFloor: number };
        groups?: Array<{ id: number; name: string }>;
    };
}

async function main(): Promise<void> {
    const repoRoot = process.cwd();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-azit-r-ui-'));
    const chromeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-azit-r-ui-chrome-'));
    const dbPath = path.join(tmpDir, 'azit-r-ui.db');
    initBaselineDb(dbPath);

    let apiChild: ChildProcess | null = null;
    let nextChild: ChildProcess | null = null;
    let proxyServer: http.Server | null = null;
    let browser: Browser | null = null;

    let passed = 0;
    const step = (name: string) => {
        passed += 1;
        console.log(`✅ [UI #${passed}] ${name}`);
    };

    try {
        // Boot isolated API server (<10s Rule 6 check)
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
        const miniAppsRes = await jsonGet(apiBaseUrl, '/api/mini-apps');
        assert.equal(miniAppsRes.status, 200);
        assert.equal(miniAppsRes.json.success, true);
        const newsRes = await jsonGet(apiBaseUrl, '/api/news?limit=1');
        assert.equal(newsRes.status, 200);
        assert.equal(newsRes.json.success, true);

        const proxy = await startNextProxy(repoRoot, apiBaseUrl);
        nextChild = proxy.nextChild;
        proxyServer = proxy.proxyServer;
        const baseUrl = proxy.baseUrl;

        browser = await puppeteer.launch({
            headless: true,
            userDataDir: chromeDir,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });
        step(`Isolated API (${boundMs}ms) + Next.js production server + Puppeteer ready`);

        // =====================================================================
        // UI-1: R1 Empty vs Active Camp Battlefield Canvas + 2+ Expedition Switcher
        // =====================================================================
        const user1 = await seedAndInitUser(apiBaseUrl, dbPath, {
            label: 'ui1',
            points: 15_000,
            azitXp: 2500,
            azitLevel: 4,
        });
        for (const mercCode of ['merc-leo', 'merc-rina', 'merc-garr']) {
            const hireRes = await jsonPost(apiBaseUrl, '/api/azit-game/mercenaries/hire', user1.sessionId, {
                mercCode,
            });
            assert.equal(hireRes.status, 200, `Hire ${mercCode} failed: ${hireRes.rawText}`);
        }
        withDb(dbPath, (db) => {
            db.prepare(
                `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                 VALUES (?, 'dish-carrot-soup', 5, 0)
                 ON CONFLICT(user_id, recipe_id) DO UPDATE SET qty = 5`
            ).run(user1.userId);
        });

        await openAuthedPage(
            browser,
            baseUrl,
            user1.sessionId,
            { width: 1280, height: 800 },
            '/mypage?section=dashboard&zone=camp',
            async (page) => {
                await waitForText(page, '출정 중인 원정대가 없습니다', 20_000);
                await assertNoHorizontalOverflow(page, 'UI-1 empty camp desktop');
                const emptyCanvas = await page.$('[data-camp-battlefield="true"], [data-testid="azit-battlefield-canvas"]');
                assert.equal(emptyCanvas, null, 'R1 battlefield canvas MUST NOT render when 0 expeditions active');

                // Dispatch 1st expedition via UI
                const openedExp1 = await clickButtonByText(page, '몬스터 원정 출정');
                assert.ok(openedExp1, 'Expected expedition modal open button');
                await waitForText(page, '슬라임 습지대', 10_000);
                const modalText = await page.evaluate(() => document.body.innerText);
                assert.ok(modalText.includes('1시간') && modalText.includes('8시간'), 'Expected 1h..8h expedition zone durations');

                // Pick zone-slime, keep only merc-leo (deselect rina & garr so they stay idle for 2nd expedition), pick dish & submit
                await clickButtonByText(page, '슬라임 습지대');
                await clickButtonByText(page, '리나');
                await clickButtonByText(page, '가르');
                await clickButtonByText(page, '당근 수프');
                const submitted1 = await clickButtonByText(page, '원정 출정 확정');
                assert.ok(submitted1, 'Expected 1st expedition submit button');

                await page.waitForSelector('[data-camp-battlefield="true"]', { timeout: 10_000 });
                await assertCanvasAnimating(page, '[data-testid="azit-battlefield-canvas"]', 500);

                // Dispatch 2nd simultaneous expedition via UI
                const openedExp2 = await clickButtonByText(page, '몬스터 원정 출정');
                assert.ok(openedExp2, 'Expected 2nd expedition modal open button');
                await waitForText(page, '고블린 약탈 캠프', 10_000);
                await clickButtonByText(page, '고블린 약탈 캠프');
                await clickButtonByText(page, '당근 수프');
                const submitted2 = await clickButtonByText(page, '원정 출정 확정');
                assert.ok(submitted2, 'Expected 2nd expedition submit button');

                await page.waitForFunction(
                    () =>
                        document.querySelectorAll('[data-camp-battlefield="true"] button').length >= 2,
                    { timeout: 10_000 }
                );
                const switched = await clickButtonByText(page, '고블린 약탈 캠프', '[data-camp-battlefield="true"]');
                assert.ok(switched, 'Expected multi-expedition switcher button for 2nd expedition');
                await waitForText(page, '고블린 약탈 캠프', 5000);
            }
        );
        step('UI-1: R1 empty vs active bottom battlefield canvas + 2+ expedition switcher verified');

        // =====================================================================
        // UI-2: R3 No Gold Upgrade + R2 Group Creation, Casualty Death, Item-Only Revival, Shop/Craft
        // =====================================================================
        const user2 = await seedAndInitUser(apiBaseUrl, dbPath, {
            label: 'ui2',
            points: 15_000,
            azitXp: 10_000,
            azitLevel: 6,
        });
        for (const mercCode of ['merc-leo', 'merc-kael']) {
            const hireRes = await jsonPost(apiBaseUrl, '/api/azit-game/mercenaries/hire', user2.sessionId, {
                mercCode,
            });
            assert.equal(hireRes.status, 200);
        }
        withDb(dbPath, (db) => {
            db.prepare(
                `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                 VALUES (?, 'dish-knight-feast', 3, 0)
                 ON CONFLICT(user_id, recipe_id) DO UPDATE SET qty = 3`
            ).run(user2.userId);
            db.prepare(
                `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty)
                 VALUES (?, 'crop-lettuce', 0, 2)
                 ON CONFLICT(user_id, crop_id) DO UPDATE SET harvest_qty = 2`
            ).run(user2.userId);
            db.prepare(
                `INSERT INTO azit_material_inventory (user_id, material_id, qty)
                 VALUES (?, 'mat-slime-jelly', 2)
                 ON CONFLICT(user_id, material_id) DO UPDATE SET qty = 2`
            ).run(user2.userId);
        });

        // Start 8h zone-dragon expedition with Lv1 merc-kael and backdate with deterministic casualty seed
        const casualtySeed = findDeterministicCasualtySeed('merc-kael');
        const expStartRes = await jsonPost(apiBaseUrl, '/api/azit-game/expeditions/start', user2.sessionId, {
            zoneId: 'zone-dragon',
            partyMercCodes: ['merc-kael'],
            dishRecipeId: 'dish-knight-feast',
        });
        assert.equal(expStartRes.status, 200, `Start zone-dragon failed: ${expStartRes.rawText}`);
        withDb(dbPath, (db) => {
            db.prepare(
                `UPDATE azit_expeditions
                 SET ends_at_ms = ?, battle_seed = ?
                 WHERE user_id = ? AND status = 'running'`
            ).run(Date.now() - 3000, casualtySeed, user2.userId);
        });

        await openAuthedPage(
            browser,
            baseUrl,
            user2.sessionId,
            { width: 1280, height: 800 },
            '/mypage?section=dashboard&zone=camp',
            async (page) => {
                await waitForText(page, '전리품 정산!', 20_000);
                // Claim expedition in UI -> casualty death + report modal
                const claimed = await clickButtonByText(page, '전리품 정산!');
                assert.ok(claimed, 'Expected claim button in UI');
                await waitForText(page, '부활 아이템으로만 부활 가능합니다', 10_000);
                await clickButtonByText(page, '확인 완료');

                await waitForText(page, '💀1', 10_000);
                // Open Merc Guild modal -> verify R3 no gold upgrade, dead status, group create, shop/craft & revival
                const openedMerc = await clickButtonByText(page, '용병');
                assert.ok(openedMerc, 'Expected Merc modal button');
                await waitForText(page, '전투 경험치 (전투로만 레벨업)', 10_000);
                const modalText = await page.evaluate(() => document.body.innerText);
                assert.ok(!modalText.includes('훈련 강화'), 'Gold level-up "훈련 강화" MUST be absent (R3)');
                assert.ok(modalText.includes('골드 부활 불가'), 'Dead merc gold revival prohibition notice missing');

                // Create group in UI
                await clickButtonByText(page, '용병 그룹 편성');
                await page.waitForSelector('input[placeholder*="슬라임"]', { timeout: 5000 });
                await page.type('input[placeholder*="슬라임"]', '1군 정예');
                await clickButtonByText(page, '레오');
                await clickButtonByText(page, '그룹 저장');
                await waitForText(page, '1군 정예', 8000);

                // Buy revival item in Shop & craft revival herb in Craft UI
                await clickButtonByText(page, '상점 · 연금 제작');
                await waitForText(page, '생명의 약초', 8000);
                await waitForText(page, '제작하기', 8000);
                const bought = await clickButtonByText(page, '1개 구매');
                assert.ok(bought, 'Expected 1개 구매 button in Azit Shop');
                await sleepMs(300);
                const crafted = await clickButtonByText(page, '제작하기');
                assert.ok(crafted, 'Expected 제작하기 button in Azit Craft UI');
                await sleepMs(400);

                // Revive dead merc via item in Roster tab
                await clickButtonByText(page, '용병 · 스킬 · 부활');
                await waitForText(page, '생명의 약초로 부활', 8000);
                const revived = await clickButtonByText(page, '생명의 약초로 부활');
                assert.ok(revived, 'Expected item revival button');
                await page.waitForFunction(
                    () => !(document.body?.innerText ?? '').includes('골드 부활 불가'),
                    { timeout: 10_000 }
                );
            }
        );
        const stateAfterUi2 = await jsonGet(apiBaseUrl, '/api/azit-game/state', user2.sessionId);
        const env2 = stateAfterUi2.json as StateJsonEnvelope;
        const kaelAfter = env2.data?.mercenaries?.find((m) => m.mercCode === 'merc-kael');
        assert.equal(kaelAfter?.status, 'idle', 'merc-kael must return to idle after item revival');
        assert.ok(
            env2.data?.groups?.some((g) => g.name === '1군 정예'),
            'Group "1군 정예" must persist in DB'
        );
        step('UI-2: R3 no gold upgrade + R2 group creation + casualty death + shop/craft + item revival verified');

        // =====================================================================
        // UI-3: R4 Vera's Tower 200F Lobby, Fullscreen z-[70], 1F Win & 60F Mobile Defeat Retry
        // =====================================================================
        const user3 = await seedAndInitUser(apiBaseUrl, dbPath, {
            label: 'ui3-win',
            points: 10_000,
            azitXp: 2500,
            azitLevel: 4,
        });
        for (const mercCode of ['merc-leo', 'merc-rina', 'merc-garr']) {
            await jsonPost(apiBaseUrl, '/api/azit-game/mercenaries/hire', user3.sessionId, { mercCode });
        }

        await openAuthedPage(
            browser,
            baseUrl,
            user3.sessionId,
            { width: 1280, height: 800 },
            '/mypage?section=dashboard&zone=camp',
            async (page) => {
                await page.waitForSelector('[data-testid="azit-tower-open-btn"]', { timeout: 20_000 });
                await assertNoHorizontalOverflow(page, 'UI-3 desktop camp');
                await page.click('[data-testid="azit-tower-open-btn"]');

                await page.waitForSelector('[data-testid="azit-tower-lobby"]', { timeout: 10_000 });
                const lobbyMeta = await page.evaluate(() => ({
                    themeTabs: document.querySelectorAll('[data-tower-theme-tab]').length,
                    floor2Locked: document.querySelector('[data-tower-floor="2"]')?.getAttribute('data-tower-locked'),
                    text: document.body.innerText,
                }));
                assert.equal(lobbyMeta.themeTabs, 5, 'Expected 5 thematic tier tabs in Tower Lobby');
                assert.equal(lobbyMeta.floor2Locked, 'true', 'Floor 2 must initially be locked');
                assert.ok(lobbyMeta.text.includes('0 / 200F'), 'Expected 0 / 200F progress display');

                await page.click('[data-testid="azit-tower-start-battle"]');
                await page.waitForSelector('[data-tower-fullscreen="true"]', { timeout: 10_000 });
                await assertOverlayCoversViewportAndNav(page, '[data-tower-fullscreen="true"]');
                await assertCanvasAnimating(page, '[data-testid="azit-tower-canvas"]', 500);

                await page.click('[data-testid="azit-tower-speed-btn"]');
                await page.waitForSelector('[data-tower-result="won"]', { timeout: 25_000 });
                const resultText = await page.evaluate(
                    () => document.querySelector('[data-testid="azit-tower-result"]')?.textContent ?? ''
                );
                assert.ok(resultText.includes('최초 클리어 보상'), 'Expected First-Clear badge on 1F win');
                assert.ok(resultText.includes('아지트 골드') && resultText.includes('용병 전투 EXP'), 'Expected itemized R5 rewards');
                await page.waitForSelector('[data-testid="azit-tower-next-floor-btn"]', { timeout: 5000 });

                await clickButtonByText(page, '탑 로비로');
                await waitForText(page, '1 / 200F', 8000);
            }
        );

        // Mobile 375x812 60F defeat + penalty-free retry
        const user4 = await seedAndInitUser(apiBaseUrl, dbPath, {
            label: 'ui3-mobile-defeat',
            points: 5000,
            azitXp: 2500,
            azitLevel: 4,
        });
        await jsonPost(apiBaseUrl, '/api/azit-game/mercenaries/hire', user4.sessionId, {
            mercCode: 'merc-leo',
        });
        withDb(dbPath, (db) => {
            db.prepare(
                `INSERT INTO azit_tower_progress (user_id, highest_cleared_floor, total_clears, total_attempts)
                 VALUES (?, 59, 59, 59)
                 ON CONFLICT(user_id) DO UPDATE SET highest_cleared_floor = 59`
            ).run(user4.userId);
            db.prepare(
                `INSERT INTO azit_item_inventory (user_id, item_id, qty)
                 VALUES (?, 'item-revival-herb', 2)
                 ON CONFLICT(user_id, item_id) DO UPDATE SET qty = 2`
            ).run(user4.userId);
        });

        await openAuthedPage(
            browser,
            baseUrl,
            user4.sessionId,
            { width: 375, height: 812 },
            '/mypage?section=dashboard&zone=camp',
            async (page) => {
                await page.waitForSelector('[data-testid="azit-tower-open-btn"]', { timeout: 20_000 });
                await assertNoHorizontalOverflow(page, 'UI-3 mobile 375x812 camp');
                await page.click('[data-testid="azit-tower-open-btn"]');

                await page.waitForSelector('[data-testid="azit-tower-lobby"]', { timeout: 10_000 });
                await assertNoHorizontalOverflow(page, 'UI-3 mobile 375x812 tower lobby');
                await page.click('[data-testid="tower-theme-tower-2-spirit"]');
                await page.waitForSelector('[data-tower-floor="60"]', { timeout: 5000 });
                await page.click('[data-tower-floor="60"]');
                await page.click('[data-testid="azit-tower-start-battle"]');

                await page.waitForSelector('[data-tower-fullscreen="true"]', { timeout: 10_000 });
                await assertNoHorizontalOverflow(page, 'UI-3 mobile 375x812 tower fullscreen');
                await assertOverlayCoversViewportAndNav(page, '[data-tower-fullscreen="true"]');
                await assertCanvasAnimating(page, '[data-testid="azit-tower-canvas"]', 500);

                await page.click('[data-testid="azit-tower-speed-btn"]');
                await page.waitForSelector('[data-tower-result="lost"]', { timeout: 25_000 });
                const defeatText = await page.evaluate(
                    () => document.querySelector('[data-testid="azit-tower-result"]')?.textContent ?? ''
                );
                assert.ok(
                    defeatText.includes('사망 패널티 및 부활 아이템 소모 없음'),
                    'Expected penalty-free recovery notice on Tower defeat'
                );

                // Click instant retry & verify playback restarts cleanly without revival redirect
                await page.click('[data-testid="azit-tower-retry-btn"]');
                await page.waitForFunction(
                    () => !document.querySelector('[data-testid="azit-tower-result"]'),
                    { timeout: 10_000 }
                );
            }
        );

        const stateAfterDefeat = await jsonGet(apiBaseUrl, '/api/azit-game/state', user4.sessionId);
        const env4 = stateAfterDefeat.json as StateJsonEnvelope;
        const leoAfter = env4.data?.mercenaries?.find((m) => m.mercCode === 'merc-leo');
        const herbAfter = env4.data?.items?.find((i) => i.itemId === 'item-revival-herb')?.qty;
        assert.equal(leoAfter?.status, 'idle', 'Tower defeat MUST leave merc-leo idle');
        assert.equal(herbAfter, 2, 'Tower defeat retry MUST NOT consume revival herbs');
        step('UI-3: Vera Tower 200F lobby, z-[70] fullscreen, 1F rewards & 375x812 60F penalty-free retry verified');

        // =====================================================================
        // UI-4: /minihome/me Parity + Tower SVG Node + 375x812 & 1280x800 Overflow/Error Check
        // =====================================================================
        for (const vp of [
            { width: 1280, height: 800 },
            { width: 375, height: 812 },
        ]) {
            await openAuthedPage(browser, baseUrl, user3.sessionId, vp, '/minihome/me', async (page) => {
                await waitForText(page, '용병 캠프', 20_000);
                const switchedToCamp = await clickButtonByText(page, '용병 캠프');
                assert.ok(switchedToCamp, 'Expected "용병 캠프" zone switcher button on /minihome/me');
                await page.waitForSelector('[data-testid="azit-tower-open-btn"]', { timeout: 10_000 });
                await page.waitForSelector('[data-camp-node="tower"]', { timeout: 10_000 });
                await assertNoHorizontalOverflow(page, `/minihome/me camp ${vp.width}x${vp.height}`);

                // Click Camp SVG Tower node -> bubble -> open Tower Lobby
                await page.evaluate(() => {
                    const node = document.querySelector('[data-camp-node="tower"]');
                    node?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
                await waitForText(page, '베라의 탑 입장하기', 5000);
                await clickButtonByText(page, '베라의 탑 입장하기');
                await page.waitForSelector('[data-testid="azit-tower-lobby"]', { timeout: 10_000 });
                await assertNoHorizontalOverflow(page, `/minihome/me tower lobby ${vp.width}x${vp.height}`);
            });
        }
        step('UI-4: /minihome/me Camp & Tower SVG node parity + zero errors/overflow (375x812 & 1280x800)');

        // =====================================================================
        // UI-5: Expedition Dispatch Modal — Last-Merc Deselection After Picking Group (Zero Auto-Refill)
        // =====================================================================
        const user5 = await seedAndInitUser(apiBaseUrl, dbPath, {
            label: 'ui5-exp-deselect',
            points: 10_000,
            azitXp: 2500,
            azitLevel: 4,
        });
        for (const mercCode of ['merc-leo', 'merc-rina']) {
            const hireRes = await jsonPost(apiBaseUrl, '/api/azit-game/mercenaries/hire', user5.sessionId, {
                mercCode,
            });
            assert.equal(hireRes.status, 200);
        }
        const saveGrpRes = await jsonPost(apiBaseUrl, '/api/azit-game/groups/save', user5.sessionId, {
            name: '단독 조',
            mercCodes: ['merc-leo'],
        });
        assert.equal(saveGrpRes.status, 200, `Save group failed: ${saveGrpRes.rawText}`);

        await openAuthedPage(
            browser,
            baseUrl,
            user5.sessionId,
            { width: 1280, height: 800 },
            '/mypage?section=dashboard&zone=camp',
            async (page) => {
                await waitForText(page, '출정 중인 원정대가 없습니다', 20_000);
                const openedExp = await clickButtonByText(page, '몬스터 원정 출정');
                assert.ok(openedExp, 'Expected expedition modal open button in UI-5');
                await waitForText(page, '단독 조 (1명)', 10_000);

                // Pick 1-merc saved group
                const pickedGrp = await clickButtonByText(page, '단독 조 (1명)');
                assert.ok(pickedGrp, 'Expected 1-merc saved group quick-pick button');
                await waitForText(page, '출전 용병 선택 (1/', 5000);

                // Deselect the sole picked mercenary ("레오")
                const deselectedLeo = await clickButtonByText(page, '레오 Lv.');
                assert.ok(deselectedLeo, 'Expected 레오 party toggle button');

                // Wait one animation frame + microtask turn to verify zero auto-refill
                await sleepMs(150);
                const partyState = await page.evaluate(() => {
                    const bodyText = document.body?.innerText ?? '';
                    const dispatchBtn = Array.from(document.querySelectorAll('button')).find((b) =>
                        (b.textContent ?? '').includes('원정 출정 확정')
                    );
                    return {
                        hasZeroCount: bodyText.includes('출전 용병 선택 (0/'),
                        dispatchDisabled: dispatchBtn ? dispatchBtn.disabled : null,
                    };
                });
                assert.equal(partyState.hasZeroCount, true, 'Party count must remain 0 after deselecting last merc');
                assert.equal(partyState.dispatchDisabled, true, 'Dispatch button must be disabled when party is empty');
            }
        );
        step('UI-5: Expedition modal last-merc deselection keeps party empty & dispatch disabled (no auto-refill)');

        console.log(`\n🎉 ALL ${passed} FULL-STACK AZIT UI VERIFICATION SUITES PASSED!`);
    } finally {
        await browser?.close().catch(() => {});
        if (proxyServer) {
            proxyServer.closeAllConnections?.();
            await new Promise<void>((resolve) => proxyServer?.close(() => resolve()));
        }
        killTreeSync(nextChild);
        killTreeSync(apiChild);
        await rmDirWithRetry(chromeDir);
        await rmDirWithRetry(tmpDir);
    }
}

main().catch((err: unknown) => {
    console.error('❌ test-azit-r-ui failed:', err);
    process.exit(1);
});
