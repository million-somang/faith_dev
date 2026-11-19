import { Hono } from 'hono';
import { requireAdmin } from './admin.routes.js';
import {
    acknowledgeIncident,
    getWatchdogDashboardData,
    getWatchdogPingSummary,
    runAllWatchdogChecks,
    runSingleWatchdogCheck,
    sendTelegramTestMessage,
} from '../services/watchdog.service.js';

export const watchdogRoutes = new Hono<{ Variables: { adminUserId: string } }>();

// 외부 업타임 모니터용 경량 핑 (민감정보 제외 요약만 반환)
watchdogRoutes.get('/api/watchdog/ping', async (c) => {
    try {
        const summary = await getWatchdogPingSummary();
        return c.json(summary, summary.down > 0 ? 503 : 200);
    } catch (err) {
        return c.json(
            { success: false, status: 'down', message: err instanceof Error ? err.message : 'watchdog error' },
            500
        );
    }
});

// 관리자 와치독 대시보드 전체 상태 조회
watchdogRoutes.get('/api/admin/watchdog/status', requireAdmin, async (c) => {
    try {
        const data = await getWatchdogDashboardData();
        return c.json({ success: true, ...data });
    } catch (err) {
        console.error('[Watchdog] Status API error:', err);
        return c.json({ success: false, message: '와치독 상태 조회에 실패했습니다.' }, 500);
    }
});

// 전체 14개 프로브 즉시 실행
watchdogRoutes.post('/api/admin/watchdog/run', requireAdmin, async (c) => {
    try {
        await runAllWatchdogChecks('manual');
        const data = await getWatchdogDashboardData();
        return c.json({ success: true, ...data });
    } catch (err) {
        console.error('[Watchdog] Manual full run error:', err);
        return c.json({ success: false, message: '와치독 전체 점검 실행에 실패했습니다.' }, 500);
    }
});

// 개별 프로브 재점검
watchdogRoutes.post('/api/admin/watchdog/run/:key', requireAdmin, async (c) => {
    try {
        const checkKey = c.req.param('key');
        const row = await runSingleWatchdogCheck(checkKey);
        if (!row) {
            return c.json({ success: false, message: '존재하지 않는 점검 항목입니다.' }, 404);
        }
        const data = await getWatchdogDashboardData();
        return c.json({ success: true, ...data });
    } catch (err) {
        console.error('[Watchdog] Single run error:', err);
        return c.json({ success: false, message: '개별 점검 실행에 실패했습니다.' }, 500);
    }
});

// 장애 이력 확인 처리
watchdogRoutes.patch('/api/admin/watchdog/incidents/:id/ack', requireAdmin, async (c) => {
    try {
        const id = Number(c.req.param('id'));
        if (!Number.isInteger(id) || id <= 0) {
            return c.json({ success: false, message: '잘못된 이력 ID입니다.' }, 400);
        }
        const adminUserId = c.get('adminUserId') || 'admin';
        const updated = await acknowledgeIncident(id, String(adminUserId));
        if (!updated) {
            return c.json({ success: false, message: '해당 장애 이력을 찾을 수 없습니다.' }, 404);
        }
        return c.json({ success: true, message: '확인 처리되었습니다.' });
    } catch (err) {
        console.error('[Watchdog] Incident ack error:', err);
        return c.json({ success: false, message: '확인 처리에 실패했습니다.' }, 500);
    }
});

// 텔레그램 알림 테스트 발송
watchdogRoutes.post('/api/admin/watchdog/telegram/test', requireAdmin, async (c) => {
    try {
        const result = await sendTelegramTestMessage();
        return c.json(result, result.success ? 200 : 400);
    } catch (err) {
        console.error('[Watchdog] Telegram test error:', err);
        return c.json({ success: false, message: '텔레그램 테스트 발송 중 오류가 발생했습니다.' }, 500);
    }
});
