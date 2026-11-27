export type ShoppingSourceType = 'search' | 'best' | 'goldbox' | 'deeplink';

export type MallCategoryId =
    | 'curation'
    | 'digital'
    | 'food'
    | 'living'
    | 'fashion'
    | 'beauty'
    | 'home'
    | 'sports'
    | 'pets'
    | 'etc';

export type DisplaySectionId = 'general' | 'featured' | 'goldbox' | 'viral';

export type ProductStatus = 'active' | 'hidden' | 'deleted';

export interface CoupangOfficialCategory {
    id: number;
    name: string;
    defaultMallCategory: MallCategoryId;
}

export interface MallCategoryMeta {
    id: MallCategoryId;
    label: string;
}

export interface DisplaySectionMeta {
    id: DisplaySectionId;
    label: string;
}

export const COUPANG_OFFICIAL_CATEGORIES: CoupangOfficialCategory[] = [
    { id: 1016, name: '가전디지털', defaultMallCategory: 'digital' },
    { id: 1012, name: '식품', defaultMallCategory: 'food' },
    { id: 1013, name: '주방용품', defaultMallCategory: 'living' },
    { id: 1014, name: '생활용품', defaultMallCategory: 'living' },
    { id: 1015, name: '홈인테리어', defaultMallCategory: 'home' },
    { id: 1001, name: '여성패션', defaultMallCategory: 'fashion' },
    { id: 1002, name: '남성패션', defaultMallCategory: 'fashion' },
    { id: 1010, name: '뷰티', defaultMallCategory: 'beauty' },
    { id: 1011, name: '출산/유아동', defaultMallCategory: 'living' },
    { id: 1017, name: '스포츠/레저', defaultMallCategory: 'sports' },
    { id: 1018, name: '자동차용품', defaultMallCategory: 'living' },
    { id: 1019, name: '도서/음반/DVD', defaultMallCategory: 'etc' },
    { id: 1020, name: '완구/취미', defaultMallCategory: 'etc' },
    { id: 1021, name: '문구/오피스', defaultMallCategory: 'living' },
    { id: 1024, name: '헬스/건강식품', defaultMallCategory: 'food' },
    { id: 1025, name: '국내여행', defaultMallCategory: 'etc' },
    { id: 1026, name: '해외여행', defaultMallCategory: 'etc' },
    { id: 1029, name: '반려동물용품', defaultMallCategory: 'pets' },
    { id: 1030, name: '유아동패션', defaultMallCategory: 'fashion' },
];

export const MALL_CATEGORIES: MallCategoryMeta[] = [
    { id: 'curation', label: '✨ 신박 꿀템' },
    { id: 'digital', label: '💻 가전 · 디지털' },
    { id: 'food', label: '🥗 식품 · 건강' },
    { id: 'living', label: '🧴 생활 · 주방' },
    { id: 'fashion', label: '👕 패션 · 잡화' },
    { id: 'beauty', label: '✨ 뷰티 · 케어' },
    { id: 'home', label: '🛋️ 홈 · 인테리어' },
    { id: 'sports', label: '🏃 스포츠 · 레저' },
    { id: 'pets', label: '🐾 반려동물' },
    { id: 'etc', label: '📦 기타' },
];

export const DISPLAY_SECTIONS: DisplaySectionMeta[] = [
    { id: 'general', label: '일반 진열' },
    { id: 'featured', label: '메인 추천' },
    { id: 'goldbox', label: '오늘의 특가' },
    { id: 'viral', label: '신박 꿀템' },
];

export const ALLOWED_MALL_CATEGORIES = new Set<MallCategoryId>(MALL_CATEGORIES.map((c) => c.id));
export const ALLOWED_DISPLAY_SECTIONS = new Set<DisplaySectionId>(DISPLAY_SECTIONS.map((s) => s.id));
export const ALLOWED_SOURCE_TYPES = new Set<ShoppingSourceType>(['search', 'best', 'goldbox', 'deeplink']);

export interface CoupangSettingsSummary {
    isConfigured: boolean;
    credentialSource: 'db' | 'env' | 'none';
    maskedAccessKey: string;
    maskedSecretKey: string;
    defaultSubId: string;
    lastTestedAt: string | null;
    lastTestStatus: 'ok' | 'error' | null;
    lastTestMessage: string | null;
    updatedAt: string | null;
}

export interface SaveCoupangSettingsInput {
    accessKey?: string;
    secretKey?: string;
    defaultSubId?: string;
}

export interface CoupangSearchResultItem {
    productId: number;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    discountRate?: number;
    productImage: string;
    productUrl: string;
    categoryName?: string;
    isRocket: boolean;
    isFreeShipping: boolean;
    rating?: number;
    reviewCount?: number;
    alreadyImported: boolean;
}

export interface ImportCoupangProductInput {
    productId: string | number;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    discountRate?: number;
    productImage?: string;
    productUrl: string;
    originalUrl?: string;
    coupangCategoryId?: number;
    coupangCategoryName?: string;
    isRocket?: boolean;
    isFreeShipping?: boolean;
    rating?: number;
    reviewCount?: number;
    curationPoint?: string;
    badgeTag?: string;
}

export interface ManualProductInput {
    productUrl: string;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    productImage?: string;
    mallCategory: MallCategoryId;
    displaySection: DisplaySectionId;
    isRocket?: boolean;
    isFreeShipping?: boolean;
    curationPoint?: string;
    badgeTag?: string;
    subId?: string;
}

export interface UpdateProductInput {
    productName?: string;
    productPrice?: number;
    originalPrice?: number | null;
    discountRate?: number | null;
    productImage?: string;
    mallCategory?: MallCategoryId;
    displaySection?: DisplaySectionId;
    isRocket?: boolean;
    isFreeShipping?: boolean;
    curationPoint?: string;
    badgeTag?: string;
    isPinned?: boolean;
    sortOrder?: number;
    status?: 'active' | 'hidden';
}

export interface ShoppingProductRecord {
    id: number;
    coupangProductId: string;
    sourceType: ShoppingSourceType;
    coupangCategoryId: number | null;
    coupangCategoryName: string | null;
    mallCategory: MallCategoryId;
    displaySection: DisplaySectionId;
    productName: string;
    productPrice: number;
    originalPrice: number | null;
    discountRate: number | null;
    productImage: string;
    productUrl: string;
    originalUrl: string | null;
    isRocket: boolean;
    isFreeShipping: boolean;
    rating: number | null;
    reviewCount: number | null;
    curationPoint: string;
    badgeTag: string;
    isPinned: boolean;
    sortOrder: number;
    status: ProductStatus;
    clickCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ShoppingProductStats {
    totalCount: number;
    activeCount: number;
    hiddenCount: number;
    totalClicks: number;
}
