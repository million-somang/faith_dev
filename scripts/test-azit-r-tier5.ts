import assert from 'node:assert/strict';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import * as serverEngine from '../apps/api-server/src/services/azit-combat.engine.js';
import * as catalog from '../apps/api-server/src/services/azit-game.catalog.js';
import * as clientEngine from '../apps/next-portal/src/utils/azitCombatEngine.js';

interface JsonEnvelope<T = Record<string, unknown>> {
    success: boolean;
    code?: string;
    message?: string;
    data?: T;
    apps?: Array<Record<string, unknown>>;
    news?: Array<Record<string, unknown>>;
    error?: {
        code?: number | string;
        errorCode?: string;
        message?: string;
    };
}

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
            const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code?: unknown }).code : undefined;
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

function withDb<T>(dbPath: string, fn: (db: Database.Database) => T): T {
    const db = new Database(dbPath);
    try {
        db.pragma('busy_timeout = 10000');
        return fn(db);
    } finally {
        db.close();
    }
}

async function httpJson<T = Record<string, unknown>>(
    baseUrl: string,
    method: 'GET' | 'POST',
    urlPath: string,
    opts?: { sessionId?: string; body?: unknown; rawBody?: string }
): Promise<{ status: number; json: JsonEnvelope<T>; rawText: string }> {
    const headers: Record<string, string> = {};
    if (opts?.sessionId) {
        headers.Cookie = `session_id=${opts.sessionId}`;
    }
    let bodyStr: string | undefined;
    if (opts?.rawBody !== undefined) {
        headers['Content-Type'] = 'application/json';
        bodyStr = opts.rawBody;
    } else if (opts?.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        bodyStr = JSON.stringify(opts.body);
    }
    const res = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers,
        body: bodyStr,
        signal: AbortSignal.timeout(15_000),
    });
    const rawText = await res.text();
    let json: JsonEnvelope<T>;
    try {
        json = JSON.parse(rawText) as JsonEnvelope<T>;
    } catch {
        json = { success: false, message: rawText };
    }
    return { status: res.status, json, rawText };
}

function initRule6Db(dbPath: string): void {
    withDb(dbPath, (db) => {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                password TEXT NOT NULL DEFAULT 'hash',
                password_hash TEXT NOT NULL DEFAULT 'hash',
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
            CREATE TABLE IF NOT EXISTS user_points (
                user_id INTEGER PRIMARY KEY,
                points INTEGER NOT NULL DEFAULT 0,
                pending_amount INTEGER NOT NULL DEFAULT 0,
                attendance_points INTEGER NOT NULL DEFAULT 0,
                activity_points INTEGER NOT NULL DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT,
                summary TEXT,
                source TEXT,
                link TEXT UNIQUE,
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
                description TEXT,
                hidden INTEGER NOT NULL DEFAULT 0
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

        // Seed >= 10 active non-game utility rows in mini_apps for Rule 6 verification
        const utilityTools: Array<[string, string, string, string, string]> = [
            ['다기능 계산기', 'calculator', 'fas fa-calculator', '/app/calculator/', 'calc'],
            ['이미지 업스케일 & 포맷 변환기', 'image-resizer', 'fas fa-images', '/app/image-resizer/', 'calc'],
            ['QR코드 생성기', 'qr-generator', 'fas fa-qrcode', '/app/qr-generator/', 'dev'],
            ['해외직구 관부가세 계산기', 'customs-calc', 'fas fa-plane-arrival', '/app/customs-calc/', 'calc'],
            ['이미지 글자 추출기', 'ocr', 'fas fa-file-alt', '/app/ocr/', 'text'],
            ['연차 극대화 플래너', 'vacation-planner', 'fas fa-umbrella-beach', '/app/vacation-planner/', 'calc'],
            ['스마트 투두 플래너', 'todo-list', 'fas fa-list-check', '/app/todo-list/', 'calc'],
            ['JSON 포매터', 'json-formatter', 'fas fa-code', '/app/json-formatter/', 'dev'],
            ['정규식 테스터', 'regex-tester', 'fas fa-terminal', '/app/regex-tester/', 'dev'],
            ['글자수 세기', 'char-counter', 'fas fa-align-left', '/app/char-counter/', 'text'],
            ['단위 변환기', 'unit-converter', 'fas fa-ruler', '/app/unit-converter/', 'calc'],
        ];
        const insertApp = db.prepare(`
            INSERT OR IGNORE INTO mini_apps (name, slug, icon_url, description, app_url, status, require_auth, sort_order, category)
            VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?)
        `);
        utilityTools.forEach(([name, slug, icon, url, cat], idx) => {
            insertApp.run(name, slug, icon, `${name} 도구`, url, idx + 1, cat);
        });

        // Seed a valid visible news row
        db.prepare(`
            INSERT OR IGNORE INTO news (id, title, summary, category, source, link, published_at, hidden)
            VALUES (1, 'Rule 6 Verified News', 'Summary', 'tech', 'FaithPortal', 'https://example.local/news/1', datetime('now'), 0)
        `).run();
    });
}

async function seedApiUser(
    apiBaseUrl: string,
    dbPath: string,
    opts: { label: string; points?: number; azitXp?: number }
): Promise<{ userId: number; sessionId: string }> {
    const email = `tier5-${opts.label}-${crypto.randomUUID()}@test.local`;
    const sessionId = `sess-tier5-${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const userId = withDb(dbPath, (db) => {
        const res = db.prepare(`
            INSERT INTO users (username, password, password_hash, email, name, role, status, level)
            VALUES (?, 'hash', 'hash', ?, ?, 'user', 'active', 1)
        `).run(`u_${opts.label}`, email, `Tester_${opts.label}`);
        const uid = Number(res.lastInsertRowid);
        db.prepare(`INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`).run(
            sessionId,
            uid,
            expiresAt
        );
        db.prepare(`
            INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
            VALUES (?, ?, 0, 0, 0)
        `).run(uid, opts.points ?? 50_000);
        return uid;
    });

    const stateRes = await httpJson(apiBaseUrl, 'GET', '/api/azit-game/state', { sessionId });
    assert.equal(stateRes.status, 200, `Init GET /state failed: ${stateRes.rawText}`);

    if (opts.azitXp && opts.azitXp > 0) {
        withDb(dbPath, (db) => {
            db.prepare(`UPDATE azit_profiles SET azit_xp = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(
                opts.azitXp,
                userId
            );
        });
        await httpJson(apiBaseUrl, 'GET', '/api/azit-game/state', { sessionId });
    }

    return { userId, sessionId };
}

