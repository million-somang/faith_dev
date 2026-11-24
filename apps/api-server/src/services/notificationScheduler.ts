import { NotificationService } from './notification.service.js';

const POLL_INTERVAL_MS = 30 * 1000;
const INITIAL_DELAY_MS = 8 * 1000;

let started = false;
let isTicking = false;

async function runTick() {
    if (isTicking) return;
    isTicking = true;
    try {
        await NotificationService.processDueJobs();
    } catch (err) {
        console.error('[NotificationScheduler] Tick error:', err);
    } finally {
        isTicking = false;
    }
}

export function startNotificationScheduler() {
    if (started) return;
    started = true;

    console.log('[NotificationScheduler] Started generic notification queue monitor (interval: 30s, first check in 8s)');

    setTimeout(() => {
        runTick().catch((err) => console.error('[NotificationScheduler] Initial run error:', err));
    }, INITIAL_DELAY_MS);

    setInterval(() => {
        runTick().catch((err) => console.error('[NotificationScheduler] Periodic run error:', err));
    }, POLL_INTERVAL_MS);
}
