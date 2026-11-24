import { pool } from '@faithportal/database';
import { PushService } from './push.service.js';
import type {
    CancelNotificationInput,
    CancelNotificationOutcome,
    NotificationInboxItem,
    NotificationInboxResult,
    NotificationJobRecord,
    NotificationJobStatus,
    NotificationPreferences,
    NotificationPreferencesPatch,
    ScheduleNotificationInput,
    ScheduleNotificationOutcome,
    SendNotificationInput,
    SendNotificationOutcome,
} from '../types/notification.types.js';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const COALESCE_WINDOW_MS = 60 * 1000;
const ALLOWED_ORIGIN_HOSTS = new Set(['veranex.app', 'www.veranex.app']);
const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const DEFAULT_CATEGORIES: Record<string, boolean> = {
    'azit.kitchen': true,
    'azit.garden': true,
    'azit.camp': true,
    schedule: true,
    system: true,
};

export class NotificationServiceError extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = 'NotificationServiceError';
        this.statusCode = statusCode;
    }
}

interface RawPreferenceRow {
    user_id: number;
    categories_json: string;
    quiet_hours_enabled: number;
    quiet_start_hhmm: string;
    quiet_end_hhmm: string;
    timezone: string;
    updated_at: string | null;
}

interface RawJobRow {
    id: number;
    user_id: number;
    category: string;
    source_app: string;
    dedupe_key: string | null;
    title: string;
    body: string;
    url: string;
    icon: string | null;
    tag: string | null;
    data_json: string | null;
    scheduled_at_ms: number;
    ignore_quiet_hours: number;
    status: NotificationJobStatus;
    sent_at: string | null;
    error_message: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface RawDeliveryRow {
    id: number;
    job_id: number | null;
    category: string;
    source_app: string;
    title: string;
    body: string;
    url: string;
    data_json: string | null;
    sent_device_count: number;
    failed_device_count: number;
    read_at: string | null;
    created_at: string | null;
}

function safeParseJsonObject(raw: string | null | undefined): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        return null;
    } catch {
        return null;
    }
}

function safeParseBooleanMap(raw: string | null | undefined): Record<string, boolean> {
    const merged: Record<string, boolean> = { ...DEFAULT_CATEGORIES };
    if (!raw) return merged;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
                if (typeof v === 'boolean') {
                    merged[k] = v;
                }
            }
        }
    } catch {
        // Fallback to defaults on corrupt JSON
    }
    return merged;
}

export function sanitizeNotificationUrl(rawUrl?: string): string {
    if (!rawUrl || !rawUrl.trim()) {
        return '/mypage';
    }
    const trimmed = rawUrl.trim();
    if (trimmed.length > 500) {
        throw new NotificationServiceError('알림 이동 URL이 너무 깁니다.', 400);
    }
    if (trimmed.startsWith('/')) {
        if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
            throw new NotificationServiceError('허용되지 않은 알림 이동 URL입니다.', 400);
        }
        return trimmed;
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'https:' && ALLOWED_ORIGIN_HOSTS.has(parsed.hostname.toLowerCase())) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
        }
    } catch {
        // Invalid URL falls through to error
    }
    throw new NotificationServiceError(
        '허용되지 않은 알림 이동 URL입니다. 내부 경로(/) 또는 veranex.app 도메인만 사용할 수 있습니다.',
        400
    );
}

function parseHHMMToMinutes(hhmm: string, fallbackMinutes: number): number {
    if (!HHMM_REGEX.test(hhmm)) return fallbackMinutes;
    const [hStr, mStr] = hhmm.split(':');
    return Number(hStr) * 60 + Number(mStr);
}

