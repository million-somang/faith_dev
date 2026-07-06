// 홈페이지 개인화 설정 공유 타입 정의
// 프론트엔드와 백엔드에서 동일하게 사용

export type MainInterest = 'news' | 'games' | 'utility' | 'finance';
export type AgeGroup = 'young' | 'middle' | 'senior';
export type ColorScheme = 'green' | 'blue' | 'purple' | 'orange' | 'dark';
export type LayoutStyle = 'portal' | 'minimal' | 'card';
export type NewsCategory = 'politics' | 'economy' | 'sports' | 'tech' | 'entertainment' | 'society';
export type GameType = 'tetris' | 'sudoku' | '2048' | 'minesweeper';

export interface QuickMenuItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    color: string;
    bg: string;
}

export interface HomepagePreferences {
    mainInterest: MainInterest;
    newsCategories: NewsCategory[];
    showStockWidget: boolean;
    showWeatherWidget: boolean;
    showTrendWidget: boolean;
    favoriteGames: GameType[];
    ageGroup: AgeGroup;
}

export interface HomepageTheme {
    colorScheme: ColorScheme;
    layout: LayoutStyle;
    greeting: string;
}

export interface MobileTabItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    color?: string;   // 아이콘 색상 (하단 탭바에서 사용)
}

export interface HomepageConfig {
    quickMenuItems: string[];     // 선택된 퀵메뉴 id 목록
    quickMenuOrder: string[];     // 드래그로 정렬된 순서
    mobileTabs: string[];         // 모바일 하단 탭 구성/순서 (id 목록, 최대 3개 + 전체메뉴 고정)
    preferences: HomepagePreferences;
    theme: HomepageTheme;
    isConfigured: boolean;        // 설정 완료 여부
}

export const MAX_MOBILE_TABS = 5;

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
    quickMenuItems: ['news', 'utility', 'game', 'finance', 'lounge'],
    quickMenuOrder: ['news', 'utility', 'game', 'finance', 'lounge', 'shopping', 'entertainment', 'education'],
    mobileTabs: ['home', 'news', 'shopping', 'lifestyle', 'mypage'],
    preferences: {
        mainInterest: 'news',
        newsCategories: ['politics', 'economy'],
        showStockWidget: false,
        showWeatherWidget: false,
        showTrendWidget: true,
        favoriteGames: ['tetris'],
        ageGroup: 'middle',
    },
    theme: {
        colorScheme: 'blue',
        layout: 'portal',
        greeting: '',
    },
    isConfigured: false,
};

export const ALL_QUICK_MENU_ITEMS: QuickMenuItem[] = [
    { id: 'news', label: '뉴스', icon: 'fa-newspaper', href: '/news', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'utility', label: '유틸리티', icon: 'fa-tools', href: '/lifestyle', color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'game', label: '게임', icon: 'fa-gamepad', href: '/game', color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'finance', label: '금융', icon: 'fa-won-sign', href: '/finance', color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'lounge', label: '라운지', icon: 'fa-comments', href: '/lounge', color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'shopping', label: '쇼핑', icon: 'fa-shopping-bag', href: '/shopping', color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'entertainment', label: '엔터', icon: 'fa-film', href: '/entertainment', color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'education', label: '교육', icon: 'fa-graduation-cap', href: '/education', color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

// 모바일 하단 탭에 선택 가능한 후보 (전체메뉴 버튼은 항상 마지막에 고정)
export const ALL_MOBILE_TAB_ITEMS: MobileTabItem[] = [
    { id: 'home', label: '홈', icon: 'fas fa-home', path: '/', color: '#2563eb' },
    { id: 'news', label: '뉴스', icon: 'fas fa-newspaper', path: '/news', color: '#0ea5e9' },
    { id: 'shopping', label: '쇼핑', icon: 'fas fa-bag-shopping', path: '/shopping', color: '#ec4899' },
    { id: 'lifestyle', label: '도구', icon: 'fas fa-screwdriver-wrench', path: '/lifestyle', color: '#16a34a' },
    { id: 'mypage', label: '마이페이지', icon: 'fas fa-user', path: '/mypage', color: '#6366f1' },
    { id: 'finance', label: '금융', icon: 'fas fa-chart-line', path: '/finance', color: '#f97316' },
    { id: 'game', label: '게임', icon: 'fas fa-gamepad', path: '/game', color: '#a855f7' },
    { id: 'reward', label: '리워드', icon: 'fas fa-gift', path: '/reward', color: '#f59e0b' },
    { id: 'lounge', label: '라운지', icon: 'fas fa-comments', path: '/lounge', color: '#8b5cf6' },
];

// API 응답 타입
export interface HomepageConfigResponse {
    success: boolean;
    config: HomepageConfig;
}

export interface HomepageConfigSaveResponse {
    success: boolean;
    message?: string;
}
