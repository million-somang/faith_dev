'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MinihomeGardenState } from '@/types/minihome.types';
import type {
    AzitBattleReport,
    AzitChefCode,
    AzitCropId,
    AzitDishQuality,
    AzitFarmerCode,
    AzitFarmerConfigurePayload,
    AzitFertilizerId,
    AzitFullGameState,
    AzitItemId,
    AzitMercCode,
    AzitRecipeId,
    AzitTowerBattleResponse,
    AzitTowerFloorSummary,
    AzitZoneId,
    UseAzitGameController,
} from '@/types/azit-game.types';
import { MAX_TOWER_FLOOR, MERC_GOLD_UPGRADE_ENABLED } from '@/types/azit-game.types';

interface AzitApiPayload {
    message?: string;
    state?: AzitFullGameState;
    report?: AzitBattleReport;
}

interface AzitApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
    };
}

interface UseAzitGameOptions {
    enabled: boolean;
    onSyncState?: (veraPoints: number, garden?: MinihomeGardenState) => void;
    onToast?: (message: string) => void;
}

export function useAzitGame(options: UseAzitGameOptions): UseAzitGameController {
    const { enabled, onSyncState, onToast } = options;

    const [state, setState] = useState<AzitFullGameState | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isActing, setIsActing] = useState<boolean>(false);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [lastBattleReport, setLastBattleReport] = useState<AzitBattleReport | null>(null);

    const onSyncRef = useRef(onSyncState);
    const onToastRef = useRef(onToast);
    const clockOffsetRef = useRef<number>(0);
    const isActingRef = useRef<boolean>(false);
    onSyncRef.current = onSyncState;
    onToastRef.current = onToast;

    const applyState = useCallback((nextState: AzitFullGameState) => {
        const normalizedState: AzitFullGameState = {
            ...nextState,
            specialDishes: nextState.specialDishes ?? ({} as Record<AzitRecipeId, number>),
            farmers: Array.isArray(nextState.farmers) ? nextState.farmers : [],
            farmerLogs: Array.isArray(nextState.farmerLogs) ? nextState.farmerLogs : [],
            groups: Array.isArray(nextState.groups) ? nextState.groups : [],
            items: Array.isArray(nextState.items) ? nextState.items : [],
            tower: nextState.tower ?? {
                highestClearedFloor: 0,
                maxFloor: MAX_TOWER_FLOOR,
                totalClears: 0,
                totalAttempts: 0,
            },
            catalog: {
                ...nextState.catalog,
                fertilizers: Array.isArray(nextState.catalog?.fertilizers) ? nextState.catalog.fertilizers : [],
                soilLevels: Array.isArray(nextState.catalog?.soilLevels) ? nextState.catalog.soilLevels : [],
                plotUnlocks: Array.isArray(nextState.catalog?.plotUnlocks) ? nextState.catalog.plotUnlocks : [],
                farmers: Array.isArray(nextState.catalog?.farmers) ? nextState.catalog.farmers : [],
                items: Array.isArray(nextState.catalog?.items) ? nextState.catalog.items : [],
                craftRecipes: Array.isArray(nextState.catalog?.craftRecipes) ? nextState.catalog.craftRecipes : [],
                towerThemes: Array.isArray(nextState.catalog?.towerThemes) ? nextState.catalog.towerThemes : [],
                towerFloorsSummary: Array.isArray(nextState.catalog?.towerFloorsSummary)
                    ? nextState.catalog.towerFloorsSummary
                    : [],
            },
        };
        if (typeof normalizedState.serverNowMs === 'number') {
            clockOffsetRef.current = normalizedState.serverNowMs - Date.now();
            setNowMs(normalizedState.serverNowMs);
        }
        setState(normalizedState);
        onSyncRef.current?.(normalizedState.veraPoints, normalizedState.garden);
    }, []);

    const refreshState = useCallback(async (): Promise<AzitFullGameState | null> => {
        if (!enabled) return null;
        setIsLoading(true);
        try {
            const res = await fetch('/api/azit-game/state', { credentials: 'include' });
            const json = (await res.json()) as AzitApiResponse<AzitFullGameState>;
            if (!res.ok || !json.success || !json.data) {
                return null;
            }
            applyState(json.data);
            return json.data;
        } catch (err) {
            console.error('[useAzitGame] refresh error:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [enabled, applyState]);

    useEffect(() => {
        if (!enabled) {
            clockOffsetRef.current = 0;
            setLastBattleReport(null);
            setState(null);
            return;
        }
        refreshState().catch(() => {});
    }, [enabled, refreshState]);

    useEffect(() => {
        if (!enabled) return;
        const timer = window.setInterval(() => {
            setNowMs(Date.now() + clockOffsetRef.current);
        }, 1000);
        return () => window.clearInterval(timer);
    }, [enabled]);

    const runAction = useCallback(
        async (endpoint: string, payload: Record<string, unknown>, openReport = false): Promise<boolean> => {
            if (!enabled || isActingRef.current) return false;
            isActingRef.current = true;
            setIsActing(true);
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
                const rawText = await res.text();
                let json: AzitApiResponse<AzitApiPayload> | null = null;
                try {
                    json = JSON.parse(rawText) as AzitApiResponse<AzitApiPayload>;
                } catch {
                    json = null;
                }

                if (!json) {
                    onToastRef.current?.('⚠️ 서버 응답이 지연되어 최신 아지트 상태를 다시 동기화합니다...');
                    await refreshState();
                    return false;
                }

                if (!res.ok || !json.success || !json.data) {
                    const errMsg = json.error?.message || '요청을 처리하지 못했습니다.';
                    onToastRef.current?.(`⚠️ ${errMsg}`);
                    if (res.status === 409 || res.status >= 502) {
                        await refreshState();
                    }
                    return false;
                }
                if (json.data.state) {
                    applyState(json.data.state);
                }
                if (openReport && json.data.report) {
                    setLastBattleReport(json.data.report);
                }
                if (json.data.message) {
                    onToastRef.current?.(json.data.message);
                }
                return true;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
                onToastRef.current?.(`⚠️ ${errMsg} (상태 동기화 중...)`);
                refreshState().catch(() => {});
                return false;
            } finally {
                isActingRef.current = false;
                setIsActing(false);
            }
        },
        [enabled, applyState, refreshState]
    );

    const buySeed = useCallback(
        (cropId: AzitCropId, quantity = 1) => runAction('/api/azit-game/garden/buy-seed', { cropId, quantity }),
        [runAction]
    );

    const plantCrop = useCallback(
        (plotIndex: number, cropId: AzitCropId) => runAction('/api/azit-game/garden/plant', { plotIndex, cropId }),
        [runAction]
    );

    const waterPlot = useCallback(
        (plotIndex: number) => runAction('/api/azit-game/garden/water', { plotIndex }),
        [runAction]
    );

    const harvestPlot = useCallback(
        (plotIndex: number) => runAction('/api/azit-game/garden/harvest', { plotIndex }),
        [runAction]
    );

    const clearPlot = useCallback(
        (plotIndex: number) => runAction('/api/azit-game/garden/clear', { plotIndex }),
        [runAction]
    );

    const sellCrop = useCallback(
        (cropId: AzitCropId, quantity = 1) => runAction('/api/azit-game/crops/sell', { cropId, quantity }),
        [runAction]
    );

    const unlockPlot = useCallback(
        (plotIndex: number) => runAction('/api/azit-game/garden/unlock-plot', { plotIndex }),
        [runAction]
    );

    const buyFertilizer = useCallback(
        (fertilizerId: AzitFertilizerId = 'fert-basic', quantity = 1) =>
            runAction('/api/azit-game/garden/fertilizer/buy', { fertilizerId, quantity }),
        [runAction]
    );

    const fertilizePlot = useCallback(
        (plotIndex: number, fertilizerId: AzitFertilizerId = 'fert-basic') =>
            runAction('/api/azit-game/garden/fertilize', { plotIndex, fertilizerId }),
        [runAction]
    );

    const upgradeSoil = useCallback(
        (plotIndex: number) => runAction('/api/azit-game/garden/upgrade-soil', { plotIndex }),
        [runAction]
    );

    const waterAll = useCallback(
        () => runAction('/api/azit-game/garden/water-all', {}),
        [runAction]
    );

    const harvestAll = useCallback(
        () => runAction('/api/azit-game/garden/harvest-all', {}),
        [runAction]
    );

    const plantAll = useCallback(
        (cropId: AzitCropId) => runAction('/api/azit-game/garden/plant-all', { cropId }),
        [runAction]
    );

    const hireFarmer = useCallback(
        (farmerCode: AzitFarmerCode) => runAction('/api/azit-game/farmers/hire', { farmerCode }),
        [runAction]
    );

    const upgradeFarmer = useCallback(
        (farmerCode: AzitFarmerCode) => runAction('/api/azit-game/farmers/upgrade', { farmerCode }),
        [runAction]
    );

    const configureFarmer = useCallback(
        (payload: AzitFarmerConfigurePayload) =>
            runAction('/api/azit-game/farmers/config', {
                farmerCode: payload.farmerCode,
                ...(typeof payload.autoEnabled === 'boolean' ? { autoEnabled: payload.autoEnabled } : {}),
                ...(payload.preferredCropId !== undefined ? { preferredCropId: payload.preferredCropId } : {}),
                ...(typeof payload.autoFertilize === 'boolean' ? { autoFertilize: payload.autoFertilize } : {}),
            }),
        [runAction]
    );

    const hireChef = useCallback(
        (chefCode: AzitChefCode) => runAction('/api/azit-game/chefs/hire', { chefCode }),
        [runAction]
    );

    const upgradeChef = useCallback(
        (chefCode: AzitChefCode) => runAction('/api/azit-game/chefs/upgrade', { chefCode }),
        [runAction]
    );

    const startCooking = useCallback(
        (slotIndex: number, recipeId: AzitRecipeId, chefCode?: AzitChefCode | null) =>
            runAction('/api/azit-game/kitchen/start', { slotIndex, recipeId, chefCode: chefCode ?? null }),
        [runAction]
    );

    const claimCooking = useCallback(
        (slotIndex: number) => runAction('/api/azit-game/kitchen/claim', { slotIndex }),
        [runAction]
    );

    const sellDish = useCallback(
        (recipeId: AzitRecipeId, quantity = 1, quality: AzitDishQuality = 'normal') =>
            runAction('/api/azit-game/dishes/sell', { recipeId, quantity, quality }),
        [runAction]
    );

    const hireMercenary = useCallback(
        (mercCode: AzitMercCode) => runAction('/api/azit-game/mercenaries/hire', { mercCode }),
        [runAction]
    );

    const upgradeMercenary = useCallback(async (_mercCode: AzitMercCode): Promise<boolean> => {
        if (!MERC_GOLD_UPGRADE_ENABLED) {
            onToastRef.current?.('⚠️ 용병은 전투 경험치로만 레벨업할 수 있습니다.');
        }
        return false;
    }, []);

    const startExpedition = useCallback(
        (
            zoneId: AzitZoneId,
            partyMercCodes: AzitMercCode[],
            dishRecipeId: AzitRecipeId,
            dishQuality: AzitDishQuality = 'normal',
            dispatchOptions?: { groupId?: number; elixirItemId?: AzitItemId }
        ) =>
            runAction('/api/azit-game/expeditions/start', {
                zoneId,
                partyMercCodes,
                dishRecipeId,
                dishQuality,
                ...(typeof dispatchOptions?.groupId === 'number'
                    ? { groupId: dispatchOptions.groupId }
                    : {}),
                ...(dispatchOptions?.elixirItemId ? { elixirItemId: dispatchOptions.elixirItemId } : {}),
            }),
        [runAction]
    );

    const claimExpedition = useCallback(
        (expeditionId: number) => runAction('/api/azit-game/expeditions/claim', { expeditionId }, true),
        [runAction]
    );

    const saveGroup = useCallback(
        (payload: { id?: number; name: string; slotIndex?: number; mercCodes: AzitMercCode[] }) =>
            runAction('/api/azit-game/groups/save', {
                ...(typeof payload.id === 'number' ? { id: payload.id } : {}),
                name: payload.name,
                ...(typeof payload.slotIndex === 'number' ? { slotIndex: payload.slotIndex } : {}),
                mercCodes: payload.mercCodes,
            }),
        [runAction]
    );

    const deleteGroup = useCallback(
        (groupId: number) => runAction('/api/azit-game/groups/delete', { groupId }),
        [runAction]
    );

    const reviveMercenary = useCallback(
        (mercCode: AzitMercCode, itemId: AzitItemId) =>
            runAction('/api/azit-game/mercenaries/revive', { mercCode, itemId }),
        [runAction]
    );

    const upgradeMercSkill = useCallback(
        (mercCode: AzitMercCode, skillSlot: 'main' | 'sub') =>
            runAction('/api/azit-game/mercenaries/skills/upgrade', { mercCode, skillSlot }),
        [runAction]
    );

    const buyShopItem = useCallback(
        (itemId: AzitItemId, qty = 1) => runAction('/api/azit-game/shop/buy', { itemId, qty }),
        [runAction]
    );

    const craftItem = useCallback(
        (recipeId: string, qty = 1) => runAction('/api/azit-game/craft', { recipeId, qty }),
        [runAction]
    );

    const battleTowerFloor = useCallback(
        async (payload: {
            floor: number;
            groupId?: number;
            partyMercCodes?: AzitMercCode[];
            elixirItemId?: AzitItemId;
        }): Promise<AzitTowerBattleResponse | null> => {
            if (!enabled || isActingRef.current) return null;
            isActingRef.current = true;
            setIsActing(true);
            try {
                const res = await fetch('/api/azit-game/tower/battle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        floor: payload.floor,
                        ...(typeof payload.groupId === 'number' ? { groupId: payload.groupId } : {}),
                        ...(payload.partyMercCodes ? { partyMercCodes: payload.partyMercCodes } : {}),
                        ...(payload.elixirItemId ? { elixirItemId: payload.elixirItemId } : {}),
                    }),
                });
                const rawText = await res.text();
                let json: AzitApiResponse<AzitTowerBattleResponse> | null = null;
                try {
                    json = JSON.parse(rawText) as AzitApiResponse<AzitTowerBattleResponse>;
                } catch {
                    json = null;
                }

                if (!json) {
                    onToastRef.current?.('⚠️ 서버 응답이 지연되어 최신 아지트 상태를 다시 동기화합니다...');
                    await refreshState();
                    return null;
                }

                if (!res.ok || !json.success || !json.data) {
                    const errMsg = json.error?.message || '베라의 탑 전투를 시작하지 못했습니다.';
                    onToastRef.current?.(`⚠️ ${errMsg}`);
                    if (res.status === 409 || res.status >= 502) {
                        await refreshState();
                    }
                    return null;
                }

                if (json.data.state) {
                    applyState(json.data.state);
                }
                return json.data;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
                onToastRef.current?.(`⚠️ ${errMsg} (상태 동기화 중...)`);
                refreshState().catch(() => {});
                return null;
            } finally {
                isActingRef.current = false;
                setIsActing(false);
            }
        },
        [enabled, applyState, refreshState]
    );

    return {
        state,
        isLoading,
        isActing,
        nowMs,
        lastBattleReport,
        clearBattleReport: useCallback(() => setLastBattleReport(null), []),
        refreshState,
        buySeed,
        plantCrop,
        waterPlot,
        harvestPlot,
        clearPlot,
        sellCrop,
        unlockPlot,
        buyFertilizer,
        fertilizePlot,
        upgradeSoil,
        waterAll,
        harvestAll,
        plantAll,
        hireFarmer,
        upgradeFarmer,
        configureFarmer,
        hireChef,
        upgradeChef,
        startCooking,
        claimCooking,
        sellDish,
        hireMercenary,
        upgradeMercenary,
        startExpedition,
        claimExpedition,
        saveGroup,
        deleteGroup,
        reviveMercenary,
        upgradeMercSkill,
        buyShopItem,
        craftItem,
        battleTowerFloor,
    };
}