export function computeQuietHoursDeferMs(
    nowMs: number,
    prefs: Pick<NotificationPreferences, 'quietHoursEnabled' | 'quietStartHHMM' | 'quietEndHHMM'>
): number | null {
    if (!prefs.quietHoursEnabled) return null;

    const startMin = parseHHMMToMinutes(prefs.quietStartHHMM, 23 * 60);
    const endMin = parseHHMMToMinutes(prefs.quietEndHHMM, 8 * 60);
    if (startMin === endMin) return null;

    const kstNow = new Date(nowMs + KST_OFFSET_MS);
    const curMin = kstNow.getUTCHours() * 60 + kstNow.getUTCMinutes();
    const year = kstNow.getUTCFullYear();
    const month = kstNow.getUTCMonth();
    const day = kstNow.getUTCDate();
    const endHour = Math.floor(endMin / 60);
    const endMinute = endMin % 60;

    if (startMin < endMin) {
        if (curMin >= startMin && curMin < endMin) {
            return Date.UTC(year, month, day, endHour, endMinute, 0, 0) - KST_OFFSET_MS;
        }
        return null;
    }

    // 야간(자정 걸침) 구간 예: 23:00 ~ 08:00
    if (curMin >= startMin) {
        return Date.UTC(year, month, day + 1, endHour, endMinute, 0, 0) - KST_OFFSET_MS;
    }
    if (curMin < endMin) {
        return Date.UTC(year, month, day, endHour, endMinute, 0, 0) - KST_OFFSET_MS;
    }
    return null;
}

function mapJobRow(row: RawJobRow): NotificationJobRecord {
    return {
        id: Number(row.id),
        userId: Number(row.user_id),
        category: String(row.category),
        sourceApp: String(row.source_app),
        dedupeKey: row.dedupe_key ? String(row.dedupe_key) : null,
        title: String(row.title),
        body: String(row.body),
        url: String(row.url),
        icon: String(row.icon || '/logo-192.png'),
        tag: row.tag ? String(row.tag) : null,
        data: safeParseJsonObject(row.data_json),
        scheduledAtMs: Number(row.scheduled_at_ms),
        ignoreQuietHours: Boolean(row.ignore_quiet_hours),
        status: row.status,
        sentAt: row.sent_at ? String(row.sent_at) : null,
        errorMessage: row.error_message ? String(row.error_message) : null,
        createdAt: row.created_at ? String(row.created_at) : null,
        updatedAt: row.updated_at ? String(row.updated_at) : null,
    };
}

function mapDeliveryRow(row: RawDeliveryRow): NotificationInboxItem {
    return {
        id: Number(row.id),
        jobId: row.job_id !== null && row.job_id !== undefined ? Number(row.job_id) : null,
        category: String(row.category),
        sourceApp: String(row.source_app),
        title: String(row.title),
        body: String(row.body),
        url: String(row.url),
        data: safeParseJsonObject(row.data_json),
        sentDeviceCount: Number(row.sent_device_count ?? 0),
        failedDeviceCount: Number(row.failed_device_count ?? 0),
        readAt: row.read_at ? String(row.read_at) : null,
        createdAt: row.created_at ? String(row.created_at) : null,
    };
}

function buildCoalescedPayload(
    category: string,
    jobs: NotificationJobRecord[]
): { title: string; body: string; url: string; icon: string; tag: string } {
    const first = jobs[0];
    const count = jobs.length;
    const extraCount = count - 1;

    if (category === 'azit.kitchen') {
        return {
            title: `🍳 [아지트 주방] 요리 ${count}건이 완성되었어요!`,
            body: `${first.body} (외 ${extraCount}건 완성 — 클릭해서 바로 수령하세요!)`,
            url: '/mypage?section=dashboard&zone=kitchen',
            icon: first.icon || '/logo-192.png',
            tag: 'azit-kitchen',
        };
    }

    if (category === 'azit.garden') {
        return {
            title: `💧 [아지트 농장] 작물 ${count}곳에 물을 줄 시간이에요!`,
            body: `${first.body} (외 ${extraCount}곳 — 클릭해서 물을 주세요!)`,
            url: '/mypage?section=dashboard&zone=garden',
            icon: first.icon || '/logo-192.png',
            tag: 'azit-garden',
        };
    }

    if (category === 'azit.camp') {
        return {
            title: `⚔️ [아지트 용병 캠프] 원정대 ${count}팀이 복귀했어요!`,
            body: `${first.body} (외 ${extraCount}팀 완료 — 전투 보상을 정산해 보세요!)`,
            url: '/mypage?section=dashboard&zone=camp',
            icon: first.icon || '/logo-192.png',
            tag: 'azit-camp',
        };
    }

    return {
        title: `${first.title} 외 ${extraCount}건`,
        body: `${first.body} (외 ${extraCount}건의 알림이 도착했습니다.)`,
        url: first.url,
        icon: first.icon || '/logo-192.png',
        tag: first.tag || `batch-${category}`,
    };
}

