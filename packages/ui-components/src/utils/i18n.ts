// Internationalization (i18n) Utility Module for FaithPortal Monorepo

export type SupportedLang = 'ko' | 'en';

export const getLang = (): SupportedLang => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_lang');
        if (saved === 'ko' || saved === 'en') return saved;
        
        // Auto-detect browser language: Default to 'en' for non-Korean users
        const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
        return browserLang.startsWith('ko') ? 'ko' : 'en';
    }
    return 'ko';
};

export const setLang = (lang: SupportedLang): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_lang', lang);
        window.location.reload();
    }
};

export const translations: Record<SupportedLang, Record<string, string>> = {
    ko: {
        // Navigation & General
        '홈': '홈',
        '뉴스': '뉴스',
        '생활도구': '생활도구',
        '유틸리티': '유틸리티',
        '금융': '금융',
        '주식': '주식',
        '게임': '게임',
        '재미': '재미',
        '쇼핑': '쇼핑',
        '리워드': '리워드',
        '라운지': '라운지',
        '마이페이지': '마이페이지',
        '로그인': '로그인',
        '로그아웃': '로그아웃',
        '회원가입': '회원가입',
        '홈페이지 제작': '홈페이지 제작',
        '전체메뉴': '전체메뉴',
        '일반 포털': '🔮 일반 포털',
        '비즈니스': '💼 비즈니스',
        '포털': '포털',
        '비즈': '비즈',

        // Header & Main Portal
        '나만의 스마트 통합 포털': '나만의 스마트 통합 포털',
        '실시간 뉴스, 주식, 게임 및 유틸리티 대시보드': '실시간 연동된 뉴스, 주식, 게임 및 생활도구 대시보드입니다.',
        '나만의 홈페이지': '나만의 홈페이지',
        '나의 홈': '나의 홈',
        '홈꾸미기': '홈꾸미기',
        '일정 관리': '일정 관리',
        '하루 종일': '하루 종일',
        '추가': '추가',
        '삭제': '삭제',
        '저장': '저장',
        '취소': '취소',

        // Services
        '금융 / 주식 서비스': '금융 / 주식 서비스',
        '게임 센터': '게임 센터',
        '유틸리티 모음': '유틸리티 모음',
        '사주 / 운세': '사주 / 운세',
        '바로가기': '바로가기',
        '자세히 보기': '자세히 보기',
        '플레이하기': '플레이하기',
        '뉴스 메인 서비스로 이동': '뉴스 메인 서비스로 이동',
        '금융 서비스 메인으로 이동': '금융 서비스 메인으로 이동',
        '게임 센터 메인으로 이동': '게임 센터 메인으로 이동',
        '유틸리티 메인으로 이동': '유틸리티 메인으로 이동',
    },
    en: {
        // Navigation & General
        '홈': 'Home',
        '뉴스': 'News',
        '생활도구': 'Tools',
        '유틸리티': 'Utilities',
        '금융': 'Finance',
        '주식': 'Stocks',
        '게임': 'Games',
        '재미': 'Fun',
        '쇼핑': 'Shopping',
        '리워드': 'Rewards',
        '라운지': 'Lounge',
        '마이페이지': 'My Page',
        '로그인': 'Log In',
        '로그아웃': 'Log Out',
        '회원가입': 'Sign Up',
        '홈페이지 제작': 'Web Design',
        '전체메뉴': 'All Menu',
        '일반 포털': '🔮 General',
        '비즈니스': '💼 Business',
        '포털': 'Portal',
        '비즈': 'Biz',

        // Header & Main Portal
        '나만의 스마트 통합 포털': 'My Smart Personal Portal',
        '실시간 뉴스, 주식, 게임 및 유틸리티 대시보드': 'Real-time dashboard for news, stocks, games, and tools.',
        '나만의 홈페이지': 'My Personal Homepage',
        '나의 홈': 'My Home',
        '홈꾸미기': 'Customize',
        '일정 관리': 'Schedules',
        '하루 종일': 'All Day',
        '추가': 'Add',
        '삭제': 'Delete',
        '저장': 'Save',
        '취소': 'Cancel',

        // Services
        '금융 / 주식 서비스': 'Finance & Stocks',
        '게임 센터': 'Game Center',
        '유틸리티 모음': 'Tools & Utilities',
        '사주 / 운세': 'Fortune & Astrology',
        '바로가기': 'Go',
        '자세히 보기': 'View Details',
        '플레이하기': 'Play Now',
        '뉴스 메인 서비스로 이동': 'Go to News Portal',
        '금융 서비스 메인으로 이동': 'Go to Finance Portal',
        '게임 센터 메인으로 이동': 'Go to Game Center',
        '유틸리티 메인으로 이동': 'Go to Utilities',
    }
};

export const t = (key: string, overrideLang?: SupportedLang): string => {
    const lang = overrideLang || getLang();
    return translations[lang]?.[key] || translations['ko']?.[key] || key;
};
