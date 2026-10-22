'use client';

import React, { useState } from 'react';
import { MINIHOME_CATALOG_ITEMS } from '@/data/minihomeCatalogData';
import { MinihomeItemCategory, MinihomeRoomLayout } from '@/types/minihome.types';

interface MinihomeShopDrawerProps {
    ownedItemIds: string[];
    veraPoints: number;
    draftLayout: MinihomeRoomLayout;
    isBuyingItemId: string | null;
    onApplyItem: (itemId: string) => void;
    onPurchaseItem: (itemId: string) => Promise<boolean>;
    onResetRoom: () => void;
    onSaveRoom: () => void;
    onCancelEdit: () => void;
    isSaving: boolean;
}

const CATEGORY_TABS: Array<{ id: 'all' | MinihomeItemCategory; label: string; icon: string }> = [
    { id: 'all', label: '전체', icon: 'fa-border-all' },
    { id: 'wall', label: '벽지', icon: 'fa-paint-roller' },
    { id: 'floor', label: '바닥', icon: 'fa-layer-group' },
    { id: 'furniture', label: '가구', icon: 'fa-couch' },
    { id: 'prop', label: '소품·펫·트로피', icon: 'fa-cat' },
    { id: 'minimi', label: '미니미', icon: 'fa-user-astronaut' },
];

export const MinihomeShopDrawer: React.FC<MinihomeShopDrawerProps> = ({
    ownedItemIds,
    veraPoints,
    draftLayout,
    isBuyingItemId,
    onApplyItem,
    onPurchaseItem,
    onResetRoom,
    onSaveRoom,
    onCancelEdit,
    isSaving,
}) => {
    const [activeMode, setActiveMode] = useState<'inventory' | 'shop'>('inventory');
    const [selectedCategory, setSelectedCategory] = useState<'all' | MinihomeItemCategory>('all');

    const filteredItems = MINIHOME_CATALOG_ITEMS.filter((item) => {
        const isOwned = ownedItemIds.includes(item.itemId) || item.price === 0;
        const matchesTab = activeMode === 'inventory' ? isOwned : true;
        const matchesCategory = selectedCategory === 'all' ? true : item.category === selectedCategory;
        return matchesTab && matchesCategory;
    });

    const isItemEquipped = (itemId: string): boolean => {
        if (draftLayout.wallItemId === itemId) return true;
        if (draftLayout.floorItemId === itemId) return true;
        if (draftLayout.minimiItemId === itemId) return true;
        return draftLayout.placedItems.some((p) => p.itemId === itemId);
    };

    const getCategoryEmoji = (category: MinihomeItemCategory, isTrophy?: boolean) => {
        if (isTrophy) return '🏆';
        switch (category) {
            case 'wall':
                return '🖼️';
            case 'floor':
                return '🪵';
            case 'furniture':
                return '🛋️';
            case 'prop':
                return '🐾';
            case 'minimi':
                return '🧍';
        }
    };

    return (
        <section
            aria-label="내 방 꾸미기 보관함 및 베라 상점"
            className="bg-white rounded-3xl border-2 border-indigo-200 shadow-lg p-5 sm:p-6 space-y-5"
        >
            {/* 상단 헤더: 보관함/상점 전환 + 보유 베라포인트 + 저장/취소 버튼 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveMode('inventory')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                            activeMode === 'inventory'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <i className="fas fa-box-open"></i>
                        <span>내 보관함 ({ownedItemIds.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMode('shop')}
                        data-screenshot-click="action"
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                            activeMode === 'shop'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                    >
                        <i className="fas fa-store"></i>
                        <span>🌰 베라 상점 (도토리샵)</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black flex items-center gap-1.5">
                        <i className="fas fa-coins text-amber-500"></i>
                        <span>보유 베라포인트: {veraPoints.toLocaleString()} P</span>
                    </div>

                    <button
                        type="button"
                        onClick={onResetRoom}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                        초기화
                    </button>
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={onSaveRoom}
                        disabled={isSaving}
                        data-screenshot-click="result"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? '저장 중...' : '💾 내 미니룸 저장하기'}
                    </button>
                </div>
            </div>

            {/* 카테고리 필터 탭 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {CATEGORY_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedCategory(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectedCategory === tab.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <i className={`fas ${tab.icon} text-[11px]`}></i>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 아이템 그리드 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                    const isOwned = ownedItemIds.includes(item.itemId) || item.price === 0;
                    const equipped = isItemEquipped(item.itemId);
                    const isBuying = isBuyingItemId === item.itemId;

                    return (
                        <div
                            key={item.itemId}
                            className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-3 ${
                                equipped
                                    ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                                    : 'bg-slate-50/80 border-slate-200/80 hover:border-indigo-200 hover:bg-white'
                            }`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2.5">
                                        {item.spriteUrl ? (
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/80 shrink-0 p-1 overflow-hidden">
                                                <img
                                                    src={item.spriteUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <span className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-lg shadow-2xs border border-indigo-100 shrink-0">
                                                {getCategoryEmoji(item.category, item.isTrophy)}
                                            </span>
                                        )}
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 leading-snug">
                                                {item.name}
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>

                                    {item.badgeText && (
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black shrink-0">
                                            {item.badgeText}
                                        </span>
                                    )}
                                </div>

                                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                    {item.description}
                                </p>

                                {item.unlockCondition && (
                                    <div className="mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/70">
                                        🏆 {item.unlockCondition}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                                <span className="text-xs font-black text-slate-800">
                                    {item.price === 0 ? (
                                        <span className="text-emerald-600">무료 기본제공</span>
                                    ) : isOwned ? (
                                        <span className="text-indigo-600">보유중 ✓</span>
                                    ) : (
                                        <span className="text-amber-600">🌰 {item.price.toLocaleString()} P</span>
                                    )}
                                </span>

                                {isOwned ? (
                                    <button
                                        type="button"
                                        onClick={() => onApplyItem(item.itemId)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                            equipped && (item.category === 'wall' || item.category === 'floor' || item.category === 'minimi')
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        {item.category === 'furniture' || item.category === 'prop'
                                            ? '+ 방에 배치하기'
                                            : equipped
                                            ? '적용중 ✓'
                                            : '적용하기'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isBuying}
                                        onClick={async () => {
                                            const ok = await onPurchaseItem(item.itemId);
                                            if (ok) {
                                                onApplyItem(item.itemId);
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {isBuying ? '구매 중...' : '구매 후 배치'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