export class NotificationService {
    private static ensureTablesPromise: Promise<void> | null = null;

    static async ensureTables(): Promise<void> {
        if (!this.ensureTablesPromise) {
            this.ensureTablesPromise = this.createTablesInternal().catch((err) => {
                this.ensureTablesPromise = null;
                throw err;
            });
        }
        return this.ensureTablesPromise;
    }

    private static async createTablesInternal(): Promise<void> {
        await PushService.ensurePushTable();
        const statements: string[] = [
            `CREATE TABLE IF NOT EXISTS user_notification_preferences (
                user_id INTEGER PRIMARY KEY,
                categories_json TEXT NOT NULL,
                quiet_hours_enabled INTEGER NOT NULL DEFAULT 0,
                quiet_start_hhmm TEXT NOT NULL DEFAULT '23:00',
                quiet_end_hhmm TEXT NOT NULL DEFAULT '08:00',
                timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE TABLE IF NOT EXISTS notification_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                category TEXT NOT NULL DEFAULT 'system',
                source_app TEXT NOT NULL DEFAULT 'portal',
                dedupe_key TEXT,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                url TEXT NOT NULL DEFAULT '/mypage',
                icon TEXT NOT NULL DEFAULT '/logo-192.png',
                tag TEXT,
                data_json TEXT,
                scheduled_at_ms INTEGER NOT NULL,
                ignore_quiet_hours INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending',
                sent_at DATETIME,
                error_message TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_notif_jobs_due ON notification_jobs(status, is_deleted, scheduled_at_ms);`,
            `CREATE INDEX IF NOT EXISTS idx_notif_jobs_dedupe ON notification_jobs(user_id, dedupe_key, status, is_deleted);`,
            `CREATE TABLE IF NOT EXISTS notification_deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER,
                category TEXT NOT NULL DEFAULT 'system',
                source_app TEXT NOT NULL DEFAULT 'portal',
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                url TEXT NOT NULL DEFAULT '/mypage',
                data_json TEXT,
                sent_device_count INTEGER NOT NULL DEFAULT 0,
                failed_device_count INTEGER NOT NULL DEFAULT 0,
                read_at DATETIME,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_notif_deliveries_user ON notification_deliveries(user_id, is_deleted, created_at DESC);`,
        ];

        for (const stmt of statements) {
            await pool.query(stmt);
        }
    }

    static async resolveTargetUserId(target: { userId?: number; email?: string }): Promise<number | null> {
        if (typeof target.userId === 'number' && Number.isInteger(target.userId) && target.userId > 0) {
            const res = await pool.query(
                `SELECT id FROM users WHERE id = $1 AND status = 'active' LIMIT 1`,
                [target.userId]
            );
            return res.rows.length > 0 ? Number(res.rows[0].id) : null;
        }
        if (typeof target.email === 'string' && target.email.trim()) {
            const normalizedEmail = target.email.trim().toLowerCase();
            const res = await pool.query(
                `SELECT id FROM users WHERE LOWER(email) = $1 AND status = 'active' LIMIT 1`,
                [normalizedEmail]
            );
            return res.rows.length > 0 ? Number(res.rows[0].id) : null;
        }
        return null;
    }

