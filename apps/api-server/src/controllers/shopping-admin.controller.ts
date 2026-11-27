import { Context } from 'hono';
import { getDB } from '../db/adapter.js';
import { logActivity } from '../routes/admin.routes.js';
import { ShoppingAdminService } from '../services/shopping-admin.service.js';
import {
    ALLOWED_DISPLAY_SECTIONS,
    ALLOWED_MALL_CATEGORIES,
    ALLOWED_SOURCE_TYPES,
    COUPANG_OFFICIAL_CATEGORIES,
    type DisplaySectionId,
    type ImportCoupangProductInput,
    type MallCategoryId,
    type ShoppingSourceType,
    type UpdateProductInput,
} from '../types/shopping-admin.types.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAllowedHttpUrl(rawUrl: unknown): boolean {
    if (typeof rawUrl !== 'string' || !rawUrl.trim() || rawUrl.length > 1000) return false;
    try {
        const parsed = new URL(rawUrl.trim());
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

function isAllowedCoupangUrl(rawUrl: unknown): boolean {
    if (!isAllowedHttpUrl(rawUrl)) return false;
    const parsed = new URL(String(rawUrl).trim());
    const host = parsed.hostname.toLowerCase();
    return host === 'coupang.com' || host.endsWith('.coupang.com');
}

function parsePositiveInt(raw: string): number | null {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;
    return parsed;
}

export class ShoppingAdminController {
    static async getSettings(c: Context) {
        try {
            const summary = await ShoppingAdminService.getSettingsSummary();
            return c.json({ success: true, data: summary });
        } catch (err) {
            console.error('[ShoppingAdminController] getSettings error:', err);
            return c.json(
                { success: false, error: { code: 500, message: '쿠팡 API 설정을 불러오지 못했습니다.' } },
                500
            );
        }
    }

    static async saveSettings(c: Context) {
        try {
            const adminUserId = String(c.get('adminUserId') || 'admin');
            const body = (await c.req.json().catch(() => null)) as unknown;
            if (!isPlainObject(body)) {
                return c.json(
                    { success: false, error: { code: 400, message: '올바른 요청 형식이 아닙니다.' } },
                    400
                );
            }

            const accessKey = typeof body.accessKey === 'string' ? body.accessKey.trim() : undefined;
            const secretKey = typeof body.secretKey === 'string' ? body.secretKey.trim() : undefined;
            const defaultSubId = typeof body.defaultSubId === 'string' ? body.defaultSubId.trim().slice(0, 64) : undefined;

            if (accessKey && accessKey.length > 128) {
                return c.json({ success: false, error: { code: 400, message: 'Access Key 길이가 너무 깁니다.' } }, 400);
            }
            if (secretKey && secretKey.length > 128) {
                return c.json({ success: false, error: { code: 400, message: 'Secret Key 길이가 너무 깁니다.' } }, 400);
            }

            const data = await ShoppingAdminService.saveSettings(adminUserId, {
                accessKey,
                secretKey,
                defaultSubId,
            });
            await logActivity(getDB(c), adminUserId, 'admin_action', '쿠팡 파트너스 API 설정 저장');
            return c.json({ success: true, data });
        } catch (err) {
            console.error('[ShoppingAdminController] saveSettings error:', err);
            return c.json(
                { success: false, error: { code: 500, message: '쿠팡 API 설정 저장 중 오류가 발생했습니다.' } },
                500
            );
        }
    }

    static async testConnection(c: Context) {
        try {
            const adminUserId = String(c.get('adminUserId') || 'admin');
            const result = await ShoppingAdminService.testConnection(adminUserId);
            await logActivity(
                getDB(c),
                adminUserId,
                'admin_action',
                `쿠팡 파트너스 API 연결 테스트: ${result.ok ? '성공' : '실패'}`
            );
            return c.json({ success: result.ok, data: result }, result.ok ? 200 : 400);
        } catch (err) {
            console.error('[ShoppingAdminController] testConnection error:', err);
            return c.json(
                { success: false, error: { code: 500, message: '연결 테스트 수행 중 오류가 발생했습니다.' } },
                500
            );
        }
    }

    static async searchCoupang(c: Context) {
        const keyword = (c.req.query('keyword') || '').trim();
        if (!keyword || keyword.length > 80) {
            return c.json(
                { success: false, error: { code: 400, message: '검색어를 1~80자 이내로 입력해 주세요.' } },
                400
            );
        }
        const rawLimit = Number(c.req.query('limit') || '20');
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.round(rawLimit)), 100) : 20;
        const subId = (c.req.query('subId') || '').trim().slice(0, 64) || undefined;

        try {
            const items = await ShoppingAdminService.fetchCoupangSearch(keyword, limit, subId);
            return c.json({ success: true, data: { items, total: items.length } });
        } catch (err) {
            const msg = err instanceof Error ? err.message : '쿠팡 상품 검색에 실패했습니다.';
            return c.json({ success: false, error: { code: 502, message: msg } }, 502);
        }
    }

    static async bestCoupang(c: Context) {
        const categoryId = Number(c.req.query('categoryId') || '1016');
        const isKnownCategory = COUPANG_OFFICIAL_CATEGORIES.some((cat) => cat.id === categoryId);
        if (!Number.isInteger(categoryId) || !isKnownCategory) {
            return c.json(
                { success: false, error: { code: 400, message: '지원하지 않는 쿠팡 카테고리 코드입니다.' } },
                400
            );
        }
        const rawLimit = Number(c.req.query('limit') || '20');
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.round(rawLimit)), 100) : 20;
        const subId = (c.req.query('subId') || '').trim().slice(0, 64) || undefined;

        try {
            const items = await ShoppingAdminService.fetchCoupangBest(categoryId, limit, subId);
            return c.json({ success: true, data: { items, total: items.length } });
        } catch (err) {
            const msg = err instanceof Error ? err.message : '쿠팡 카테고리 베스트 조회에 실패했습니다.';
            return c.json({ success: false, error: { code: 502, message: msg } }, 502);
        }
    }

    static async goldboxCoupang(c: Context) {
        const subId = (c.req.query('subId') || '').trim().slice(0, 64) || undefined;
        try {
            const items = await ShoppingAdminService.fetchCoupangGoldBox(subId);
            return c.json({ success: true, data: { items, total: items.length } });
        } catch (err) {
            const msg = err instanceof Error ? err.message : '쿠팡 골드박스 조회에 실패했습니다.';
            return c.json({ success: false, error: { code: 502, message: msg } }, 502);
        }
    }

    static async createDeepLink(c: Context) {
        const body = (await c.req.json().catch(() => null)) as unknown;
        if (!isPlainObject(body) || !Array.isArray(body.urls) || body.urls.length === 0 || body.urls.length > 10) {
            return c.json(
                { success: false, error: { code: 400, message: '쿠팡 URL은 1~10개까지 입력할 수 있습니다.' } },
                400
            );
        }

        const validUrls = body.urls.filter((u): u is string => isAllowedCoupangUrl(u)).map((u) => u.trim());
        if (validUrls.length !== body.urls.length) {
            return c.json(
                { success: false, error: { code: 400, message: '쿠팡 도메인(coupang.com) URL만 변환할 수 있습니다.' } },
                400
            );
        }

        const subId = typeof body.subId === 'string' ? body.subId.trim().slice(0, 64) : undefined;

        try {
            const links = await ShoppingAdminService.convertDeepLinks(validUrls, subId);
            return c.json({ success: true, data: { links } });
        } catch (err) {
            const msg = err instanceof Error ? err.message : '딥링크 변환에 실패했습니다.';
            return c.json({ success: false, error: { code: 502, message: msg } }, 502);
        }
    }

    static async importProducts(c: Context) {
        const adminUserId = String(c.get('adminUserId') || 'admin');
        const body = (await c.req.json().catch(() => null)) as unknown;
        if (!isPlainObject(body) || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
            return c.json(
                { success: false, error: { code: 400, message: '등록할 상품을 1~100개 선택해 주세요.' } },
                400
            );
        }

        const mallCategory = body.mallCategory as MallCategoryId;
        if (!ALLOWED_MALL_CATEGORIES.has(mallCategory)) {
            return c.json(
                { success: false, error: { code: 400, message: '올바른 쇼핑몰 카테고리를 선택해 주세요.' } },
                400
            );
        }

        const displaySection = body.displaySection as DisplaySectionId;
        if (!ALLOWED_DISPLAY_SECTIONS.has(displaySection)) {
            return c.json(
                { success: false, error: { code: 400, message: '올바른 전시 구역을 선택해 주세요.' } },
                400
            );
        }

        const sourceType = (typeof body.sourceType === 'string' ? body.sourceType : 'search') as ShoppingSourceType;
        if (!ALLOWED_SOURCE_TYPES.has(sourceType)) {
            return c.json(
                { success: false, error: { code: 400, message: '유효하지 않은 수집 출처입니다.' } },
                400
            );
        }

        const sanitizedItems: ImportCoupangProductInput[] = [];
        for (const rawItem of body.items) {
            if (!isPlainObject(rawItem)) continue;
            const productId = rawItem.productId;
            const productName = typeof rawItem.productName === 'string' ? rawItem.productName.trim() : '';
            const productUrl = typeof rawItem.productUrl === 'string' ? rawItem.productUrl.trim() : '';
            if (
                (typeof productId !== 'string' && typeof productId !== 'number') ||
                !productName ||
                !isAllowedCoupangUrl(productUrl)
            ) {
                continue;
            }
            const productImage =
                typeof rawItem.productImage === 'string' && isAllowedHttpUrl(rawItem.productImage)
                    ? rawItem.productImage.trim()
                    : '';

            sanitizedItems.push({
                productId,
                productName,
                productPrice: typeof rawItem.productPrice === 'number' ? rawItem.productPrice : Number(rawItem.productPrice) || 0,
                originalPrice: typeof rawItem.originalPrice === 'number' ? rawItem.originalPrice : undefined,
                discountRate: typeof rawItem.discountRate === 'number' ? rawItem.discountRate : undefined,
                productImage,
                productUrl,
                originalUrl:
                    typeof rawItem.originalUrl === 'string' && isAllowedCoupangUrl(rawItem.originalUrl)
                        ? rawItem.originalUrl.trim()
                        : undefined,
                coupangCategoryId:
                    typeof rawItem.coupangCategoryId === 'number' && Number.isInteger(rawItem.coupangCategoryId)
                        ? rawItem.coupangCategoryId
                        : undefined,
                coupangCategoryName:
                    typeof rawItem.coupangCategoryName === 'string' ? rawItem.coupangCategoryName.trim().slice(0, 80) : undefined,
                isRocket: Boolean(rawItem.isRocket),
                isFreeShipping: Boolean(rawItem.isFreeShipping),
                rating: typeof rawItem.rating === 'number' ? rawItem.rating : undefined,
                reviewCount: typeof rawItem.reviewCount === 'number' ? rawItem.reviewCount : undefined,
                curationPoint:
                    typeof rawItem.curationPoint === 'string' ? rawItem.curationPoint.trim().slice(0, 300) : undefined,
                badgeTag: typeof rawItem.badgeTag === 'string' ? rawItem.badgeTag.trim().slice(0, 40) : undefined,
            });
        }

        if (sanitizedItems.length === 0) {
            return c.json(
                { success: false, error: { code: 400, message: '유효한 쿠팡 상품 데이터가 없습니다.' } },
                400
            );
        }

        try {
            const result = await ShoppingAdminService.importProducts(
                sanitizedItems,
                mallCategory,
                displaySection,
                sourceType
            );
            await logActivity(
                getDB(c),
                adminUserId,
                'admin_action',
                `쿠팡 상품 ${result.importedCount}건 등록 (${mallCategory}/${displaySection})`
            );
            return c.json({ success: true, data: result });
        } catch (err) {
            console.error('[ShoppingAdminController] importProducts error:', err);
            return c.json(
                { success: false, error: { code: 500, message: '상품 DB 등록 중 오류가 발생했습니다.' } },
                500
            );
        }
    }

    static async createManualProduct(c: Context) {
        const adminUserId = String(c.get('adminUserId') || 'admin');
        const body = (await c.req.json().catch(() => null)) as unknown;
        if (!isPlainObject(body)) {
            return c.json({ success: false, error: { code: 400, message: '올바른 요청 형식이 아닙니다.' } }, 400);
        }

        const productUrl = typeof body.productUrl === 'string' ? body.productUrl.trim() : '';
        if (!isAllowedCoupangUrl(productUrl)) {
            return c.json(
                { success: false, error: { code: 400, message: '유효한 쿠팡 상품 URL을 입력해 주세요.' } },
                400
            );
        }

        const productName = typeof body.productName === 'string' ? body.productName.trim() : '';
        if (!productName) {
            return c.json({ success: false, error: { code: 400, message: '상품명을 입력해 주세요.' } }, 400);
        }

        const productPrice = Number(body.productPrice);
        if (!Number.isFinite(productPrice) || productPrice < 0) {
            return c.json({ success: false, error: { code: 400, message: '판매가는 0원 이상 숫자여야 합니다.' } }, 400);
        }

        const mallCategory = body.mallCategory as MallCategoryId;
        if (!ALLOWED_MALL_CATEGORIES.has(mallCategory)) {
            return c.json({ success: false, error: { code: 400, message: '쇼핑몰 카테고리가 올바르지 않습니다.' } }, 400);
        }

        const displaySection = body.displaySection as DisplaySectionId;
        if (!ALLOWED_DISPLAY_SECTIONS.has(displaySection)) {
            return c.json({ success: false, error: { code: 400, message: '전시 구역이 올바르지 않습니다.' } }, 400);
        }

        const productImage =
            typeof body.productImage === 'string' && body.productImage.trim()
                ? isAllowedHttpUrl(body.productImage)
                    ? body.productImage.trim()
                    : ''
                : '';

        const originalPriceRaw = body.originalPrice !== undefined && body.originalPrice !== '' ? Number(body.originalPrice) : undefined;
        const originalPrice =
            originalPriceRaw !== undefined && Number.isFinite(originalPriceRaw) && originalPriceRaw > 0
                ? originalPriceRaw
                : undefined;

        try {
            const product = await ShoppingAdminService.createManualProduct({
                productUrl,
                productName,
                productPrice,
                originalPrice,
                productImage,
                mallCategory,
                displaySection,
                isRocket: Boolean(body.isRocket),
                isFreeShipping: Boolean(body.isFreeShipping),
                curationPoint: typeof body.curationPoint === 'string' ? body.curationPoint : undefined,
                badgeTag: typeof body.badgeTag === 'string' ? body.badgeTag : undefined,
                subId: typeof body.subId === 'string' ? body.subId.trim().slice(0, 64) : undefined,
            });
            await logActivity(getDB(c), adminUserId, 'admin_action', `쿠팡 딥링크 상품 수동 등록: ${product.productName}`);
            return c.json({ success: true, data: { product } }, 201);
        } catch (err) {
            console.error('[ShoppingAdminController] createManualProduct error:', err);
            return c.json({ success: false, error: { code: 500, message: '상품 등록에 실패했습니다.' } }, 500);
        }
    }

    static async listProducts(c: Context) {
        try {
            const data = await ShoppingAdminService.listProducts({
                mallCategory: c.req.query('mallCategory') || 'all',
                displaySection: c.req.query('displaySection') || 'all',
                status: c.req.query('status') || 'all',
                keyword: c.req.query('keyword') || '',
            });
            return c.json({ success: true, data });
        } catch (err) {
            console.error('[ShoppingAdminController] listProducts error:', err);
            return c.json({ success: false, error: { code: 500, message: '상품 목록을 불러오지 못했습니다.' } }, 500);
        }
    }

    static async updateProduct(c: Context) {
        const id = parsePositiveInt(c.req.param('id'));
        if (!id) {
            return c.json({ success: false, error: { code: 400, message: '유효하지 않은 상품 ID입니다.' } }, 400);
        }

        const body = (await c.req.json().catch(() => null)) as unknown;
        if (!isPlainObject(body)) {
            return c.json({ success: false, error: { code: 400, message: '올바른 요청 형식이 아닙니다.' } }, 400);
        }

        const input: UpdateProductInput = {};
        if (typeof body.productName === 'string') input.productName = body.productName;
        if (body.productPrice !== undefined) {
            const price = Number(body.productPrice);
            if (!Number.isFinite(price) || price < 0) {
                return c.json({ success: false, error: { code: 400, message: '판매가가 유효하지 않습니다.' } }, 400);
            }
            input.productPrice = price;
        }
        if (body.originalPrice !== undefined) {
            if (body.originalPrice === null || body.originalPrice === '') {
                input.originalPrice = null;
            } else {
                const op = Number(body.originalPrice);
                if (!Number.isFinite(op) || op < 0) {
                    return c.json({ success: false, error: { code: 400, message: '정가가 유효하지 않습니다.' } }, 400);
                }
                input.originalPrice = op;
            }
        }
        if (typeof body.productImage === 'string') {
            if (body.productImage.trim() && !isAllowedHttpUrl(body.productImage)) {
                return c.json({ success: false, error: { code: 400, message: '이미지 URL이 올바르지 않습니다.' } }, 400);
            }
            input.productImage = body.productImage;
        }
        if (body.mallCategory !== undefined) {
            if (!ALLOWED_MALL_CATEGORIES.has(body.mallCategory as MallCategoryId)) {
                return c.json({ success: false, error: { code: 400, message: '쇼핑몰 카테고리가 올바르지 않습니다.' } }, 400);
            }
            input.mallCategory = body.mallCategory as MallCategoryId;
        }
        if (body.displaySection !== undefined) {
            if (!ALLOWED_DISPLAY_SECTIONS.has(body.displaySection as DisplaySectionId)) {
                return c.json({ success: false, error: { code: 400, message: '전시 구역이 올바르지 않습니다.' } }, 400);
            }
            input.displaySection = body.displaySection as DisplaySectionId;
        }
        if (typeof body.isRocket === 'boolean') input.isRocket = body.isRocket;
        if (typeof body.isFreeShipping === 'boolean') input.isFreeShipping = body.isFreeShipping;
        if (typeof body.curationPoint === 'string') input.curationPoint = body.curationPoint;
        if (typeof body.badgeTag === 'string') input.badgeTag = body.badgeTag;
        if (typeof body.isPinned === 'boolean') input.isPinned = body.isPinned;
        if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
            input.sortOrder = Number(body.sortOrder);
        }
        if (body.status === 'active' || body.status === 'hidden') {
            input.status = body.status;
        }

        try {
            const updated = await ShoppingAdminService.updateProduct(id, input);
            if (!updated) {
                return c.json({ success: false, error: { code: 404, message: '상품을 찾을 수 없습니다.' } }, 404);
            }
            const adminUserId = String(c.get('adminUserId') || 'admin');
            await logActivity(getDB(c), adminUserId, 'admin_action', `쇼핑몰 상품 수정 (ID: ${id})`);
            return c.json({ success: true, data: { product: updated } });
        } catch (err) {
            console.error('[ShoppingAdminController] updateProduct error:', err);
            return c.json({ success: false, error: { code: 500, message: '상품 수정에 실패했습니다.' } }, 500);
        }
    }

    static async toggleStatus(c: Context) {
        const id = parsePositiveInt(c.req.param('id'));
        if (!id) {
            return c.json({ success: false, error: { code: 400, message: '유효하지 않은 상품 ID입니다.' } }, 400);
        }
        const body = (await c.req.json().catch(() => null)) as unknown;
        const status = isPlainObject(body) ? body.status : undefined;
        if (status !== 'active' && status !== 'hidden') {
            return c.json({ success: false, error: { code: 400, message: '상태는 active 또는 hidden만 허용됩니다.' } }, 400);
        }

        try {
            const updated = await ShoppingAdminService.toggleProductStatus(id, status);
            if (!updated) {
                return c.json({ success: false, error: { code: 404, message: '상품을 찾을 수 없습니다.' } }, 404);
            }
            return c.json({ success: true, data: { product: updated } });
        } catch (err) {
            console.error('[ShoppingAdminController] toggleStatus error:', err);
            return c.json({ success: false, error: { code: 500, message: '상태 변경에 실패했습니다.' } }, 500);
        }
    }

    static async softDeleteProduct(c: Context) {
        const id = parsePositiveInt(c.req.param('id'));
        if (!id) {
            return c.json({ success: false, error: { code: 400, message: '유효하지 않은 상품 ID입니다.' } }, 400);
        }

        try {
            const deleted = await ShoppingAdminService.softDeleteProduct(id);
            if (!deleted) {
                return c.json({ success: false, error: { code: 404, message: '상품을 찾을 수 없습니다.' } }, 404);
            }
            const adminUserId = String(c.get('adminUserId') || 'admin');
            await logActivity(getDB(c), adminUserId, 'admin_action', `쇼핑몰 상품 숨김/삭제 (ID: ${id})`);
            return c.json({ success: true });
        } catch (err) {
            console.error('[ShoppingAdminController] softDeleteProduct error:', err);
            return c.json({ success: false, error: { code: 500, message: '상품 삭제 처리에 실패했습니다.' } }, 500);
        }
    }
}
