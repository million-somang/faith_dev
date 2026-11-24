import { Hono } from 'hono';
import { requireAuth, type SessionUser } from '../middleware/auth.js';
import { NotificationController } from '../controllers/notification.controller.js';

export const notificationRoutes = new Hono<{ Variables: { user: SessionUser } }>();

// VAPID 공개키 조회
notificationRoutes.get('/public-key', (c) => NotificationController.getPublicKey(c));

// 내 구독 기기 관리 (로그인 세션 필수)
notificationRoutes.get('/subscriptions', requireAuth, (c) => NotificationController.listSubscriptions(c));
notificationRoutes.post('/subscriptions', requireAuth, (c) => NotificationController.upsertSubscription(c));
notificationRoutes.delete('/subscriptions', requireAuth, (c) => NotificationController.deleteSubscription(c));

// 내 알림 설정·테스트·최근 알림함 (로그인 세션 필수)
notificationRoutes.get('/preferences', requireAuth, (c) => NotificationController.getPreferences(c));
notificationRoutes.put('/preferences', requireAuth, (c) => NotificationController.updatePreferences(c));
notificationRoutes.post('/test', requireAuth, (c) => NotificationController.sendTest(c));

notificationRoutes.get('/inbox', requireAuth, (c) => NotificationController.getInbox(c));
notificationRoutes.post('/inbox/read', requireAuth, (c) => NotificationController.markInboxRead(c));
notificationRoutes.delete('/inbox/:id', requireAuth, (c) => NotificationController.dismissInboxItem(c));

// 범용 발송·예약·취소·조회 API (로그인 세션 OR X-Notification-Api-Key 이중 인증)
notificationRoutes.post('/send', (c) => NotificationController.sendGeneric(c));
notificationRoutes.post('/schedule', (c) => NotificationController.scheduleGeneric(c));
notificationRoutes.delete('/schedule', (c) => NotificationController.cancelScheduledGeneric(c));
notificationRoutes.get('/scheduled', (c) => NotificationController.listScheduledGeneric(c));
