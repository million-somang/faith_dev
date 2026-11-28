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

export type AzitZoneThemeId =
    | 'theme-slime-marsh'
    | 'theme-goblin-camp'
    | 'theme-ancient-forest'
    | 'theme-obsidian-canyon'
    | 'theme-wyvern-peak'
    | 'theme-dragon-abyss';

export type AzitItemId =
    | 'item-revival-herb'
    | 'item-phoenix-feather'
    | 'item-skill-stone'
    | 'item-skill-tome'
    | 'item-battle-elixir';

export type AzitItemCategory = 'revival' | 'skill_mat' | 'consumable';

export type AzitTowerThemeId =
    | 'tower-1-forgotten'
    | 'tower-2-spirit'
    | 'tower-3-obsidian'
    | 'tower-4-wyvern'
    | 'tower-5-abyss';

export type AzitTowerFloorType = 'normal' | 'mini_boss' | 'major_boss';

export type AzitCombatRole =
    | 'tank'
    | 'ranger'
    | 'mage'
    | 'healer'
    | 'berserker'
    | 'allrounder'
    | 'enemy-melee'
    | 'enemy-ranged'
    | 'enemy-boss';

export type AzitCombatStatusKind =
    | 'shield'
    | 'regen'
    | 'atkUp'
    | 'defUp'
    | 'defDown'
    | 'burn'
    | 'stun';

export type AzitCombatSkillEffectKind =
    | 'damage'
    | 'aoe_damage'
    | 'heal'
    | 'heal_all'
    | 'buff'
    | 'debuff'
    | 'shield';

export type AzitCombatTargetScope =
    | 'enemy_single'
    | 'enemy_aoe'
    | 'ally_lowest'
    | 'ally_all'
    | 'self';

export interface AzitCombatSkillStatusSpec {
    kind: AzitCombatStatusKind;
    durationMs: number;
    value: number;
    chancePct?: number;
}

export interface AzitCombatSkillSpec {
    id: string;
    name: string;
    emoji: string;
    slot: 'main' | 'sub';
    effectKind: AzitCombatSkillEffectKind;
    targetScope: AzitCombatTargetScope;
    cooldownMs: number;
    powerPct: number;
    perLevelPct: number;
    range: number;
    aoeRadius: number;
    description: string;
    statusEffect?: AzitCombatSkillStatusSpec;
    secondaryStatusEffect?: AzitCombatSkillStatusSpec;
    lifestealPct?: number;
    critMult?: number;
}

export interface AzitMercBaseCombatStats {
    combatRole: 'tank' | 'ranger' | 'mage' | 'healer' | 'berserker' | 'allrounder';
    hp: number;
    atk: number;
    def: number;
    moveSpeed: number;
    attackIntervalMs: number;
    range: number;
    critPct: number;
}

export interface AzitMonsterDef {
    monsterId: string;
    name: string;
    emoji: string;
    role: '탱커' | '레인저' | '딜러' | '힐러' | '보스';
    combatRole: AzitCombatRole;
    maxHp: number;
    atk: number;
    def: number;
    moveSpeed: number;
    attackIntervalMs: number;
    range: number;
    isBoss: boolean;
    mainSkill: AzitCombatSkillSpec;
    subSkill: AzitCombatSkillSpec;
}

export interface AzitZoneItemDropDef {
    itemId: AzitItemId;
    chancePct: number;
    minQty: number;
    maxQty: number;
}

export interface AzitItemCatalogItem {
    itemId: AzitItemId;
    name: string;
    emoji: string;
    category: AzitItemCategory;
    shopPrice: number | null;
    requiredAzitLevel: number;
    bonusMercXp?: number;
    description: string;
}

export interface AzitCraftIngredient {
    kind: 'crop' | 'material' | 'item';
    id: AzitCropId | AzitMaterialId | AzitItemId;
    qty: number;
}

export interface AzitCraftRecipeCatalogItem {
    recipeId: string;
    resultItemId: AzitItemId;
    resultQty: number;
    name: string;
    emoji: string;
    requiredAzitLevel: number;
    pointsCost: number;
    ingredients: AzitCraftIngredient[];
    description: string;
}

export interface AzitTowerThemeCatalogItem {
    themeId: AzitTowerThemeId;
    name: string;
    floorStart: number;
    floorEnd: number;
    themeColor: string;
    primaryMaterialId: AzitMaterialId;
    description: string;
}

export interface AzitTowerRewardBundle {
    veraPoints: number;
    mercXp: number;
    azitXp: number;
    materials: Partial<Record<AzitMaterialId, number>>;
    crops: Partial<Record<AzitCropId, number>>;
    items: Partial<Record<AzitItemId, number>>;
}

