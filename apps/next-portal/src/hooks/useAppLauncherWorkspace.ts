'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import {
    createEmptyLauncherLayout,
    DragSourcePayload,
    LauncherAppItem,
    LauncherCatalogItem,
    LauncherEntryLocation,
    LauncherFolderItem,
    LauncherGridEntry,
    LauncherIconColorId,
    LauncherWallpaperId,
    MAX_APP_NAME_LENGTH,
    MAX_APPS_PER_FOLDER,
    MAX_DOCK_ITEMS,
    MAX_FOLDER_NAME_LENGTH,
    MAX_ITEMS_PER_PAGE,
    MAX_PAGES,
    UserAppLauncherLayout,
} from '@/types/app-launcher.types';
import {
    mapMiniAppsToCatalog,
    PORTAL_GAME_CATALOG,
    PORTAL_MENU_CATALOG,
    RawApiMiniApp,
} from '@/data/portalAppCatalog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface LauncherApiResponse {
    success: boolean;
    data?: {
        layout: UserAppLauncherLayout;
        updatedAt: string | null;
    };
}

interface MiniAppsApiResponse {
    success: boolean;
    apps?: RawApiMiniApp[];
}

function makeUniqueId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function cloneLayout(layout: UserAppLauncherLayout): UserAppLauncherLayout {
    return {
        version: layout.version,
        wallpaper: layout.wallpaper,
        dock: layout.dock.map((app) => ({ ...app })),
        pages: layout.pages.map((page) => ({
            id: page.id,
            items: page.items.map((entry) =>
                entry.kind === 'folder'
                    ? { ...entry, apps: entry.apps.map((child) => ({ ...child })) }
                    : { ...entry }
            ),
        })),
    };
}

function detachDraggedApp(
    draft: UserAppLauncherLayout,
    source: DragSourcePayload
): { entry: LauncherGridEntry; openedFolderCleared?: string } | null {
    if (source.area === 'dock') {
        const idx = draft.dock.findIndex((a) => a.id === source.appId);
        if (idx === -1) return null;
        const [removed] = draft.dock.splice(idx, 1);
        return { entry: removed };
    }

    if (source.area === 'page') {
        const page = draft.pages[source.pageIndex];
        if (!page) return null;
        const idx = page.items.findIndex((item) => item.id === source.entryId);
        if (idx === -1) return null;
        const [removed] = page.items.splice(idx, 1);
        return { entry: removed };
    }

    const page = draft.pages[source.pageIndex];
    if (!page) return null;
    const folderIdx = page.items.findIndex(
        (item): item is LauncherFolderItem => item.kind === 'folder' && item.id === source.folderId
    );
    if (folderIdx === -1) return null;
    const folder = page.items[folderIdx] as LauncherFolderItem;
    const appIdx = folder.apps.findIndex((a) => a.id === source.appId);
    if (appIdx === -1) return null;
    const [removed] = folder.apps.splice(appIdx, 1);
    let clearedFolderId: string | undefined;
    if (folder.apps.length === 0) {
        page.items.splice(folderIdx, 1);
        clearedFolderId = folder.id;
    }
    return { entry: removed, openedFolderCleared: clearedFolderId };
}

export function normalizeCustomUrl(rawUrl: string): string | null {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('/')) {
        if (trimmed.startsWith('//')) return null;
        return trimmed;
    }

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return parsed.toString();
    } catch {
        return null;
    }
}

