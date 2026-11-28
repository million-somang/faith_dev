import assert from 'node:assert/strict';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';
import puppeteer, { type Browser, type Page } from 'puppeteer';

export type JsonRecord = Record<string, unknown>;

export interface ApiResponse {
    status: number;
    json: JsonRecord;
    rawText: string;
}

export interface SeededUser {
    userId: number;
    sessionId: string;
    email: string;
    name: string;
}

export interface PageMonitorStats {
    consoleErrors: string[];
    pageErrors: string[];
    serverErrors: string[];
}

export type TestStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface TestCaseResult {
    id: string;
    tier: number;
    area: string;
    description: string;
    status: TestStatus;
    durationMs: number;
    error?: string;
    skipReason?: string;
}

export interface TestCaseDefinition {
    id: string;
    tier: number;
    area: string;
    description: string;
    requiresBrowser: boolean;
    run: (ctx: E2EContext) => Promise<void>;
}

export interface AzitItemCatalogEntry {
    itemId: string;
    name: string;
    category: string;
    shopPrice?: number | null;
    description?: string;
}

export interface AzitCraftIngredient {
    kind: string;
    id: string;
    qty: number;
}

export interface AzitCraftRecipeEntry {
    recipeId: string;
    name?: string;
    resultItemId?: string;
    resultQty?: number;
    pointsCost?: number;
    outputItemId?: string;
    outputQty?: number;
    goldCost?: number;
    requiredAzitLevel?: number;
    ingredients: AzitCraftIngredient[];
}

export function getCraftRecipeResultItemId(recipe: JsonRecord): string | undefined {
    if (typeof recipe.resultItemId === 'string') return recipe.resultItemId;
    if (typeof recipe.outputItemId === 'string') return recipe.outputItemId;
    return undefined;
}

export function getCraftRecipeResultQty(recipe: JsonRecord): number {
    if (typeof recipe.resultQty === 'number' && Number.isFinite(recipe.resultQty)) return recipe.resultQty;
    if (typeof recipe.outputQty === 'number' && Number.isFinite(recipe.outputQty)) return recipe.outputQty;
    return 1;
}

export function getCraftRecipePointsCost(recipe: JsonRecord): number {
    if (typeof recipe.pointsCost === 'number' && Number.isFinite(recipe.pointsCost)) return recipe.pointsCost;
    if (typeof recipe.goldCost === 'number' && Number.isFinite(recipe.goldCost)) return recipe.goldCost;
    return 0;
}

export interface AzitZoneCatalogEntry {
    zoneId: string;
    name: string;
    durationSec: number;
    entryCost: number;
    minDishTier: number;
    recommendedPower: number;
    requiredAzitLevel: number;
    dropMaterialId: string;
}

export interface AzitMercSkillInfo {
    id: string;
    name: string;
    description: string;
    level: number;
    maxLevel: number;
    cooldownMs: number;
    powerPct: number;
}

export interface AzitMercState {
    mercCode: string;
    name: string;
    role: string;
    level: number;
    xp: number;
    nextXp: number;
    power: number;
    hp?: number;
    maxHp?: number;
    atk?: number;
    def?: number;
    spd?: number;
    range?: number;
    status: string;
    diedAt?: string | null;
    deathZoneId?: string | null;
    upgradeCost: number | null;
    mainSkill?: AzitMercSkillInfo;
    subSkill?: AzitMercSkillInfo;
}

export interface AzitGroupState {
    id: number;
    name: string;
    slotIndex: number;
    mercCodes: string[];
}

export interface AzitActiveExpeditionState {
    id: number;
    zoneId: string;
    groupId?: number | null;
    groupName?: string | null;
    partyMercCodes: string[];
    dishRecipeId: string;
    dishQuality?: string;
    durationSec?: number;
    startedAtMs: number;
    endsAtMs: number;
    predictedWinRate: number;
}

export interface AzitItemInventoryEntry {
    itemId: string;
    qty: number;
}

export interface AzitStateData {
    veraPoints: number;
    profile: {
        azitLevel: number;
        azitXp: number;
        progressPct: number;
        limits: {
            maxMercs: number;
            maxPartySize: number;
            maxActiveExpeditions: number;
            kitchenSlots: number;
            gardenPlots: number;
        };
    };
    mercenaries: AzitMercState[];
    groups?: AzitGroupState[];
    activeExpeditions: AzitActiveExpeditionState[];
    recentExpeditions: Array<{ id: number; zoneId: string; status: string; rewardPoints: number }>;
    items?: AzitItemInventoryEntry[];
    materials: Record<string, number>;
    dishes: Record<string, number>;
    specialDishes?: Record<string, number>;
    garden: {
        harvestCounts: Record<string, number>;
        seedCounts: Record<string, number>;
    };
    tower?: {
        highestClearedFloor: number;
        maxFloor: number;
        totalClears: number;
        totalAttempts: number;
    };
    recentLedger: Array<{ deltaPoints: number; balanceAfter: number; txType: string; description: string }>;
    catalog: {
        zones: AzitZoneCatalogEntry[];
        items?: AzitItemCatalogEntry[];
        craftRecipes?: AzitCraftRecipeEntry[];
        towerThemes?: Array<{ name: string; floorStart: number; floorEnd: number }>;
    };
}