export interface AzitTowerFloorDef {
    floor: number;
    themeId: AzitTowerThemeId;
    themeName: string;
    floorType: AzitTowerFloorType;
    isBoss: boolean;
    name: string;
    recommendedPower: number;
    monsters: AzitMonsterDef[];
    firstClearReward: AzitTowerRewardBundle;
    repeatReward: AzitTowerRewardBundle;
}

export interface AzitTowerFloorSummary {
    floor: number;
    themeId: AzitTowerThemeId;
    themeName: string;
    floorType: AzitTowerFloorType;
    isBoss: boolean;
    name: string;
    recommendedPower: number;
    bossEmoji: string;
    bossName: string;
    firstClearPoints: number;
    firstClearMercXp: number;
    repeatPoints: number;
}

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
    combatRole?: 'tank' | 'ranger' | 'mage' | 'healer' | 'berserker' | 'allrounder';
    baseStats?: AzitMercBaseCombatStats;
    mainSkill?: AzitCombatSkillSpec;
    subSkill?: AzitCombatSkillSpec;
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
    zoneTheme?: AzitZoneThemeId;
    deathRiskPct?: number;
    lossMercXp?: number;
    monsters?: AzitMonsterDef[];
    itemDrops?: AzitZoneItemDropDef[];
    cropDropPool?: AzitCropId[];
    bonusMaterialId?: AzitMaterialId;
    bonusMaterialMinQty?: number;
    bonusMaterialMaxQty?: number;
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

export interface AzitMercSkillSnapshot {
    id: string;
    name: string;
    emoji: string;
    description: string;
    level: number;
    maxLevel: number;
    cooldownMs: number;
    powerPct: number;
}

export interface AzitMercenaryRecord {
    mercCode: AzitMercCode;
    level: number;
    xp: number;
    nextXp: number;
    power: number;
    status: 'idle' | 'expedition' | 'dead';
    upgradeCost: number | null;
    role?: '탱커' | '레인저' | '딜러' | '힐러' | '올라운더';
    combatRole?: 'tank' | 'ranger' | 'mage' | 'healer' | 'berserker' | 'allrounder';
    hp?: number;
    maxHp?: number;
    atk?: number;
    def?: number;
    spd?: number;
    range?: number;
    diedAt?: string | null;
    deathZoneId?: AzitZoneId | null;
    mainSkill?: AzitMercSkillSnapshot;
    subSkill?: AzitMercSkillSnapshot;
}

export interface AzitMercenaryGroupRecord {
    id: number;
    name: string;
    slotIndex: number;
    mercCodes: AzitMercCode[];
}

export interface AzitItemInventoryRecord {
    itemId: AzitItemId;
    qty: number;
}

export interface AzitTowerProgressState {
    highestClearedFloor: number;
    maxFloor: number;
    totalClears: number;
    totalAttempts: number;
}

export interface AzitCombatUnitTemplate {
    unitId: string;
    side: 'ally' | 'enemy';
    code: string;
    name: string;
    emoji: string;
    combatRole: AzitCombatRole;
    level: number;
    maxHp: number;
    atk: number;
    def: number;
    moveSpeed: number;
    attackIntervalMs: number;
    range: number;
    critPct?: number;
    isBoss?: boolean;
    mainSkill: AzitCombatSkillSpec;
    subSkill: AzitCombatSkillSpec;
    mainSkillLevel: number;
    subSkillLevel: number;
}

export interface AzitCombatSimulationInput {
    mode: 'expedition' | 'tower';
    seed: number;
    allies: AzitCombatUnitTemplate[];
    enemies: AzitCombatUnitTemplate[];
    dishBuffs?: Partial<AzitDishEffectiveBuffs>;
    elixirBoostPct?: number;
    deathRiskPct?: number;
    maxDurationMs?: number;
    recordFrames?: boolean;
    frameIntervalTicks?: number;
}

export type AzitCombatUnitAction =
    | 'idle'
    | 'move'
    | 'attack'
    | 'skill_main'
    | 'skill_sub'
    | 'stunned'
    | 'dead';

export interface AzitCombatFrameUnit {
    unitId: string;
    side: 'ally' | 'enemy';
    code: string;
    name: string;
    emoji: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    shield: number;
    facing: 1 | -1;
    alive: boolean;
    action: AzitCombatUnitAction;
    activeSkillName?: string;
    statuses: AzitCombatStatusKind[];
}

