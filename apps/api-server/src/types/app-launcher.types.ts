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

export const ALLOWED_SOURCES = new Set<LauncherAppSource>(['miniapp', 'game', 'portal', 'custom']);
export const ALLOWED_WALLPAPERS = new Set<LauncherWallpaperId>([
    'nm-light',
    'indigo-aura',
    'ocean-breeze',
    'sunset-glow',
    'emerald-mist',
    'midnight-glass',
]);
export const ALLOWED_ICON_COLORS = new Set<LauncherIconColorId>([
    'indigo',
    'sky',
    'emerald',
    'amber',
    'rose',
    'violet',
    'teal',
    'slate',
]);
export const ALLOWED_ICON_TYPES = new Set<LauncherIconType>(['image', 'fa', 'emoji']);

export const LAUNCHER_SCHEMA_VERSION = 1;
export const MAX_PAGES = 5;
export const MAX_ITEMS_PER_PAGE = 20;
export const MAX_APPS_PER_FOLDER = 16;
export const MAX_DOCK_ITEMS = 4;
export const MAX_APP_NAME_LENGTH = 20;
export const MAX_FOLDER_NAME_LENGTH = 16;
export const MAX_URL_LENGTH = 500;
export const MAX_ID_LENGTH = 80;
export const MAX_ICON_VALUE_LENGTH = 255;

export function createEmptyLauncherLayout(): UserAppLauncherLayout {
    return {
        version: LAUNCHER_SCHEMA_VERSION,
        wallpaper: 'nm-light',
        pages: [{ id: 'page-1', items: [] }],
        dock: [],
    };
}
