import crypto from 'crypto';
import type { Context } from 'hono';
import { checkSession, type SessionUser } from '../middleware/auth.js';
import { PushService } from '../services/push.service.js';
import {
    NotificationService,
    NotificationServiceError,
    sanitizeNotificationUrl,
} from '../services/notification.service.js';
import type { PushSubscriptionPayload } from '../types/notification.types.js';

const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;
const MAX_DELAY_SEC = 365 * 24 * 60 * 60;

type DualAuthContext =
    | { mode: 'api_key' }
    | { mode: 'session'; sessionUser: SessionUser };

function constantTimeApiKeyMatch(providedKey: string, expectedKey: string): boolean {
    if (!providedKey || !expectedKey || expectedKey.length < 16) {
        return false;
    }
    const providedDigest = crypto.createHash('sha256').update(providedKey, 'utf8').digest();
    const expectedDigest = crypto.createHash('sha256').update(expectedKey, 'utf8').digest();
    return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

async function resolveDualAuth(c: Context): Promise<DualAuthContext | null> {
    const providedApiKey = (
        c.req.header('x-notification-api-key') ||
        c.req.header('X-Notification-Api-Key') ||
        ''
    ).trim();

    if (providedApiKey) {
        const expectedKey = (process.env.NOTIFICATION_API_KEY || '').trim();
        if (constantTimeApiKeyMatch(providedApiKey, expectedKey)) {
            return { mode: 'api_key' };
        }
        return null;
    }

    const sessionUser = await checkSession(c);
    if (sessionUser) {
        return { mode: 'session', sessionUser };
    }
    return null;
}

function getSessionUserId(c: Context): number | null {
    const user = c.get('user') as SessionUser | undefined;
    if (!user || typeof user.id !== 'number') return null;
    return user.id;
}

async function readJsonBody(c: Context): Promise<Record<string, unknown>> {
    try {
        const parsed: unknown = await c.req.json();
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        return {};
    } catch {
        return {};
    }
}

function inferDeviceLabel(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    const os = ua.includes('iphone')
        ? 'iPhone'
        : ua.includes('ipad')
          ? 'iPad'
          : ua.includes('android')
            ? 'Android'
            : ua.includes('windows')
              ? 'Windows PC'
              : ua.includes('mac os')
                ? 'Mac'
                : ua.includes('linux')
                  ? 'Linux'
                  : '기기';

    const browser = ua.includes('edg/')
        ? 'Edge'
        : ua.includes('opr/') || ua.includes('opera')
          ? 'Opera'
          : ua.includes('samsungbrowser')
            ? 'Samsung Internet'
            : ua.includes('chrome') || ua.includes('crios')
              ? 'Chrome'
              : ua.includes('safari')
                ? 'Safari'
                : ua.includes('firefox') || ua.includes('fxios')
                  ? 'Firefox'
                  : '브라우저';

    return `${os} · ${browser}`;
}

function parseSubscription(raw: unknown): PushSubscriptionPayload {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new NotificationServiceError('구독 객체(subscription)가 올바르지 않습니다.', 400);
    }
    const sub = raw as Record<string, unknown>;
    const endpoint = typeof sub.endpoint === 'string' ? sub.endpoint.trim() : '';
    const keys = sub.keys;
    if (!endpoint || !endpoint.startsWith('https://')) {
        throw new NotificationServiceError('올바른 Web Push endpoint URL이 아닙니다.', 400);
    }
    if (!keys || typeof keys !== 'object' || Array.isArray(keys)) {
        throw new NotificationServiceError('구독 암호화 키(keys)가 누락되었습니다.', 400);
    }
    const keysObj = keys as Record<string, unknown>;
    const p256dh = typeof keysObj.p256dh === 'string' ? keysObj.p256dh.trim() : '';
    const auth = typeof keysObj.auth === 'string' ? keysObj.auth.trim() : '';
    if (!p256dh || !auth) {
        throw new NotificationServiceError('p256dh 및 auth 키가 필요합니다.', 400);
    }
    return { endpoint, keys: { p256dh, auth } };
}

