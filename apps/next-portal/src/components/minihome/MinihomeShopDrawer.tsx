'use client';

import React, { useState, useEffect } from 'react';
import {
    ensureGardenState,
    GARDEN_CROP_CATALOG,
    getGardenCropById,
    MINIHOME_CATALOG_ITEMS,
    VERA_POINT_SHOP_ENABLED,
} from '@/data/minihomeCatalogData';
import type {
    AzitCropCatalogItem,
    AzitFertilizerCatalogItem,
    AzitFertilizerId,
} from '@/types/azit-game.types';
import { GardenCropId, MinihomeItemCategory, MinihomeRoomLayout } from '@/types/minihome.types';

export type ShopCategoryTab = 'all' | MinihomeItemCategory | 'fertilizer';

interface MinihomeShopDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    ownedItemIds: string[];
    veraPoints: number;
    draftLayout: MinihomeRoomLayout;
    isBuyingItemId: string | null;
    onApplyItem: (itemId: string) => void;
    onPurchaseItem: (itemId: string) => Promise<boolean>;
    onBuySeed?: (cropId: GardenCropId, quantity?: number) => void;
    onBuyFertilizer?: (fertilizerId: AzitFertilizerId, quantity?: number) => Promise<boolean> | void;
    onResetRoom: () => void;
    onSaveRoom: () => void;
    isSaving: boolean;
    isActing?: boolean;
    azitLevel?: number;
    cropCatalog?: AzitCropCatalogItem[];
    fertilizerCatalog?: AzitFertilizerCatalogItem[];
    initialMode?: 'shop' | 'inventory' | 'warehouse';
    initialCategory?: ShopCategoryTab;
}

const FALLBACK_FERTILIZERS: AzitFertilizerCatalogItem[] = [
    {
        fertilizerId: 'fert-basic',
        name: '일반 성장 비료',
        shortName: '일반 비료',
        emoji: '🧪',
        requiredAzitLevel: 1,
        price: 40,
        reductionMs: 4 * 60 * 60 * 1000,
        reductionHours: 4,
        description: '작물의 다음 물주기 대기 시간을 4시간 단축시킵니다.',
    },
    {
        fertilizerId: 'fert-rapid',
        name: '고농축 급속 비료',
        shortName: '급속 비료',
        emoji: '⚡',
        requiredAzitLevel: 1,
        price: 75,
        reductionMs: 8 * 60 * 60 * 1000,
        reductionHours: 8,
        description: '작물의 다음 물주기 대기 시간을 8시간 단축하여 즉시 물주기가 가능하게 합니다.',
    },
];

