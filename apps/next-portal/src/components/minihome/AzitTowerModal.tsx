'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    AzitFullGameState,
    AzitItemId,
    AzitMercCode,
    AzitMercenaryGroupRecord,
    AzitMercenaryRecord,
    AzitTowerBattleResponse,
    AzitTowerFloorSummary,
    AzitTowerThemeCatalogItem,
    AzitTowerThemeId,
    UseAzitGameController,
} from '@/types/azit-game.types';
import { MAX_TOWER_FLOOR } from '@/types/azit-game.types';
import { fetchAzitTowerFloors } from '@/hooks/useAzitGame';
import { AZIT_TOWER_THEMES, getItemVisualMeta } from '@/data/azitCharacterAssets';

export interface TowerLaunchContext {
    floor: number;
    groupId?: number;
    partyMercCodes: AzitMercCode[];
    useElixir: boolean;
}

export interface AzitTowerModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: AzitFullGameState;
    azitGame: UseAzitGameController;
    onOpenMercModal: () => void;
    onBattleStarted: (response: AzitTowerBattleResponse, launchContext: TowerLaunchContext) => void;
}

interface TowerThemeStyle {
    activeTabClass: string;
    inactiveTabClass: string;
    badgeClass: string;
    borderClass: string;
    panelBgClass: string;
}

const TOWER_THEME_STYLES: Record<AzitTowerThemeId, TowerThemeStyle> = {
    'tower-1-forgotten': {
        activeTabClass: 'bg-slate-700 text-white border-slate-700 shadow-sm',
        inactiveTabClass: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        borderClass: 'border-slate-300',
        panelBgClass: 'bg-slate-50/90',
    },
    'tower-2-spirit': {
        activeTabClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
        inactiveTabClass: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        borderClass: 'border-emerald-300',
        panelBgClass: 'bg-emerald-50/70',
    },
    'tower-3-obsidian': {
        activeTabClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
        inactiveTabClass: 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        borderClass: 'border-indigo-300',
        panelBgClass: 'bg-indigo-50/70',
    },
    'tower-4-wyvern': {
        activeTabClass: 'bg-orange-600 text-white border-orange-600 shadow-sm',
        inactiveTabClass: 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
        borderClass: 'border-orange-300',
        panelBgClass: 'bg-orange-50/70',
    },
    'tower-5-abyss': {
        activeTabClass: 'bg-rose-600 text-white border-rose-600 shadow-sm',
        inactiveTabClass: 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        borderClass: 'border-rose-300',
        panelBgClass: 'bg-rose-50/70',
    },
};

function resolveThemeIdForFloor(floor: number, themes: AzitTowerThemeCatalogItem[]): AzitTowerThemeId {
    const matched = themes.find((t) => floor >= t.floorStart && floor <= t.floorEnd);
    if (matched) return matched.themeId;
    if (floor <= 40) return 'tower-1-forgotten';
    if (floor <= 80) return 'tower-2-spirit';
    if (floor <= 120) return 'tower-3-obsidian';
    if (floor <= 160) return 'tower-4-wyvern';
    return 'tower-5-abyss';
}