export interface E2EContext {
    repoRoot: string;
    tmpDir: string;
    dbPath: string;
    apiPort: number;
    apiBaseUrl: string;
    apiOnly: boolean;
    restartApiServer: () => Promise<void>;
    ensureNextAndBrowser: () => Promise<{ nextBaseUrl: string; browser: Browser }>;
    cleanup: () => Promise<void>;
}

export function isRecord(val: unknown): val is JsonRecord {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function asRecord(val: unknown, label = 'value'): JsonRecord {
    assert.ok(isRecord(val), `Expected ${label} to be a plain object, got ${typeof val}`);
    return val;
}

export function asArray(val: unknown, label = 'array'): unknown[] {
    assert.ok(Array.isArray(val), `Expected ${label} to be an array, got ${typeof val}`);
    return val;
}

export function asString(val: unknown, label = 'string'): string {
    assert.equal(typeof val, 'string', `Expected ${label} to be string, got ${typeof val}`);
    return val as string;
}

export function asNumber(val: unknown, label = 'number'): number {
    assert.ok(typeof val === 'number' && Number.isFinite(val), `Expected ${label} to be finite number, got ${String(val)}`);
    return val as number;
}

export function sleepMs(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function killTreeSync(child: ChildProcess | null): void {
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

export async function rmDirWithRetry(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) return;
    for (let i = 0; i < 20; i += 1) {
        try {
            fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
            return;
        } catch (err: unknown) {
            const code = isRecord(err) ? err.code : undefined;
            if (code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY') {
                await sleepMs(150);
                continue;
            }
            throw err;
        }
    }
}

export async function findFreePort(host = '127.0.0.1'): Promise<number> {
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

export function initBaselineDb(dbPath: string): void {
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

export async function spawnApiServer(
    repoRoot: string,
    dbPath: string,
    port: number
): Promise<{ child: ChildProcess; baseUrl: string; bootMs: number; logs: string[] }> {
    const baseUrl = `http://127.0.0.1:${port}`;
    const tsxCli = path.resolve(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const serverEntry = path.join('apps', 'api-server', 'src', 'server.ts');

    const bootStart = Date.now();
    const child = spawn(process.execPath, [tsxCli, serverEntry], {
        cwd: repoRoot,
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...process.env,
            PORT: String(port),
            DATABASE_PATH: dbPath,
            NODE_ENV: 'test',
            ENABLE_RSS_SCHEDULER: 'false',
            TELEGRAM_BOT_TOKEN: '',
            TELEGRAM_CHAT_ID: '',
        },
    });

    const logs: string[] = [];
    child.stdout?.on('data', (chunk: Buffer) => logs.push(chunk.toString('utf8')));
    child.stderr?.on('data', (chunk: Buffer) => logs.push(chunk.toString('utf8')));

    let boundMs = -1;
    while (Date.now() - bootStart < 15_000) {
        if (child.exitCode !== null) {
            throw new Error(`API server exited prematurely (${child.exitCode}):\n${logs.join('')}`);
        }
        try {
            const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
            if (res.status === 200) {
                const raw: unknown = await res.json();
                if (isRecord(raw) && raw.status === 'ok' && raw.db === 'connected') {
                    boundMs = Date.now() - bootStart;
                    break;
                }
            }
        } catch {
            // booting
        }
        await sleepMs(100);
    }

    if (boundMs < 0 || boundMs >= 10_000) {
        killTreeSync(child);
        throw new Error(`API server failed <10s health boot gate (boundMs=${boundMs}):\n${logs.join('')}`);
    }

    return { child, baseUrl, bootMs: boundMs, logs };
}

export async function startNextProxy(
    repoRoot: string,
    apiBaseUrl: string
): Promise<{ nextChild: ChildProcess; proxyServer: http.Server; baseUrl: string }> {
    const nextPortalDir = path.join(repoRoot, 'apps', 'next-portal');
    const buildIdPath = path.join(nextPortalDir, '.next', 'BUILD_ID');
    if (!fs.existsSync(buildIdPath)) {
        throw new Error(
            `Missing built Next.js artifact: ${buildIdPath}. Run "npm run build --workspace=@faithportal/next-portal" before running browser E2E tests.`
        );
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

    const nextLogs: string[] = [];
    nextChild.stdout?.on('data', (chunk: Buffer) => nextLogs.push(chunk.toString('utf8')));
    nextChild.stderr?.on('data', (chunk: Buffer) => nextLogs.push(chunk.toString('utf8')));

    const deadline = Date.now() + 25_000;
    let nextReady = false;
    while (Date.now() < deadline) {
        if (nextChild.exitCode !== null) {
            throw new Error(`next start exited prematurely (${nextChild.exitCode}):\n${nextLogs.join('')}`);
        }
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
        throw new Error(`Timed out waiting for next start:\n${nextLogs.join('')}`);
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

    try {
        await new Promise<void>((resolve, reject) => {
            proxyServer.once('error', reject);
            proxyServer.listen(proxyPort, '127.0.0.1', () => {
                proxyServer.off('error', reject);
                resolve();
            });
        });
    } catch (err) {
        proxyServer.closeAllConnections?.();
        proxyServer.close();
        killTreeSync(nextChild);
        throw err;
    }

    return { nextChild, proxyServer, baseUrl: `http://127.0.0.1:${proxyPort}` };
}

export function withDb(dbPath: string, fn: (db: Database.Database) => void): void {
    const db = new Database(dbPath);
    try {
        db.pragma('busy_timeout = 5000');
        fn(db);
    } finally {
        db.close();
    }
}

export function queryDb<T>(dbPath: string, fn: (db: Database.Database) => T): T {
    const db = new Database(dbPath);
    try {
        db.pragma('busy_timeout = 5000');
        return fn(db);
    } finally {
        db.close();
    }
}

export async function jsonGet(baseUrl: string, urlPath: string, sessionId?: string): Promise<ApiResponse> {
    const headers: Record<string, string> = {
        'User-Agent': 'FaithPortal-E2E-Azit/1.0',
    };
    if (sessionId) {
        headers.Cookie = `session_id=${sessionId}`;
    }
    const res = await fetch(`${baseUrl}${urlPath}`, { headers });
    const rawText = await res.text();
    let json: JsonRecord = { rawText };
    try {
        const parsed: unknown = JSON.parse(rawText);
        if (isRecord(parsed)) {
            json = parsed;
        }
    } catch {
        // non-JSON
    }
    return { status: res.status, json, rawText };
}

export async function rawPost(
    baseUrl: string,
    urlPath: string,
    sessionId?: string,
    rawBody?: string,
    contentType = 'application/json'
): Promise<ApiResponse> {
    const headers: Record<string, string> = {
        'User-Agent': 'FaithPortal-E2E-Azit/1.0',
    };
    if (sessionId) {
        headers.Cookie = `session_id=${sessionId}`;
    }
    if (rawBody !== undefined) {
        headers['Content-Type'] = contentType;
    }
    const res = await fetch(`${baseUrl}${urlPath}`, {
        method: 'POST',
        headers,
        body: rawBody,
    });
    const rawText = await res.text();
    let json: JsonRecord = { rawText };
    try {
        const parsed: unknown = JSON.parse(rawText);
        if (isRecord(parsed)) {
            json = parsed;
        }
    } catch {
        // non-JSON
    }
    return { status: res.status, json, rawText };
}

export async function jsonPost(
    baseUrl: string,
    urlPath: string,
    sessionId: string | undefined,
    body: JsonRecord
): Promise<ApiResponse> {
    return rawPost(baseUrl, urlPath, sessionId, JSON.stringify(body), 'application/json');
}

const LEVEL_XP_MAP: Array<{ level: number; xp: number }> = [
    { level: 1, xp: 0 },
    { level: 2, xp: 80 },
    { level: 3, xp: 220 },
    { level: 4, xp: 460 },
    { level: 5, xp: 820 },
    { level: 6, xp: 1350 },
    { level: 7, xp: 2100 },
    { level: 8, xp: 3100 },
    { level: 9, xp: 4400 },
    { level: 10, xp: 6200 },
    { level: 15, xp: 19700 },
    { level: 20, xp: 40700 },
];

export function xpForAzitLevel(level: number): number {
    let best = 0;
    for (const row of LEVEL_XP_MAP) {
        if (level >= row.level) {
            best = row.xp;
        }
    }
    return best;
}

export async function seedUser(
    ctx: E2EContext,
    opts: {
        label: string;
        points?: number;
        azitLevel?: number;
        azitXp?: number;
    }
): Promise<SeededUser> {
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${opts.label.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const email = `e2e-${suffix}@test.local`;
    const name = `E2E_${opts.label}`;
    const sessionId = `sess-e2e-${suffix}`;
    const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();

    let userId = 0;
    withDb(ctx.dbPath, (db) => {
        const res = db
            .prepare(
                `INSERT INTO users (username, email, password, name, role, status, level)
                 VALUES (?, ?, 'unused-hash', ?, 'user', 'active', 1)`
            )
            .run(`e2e_${suffix.slice(0, 20)}`, email, name);
        userId = Number(res.lastInsertRowid);
        db.prepare(`INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`).run(
            sessionId,
            userId,
            expiresAt
        );
    });

    // Initialize Azit profile & tables lazily via real HTTP GET /state
    const initRes = await jsonGet(ctx.apiBaseUrl, '/api/azit-game/state', sessionId);
    assert.equal(initRes.status, 200, `Failed to initialize user ${opts.label}: ${initRes.rawText}`);

    if (opts.points !== undefined) {
        withDb(ctx.dbPath, (db) => {
            db.prepare(
                `INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
                 VALUES (?, ?, 0, 0, 0)
                 ON CONFLICT(user_id) DO UPDATE SET points = excluded.points`
            ).run(userId, opts.points);
        });
    }

    if (opts.azitLevel !== undefined || opts.azitXp !== undefined) {
        const targetXp = opts.azitXp ?? xpForAzitLevel(opts.azitLevel ?? 1);
        const targetLevel = opts.azitLevel ?? 1;
        withDb(ctx.dbPath, (db) => {
            db.prepare(
                `UPDATE azit_profiles
                 SET azit_xp = ?, azit_level = ?, garden_migrated = 1
                 WHERE user_id = ?`
            ).run(targetXp, targetLevel, userId);
        });
    }

    return { userId, sessionId, email, name };
}

export async function getAzitState(ctx: E2EContext, sessionId: string): Promise<AzitStateData> {
    const res = await jsonGet(ctx.apiBaseUrl, '/api/azit-game/state', sessionId);
    assert.equal(res.status, 200, `GET /api/azit-game/state failed (${res.status}): ${res.rawText}`);
    assert.equal(res.json.success, true, `GET /api/azit-game/state success !== true: ${res.rawText}`);
    return asRecord(res.json.data, 'state.data') as unknown as AzitStateData;
}

export function extractErrorCode(res: ApiResponse): string {
    if (typeof res.json.code === 'string' && res.json.code.length > 0) {
        return res.json.code;
    }
    if (isRecord(res.json.error)) {
        if (typeof res.json.error.errorCode === 'string' && res.json.error.errorCode.length > 0) {
            return res.json.error.errorCode;
        }
        if (typeof res.json.error.code === 'string' && res.json.error.code.length > 0) {
            return res.json.error.code;
        }
    }
    return '';
}

export function backdateExpedition(dbPath: string, expeditionId: number, endsAtMs: number): void {
    withDb(dbPath, (db) => {
        const info = db
            .prepare(`UPDATE azit_expeditions SET ends_at_ms = ? WHERE id = ?`)
            .run(endsAtMs, expeditionId);
        assert.equal(info.changes, 1, `Expected to backdate expedition ${expeditionId}, updated ${info.changes}`);
    });
}

export function seedCropHarvest(dbPath: string, userId: number, cropId: string, qty: number): void {
    withDb(dbPath, (db) => {
        db.prepare(
            `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty)
             VALUES (?, ?, 0, ?)
             ON CONFLICT(user_id, crop_id) DO UPDATE SET harvest_qty = excluded.harvest_qty`
        ).run(userId, cropId, qty);
    });
}

export function seedMaterial(dbPath: string, userId: number, materialId: string, qty: number): void {
    withDb(dbPath, (db) => {
        db.prepare(
            `INSERT INTO azit_material_inventory (user_id, material_id, qty)
             VALUES (?, ?, ?)
             ON CONFLICT(user_id, material_id) DO UPDATE SET qty = excluded.qty`
        ).run(userId, materialId, qty);
    });
}

export function seedDish(dbPath: string, userId: number, recipeId: string, qty: number, specialQty = 0): void {
    withDb(dbPath, (db) => {
        db.prepare(
            `INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id, recipe_id) DO UPDATE SET qty = excluded.qty, special_qty = excluded.special_qty`
        ).run(userId, recipeId, qty, specialQty);
    });
}

export function seedItem(dbPath: string, userId: number, itemId: string, qty: number): void {
    withDb(dbPath, (db) => {
        db.prepare(
            `INSERT INTO azit_item_inventory (user_id, item_id, qty)
             VALUES (?, ?, ?)
             ON CONFLICT(user_id, item_id) DO UPDATE SET qty = excluded.qty`
        ).run(userId, itemId, qty);
    });
}

export function setMercDead(dbPath: string, userId: number, mercCode: string, deathZoneId = 'zone-wyvern'): void {
    withDb(dbPath, (db) => {
        const res = db
            .prepare(
                `UPDATE azit_mercenaries
                 SET status = 'dead', died_at = ?, death_zone_id = ?
                 WHERE user_id = ? AND merc_code = ?`
            )
            .run(new Date().toISOString(), deathZoneId, userId, mercCode);
        assert.equal(res.changes, 1, `Expected to set ${mercCode} dead for user ${userId}`);
    });
}

export function setTowerHighestFloor(dbPath: string, userId: number, highestClearedFloor: number): void {
    withDb(dbPath, (db) => {
        db.prepare(
            `INSERT INTO azit_tower_progress (user_id, highest_cleared_floor, total_clears, total_attempts)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET highest_cleared_floor = excluded.highest_cleared_floor`
        ).run(userId, highestClearedFloor, highestClearedFloor, highestClearedFloor);
    });
}

export async function openAuthedPage(
    browser: Browser,
    baseUrl: string,
    sessionId: string,
    viewport: { width: number; height: number },
    urlPath: string,
    fn: (page: Page, stats: PageMonitorStats) => Promise<void>,
    options?: { allowErrors?: boolean }
): Promise<PageMonitorStats> {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const stats: PageMonitorStats = {
        consoleErrors: [],
        pageErrors: [],
        serverErrors: [],
    };

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            stats.consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', (err) => {
        stats.pageErrors.push(err instanceof Error ? err.message : String(err));
    });
    page.on('response', (res) => {
        if (res.status() >= 500) {
            stats.serverErrors.push(`${res.status()} ${res.url()}`);
        }
    });

    try {
        await page.setViewport(viewport);
        await page.setCookie({
            name: 'session_id',
            value: sessionId,
            url: baseUrl,
            path: '/',
        });
        await page.goto(`${baseUrl}${urlPath}`, { waitUntil: 'networkidle2', timeout: 30_000 });
        await fn(page, stats);

        if (!options?.allowErrors) {
            assert.equal(
                stats.consoleErrors.length,
                0,
                `Expected 0 console.error messages, got: ${JSON.stringify(stats.consoleErrors)}`
            );
            assert.equal(
                stats.pageErrors.length,
                0,
                `Expected 0 pageerror events, got: ${JSON.stringify(stats.pageErrors)}`
            );
            assert.equal(
                stats.serverErrors.length,
                0,
                `Expected 0 HTTP 5xx responses, got: ${JSON.stringify(stats.serverErrors)}`
            );
        }
        return stats;
    } finally {
        await page.close().catch(() => {});
        await ctx.close().catch(() => {});
    }
}

export async function assertNoHorizontalOverflow(page: Page, contextLabel: string): Promise<void> {
    const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
    }));
    assert.ok(
        metrics.scrollWidth <= metrics.innerWidth,
        `${contextLabel}: horizontal overflow detected (scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth})`
    );
}

export async function assertCanvasAnimating(
    page: Page,
    selector: string,
    delayMs = 550
): Promise<{ width: number; height: number }> {
    const rect = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el || !(el instanceof HTMLCanvasElement)) return null;
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height, dataUrl: el.toDataURL('image/png') };
    }, selector);

    assert.ok(rect !== null, `Expected canvas matching "${selector}" to exist`);
    assert.ok(rect.width > 200 && rect.height > 100, `Canvas "${selector}" too small: ${rect.width}x${rect.height}`);

    await sleepMs(delayMs);

    const frame2 = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el || !(el instanceof HTMLCanvasElement)) return null;
        return el.toDataURL('image/png');
    }, selector);

    assert.ok(frame2 !== null, `Canvas "${selector}" disappeared during animation check`);
    assert.notEqual(rect.dataUrl, frame2, `Canvas "${selector}" pixels did not change over ${delayMs}ms (not animating)`);

    return { width: rect.width, height: rect.height };
}

