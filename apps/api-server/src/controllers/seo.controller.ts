import crypto from 'crypto';
import type { Context } from 'hono';
import { checkSession } from '../middleware/auth.js';
import { SeoService, SeoServiceError } from '../services/seo.service.js';
import type { IndexNowPreset } from '../types/seo.types.js';

function constantTimeMatch(provided: string, expected: string): boolean {
    if (!provided || !expected || expected.length < 16) return false;
    const a = crypto.createHash('sha256').update(provided, 'utf8').digest();
    const b = crypto.createHash('sha256').update(expected, 'utf8').digest();
    return crypto.timingSafeEqual(a, b);
}

async function isAuthorizedForSeoWrite(c: Context): Promise<boolean> {
    const providedApiKey = (
        c.req.header('x-api-key') ||
        c.req.header('X-API-KEY') ||
        c.req.header('x-notification-api-key') ||
        c.req.header('X-Notification-Api-Key') ||
        ''
    ).trim();

    if (providedApiKey) {
        const newsKey = (process.env.NEWS_API_KEY || '').trim();
        const notifKey = (process.env.NOTIFICATION_API_KEY || '').trim();
        if (constantTimeMatch(providedApiKey, newsKey) || constantTimeMatch(providedApiKey, notifKey)) {
            return true;
        }
        return false;
    }

    const user = await checkSession(c);
    return Boolean(user && (user.role === 'admin' || Number(user.level || 0) >= 6));
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

export class SeoController {
    static async getSitemapIndexMeta(c: Context) {
        try {
            const meta = await SeoService.getSitemapIndexMeta();
            return c.json({ success: true, data: meta });
        } catch (err) {
            console.error('[SeoController] getSitemapIndexMeta error:', err);
            return c.json({ success: false, error: { code: 500, message: '사이트맵 메타 조회 실패' } }, 500);
        }
    }

    static async getTravelSitemapChunk(c: Context) {
        try {
            const rawPage = Number(c.req.query('page') || '1');
            const rawLimit = Number(c.req.query('limit') || '5000');
            if (!Number.isInteger(rawPage) || rawPage < 1) {
                return c.json({ success: false, error: { code: 400, message: '유효한 page(1 이상 정수)가 필요합니다.' } }, 400);
            }
            const chunk = await SeoService.getTravelSitemapChunk(
                rawPage,
                Number.isFinite(rawLimit) ? rawLimit : 5000
            );
            return c.json({ success: true, data: chunk });
        } catch (err) {
            console.error('[SeoController] getTravelSitemapChunk error:', err);
            return c.json({ success: false, error: { code: 500, message: '여행 사이트맵 청크 조회 실패' } }, 500);
        }
    }

    static async getRecentNewsSitemap(c: Context) {
        try {
            const rawLimit = Number(c.req.query('limit') || '1000');
            const items = await SeoService.getRecentNewsSitemap(Number.isFinite(rawLimit) ? rawLimit : 1000);
            return c.json({ success: true, data: { items, count: items.length } });
        } catch (err) {
            console.error('[SeoController] getRecentNewsSitemap error:', err);
            return c.json({ success: false, error: { code: 500, message: '최근 뉴스 사이트맵 조회 실패' } }, 500);
        }
    }

    static async getTravelRss(c: Context) {
        try {
            const rawLimit = Number(c.req.query('limit') || '100');
            const items = await SeoService.getTravelRssItems(Number.isFinite(rawLimit) ? rawLimit : 100);
            return c.json({ success: true, data: { items, count: items.length } });
        } catch (err) {
            console.error('[SeoController] getTravelRss error:', err);
            return c.json({ success: false, error: { code: 500, message: '여행 RSS 조회 실패' } }, 500);
        }
    }

    static async getIndexNowKey(c: Context) {
        const key = SeoService.getIndexNowKey();
        return c.json({ success: true, data: { key } });
    }

    static async submitIndexNow(c: Context) {
        try {
            const authorized = await isAuthorizedForSeoWrite(c);
            if (!authorized) {
                return c.json(
                    { success: false, error: { code: 401, message: 'Unauthorized: 관리자 또는 API Key가 필요합니다.' } },
                    401
                );
            }

            const body = await readJsonBody(c);
            const rawPreset = typeof body.preset === 'string' ? body.preset.trim() : '';
            const rawUrls = Array.isArray(body.urls)
                ? body.urls.filter((u): u is string => typeof u === 'string')
                : [];

            let urlsToSubmit: string[] = rawUrls;
            let triggerSource = 'manual-urls';

            if (rawPreset === 'core' || rawPreset === 'travel-top' || rawPreset === 'recent-news') {
                const presetUrls = await SeoService.buildPresetUrls(rawPreset as IndexNowPreset);
                urlsToSubmit = [...presetUrls, ...rawUrls];
                triggerSource = `manual-preset:${rawPreset}`;
            }

            const result = await SeoService.submitIndexNowUrls(urlsToSubmit, triggerSource);
            return c.json({ success: true, data: result });
        } catch (err) {
            if (err instanceof SeoServiceError) {
                return c.json(
                    { success: false, error: { code: err.statusCode, message: err.message } },
                    err.statusCode as 400
                );
            }
            console.error('[SeoController] submitIndexNow error:', err);
            return c.json({ success: false, error: { code: 500, message: 'IndexNow 제출 실패' } }, 500);
        }
    }

    static async getIndexNowLogs(c: Context) {
        try {
            const authorized = await isAuthorizedForSeoWrite(c);
            if (!authorized) {
                return c.json(
                    { success: false, error: { code: 401, message: 'Unauthorized: 관리자 또는 API Key가 필요합니다.' } },
                    401
                );
            }
            const rawLimit = Number(c.req.query('limit') || '30');
            const logs = await SeoService.listIndexNowLogs(Number.isFinite(rawLimit) ? rawLimit : 30);
            return c.json({ success: true, data: { logs, count: logs.length } });
        } catch (err) {
            console.error('[SeoController] getIndexNowLogs error:', err);
            return c.json({ success: false, error: { code: 500, message: 'IndexNow 이력 조회 실패' } }, 500);
        }
    }
}
