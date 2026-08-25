import { coupangClient, type CoupangProduct } from './coupangClient.js';

export interface ShoppingCategory {
    id: number;
    code: string;
    name: string;
    icon: string;
    bannerColor: string;
}

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
    { id: 0, code: 'all', name: '전체 핫딜', icon: 'fas fa-fire', bannerColor: 'from-rose-500 to-red-600' },
    { id: 1010, code: 'digital', name: '가전 · 디지털', icon: 'fas fa-laptop', bannerColor: 'from-blue-600 to-indigo-600' },
    { id: 1001, code: 'food', name: '식품 · 생필품', icon: 'fas fa-utensils', bannerColor: 'from-emerald-500 to-teal-600' },
    { id: 1020, code: 'fashion', name: '패션 · 잡화', icon: 'fas fa-tshirt', bannerColor: 'from-purple-500 to-pink-600' },
    { id: 1030, code: 'beauty', name: '뷰티 · 스킨케어', icon: 'fas fa-spa', bannerColor: 'from-pink-500 to-rose-500' },
    { id: 1040, code: 'home', name: '홈 · 인테리어', icon: 'fas fa-couch', bannerColor: 'from-amber-500 to-orange-600' },
    { id: 1050, code: 'kitchen', name: '주방용품', icon: 'fas fa-blender', bannerColor: 'from-orange-500 to-amber-600' },
    { id: 1060, code: 'sports', name: '스포츠 · 레저', icon: 'fas fa-running', bannerColor: 'from-cyan-600 to-blue-700' },
    { id: 1070, code: 'pets', name: '반려동물용품', icon: 'fas fa-paw', bannerColor: 'from-yellow-500 to-amber-600' },
];

