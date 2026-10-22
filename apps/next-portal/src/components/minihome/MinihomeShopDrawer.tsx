'use client';

import React, { useState } from 'react';
import { MINIHOME_CATALOG_ITEMS, VERA_POINT_SHOP_ENABLED } from '@/data/minihomeCatalogData';
import { MinihomeItemCategory, MinihomeRoomLayout } from '@/types/minihome.types';

interface MinihomeShopDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    ownedItemIds: string[];
    veraPoints: number;
    draftLayout: MinihomeRoomLayout;
    isBuyingItemId: string | null;
    onApplyItem: (itemId: string) => void;
    onPurchaseItem: (itemId: string) => Promise<boolean>;
    onResetRoom: () => void;
    onSaveRoom: () => void;
    isSaving: boolean;
}

const CATEGORY_TABS: Array<{ id: 'all' | MinihomeItemCategory; label: string; icon: string }> = [
    { id: 'all', label: '전체', icon: 'fa-border-all' },
    { id: 'wall', label: '벽지', icon: 'fa-paint-roller' },
    { id: 'floor', label: '바닥', icon: 'fa-layer-group' },
    { id: 'furniture', label: '가구', icon: 'fa-couch' },
    { id: 'prop', label: '소품·펫·트로피', icon: 'fa-cat' },
    { id: 'minimi', label: '아바타', icon: 'fa-user-astronaut' },
];

