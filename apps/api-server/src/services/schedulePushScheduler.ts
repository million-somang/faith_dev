import { pool } from '@faithportal/database';
import { PushService } from './push.service.js';
import { MyPageService } from './mypage.service.js';
import { MinihomeService } from './minihome.service.js';

let isRunning = false;

const GARDEN_WATER_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8시간 (하루 3번 물주기)

const CROP_NAME_MAP: Record<string, string> = {
    'crop-carrot': '🥕 당근',
    'crop-pepper': '🌶️ 고추',
    'crop-tomato': '🍅 방울토마토',
    'crop-lettuce': '🥬 청상추',
    'crop-strawberry': '🍓 설향 딸기',
    'crop-potato': '🥔 햇감자',
};

export function startSchedulePushScheduler() {
    if (isRunning) return;
    isRunning = true;

    console.log('[SchedulePushScheduler] Started 1-hour schedule & 8-hour Azit Farm watering push monitor (interval: 1 minute)');

    // Run every 1 minute
    setInterval(async () => {
        try {
            await checkAndSend1HourNotifications();
            await checkAndSendGardenWaterNotifications();
        } catch (err) {
            console.error('[SchedulePushScheduler] Check error:', err);
        }
    }, 60 * 1000);

    // Initial check after 5 seconds
    setTimeout(() => {
        Promise.all([
            checkAndSend1HourNotifications(),
            checkAndSendGardenWaterNotifications(),
        ]).catch(e => console.error('[SchedulePushScheduler] Initial check error:', e));
    }, 5000);
}

async function checkAndSend1HourNotifications() {
    try {
        await MyPageService.ensureScheduleColumns();

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

/**
 * 아지트 농장(앞마당 텃밭) 8시간 경과 물주기 모바일 웹 푸시 알림 발송
 * - 작물이 1단계(새싹) 또는 2단계(성장중)이고 lastWateredAt 으로부터 8시간이 경과했을 때
 * - 아직 해당 물주기 회차에 푸시 알림을 보내지 않은 경우(waterNotifiedAt !== lastWateredAt) 1회 발송
 */
async function checkAndSendGardenWaterNotifications() {
    try {
        await MinihomeService.ensureTables();

        const res = await pool.query(`
            SELECT id, user_id, handle, owner_name, layout_json
            FROM user_minihomes
            WHERE is_deleted = 0
              AND user_id IS NOT NULL
        `);

        const nowMs = Date.now();

        for (const row of res.rows) {
            try {
                if (!row.layout_json || !row.user_id) continue;
                const layout = JSON.parse(row.layout_json);
                const plots = layout?.garden?.plots;
                if (!Array.isArray(plots) || plots.length === 0) continue;

                const duePlots: Array<{ plotIndex: number; cropId: string; stage: number }> = [];
                let updated = false;

                for (const plot of plots) {
                    if (!plot || !plot.cropId) continue;
                    const stage = Number(plot.stage || 0);
                    if (stage !== 1 && stage !== 2) continue;
                    if (!plot.lastWateredAt) continue;

                    const lastWaterMs = new Date(plot.lastWateredAt).getTime();
                    if (Number.isNaN(lastWaterMs)) continue;

                    if (nowMs - lastWaterMs >= GARDEN_WATER_COOLDOWN_MS) {
                        if (plot.waterNotifiedAt !== plot.lastWateredAt) {
                            duePlots.push({
                                plotIndex: Number(plot.plotIndex || 0),
                                cropId: String(plot.cropId),
                                stage,
                            });
                            plot.waterNotifiedAt = plot.lastWateredAt;
                            updated = true;
                        }
                    }
                }

                if (updated && duePlots.length > 0) {
                    await pool.query(
                        `UPDATE user_minihomes SET layout_json = $1 WHERE id = $2`,
                        [JSON.stringify(layout), row.id]
                    );

                    const firstCropLabel = CROP_NAME_MAP[duePlots[0].cropId] || '작물';
                    const bodyText =
                        duePlots.length === 1
                            ? `앞마당 ${duePlots[0].plotIndex + 1}번 텃밭의 [${firstCropLabel}]에 물을 줄 시간(8시간 경과)이에요! 지금 물을 주어 키워보세요 🌱`
                            : `앞마당 텃밭의 [${firstCropLabel}] 외 ${duePlots.length - 1}개 작물에 물을 줄 시간(8시간 경과)이에요! 지금 물을 주세요 💧`;

                    await PushService.sendPushToUser(Number(row.user_id), {
                        title: '💧 [아지트 농장] 작물에 물을 줄 시간이에요!',
                        body: bodyText,
                        url: '/minihome/me',
                        icon: '/logo-192.png',
                    });
                }
            } catch (rowErr) {
                console.error(`[SchedulePushScheduler] Error processing minihome #${row.id}:`, rowErr);
            }
        }
    } catch (err) {
        console.error('[SchedulePushScheduler] checkAndSendGardenWaterNotifications error:', err);
    }
}
