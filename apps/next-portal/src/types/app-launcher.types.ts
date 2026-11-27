export type LauncherAppSource = 'miniapp' | 'game' | 'portal' | 'custom';

export type LauncherWallpaperId =
    | 'nm-light'
    | 'indigo-aura'
    | 'ocean-breeze'
    | 'sunset-glow'
    | 'emerald-mist'
    | 'midnight-glass';

export type LauncherIconColorId =
    | 'indigo'
    | 'sky'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'violet'
    | 'teal'
    | 'slate';

export type LauncherIconType = 'image' | 'fa' | 'emoji';

export interface LauncherAppItem {
    kind: 'app';
    id: string;
    catalogKey?: string;
    source: LauncherAppSource;
    name: string;
    url: string;
    slug?: string;
    miniAppId?: number;
    iconType: LauncherIconType;
    iconValue: string;
    iconColor: LauncherIconColorId;
}

export interface LauncherFolderItem {
    kind: 'folder';
    id: string;
    name: string;
    apps: LauncherAppItem[];
}

export type LauncherGridEntry = LauncherAppItem | LauncherFolderItem;

export interface LauncherPage {
    id: string;
    items: LauncherGridEntry[];
}

export interface UserAppLauncherLayout {
    version: number;
    wallpaper: LauncherWallpaperId;
    pages: LauncherPage[];
    dock: LauncherAppItem[];
}

export interface LauncherCatalogItem {
    catalogKey: string;
    source: LauncherAppSource;
    name: string;
    description: string;
    categoryLabel: string;
    url: string;
    slug?: string;
    miniAppId?: number;
    iconType: LauncherIconType;
    iconValue: string;
    iconColor: LauncherIconColorId;
}

export type DragSourcePayload =
    | { area: 'page'; pageIndex: number; entryId: string }
    | { area: 'dock'; appId: string }
    | { area: 'folder'; pageIndex: number; folderId: string; appId: string };

export type LauncherEntryLocation =
    | { area: 'page'; pageIndex: number; entryId: string }
    | { area: 'dock'; appId: string }
    | { area: 'folder'; pageIndex: number; folderId: string; appId: string };

export interface WallpaperPreset {
    id: LauncherWallpaperId;
    label: string;
    subLabel: string;
    screenBgClass: string;
    statusTextClass: string;
    labelTextClass: string;
    dockBgClass: string;
    folderBgClass: string;
    dotActiveClass: string;
    dotInactiveClass: string;
    homeBarClass: string;
    previewClass: string;
    isDarkText: boolean;
}

export interface IconColorPreset {
    id: LauncherIconColorId;
    label: string;
    bgClass: string;
    swatchClass: string;
}

