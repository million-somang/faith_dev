import { Hono } from 'hono';
import { shoppingService } from '../services/shopping.service.js';
import { coupangClient } from '../services/coupangClient.js';

export const shoppingRoutes = new Hono();

const DEEPLINK_RATE_WINDOW_MS = 60 * 1000;
const DEEPLINK_MAX_PER_MIN = 20;
const deeplinkRateMap = new Map<string, { count: number; resetAt: number }>();

function checkDeeplinkRateLimit(ip: string): boolean {
    const now = Date.now();
    if (deeplinkRateMap.size > 2000) {
        for (const [k, v] of deeplinkRateMap.entries()) {
            if (now > v.resetAt) deeplinkRateMap.delete(k);
        }
    }
    const entry = deeplinkRateMap.get(ip);
    if (!entry || now > entry.resetAt) {
        deeplinkRateMap.set(ip, { count: 1, resetAt: now + DEEPLINK_RATE_WINDOW_MS });
        return false;
    }
    if (entry.count >= DEEPLINK_MAX_PER_MIN) return true;
    entry.count += 1;
    return false;
}

function isAllowedCoupangUrl(rawUrl: unknown): boolean {
    if (typeof rawUrl !== 'string' || !rawUrl.trim() || rawUrl.length > 1000) return false;
    try {
        const parsed = new URL(rawUrl.trim());
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
        const host = parsed.hostname.toLowerCase();
        return host === 'coupang.com' || host.endsWith('.coupang.com');
    } catch {
        return false;
    }
}

// 1. 카테고리 목록
shoppingRoutes.get('/api/shopping/categories', (c) => {
    const categories = shoppingService.getCategories();
    return c.json({
        status: 'success',
        data: categories,
    });
});

// 1-1. 상단 화제의 신박템 4선 쇼케이스
shoppingRoutes.get('/api/shopping/viral', async (c) => {
    try {
        const products = await shoppingService.getViralCuratedProducts(4);
        return c.json({
            status: 'success',
            data: products,
        });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message || '신박템 조회 실패' }, 500);
    }
});

// 2. 오늘의 골드박스 타임세일
shoppingRoutes.get('/api/shopping/goldbox', async (c) => {
    try {
        const products = await shoppingService.getGoldBoxProducts();
        return c.json({
            status: 'success',
            data: products,
        });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message || '골드박스 조회 실패' }, 500);
    }
});

// 3. 상품 목록 (검색 & 카테고리 & 정렬 & 페이징)
shoppingRoutes.get('/api/shopping/products', async (c) => {
    try {
        const keyword = c.req.query('keyword') || '';
        const category = c.req.query('category') || 'all';
        const sort = (c.req.query('sort') as any) || 'ranking';
        const page = parseInt(c.req.query('page') || '1', 10);
        const limit = parseInt(c.req.query('limit') || '20', 10);

        const result = await shoppingService.getProducts({
            keyword,
            category,
            sort,
            page,
            limit,
        });

        return c.json({
            status: 'success',
            data: result,
            meta: {
                isLiveApi: coupangClient.isConfigured(),
            }
        });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message || '상품 목록 조회 실패' }, 500);
    }
});

// 4. 카테고리별 베스트 상품
shoppingRoutes.get('/api/shopping/best', async (c) => {
    try {
        const categoryId = parseInt(c.req.query('categoryId') || '0', 10);
        const limit = parseInt(c.req.query('limit') || '8', 10);

        const products = await shoppingService.getBestProducts(categoryId, limit);
        return c.json({
            status: 'success',
            data: products,
        });
    } catch (err: any) {
        console.error('[Shopping] 베스트 상품 조회 오류:', err);
        return c.json({ status: 'error', message: '베스트 상품 조회 실패' }, 500);
    }
});

// 5. 딥링크 생성 API (사용자가 일반 링크를 전달하면 파트너스 수익 링크로 변환)
shoppingRoutes.post('/api/shopping/deeplink', async (c) => {
    try {
        const forwarded = c.req.header('x-forwarded-for');
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : (c.req.header('x-real-ip') || 'unknown');
        if (checkDeeplinkRateLimit(clientIp)) {
            return c.json({ status: 'error', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429);
        }

        const body = await c.req.json();
        const urls: unknown = body?.urls;
        const subId: string = typeof body?.subId === 'string' ? body.subId.trim().slice(0, 64) : '';

        if (!Array.isArray(urls) || urls.length === 0 || urls.length > 10) {
            return c.json({ status: 'error', message: 'URL 목록은 1~10개까지 입력 가능합니다.' }, 400);
        }

        const validUrls = urls.filter((u): u is string => isAllowedCoupangUrl(u)).map((u) => u.trim());
        if (validUrls.length !== urls.length) {
            return c.json({ status: 'error', message: '허용된 쿠팡 도메인 URL만 변환할 수 있습니다.' }, 400);
        }

        if (coupangClient.isConfigured()) {
            const deepLinks = await coupangClient.createDeepLink(validUrls, subId);
            return c.json({
                status: 'success',
                data: deepLinks,
            });
        }

        // 미설정 시 기본 리다이렉트 포맷 제공
        const mockDeepLinks = validUrls.map(url => ({
            originalUrl: url,
            shortenUrl: url,
            landingUrl: url,
        }));

        return c.json({
            status: 'success',
            data: mockDeepLinks,
        });
    } catch (err: any) {
        console.error('[Shopping] 딥링크 생성 오류:', err);
        return c.json({ status: 'error', message: '딥링크 생성 실패' }, 500);
    }
});

export default shoppingRoutes;
