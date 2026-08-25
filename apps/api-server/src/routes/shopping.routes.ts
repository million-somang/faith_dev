import { Hono } from 'hono';
import { shoppingService } from '../services/shopping.service.js';
import { coupangClient } from '../services/coupangClient.js';

export const shoppingRoutes = new Hono();

// 1. 카테고리 목록
shoppingRoutes.get('/api/shopping/categories', (c) => {
    const categories = shoppingService.getCategories();
    return c.json({
        status: 'success',
        data: categories,
    });
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
        return c.json({ status: 'error', message: err.message || '베스트 상품 조회 실패' }, 500);
    }
});

// 5. 딥링크 생성 API (사용자가 일반 링크를 전달하면 파트너스 수익 링크로 변환)
shoppingRoutes.post('/api/shopping/deeplink', async (c) => {
    try {
        const body = await c.req.json();
        const urls: string[] = body.urls || [];
        const subId: string = body.subId || '';

        if (!urls || urls.length === 0) {
            return c.json({ status: 'error', message: 'URL 목록이 필요합니다.' }, 400);
        }

        if (coupangClient.isConfigured()) {
            const deepLinks = await coupangClient.createDeepLink(urls, subId);
            return c.json({
                status: 'success',
                data: deepLinks,
            });
        }

        // 미설정 시 기본 리다이렉트 포맷 제공
        const mockDeepLinks = urls.map(url => ({
            originalUrl: url,
            shortenUrl: url,
            landingUrl: url,
        }));

        return c.json({
            status: 'success',
            data: mockDeepLinks,
        });
    } catch (err: any) {
        return c.json({ status: 'error', message: err.message || '딥링크 생성 실패' }, 500);
    }
});

export default shoppingRoutes;
