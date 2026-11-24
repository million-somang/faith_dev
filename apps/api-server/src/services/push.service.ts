import webpush from 'web-push';
import { pool } from '@faithportal/database';
import fs from 'fs';
import path from 'path';
import type {
    PushDeliveryPayload,
    PushDeviceRecord,
    PushSendResult,
    PushSubscriptionMeta,
    PushSubscriptionPayload,
} from '../types/notification.types.js';

// VAPID 키 파일 경로
const VAPID_KEY_FILE = path.resolve('./vapid-keys.json');

let vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

function initVapidKeys() {
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
        if (fs.existsSync(VAPID_KEY_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(VAPID_KEY_FILE, 'utf-8'));
                vapidKeys = data;
            } catch (e) {
                console.error('[PushService] Failed to read vapid-keys.json:', e);
            }
        }
        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            const keys = webpush.generateVAPIDKeys();
            vapidKeys = keys;
            try {
                fs.writeFileSync(VAPID_KEY_FILE, JSON.stringify(keys, null, 2), 'utf-8');
                console.log('[PushService] Generated and saved new VAPID keys to vapid-keys.json');
            } catch (e) {
                console.error('[PushService] Failed to save VAPID keys:', e);
            }
        }
    }

    try {
        webpush.setVapidDetails(
            'mailto:admin@veranex.app',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
    } catch (e) {
        console.error('[PushService] webpush.setVapidDetails error:', e);
    }
}

initVapidKeys();

interface RawPushSubRow {
    id: number;
    user_id: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    device_label?: string | null;
    user_agent?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

function getPushErrorStatusCode(err: unknown): number | undefined {
    if (err && typeof err === 'object' && 'statusCode' in err) {
        const val = (err as { statusCode?: unknown }).statusCode;
        return typeof val === 'number' ? val : undefined;
    }
    return undefined;
}

export class PushService {
    private static ensureTablePromise: Promise<void> | null = null;

    static async ensurePushTable(): Promise<void> {
        if (!this.ensureTablePromise) {
            this.ensureTablePromise = this.ensurePushTableInternal().catch((err) => {
                this.ensureTablePromise = null;
                throw err;
            });
        }
        return this.ensureTablePromise;
    }

    private static async ensurePushTableInternal(): Promise<void> {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_push_subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    endpoint TEXT NOT NULL UNIQUE,
                    p256dh TEXT NOT NULL,
                    auth TEXT NOT NULL,
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    device_label TEXT,
                    user_agent TEXT,
                    deleted_at DATETIME,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            const colRes = await pool.query(`PRAGMA table_info(user_push_subscriptions)`);
            const existingCols = new Set(
                (colRes.rows as Array<{ name?: unknown }>).map((r) => String(r.name || ''))
            );
            const alterStatements: Array<[string, string]> = [
                ['is_deleted', `ALTER TABLE user_push_subscriptions ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;`],
                ['device_label', `ALTER TABLE user_push_subscriptions ADD COLUMN device_label TEXT;`],
                ['user_agent', `ALTER TABLE user_push_subscriptions ADD COLUMN user_agent TEXT;`],
                ['deleted_at', `ALTER TABLE user_push_subscriptions ADD COLUMN deleted_at DATETIME;`],
                ['updated_at', `ALTER TABLE user_push_subscriptions ADD COLUMN updated_at DATETIME;`],
            ];
            for (const [colName, stmt] of alterStatements) {
                if (!existingCols.has(colName)) {
                    await pool.query(stmt).catch(() => {});
                }
            }
            await pool
                .query(
                    `CREATE INDEX IF NOT EXISTS idx_push_subs_user_active ON user_push_subscriptions(user_id, is_deleted);`
                )
                .catch(() => {});
        } catch (e) {
            console.error('[PushService] ensurePushTable error:', e);
        }
    }

    static getVapidPublicKey() {
        return vapidKeys.publicKey;
    }

    static async saveSubscription(
        userId: number,
        subscription: PushSubscriptionPayload,
        meta?: PushSubscriptionMeta
    ) {
        await this.ensurePushTable();
        const { endpoint, keys } = subscription;
        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            throw new Error('Invalid subscription format');
        }

