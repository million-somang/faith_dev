import crypto from 'crypto';

export interface CoupangProduct {
    productId: number;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    discountRate?: number;
    productImage: string;
    productUrl: string;
    categoryName?: string;
    isRocket?: boolean;
    isFreeShipping?: boolean;
    rating?: number;
    reviewCount?: number;
    curationPoint?: string;
    isViral?: boolean;
}

export interface CoupangApiResponse<T> {
    rCode: string;
    rMessage: string;
    data: T;
}

interface CoupangRawProduct {
    productId?: number | string;
    productName?: string;
    productPrice?: number;
    originalPrice?: number;
    discountRate?: number;
    productImage?: string;
    productUrl?: string;
    categoryName?: string;
    isRocket?: boolean;
    isFreeShipping?: boolean;
    rating?: number;
    reviewCount?: number;
}

interface CoupangDeepLinkItem {
    originalUrl: string;
    shortenUrl: string;
    landingUrl: string;
}

export class CoupangPartnersClient {
    private accessKey: string;
    private secretKey: string;
    private trackingCode: string;
    private baseUrl = 'https://api-gateway.coupang.com';

    constructor(accessKey?: string, secretKey?: string, trackingCode?: string) {
        this.accessKey = accessKey || '';
        this.secretKey = secretKey || '';
        this.trackingCode = trackingCode || '';
    }

    private getAccessKey(): string {
        return (this.accessKey || process.env.COUPANG_ACCESS_KEY || '').trim();
    }

    private getSecretKey(): string {
        return (this.secretKey || process.env.COUPANG_SECRET_KEY || '').trim();
    }

    private getTrackingCode(): string {
        return (this.trackingCode || process.env.COUPANG_TRACKING_CODE || '').trim();
    }

    /**
     * 실제 유효한 쿠팡 파트너스 API 키가 설정되어 있는지 확인
     */
    public isConfigured(): boolean {
        return Boolean(this.getAccessKey() && this.getSecretKey());
    }

    /**
     * 쿠팡 파트너스 HMAC-SHA256 인증 헤더 생성
     * 공식 규격: message = signedDate + method + path + query ('?' 미포함)
     */
    private generateAuthorizationHeader(method: string, path: string, query = ''): string {
        const now = new Date();
        const year = String(now.getUTCFullYear()).slice(2);
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hour = String(now.getUTCHours()).padStart(2, '0');
        const minute = String(now.getUTCMinutes()).padStart(2, '0');
        const second = String(now.getUTCSeconds()).padStart(2, '0');

        const signedDate = `${year}${month}${day}T${hour}${minute}${second}Z`;
        const message = `${signedDate}${method.toUpperCase()}${path}${query}`;

        const signature = crypto
            .createHmac('sha256', this.getSecretKey())
            .update(message)
            .digest('hex');

        return `CEA algorithm=HmacSHA256, access-key=${this.getAccessKey()}, signed-date=${signedDate}, signature=${signature}`;
    }

    /**
     * 공통 API 요청 헬퍼
     */
    private async request<T>(
        method: 'GET' | 'POST',
        path: string,
        params: Record<string, string | number | undefined> = {},
        body?: Record<string, unknown>
    ): Promise<T> {
        if (!this.isConfigured()) {
            throw new Error('Coupang API keys are not configured.');
        }

        const queryEntries = Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);

        const queryString = queryEntries.length > 0 ? queryEntries.join('&') : '';
        const authHeader = this.generateAuthorizationHeader(method, path, queryString);

        const url = `${this.baseUrl}${path}${queryString ? `?${queryString}` : ''}`;

