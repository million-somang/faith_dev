import type {
    GardenCropId,
    GardenPlotItem,
    KnownGardenCropId,
    MinihomeGardenState,
} from '@/types/minihome.types';

export type AzitZoneType = 'indoor' | 'garden' | 'kitchen' | 'camp';

export type AzitKnownCropId = KnownGardenCropId;

export type AzitCropId = GardenCropId;

export type AzitKnownFertilizerId = 'fert-basic' | 'fert-rapid';

export type AzitFertilizerId = AzitKnownFertilizerId | (string & {});

export type AzitFarmerCode = string;

export type AzitFarmerRole = 'water' | 'harvest' | 'plant' | 'fertilize';

export type AzitFarmerGrade = 1 | 2 | 3 | 4;

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
    | 'dish-dragon-elixir'
    | 'dish-blueberry-parfait'
    | 'dish-pumpkin-risotto'
    | 'dish-melon-sorbet'
    | 'dish-ginseng-tonic'
    | 'dish-truffle-steak'
    | 'dish-moon-elixir';

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
    requiredAzitLevel: number;
    seedPrice: number;
    harvestYield: number;
    sellPrice: number;
    description: string;
}

export type AzitCropDef = AzitCropCatalogItem;

export interface AzitFertilizerCatalogItem {
    fertilizerId: AzitFertilizerId;
    name: string;
    shortName: string;
    emoji: string;
    requiredAzitLevel: number;
    price: number;
    reductionMs: number;
    reductionHours: number;
    description: string;
}

export interface AzitSoilLevelCatalogItem {
    level: number;
    name: string;
    upgradeCost: number;
    requiredAzitLevel: number;
    guaranteedBonusYield: number;
    bonusChancePct: number;
    description: string;
}

export interface AzitPlotUnlockCatalogItem {
    plotIndex: number;
    unlockLevel: number;
    unlockCost: number;
}

export interface AzitFarmerCatalogItem {
    farmerCode: AzitFarmerCode;
    name: string;
    title?: string;
    emoji: string;
    hireCost: number;
    requiredAzitLevel: number;
    maxLevel: number;
    description: string;
    baseWorkIntervalMs?: number;
    baseWaterCooldownReductionPct?: number;
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

export type AzitDishQuality = 'normal' | 'special';

export interface AzitDishEffectiveBuffs {
    powerBonusPct: number;
    winRateBonusPct: number;
    rewardBonusPct: number;
    mercXpBonusPct: number;
    expeditionSpeedBonusPct: number;
    maxWinRateCap: number;
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
    rewardBonusPct?: number;
    mercXpBonusPct?: number;
    expeditionSpeedBonusPct?: number;
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
    gardenPlots: number;
    maxFarmers: number;
}

export interface OwnedFarmer {
    farmerCode: AzitFarmerCode;
    name: string;
    title?: string;
    emoji?: string;
    grade: AzitFarmerGrade | number;
    gradeName: string;
    level: number;
    xp: number;
    nextLevelXp: number | null;
    autoEnabled: boolean;
    autoFertilize: boolean;
    preferredCropId: AzitCropId | null;
    workIntervalMs: number;
    waterCooldownReductionPct: number;
    roles: AzitFarmerRole[];
    nextAutoRunAtMs: number | null;
    lastAutoTickMs: number;
    totalWatered: number;
    totalHarvested: number;
    totalPlanted: number;
    upgradeCost: number | null;
}

export interface FarmerActionLog {
    id: number;
    farmerCode: AzitFarmerCode;
    actionType: AzitFarmerRole;
    plotIndex: number;
    cropId: AzitCropId | null;
    detail: string;
    createdAt: string;
}

export interface ServerGardenPlot extends GardenPlotItem {
    isUnlocked: boolean;
    unlockLevel: number;
    unlockCost: number;
    soilLevel: number;
    nextWaterAtMs: number | null;
    fertilizerUsedCount: number;
}

export interface ServerGardenState extends MinihomeGardenState {
    plots: ServerGardenPlot[];
    fertilizerCounts: Record<string, number>;
    unlockedPlotCount: number;
    maxPlotCount: number;
}

export interface AzitFarmerConfigurePayload {
    farmerCode: AzitFarmerCode;
    autoEnabled?: boolean;
    preferredCropId?: AzitCropId | null;
    autoFertilize?: boolean;
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
    dishQuality?: AzitDishQuality;
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
    rewardMercXp?: number;
    dishQuality?: AzitDishQuality;
    appliedBuffs?: AzitDishEffectiveBuffs;
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
            maxGardenPlots: number;
            unlockedPlots: number;
            maxFarmers: number;
        };
        totalCropsSold: number;
        totalDishesCooked: number;
        totalExpeditionsWon: number;
        totalExpeditionsLost: number;
    };
    veraPoints: number;
    serverNowMs?: number;
    garden: ServerGardenState;
    materials: Record<AzitMaterialId, number>;
    dishes: Record<AzitRecipeId, number>;
    specialDishes: Record<AzitRecipeId, number>;
    chefs: AzitChefRecord[];
    kitchenSlots: AzitKitchenSlotState[];
    mercenaries: AzitMercenaryRecord[];
    activeExpeditions: AzitExpeditionRecord[];
    recentExpeditions: AzitExpeditionRecord[];
    recentLedger: AzitLedgerRecord[];
    farmers: OwnedFarmer[];
    farmerLogs: FarmerActionLog[];
    catalog: {
        crops: AzitCropCatalogItem[];
        fertilizers: AzitFertilizerCatalogItem[];
        soilLevels: AzitSoilLevelCatalogItem[];
        plotUnlocks: AzitPlotUnlockCatalogItem[];
        materials: AzitMaterialCatalogItem[];
        recipes: AzitRecipeCatalogItem[];
        chefs: AzitChefCatalogItem[];
        farmers: AzitFarmerCatalogItem[];
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
    unlockPlot: (plotIndex: number) => Promise<boolean>;
    buyFertilizer: (fertilizerId?: AzitFertilizerId, quantity?: number) => Promise<boolean>;
    fertilizePlot: (plotIndex: number, fertilizerId?: AzitFertilizerId) => Promise<boolean>;
    upgradeSoil: (plotIndex: number) => Promise<boolean>;
    waterAll: () => Promise<boolean>;
    harvestAll: () => Promise<boolean>;
    plantAll: (cropId: AzitCropId) => Promise<boolean>;
    hireFarmer: (farmerCode: AzitFarmerCode) => Promise<boolean>;
    upgradeFarmer: (farmerCode: AzitFarmerCode) => Promise<boolean>;
    configureFarmer: (payload: AzitFarmerConfigurePayload) => Promise<boolean>;
    hireChef: (chefCode: AzitChefCode) => Promise<boolean>;
    upgradeChef: (chefCode: AzitChefCode) => Promise<boolean>;
    startCooking: (slotIndex: number, recipeId: AzitRecipeId, chefCode?: AzitChefCode | null) => Promise<boolean>;
    claimCooking: (slotIndex: number) => Promise<boolean>;
    sellDish: (recipeId: AzitRecipeId, quantity?: number, quality?: AzitDishQuality) => Promise<boolean>;
    hireMercenary: (mercCode: AzitMercCode) => Promise<boolean>;
    upgradeMercenary: (mercCode: AzitMercCode) => Promise<boolean>;
    startExpedition: (
        zoneId: AzitZoneId,
        partyMercCodes: AzitMercCode[],
        dishRecipeId: AzitRecipeId,
        dishQuality?: AzitDishQuality
    ) => Promise<boolean>;
    claimExpedition: (expeditionId: number) => Promise<boolean>;
}