    static async getPreferences(userId: number): Promise<NotificationPreferences> {
        await this.ensureTables();
        const res = await pool.query(
            `SELECT user_id, categories_json, quiet_hours_enabled, quiet_start_hhmm, quiet_end_hhmm, timezone, updated_at
             FROM user_notification_preferences
             WHERE user_id = $1`,
            [userId]
        );
        if (res.rows.length === 0) {
            return {
                userId,
                categories: { ...DEFAULT_CATEGORIES },
                quietHoursEnabled: false,
                quietStartHHMM: '23:00',
                quietEndHHMM: '08:00',
                timezone: 'Asia/Seoul',
                updatedAt: null,
            };
        }
        const row = res.rows[0] as RawPreferenceRow;
        return {
            userId: Number(row.user_id),
            categories: safeParseBooleanMap(row.categories_json),
            quietHoursEnabled: Boolean(row.quiet_hours_enabled),
            quietStartHHMM: HHMM_REGEX.test(String(row.quiet_start_hhmm)) ? String(row.quiet_start_hhmm) : '23:00',
            quietEndHHMM: HHMM_REGEX.test(String(row.quiet_end_hhmm)) ? String(row.quiet_end_hhmm) : '08:00',
            timezone: String(row.timezone || 'Asia/Seoul'),
            updatedAt: row.updated_at ? String(row.updated_at) : null,
        };
    }