function validateCommonMessageFields(body: Record<string, unknown>, defaultSourceApp: string) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const msgBody = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title || title.length > 120) {
        throw new NotificationServiceError('알림 제목(title)은 1~120자여야 합니다.', 400);
    }
    if (!msgBody || msgBody.length > 400) {
        throw new NotificationServiceError('알림 내용(body)은 1~400자여야 합니다.', 400);
    }

    const rawCategory = typeof body.category === 'string' ? body.category.trim() : 'system';
    const category = rawCategory || 'system';
    if (!SAFE_IDENTIFIER_REGEX.test(category)) {
        throw new NotificationServiceError('카테고리(category) 형식이 올바르지 않습니다.', 400);
    }

    const rawSourceApp = typeof body.sourceApp === 'string' ? body.sourceApp.trim() : defaultSourceApp;
    const sourceApp = rawSourceApp || defaultSourceApp;
    if (!SAFE_IDENTIFIER_REGEX.test(sourceApp)) {
        throw new NotificationServiceError('호출 앱(sourceApp) 형식이 올바르지 않습니다.', 400);
    }

    const rawUrl = typeof body.url === 'string' ? body.url : undefined;
    const url = sanitizeNotificationUrl(rawUrl);

    const rawIcon = typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim() : '/logo-192.png';
    const icon = rawIcon.startsWith('/') && !rawIcon.startsWith('//') ? rawIcon.slice(0, 200) : '/logo-192.png';

    const tag = typeof body.tag === 'string' && body.tag.trim() ? body.tag.trim().slice(0, 80) : undefined;
    const dedupeKey =
        typeof body.dedupeKey === 'string' && body.dedupeKey.trim()
            ? body.dedupeKey.trim().slice(0, 120)
            : undefined;
    const ignoreQuietHours = body.ignoreQuietHours === true;
    const ignorePreferences = body.ignorePreferences === true;
    const data =
        body.data && typeof body.data === 'object' && !Array.isArray(body.data)
            ? (body.data as Record<string, unknown>)
            : undefined;

    return {
        title,
        body: msgBody,
        category,
        sourceApp,
        url,
        icon,
        tag,
        dedupeKey,
        ignoreQuietHours,
        ignorePreferences,
        data,
    };
}

function handleControllerError(c: Context, err: unknown, fallbackMessage: string) {
    if (err instanceof NotificationServiceError) {
        return c.json(
            {
                success: false,
                error: { code: err.statusCode, message: err.message },
            },
            err.statusCode as 400 | 401 | 403 | 404 | 409
        );
    }
    const message = err instanceof Error ? err.message : fallbackMessage;
    console.error('[NotificationController] Error:', err);
    return c.json(
        {
            success: false,
            error: { code: 500, message },
        },
        500
    );
}

async function resolveDualAuthTargetUserId(
    c: Context,
    auth: DualAuthContext,
    payload: Record<string, unknown>
): Promise<number> {
    if (auth.mode === 'session') {
        return auth.sessionUser.id;
    }

    const rawUserId = payload.userId ?? c.req.query('userId');
    const rawEmail = payload.email ?? c.req.query('email');

    const parsedUserId =
        typeof rawUserId === 'number'
            ? rawUserId
            : typeof rawUserId === 'string' && rawUserId.trim()
              ? Number(rawUserId.trim())
              : undefined;
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : undefined;

    if (!parsedUserId && !email) {
        throw new NotificationServiceError('API Key 호출 시 대상 userId 또는 email이 필요합니다.', 400);
    }

    const resolved = await NotificationService.resolveTargetUserId({
        userId: parsedUserId,
        email,
    });
    if (!resolved) {
        throw new NotificationServiceError('대상 활성 회원을 찾을 수 없습니다.', 404);
    }
    return resolved;
}

export class NotificationController {
    static async getPublicKey(c: Context) {
        const publicKey = PushService.getVapidPublicKey();
        return c.json({ success: true, data: { publicKey } });
    }