export async function assertZIndexAboveNav(page: Page, overlaySelector: string): Promise<void> {
    const result = await page.evaluate((sel) => {
        const overlay = document.querySelector(sel);
        if (!overlay) return { found: false as const };
        const oStyle = window.getComputedStyle(overlay);
        const oRect = overlay.getBoundingClientRect();
        const oZ = Number.parseInt(oStyle.zIndex || '0', 10);

        const navEl = document.querySelector('header');
        const navZ = navEl ? Number.parseInt(window.getComputedStyle(navEl).zIndex || '0', 10) : 50;

        const mobileBar = document.querySelector('.mobile-tab-bar');
        const mobileZ = mobileBar ? Number.parseInt(window.getComputedStyle(mobileBar).zIndex || '0', 10) : 50;

        const topHit = document.elementFromPoint(window.innerWidth / 2, 20);
        const bottomHit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 15);

        return {
            found: true as const,
            position: oStyle.position,
            zIndex: Number.isFinite(oZ) ? oZ : 0,
            navZ: Number.isFinite(navZ) ? navZ : 50,
            mobileZ: Number.isFinite(mobileZ) ? mobileZ : 50,
            top: oRect.top,
            left: oRect.left,
            width: oRect.width,
            height: oRect.height,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            topCoveredByOverlay: Boolean(topHit && (overlay === topHit || overlay.contains(topHit))),
            bottomCoveredByOverlay: Boolean(bottomHit && (overlay === bottomHit || overlay.contains(bottomHit))),
        };
    }, overlaySelector);

    assert.ok(result.found, `Fullscreen overlay "${overlaySelector}" not found in DOM`);
    assert.equal(result.position, 'fixed', `Overlay "${overlaySelector}" must be position: fixed`);
    assert.ok(
        result.zIndex >= 70 && result.zIndex > result.navZ && result.zIndex > result.mobileZ,
        `Overlay z-index (${result.zIndex}) must be >= 70 and strictly above nav (${result.navZ}) & mobile bar (${result.mobileZ})`
    );
    assert.ok(
        result.width >= result.innerWidth - 2 && result.height >= result.innerHeight - 2,
        `Overlay "${overlaySelector}" (${result.width}x${result.height}) must fill viewport (${result.innerWidth}x${result.innerHeight})`
    );
    assert.ok(result.topCoveredByOverlay, 'Top viewport point (20px) is occluded by navbar instead of overlay');
    assert.ok(result.bottomCoveredByOverlay, 'Bottom viewport point (innerHeight-15) is occluded by mobile bar instead of overlay');
}