export function useAppLauncherWorkspace() {
    const { user } = useAuth();
    const router = useRouter();
    const { launchApp } = useAppLauncher();

    const [layout, setLayout] = useState<UserAppLauncherLayout>(createEmptyLauncherLayout);
    const layoutRef = useRef<UserAppLauncherLayout>(layout);
    layoutRef.current = layout;

    const [activePageIndex, setActivePageIndex] = useState<number>(0);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [openFolderState, setOpenFolderState] = useState<{ pageIndex: number; folderId: string } | null>(null);

    const [miniAppCatalog, setMiniAppCatalog] = useState<LauncherCatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLoadedRef = useRef<boolean>(false);

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 2300);
    }, []);

    const persistLayoutNow = useCallback(async (nextLayout: UserAppLauncherLayout) => {
        setSaveStatus('saving');
        try {
            const client = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await client.put<LauncherApiResponse>('/api/user/app-launcher', {
                layout: nextLayout,
            });
            if (res.data?.success) {
                setSaveStatus('saved');
            } else {
                setSaveStatus('error');
            }
        } catch (err) {
            console.error('[useAppLauncherWorkspace] Failed to persist launcher layout:', err);
            setSaveStatus('error');
        }
    }, []);

    const applyNextLayout = useCallback(
        (next: UserAppLauncherLayout) => {
            if (next === layoutRef.current) return;
            layoutRef.current = next;
            setLayout(next);
            if (hasLoadedRef.current) {
                if (saveTimerRef.current) {
                    clearTimeout(saveTimerRef.current);
                }
                setSaveStatus('saving');
                saveTimerRef.current = setTimeout(() => {
                    void persistLayoutNow(next);
                }, 400);
            }
        },
        [persistLayoutNow]
    );

    const loadWorkspace = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setCatalogError(null);

        const client = axios.create({ withCredentials: true, baseURL: API_BASE_URL });

        const [launcherRes, miniAppsRes] = await Promise.allSettled([
            client.get<LauncherApiResponse>('/api/user/app-launcher'),
            client.get<MiniAppsApiResponse>('/api/mini-apps'),
        ]);

        let loadedLayout = createEmptyLauncherLayout();
        if (launcherRes.status === 'fulfilled' && launcherRes.value.data?.success && launcherRes.value.data.data) {
            const serverLayout = launcherRes.value.data.data.layout;
            if (serverLayout && Array.isArray(serverLayout.pages) && serverLayout.pages.length > 0) {
                loadedLayout = serverLayout;
            }
        }
        layoutRef.current = loadedLayout;
        setLayout(loadedLayout);

        if (
            miniAppsRes.status === 'fulfilled' &&
            miniAppsRes.value.data?.success &&
            Array.isArray(miniAppsRes.value.data.apps)
        ) {
            setMiniAppCatalog(mapMiniAppsToCatalog(miniAppsRes.value.data.apps));
        } else {
            setCatalogError('생활도구 목록을 불러오는 중 일시적인 지연이 발생했습니다.');
        }

        hasLoadedRef.current = true;
        setIsLoading(false);
    }, [user]);

    const retryCatalogFetch = useCallback(async () => {
        setCatalogError(null);
        try {
            const client = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await client.get<MiniAppsApiResponse>('/api/mini-apps');
            if (res.data?.success && Array.isArray(res.data.apps)) {
                setMiniAppCatalog(mapMiniAppsToCatalog(res.data.apps));
                return;
            }
            setCatalogError('생활도구 목록을 불러오지 못했습니다.');
        } catch {
            setCatalogError('생활도구 목록 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
    }, []);

    useEffect(() => {
        void loadWorkspace();
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [loadWorkspace]);

    // activePageIndex 범위 보정
    useEffect(() => {
        if (activePageIndex >= layout.pages.length) {
            setActivePageIndex(Math.max(0, layout.pages.length - 1));
        }
    }, [activePageIndex, layout.pages.length]);

    const allCatalogItems = useMemo<LauncherCatalogItem[]>(() => {
        return [...miniAppCatalog, ...PORTAL_MENU_CATALOG, ...PORTAL_GAME_CATALOG];
    }, [miniAppCatalog]);

    const registeredCatalogKeys = useMemo(() => {
        const set = new Set<string>();
        for (const app of layout.dock) {
            if (app.catalogKey) set.add(app.catalogKey);
        }
        for (const page of layout.pages) {
            for (const entry of page.items) {
                if (entry.kind === 'app') {
                    if (entry.catalogKey) set.add(entry.catalogKey);
                } else {
                    for (const child of entry.apps) {
                        if (child.catalogKey) set.add(child.catalogKey);
                    }
                }
            }
        }
        return set;
    }, [layout]);

    const totalItemCount = useMemo(() => {
        let count = layout.dock.length;
        for (const page of layout.pages) {
            for (const entry of page.items) {
                if (entry.kind === 'app') {
                    count += 1;
                } else {
                    count += entry.apps.length;
                }
            }
        }
        return count;
    }, [layout]);

    const openFolder = useMemo<LauncherFolderItem | null>(() => {
        if (!openFolderState) return null;
        const page = layout.pages[openFolderState.pageIndex];
        if (!page) return null;
        const found = page.items.find(
            (item): item is LauncherFolderItem => item.kind === 'folder' && item.id === openFolderState.folderId
        );
        return found || null;
    }, [layout.pages, openFolderState]);

    const addCatalogApp = useCallback(
        (catalogItem: LauncherCatalogItem) => {
            const draft = cloneLayout(layoutRef.current);
            const newApp: LauncherAppItem = {
                kind: 'app',
                id: makeUniqueId('app'),
                catalogKey: catalogItem.catalogKey,
                source: catalogItem.source,
                name: catalogItem.name.slice(0, MAX_APP_NAME_LENGTH),
                url: catalogItem.url,
                slug: catalogItem.slug,
                miniAppId: catalogItem.miniAppId,
                iconType: catalogItem.iconType,
                iconValue: catalogItem.iconValue,
                iconColor: catalogItem.iconColor,
            };

            let targetPageToFocus = -1;
            const currentPage = draft.pages[activePageIndex];
            if (currentPage && currentPage.items.length < MAX_ITEMS_PER_PAGE) {
                currentPage.items.push(newApp);
                targetPageToFocus = activePageIndex;
            } else {
                const freeIdx = draft.pages.findIndex((p) => p.items.length < MAX_ITEMS_PER_PAGE);
                if (freeIdx !== -1) {
                    draft.pages[freeIdx].items.push(newApp);
                    targetPageToFocus = freeIdx;
                } else if (draft.pages.length < MAX_PAGES) {
                    draft.pages.push({
                        id: makeUniqueId('page'),
                        items: [newApp],
                    });
                    targetPageToFocus = draft.pages.length - 1;
                }
            }

            if (targetPageToFocus !== -1) {
                applyNextLayout(draft);
                setActivePageIndex(targetPageToFocus);
                showToast(`📱 '${catalogItem.name}' 앱을 홈 화면에 추가했습니다.`);
            } else {
                showToast('홈 화면의 모든 페이지가 가득 찼습니다. 폴더로 정리해 보세요.');
            }
        },
        [activePageIndex, applyNextLayout, showToast]
    );

    const addCustomUrlApp = useCallback(
        (input: { name: string; url: string; iconValue: string; iconColor: LauncherIconColorId }): { ok: boolean; error?: string } => {
            const cleanName = input.name.trim().slice(0, MAX_APP_NAME_LENGTH);
            if (!cleanName) {
                return { ok: false, error: '앱 이름을 입력해 주세요.' };
            }
            const cleanUrl = normalizeCustomUrl(input.url);
            if (!cleanUrl) {
                return { ok: false, error: '올바른 웹 주소(https://...)를 입력해 주세요.' };
            }

            const draft = cloneLayout(layoutRef.current);
            const newApp: LauncherAppItem = {
                kind: 'app',
                id: makeUniqueId('app'),
                source: 'custom',
                name: cleanName,
                url: cleanUrl,
                iconType: 'emoji',
                iconValue: input.iconValue || '🌐',
                iconColor: input.iconColor || 'indigo',
            };

            let targetPageToFocus = -1;
            const currentPage = draft.pages[activePageIndex];
            if (currentPage && currentPage.items.length < MAX_ITEMS_PER_PAGE) {
                currentPage.items.push(newApp);
                targetPageToFocus = activePageIndex;
            } else {
                const freeIdx = draft.pages.findIndex((p) => p.items.length < MAX_ITEMS_PER_PAGE);
                if (freeIdx !== -1) {
                    draft.pages[freeIdx].items.push(newApp);
                    targetPageToFocus = freeIdx;
                } else if (draft.pages.length < MAX_PAGES) {
                    draft.pages.push({ id: makeUniqueId('page'), items: [newApp] });
                    targetPageToFocus = draft.pages.length - 1;
                }
            }

            if (targetPageToFocus === -1) {
                return { ok: false, error: '홈 화면의 모든 페이지가 가득 찼습니다.' };
            }

            applyNextLayout(draft);
            setActivePageIndex(targetPageToFocus);
            showToast(`🌐 '${cleanName}' 바로가기를 추가했습니다.`);
            return { ok: true };
        },
        [activePageIndex, applyNextLayout, showToast]
    );

    const removeEntry = useCallback(
        (location: LauncherEntryLocation) => {
            const draft = cloneLayout(layoutRef.current);
            if (location.area === 'dock') {
                draft.dock = draft.dock.filter((a) => a.id !== location.appId);
                applyNextLayout(draft);
                showToast('항목을 홈 화면에서 제거했습니다.');
                return;
            }

            const page = draft.pages[location.pageIndex];
            if (!page) return;

            if (location.area === 'page') {
                page.items = page.items.filter((entry) => entry.id !== location.entryId);
            } else {
                const folderIdx = page.items.findIndex(
                    (entry): entry is LauncherFolderItem => entry.kind === 'folder' && entry.id === location.folderId
                );
                if (folderIdx === -1) return;
                const folder = page.items[folderIdx] as LauncherFolderItem;
                folder.apps = folder.apps.filter((a) => a.id !== location.appId);
                if (folder.apps.length === 0) {
                    page.items.splice(folderIdx, 1);
                }
            }

            applyNextLayout(draft);
            if (location.area === 'page' && openFolderState?.folderId === location.entryId) {
                setOpenFolderState(null);
            }
            showToast('항목을 홈 화면에서 제거했습니다.');
        },
        [applyNextLayout, openFolderState?.folderId, showToast]
    );

    const createEmptyFolder = useCallback(
        (pageIndex: number, name = '새 폴더') => {
            const draft = cloneLayout(layoutRef.current);
            const page = draft.pages[pageIndex];
            if (!page || page.items.length >= MAX_ITEMS_PER_PAGE) {
                showToast('현재 페이지 슬롯이 가득 차서 폴더를 만들 수 없습니다.');
                return;
            }

            const newFolderId = makeUniqueId('folder');
            page.items.push({
                kind: 'folder',
                id: newFolderId,
                name: name.trim().slice(0, MAX_FOLDER_NAME_LENGTH) || '새 폴더',
                apps: [],
            });
            applyNextLayout(draft);
            setOpenFolderState({ pageIndex, folderId: newFolderId });
            showToast('📁 새 폴더를 만들었습니다. 앱을 드래그해 담아보세요.');
        },
        [applyNextLayout, showToast]
    );

    const wrapAppInNewFolder = useCallback(
        (pageIndex: number, entryId: string) => {
            const draft = cloneLayout(layoutRef.current);
            const page = draft.pages[pageIndex];
            if (!page) return;
            const idx = page.items.findIndex((item) => item.id === entryId);
            if (idx === -1) return;
            const target = page.items[idx];
            if (target.kind !== 'app') return;

            const newFolderId = makeUniqueId('folder');
            page.items[idx] = {
                kind: 'folder',
                id: newFolderId,
                name: '새 폴더',
                apps: [target],
            };
            applyNextLayout(draft);
            setOpenFolderState({ pageIndex, folderId: newFolderId });
            showToast('📁 새 폴더로 묶었습니다.');
        },
        [applyNextLayout, showToast]
    );

    const renameFolder = useCallback(
        (pageIndex: number, folderId: string, nextName: string) => {
            const cleaned = (nextName.trim() || '새 폴더').slice(0, MAX_FOLDER_NAME_LENGTH);
            const draft = cloneLayout(layoutRef.current);
            const page = draft.pages[pageIndex];
            if (!page) return;
            const folder = page.items.find(
                (item): item is LauncherFolderItem => item.kind === 'folder' && item.id === folderId
            );
            if (!folder) return;
            folder.name = cleaned;
            applyNextLayout(draft);
        },
        [applyNextLayout]
    );

    const dissolveFolder = useCallback(
        (pageIndex: number, folderId: string) => {
            const draft = cloneLayout(layoutRef.current);
            const page = draft.pages[pageIndex];
            if (!page) return;
            const folderIdx = page.items.findIndex(
                (item): item is LauncherFolderItem => item.kind === 'folder' && item.id === folderId
            );
            if (folderIdx === -1) return;

            const folder = page.items[folderIdx] as LauncherFolderItem;
            page.items.splice(folderIdx, 1);

            const remainingSlots = MAX_ITEMS_PER_PAGE - page.items.length;
            const appsToInsertHere = folder.apps.slice(0, Math.max(0, remainingSlots));
            const overflowApps = folder.apps.slice(appsToInsertHere.length);
            page.items.splice(folderIdx, 0, ...appsToInsertHere);

            let overflowCount = 0;
            for (const extraApp of overflowApps) {
                const freeIdx = draft.pages.findIndex((p) => p.items.length < MAX_ITEMS_PER_PAGE);
                if (freeIdx !== -1) {
                    draft.pages[freeIdx].items.push(extraApp);
                } else if (draft.pages.length < MAX_PAGES) {
                    draft.pages.push({ id: makeUniqueId('page'), items: [extraApp] });
                } else {
                    overflowCount += 1;
                }
            }

            applyNextLayout(draft);
            setOpenFolderState(null);
            if (overflowCount > 0) {
                showToast(`폴더를 해체했습니다. (공간 부족으로 ${overflowCount}개 앱 제외)`);
            } else {
                showToast('폴더를 해체하고 앱을 홈 화면으로 꺼냈습니다.');
            }
        },
        [applyNextLayout, showToast]
    );

    const moveAppOutOfFolder = useCallback(
        (pageIndex: number, folderId: string, appId: string) => {
            const draft = cloneLayout(layoutRef.current);
            const page = draft.pages[pageIndex];
            if (!page) return;
            const folderIdx = page.items.findIndex(
                (item): item is LauncherFolderItem => item.kind === 'folder' && item.id === folderId
            );
            if (folderIdx === -1) return;
            const folder = page.items[folderIdx] as LauncherFolderItem;
            const appIdx = folder.apps.findIndex((a) => a.id === appId);
            if (appIdx === -1) return;

            const [app] = folder.apps.splice(appIdx, 1);
            if (folder.apps.length === 0) {
                page.items.splice(folderIdx, 1);
            }

            let moved = false;
            if (page.items.length < MAX_ITEMS_PER_PAGE) {
                page.items.push(app);
                moved = true;
            } else {
                const freeIdx = draft.pages.findIndex((p) => p.items.length < MAX_ITEMS_PER_PAGE);
                if (freeIdx !== -1) {
                    draft.pages[freeIdx].items.push(app);
                    moved = true;
                } else if (draft.pages.length < MAX_PAGES) {
                    draft.pages.push({ id: makeUniqueId('page'), items: [app] });
                    moved = true;
                }
            }

            if (moved) {
                applyNextLayout(draft);
                showToast('앱을 홈 화면으로 꺼냈습니다.');
            } else {
                showToast('홈 화면 공간이 가득 차서 꺼낼 수 없습니다.');
            }
        },
        [applyNextLayout, showToast]
    );

    const moveAppIntoFolder = useCallback(
        (source: DragSourcePayload, targetPageIndex: number, targetFolderId: string) => {
            if (source.area === 'folder' && source.folderId === targetFolderId) return;
            const draft = cloneLayout(layoutRef.current);
            const targetPage = draft.pages[targetPageIndex];
            if (!targetPage) return;
            const targetFolder = targetPage.items.find(
                (item): item is LauncherFolderItem => item.kind === 'folder' && item.id === targetFolderId
            );
            if (!targetFolder) return;
            if (targetFolder.apps.length >= MAX_APPS_PER_FOLDER) {
                showToast(`폴더당 최대 ${MAX_APPS_PER_FOLDER}개까지만 담을 수 있습니다.`);
                return;
            }

            const detached = detachDraggedApp(draft, source);
            if (!detached || detached.entry.kind !== 'app') return;
            targetFolder.apps.push(detached.entry);
            applyNextLayout(draft);
            showToast('📁 앱을 폴더에 넣었습니다.');
        },
        [applyNextLayout, showToast]
    );

    const reorderOrMergeInPage = useCallback(
        (
            targetPageIndex: number,
            source: DragSourcePayload,
            targetEntryId: string,
            mode: 'reorder' | 'merge'
        ) => {
            if (source.area === 'page' && source.pageIndex === targetPageIndex && source.entryId === targetEntryId) {
                return;
            }
            if (source.area === 'folder' && source.folderId === targetEntryId) {
                return;
            }

            const draft = cloneLayout(layoutRef.current);
            const targetPage = draft.pages[targetPageIndex];
            if (!targetPage) return;

            const targetIdxBefore = targetPage.items.findIndex((item) => item.id === targetEntryId);
            if (targetIdxBefore === -1) return;

            const targetEntry = targetPage.items[targetIdxBefore];

            if (mode === 'merge') {
                if (source.area === 'page') {
                    const srcPage = draft.pages[source.pageIndex];
                    const srcItem = srcPage?.items.find((i) => i.id === source.entryId);
                    if (!srcItem || srcItem.kind !== 'app') return;
                }

                if (targetEntry.kind === 'folder') {
                    if (targetEntry.apps.length >= MAX_APPS_PER_FOLDER) {
                        showToast(`폴더당 최대 ${MAX_APPS_PER_FOLDER}개까지 담을 수 있습니다.`);
                        return;
                    }
                    const detached = detachDraggedApp(draft, source);
                    if (!detached || detached.entry.kind !== 'app') return;
                    targetEntry.apps.push(detached.entry);
                    applyNextLayout(draft);
                    showToast(`📁 '${targetEntry.name}' 폴더에 담았습니다.`);
                    return;
                }

                const detached = detachDraggedApp(draft, source);
                if (!detached || detached.entry.kind !== 'app') return;

                const refreshedTargetIdx = targetPage.items.findIndex((item) => item.id === targetEntryId);
                if (refreshedTargetIdx === -1) return;
                const refreshedTarget = targetPage.items[refreshedTargetIdx];
                if (refreshedTarget.kind !== 'app') return;

                const folderId = makeUniqueId('folder');
                targetPage.items[refreshedTargetIdx] = {
                    kind: 'folder',
                    id: folderId,
                    name: '새 폴더',
                    apps: [refreshedTarget, detached.entry],
                };
                applyNextLayout(draft);
                setOpenFolderState({ pageIndex: targetPageIndex, folderId });
                showToast('📁 새 폴더를 만들었습니다.');
                return;
            }

            const isMovingAcrossPages = source.area !== 'page' || source.pageIndex !== targetPageIndex;
            if (isMovingAcrossPages && targetPage.items.length >= MAX_ITEMS_PER_PAGE) {
                showToast('대상 페이지가 가득 찼습니다.');
                return;
            }

            const detached = detachDraggedApp(draft, source);
            if (!detached) return;

            const insertIdx = targetPage.items.findIndex((item) => item.id === targetEntryId);
            if (insertIdx === -1) {
                targetPage.items.push(detached.entry);
            } else {
                targetPage.items.splice(insertIdx, 0, detached.entry);
            }
            applyNextLayout(draft);
        },
        [applyNextLayout, showToast]
    );

    const dropAtPageEnd = useCallback(
        (targetPageIndex: number, source: DragSourcePayload) => {
            const draft = cloneLayout(layoutRef.current);
            const targetPage = draft.pages[targetPageIndex];
            if (!targetPage) return;

            const isSamePage = source.area === 'page' && source.pageIndex === targetPageIndex;
            if (!isSamePage && targetPage.items.length >= MAX_ITEMS_PER_PAGE) {
                showToast('페이지 슬롯이 가득 찼습니다.');
                return;
            }

            const detached = detachDraggedApp(draft, source);
            if (!detached) return;
            targetPage.items.push(detached.entry);
            applyNextLayout(draft);
        },
        [applyNextLayout, showToast]
    );

    const moveAppToDock = useCallback(
        (source: DragSourcePayload, targetDockIndex?: number) => {
            const draft = cloneLayout(layoutRef.current);

            if (source.area === 'page') {
                const srcItem = draft.pages[source.pageIndex]?.items.find((i) => i.id === source.entryId);
                if (!srcItem || srcItem.kind !== 'app') {
                    showToast('폴더는 Dock에 고정할 수 없습니다.');
                    return;
                }
            }

            if (source.area !== 'dock' && draft.dock.length >= MAX_DOCK_ITEMS) {
                showToast(`하단 Dock에는 최대 ${MAX_DOCK_ITEMS}개까지만 고정할 수 있습니다.`);
                return;
            }

            const detached = detachDraggedApp(draft, source);
            if (!detached || detached.entry.kind !== 'app') return;

            if (typeof targetDockIndex === 'number' && targetDockIndex >= 0 && targetDockIndex <= draft.dock.length) {
                draft.dock.splice(targetDockIndex, 0, detached.entry);
            } else {
                draft.dock.push(detached.entry);
            }
            applyNextLayout(draft);
            if (source.area !== 'dock') {
                showToast('📌 하단 Dock에 고정했습니다.');
            }
        },
        [applyNextLayout, showToast]
    );

    const moveEntryStep = useCallback(
        (pageIndex: number, entryId: string, direction: 'prev' | 'next') => {
            const draft = cloneLayout(layoutRef.current);
            const page = draft.pages[pageIndex];
            if (!page) return;
            const idx = page.items.findIndex((i) => i.id === entryId);
            if (idx === -1) return;
            const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= page.items.length) return;
            const [item] = page.items.splice(idx, 1);
            page.items.splice(targetIdx, 0, item);
            applyNextLayout(draft);
        },
        [applyNextLayout]
    );

    const moveEntryToPage = useCallback(
        (sourcePageIndex: number, entryId: string, targetPageIndex: number) => {
            if (sourcePageIndex === targetPageIndex) return;
            const draft = cloneLayout(layoutRef.current);
            const srcPage = draft.pages[sourcePageIndex];
            const dstPage = draft.pages[targetPageIndex];
            if (!srcPage || !dstPage || dstPage.items.length >= MAX_ITEMS_PER_PAGE) {
                showToast('대상 페이지가 가득 찼습니다.');
                return;
            }
            const idx = srcPage.items.findIndex((i) => i.id === entryId);
            if (idx === -1) return;
            const [item] = srcPage.items.splice(idx, 1);
            dstPage.items.push(item);
            applyNextLayout(draft);
            setActivePageIndex(targetPageIndex);
            showToast(`${targetPageIndex + 1}페이지로 이동했습니다.`);
        },
        [applyNextLayout, showToast]
    );

    const addPage = useCallback(() => {
        if (layoutRef.current.pages.length >= MAX_PAGES) {
            showToast(`최대 ${MAX_PAGES}페이지까지 만들 수 있습니다.`);
            return;
        }
        const draft = cloneLayout(layoutRef.current);
        draft.pages.push({ id: makeUniqueId('page'), items: [] });
        const nextIndex = draft.pages.length - 1;
        applyNextLayout(draft);
        setActivePageIndex(nextIndex);
        showToast(`${nextIndex + 1}페이지를 추가했습니다.`);
    }, [applyNextLayout, showToast]);

    const removeEmptyPage = useCallback(
        (pageIndex: number) => {
            if (layoutRef.current.pages.length <= 1) return;
            const target = layoutRef.current.pages[pageIndex];
            if (!target || target.items.length > 0) return;
            const draft = cloneLayout(layoutRef.current);
            draft.pages.splice(pageIndex, 1);
            applyNextLayout(draft);
            setActivePageIndex((prevIdx) => Math.max(0, Math.min(prevIdx, draft.pages.length - 1)));
        },
        [applyNextLayout]
    );

    const setWallpaper = useCallback(
        (wallpaper: LauncherWallpaperId) => {
            const draft = cloneLayout(layoutRef.current);
            draft.wallpaper = wallpaper;
            applyNextLayout(draft);
        },
        [applyNextLayout]
    );

    const openApp = useCallback(
        (app: LauncherAppItem) => {
            if (isEditMode) return;

            if (app.source === 'miniapp') {
                launchApp(app.url, app.slug || app.id);
                if (app.miniAppId) {
                    const client = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
                    client
                        .post(`/api/mini-apps/${app.miniAppId}/log`, {
                            action_type: 'LAUNCH',
                            user_id: user?.id ?? null,
                        })
                        .catch(() => {});
                }
                return;
            }

            if (app.source === 'custom') {
                window.open(app.url, '_blank', 'noopener,noreferrer');
                return;
            }

            router.push(app.url);
        },
        [isEditMode, launchApp, router, user?.id]
    );

    return {
        layout,
        activePageIndex,
        setActivePageIndex,
        isEditMode,
        setIsEditMode,
        openFolderState,
        setOpenFolderState,
        openFolder,
        allCatalogItems,
        registeredCatalogKeys,
        totalItemCount,
        isLoading,
        catalogError,
        retryCatalogFetch,
        saveStatus,
        toastMessage,
        addCatalogApp,
        addCustomUrlApp,
        removeEntry,
        createEmptyFolder,
        wrapAppInNewFolder,
        renameFolder,
        dissolveFolder,
        moveAppOutOfFolder,
        moveAppIntoFolder,
        reorderOrMergeInPage,
        dropAtPageEnd,
        moveAppToDock,
        moveEntryStep,
        moveEntryToPage,
        addPage,
        removeEmptyPage,
        setWallpaper,
        openApp,
    };
}
