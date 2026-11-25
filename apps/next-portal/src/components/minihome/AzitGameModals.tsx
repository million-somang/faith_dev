'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type {
    AzitBattleReport,
    AzitChefCode,
    AzitCropId,
    AzitFarmerRole,
    AzitFullGameState,
    AzitMercCode,
    AzitRecipeId,
    AzitZoneId,
    UseAzitGameController,
} from '@/types/azit-game.types';
import { formatDurationCompact } from '@/types/azit-game.types';
import {
    getChefSpriteMeta,
    getFarmerGradeBadge,
    getFarmerRoleBadge,
    getFarmerVisualMeta,
    getMercSpriteMeta,
} from '@/data/azitCharacterAssets';

export type AzitModalKind = 'market' | 'farmers' | 'chefs' | 'mercs' | 'expedition' | null;

interface AzitGameModalsProps {
    activeModal: AzitModalKind;
    onCloseModal: () => void;
    gameState: AzitFullGameState;
    azitGame: UseAzitGameController;
    onGoToKitchen: () => void;
    onOpenMercModal: () => void;
}

function previewWinRate(params: {
    gameState: AzitFullGameState;
    zoneId: AzitZoneId;
    partyCodes: AzitMercCode[];
    dishRecipeId: AzitRecipeId | null;
}): { rawPower: number; effectivePower: number; winRatePct: number } {
    const { gameState, zoneId, partyCodes, dishRecipeId } = params;
    const zone = gameState.catalog.zones.find((z) => z.zoneId === zoneId);
    const recipe = dishRecipeId ? gameState.catalog.recipes.find((r) => r.recipeId === dishRecipeId) : undefined;
    if (!zone || partyCodes.length === 0) {
        return { rawPower: 0, effectivePower: 0, winRatePct: 25 };
    }

    let rawPower = 0;
    let partyWinBonus = 0;
    for (const code of partyCodes) {
        const owned = gameState.mercenaries.find((m) => m.mercCode === code);
        const def = gameState.catalog.mercenaries.find((m) => m.mercCode === code);
        if (owned) rawPower += owned.power;
        if (def) partyWinBonus += def.partyWinBonusPct;
    }

    if (!recipe) {
        const ratio = Math.round((rawPower / Math.max(1, zone.recommendedPower)) * 72);
        return {
            rawPower,
            effectivePower: rawPower,
            winRatePct: Math.max(25, Math.min(95, ratio + partyWinBonus)),
        };
    }

    const effectivePower = Math.round(rawPower * (1 + recipe.powerBonusPct / 100));
    const ratioScore = Math.round((effectivePower / Math.max(1, zone.recommendedPower)) * 72);
    const clampedBase = Math.max(25, Math.min(95, ratioScore));
    const totalRate = Math.max(25, Math.min(96, clampedBase + recipe.winRateBonusPct + partyWinBonus));
    return { rawPower, effectivePower, winRatePct: totalRate };
}