export async function clickButtonByText(page: Page, textSubstr: string, scopeSelector?: string): Promise<boolean> {
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

export async function waitForText(page: Page, textSubstr: string, timeoutMs = 15_000): Promise<void> {
    await page.waitForFunction(
        (substr: string) => (document.body?.innerText ?? '').includes(substr),
        { timeout: timeoutMs },
        textSubstr
    );
}

export async function getOpenModalText(page: Page, modalMarker?: string): Promise<string> {
    return page.evaluate((marker: string | null) => {
        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).filter(
            (el): el is HTMLElement => el instanceof HTMLElement
        );
        if (modals.length === 0) return '';
        const target = marker
            ? modals.find((m) => (m.innerText ?? '').includes(marker)) ?? modals[modals.length - 1]
            : modals[modals.length - 1];
        return target.innerText ?? '';
    }, modalMarker ?? null);
}

export async function clickModalButtonByText(
    page: Page,
    textSubstr: string,
    modalMarker?: string
): Promise<boolean> {
    return page.evaluate(
        ({ substr, marker }) => {
            const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).filter(
                (el): el is HTMLElement => el instanceof HTMLElement
            );
            if (modals.length === 0) return false;
            const target = marker
                ? modals.find((m) => (m.innerText ?? '').includes(marker)) ?? modals[modals.length - 1]
                : modals[modals.length - 1];
            const buttons = Array.from(target.querySelectorAll('button'));
            const match = buttons.find((b) => {
                const txt = (b.textContent ?? '').replace(/\s+/g, ' ').trim();
                return txt.includes(substr) && !b.disabled;
            });
            if (!match) return false;
            match.click();
            return true;
        },
        { substr: textSubstr, marker: modalMarker ?? null }
    );
}