export const AzitTowerModal: React.FC<AzitTowerModalProps> = ({
    isOpen,
    onClose,
    gameState,
    azitGame,
    onOpenMercModal,
    onBattleStarted,
}) => {
    const highestClearedFloor = Math.max(
        0,
        Math.min(MAX_TOWER_FLOOR, gameState.tower?.highestClearedFloor ?? 0)
    );
    const maxUnlockedFloor = Math.min(MAX_TOWER_FLOOR, highestClearedFloor + 1);
    const totalClears = gameState.tower?.totalClears ?? 0;
    const totalAttempts = gameState.tower?.totalAttempts ?? 0;
    const maxPartySize = Math.max(1, gameState.profile.limits.maxPartySize);

    const themeTabs = useMemo<AzitTowerThemeCatalogItem[]>(() => {
        const fromCatalog = gameState.catalog.towerThemes;
        if (Array.isArray(fromCatalog) && fromCatalog.length > 0) {
            return fromCatalog;
        }
        return Object.values(AZIT_TOWER_THEMES).map((meta) => ({
            themeId: meta.themeId,
            name: meta.name,
            floorStart: meta.floorRange[0],
            floorEnd: meta.floorRange[1],
            themeColor: meta.badgeColor,
            primaryMaterialId: 'mat-slime-jelly',
            description: `${meta.floorRange[0]}~${meta.floorRange[1]}층 구역`,
        }));
    }, [gameState.catalog.towerThemes]);

    const catalogSummaries = useMemo(
        () => gameState.catalog.towerFloorsSummary ?? [],
        [gameState.catalog.towerFloorsSummary]
    );
    const [fetchedSummaries, setFetchedSummaries] = useState<AzitTowerFloorSummary[]>([]);
    const [isFetchingFloors, setIsFetchingFloors] = useState<boolean>(false);
    const [floorsError, setFloorsError] = useState<string | null>(null);
    const hasAttemptedFloorsFetchRef = useRef<boolean>(false);

    const loadFloorsFromServer = useCallback(async () => {
        hasAttemptedFloorsFetchRef.current = true;
        setIsFetchingFloors(true);
        setFloorsError(null);
        try {
            const list = await fetchAzitTowerFloors(1, MAX_TOWER_FLOOR);
            if (list.length === 0) {
                setFloorsError('층 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                setFetchedSummaries(list);
            }
        } catch {
            setFloorsError('층 정보를 불러오는 중 네트워크 오류가 발생했습니다.');
        } finally {
            setIsFetchingFloors(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            hasAttemptedFloorsFetchRef.current = false;
            setFloorsError(null);
            return;
        }
        if (
            catalogSummaries.length === 0 &&
            fetchedSummaries.length === 0 &&
            !isFetchingFloors &&
            !floorsError &&
            !hasAttemptedFloorsFetchRef.current
        ) {
            hasAttemptedFloorsFetchRef.current = true;
            void loadFloorsFromServer();
        }
    }, [
        isOpen,
        catalogSummaries.length,
        fetchedSummaries.length,
        isFetchingFloors,
        floorsError,
        loadFloorsFromServer,
    ]);

    const floorSummaries = useMemo(
        () => (catalogSummaries.length > 0 ? catalogSummaries : fetchedSummaries),
        [catalogSummaries, fetchedSummaries]
    );

    const [activeThemeId, setActiveThemeId] = useState<AzitTowerThemeId>(() =>
        resolveThemeIdForFloor(maxUnlockedFloor, themeTabs)
    );
    const [selectedFloor, setSelectedFloor] = useState<number>(maxUnlockedFloor);
    const [bossOnlyFilter, setBossOnlyFilter] = useState<boolean>(false);

    const mercRecordMap = useMemo(() => {
        const map = new Map<AzitMercCode, AzitMercenaryRecord>();
        gameState.mercenaries.forEach((m) => map.set(m.mercCode, m));
        return map;
    }, [gameState.mercenaries]);

    const getGroupBlockedReason = useCallback(
        (group: AzitMercenaryGroupRecord): string | null => {
            const members = group.mercCodes;
            if (members.length === 0) return '편성 없음';
            if (members.some((c) => mercRecordMap.get(c)?.status === 'dead')) {
                return '사망 포함';
            }
            if (members.some((c) => mercRecordMap.get(c)?.status === 'expedition')) {
                return '원정 중';
            }
            if (members.some((c) => !mercRecordMap.has(c))) {
                return '미보유';
            }
            if (members.some((c) => mercRecordMap.get(c)?.status !== 'idle')) {
                return '출전 불가';
            }
            if (members.length > maxPartySize) {
                return `정원 초과 (${members.length}/${maxPartySize}명)`;
            }
            return null;
        },
        [mercRecordMap, maxPartySize]
    );

    const idleMercs = useMemo(
        () => gameState.mercenaries.filter((m) => m.status === 'idle'),
        [gameState.mercenaries]
    );
    const [selectedParty, setSelectedParty] = useState<AzitMercCode[]>(() =>
        idleMercs.slice(0, maxPartySize).map((m) => m.mercCode)
    );
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [useElixir, setUseElixir] = useState<boolean>(false);

    const elixirQty = useMemo(
        () => gameState.items?.find((it) => it.itemId === 'item-battle-elixir')?.qty ?? 0,
        [gameState.items]
    );

    const prevIsOpenRef = useRef<boolean>(false);

    // Sync default floor/theme and initialize party ONLY when modal transitions closed -> open
    useEffect(() => {
        const wasOpen = prevIsOpenRef.current;
        prevIsOpenRef.current = isOpen;
        if (isOpen && !wasOpen) {
            const frontier = Math.min(MAX_TOWER_FLOOR, highestClearedFloor + 1);
            setSelectedFloor(frontier);
            setActiveThemeId(resolveThemeIdForFloor(frontier, themeTabs));

            const idleSet = new Set(idleMercs.map((m) => m.mercCode));
            setSelectedParty((prev) => {
                const validPrev = prev.filter((code) => idleSet.has(code)).slice(0, maxPartySize);
                if (validPrev.length > 0) {
                    return validPrev;
                }
                return idleMercs.slice(0, maxPartySize).map((m) => m.mercCode);
            });
        }
    }, [isOpen, highestClearedFloor, themeTabs, idleMercs, maxPartySize]);

    // Prune non-idle/dead/busy mercenaries while open without auto-refilling an empty manual selection
    useEffect(() => {
        if (!isOpen) return;
        const idleSet = new Set(idleMercs.map((m) => m.mercCode));
        setSelectedParty((prev) => {
            const validPrev = prev.filter((code) => idleSet.has(code)).slice(0, maxPartySize);
            const isSameParty =
                prev.length === validPrev.length &&
                prev.every((code, idx) => code === validPrev[idx]);
            return isSameParty ? prev : validPrev;
        });
    }, [isOpen, idleMercs, maxPartySize]);

    useEffect(() => {
        if (!isOpen || selectedGroupId === null) return;
        const activeGroup = gameState.groups?.find((g) => g.id === selectedGroupId) ?? null;
        if (!activeGroup || getGroupBlockedReason(activeGroup) !== null) {
            setSelectedGroupId(null);
        }
    }, [isOpen, gameState.groups, selectedGroupId, getGroupBlockedReason]);

    useEffect(() => {
        if (elixirQty < 1 && useElixir) {
            setUseElixir(false);
        }
    }, [elixirQty, useElixir]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !azitGame.isActing) {
                onClose();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, azitGame.isActing, onClose]);

    const activeTheme = useMemo(
        () => themeTabs.find((t) => t.themeId === activeThemeId) ?? themeTabs[0],
        [themeTabs, activeThemeId]
    );

    const visibleFloors = useMemo(() => {
        if (!activeTheme) return floorSummaries;
        return floorSummaries.filter(
            (f) =>
                f.floor >= activeTheme.floorStart &&
                f.floor <= activeTheme.floorEnd &&
                (!bossOnlyFilter || f.isBoss)
        );
    }, [floorSummaries, activeTheme, bossOnlyFilter]);

    const selectedFloorSummary = useMemo(
        () => floorSummaries.find((f) => f.floor === selectedFloor) ?? null,
        [floorSummaries, selectedFloor]
    );

    const selectedFloorTheme = useMemo(() => {
        const tid = selectedFloorSummary?.themeId ?? resolveThemeIdForFloor(selectedFloor, themeTabs);
        return themeTabs.find((t) => t.themeId === tid) ?? activeTheme;
    }, [selectedFloorSummary, selectedFloor, themeTabs, activeTheme]);

    const primaryMaterialMeta = useMemo(() => {
        if (!selectedFloorTheme) return null;
        return (
            gameState.catalog.materials.find(
                (m) => m.materialId === selectedFloorTheme.primaryMaterialId
            ) ?? null
        );
    }, [selectedFloorTheme, gameState.catalog.materials]);

    const mercCatalogMap = useMemo(() => {
        const map = new Map<AzitMercCode, { name: string; emoji: string; role: string }>();
        gameState.catalog.mercenaries.forEach((m) => {
            map.set(m.mercCode, { name: m.name, emoji: m.emoji, role: m.role });
        });
        return map;
    }, [gameState.catalog.mercenaries]);

    const partyPower = useMemo(() => {
        const basePower = selectedParty.reduce((sum, code) => {
            const rec = mercRecordMap.get(code);
            return sum + (rec ? rec.power : 0);
        }, 0);
        return useElixir && elixirQty > 0 ? Math.round(basePower * 1.12) : basePower;
    }, [selectedParty, mercRecordMap, useElixir, elixirQty]);

    const isSelectedLocked = selectedFloor > maxUnlockedFloor;
    const isSelectedCleared = selectedFloor <= highestClearedFloor;

    const handleSelectThemeTab = (theme: AzitTowerThemeCatalogItem) => {
        setActiveThemeId(theme.themeId);
        const firstInTab = floorSummaries.find(
            (f) =>
                f.floor >= theme.floorStart &&
                f.floor <= theme.floorEnd &&
                (!bossOnlyFilter || f.isBoss)
        );
        if (selectedFloor < theme.floorStart || selectedFloor > theme.floorEnd) {
            if (maxUnlockedFloor >= theme.floorStart && maxUnlockedFloor <= theme.floorEnd) {
                setSelectedFloor(maxUnlockedFloor);
            } else if (firstInTab) {
                setSelectedFloor(firstInTab.floor);
            } else {
                setSelectedFloor(theme.floorStart);
            }
        }
    };

    const handleSelectGroup = (group: AzitMercenaryGroupRecord) => {
        if (getGroupBlockedReason(group) !== null || group.mercCodes.length === 0) return;
        setSelectedGroupId(group.id);
        setSelectedParty([...group.mercCodes]);
    };

    const handleToggleMerc = (mercCode: AzitMercCode) => {
        const rec = mercRecordMap.get(mercCode);
        if (!rec || rec.status !== 'idle') return;
        setSelectedGroupId(null);
        setSelectedParty((prev) => {
            if (prev.includes(mercCode)) {
                return prev.filter((c) => c !== mercCode);
            }
            if (prev.length >= maxPartySize) {
                return [...prev.slice(1), mercCode];
            }
            return [...prev, mercCode];
        });
    };

    const handleStartBattle = async () => {
        if (isSelectedLocked || azitGame.isActing) return;
        if (!azitGame.battleTowerFloor) return;
        const validParty = selectedParty
            .filter((code) => mercRecordMap.get(code)?.status === 'idle')
            .slice(0, maxPartySize);
        if (validParty.length === 0) return;

        const matchedGroup =
            selectedGroupId !== null
                ? (gameState.groups?.find((g) => g.id === selectedGroupId) ?? null)
                : null;
        const isGroupEligible = Boolean(
            matchedGroup &&
                getGroupBlockedReason(matchedGroup) === null &&
                matchedGroup.mercCodes.length === validParty.length &&
                matchedGroup.mercCodes.every((code) => validParty.includes(code))
        );
        const effectiveGroupId = isGroupEligible && matchedGroup ? matchedGroup.id : null;
        if (selectedGroupId !== null && effectiveGroupId === null) {
            setSelectedGroupId(null);
        }

        const elixirItemId: AzitItemId | undefined =
            useElixir && elixirQty > 0 ? 'item-battle-elixir' : undefined;
        const res = await azitGame.battleTowerFloor({
            floor: selectedFloor,
            ...(effectiveGroupId !== null
                ? { groupId: effectiveGroupId }
                : { partyMercCodes: validParty }),
            ...(elixirItemId ? { elixirItemId } : {}),
        });
        if (res) {
            onBattleStarted(res, {
                floor: selectedFloor,
                ...(effectiveGroupId !== null ? { groupId: effectiveGroupId } : {}),
                partyMercCodes: [...validParty],
                useElixir: Boolean(elixirItemId),
            });
        }
    };

    if (!isOpen) return null;

    const activeStyle = TOWER_THEME_STYLES[activeThemeId] ?? TOWER_THEME_STYLES['tower-1-forgotten'];
    const elixirVisual = getItemVisualMeta('item-battle-elixir');

    return (
        <div
            data-tower-lobby="true"
            data-testid="azit-tower-lobby"
            role="dialog"
            aria-modal="true"
            aria-label="베라의 탑 200층 로비"
            onClick={onClose}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-2.5 sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#f0f4f8] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-white/90 flex flex-col overflow-hidden min-w-0"
            >
                {/* Header */}
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 flex items-center gap-2 bg-gradient-to-r from-indigo-50 via-white to-violet-50 shrink-0 min-w-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                                🏰 베라의 탑
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-black font-mono shrink-0">
                                {highestClearedFloor} / {MAX_TOWER_FLOOR}F
                            </span>
                            {selectedFloor !== maxUnlockedFloor && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFloor(maxUnlockedFloor);
                                        setActiveThemeId(resolveThemeIdForFloor(maxUnlockedFloor, themeTabs));
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-[10px] font-black cursor-pointer shrink-0"
                                >
                                    🎯 {maxUnlockedFloor}F 이동
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-semibold flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                            <span>정복 {totalClears.toLocaleString()}회 · 총 시도 {totalAttempts.toLocaleString()}회</span>
                            <span className="text-amber-700 font-black font-mono">
                                🪙 {gameState.veraPoints.toLocaleString()} P
                            </span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="모달 닫기"
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black cursor-pointer shrink-0 flex items-center justify-center shadow-xs"
                    >
                        ×
                    </button>
                </div>

                {/* 5 Theme Range Tabs + Boss Filter */}
                <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200/80 bg-[#e8edf2]/80 space-y-2 shrink-0 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {themeTabs.map((theme) => {
                            const isActive = theme.themeId === activeThemeId;
                            const style =
                                TOWER_THEME_STYLES[theme.themeId] ?? TOWER_THEME_STYLES['tower-1-forgotten'];
                            return (
                                <button
                                    key={theme.themeId}
                                    type="button"
                                    data-tower-theme-tab={theme.themeId}
                                    data-testid={`tower-theme-${theme.themeId}`}
                                    onClick={() => handleSelectThemeTab(theme)}
                                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer transition-all flex items-center gap-1 ${
                                        isActive ? style.activeTabClass : style.inactiveTabClass
                                    }`}
                                >
                                    <span>{theme.floorStart}~{theme.floorEnd}F</span>
                                    <span className="hidden sm:inline opacity-90">{theme.name}</span>
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setBossOnlyFilter((prev) => !prev)}
                            className={`ml-auto px-2.5 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer transition-all shrink-0 ${
                                bossOnlyFilter
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            👑 보스층만
                        </button>
                    </div>

                    {activeTheme && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-semibold">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${activeStyle.badgeClass}`}>
                                {activeTheme.name}
                            </span>
                            <span className="truncate">{activeTheme.description}</span>
                        </div>
                    )}
                </div>

                {/* Main Workspace (Scrollable) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Floor Grid */}
                    <div className="lg:col-span-7 flex flex-col gap-2.5 min-w-0">
                        {isFetchingFloors && floorSummaries.length === 0 ? (
                            <div className="py-12 px-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                                <div className="text-sm font-black text-indigo-700">
                                    🏰 베라의 탑 층 정보를 불러오는 중...
                                </div>
                                <p className="text-xs text-slate-500 font-semibold">
                                    1층부터 200층까지의 수호 몬스터 데이터를 동기화하고 있습니다.
                                </p>
                            </div>
                        ) : floorsError && floorSummaries.length === 0 ? (
                            <div className="py-10 px-4 rounded-2xl bg-white border border-rose-200 text-center space-y-3">
                                <div className="text-sm font-black text-rose-700">{floorsError}</div>
                                <button
                                    type="button"
                                    onClick={() => void loadFloorsFromServer()}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
                                >
                                    🔄 다시 불러오기
                                </button>
                            </div>
                        ) : visibleFloors.length === 0 ? (
                            <div className="py-10 px-4 rounded-2xl bg-white border border-slate-200 text-center text-xs font-bold text-slate-500">
                                선택한 조건에 해당하는 층 정보가 없습니다.
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                                {visibleFloors.map((f) => {
                                    const isCleared = f.floor <= highestClearedFloor;
                                    const isLocked = f.floor > maxUnlockedFloor;
                                    const isFrontier = f.floor === maxUnlockedFloor;
                                    const isSelected = f.floor === selectedFloor;

                                    return (
                                        <button
                                            key={f.floor}
                                            type="button"
                                            data-tower-floor={f.floor}
                                            data-tower-locked={isLocked ? 'true' : 'false'}
                                            onClick={() => setSelectedFloor(f.floor)}
                                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 min-w-0 ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                                                    : isLocked
                                                      ? 'bg-slate-200/70 text-slate-400 border-slate-300/70 hover:bg-slate-200'
                                                      : isCleared
                                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                                        : 'bg-white text-slate-900 border-amber-400 shadow-xs hover:bg-amber-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1 w-full">
                                                <span className="text-xs font-black font-mono truncate">
                                                    {f.floor}F
                                                </span>
                                                <span className="text-[10px] shrink-0">
                                                    {isLocked
                                                        ? '🔒'
                                                        : isCleared
                                                          ? '✓'
                                                          : isFrontier
                                                            ? '⚔️'
                                                            : '•'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="text-xs shrink-0">{f.bossEmoji}</span>
                                                {f.floorType === 'major_boss' ? (
                                                    <span
                                                        className={`px-1 rounded text-[9px] font-black truncate ${
                                                            isSelected
                                                                ? 'bg-rose-400 text-white'
                                                                : 'bg-rose-100 text-rose-700'
                                                        }`}
                                                    >
                                                        대보스
                                                    </span>
                                                ) : f.floorType === 'mini_boss' ? (
                                                    <span
                                                        className={`px-1 rounded text-[9px] font-black truncate ${
                                                            isSelected
                                                                ? 'bg-amber-400 text-slate-950'
                                                                : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                    >
                                                        보스
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold opacity-75 truncate">
                                                        일반
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[9px] font-mono font-bold opacity-80 truncate">
                                                ⚔️ {f.recommendedPower.toLocaleString()}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Floor Inspector + Party & Buffs */}
                    <div className="lg:col-span-5 flex flex-col gap-3 min-w-0">
                        {/* Selected Floor Card */}
                        <div className={`p-3.5 rounded-2xl bg-white border ${activeStyle.borderClass} shadow-xs space-y-2.5 min-w-0`}>
                            <div className="flex items-start gap-2.5 min-w-0">
                                <span className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl shrink-0">
                                    {selectedFloorSummary?.bossEmoji ?? '👾'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-sm font-black text-slate-900">
                                            {selectedFloor}층
                                        </span>
                                        {selectedFloorSummary?.floorType === 'major_boss' && (
                                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                                                👑 10F 대보스
                                            </span>
                                        )}
                                        {selectedFloorSummary?.floorType === 'mini_boss' && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                                                ⚔️ 5F 미니보스
                                            </span>
                                        )}
                                        {isSelectedCleared && (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                                ✓ 클리어 완료
                                            </span>
                                        )}
                                        {isSelectedLocked && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-black">
                                                🔒 잠금됨
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-extrabold text-slate-700 truncate mt-0.5">
                                        {selectedFloorSummary?.name ?? `${selectedFloor}층 수호전`}
                                    </div>
                                    <div className="text-[11px] font-semibold text-slate-500 truncate">
                                        대표 적: {selectedFloorSummary?.bossName ?? '수호 몬스터'}
                                    </div>
                                </div>
                            </div>

                            {/* Recommended vs Party Power */}
                            {selectedFloorSummary && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-bold text-slate-600">
                                        권장 전투력{' '}
                                        <strong className="font-mono text-slate-900">
                                            {selectedFloorSummary.recommendedPower.toLocaleString()}
                                        </strong>
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span
                                        className={`font-black font-mono ${
                                            partyPower >= selectedFloorSummary.recommendedPower
                                                ? 'text-emerald-700'
                                                : 'text-rose-600'
                                        }`}
                                    >
                                        내 파티 {partyPower.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {/* R5 Rewards Preview */}
                            {selectedFloorSummary && (
                                <div className="space-y-1.5 text-[11px]">
                                    <div
                                        className={`p-2 rounded-xl border ${
                                            !isSelectedCleared
                                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                                : 'bg-slate-50 border-slate-200 text-slate-500'
                                        }`}
                                    >
                                        <div className="font-black flex items-center gap-1">
                                            <span>🌟 최초 클리어 보상</span>
                                            {isSelectedCleared && (
                                                <span className="text-[10px] font-bold">(수령 완료)</span>
                                            )}
                                        </div>
                                        <div className="font-mono font-bold mt-0.5">
                                            🪙 {selectedFloorSummary.firstClearPoints.toLocaleString()} P · ⚔️ 용병 EXP{' '}
                                            {selectedFloorSummary.firstClearMercXp.toLocaleString()}
                                        </div>
                                    </div>
                                    <div
                                        className={`p-2 rounded-xl border ${
                                            isSelectedCleared
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <div className="font-black">🔄 반복 토벌 보상</div>
                                        <div className="font-mono font-bold mt-0.5 flex flex-wrap items-center gap-x-2">
                                            <span>🪙 {selectedFloorSummary.repeatPoints.toLocaleString()} P</span>
                                            {primaryMaterialMeta && (
                                                <span>
                                                    · {primaryMaterialMeta.emoji} {primaryMaterialMeta.name} & 스킬 재화 드롭
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Party Selection Card */}
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-black text-slate-900">
                                    👥 출전 파티 편성 ({selectedParty.length}/{maxPartySize}명)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenMercModal();
                                    }}
                                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 cursor-pointer shrink-0"
                                >
                                    용병·그룹 관리 →
                                </button>
                            </div>

                            {/* Saved Groups Quick-Pick */}
                            {(gameState.groups?.length ?? 0) > 0 && (
                                <div className="space-y-1">
                                    <div className="text-[10px] font-extrabold text-slate-500">
                                        저장된 용병 그룹 빠른 선택
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {gameState.groups?.map((grp) => {
                                            const blockedReason = getGroupBlockedReason(grp);
                                            const isPicked = selectedGroupId === grp.id && !blockedReason;
                                            return (
                                                <button
                                                    key={grp.id}
                                                    type="button"
                                                    disabled={Boolean(blockedReason)}
                                                    onClick={() => handleSelectGroup(grp)}
                                                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black border cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        isPicked
                                                            ? 'bg-indigo-600 text-white border-indigo-700'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50'
                                                    }`}
                                                >
                                                    {grp.name} ({grp.mercCodes.length}명)
                                                    {blockedReason ? ` · ${blockedReason}` : ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Manual Living Mercenary Selection */}
                            {gameState.mercenaries.length === 0 ? (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                                    <div className="text-xs font-bold text-slate-600">
                                        영입된 용병이 없습니다.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onOpenMercModal();
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black cursor-pointer"
                                    >
                                        🛡️ 용병 길드에서 영입하기
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {gameState.mercenaries.map((merc) => {
                                        const cat = mercCatalogMap.get(merc.mercCode);
                                        const isPicked = selectedParty.includes(merc.mercCode);
                                        const isDead = merc.status === 'dead';
                                        const isExpedition = merc.status === 'expedition';
                                        const isBlocked = isDead || isExpedition;

                                        return (
                                            <button
                                                key={merc.mercCode}
                                                type="button"
                                                disabled={isBlocked}
                                                onClick={() => handleToggleMerc(merc.mercCode)}
                                                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 min-w-0 disabled:opacity-55 disabled:cursor-not-allowed ${
                                                    isDead
                                                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                        : isExpedition
                                                          ? 'bg-violet-50 border-violet-200 text-violet-700'
                                                          : isPicked
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-400'
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="text-base shrink-0">{cat?.emoji ?? '⚔️'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-black truncate">
                                                        {cat?.name ?? merc.mercCode} Lv.{merc.level}
                                                    </div>
                                                    <div className="text-[10px] font-bold truncate">
                                                        {isDead
                                                            ? '💀 전투불능 (부활 필요)'
                                                            : isExpedition
                                                              ? '⚔️ 원정 출정 중'
                                                              : `전투력 ${merc.power.toLocaleString()}`}
                                                    </div>
                                                </div>
                                                {!isBlocked && (
                                                    <span className="text-[10px] font-black shrink-0">
                                                        {isPicked ? '✓' : '+'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {gameState.mercenaries.length > 0 && idleMercs.length === 0 && (
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800 flex flex-wrap items-center justify-between gap-2">
                                    <span>출전 가능한 대기 용병이 없습니다.</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onOpenMercModal();
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black cursor-pointer"
                                    >
                                        부활·길드 열기
                                    </button>
                                </div>
                            )}

                            {/* Optional Battle Elixir Toggle */}
                            <button
                                type="button"
                                disabled={elixirQty < 1}
                                onClick={() => setUseElixir((prev) => !prev)}
                                className={`w-full p-2 rounded-xl border text-left text-[11px] font-black transition-all cursor-pointer flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    useElixir && elixirQty > 0
                                        ? 'bg-rose-50 border-rose-400 text-rose-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <span className="truncate">
                                    {elixirVisual.emoji} 투지의 비약 (+12% 공격·생존 버프)
                                </span>
                                <span className="font-mono shrink-0">
                                    {useElixir && elixirQty > 0 ? '✓ 사용 ON' : `보유 ${elixirQty}개`}
                                </span>
                            </button>

                            {/* R4 Penalty-Free Guarantee */}
                            <div className="px-2.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-800">
                                🛡️ 베라의 탑 수호 결계: 전투에서 패배하더라도 사망 패널티 및 부활 아이템 소모 없이 전원 즉시 회복됩니다.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="text-xs font-bold text-slate-700 min-w-0">
                        {isSelectedLocked ? (
                            <span className="text-rose-600 font-black">
                                🔒 {selectedFloor - 1}층 정복 후 개방됩니다.
                            </span>
                        ) : (
                            <span>
                                선택: <strong className="text-indigo-700">{selectedFloor}층</strong> · 파티{' '}
                                <strong className="font-mono">{selectedParty.length}</strong>명 (전투력{' '}
                                <strong className="font-mono">{partyPower.toLocaleString()}</strong>)
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        data-testid="azit-tower-start-battle"
                        disabled={
                            isSelectedLocked ||
                            selectedParty.length === 0 ||
                            azitGame.isActing ||
                            !azitGame.battleTowerFloor
                        }
                        onClick={() => void handleStartBattle()}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-black shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                    >
                        {azitGame.isActing
                            ? '⚔️ 전장 진입 중...'
                            : isSelectedLocked
                              ? `🔒 ${selectedFloor}층 잠김`
                              : `⚔️ ${selectedFloor}층 도전 시작`}
                    </button>
                </div>
            </div>
        </div>
    );
};
