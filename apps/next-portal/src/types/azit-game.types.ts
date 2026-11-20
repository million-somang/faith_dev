import type { GardenCropId, MinihomeGardenState } from '@/types/minihome.types';

export type AzitZoneType = 'indoor' | 'garden' | 'kitchen' | 'camp';

export type AzitCropId = GardenCropId;

export type AzitMaterialId =
    | 'mat-slime-jelly'
    | 'mat-goblin-spice'
    | 'mat-forest-honey'
    | 'mat-wyvern-jerky'
    | 'mat-dragon-powder';

export type AzitRecipeId =
    | 'dish-carrot-soup'
    | 'dish-spicy-rice'
    | 'dish-tomato-stew'
    | 'dish-fresh-wrap'
    | 'dish-potato-gratin'
    | 'dish-strawberry-tart'
    | 'dish-knight-feast'
    | 'dish-dragon-elixir';

export type AzitChefCode = 'chef-momo' | 'chef-bulta' | 'chef-claire' | 'chef-dragon';

export type AzitMercCode =
    | 'merc-leo'
    | 'merc-rina'
    | 'merc-kael'
    | 'merc-serena'
    | 'merc-garr'
    | 'merc-aria';

export type AzitZoneId =
    | 'zone-slime'
    | 'zone-goblin'
    | 'zone-forest'
    | 'zone-golem'
    | 'zone-wyvern'
    | 'zone-dragon';

export interface AzitCropCatalogItem {
    cropId: AzitCropId;
    name: string;
    shortName: string;
    emoji: string;
    seedPrice: number;
    harvestYield: number;
    sellPrice: number;
    description: string;
}

export interface AzitMaterialCatalogItem {
    materialId: AzitMaterialId;
    name: string;
    emoji: string;
    description: string;
}

export interface AzitRecipeIngredient {
    kind: 'crop' | 'material';
    id: AzitCropId | AzitMaterialId;
    qty: number;
}

export interface AzitRecipeCatalogItem {
    recipeId: AzitRecipeId;
    name: string;
    emoji: string;
    tier: 1 | 2 | 3 | 4;
    cookDurationSec: number;
    sellPrice: number;
    powerBonusPct: number;
    winRateBonusPct: number;
    azitXpReward: number;
    requiredAzitLevel: number;
    description: string;
    ingredients: AzitRecipeIngredient[];
}

export interface AzitChefCatalogItem {
    chefCode: AzitChefCode;
    name: string;
    title: string;
    emoji: string;
    hireCost: number;
    requiredAzitLevel: number;
    baseSpeedBonusPct: number;
    baseGreatChancePct: number;
    maxLevel: number;
    description: string;
}

export interface AzitMercenaryCatalogItem {
    mercCode: AzitMercCode;
    name: string;
    role: '탱커' | '레인저' | '딜러' | '힐러' | '올라운더';
    emoji: string;
    hireCost: number;
    requiredAzitLevel: number;
    basePower: number;
    partyWinBonusPct: number;
    bossRewardBonusPct: number;
    maxLevel: number;
    description: string;
}

export interface AzitExpeditionZoneItem {
    zoneId: AzitZoneId;
    name: string;
    monsterName: string;
    emoji: string;
    durationSec: number;
    entryCost: number;
    minDishTier: 1 | 2 | 3 | 4;
    recommendedPower: number;
    rewardPoints: number;
    rewardAzitXp: number;
    rewardMercXp: number;
    dropMaterialId: AzitMaterialId;
    dropMinQty: number;
    dropMaxQty: number;
    isBoss: boolean;
    requiredAzitLevel: number;
    description: string;
}

export interface AzitLevelStep {
    level: number;
    requiredXp: number;
    title: string;
    kitchenSlots: number;
    maxChefs: number;
    maxMercs: number;
    maxPartySize: number;
    maxActiveExpeditions: number;
}

export interface AzitChefRecord {
    chefCode: AzitChefCode;
    level: number;
    speedBonusPct: number;
    greatChancePct: number;
    upgradeCost: number | null;
}

export interface AzitKitchenSlotState {
    slotIndex: number;
    unlocked: boolean;
    unlockLevel: number;
    recipeId: AzitRecipeId | null;
    chefCode: AzitChefCode | null;
    status: 'idle' | 'cooking';
    startedAtMs: number | null;
    endsAtMs: number | null;
}

export interface AzitMercenaryRecord {
    mercCode: AzitMercCode;
    level: number;
    xp: number;
    nextXp: number;
    power: number;
    status: 'idle' | 'expedition';
    upgradeCost: number | null;
}

