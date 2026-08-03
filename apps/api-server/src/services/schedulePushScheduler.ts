import { pool } from '@faithportal/database';
import { PushService } from './push.service.js';

let isRunning = false;

export function startSchedulePushScheduler() {
    if (isRunning) return;
    isRunning = true;

    console.log('[SchedulePushScheduler] Started 1-hour schedule notification monitor (interval: 1 minute)');

    // Run every 1 minute
    setInterval(async () => {
        try {
            await checkAndSend1HourNotifications();
        } catch (err) {
            console.error('[SchedulePushScheduler] Check error:', err);
        }
    }, 60 * 1000);

    // Initial check after 5 seconds
    setTimeout(() => {
        checkAndSend1HourNotifications().catch(e => console.error('[SchedulePushScheduler] Initial check error:', e));
    }, 5000);
}

async function checkAndSend1HourNotifications() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_schedules (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                schedule_date TEXT DEFAULT CURRENT_DATE,
                end_date TEXT,
                schedule_time VARCHAR(10) DEFAULT '09:00',
                end_time VARCHAR(10) DEFAULT '18:00',
                schedule_text TEXT NOT NULL,
                color VARCHAR(20) DEFAULT 'blue',
                notified_1h BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        try {
            await pool.query(`ALTER TABLE user_schedules ADD COLUMN notified_1h BOOLEAN DEFAULT FALSE;`);
        } catch (_) {}

        // Get unnotified schedules
        const res = await pool.query(`
            SELECT id, user_id, schedule_date, schedule_time, schedule_text, color
            FROM user_schedules
            WHERE (notified_1h IS NOT TRUE OR notified_1h IS NULL)
            ORDER BY schedule_date ASC, schedule_time ASC
        `);

        const now = new Date();
        const nowMs = now.getTime();

        for (const schedule of res.rows) {
            try {
                const dateStr = schedule.schedule_date
                    ? (typeof schedule.schedule_date === 'string' ? schedule.schedule_date.substring(0, 10) : new Date(schedule.schedule_date).toISOString().substring(0, 10))
                    : now.toISOString().substring(0, 10);
                const timeStr = schedule.schedule_time || '09:00';

                const targetDateTimeStr = `${dateStr}T${timeStr}:00`;
                const targetTime = new Date(targetDateTimeStr).getTime();

                if (isNaN(targetTime)) continue;

                const diffMinutes = (targetTime - nowMs) / (1000 * 60);

                // If schedule starts between 0 and 65 minutes from now (roughly 1 hour before)
                if (diffMinutes >= -5 && diffMinutes <= 65) {
                    console.log(`[SchedulePushScheduler] Sending 1-hour push notification for schedule #${schedule.id} (starts in ~${Math.round(diffMinutes)} mins)`);

                    await PushService.sendPushToUser(schedule.user_id, {
                        title: '📢 [VERA 일정 알림]',
                        body: `1시간 후 (${timeStr}) '${schedule.schedule_text}' 일정이 시작됩니다.`,
                        url: '/mypage',
                        icon: '/logo-192.png'
                    });

                    // Mark as notified
                    await pool.query(`UPDATE user_schedules SET notified_1h = TRUE WHERE id = $1`, [schedule.id]);
                }
            } catch (singleErr) {
                console.error(`[SchedulePushScheduler] Error processing schedule #${schedule.id}:`, singleErr);
            }
        }
    } catch (err) {
        console.error('[SchedulePushScheduler] checkAndSend1HourNotifications error:', err);
    }
}