const CATEGORY_TABS: Array<{ id: ShopCategoryTab; label: string; icon: string }> = [
    { id: 'all', label: '전체', icon: 'fa-border-all' },
    { id: 'seed', label: '텃밭 씨앗', icon: 'fa-seedling' },
    { id: 'fertilizer', label: '비료', icon: 'fa-flask' },
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
    onBuySeed,
    onBuyFertilizer,
    onResetRoom,
    onSaveRoom,
    isSaving,
    isActing = false,
    azitLevel = 1,
    cropCatalog,
    fertilizerCatalog,
    initialMode = 'shop',
    initialCategory = 'all',
}) => {
    const [activeMode, setActiveMode] = useState<'shop' | 'inventory' | 'warehouse'>(initialMode);
    const [selectedCategory, setSelectedCategory] = useState<ShopCategoryTab>(initialCategory);

    useEffect(() => {
        if (isOpen) {
            setActiveMode(initialMode);
            setSelectedCategory(initialCategory);
        }
    }, [isOpen, initialMode, initialCategory]);

    if (!isOpen) return null;

    const garden = ensureGardenState(draftLayout.garden);
    const effectiveCrops =
        cropCatalog && cropCatalog.length > 0
            ? cropCatalog
            : GARDEN_CROP_CATALOG.map((c) => ({
                  cropId: c.cropId,
                  name: c.name,
                  shortName: c.shortName,
                  emoji: c.emoji,
                  requiredAzitLevel: c.requiredAzitLevel ?? 1,
                  seedPrice: c.seedPrice ?? 0,
                  harvestYield: 2,
                  sellPrice: c.sellPrice ?? 10,
                  description: c.description,
              }));
    const effectiveFertilizers =
        fertilizerCatalog && fertilizerCatalog.length > 0 ? fertilizerCatalog : FALLBACK_FERTILIZERS;

    const totalSeedsInWarehouse = Object.values(garden.seedCounts).reduce((acc, v) => acc + v, 0);
    const totalFertilizersInWarehouse = Object.values(garden.fertilizerCounts || {}).reduce(
        (acc, v) => acc + v,
        0
    );
    const totalCropsInWarehouse = garden.totalHarvested;

    const showSeedsInGrid = selectedCategory === 'all' || selectedCategory === 'seed';
    const showFertilizersInGrid = selectedCategory === 'all' || selectedCategory === 'fertilizer';

    const visibleSeeds = showSeedsInGrid
        ? effectiveCrops.filter((crop) =>
              activeMode === 'inventory' ? (garden.seedCounts[crop.cropId] || 0) > 0 : true
          )
        : [];

    const visibleFertilizers = showFertilizersInGrid
        ? effectiveFertilizers.filter((fert) =>
              activeMode === 'inventory' ? (garden.fertilizerCounts?.[fert.fertilizerId] || 0) > 0 : true
          )
        : [];

    const filteredItems =
        selectedCategory === 'seed' || selectedCategory === 'fertilizer'
            ? []
            : MINIHOME_CATALOG_ITEMS.filter((item) => {
                  if (item.category === 'seed') return false;
                  const isOwned =
                      !VERA_POINT_SHOP_ENABLED || ownedItemIds.includes(item.itemId) || item.price === 0;
                  const matchesTab = activeMode === 'inventory' ? isOwned : true;
                  const matchesCategory =
                      selectedCategory === 'all' ? true : item.category === selectedCategory;
                  return matchesTab && matchesCategory;
              });

    const isItemEquipped = (itemId: string): boolean => {
        if (draftLayout.wallItemId === itemId) return true;
        if (draftLayout.floorItemId === itemId) return true;
        if (draftLayout.minimiItemId === itemId) return true;
        return draftLayout.placedItems.some((p) => p.itemId === itemId);
    };

    const getCategoryEmoji = (category: MinihomeItemCategory, isTrophy?: boolean, cropId?: GardenCropId) => {
        if (category === 'seed') {
            const cropMeta = getGardenCropById(cropId);
            return cropMeta ? cropMeta.emoji : '🌱';
        }
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
            aria-label="내 아지트 꾸미기 상점 및 농장 창고 팝업"
            className="fixed inset-0 z-[60] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 overflow-x-hidden"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl sm:rounded-3xl border-2 border-indigo-200 shadow-2xl w-full max-w-[calc(100vw-1.25rem)] sm:max-w-4xl min-w-0 max-h-[88vh] flex flex-col overflow-hidden animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 모달 상단 헤더 */}
                <div className="p-3.5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 via-white to-emerald-50/50 space-y-2.5 sm:space-y-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm sm:text-lg shadow-sm shrink-0">
                                {activeMode === 'warehouse' ? '🏚️' : '🎁'}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <h3 className="text-[15px] sm:text-lg font-black text-slate-900 leading-tight">
                                        아지트 상점 &amp; 농장 창고
                                    </h3>
                                    {!VERA_POINT_SHOP_ENABLED && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-black shrink-0">
                                            🎉 전 품목 0원 오픈
                                        </span>
                                    )}
                                </div>
                                <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                                    상점에서 작물 씨앗과 가구를 0원에 구매하고, 구매한 씨앗과 수확한 작물은 농장 창고에 안전하게 보관됩니다.
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

                    {/* 상점 / 내 보관함 / 농장 창고 전환 탭 */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                            <button
                                type="button"
                                onClick={() => setActiveMode('shop')}
                                data-screenshot-click="action"
                                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                    activeMode === 'shop'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <i className="fas fa-store text-[10px] sm:text-xs"></i>
                                <span>상점 (0원)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveMode('warehouse')}
                                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                    activeMode === 'warehouse'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                }`}
                            >
                                <span>🏚️ 농장 창고</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                        activeMode === 'warehouse'
                                            ? 'bg-white/25 text-white'
                                            : 'bg-emerald-200/80 text-emerald-900'
                                    }`}
                                >
                                    씨앗 {totalSeedsInWarehouse} · 비료 {totalFertilizersInWarehouse} · 작물 {totalCropsInWarehouse}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveMode('inventory')}
                                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                    activeMode === 'inventory'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <i className="fas fa-box-open text-[10px] sm:text-xs"></i>
                                <span>가구 보관함</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
                            {(VERA_POINT_SHOP_ENABLED || Boolean(onBuySeed) || Boolean(onBuyFertilizer)) && (
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

                    {/* 카테고리 필터 탭 (상점 / 가구 보관함 모드일 때 표시) */}
                    {activeMode !== 'warehouse' && (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full min-w-0 sm:overflow-x-auto pb-0.5">
                            {CATEGORY_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(tab.id)}
                                    className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold whitespace-nowrap flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                                        selectedCategory === tab.id
                                            ? tab.id === 'seed'
                                                ? 'bg-emerald-600 text-white shadow-2xs'
                                                : tab.id === 'fertilizer'
                                                  ? 'bg-violet-600 text-white shadow-2xs'
                                                  : 'bg-slate-900 text-white'
                                            : tab.id === 'seed'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                              : tab.id === 'fertilizer'
                                                ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <i className={`fas ${tab.icon} text-[10px] sm:text-[11px]`}></i>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 본문 스크롤 영역 */}
                <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-w-0">
                    {activeMode === 'warehouse' ? (
                        <div className="space-y-5 min-w-0">
                            {/* 창고 요약 배너 */}
                            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-amber-50/60 border border-emerald-200/80 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm sm:text-base font-black text-slate-900">
                                            🏚️ 내 아지트 농장 창고
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] sm:text-[11px] font-black">
                                            보유 씨앗 {totalSeedsInWarehouse}봉지
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] sm:text-[11px] font-black">
                                            비료 {totalFertilizersInWarehouse}개
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] sm:text-[11px] font-black">
                                            수확 작물 {totalCropsInWarehouse}개
                                        </span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-600">
                                        당근 씨앗(0P 무료)과 고레벨 씨앗, 성장 비료를 구매해 앞마당 텃밭을 빠르게 가꿔보세요.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveMode('shop');
                                            setSelectedCategory('seed');
                                        }}
                                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                                    >
                                        🌱 씨앗 상점
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveMode('shop');
                                            setSelectedCategory('fertilizer');
                                        }}
                                        className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                                    >
                                        🧪 비료 상점
                                    </button>
                                </div>
                            </div>

                            {/* 섹션 1: 보유 씨앗 창고 */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                                        <span>🌱 씨앗 보관함</span>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            (텃밭에 심을 때 창고에서 1개씩 사용됩니다)
                                        </span>
                                    </h4>
                                    <span className="text-[11px] font-black text-emerald-700">
                                        총 {totalSeedsInWarehouse}봉지 보관 중
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                                    {effectiveCrops.map((crop) => {
                                        const seedQty = garden.seedCounts[crop.cropId] || 0;
                                        const seedPrice = crop.seedPrice ?? 0;
                                        const reqLv = crop.requiredAzitLevel ?? 1;
                                        const isLocked = azitLevel < reqLv;
                                        const canBuyOne =
                                            !isLocked && !isActing && (seedPrice === 0 || veraPoints >= seedPrice);
                                        const canBuyFive =
                                            !isLocked && !isActing && (seedPrice === 0 || veraPoints >= seedPrice * 5);
                                        return (
                                            <div
                                                key={`warehouse-seed-${crop.cropId}`}
                                                className={`rounded-2xl p-3 border transition-all flex flex-col justify-between gap-2.5 ${
                                                    isLocked
                                                        ? 'bg-slate-100/80 border-slate-200 opacity-75'
                                                        : seedQty > 0
                                                          ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                                                          : 'bg-slate-50/70 border-slate-200/80'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                                                            {crop.emoji}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-black text-slate-900 truncate">
                                                                {crop.name} 씨앗
                                                            </div>
                                                            <div className="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                                                                창고 보유: <span className="text-sm font-black">{seedQty}</span>봉지
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                                seedPrice === 0
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-amber-100 text-amber-800'
                                                            }`}
                                                        >
                                                            {seedPrice === 0 ? '0P 무료' : `${seedPrice}P`}
                                                        </span>
                                                        {reqLv > 1 && (
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                                    isLocked
                                                                        ? 'bg-slate-200 text-slate-700'
                                                                        : 'bg-indigo-50 text-indigo-700'
                                                                }`}
                                                            >
                                                                {isLocked ? `🔒 Lv.${reqLv}` : `Lv.${reqLv}+`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                                                    <span className="text-[11px] font-black text-slate-700">
                                                        {isLocked
                                                            ? `🔒 아지트 Lv.${reqLv} 해금`
                                                            : seedPrice === 0
                                                              ? '무료'
                                                              : `${seedPrice}P/개`}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={!canBuyOne}
                                                            onClick={() => onBuySeed?.(crop.cropId, 1)}
                                                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            {isLocked
                                                                ? `🔒 Lv.${reqLv}`
                                                                : seedPrice === 0
                                                                  ? '+1 무료'
                                                                  : `+1 (${seedPrice}P)`}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={!canBuyFive}
                                                            onClick={() => onBuySeed?.(crop.cropId, 5)}
                                                            className="px-2 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            +5
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 섹션 2: 비료 보관함 */}
                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                                        <span>🧪 비료 보관함</span>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            (작물 물주기 대기 시간을 즉시 단축합니다)
                                        </span>
                                    </h4>
                                    <span className="text-[11px] font-black text-violet-700">
                                        총 {totalFertilizersInWarehouse}개 보관 중
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                    {effectiveFertilizers.map((fert) => {
                                        const fertQty = garden.fertilizerCounts?.[fert.fertilizerId] || 0;
                                        const isLocked = azitLevel < (fert.requiredAzitLevel ?? 1);
                                        const canBuyOne =
                                            Boolean(onBuyFertilizer) &&
                                            !isLocked &&
                                            !isActing &&
                                            veraPoints >= fert.price;
                                        const canBuyFive =
                                            Boolean(onBuyFertilizer) &&
                                            !isLocked &&
                                            !isActing &&
                                            veraPoints >= fert.price * 5;
                                        return (
                                            <div
                                                key={`warehouse-fert-${fert.fertilizerId}`}
                                                className={`rounded-2xl p-3 border transition-all flex flex-col justify-between gap-2.5 ${
                                                    fertQty > 0
                                                        ? 'bg-violet-50/60 border-violet-300 shadow-2xs'
                                                        : 'bg-slate-50/70 border-slate-200/80'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-10 h-10 rounded-xl bg-white border border-violet-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                                                            {fert.emoji}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-black text-slate-900 truncate">
                                                                {fert.name}
                                                            </div>
                                                            <div className="text-[11px] font-extrabold text-violet-700 mt-0.5">
                                                                보유: <span className="text-sm font-black">{fertQty}</span>개 · ⏳ -{fert.reductionHours}h
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black shrink-0">
                                                        {fert.price}P
                                                    </span>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                                                    <span className="text-[11px] font-semibold text-slate-600 truncate">
                                                        {fert.description}
                                                    </span>
                                                    {onBuyFertilizer && (
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                type="button"
                                                                disabled={!canBuyOne}
                                                                onClick={() => onBuyFertilizer(fert.fertilizerId, 1)}
                                                                className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                +1 ({fert.price}P)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!canBuyFive}
                                                                onClick={() => onBuyFertilizer(fert.fertilizerId, 5)}
                                                                className="px-2 py-1.5 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                +5
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 섹션 3: 수확 작물 창고 */}
                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                                        <span>🧺 수확 작물 보관함</span>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            (앞마당 텃밭에서 직접 키워 수확한 농작물)
                                        </span>
                                    </h4>
                                    <span className="text-[11px] font-black text-amber-700">
                                        총 {totalCropsInWarehouse}개 보관 중
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    {effectiveCrops.map((crop) => {
                                        const harvestQty = garden.harvestCounts[crop.cropId] || 0;
                                        const reqLv = crop.requiredAzitLevel ?? 1;
                                        const isLocked = azitLevel < reqLv;
                                        return (
                                            <div
                                                key={`warehouse-crop-${crop.cropId}`}
                                                className={`rounded-2xl p-3 border transition-all flex items-center justify-between gap-2.5 ${
                                                    harvestQty > 0
                                                        ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                                                        : 'bg-slate-50/70 border-slate-200/80 opacity-75'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                                                        {crop.emoji}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-black text-slate-900 truncate">
                                                            {crop.name}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-500">
                                                            {harvestQty > 0
                                                                ? '싱싱하게 창고 보관 중 ✨'
                                                                : isLocked
                                                                  ? `🔒 Lv.${reqLv} 해금`
                                                                  : '아직 수확 전'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                                                        harvestQty > 0
                                                            ? 'bg-amber-500 text-white shadow-2xs'
                                                            : 'bg-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    {harvestQty}개
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        visibleSeeds.length === 0 &&
                        visibleFertilizers.length === 0 &&
                        filteredItems.length === 0 ? (
                            <div className="py-12 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                                <p className="text-xs sm:text-sm font-black text-slate-700">
                                    보유 중인 항목이 아직 없습니다.
                                </p>
                                <p className="text-[11px] text-slate-500 font-semibold">
                                    상점 탭에서 씨앗이나 비료, 아지트 아이템을 먼저 구매해 보세요.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5 min-w-0">
                                {/* 동적 씨앗 카탈로그 카드 (Lv 1~50 전체 12종) */}
                                {visibleSeeds.map((crop) => {
                                    const seedCount = garden.seedCounts[crop.cropId] || 0;
                                    const sPrice = crop.seedPrice ?? 0;
                                    const reqLv = crop.requiredAzitLevel ?? 1;
                                    const isLocked = azitLevel < reqLv;
                                    const canOne = !isLocked && !isActing && (sPrice === 0 || veraPoints >= sPrice);
                                    const canFive =
                                        !isLocked && !isActing && (sPrice === 0 || veraPoints >= sPrice * 5);
                                    return (
                                        <div
                                            key={`shop-seed-${crop.cropId}`}
                                            className={`rounded-2xl p-3 sm:p-3.5 border transition-all flex flex-col justify-between gap-2.5 sm:gap-3 min-w-0 ${
                                                isLocked
                                                    ? 'bg-slate-100/80 border-slate-200 opacity-75'
                                                    : seedCount > 0
                                                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                                                      : 'bg-slate-50/80 border-emerald-200/80 hover:border-emerald-400 hover:bg-white'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <span className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                                                            {crop.emoji}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-[13px] sm:text-xs font-black text-slate-900 leading-snug truncate">
                                                                {crop.name} 씨앗
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                                                GARDEN SEED · 판매 {crop.sellPrice}P
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0">
                                                        창고 {seedCount}개
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                                    {crop.description}
                                                </p>

                                                {reqLv > 1 && (
                                                    <div
                                                        className={`mt-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                                            isLocked
                                                                ? 'text-slate-700 bg-slate-200/80 border-slate-300'
                                                                : 'text-indigo-700 bg-indigo-50 border-indigo-200/70'
                                                        }`}
                                                    >
                                                        {isLocked
                                                            ? `🔒 아지트 Lv.${reqLv} 해금 (현재 Lv.${azitLevel})`
                                                            : `✨ 아지트 Lv.${reqLv} 해금 완료`}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 min-w-0">
                                                <span className="text-[12px] sm:text-xs font-black text-slate-800 flex items-center gap-1.5 min-w-0">
                                                    {sPrice === 0 ? (
                                                        <span className="text-emerald-600">0P (무료)</span>
                                                    ) : (
                                                        <span className="text-amber-600">🪙 {sPrice} P</span>
                                                    )}
                                                </span>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={!canOne}
                                                        onClick={() => onBuySeed?.(crop.cropId, 1)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        {isLocked
                                                            ? `🔒 Lv.${reqLv}`
                                                            : sPrice === 0
                                                              ? '+1 무료'
                                                              : `+1 (${sPrice}P)`}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!canFive}
                                                        onClick={() => onBuySeed?.(crop.cropId, 5)}
                                                        className="px-2 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title={
                                                            sPrice === 0 ? '5개 묶음 무료 구매' : `5개 묶음 (${sPrice * 5}P)`
                                                        }
                                                    >
                                                        +5
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* 동적 비료 카탈로그 카드 */}
                                {visibleFertilizers.map((fert) => {
                                    const fertCount = garden.fertilizerCounts?.[fert.fertilizerId] || 0;
                                    const reqLv = fert.requiredAzitLevel ?? 1;
                                    const isLocked = azitLevel < reqLv;
                                    const canOne =
                                        Boolean(onBuyFertilizer) &&
                                        !isLocked &&
                                        !isActing &&
                                        veraPoints >= fert.price;
                                    const canFive =
                                        Boolean(onBuyFertilizer) &&
                                        !isLocked &&
                                        !isActing &&
                                        veraPoints >= fert.price * 5;
                                    return (
                                        <div
                                            key={`shop-fert-${fert.fertilizerId}`}
                                            className={`rounded-2xl p-3 sm:p-3.5 border transition-all flex flex-col justify-between gap-2.5 sm:gap-3 min-w-0 ${
                                                fertCount > 0
                                                    ? 'bg-violet-50/50 border-violet-300 shadow-2xs'
                                                    : 'bg-slate-50/80 border-violet-200/80 hover:border-violet-400 hover:bg-white'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <span className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                                                            {fert.emoji}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-[13px] sm:text-xs font-black text-slate-900 leading-snug truncate">
                                                                {fert.name}
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-violet-600 block">
                                                                FERTILIZER · ⏳ -{fert.reductionHours}시간 단축
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-black shrink-0">
                                                        창고 {fertCount}개
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                                    {fert.description}
                                                </p>
                                            </div>

                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 min-w-0">
                                                <span className="text-[12px] sm:text-xs font-black text-amber-600">
                                                    🪙 {fert.price} P
                                                </span>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={!canOne}
                                                        onClick={() => onBuyFertilizer?.(fert.fertilizerId, 1)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        +1 ({fert.price}P)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!canFive}
                                                        onClick={() => onBuyFertilizer?.(fert.fertilizerId, 5)}
                                                        className="px-2 py-1.5 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title={`5개 묶음 (${fert.price * 5}P)`}
                                                    >
                                                        +5
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* 가구·벽지·바닥·소품·아바타 카탈로그 카드 */}
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
                                                            <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-2xs border shrink-0 bg-indigo-50 border-indigo-100">
                                                                {getCategoryEmoji(
                                                                    item.category,
                                                                    item.isTrophy,
                                                                    item.cropId
                                                                )}
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
                                                            <span className="text-emerald-600">0원 (무료)</span>
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
                        )
                    )}
                </div>

                {/* 모달 하단 액션 푸터 */}
                <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <span className="hidden sm:inline text-xs font-semibold text-slate-500">
                        💡 상점에서 구매한 씨앗과 수확한 작물은 [🏚️ 농장 창고]에 자동 보관됩니다.
                    </span>
                    <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[12px] sm:text-xs font-extrabold transition-colors cursor-pointer text-center"
                        >
                            창 닫기
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
