export interface CountryInfo {
    code: string;
    name: string;
    flag: string;
    defaultCurrency: string;
    limitUSD: number; // 목록통관 기본 한도 (미국 $200, 기타 $150)
    note: string;
}

export interface CustomsCategory {
    id: string;
    name: string;
    icon: string;
    customsRate: number; // 관세율 (%)
    vatRate: number;     // 부가세율 (기본 10%)
    isGeneralClearance: boolean; // 일반통관 여부 (true면 국가 불문 $150 한도 강제)
    description: string;
    warningNote?: string;
}

export const COUNTRIES: CountryInfo[] = [
    { code: 'US', name: '미국', flag: '🇺🇸', defaultCurrency: 'USD', limitUSD: 200, note: '한미 FTA 기반 목록통관 $200 이하 면세' },
    { code: 'JP', name: '일본', flag: '🇯🇵', defaultCurrency: 'JPY', limitUSD: 150, note: '일반국가 기준 $150 이하 면세' },
    { code: 'CN', name: '중국/알리', flag: '🇨🇳', defaultCurrency: 'USD', limitUSD: 150, note: '일반국가 기준 $150 이하 면세' },
    { code: 'EU', name: '유럽', flag: '🇪🇺', defaultCurrency: 'EUR', limitUSD: 150, note: '원산지 증명 시 관세 감면 가능' },
    { code: 'GB', name: '영국', flag: '🇬🇧', defaultCurrency: 'GBP', limitUSD: 150, note: '일반국가 기준 $150 이하 면세' },
];

export const CATEGORIES: CustomsCategory[] = [
    {
        id: 'electronics',
        name: '전자기기 · 스마트폰 · 태블릿',
        icon: 'fas fa-laptop',
        customsRate: 0,
        vatRate: 10,
        isGeneralClearance: false,
        description: 'ITA(정보기술협정) 품목으로 관세 0% 영세율 적용. 부가세 10%만 부과',
        warningNote: '전파법상 개인 자가사용 1인당 1대만 반입 가능',
    },
    {
        id: 'clothing',
        name: '일반 의류 · 니트 · 바지',
        icon: 'fas fa-tshirt',
        customsRate: 13,
        vatRate: 10,
        isGeneralClearance: false,
        description: '기본 목록통관 대상. 관세 13% + 부가세 10%',
    },
    {
        id: 'shoes',
        name: '신발 · 스니커즈 · 부츠',
        icon: 'fas fa-shoe-prints',
        customsRate: 13,
        vatRate: 10,
        isGeneralClearance: false,
        description: '가죽 함량에 따라 8~13% 적용 (기본 13% 계산)',
    },
    {
        id: 'bags_leather',
        name: '가죽 가방 · 지갑',
        icon: 'fas fa-briefcase',
        customsRate: 8,
        vatRate: 10,
        isGeneralClearance: false,
        description: '가죽 핸드백 및 지갑 관세 8% + 부가세 10%',
        warningNote: '과세가격 200만원 초과 시 개별소비세(20%) 추가 부과 대상',
    },
    {
        id: 'supplements',
        name: '영양제 · 비타민 · 건강기능식품',
        icon: 'fas fa-capsules',
        customsRate: 8,
        vatRate: 10,
        isGeneralClearance: true, // 무조건 일반통관!
        description: '목록통관 배제 품목! 미국 구매도 $150 초과 시 과세',
        warningNote: '자가사용 기준 최대 6병까지만 통관 가능 (초과 시 전량 폐기)',
    },
    {
        id: 'cosmetics',
        name: '일반 화장품 · 스킨케어',
        icon: 'fas fa-pump-soap',
        customsRate: 6.5,
        vatRate: 10,
        isGeneralClearance: false,
        description: '기본 스킨케어/로션 목록통관 가능. 관세 6.5% + 부가세 10%',
        warningNote: '기능성(주름·미백개선) 또는 향수(60ml 초과)는 일반통관 $150 적용',
    },
    {
        id: 'perfume',
        name: '향수 (오드퍼퓸 / 오드뚜왈렛)',
        icon: 'fas fa-spray-can',
        customsRate: 6.5,
        vatRate: 10,
        isGeneralClearance: true,
        description: '60ml 이하만 면세 한도 적용. 60ml 초과 시 일반통관 과세',
        warningNote: '개별소비세 및 교육세 추가 합산 가능',
    },
    {
        id: 'watch',
        name: '손목시계 · 패션 워치',
        icon: 'fas fa-clock',
        customsRate: 8,
        vatRate: 10,
        isGeneralClearance: false,
        description: '일반 손목시계 관세 8% + 부가세 10%',
        warningNote: '과세가격 200만원 초과 시 개별소비세(20%) 부과',
    },
    {
        id: 'food',
        name: '식품 · 커피원두 · 과자',
        icon: 'fas fa-mug-hot',
        customsRate: 8,
        vatRate: 10,
        isGeneralClearance: true,
        description: '식품위생 관련 목록통관 배제! 미국 포함 $150 초과 시 과세',
        warningNote: '가공육류(육포 등) 및 검역 대상 성분 반입 금지',
    },
    {
        id: 'toys',
        name: '완구 · 피규어 · 게임기',
        icon: 'fas fa-gamepad',
        customsRate: 8,
        vatRate: 10,
        isGeneralClearance: false,
        description: '피규어 및 플라스틱 완구 관세 8% + 부가세 10%',
    },
    {
        id: 'sports',
        name: '골프채 · 스포츠 · 캠핑용품',
        icon: 'fas fa-golf-ball-tee',
        customsRate: 8,
        vatRate: 10,
        isGeneralClearance: false,
        description: '골프용품 및 아웃도어 장비 관세 8% + 부가세 10%',
    },
];
