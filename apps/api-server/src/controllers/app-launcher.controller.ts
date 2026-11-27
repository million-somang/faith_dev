import { Context } from 'hono';
import { SessionUser } from '../middleware/auth.js';
import { AppLauncherService } from '../services/app-launcher.service.js';
import {
    ALLOWED_ICON_COLORS,
    ALLOWED_ICON_TYPES,
    ALLOWED_SOURCES,
    ALLOWED_WALLPAPERS,
    LAUNCHER_SCHEMA_VERSION,
    LauncherAppItem,
    LauncherAppSource,
    LauncherFolderItem,
    LauncherGridEntry,
    LauncherIconColorId,
    LauncherIconType,
    LauncherPage,
    LauncherWallpaperId,
    MAX_APP_NAME_LENGTH,
    MAX_APPS_PER_FOLDER,
    MAX_DOCK_ITEMS,
    MAX_FOLDER_NAME_LENGTH,
    MAX_ICON_VALUE_LENGTH,
    MAX_ID_LENGTH,
    MAX_ITEMS_PER_PAGE,
    MAX_PAGES,
    MAX_URL_LENGTH,
    UserAppLauncherLayout,
} from '../types/app-launcher.types.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeLauncherUrl(rawUrl: string): boolean {
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.length > MAX_URL_LENGTH) return false;
    if (trimmed.startsWith('/')) {
        return !trimmed.startsWith('//');
    }
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function sanitizeAppItem(raw: unknown): { ok: true; app: LauncherAppItem } | { ok: false; message: string } {
    if (!isPlainObject(raw) || raw.kind !== 'app') {
        return { ok: false, message: '올바르지 않은 앱 항목 형식입니다.' };
    }

    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!id || id.length > MAX_ID_LENGTH) {
        return { ok: false, message: '앱 식별자(id)가 유효하지 않습니다.' };
    }

    const source = raw.source as LauncherAppSource;
    if (!ALLOWED_SOURCES.has(source)) {
        return { ok: false, message: '허용되지 않은 앱 출처(source)입니다.' };
    }

    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_APP_NAME_LENGTH) : '';
    if (!name) {
        return { ok: false, message: '앱 이름은 필수입니다.' };
    }

    const url = typeof raw.url === 'string' ? raw.url.trim() : '';
    if (!isSafeLauncherUrl(url)) {
        return { ok: false, message: '허용되지 않은 앱 URL 형식입니다.' };
    }

    const iconType = raw.iconType as LauncherIconType;
    if (!ALLOWED_ICON_TYPES.has(iconType)) {
        return { ok: false, message: '허용되지 않은 아이콘 유형입니다.' };
    }

    const iconValue = typeof raw.iconValue === 'string' ? raw.iconValue.trim() : '';
    if (!iconValue || iconValue.length > MAX_ICON_VALUE_LENGTH) {
        return { ok: false, message: '아이콘 값이 유효하지 않습니다.' };
    }

    const iconColor = raw.iconColor as LauncherIconColorId;
    if (!ALLOWED_ICON_COLORS.has(iconColor)) {
        return { ok: false, message: '허용되지 않은 아이콘 색상입니다.' };
    }

    const sanitized: LauncherAppItem = {
        kind: 'app',
        id,
        source,
        name,
        url,
        iconType,
        iconValue,
        iconColor,
    };

    if (typeof raw.catalogKey === 'string' && raw.catalogKey.trim()) {
        sanitized.catalogKey = raw.catalogKey.trim().slice(0, MAX_ID_LENGTH);
    }
    if (typeof raw.slug === 'string' && raw.slug.trim()) {
        sanitized.slug = raw.slug.trim().slice(0, MAX_ID_LENGTH);
    }
    if (typeof raw.miniAppId === 'number' && Number.isInteger(raw.miniAppId) && raw.miniAppId > 0) {
        sanitized.miniAppId = raw.miniAppId;
    }

    return { ok: true, app: sanitized };
}

function sanitizeFolderItem(raw: unknown): { ok: true; folder: LauncherFolderItem } | { ok: false; message: string } {
    if (!isPlainObject(raw) || raw.kind !== 'folder') {
        return { ok: false, message: '올바르지 않은 폴더 항목 형식입니다.' };
    }

    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!id || id.length > MAX_ID_LENGTH) {
        return { ok: false, message: '폴더 식별자(id)가 유효하지 않습니다.' };
    }

    const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
    const name = (rawName || '새 폴더').slice(0, MAX_FOLDER_NAME_LENGTH);

    if (!Array.isArray(raw.apps)) {
        return { ok: false, message: '폴더 앱 목록이 올바르지 않습니다.' };
    }
    if (raw.apps.length > MAX_APPS_PER_FOLDER) {
        return { ok: false, message: `폴더당 최대 ${MAX_APPS_PER_FOLDER}개까지만 담을 수 있습니다.` };
    }

    const apps: LauncherAppItem[] = [];
    for (const child of raw.apps) {
        const res = sanitizeAppItem(child);
        if (!res.ok) return res;
        apps.push(res.app);
    }

    return {
        ok: true,
        folder: {
            kind: 'folder',
            id,
            name,
            apps,
        },
    };
}