export const LAUNCHER_SCHEMA_VERSION = 1;
export const MAX_PAGES = 5;
export const MAX_ITEMS_PER_PAGE = 20;
export const MAX_APPS_PER_FOLDER = 16;
export const MAX_DOCK_ITEMS = 4;
export const MAX_APP_NAME_LENGTH = 20;
export const MAX_FOLDER_NAME_LENGTH = 16;

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
    {
        id: 'nm-light',
        label: '뉴모피즘 라이트',
        subLabel: 'FaithPortal 기본 테마',
        screenBgClass: 'bg-gradient-to-b from-[#f0f4f8] via-[#e8edf2] to-[#dfe7f0]',
        statusTextClass: 'text-[#1e293b]',
        labelTextClass: 'text-[#1e293b]',
        dockBgClass: 'bg-white/65 border border-white/90 shadow-[6px_6px_14px_rgba(163,177,198,0.45),-6px_-6px_14px_rgba(255,255,255,0.85)]',
        folderBgClass: 'bg-white/75 border border-white/90 shadow-[4px_4px_10px_rgba(163,177,198,0.4),-4px_-4px_10px_rgba(255,255,255,0.9)]',
        dotActiveClass: 'bg-indigo-600 w-4',
        dotInactiveClass: 'bg-slate-400/50 w-1.5',
        homeBarClass: 'bg-slate-800/35',
        previewClass: 'bg-gradient-to-br from-[#f0f4f8] to-[#dbe4ef] border-slate-300',
        isDarkText: true,
    },
    {
        id: 'indigo-aura',
        label: '인디고 오로라',
        subLabel: '프리미엄 인디고·바이올렛',
        screenBgClass: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700',
        statusTextClass: 'text-white',
        labelTextClass: 'text-white drop-shadow-sm',
        dockBgClass: 'bg-white/20 backdrop-blur-md border border-white/25 shadow-lg',
        folderBgClass: 'bg-white/25 backdrop-blur-md border border-white/30 shadow-md',
        dotActiveClass: 'bg-white w-4',
        dotInactiveClass: 'bg-white/40 w-1.5',
        homeBarClass: 'bg-white/60',
        previewClass: 'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 border-indigo-400',
        isDarkText: false,
    },
    {
        id: 'ocean-breeze',
        label: '오션 브리즈',
        subLabel: '청량한 스카이·블루',
        screenBgClass: 'bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600',
        statusTextClass: 'text-white',
        labelTextClass: 'text-white drop-shadow-sm',
        dockBgClass: 'bg-white/20 backdrop-blur-md border border-white/25 shadow-lg',
        folderBgClass: 'bg-white/25 backdrop-blur-md border border-white/30 shadow-md',
        dotActiveClass: 'bg-white w-4',
        dotInactiveClass: 'bg-white/45 w-1.5',
        homeBarClass: 'bg-white/60',
        previewClass: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 border-sky-300',
        isDarkText: false,
    },
    {
        id: 'sunset-glow',
        label: '선셋 글로우',
        subLabel: '따뜻한 코랄·선셋',
        screenBgClass: 'bg-gradient-to-b from-amber-400 via-rose-500 to-fuchsia-600',
        statusTextClass: 'text-white',
        labelTextClass: 'text-white drop-shadow-sm',
        dockBgClass: 'bg-white/20 backdrop-blur-md border border-white/25 shadow-lg',
        folderBgClass: 'bg-white/25 backdrop-blur-md border border-white/30 shadow-md',
        dotActiveClass: 'bg-white w-4',
        dotInactiveClass: 'bg-white/45 w-1.5',
        homeBarClass: 'bg-white/60',
        previewClass: 'bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 border-rose-300',
        isDarkText: false,
    },
    {
        id: 'emerald-mist',
        label: '에메랄드 포레스트',
        subLabel: '싱그러운 민트·그린',
        screenBgClass: 'bg-gradient-to-b from-teal-400 via-emerald-500 to-cyan-700',
        statusTextClass: 'text-white',
        labelTextClass: 'text-white drop-shadow-sm',
        dockBgClass: 'bg-white/20 backdrop-blur-md border border-white/25 shadow-lg',
        folderBgClass: 'bg-white/25 backdrop-blur-md border border-white/30 shadow-md',
        dotActiveClass: 'bg-white w-4',
        dotInactiveClass: 'bg-white/45 w-1.5',
        homeBarClass: 'bg-white/60',
        previewClass: 'bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-700 border-emerald-300',
        isDarkText: false,
    },
    {
        id: 'midnight-glass',
        label: '미드나잇 다크',
        subLabel: '눈이 편안한 딥 슬레이트',
        screenBgClass: 'bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950',
        statusTextClass: 'text-slate-100',
        labelTextClass: 'text-slate-100 drop-shadow-sm',
        dockBgClass: 'bg-white/10 backdrop-blur-md border border-white/15 shadow-lg',
        folderBgClass: 'bg-white/15 backdrop-blur-md border border-white/20 shadow-md',
        dotActiveClass: 'bg-indigo-400 w-4',
        dotInactiveClass: 'bg-slate-400/40 w-1.5',
        homeBarClass: 'bg-white/45',
        previewClass: 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-slate-700',
        isDarkText: false,
    },
];

export const ICON_COLOR_PRESETS: Record<LauncherIconColorId, IconColorPreset> = {
    indigo: {
        id: 'indigo',
        label: '인디고',
        bgClass: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white',
        swatchClass: 'bg-indigo-500',
    },
    sky: {
        id: 'sky',
        label: '스카이',
        bgClass: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
        swatchClass: 'bg-sky-500',
    },
    emerald: {
        id: 'emerald',
        label: '에메랄드',
        bgClass: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white',
        swatchClass: 'bg-emerald-500',
    },
    amber: {
        id: 'amber',
        label: '앰버',
        bgClass: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
        swatchClass: 'bg-amber-500',
    },
    rose: {
        id: 'rose',
        label: '로즈',
        bgClass: 'bg-gradient-to-br from-rose-400 to-pink-600 text-white',
        swatchClass: 'bg-rose-500',
    },
    violet: {
        id: 'violet',
        label: '바이올렛',
        bgClass: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white',
        swatchClass: 'bg-violet-500',
    },
    teal: {
        id: 'teal',
        label: '틸',
        bgClass: 'bg-gradient-to-br from-teal-400 to-cyan-600 text-white',
        swatchClass: 'bg-teal-500',
    },
    slate: {
        id: 'slate',
        label: '슬레이트',
        bgClass: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white',
        swatchClass: 'bg-slate-700',
    },
};

export const CUSTOM_EMOJI_PRESETS: string[] = [
    '🌐', '⭐', '🔥', '💼', '📊', '🎬',
    '🎵', '🛒', '📰', '💬', '📚', '✈️',
    '🍔', '☕', '🏋️', '🎮', '💡', '📝',
    '📅', '🏦', '🚗', '🏠', '❤️', '⚡',
];

export function getWallpaperPreset(id: LauncherWallpaperId): WallpaperPreset {
    return WALLPAPER_PRESETS.find((preset) => preset.id === id) || WALLPAPER_PRESETS[0];
}

export function createEmptyLauncherLayout(): UserAppLauncherLayout {
    return {
        version: LAUNCHER_SCHEMA_VERSION,
        wallpaper: 'nm-light',
        pages: [{ id: 'page-1', items: [] }],
        dock: [],
    };
}