export async function closeOpenModal(page: Page, modalMarker?: string): Promise<boolean> {
    return (
        (await clickModalButtonByText(page, '×', modalMarker)) ||
        (await page.evaluate((marker: string | null) => {
            const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).filter(
                (el): el is HTMLElement => el instanceof HTMLElement
            );
            if (modals.length === 0) return false;
            const target = marker
                ? modals.find((m) => (m.innerText ?? '').includes(marker)) ?? modals[modals.length - 1]
                : modals[modals.length - 1];
            const closeBtn = target.querySelector('button[aria-label*="닫기"]');
            if (closeBtn instanceof HTMLButtonElement && !closeBtn.disabled) {
                closeBtn.click();
                return true;
            }
            return false;
        }, modalMarker ?? null))
    );
}

export async function openMercGuildModal(page: Page, tabText?: string): Promise<void> {
    const isMercModalOpen = async (): Promise<boolean> =>
        page.evaluate(() => {
            const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
            return modals.some((m) => {
                const txt = m.textContent ?? '';
                return txt.includes('용병 길드 · 스킬 · 부활 · 보급소') || txt.includes('용병 길드');
            });
        });

    if (!(await isMercModalOpen())) {
        // Prefer 2-step tent node / '용병 길드' trigger, falling back to '부활 필요' or header quick-dock button
        const triggered = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const directGuildBtn = buttons.find((b) => {
                const txt = (b.textContent ?? '').replace(/\s+/g, ' ').trim();
                return (txt.includes('용병 길드') || txt.includes('부활 필요')) && !b.disabled;
            });
            if (directGuildBtn) {
                directGuildBtn.click();
                return true;
            }

            const tentNode = document.querySelector('[data-camp-node="tent"]');
            if (tentNode) {
                tentNode.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                return true;
            }

            const titleBtn = buttons.find((b) => {
                const title = b.getAttribute('title') ?? '';
                return title.includes('용병 길드') && !b.disabled;
            });
            if (titleBtn) {
                titleBtn.click();
                return true;
            }

            const headerMercBtn = buttons.find((b) => {
                const txt = (b.textContent ?? '').replace(/\s+/g, ' ').trim();
                return txt.includes('용병') && !txt.includes('캠프') && !b.disabled;
            });
            if (headerMercBtn) {
                headerMercBtn.click();
                return true;
            }
            return false;
        });
        assert.ok(triggered, 'Expected Mercenary Guild trigger ("용병 길드", tent node, or "부활 필요") in Camp UI');

        // Wait briefly for either the tent popover ('길드 열기') or the modal itself
        await page
            .waitForFunction(
                () => {
                    const hasOpenGuildBtn = Array.from(document.querySelectorAll('button')).some((b) => {
                        const txt = (b.textContent ?? '').replace(/\s+/g, ' ').trim();
                        return txt.includes('길드 열기') && !b.disabled;
                    });
                    const hasModal = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some(
                        (m) => {
                            const txt = m.textContent ?? '';
                            return txt.includes('용병 길드 · 스킬 · 부활 · 보급소') || txt.includes('용병 길드');
                        }
                    );
                    return hasOpenGuildBtn || hasModal;
                },
                { timeout: 5000 }
            )
            .catch(() => {});

        if (!(await isMercModalOpen())) {
            const clickedPopoverOpen = await clickButtonByText(page, '길드 열기');
            if (!clickedPopoverOpen) {
                // Fallback to header quick-dock button if tent popover did not render
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const fallback = buttons.find((b) => {
                        const title = b.getAttribute('title') ?? '';
                        const txt = (b.textContent ?? '').replace(/\s+/g, ' ').trim();
                        return (
                            !b.disabled &&
                            (title.includes('용병 길드') || (txt.includes('용병') && !txt.includes('캠프')))
                        );
                    });
                    fallback?.click();
                });
            }
        }

        await page.waitForFunction(
            () =>
                Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                    const txt = m.textContent ?? '';
                    return txt.includes('용병 길드 · 스킬 · 부활 · 보급소') || txt.includes('용병 길드');
                }),
            { timeout: 10_000 }
        );
    }

    if (tabText) {
        const clickedTab = await clickModalButtonByText(page, tabText, '용병 길드');
        assert.ok(clickedTab, `Expected tab "${tabText}" inside Mercenary Guild modal`);
        await sleepMs(250);
    }
}