    static async listSubscriptions(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const devices = await PushService.listUserDevices(userId);
            return c.json({ success: true, data: { devices, count: devices.length } });
        } catch (err) {
            return handleControllerError(c, err, '구독 기기 목록을 불러오지 못했습니다.');
        }
    }

    static async upsertSubscription(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody(c);
            const subscription = parseSubscription(body.subscription);
            const userAgent = (c.req.header('User-Agent') || '').trim();
            const rawLabel = typeof body.deviceLabel === 'string' ? body.deviceLabel.trim() : '';
            const deviceLabel = rawLabel || (userAgent ? inferDeviceLabel(userAgent) : '웹 브라우저');

            await PushService.saveSubscription(userId, subscription, {
                deviceLabel,
                userAgent: userAgent || undefined,
            });
            const devices = await PushService.listUserDevices(userId);
            return c.json({ success: true, data: { devices, count: devices.length } });
        } catch (err) {
            return handleControllerError(c, err, '푸시 구독 등록에 실패했습니다.');
        }
    }

    static async deleteSubscription(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody(c);
            const endpoint =
                typeof body.endpoint === 'string' && body.endpoint.trim()
                    ? body.endpoint.trim()
                    : (c.req.query('endpoint') || '').trim();
            if (!endpoint) {
                throw new NotificationServiceError('해제할 구독 endpoint가 필요합니다.', 400);
            }
            await PushService.removeSubscription(userId, endpoint);
            const devices = await PushService.listUserDevices(userId);
            return c.json({ success: true, data: { devices, count: devices.length } });
        } catch (err) {
            return handleControllerError(c, err, '푸시 구독 해제에 실패했습니다.');
        }
    }

    static async getPreferences(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const preferences = await NotificationService.getPreferences(userId);
            return c.json({ success: true, data: preferences });
        } catch (err) {
            return handleControllerError(c, err, '알림 설정을 불러오지 못했습니다.');
        }
    }

    static async updatePreferences(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody(c);
            const categoriesPatch: Record<string, boolean> | undefined =
                body.categories && typeof body.categories === 'object' && !Array.isArray(body.categories)
                    ? Object.fromEntries(
                          Object.entries(body.categories as Record<string, unknown>).filter(
                              ([, v]) => typeof v === 'boolean'
                          ) as Array<[string, boolean]>
                      )
                    : undefined;

            const updated = await NotificationService.updatePreferences(userId, {
                categories: categoriesPatch,
                quietHoursEnabled:
                    typeof body.quietHoursEnabled === 'boolean' ? body.quietHoursEnabled : undefined,
                quietStartHHMM: typeof body.quietStartHHMM === 'string' ? body.quietStartHHMM.trim() : undefined,
                quietEndHHMM: typeof body.quietEndHHMM === 'string' ? body.quietEndHHMM.trim() : undefined,
            });
            return c.json({ success: true, data: updated });
        } catch (err) {
            return handleControllerError(c, err, '알림 설정 저장에 실패했습니다.');
        }
    }

    static async sendTest(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const nowLabel = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }).format(new Date());

            const outcome = await NotificationService.sendImmediate({
                userId,
                category: 'system',
                sourceApp: 'notification-center',
                title: '🔔 [VERA 테스트 알림]',
                body: `푸시 알림이 정상 연결되었습니다! (${nowLabel} 발송 · 클릭하면 아지트로 이동합니다)`,
                url: '/mypage?section=dashboard',
                tag: 'vera-test-push',
                renotify: true,
                ignorePreferences: true,
                ignoreQuietHours: true,
            });

            return c.json({ success: true, data: outcome });
        } catch (err) {
            return handleControllerError(c, err, '테스트 알림 발송에 실패했습니다.');
        }
    }

    static async getInbox(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const limit = Number(c.req.query('limit') || '30');
            const offset = Number(c.req.query('offset') || '0');
            const result = await NotificationService.getInbox(
                userId,
                Number.isFinite(limit) ? limit : 30,
                Number.isFinite(offset) ? offset : 0
            );
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '알림함을 불러오지 못했습니다.');
        }
    }

    static async markInboxRead(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody(c);
            const all = body.all === true;
            const id = typeof body.id === 'number' ? body.id : body.id ? Number(body.id) : undefined;
            const result = await NotificationService.markInboxRead(userId, { all, id });
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '알림 읽음 처리에 실패했습니다.');
        }
    }

    static async dismissInboxItem(c: Context) {
        try {
            const userId = getSessionUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const id = Number(c.req.param('id'));
            const result = await NotificationService.dismissInboxItem(userId, id);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '알림 삭제 처리에 실패했습니다.');
        }
    }

    static async sendGeneric(c: Context) {
        try {
            const auth = await resolveDualAuth(c);
            if (!auth) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 401,
                            message: 'Unauthorized: 로그인 세션 또는 유효한 X-Notification-Api-Key가 필요합니다.',
                        },
                    },
                    401
                );
            }

            const body = await readJsonBody(c);
            const targetUserId = await resolveDualAuthTargetUserId(c, auth, body);
            const msg = validateCommonMessageFields(
                body,
                auth.mode === 'api_key' ? 'external-api' : 'portal'
            );

            const outcome = await NotificationService.sendImmediate({
                userId: targetUserId,
                category: msg.category,
                sourceApp: msg.sourceApp,
                title: msg.title,
                body: msg.body,
                url: msg.url,
                icon: msg.icon,
                tag: msg.tag,
                renotify: body.renotify === true,
                requireInteraction: body.requireInteraction === true,
                data: msg.data,
                ignoreQuietHours: msg.ignoreQuietHours,
                ignorePreferences: auth.mode === 'api_key' ? msg.ignorePreferences : false,
            });

            return c.json({ success: true, data: outcome });
        } catch (err) {
            return handleControllerError(c, err, '범용 푸시 알림 발송에 실패했습니다.');
        }
    }

    static async scheduleGeneric(c: Context) {
        try {
            const auth = await resolveDualAuth(c);
            if (!auth) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 401,
                            message: 'Unauthorized: 로그인 세션 또는 유효한 X-Notification-Api-Key가 필요합니다.',
                        },
                    },
                    401
                );
            }

            const body = await readJsonBody(c);
            const targetUserId = await resolveDualAuthTargetUserId(c, auth, body);
            const msg = validateCommonMessageFields(
                body,
                auth.mode === 'api_key' ? 'external-api' : 'portal'
            );

            let scheduledAtMs: number | null = null;
            if (body.sendAt !== undefined && body.sendAt !== null) {
                if (typeof body.sendAt === 'number' && Number.isFinite(body.sendAt)) {
                    scheduledAtMs = body.sendAt;
                } else if (typeof body.sendAt === 'string' && body.sendAt.trim()) {
                    const parsed = Date.parse(body.sendAt.trim());
                    if (!Number.isNaN(parsed)) {
                        scheduledAtMs = parsed;
                    }
                }
            } else if (body.delaySec !== undefined && body.delaySec !== null) {
                const delaySec = typeof body.delaySec === 'number' ? body.delaySec : Number(body.delaySec);
                if (Number.isFinite(delaySec) && delaySec >= 0 && delaySec <= MAX_DELAY_SEC) {
                    scheduledAtMs = Date.now() + delaySec * 1000;
                }
            }

            if (scheduledAtMs === null || !Number.isFinite(scheduledAtMs)) {
                throw new NotificationServiceError('올바른 sendAt(ISO/ms) 또는 delaySec(0~31536000)가 필요합니다.', 400);
            }
            if (scheduledAtMs > Date.now() + MAX_DELAY_SEC * 1000) {
                throw new NotificationServiceError('예약 시각은 최대 1년 이내여야 합니다.', 400);
            }

            const outcome = await NotificationService.scheduleNotification({
                userId: targetUserId,
                category: msg.category,
                sourceApp: msg.sourceApp,
                dedupeKey: msg.dedupeKey,
                title: msg.title,
                body: msg.body,
                url: msg.url,
                icon: msg.icon,
                tag: msg.tag,
                data: msg.data,
                scheduledAtMs,
                ignoreQuietHours: msg.ignoreQuietHours,
            });

            return c.json({ success: true, data: outcome });
        } catch (err) {
            return handleControllerError(c, err, '예약 알림 등록에 실패했습니다.');
        }
    }

    static async cancelScheduledGeneric(c: Context) {
        try {
            const auth = await resolveDualAuth(c);
            if (!auth) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 401,
                            message: 'Unauthorized: 로그인 세션 또는 유효한 X-Notification-Api-Key가 필요합니다.',
                        },
                    },
                    401
                );
            }

            const body = await readJsonBody(c);
            const targetUserId = await resolveDualAuthTargetUserId(c, auth, body);

            const rawDedupeKey = body.dedupeKey ?? c.req.query('dedupeKey');
            const rawJobId = body.jobId ?? c.req.query('jobId');
            const dedupeKey = typeof rawDedupeKey === 'string' ? rawDedupeKey.trim() : undefined;
            const jobId =
                typeof rawJobId === 'number'
                    ? rawJobId
                    : typeof rawJobId === 'string' && rawJobId.trim()
                      ? Number(rawJobId.trim())
                      : undefined;

            const outcome = await NotificationService.cancelScheduled({
                userId: targetUserId,
                dedupeKey,
                jobId,
            });
            return c.json({ success: true, data: outcome });
        } catch (err) {
            return handleControllerError(c, err, '예약 알림 취소에 실패했습니다.');
        }
    }

    static async listScheduledGeneric(c: Context) {
        try {
            const auth = await resolveDualAuth(c);
            if (!auth) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 401,
                            message: 'Unauthorized: 로그인 세션 또는 유효한 X-Notification-Api-Key가 필요합니다.',
                        },
                    },
                    401
                );
            }

            const targetUserId = await resolveDualAuthTargetUserId(c, auth, {});
            const limit = Number(c.req.query('limit') || '50');
            const jobs = await NotificationService.listScheduled(
                targetUserId,
                Number.isFinite(limit) ? limit : 50
            );
            return c.json({ success: true, data: { jobs, count: jobs.length } });
        } catch (err) {
            return handleControllerError(c, err, '예약 알림 목록을 불러오지 못했습니다.');
        }
    }
}