export const MIN_COOK_DURATION_SEC = 60;
export const MAX_CHEF_SPEED_BONUS_PCT = 40;
export const SPECIAL_DISH_BUFF_MULTIPLIER = 1.2;
export const SPECIAL_DISH_SELL_MULTIPLIER = 1.5;
export const DISH_TIER_MAX_WIN_RATE: Record<1 | 2 | 3 | 4, number> = {
    1: 92,
    2: 95,
    3: 97,
    4: 99,
};

export function getEffectiveCookDurationSec(baseDurationSec: number, speedBonusPct: number): number {
    const clampedSpeed = Math.max(0, Math.min(MAX_CHEF_SPEED_BONUS_PCT, speedBonusPct));
    return Math.max(MIN_COOK_DURATION_SEC, Math.round(baseDurationSec * (1 - clampedSpeed / 100)));
}

export function getDishSellPrice(recipe: AzitRecipeCatalogItem, quality: AzitDishQuality = 'normal'): number {
    return quality === 'special'
        ? Math.round(recipe.sellPrice * SPECIAL_DISH_SELL_MULTIPLIER)
        : recipe.sellPrice;
}

export function getDishMaxWinRateCap(tier: 1 | 2 | 3 | 4, quality: AzitDishQuality = 'normal'): number {
    const baseCap = DISH_TIER_MAX_WIN_RATE[tier] ?? 95;
    return Math.min(99, baseCap + (quality === 'special' ? 1 : 0));
}

export function getDishEffectiveBuffs(
    recipe: AzitRecipeCatalogItem,
    quality: AzitDishQuality = 'normal'
): AzitDishEffectiveBuffs {
    const baseReward = recipe.rewardBonusPct ?? 0;
    const baseMercXp = recipe.mercXpBonusPct ?? 0;
    const baseSpeed = recipe.expeditionSpeedBonusPct ?? 0;
    const maxWinRateCap = getDishMaxWinRateCap(recipe.tier, quality);
    if (quality !== 'special') {
        return {
            powerBonusPct: recipe.powerBonusPct,
            winRateBonusPct: recipe.winRateBonusPct,
            rewardBonusPct: baseReward,
            mercXpBonusPct: baseMercXp,
            expeditionSpeedBonusPct: baseSpeed,
            maxWinRateCap,
        };
    }
    return {
        powerBonusPct: Math.round(recipe.powerBonusPct * SPECIAL_DISH_BUFF_MULTIPLIER),
        winRateBonusPct: Math.round(recipe.winRateBonusPct * SPECIAL_DISH_BUFF_MULTIPLIER),
        rewardBonusPct: baseReward > 0 ? Math.round(baseReward * SPECIAL_DISH_BUFF_MULTIPLIER) : 2,
        mercXpBonusPct: Math.round(baseMercXp * SPECIAL_DISH_BUFF_MULTIPLIER),
        expeditionSpeedBonusPct: Math.min(
            30,
            baseSpeed > 0 ? Math.round(baseSpeed * SPECIAL_DISH_BUFF_MULTIPLIER) : 2
        ),
        maxWinRateCap,
    };
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
