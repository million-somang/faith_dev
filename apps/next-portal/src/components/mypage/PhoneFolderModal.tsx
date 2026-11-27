'use client';

import React, { useEffect, useState } from 'react';
import {
    ICON_COLOR_PRESETS,
    LauncherAppItem,
    LauncherFolderItem,
    MAX_FOLDER_NAME_LENGTH,
} from '@/types/app-launcher.types';

interface LauncherAppIconGraphicProps {
    app: Pick<LauncherAppItem, 'name' | 'iconType' | 'iconValue' | 'iconColor'>;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg', { box: string; img: string; fa: string; emoji: string }> = {
    xs: { box: 'w-5 h-5 rounded-[5px]', img: 'w-4 h-4', fa: 'text-[9px]', emoji: 'text-[10px]' },
    sm: { box: 'w-10 h-10 rounded-xl', img: 'w-7 h-7', fa: 'text-base', emoji: 'text-lg' },
    md: { box: 'w-14 h-14 rounded-[18px]', img: 'w-10 h-10', fa: 'text-xl', emoji: 'text-2xl' },
    lg: { box: 'w-16 h-16 rounded-[20px]', img: 'w-11 h-11', fa: 'text-2xl', emoji: 'text-3xl' },
};

export const LauncherAppIconGraphic: React.FC<LauncherAppIconGraphicProps> = ({ app, size = 'md' }) => {
    const colorPreset = ICON_COLOR_PRESETS[app.iconColor] || ICON_COLOR_PRESETS.indigo;
    const sz = SIZE_CLASSES[size];

    if (app.iconType === 'image') {
        return (
            <div
                className={`${sz.box} bg-white/95 border border-white/80 shadow-[0_6px_14px_rgba(15,23,42,0.14)] flex items-center justify-center overflow-hidden shrink-0 select-none`}
            >
                <img
                    src={app.iconValue}
                    alt={app.name}
                    className={`${sz.img} object-contain pointer-events-none`}
                    draggable={false}
                />
            </div>
        );
    }

    return (
        <div
            className={`${sz.box} ${colorPreset.bgClass} shadow-[0_6px_14px_rgba(15,23,42,0.18)] border border-white/25 flex items-center justify-center shrink-0 select-none`}
        >
            {app.iconType === 'fa' ? (
                <i className={`${app.iconValue} ${sz.fa}`} aria-hidden="true"></i>
            ) : (
                <span className={`${sz.emoji} leading-none`} role="img" aria-label={app.name}>
                    {app.iconValue}
                </span>
            )}
        </div>
    );
};

interface PhoneFolderModalProps {
    folder: LauncherFolderItem;
    pageIndex: number;
    isEditMode: boolean;
    onClose: () => void;
    onOpenApp: (app: LauncherAppItem) => void;
    onRenameFolder: (pageIndex: number, folderId: string, nextName: string) => void;
    onMoveAppOut: (pageIndex: number, folderId: string, appId: string) => void;
    onRemoveApp: (pageIndex: number, folderId: string, appId: string) => void;
    onDissolveFolder: (pageIndex: number, folderId: string) => void;
}

export const PhoneFolderModal: React.FC<PhoneFolderModalProps> = ({
    folder,
    pageIndex,
    isEditMode,
    onClose,
    onOpenApp,
    onRenameFolder,
    onMoveAppOut,
    onRemoveApp,
    onDissolveFolder,
}) => {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(folder.name);

    useEffect(() => {
        setTitleDraft(folder.name);
    }, [folder.name, folder.id]);

    const commitTitle = () => {
        setEditingTitle(false);
        onRenameFolder(pageIndex, folder.id, titleDraft);
    };

    return (
        <div
            className="absolute inset-0 z-30 bg-slate-900/55 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[300px] bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/90 shadow-2xl p-4 space-y-3"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 폴더 상단 헤더 & 이름 편집 */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                    {editingTitle ? (
                        <input
                            type="text"
                            autoFocus
                            maxLength={MAX_FOLDER_NAME_LENGTH}
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            onBlur={commitTitle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commitTitle();
                                if (e.key === 'Escape') {
                                    setTitleDraft(folder.name);
                                    setEditingTitle(false);
                                }
                            }}
                            className="flex-1 min-w-0 px-2.5 py-1 rounded-xl bg-white border border-indigo-400 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditingTitle(true)}
                            className="flex items-center gap-1.5 min-w-0 text-left group cursor-pointer"
                            title="폴더 이름 수정"
                        >
                            <span className="text-sm font-black text-slate-800 truncate">
                                {folder.name}
                            </span>
                            <i className="fas fa-pen text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0"></i>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs shrink-0 cursor-pointer"
                        aria-label="폴더 닫기"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* 폴더 내부 앱 그리드 (3열) */}
                {folder.apps.length > 0 ? (
                    <div className="grid grid-cols-3 gap-x-2 gap-y-3 max-h-[260px] overflow-y-auto py-1 px-0.5">
                        {folder.apps.map((app) => (
                            <div key={app.id} className="relative flex flex-col items-center gap-1.5">
                                {isEditMode && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveApp(pageIndex, folder.id, app.id)}
                                        className="absolute -top-1.5 left-1 z-10 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black shadow-md flex items-center justify-center cursor-pointer"
                                        aria-label={`${app.name} 삭제`}
                                        title="앱 제거"
                                    >
                                        −
                                    </button>
                                )}

                                <button
                                    type="button"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            'text/plain',
                                            JSON.stringify({
                                                area: 'folder',
                                                pageIndex,
                                                folderId: folder.id,
                                                appId: app.id,
                                            })
                                        );
                                    }}
                                    onClick={() => {
                                        if (isEditMode) {
                                            onMoveAppOut(pageIndex, folder.id, app.id);
                                        } else {
                                            onClose();
                                            onOpenApp(app);
                                        }
                                    }}
                                    className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform w-full"
                                >
                                    <LauncherAppIconGraphic app={app} size="md" />
                                    <span className="text-[11px] font-bold text-slate-700 leading-tight text-center line-clamp-1 w-full px-0.5">
                                        {app.name}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onMoveAppOut(pageIndex, folder.id, app.id)}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                    title="홈 화면으로 꺼내기"
                                >
                                    꺼내기
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center space-y-2 bg-slate-100/80 rounded-2xl border border-dashed border-slate-300">
                        <div className="text-2xl">📂</div>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed px-3">
                            빈 폴더입니다.<br />
                            홈 화면의 앱을 드래그하거나 편집 모드에서 담아보세요.
                        </p>
                    </div>
                )}

                {/* 하단 폴더 액션 */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onDissolveFolder(pageIndex, folder.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-extrabold transition-colors cursor-pointer"
                    >
                        폴더 해체
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold transition-colors cursor-pointer"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};
