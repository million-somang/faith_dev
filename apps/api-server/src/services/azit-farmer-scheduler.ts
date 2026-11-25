import { pool } from '@faithportal/database';
import { AzitGameService } from './azit-game.service.js';

const INITIAL_DELAY_MS = 12_000;
const POLL_INTERVAL_MS = 30_000;
const USER_BATCH_SIZE = 25;

let started = false;
let isTicking = false;
let initialTimer: ReturnType<typeof setTimeout> | null = null;
let intervalTimer: ReturnType<typeof setInterval> | null = null;

export async function runAzitFarmerTick(): Promise<{
    processedUsers: number;
    tasksExecuted: number;
}> {
    if (isTicking) {
        return { processedUsers: 0, tasksExecuted: 0 };
    }
    isTicking = true;
    let processedUsers = 0;
    let tasksExecuted = 0;

    try {
        const tableCheck = await pool.query(
            `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'azit_farmers' LIMIT 1`
        );
        if (tableCheck.rows.length === 0) {
            return { processedUsers: 0, tasksExecuted: 0 };
        }

        let lastUserId = 0;
        while (true) {
            const batchRes = await pool.query(
                `SELECT DISTINCT user_id
                 FROM azit_farmers
                 WHERE is_deleted = 0 AND auto_enabled = 1 AND user_id > $1
                 ORDER BY user_id ASC
                 LIMIT $2`,
                [lastUserId, USER_BATCH_SIZE]
            );
            if (batchRes.rows.length === 0) {
                break;
            }

            const prevLastUserId = lastUserId;
            for (const row of batchRes.rows) {
                const userId = Number(row.user_id);
                if (!Number.isInteger(userId) || userId <= 0) {
                    continue;
                }
                lastUserId = userId;
                try {
                    const result = await AzitGameService.processFarmerAutomation(userId, Date.now());
                    processedUsers += 1;
                    tasksExecuted += result.tasksExecuted;
                } catch (err) {
                    console.error(`[AzitFarmerScheduler] Error processing user ${userId}:`, err);
                }
            }

            if (lastUserId === prevLastUserId || batchRes.rows.length < USER_BATCH_SIZE) {
                break;
            }
            await new Promise<void>((resolve) => setImmediate(resolve));
        }
    } catch (err) {
        console.error('[AzitFarmerScheduler] Tick error:', err);
    } finally {
        isTicking = false;
    }

    return { processedUsers, tasksExecuted };
}

export function startAzitFarmerScheduler(): void {
    if (started) return;
    started = true;

    console.log(
        `[AzitFarmerScheduler] Started farmer automation monitor (interval: ${POLL_INTERVAL_MS / 1000}s, first check in ${INITIAL_DELAY_MS / 1000}s)`
    );

    initialTimer = setTimeout(() => {
        void runAzitFarmerTick().catch((err) => {
            console.error('[AzitFarmerScheduler] Initial run error:', err);
        });
    }, INITIAL_DELAY_MS);
    initialTimer.unref?.();

    intervalTimer = setInterval(() => {
        void runAzitFarmerTick().catch((err) => {
            console.error('[AzitFarmerScheduler] Periodic run error:', err);
        });
    }, POLL_INTERVAL_MS);
    intervalTimer.unref?.();
}

export function stopAzitFarmerScheduler(): void {
    if (initialTimer) {
        clearTimeout(initialTimer);
        initialTimer = null;
    }
    if (intervalTimer) {
        clearInterval(intervalTimer);
        intervalTimer = null;
    }
    started = false;
}
