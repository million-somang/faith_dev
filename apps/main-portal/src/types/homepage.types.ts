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

export interface HomepageConfig {
    quickMenuItems: string[];     // 선택된 퀵메뉴 id 목록
    quickMenuOrder: string[];     // 드래그로 정렬된 순서
    preferences: HomepagePreferences;
    theme: HomepageTheme;
    isConfigured: boolean;        // 설정 완료 여부
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
    quickMenuItems: ['news', 'utility', 'game', 'finance'],
    quickMenuOrder: ['news', 'utility', 'game', 'finance', 'shopping', 'entertainment', 'education'],
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
    { id: 'shopping', label: '쇼핑', icon: 'fa-shopping-bag', href: '/shopping', color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'entertainment', label: '엔터', icon: 'fa-film', href: '/entertainment', color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'education', label: '교육', icon: 'fa-graduation-cap', href: '/education', color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