function validateAndSanitizeLayout(
    raw: unknown
): { ok: true; layout: UserAppLauncherLayout } | { ok: false; message: string } {
    if (!isPlainObject(raw)) {
        return { ok: false, message: '레이아웃 데이터가 객체 형식이 아닙니다.' };
    }

    const wallpaper = raw.wallpaper as LauncherWallpaperId;
    if (!ALLOWED_WALLPAPERS.has(wallpaper)) {
        return { ok: false, message: '지원하지 않는 배경화면 테마입니다.' };
    }

    if (!Array.isArray(raw.pages) || raw.pages.length < 1 || raw.pages.length > MAX_PAGES) {
        return { ok: false, message: `페이지는 최소 1개에서 최대 ${MAX_PAGES}개까지 지원합니다.` };
    }

    const pages: LauncherPage[] = [];
    for (let i = 0; i < raw.pages.length; i += 1) {
        const pageRaw = raw.pages[i];
        if (!isPlainObject(pageRaw) || typeof pageRaw.id !== 'string' || !pageRaw.id.trim()) {
            return { ok: false, message: `${i + 1}번째 페이지 식별자가 유효하지 않습니다.` };
        }
        if (!Array.isArray(pageRaw.items) || pageRaw.items.length > MAX_ITEMS_PER_PAGE) {
            return { ok: false, message: `페이지당 최대 ${MAX_ITEMS_PER_PAGE}개 슬롯만 배치할 수 있습니다.` };
        }

        const items: LauncherGridEntry[] = [];
        for (const entryRaw of pageRaw.items) {
            if (!isPlainObject(entryRaw)) {
                return { ok: false, message: '페이지 항목 형식이 올바르지 않습니다.' };
            }
            if (entryRaw.kind === 'folder') {
                const folderRes = sanitizeFolderItem(entryRaw);
                if (!folderRes.ok) return folderRes;
                items.push(folderRes.folder);
            } else {
                const appRes = sanitizeAppItem(entryRaw);
                if (!appRes.ok) return appRes;
                items.push(appRes.app);
            }
        }

        pages.push({
            id: pageRaw.id.trim().slice(0, MAX_ID_LENGTH),
            items,
        });
    }

    if (!Array.isArray(raw.dock) || raw.dock.length > MAX_DOCK_ITEMS) {
        return { ok: false, message: `하단 Dock에는 최대 ${MAX_DOCK_ITEMS}개 앱만 고정할 수 있습니다.` };
    }

    const dock: LauncherAppItem[] = [];
    for (const dockRaw of raw.dock) {
        const appRes = sanitizeAppItem(dockRaw);
        if (!appRes.ok) return appRes;
        dock.push(appRes.app);
    }

    return {
        ok: true,
        layout: {
            version: LAUNCHER_SCHEMA_VERSION,
            wallpaper,
            pages,
            dock,
        },
    };
}

export class AppLauncherController {
    static async getLauncherLayout(c: Context) {
        const user = c.get('user') as SessionUser | null;
        if (!user) {
            return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
        }

        try {
            const data = await AppLauncherService.getLayout(user.id);
            return c.json({ success: true, data });
        } catch (err) {
            console.error('[AppLauncherController] getLauncherLayout error:', err);
            return c.json(
                { success: false, error: { code: 500, message: '자주 쓰는 앱 설정을 불러오지 못했습니다.' } },
                500
            );
        }
    }

    static async saveLauncherLayout(c: Context) {
        const user = c.get('user') as SessionUser | null;
        if (!user) {
            return c.json({ success: false, error: { code: 401, message: 'Unauthorized' } }, 401);
        }

        try {
            const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
            if (!body || !isPlainObject(body) || !('layout' in body)) {
                return c.json(
                    { success: false, error: { code: 400, message: 'layout payload가 필요합니다.' } },
                    400
                );
            }

            const validated = validateAndSanitizeLayout(body.layout);
            if (!validated.ok) {
                return c.json(
                    { success: false, error: { code: 400, message: validated.message } },
                    400
                );
            }

            const data = await AppLauncherService.saveLayout(user.id, validated.layout);
            return c.json({ success: true, data });
        } catch (err) {
            console.error('[AppLauncherController] saveLauncherLayout error:', err);
            return c.json(
                { success: false, error: { code: 500, message: '자주 쓰는 앱 설정을 저장하지 못했습니다.' } },
                500
            );
        }
    }
}
