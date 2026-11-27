'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    DragSourcePayload,
    getWallpaperPreset,
    LauncherAppItem,
    LauncherEntryLocation,
    LauncherFolderItem,
    LauncherGridEntry,
    MAX_DOCK_ITEMS,
    MAX_PAGES,
    UserAppLauncherLayout,
} from '@/types/app-launcher.types';
import { LauncherAppIconGraphic, PhoneFolderModal } from './PhoneFolderModal';

interface PhoneHomeScreenProps {
    layout: UserAppLauncherLayout;
    activePageIndex: number;
    setActivePageIndex: (idx: number) => void;
    isEditMode: boolean;
    setIsEditMode: (next: boolean) => void;
    openFolder: LauncherFolderItem | null;
    openFolderState: { pageIndex: number; folderId: string } | null;
    setOpenFolderState: (state: { pageIndex: number; folderId: string } | null) => void;
    totalItemCount: number;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    onOpenApp: (app: LauncherAppItem) => void;
    onCreateEmptyFolder: (pageIndex: number) => void;
    onRenameFolder: (pageIndex: number, folderId: string, nextName: string) => void;
    onDissolveFolder: (pageIndex: number, folderId: string) => void;
    onMoveAppOutOfFolder: (pageIndex: number, folderId: string, appId: string) => void;
    onMoveAppIntoFolder: (source: DragSourcePayload, targetPageIndex: number, targetFolderId: string) => void;
    onWrapAppInNewFolder: (pageIndex: number, entryId: string) => void;
    onReorderOrMergeInPage: (
        targetPageIndex: number,
        source: DragSourcePayload,
        targetEntryId: string,
        mode: 'reorder' | 'merge'
    ) => void;
    onDropAtPageEnd: (targetPageIndex: number, source: DragSourcePayload) => void;
    onMoveAppToDock: (source: DragSourcePayload, targetDockIndex?: number) => void;
    onRemoveEntry: (location: LauncherEntryLocation) => void;
    onMoveEntryStep: (pageIndex: number, entryId: string, direction: 'prev' | 'next') => void;
    onMoveEntryToPage: (sourcePageIndex: number, entryId: string, targetPageIndex: number) => void;
    onAddPage: () => void;
    onRemoveEmptyPage: (pageIndex: number) => void;
    onOpenMobileCatalog: (tab: 'catalog' | 'custom' | 'wallpaper') => void;
}

interface DropPreview {
    targetId: string;
    mode: 'reorder' | 'merge';
    isFolderTarget: boolean;
}

type SelectedActionTarget =
    | { area: 'page'; pageIndex: number; entry: LauncherGridEntry }
    | { area: 'dock'; app: LauncherAppItem };

function parseDragPayload(raw: string): DragSourcePayload | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as DragSourcePayload;
        if (parsed && typeof parsed === 'object' && 'area' in parsed) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