export const MinihomeShopDrawer: React.FC<MinihomeShopDrawerProps> = ({
    isOpen,
    onClose,
    ownedItemIds,
    veraPoints,
    draftLayout,
    isBuyingItemId,
    onApplyItem,
    onPurchaseItem,
    onResetRoom,
    onSaveRoom,
    isSaving,
}) => {
    const [activeMode, setActiveMode] = useState<'shop' | 'inventory'>('shop');
    const [selectedCategory, setSelectedCategory] = useState<'all' | MinihomeItemCategory>('all');

    if (!isOpen) return null;

    const filteredItems = MINIHOME_CATALOG_ITEMS.filter((item) => {
        const isOwned = !VERA_POINT_SHOP_ENABLED || ownedItemIds.includes(item.itemId) || item.price === 0;
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
        <div
            role="dialog"
            aria-modal="true"
            aria-label="내 아지트 꾸미기 상점 및 보관함 팝업"
            className="fixed inset-0 z-[60] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 overflow-x-hidden"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl sm:rounded-3xl border-2 border-indigo-200 shadow-2xl w-full max-w-[calc(100vw-1.25rem)] sm:max-w-4xl min-w-0 max-h-[88vh] flex flex-col overflow-hidden animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 모달 상단 헤더 */}
                <div className="p-3.5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/60 space-y-2.5 sm:space-y-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm sm:text-lg shadow-sm shrink-0">
                                🎁
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <h3 className="text-[15px] sm:text-lg font-black text-slate-900 leading-tight">
                                        아지트 꾸미기 상점 &amp; 보관함
                                    </h3>
                                    {!VERA_POINT_SHOP_ENABLED && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-black shrink-0">
                                            🎉 전 품목 무료
                                        </span>
                                    )}
                                </div>
                                <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                                    {VERA_POINT_SHOP_ENABLED
                                        ? '베라포인트로 아지트 가구와 아바타를 구매해 배치해보세요.'
                                        : '현재 모든 벽지·바닥·가구·소품·아바타를 무료로 내 아지트에 배치할 수 있습니다.'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="상점 팝업 닫기"
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                            <i className="fas fa-times text-xs sm:text-sm"></i>
                        </button>
                    </div>

                    {/* 상점/보관함 전환 탭 + 우측 컨트롤 (모바일에서도 한 줄 배치) */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-3 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <button
                                type="button"
                                onClick={() => setActiveMode('shop')}
                                data-screenshot-click="action"
                                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[12px] sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                    activeMode === 'shop'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <i className="fas fa-store text-[11px] sm:text-xs"></i>
                                <span className="sm:hidden">상점 ({MINIHOME_CATALOG_ITEMS.length})</span>
                                <span className="hidden sm:inline">아지트 상점 ({MINIHOME_CATALOG_ITEMS.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveMode('inventory')}
                                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[12px] sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                    activeMode === 'inventory'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <i className="fas fa-box-open text-[11px] sm:text-xs"></i>
                                <span className="sm:hidden">
                                    보관함 (
                                    {VERA_POINT_SHOP_ENABLED
                                        ? ownedItemIds.length
                                        : MINIHOME_CATALOG_ITEMS.length}
                                    )
                                </span>
                                <span className="hidden sm:inline">
                                    내 보관함 (
                                    {VERA_POINT_SHOP_ENABLED
                                        ? ownedItemIds.length
                                        : MINIHOME_CATALOG_ITEMS.length}
                                    )
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {VERA_POINT_SHOP_ENABLED && (
                                <div className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-black flex items-center gap-1">
                                    <i className="fas fa-coins text-amber-500"></i>
                                    <span className="hidden sm:inline">보유 베라포인트:</span>
                                    <span>{veraPoints.toLocaleString()} P</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onResetRoom}
                                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer shrink-0"
                            >
                                <span className="sm:hidden">초기화</span>
                                <span className="hidden sm:inline">기본 배치 초기화</span>
                            </button>
                        </div>
                    </div>

                    {/* 카테고리 필터 탭 */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full min-w-0 sm:overflow-x-auto pb-0.5">
                        {CATEGORY_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold whitespace-nowrap flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                                    selectedCategory === tab.id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <i className={`fas ${tab.icon} text-[10px] sm:text-[11px]`}></i>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 아이템 그리드 목록 (스크롤 영역) */}
                <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5 min-w-0">
                        {filteredItems.map((item) => {
                            const isOwned =
                                !VERA_POINT_SHOP_ENABLED ||
                                ownedItemIds.includes(item.itemId) ||
                                item.price === 0;
                            const equipped = isItemEquipped(item.itemId);
                            const isBuying = isBuyingItemId === item.itemId;

                            return (
                                <div
                                    key={item.itemId}
                                    className={`rounded-2xl p-3 sm:p-3.5 border transition-all flex flex-col justify-between gap-2.5 sm:gap-3 min-w-0 ${
                                        equipped
                                            ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                                            : 'bg-slate-50/80 border-slate-200/80 hover:border-indigo-200 hover:bg-white'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                {item.spriteUrl ? (
                                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/80 shrink-0 p-1 overflow-hidden">
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
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-[13px] sm:text-xs font-black text-slate-900 leading-snug truncate">
                                                        {item.name}
                                                    </h4>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                                        {item.category === 'minimi' ? 'AVATAR' : item.category}
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

                                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 min-w-0">
                                        <span className="text-[12px] sm:text-xs font-black text-slate-800 flex items-center gap-1.5 min-w-0">
                                            {!VERA_POINT_SHOP_ENABLED || item.price === 0 ? (
                                                <>
                                                    <span className="text-emerald-600">무료</span>
                                                    {item.pointPrice && item.pointPrice > 0 ? (
                                                        <span className="text-[10px] text-slate-400 line-through font-normal">
                                                            {item.pointPrice}P
                                                        </span>
                                                    ) : null}
                                                </>
                                            ) : isOwned ? (
                                                <span className="text-indigo-600">보유중 ✓</span>
                                            ) : (
                                                <span className="text-amber-600">
                                                    🪙 {item.price.toLocaleString()} P
                                                </span>
                                            )}
                                        </span>

                                        {isOwned ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        !ownedItemIds.includes(item.itemId) &&
                                                        item.pointPrice &&
                                                        item.pointPrice > 0
                                                    ) {
                                                        // 무료 오픈 상태에서 미등록 아이템은 보관함에도 자동 등록 후 즉시 배치
                                                        onPurchaseItem(item.itemId).catch(() => {});
                                                    }
                                                    onApplyItem(item.itemId);
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-[12px] sm:text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                                                    equipped &&
                                                    (item.category === 'wall' ||
                                                        item.category === 'floor' ||
                                                        item.category === 'minimi')
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                }`}
                                            >
                                                {item.category === 'furniture' || item.category === 'prop'
                                                    ? '+ 아지트에 배치'
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
                                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[12px] sm:text-xs font-extrabold shadow-2xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                                            >
                                                {isBuying ? '구매 중...' : '구매 후 배치'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 모달 하단 액션 푸터 */}
                <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <span className="hidden sm:inline text-xs font-semibold text-slate-500">
                        💡 아이템을 배치한 뒤 아지트 바닥 타일을 클릭해 원하는 위치로 옮길 수 있습니다.
                    </span>
                    <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[12px] sm:text-xs font-extrabold transition-colors cursor-pointer text-center"
                        >
                            창 닫고 위치 조정
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onSaveRoom();
                                onClose();
                            }}
                            disabled={isSaving}
                            data-screenshot-click="result"
                            className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[12px] sm:text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 text-center"
                        >
                            {isSaving ? '저장 중...' : '💾 내 아지트 저장'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