export interface AzitExpeditionRecord {
    id: number;
    zoneId: AzitZoneId;
    partyMercCodes: AzitMercCode[];
    dishRecipeId: AzitRecipeId;
    entryCost: number;
    predictedWinRate: number;
    status: 'running' | 'won' | 'lost';
    startedAtMs: number;
    endsAtMs: number;
    claimedAt: string | null;
    rewardPoints: number;
    rewardXp: number;
    rewardMaterials: Partial<Record<AzitMaterialId, number>>;
    battleLog: string[];
}

export interface AzitLedgerRecord {
    id: number;
    deltaPoints: number;
    balanceAfter: number;
    txType: string;
    description: string;
    createdAt: string;
}

export interface AzitBattleReport {
    expeditionId: number;
    zoneId: AzitZoneId;
    zoneName: string;
    zoneEmoji: string;
    monsterName: string;
    won: boolean;
    predictedWinRate: number;
    rewardPoints: number;
    rewardXp: number;
    rewardMaterials: Partial<Record<AzitMaterialId, number>>;
    entryCostLost: number;
    lostDishId: AzitRecipeId;
    battleLog: string[];
}

export interface AzitFullGameState {
    profile: {
        userId: number;
        azitLevel: number;
        azitXp: number;
        title: string;
        nextLevelXp: number | null;
        progressPct: number;
        limits: {
            kitchenSlots: number;
            maxChefs: number;
            maxMercs: number;
            maxPartySize: number;
            maxActiveExpeditions: number;
        };
        totalCropsSold: number;
        totalDishesCooked: number;
        totalExpeditionsWon: number;
        totalExpeditionsLost: number;
    };
    veraPoints: number;
    serverNowMs?: number;
    garden: MinihomeGardenState;
    materials: Record<AzitMaterialId, number>;
    dishes: Record<AzitRecipeId, number>;
    chefs: AzitChefRecord[];
    kitchenSlots: AzitKitchenSlotState[];
    mercenaries: AzitMercenaryRecord[];
    activeExpeditions: AzitExpeditionRecord[];
    recentExpeditions: AzitExpeditionRecord[];
    recentLedger: AzitLedgerRecord[];
    catalog: {
        crops: AzitCropCatalogItem[];
        materials: AzitMaterialCatalogItem[];
        recipes: AzitRecipeCatalogItem[];
        chefs: AzitChefCatalogItem[];
        mercenaries: AzitMercenaryCatalogItem[];
        zones: AzitExpeditionZoneItem[];
        levels: AzitLevelStep[];
    };
}

export interface UseAzitGameController {
    state: AzitFullGameState | null;
    isLoading: boolean;
    isActing: boolean;
    nowMs: number;
    lastBattleReport: AzitBattleReport | null;
    clearBattleReport: () => void;
    refreshState: () => Promise<AzitFullGameState | null>;
    buySeed: (cropId: AzitCropId, quantity?: number) => Promise<boolean>;
    plantCrop: (plotIndex: number, cropId: AzitCropId) => Promise<boolean>;
    waterPlot: (plotIndex: number) => Promise<boolean>;
    harvestPlot: (plotIndex: number) => Promise<boolean>;
    clearPlot: (plotIndex: number) => Promise<boolean>;
    sellCrop: (cropId: AzitCropId, quantity?: number) => Promise<boolean>;
    hireChef: (chefCode: AzitChefCode) => Promise<boolean>;
    upgradeChef: (chefCode: AzitChefCode) => Promise<boolean>;
    startCooking: (slotIndex: number, recipeId: AzitRecipeId, chefCode?: AzitChefCode | null) => Promise<boolean>;
    claimCooking: (slotIndex: number) => Promise<boolean>;
    sellDish: (recipeId: AzitRecipeId, quantity?: number) => Promise<boolean>;
    hireMercenary: (mercCode: AzitMercCode) => Promise<boolean>;
    upgradeMercenary: (mercCode: AzitMercCode) => Promise<boolean>;
    startExpedition: (zoneId: AzitZoneId, partyMercCodes: AzitMercCode[], dishRecipeId: AzitRecipeId) => Promise<boolean>;
    claimExpedition: (expeditionId: number) => Promise<boolean>;
}

export function formatDurationCompact(totalSec: number): string {
    const safe = Math.max(0, Math.floor(totalSec));
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hrs > 0) {
        return mins > 0 ? `${hrs}시간 ${mins}분` : `${hrs}시간`;
    }
    if (mins > 0) {
        return secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`;
    }
    return `${secs}초`;
}

export function formatCountdownLabel(endsAtMs: number | null, nowMs: number): string {
    if (!endsAtMs) return '대기';
    const remainMs = endsAtMs - nowMs;
    if (remainMs <= 0) return '완료!';
    const totalSec = Math.ceil(remainMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