export async function findCampBattlefieldCanvasSelector(
    page: Page,
    minWidth = 200,
    minHeight = 100
): Promise<string | null> {
    return page.evaluate(
        ({ reqW, reqH }) => {
            const directSelectors = [
                '[data-azit-battlefield="true"] canvas',
                '[data-camp-battlefield="true"] canvas',
                '[data-testid="azit-battlefield-canvas"]',
                'canvas[data-azit-battlefield]',
                '[data-camp-panel="true"] canvas',
            ];
            for (const sel of directSelectors) {
                const el = document.querySelector(sel);
                if (el instanceof HTMLCanvasElement) {
                    const r = el.getBoundingClientRect();
                    if (r.width >= reqW && r.height >= reqH) return sel;
                }
            }

            // Scoped opaque-box fallback: canvas must sit inside the Camp control/battlefield section
            // (ancestor with Camp/expedition text, and NEVER inside a fixed Tower fullscreen or dialog modal)
            const allCanvases = Array.from(document.querySelectorAll('canvas'));
            for (let i = 0; i < allCanvases.length; i += 1) {
                const c = allCanvases[i];
                const r = c.getBoundingClientRect();
                if (r.width < reqW || r.height < reqH) continue;
                if (c.closest('[data-tower-fullscreen="true"], [role="dialog"]')) continue;

                let insideFixedOverlay = false;
                let cur: HTMLElement | null = c.parentElement;
                let campSectionFound = false;
                while (cur && cur !== document.body && cur !== document.documentElement) {
                    const style = window.getComputedStyle(cur);
                    if (style.position === 'fixed') {
                        insideFixedOverlay = true;
                        break;
                    }
                    const txt = cur.innerText ?? '';
                    if (
                        !campSectionFound &&
                        (txt.includes('용병 토벌 캠프') ||
                            txt.includes('전장') ||
                            txt.includes('출정') ||
                            txt.includes('원정')) &&
                        !txt.includes('내 정보') &&
                        cur.tagName !== 'MAIN'
                    ) {
                        campSectionFound = true;
                    }
                    cur = cur.parentElement;
                }
                if (!insideFixedOverlay && campSectionFound) {
                    c.setAttribute('data-e2e-camp-canvas', String(i));
                    return `canvas[data-e2e-camp-canvas="${i}"]`;
                }
            }
            return null;
        },
        { reqW: minWidth, reqH: minHeight }
    );
}

