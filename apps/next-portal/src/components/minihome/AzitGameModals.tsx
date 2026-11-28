'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
    AzitBattleReport,
    AzitChefCode,
    AzitCropId,
    AzitDishEffectiveBuffs,
    AzitDishQuality,
    AzitExpeditionZoneItem,
    AzitFarmerRole,
    AzitFullGameState,
    AzitItemId,
    AzitMaterialId,
    AzitMercCode,
    AzitMercenaryGroupRecord,
    AzitRecipeCatalogItem,
    AzitRecipeId,
    AzitZoneId,
    UseAzitGameController,
} from '@/types/azit-game.types';
import {
    formatDurationCompact,
    getDishEffectiveBuffs,
    getDishSellPrice,
    MAX_SKILL_LEVEL,
} from '@/types/azit-game.types';
import {
    getChefSpriteMeta,
    getFarmerGradeBadge,
    getFarmerRoleBadge,
    getFarmerVisualMeta,
    getItemVisualMeta,
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

function resolveMercSpriteUrl(mercCode: AzitMercCode): string {
    return (
        (getMercSpriteMeta(mercCode) ?? getMercSpriteMeta('merc-leo'))?.spriteUrl ??
        '/images/minihome/azit/merc-leo.png'
    );
}

interface EligibleDishOption {
    recipe: AzitRecipeCatalogItem;
    quality: AzitDishQuality;
    qty: number;
    buffs: AzitDishEffectiveBuffs;
}

function previewWinRate(params: {
    gameState: AzitFullGameState;
    zoneId: AzitZoneId;
    partyCodes: AzitMercCode[];
    dishRecipeId: AzitRecipeId | null;
    dishQuality: AzitDishQuality;
}): {
    rawPower: number;
    effectivePower: number;
    winRatePct: number;
    maxWinRateCap: number;
    effectiveDurationSec: number;
    buffs: AzitDishEffectiveBuffs | null;
} {
    const { gameState, zoneId, partyCodes, dishRecipeId, dishQuality } = params;
    const zone = gameState.catalog.zones.find((z) => z.zoneId === zoneId);
    const recipe = dishRecipeId
        ? gameState.catalog.recipes.find((r) => r.recipeId === dishRecipeId)
        : undefined;
    if (!zone || partyCodes.length === 0) {
        return {
            rawPower: 0,
            effectivePower: 0,
            winRatePct: 25,
            maxWinRateCap: 92,
            effectiveDurationSec: zone?.durationSec ?? 0,
            buffs: null,
        };
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
            winRatePct: Math.max(25, Math.min(92, ratio + partyWinBonus)),
            maxWinRateCap: 92,
            effectiveDurationSec: zone.durationSec,
            buffs: null,
        };
    }

    const buffs = getDishEffectiveBuffs(recipe, dishQuality);
    const effectivePower = Math.round(rawPower * (1 + buffs.powerBonusPct / 100));
    const ratioScore = Math.round((effectivePower / Math.max(1, zone.recommendedPower)) * 72);
    const clampedBase = Math.max(25, Math.min(buffs.maxWinRateCap, ratioScore));
    const totalRate = Math.max(
        25,
        Math.min(buffs.maxWinRateCap, clampedBase + buffs.winRateBonusPct + partyWinBonus)
    );
    const effectiveDurationSec = Math.max(
        3600,
        Math.min(
            28800,
            Math.round(zone.durationSec * (1 - buffs.expeditionSpeedBonusPct / 100))
        )
    );
    return {
        rawPower,
        effectivePower,
        winRatePct: totalRate,
        maxWinRateCap: buffs.maxWinRateCap,
        effectiveDurationSec,
        buffs,
    };
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
    const [mercModalTab, setMercModalTab] = useState<'roster' | 'groups' | 'shop_craft'>('roster');
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [groupNameInput, setGroupNameInput] = useState<string>('');
    const [groupMercCodes, setGroupMercCodes] = useState<AzitMercCode[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<AzitZoneId>('zone-slime');
    const [selectedParty, setSelectedParty] = useState<AzitMercCode[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [useElixir, setUseElixir] = useState<boolean>(false);
    const [selectedDish, setSelectedDish] = useState<{
        recipeId: AzitRecipeId;
        quality: AzitDishQuality;
    } | null>(null);

    const idleMercs = useMemo(
        () => gameState.mercenaries.filter((m) => m.status === 'idle'),
        [gameState.mercenaries]
    );
    const itemQtyMap = useMemo(() => {
        const map = new Map<AzitItemId, number>();
        for (const entry of gameState.items ?? []) {
            map.set(entry.itemId, entry.qty);
        }
        return map;
    }, [gameState.items]);
    const savedGroups = useMemo(() => gameState.groups ?? [], [gameState.groups]);
    const activeGroupIds = useMemo(
        () =>
            new Set(
                gameState.activeExpeditions
                    .map((e) => e.groupId)
                    .filter((gid): gid is number => typeof gid === 'number')
            ),
        [gameState.activeExpeditions]
    );
    const elixirQty = itemQtyMap.get('item-battle-elixir') ?? 0;

    const selectedZone = useMemo<AzitExpeditionZoneItem | undefined>(
        () => gameState.catalog.zones.find((z) => z.zoneId === selectedZoneId) ?? gameState.catalog.zones[0],
        [gameState.catalog.zones, selectedZoneId]
    );

    const eligibleDishes = useMemo<EligibleDishOption[]>(() => {
        if (!selectedZone) return [];
        const options: EligibleDishOption[] = [];
        const specialDishes = gameState.specialDishes ?? ({} as Record<AzitRecipeId, number>);
        for (const recipe of gameState.catalog.recipes) {
            if (recipe.tier < selectedZone.minDishTier) continue;
            const specialQty = specialDishes[recipe.recipeId] || 0;
            if (specialQty > 0) {
                options.push({
                    recipe,
                    quality: 'special',
                    qty: specialQty,
                    buffs: getDishEffectiveBuffs(recipe, 'special'),
                });
            }
            const normalQty = gameState.dishes[recipe.recipeId] || 0;
            if (normalQty > 0) {
                options.push({
                    recipe,
                    quality: 'normal',
                    qty: normalQty,
                    buffs: getDishEffectiveBuffs(recipe, 'normal'),
                });
            }
        }
        return options;
    }, [gameState.catalog.recipes, gameState.dishes, gameState.specialDishes, selectedZone]);

    const prevActiveModalRef = useRef<AzitModalKind>(null);

    // Initialize expedition party, group selection, and elixir ONLY when modal transitions into 'expedition'
    useEffect(() => {
        const wasExpeditionOpen = prevActiveModalRef.current === 'expedition';
        prevActiveModalRef.current = activeModal;
        if (activeModal === 'expedition' && !wasExpeditionOpen) {
            const maxSize = gameState.profile.limits.maxPartySize;
            const autoParty = idleMercs.slice(0, maxSize).map((m) => m.mercCode);
            setSelectedParty(autoParty);
            setSelectedGroupId(null);
            setUseElixir(false);
        }
    }, [activeModal, idleMercs, gameState.profile.limits.maxPartySize]);

    // Prune non-idle/dead/busy mercenaries while open without auto-refilling an empty manual selection
    useEffect(() => {
        if (activeModal !== 'expedition') return;
        const maxSize = gameState.profile.limits.maxPartySize;
        const idleSet = new Set(idleMercs.map((m) => m.mercCode));
        setSelectedParty((prev) => {
            const validPrev = prev.filter((code) => idleSet.has(code)).slice(0, maxSize);
            if (prev.length === validPrev.length && prev.every((c, idx) => c === validPrev[idx])) {
                return prev;
            }
            return validPrev;
        });
    }, [activeModal, idleMercs, gameState.profile.limits.maxPartySize]);

    // Clear selectedGroupId if the picked group was deleted, became empty, or contains non-idle mercenaries
    useEffect(() => {
        if (activeModal !== 'expedition' || selectedGroupId === null) return;
        const maxSize = gameState.profile.limits.maxPartySize;
        const idleSet = new Set(idleMercs.map((m) => m.mercCode));
        const pickedGroup = savedGroups.find((g) => g.id === selectedGroupId);
        const stillValid =
            Boolean(pickedGroup) &&
            pickedGroup!.mercCodes.length > 0 &&
            pickedGroup!.mercCodes.length <= maxSize &&
            pickedGroup!.mercCodes.every((code) => idleSet.has(code));
        if (!stillValid) {
            setSelectedGroupId(null);
        }
    }, [activeModal, selectedGroupId, savedGroups, idleMercs, gameState.profile.limits.maxPartySize]);

    useEffect(() => {
        if (elixirQty <= 0 && useElixir) {
            setUseElixir(false);
        }
    }, [elixirQty, useElixir]);

    useEffect(() => {
        if (activeModal === 'mercs') {
            setMercModalTab('roster');
        }
        setEditingGroupId(null);
        setGroupNameInput('');
        setGroupMercCodes([]);
    }, [activeModal]);

    useEffect(() => {
        if (activeModal !== 'expedition') return;
        if (eligibleDishes.length > 0) {
            if (
                !selectedDish ||
                !eligibleDishes.some(
                    (d) =>
                        d.recipe.recipeId === selectedDish.recipeId &&
                        d.quality === selectedDish.quality
                )
            ) {
                setSelectedDish({
                    recipeId: eligibleDishes[0].recipe.recipeId,
                    quality: eligibleDishes[0].quality,
                });
            }
        } else {
            setSelectedDish(null);
        }
    }, [activeModal, eligibleDishes, selectedDish]);

    const report: AzitBattleReport | null = azitGame.lastBattleReport;

    const previewStats = useMemo(() => {
        if (!selectedZone) {
            return {
                rawPower: 0,
                effectivePower: 0,
                winRatePct: 0,
                maxWinRateCap: 92,
                effectiveDurationSec: 0,
                buffs: null,
            };
        }
        return previewWinRate({
            gameState,
            zoneId: selectedZone.zoneId,
            partyCodes: selectedParty,
            dishRecipeId: selectedDish?.recipeId ?? null,
            dishQuality: selectedDish?.quality ?? 'normal',
        });
    }, [gameState, selectedZone, selectedParty, selectedDish]);

    const togglePartyMember = (code: AzitMercCode) => {
        setSelectedGroupId(null);
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

    const handlePickGroupForExpedition = (group: AzitMercenaryGroupRecord) => {
        const usable = group.mercCodes
            .filter((code) => idleMercs.some((m) => m.mercCode === code))
            .slice(0, gameState.profile.limits.maxPartySize);
        if (usable.length === 0) return;
        setSelectedGroupId(group.id);
        setSelectedParty(usable);
    };

    const toggleGroupBuilderMerc = (code: AzitMercCode) => {
        setGroupMercCodes((prev) => {
            if (prev.includes(code)) {
                return prev.filter((c) => c !== code);
            }
            if (prev.length >= gameState.profile.limits.maxPartySize) {
                return [...prev.slice(1), code];
            }
            return [...prev, code];
        });
    };

    const handleSaveGroup = async () => {
        if (!azitGame.saveGroup) return;
        const trimmedName = groupNameInput.trim();
        if (!trimmedName || groupMercCodes.length === 0) return;
        const ok = await azitGame.saveGroup({
            ...(editingGroupId !== null ? { id: editingGroupId } : {}),
            name: trimmedName,
            mercCodes: groupMercCodes,
        });
        if (ok) {
            setEditingGroupId(null);
            setGroupNameInput('');
            setGroupMercCodes([]);
        }
    };

    const handleStartEditGroup = (group: AzitMercenaryGroupRecord) => {
        setEditingGroupId(group.id);
        setGroupNameInput(group.name);
        setGroupMercCodes([...group.mercCodes]);
    };

    const handleDispatchSubmit = async () => {
        if (!selectedZone || !selectedDish || selectedParty.length === 0) return;
        if (gameState.activeExpeditions.length >= gameState.profile.limits.maxActiveExpeditions) return;
        const dispatchOpts: { groupId?: number; elixirItemId?: AzitItemId } = {};
        if (selectedGroupId !== null) {
            dispatchOpts.groupId = selectedGroupId;
        }
        if (useElixir && elixirQty > 0) {
            dispatchOpts.elixirItemId = 'item-battle-elixir';
        }
        const ok = await azitGame.startExpedition(
            selectedZone.zoneId,
            selectedParty,
            selectedDish.recipeId,
            selectedDish.quality,
            Object.keys(dispatchOpts).length > 0 ? dispatchOpts : undefined
        );
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
                                    const specialDishes =
                                        gameState.specialDishes ?? ({} as Record<AzitRecipeId, number>);
                                    const dishEntries: Array<{
                                        recipe: AzitRecipeCatalogItem;
                                        quality: AzitDishQuality;
                                        qty: number;
                                    }> = [];
                                    for (const recipe of gameState.catalog.recipes) {
                                        const spQty = specialDishes[recipe.recipeId] || 0;
                                        if (spQty > 0) {
                                            dishEntries.push({ recipe, quality: 'special', qty: spQty });
                                        }
                                        const normQty = gameState.dishes[recipe.recipeId] || 0;
                                        if (!hideEmptyMarket || normQty > 0) {
                                            dishEntries.push({ recipe, quality: 'normal', qty: normQty });
                                        }
                                    }
                                    if (dishEntries.length === 0) {
                                        return (
                                            <div className="py-10 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                                                보유 중인 완성 요리가 없습니다.
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {dishEntries.map(({ recipe, quality, qty }) => {
                                                const isSpecial = quality === 'special';
                                                const unitPrice = getDishSellPrice(recipe, quality);
                                                return (
                                                    <div
                                                        key={`market-dish-${quality}-${recipe.recipeId}`}
                                                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                                            isSpecial
                                                                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-xs'
                                                                : qty > 0
                                                                  ? 'bg-orange-50/70 border-orange-300'
                                                                  : 'bg-slate-50 border-slate-200 opacity-75'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span
                                                                className={`w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-xl shrink-0 ${
                                                                    isSpecial ? 'border-amber-300' : 'border-orange-200'
                                                                }`}
                                                            >
                                                                {recipe.emoji}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    {isSpecial && (
                                                                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black shrink-0">
                                                                            ★특제
                                                                        </span>
                                                                    )}
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
                                                                    판매 +{unitPrice.toLocaleString()}P
                                                                    {isSpecial ? ' (1.5배)' : ''} · 티어{recipe.tier}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                type="button"
                                                                disabled={qty < 1 || azitGame.isActing}
                                                                onClick={() => azitGame.sellDish(recipe.recipeId, 1, quality)}
                                                                className={`px-2.5 py-1.5 rounded-xl text-white text-[11px] font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                                                    isSpecial
                                                                        ? 'bg-amber-600 hover:bg-amber-700'
                                                                        : 'bg-orange-500 hover:bg-orange-600'
                                                                }`}
                                                            >
                                                                1개
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={qty < 1 || azitGame.isActing}
                                                                onClick={() =>
                                                                    azitGame.sellDish(recipe.recipeId, qty, quality)
                                                                }
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
                                                    ★특제 대성공 {owned ? owned.greatChancePct : chef.baseGreatChancePct}% (버프+20%·판매1.5배)
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-2.5 sm:p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 shrink-0">
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                                    🛡️ 용병 길드 · 스킬 · 부활 · 보급소
                                </h3>
                                <p className="text-[11px] text-slate-600 font-semibold flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span>
                                        용병 {gameState.mercenaries.length}/{gameState.profile.limits.maxMercs}명 · 파티 정원{' '}
                                        {gameState.profile.limits.maxPartySize}명
                                    </span>
                                    <span className="text-amber-700 font-black font-mono">
                                        🪙 {gameState.veraPoints.toLocaleString()} P
                                    </span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                aria-label="모달 닫기"
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer shrink-0"
                            >
                                ×
                            </button>
                        </div>

                        {/* 3-Tab Switcher + Item Stock Bar */}
                        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setMercModalTab('roster')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
                                        mercModalTab === 'roster'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    🛡️ 용병 · 스킬 · 부활
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMercModalTab('groups')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
                                        mercModalTab === 'groups'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    👥 용병 그룹 편성 ({savedGroups.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMercModalTab('shop_craft')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
                                        mercModalTab === 'shop_craft'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    ⚗️ 상점 · 연금 제작
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black">
                                {(
                                    [
                                        { id: 'item-revival-herb', label: '약초' },
                                        { id: 'item-phoenix-feather', label: '깃털' },
                                        { id: 'item-skill-stone', label: '연마석' },
                                        { id: 'item-skill-tome', label: '교본' },
                                        { id: 'item-battle-elixir', label: '비약' },
                                    ] as Array<{ id: AzitItemId; label: string }>
                                ).map(({ id, label }) => {
                                    const visual = getItemVisualMeta(id);
                                    const qty = itemQtyMap.get(id) ?? 0;
                                    return (
                                        <span
                                            key={`merc-bar-${id}`}
                                            className={`px-2 py-0.5 rounded-lg border font-mono ${visual.bgClass} ${visual.textClass} ${visual.borderClass}`}
                                        >
                                            {visual.emoji} {label} {qty}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 min-h-0">
                            {mercModalTab === 'roster' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {gameState.catalog.mercenaries.map((merc) => {
                                        const owned = gameState.mercenaries.find((m) => m.mercCode === merc.mercCode);
                                        const levelLocked = gameState.profile.azitLevel < merc.requiredAzitLevel;
                                        const slotsFull =
                                            !owned && gameState.mercenaries.length >= gameState.profile.limits.maxMercs;
                                        const xpPct = owned
                                            ? Math.min(100, Math.round((owned.xp / Math.max(1, owned.nextXp)) * 100))
                                            : 0;
                                        const isDead = owned?.status === 'dead';
                                        const isOut = owned?.status === 'expedition';
                                        const deathZone = owned?.deathZoneId
                                            ? gameState.catalog.zones.find((z) => z.zoneId === owned.deathZoneId)
                                            : null;

                                        const statHp = owned?.maxHp ?? owned?.hp ?? merc.baseStats?.hp ?? merc.basePower * 4;
                                        const statAtk = owned?.atk ?? merc.baseStats?.atk ?? Math.round(merc.basePower * 0.65);
                                        const statDef = owned?.def ?? merc.baseStats?.def ?? Math.round(merc.basePower * 0.3);
                                        const statSpd = owned?.spd ?? merc.baseStats?.moveSpeed ?? 110;
                                        const statRng = owned?.range ?? merc.baseStats?.range ?? 70;

                                        const mainSkill = owned?.mainSkill ?? (merc.mainSkill
                                            ? {
                                                  id: merc.mainSkill.id,
                                                  name: merc.mainSkill.name,
                                                  emoji: merc.mainSkill.emoji,
                                                  description: merc.mainSkill.description,
                                                  level: 1,
                                                  maxLevel: MAX_SKILL_LEVEL,
                                                  cooldownMs: merc.mainSkill.cooldownMs,
                                                  powerPct: merc.mainSkill.powerPct,
                                              }
                                            : null);
                                        const subSkill = owned?.subSkill ?? (merc.subSkill
                                            ? {
                                                  id: merc.subSkill.id,
                                                  name: merc.subSkill.name,
                                                  emoji: merc.subSkill.emoji,
                                                  description: merc.subSkill.description,
                                                  level: 1,
                                                  maxLevel: MAX_SKILL_LEVEL,
                                                  cooldownMs: merc.subSkill.cooldownMs,
                                                  powerPct: merc.subSkill.powerPct,
                                              }
                                            : null);

                                        const herbQty = itemQtyMap.get('item-revival-herb') ?? 0;
                                        const featherQty = itemQtyMap.get('item-phoenix-feather') ?? 0;
                                        const tomeQty = itemQtyMap.get('item-skill-tome') ?? 0;
                                        const stoneQty = itemQtyMap.get('item-skill-stone') ?? 0;

                                        return (
                                            <div
                                                key={`guild-merc-${merc.mercCode}`}
                                                className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 min-w-0 ${
                                                    isDead
                                                        ? 'bg-rose-50/75 border-rose-300'
                                                        : owned
                                                          ? 'bg-indigo-50/70 border-indigo-300'
                                                          : 'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                <div className="space-y-2 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-200 shadow-2xs p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                                                <img
                                                                    src={resolveMercSpriteUrl(merc.mercCode)}
                                                                    alt={merc.name}
                                                                    className={`w-full h-full object-contain ${
                                                                        isDead || (levelLocked && !owned)
                                                                            ? 'grayscale opacity-60'
                                                                            : ''
                                                                    }`}
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-black text-slate-900 truncate">
                                                                    {merc.name}{' '}
                                                                    {owned && (
                                                                        <span className="text-indigo-600">
                                                                            Lv.{owned.level}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                                                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                                                        {merc.role}
                                                                    </span>
                                                                    {isDead && (
                                                                        <span className="text-[10px] font-black text-white bg-rose-600 px-1.5 py-0.5 rounded">
                                                                            💀 전투불능
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black shrink-0">
                                                            Lv.{merc.requiredAzitLevel}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                                        {merc.description}
                                                    </p>

                                                    {/* Combat Stats Strip */}
                                                    <div className="grid grid-cols-5 gap-1 p-1.5 rounded-xl bg-white/85 border border-slate-200/80 text-center text-[10px] font-mono">
                                                        <div>
                                                            <div className="text-slate-400 font-bold">HP</div>
                                                            <div className="font-black text-emerald-700">{statHp}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 font-bold">ATK</div>
                                                            <div className="font-black text-rose-700">{statAtk}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 font-bold">DEF</div>
                                                            <div className="font-black text-sky-700">{statDef}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 font-bold">SPD</div>
                                                            <div className="font-black text-amber-700">{statSpd}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 font-bold">RNG</div>
                                                            <div className="font-black text-indigo-700">{statRng}</div>
                                                        </div>
                                                    </div>

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
                                                                보스 +{merc.bossRewardBonusPct}%
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Combat-only EXP bar */}
                                                    {owned && (
                                                        <div className="pt-0.5 space-y-0.5">
                                                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                                <span>전투 경험치 (전투로만 레벨업)</span>
                                                                <span className="font-mono">
                                                                    {owned.level >= merc.maxLevel
                                                                        ? 'MAX'
                                                                        : `${owned.xp}/${owned.nextXp}`}
                                                                </span>
                                                            </div>
                                                            <svg viewBox="0 0 100 6" className="w-full h-1.5" aria-hidden="true">
                                                                <rect x="0" y="0" width="100" height="6" rx="3" fill="#e2e8f0" />
                                                                <rect
                                                                    x="0"
                                                                    y="0"
                                                                    width={owned.level >= merc.maxLevel ? 100 : xpPct}
                                                                    height="6"
                                                                    rx="3"
                                                                    fill="#6366f1"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}

                                                    {/* Main & Sub Skill Cards */}
                                                    {(mainSkill || subSkill) && (
                                                        <div className="space-y-1.5 pt-1">
                                                            {mainSkill && (
                                                                <div className="p-2 rounded-xl bg-white border border-indigo-200/80 space-y-1">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="text-[10px] font-black text-indigo-900 truncate">
                                                                            {mainSkill.emoji} [메인] {mainSkill.name}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono font-black text-indigo-600 shrink-0">
                                                                            Lv.{mainSkill.level}/{mainSkill.maxLevel}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 font-semibold leading-snug">
                                                                        {mainSkill.description} (쿨 {(mainSkill.cooldownMs / 1000).toFixed(1)}s · 위력 {mainSkill.powerPct}%)
                                                                    </div>
                                                                    {owned && azitGame.upgradeMercSkill && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                isOut ||
                                                                                isDead ||
                                                                                mainSkill.level >= mainSkill.maxLevel ||
                                                                                tomeQty < 1 ||
                                                                                azitGame.isActing
                                                                            }
                                                                            onClick={() =>
                                                                                azitGame.upgradeMercSkill?.(
                                                                                    owned.mercCode,
                                                                                    'main'
                                                                                )
                                                                            }
                                                                            className="w-full py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                                        >
                                                                            {mainSkill.level >= mainSkill.maxLevel
                                                                                ? '메인 스킬 MAX'
                                                                                : isDead
                                                                                  ? '부활 후 강화'
                                                                                  : `📘 교본으로 강화 (보유 ${tomeQty})`}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {subSkill && (
                                                                <div className="p-2 rounded-xl bg-white border border-sky-200/80 space-y-1">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="text-[10px] font-black text-sky-900 truncate">
                                                                            {subSkill.emoji} [서브] {subSkill.name}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono font-black text-sky-600 shrink-0">
                                                                            Lv.{subSkill.level}/{subSkill.maxLevel}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 font-semibold leading-snug">
                                                                        {subSkill.description} (쿨 {(subSkill.cooldownMs / 1000).toFixed(1)}s · 위력 {subSkill.powerPct}%)
                                                                    </div>
                                                                    {owned && azitGame.upgradeMercSkill && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                isOut ||
                                                                                isDead ||
                                                                                subSkill.level >= subSkill.maxLevel ||
                                                                                stoneQty < 1 ||
                                                                                azitGame.isActing
                                                                            }
                                                                            onClick={() =>
                                                                                azitGame.upgradeMercSkill?.(
                                                                                    owned.mercCode,
                                                                                    'sub'
                                                                                )
                                                                            }
                                                                            className="w-full py-1 px-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                                        >
                                                                            {subSkill.level >= subSkill.maxLevel
                                                                                ? '서브 스킬 MAX'
                                                                                : isDead
                                                                                  ? '부활 후 강화'
                                                                                  : `💎 연마석으로 강화 (보유 ${stoneQty})`}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status & Action Footer (NO gold upgrade button) */}
                                                <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                                                    {owned ? (
                                                        isDead ? (
                                                            <div className="space-y-1.5">
                                                                <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-900">
                                                                    💀 {deathZone ? `${deathZone.name} 원정에서 전사` : '원정 중 전투 불능'} · 골드 부활 불가 (부활 아이템 전용)
                                                                </div>
                                                                {herbQty + featherQty === 0 ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setMercModalTab('shop_craft')}
                                                                        className="w-full py-2 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black cursor-pointer"
                                                                    >
                                                                        ⚗️ 상점·연금에서 부활 아이템 구하기 →
                                                                    </button>
                                                                ) : (
                                                                    <div className="grid grid-cols-1 gap-1.5">
                                                                        {herbQty > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={azitGame.isActing}
                                                                                onClick={() =>
                                                                                    azitGame.reviveMercenary?.(
                                                                                        owned.mercCode,
                                                                                        'item-revival-herb'
                                                                                    )
                                                                                }
                                                                                className="w-full py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer disabled:opacity-50"
                                                                            >
                                                                                🌿 생명의 약초로 부활 (보유 {herbQty})
                                                                            </button>
                                                                        )}
                                                                        {featherQty > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={azitGame.isActing}
                                                                                onClick={() =>
                                                                                    azitGame.reviveMercenary?.(
                                                                                        owned.mercCode,
                                                                                        'item-phoenix-feather'
                                                                                    )
                                                                                }
                                                                                className="w-full py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black cursor-pointer disabled:opacity-50"
                                                                            >
                                                                                🪶 불사조 깃털 부활 +30EXP (보유 {featherQty})
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : isOut ? (
                                                            <div className="w-full py-2 rounded-xl bg-violet-100 text-violet-800 text-center text-xs font-black">
                                                                ⚔️ 현재 원정 출정 중
                                                            </div>
                                                        ) : owned.level >= merc.maxLevel ? (
                                                            <div className="w-full py-2 rounded-xl bg-emerald-100 text-emerald-800 text-center text-xs font-black">
                                                                🏆 최고 레벨 도달 (MAX)
                                                            </div>
                                                        ) : (
                                                            <div className="w-full py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-[11px] font-black">
                                                                🏕️ 대기 중 · 원정/탑 전투로 성장
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
                            )}

                            {mercModalTab === 'groups' && (
                                <div className="space-y-4">
                                    {/* Saved Groups List */}
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-xs font-black text-slate-900">
                                                📋 편성된 용병 그룹 ({savedGroups.length}개)
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-500">
                                                파티 정원 최대 {gameState.profile.limits.maxPartySize}명 · 동시 출정{' '}
                                                {gameState.profile.limits.maxActiveExpeditions}팀 가능
                                            </span>
                                        </div>

                                        {savedGroups.length === 0 ? (
                                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                                                <p className="text-xs font-black text-slate-700">
                                                    아직 저장된 용병 그룹이 없습니다.
                                                </p>
                                                <p className="text-[11px] font-semibold text-slate-500">
                                                    아래 그룹 편성기에서 사냥터별 원정 부대를 만들어 보세요.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {savedGroups.map((group) => {
                                                    const isOnExpedition = activeGroupIds.has(group.id);
                                                    const groupPower = group.mercCodes.reduce((sum, code) => {
                                                        const m = gameState.mercenaries.find((x) => x.mercCode === code);
                                                        return sum + (m?.power ?? 0);
                                                    }, 0);
                                                    return (
                                                        <div
                                                            key={`saved-group-${group.id}`}
                                                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <div className="text-xs font-black text-slate-900 truncate">
                                                                        👥 {group.name}
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-indigo-700 font-mono">
                                                                        ⚔️ 총 전투력 {groupPower.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        disabled={isOnExpedition || azitGame.isActing}
                                                                        onClick={() => handleStartEditGroup(group)}
                                                                        className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                                    >
                                                                        수정
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={isOnExpedition || azitGame.isActing}
                                                                        onClick={() => azitGame.deleteGroup?.(group.id)}
                                                                        className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                                    >
                                                                        {isOnExpedition ? '출정중' : '삭제'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-1">
                                                                {group.mercCodes.map((code) => {
                                                                    const def = gameState.catalog.mercenaries.find(
                                                                        (m) => m.mercCode === code
                                                                    );
                                                                    const owned = gameState.mercenaries.find(
                                                                        (m) => m.mercCode === code
                                                                    );
                                                                    return (
                                                                        <span
                                                                            key={`group-${group.id}-merc-${code}`}
                                                                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${
                                                                                owned?.status === 'dead'
                                                                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                                                    : owned?.status === 'expedition'
                                                                                      ? 'bg-violet-50 border-violet-200 text-violet-700'
                                                                                      : 'bg-white border-slate-200 text-slate-700'
                                                                            }`}
                                                                        >
                                                                            <span>{def?.emoji}</span>
                                                                            <span>{def?.name ?? code}</span>
                                                                            {owned?.status === 'dead' && <span>💀</span>}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Group Builder */}
                                    <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-xs font-black text-indigo-950">
                                                {editingGroupId !== null
                                                    ? '✏️ 용병 그룹 수정'
                                                    : '➕ 새 용병 그룹 만들기'}
                                            </h4>
                                            {editingGroupId !== null && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingGroupId(null);
                                                        setGroupNameInput('');
                                                        setGroupMercCodes([]);
                                                    }}
                                                    className="text-[10px] font-black text-slate-600 hover:underline cursor-pointer"
                                                >
                                                    편집 취소
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                maxLength={20}
                                                value={groupNameInput}
                                                onChange={(e) => setGroupNameInput(e.target.value)}
                                                placeholder="예: 1군 슬라임 토벌대"
                                                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            />
                                            <button
                                                type="button"
                                                disabled={
                                                    !groupNameInput.trim() ||
                                                    groupMercCodes.length === 0 ||
                                                    azitGame.isActing ||
                                                    !azitGame.saveGroup
                                                }
                                                onClick={handleSaveGroup}
                                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                                            >
                                                {editingGroupId !== null ? '그룹 수정 저장' : '그룹 저장'}
                                            </button>
                                        </div>

                                        {gameState.mercenaries.length === 0 ? (
                                            <div className="text-[11px] font-bold text-slate-500 py-2">
                                                영입된 용병이 없습니다. 먼저 용병을 영입해 주세요.
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <div className="text-[10px] font-black text-indigo-800">
                                                    용병 선택 ({groupMercCodes.length}/{gameState.profile.limits.maxPartySize}명)
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {gameState.mercenaries.map((merc) => {
                                                        const def = gameState.catalog.mercenaries.find(
                                                            (m) => m.mercCode === merc.mercCode
                                                        );
                                                        const picked = groupMercCodes.includes(merc.mercCode);
                                                        return (
                                                            <button
                                                                key={`builder-merc-${merc.mercCode}`}
                                                                type="button"
                                                                onClick={() => toggleGroupBuilderMerc(merc.mercCode)}
                                                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black cursor-pointer flex items-center gap-1.5 ${
                                                                    picked
                                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                <img
                                                                    src={resolveMercSpriteUrl(merc.mercCode)}
                                                                    alt={def?.name ?? merc.mercCode}
                                                                    className="w-5 h-5 rounded object-contain bg-white/90"
                                                                />
                                                                <span>
                                                                    {def?.name} Lv.{merc.level}
                                                                </span>
                                                                {merc.status === 'dead' && <span>💀</span>}
                                                                {merc.status === 'expedition' && <span>⚔️</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {mercModalTab === 'shop_craft' && (
                                <div className="space-y-5">
                                    {/* Azit Item Shop */}
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-xs font-black text-slate-900">
                                                🛒 아지트 보급 상점 (부활·전투 비약)
                                            </h4>
                                            <span className="text-[11px] font-black font-mono text-amber-700">
                                                보유 🪙 {gameState.veraPoints.toLocaleString()} P
                                            </span>
                                        </div>

                                        {(() => {
                                            const shopItems = (gameState.catalog.items ?? []).filter(
                                                (it) => it.shopPrice !== null
                                            );
                                            if (shopItems.length === 0) {
                                                return (
                                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs font-bold text-slate-500">
                                                        현재 판매 중인 상점 아이템이 없습니다.
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                    {shopItems.map((item) => {
                                                        const price = item.shopPrice ?? 0;
                                                        const ownedQty = itemQtyMap.get(item.itemId) ?? 0;
                                                        const locked =
                                                            gameState.profile.azitLevel < item.requiredAzitLevel;
                                                        const visual = getItemVisualMeta(item.itemId);
                                                        return (
                                                            <div
                                                                key={`shop-item-${item.itemId}`}
                                                                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2.5"
                                                            >
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-xs font-black text-slate-900">
                                                                            {item.emoji} {item.name}
                                                                        </span>
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-black ${visual.bgClass} ${visual.textClass} ${visual.borderClass}`}
                                                                        >
                                                                            보유 {ownedQty}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-600 leading-relaxed">
                                                                        {item.description}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                                                                    <div className="flex items-center justify-between text-[10px] font-black">
                                                                        <span className="text-amber-700 font-mono">
                                                                            🪙 {price.toLocaleString()} P
                                                                        </span>
                                                                        {locked && (
                                                                            <span className="text-rose-600">
                                                                                🔒 Lv.{item.requiredAzitLevel}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                locked ||
                                                                                gameState.veraPoints < price ||
                                                                                azitGame.isActing ||
                                                                                !azitGame.buyShopItem
                                                                            }
                                                                            onClick={() =>
                                                                                azitGame.buyShopItem?.(item.itemId, 1)
                                                                            }
                                                                            className="py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                                        >
                                                                            1개 구매
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                locked ||
                                                                                gameState.veraPoints < price * 5 ||
                                                                                azitGame.isActing ||
                                                                                !azitGame.buyShopItem
                                                                            }
                                                                            onClick={() =>
                                                                                azitGame.buyShopItem?.(item.itemId, 5)
                                                                            }
                                                                            className="py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                                        >
                                                                            5개 구매
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Alchemy / Craft Recipes */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black text-slate-900">
                                            ⚗️ 아지트 연금 제작 (작물 · 몬스터 재료 조합)
                                        </h4>

                                        {(gameState.catalog.craftRecipes ?? []).length === 0 ? (
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs font-bold text-slate-500">
                                                사용 가능한 연금 제작 레시피가 없습니다.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {(gameState.catalog.craftRecipes ?? []).map((recipe) => {
                                                    const locked =
                                                        gameState.profile.azitLevel < recipe.requiredAzitLevel;
                                                    const enoughPoints = gameState.veraPoints >= recipe.pointsCost;
                                                    let allIngredientsMet = true;

                                                    const ingredientRows = recipe.ingredients.map((ing) => {
                                                        let ownedQty = 0;
                                                        let label = String(ing.id);
                                                        let emoji = '📦';
                                                        if (ing.kind === 'crop') {
                                                            const cropId = ing.id as AzitCropId;
                                                            ownedQty = gameState.garden?.harvestCounts?.[cropId] ?? 0;
                                                            const cDef = gameState.catalog.crops.find(
                                                                (c) => c.cropId === cropId
                                                            );
                                                            label = cDef?.name ?? label;
                                                            emoji = cDef?.emoji ?? '🌱';
                                                        } else if (ing.kind === 'material') {
                                                            const matId = ing.id as AzitMaterialId;
                                                            ownedQty = gameState.materials[matId] ?? 0;
                                                            const mDef = gameState.catalog.materials.find(
                                                                (m) => m.materialId === matId
                                                            );
                                                            label = mDef?.name ?? label;
                                                            emoji = mDef?.emoji ?? '🧪';
                                                        } else {
                                                            const itemId = ing.id as AzitItemId;
                                                            ownedQty = itemQtyMap.get(itemId) ?? 0;
                                                            const iDef = (gameState.catalog.items ?? []).find(
                                                                (it) => it.itemId === itemId
                                                            );
                                                            label = iDef?.name ?? label;
                                                            emoji = iDef?.emoji ?? '✨';
                                                        }
                                                        const met = ownedQty >= ing.qty;
                                                        if (!met) allIngredientsMet = false;
                                                        return { ing, ownedQty, label, emoji, met };
                                                    });

                                                    const resultQtyOwned = itemQtyMap.get(recipe.resultItemId) ?? 0;
                                                    const canCraft =
                                                        !locked &&
                                                        enoughPoints &&
                                                        allIngredientsMet &&
                                                        !azitGame.isActing &&
                                                        Boolean(azitGame.craftItem);

                                                    return (
                                                        <div
                                                            key={`craft-recipe-${recipe.recipeId}`}
                                                            className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between gap-2.5"
                                                        >
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-xs font-black text-slate-900">
                                                                        {recipe.emoji} {recipe.name} (×{recipe.resultQty})
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-black">
                                                                        보유 {resultQtyOwned}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500">
                                                                    {recipe.description}
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {ingredientRows.map(({ ing, ownedQty, label, emoji, met }) => (
                                                                        <span
                                                                            key={`craft-${recipe.recipeId}-${ing.kind}-${ing.id}`}
                                                                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono ${
                                                                                met
                                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                                                            }`}
                                                                        >
                                                                            {emoji} {label} {ownedQty}/{ing.qty}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                disabled={!canCraft}
                                                                onClick={() => azitGame.craftItem?.(recipe.recipeId, 1)}
                                                                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                                                            >
                                                                {locked
                                                                    ? `🔒 아지트 Lv.${recipe.requiredAzitLevel} 필요`
                                                                    : !enoughPoints
                                                                      ? `포인트 부족 (${recipe.pointsCost}P)`
                                                                      : !allIngredientsMet
                                                                        ? '제작 재료 부족'
                                                                        : `⚗️ 제작하기 (${recipe.pointsCost}P)`}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'expedition' && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-2.5 sm:p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-rose-50 to-indigo-50 shrink-0">
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                                    ⚔️ 몬스터 토벌 원정 편성 ({gameState.activeExpeditions.length}/
                                    {gameState.profile.limits.maxActiveExpeditions})
                                </h3>
                                <p className="text-[11px] text-slate-600 font-semibold">
                                    1~8시간 사냥터별 동시 출정 가능 · 패배 시 용병이 사망할 수 있으며 부활 아이템으로만 소생 가능합니다!
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseModal}
                                aria-label="모달 닫기"
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer shrink-0"
                            >
                                ×
                            </button>
                        </div>

                        {!selectedZone || gameState.catalog.zones.length === 0 ? (
                            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center text-center space-y-2">
                                <div className="text-3xl">🗺️</div>
                                <p className="text-sm font-black text-slate-800">
                                    등록된 원정 사냥터가 없습니다.
                                </p>
                                <p className="text-xs font-semibold text-slate-500">
                                    사냥터 목록을 불러오는 중이거나 잠시 후 다시 확인해 주세요.
                                </p>
                            </div>
                        ) : (
                        <>
                        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
                            {gameState.activeExpeditions.length >= gameState.profile.limits.maxActiveExpeditions && (
                                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-black text-amber-900">
                                    ⚠️ 최대 동시 출정 한도({gameState.profile.limits.maxActiveExpeditions}팀)에 도달했습니다. 완료된 원정을 정산한 뒤 새로 출정하세요.
                                </div>
                            )}

                            {/* 1단계: 토벌 지역 선택 */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-slate-800">1. 토벌 사냥터 선택 (1~8시간)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {gameState.catalog.zones.map((zone) => {
                                        const isPicked = selectedZone.zoneId === zone.zoneId;
                                        const locked = gameState.profile.azitLevel < zone.requiredAzitLevel;
                                        const mat = gameState.catalog.materials.find(
                                            (m) => m.materialId === zone.dropMaterialId
                                        );
                                        const monsterNames = (zone.monsters ?? []).map((m) => `${m.emoji}${m.name}`);
                                        const itemDropNames = (zone.itemDrops ?? [])
                                            .map((d) => {
                                                const itemDef = (gameState.catalog.items ?? []).find(
                                                    (it) => it.itemId === d.itemId
                                                );
                                                return itemDef ? `${itemDef.emoji}${itemDef.name}` : null;
                                            })
                                            .filter((v): v is string => Boolean(v));

                                        return (
                                            <button
                                                key={`pick-zone-${zone.zoneId}`}
                                                type="button"
                                                disabled={locked}
                                                onClick={() => setSelectedZoneId(zone.zoneId)}
                                                className={`p-3 rounded-2xl border text-left transition-all space-y-1.5 ${
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
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {typeof zone.deathRiskPct === 'number' && (
                                                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9.5px] font-black">
                                                                💀{zone.deathRiskPct}%
                                                            </span>
                                                        )}
                                                        {zone.isBoss && (
                                                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9.5px] font-black">
                                                                BOSS
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-semibold">
                                                    {locked
                                                        ? `🔒 아지트 Lv.${zone.requiredAzitLevel} 해금`
                                                        : `⏱ ${formatDurationCompact(zone.durationSec)} · 출정 ${zone.entryCost}P · 권장 ${zone.recommendedPower}`}
                                                </div>
                                                <div className="text-[10px] font-bold text-emerald-700">
                                                    승리 +{zone.rewardPoints}P · ⭐용병EXP +{zone.rewardMercXp} · {mat?.emoji} {mat?.name}
                                                </div>
                                                {monsterNames.length > 0 && (
                                                    <div className="text-[10px] text-slate-600 font-semibold truncate">
                                                        출몰: {monsterNames.join(', ')}
                                                    </div>
                                                )}
                                                {itemDropNames.length > 0 && (
                                                    <div className="text-[10px] text-indigo-700 font-bold truncate">
                                                        드롭 아이템: {itemDropNames.join(' · ')}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2단계: 용병 그룹 또는 개별 출전 용병 선택 */}
                            <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="text-xs font-black text-slate-800">
                                        2. 그룹 빠른 선택 또는 출전 용병 선택 ({selectedParty.length}/
                                        {gameState.profile.limits.maxPartySize}명)
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onCloseModal();
                                            onOpenMercModal();
                                        }}
                                        className="text-[11px] font-black text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        + 용병 영입·스킬·부활 →
                                    </button>
                                </div>

                                {/* Saved Groups Quick-Pick */}
                                {savedGroups.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] font-black text-slate-500">저장 그룹:</span>
                                        {savedGroups.map((group) => {
                                            const hasBusyOrDead = group.mercCodes.some((code) => {
                                                const m = gameState.mercenaries.find((x) => x.mercCode === code);
                                                return !m || m.status !== 'idle';
                                            });
                                            const isPicked = selectedGroupId === group.id;
                                            return (
                                                <button
                                                    key={`exp-quick-group-${group.id}`}
                                                    type="button"
                                                    disabled={hasBusyOrDead}
                                                    onClick={() => handlePickGroupForExpedition(group)}
                                                    className={`px-2.5 py-1 rounded-xl border text-[10px] font-black cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                                                        isPicked
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                                                    }`}
                                                >
                                                    👥 {group.name} ({group.mercCodes.length}명)
                                                    {hasBusyOrDead ? ' · 출정/부활불가' : ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {idleMercs.length === 0 ? (
                                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center space-y-2">
                                        <p className="text-xs font-bold text-indigo-900">
                                            출정 가능한 대기 중 용병이 없습니다.
                                            {gameState.mercenaries.some((m) => m.status === 'dead')
                                                ? ' (사망한 용병은 부활 아이템으로 먼저 소생시켜야 합니다!)'
                                                : ''}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onCloseModal();
                                                onOpenMercModal();
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer"
                                        >
                                            🛡️ 용병 길드·부활 관리 열기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {gameState.mercenaries.map((merc) => {
                                            const def = gameState.catalog.mercenaries.find(
                                                (m) => m.mercCode === merc.mercCode
                                            );
                                            const isIdle = merc.status === 'idle';
                                            const isDead = merc.status === 'dead';
                                            const checked = selectedParty.includes(merc.mercCode);
                                            return (
                                                <button
                                                    key={`pick-party-${merc.mercCode}`}
                                                    type="button"
                                                    disabled={!isIdle}
                                                    onClick={() => togglePartyMember(merc.mercCode)}
                                                    className={`px-3 py-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 ${
                                                        !isIdle
                                                            ? isDead
                                                                ? 'bg-rose-50 text-rose-400 border-rose-200 opacity-65 cursor-not-allowed'
                                                                : 'bg-violet-50 text-violet-500 border-violet-200 opacity-65 cursor-not-allowed'
                                                            : checked
                                                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs cursor-pointer'
                                                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                                    }`}
                                                >
                                                    <img
                                                        src={resolveMercSpriteUrl(merc.mercCode)}
                                                        alt={def?.name || merc.mercCode}
                                                        className={`w-7 h-7 rounded-lg bg-white/95 p-0.5 object-contain shrink-0 ${
                                                            isDead ? 'grayscale' : ''
                                                        }`}
                                                    />
                                                    <span>
                                                        {def?.name} Lv.{merc.level}
                                                    </span>
                                                    <span className="text-[10px] opacity-85">
                                                        {isDead ? '💀사망' : !isIdle ? '⚔️출정중' : `⚔️${merc.power}`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* 3단계: 투지의 비약(선택) & 필수 원정 도시락 선택 */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800">
                                    3. 보급 도시락 (필수 · 티어 {selectedZone.minDishTier}+) &amp; 투지의 비약 (선택)
                                </h4>

                                <button
                                    type="button"
                                    disabled={elixirQty < 1}
                                    onClick={() => setUseElixir((prev) => !prev)}
                                    className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                                        elixirQty < 1
                                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                            : useElixir
                                              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200 text-rose-950 cursor-pointer'
                                              : 'bg-white border-slate-200 hover:border-rose-300 text-slate-800 cursor-pointer'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="text-xs font-black">
                                            ⚗️ 투지의 비약 사용 {useElixir ? '(적용됨 ✓)' : '(선택 사항)'}
                                        </div>
                                        <div className="text-[10px] font-semibold">
                                            출전 시 파티 전원 ATK·최대 HP +12% 증가 (보유 {elixirQty}개)
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black shrink-0">
                                        {elixirQty > 0 ? (useElixir ? '사용 해제' : '사용하기') : '미보유'}
                                    </span>
                                </button>

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
                                        {eligibleDishes.map(({ recipe, quality, qty, buffs }) => {
                                            const isSpecial = quality === 'special';
                                            const picked =
                                                selectedDish?.recipeId === recipe.recipeId &&
                                                selectedDish?.quality === quality;
                                            return (
                                                <button
                                                    key={`pick-dish-${quality}-${recipe.recipeId}`}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedDish({
                                                            recipeId: recipe.recipeId,
                                                            quality,
                                                        })
                                                    }
                                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                                        picked
                                                            ? isSpecial
                                                                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200'
                                                                : 'bg-orange-50 border-orange-500 ring-2 ring-orange-200'
                                                            : isSpecial
                                                              ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
                                                              : 'bg-white border-slate-200 hover:border-orange-300'
                                                    }`}
                                                >
                                                    <div className="min-w-0 space-y-0.5">
                                                        <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                                                            {isSpecial && (
                                                                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black shrink-0">
                                                                    ★특제 +20%
                                                                </span>
                                                            )}
                                                            <span>{recipe.emoji}</span>
                                                            <span className="truncate">
                                                                {recipe.name} ({qty}개)
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-emerald-700">
                                                            ⚔️전투력 +{buffs.powerBonusPct}% · 🎯승률 +{buffs.winRateBonusPct}% (상한 {buffs.maxWinRateCap}%)
                                                        </div>
                                                        <div className="text-[10px] font-bold text-indigo-700">
                                                            💰전리품 +{buffs.rewardBonusPct}% · ⭐용병EXP +{buffs.mercXpBonusPct}%
                                                            {buffs.expeditionSpeedBonusPct > 0
                                                                ? ` · ⚡시간 -${buffs.expeditionSpeedBonusPct}%`
                                                                : ''}
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black shrink-0">
                                                        티어{recipe.tier}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-4 sm:px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <div className="text-xs space-y-0.5 min-w-0">
                                <div className="font-black text-slate-900">
                                    파티 유효 전투력{' '}
                                    <span className="text-indigo-600">{previewStats.effectivePower.toLocaleString()}</span> /
                                    권장 {selectedZone.recommendedPower.toLocaleString()} ·{' '}
                                    <span className="text-emerald-600">
                                        예상 승률 {previewStats.winRatePct}% (상한 {previewStats.maxWinRateCap}%)
                                    </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-600">
                                    ⏱ 예상 소요{' '}
                                    <span className="text-indigo-700 font-black">
                                        {formatDurationCompact(previewStats.effectiveDurationSec)}
                                    </span>
                                    {useElixir && (
                                        <span className="text-rose-600 font-black"> · ⚗️투지의 비약 +12%</span>
                                    )}
                                </div>
                                <div className="text-[11px] font-bold text-rose-600">
                                    ⚠️ 출정비 {selectedZone.entryCost}P · 도시락 1개 소모 · 사망 시 부활 아이템 필요
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    gameState.activeExpeditions.length >=
                                        gameState.profile.limits.maxActiveExpeditions ||
                                    selectedParty.length === 0 ||
                                    !selectedDish ||
                                    gameState.veraPoints < selectedZone.entryCost ||
                                    azitGame.isActing
                                }
                                onClick={handleDispatchSubmit}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                {azitGame.isActing ? '출정 준비 중...' : '⚔️ 원정 출정 확정'}
                            </button>
                        </div>
                        </>
                        )}
                    </div>
                </div>
            )}

            {/* 원정 정산 전투 결과 리포트 모달 */}
            {report && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2.5 sm:p-4">
                    <div className="bg-white w-full max-w-lg max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div
                            className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
                                report.won
                                    ? 'bg-gradient-to-r from-amber-50 to-emerald-50 border-emerald-200'
                                    : 'bg-gradient-to-r from-rose-50 to-slate-100 border-rose-200'
                            }`}
                        >
                            <div className="min-w-0">
                                <div className="text-xs font-black uppercase tracking-wide text-slate-500 truncate">
                                    {report.zoneEmoji} {report.zoneName} · 예상 승률 {report.predictedWinRate}%
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mt-0.5 flex flex-wrap items-center gap-2">
                                    <span>{report.won ? '🏆 몬스터 토벌 대성공!' : '💔 원정 토벌 실패...'}</span>
                                    {report.mvpMercCode && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-slate-950 text-[10px] font-black">
                                            MVP:{' '}
                                            {gameState.catalog.mercenaries.find(
                                                (m) => m.mercCode === report.mvpMercCode
                                            )?.name ?? report.mvpMercCode}
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={azitGame.clearBattleReport}
                                aria-label="리포트 닫기"
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black cursor-pointer shrink-0"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
                            <div className="space-y-1.5 bg-slate-900 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed">
                                {report.battleLog.map((line, i) => (
                                    <p key={`battle-log-${i}`}>{line}</p>
                                ))}
                            </div>

                            {report.casualties && report.casualties.length > 0 && (
                                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-xs font-black text-rose-900 space-y-1">
                                    <div>
                                        💀 전사 발생:{' '}
                                        {report.casualties
                                            .map(
                                                (code) =>
                                                    gameState.catalog.mercenaries.find((m) => m.mercCode === code)
                                                        ?.name ?? code
                                            )
                                            .join(', ')}
                                    </div>
                                    <div className="text-[11px] font-bold text-rose-700">
                                        사망한 용병은 골드로 부활할 수 없으며, 부활 아이템으로만 부활 가능합니다.
                                    </div>
                                </div>
                            )}

                            {/* Itemized Rewards (both win and survival Merc EXP on loss) */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                                    <div className="text-[10px] font-bold text-amber-700">골드 포인트</div>
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
                                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                                    <div className="text-[10px] font-bold text-indigo-700">용병 EXP</div>
                                    <div className="text-sm font-black text-indigo-900 font-mono">
                                        +{report.rewardMercXp ?? 0}
                                    </div>
                                </div>
                            </div>

                            {Object.keys(report.rewardMaterials).length > 0 && (
                                <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-[11px] font-bold text-violet-900 flex flex-wrap items-center gap-1.5">
                                    <span className="font-black">🧪 몬스터 재료:</span>
                                    {Object.entries(report.rewardMaterials).map(([matId, q]) => {
                                        const mDef = gameState.catalog.materials.find((m) => m.materialId === matId);
                                        return (
                                            <span
                                                key={`rep-mat-${matId}`}
                                                className="px-2 py-0.5 rounded-lg bg-white border border-violet-200 font-mono"
                                            >
                                                {mDef?.emoji || '🧪'} {mDef?.name || matId} ×{q ?? 0}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {report.rewardCrops && Object.keys(report.rewardCrops).length > 0 && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900 flex flex-wrap items-center gap-1.5">
                                    <span className="font-black">🌿 요리·연금 작물:</span>
                                    {Object.entries(report.rewardCrops).map(([cropId, q]) => {
                                        const cDef = gameState.catalog.crops.find((c) => c.cropId === cropId);
                                        return (
                                            <span
                                                key={`rep-crop-${cropId}`}
                                                className="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 font-mono"
                                            >
                                                {cDef?.emoji || '🌱'} {cDef?.name || cropId} ×{q ?? 0}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {report.rewardItems && Object.keys(report.rewardItems).length > 0 && (
                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex flex-wrap items-center gap-1.5">
                                    <span className="font-black">🎁 획득 아이템:</span>
                                    {Object.entries(report.rewardItems).map(([itemId, q]) => {
                                        const iDef = (gameState.catalog.items ?? []).find(
                                            (it) => it.itemId === itemId
                                        );
                                        return (
                                            <span
                                                key={`rep-item-${itemId}`}
                                                className="px-2 py-0.5 rounded-lg bg-white border border-amber-200 font-mono"
                                            >
                                                {iDef?.emoji || '🎁'} {iDef?.name || itemId} ×{q ?? 0}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {!report.won && (
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
