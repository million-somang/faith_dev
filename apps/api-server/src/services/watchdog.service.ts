import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pool } from '@faithportal/database';
import { PushService } from './push.service.js';

export type WatchdogStatus = 'ok' | 'degraded' | 'down';
export type WatchdogGroup = 'platform' | 'content' | 'tools' | 'finance_media';

export interface WatchdogHistorySlot {
    t: string;
    s: WatchdogStatus;
    ms: number;
    e?: string;
}

export interface WatchdogProbeResult {
    status: WatchdogStatus;
    summary: string;
    detail?: Record<string, unknown>;
    error?: string;
}

interface WatchdogProbeDef {
    key: string;
    group: WatchdogGroup;
    label: string;
    targetUrl: string;
    immediateAlert?: boolean;
    run: () => Promise<WatchdogProbeResult>;
}

export interface WatchdogCheckRow {
    check_key: string;
    group_name: WatchdogGroup;
    label: string;
    target_url: string;
    status: WatchdogStatus;
    latency_ms: number;
    summary: string;
    detail_json: string;
    consecutive_failures: number;
    last_checked_at: string;
    last_ok_at: string | null;
    last_error: string | null;
    last_alert_at: string | null;
    recent_history_json: string;
}

export interface WatchdogIncidentRow {
    id: number;
    check_key: string;
    label: string;
    severity: 'degraded' | 'down';
    status: 'open' | 'resolved';
    message: string;
    started_at: string;
    resolved_at: string | null;
    acknowledged_at: string | null;
    acknowledged_by: string | null;
    notified_channels: string | null;
}

const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;
const INITIAL_DELAY_MS = 15 * 1000;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const HISTORY_LIMIT = 24;
const NEWS_WARN_MINUTES = 90;
const NEWS_DOWN_MINUTES = 120;

const API_BASE = `http://127.0.0.1:${process.env.PORT || '4200'}`;
const PORTAL_BASE = process.env.PORTAL_INTERNAL_URL || 'http://127.0.0.1:3000';
const PUBLIC_WATCHDOG_URL = `${process.env.SITE_URL || 'https://veranex.app'}/admin/watchdog`;

let tablesReady = false;
let schedulerStarted = false;
let isRunning = false;
let lastRunAtMs: number | null = null;
let nextRunAtMs: number | null = null;

function parseUtcTimestampMs(ts?: string | null): number {
    if (!ts) return 0;
    const trimmed = String(ts).trim();
    if (!trimmed) return 0;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        return Date.parse(trimmed.replace(' ', 'T') + 'Z');
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatKstTime(dateInput: Date | string | number = Date.now()): string {
    const ms = typeof dateInput === 'string'
        ? parseUtcTimestampMs(dateInput)
        : (dateInput instanceof Date ? dateInput.getTime() : dateInput);
    if (!ms) return '-';
    const kst = new Date(ms + 9 * 60 * 60 * 1000);
    return kst.toISOString().replace('T', ' ').slice(0, 19);
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function resolveDbFilePath(): string {
    if (process.env.DATABASE_PATH) {
        return path.resolve(process.env.DATABASE_PATH);
    }
    let dir = process.cwd();
    while (!fs.existsSync(path.join(dir, 'faith-portal.db')) && dir !== path.parse(dir).root) {
        dir = path.dirname(dir);
    }
    return path.join(dir, 'faith-portal.db');
}

async function fetchJsonWithTimeout<T = Record<string, unknown>>(
    url: string,
    timeoutMs = 5000
): Promise<{ status: number; data: T }> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'VeraNex-Watchdog/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error(`HTTP ${res.status} JSON 파싱 실패`);
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    return { status: res.status, data: parsed as T };
}

async function fetchTextWithTimeout(
    url: string,
    timeoutMs = 5000
): Promise<{ status: number; text: string }> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'VeraNex-Watchdog/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    return { status: res.status, text };
}

export function isTelegramConfigured(): boolean {
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
    return Boolean(token && chatId);
}

async function sendTelegramMessage(htmlText: string): Promise<{ ok: boolean; error?: string }> {
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
    if (!token || !chatId) {
        return { ok: false, error: 'TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID가 설정되지 않았습니다.' };
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: htmlText,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
            signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            return { ok: false, error: `Telegram HTTP ${res.status}: ${errText.slice(0, 120)}` };
        }
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}

