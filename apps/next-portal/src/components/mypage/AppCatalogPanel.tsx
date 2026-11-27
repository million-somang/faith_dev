'use client';

import React, { useMemo, useState } from 'react';
import {
    CUSTOM_EMOJI_PRESETS,
    ICON_COLOR_PRESETS,
    LauncherAppSource,
    LauncherCatalogItem,
    LauncherIconColorId,
    LauncherWallpaperId,
    MAX_APP_NAME_LENGTH,
    WALLPAPER_PRESETS,
} from '@/types/app-launcher.types';
import { LauncherAppIconGraphic } from './PhoneFolderModal';

export type CatalogPanelTab = 'catalog' | 'custom' | 'wallpaper';

interface AppCatalogPanelProps {
    activeTab: CatalogPanelTab;
    onTabChange: (tab: CatalogPanelTab) => void;
    catalogItems: LauncherCatalogItem[];
    registeredCatalogKeys: Set<string>;
    isLoading: boolean;
    catalogError: string | null;
    currentWallpaper: LauncherWallpaperId;
    onRetryCatalog: () => void;
    onAddCatalogApp: (item: LauncherCatalogItem) => void;
    onAddCustomUrlApp: (input: {
        name: string;
        url: string;
        iconValue: string;
        iconColor: LauncherIconColorId;
    }) => { ok: boolean; error?: string };
    onSelectWallpaper: (wallpaper: LauncherWallpaperId) => void;
}

const FILTER_OPTIONS: Array<{ id: 'all' | LauncherAppSource; label: string }> = [
    { id: 'all', label: '전체' },
    { id: 'miniapp', label: '생활도구' },
    { id: 'game', label: '게임' },
    { id: 'portal', label: '포털 메뉴' },
];