    static async updatePreferences(
        userId: number,
        patch: NotificationPreferencesPatch
    ): Promise<NotificationPreferences> {
        await this.ensureTables();
        const current = await this.getPreferences(userId);

        const nextCategories: Record<string, boolean> = { ...current.categories };
        if (patch.categories) {
            for (const [key, val] of Object.entries(patch.categories)) {
                if (/^[a-zA-Z0-9._-]{1,64}$/.test(key) && typeof val === 'boolean') {
                    nextCategories[key] = val;
                }
            }
        }

        const nextQuietEnabled =
            typeof patch.quietHoursEnabled === 'boolean' ? patch.quietHoursEnabled : current.quietHoursEnabled;

        let nextQuietStart = current.quietStartHHMM;
        if (patch.quietStartHHMM !== undefined) {
            if (!HHMM_REGEX.test(patch.quietStartHHMM)) {
                throw new NotificationServiceError('방해금지 시작 시각은 HH:MM (00:00~23:59) 형식이어야 합니다.', 400);
            }
            nextQuietStart = patch.quietStartHHMM;
        }

        let nextQuietEnd = current.quietEndHHMM;
        if (patch.quietEndHHMM !== undefined) {
            if (!HHMM_REGEX.test(patch.quietEndHHMM)) {
                throw new NotificationServiceError('방해금지 종료 시각은 HH:MM (00:00~23:59) 형식이어야 합니다.', 400);
            }
            nextQuietEnd = patch.quietEndHHMM;
        }

        await pool.query(
            `INSERT INTO user_notification_preferences (
                user_id, categories_json, quiet_hours_enabled, quiet_start_hhmm, quiet_end_hhmm, timezone, updated_at
             )
             VALUES ($1, $2, $3, $4, $5, 'Asia/Seoul', CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE SET
                categories_json = excluded.categories_json,
                quiet_hours_enabled = excluded.quiet_hours_enabled,
                quiet_start_hhmm = excluded.quiet_start_hhmm,
                quiet_end_hhmm = excluded.quiet_end_hhmm,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, JSON.stringify(nextCategories), nextQuietEnabled ? 1 : 0, nextQuietStart, nextQuietEnd]
        );

        return this.getPreferences(userId);
    }

    static async sendImmediate(input: SendNotificationInput): Promise<SendNotificationOutcome> {
        await this.ensureTables();
        const category = (input.category || 'system').trim() || 'system';
        const sourceApp = (input.sourceApp || 'portal').trim() || 'portal';
        const safeUrl = sanitizeNotificationUrl(input.url);
        const icon = input.icon?.trim() || '/logo-192.png';
        const prefs = await this.getPreferences(input.userId);

        if (!input.ignorePreferences && prefs.categories[category] === false) {
            return { delivered: false, skippedReason: 'category_disabled' };
        }

        const nowMs = Date.now();
        if (!input.ignoreQuietHours) {
            const deferMs = computeQuietHoursDeferMs(nowMs, prefs);
            if (deferMs !== null && deferMs > nowMs) {
                const scheduled = await this.scheduleNotification({
                    userId: input.userId,
                    category,
                    sourceApp,
                    title: input.title,
                    body: input.body,
                    url: safeUrl,
                    icon,
                    tag: input.tag,
                    data: input.data,
                    scheduledAtMs: deferMs,
                    ignoreQuietHours: false,
                });
                return {
                    delivered: false,
                    deferredUntilMs: deferMs,
                    jobId: scheduled.jobId,
                };
            }
        }

        const dataJson = input.data ? JSON.stringify(input.data) : null;
        const insertDelivery = await pool.query(
            `INSERT INTO notification_deliveries (
                user_id, job_id, category, source_app, title, body, url, data_json
             )
             VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)`,
            [input.userId, category, sourceApp, input.title, input.body, safeUrl, dataJson]
        );
        const deliveryId = Number(insertDelivery.lastInsertRowid ?? 0);

        const sendResult = await PushService.sendPushToUser(input.userId, {
            title: input.title,
            body: input.body,
            url: safeUrl,
            icon,
            badge: '/logo-192.png',
            tag: input.tag,
            renotify: input.renotify,
            requireInteraction: input.requireInteraction,
            category,
            notificationId: deliveryId > 0 ? deliveryId : undefined,
            data: input.data,
        });

        if (deliveryId > 0) {
            await pool.query(
                `UPDATE notification_deliveries
                 SET sent_device_count = $1,
                     failed_device_count = $2
                 WHERE id = $3`,
                [sendResult.sentCount, sendResult.failedCount, deliveryId]
            );
        }

        return {
            delivered: true,
            deliveryId: deliveryId > 0 ? deliveryId : undefined,
            sendResult,
        };
    }

    static async scheduleNotification(input: ScheduleNotificationInput): Promise<ScheduleNotificationOutcome> {
        await this.ensureTables();
        const category = (input.category || 'system').trim() || 'system';
        const sourceApp = (input.sourceApp || 'portal').trim() || 'portal';
        const safeUrl = sanitizeNotificationUrl(input.url);
        const icon = input.icon?.trim() || '/logo-192.png';
        const tag = input.tag?.trim() || null;
        const dedupeKey = input.dedupeKey?.trim() || null;
        const dataJson = input.data ? JSON.stringify(input.data) : null;
        const scheduledAtMs = Math.max(Date.now(), Math.round(input.scheduledAtMs));
        const ignoreQuiet = input.ignoreQuietHours ? 1 : 0;

        if (dedupeKey) {
            const existingRes = await pool.query(
                `SELECT id
                 FROM notification_jobs
                 WHERE user_id = $1 AND dedupe_key = $2 AND status = 'pending' AND is_deleted = 0
                 ORDER BY id DESC
                 LIMIT 1`,
                [input.userId, dedupeKey]
            );
            if (existingRes.rows.length > 0) {
                const existingId = Number(existingRes.rows[0].id);
                await pool.query(
                    `UPDATE notification_jobs
                     SET category = $1,
                         source_app = $2,
                         title = $3,
                         body = $4,
                         url = $5,
                         icon = $6,
                         tag = $7,
                         data_json = $8,
                         scheduled_at_ms = $9,
                         ignore_quiet_hours = $10,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $11`,
                    [
                        category,
                        sourceApp,
                        input.title,
                        input.body,
                        safeUrl,
                        icon,
                        tag,
                        dataJson,
                        scheduledAtMs,
                        ignoreQuiet,
                        existingId,
                    ]
                );
                return { jobId: existingId, upserted: true, scheduledAtMs };
            }
        }

        const insertRes = await pool.query(
            `INSERT INTO notification_jobs (
                user_id, category, source_app, dedupe_key, title, body, url, icon, tag, data_json,
                scheduled_at_ms, ignore_quiet_hours, status, is_deleted
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', 0)`,
            [
                input.userId,
                category,
                sourceApp,
                dedupeKey,
                input.title,
                input.body,
                safeUrl,
                icon,
                tag,
                dataJson,
                scheduledAtMs,
                ignoreQuiet,
            ]
        );
        return {
            jobId: Number(insertRes.lastInsertRowid ?? 0),
            upserted: false,
            scheduledAtMs,
        };
    }

