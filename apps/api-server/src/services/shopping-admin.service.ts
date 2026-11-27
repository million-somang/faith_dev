import { pool } from '@faithportal/database';
import { createCoupangClient, type CoupangProduct } from './coupangClient.js';
import {
    ALLOWED_DISPLAY_SECTIONS,
    ALLOWED_MALL_CATEGORIES,
    ALLOWED_SOURCE_TYPES,
    type CoupangSearchResultItem,
    type CoupangSettingsSummary,
    type DisplaySectionId,
    type ImportCoupangProductInput,
    type MallCategoryId,
    type ManualProductInput,
    type ProductStatus,
    type SaveCoupangSettingsInput,
    type ShoppingProductRecord,
    type ShoppingProductStats,
    type ShoppingSourceType,
    type UpdateProductInput,
} from '../types/shopping-admin.types.js';

interface SettingsRow {
    access_key?: string | null;
    secret_key?: string | null;
    default_sub_id?: string | null;
    last_tested_at?: string | null;
    last_test_status?: string | null;
    last_test_message?: string | null;
    updated_at?: string | null;
}

interface ProductRow {
    id: number;
    coupang_product_id: string;
    source_type: string;
    coupang_category_id: number | null;
    coupang_category_name: string | null;
    mall_category: string;
    display_section: string;
    product_name: string;
    product_price: number;
    original_price: number | null;
    discount_rate: number | null;
    product_image: string | null;
    product_url: string;
    original_url: string | null;
    is_rocket: number;
    is_free_shipping: number;
    rating: number | null;
    review_count: number | null;
    curation_point: string | null;
    badge_tag: string | null;
    is_pinned: number;
    sort_order: number;
    status: string;
    click_count: number;
    created_at: string;
    updated_at: string;
}

function maskKey(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}****`;
    return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

function extractCoupangProductIdFromUrl(rawUrl: string): string {
    const match = rawUrl.match(/\/products\/(\d+)/);
    if (match && match[1]) {
        return match[1];
    }
    return `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function mapProductRow(row: ProductRow): ShoppingProductRecord {
    const mallCategory = ALLOWED_MALL_CATEGORIES.has(row.mall_category as MallCategoryId)
        ? (row.mall_category as MallCategoryId)
        : 'etc';
    const displaySection = ALLOWED_DISPLAY_SECTIONS.has(row.display_section as DisplaySectionId)
        ? (row.display_section as DisplaySectionId)
        : 'general';
    const sourceType = ALLOWED_SOURCE_TYPES.has(row.source_type as ShoppingSourceType)
        ? (row.source_type as ShoppingSourceType)
        : 'search';
    const status: ProductStatus =
        row.status === 'hidden' ? 'hidden' : row.status === 'deleted' ? 'deleted' : 'active';

    return {
        id: Number(row.id),
        coupangProductId: String(row.coupang_product_id),
        sourceType,
        coupangCategoryId: row.coupang_category_id !== null ? Number(row.coupang_category_id) : null,
        coupangCategoryName: row.coupang_category_name ?? null,
        mallCategory,
        displaySection,
        productName: String(row.product_name),
        productPrice: Number(row.product_price) || 0,
        originalPrice: row.original_price !== null ? Number(row.original_price) : null,
        discountRate: row.discount_rate !== null ? Number(row.discount_rate) : null,
        productImage: String(row.product_image || ''),
        productUrl: String(row.product_url),
        originalUrl: row.original_url ?? null,
        isRocket: Boolean(row.is_rocket),
        isFreeShipping: Boolean(row.is_free_shipping),
        rating: row.rating !== null ? Number(row.rating) : null,
        reviewCount: row.review_count !== null ? Number(row.review_count) : null,
        curationPoint: String(row.curation_point || ''),
        badgeTag: String(row.badge_tag || ''),
        isPinned: Boolean(row.is_pinned),
        sortOrder: Number(row.sort_order) || 100,
        status,
        clickCount: Number(row.click_count) || 0,
        createdAt: String(row.created_at || ''),
        updatedAt: String(row.updated_at || ''),
    };
}

export class ShoppingAdminService {
    private static initPromise: Promise<void> | null = null;