export async function getCampBattlefieldContainerText(page: Page, canvasSelector: string): Promise<string> {
    return page.evaluate((sel) => {
        const direct = document.querySelector(
            '[data-azit-battlefield="true"], [data-camp-battlefield="true"], [data-camp-panel="true"]'
        );
        if (direct instanceof HTMLElement) {
            const directTxt = direct.innerText ?? '';
            if (directTxt.trim().length > 0 && /\d{1,2}:\d{2}:\d{2}/.test(directTxt)) {
                return directTxt;
            }
        }
        const canvas = document.querySelector(sel);
        if (!canvas) return '';
        let cur: HTMLElement | null = canvas.parentElement;
        while (cur && cur !== document.body) {
            const txt = cur.innerText ?? '';
            if (txt.includes('용병 토벌 캠프') || (/\d{1,2}:\d{2}:\d{2}/.test(txt) && txt.length < 2000)) {
                return txt;
            }
            cur = cur.parentElement;
        }
        return canvas.parentElement?.innerText ?? '';
    }, canvasSelector);
}

export async function createE2EContext(options?: { apiOnly?: boolean }): Promise<E2EContext> {
    const repoRoot = process.cwd();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-e2e-azit-'));
    let chromeDir = '';
    let serverChild: ChildProcess | null = null;
    let server: { child: ChildProcess; baseUrl: string; bootMs: number; logs: string[] };
    let apiPort = 0;
    const dbPath = path.join(tmpDir, 'e2e-azit.db');

    try {
        chromeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-e2e-chrome-'));
        initBaselineDb(dbPath);
        apiPort = await findFreePort('127.0.0.1');
        server = await spawnApiServer(repoRoot, dbPath, apiPort);
        serverChild = server.child;
    } catch (err) {
        killTreeSync(serverChild);
        if (chromeDir) await rmDirWithRetry(chromeDir).catch(() => {});
        await rmDirWithRetry(tmpDir).catch(() => {});
        throw err;
    }

    let nextChild: ChildProcess | null = null;
    let proxyServer: http.Server | null = null;
    let nextBaseUrl: string | null = null;
    let browser: Browser | null = null;

    const ctx: E2EContext = {
        repoRoot,
        tmpDir,
        dbPath,
        apiPort,
        apiBaseUrl: server.baseUrl,
        apiOnly: Boolean(options?.apiOnly),
        restartApiServer: async () => {
            killTreeSync(server.child);
            await sleepMs(200);
            server = await spawnApiServer(repoRoot, dbPath, apiPort);
        },
        ensureNextAndBrowser: async () => {
            if (!nextBaseUrl) {
                const nextSession = await startNextProxy(repoRoot, server.baseUrl);
                nextChild = nextSession.nextChild;
                proxyServer = nextSession.proxyServer;
                nextBaseUrl = nextSession.baseUrl;
            }
            if (!browser) {
                browser = await puppeteer.launch({
                    headless: true,
                    userDataDir: chromeDir,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
                });
            }
            return { nextBaseUrl, browser };
        },
        cleanup: async () => {
            if (browser) {
                await browser.close().catch(() => {});
                browser = null;
            }
            if (proxyServer) {
                proxyServer.closeAllConnections?.();
                await new Promise<void>((resolve) => proxyServer!.close(() => resolve()));
                proxyServer = null;
            }
            killTreeSync(nextChild);
            killTreeSync(server.child);
            await rmDirWithRetry(chromeDir);
            await rmDirWithRetry(tmpDir);
        },
    };

    return ctx;
}