    static async cancelScheduled(input: CancelNotificationInput): Promise<CancelNotificationOutcome> {
        await this.ensureTables();
        const dedupeKey = input.dedupeKey?.trim() || null;
        const jobId = typeof input.jobId === 'number' && Number.isInteger(input.jobId) && input.jobId > 0 ? input.jobId : null;

        if (!dedupeKey && !jobId) {
            throw new NotificationServiceError('취소할 dedupeKey 또는 jobId가 필요합니다.', 400);
        }

        let res: { rowCount: number };
        if (dedupeKey && jobId) {
            res = await pool.query(
                `UPDATE notification_jobs
                 SET status = 'cancelled',
                     is_deleted = 1,
                     deleted_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND status = 'pending' AND is_deleted = 0
                   AND (dedupe_key = $2 OR id = $3)`,
                [input.userId, dedupeKey, jobId]
            );
        } else if (dedupeKey) {
            res = await pool.query(
                `UPDATE notification_jobs
                 SET status = 'cancelled',
                     is_deleted = 1,
                     deleted_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND status = 'pending' AND is_deleted = 0
                   AND dedupe_key = $2`,
                [input.userId, dedupeKey]
            );
        } else {
            res = await pool.query(
                `UPDATE notification_jobs
                 SET status = 'cancelled',
                     is_deleted = 1,
                     deleted_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND status = 'pending' AND is_deleted = 0
                   AND id = $2`,
                [input.userId, jobId]
            );
        }

        return { cancelledCount: res.rowCount };
    }

    static async listScheduled(userId: number, limit = 50): Promise<NotificationJobRecord[]> {
        await this.ensureTables();
        const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
        const res = await pool.query(
            `SELECT id, user_id, category, source_app, dedupe_key, title, body, url, icon, tag, data_json,
                    scheduled_at_ms, ignore_quiet_hours, status, sent_at, error_message, created_at, updated_at
             FROM notification_jobs
             WHERE user_id = $1 AND status = 'pending' AND is_deleted = 0
             ORDER BY scheduled_at_ms ASC
             LIMIT $2`,
            [userId, safeLimit]
        );
        return (res.rows as RawJobRow[]).map(mapJobRow);
    }

    static async getInbox(userId: number, limit = 30, offset = 0): Promise<NotificationInboxResult> {
        await this.ensureTables();
        const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
        const safeOffset = Math.max(0, Math.floor(offset));

        const [listRes, unreadRes] = await Promise.all([
            pool.query(
                `SELECT id, job_id, category, source_app, title, body, url, data_json,
                        sent_device_count, failed_device_count, read_at, created_at
                 FROM notification_deliveries
                 WHERE user_id = $1 AND is_deleted = 0
                 ORDER BY id DESC
                 LIMIT $2 OFFSET $3`,
                [userId, safeLimit, safeOffset]
            ),
            pool.query(
                `SELECT COUNT(*) AS cnt
                 FROM notification_deliveries
                 WHERE user_id = $1 AND is_deleted = 0 AND read_at IS NULL`,
                [userId]
            ),
        ]);

        return {
            items: (listRes.rows as RawDeliveryRow[]).map(mapDeliveryRow),
            unreadCount: Number(unreadRes.rows[0]?.cnt ?? 0),
        };
    }