    /**
     * 모듈 최상위 기동 블로킹 없이 최초 요청 시 1회 테이블 생성
     */
    private static async ensureTables(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = (async () => {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS coupang_partner_settings (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        access_key TEXT DEFAULT '',
                        secret_key TEXT DEFAULT '',
                        default_sub_id TEXT DEFAULT 'faithportal',
                        last_tested_at TIMESTAMP,
                        last_test_status TEXT,
                        last_test_message TEXT,
                        updated_by TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                await pool.query(`
                    CREATE TABLE IF NOT EXISTS shopping_products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        coupang_product_id TEXT UNIQUE NOT NULL,
                        source_type TEXT NOT NULL DEFAULT 'search',
                        coupang_category_id INTEGER,
                        coupang_category_name TEXT,
                        mall_category TEXT NOT NULL DEFAULT 'etc',
                        display_section TEXT NOT NULL DEFAULT 'general',
                        product_name TEXT NOT NULL,
                        product_price INTEGER NOT NULL DEFAULT 0,
                        original_price INTEGER,
                        discount_rate INTEGER,
                        product_image TEXT DEFAULT '',
                        product_url TEXT NOT NULL,
                        original_url TEXT,
                        is_rocket INTEGER NOT NULL DEFAULT 0,
                        is_free_shipping INTEGER NOT NULL DEFAULT 0,
                        rating REAL,
                        review_count INTEGER,
                        curation_point TEXT DEFAULT '',
                        badge_tag TEXT DEFAULT '',
                        is_pinned INTEGER NOT NULL DEFAULT 0,
                        sort_order INTEGER NOT NULL DEFAULT 100,
                        status TEXT NOT NULL DEFAULT 'active',
                        click_count INTEGER NOT NULL DEFAULT 0,
                        is_deleted INTEGER NOT NULL DEFAULT 0,
                        deleted_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
            })().catch((err) => {
                this.initPromise = null;
                throw err;
            });
        }
        await this.initPromise;
    }

    private static async getSettingsRow(): Promise<SettingsRow | null> {
        await this.ensureTables();
        const res = await pool.query(
            `SELECT access_key, secret_key, default_sub_id, last_tested_at, last_test_status, last_test_message, updated_at
             FROM coupang_partner_settings
             WHERE id = 1`
        );
        if (res.rows.length === 0) return null;
        return res.rows[0] as SettingsRow;
    }

    private static async resolveCredentials(): Promise<{
        accessKey: string;
        secretKey: string;
        defaultSubId: string;
        source: 'db' | 'env' | 'none';
        row: SettingsRow | null;
    }> {
        const row = await this.getSettingsRow();
        const dbAccess = (row?.access_key || '').trim();
        const dbSecret = (row?.secret_key || '').trim();
        const envAccess = (process.env.COUPANG_ACCESS_KEY || '').trim();
        const envSecret = (process.env.COUPANG_SECRET_KEY || '').trim();
        const defaultSubId = (row?.default_sub_id || process.env.COUPANG_TRACKING_CODE || 'faithportal').trim();

        if (dbAccess && dbSecret) {
            return {
                accessKey: dbAccess,
                secretKey: dbSecret,
                defaultSubId,
                source: 'db',
                row,
            };
        }

        if (envAccess && envSecret) {
            return {
                accessKey: envAccess,
                secretKey: envSecret,
                defaultSubId,
                source: 'env',
                row,
            };
        }

        return {
            accessKey: '',
            secretKey: '',
            defaultSubId,
            source: 'none',
            row,
        };
    }

    static async getSettingsSummary(): Promise<CoupangSettingsSummary> {
        const creds = await this.resolveCredentials();
        const row = creds.row;
        const testStatus =
            row?.last_test_status === 'ok'
                ? 'ok'
                : row?.last_test_status === 'error'
                ? 'error'
                : null;

        return {
            isConfigured: Boolean(creds.accessKey && creds.secretKey),
            credentialSource: creds.source,
            maskedAccessKey: maskKey(creds.accessKey),
            maskedSecretKey: maskKey(creds.secretKey),
            defaultSubId: creds.defaultSubId,
            lastTestedAt: row?.last_tested_at ? String(row.last_tested_at) : null,
            lastTestStatus: testStatus,
            lastTestMessage: row?.last_test_message ? String(row.last_test_message) : null,
            updatedAt: row?.updated_at ? String(row.updated_at) : null,
        };
    }

    static async saveSettings(adminUserId: string, input: SaveCoupangSettingsInput): Promise<CoupangSettingsSummary> {
        await this.ensureTables();
        const existing = await this.getSettingsRow();

        const nextAccessKey =
            typeof input.accessKey === 'string' && input.accessKey.trim()
                ? input.accessKey.trim()
                : (existing?.access_key || '').trim();
        const nextSecretKey =
            typeof input.secretKey === 'string' && input.secretKey.trim()
                ? input.secretKey.trim()
                : (existing?.secret_key || '').trim();
        const nextSubId =
            typeof input.defaultSubId === 'string' && input.defaultSubId.trim()
                ? input.defaultSubId.trim()
                : (existing?.default_sub_id || process.env.COUPANG_TRACKING_CODE || 'faithportal').trim();

        await pool.query(
            `INSERT OR REPLACE INTO coupang_partner_settings
                (id, access_key, secret_key, default_sub_id, last_tested_at, last_test_status, last_test_message, updated_by, updated_at)
             VALUES (1, $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [
                nextAccessKey,
                nextSecretKey,
                nextSubId,
                existing?.last_tested_at ?? null,
                existing?.last_test_status ?? null,
                existing?.last_test_message ?? null,
                adminUserId,
            ]
        );

        return this.getSettingsSummary();
    }

    static async testConnection(adminUserId: string): Promise<{
        ok: boolean;
        sampleCount: number;
        message: string;
        testedAt: string;
    }> {
        const creds = await this.resolveCredentials();
        const testedAt = new Date().toISOString();

        if (!creds.accessKey || !creds.secretKey) {
            const message = '쿠팡 파트너스 Access Key / Secret Key가 설정되지 않았습니다.';
            await this.recordTestResult(adminUserId, creds, 'error', message);
            return { ok: false, sampleCount: 0, message, testedAt };
        }

        const client = createCoupangClient(creds.accessKey, creds.secretKey, creds.defaultSubId);

        try {
            let items = await client.getGoldBoxProducts(creds.defaultSubId);
            if (items.length === 0) {
                items = await client.getBestCategories(1016, 3, creds.defaultSubId);
            }
            const message = `쿠팡 파트너스 API 연결 성공 (실시간 상품 ${items.length}건 수신 확인)`;
            await this.recordTestResult(adminUserId, creds, 'ok', message);
            return { ok: true, sampleCount: items.length, message, testedAt };
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : '알 수 없는 API 오류가 발생했습니다.';
            await this.recordTestResult(adminUserId, creds, 'error', errMsg);
            return { ok: false, sampleCount: 0, message: errMsg, testedAt };
        }
    }

    private static async recordTestResult(
        adminUserId: string,
        creds: { row: SettingsRow | null; defaultSubId: string },
        status: 'ok' | 'error',
        message: string
    ): Promise<void> {
        await this.ensureTables();
        await pool.query(
            `INSERT OR REPLACE INTO coupang_partner_settings
                (id, access_key, secret_key, default_sub_id, last_tested_at, last_test_status, last_test_message, updated_by, updated_at)
             VALUES (1, $1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
                (creds.row?.access_key || '').trim(),
                (creds.row?.secret_key || '').trim(),
                creds.defaultSubId,
                status,
                message.slice(0, 500),
                adminUserId,
            ]
        );
    }

    private static async getImportedIdSet(): Promise<Set<string>> {
        await this.ensureTables();
        const res = await pool.query(
            `SELECT coupang_product_id FROM shopping_products WHERE COALESCE(is_deleted, 0) = 0`
        );
        const set = new Set<string>();
        for (const row of res.rows) {
            const id = (row as { coupang_product_id?: unknown }).coupang_product_id;
            if (id !== undefined && id !== null) {
                set.add(String(id));
            }
        }
        return set;
    }

    private static attachImportedFlags(
        items: CoupangProduct[],
        importedSet: Set<string>
    ): CoupangSearchResultItem[] {
        return items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            originalPrice: item.originalPrice,
            discountRate: item.discountRate,
            productImage: item.productImage,
            productUrl: item.productUrl,
            categoryName: item.categoryName,
            isRocket: Boolean(item.isRocket),
            isFreeShipping: Boolean(item.isFreeShipping),
            rating: item.rating,
            reviewCount: item.reviewCount,
            alreadyImported: importedSet.has(String(item.productId)),
        }));
    }

    static async fetchCoupangSearch(keyword: string, limit = 20, subId?: string): Promise<CoupangSearchResultItem[]> {
        const creds = await this.resolveCredentials();
        if (!creds.accessKey || !creds.secretKey) {
            throw new Error('쿠팡 파트너스 API 키가 등록되어 있지 않습니다.');
        }
        const client = createCoupangClient(creds.accessKey, creds.secretKey, subId || creds.defaultSubId);
        const [items, importedSet] = await Promise.all([
            client.searchProducts(keyword, limit, subId || creds.defaultSubId),
            this.getImportedIdSet(),
        ]);
        return this.attachImportedFlags(items, importedSet);
    }

    static async fetchCoupangBest(
        categoryId: number,
        limit = 20,
        subId?: string
    ): Promise<CoupangSearchResultItem[]> {
        const creds = await this.resolveCredentials();
        if (!creds.accessKey || !creds.secretKey) {
            throw new Error('쿠팡 파트너스 API 키가 등록되어 있지 않습니다.');
        }
        const client = createCoupangClient(creds.accessKey, creds.secretKey, subId || creds.defaultSubId);
        const [items, importedSet] = await Promise.all([
            client.getBestCategories(categoryId, limit, subId || creds.defaultSubId),
            this.getImportedIdSet(),
        ]);
        return this.attachImportedFlags(items, importedSet);
    }

    static async fetchCoupangGoldBox(subId?: string): Promise<CoupangSearchResultItem[]> {
        const creds = await this.resolveCredentials();
        if (!creds.accessKey || !creds.secretKey) {
            throw new Error('쿠팡 파트너스 API 키가 등록되어 있지 않습니다.');
        }
        const client = createCoupangClient(creds.accessKey, creds.secretKey, subId || creds.defaultSubId);
        const [items, importedSet] = await Promise.all([
            client.getGoldBoxProducts(subId || creds.defaultSubId),
            this.getImportedIdSet(),
        ]);
        return this.attachImportedFlags(items, importedSet);
    }

    static async convertDeepLinks(
        urls: string[],
        subId?: string
    ): Promise<Array<{ originalUrl: string; shortenUrl: string; landingUrl: string }>> {
        const creds = await this.resolveCredentials();
        if (!creds.accessKey || !creds.secretKey) {
            throw new Error('쿠팡 파트너스 API 키가 등록되어 있지 않습니다.');
        }
        const client = createCoupangClient(creds.accessKey, creds.secretKey, subId || creds.defaultSubId);
        return client.createDeepLink(urls, subId || creds.defaultSubId);
    }

    static async importProducts(
        items: ImportCoupangProductInput[],
        mallCategory: MallCategoryId,
        displaySection: DisplaySectionId,
        sourceType: ShoppingSourceType
    ): Promise<{ importedCount: number }> {
        await this.ensureTables();

        let importedCount = 0;
        for (const item of items) {
            const coupangProductId = String(item.productId).trim();
            if (!coupangProductId || !item.productName.trim() || !item.productUrl.trim()) {
                continue;
            }

            const price = Math.max(0, Math.round(Number(item.productPrice) || 0));
            const originalPrice =
                typeof item.originalPrice === 'number' && item.originalPrice > 0
                    ? Math.round(item.originalPrice)
                    : null;
            let discountRate =
                typeof item.discountRate === 'number' && item.discountRate > 0
                    ? Math.round(item.discountRate)
                    : null;
            if (discountRate === null && originalPrice && originalPrice > price) {
                discountRate = Math.round(((originalPrice - price) / originalPrice) * 100);
            }

            await pool.query(
                `INSERT INTO shopping_products (
                    coupang_product_id, source_type, coupang_category_id, coupang_category_name,
                    mall_category, display_section, product_name, product_price,
                    original_price, discount_rate, product_image, product_url, original_url,
                    is_rocket, is_free_shipping, rating, review_count,
                    curation_point, badge_tag, status, is_deleted, deleted_at, updated_at
                 )
                 VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8,
                    $9, $10, $11, $12, $13,
                    $14, $15, $16, $17,
                    $18, $19, 'active', 0, NULL, CURRENT_TIMESTAMP
                 )
                 ON CONFLICT(coupang_product_id) DO UPDATE SET
                    source_type = EXCLUDED.source_type,
                    coupang_category_id = COALESCE(EXCLUDED.coupang_category_id, shopping_products.coupang_category_id),
                    coupang_category_name = COALESCE(EXCLUDED.coupang_category_name, shopping_products.coupang_category_name),
                    mall_category = EXCLUDED.mall_category,
                    display_section = EXCLUDED.display_section,
                    product_name = EXCLUDED.product_name,
                    product_price = EXCLUDED.product_price,
                    original_price = EXCLUDED.original_price,
                    discount_rate = EXCLUDED.discount_rate,
                    product_image = EXCLUDED.product_image,
                    product_url = EXCLUDED.product_url,
                    is_rocket = EXCLUDED.is_rocket,
                    is_free_shipping = EXCLUDED.is_free_shipping,
                    rating = COALESCE(EXCLUDED.rating, shopping_products.rating),
                    review_count = COALESCE(EXCLUDED.review_count, shopping_products.review_count),
                    is_deleted = 0,
                    deleted_at = NULL,
                    status = CASE WHEN shopping_products.status = 'deleted' THEN 'active' ELSE shopping_products.status END,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    coupangProductId,
                    sourceType,
                    item.coupangCategoryId ?? null,
                    item.coupangCategoryName ?? null,
                    mallCategory,
                    displaySection,
                    item.productName.trim().slice(0, 240),
                    price,
                    originalPrice,
                    discountRate,
                    (item.productImage || '').trim().slice(0, 1000),
                    item.productUrl.trim().slice(0, 1000),
                    item.originalUrl ? item.originalUrl.trim().slice(0, 1000) : null,
                    item.isRocket ? 1 : 0,
                    item.isFreeShipping ? 1 : 0,
                    typeof item.rating === 'number' ? item.rating : null,
                    typeof item.reviewCount === 'number' ? item.reviewCount : null,
                    (item.curationPoint || '').trim().slice(0, 300),
                    (item.badgeTag || '').trim().slice(0, 40),
                ]
            );
            importedCount += 1;
        }

        return { importedCount };
    }

    static async createManualProduct(input: ManualProductInput): Promise<ShoppingProductRecord> {
        await this.ensureTables();

        const rawUrl = input.productUrl.trim();
        let trackingUrl = rawUrl;

        // 일반 쿠팡 URL(link.coupang.com이 아닌 경우)이면 파트너스 딥링크로 자동 변환 시도
        try {
            const parsed = new URL(rawUrl);
            if (parsed.hostname.toLowerCase() !== 'link.coupang.com') {
                const creds = await this.resolveCredentials();
                if (creds.accessKey && creds.secretKey) {
                    const client = createCoupangClient(
                        creds.accessKey,
                        creds.secretKey,
                        input.subId || creds.defaultSubId
                    );
                    const links = await client.createDeepLink([rawUrl], input.subId || creds.defaultSubId);
                    if (links.length > 0 && links[0].shortenUrl) {
                        trackingUrl = links[0].shortenUrl;
                    }
                }
            }
        } catch (err) {
            console.warn('[ShoppingAdminService] Auto deeplink conversion skipped:', err);
        }

        const coupangProductId = extractCoupangProductIdFromUrl(rawUrl);
        const price = Math.max(0, Math.round(input.productPrice));
        const originalPrice =
            typeof input.originalPrice === 'number' && input.originalPrice > 0
                ? Math.round(input.originalPrice)
                : null;
        const discountRate =
            originalPrice && originalPrice > price
                ? Math.round(((originalPrice - price) / originalPrice) * 100)
                : null;

        await pool.query(
            `INSERT INTO shopping_products (
                coupang_product_id, source_type, mall_category, display_section,
                product_name, product_price, original_price, discount_rate,
                product_image, product_url, original_url,
                is_rocket, is_free_shipping, curation_point, badge_tag,
                status, is_deleted, deleted_at, updated_at
             )
             VALUES ($1, 'deeplink', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', 0, NULL, CURRENT_TIMESTAMP)
             ON CONFLICT(coupang_product_id) DO UPDATE SET
                mall_category = EXCLUDED.mall_category,
                display_section = EXCLUDED.display_section,
                product_name = EXCLUDED.product_name,
                product_price = EXCLUDED.product_price,
                original_price = EXCLUDED.original_price,
                discount_rate = EXCLUDED.discount_rate,
                product_image = EXCLUDED.product_image,
                product_url = EXCLUDED.product_url,
                original_url = EXCLUDED.original_url,
                is_rocket = EXCLUDED.is_rocket,
                is_free_shipping = EXCLUDED.is_free_shipping,
                curation_point = EXCLUDED.curation_point,
                badge_tag = EXCLUDED.badge_tag,
                status = 'active',
                is_deleted = 0,
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP`,
            [
                coupangProductId,
                input.mallCategory,
                input.displaySection,
                input.productName.trim().slice(0, 240),
                price,
                originalPrice,
                discountRate,
                (input.productImage || '').trim().slice(0, 1000),
                trackingUrl.slice(0, 1000),
                rawUrl.slice(0, 1000),
                input.isRocket ? 1 : 0,
                input.isFreeShipping ? 1 : 0,
                (input.curationPoint || '').trim().slice(0, 300),
                (input.badgeTag || '').trim().slice(0, 40),
            ]
        );

        const createdRes = await pool.query(
            `SELECT * FROM shopping_products WHERE coupang_product_id = $1`,
            [coupangProductId]
        );
        return mapProductRow(createdRes.rows[0] as ProductRow);
    }

    static async listProducts(filters: {
        mallCategory?: string;
        displaySection?: string;
        status?: string;
        keyword?: string;
    }): Promise<{ products: ShoppingProductRecord[]; stats: ShoppingProductStats }> {
        await this.ensureTables();

        const conditions: string[] = ['COALESCE(is_deleted, 0) = 0'];
        const params: Array<string | number> = [];

        if (filters.mallCategory && filters.mallCategory !== 'all') {
            params.push(filters.mallCategory);
            conditions.push(`mall_category = $${params.length}`);
        }
        if (filters.displaySection && filters.displaySection !== 'all') {
            params.push(filters.displaySection);
            conditions.push(`display_section = $${params.length}`);
        }
        if (filters.status && (filters.status === 'active' || filters.status === 'hidden')) {
            params.push(filters.status);
            conditions.push(`status = $${params.length}`);
        }
        if (filters.keyword && filters.keyword.trim()) {
            params.push(`%${filters.keyword.trim().toLowerCase()}%`);
            conditions.push(
                `(LOWER(product_name) LIKE $${params.length} OR LOWER(COALESCE(curation_point, '')) LIKE $${params.length} OR LOWER(COALESCE(badge_tag, '')) LIKE $${params.length})`
            );
        }

        const listSql = `
            SELECT * FROM shopping_products
            WHERE ${conditions.join(' AND ')}
            ORDER BY is_pinned DESC, sort_order ASC, id DESC
            LIMIT 200
        `;

        const [listRes, statsRes] = await Promise.all([
            pool.query(listSql, params),
            pool.query(`
                SELECT
                    COUNT(*) AS total_count,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
                    SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) AS hidden_count,
                    COALESCE(SUM(click_count), 0) AS total_clicks
                FROM shopping_products
                WHERE COALESCE(is_deleted, 0) = 0
            `),
        ]);

        const statRow = (statsRes.rows[0] || {}) as {
            total_count?: number;
            active_count?: number;
            hidden_count?: number;
            total_clicks?: number;
        };

        return {
            products: (listRes.rows as ProductRow[]).map(mapProductRow),
            stats: {
                totalCount: Number(statRow.total_count) || 0,
                activeCount: Number(statRow.active_count) || 0,
                hiddenCount: Number(statRow.hidden_count) || 0,
                totalClicks: Number(statRow.total_clicks) || 0,
            },
        };
    }

    static async getProductById(id: number): Promise<ShoppingProductRecord | null> {
        await this.ensureTables();
        const res = await pool.query(
            `SELECT * FROM shopping_products WHERE id = $1 AND COALESCE(is_deleted, 0) = 0`,
            [id]
        );
        if (res.rows.length === 0) return null;
        return mapProductRow(res.rows[0] as ProductRow);
    }

    static async updateProduct(id: number, input: UpdateProductInput): Promise<ShoppingProductRecord | null> {
        const existing = await this.getProductById(id);
        if (!existing) return null;

        const nextName =
            typeof input.productName === 'string' && input.productName.trim()
                ? input.productName.trim().slice(0, 240)
                : existing.productName;
        const nextPrice =
            typeof input.productPrice === 'number' && Number.isFinite(input.productPrice)
                ? Math.max(0, Math.round(input.productPrice))
                : existing.productPrice;
        const nextOriginalPrice =
            input.originalPrice === null
                ? null
                : typeof input.originalPrice === 'number' && input.originalPrice > 0
                ? Math.round(input.originalPrice)
                : existing.originalPrice;
        const nextDiscountRate =
            input.discountRate === null
                ? null
                : typeof input.discountRate === 'number' && input.discountRate >= 0
                ? Math.round(input.discountRate)
                : nextOriginalPrice && nextOriginalPrice > nextPrice
                ? Math.round(((nextOriginalPrice - nextPrice) / nextOriginalPrice) * 100)
                : existing.discountRate;
        const nextImage =
            typeof input.productImage === 'string'
                ? input.productImage.trim().slice(0, 1000)
                : existing.productImage;
        const nextMallCategory = input.mallCategory ?? existing.mallCategory;
        const nextDisplaySection = input.displaySection ?? existing.displaySection;
        const nextIsRocket = typeof input.isRocket === 'boolean' ? input.isRocket : existing.isRocket;
        const nextIsFreeShipping =
            typeof input.isFreeShipping === 'boolean' ? input.isFreeShipping : existing.isFreeShipping;
        const nextCurationPoint =
            typeof input.curationPoint === 'string'
                ? input.curationPoint.trim().slice(0, 300)
                : existing.curationPoint;
        const nextBadgeTag =
            typeof input.badgeTag === 'string' ? input.badgeTag.trim().slice(0, 40) : existing.badgeTag;
        const nextIsPinned = typeof input.isPinned === 'boolean' ? input.isPinned : existing.isPinned;
        const nextSortOrder =
            typeof input.sortOrder === 'number' && Number.isFinite(input.sortOrder)
                ? Math.max(0, Math.min(99999, Math.round(input.sortOrder)))
                : existing.sortOrder;
        const nextStatus =
            input.status === 'active' || input.status === 'hidden' ? input.status : existing.status;

        await pool.query(
            `UPDATE shopping_products
             SET product_name = $1,
                 product_price = $2,
                 original_price = $3,
                 discount_rate = $4,
                 product_image = $5,
                 mall_category = $6,
                 display_section = $7,
                 is_rocket = $8,
                 is_free_shipping = $9,
                 curation_point = $10,
                 badge_tag = $11,
                 is_pinned = $12,
                 sort_order = $13,
                 status = $14,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $15 AND COALESCE(is_deleted, 0) = 0`,
            [
                nextName,
                nextPrice,
                nextOriginalPrice,
                nextDiscountRate,
                nextImage,
                nextMallCategory,
                nextDisplaySection,
                nextIsRocket ? 1 : 0,
                nextIsFreeShipping ? 1 : 0,
                nextCurationPoint,
                nextBadgeTag,
                nextIsPinned ? 1 : 0,
                nextSortOrder,
                nextStatus,
                id,
            ]
        );

        return this.getProductById(id);
    }

    static async toggleProductStatus(id: number, status: 'active' | 'hidden'): Promise<ShoppingProductRecord | null> {
        const existing = await this.getProductById(id);
        if (!existing) return null;

        await pool.query(
            `UPDATE shopping_products
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND COALESCE(is_deleted, 0) = 0`,
            [status, id]
        );
        return this.getProductById(id);
    }

    /**
     * Soft Delete 전용 (Hard Delete 절대 금지)
     */
    static async softDeleteProduct(id: number): Promise<boolean> {
        const existing = await this.getProductById(id);
        if (!existing) return false;

        await pool.query(
            `UPDATE shopping_products
             SET is_deleted = 1,
                 status = 'deleted',
                 deleted_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id]
        );
        return true;
    }
}