// 정밀 Mock 상품 데이터베이스 (API 키 없을 때 또는 Fallback용)
const MOCK_PRODUCTS: (CoupangProduct & { categoryId: number; tag?: string })[] = [
    // 1. 가전 · 디지털 (1010)
    {
        productId: 10101,
        productName: '삼성전자 갤럭시북4 프로 16인치 인텔 코어 울트라7 (32GB SSD 1TB) 문스톤그레이',
        productPrice: 1890000,
        originalPrice: 2290000,
        discountRate: 17,
        productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-galaxybook',
        categoryName: '가전 · 디지털',
        categoryId: 1010,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 1420,
        tag: '베스트셀러'
    },
    {
        productId: 10102,
        productName: 'Apple 2024 맥북 에어 13 M3 칩셋 (8코어 CPU / 10코어 GPU) 미드나이트 512GB',
        productPrice: 1590000,
        originalPrice: 1790000,
        discountRate: 11,
        productImage: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-macbookair',
        categoryName: '가전 · 디지털',
        categoryId: 1010,
        isRocket: true,
        isFreeShipping: true,
        rating: 5.0,
        reviewCount: 3840,
        tag: '로켓와우'
    },
    {
        productId: 10103,
        productName: '소니 WH-1000XM5 프리미엄 무선 노이즈 캔슬링 블루투스 헤드폰 블랙',
        productPrice: 398000,
        originalPrice: 479000,
        discountRate: 17,
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-sonywh1000',
        categoryName: '가전 · 디지털',
        categoryId: 1010,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.8,
        reviewCount: 2210,
        tag: '핫딜'
    },
    {
        productId: 10104,
        productName: 'LG전자 울트라기어 27인치 QHD 나노IPS 165Hz 게이밍 모니터 27GP850',
        productPrice: 429000,
        originalPrice: 519000,
        discountRate: 17,
        productImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-lgmonitor',
        categoryName: '가전 · 디지털',
        categoryId: 1010,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 890,
    },

    // 2. 식품 · 생필품 (1001)
    {
        productId: 10011,
        productName: '곰곰 무농약 신선 샐러드 채소 믹스 패밀리팩 1kg (로켓프레시)',
        productPrice: 9900,
        originalPrice: 12900,
        discountRate: 23,
        productImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-salad',
        categoryName: '식품 · 생필품',
        categoryId: 1001,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.7,
        reviewCount: 9540,
        tag: '로켓프레시'
    },
    {
        productId: 10012,
        productName: '삼다수 먹는샘물 2L x 12병 (가정배송 특가팩)',
        productPrice: 11800,
        originalPrice: 14500,
        discountRate: 18,
        productImage: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-water',
        categoryName: '식품 · 생필품',
        categoryId: 1001,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 42100,
        tag: '베스트셀러'
    },
    {
        productId: 10013,
        productName: '네스프레소 호환 스타벅스 커피 캡슐 버라이어티 팩 80개입',
        productPrice: 48900,
        originalPrice: 58000,
        discountRate: 15,
        productImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-starbucks',
        categoryName: '식품 · 생필품',
        categoryId: 1001,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.8,
        reviewCount: 5670,
    },

    // 3. 패션 · 잡화 (1020)
    {
        productId: 10201,
        productName: '나이키 에어포스 1 07 올화이트 로우 스니커즈 (정품 보증 패키지)',
        productPrice: 129000,
        originalPrice: 139000,
        discountRate: 7,
        productImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-airforce',
        categoryName: '패션 · 잡화',
        categoryId: 1020,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 7800,
        tag: '인기상품'
    },
    {
        productId: 10202,
        productName: '샘소나이트 레드 프리미엄 비즈니스 노트북 백팩 (15.6인치 수납/방수)',
        productPrice: 119000,
        originalPrice: 168000,
        discountRate: 29,
        productImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-samsonite',
        categoryName: '패션 · 잡화',
        categoryId: 1020,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.7,
        reviewCount: 1450,
    },

    // 4. 뷰티 · 스킨케어 (1030)
    {
        productId: 10301,
        productName: '설화수 자음2종 세트 (기초 스킨케어 정품 세트 + 선물용 쇼핑백)',
        productPrice: 89000,
        originalPrice: 130000,
        discountRate: 31,
        productImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-sulwhasoo',
        categoryName: '뷰티 · 스킨케어',
        categoryId: 1030,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 11200,
        tag: '선물추천'
    },
    {
        productId: 10302,
        productName: '다이슨 에어랩 멀티 스타일러 앤 드라이어 컴플리트 롱 (니켈/코퍼)',
        productPrice: 659000,
        originalPrice: 749000,
        discountRate: 12,
        productImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-dysonairwrap',
        categoryName: '뷰티 · 스킨케어',
        categoryId: 1030,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 6890,
        tag: '프리미엄'
    },

    // 5. 홈 · 인테리어 (1040)
    {
        productId: 10401,
        productName: '시디즈 T50 에어 메쉬 프리미엄 사무용 메쉬 의자 (요추 지지대 장착)',
        productPrice: 349000,
        originalPrice: 420000,
        discountRate: 16,
        productImage: 'https://images.unsplash.com/photo-1580481077197-2a40733a1e2f?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-sidiz',
        categoryName: '홈 · 인테리어',
        categoryId: 1040,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.8,
        reviewCount: 4200,
    },
    {
        productId: 10402,
        productName: '필립스 휴 스마트 조명 LED 스트립 4세대 베이스팩 (2M 블루투스 연동)',
        productPrice: 89000,
        originalPrice: 119000,
        discountRate: 25,
        productImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-philipshue',
        categoryName: '홈 · 인테리어',
        categoryId: 1040,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.7,
        reviewCount: 980,
    },

    // 6. 주방용품 (1050)
    {
        productId: 10501,
        productName: '닌자 블렌더 듀오 자동 스무디 믹서기 푸드 프로세서 풀세트',
        productPrice: 179000,
        originalPrice: 239000,
        discountRate: 25,
        productImage: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-ninja',
        categoryName: '주방용품',
        categoryId: 1050,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.8,
        reviewCount: 2300,
        tag: '골드박스'
    },
    {
        productId: 10502,
        productName: '테팔 인덕션 프라이팬 28cm + 궁중팬 28cm 2종 세트 (티타늄 6X 코팅)',
        productPrice: 62900,
        originalPrice: 89000,
        discountRate: 29,
        productImage: 'https://images.unsplash.com/photo-1584990347449-397a6104c861?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-tefal',
        categoryName: '주방용품',
        categoryId: 1050,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 5400,
    },

    // 7. 스포츠 · 레저 (1060)
    {
        productId: 10601,
        productName: '가민 포러너 265 GPS 프리미엄 스마트 러닝워치 블랙 (AMOLED 디스플레이)',
        productPrice: 589000,
        originalPrice: 649000,
        discountRate: 9,
        productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-garmin',
        categoryName: '스포츠 · 레저',
        categoryId: 1060,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 1200,
    },

    // 8. 반려동물용품 (1070)
    {
        productId: 10701,
        productName: '로얄캐닌 인도어 성묘용 건식 사료 10kg (체중 조절 및 헤어볼 케어)',
        productPrice: 84900,
        originalPrice: 105000,
        discountRate: 19,
        productImage: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
        productUrl: 'https://link.coupang.com/a/sample-royalcanin',
        categoryName: '반려동물용품',
        categoryId: 1070,
        isRocket: true,
        isFreeShipping: true,
        rating: 4.9,
        reviewCount: 16500,
        tag: '대용량특가'
    }
];

// 메모리 캐시 (15분 유지)
interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        memoryCache.delete(key);
        return null;
    }
    return item.data;
}

function setToCache<T>(key: string, data: T, ttlMinutes = 15): void {
    memoryCache.set(key, {
        data,
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    });
}