async function ensureWatchdogTables(): Promise<void> {
    if (tablesReady) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS watchdog_checks (
            check_key TEXT PRIMARY KEY,
            group_name TEXT NOT NULL,
            label TEXT NOT NULL,
            target_url TEXT NOT NULL,
            status TEXT NOT NULL,
            latency_ms INTEGER NOT NULL DEFAULT 0,
            summary TEXT NOT NULL DEFAULT '',
            detail_json TEXT NOT NULL DEFAULT '{}',
            consecutive_failures INTEGER NOT NULL DEFAULT 0,
            last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_ok_at DATETIME,
            last_error TEXT,
            last_alert_at DATETIME,
            recent_history_json TEXT NOT NULL DEFAULT '[]'
        );
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS watchdog_incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            check_key TEXT NOT NULL,
            label TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            message TEXT NOT NULL,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            acknowledged_at DATETIME,
            acknowledged_by TEXT,
            notified_channels TEXT DEFAULT ''
        );
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_watchdog_incidents_status_started
        ON watchdog_incidents(status, started_at DESC);
    `);
    tablesReady = true;
}

const WATCHDOG_PROBES: WatchdogProbeDef[] = [
    {
        key: 'core_api_db',
        group: 'platform',
        label: 'API & SQLite DB',
        targetUrl: '/health',
        immediateAlert: true,
        run: async () => {
            const t0 = Date.now();
            const { data } = await fetchJsonWithTimeout<{ status?: string; db?: string }>(`${API_BASE}/health`);
            await pool.query('SELECT 1 as ok');
            const ms = Date.now() - t0;
            if (data.status !== 'ok') {
                return { status: 'down', summary: `헬스 상태 이상 (${String(data.status)})`, error: 'health != ok' };
            }
            if (ms >= 1000) {
                return { status: 'degraded', summary: `응답 지연 (${ms}ms)`, detail: { ms } };
            }
            return { status: 'ok', summary: `DB 연결 정상 (${ms}ms)`, detail: { db: data.db || 'connected' } };
        },
    },
    {
        key: 'portal_ssr',
        group: 'platform',
        label: '포털 SSR (포트 3000)',
        targetUrl: '/',
        immediateAlert: true,
        run: async () => {
            const paths = ['/', '/news', '/lifestyle', '/game', '/finance'];
            const settled = await Promise.all(
                paths.map(async (p) => {
                    try {
                        const { status, text } = await fetchTextWithTimeout(`${PORTAL_BASE}${p}`, 5000);
                        return { path: p, ok: status === 200 && text.length > 1000, status };
                    } catch {
                        return { path: p, ok: false, status: 0 };
                    }
                })
            );
            const passed = settled.filter((r) => r.ok).length;
            const failedPaths = settled.filter((r) => !r.ok).map((r) => `${r.path}(${r.status})`);
            if (passed === paths.length) {
                return { status: 'ok', summary: `핵심 ${passed}/${paths.length} 페이지 정상`, detail: { paths: settled } };
            }
            if (passed >= 3) {
                return {
                    status: 'degraded',
                    summary: `${passed}/${paths.length} 정상 · 실패: ${failedPaths.join(', ')}`,
                    error: failedPaths.join(', '),
                    detail: { failedPaths },
                };
            }
            return {
                status: 'down',
                summary: `포털 응답 불가 (${passed}/${paths.length} 성공)`,
                error: failedPaths.join(', '),
                detail: { failedPaths },
            };
        },
    },
    {
        key: 'system_resources',
        group: 'platform',
        label: '서버 메모리 · 디스크',
        targetUrl: '/admin/stats',
        immediateAlert: true,
        run: async () => {
            const rssMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
            const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
            const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
            let diskUsedPct = 0;
            let diskFreeGb = 0;
            try {
                const stat = fs.statfsSync(process.cwd());
                const totalBlocks = Number(stat.blocks);
                const availBlocks = Number(stat.bavail);
                const bsize = Number(stat.bsize);
                if (totalBlocks > 0) {
                    diskUsedPct = Math.round(((totalBlocks - availBlocks) / totalBlocks) * 1000) / 10;
                    diskFreeGb = Math.round(((availBlocks * bsize) / (1024 * 1024 * 1024)) * 10) / 10;
                }
            } catch {
                diskUsedPct = 0;
            }
            const summary = `디스크 ${diskUsedPct}% (여유 ${diskFreeGb}GB) · API RSS ${rssMb}MB`;
            const detail = { diskUsedPct, diskFreeGb, rssMb, freeMemMb, totalMemMb };
            if (diskUsedPct >= 92 || rssMb >= 310) {
                return { status: 'down', summary, error: summary, detail };
            }
            if (diskUsedPct >= 85 || rssMb >= 260) {
                return { status: 'degraded', summary, error: summary, detail };
            }
            return { status: 'ok', summary, detail };
        },
    },
    {
        key: 'sqlite_storage',
        group: 'platform',
        label: 'SQLite DB · WAL 크기',
        targetUrl: '/admin/logs',
        immediateAlert: true,
        run: async () => {
            const dbFile = resolveDbFilePath();
            const walFile = `${dbFile}-wal`;
            const dbMb = fs.existsSync(dbFile) ? Math.round((fs.statSync(dbFile).size / (1024 * 1024)) * 10) / 10 : 0;
            const walMb = fs.existsSync(walFile) ? Math.round((fs.statSync(walFile).size / (1024 * 1024)) * 10) / 10 : 0;
            const summary = `DB ${dbMb}MB · WAL ${walMb}MB`;
            const detail = { dbMb, walMb };
            if (walMb >= 150) {
                return { status: 'down', summary, error: `WAL 크기 초과 (${walMb}MB)`, detail };
            }
            if (walMb >= 50) {
                return { status: 'degraded', summary, error: `WAL 증가 주의 (${walMb}MB)`, detail };
            }
            return { status: 'ok', summary, detail };
        },
    },
    {
        key: 'news_feed_freshness',
        group: 'content',
        label: '뉴스 & 자동발행 신선도',
        targetUrl: '/news',
        immediateAlert: true,
        run: async () => {
            const [{ data }, rssRes] = await Promise.all([
                fetchJsonWithTimeout<{ success?: boolean; news?: Array<{ id?: number; created_at?: string; published_at?: string }> }>(
                    `${API_BASE}/api/news?limit=5`
                ),
                fetchTextWithTimeout(`${API_BASE}/rss.xml`),
            ]);
            const articles = Array.isArray(data.news) ? data.news : [];
            const rssOk = rssRes.status === 200 && rssRes.text.includes('<rss');
            if (!data.success || articles.length === 0 || !rssOk) {
                return {
                    status: 'down',
                    summary: `기사 ${articles.length}건 · RSS ${rssOk ? '정상' : '오류'}`,
                    error: '뉴스 목록 또는 RSS 응답 이상',
                };
            }
            const latestTs = articles[0]?.created_at || articles[0]?.published_at || '';
            const latestMs = parseUtcTimestampMs(latestTs);
            const ageMin = latestMs > 0 ? Math.max(0, Math.round((Date.now() - latestMs) / 60000)) : 9999;
            const detail = { count: articles.length, latestId: articles[0]?.id, ageMin, rssOk };
            if (ageMin > NEWS_DOWN_MINUTES) {
                return {
                    status: 'down',
                    summary: `최근 발행 ${ageMin}분 전 (기준 120분 초과) · RSS 정상`,
                    error: `뉴스 ${ageMin}분간 미갱신`,
                    detail,
                };
            }
            if (articles.length < 5 || ageMin > NEWS_WARN_MINUTES) {
                return {
                    status: 'degraded',
                    summary: `최근 발행 ${ageMin}분 전 · 기사 ${articles.length}건`,
                    error: `뉴스 갱신 지연 (${ageMin}분 전)`,
                    detail,
                };
            }
            return {
                status: 'ok',
                summary: `최근 발행 ${ageMin}분 전 · RSS 정상 (${articles.length}건)`,
                detail,
            };
        },
    },
    {
        key: 'travel_catalog',
        group: 'content',
        label: '여행 가이드',
        targetUrl: '/entertainment/travel',
        run: async () => {
            const { data } = await fetchJsonWithTimeout<{ success?: boolean; total?: number; articles?: unknown[] }>(
                `${API_BASE}/api/travel/map-spots`
            );
            const count = Array.isArray(data.articles) ? data.articles.length : 0;
            if (!data.success || count === 0) {
                return { status: 'down', summary: `여행 스팟 ${count}건`, error: '여행 데이터 비어 있음' };
            }
            return { status: 'ok', summary: `추천 스팟 ${count}건 정상`, detail: { count } };
        },
    },
    {
        key: 'novel_service',
        group: 'content',
        label: '웹소설',
        targetUrl: '/entertainment/novel',
        run: async () => {
            const { data } = await fetchJsonWithTimeout<{ success?: boolean; list?: unknown[] }>(`${API_BASE}/api/novel/list`);
            if (!data.success || !Array.isArray(data.list)) {
                return { status: 'down', summary: '웹소설 목록 API 오류', error: 'invalid response' };
            }
            return { status: 'ok', summary: `등록 작품 ${data.list.length}건 정상`, detail: { count: data.list.length } };
        },
    },
    {
        key: 'lounge_feed',
        group: 'content',
        label: '라운지 커뮤니티',
        targetUrl: '/lounge',
        run: async () => {
            const { data } = await fetchJsonWithTimeout<{ success?: boolean; posts?: unknown[] }>(`${API_BASE}/api/lounge/posts`);
            if (!data.success || !Array.isArray(data.posts)) {
                return { status: 'down', summary: '라운지 피드 API 오류', error: 'invalid response' };
            }
            return { status: 'ok', summary: `피드 ${data.posts.length}건 정상`, detail: { count: data.posts.length } };
        },
    },
    {
        key: 'lifestyle_tools',
        group: 'tools',
        label: '생활도구 카탈로그',
        targetUrl: '/lifestyle',
        immediateAlert: true,
        run: async () => {
            const { data } = await fetchJsonWithTimeout<{ success?: boolean; apps?: Array<{ category?: string; status?: string }> }>(
                `${API_BASE}/api/mini-apps`
            );
            if (!data.success || !Array.isArray(data.apps)) {
                return { status: 'down', summary: '미니앱 API 오류', error: 'api failure' };
            }
            const activeNonGame = data.apps.filter((a) => a.category !== 'game' && a.status === 'active').length;
            const detail = { activeNonGame, total: data.apps.length };
            if (activeNonGame < 5) {
                return { status: 'down', summary: `활성 생활도구 ${activeNonGame}개 (최소 10개 미달)`, error: `count=${activeNonGame}`, detail };
            }
            if (activeNonGame < 10) {
                return { status: 'degraded', summary: `활성 생활도구 ${activeNonGame}개 (10개 미만 주의)`, error: `count=${activeNonGame}`, detail };
            }
            return { status: 'ok', summary: `활성 생활도구 ${activeNonGame}개 정상`, detail };
        },
    },
    {
        key: 'miniapp_static',
        group: 'tools',
        label: '서브앱 정적 서빙',
        targetUrl: '/app/image-resizer/',
        run: async () => {
            const targets = ['/app/image-resizer/', '/app/qr-generator/'];
            const checks = await Promise.all(
                targets.map(async (p) => {
                    try {
                        const res = await fetchTextWithTimeout(`${API_BASE}${p}`, 5000);
                        return { path: p, ok: res.status === 200 && res.text.toLowerCase().includes('<html') };
                    } catch {
                        return { path: p, ok: false };
                    }
                })
            );
            const passed = checks.filter((c) => c.ok).length;
            if (passed === targets.length) {
                return { status: 'ok', summary: `${passed}/${targets.length} 서브앱 정적 HTML 정상` };
            }
            if (passed > 0) {
                return { status: 'degraded', summary: `${passed}/${targets.length} 서브앱 응답`, error: 'partial static failure' };
            }
            return { status: 'down', summary: '서브앱 정적 서빙 실패', error: 'all targets failed' };
        },
    },
    {
        key: 'game_zone',
        group: 'tools',
        label: '게임존 & 랭킹',
        targetUrl: '/game',
        run: async () => {
            const [appsRes, lbRes] = await Promise.all([
                fetchJsonWithTimeout<{ success?: boolean; apps?: Array<{ category?: string; status?: string }> }>(`${API_BASE}/api/mini-apps`),
                fetchJsonWithTimeout<{ success?: boolean; leaderboard?: unknown[] }>(`${API_BASE}/api/games/leaderboard/all`),
            ]);
            const activeGames = (appsRes.data.apps || []).filter((a) => a.category === 'game' && a.status === 'active').length;
            const lbCount = Array.isArray(lbRes.data.leaderboard) ? lbRes.data.leaderboard.length : 0;
            if (!appsRes.data.success || !lbRes.data.success || activeGames < 3) {
                return { status: 'down', summary: `게임 ${activeGames}개 · 랭킹 오류`, error: 'game zone check failed' };
            }
            if (activeGames < 5) {
                return { status: 'degraded', summary: `활성 게임 ${activeGames}개 (5개 미만 주의)`, detail: { activeGames, lbCount } };
            }
            return { status: 'ok', summary: `활성 게임 ${activeGames}개 · 랭킹 ${lbCount}건 정상`, detail: { activeGames, lbCount } };
        },
    },
    {
        key: 'finance_data',
        group: 'finance_media',
        label: '금융 · 환율 시세',
        targetUrl: '/finance',
        run: async () => {
            const [idxRes, fxRes] = await Promise.allSettled([
                fetchJsonWithTimeout<unknown[]>(`${API_BASE}/api/finance/indices`),
                fetchJsonWithTimeout<unknown[]>(`${API_BASE}/api/finance/exchange`),
            ]);
            const idxCount = idxRes.status === 'fulfilled' && Array.isArray(idxRes.value.data) ? idxRes.value.data.length : 0;
            const fxCount = fxRes.status === 'fulfilled' && Array.isArray(fxRes.value.data) ? fxRes.value.data.length : 0;
            const detail = { idxCount, fxCount };
            if (idxCount > 0 && fxCount > 0) {
                return { status: 'ok', summary: `지수 ${idxCount}건 · 환율 ${fxCount}종 정상`, detail };
            }
            if (idxCount > 0 || fxCount > 0) {
                return { status: 'degraded', summary: `지수 ${idxCount}건 · 환율 ${fxCount}종 (일부 누락)`, error: 'partial finance miss', detail };
            }
            return { status: 'down', summary: '금융 지수 및 환율 API 실패', error: 'finance endpoints failed', detail };
        },
    },
    {
        key: 'banner_system',
        group: 'finance_media',
        label: '배너 시스템',
        targetUrl: '/admin/banners',
        run: async () => {
            const { data } = await fetchJsonWithTimeout<{ success?: boolean; banners?: unknown[] }>(`${API_BASE}/api/banners/home_top`);
            if (!data.success || !Array.isArray(data.banners)) {
                return { status: 'down', summary: '배너 API 응답 오류', error: 'invalid banner payload' };
            }
            return { status: 'ok', summary: `배너 API 정상 (home_top ${data.banners.length}건)` };
        },
    },
    {
        key: 'auth_and_drive',
        group: 'finance_media',
        label: '회원인증 & 세션',
        targetUrl: '/mypage',
        run: async () => {
            const { data } = await fetchJsonWithTimeout<{ success?: boolean }>(`${API_BASE}/api/auth/me`);
            const sessionRes = await pool.query('SELECT COUNT(*) as cnt FROM sessions WHERE expires_at > CURRENT_TIMESTAMP');
            const activeSessions = Number(sessionRes.rows[0]?.cnt || 0);
            if (!data.success) {
                return { status: 'down', summary: '인증 API 응답 이상', error: '/api/auth/me success != true' };
            }
            const hasDriveEnv = Boolean((process.env.GOOGLE_CLIENT_ID || '').trim());
            return {
                status: 'ok',
                summary: `인증 정상 · 활성 세션 ${activeSessions}건 · Drive OAuth ${hasDriveEnv ? '설정됨' : '미설정'}`,
                detail: { activeSessions, hasDriveEnv },
            };
        },
    },
];

async function notifyAdminsAndTelegram(
    probe: WatchdogProbeDef,
    status: WatchdogStatus,
    summary: string,
    isRecovery: boolean
): Promise<string[]> {
    const channels: string[] = [];
    const prefix = isRecovery
        ? '✅ [와치독 복구]'
        : (status === 'down' ? '🚨 [와치독 장애]' : '⚠️ [와치독 주의]');
    const title = `${prefix} ${probe.label}`;
    const body = isRecovery
        ? `${probe.label} 기능이 정상 상태로 복구되었습니다. (${summary})`
        : `${probe.label}: ${summary}`;

    try {
        await pool.query(
            'INSERT INTO notifications (type, title, message, target_user_id, priority) VALUES ($1, $2, $3, $4, $5)',
            ['watchdog', title, body, null, status === 'down' && !isRecovery ? 'high' : 'normal']
        );
        channels.push('notification');
    } catch (err) {
        console.error('[Watchdog] Failed to insert admin notification:', err);
    }

    try {
        const adminsRes = await pool.query(
            "SELECT id FROM users WHERE status = 'active' AND (role = 'admin' OR level >= 6)"
        );
        if (adminsRes.rows.length > 0) {
            await Promise.allSettled(
                adminsRes.rows.map((row) =>
                    PushService.sendPushToUser(Number(row.id), {
                        title,
                        body,
                        url: '/admin/watchdog',
                    })
                )
            );
            channels.push('push');
        }
    } catch (err) {
        console.error('[Watchdog] Failed to send admin webpush:', err);
    }

    if (isTelegramConfigured()) {
        const statusEmoji = isRecovery ? '🟢 복구 완료' : (status === 'down' ? '🔴 장애 감지' : '🟡 주의 감지');
        const tgText = [
            `<b>${escapeHtml(title)}</b>`,
            `• 상태: <b>${statusEmoji}</b>`,
            `• 내용: ${escapeHtml(summary)}`,
            `• 시각: ${formatKstTime()} (KST)`,
            `• <a href="${PUBLIC_WATCHDOG_URL}">관제 대시보드 바로가기</a>`,
        ].join('\n');
        const tgRes = await sendTelegramMessage(tgText);
        if (tgRes.ok) {
            channels.push('telegram');
        } else {
            console.error('[Watchdog] Telegram send error:', tgRes.error);
        }
    }

    return channels;
}

async function executeProbeAndPersist(probe: WatchdogProbeDef): Promise<WatchdogCheckRow> {
    await ensureWatchdogTables();
    const prevRes = await pool.query('SELECT * FROM watchdog_checks WHERE check_key = $1', [probe.key]);
    const prev = (prevRes.rows[0] as WatchdogCheckRow | undefined) || null;

    const t0 = Date.now();
    let result: WatchdogProbeResult;
    try {
        result = await probe.run();
    } catch (err) {
        result = {
            status: 'down',
            summary: err instanceof Error ? err.message : String(err),
            error: err instanceof Error ? err.message : String(err),
        };
    }
    const latencyMs = Math.max(1, Date.now() - t0);
    const nowIso = new Date().toISOString();
    const consecutiveFailures = result.status === 'ok' ? 0 : (Number(prev?.consecutive_failures || 0) + 1);

    let history: WatchdogHistorySlot[] = [];
    if (prev?.recent_history_json) {
        try {
            const parsed = JSON.parse(prev.recent_history_json);
            if (Array.isArray(parsed)) history = parsed;
        } catch {
            history = [];
        }
    }
    history.push({
        t: nowIso,
        s: result.status,
        ms: latencyMs,
        ...(result.error ? { e: result.error.slice(0, 80) } : {}),
    });
    if (history.length > HISTORY_LIMIT) {
        history = history.slice(history.length - HISTORY_LIMIT);
    }

    const openIncidentRes = await pool.query(
        "SELECT id, severity FROM watchdog_incidents WHERE check_key = $1 AND status = 'open' ORDER BY id DESC LIMIT 1",
        [probe.key]
    );
    const openIncident = openIncidentRes.rows[0] as { id: number; severity: string } | undefined;

    let lastAlertAt = prev?.last_alert_at || null;
    const lastAlertMs = parseUtcTimestampMs(lastAlertAt);
    const cooldownPassed = !lastAlertMs || Date.now() - lastAlertMs >= ALERT_COOLDOWN_MS;

    if (result.status === 'ok') {
        if (openIncident) {
            const channels = await notifyAdminsAndTelegram(probe, 'ok', result.summary, true);
            await pool.query(
                "UPDATE watchdog_incidents SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, notified_channels = COALESCE(notified_channels, '') || $1 WHERE id = $2",
                [channels.length ? `,resolved:${channels.join('+')}` : '', openIncident.id]
            );
        }
    } else {
        const shouldOpenOrAlert = Boolean(probe.immediateAlert || consecutiveFailures >= 2);
        const escalatedToDown = prev?.status !== 'down' && result.status === 'down';
        if (shouldOpenOrAlert && (!openIncident || escalatedToDown || cooldownPassed)) {
            const channels = await notifyAdminsAndTelegram(probe, result.status, result.summary, false);
            lastAlertAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
            if (!openIncident) {
                await pool.query(
                    'INSERT INTO watchdog_incidents (check_key, label, severity, status, message, notified_channels) VALUES ($1, $2, $3, $4, $5, $6)',
                    [probe.key, probe.label, result.status, 'open', result.summary, channels.join(',')]
                );
            } else {
                await pool.query(
                    'UPDATE watchdog_incidents SET severity = $1, message = $2, notified_channels = $3 WHERE id = $4',
                    [result.status, result.summary, channels.join(','), openIncident.id]
                );
            }
        }
    }

    const detailJson = JSON.stringify(result.detail || {});
    const historyJson = JSON.stringify(history);
    const lastOkAt = result.status === 'ok' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : (prev?.last_ok_at || null);
    const lastError = result.status === 'ok' ? null : (result.error || result.summary);

    await pool.query(
        `INSERT INTO watchdog_checks (
            check_key, group_name, label, target_url, status, latency_ms, summary, detail_json,
            consecutive_failures, last_checked_at, last_ok_at, last_error, last_alert_at, recent_history_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, $11, $12, $13)
        ON CONFLICT(check_key) DO UPDATE SET
            group_name = EXCLUDED.group_name,
            label = EXCLUDED.label,
            target_url = EXCLUDED.target_url,
            status = EXCLUDED.status,
            latency_ms = EXCLUDED.latency_ms,
            summary = EXCLUDED.summary,
            detail_json = EXCLUDED.detail_json,
            consecutive_failures = EXCLUDED.consecutive_failures,
            last_checked_at = CURRENT_TIMESTAMP,
            last_ok_at = COALESCE(EXCLUDED.last_ok_at, watchdog_checks.last_ok_at),
            last_error = EXCLUDED.last_error,
            last_alert_at = EXCLUDED.last_alert_at,
            recent_history_json = EXCLUDED.recent_history_json`,
        [
            probe.key,
            probe.group,
            probe.label,
            probe.targetUrl,
            result.status,
            latencyMs,
            result.summary,
            detailJson,
            consecutiveFailures,
            lastOkAt,
            lastError,
            lastAlertAt,
            historyJson,
        ]
    );

    const updatedRes = await pool.query('SELECT * FROM watchdog_checks WHERE check_key = $1', [probe.key]);
    return updatedRes.rows[0] as WatchdogCheckRow;
}

export async function runAllWatchdogChecks(trigger: 'scheduler' | 'manual' = 'manual'): Promise<WatchdogCheckRow[]> {
    if (isRunning) {
        const res = await pool.query('SELECT * FROM watchdog_checks');
        return res.rows as WatchdogCheckRow[];
    }
    isRunning = true;
    try {
        await ensureWatchdogTables();
        const settled = await Promise.allSettled(WATCHDOG_PROBES.map((probe) => executeProbeAndPersist(probe)));
        lastRunAtMs = Date.now();
        nextRunAtMs = lastRunAtMs + WATCHDOG_INTERVAL_MS;

        const rows = settled
            .filter((r): r is PromiseFulfilledResult<WatchdogCheckRow> => r.status === 'fulfilled')
            .map((r) => r.value);
        const downCount = rows.filter((r) => r.status === 'down').length;
        const warnCount = rows.filter((r) => r.status === 'degraded').length;
        console.log(
            `💓 [Watchdog] ${trigger === 'scheduler' ? '정기 점검' : '수동 점검'} 완료: ${rows.length}/${WATCHDOG_PROBES.length} (정상 ${rows.length - downCount - warnCount}, 주의 ${warnCount}, 장애 ${downCount})`
        );
        return rows;
    } finally {
        isRunning = false;
    }
}

export async function runSingleWatchdogCheck(checkKey: string): Promise<WatchdogCheckRow | null> {
    const probe = WATCHDOG_PROBES.find((p) => p.key === checkKey);
    if (!probe) return null;
    return await executeProbeAndPersist(probe);
}

export async function getWatchdogDashboardData() {
    await ensureWatchdogTables();
    let checksRes = await pool.query('SELECT * FROM watchdog_checks');
    if (checksRes.rows.length === 0) {
        await runAllWatchdogChecks('manual');
        checksRes = await pool.query('SELECT * FROM watchdog_checks');
    }

    const orderMap = new Map(WATCHDOG_PROBES.map((p, idx) => [p.key, idx]));
    const checks = (checksRes.rows as WatchdogCheckRow[])
        .sort((a, b) => (orderMap.get(a.check_key) ?? 999) - (orderMap.get(b.check_key) ?? 999))
        .map((row) => {
            let detail: Record<string, unknown> = {};
            let history: WatchdogHistorySlot[] = [];
            try { detail = JSON.parse(row.detail_json || '{}'); } catch { detail = {}; }
            try { history = JSON.parse(row.recent_history_json || '[]'); } catch { history = []; }
            return {
                key: row.check_key,
                group: row.group_name,
                label: row.label,
                targetUrl: row.target_url,
                status: row.status,
                latencyMs: Number(row.latency_ms || 0),
                summary: row.summary,
                detail,
                consecutiveFailures: Number(row.consecutive_failures || 0),
                lastCheckedAt: row.last_checked_at,
                lastCheckedKst: formatKstTime(row.last_checked_at),
                lastOkKst: row.last_ok_at ? formatKstTime(row.last_ok_at) : null,
                lastError: row.last_error,
                history,
            };
        });

    const incidentsRes = await pool.query(
        'SELECT * FROM watchdog_incidents ORDER BY id DESC LIMIT 30'
    );
    const incidents = (incidentsRes.rows as WatchdogIncidentRow[]).map((inc) => ({
        ...inc,
        startedAtKst: formatKstTime(inc.started_at),
        resolvedAtKst: inc.resolved_at ? formatKstTime(inc.resolved_at) : null,
    }));

    const okCount = checks.filter((c) => c.status === 'ok').length;
    const degradedCount = checks.filter((c) => c.status === 'degraded').length;
    const downCount = checks.filter((c) => c.status === 'down').length;
    const overallStatus: WatchdogStatus = downCount > 0 ? 'down' : (degradedCount > 0 ? 'degraded' : 'ok');

    return {
        overallStatus,
        counts: {
            total: checks.length,
            ok: okCount,
            degraded: degradedCount,
            down: downCount,
        },
        scheduler: {
            intervalSeconds: Math.round(WATCHDOG_INTERVAL_MS / 1000),
            newsDownMinutes: NEWS_DOWN_MINUTES,
            isRunning,
            lastRunAt: lastRunAtMs ? formatKstTime(lastRunAtMs) : (checks[0]?.lastCheckedKst || null),
            nextRunInSeconds: nextRunAtMs ? Math.max(0, Math.round((nextRunAtMs - Date.now()) / 1000)) : null,
        },
        telegramConfigured: isTelegramConfigured(),
        checks,
        incidents,
    };
}

export async function getWatchdogPingSummary() {
    await ensureWatchdogTables();
    const res = await pool.query('SELECT check_key, status, last_checked_at FROM watchdog_checks');
    const rows = res.rows as Array<{ check_key: string; status: WatchdogStatus; last_checked_at: string }>;
    const ok = rows.filter((r) => r.status === 'ok').length;
    const degraded = rows.filter((r) => r.status === 'degraded').length;
    const down = rows.filter((r) => r.status === 'down').length;
    const overallStatus: WatchdogStatus = down > 0 ? 'down' : (degraded > 0 ? 'degraded' : 'ok');
    return {
        success: down === 0,
        status: overallStatus,
        total: rows.length,
        ok,
        degraded,
        down,
        lastCheckedKst: rows[0]?.last_checked_at ? formatKstTime(rows[0].last_checked_at) : null,
    };
}

export async function acknowledgeIncident(incidentId: number, adminUserId: string): Promise<boolean> {
    await ensureWatchdogTables();
    const res = await pool.query(
        'UPDATE watchdog_incidents SET acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = $1 WHERE id = $2',
        [adminUserId, incidentId]
    );
    return res.rowCount > 0;
}

export async function sendTelegramTestMessage(): Promise<{ success: boolean; message: string }> {
    if (!isTelegramConfigured()) {
        return {
            success: false,
            message: '.env에 TELEGRAM_BOT_TOKEN 및 TELEGRAM_CHAT_ID를 설정한 후 PM2를 재시작해 주세요.',
        };
    }
    const dashboard = await getWatchdogDashboardData();
    const statusLabel = dashboard.overallStatus === 'ok'
        ? '🟢 전체 정상'
        : (dashboard.overallStatus === 'degraded' ? '🟡 일부 주의' : '🔴 장애 감지');
    const text = [
        '<b>💓 [베라넥스 와치독] 텔레그램 알림 테스트</b>',
        `• 현재 상태: <b>${statusLabel}</b> (${dashboard.counts.ok}/${dashboard.counts.total} 정상)`,
        `• 뉴스 미갱신 임계치: ${NEWS_DOWN_MINUTES}분`,
        `• 시각: ${formatKstTime()} (KST)`,
        `• <a href="${PUBLIC_WATCHDOG_URL}">관제 대시보드 열기</a>`,
    ].join('\n');

    const sent = await sendTelegramMessage(text);
    if (!sent.ok) {
        return { success: false, message: `텔레그램 전송 실패: ${sent.error || '알 수 없는 오류'}` };
    }
    return { success: true, message: '텔레그램 테스트 메시지를 전송했습니다.' };
}

export function startWatchdogScheduler(): void {
    if (schedulerStarted) return;
    schedulerStarted = true;
    nextRunAtMs = Date.now() + INITIAL_DELAY_MS;
    console.log('💓 [Watchdog] 기능별 와치독 스케줄러 등록됨 (15초 후 첫 점검 · 5분 주기 · 뉴스 미갱신 2시간 감시)');

    setTimeout(() => {
        void runAllWatchdogChecks('scheduler').catch((err) => {
            console.error('[Watchdog] Initial run error:', err);
        });
        setInterval(() => {
            void runAllWatchdogChecks('scheduler').catch((err) => {
                console.error('[Watchdog] Scheduled run error:', err);
            });
        }, WATCHDOG_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
}
