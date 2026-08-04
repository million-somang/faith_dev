import webpush from 'web-push';
import { pool } from '@faithportal/database';
import fs from 'fs';
import path from 'path';

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

export class PushService {
    static async ensurePushTable() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_push_subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    endpoint TEXT NOT NULL UNIQUE,
                    p256dh TEXT NOT NULL,
                    auth TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (e) {
            console.error('[PushService] ensurePushTable error:', e);
        }
    }

    static getVapidPublicKey() {
        return vapidKeys.publicKey;
    }

    static async saveSubscription(userId: number, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
        await this.ensurePushTable();
        const { endpoint, keys } = subscription;
        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            throw new Error('Invalid subscription format');
        }

        await pool.query(`
            INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (endpoint) DO UPDATE
            SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
        `, [userId, endpoint, keys.p256dh, keys.auth]);
    }

    static async removeSubscription(userId: number, endpoint: string) {
        await this.ensurePushTable();
        await pool.query(`
            DELETE FROM user_push_subscriptions
            WHERE user_id = $1 AND endpoint = $2
        `, [userId, endpoint]);
    }

    static async getUserSubscriptions(userId: number) {
        await this.ensurePushTable();
        const res = await pool.query(`
            SELECT id, user_id, endpoint, p256dh, auth
            FROM user_push_subscriptions
            WHERE user_id = $1
        `, [userId]);
        return res.rows;
    }

    static async sendPushToUser(userId: number, payload: { title: string; body: string; url?: string; icon?: string }) {
        const subs = await this.getUserSubscriptions(userId);
        if (subs.length === 0) return;

        const payloadStr = JSON.stringify(payload);

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
            } catch (err: any) {
                console.error(`[PushService] Failed to send push to sub ${sub.id}:`, err?.statusCode || err?.message);
                if (err?.statusCode === 410 || err?.statusCode === 404) {
                    // Expired subscription, remove from DB
                    try {
                        await pool.query(`DELETE FROM user_push_subscriptions WHERE id = $1`, [sub.id]);
                    } catch (_) {}
                }
            }
        }
    }
}