export const PhoneHomeScreen: React.FC<PhoneHomeScreenProps> = ({
    layout,
    activePageIndex,
    setActivePageIndex,
    isEditMode,
    setIsEditMode,
    openFolder,
    openFolderState,
    setOpenFolderState,
    totalItemCount,
    saveStatus,
    onOpenApp,
    onCreateEmptyFolder,
    onRenameFolder,
    onDissolveFolder,
    onMoveAppOutOfFolder,
    onMoveAppIntoFolder,
    onWrapAppInNewFolder,
    onReorderOrMergeInPage,
    onDropAtPageEnd,
    onMoveAppToDock,
    onRemoveEntry,
    onMoveEntryStep,
    onMoveEntryToPage,
    onAddPage,
    onRemoveEmptyPage,
    onOpenMobileCatalog,
}) => {
    const wallpaper = getWallpaperPreset(layout.wallpaper);
    const currentPage = layout.pages[activePageIndex] || layout.pages[0];

    const [clockText, setClockText] = useState<string>('--:--');
    const [dragSource, setDragSource] = useState<DragSourcePayload | null>(null);
    const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
    const [isDockDragOver, setIsDockDragOver] = useState<boolean>(false);
    const [actionSheetTarget, setActionSheetTarget] = useState<SelectedActionTarget | null>(null);

    const swipeTouchRef = useRef<{ x: number; y: number } | null>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            setClockText(`${hh}:${mm}`);
        };
        updateClock();
        const timer = setInterval(updateClock, 15000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isEditMode) {
            setActionSheetTarget(null);
        }
    }, [isEditMode]);

    const clearLongPress = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const startLongPress = () => {
        clearLongPress();
        longPressTimerRef.current = setTimeout(() => {
            setIsEditMode(true);
        }, 500);
    };

    const handleTouchStartGrid = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length !== 1) return;
        swipeTouchRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
    };

    const handleTouchEndGrid = (e: React.TouchEvent<HTMLDivElement>) => {
        clearLongPress();
        if (!swipeTouchRef.current || e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - swipeTouchRef.current.x;
        const dy = e.changedTouches[0].clientY - swipeTouchRef.current.y;
        swipeTouchRef.current = null;

        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.35) {
            if (dx < 0 && activePageIndex < layout.pages.length - 1) {
                setActivePageIndex(activePageIndex + 1);
            } else if (dx > 0 && activePageIndex > 0) {
                setActivePageIndex(activePageIndex - 1);
            }
        }
    };

    const resolveDragSource = (e: React.DragEvent): DragSourcePayload | null => {
        if (dragSource) return dragSource;
        return parseDragPayload(e.dataTransfer.getData('text/plain'));
    };

    const isDraggingFolder =
        dragSource?.area === 'page' &&
        layout.pages[dragSource.pageIndex]?.items.find((i) => i.id === dragSource.entryId)?.kind === 'folder';

    const existingFoldersOnPage = currentPage.items.filter(
        (item): item is LauncherFolderItem => item.kind === 'folder'
    );

    const handleEntryDragOver = (e: React.DragEvent<HTMLDivElement>, targetEntry: LauncherGridEntry) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5;

        let mode: 'reorder' | 'merge' = 'reorder';
        if (!isDraggingFolder) {
            if (targetEntry.kind === 'folder') {
                if (ratio >= 0.18 && ratio <= 0.82) mode = 'merge';
            } else if (ratio >= 0.22 && ratio <= 0.78) {
                mode = 'merge';
            }
        }

        setDropPreview({
            targetId: targetEntry.id,
            mode,
            isFolderTarget: targetEntry.kind === 'folder',
        });
    };

    const handleEntryDrop = (e: React.DragEvent<HTMLDivElement>, targetEntry: LauncherGridEntry) => {
        e.preventDefault();
        e.stopPropagation();
        const source = resolveDragSource(e);
        const mode = dropPreview?.targetId === targetEntry.id ? dropPreview.mode : 'reorder';
        setDropPreview(null);
        setDragSource(null);

        if (!source) return;
        onReorderOrMergeInPage(activePageIndex, source, targetEntry.id, mode);
    };

    const renderFolderGlyph = (folder: LauncherFolderItem) => {
        const previewApps = folder.apps.slice(0, 4);
        return (
            <div
                className={`w-14 h-14 rounded-[18px] p-1.5 grid grid-cols-2 gap-1 place-items-center shrink-0 select-none ${wallpaper.folderBgClass}`}
            >
                {previewApps.length > 0 ? (
                    previewApps.map((app) => <LauncherAppIconGraphic key={app.id} app={app} size="xs" />)
                ) : (
                    <div className="col-span-2 row-span-2 flex items-center justify-center text-slate-400 text-base">
                        <i className="fas fa-folder-open"></i>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-[#f0f4f8] rounded-3xl border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] p-3.5 sm:p-5 space-y-3">
            {/* 상단 컨트롤 툴바 (상단 밀착 그룹화) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-slate-200/80 text-[11px] font-black text-slate-700 shadow-2xs">
                        {activePageIndex + 1} / {layout.pages.length} 페이지
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                        {saveStatus === 'saving' && '저장 중...'}
                        {saveStatus === 'saved' && '✓ 저장됨'}
                        {saveStatus === 'error' && '⚠ 저장 오류'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => onOpenMobileCatalog('catalog')}
                        className="lg:hidden px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                        <i className="fas fa-plus text-[10px]"></i>
                        <span>앱 추가</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenMobileCatalog('wallpaper')}
                        className="lg:hidden px-2.5 py-1.5 rounded-xl bg-[#e8edf2] hover:bg-white text-[#1e293b] border border-white/80 shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.85)] text-xs font-extrabold cursor-pointer"
                        title="배경화면 변경"
                    >
                        🎨
                    </button>

                    <button
                        type="button"
                        onClick={() => onCreateEmptyFolder(activePageIndex)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#e8edf2] hover:bg-white text-[#1e293b] border border-white/80 shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.85)] text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                        title="현재 페이지에 새 폴더 만들기"
                    >
                        <i className="fas fa-folder-plus text-indigo-600 text-[11px]"></i>
                        <span>새 폴더</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isEditMode
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'bg-[#e8edf2] hover:bg-white text-[#1e293b] border border-white/80 shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.85)]'
                        }`}
                    >
                        {isEditMode ? '완료' : '편집'}
                    </button>
                </div>
            </div>

            {isEditMode && (
                <div className="px-3 py-2 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-800 flex items-center justify-between gap-2">
                    <span>
                        아이콘을 드래그하거나 탭해서 이동·폴더 묶기·삭제할 수 있습니다.
                    </span>
                    {layout.pages.length < MAX_PAGES && (
                        <button
                            type="button"
                            onClick={onAddPage}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black shrink-0 cursor-pointer"
                        >
                            + 페이지
                        </button>
                    )}
                </div>
            )}

            {/* 스마트폰 본체 (PC: 리얼 스마트폰 목업 / 모바일: 베젤리스 풀폭) */}
            <div
                className={`relative overflow-hidden transition-colors duration-300 ${wallpaper.screenBgClass} rounded-3xl border border-white/80 lg:max-w-[360px] lg:mx-auto lg:rounded-[44px] lg:border-[10px] lg:border-slate-900 lg:shadow-[0_22px_46px_rgba(15,23,42,0.28)] flex flex-col min-h-[540px] lg:min-h-[640px]`}
            >
                {/* PC 전용 리얼 스마트폰 상태바 */}
                <div
                    className={`hidden lg:flex items-center justify-between px-6 pt-3 pb-2 text-[11px] font-extrabold shrink-0 select-none ${wallpaper.statusTextClass}`}
                >
                    <span className="w-12 tracking-tight font-mono">{clockText}</span>
                    <div className="w-24 h-5 rounded-full bg-slate-950 flex items-center justify-end pr-2 shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-indigo-950 border border-slate-700"></span>
                    </div>
                    <div className="w-12 flex items-center justify-end gap-1.5 text-[10px]">
                        <i className="fas fa-signal"></i>
                        <i className="fas fa-wifi"></i>
                        <i className="fas fa-battery-full text-xs"></i>
                    </div>
                </div>

                {/* 메인 4x5 홈 그리드 영역 */}
                <div
                    className="flex-1 px-4 pt-4 pb-2 flex flex-col"
                    onTouchStart={handleTouchStartGrid}
                    onTouchEnd={handleTouchEndGrid}
                    onDragOver={(e) => {
                        e.preventDefault();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        const source = resolveDragSource(e);
                        setDropPreview(null);
                        setDragSource(null);
                        if (source) {
                            onDropAtPageEnd(activePageIndex, source);
                        }
                    }}
                >
                    {totalItemCount === 0 && currentPage.items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
                            <div className="w-full max-w-[270px] rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-lg p-5 space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white mx-auto flex items-center justify-center text-xl shadow-md">
                                    <i className="fas fa-mobile-screen-button"></i>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-800">
                                        나만의 앱 홈 화면
                                    </h3>
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                        자주 쓰는 계산기·게임·뉴스·외부 사이트를 등록해 스마트폰처럼 바로 실행하세요.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onOpenMobileCatalog('catalog')}
                                    className="lg:hidden w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black shadow-md cursor-pointer"
                                >
                                    + 첫 번째 앱 추가하기
                                </button>
                                <p className="hidden lg:block text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                                    오른쪽 카탈로그에서 앱을 눌러 추가해 보세요 →
                                </p>
                            </div>
                        </div>
                    ) : currentPage.items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                            <div className="rounded-2xl bg-white/75 backdrop-blur-sm border border-white/80 px-4 py-5 space-y-2.5 shadow-sm">
                                <p className="text-xs font-bold text-slate-700">
                                    {activePageIndex + 1}페이지가 비어 있습니다.
                                </p>
                                {layout.pages.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveEmptyPage(activePageIndex)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-[11px] font-extrabold cursor-pointer"
                                    >
                                        빈 페이지 삭제
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-x-2.5 gap-y-4 content-start">
                            {currentPage.items.map((entry) => {
                                const isPreviewTarget = dropPreview?.targetId === entry.id;
                                const isMergeTarget = isPreviewTarget && dropPreview?.mode === 'merge';
                                const isReorderTarget = isPreviewTarget && dropPreview?.mode === 'reorder';
                                const isSelectedForEdit =
                                    actionSheetTarget?.area === 'page' && actionSheetTarget.entry.id === entry.id;

                                return (
                                    <div
                                        key={entry.id}
                                        draggable
                                        onDragStart={(e) => {
                                            const payload: DragSourcePayload = {
                                                area: 'page',
                                                pageIndex: activePageIndex,
                                                entryId: entry.id,
                                            };
                                            setDragSource(payload);
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                                        }}
                                        onDragEnd={() => {
                                            setDragSource(null);
                                            setDropPreview(null);
                                        }}
                                        onDragOver={(e) => handleEntryDragOver(e, entry)}
                                        onDragLeave={() => {
                                            if (dropPreview?.targetId === entry.id) {
                                                setDropPreview(null);
                                            }
                                        }}
                                        onDrop={(e) => handleEntryDrop(e, entry)}
                                        onTouchStart={startLongPress}
                                        onTouchMove={clearLongPress}
                                        className={`relative flex flex-col items-center gap-1.5 py-1 transition-all ${
                                            isEditMode ? 'odd:-rotate-1 even:rotate-1' : ''
                                        } ${
                                            isMergeTarget
                                                ? 'scale-105 ring-2 ring-indigo-500 bg-indigo-500/20 rounded-2xl'
                                                : isReorderTarget
                                                ? 'border-l-4 border-indigo-500 pl-0.5 rounded-xl'
                                                : ''
                                        } ${isSelectedForEdit ? 'ring-2 ring-amber-400 rounded-2xl bg-white/25' : ''}`}
                                    >
                                        {isMergeTarget && (
                                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black whitespace-nowrap shadow-md">
                                                {dropPreview?.isFolderTarget ? '폴더 넣기' : '폴더 생성'}
                                            </span>
                                        )}

                                        {isEditMode && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveEntry({
                                                        area: 'page',
                                                        pageIndex: activePageIndex,
                                                        entryId: entry.id,
                                                    });
                                                }}
                                                className="absolute -top-1 left-0.5 z-10 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black shadow-md flex items-center justify-center cursor-pointer"
                                                aria-label={`${entry.name} 삭제`}
                                            >
                                                −
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isEditMode) {
                                                    setActionSheetTarget({
                                                        area: 'page',
                                                        pageIndex: activePageIndex,
                                                        entry,
                                                    });
                                                    return;
                                                }
                                                if (entry.kind === 'folder') {
                                                    setOpenFolderState({
                                                        pageIndex: activePageIndex,
                                                        folderId: entry.id,
                                                    });
                                                } else {
                                                    onOpenApp(entry);
                                                }
                                            }}
                                            className="flex flex-col items-center gap-1.5 w-full group cursor-pointer active:scale-95 transition-transform"
                                        >
                                            {entry.kind === 'folder' ? (
                                                renderFolderGlyph(entry)
                                            ) : (
                                                <LauncherAppIconGraphic app={entry} size="md" />
                                            )}

                                            <span
                                                className={`text-[11px] font-bold leading-tight text-center line-clamp-1 w-full px-0.5 ${wallpaper.labelTextClass}`}
                                            >
                                                {entry.name}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 페이지 인디케이터 점 & 좌우 이동 */}
                <div className="px-4 py-2 flex items-center justify-center gap-3 shrink-0">
                    {layout.pages.length > 1 && (
                        <button
                            type="button"
                            disabled={activePageIndex === 0}
                            onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] disabled:opacity-30 cursor-pointer ${wallpaper.statusTextClass}`}
                            aria-label="이전 페이지"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}

                    <div className="flex items-center gap-1.5">
                        {layout.pages.map((page, idx) => (
                            <button
                                key={page.id}
                                type="button"
                                onClick={() => setActivePageIndex(idx)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    idx === activePageIndex ? wallpaper.dotActiveClass : wallpaper.dotInactiveClass
                                }`}
                                aria-label={`${idx + 1}페이지로 이동`}
                            />
                        ))}
                    </div>

                    {layout.pages.length > 1 && (
                        <button
                            type="button"
                            disabled={activePageIndex === layout.pages.length - 1}
                            onClick={() => setActivePageIndex(Math.min(layout.pages.length - 1, activePageIndex + 1))}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] disabled:opacity-30 cursor-pointer ${wallpaper.statusTextClass}`}
                            aria-label="다음 페이지"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}
                </div>

                {/* 하단 고정 Dock (최대 4칸) */}
                <div className="px-3.5 pb-2.5 shrink-0">
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDockDragOver(true);
                        }}
                        onDragLeave={() => setIsDockDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDockDragOver(false);
                            const source = resolveDragSource(e);
                            setDragSource(null);
                            setDropPreview(null);
                            if (source) {
                                onMoveAppToDock(source);
                            }
                        }}
                        className={`rounded-[26px] p-2.5 transition-all ${wallpaper.dockBgClass} ${
                            isDockDragOver ? 'ring-2 ring-indigo-500 scale-[1.02]' : ''
                        }`}
                    >
                        {layout.dock.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2 place-items-center">
                                {layout.dock.map((app, dockIdx) => (
                                    <div
                                        key={app.id}
                                        draggable
                                        onDragStart={(e) => {
                                            const payload: DragSourcePayload = { area: 'dock', appId: app.id };
                                            setDragSource(payload);
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                                        }}
                                        onDragEnd={() => {
                                            setDragSource(null);
                                            setIsDockDragOver(false);
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDockDragOver(false);
                                            const source = resolveDragSource(e);
                                            setDragSource(null);
                                            if (source) {
                                                onMoveAppToDock(source, dockIdx);
                                            }
                                        }}
                                        onTouchStart={startLongPress}
                                        onTouchMove={clearLongPress}
                                        className={`relative flex flex-col items-center ${
                                            isEditMode ? 'odd:-rotate-1 even:rotate-1' : ''
                                        }`}
                                    >
                                        {isEditMode && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveEntry({ area: 'dock', appId: app.id });
                                                }}
                                                className="absolute -top-1.5 -left-1 z-10 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow flex items-center justify-center cursor-pointer"
                                                aria-label={`${app.name} Dock 제거`}
                                            >
                                                −
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isEditMode) {
                                                    setActionSheetTarget({ area: 'dock', app });
                                                } else {
                                                    onOpenApp(app);
                                                }
                                            }}
                                            className="cursor-pointer active:scale-95 transition-transform"
                                            title={app.name}
                                        >
                                            <LauncherAppIconGraphic app={app} size="md" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-2 text-center">
                                <span className={`text-[11px] font-bold opacity-75 ${wallpaper.labelTextClass}`}>
                                    하단 고정 Dock (최대 {MAX_DOCK_ITEMS}개 앱을 드래그해 고정)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 최하단 홈 인디케이터 바 */}
                <div className="pb-2 pt-0.5 flex justify-center shrink-0">
                    <div className={`w-28 h-1 rounded-full ${wallpaper.homeBarClass}`}></div>
                </div>

                {/* 폴더 확대 오버레이 */}
                {openFolder && openFolderState && (
                    <PhoneFolderModal
                        folder={openFolder}
                        pageIndex={openFolderState.pageIndex}
                        isEditMode={isEditMode}
                        onClose={() => setOpenFolderState(null)}
                        onOpenApp={onOpenApp}
                        onRenameFolder={onRenameFolder}
                        onMoveAppOut={onMoveAppOutOfFolder}
                        onRemoveApp={(pIdx, fId, aId) =>
                            onRemoveEntry({ area: 'folder', pageIndex: pIdx, folderId: fId, appId: aId })
                        }
                        onDissolveFolder={onDissolveFolder}
                    />
                )}
            </div>

            {/* 편집 모드 빠른 배치 액션 시트 (모바일 터치 및 정밀 편집용) */}
            {isEditMode && actionSheetTarget && (
                <div className="rounded-2xl bg-white border border-indigo-200 shadow-md p-3.5 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-800 truncate">
                            {actionSheetTarget.area === 'page'
                                ? `${actionSheetTarget.entry.kind === 'folder' ? '📁' : '📱'} ${actionSheetTarget.entry.name}`
                                : `📌 Dock · ${actionSheetTarget.app.name}`}
                        </span>
                        <button
                            type="button"
                            onClick={() => setActionSheetTarget(null)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                            닫기
                        </button>
                    </div>

                    {actionSheetTarget.area === 'page' ? (
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() =>
                                    onMoveEntryStep(actionSheetTarget.pageIndex, actionSheetTarget.entry.id, 'prev')
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                            >
                                ← 앞으로
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    onMoveEntryStep(actionSheetTarget.pageIndex, actionSheetTarget.entry.id, 'next')
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                            >
                                → 뒤로
                            </button>

                            {actionSheetTarget.entry.kind === 'folder' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenFolderState({
                                            pageIndex: actionSheetTarget.pageIndex,
                                            folderId: actionSheetTarget.entry.id,
                                        });
                                        setActionSheetTarget(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold cursor-pointer"
                                >
                                    폴더 열기/이름수정
                                </button>
                            )}

                            {actionSheetTarget.entry.kind === 'app' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onMoveAppToDock({
                                                area: 'page',
                                                pageIndex: actionSheetTarget.pageIndex,
                                                entryId: actionSheetTarget.entry.id,
                                            });
                                            setActionSheetTarget(null);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold cursor-pointer"
                                    >
                                        Dock 고정
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onWrapAppInNewFolder(
                                                actionSheetTarget.pageIndex,
                                                actionSheetTarget.entry.id
                                            );
                                            setActionSheetTarget(null);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold cursor-pointer"
                                    >
                                        새 폴더로 묶기
                                    </button>
                                    {existingFoldersOnPage.map((folder) => (
                                        <button
                                            key={folder.id}
                                            type="button"
                                            onClick={() => {
                                                onMoveAppIntoFolder(
                                                    {
                                                        area: 'page',
                                                        pageIndex: actionSheetTarget.pageIndex,
                                                        entryId: actionSheetTarget.entry.id,
                                                    },
                                                    actionSheetTarget.pageIndex,
                                                    folder.id
                                                );
                                                setActionSheetTarget(null);
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold cursor-pointer"
                                        >
                                            📁 {folder.name}에 넣기
                                        </button>
                                    ))}
                                </>
                            )}

                            {layout.pages.map((p, pIdx) =>
                                pIdx !== actionSheetTarget.pageIndex ? (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                            onMoveEntryToPage(
                                                actionSheetTarget.pageIndex,
                                                actionSheetTarget.entry.id,
                                                pIdx
                                            );
                                            setActionSheetTarget(null);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold cursor-pointer"
                                    >
                                        {pIdx + 1}P 이동
                                    </button>
                                ) : null
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    onRemoveEntry({
                                        area: 'page',
                                        pageIndex: actionSheetTarget.pageIndex,
                                        entryId: actionSheetTarget.entry.id,
                                    });
                                    setActionSheetTarget(null);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold cursor-pointer"
                            >
                                삭제
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    onDropAtPageEnd(activePageIndex, {
                                        area: 'dock',
                                        appId: actionSheetTarget.app.id,
                                    });
                                    setActionSheetTarget(null);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold cursor-pointer"
                            >
                                홈 화면으로 빼기
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onRemoveEntry({ area: 'dock', appId: actionSheetTarget.app.id });
                                    setActionSheetTarget(null);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold cursor-pointer"
                            >
                                삭제
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