export class ShoppingService {
    /**
     * 카테고리 목록 조회
     */
    public getCategories(): ShoppingCategory[] {
        return SHOPPING_CATEGORIES;
    }

    /**
     * 오늘의 골드박스 타임세일 상품 조회
     */
    public async getGoldBoxProducts(): Promise<CoupangProduct[]> {
        const cacheKey = 'goldbox_products';
        const cached = getFromCache<CoupangProduct[]>(cacheKey);
        if (cached) return cached;

        // 실제 API 키가 있으면 호출
        if (coupangClient.isConfigured()) {
            try {
                const liveData = await coupangClient.getGoldBoxProducts();
                if (liveData && liveData.length > 0) {
                    setToCache(cacheKey, liveData, 30);
                    return liveData;
                }
            } catch (err) {
                console.warn('[ShoppingService] Coupang GoldBox API Error, fallback to mock:', err);
            }
        }

        // Mock 데이터 중 할인율 높은 상품 4종 추출
        const mockGold = MOCK_PRODUCTS.filter(p => (p.discountRate || 0) >= 20).slice(0, 4);
        setToCache(cacheKey, mockGold, 15);
        return mockGold;
    }

    /**
     * 상품 목록 검색 및 필터링
     */
    public async getProducts(options: {
        keyword?: string;
        category?: string | number;
        sort?: 'ranking' | 'discount' | 'price_asc' | 'price_desc' | 'rating';
        page?: number;
        limit?: number;
    }): Promise<{ products: CoupangProduct[]; total: number; page: number; limit: number }> {
        const { keyword = '', category = 'all', sort = 'ranking', page = 1, limit = 20 } = options;

        const cacheKey = `products_${keyword}_${category}_${sort}_${page}_${limit}`;
        const cached = getFromCache<{ products: CoupangProduct[]; total: number; page: number; limit: number }>(cacheKey);
        if (cached) return cached;

        // 실제 API 키가 설정되어 있고 특정 키워드 검색 시
        if (coupangClient.isConfigured() && keyword) {
            try {
                const liveProducts = await coupangClient.searchProducts(keyword, limit);
                if (liveProducts && liveProducts.length > 0) {
                    const result = {
                        products: liveProducts,
                        total: liveProducts.length,
                        page,
                        limit,
                    };
                    setToCache(cacheKey, result, 10);
                    return result;
                }
            } catch (err) {
                console.warn('[ShoppingService] Coupang Search API Error, fallback to mock:', err);
            }
        }

        // Mock 데이터 필터링 엔진
        let list = [...MOCK_PRODUCTS];

        // 1. 카테고리 필터링
        if (category && category !== 'all' && category !== '0') {
            const catId = Number(category);
            list = list.filter(p => p.categoryId === catId);
        }

        // 2. 키워드 필터링
        if (keyword.trim()) {
            const q = keyword.trim().toLowerCase();
            list = list.filter(p => 
                p.productName.toLowerCase().includes(q) || 
                (p.categoryName && p.categoryName.toLowerCase().includes(q))
            );
        }

        // 3. 정렬
        if (sort === 'discount') {
            list.sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0));
        } else if (sort === 'price_asc') {
            list.sort((a, b) => a.productPrice - b.productPrice);
        } else if (sort === 'price_desc') {
            list.sort((a, b) => b.productPrice - a.productPrice);
        } else if (sort === 'rating') {
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
        } else {
            // ranking (기본 추천순)
            list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        }

        // 4. 페이지네이션
        const total = list.length;
        const startIndex = (page - 1) * limit;
        const pagedProducts = list.slice(startIndex, startIndex + limit);

        const result = {
            products: pagedProducts,
            total,
            page,
            limit,
        };

        setToCache(cacheKey, result, 10);
        return result;
    }

    /**
     * 카테고리별 베스트 랭킹 상품
     */
    public async getBestProducts(categoryId: number, limit = 8): Promise<CoupangProduct[]> {
        const cacheKey = `best_${categoryId}_${limit}`;
        const cached = getFromCache<CoupangProduct[]>(cacheKey);
        if (cached) return cached;

        if (coupangClient.isConfigured()) {
            try {
                const liveData = await coupangClient.getBestCategories(categoryId, limit);
                if (liveData && liveData.length > 0) {
                    setToCache(cacheKey, liveData, 30);
                    return liveData;
                }
            } catch (err) {
                console.warn('[ShoppingService] Coupang Best API Error, fallback to mock:', err);
            }
        }

        const filtered = categoryId === 0 
            ? MOCK_PRODUCTS 
            : MOCK_PRODUCTS.filter(p => p.categoryId === categoryId);
        
        const sorted = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit);
        setToCache(cacheKey, sorted, 15);
        return sorted;
    }
}

export const shoppingService = new ShoppingService();