        const deviceLabel = meta?.deviceLabel?.trim().slice(0, 100) || null;
        const userAgent = meta?.userAgent?.trim().slice(0, 255) || null;

        await pool.query(
            `INSERT INTO user_push_subscriptions (
                user_id, endpoint, p256dh, auth, is_deleted, device_label, user_agent, deleted_at, updated_at
             )
             VALUES ($1, $2, $3, $4, 0, $5, $6, NULL, CURRENT_TIMESTAMP)
             ON CONFLICT (endpoint) DO UPDATE
             SET user_id = excluded.user_id,
                 p256dh = excluded.p256dh,
                 auth = excluded.auth,
                 is_deleted = 0,
                 device_label = COALESCE(excluded.device_label, user_push_subscriptions.device_label),
                 user_agent = COALESCE(excluded.user_agent, user_push_subscriptions.user_agent),
                 deleted_at = NULL,
                 updated_at = CURRENT_TIMESTAMP`,
            [userId, endpoint, keys.p256dh, keys.auth, deviceLabel, userAgent]
        );
    }

    static async removeSubscription(userId: number, endpoint: string) {
        await this.ensurePushTable();
        await pool.query(
            `UPDATE user_push_subscriptions
             SET is_deleted = 1,
                 deleted_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND endpoint = $2`,
            [userId, endpoint]
        );
    }

    static async getUserSubscriptions(userId: number): Promise<RawPushSubRow[]> {
        await this.ensurePushTable();
        const res = await pool.query(
            `SELECT id, user_id, endpoint, p256dh, auth, device_label, user_agent, created_at, updated_at
             FROM user_push_subscriptions
             WHERE user_id = $1 AND (is_deleted = 0 OR is_deleted IS NULL)
             ORDER BY id DESC`,
            [userId]
        );
        return res.rows as RawPushSubRow[];
    }

    static async listUserDevices(userId: number): Promise<PushDeviceRecord[]> {
        const rows = await this.getUserSubscriptions(userId);
        return rows.map((row) => ({
            id: Number(row.id),
            endpoint: String(row.endpoint),
            deviceLabel: row.device_label ? String(row.device_label) : null,
            userAgent: row.user_agent ? String(row.user_agent) : null,
            createdAt: row.created_at ? String(row.created_at) : null,
            updatedAt: row.updated_at ? String(row.updated_at) : null,
        }));
    }

    static async sendPushToUser(userId: number, payload: PushDeliveryPayload): Promise<PushSendResult> {
        const subs = await this.getUserSubscriptions(userId);
        if (subs.length === 0) {
            return { sentCount: 0, failedCount: 0, expiredCount: 0, totalDevices: 0 };
        }

        const payloadStr = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/mypage',
            icon: payload.icon || '/logo-192.png',
            badge: payload.badge || '/logo-192.png',
            tag: payload.tag,
            renotify: Boolean(payload.renotify),
            requireInteraction: Boolean(payload.requireInteraction),
            category: payload.category,
            notificationId: payload.notificationId,
            data: payload.data,
        });

        let sentCount = 0;
        let failedCount = 0;
        let expiredCount = 0;

        for (const sub of subs) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            try {
                await webpush.sendNotification(pushSubscription, payloadStr);
                sentCount += 1;
            } catch (err: unknown) {
                failedCount += 1;
                const statusCode = getPushErrorStatusCode(err);
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error(`[PushService] Failed to send push to sub ${sub.id}:`, statusCode || errMsg);
                if (statusCode === 410 || statusCode === 404) {
                    expiredCount += 1;
                    // 만료된 구독은 Soft Delete 처리
                    try {
                        await pool.query(
                            `UPDATE user_push_subscriptions
                             SET is_deleted = 1,
                                 deleted_at = CURRENT_TIMESTAMP,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE id = $1`,
                            [sub.id]
                        );
                    } catch (_) {}
                }
            }
        }

        return {
            sentCount,
            failedCount,
            expiredCount,
            totalDevices: subs.length,
        };
    }
}
