'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MinihomeGardenState } from '@/types/minihome.types';
import type {
    AzitBattleReport,
    AzitChefCode,
    AzitCropId,
    AzitFullGameState,
    AzitMercCode,
    AzitRecipeId,
    AzitZoneId,
    UseAzitGameController,
} from '@/types/azit-game.types';

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
    onSyncRef.current = onSyncState;
    onToastRef.current = onToast;

    const applyState = useCallback((nextState: AzitFullGameState) => {
        setState(nextState);
        onSyncRef.current?.(nextState.veraPoints, nextState.garden);
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
            setState(null);
            return;
        }
        refreshState().catch(() => {});
    }, [enabled, refreshState]);

    useEffect(() => {
        if (!enabled) return;
        const timer = window.setInterval(() => {
            setNowMs(Date.now());
        }, 1000);
        return () => window.clearInterval(timer);
    }, [enabled]);

    const runAction = useCallback(
        async (endpoint: string, payload: Record<string, unknown>, openReport = false): Promise<boolean> => {
            if (!enabled) return false;
            setIsActing(true);
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
                const json = (await res.json()) as AzitApiResponse<AzitApiPayload>;
                if (!res.ok || !json.success || !json.data) {
                    const errMsg = json.error?.message || '요청을 처리하지 못했습니다.';
                    onToastRef.current?.(`⚠️ ${errMsg}`);
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
                onToastRef.current?.(`⚠️ ${errMsg}`);
                return false;
            } finally {
                setIsActing(false);
            }
        },
        [enabled, applyState]
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
        (recipeId: AzitRecipeId, quantity = 1) => runAction('/api/azit-game/dishes/sell', { recipeId, quantity }),
        [runAction]
    );

    const hireMercenary = useCallback(
        (mercCode: AzitMercCode) => runAction('/api/azit-game/mercenaries/hire', { mercCode }),
        [runAction]
    );

    const upgradeMercenary = useCallback(
        (mercCode: AzitMercCode) => runAction('/api/azit-game/mercenaries/upgrade', { mercCode }),
        [runAction]
    );

    const startExpedition = useCallback(
        (zoneId: AzitZoneId, partyMercCodes: AzitMercCode[], dishRecipeId: AzitRecipeId) =>
            runAction('/api/azit-game/expeditions/start', { zoneId, partyMercCodes, dishRecipeId }),
        [runAction]
    );

    const claimExpedition = useCallback(
        (expeditionId: number) => runAction('/api/azit-game/expeditions/claim', { expeditionId }, true),
        [runAction]
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
        hireChef,
        upgradeChef,
        startCooking,
        claimCooking,
        sellDish,
        hireMercenary,
        upgradeMercenary,
        startExpedition,
        claimExpedition,
    };
}