    static async markInboxRead(
        userId: number,
        opts: { id?: number; all?: boolean }
    ): Promise<{ updatedCount: number }> {
        await this.ensureTables();
        if (opts.all) {
            const res = await pool.query(
                `UPDATE notification_deliveries
                 SET read_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND is_deleted = 0 AND read_at IS NULL`,
                [userId]
            );
            return { updatedCount: res.rowCount };
        }
        if (typeof opts.id === 'number' && Number.isInteger(opts.id) && opts.id > 0) {
            const res = await pool.query(
                `UPDATE notification_deliveries
                 SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
                 WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
                [opts.id, userId]
            );
            return { updatedCount: res.rowCount };
        }
        throw new NotificationServiceError('읽음 처리할 알림 id 또는 all=true가 필요합니다.', 400);
    }

    static async dismissInboxItem(userId: number, id: number): Promise<{ dismissed: boolean }> {
        await this.ensureTables();
        if (!Number.isInteger(id) || id <= 0) {
            throw new NotificationServiceError('올바른 알림 ID가 아닙니다.', 400);
        }
        const res = await pool.query(
            `UPDATE notification_deliveries
             SET is_deleted = 1,
                 deleted_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2 AND is_deleted = 0`,
            [id, userId]
        );
        return { dismissed: res.rowCount > 0 };
    }

    static async processDueJobs(nowMs = Date.now()): Promise<{
        processedGroups: number;
        sentJobs: number;
        deferredJobs: number;
        skippedJobs: number;
    }> {
        await this.ensureTables();
        const dueRes = await pool.query(
            `SELECT id, user_id, category, source_app, dedupe_key, title, body, url, icon, tag, data_json,
                    scheduled_at_ms, ignore_quiet_hours, status, sent_at, error_message, created_at, updated_at
             FROM notification_jobs
             WHERE status = 'pending' AND is_deleted = 0 AND scheduled_at_ms <= $1
             ORDER BY scheduled_at_ms ASC
             LIMIT 200`,
            [nowMs]
        );

        const dueJobs = (dueRes.rows as RawJobRow[]).map(mapJobRow);
        if (dueJobs.length === 0) {
            return { processedGroups: 0, sentJobs: 0, deferredJobs: 0, skippedJobs: 0 };
        }

        const groups = new Map<string, NotificationJobRecord[]>();
        for (const job of dueJobs) {
            const groupKey = `${job.userId}::${job.category}`;
            const list = groups.get(groupKey);
            if (list) {
                list.push(job);
            } else {
                groups.set(groupKey, [job]);
            }
        }

        let processedGroups = 0;
        let sentJobs = 0;
        let deferredJobs = 0;
        let skippedJobs = 0;

        for (const groupJobs of groups.values()) {
            processedGroups += 1;
            const userId = groupJobs[0].userId;
            const category = groupJobs[0].category;
            const prefs = await this.getPreferences(userId);

            if (prefs.categories[category] === false) {
                for (const j of groupJobs) {
                    const upd = await pool.query(
                        `UPDATE notification_jobs
                         SET status = 'skipped_disabled',
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $1 AND status = 'pending' AND is_deleted = 0`,
                        [j.id]
                    );
                    skippedJobs += upd.rowCount;
                }
                continue;
            }

            const hasExemptJob = groupJobs.some((j) => j.ignoreQuietHours);
            if (!hasExemptJob) {
                const deferMs = computeQuietHoursDeferMs(nowMs, prefs);
                if (deferMs !== null && deferMs > nowMs) {
                    for (const j of groupJobs) {
                        const upd = await pool.query(
                            `UPDATE notification_jobs
                             SET scheduled_at_ms = $1,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE id = $2 AND status = 'pending' AND is_deleted = 0`,
                            [deferMs, j.id]
                        );
                        deferredJobs += upd.rowCount;
                    }
                    continue;
                }
            }

            // 같은 (user_id, category) 후속 알림이 1분 내 도래 예정이면 1틱 대기하여 묶음 발송
            const oldestDueMs = Math.min(...groupJobs.map((j) => j.scheduledAtMs));
            if (nowMs - oldestDueMs < COALESCE_WINDOW_MS) {
                const siblingRes = await pool.query(
                    `SELECT id
                     FROM notification_jobs
                     WHERE user_id = $1 AND category = $2 AND status = 'pending' AND is_deleted = 0
                       AND scheduled_at_ms > $3 AND scheduled_at_ms <= $4
                     LIMIT 1`,
                    [userId, category, nowMs, nowMs + COALESCE_WINDOW_MS]
                );
                if (siblingRes.rows.length > 0) {
                    deferredJobs += groupJobs.length;
                    continue;
                }
            }

            // 원자적 상태 전이(processing)로 동시 중복 발송 차단
            const claimed: NotificationJobRecord[] = [];
            for (const j of groupJobs) {
                const claimRes = await pool.query(
                    `UPDATE notification_jobs
                     SET status = 'processing',
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND status = 'pending' AND is_deleted = 0`,
                    [j.id]
                );
                if (claimRes.rowCount === 1) {
                    claimed.push(j);
                }
            }
            if (claimed.length === 0) continue;

            try {
                const payload =
                    claimed.length === 1
                        ? {
                              title: claimed[0].title,
                              body: claimed[0].body,
                              url: claimed[0].url,
                              icon: claimed[0].icon || '/logo-192.png',
                              tag: claimed[0].tag || `job-${claimed[0].id}`,
                          }
                        : buildCoalescedPayload(category, claimed);

                const primaryJob = claimed[0];
                const coalescedData: Record<string, unknown> = {
                    ...(primaryJob.data || {}),
                    coalescedCount: claimed.length,
                    coalescedJobIds: claimed.map((c) => c.id),
                };

                const insertDelivery = await pool.query(
                    `INSERT INTO notification_deliveries (
                        user_id, job_id, category, source_app, title, body, url, data_json
                     )
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        userId,
                        primaryJob.id,
                        category,
                        primaryJob.sourceApp,
                        payload.title,
                        payload.body,
                        payload.url,
                        JSON.stringify(coalescedData),
                    ]
                );
                const deliveryId = Number(insertDelivery.lastInsertRowid ?? 0);

                const sendResult = await PushService.sendPushToUser(userId, {
                    title: payload.title,
                    body: payload.body,
                    url: payload.url,
                    icon: payload.icon,
                    badge: '/logo-192.png',
                    tag: payload.tag,
                    renotify: claimed.length > 1,
                    category,
                    notificationId: deliveryId > 0 ? deliveryId : undefined,
                    data: coalescedData,
                });

                if (deliveryId > 0) {
                    await pool.query(
                        `UPDATE notification_deliveries
                         SET sent_device_count = $1,
                             failed_device_count = $2
                         WHERE id = $3`,
                        [sendResult.sentCount, sendResult.failedCount, deliveryId]
                    );
                }

                for (const j of claimed) {
                    await pool.query(
                        `UPDATE notification_jobs
                         SET status = 'sent',
                             sent_at = CURRENT_TIMESTAMP,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $1`,
                        [j.id]
                    );
                    sentJobs += 1;
                }
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                for (const j of claimed) {
                    await pool
                        .query(
                            `UPDATE notification_jobs
                             SET status = 'failed',
                                 error_message = $1,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE id = $2`,
                            [errMsg.slice(0, 300), j.id]
                        )
                        .catch(() => {});
                }
            }
        }

        return { processedGroups, sentJobs, deferredJobs, skippedJobs };
    }
}