interface TowerFloorsEnvelope {
    floors?: AzitTowerFloorSummary[];
    towerFloors?: AzitTowerFloorSummary[];
    items?: AzitTowerFloorSummary[];
}

export async function fetchAzitTowerFloors(
    from = 1,
    to = MAX_TOWER_FLOOR
): Promise<AzitTowerFloorSummary[]> {
    const rawFrom = Number.isFinite(from) ? Math.floor(from) : 1;
    const safeFrom = Math.max(1, Math.min(MAX_TOWER_FLOOR, rawFrom));
    const rawTo = Number.isFinite(to) ? Math.floor(to) : MAX_TOWER_FLOOR;
    const safeTo = Math.max(safeFrom, Math.min(MAX_TOWER_FLOOR, rawTo));
    try {
        const res = await fetch(`/api/azit-game/tower/floors?from=${safeFrom}&to=${safeTo}`, {
            credentials: 'include',
        });
        if (!res.ok) return [];
        const json = (await res.json()) as AzitApiResponse<AzitTowerFloorSummary[] | TowerFloorsEnvelope>;
        if (!json.success || !json.data) return [];
        if (Array.isArray(json.data)) {
            return json.data;
        }
        return json.data.floors ?? json.data.towerFloors ?? json.data.items ?? [];
    } catch (err) {
        console.error('[useAzitGame] fetchAzitTowerFloors error:', err);
        return [];
    }
}