        const headers: Record<string, string> = {
            Authorization: authHeader,
            'Content-Type': 'application/json;charset=UTF-8',
        };

        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        if (body && method === 'POST') {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Coupang API Error (${response.status}): ${errText}`);
        }

        const json = (await response.json()) as CoupangApiResponse<T>;
        if (json.rCode !== '0' && json.rCode !== 'SUCCESS') {
            throw new Error(`Coupang Business Error [${json.rCode}]: ${json.rMessage}`);
        }

        return json.data;
    }

    private mapProduct(item: CoupangRawProduct, fallbackCategory?: string): CoupangProduct {
        const productId = Number(item.productId) || 0;
        const productPrice = typeof item.productPrice === 'number' ? item.productPrice : Number(item.productPrice) || 0;
        const originalPrice =
            typeof item.originalPrice === 'number' && item.originalPrice > 0 ? item.originalPrice : undefined;
        const discountRate =
            typeof item.discountRate === 'number' && item.discountRate > 0 ? item.discountRate : undefined;
        const categoryName =
            typeof item.categoryName === 'string' && item.categoryName.trim()
                ? item.categoryName.trim()
                : fallbackCategory;
        const rating = typeof item.rating === 'number' && item.rating > 0 ? item.rating : undefined;
        const reviewCount =
            typeof item.reviewCount === 'number' && item.reviewCount >= 0 ? item.reviewCount : undefined;

        return {
            productId,
            productName: typeof item.productName === 'string' ? item.productName : '',
            productPrice,
            originalPrice,
            discountRate,
            productImage: typeof item.productImage === 'string' ? item.productImage : '',
            productUrl: typeof item.productUrl === 'string' ? item.productUrl : '',
            categoryName,
            isRocket: Boolean(item.isRocket),
            isFreeShipping: Boolean(item.isFreeShipping),
            rating,
            reviewCount,
        };
    }

    /**
     * 키워드로 상품 검색
     * @param keyword 검색어
     * @param limit 결과 수 (최대 100, 쿠팡 공식 검색 API는 최대 10~100 지원)
     * @param subId 서브 아이디 (선택)
     */
    public async searchProducts(keyword: string, limit = 20, subId?: string): Promise<CoupangProduct[]> {
        const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
        const effectiveSubId = (subId || this.getTrackingCode()).trim();
        const params: Record<string, string | number | undefined> = {
            keyword,
            limit: Math.min(Math.max(1, limit), 100),
        };
        if (effectiveSubId) {
            params.subId = effectiveSubId;
        }

        const res = await this.request<{ productData?: CoupangRawProduct[] }>('GET', path, params);
        if (!res || !Array.isArray(res.productData)) return [];

        return res.productData.map((item) => this.mapProduct(item));
    }

    /**
     * 오늘의 골드박스 상품 조회
     */
    public async getGoldBoxProducts(subId?: string): Promise<CoupangProduct[]> {
        const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox';
        const effectiveSubId = (subId || this.getTrackingCode()).trim();
        const params: Record<string, string | number | undefined> = {};
        if (effectiveSubId) {
            params.subId = effectiveSubId;
        }

        const res = await this.request<CoupangRawProduct[]>('GET', path, params);
        if (!Array.isArray(res)) return [];

        return res.map((item) => this.mapProduct(item, '골드박스 특가'));
    }

    /**
     * 카테고리별 베스트 상품 조회
     * @param categoryId 카테고리 ID (예: 1001, 1016 등)
     */
    public async getBestCategories(categoryId: number, limit = 20, subId?: string): Promise<CoupangProduct[]> {
        const path = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/bestcategories/${categoryId}`;
        const effectiveSubId = (subId || this.getTrackingCode()).trim();
        const params: Record<string, string | number | undefined> = {
            limit: Math.min(Math.max(1, limit), 100),
        };
        if (effectiveSubId) {
            params.subId = effectiveSubId;
        }

        const res = await this.request<CoupangRawProduct[]>('GET', path, params);
        if (!Array.isArray(res)) return [];

        return res.map((item) => this.mapProduct(item));
    }

    /**
     * 딥링크 변환 (일반 쿠팡 링크 -> 파트너스 트래킹 링크)
     */
    public async createDeepLink(coupangUrls: string[], subId?: string): Promise<CoupangDeepLinkItem[]> {
        const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';
        const effectiveSubId = (subId || this.getTrackingCode()).trim();
        const body: Record<string, unknown> = {
            coupangUrls,
        };
        if (effectiveSubId) {
            body.subId = effectiveSubId;
        }

        const res = await this.request<CoupangDeepLinkItem[]>('POST', path, {}, body);
        return Array.isArray(res) ? res : [];
    }
}

export function createCoupangClient(accessKey?: string, secretKey?: string, trackingCode?: string): CoupangPartnersClient {
    return new CoupangPartnersClient(accessKey, secretKey, trackingCode);
}

export const coupangClient = new CoupangPartnersClient();