export async function runCases(
    cases: TestCaseDefinition[],
    options?: {
        apiOnly?: boolean;
        filter?: string;
        keepGoing?: boolean;
        silent?: boolean;
    }
): Promise<TestCaseResult[]> {
    const apiOnly = options?.apiOnly ?? process.argv.includes('--api-only');
    const keepGoing = options?.keepGoing ?? true;
    const filter = options?.filter?.trim();
    const selected = filter
        ? cases.filter((c) => c.id.includes(filter) || c.description.includes(filter) || c.area.includes(filter))
        : cases;

    const results: TestCaseResult[] = [];
    if (selected.length === 0) return results;

    const ctx = await createE2EContext({ apiOnly });
    try {
        for (const tc of selected) {
            if (apiOnly && tc.requiresBrowser) {
                const skipped: TestCaseResult = {
                    id: tc.id,
                    tier: tc.tier,
                    area: tc.area,
                    description: tc.description,
                    status: 'SKIP',
                    durationMs: 0,
                    skipReason: 'Skipped in --api-only mode',
                };
                results.push(skipped);
                if (!options?.silent) {
                    console.log(`⏭️  [${tc.id}] ${tc.description} (${skipped.skipReason})`);
                }
                continue;
            }

            const t0 = Date.now();
            try {
                await tc.run(ctx);
                const passed: TestCaseResult = {
                    id: tc.id,
                    tier: tc.tier,
                    area: tc.area,
                    description: tc.description,
                    status: 'PASS',
                    durationMs: Date.now() - t0,
                };
                results.push(passed);
                if (!options?.silent) {
                    console.log(`✅ [${tc.id}] ${tc.description} (${passed.durationMs}ms)`);
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                const failed: TestCaseResult = {
                    id: tc.id,
                    tier: tc.tier,
                    area: tc.area,
                    description: tc.description,
                    status: 'FAIL',
                    durationMs: Date.now() - t0,
                    error: msg,
                };
                results.push(failed);
                if (!options?.silent) {
                    console.error(`❌ [${tc.id}] ${tc.description} (${failed.durationMs}ms)\n   → ${msg}`);
                }
                if (!keepGoing) break;
            }
        }
    } finally {
        await ctx.cleanup();
    }

    return results;
}

export function setMercLevelAndXp(dbPath: string, userId: number, mercCode: string, level: number, xp: number): void {
    withDb(dbPath, (db) => {
        const res = db
            .prepare(`UPDATE azit_mercenaries SET level = ?, xp = ? WHERE user_id = ? AND merc_code = ?`)
            .run(level, xp, userId, mercCode);
        assert.equal(res.changes, 1, `Expected to update level/xp on ${mercCode} for user ${userId}`);
    });
}

export function isMainModule(metaUrl: string): boolean {
    const entry = process.argv[1];
    if (!entry) return false;
    return metaUrl === pathToFileURL(path.resolve(entry)).href;
}

export async function runStandaloneTier(tierName: string, cases: TestCaseDefinition[]): Promise<void> {
    const apiOnly = process.argv.includes('--api-only');
    const filterArg = process.argv.find((a) => a.startsWith('--filter='));
    const filter = filterArg ? filterArg.slice('--filter='.length) : undefined;
    const results = await runCases(cases, { apiOnly, filter, keepGoing: true });
    const passCount = results.filter((r) => r.status === 'PASS').length;
    const failCount = results.filter((r) => r.status === 'FAIL').length;
    const skipCount = results.filter((r) => r.status === 'SKIP').length;
    console.log(`\n[${tierName}] PASS=${passCount} FAIL=${failCount} SKIP=${skipCount} TOTAL=${results.length}`);
    if (failCount > 0) {
        process.exit(1);
    }
}