export interface AzitCombatVfxEvent {
    kind:
        | 'slash'
        | 'arrow'
        | 'fireball'
        | 'heal'
        | 'shield'
        | 'meteor'
        | 'whirlwind'
        | 'dash'
        | 'hit'
        | 'status';
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    color: string;
    radius?: number;
    value?: number;
    isCrit?: boolean;
    isHeal?: boolean;
    label?: string;
}

export interface AzitCombatFrame {
    tick: number;
    timeMs: number;
    units: AzitCombatFrameUnit[];
    effects: AzitCombatVfxEvent[];
}

export interface AzitCombatEvent {
    tick: number;
    elapsedMs: number;
    type: 'attack' | 'skill' | 'heal' | 'status' | 'death';
    sourceId: string;
    targetIds: string[];
    skillSlot?: 'main' | 'sub';
    skillName?: string;
    amount?: number;
    isCrit?: boolean;
    statusKind?: AzitCombatStatusKind;
    x: number;
    y: number;
    message: string;
}

export interface AzitCombatUnitOutcome {
    unitId: string;
    code: string;
    name: string;
    side: 'ally' | 'enemy';
    hp: number;
    maxHp: number;
    alive: boolean;
    damageDealt: number;
    healingDone: number;
    kills: number;
}

export interface AzitCombatSimulationResult {
    won: boolean;
    durationMs: number;
    seed: number;
    frames: AzitCombatFrame[];
    events: AzitCombatEvent[];
    battleLog: string[];
    casualties: AzitMercCode[];
    mvpMercCode: AzitMercCode | null;
    totalDamageDealt: number;
    totalHealingDone: number;
    survivingAllies: number;
    survivingEnemies: number;
    unitOutcomes: AzitCombatUnitOutcome[];
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
    groupId?: number | null;
    groupName?: string | null;
    durationSec?: number;
    zoneTheme?: AzitZoneThemeId;
    monsters?: AzitMonsterDef[];
    battleSeed?: number;
    partySnapshot?: AzitCombatUnitTemplate[];
    casualties?: AzitMercCode[];
    rewardItems?: Partial<Record<AzitItemId, number>>;
    rewardCrops?: Partial<Record<AzitCropId, number>>;
    rewardMercXp?: number;
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
    casualties?: AzitMercCode[];
    rewardItems?: Partial<Record<AzitItemId, number>>;
    rewardCrops?: Partial<Record<AzitCropId, number>>;
    mvpMercCode?: AzitMercCode | null;
    battleFrames?: AzitCombatFrame[];
}

export interface AzitTowerBattleResponse {
    won: boolean;
    floor: number;
    isFirstClear: boolean;
    durationMs: number;
    seed: number;
    frames: AzitCombatFrame[];
    battleLog: string[];
    rewards: AzitTowerRewardBundle;
    state: AzitFullGameState;
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
    groups?: AzitMercenaryGroupRecord[];
    items?: AzitItemInventoryRecord[];
    tower?: AzitTowerProgressState;
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
        items?: AzitItemCatalogItem[];
        craftRecipes?: AzitCraftRecipeCatalogItem[];
        towerThemes?: AzitTowerThemeCatalogItem[];
        towerFloorsSummary?: AzitTowerFloorSummary[];
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
        dishQuality?: AzitDishQuality,
        options?: { groupId?: number; elixirItemId?: AzitItemId }
    ) => Promise<boolean>;
    claimExpedition: (expeditionId: number) => Promise<boolean>;
    saveGroup?: (payload: { id?: number; name: string; slotIndex?: number; mercCodes: AzitMercCode[] }) => Promise<boolean>;
    deleteGroup?: (groupId: number) => Promise<boolean>;
    reviveMercenary?: (mercCode: AzitMercCode, itemId: AzitItemId) => Promise<boolean>;
    upgradeMercSkill?: (mercCode: AzitMercCode, skillSlot: 'main' | 'sub') => Promise<boolean>;
    buyShopItem?: (itemId: AzitItemId, qty?: number) => Promise<boolean>;
    craftItem?: (recipeId: string, qty?: number) => Promise<boolean>;
    battleTowerFloor?: (payload: {
        floor: number;
        groupId?: number;
        partyMercCodes?: AzitMercCode[];
        elixirItemId?: AzitItemId;
    }) => Promise<AzitTowerBattleResponse | null>;
}

export const MERC_GOLD_UPGRADE_ENABLED = false;
export const MAX_SKILL_LEVEL = 10;
export const MAX_TOWER_FLOOR = 200;
export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 360;
export const COMBAT_TICK_MS = 100;

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