async function main(): Promise<void> {
    let passed = 0;
    const step = (label: string) => {
        passed += 1;
        console.log(`✅ [${passed}] ${label}`);
    };

    // =========================================================================
    // 1. Combat Engine Splice Fix, 200F + 6-Zone BE/FE Parity & Boundary Probes
    // =========================================================================
    {
        const makeUnit = (): serverEngine.CombatUnitInput => ({
            unitId: 'ally-splice-test',
            side: 'ally',
            code: 'merc-leo',
            name: '레오',
            emoji: '🛡️',
            combatRole: 'tank',
            level: 1,
            maxHp: 200,
            atk: 1,
            def: 100,
            moveSpeed: 0,
            attackIntervalMs: 999999,
            range: 10,
            critPct: 0,
            mainSkill: {
                id: 'noop-main',
                name: 'noop',
                emoji: '🛡️',
                slot: 'main',
                effectKind: 'buff',
                targetScope: 'self',
                cooldownMs: 999999,
                powerPct: 100,
                perLevelPct: 0,
                range: 10,
                aoeRadius: 0,
                description: 'noop',
            },
            subSkill: {
                id: 'noop-sub',
                name: 'noop',
                emoji: '🛡️',
                slot: 'sub',
                effectKind: 'buff',
                targetScope: 'self',
                cooldownMs: 999999,
                powerPct: 100,
                perLevelPct: 0,
                range: 10,
                aoeRadius: 0,
                description: 'noop',
            },
            mainSkillLevel: 1,
            subSkillLevel: 1,
        });

        const farEnemy: serverEngine.CombatUnitInput = {
            ...makeUnit(),
            unitId: 'enemy-far',
            side: 'enemy',
            code: 'mon-slime',
            name: '멀리있는슬라임',
            combatRole: 'enemy-melee',
            maxHp: 5000,
        };

        const simInput: serverEngine.CombatSimulationInput = {
            mode: 'tower',
            seed: 42,
            allies: [makeUnit()],
            enemies: [farEnemy],
        };

        const beState = serverEngine.initCombatState(simInput);
        const feState = clientEngine.initCombatState(simInput as unknown as clientEngine.CombatSimulationInput);

        for (const st of [beState, feState]) {
            const u = st.units[0];
            u.hp = 100;
            u.periodicTimerMs = 950;
            u.attackCooldownMs = 999999;
            u.mainSkillCooldownMs = 999999;
            u.subSkillCooldownMs = 999999;
            u.statuses = [
                { kind: 'shield', remainingMs: 5000, value: 5 },
                { kind: 'burn', remainingMs: 5000, value: 20 },
                { kind: 'regen', remainingMs: 5000, value: 30 },
            ];
            const e = st.units[1];
            e.attackCooldownMs = 999999;
            e.mainSkillCooldownMs = 999999;
            e.subSkillCooldownMs = 999999;
        }

        serverEngine.stepCombatTick(beState, 100);
        clientEngine.stepCombatTick(feState, 100);

        assert.equal(beState.units[0].hp, 115, `BE splice test expected hp=115, got ${beState.units[0].hp}`);
        assert.equal(feState.units[0].hp, 115, `FE splice test expected hp=115, got ${feState.units[0].hp}`);
        assert.deepEqual(
            beState.units[0].statuses.map((s) => s.kind),
            ['burn', 'regen']
        );
        assert.deepEqual(
            feState.units[0].statuses.map((s) => s.kind),
            ['burn', 'regen']
        );
        step('Combat splice fix: [shield(5), burn(20), regen(30)] yields hp=115 on BE and FE');

        // Full 200F Tower + 6-zone BE/FE deterministic parity
        const sampleAllies = (['merc-leo', 'merc-rina', 'merc-serena'] as const).map((code, idx) =>
            catalog.buildMercCombatUnit({
                mercCode: code,
                level: 10,
                mainSkillLevel: 5,
                subSkillLevel: 4,
                unitId: `ally-${idx}-${code}`,
            })
        );
        for (let floor = 1; floor <= catalog.MAX_TOWER_FLOOR; floor += 1) {
            const floorDef = catalog.getTowerFloorDef(floor)!;
            const input: serverEngine.CombatSimulationInput = {
                mode: 'tower',
                seed: 5000 + floor * 131,
                allies: sampleAllies,
                enemies: catalog.buildTowerEnemyUnits(floorDef),
                elixirBoostPct: floor % 10 === 0 ? 12 : 0,
            };
            const be = serverEngine.runCombatSimulation(input);
            const fe = clientEngine.runCombatSimulation(input as unknown as clientEngine.CombatSimulationInput);
            assert.equal(be.won, fe.won, `Tower floor ${floor} won parity mismatch`);
            assert.equal(be.durationMs, fe.durationMs, `Tower floor ${floor} durationMs mismatch`);
            assert.equal(be.frames.length, fe.frames.length, `Tower floor ${floor} frames length mismatch`);
            assert.deepEqual(be.battleLog, fe.battleLog, `Tower floor ${floor} battleLog mismatch`);
            assert.deepEqual(
                be.unitOutcomes.map((u) => ({ id: u.unitId, hp: u.hp, dmg: u.damageDealt, heal: u.healingDone })),
                fe.unitOutcomes.map((u: { unitId: string; hp: number; damageDealt: number; healingDone: number }) => ({
                    id: u.unitId,
                    hp: u.hp,
                    dmg: u.damageDealt,
                    heal: u.healingDone,
                })),
                `Tower floor ${floor} unitOutcomes mismatch`
            );
        }
        for (const zone of catalog.AZIT_EXPEDITION_ZONES) {
            const input: serverEngine.CombatSimulationInput = {
                mode: 'expedition',
                seed: 9001 + zone.durationSec,
                allies: sampleAllies,
                enemies: catalog.buildZoneEnemyUnits(zone),
                dishBuffs: { powerBonusPct: 24 },
                elixirBoostPct: 12,
                deathRiskPct: zone.deathRiskPct,
            };
            const be = serverEngine.runCombatSimulation(input);
            const fe = clientEngine.runCombatSimulation(input as unknown as clientEngine.CombatSimulationInput);
            assert.equal(be.won, fe.won, `Zone ${zone.zoneId} won parity mismatch`);
            assert.equal(be.durationMs, fe.durationMs, `Zone ${zone.zoneId} durationMs mismatch`);
            assert.deepEqual(be.casualties, fe.casualties, `Zone ${zone.zoneId} casualties mismatch`);
            assert.deepEqual(be.battleLog, fe.battleLog, `Zone ${zone.zoneId} battleLog mismatch`);
        }
        step('BE/FE combat parity: 0 mismatches across all 200 Tower floors + all 6 expedition zones');

        // Edge & extreme dtMs checks
        const emptyAllies = serverEngine.runCombatSimulation({
            mode: 'tower',
            seed: 1,
            allies: [],
            enemies: [farEnemy],
        });
        assert.equal(emptyAllies.won, false);

        const emptyEnemies = serverEngine.runCombatSimulation({
            mode: 'tower',
            seed: 1,
            allies: [makeUnit()],
            enemies: [],
        });
        assert.equal(emptyEnemies.won, true);

        const zeroDmgStalemate = serverEngine.runCombatSimulation({
            mode: 'tower',
            seed: 1,
            allies: [makeUnit()],
            enemies: [farEnemy],
            maxDurationMs: 3000,
        });
        assert.equal(zeroDmgStalemate.won, false);
        assert.equal(zeroDmgStalemate.durationMs, 3000);

        const extremeDtState = serverEngine.initCombatState(simInput);
        for (const dt of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) {
            const prevTime = extremeDtState.timeMs;
            serverEngine.stepCombatTick(extremeDtState, dt);
            assert.equal(extremeDtState.timeMs, prevTime + serverEngine.COMBAT_TICK_MS);
        }

        const emptyPreview = clientEngine.buildCampPreviewSimulation({
            seed: 77,
            allies: [],
            monsters: [],
        });
        assert.ok(emptyPreview.frames.length >= 2);
        step('Combat edge & extreme dtMs/stalemate/empty-team checks passed');
    }

    // =========================================================================
    // 2. Isolated Server Boot (<10s Rule 6 Gate) + White-Box API Probes
    // =========================================================================
    const repoRoot = process.cwd();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faithportal-azit-r-tier5-'));
    const dbPath = path.join(tmpDir, 'tier5.db');
    let apiChild: ChildProcess | null = null;
    let dbPoolToClose: { end: () => Promise<void> } | null = null;

    try {
        initRule6Db(dbPath);
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

        const logs: string[] = [];
        apiChild.stdout?.on('data', (c: Buffer) => logs.push(c.toString('utf8')));
        apiChild.stderr?.on('data', (c: Buffer) => logs.push(c.toString('utf8')));

        let bootMs = -1;
        while (Date.now() - bootStart < 15_000) {
            if (apiChild.exitCode !== null) {
                throw new Error(`API server exited early (${apiChild.exitCode}):\n${logs.join('')}`);
            }
            try {
                const res = await fetch(`${apiBaseUrl}/health`, { signal: AbortSignal.timeout(1000) });
                if (res.status === 200) {
                    const body = (await res.json()) as { status?: string; db?: string };
                    if (body.status === 'ok' && body.db === 'connected') {
                        bootMs = Date.now() - bootStart;
                        break;
                    }
                }
            } catch {
                // booting
            }
            await sleepMs(100);
        }

        assert.ok(bootMs >= 0 && bootMs < 10_000, `Expected <10s boot bind, got ${bootMs}ms\n${logs.join('')}`);

        const healthRes = await httpJson(apiBaseUrl, 'GET', '/health');
        assert.equal(healthRes.status, 200);

        const miniAppsRes = await httpJson(apiBaseUrl, 'GET', '/api/mini-apps');
        assert.equal(miniAppsRes.status, 200, `GET /api/mini-apps failed: ${miniAppsRes.rawText}`);
        assert.equal(miniAppsRes.json.success, true);
        const appsList = Array.isArray(miniAppsRes.json.apps) ? miniAppsRes.json.apps : [];
        const activeNonGameTools = appsList.filter(
            (a) => a.status === 'active' && a.category !== 'game'
        );
        assert.ok(
            activeNonGameTools.length >= 10,
            `Rule 6 requires >= 10 active non-game utility tools, got ${activeNonGameTools.length}`
        );

        const newsRes = await httpJson(apiBaseUrl, 'GET', '/api/news?limit=1');
        assert.equal(newsRes.status, 200, `GET /api/news?limit=1 failed: ${newsRes.rawText}`);
        assert.equal(newsRes.json.success, true);
        step(`Rule 6 Boot (${bootMs}ms < 10s) & 3-Endpoint Gate (/health, /api/mini-apps=${activeNonGameTools.length}, /api/news) passed`);

        // =====================================================================
        // 3. Transactional Rollback Probes (claimExpedition & battleTowerFloor)
        // =====================================================================
        {
            const txUser = await seedApiUser(apiBaseUrl, dbPath, {
                label: 'tx-rollback',
                points: 100_000,
                azitXp: 10_000,
            });
            const hireRes = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/hire', {
                sessionId: txUser.sessionId,
                body: { mercCode: 'merc-leo' },
            });
            assert.equal(hireRes.status, 200);
            const hireRina = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/hire', {
                sessionId: txUser.sessionId,
                body: { mercCode: 'merc-rina' },
            });
            assert.equal(hireRina.status, 200);

            withDb(dbPath, (db) => {
                db.prepare(`
                    INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                    VALUES (?, 'dish-carrot-soup', 3, 2)
                    ON CONFLICT(user_id, recipe_id) DO UPDATE SET qty = 3, special_qty = 2
                `).run(txUser.userId);
            });

            // Buy elixir for tower rollback test
            const buyElixir = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/shop/buy', {
                sessionId: txUser.sessionId,
                body: { itemId: 'item-battle-elixir', qty: 2 },
            });
            assert.equal(buyElixir.status, 200);

            // Start expedition & backdate
            const startExp = await httpJson<{ state?: { activeExpeditions?: Array<{ id: number }> } }>(
                apiBaseUrl,
                'POST',
                '/api/azit-game/expeditions/start',
                {
                    sessionId: txUser.sessionId,
                    body: {
                        zoneId: 'zone-slime',
                        partyMercCodes: ['merc-leo'],
                        dishRecipeId: 'dish-carrot-soup',
                        dishQuality: 'normal',
                    },
                }
            );
            assert.equal(startExp.status, 200, startExp.rawText);
            const expId = startExp.json.data!.state!.activeExpeditions![0].id;
            withDb(dbPath, (db) => {
                db.prepare(`UPDATE azit_expeditions SET ends_at_ms = ? WHERE id = ?`).run(
                    Date.now() - 10_000,
                    expId
                );
            });

            const snapshotBeforeClaim = withDb(dbPath, (db) => {
                const pts = (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(txUser.userId) as { points: number }).points;
                const ledgerCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM azit_point_ledger WHERE user_id = ?`).get(txUser.userId) as { cnt: number }).cnt;
                const profile = db.prepare(`SELECT azit_xp, total_expeditions_won, total_expeditions_lost FROM azit_profiles WHERE user_id = ?`).get(txUser.userId) as {
                    azit_xp: number;
                    total_expeditions_won: number;
                    total_expeditions_lost: number;
                };
                const merc = db.prepare(`SELECT level, xp, status FROM azit_mercenaries WHERE user_id = ? AND merc_code = 'merc-leo'`).get(txUser.userId) as {
                    level: number;
                    xp: number;
                    status: string;
                };
                const matSum = (db.prepare(`SELECT COALESCE(SUM(qty), 0) AS s FROM azit_material_inventory WHERE user_id = ?`).get(txUser.userId) as { s: number }).s;
                const itemRows = db.prepare(`SELECT item_id, qty FROM azit_item_inventory WHERE user_id = ? ORDER BY item_id`).all(txUser.userId);
                const cropSum = (db.prepare(`SELECT COALESCE(SUM(harvest_qty), 0) AS s FROM azit_crop_inventory WHERE user_id = ?`).get(txUser.userId) as { s: number }).s;

                db.exec(`
                    CREATE TRIGGER trg_fail_claim
                    BEFORE UPDATE ON azit_expeditions
                    FOR EACH ROW
                    WHEN NEW.status IN ('won', 'lost')
                    BEGIN
                        SELECT RAISE(ABORT, 'SIMULATED_CLAIM_FAIL');
                    END;
                `);
                return { pts, ledgerCount, profile, merc, matSum, itemRows, cropSum };
            });

            const failedClaim = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/expeditions/claim', {
                sessionId: txUser.sessionId,
                body: { expeditionId: expId },
            });
            assert.equal(failedClaim.status, 500, `Expected 500 on triggered claim failure, got ${failedClaim.status}`);

            const afterFailedClaim = withDb(dbPath, (db) => {
                db.exec(`DROP TRIGGER IF EXISTS trg_fail_claim;`);
                const expStatus = (db.prepare(`SELECT status FROM azit_expeditions WHERE id = ?`).get(expId) as { status: string }).status;
                const pts = (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(txUser.userId) as { points: number }).points;
                const ledgerCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM azit_point_ledger WHERE user_id = ?`).get(txUser.userId) as { cnt: number }).cnt;
                const profile = db.prepare(`SELECT azit_xp, total_expeditions_won, total_expeditions_lost FROM azit_profiles WHERE user_id = ?`).get(txUser.userId) as {
                    azit_xp: number;
                    total_expeditions_won: number;
                    total_expeditions_lost: number;
                };
                const merc = db.prepare(`SELECT level, xp, status FROM azit_mercenaries WHERE user_id = ? AND merc_code = 'merc-leo'`).get(txUser.userId) as {
                    level: number;
                    xp: number;
                    status: string;
                };
                const matSum = (db.prepare(`SELECT COALESCE(SUM(qty), 0) AS s FROM azit_material_inventory WHERE user_id = ?`).get(txUser.userId) as { s: number }).s;
                const itemRows = db.prepare(`SELECT item_id, qty FROM azit_item_inventory WHERE user_id = ? ORDER BY item_id`).all(txUser.userId);
                const cropSum = (db.prepare(`SELECT COALESCE(SUM(harvest_qty), 0) AS s FROM azit_crop_inventory WHERE user_id = ?`).get(txUser.userId) as { s: number }).s;
                return { expStatus, pts, ledgerCount, profile, merc, matSum, itemRows, cropSum };
            });

            assert.equal(afterFailedClaim.expStatus, 'running');
            assert.equal(afterFailedClaim.pts, snapshotBeforeClaim.pts, 'user_points leaked after claim rollback!');
            assert.equal(afterFailedClaim.ledgerCount, snapshotBeforeClaim.ledgerCount, 'ledger leaked after claim rollback!');
            assert.deepEqual(afterFailedClaim.profile, snapshotBeforeClaim.profile, 'azit_profiles leaked after claim rollback!');
            assert.deepEqual(afterFailedClaim.merc, snapshotBeforeClaim.merc, 'azit_mercenaries leaked after claim rollback!');
            assert.equal(afterFailedClaim.matSum, snapshotBeforeClaim.matSum, 'materials leaked after claim rollback!');
            assert.deepEqual(afterFailedClaim.itemRows, snapshotBeforeClaim.itemRows, 'items leaked after claim rollback!');
            assert.equal(afterFailedClaim.cropSum, snapshotBeforeClaim.cropSum, 'crops leaked after claim rollback!');

            const retryClaim = await httpJson<{ report?: { rewardPoints: number; rewardXp: number } }>(
                apiBaseUrl,
                'POST',
                '/api/azit-game/expeditions/claim',
                { sessionId: txUser.sessionId, body: { expeditionId: expId } }
            );
            assert.equal(retryClaim.status, 200, retryClaim.rawText);
            const expectedGain = retryClaim.json.data!.report!.rewardPoints;
            const expectedXpGain = retryClaim.json.data!.report!.rewardXp;

            withDb(dbPath, (db) => {
                const ptsAfterRetry = (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(txUser.userId) as { points: number }).points;
                const xpAfterRetry = (db.prepare(`SELECT azit_xp FROM azit_profiles WHERE user_id = ?`).get(txUser.userId) as { azit_xp: number }).azit_xp;
                assert.equal(ptsAfterRetry, snapshotBeforeClaim.pts + expectedGain, 'Single exact payout after retry failed');
                assert.equal(xpAfterRetry, snapshotBeforeClaim.profile.azit_xp + expectedXpGain, 'Single exact Azit XP after retry failed');
            });
            step('Transactional rollback probe: claimExpedition rolls back 100% on trigger abort & retries with exact single payout');

            // Tower battle rollback probe (with elixir)
            const snapBeforeTower = withDb(dbPath, (db) => {
                const pts = (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(txUser.userId) as { points: number }).points;
                const ledgerCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM azit_point_ledger WHERE user_id = ?`).get(txUser.userId) as { cnt: number }).cnt;
                const azitXp = (db.prepare(`SELECT azit_xp FROM azit_profiles WHERE user_id = ?`).get(txUser.userId) as { azit_xp: number }).azit_xp;
                const merc = db.prepare(`SELECT level, xp FROM azit_mercenaries WHERE user_id = ? AND merc_code = 'merc-leo'`).get(txUser.userId) as { level: number; xp: number };
                const elixirQty = (db.prepare(`SELECT qty FROM azit_item_inventory WHERE user_id = ? AND item_id = 'item-battle-elixir'`).get(txUser.userId) as { qty: number }).qty;
                const towerProg = db.prepare(`SELECT highest_cleared_floor, total_clears, total_attempts FROM azit_tower_progress WHERE user_id = ?`).get(txUser.userId);
                const runCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM azit_tower_runs WHERE user_id = ?`).get(txUser.userId) as { cnt: number }).cnt;

                db.exec(`
                    CREATE TRIGGER trg_fail_tower
                    BEFORE INSERT ON azit_tower_runs
                    FOR EACH ROW
                    BEGIN
                        SELECT RAISE(ABORT, 'SIMULATED_TOWER_FAIL');
                    END;
                `);
                return { pts, ledgerCount, azitXp, merc, elixirQty, towerProg, runCount };
            });

            const failedTower = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/tower/battle', {
                sessionId: txUser.sessionId,
                body: {
                    floor: 1,
                    partyMercCodes: ['merc-leo', 'merc-rina'],
                    elixirItemId: 'item-battle-elixir',
                },
            });
            assert.equal(failedTower.status, 500, `Expected 500 on triggered tower failure, got ${failedTower.status}`);

            const afterFailedTower = withDb(dbPath, (db) => {
                db.exec(`DROP TRIGGER IF EXISTS trg_fail_tower;`);
                const pts = (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(txUser.userId) as { points: number }).points;
                const ledgerCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM azit_point_ledger WHERE user_id = ?`).get(txUser.userId) as { cnt: number }).cnt;
                const azitXp = (db.prepare(`SELECT azit_xp FROM azit_profiles WHERE user_id = ?`).get(txUser.userId) as { azit_xp: number }).azit_xp;
                const merc = db.prepare(`SELECT level, xp FROM azit_mercenaries WHERE user_id = ? AND merc_code = 'merc-leo'`).get(txUser.userId) as { level: number; xp: number };
                const elixirQty = (db.prepare(`SELECT qty FROM azit_item_inventory WHERE user_id = ? AND item_id = 'item-battle-elixir'`).get(txUser.userId) as { qty: number }).qty;
                const towerProg = db.prepare(`SELECT highest_cleared_floor, total_clears, total_attempts FROM azit_tower_progress WHERE user_id = ?`).get(txUser.userId);
                const runCount = (db.prepare(`SELECT COUNT(*) AS cnt FROM azit_tower_runs WHERE user_id = ?`).get(txUser.userId) as { cnt: number }).cnt;
                return { pts, ledgerCount, azitXp, merc, elixirQty, towerProg, runCount };
            });

            assert.equal(afterFailedTower.pts, snapBeforeTower.pts, 'Tower rollback leaked points');
            assert.equal(afterFailedTower.ledgerCount, snapBeforeTower.ledgerCount, 'Tower rollback leaked ledger');
            assert.equal(afterFailedTower.azitXp, snapBeforeTower.azitXp, 'Tower rollback leaked azitXp');
            assert.deepEqual(afterFailedTower.merc, snapBeforeTower.merc, 'Tower rollback leaked merc XP');
            assert.equal(afterFailedTower.elixirQty, snapBeforeTower.elixirQty, 'Tower rollback failed to restore elixir!');
            assert.deepEqual(afterFailedTower.towerProg, snapBeforeTower.towerProg, 'Tower rollback leaked progress');
            assert.equal(afterFailedTower.runCount, snapBeforeTower.runCount);

            const retryTower = await httpJson<{ won: boolean; rewards: { veraPoints: number } }>(
                apiBaseUrl,
                'POST',
                '/api/azit-game/tower/battle',
                {
                    sessionId: txUser.sessionId,
                    body: {
                        floor: 1,
                        partyMercCodes: ['merc-leo', 'merc-rina'],
                        elixirItemId: 'item-battle-elixir',
                    },
                }
            );
            assert.equal(retryTower.status, 200, retryTower.rawText);
            assert.equal(retryTower.json.data!.won, true);

            withDb(dbPath, (db) => {
                const ptsAfter = (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(txUser.userId) as { points: number }).points;
                const elixirAfter = (db.prepare(`SELECT qty FROM azit_item_inventory WHERE user_id = ? AND item_id = 'item-battle-elixir'`).get(txUser.userId) as { qty: number }).qty;
                const progAfter = db.prepare(`SELECT highest_cleared_floor, total_clears, total_attempts FROM azit_tower_progress WHERE user_id = ?`).get(txUser.userId) as {
                    highest_cleared_floor: number;
                    total_clears: number;
                    total_attempts: number;
                };
                assert.equal(ptsAfter, snapBeforeTower.pts + retryTower.json.data!.rewards.veraPoints);
                assert.equal(elixirAfter, snapBeforeTower.elixirQty - 1);
                assert.equal(progAfter.highest_cleared_floor, 1);
                assert.equal(progAfter.total_attempts, 1);
            });
            step('Transactional rollback probe: battleTowerFloor rolls back rewards/progress/elixir 100% & retries cleanly');
        }

        // =====================================================================
        // 4. Cross-User IDOR, Contradictory Dish Params & Input Fuzzing Probes
        // =====================================================================
        {
            const victim = await seedApiUser(apiBaseUrl, dbPath, { label: 'victim', points: 50_000, azitXp: 3000 });
            const attacker = await seedApiUser(apiBaseUrl, dbPath, { label: 'attacker', points: 50_000, azitXp: 3000 });

            await httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/hire', {
                sessionId: victim.sessionId,
                body: { mercCode: 'merc-leo' },
            });
            await httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/hire', {
                sessionId: attacker.sessionId,
                body: { mercCode: 'merc-leo' },
            });

            const grpRes = await httpJson<{ group?: { id: number } }>(
                apiBaseUrl,
                'POST',
                '/api/azit-game/groups/save',
                {
                    sessionId: victim.sessionId,
                    body: { name: 'VictimSquad', mercCodes: ['merc-leo'] },
                }
            );
            assert.equal(grpRes.status, 200);
            const victimGroupId = grpRes.json.data!.group!.id;

            withDb(dbPath, (db) => {
                db.prepare(`
                    INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                    VALUES (?, 'dish-carrot-soup', 3, 2)
                    ON CONFLICT(user_id, recipe_id) DO UPDATE SET qty = 3, special_qty = 2
                `).run(victim.userId);
                db.prepare(`
                    INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                    VALUES (?, 'dish-carrot-soup', 3, 2)
                    ON CONFLICT(user_id, recipe_id) DO UPDATE SET qty = 3, special_qty = 2
                `).run(attacker.userId);
            });

            const victimExpRes = await httpJson<{ state?: { activeExpeditions?: Array<{ id: number }> } }>(
                apiBaseUrl,
                'POST',
                '/api/azit-game/expeditions/start',
                {
                    sessionId: victim.sessionId,
                    body: { zoneId: 'zone-slime', groupId: victimGroupId, dishRecipeId: 'dish-carrot-soup' },
                }
            );
            assert.equal(victimExpRes.status, 200);
            const victimExpId = victimExpRes.json.data!.state!.activeExpeditions![0].id;

            // Attacker IDOR probes
            const idorSave = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/groups/save', {
                sessionId: attacker.sessionId,
                body: { id: victimGroupId, name: 'Hijacked', mercCodes: ['merc-leo'] },
            });
            assert.equal(idorSave.status, 404);

            const idorDel = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/groups/delete', {
                sessionId: attacker.sessionId,
                body: { groupId: victimGroupId },
            });
            assert.equal(idorDel.status, 404);

            const idorStart = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/expeditions/start', {
                sessionId: attacker.sessionId,
                body: { zoneId: 'zone-slime', groupId: victimGroupId, dishRecipeId: 'dish-carrot-soup' },
            });
            assert.equal(idorStart.status, 404);

            const idorClaim = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/expeditions/claim', {
                sessionId: attacker.sessionId,
                body: { expeditionId: victimExpId },
            });
            assert.equal(idorClaim.status, 404);

            const idorTower = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/tower/battle', {
                sessionId: attacker.sessionId,
                body: { floor: 1, groupId: victimGroupId },
            });
            assert.equal(idorTower.status, 404);

            withDb(dbPath, (db) => {
                const row = db.prepare(`SELECT name, is_deleted FROM azit_mercenary_groups WHERE id = ?`).get(victimGroupId) as {
                    name: string;
                    is_deleted: number;
                };
                assert.equal(row.name, 'VictimSquad');
                assert.equal(row.is_deleted, 0);
            });
            step('Cross-user IDOR probes rejected (404) across groups/save, groups/delete, expeditions/start, expeditions/claim, tower/battle');

            // Contradictory dishQuality & useSpecialDish -> 400 INVALID_BODY
            const contra1 = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/expeditions/start', {
                sessionId: attacker.sessionId,
                body: {
                    zoneId: 'zone-slime',
                    partyMercCodes: ['merc-leo'],
                    dishRecipeId: 'dish-carrot-soup',
                    dishQuality: 'normal',
                    useSpecialDish: true,
                },
            });
            assert.equal(contra1.status, 400);
            assert.equal(contra1.json.code, 'INVALID_BODY');

            const contra2 = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/expeditions/start', {
                sessionId: attacker.sessionId,
                body: {
                    zoneId: 'zone-slime',
                    partyMercCodes: ['merc-leo'],
                    dishRecipeId: 'dish-carrot-soup',
                    dishQuality: 'special',
                    useSpecialDish: false,
                },
            });
            assert.equal(contra2.status, 400);
            assert.equal(contra2.json.code, 'INVALID_BODY');

            withDb(dbPath, (db) => {
                const d = db.prepare(`SELECT qty, special_qty FROM azit_dish_inventory WHERE user_id = ? AND recipe_id = 'dish-carrot-soup'`).get(attacker.userId) as {
                    qty: number;
                    special_qty: number;
                };
                assert.equal(d.qty, 3);
                assert.equal(d.special_qty, 2);
            });
            step('Contradictory { dishQuality, useSpecialDish } payloads rejected with 400 INVALID_BODY without consuming dishes');

            // Numeric & JSON Fuzzing + 403 GOLD_UPGRADE_DISABLED + Tower bounds
            const badJson = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/shop/buy', {
                sessionId: attacker.sessionId,
                rawBody: '{bad-json',
            });
            assert.equal(badJson.status, 400);

            for (const badQty of [1e30, Number.MAX_SAFE_INTEGER, 1.5, -1, 0, '', true]) {
                const res = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/shop/buy', {
                    sessionId: attacker.sessionId,
                    body: { itemId: 'item-revival-herb', qty: badQty },
                });
                assert.equal(res.status, 400, `Expected 400 for qty=${String(badQty)}, got ${res.status}`);
            }

            for (const badFloor of [1.5, 0, -1, 201, 'abc']) {
                const res = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/tower/battle', {
                    sessionId: attacker.sessionId,
                    body: { floor: badFloor, partyMercCodes: ['merc-leo'] },
                });
                assert.equal(res.status, 400, `Expected 400 for floor=${String(badFloor)}, got ${res.status}`);
            }

            const blankGrp = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/groups/save', {
                sessionId: attacker.sessionId,
                body: { name: '   ', mercCodes: ['merc-leo'] },
            });
            assert.equal(blankGrp.status, 400);

            const goldUpgrade = await httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/upgrade', {
                sessionId: attacker.sessionId,
                body: { mercCode: 'merc-leo' },
            });
            assert.equal(goldUpgrade.status, 403);
            assert.equal(goldUpgrade.json.code, 'GOLD_UPGRADE_DISABLED');

            for (const qs of ['?from=0&to=10', '?from=1&to=201', '?from=10&to=5', '?from=abc&to=10']) {
                const res = await httpJson(apiBaseUrl, 'GET', `/api/azit-game/tower/floors${qs}`, {
                    sessionId: attacker.sessionId,
                });
                assert.equal(res.status, 400, `Expected 400 for tower/floors${qs}, got ${res.status}`);
            }
            step('Numeric/JSON fuzzing, 403 GOLD_UPGRADE_DISABLED & invalid tower/floors bounds rejected cleanly');
        }

        // =====================================================================
        // 5. Concurrency Races (Fresh Init, Double Claim, 1-Herb Revive)
        // =====================================================================
        {
            // 5a. Fresh-user init race across getTowerFloors & getState
            const freshEmail = `fresh-race-${crypto.randomUUID()}@test.local`;
            const freshSess = `sess-fresh-${crypto.randomUUID()}`;
            withDb(dbPath, (db) => {
                const u = db.prepare(`
                    INSERT INTO users (username, password, password_hash, email, name, role, status, level)
                    VALUES ('fresh_race', 'hash', 'hash', ?, 'FreshRace', 'user', 'active', 1)
                `).run(freshEmail);
                db.prepare(`INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`).run(
                    freshSess,
                    Number(u.lastInsertRowid),
                    new Date(Date.now() + 3600_000).toISOString()
                );
            });

            const initResponses = await Promise.all([
                httpJson(apiBaseUrl, 'GET', '/api/azit-game/tower/floors', { sessionId: freshSess }),
                httpJson(apiBaseUrl, 'GET', '/api/azit-game/state', { sessionId: freshSess }),
                httpJson(apiBaseUrl, 'GET', '/api/azit-game/tower/floors?from=1&to=40', { sessionId: freshSess }),
            ]);
            for (const r of initResponses) {
                assert.equal(r.status, 200, `Fresh concurrent init failed: ${r.rawText}`);
                assert.equal(r.json.success, true);
            }

            // 5b. Concurrent double expeditions/claim
            const raceUser = await seedApiUser(apiBaseUrl, dbPath, { label: 'race', points: 50_000, azitXp: 5000 });
            await httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/hire', {
                sessionId: raceUser.sessionId,
                body: { mercCode: 'merc-leo' },
            });
            await httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/hire', {
                sessionId: raceUser.sessionId,
                body: { mercCode: 'merc-rina' },
            });
            withDb(dbPath, (db) => {
                db.prepare(`
                    INSERT INTO azit_dish_inventory (user_id, recipe_id, qty, special_qty)
                    VALUES (?, 'dish-carrot-soup', 2, 0)
                    ON CONFLICT(user_id, recipe_id) DO UPDATE SET qty = 2
                `).run(raceUser.userId);
            });
            const startRaceExp = await httpJson<{ state?: { activeExpeditions?: Array<{ id: number }> } }>(
                apiBaseUrl,
                'POST',
                '/api/azit-game/expeditions/start',
                {
                    sessionId: raceUser.sessionId,
                    body: { zoneId: 'zone-slime', partyMercCodes: ['merc-leo'], dishRecipeId: 'dish-carrot-soup' },
                }
            );
            assert.equal(startRaceExp.status, 200);
            const raceExpId = startRaceExp.json.data!.state!.activeExpeditions![0].id;
            withDb(dbPath, (db) => {
                db.prepare(`UPDATE azit_expeditions SET ends_at_ms = ? WHERE id = ?`).run(
                    Date.now() - 5000,
                    raceExpId
                );
            });

            const ptsBeforeDoubleClaim = withDb(dbPath, (db) => {
                return (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(raceUser.userId) as { points: number }).points;
            });

            const doubleClaims = await Promise.all([
                httpJson<{ report?: { rewardPoints: number } }>(
                    apiBaseUrl,
                    'POST',
                    '/api/azit-game/expeditions/claim',
                    { sessionId: raceUser.sessionId, body: { expeditionId: raceExpId } }
                ),
                httpJson<{ report?: { rewardPoints: number } }>(
                    apiBaseUrl,
                    'POST',
                    '/api/azit-game/expeditions/claim',
                    { sessionId: raceUser.sessionId, body: { expeditionId: raceExpId } }
                ),
            ]);
            const claimOk = doubleClaims.filter((r) => r.status === 200);
            const claimReject = doubleClaims.filter((r) => r.status >= 400);
            assert.equal(claimOk.length, 1, `Expected exactly 1 claim success, got ${doubleClaims.map((r) => r.status)}`);
            assert.equal(claimReject.length, 1);

            const singleReward = claimOk[0].json.data!.report!.rewardPoints;
            withDb(dbPath, (db) => {
                const ptsAfter = (db.prepare(`SELECT points FROM user_points WHERE user_id = ?`).get(raceUser.userId) as { points: number }).points;
                assert.equal(ptsAfter, ptsBeforeDoubleClaim + singleReward);
            });

            // 5c. Concurrent revive with 1 herb across 2 dead mercs
            withDb(dbPath, (db) => {
                db.prepare(`
                    UPDATE azit_mercenaries
                    SET status = 'dead', died_at = CURRENT_TIMESTAMP, death_zone_id = 'zone-slime'
                    WHERE user_id = ? AND merc_code IN ('merc-leo', 'merc-rina')
                `).run(raceUser.userId);
                db.prepare(`
                    INSERT INTO azit_item_inventory (user_id, item_id, qty)
                    VALUES (?, 'item-revival-herb', 1)
                    ON CONFLICT(user_id, item_id) DO UPDATE SET qty = 1, is_deleted = 0
                `).run(raceUser.userId);
            });

            const reviveRace = await Promise.all([
                httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/revive', {
                    sessionId: raceUser.sessionId,
                    body: { mercCode: 'merc-leo', itemId: 'item-revival-herb' },
                }),
                httpJson(apiBaseUrl, 'POST', '/api/azit-game/mercenaries/revive', {
                    sessionId: raceUser.sessionId,
                    body: { mercCode: 'merc-rina', itemId: 'item-revival-herb' },
                }),
            ]);
            const reviveOk = reviveRace.filter((r) => r.status === 200);
            const reviveFail = reviveRace.filter((r) => r.status === 400);
            assert.equal(reviveOk.length, 1, `Expected 1 revive success, got ${reviveRace.map((r) => r.status)}`);
            assert.equal(reviveFail.length, 1);

            withDb(dbPath, (db) => {
                const herbQty = (db.prepare(`SELECT qty FROM azit_item_inventory WHERE user_id = ? AND item_id = 'item-revival-herb'`).get(raceUser.userId) as { qty: number }).qty;
                assert.equal(herbQty, 0);
            });
            step('Concurrency races: fresh init, double claim, and 1-herb dual revive passed atomically');
        }

        // =====================================================================
        // 6. Cross-Caller SQLite Transaction Rollback Isolation Probe (Same Microtask Turn)
        // =====================================================================
        {
            const txLeakDbPath = path.join(tmpDir, 'tier5-tx-leak.db');
            initRule6Db(txLeakDbPath);

            const prevDbPathEnv = process.env.DATABASE_PATH;
            process.env.DATABASE_PATH = txLeakDbPath;
            try {
                const dbMod = await import('@faithportal/database');
                dbPoolToClose = dbMod.pool;
                const { AzitGameService } = await import('../apps/api-server/src/services/azit-game.service.js');

                const { uA, uB } = withDb(txLeakDbPath, (db) => {
                    const insUser = db.prepare(`
                        INSERT INTO users (username, password, password_hash, email, name, role, status, level)
                        VALUES (?, 'hash', 'hash', ?, ?, 'user', 'active', 1)
                    `);
                    const insPts = db.prepare(`
                        INSERT INTO user_points (user_id, points, pending_amount, attendance_points, activity_points)
                        VALUES (?, 50000, 0, 0, 0)
                    `);
                    const idA = Number(insUser.run('txleak_a', `txleak-a-${crypto.randomUUID()}@test.local`, 'TxLeakA').lastInsertRowid);
                    const idB = Number(insUser.run('txleak_b', `txleak-b-${crypto.randomUUID()}@test.local`, 'TxLeakB').lastInsertRowid);
                    insPts.run(idA);
                    insPts.run(idB);
                    return { uA: idA, uB: idB };
                });

                await AzitGameService.ensureUserInitialized(uA);
                await AzitGameService.ensureUserInitialized(uB);
                await AzitGameService.hireMercenary(uB, 'merc-leo');

                // Give uA only 2 of 3 required craft-skill-stone ingredients (missing mat-forest-honey)
                withDb(txLeakDbPath, (db) => {
                    db.prepare(`
                        UPDATE azit_crop_inventory SET harvest_qty = 2
                        WHERE user_id = ? AND crop_id = 'crop-potato'
                    `).run(uA);
                    db.prepare(`
                        INSERT INTO azit_material_inventory (user_id, material_id, qty)
                        VALUES (?, 'mat-goblin-spice', 2)
                        ON CONFLICT(user_id, material_id) DO UPDATE SET qty = 2, is_deleted = 0
                    `).run(uA);
                });

                const afterMicrotaskTicks = async <T>(ticks: number, fn: () => Promise<T>): Promise<T> => {
                    for (let i = 0; i < ticks; i += 1) {
                        await Promise.resolve();
                    }
                    return fn();
                };

                for (const delayTicks of [0, 1, 2]) {
                    const grpName = `InterleaveGrp_${delayTicks}`;
                    const [craftRes, saveRes] = await Promise.allSettled([
                        AzitGameService.craftItem(uA, 'craft-skill-stone', 1),
                        afterMicrotaskTicks(delayTicks, () =>
                            AzitGameService.saveGroup(uB, { name: grpName, mercCodes: ['merc-leo'] })
                        ),
                    ]);
                    assert.equal(craftRes.status, 'rejected', `Expected craftItem(uA) rejection at delayTicks=${delayTicks}`);
                    assert.equal(saveRes.status, 'fulfilled', `Expected saveGroup(uB) fulfillment at delayTicks=${delayTicks}`);

                    withDb(txLeakDbPath, (db) => {
                        const row = db
                            .prepare(`SELECT id FROM azit_mercenary_groups WHERE user_id = ? AND name = ? AND is_deleted = 0`)
                            .get(uB, grpName) as { id: number } | undefined;
                        assert.ok(row?.id, `Rollback leak detected: ${grpName} vanished at delayTicks=${delayTicks}!`);
                        const potato = (
                            db
                                .prepare(`SELECT harvest_qty FROM azit_crop_inventory WHERE user_id = ? AND crop_id = 'crop-potato'`)
                                .get(uA) as { harvest_qty: number }
                        ).harvest_qty;
                        const spice = (
                            db
                                .prepare(`SELECT qty FROM azit_material_inventory WHERE user_id = ? AND material_id = 'mat-goblin-spice'`)
                                .get(uA) as { qty: number }
                        ).qty;
                        assert.equal(potato, 2, 'uA crop-potato leaked during rollback');
                        assert.equal(spice, 2, 'uA mat-goblin-spice leaked during rollback');
                    });
                }

                // Also interleave hireMercenary + buySeed with failing craftItem rollback
                const carrotBefore = withDb(txLeakDbPath, (db) => {
                    return (
                        db
                            .prepare(`SELECT seed_qty FROM azit_crop_inventory WHERE user_id = ? AND crop_id = 'crop-carrot'`)
                            .get(uB) as { seed_qty: number }
                    ).seed_qty;
                });

                const [craftRes2, hireRes, seedRes] = await Promise.allSettled([
                    AzitGameService.craftItem(uA, 'craft-skill-stone', 1),
                    AzitGameService.hireMercenary(uB, 'merc-rina'),
                    AzitGameService.buySeed(uB, 'crop-carrot', 3),
                ]);
                assert.equal(craftRes2.status, 'rejected');
                assert.equal(hireRes.status, 'fulfilled');
                assert.equal(seedRes.status, 'fulfilled');

                withDb(txLeakDbPath, (db) => {
                    const rina = db
                        .prepare(`SELECT id FROM azit_mercenaries WHERE user_id = ? AND merc_code = 'merc-rina' AND is_deleted = 0`)
                        .get(uB) as { id: number } | undefined;
                    assert.ok(rina?.id, 'hireMercenary(uB) vanished during uA rollback!');
                    const carrotSeeds = (
                        db
                            .prepare(`SELECT seed_qty FROM azit_crop_inventory WHERE user_id = ? AND crop_id = 'crop-carrot'`)
                            .get(uB) as { seed_qty: number }
                    ).seed_qty;
                    assert.equal(carrotSeeds, carrotBefore + 3, 'buySeed(uB) vanished during uA rollback!');
                });

                step('Cross-caller SQLite tx isolation: 0 rollback leaks across delayTicks=0,1,2 & hireMercenary/buySeed');
            } finally {
                if (prevDbPathEnv === undefined) {
                    delete process.env.DATABASE_PATH;
                } else {
                    process.env.DATABASE_PATH = prevDbPathEnv;
                }
            }
        }
    } finally {
        if (dbPoolToClose) {
            await dbPoolToClose.end().catch(() => {});
        }
        killTreeSync(apiChild);
        await rmDirWithRetry(tmpDir);
    }

    console.log(`\n🎉 ALL ${passed} AZIT TIER 5 ADVERSARIAL SUITES PASSED!`);
}

main().catch((err) => {
    console.error('❌ AZIT TIER 5 TEST FAILED:', err);
    process.exit(1);
});