export const AzitGameModals: React.FC<AzitGameModalsProps> = ({
    activeModal,
    onCloseModal,
    gameState,
    azitGame,
    onGoToKitchen,
    onOpenMercModal,
}) => {
    const [marketTab, setMarketTab] = useState<'crops' | 'dishes' | 'ledger'>('crops');
    const [hideEmptyMarket, setHideEmptyMarket] = useState<boolean>(false);
    const [selectedZoneId, setSelectedZoneId] = useState<AzitZoneId>('zone-slime');
    const [selectedParty, setSelectedParty] = useState<AzitMercCode[]>([]);
    const [selectedDishId, setSelectedDishId] = useState<AzitRecipeId | null>(null);

    const idleMercs = useMemo(
        () => gameState.mercenaries.filter((m) => m.status === 'idle'),
        [gameState.mercenaries]
    );

    const selectedZone = useMemo(
        () => gameState.catalog.zones.find((z) => z.zoneId === selectedZoneId) || gameState.catalog.zones[0],
        [gameState.catalog.zones, selectedZoneId]
    );

    const eligibleDishes = useMemo(() => {
        if (!selectedZone) return [];
        return gameState.catalog.recipes.filter(
            (r) => r.tier >= selectedZone.minDishTier && (gameState.dishes[r.recipeId] || 0) > 0
        );
    }, [gameState.catalog.recipes, gameState.dishes, selectedZone]);

    useEffect(() => {
        if (activeModal !== 'expedition') return;
        const maxSize = gameState.profile.limits.maxPartySize;
        const autoParty = idleMercs.slice(0, maxSize).map((m) => m.mercCode);
        setSelectedParty(autoParty);
    }, [activeModal, idleMercs, gameState.profile.limits.maxPartySize]);

    useEffect(() => {
        if (activeModal !== 'expedition') return;
        if (eligibleDishes.length > 0) {
            if (!selectedDishId || !eligibleDishes.some((d) => d.recipeId === selectedDishId)) {
                setSelectedDishId(eligibleDishes[0].recipeId);
            }
        } else {
            setSelectedDishId(null);
        }
    }, [activeModal, eligibleDishes, selectedDishId]);

    const report: AzitBattleReport | null = azitGame.lastBattleReport;

    const previewStats = useMemo(
        () =>
            previewWinRate({
                gameState,
                zoneId: selectedZone.zoneId,
                partyCodes: selectedParty,
                dishRecipeId: selectedDishId,
            }),
        [gameState, selectedZone.zoneId, selectedParty, selectedDishId]
    );

    const togglePartyMember = (code: AzitMercCode) => {
        setSelectedParty((prev) => {
            if (prev.includes(code)) {
                return prev.filter((c) => c !== code);
            }
            if (prev.length >= gameState.profile.limits.maxPartySize) {
                return [...prev.slice(1), code];
            }
            return [...prev, code];
        });
    };

    const handleDispatchSubmit = async () => {
        if (!selectedDishId || selectedParty.length === 0) return;
        const ok = await azitGame.startExpedition(selectedZone.zoneId, selectedParty, selectedDishId);
        if (ok) {
            onCloseModal();
        }
    };

    return (
        <>
            {activeModal === 'market' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-4">
                    <div className="bg-white w-full max-w-3xl max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-50 to-amber-50">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900">
                                    💰 아지트 작물·요리 장터
                                </h3>
                                <p className="text-xs text-slate-600 font-semibold">
                                    보유 포인트: <span className="text-amber-700 font-black font-mono">{gameState.veraPoints.toLocaleString()} P</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-5 pt-3 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                            <button
                                type="button"
                                onClick={() => setMarketTab('crops')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                                    marketTab === 'crops'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                🧺 수확 작물 판매
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarketTab('dishes')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                                    marketTab === 'dishes'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                🍱 완성 요리 판매
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarketTab('ledger')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                                    marketTab === 'ledger'
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                📜 포인트 거래 내역
                            </button>

                            {marketTab !== 'ledger' && (
                                <button
                                    type="button"
                                    onClick={() => setHideEmptyMarket((prev) => !prev)}
                                    className={`ml-auto px-2.5 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer transition-colors ${
                                        hideEmptyMarket
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {hideEmptyMarket ? '✓ 0개 숨기기 ON' : '0개 숨기기'}
                                </button>
                            )}
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
                            {marketTab === 'crops' && (
                                <>
                                    <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
                                        💡 생작물을 바로 팔아 포인트를 얻거나, 주방에서 요리로 조리해 팔면 더 높은 수익을 얻을 수 있어요!
                                    </div>
                                    {(() => {
                                        const visibleCrops = hideEmptyMarket
                                            ? gameState.catalog.crops.filter(
                                                  (c) => (gameState.garden.harvestCounts[c.cropId as AzitCropId] || 0) > 0
                                              )
                                            : gameState.catalog.crops;
                                        if (visibleCrops.length === 0) {
                                            return (
                                                <div className="py-10 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                                                    보유 중인 수확 작물이 없습니다.
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {visibleCrops.map((crop) => {
                                                    const qty =
                                                        gameState.garden.harvestCounts[crop.cropId as AzitCropId] || 0;
                                                    return (
                                                        <div
                                                            key={`market-crop-${crop.cropId}`}
                                                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                                                qty > 0
                                                                    ? 'bg-emerald-50/60 border-emerald-300'
                                                                    : 'bg-slate-50 border-slate-200 opacity-75'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                                                                    {crop.emoji}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <span className="text-xs font-black text-slate-900 truncate">
                                                                            {crop.name} ({qty}개)
                                                                        </span>
                                                                        {crop.requiredAzitLevel > 1 && (
                                                                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-black shrink-0">
                                                                                Lv.{crop.requiredAzitLevel}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] font-extrabold text-amber-700">
                                                                        개당 +{crop.sellPrice}P
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    disabled={qty < 1 || azitGame.isActing}
                                                                    onClick={() => azitGame.sellCrop(crop.cropId, 1)}
                                                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                                >
                                                                    1개
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={qty < 1 || azitGame.isActing}
                                                                    onClick={() => azitGame.sellCrop(crop.cropId, qty)}
                                                                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                                >
                                                                    모두 ({qty * crop.sellPrice}P)
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </>
                            )}

                            {marketTab === 'dishes' &&
                                (() => {
                                    const visibleRecipes = hideEmptyMarket
                                        ? gameState.catalog.recipes.filter(
                                              (r) => (gameState.dishes[r.recipeId] || 0) > 0
                                          )
                                        : gameState.catalog.recipes;
                                    if (visibleRecipes.length === 0) {
                                        return (
                                            <div className="py-10 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                                                보유 중인 완성 요리가 없습니다.
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {visibleRecipes.map((recipe) => {
                                                const qty = gameState.dishes[recipe.recipeId] || 0;
                                                return (
                                                    <div
                                                        key={`market-dish-${recipe.recipeId}`}
                                                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                                            qty > 0
                                                                ? 'bg-orange-50/70 border-orange-300'
                                                                : 'bg-slate-50 border-slate-200 opacity-75'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-xl shrink-0">
                                                                {recipe.emoji}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span className="text-xs font-black text-slate-900 truncate">
                                                                        {recipe.name} ({qty}개)
                                                                    </span>
                                                                    {recipe.requiredAzitLevel > 1 && (
                                                                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-black shrink-0">
                                                                            Lv.{recipe.requiredAzitLevel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] font-extrabold text-amber-700">
                                                                    판매 +{recipe.sellPrice.toLocaleString()}P · 티어{recipe.tier}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                type="button"
                                                                disabled={qty < 1 || azitGame.isActing}
                                                                onClick={() => azitGame.sellDish(recipe.recipeId, 1)}
                                                                className="px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                1개
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={qty < 1 || azitGame.isActing}
                                                                onClick={() => azitGame.sellDish(recipe.recipeId, qty)}
                                                                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                모두
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                            {marketTab === 'ledger' && (
                                gameState.recentLedger.length === 0 ? (
                                    <div className="py-10 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                                        아직 아지트 포인트 거래 내역이 없습니다.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {gameState.recentLedger.map((item) => (
                                            <div
                                                key={`ledger-row-${item.id}`}
                                                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 truncate">
                                                        {item.description}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {item.createdAt}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 font-mono">
                                                    <div
                                                        className={`font-black ${
                                                            item.deltaPoints >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}
                                                    >
                                                        {item.deltaPoints >= 0 ? '+' : ''}
                                                        {item.deltaPoints.toLocaleString()}P
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        잔액 {item.balanceAfter.toLocaleString()}P
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'farmers' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900">
                                    👨‍🌾 아지트 농부 길드 &amp; 자동화
                                </h3>
                                <p className="text-xs text-slate-600 font-semibold">
                                    고용 한도 {gameState.farmers.length}/{gameState.profile.limits.maxFarmers}명 · 보유{' '}
                                    <span className="text-amber-700 font-black font-mono">
                                        {gameState.veraPoints.toLocaleString()} P
                                    </span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
                            {gameState.profile.azitLevel < 20 && (
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0">
                                        🔒
                                    </span>
                                    <div className="space-y-0.5">
                                        <div className="text-xs sm:text-sm font-black text-amber-950">
                                            🔒 아지트 Lv.20 달성 시 농부 고용 해금 — 현재 Lv.{gameState.profile.azitLevel}
                                        </div>
                                        <p className="text-[11px] font-semibold text-amber-800">
                                            아지트 레벨이 20에 도달하면 전담 농부를 고용하여 물주기·수확·심기·비료 자동화를 맡길 수 있습니다.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {gameState.catalog.farmers.length === 0 ? (
                                <div className="py-10 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                                    고용 가능한 농부 정보가 없습니다.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {gameState.catalog.farmers.map((farmerDef) => {
                                        const owned = gameState.farmers.find(
                                            (f) => f.farmerCode === farmerDef.farmerCode
                                        );
                                        const visual = getFarmerVisualMeta(farmerDef.farmerCode, owned?.grade ?? 1);
                                        const isGuildLocked = gameState.profile.azitLevel < 20;
                                        const levelLocked =
                                            isGuildLocked || gameState.profile.azitLevel < farmerDef.requiredAzitLevel;
                                        const slotsFull =
                                            !owned && gameState.farmers.length >= gameState.profile.limits.maxFarmers;
                                        const gradeBadge = owned ? getFarmerGradeBadge(owned.grade) : null;
                                        const xpPct =
                                            owned && owned.nextLevelXp
                                                ? Math.min(100, Math.round((owned.xp / Math.max(1, owned.nextLevelXp)) * 100))
                                                : 100;
                                        const allRoles: Array<{ role: AzitFarmerRole; unlockLv: number }> = [
                                            { role: 'water', unlockLv: 1 },
                                            { role: 'harvest', unlockLv: 5 },
                                            { role: 'plant', unlockLv: 10 },
                                            { role: 'fertilize', unlockLv: 15 },
                                        ];

                                        return (
                                            <div
                                                key={`guild-farmer-${farmerDef.farmerCode}`}
                                                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                                                    owned
                                                        ? 'bg-emerald-50/70 border-emerald-300'
                                                        : 'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div
                                                                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl shadow-2xs shrink-0 ${
                                                                    levelLocked && !owned ? 'grayscale opacity-65' : ''
                                                                }`}
                                                                style={{
                                                                    backgroundColor: `${visual.outfitColor}18`,
                                                                    borderColor: visual.accentRingColor,
                                                                }}
                                                            >
                                                                <span>{visual.emoji}</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-sm font-black text-slate-900">
                                                                        {farmerDef.name}
                                                                    </span>
                                                                    {owned && (
                                                                        <span className="text-xs font-black text-emerald-700">
                                                                            Lv.{owned.level}/{farmerDef.maxLevel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] font-bold text-slate-500">
                                                                    {farmerDef.title || '전담 농부'}
                                                                </div>
                                                                {gradeBadge && (
                                                                    <span
                                                                        className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${gradeBadge.bgClass} ${gradeBadge.textClass} ${gradeBadge.borderClass}`}
                                                                    >
                                                                        {gradeBadge.emoji} {gradeBadge.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black shrink-0">
                                                            해금 Lv.{farmerDef.requiredAzitLevel}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                                        {farmerDef.description}
                                                    </p>

                                                    {owned && (
                                                        <>
                                                            <div className="flex flex-wrap gap-1.5 text-[10px] font-extrabold">
                                                                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                                                                    ⏱ 주기 {Math.round(owned.workIntervalMs / 1000)}초
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                                                    💧 물쿨감 -{owned.waterCooldownReductionPct}%
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                                                                    물 {owned.totalWatered} · 수확 {owned.totalHarvested} · 심기 {owned.totalPlanted}
                                                                </span>
                                                            </div>

                                                            {/* 작업 역할 범위 */}
                                                            <div className="flex flex-wrap gap-1">
                                                                {allRoles.map(({ role, unlockLv }) => {
                                                                    const meta = getFarmerRoleBadge(role);
                                                                    const active = owned.roles.includes(role);
                                                                    return (
                                                                        <span
                                                                            key={`farmer-role-${owned.farmerCode}-${role}`}
                                                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                                                                active
                                                                                    ? `${meta.bgClass} ${meta.textClass} border-current/20`
                                                                                    : 'bg-slate-100 text-slate-400 border-slate-200 opacity-70'
                                                                            }`}
                                                                        >
                                                                            {meta.emoji} {meta.label}
                                                                            {!active ? ` (Lv.${unlockLv})` : ''}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* XP 바 */}
                                                            <div className="space-y-0.5">
                                                                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                                    <span>농부 숙련도 EXP</span>
                                                                    <span>
                                                                        {owned.nextLevelXp !== null
                                                                            ? `${owned.xp}/${owned.nextLevelXp}`
                                                                            : `${owned.xp} (MAX)`}
                                                                    </span>
                                                                </div>
                                                                <svg viewBox="0 0 100 6" className="w-full h-1.5" aria-hidden="true">
                                                                    <rect x="0" y="0" width="100" height="6" rx="3" fill="#e2e8f0" />
                                                                    <rect x="0" y="0" width={xpPct} height="6" rx="3" fill="#10b981" />
                                                                </svg>
                                                            </div>

                                                            {/* 자동화 설정 */}
                                                            <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-2">
                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                    <button
                                                                        type="button"
                                                                        disabled={azitGame.isActing}
                                                                        onClick={() =>
                                                                            azitGame.configureFarmer({
                                                                                farmerCode: owned.farmerCode,
                                                                                autoEnabled: !owned.autoEnabled,
                                                                            })
                                                                        }
                                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors disabled:opacity-50 ${
                                                                            owned.autoEnabled
                                                                                ? 'bg-emerald-600 text-white'
                                                                                : 'bg-slate-200 text-slate-700'
                                                                        }`}
                                                                    >
                                                                        {owned.autoEnabled ? '⚡ 자동 작업 ON' : '⏸️ 자동 작업 OFF'}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            azitGame.isActing ||
                                                                            !owned.roles.includes('fertilize')
                                                                        }
                                                                        onClick={() =>
                                                                            azitGame.configureFarmer({
                                                                                farmerCode: owned.farmerCode,
                                                                                autoFertilize: !owned.autoFertilize,
                                                                            })
                                                                        }
                                                                        title={
                                                                            owned.roles.includes('fertilize')
                                                                                ? '보유 비료 자동 사용 토글'
                                                                                : '농부 Lv.15 (마스터 농부) 달성 시 해금'
                                                                        }
                                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                                                                            owned.autoFertilize && owned.roles.includes('fertilize')
                                                                                ? 'bg-violet-600 text-white cursor-pointer'
                                                                                : 'bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer'
                                                                        }`}
                                                                    >
                                                                        {owned.roles.includes('fertilize')
                                                                            ? owned.autoFertilize
                                                                                ? '🧪 자동 비료 ON'
                                                                                : '🧪 자동 비료 OFF'
                                                                            : '🔒 자동 비료 (Lv.15)'}
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center justify-between gap-2">
                                                                    <label
                                                                        htmlFor={`preferred-crop-${owned.farmerCode}`}
                                                                        className="text-[11px] font-bold text-slate-600 shrink-0"
                                                                    >
                                                                        선호 자동 심기
                                                                    </label>
                                                                    <select
                                                                        id={`preferred-crop-${owned.farmerCode}`}
                                                                        value={owned.preferredCropId ?? ''}
                                                                        disabled={azitGame.isActing}
                                                                        onChange={(e) =>
                                                                            azitGame.configureFarmer({
                                                                                farmerCode: owned.farmerCode,
                                                                                preferredCropId: e.target.value
                                                                                    ? (e.target.value as AzitCropId)
                                                                                    : null,
                                                                            })
                                                                        }
                                                                        className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-800"
                                                                    >
                                                                        <option value="">보유 씨앗 자동 선택</option>
                                                                        {gameState.catalog.crops.map((crop) => {
                                                                            const cropLocked =
                                                                                gameState.profile.azitLevel <
                                                                                crop.requiredAzitLevel;
                                                                            return (
                                                                                <option
                                                                                    key={`opt-crop-${crop.cropId}`}
                                                                                    value={crop.cropId}
                                                                                    disabled={cropLocked}
                                                                                >
                                                                                    {crop.emoji} {crop.shortName}
                                                                                    {cropLocked
                                                                                        ? ` (🔒 Lv.${crop.requiredAzitLevel})`
                                                                                        : ''}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t border-slate-200/70">
                                                    {owned ? (
                                                        owned.upgradeCost !== null ? (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    gameState.veraPoints < owned.upgradeCost ||
                                                                    azitGame.isActing
                                                                }
                                                                onClick={() => azitGame.upgradeFarmer(owned.farmerCode)}
                                                                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                            >
                                                                ✨ 농부 육성 ({owned.upgradeCost.toLocaleString()}P)
                                                            </button>
                                                        ) : (
                                                            <div className="w-full py-2 rounded-xl bg-emerald-100 text-emerald-800 text-center text-xs font-black">
                                                                최고 등급 달성 (MAX)
                                                            </div>
                                                        )
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                levelLocked ||
                                                                slotsFull ||
                                                                gameState.veraPoints < farmerDef.hireCost ||
                                                                azitGame.isActing
                                                            }
                                                            onClick={() => azitGame.hireFarmer(farmerDef.farmerCode)}
                                                            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                        >
                                                            {isGuildLocked
                                                                ? '🔒 아지트 Lv.20 필요'
                                                                : levelLocked
                                                                  ? `🔒 아지트 Lv.${farmerDef.requiredAzitLevel} 필요`
                                                                  : slotsFull
                                                                    ? '고용 한도 초과 (아지트 레벨업 필요)'
                                                                    : gameState.veraPoints < farmerDef.hireCost
                                                                      ? `포인트 부족 (${farmerDef.hireCost.toLocaleString()}P 필요)`
                                                                      : `고용하기 (${farmerDef.hireCost.toLocaleString()}P)`}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* 농부 자동화 작업 기록 */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                    📋 농부 자동화 작업 기록
                                </h4>
                                {gameState.farmerLogs.length === 0 ? (
                                    <div className="py-6 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                                        아직 농부가 수행한 작업 기록이 없습니다.
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                        {gameState.farmerLogs.map((log) => {
                                            const roleMeta = getFarmerRoleBadge(log.actionType);
                                            const farmerMeta = gameState.catalog.farmers.find(
                                                (f) => f.farmerCode === log.farmerCode
                                            );
                                            return (
                                                <div
                                                    key={`farmer-log-${log.id}`}
                                                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${roleMeta.bgClass} ${roleMeta.textClass}`}
                                                        >
                                                            {roleMeta.emoji} {roleMeta.label}
                                                        </span>
                                                        <span className="font-bold text-slate-800 truncate">
                                                            [{farmerMeta?.name || log.farmerCode}] #{log.plotIndex + 1} · {log.detail}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                        {log.createdAt}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'chefs' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-4">
                    <div className="bg-white w-full max-w-3xl max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-orange-50 to-amber-50">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900">
                                    👨‍🍳 아지트 요리사 길드
                                </h3>
                                <p className="text-xs text-slate-600 font-semibold">
                                    고용 한도 {gameState.chefs.length}/{gameState.profile.limits.maxChefs}명 · 보유{' '}
                                    <span className="text-amber-700 font-black font-mono">
                                        {gameState.veraPoints.toLocaleString()} P
                                    </span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {gameState.catalog.chefs.map((chef) => {
                                const owned = gameState.chefs.find((c) => c.chefCode === chef.chefCode);
                                const levelLocked = gameState.profile.azitLevel < chef.requiredAzitLevel;
                                const slotsFull = !owned && gameState.chefs.length >= gameState.profile.limits.maxChefs;
                                return (
                                    <div
                                        key={`guild-chef-${chef.chefCode}`}
                                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                                            owned
                                                ? 'bg-orange-50/70 border-orange-300'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-orange-50 to-white border border-orange-200 shadow-2xs p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                                        <img
                                                            src={getChefSpriteMeta(chef.chefCode).spriteUrl}
                                                            alt={chef.name}
                                                            className={`w-full h-full object-contain ${levelLocked && !owned ? 'grayscale opacity-65' : ''}`}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900">
                                                            {chef.name}{' '}
                                                            {owned && (
                                                                <span className="text-orange-600">Lv.{owned.level}</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-slate-500">
                                                            {chef.title}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                                                    해금 Lv.{chef.requiredAzitLevel}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                {chef.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 text-[10px] font-extrabold">
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                                    조리 단축 -{owned ? owned.speedBonusPct : chef.baseSpeedBonusPct}%
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                                    2배 대성공 {owned ? owned.greatChancePct : chef.baseGreatChancePct}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/70">
                                            {owned ? (
                                                owned.upgradeCost !== null ? (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            gameState.veraPoints < owned.upgradeCost || azitGame.isActing
                                                        }
                                                        onClick={() => azitGame.upgradeChef(owned.chefCode as AzitChefCode)}
                                                        className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                    >
                                                        ✨ 승급 강화 ({owned.upgradeCost.toLocaleString()}P)
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2 rounded-xl bg-emerald-100 text-emerald-800 text-center text-xs font-black">
                                                        최고 등급 달성 (MAX)
                                                    </div>
                                                )
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={
                                                        levelLocked ||
                                                        slotsFull ||
                                                        gameState.veraPoints < chef.hireCost ||
                                                        azitGame.isActing
                                                    }
                                                    onClick={() => azitGame.hireChef(chef.chefCode)}
                                                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                >
                                                    {levelLocked
                                                        ? `🔒 아지트 Lv.${chef.requiredAzitLevel} 필요`
                                                        : slotsFull
                                                          ? '고용 한도 초과 (아지트 레벨업 필요)'
                                                          : gameState.veraPoints < chef.hireCost
                                                            ? `포인트 부족 (${chef.hireCost.toLocaleString()}P 필요)`
                                                            : `고용하기 (${chef.hireCost.toLocaleString()}P)`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'mercs' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-50 to-violet-50">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900">
                                    🛡️ 용병 영입 &amp; 훈련 길드
                                </h3>
                                <p className="text-xs text-slate-600 font-semibold">
                                    보유 용병 {gameState.mercenaries.length}/{gameState.profile.limits.maxMercs}명 · 파티 정원{' '}
                                    {gameState.profile.limits.maxPartySize}명 · 보유{' '}
                                    <span className="text-amber-700 font-black font-mono">
                                        {gameState.veraPoints.toLocaleString()} P
                                    </span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {gameState.catalog.mercenaries.map((merc) => {
                                const owned = gameState.mercenaries.find((m) => m.mercCode === merc.mercCode);
                                const levelLocked = gameState.profile.azitLevel < merc.requiredAzitLevel;
                                const slotsFull =
                                    !owned && gameState.mercenaries.length >= gameState.profile.limits.maxMercs;
                                const xpPct = owned
                                    ? Math.min(100, Math.round((owned.xp / Math.max(1, owned.nextXp)) * 100))
                                    : 0;

                                return (
                                    <div
                                        key={`guild-merc-${merc.mercCode}`}
                                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                                            owned
                                                ? 'bg-indigo-50/70 border-indigo-300'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-200 shadow-2xs p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                                        <img
                                                            src={getMercSpriteMeta(merc.mercCode).spriteUrl}
                                                            alt={merc.name}
                                                            className={`w-full h-full object-contain ${levelLocked && !owned ? 'grayscale opacity-65' : ''}`}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900">
                                                            {merc.name}{' '}
                                                            {owned && (
                                                                <span className="text-indigo-600">Lv.{owned.level}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                                            {merc.role}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                                                    해금 Lv.{merc.requiredAzitLevel}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                {merc.description}
                                            </p>

                                            <div className="flex flex-wrap gap-1 text-[10px] font-black">
                                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                                    ⚔️ 전투력 {owned ? owned.power : merc.basePower}
                                                </span>
                                                {merc.partyWinBonusPct > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                                        승률 +{merc.partyWinBonusPct}%
                                                    </span>
                                                )}
                                                {merc.bossRewardBonusPct > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                                        보스 전리품 +{merc.bossRewardBonusPct}%
                                                    </span>
                                                )}
                                            </div>

                                            {owned && (
                                                <div className="pt-1 space-y-0.5">
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                        <span>경험치</span>
                                                        <span>
                                                            {owned.xp}/{owned.nextXp}
                                                        </span>
                                                    </div>
                                                    <svg viewBox="0 0 100 6" className="w-full h-1.5" aria-hidden="true">
                                                        <rect x="0" y="0" width="100" height="6" rx="3" fill="#e2e8f0" />
                                                        <rect x="0" y="0" width={xpPct} height="6" rx="3" fill="#6366f1" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/70">
                                            {owned ? (
                                                owned.status === 'expedition' ? (
                                                    <div className="w-full py-2 rounded-xl bg-violet-100 text-violet-800 text-center text-xs font-black">
                                                        ⚔️ 현재 원정 출정 중
                                                    </div>
                                                ) : owned.upgradeCost !== null ? (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            gameState.veraPoints < owned.upgradeCost || azitGame.isActing
                                                        }
                                                        onClick={() =>
                                                            azitGame.upgradeMercenary(owned.mercCode as AzitMercCode)
                                                        }
                                                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                    >
                                                        💪 훈련 강화 ({owned.upgradeCost.toLocaleString()}P)
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2 rounded-xl bg-emerald-100 text-emerald-800 text-center text-xs font-black">
                                                        전설 등급 도달 (MAX)
                                                    </div>
                                                )
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={
                                                        levelLocked ||
                                                        slotsFull ||
                                                        gameState.veraPoints < merc.hireCost ||
                                                        azitGame.isActing
                                                    }
                                                    onClick={() => azitGame.hireMercenary(merc.mercCode)}
                                                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                >
                                                    {levelLocked
                                                        ? `🔒 아지트 Lv.${merc.requiredAzitLevel} 필요`
                                                        : slotsFull
                                                          ? '영입 한도 초과'
                                                          : gameState.veraPoints < merc.hireCost
                                                            ? `포인트 부족 (${merc.hireCost.toLocaleString()}P)`
                                                            : `영입하기 (${merc.hireCost.toLocaleString()}P)`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'expedition' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-rose-50 to-indigo-50">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900">
                                    ⚔️ 몬스터 토벌 원정 편성
                                </h3>
                                <p className="text-xs text-slate-600 font-semibold">
                                    요리 도시락은 필수 보급품입니다 · 패배 시 출정비 및 도시락이 소실되니 승률을 확인하세요!
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                            {/* 1단계: 토벌 지역 선택 */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-slate-800">1. 토벌 지역 선택</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {gameState.catalog.zones.map((zone) => {
                                        const isPicked = selectedZone.zoneId === zone.zoneId;
                                        const locked = gameState.profile.azitLevel < zone.requiredAzitLevel;
                                        const mat = gameState.catalog.materials.find(
                                            (m) => m.materialId === zone.dropMaterialId
                                        );
                                        return (
                                            <button
                                                key={`pick-zone-${zone.zoneId}`}
                                                type="button"
                                                disabled={locked}
                                                onClick={() => setSelectedZoneId(zone.zoneId)}
                                                className={`p-3 rounded-2xl border text-left transition-all ${
                                                    locked
                                                        ? 'bg-slate-100 border-slate-200 opacity-55 cursor-not-allowed'
                                                        : isPicked
                                                          ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200 cursor-pointer'
                                                          : 'bg-white border-slate-200 hover:border-indigo-300 cursor-pointer'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-xs font-black text-slate-900 truncate">
                                                        {zone.emoji} {zone.name}
                                                    </span>
                                                    {zone.isBoss && (
                                                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black shrink-0">
                                                            BOSS
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-1">
                                                    {locked
                                                        ? `🔒 아지트 Lv.${zone.requiredAzitLevel} 해금`
                                                        : `⏱ ${formatDurationCompact(zone.durationSec)} · 출정 ${zone.entryCost}P · 권장 전투력 ${zone.recommendedPower}`}
                                                </div>
                                                <div className="text-[10px] font-bold text-emerald-700 mt-1">
                                                    승리 +{zone.rewardPoints}P · {mat?.emoji} {mat?.name} · 티어{zone.minDishTier}+ 도시락
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2단계: 출전 용병 선택 */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-800">
                                        2. 출전 용병 선택 ({selectedParty.length}/{gameState.profile.limits.maxPartySize}명)
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onCloseModal();
                                            onOpenMercModal();
                                        }}
                                        className="text-[11px] font-black text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        + 용병 추가 영입·훈련 →
                                    </button>
                                </div>

                                {idleMercs.length === 0 ? (
                                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center space-y-2">
                                        <p className="text-xs font-bold text-indigo-900">
                                            출정 가능한 대기 중 용병이 없습니다.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onCloseModal();
                                                onOpenMercModal();
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer"
                                        >
                                            🛡️ 용병 길드에서 용병 영입하기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {idleMercs.map((merc) => {
                                            const def = gameState.catalog.mercenaries.find(
                                                (m) => m.mercCode === merc.mercCode
                                            );
                                            const checked = selectedParty.includes(merc.mercCode);
                                            return (
                                                <button
                                                    key={`pick-party-${merc.mercCode}`}
                                                    type="button"
                                                    onClick={() => togglePartyMember(merc.mercCode)}
                                                    className={`px-3 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                                        checked
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <img
                                                        src={getMercSpriteMeta(merc.mercCode).spriteUrl}
                                                        alt={def?.name || merc.mercCode}
                                                        className="w-7 h-7 rounded-lg bg-white/95 p-0.5 object-contain shrink-0"
                                                    />
                                                    <span>
                                                        {def?.name} Lv.{merc.level}
                                                    </span>
                                                    <span className="text-[10px] opacity-85">⚔️{merc.power}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* 3단계: 필수 원정 도시락 선택 */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-slate-800">
                                    3. 필수 보급 도시락 선택 (티어 {selectedZone.minDishTier} 이상 필요)
                                </h4>
                                {eligibleDishes.length === 0 ? (
                                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-center space-y-2">
                                        <p className="text-xs font-bold text-orange-900">
                                            출정 조건(티어 {selectedZone.minDishTier}+)을 만족하는 보유 도시락이 없습니다!
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onCloseModal();
                                                onGoToKitchen();
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black cursor-pointer"
                                        >
                                            👨‍🍳 주방에서 도시락 조리하기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {eligibleDishes.map((dish) => {
                                            const qty = gameState.dishes[dish.recipeId] || 0;
                                            const picked = selectedDishId === dish.recipeId;
                                            return (
                                                <button
                                                    key={`pick-dish-${dish.recipeId}`}
                                                    type="button"
                                                    onClick={() => setSelectedDishId(dish.recipeId)}
                                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                                        picked
                                                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200'
                                                            : 'bg-white border-slate-200 hover:border-orange-300'
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-black text-slate-900 truncate">
                                                            {dish.emoji} {dish.name} (보유 {qty}개)
                                                        </div>
                                                        <div className="text-[10px] font-bold text-emerald-700">
                                                            전투력 +{dish.powerBonusPct}% · 승률 +{dish.winRateBonusPct}%
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black shrink-0">
                                                        티어{dish.tier}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs space-y-0.5">
                                <div className="font-black text-slate-900">
                                    파티 유효 전투력{' '}
                                    <span className="text-indigo-600">{previewStats.effectivePower.toLocaleString()}</span> /
                                    권장 {selectedZone.recommendedPower.toLocaleString()} ·{' '}
                                    <span className="text-emerald-600">예상 승률 {previewStats.winRatePct}%</span>
                                </div>
                                <div className="text-[11px] font-bold text-rose-600">
                                    ⚠️ 출정비 {selectedZone.entryCost}P · 도시락 1개 소모 (패배 시 복구 불가)
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    selectedParty.length === 0 ||
                                    !selectedDishId ||
                                    gameState.veraPoints < selectedZone.entryCost ||
                                    azitGame.isActing
                                }
                                onClick={handleDispatchSubmit}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {azitGame.isActing ? '출정 준비 중...' : '⚔️ 원정 출정 확정'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 원정 정산 전투 결과 리포트 모달 */}
            {report && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div
                            className={`px-5 py-4 border-b flex items-center justify-between ${
                                report.won
                                    ? 'bg-gradient-to-r from-amber-50 to-emerald-50 border-emerald-200'
                                    : 'bg-gradient-to-r from-rose-50 to-slate-100 border-rose-200'
                            }`}
                        >
                            <div>
                                <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                                    {report.zoneEmoji} {report.zoneName} · 예상 승률 {report.predictedWinRate}%
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                                    {report.won ? '🏆 몬스터 토벌 대성공!' : '💔 원정 토벌 실패...'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={azitGame.clearBattleReport}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5 bg-slate-900 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed">
                                {report.battleLog.map((line, i) => (
                                    <p key={`battle-log-${i}`}>{line}</p>
                                ))}
                            </div>

                            {report.won ? (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                                        <div className="text-[10px] font-bold text-amber-700">전리품 포인트</div>
                                        <div className="text-sm font-black text-amber-900 font-mono">
                                            +{report.rewardPoints.toLocaleString()}P
                                        </div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                                        <div className="text-[10px] font-bold text-emerald-700">아지트 EXP</div>
                                        <div className="text-sm font-black text-emerald-900 font-mono">
                                            +{report.rewardXp}
                                        </div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200">
                                        <div className="text-[10px] font-bold text-violet-700">희귀 재료</div>
                                        <div className="text-xs font-black text-violet-900">
                                            {Object.entries(report.rewardMaterials)
                                                .map(([matId, q]) => {
                                                    const mDef = gameState.catalog.materials.find(
                                                        (m) => m.materialId === matId
                                                    );
                                                    return `${mDef?.emoji || '🎁'} ×${q ?? 0}`;
                                                })
                                                .join(', ')}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
                                    소실 내역: 출정비 {report.entryCostLost.toLocaleString()}P 및 보급 도시락 1개 소진
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={azitGame.clearBattleReport}
                                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer"
                            >
                                확인 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