export const AppCatalogPanel: React.FC<AppCatalogPanelProps> = ({
    activeTab,
    onTabChange,
    catalogItems,
    registeredCatalogKeys,
    isLoading,
    catalogError,
    currentWallpaper,
    onRetryCatalog,
    onAddCatalogApp,
    onAddCustomUrlApp,
    onSelectWallpaper,
}) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sourceFilter, setSourceFilter] = useState<'all' | LauncherAppSource>('all');

    const [customName, setCustomName] = useState<string>('');
    const [customUrl, setCustomUrl] = useState<string>('');
    const [customEmoji, setCustomEmoji] = useState<string>('🌐');
    const [customColor, setCustomColor] = useState<LauncherIconColorId>('indigo');
    const [customError, setCustomError] = useState<string | null>(null);

    const filteredItems = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();
        return catalogItems.filter((item) => {
            if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
            if (!keyword) return true;
            return (
                item.name.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword) ||
                item.categoryLabel.toLowerCase().includes(keyword)
            );
        });
    }, [catalogItems, searchQuery, sourceFilter]);

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCustomError(null);
        const result = onAddCustomUrlApp({
            name: customName,
            url: customUrl,
            iconValue: customEmoji,
            iconColor: customColor,
        });
        if (!result.ok) {
            setCustomError(result.error || '앱을 추가하지 못했습니다.');
            return;
        }
        setCustomName('');
        setCustomUrl('');
    };

    return (
        <div className="bg-[#f0f4f8] rounded-3xl border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] p-4 sm:p-6 space-y-4">
            {/* 상단 조작부 그룹 */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-[#1e293b] flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs shadow-sm">
                                <i className="fas fa-shapes"></i>
                            </span>
                            <span>자주 쓰는 앱 추가 · 꾸미기</span>
                        </h2>
                        <p className="text-xs font-medium text-[#64748b] mt-0.5">
                            원하는 앱을 선택해 내 스마트폰 홈 화면에 바로 배치하세요.
                        </p>
                    </div>
                </div>

                {/* 3개 세그먼트 탭 */}
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#e8edf2] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                    <button
                        type="button"
                        onClick={() => onTabChange('catalog')}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            activeTab === 'catalog'
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                                : 'text-[#64748b] hover:text-[#1e293b]'
                        }`}
                    >
                        📦 앱 카탈로그
                    </button>
                    <button
                        type="button"
                        onClick={() => onTabChange('custom')}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            activeTab === 'custom'
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                                : 'text-[#64748b] hover:text-[#1e293b]'
                        }`}
                    >
                        🌐 직접 URL 추가
                    </button>
                    <button
                        type="button"
                        onClick={() => onTabChange('wallpaper')}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            activeTab === 'wallpaper'
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                                : 'text-[#64748b] hover:text-[#1e293b]'
                        }`}
                    >
                        🎨 배경화면
                    </button>
                </div>
            </div>

            {/* 탭 1: 포털 앱 카탈로그 */}
            {activeTab === 'catalog' && (
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <i className="fas fa-search text-xs text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="앱 이름 검색 (예: 계산기, 뉴스, 오목, 사주)"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white text-xs font-semibold text-[#1e293b] border border-white/90 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSourceFilter(opt.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                    sourceFilter === opt.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-[#e8edf2] hover:bg-white text-[#64748b] border border-white/80'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {catalogError && (
                        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs font-bold text-amber-800">
                            <span>{catalogError}</span>
                            <button
                                type="button"
                                onClick={onRetryCatalog}
                                className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shrink-0 cursor-pointer"
                            >
                                다시 시도
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div
                                    key={n}
                                    className="h-20 rounded-2xl bg-white/60 border border-white animate-pulse"
                                />
                            ))}
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-10 text-center rounded-2xl bg-[#e8edf2]/80 border border-white/70 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <p className="text-xs font-bold text-[#64748b]">
                                검색 조건과 일치하는 앱이 없습니다.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                            {filteredItems.map((item) => {
                                const isAdded = registeredCatalogKeys.has(item.catalogKey);
                                return (
                                    <div
                                        key={item.catalogKey}
                                        className="p-3 rounded-2xl bg-white/85 hover:bg-white border border-white/90 shadow-[3px_3px_8px_rgba(163,177,198,0.28),-3px_-3px_8px_rgba(255,255,255,0.85)] flex items-center gap-3 transition-all"
                                    >
                                        <LauncherAppIconGraphic app={item} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-[#1e293b] truncate">
                                                    {item.name}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 shrink-0">
                                                    {item.categoryLabel}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-medium text-[#64748b] truncate mt-0.5">
                                                {item.description}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onAddCatalogApp(item)}
                                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition-all cursor-pointer active:scale-95 ${
                                                isAdded
                                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                            }`}
                                        >
                                            {isAdded ? '추가됨 ✓' : '+ 추가'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 탭 2: 사용자 직접 URL 추가 */}
            {activeTab === 'custom' && (
                <form onSubmit={handleCustomSubmit} className="space-y-4">
                    {/* 실시간 아이콘 미리보기 */}
                    <div className="p-4 rounded-2xl bg-[#e8edf2]/80 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)] flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <LauncherAppIconGraphic
                                app={{
                                    name: customName || '새 앱',
                                    iconType: 'emoji',
                                    iconValue: customEmoji,
                                    iconColor: customColor,
                                }}
                                size="md"
                            />
                            <span className="text-[11px] font-bold text-[#1e293b] max-w-[72px] truncate">
                                {customName.trim() || '앱 이름'}
                            </span>
                        </div>
                        <div className="text-xs text-[#64748b] space-y-1">
                            <div className="font-black text-[#1e293b]">아이콘 미리보기</div>
                            <p className="leading-relaxed">
                                자주 방문하는 외부 웹사이트나 업무 툴 주소를 등록하면 스마트폰 앱처럼 클릭 한 번으로 새 탭에서 열립니다.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-extrabold text-[#1e293b]">
                                앱 이름 (최대 {MAX_APP_NAME_LENGTH}자)
                            </label>
                            <input
                                type="text"
                                maxLength={MAX_APP_NAME_LENGTH}
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="예: 네이버, 유튜브, 회사 메일"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-xs font-semibold text-[#1e293b] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.28),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-extrabold text-[#1e293b]">
                                웹 주소 (URL)
                            </label>
                            <input
                                type="text"
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-xs font-semibold text-[#1e293b] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.28),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="block text-xs font-extrabold text-[#1e293b]">아이콘 선택</span>
                        <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                            {CUSTOM_EMOJI_PRESETS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setCustomEmoji(emoji)}
                                    className={`h-9 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                                        customEmoji === emoji
                                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                                            : 'bg-white/80 hover:bg-white border border-white'
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="block text-xs font-extrabold text-[#1e293b]">아이콘 배경색</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {Object.values(ICON_COLOR_PRESETS).map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => setCustomColor(preset.id)}
                                    className={`w-8 h-8 rounded-full ${preset.swatchClass} transition-transform cursor-pointer flex items-center justify-center text-white text-xs ${
                                        customColor === preset.id
                                            ? 'scale-110 ring-2 ring-offset-2 ring-indigo-600'
                                            : 'opacity-80 hover:opacity-100'
                                    }`}
                                    title={preset.label}
                                    aria-label={preset.label}
                                >
                                    {customColor === preset.id && <i className="fas fa-check text-[10px]"></i>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {customError && (
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                            {customError}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer active:scale-95"
                    >
                        + 내 스마트폰 홈 화면에 앱 추가
                    </button>
                </form>
            )}

            {/* 탭 3: 스마트폰 배경화면 설정 */}
            {activeTab === 'wallpaper' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {WALLPAPER_PRESETS.map((preset) => {
                        const isSelected = currentWallpaper === preset.id;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => onSelectWallpaper(preset.id)}
                                className={`p-3 rounded-2xl bg-white/85 hover:bg-white border text-left space-y-2 transition-all cursor-pointer ${
                                    isSelected
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/25 shadow-md'
                                        : 'border-white/90 shadow-xs'
                                }`}
                            >
                                <div
                                    className={`h-20 rounded-xl border ${preset.previewClass} flex items-end justify-between p-2`}
                                >
                                    <div className="flex gap-1">
                                        <span className="w-3 h-3 rounded bg-white/75"></span>
                                        <span className="w-3 h-3 rounded bg-white/75"></span>
                                    </div>
                                    {isSelected && (
                                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center shadow">
                                            <i className="fas fa-check"></i>
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs font-black text-[#1e293b]">{preset.label}</div>
                                    <div className="text-[10px] font-medium text-[#64748b] truncate">
                                        {preset.subLabel}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
