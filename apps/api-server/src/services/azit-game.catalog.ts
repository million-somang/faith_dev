import crypto from 'crypto';
import type {
    CombatRole,
    CombatSkillSpec,
    CombatUnitInput,
} from './azit-combat.engine.js';

export type AzitCropId =
    | 'crop-carrot'
    | 'crop-pepper'
    | 'crop-tomato'
    | 'crop-lettuce'
    | 'crop-potato'
    | 'crop-strawberry'
    | 'crop-blueberry'
    | 'crop-pumpkin'
    | 'crop-melon'
    | 'crop-ginseng'
    | 'crop-truffle'
    | 'crop-moonfruit';

export type AzitFertilizerId = 'fert-basic' | 'fert-rapid';

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

export type AzitFarmerCode = 'farmer-bomi' | 'farmer-dori' | 'farmer-eldin';

export type AzitFarmerRole = 'water' | 'harvest' | 'plant' | 'fertilize';

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

export interface AzitCropDef {
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

export interface AzitPlotUnlockDef {
    plotIndex: number;
    unlockLevel: number;
    unlockCost: number;
}

export interface AzitFertilizerDef {
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

export interface AzitSoilLevelDef {
    level: number;
    name: string;
    upgradeCost: number;
    requiredAzitLevel: number;
    guaranteedBonusYield: number;
    bonusChancePct: number;
    description: string;
}

export interface SoilHarvestYieldResult {
    baseYield: number;
    guaranteedBonus: number;
    chanceBonus: number;
    totalBonus: number;
    totalYield: number;
}

export interface AzitMaterialDef {
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

export interface AzitRecipeDef {
    recipeId: AzitRecipeId;
    name: string;
    emoji: string;
    tier: 1 | 2 | 3 | 4;
    cookDurationSec: number;
    sellPrice: number;
    powerBonusPct: number;
    winRateBonusPct: number;
    rewardBonusPct: number;
    mercXpBonusPct: number;
    expeditionSpeedBonusPct: number;
    azitXpReward: number;
    requiredAzitLevel: number;
    description: string;
    ingredients: AzitRecipeIngredient[];
}

export interface AzitChefDef {
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

export interface AzitFarmerDef {
    farmerCode: AzitFarmerCode;
    name: string;
    title: string;
    emoji: string;
    hireCost: number;
    requiredAzitLevel: number;
    maxLevel: number;
    description: string;
}

export interface AzitFarmerLevelStats {
    level: number;
    grade: 1 | 2 | 3 | 4;
    gradeName: string;
    roles: AzitFarmerRole[];
    workIntervalMs: number;
    waterCooldownReductionPct: number;
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
    combatRole: CombatRole;
    maxHp: number;
    atk: number;
    def: number;
    moveSpeed: number;
    attackIntervalMs: number;
    range: number;
    isBoss: boolean;
    mainSkill: CombatSkillSpec;
    subSkill: CombatSkillSpec;
}

export interface AzitZoneItemDropDef {
    itemId: AzitItemId;
    chancePct: number;
    minQty: number;
    maxQty: number;
}

export interface AzitItemDef {
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

export interface AzitCraftRecipeDef {
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

export interface AzitTowerThemeDef {
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

export interface AzitMercenaryDef {
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
    combatRole: 'tank' | 'ranger' | 'mage' | 'healer' | 'berserker' | 'allrounder';
    baseStats: AzitMercBaseCombatStats;
    mainSkill: CombatSkillSpec;
    subSkill: CombatSkillSpec;
}

export interface AzitExpeditionZoneDef {
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
    zoneTheme: AzitZoneThemeId;
    deathRiskPct: number;
    lossMercXp: number;
    monsters: AzitMonsterDef[];
    itemDrops: AzitZoneItemDropDef[];
    cropDropPool: AzitCropId[];
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

export const MERC_GOLD_UPGRADE_ENABLED = false;
export const MAX_SKILL_LEVEL = 10;
export const MAX_TOWER_FLOOR = 200;

export const MAX_AZIT_LEVEL = 50;
export const STARTER_GARDEN_PLOTS = 6;
export const MAX_GARDEN_PLOTS = 16;
export const DEFAULT_FERTILIZER_ID: AzitFertilizerId = 'fert-basic';
export const MAX_FERTILIZER_PER_CROP = 4;
export const MAX_SOIL_LEVEL = 5;
export const GARDEN_WATER_COOLDOWN_MS = 8 * 60 * 60 * 1000;
export const GARDEN_HARVEST_AZIT_XP = 8;
export const MAX_FARMER_LEVEL = 20;
export const FARMER_TASK_XP = 5;
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

export const AZIT_CROPS: AzitCropDef[] = [
    {
        cropId: 'crop-carrot',
        name: '달콤 미니당근',
        shortName: '당근',
        emoji: '🥕',
        requiredAzitLevel: 1,
        seedPrice: 0,
        harvestYield: 2,
        sellPrice: 8,
        description: '초보 농부를 위한 0P 무료 씨앗! 언제든 심어 포인트를 회복할 수 있습니다.',
    },
    {
        cropId: 'crop-pepper',
        name: '알싸한 청양고추',
        shortName: '고추',
        emoji: '🌶️',
        requiredAzitLevel: 1,
        seedPrice: 12,
        harvestYield: 2,
        sellPrice: 16,
        description: '불향 볶음밥의 핵심 재료로 인기가 높은 매콤한 작물입니다.',
    },
    {
        cropId: 'crop-tomato',
        name: '탱글 방울토마토',
        shortName: '토마토',
        emoji: '🍅',
        requiredAzitLevel: 1,
        seedPrice: 18,
        harvestYield: 2,
        sellPrice: 22,
        description: '진한 토마토 스튜와 그라탕에 감칠맛을 더하는 붉은 열매입니다.',
    },
    {
        cropId: 'crop-lettuce',
        name: '아삭 유기농 청상추',
        shortName: '상추',
        emoji: '🥬',
        requiredAzitLevel: 1,
        seedPrice: 24,
        harvestYield: 2,
        sellPrice: 28,
        description: '신선한 쌈 도시락과 고급 정식에 빠질 수 없는 잎채소입니다.',
    },
    {
        cropId: 'crop-potato',
        name: '포슬포슬 햇감자',
        shortName: '감자',
        emoji: '🥔',
        requiredAzitLevel: 1,
        seedPrice: 30,
        harvestYield: 2,
        sellPrice: 36,
        description: '든든한 그라탕과 기사단 만찬을 책임지는 황금빛 뿌리작물입니다.',
    },
    {
        cropId: 'crop-strawberry',
        name: '설향 꿀딸기',
        shortName: '딸기',
        emoji: '🍓',
        requiredAzitLevel: 1,
        seedPrice: 45,
        harvestYield: 2,
        sellPrice: 55,
        description: '최고급 디저트와 드래곤 정식에 쓰이는 희귀 고급 과일입니다.',
    },
    {
        cropId: 'crop-blueberry',
        name: '서리 빛 블루베리',
        shortName: '블루베리',
        emoji: '🫐',
        requiredAzitLevel: 20,
        seedPrice: 55,
        harvestYield: 2,
        sellPrice: 68,
        description: '아지트 Lv.20부터 재배할 수 있는 새콤달콤한 서리 과실입니다.',
    },
    {
        cropId: 'crop-pumpkin',
        name: '황금 잭오 호박',
        shortName: '황금호박',
        emoji: '🎃',
        requiredAzitLevel: 25,
        seedPrice: 70,
        harvestYield: 2,
        sellPrice: 86,
        description: '아지트 Lv.25부터 재배 가능한 묵직하고 달콤한 황금 호박입니다.',
    },
    {
        cropId: 'crop-melon',
        name: '왕실 머스크멜론',
        shortName: '멜론',
        emoji: '🍈',
        requiredAzitLevel: 30,
        seedPrice: 90,
        harvestYield: 2,
        sellPrice: 110,
        description: '아지트 Lv.30부터 재배 가능한 왕실 진상품 최고급 멜론입니다.',
    },
    {
        cropId: 'crop-ginseng',
        name: '천년 산삼',
        shortName: '산삼',
        emoji: '🌿',
        requiredAzitLevel: 36,
        seedPrice: 115,
        harvestYield: 2,
        sellPrice: 140,
        description: '아지트 Lv.36부터 재배할 수 있는 영험한 기운이 담긴 희귀 약초입니다.',
    },
    {
        cropId: 'crop-truffle',
        name: '심연 블랙 트러플',
        shortName: '트러플',
        emoji: '🍄',
        requiredAzitLevel: 42,
        seedPrice: 145,
        harvestYield: 2,
        sellPrice: 175,
        description: '아지트 Lv.42부터 재배 가능한 미식가들의 보물 블랙 트러플입니다.',
    },
    {
        cropId: 'crop-moonfruit',
        name: '영원의 달빛 열매',
        shortName: '달빛열매',
        emoji: '🌙',
        requiredAzitLevel: 50,
        seedPrice: 180,
        harvestYield: 2,
        sellPrice: 220,
        description: '아지트 최고 레벨 Lv.50에 해금되는 전설의 영약 열매입니다.',
    },
];

export const AZIT_PLOT_UNLOCKS: AzitPlotUnlockDef[] = [
    { plotIndex: 0, unlockLevel: 1, unlockCost: 0 },
    { plotIndex: 1, unlockLevel: 1, unlockCost: 0 },
    { plotIndex: 2, unlockLevel: 1, unlockCost: 0 },
    { plotIndex: 3, unlockLevel: 1, unlockCost: 0 },
    { plotIndex: 4, unlockLevel: 1, unlockCost: 0 },
    { plotIndex: 5, unlockLevel: 1, unlockCost: 0 },
    { plotIndex: 6, unlockLevel: 5, unlockCost: 60 },
    { plotIndex: 7, unlockLevel: 10, unlockCost: 100 },
    { plotIndex: 8, unlockLevel: 15, unlockCost: 150 },
    { plotIndex: 9, unlockLevel: 20, unlockCost: 220 },
    { plotIndex: 10, unlockLevel: 25, unlockCost: 300 },
    { plotIndex: 11, unlockLevel: 30, unlockCost: 400 },
    { plotIndex: 12, unlockLevel: 35, unlockCost: 520 },
    { plotIndex: 13, unlockLevel: 40, unlockCost: 660 },
    { plotIndex: 14, unlockLevel: 45, unlockCost: 820 },
    { plotIndex: 15, unlockLevel: 50, unlockCost: 1000 },
];

export const AZIT_FERTILIZERS: AzitFertilizerDef[] = [
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

export const AZIT_SOIL_LEVELS: AzitSoilLevelDef[] = [
    {
        level: 0,
        name: '기본 흙',
        upgradeCost: 0,
        requiredAzitLevel: 1,
        guaranteedBonusYield: 0,
        bonusChancePct: 0,
        description: '기본 상태의 텃밭 토양입니다. 기본 수확량만 획득합니다.',
    },
    {
        level: 1,
        name: '비옥한 겉흙',
        upgradeCost: 80,
        requiredAzitLevel: 1,
        guaranteedBonusYield: 0,
        bonusChancePct: 25,
        description: '수확 시 25% 확률로 보너스 작물 +1개를 추가 획득합니다.',
    },
    {
        level: 2,
        name: '유기농 배양토',
        upgradeCost: 180,
        requiredAzitLevel: 5,
        guaranteedBonusYield: 1,
        bonusChancePct: 0,
        description: '수확 시 확정 보너스 작물 +1개를 추가로 획득합니다.',
    },
    {
        level: 3,
        name: '미네랄 황금토',
        upgradeCost: 350,
        requiredAzitLevel: 12,
        guaranteedBonusYield: 1,
        bonusChancePct: 35,
        description: '확정 보너스 +1개 및 35% 확률로 추가 보너스 +1개를 획득합니다.',
    },
    {
        level: 4,
        name: '정령의 축복토',
        upgradeCost: 620,
        requiredAzitLevel: 22,
        guaranteedBonusYield: 2,
        bonusChancePct: 25,
        description: '확정 보너스 +2개 및 25% 확률로 추가 보너스 +1개를 획득합니다.',
    },
    {
        level: 5,
        name: '전설의 에덴 토양',
        upgradeCost: 1000,
        requiredAzitLevel: 35,
        guaranteedBonusYield: 2,
        bonusChancePct: 60,
        description: '최고 등급 토양! 확정 보너스 +2개 및 60% 확률로 추가 보너스 +1개를 획득합니다.',
    },
];

export const AZIT_MATERIALS: AzitMaterialDef[] = [
    {
        materialId: 'mat-slime-jelly',
        name: '슬라임 젤리',
        emoji: '🫧',
        description: '초원 슬라임에게서 얻는 탱글한 천연 감미 재료입니다.',
    },
    {
        materialId: 'mat-goblin-spice',
        name: '고블린 향신료',
        emoji: '🧂',
        description: '고블린 야영지에서 노획한 진한 풍미의 특제 향신료입니다.',
    },
    {
        materialId: 'mat-forest-honey',
        name: '숲의 정령꿀',
        emoji: '🍯',
        description: '안개 숲 정령들이 지키는 신비로운 황금빛 천연 꿀입니다.',
    },
    {
        materialId: 'mat-wyvern-jerky',
        name: '와이번 육포',
        emoji: '🍖',
        description: '화산 협곡 와이번의 질기고 영양이 풍부한 최고급 육류 재료입니다.',
    },
    {
        materialId: 'mat-dragon-powder',
        name: '드래곤 비늘 가루',
        emoji: '✨',
        description: '흑룡 토벌 성공 시에만 얻을 수 있는 전설의 비법 가루입니다.',
    },
];

export const AZIT_RECIPES: AzitRecipeDef[] = [
    {
        recipeId: 'dish-carrot-soup',
        name: '따뜻한 당근 수프',
        emoji: '🥣',
        tier: 1,
        cookDurationSec: 300,
        sellPrice: 30,
        powerBonusPct: 15,
        winRateBonusPct: 4,
        rewardBonusPct: 0,
        mercXpBonusPct: 5,
        expeditionSpeedBonusPct: 0,
        azitXpReward: 12,
        requiredAzitLevel: 1,
        description: '무료 당근만으로 손쉽게 끓여내는 든든한 기초 원정 도시락입니다.',
        ingredients: [{ kind: 'crop', id: 'crop-carrot', qty: 2 }],
    },
    {
        recipeId: 'dish-spicy-rice',
        name: '불향 고추 볶음밥',
        emoji: '🍛',
        tier: 1,
        cookDurationSec: 720,
        sellPrice: 75,
        powerBonusPct: 25,
        winRateBonusPct: 7,
        rewardBonusPct: 3,
        mercXpBonusPct: 10,
        expeditionSpeedBonusPct: 2,
        azitXpReward: 18,
        requiredAzitLevel: 1,
        description: '매콤한 청양고추로 용병들의 사기를 돋우는 인기 메뉴입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-pepper', qty: 2 },
            { kind: 'crop', id: 'crop-carrot', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-tomato-stew',
        name: '진한 토마토 스튜',
        emoji: '🍲',
        tier: 2,
        cookDurationSec: 1200,
        sellPrice: 130,
        powerBonusPct: 40,
        winRateBonusPct: 10,
        rewardBonusPct: 6,
        mercXpBonusPct: 14,
        expeditionSpeedBonusPct: 4,
        azitXpReward: 26,
        requiredAzitLevel: 1,
        description: '방울토마토와 햇감자를 푹 끓여낸 2티어 정통 보양 스튜입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-tomato', qty: 2 },
            { kind: 'crop', id: 'crop-potato', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-fresh-wrap',
        name: '아삭 청상추 쌈 도시락',
        emoji: '🥗',
        tier: 2,
        cookDurationSec: 1800,
        sellPrice: 185,
        powerBonusPct: 50,
        winRateBonusPct: 12,
        rewardBonusPct: 8,
        mercXpBonusPct: 16,
        expeditionSpeedBonusPct: 6,
        azitXpReward: 32,
        requiredAzitLevel: 2,
        description: '슬라임 젤리 특제 소스를 곁들인 산뜻한 2티어 원정 도시락입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-lettuce', qty: 2 },
            { kind: 'crop', id: 'crop-pepper', qty: 1 },
            { kind: 'material', id: 'mat-slime-jelly', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-potato-gratin',
        name: '황금 감자 그라탕',
        emoji: '🧀',
        tier: 2,
        cookDurationSec: 3000,
        sellPrice: 260,
        powerBonusPct: 65,
        winRateBonusPct: 15,
        rewardBonusPct: 10,
        mercXpBonusPct: 20,
        expeditionSpeedBonusPct: 8,
        azitXpReward: 40,
        requiredAzitLevel: 3,
        description: '고블린 향신료로 구워낸 고열량 프리미엄 그라탕입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-potato', qty: 2 },
            { kind: 'crop', id: 'crop-tomato', qty: 1 },
            { kind: 'material', id: 'mat-goblin-spice', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-strawberry-tart',
        name: '로열 딸기 타르트',
        emoji: '🍰',
        tier: 3,
        cookDurationSec: 5400,
        sellPrice: 420,
        powerBonusPct: 85,
        winRateBonusPct: 18,
        rewardBonusPct: 14,
        mercXpBonusPct: 24,
        expeditionSpeedBonusPct: 10,
        azitXpReward: 50,
        requiredAzitLevel: 4,
        description: '숲의 정령꿀과 설향 딸기가 어우러진 3티어 보스 공략 디저트입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-strawberry', qty: 2 },
            { kind: 'crop', id: 'crop-lettuce', qty: 1 },
            { kind: 'material', id: 'mat-forest-honey', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-knight-feast',
        name: '기사단 원정 만찬',
        emoji: '🍖',
        tier: 3,
        cookDurationSec: 7200,
        sellPrice: 680,
        powerBonusPct: 115,
        winRateBonusPct: 22,
        rewardBonusPct: 18,
        mercXpBonusPct: 30,
        expeditionSpeedBonusPct: 12,
        azitXpReward: 58,
        requiredAzitLevel: 5,
        description: '와이번 육포가 통째로 들어간 기사단 전용 스태미나 만찬입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-strawberry', qty: 2 },
            { kind: 'crop', id: 'crop-potato', qty: 2 },
            { kind: 'material', id: 'mat-wyvern-jerky', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-dragon-elixir',
        name: '전설의 드래곤 정식',
        emoji: '👑',
        tier: 4,
        cookDurationSec: 10800,
        sellPrice: 1200,
        powerBonusPct: 175,
        winRateBonusPct: 29,
        rewardBonusPct: 25,
        mercXpBonusPct: 40,
        expeditionSpeedBonusPct: 16,
        azitXpReward: 75,
        requiredAzitLevel: 7,
        description: '드래곤 비늘 가루로 완성하는 최강 4티어 궁극 보스 공략 정식입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-strawberry', qty: 3 },
            { kind: 'crop', id: 'crop-tomato', qty: 2 },
            { kind: 'material', id: 'mat-dragon-powder', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-blueberry-parfait',
        name: '서리 블루베리 파르페',
        emoji: '🍨',
        tier: 3,
        cookDurationSec: 6000,
        sellPrice: 520,
        powerBonusPct: 100,
        winRateBonusPct: 20,
        rewardBonusPct: 16,
        mercXpBonusPct: 27,
        expeditionSpeedBonusPct: 11,
        azitXpReward: 95,
        requiredAzitLevel: 20,
        description: '서리 빛 블루베리와 숲의 정령꿀을 겹겹이 쌓은 시원한 3티어 디저트입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-blueberry', qty: 2 },
            { kind: 'crop', id: 'crop-strawberry', qty: 1 },
            { kind: 'material', id: 'mat-forest-honey', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-pumpkin-risotto',
        name: '황금 호박 리조또',
        emoji: '🥘',
        tier: 3,
        cookDurationSec: 7800,
        sellPrice: 620,
        powerBonusPct: 130,
        winRateBonusPct: 24,
        rewardBonusPct: 20,
        mercXpBonusPct: 33,
        expeditionSpeedBonusPct: 13,
        azitXpReward: 115,
        requiredAzitLevel: 25,
        description: '황금 호박과 고블린 향신료의 깊은 풍미가 살아있는 든든한 고급 요리입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-pumpkin', qty: 2 },
            { kind: 'crop', id: 'crop-potato', qty: 1 },
            { kind: 'material', id: 'mat-goblin-spice', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-melon-sorbet',
        name: '왕실 멜론 샤베트',
        emoji: '🍧',
        tier: 3,
        cookDurationSec: 9000,
        sellPrice: 820,
        powerBonusPct: 150,
        winRateBonusPct: 26,
        rewardBonusPct: 22,
        mercXpBonusPct: 36,
        expeditionSpeedBonusPct: 14,
        azitXpReward: 140,
        requiredAzitLevel: 30,
        description: '왕실 머스크멜론의 과즙을 그대로 얼려낸 청량한 궁중 샤베트입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-melon', qty: 2 },
            { kind: 'crop', id: 'crop-blueberry', qty: 1 },
            { kind: 'material', id: 'mat-forest-honey', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-ginseng-tonic',
        name: '천년 산삼 원기탕',
        emoji: '🫖',
        tier: 4,
        cookDurationSec: 11700,
        sellPrice: 1250,
        powerBonusPct: 195,
        winRateBonusPct: 32,
        rewardBonusPct: 28,
        mercXpBonusPct: 43,
        expeditionSpeedBonusPct: 17,
        azitXpReward: 175,
        requiredAzitLevel: 36,
        description: '천년 산삼과 와이번 육포를 오랜 시간 달여낸 4티어 최고급 보양 영약입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-ginseng', qty: 2 },
            { kind: 'crop', id: 'crop-pumpkin', qty: 1 },
            { kind: 'material', id: 'mat-wyvern-jerky', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-truffle-steak',
        name: '심연 트러플 스테이크',
        emoji: '🥩',
        tier: 4,
        cookDurationSec: 12600,
        sellPrice: 1500,
        powerBonusPct: 225,
        winRateBonusPct: 35,
        rewardBonusPct: 31,
        mercXpBonusPct: 46,
        expeditionSpeedBonusPct: 18,
        azitXpReward: 210,
        requiredAzitLevel: 42,
        description: '블랙 트러플 향이 배어든 최상급 육포 스테이크로 파티 전투력을 극대화합니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-truffle', qty: 2 },
            { kind: 'crop', id: 'crop-ginseng', qty: 1 },
            { kind: 'material', id: 'mat-wyvern-jerky', qty: 1 },
        ],
    },
    {
        recipeId: 'dish-moon-elixir',
        name: '영원의 달빛 만찬',
        emoji: '🌌',
        tier: 4,
        cookDurationSec: 14400,
        sellPrice: 2200,
        powerBonusPct: 260,
        winRateBonusPct: 38,
        rewardBonusPct: 35,
        mercXpBonusPct: 50,
        expeditionSpeedBonusPct: 20,
        azitXpReward: 280,
        requiredAzitLevel: 50,
        description: '달빛 열매와 트러플, 드래곤 비늘 가루가 어우러진 Lv.50 궁극의 만찬입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-moonfruit', qty: 2 },
            { kind: 'crop', id: 'crop-truffle', qty: 1 },
            { kind: 'material', id: 'mat-dragon-powder', qty: 1 },
        ],
    },
];

export const AZIT_CHEFS: AzitChefDef[] = [
    {
        chefCode: 'chef-momo',
        name: '모모',
        title: '수습 가정식 셰프',
        emoji: '👩‍🍳',
        hireCost: 80,
        requiredAzitLevel: 1,
        baseSpeedBonusPct: 8,
        baseGreatChancePct: 10,
        maxLevel: 10,
        description: '정성 어린 손맛으로 조리 시간을 줄이고 특제 요리를 빚어내는 수습 셰프입니다.',
    },
    {
        chefCode: 'chef-bulta',
        name: '불타',
        title: '화덕 중식 셰프',
        emoji: '🔥',
        hireCost: 250,
        requiredAzitLevel: 2,
        baseSpeedBonusPct: 14,
        baseGreatChancePct: 18,
        maxLevel: 10,
        description: '섬세한 불 조절로 요리를 안정적으로 완성하며 특제 대성공을 노립니다.',
    },
    {
        chefCode: 'chef-claire',
        name: '클레어',
        title: '로열 파티시에',
        emoji: '🧁',
        hireCost: 600,
        requiredAzitLevel: 4,
        baseSpeedBonusPct: 20,
        baseGreatChancePct: 25,
        maxLevel: 10,
        description: '정교한 레시피 계량으로 특제 요리 대성공 확률을 크게 높입니다.',
    },
    {
        chefCode: 'chef-dragon',
        name: '마스터 용왕',
        title: '전설 궁중 요리장',
        emoji: '🐲',
        hireCost: 1400,
        requiredAzitLevel: 6,
        baseSpeedBonusPct: 28,
        baseGreatChancePct: 35,
        maxLevel: 10,
        description: '궁중 비법으로 전설급 특제 요리를 완성해 내는 최고봉 셰프입니다.',
    },
];

export const AZIT_FARMERS: AzitFarmerDef[] = [
    {
        farmerCode: 'farmer-bomi',
        name: '보미',
        title: '새싹 농장지기',
        emoji: '👩‍🌾',
        hireCost: 350,
        requiredAzitLevel: 20,
        maxLevel: MAX_FARMER_LEVEL,
        description: '아지트 Lv.20부터 고용 가능한 성실한 전담 농부입니다. 텃밭 관리의 기초를 책임집니다.',
    },
    {
        farmerCode: 'farmer-dori',
        name: '도리',
        title: '수확 베테랑 농부',
        emoji: '🧑‍🌾',
        hireCost: 700,
        requiredAzitLevel: 30,
        maxLevel: MAX_FARMER_LEVEL,
        description: '아지트 Lv.30부터 합류하는 숙련 농부로 넓은 텃밭의 물주기와 수확을 거뜬히 돕습니다.',
    },
    {
        farmerCode: 'farmer-eldin',
        name: '엘딘',
        title: '대자연의 현자 농부',
        emoji: '🧙‍♂️',
        hireCost: 1400,
        requiredAzitLevel: 42,
        maxLevel: MAX_FARMER_LEVEL,
        description: '아지트 Lv.42부터 초빙 가능한 원로 농부로 텃밭 순환 자동화를 완성합니다.',
    },
];

export const AZIT_MERCENARIES: AzitMercenaryDef[] = [
    {
        mercCode: 'merc-leo',
        name: '레오',
        role: '탱커',
        emoji: '🛡️',
        hireCost: 60,
        requiredAzitLevel: 1,
        basePower: 45,
        partyWinBonusPct: 0,
        bossRewardBonusPct: 0,
        maxLevel: 15,
        description: '든든한 방패로 초보 용병단의 선봉을 지키는 강철 기사입니다.',
        combatRole: 'tank',
        baseStats: {
            combatRole: 'tank',
            hp: 340,
            atk: 24,
            def: 20,
            moveSpeed: 115,
            attackIntervalMs: 1050,
            range: 60,
            critPct: 8,
        },
        mainSkill: {
            id: 'skill-leo-aegis',
            name: '아이기스 배리어',
            emoji: '🛡️',
            slot: 'main',
            effectKind: 'damage',
            targetScope: 'enemy_single',
            cooldownMs: 7200,
            powerPct: 140,
            perLevelPct: 18,
            range: 75,
            aoeRadius: 0,
            description: '강타와 기절을 가하고 자신 및 체력이 가장 낮은 아군에게 보호막을 부여합니다.',
            statusEffect: { kind: 'stun', durationMs: 1000, value: 1 },
        },
        subSkill: {
            id: 'skill-leo-provoke',
            name: '수호자의 포효',
            emoji: '📣',
            slot: 'sub',
            effectKind: 'aoe_damage',
            targetScope: 'enemy_aoe',
            cooldownMs: 4800,
            powerPct: 110,
            perLevelPct: 12,
            range: 95,
            aoeRadius: 95,
            description: '주변 적에게 충격파를 가하고 자신의 방어력을 강화합니다.',
            statusEffect: { kind: 'defUp', durationMs: 3500, value: 28 },
        },
    },
    {
        mercCode: 'merc-rina',
        name: '리나',
        role: '레인저',
        emoji: '🏹',
        hireCost: 140,
        requiredAzitLevel: 1,
        basePower: 70,
        partyWinBonusPct: 0,
        bossRewardBonusPct: 0,
        maxLevel: 15,
        description: '정확한 활 솜씨로 선제 제압에 능숙한 숲의 추적자입니다.',
        combatRole: 'ranger',
        baseStats: {
            combatRole: 'ranger',
            hp: 220,
            atk: 36,
            def: 9,
            moveSpeed: 138,
            attackIntervalMs: 820,
            range: 265,
            critPct: 14,
        },
        mainSkill: {
            id: 'skill-rina-volley',
            name: '에메랄드 애로우 레인',
            emoji: '🌧️',
            slot: 'main',
            effectKind: 'aoe_damage',
            targetScope: 'enemy_aoe',
            cooldownMs: 6800,
            powerPct: 185,
            perLevelPct: 22,
            range: 280,
            aoeRadius: 115,
            description: '최대 3명의 적에게 화살비를 퍼붓고 방어력을 약화시킵니다.',
            statusEffect: { kind: 'defDown', durationMs: 4000, value: 16 },
        },
        subSkill: {
            id: 'skill-rina-pierce',
            name: '관통 사격',
            emoji: '🏹',
            slot: 'sub',
            effectKind: 'damage',
            targetScope: 'enemy_single',
            cooldownMs: 4200,
            powerPct: 150,
            perLevelPct: 15,
            range: 285,
            aoeRadius: 0,
            description: '체력이 가장 낮은 적을 노려 확정 치명타 관통 화살을 발사합니다.',
            critMult: 1.35,
        },
    },
    {
        mercCode: 'merc-kael',
        name: '카엘',
        role: '딜러',
        emoji: '🔥',
        hireCost: 320,
        requiredAzitLevel: 2,
        basePower: 120,
        partyWinBonusPct: 0,
        bossRewardBonusPct: 0,
        maxLevel: 15,
        description: '폭발적인 화염 마법으로 적 진영을 초토화하는 마도사입니다.',
        combatRole: 'mage',
        baseStats: {
            combatRole: 'mage',
            hp: 245,
            atk: 54,
            def: 11,
            moveSpeed: 118,
            attackIntervalMs: 1020,
            range: 225,
            critPct: 12,
        },
        mainSkill: {
            id: 'skill-kael-meteor',
            name: '인페르노 메테오',
            emoji: '☄️',
            slot: 'main',
            effectKind: 'aoe_damage',
            targetScope: 'enemy_aoe',
            cooldownMs: 7800,
            powerPct: 220,
            perLevelPct: 25,
            range: 245,
            aoeRadius: 135,
            description: '거대한 운석을 떨어뜨려 광역 화염 피해와 지속 화상을 입힙니다.',
            statusEffect: { kind: 'burn', durationMs: 3000, value: 30 },
        },
        subSkill: {
            id: 'skill-kael-flamebolt',
            name: '작열 화염구',
            emoji: '🔥',
            slot: 'sub',
            effectKind: 'aoe_damage',
            targetScope: 'enemy_aoe',
            cooldownMs: 4400,
            powerPct: 155,
            perLevelPct: 16,
            range: 240,
            aoeRadius: 55,
            description: '대상과 인접한 적에게 화염구를 폭발시켜 화상을 남깁니다.',
            statusEffect: { kind: 'burn', durationMs: 2000, value: 24 },
        },
    },
    {
        mercCode: 'merc-serena',
        name: '세레나',
        role: '힐러',
        emoji: '✨',
        hireCost: 500,
        requiredAzitLevel: 3,
        basePower: 155,
        partyWinBonusPct: 6,
        bossRewardBonusPct: 0,
        maxLevel: 15,
        description: '치유의 축복으로 출전 시 파티 전체 승률을 +6% 높여줍니다.',
        combatRole: 'healer',
        baseStats: {
            combatRole: 'healer',
            hp: 290,
            atk: 40,
            def: 15,
            moveSpeed: 122,
            attackIntervalMs: 980,
            range: 235,
            critPct: 10,
        },
        mainSkill: {
            id: 'skill-serena-sanctuary',
            name: '성역의 축복',
            emoji: '🌟',
            slot: 'main',
            effectKind: 'heal_all',
            targetScope: 'ally_all',
            cooldownMs: 7600,
            powerPct: 165,
            perLevelPct: 22,
            range: 300,
            aoeRadius: 0,
            description: '모든 아군의 체력을 회복하고 지속 치유와 공격력 상승을 부여합니다.',
            statusEffect: { kind: 'regen', durationMs: 3000, value: 28 },
            secondaryStatusEffect: { kind: 'atkUp', durationMs: 4000, value: 16 },
        },
        subSkill: {
            id: 'skill-serena-mend',
            name: '치유의 빛',
            emoji: '💚',
            slot: 'sub',
            effectKind: 'heal',
            targetScope: 'ally_lowest',
            cooldownMs: 3800,
            powerPct: 155,
            perLevelPct: 18,
            range: 270,
            aoeRadius: 0,
            description: '부상당한 아군을 즉시 치유하며, 모두가 건강하면 적에게 성광을 내립니다.',
        },
    },
    {
        mercCode: 'merc-garr',
        name: '가르',
        role: '딜러',
        emoji: '🪓',
        hireCost: 950,
        requiredAzitLevel: 5,
        basePower: 240,
        partyWinBonusPct: 0,
        bossRewardBonusPct: 0,
        maxLevel: 15,
        description: '거대한 쌍도끼를 휘두르며 거대 몬스터를 분쇄하는 버서커입니다.',
        combatRole: 'berserker',
        baseStats: {
            combatRole: 'berserker',
            hp: 480,
            atk: 78,
            def: 22,
            moveSpeed: 142,
            attackIntervalMs: 880,
            range: 65,
            critPct: 15,
        },
        mainSkill: {
            id: 'skill-garr-whirlwind',
            name: '혈풍 쌍부 난무',
            emoji: '🌪️',
            slot: 'main',
            effectKind: 'aoe_damage',
            targetScope: 'enemy_aoe',
            cooldownMs: 6800,
            powerPct: 235,
            perLevelPct: 26,
            range: 110,
            aoeRadius: 110,
            description: '주변 모든 적을 베어 넘기고 입힌 피해의 일부만큼 체력을 흡수합니다.',
            lifestealPct: 25,
        },
        subSkill: {
            id: 'skill-garr-frenzy',
            name: '광전사의 분노',
            emoji: '💢',
            slot: 'sub',
            effectKind: 'damage',
            targetScope: 'enemy_single',
            cooldownMs: 4600,
            powerPct: 170,
            perLevelPct: 16,
            range: 80,
            aoeRadius: 0,
            description: '강력한 도끼 일격 후 자신의 공격력을 크게 끌어올립니다.',
            statusEffect: { kind: 'atkUp', durationMs: 3500, value: 24 },
        },
    },
    {
        mercCode: 'merc-aria',
        name: '아리아',
        role: '올라운더',
        emoji: '⚔️',
        hireCost: 1800,
        requiredAzitLevel: 7,
        basePower: 380,
        partyWinBonusPct: 0,
        bossRewardBonusPct: 20,
        maxLevel: 15,
        description: '보스 토벌 승리 시 베라포인트 전리품을 +20% 더 가져옵니다.',
        combatRole: 'allrounder',
        baseStats: {
            combatRole: 'allrounder',
            hp: 600,
            atk: 108,
            def: 30,
            moveSpeed: 155,
            attackIntervalMs: 760,
            range: 78,
            critPct: 18,
        },
        mainSkill: {
            id: 'skill-aria-valkyrie',
            name: '천공 발키리 심판',
            emoji: '🪽',
            slot: 'main',
            effectKind: 'aoe_damage',
            targetScope: 'enemy_aoe',
            cooldownMs: 7400,
            powerPct: 260,
            perLevelPct: 28,
            range: 120,
            aoeRadius: 130,
            description: '적 진영에 광역 성검을 내리꽂고 아군 전원에게 공격력 상승과 보호막을 부여합니다.',
            statusEffect: { kind: 'atkUp', durationMs: 4000, value: 20 },
        },
        subSkill: {
            id: 'skill-aria-tempest',
            name: '섬광 연격',
            emoji: '⚡',
            slot: 'sub',
            effectKind: 'damage',
            targetScope: 'enemy_single',
            cooldownMs: 4000,
            powerPct: 180,
            perLevelPct: 18,
            range: 92,
            aoeRadius: 0,
            description: '보스 및 핵심 적을 향해 연속 섬광 베기를 가해 방어력을 깎습니다.',
            statusEffect: { kind: 'defDown', durationMs: 3000, value: 18 },
        },
    },
];

function createMonsterSkill(
    id: string,
    name: string,
    emoji: string,
    slot: 'main' | 'sub',
    effectKind: CombatSkillSpec['effectKind'],
    targetScope: CombatSkillSpec['targetScope'],
    cooldownMs: number,
    powerPct: number,
    range: number,
    aoeRadius: number,
    description: string,
    statusEffect?: CombatSkillSpec['statusEffect']
): CombatSkillSpec {
    return {
        id,
        name,
        emoji,
        slot,
        effectKind,
        targetScope,
        cooldownMs,
        powerPct,
        perLevelPct: 10,
        range,
        aoeRadius,
        description,
        statusEffect,
    };
}

export const AZIT_EXPEDITION_ZONES: AzitExpeditionZoneDef[] = [
    {
        zoneId: 'zone-slime',
        name: '슬라임 습지대',
        monsterName: '킹 초원 슬라임',
        emoji: '🟢',
        durationSec: 3600,
        entryCost: 15,
        minDishTier: 1,
        recommendedPower: 90,
        rewardPoints: 120,
        rewardAzitXp: 35,
        rewardMercXp: 60,
        lossMercXp: 20,
        dropMaterialId: 'mat-slime-jelly',
        dropMinQty: 2,
        dropMaxQty: 4,
        isBoss: false,
        requiredAzitLevel: 1,
        zoneTheme: 'theme-slime-marsh',
        deathRiskPct: 15,
        description: '1시간 기초 원정 코스입니다. 슬라임 젤리와 기초 부활/강화 재료를 수집할 수 있습니다.',
        cropDropPool: ['crop-carrot', 'crop-pepper'],
        itemDrops: [
            { itemId: 'item-revival-herb', chancePct: 25, minQty: 1, maxQty: 1 },
            { itemId: 'item-skill-stone', chancePct: 40, minQty: 1, maxQty: 1 },
        ],
        monsters: [
            {
                monsterId: 'mon-slime',
                name: '초원 슬라임',
                emoji: '🟢',
                role: '딜러',
                combatRole: 'enemy-melee',
                maxHp: 115,
                atk: 13,
                def: 4,
                moveSpeed: 88,
                attackIntervalMs: 1250,
                range: 56,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-slime-splash', '점액 돌진', '🫧', 'main', 'damage', 'enemy_single', 7800, 130, 72, 0, '탄력 있는 몸통으로 들이받습니다.'),
                subSkill: createMonsterSkill('mon-slime-bounce', '젤리 탄성', '🟢', 'sub', 'buff', 'self', 6400, 100, 70, 0, '방어 태세를 취합니다.', { kind: 'defUp', durationMs: 2500, value: 15 }),
            },
            {
                monsterId: 'mon-king-slime',
                name: '킹 초원 슬라임',
                emoji: '👑',
                role: '탱커',
                combatRole: 'enemy-melee',
                maxHp: 165,
                atk: 16,
                def: 6,
                moveSpeed: 82,
                attackIntervalMs: 1200,
                range: 62,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-kslime-slam', '거대 점액 강타', '👑', 'main', 'aoe_damage', 'enemy_aoe', 7500, 140, 85, 85, '주변에 묵직한 점액 파동을 퍼뜨립니다.'),
                subSkill: createMonsterSkill('mon-kslime-gel', '점액 장막', '🫧', 'sub', 'shield', 'self', 6000, 100, 70, 0, '스스로에게 젤리 보호막을 씌웁니다.', { kind: 'shield', durationMs: 3000, value: 18 }),
            },
        ],
    },
    {
        zoneId: 'zone-goblin',
        name: '고블린 약탈 캠프',
        monsterName: '고블린 약탈대장',
        emoji: '👺',
        durationSec: 7200,
        entryCost: 35,
        minDishTier: 1,
        recommendedPower: 210,
        rewardPoints: 260,
        rewardAzitXp: 70,
        rewardMercXp: 130,
        lossMercXp: 40,
        dropMaterialId: 'mat-goblin-spice',
        dropMinQty: 2,
        dropMaxQty: 5,
        isBoss: false,
        requiredAzitLevel: 1,
        zoneTheme: 'theme-goblin-camp',
        deathRiskPct: 25,
        description: '2시간 중급 원정! 고블린 약탈단을 제압하고 향신료와 연마석을 확보하세요.',
        cropDropPool: ['crop-pepper', 'crop-tomato'],
        itemDrops: [
            { itemId: 'item-revival-herb', chancePct: 35, minQty: 1, maxQty: 1 },
            { itemId: 'item-skill-stone', chancePct: 60, minQty: 1, maxQty: 1 },
            { itemId: 'item-battle-elixir', chancePct: 15, minQty: 1, maxQty: 1 },
        ],
        monsters: [
            {
                monsterId: 'mon-goblin',
                name: '고블린 궁수',
                emoji: '🏹',
                role: '레인저',
                combatRole: 'enemy-ranged',
                maxHp: 185,
                atk: 26,
                def: 8,
                moveSpeed: 105,
                attackIntervalMs: 1120,
                range: 215,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-gob-poison', '독침 사격', '🏹', 'main', 'damage', 'enemy_single', 7400, 145, 225, 0, '독 묻은 화살을 쏩니다.', { kind: 'burn', durationMs: 2000, value: 15 }),
                subSkill: createMonsterSkill('mon-gob-snipe', '급습 화살', '🎯', 'sub', 'damage', 'enemy_single', 5200, 125, 220, 0, '빠른 화살로 견제합니다.'),
            },
            {
                monsterId: 'mon-goblin-chief',
                name: '고블린 약탈대장',
                emoji: '👺',
                role: '딜러',
                combatRole: 'enemy-melee',
                maxHp: 310,
                atk: 34,
                def: 14,
                moveSpeed: 102,
                attackIntervalMs: 1080,
                range: 64,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-gchief-cleave', '약탈자의 도끼질', '🪓', 'main', 'aoe_damage', 'enemy_aoe', 7200, 155, 95, 95, '거친 도끼질로 주변 적을 베어냅니다.'),
                subSkill: createMonsterSkill('mon-gchief-roar', '전투 함성', '📣', 'sub', 'buff', 'self', 5800, 100, 75, 0, '공격력을 끌어올립니다.', { kind: 'atkUp', durationMs: 3000, value: 20 }),
            },
        ],
    },
    {
        zoneId: 'zone-forest',
        name: '고대 정령의 숲',
        monsterName: '안개 숲의 여왕 정령',
        emoji: '🧚',
        durationSec: 10800,
        entryCost: 70,
        minDishTier: 2,
        recommendedPower: 400,
        rewardPoints: 450,
        rewardAzitXp: 115,
        rewardMercXp: 220,
        lossMercXp: 65,
        dropMaterialId: 'mat-forest-honey',
        dropMinQty: 3,
        dropMaxQty: 6,
        isBoss: false,
        requiredAzitLevel: 2,
        zoneTheme: 'theme-ancient-forest',
        deathRiskPct: 30,
        description: '3시간 심층 탐색! 티어 2 이상 도시락이 필요하며 전술 연마석을 확정 획득합니다.',
        cropDropPool: ['crop-lettuce', 'crop-potato', 'crop-strawberry'],
        itemDrops: [
            { itemId: 'item-revival-herb', chancePct: 50, minQty: 1, maxQty: 1 },
            { itemId: 'item-skill-stone', chancePct: 100, minQty: 1, maxQty: 2 },
            { itemId: 'item-battle-elixir', chancePct: 25, minQty: 1, maxQty: 1 },
        ],
        monsters: [
            {
                monsterId: 'mon-treant',
                name: '고목 수호자',
                emoji: '🌳',
                role: '탱커',
                combatRole: 'enemy-melee',
                maxHp: 560,
                atk: 46,
                def: 26,
                moveSpeed: 84,
                attackIntervalMs: 1200,
                range: 66,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-treant-root', '대지의 뿌리 강타', '🌳', 'main', 'damage', 'enemy_single', 7400, 150, 82, 0, '거대한 나무 뿌리로 내려쳐 기절시킵니다.', { kind: 'stun', durationMs: 900, value: 1 }),
                subSkill: createMonsterSkill('mon-treant-bark', '단단한 껍질', '🛡️', 'sub', 'buff', 'self', 5800, 100, 70, 0, '방어력을 강화합니다.', { kind: 'defUp', durationMs: 3200, value: 25 }),
            },
            {
                monsterId: 'mon-spirit',
                name: '안개 정령',
                emoji: '🧚',
                role: '레인저',
                combatRole: 'enemy-ranged',
                maxHp: 390,
                atk: 54,
                def: 16,
                moveSpeed: 112,
                attackIntervalMs: 1040,
                range: 220,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-spirit-pulse', '정령 파동', '✨', 'main', 'aoe_damage', 'enemy_aoe', 7000, 150, 225, 95, '푸른 정령 탄환을 터뜨립니다.'),
                subSkill: createMonsterSkill('mon-spirit-bolt', '마력 탄환', '💫', 'sub', 'damage', 'enemy_single', 4600, 130, 220, 0, '방어력을 깎는 마력 탄환을 날립니다.', { kind: 'defDown', durationMs: 2800, value: 14 }),
            },
            {
                monsterId: 'mon-forest-queen',
                name: '안개 숲의 여왕 정령',
                emoji: '🌺',
                role: '딜러',
                combatRole: 'enemy-ranged',
                maxHp: 640,
                atk: 64,
                def: 22,
                moveSpeed: 106,
                attackIntervalMs: 1020,
                range: 215,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-fqueen-bloom', '만개하는 폭풍', '🌺', 'main', 'aoe_damage', 'enemy_aoe', 7600, 165, 230, 115, '숲의 정령 마력을 광역으로 방출합니다.'),
                subSkill: createMonsterSkill('mon-fqueen-dew', '성수의 가호', '💧', 'sub', 'heal_all', 'ally_all', 6200, 110, 240, 0, '아군 몬스터를 소량 치유합니다.'),
            },
        ],
    },
    {
        zoneId: 'zone-golem',
        name: '흑요석 골렘 협곡',
        monsterName: '룬 스톤 가디언',
        emoji: '🗿',
        durationSec: 14400,
        entryCost: 130,
        minDishTier: 2,
        recommendedPower: 680,
        rewardPoints: 720,
        rewardAzitXp: 175,
        rewardMercXp: 340,
        lossMercXp: 100,
        dropMaterialId: 'mat-forest-honey',
        dropMinQty: 3,
        dropMaxQty: 6,
        bonusMaterialId: 'mat-goblin-spice',
        bonusMaterialMinQty: 2,
        bonusMaterialMaxQty: 4,
        isBoss: false,
        requiredAzitLevel: 3,
        zoneTheme: 'theme-obsidian-canyon',
        deathRiskPct: 40,
        description: '4시간 고난도 협곡 원정! 비전 스킬 교본과 생명의 약초를 확보할 핵심 사냥터입니다.',
        cropDropPool: ['crop-potato', 'crop-strawberry'],
        itemDrops: [
            { itemId: 'item-revival-herb', chancePct: 100, minQty: 1, maxQty: 1 },
            { itemId: 'item-skill-stone', chancePct: 100, minQty: 1, maxQty: 2 },
            { itemId: 'item-skill-tome', chancePct: 35, minQty: 1, maxQty: 1 },
        ],
        monsters: [
            {
                monsterId: 'mon-dark-knight',
                name: '흑요석 암흑기사',
                emoji: '🛡️',
                role: '딜러',
                combatRole: 'enemy-melee',
                maxHp: 940,
                atk: 88,
                def: 42,
                moveSpeed: 104,
                attackIntervalMs: 1020,
                range: 70,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-dk-slash', '암흑 파쇄격', '⚔️', 'main', 'damage', 'enemy_single', 7000, 170, 88, 0, '방어력을 찢는 암흑의 참격을 가합니다.', { kind: 'defDown', durationMs: 3200, value: 18 }),
                subSkill: createMonsterSkill('mon-dk-guard', '흑요석 갑주', '🛡️', 'sub', 'shield', 'self', 5600, 100, 75, 0, '단단한 보호막을 전개합니다.', { kind: 'shield', durationMs: 3200, value: 20 }),
            },
            {
                monsterId: 'mon-golem',
                name: '룬 스톤 가디언',
                emoji: '🗿',
                role: '탱커',
                combatRole: 'enemy-melee',
                maxHp: 1380,
                atk: 98,
                def: 54,
                moveSpeed: 76,
                attackIntervalMs: 1220,
                range: 72,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-golem-quake', '대지 분쇄', '💥', 'main', 'aoe_damage', 'enemy_aoe', 7600, 180, 110, 115, '협곡을 울리는 지진을 일으켜 기절시킵니다.', { kind: 'stun', durationMs: 1000, value: 1 }),
                subSkill: createMonsterSkill('mon-golem-rune', '룬 폭주', '🔮', 'sub', 'buff', 'self', 6000, 100, 80, 0, '고대 룬이 빛나며 공격력이 상승합니다.', { kind: 'atkUp', durationMs: 3500, value: 22 }),
            },
        ],
    },
    {
        zoneId: 'zone-wyvern',
        name: '창공 와이번 둥지',
        monsterName: '홍련의 와이번 로드',
        emoji: '🦅',
        durationSec: 21600,
        entryCost: 240,
        minDishTier: 3,
        recommendedPower: 1050,
        rewardPoints: 1200,
        rewardAzitXp: 280,
        rewardMercXp: 540,
        lossMercXp: 160,
        dropMaterialId: 'mat-wyvern-jerky',
        dropMinQty: 3,
        dropMaxQty: 7,
        isBoss: true,
        requiredAzitLevel: 5,
        zoneTheme: 'theme-wyvern-peak',
        deathRiskPct: 50,
        description: '6시간 보스 원정! 티어 3 이상 요리가 필수이며 비전 스킬 교본과 불사조의 깃털이 드롭됩니다.',
        cropDropPool: ['crop-strawberry', 'crop-blueberry'],
        itemDrops: [
            { itemId: 'item-revival-herb', chancePct: 100, minQty: 1, maxQty: 2 },
            { itemId: 'item-skill-tome', chancePct: 100, minQty: 1, maxQty: 1 },
            { itemId: 'item-phoenix-feather', chancePct: 30, minQty: 1, maxQty: 1 },
        ],
        monsters: [
            {
                monsterId: 'mon-flame-mage',
                name: '화염 마도사',
                emoji: '🔥',
                role: '딜러',
                combatRole: 'enemy-ranged',
                maxHp: 1180,
                atk: 128,
                def: 44,
                moveSpeed: 98,
                attackIntervalMs: 1050,
                range: 225,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-fm-inferno', '화염 폭풍', '🔥', 'main', 'aoe_damage', 'enemy_aoe', 7400, 175, 235, 110, '불길의 소용돌이로 화상을 입힙니다.', { kind: 'burn', durationMs: 3000, value: 32 }),
                subSkill: createMonsterSkill('mon-fm-ember', '불꽃 탄환', '💥', 'sub', 'damage', 'enemy_single', 4600, 145, 230, 0, '뜨거운 불덩이를 날립니다.'),
            },
            {
                monsterId: 'mon-wyvern',
                name: '홍련의 와이번 로드',
                emoji: '🦅',
                role: '보스',
                combatRole: 'enemy-boss',
                maxHp: 2450,
                atk: 158,
                def: 68,
                moveSpeed: 114,
                attackIntervalMs: 1040,
                range: 110,
                isBoss: true,
                mainSkill: createMonsterSkill('mon-wyv-breath', '홍련 화염 브레스', '🔥', 'main', 'aoe_damage', 'enemy_aoe', 7200, 200, 185, 130, '창공에서 불꽃 브레스를 쏟아부어 화상을 입힙니다.', { kind: 'burn', durationMs: 3000, value: 38 }),
                subSkill: createMonsterSkill('mon-wyv-wing', '강풍 날개치기', '🌪️', 'sub', 'aoe_damage', 'enemy_aoe', 5000, 155, 120, 110, '강력한 바람으로 방어력을 떨어뜨립니다.', { kind: 'defDown', durationMs: 3000, value: 20 }),
            },
        ],
    },
    {
        zoneId: 'zone-dragon',
        name: '적염 고대 용의 심연',
        monsterName: '심연의 흑룡 바하무트',
        emoji: '🐉',
        durationSec: 28800,
        entryCost: 450,
        minDishTier: 3,
        recommendedPower: 1550,
        rewardPoints: 1850,
        rewardAzitXp: 420,
        rewardMercXp: 820,
        lossMercXp: 240,
        dropMaterialId: 'mat-dragon-powder',
        dropMinQty: 5,
        dropMaxQty: 10,
        bonusMaterialId: 'mat-wyvern-jerky',
        bonusMaterialMinQty: 3,
        bonusMaterialMaxQty: 5,
        isBoss: true,
        requiredAzitLevel: 6,
        zoneTheme: 'theme-dragon-abyss',
        deathRiskPct: 60,
        description: '최고 난이도 8시간 최종 원정! 막대한 골드, 불사조의 깃털, 비전 스킬 교본을 확정 획득합니다.',
        cropDropPool: ['crop-strawberry', 'crop-pumpkin', 'crop-ginseng'],
        itemDrops: [
            { itemId: 'item-phoenix-feather', chancePct: 100, minQty: 1, maxQty: 1 },
            { itemId: 'item-skill-tome', chancePct: 100, minQty: 1, maxQty: 2 },
            { itemId: 'item-battle-elixir', chancePct: 100, minQty: 1, maxQty: 1 },
        ],
        monsters: [
            {
                monsterId: 'mon-dark-knight',
                name: '용족 근위기사',
                emoji: '🛡️',
                role: '탱커',
                combatRole: 'enemy-melee',
                maxHp: 1900,
                atk: 168,
                def: 76,
                moveSpeed: 105,
                attackIntervalMs: 1020,
                range: 74,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-dk-dragon-cleave', '용혈 참격', '⚔️', 'main', 'damage', 'enemy_single', 7200, 185, 92, 0, '강력한 일격으로 방어력을 붕괴시킵니다.', { kind: 'defDown', durationMs: 3200, value: 22 }),
                subSkill: createMonsterSkill('mon-dk-dragon-aegis', '용린 방패', '🛡️', 'sub', 'shield', 'self', 5800, 100, 75, 0, '용비늘 보호막을 두릅니다.', { kind: 'shield', durationMs: 3500, value: 22 }),
            },
            {
                monsterId: 'mon-flame-mage',
                name: '심연 화염술사',
                emoji: '🔥',
                role: '딜러',
                combatRole: 'enemy-ranged',
                maxHp: 1620,
                atk: 185,
                def: 60,
                moveSpeed: 100,
                attackIntervalMs: 1000,
                range: 230,
                isBoss: false,
                mainSkill: createMonsterSkill('mon-fm-abyss', '심연의 불기둥', '☄️', 'main', 'aoe_damage', 'enemy_aoe', 7500, 195, 240, 120, '타오르는 불기둥으로 광역 피해를 줍니다.', { kind: 'burn', durationMs: 3000, value: 42 }),
                subSkill: createMonsterSkill('mon-fm-spark', '멸망의 불꽃', '🔥', 'sub', 'damage', 'enemy_single', 4600, 155, 235, 0, '집중 화염탄을 발사합니다.'),
            },
            {
                monsterId: 'mon-dragon',
                name: '심연의 흑룡 바하무트',
                emoji: '🐉',
                role: '보스',
                combatRole: 'enemy-boss',
                maxHp: 4200,
                atk: 235,
                def: 92,
                moveSpeed: 108,
                attackIntervalMs: 1000,
                range: 120,
                isBoss: true,
                mainSkill: createMonsterSkill('mon-bahamut-megaflare', '메가 플레어', '🐉', 'main', 'aoe_damage', 'enemy_aoe', 7400, 225, 210, 145, '심연의 흑염을 쏟아부어 전장을 초토화합니다.', { kind: 'burn', durationMs: 3500, value: 55 }),
                subSkill: createMonsterSkill('mon-bahamut-roar', '용왕의 위압', '💥', 'sub', 'aoe_damage', 'enemy_aoe', 5400, 165, 130, 120, '포효로 주변을 뒤흔들어 기절시킵니다.', { kind: 'stun', durationMs: 1000, value: 1 }),
            },
        ],
    },
];

export const AZIT_LEVEL_TABLE: AzitLevelStep[] = [
    { level: 1, requiredXp: 0, title: '새내기 개척지', kitchenSlots: 1, maxChefs: 1, maxMercs: 3, maxPartySize: 2, maxActiveExpeditions: 2, gardenPlots: 6, maxFarmers: 0 },
    { level: 2, requiredXp: 80, title: '활기찬 초원 아지트', kitchenSlots: 1, maxChefs: 2, maxMercs: 4, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 6, maxFarmers: 0 },
    { level: 3, requiredXp: 220, title: '향긋한 비스트로 아지트', kitchenSlots: 2, maxChefs: 2, maxMercs: 5, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 6, maxFarmers: 0 },
    { level: 4, requiredXp: 460, title: '모험가 길드 쉼터', kitchenSlots: 2, maxChefs: 3, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 6, maxFarmers: 0 },
    { level: 5, requiredXp: 820, title: '이중 원정 사령부', kitchenSlots: 2, maxChefs: 3, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 3, gardenPlots: 7, maxFarmers: 0 },
    { level: 6, requiredXp: 1350, title: '황금 화덕 대저택', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 3, gardenPlots: 7, maxFarmers: 0 },
    { level: 7, requiredXp: 2100, title: '로열 토벌 기사단 본부', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 3, gardenPlots: 7, maxFarmers: 0 },
    { level: 8, requiredXp: 3100, title: '영웅의 성채 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 3, gardenPlots: 7, maxFarmers: 0 },
    { level: 9, requiredXp: 4400, title: '그랜드 마스터 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 3, gardenPlots: 7, maxFarmers: 0 },
    { level: 10, requiredXp: 6200, title: '전설의 베라 왕국 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 3, gardenPlots: 8, maxFarmers: 0 },
    { level: 11, requiredXp: 8300, title: '은빛 개척단 전초기지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 3, gardenPlots: 8, maxFarmers: 0 },
    { level: 12, requiredXp: 10700, title: '비옥한 햇살 농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 8, maxFarmers: 0 },
    { level: 13, requiredXp: 13400, title: '상아탑 보급 장원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 8, maxFarmers: 0 },
    { level: 14, requiredXp: 16400, title: '황금 이삭 영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 8, maxFarmers: 0 },
    { level: 15, requiredXp: 19700, title: '수호자의 성역 농장', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 9, maxFarmers: 0 },
    { level: 16, requiredXp: 23300, title: '번영의 길드 대농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 9, maxFarmers: 0 },
    { level: 17, requiredXp: 27200, title: '창공의 바람 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 9, maxFarmers: 0 },
    { level: 18, requiredXp: 31400, title: '성좌의 축복 영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 9, maxFarmers: 0 },
    { level: 19, requiredXp: 35900, title: '여명의 대공국 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 9, maxFarmers: 0 },
    { level: 20, requiredXp: 40700, title: '농부 길드 개척령', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 10, maxFarmers: 1 },
    { level: 21, requiredXp: 45900, title: '청록빛 숲의 장원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 10, maxFarmers: 1 },
    { level: 22, requiredXp: 51500, title: '정령이 깃든 온실', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 10, maxFarmers: 1 },
    { level: 23, requiredXp: 57500, title: '백은 기사단 농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 10, maxFarmers: 1 },
    { level: 24, requiredXp: 63900, title: '풍요의 대지 성채', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 10, maxFarmers: 1 },
    { level: 25, requiredXp: 70700, title: '황금 호박 대영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 11, maxFarmers: 1 },
    { level: 26, requiredXp: 77900, title: '붉은 노을 왕립 농장', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 11, maxFarmers: 1 },
    { level: 27, requiredXp: 85500, title: '고대 수호수의 쉼터', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 11, maxFarmers: 1 },
    { level: 28, requiredXp: 93500, title: '비취빛 현자의 정원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 11, maxFarmers: 1 },
    { level: 29, requiredXp: 101900, title: '별빛 마도원의 영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 11, maxFarmers: 1 },
    { level: 30, requiredXp: 110700, title: '왕실 직할 대농장', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 12, maxFarmers: 1 },
    { level: 31, requiredXp: 120000, title: '오색 무지개 비경', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 12, maxFarmers: 1 },
    { level: 32, requiredXp: 129800, title: '백금 수확단 본부', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 12, maxFarmers: 1 },
    { level: 33, requiredXp: 140100, title: '용의 숨결 온실 성채', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 12, maxFarmers: 1 },
    { level: 34, requiredXp: 150900, title: '천공 정원의 관문', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 12, maxFarmers: 1 },
    { level: 35, requiredXp: 162200, title: '쌍둥이 농부 대영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 13, maxFarmers: 2 },
    { level: 36, requiredXp: 174000, title: '천년 영약의 계곡', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 13, maxFarmers: 2 },
    { level: 37, requiredXp: 186300, title: '태양왕의 황금 성소', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 13, maxFarmers: 2 },
    { level: 38, requiredXp: 199100, title: '대현자의 아카데미 농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 13, maxFarmers: 2 },
    { level: 39, requiredXp: 212400, title: '성운의 축복 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 13, maxFarmers: 2 },
    { level: 40, requiredXp: 226200, title: '제국 최상급 영빈 장원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 14, maxFarmers: 2 },
    { level: 41, requiredXp: 240600, title: '영원한 봄의 낙원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 14, maxFarmers: 2 },
    { level: 42, requiredXp: 255600, title: '심연 트러플 성역', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 14, maxFarmers: 2 },
    { level: 43, requiredXp: 271200, title: '은하수 별빛 궁전', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 14, maxFarmers: 2 },
    { level: 44, requiredXp: 287400, title: '황혼의 대군주 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 14, maxFarmers: 2 },
    { level: 45, requiredXp: 304200, title: '신화의 대지 아발론', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 15, maxFarmers: 2 },
    { level: 46, requiredXp: 321600, title: '초월자의 황금 수목원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 15, maxFarmers: 2 },
    { level: 47, requiredXp: 339600, title: '성황의 천상 대정원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 15, maxFarmers: 2 },
    { level: 48, requiredXp: 358200, title: '불멸의 아르카디아 성채', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 15, maxFarmers: 2 },
    { level: 49, requiredXp: 377400, title: '창세의 에덴 전당', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 15, maxFarmers: 2 },
    { level: 50, requiredXp: 397200, title: '절대군주의 달빛 에덴', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 4, gardenPlots: 16, maxFarmers: 2 },
];

export const AZIT_ITEMS: AzitItemDef[] = [
    {
        itemId: 'item-revival-herb',
        name: '생명의 약초',
        emoji: '🌿',
        category: 'revival',
        shopPrice: 150,
        requiredAzitLevel: 1,
        description: '원정에서 쓰러진 용병 1명을 소생시켜 즉시 캠프 대기 상태로 복귀시킵니다.',
    },
    {
        itemId: 'item-phoenix-feather',
        name: '불사조의 깃털',
        emoji: '🪶',
        category: 'revival',
        shopPrice: 420,
        requiredAzitLevel: 3,
        bonusMercXp: 30,
        description: '쓰러진 용병 1명을 즉시 부활시키고 보너스 전투 경험치 +30을 부여합니다.',
    },
    {
        itemId: 'item-skill-stone',
        name: '전술 연마석',
        emoji: '💎',
        category: 'skill_mat',
        shopPrice: null,
        requiredAzitLevel: 1,
        description: '용병의 서브 스킬 레벨(Lv.1~10)을 강화하는 마법 연마석입니다.',
    },
    {
        itemId: 'item-skill-tome',
        name: '비전 스킬 교본',
        emoji: '📘',
        category: 'skill_mat',
        shopPrice: null,
        requiredAzitLevel: 3,
        description: '용병의 고유 메인 스킬 레벨(Lv.1~10)을 강화하는 고급 전술 교본입니다.',
    },
    {
        itemId: 'item-battle-elixir',
        name: '투지의 비약',
        emoji: '⚗️',
        category: 'consumable',
        shopPrice: 120,
        requiredAzitLevel: 1,
        description: '원정 또는 베라의 탑 출전 시 파티 전원 공격력과 최대 체력을 +12% 높여줍니다.',
    },
];

export const AZIT_CRAFT_RECIPES: AzitCraftRecipeDef[] = [
    {
        recipeId: 'craft-revival-herb',
        resultItemId: 'item-revival-herb',
        resultQty: 1,
        name: '생명의 약초 조합',
        emoji: '🌿',
        requiredAzitLevel: 1,
        pointsCost: 40,
        ingredients: [
            { kind: 'crop', id: 'crop-lettuce', qty: 2 },
            { kind: 'material', id: 'mat-slime-jelly', qty: 2 },
        ],
        description: '유기농 청상추와 슬라임 젤리를 정제해 부활 약초를 조합합니다.',
    },
    {
        recipeId: 'craft-battle-elixir',
        resultItemId: 'item-battle-elixir',
        resultQty: 1,
        name: '투지의 비약 연성',
        emoji: '⚗️',
        requiredAzitLevel: 1,
        pointsCost: 50,
        ingredients: [
            { kind: 'crop', id: 'crop-pepper', qty: 2 },
            { kind: 'crop', id: 'crop-tomato', qty: 1 },
            { kind: 'material', id: 'mat-goblin-spice', qty: 1 },
        ],
        description: '알싸한 고추와 고블린 향신료로 전투력을 끌어올리는 비약을 제조합니다.',
    },
    {
        recipeId: 'craft-skill-stone',
        resultItemId: 'item-skill-stone',
        resultQty: 1,
        name: '전술 연마석 세공',
        emoji: '💎',
        requiredAzitLevel: 1,
        pointsCost: 80,
        ingredients: [
            { kind: 'crop', id: 'crop-potato', qty: 2 },
            { kind: 'material', id: 'mat-goblin-spice', qty: 2 },
            { kind: 'material', id: 'mat-forest-honey', qty: 1 },
        ],
        description: '정령꿀과 광물을 응축해 서브 스킬 강화용 연마석을 제작합니다.',
    },
    {
        recipeId: 'craft-skill-tome',
        resultItemId: 'item-skill-tome',
        resultQty: 1,
        name: '비전 스킬 교본 제본',
        emoji: '📘',
        requiredAzitLevel: 4,
        pointsCost: 150,
        ingredients: [
            { kind: 'item', id: 'item-skill-stone', qty: 2 },
            { kind: 'material', id: 'mat-wyvern-jerky', qty: 1 },
        ],
        description: '연마석 2개와 와이번 육포 가죽을 엮어 메인 스킬 교본을 완성합니다.',
    },
    {
        recipeId: 'craft-phoenix-feather',
        resultItemId: 'item-phoenix-feather',
        resultQty: 1,
        name: '불사조의 깃털 비법',
        emoji: '🪶',
        requiredAzitLevel: 5,
        pointsCost: 120,
        ingredients: [
            { kind: 'crop', id: 'crop-strawberry', qty: 2 },
            { kind: 'material', id: 'mat-wyvern-jerky', qty: 1 },
            { kind: 'material', id: 'mat-dragon-powder', qty: 1 },
        ],
        description: '드래곤 비늘 가루의 불꽃을 담아 최상급 부활 깃털을 연성합니다.',
    },
];

export function getPlotUnlockDef(plotIndex: number): AzitPlotUnlockDef | undefined {
    return AZIT_PLOT_UNLOCKS.find((p) => p.plotIndex === plotIndex);
}

export function getFertilizerDef(fertilizerId: string): AzitFertilizerDef | undefined {
    return AZIT_FERTILIZERS.find((f) => f.fertilizerId === fertilizerId);
}

export function getSoilLevelDef(level: number): AzitSoilLevelDef | undefined {
    return AZIT_SOIL_LEVELS.find((s) => s.level === level);
}

export function getNextSoilLevelDef(currentLevel: number): AzitSoilLevelDef | undefined {
    if (currentLevel >= MAX_SOIL_LEVEL) return undefined;
    return AZIT_SOIL_LEVELS.find((s) => s.level === currentLevel + 1);
}

export function calculateHarvestYieldWithSoil(
    baseYield: number,
    soilLevel: number,
    rollPct?: number
): SoilHarvestYieldResult {
    const safeBase = Math.max(0, Math.floor(baseYield));
    const clampedSoil = Math.max(0, Math.min(MAX_SOIL_LEVEL, Math.floor(soilLevel)));
    const soilDef = getSoilLevelDef(clampedSoil);
    const guaranteedBonus = soilDef ? soilDef.guaranteedBonusYield : 0;
    const bonusChancePct = soilDef ? soilDef.bonusChancePct : 0;
    let chanceBonus = 0;
    if (bonusChancePct > 0) {
        const roll = typeof rollPct === 'number' ? rollPct : crypto.randomInt(1, 101);
        if (roll <= bonusChancePct) {
            chanceBonus = 1;
        }
    }
    const totalBonus = guaranteedBonus + chanceBonus;
    return {
        baseYield: safeBase,
        guaranteedBonus,
        chanceBonus,
        totalBonus,
        totalYield: safeBase + totalBonus,
    };
}

export function getCropDef(cropId: string): AzitCropDef | undefined {
    return AZIT_CROPS.find((c) => c.cropId === cropId);
}

export function getMaterialDef(materialId: string): AzitMaterialDef | undefined {
    return AZIT_MATERIALS.find((m) => m.materialId === materialId);
}

export function getRecipeDef(recipeId: string): AzitRecipeDef | undefined {
    return AZIT_RECIPES.find((r) => r.recipeId === recipeId);
}

export function getChefDef(chefCode: string): AzitChefDef | undefined {
    return AZIT_CHEFS.find((c) => c.chefCode === chefCode);
}

export function getMercDef(mercCode: string): AzitMercenaryDef | undefined {
    return AZIT_MERCENARIES.find((m) => m.mercCode === mercCode);
}

export function getZoneDef(zoneId: string): AzitExpeditionZoneDef | undefined {
    return AZIT_EXPEDITION_ZONES.find((z) => z.zoneId === zoneId);
}

export function getFarmerDef(farmerCode: string): AzitFarmerDef | undefined {
    return AZIT_FARMERS.find((f) => f.farmerCode === farmerCode);
}

export function getFarmerLevelStats(level: number): AzitFarmerLevelStats {
    const safeRaw = Number.isFinite(level) ? Math.floor(level) : 1;
    const lv = Math.max(1, Math.min(MAX_FARMER_LEVEL, safeRaw));

    if (lv <= 4) {
        return {
            level: lv,
            grade: 1,
            gradeName: '견습 농부',
            roles: ['water'],
            workIntervalMs: Math.round(120 - ((lv - 1) * 30) / 3) * 1000,
            waterCooldownReductionPct: Math.round(2 + ((lv - 1) * 4) / 3),
        };
    }
    if (lv <= 9) {
        return {
            level: lv,
            grade: 2,
            gradeName: '숙련 농부',
            roles: ['water', 'harvest'],
            workIntervalMs: Math.round(75 - ((lv - 5) * 25) / 4) * 1000,
            waterCooldownReductionPct: Math.round(8 + ((lv - 5) * 6) / 4),
        };
    }
    if (lv <= 14) {
        return {
            level: lv,
            grade: 3,
            gradeName: '전문 농부',
            roles: ['water', 'harvest', 'plant'],
            workIntervalMs: Math.round(40 - ((lv - 10) * 15) / 4) * 1000,
            waterCooldownReductionPct: Math.round(15 + ((lv - 10) * 7) / 4),
        };
    }
    return {
        level: lv,
        grade: 4,
        gradeName: '마스터 농부',
        roles: ['water', 'harvest', 'plant', 'fertilize'],
        workIntervalMs: Math.round(20 - ((lv - 15) * 10) / 5) * 1000,
        waterCooldownReductionPct: Math.round(24 + ((lv - 15) * 6) / 5),
    };
}

export function getFarmerNextLevelXp(currentLevel: number): number {
    const safeRaw = Number.isFinite(currentLevel) ? Math.floor(currentLevel) : 1;
    return Math.max(1, Math.min(MAX_FARMER_LEVEL, safeRaw)) * 25;
}

export function getFarmerUpgradeCost(currentLevel: number): number {
    const safeRaw = Number.isFinite(currentLevel) ? Math.floor(currentLevel) : 1;
    return 80 * Math.max(1, Math.min(MAX_FARMER_LEVEL, safeRaw));
}

export function getAzitLevelInfo(xp: number): AzitLevelStep & {
    nextLevelXp: number | null;
    progressPct: number;
} {
    const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
    let current = AZIT_LEVEL_TABLE[0];
    for (const step of AZIT_LEVEL_TABLE) {
        if (safeXp >= step.requiredXp) {
            current = step;
        }
    }
    const nextStep = AZIT_LEVEL_TABLE.find((s) => s.level === current.level + 1);
    if (!nextStep) {
        return {
            ...current,
            nextLevelXp: null,
            progressPct: 100,
        };
    }
    const span = Math.max(1, nextStep.requiredXp - current.requiredXp);
    const gained = Math.max(0, safeXp - current.requiredXp);
    const progressPct = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));
    return {
        ...current,
        nextLevelXp: nextStep.requiredXp,
        progressPct,
    };
}

export function getChefUpgradeCost(currentLevel: number): number {
    return 50 * Math.max(1, currentLevel);
}

export function getChefEffectiveStats(
    chefCode: AzitChefCode | null | undefined,
    level: number
): { speedBonusPct: number; greatChancePct: number } {
    if (!chefCode) {
        return { speedBonusPct: 0, greatChancePct: 0 };
    }
    const def = getChefDef(chefCode);
    if (!def) {
        return { speedBonusPct: 0, greatChancePct: 0 };
    }
    const bonusLv = Math.max(0, level - 1);
    return {
        speedBonusPct: Math.min(MAX_CHEF_SPEED_BONUS_PCT, def.baseSpeedBonusPct + bonusLv * 1),
        greatChancePct: Math.min(70, def.baseGreatChancePct + bonusLv * 2),
    };
}

export function getEffectiveCookDurationSec(baseDurationSec: number, speedBonusPct: number): number {
    const clampedSpeed = Math.max(0, Math.min(MAX_CHEF_SPEED_BONUS_PCT, speedBonusPct));
    return Math.max(MIN_COOK_DURATION_SEC, Math.round(baseDurationSec * (1 - clampedSpeed / 100)));
}

export function getDishSellPrice(recipe: AzitRecipeDef, quality: AzitDishQuality = 'normal'): number {
    return quality === 'special'
        ? Math.round(recipe.sellPrice * SPECIAL_DISH_SELL_MULTIPLIER)
        : recipe.sellPrice;
}

export function getDishMaxWinRateCap(tier: 1 | 2 | 3 | 4, quality: AzitDishQuality = 'normal'): number {
    const baseCap = DISH_TIER_MAX_WIN_RATE[tier] ?? 95;
    return Math.min(99, baseCap + (quality === 'special' ? 1 : 0));
}

export function getDishEffectiveBuffs(
    recipe: AzitRecipeDef,
    quality: AzitDishQuality = 'normal'
): AzitDishEffectiveBuffs {
    const maxWinRateCap = getDishMaxWinRateCap(recipe.tier, quality);
    if (quality !== 'special') {
        return {
            powerBonusPct: recipe.powerBonusPct,
            winRateBonusPct: recipe.winRateBonusPct,
            rewardBonusPct: recipe.rewardBonusPct,
            mercXpBonusPct: recipe.mercXpBonusPct,
            expeditionSpeedBonusPct: recipe.expeditionSpeedBonusPct,
            maxWinRateCap,
        };
    }
    return {
        powerBonusPct: Math.round(recipe.powerBonusPct * SPECIAL_DISH_BUFF_MULTIPLIER),
        winRateBonusPct: Math.round(recipe.winRateBonusPct * SPECIAL_DISH_BUFF_MULTIPLIER),
        rewardBonusPct:
            recipe.rewardBonusPct > 0
                ? Math.round(recipe.rewardBonusPct * SPECIAL_DISH_BUFF_MULTIPLIER)
                : 2,
        mercXpBonusPct: Math.round(recipe.mercXpBonusPct * SPECIAL_DISH_BUFF_MULTIPLIER),
        expeditionSpeedBonusPct: Math.min(
            30,
            recipe.expeditionSpeedBonusPct > 0
                ? Math.round(recipe.expeditionSpeedBonusPct * SPECIAL_DISH_BUFF_MULTIPLIER)
                : 2
        ),
        maxWinRateCap,
    };
}

export function getMercUpgradeCost(currentLevel: number): number {
    return 40 * Math.max(1, currentLevel);
}

export function getMercNextXp(currentLevel: number): number {
    return Math.max(1, currentLevel) * 60;
}

export function getMercenaryEffectivePower(mercCode: string, level: number): number {
    const def = getMercDef(mercCode);
    if (!def) return 0;
    const bonusLv = Math.max(0, level - 1);
    return Math.round(def.basePower * (1 + bonusLv * 0.18));
}

export function calculateExpeditionWinRate(params: {
    mercenaries: Array<{ mercCode: string; level: number }>;
    recipeId: AzitRecipeId;
    zoneId: AzitZoneId;
    dishQuality?: AzitDishQuality;
}): {
    rawPower: number;
    effectivePower: number;
    winRatePct: number;
    maxWinRateCap: number;
    buffs: AzitDishEffectiveBuffs;
} {
    const recipe = getRecipeDef(params.recipeId);
    const zone = getZoneDef(params.zoneId);
    const dishQuality: AzitDishQuality = params.dishQuality === 'special' ? 'special' : 'normal';
    const emptyBuffs: AzitDishEffectiveBuffs = {
        powerBonusPct: 0,
        winRateBonusPct: 0,
        rewardBonusPct: 0,
        mercXpBonusPct: 0,
        expeditionSpeedBonusPct: 0,
        maxWinRateCap: 92,
    };
    if (!recipe || !zone || params.mercenaries.length === 0) {
        return {
            rawPower: 0,
            effectivePower: 0,
            winRatePct: 25,
            maxWinRateCap: recipe ? getDishMaxWinRateCap(recipe.tier, dishQuality) : 92,
            buffs: recipe ? getDishEffectiveBuffs(recipe, dishQuality) : emptyBuffs,
        };
    }

    const buffs = getDishEffectiveBuffs(recipe, dishQuality);
    let rawPower = 0;
    let partyWinBonus = 0;
    for (const m of params.mercenaries) {
        rawPower += getMercenaryEffectivePower(m.mercCode, m.level);
        const def = getMercDef(m.mercCode);
        if (def) {
            partyWinBonus += def.partyWinBonusPct;
        }
    }

    const effectivePower = Math.round(rawPower * (1 + buffs.powerBonusPct / 100));
    const ratioScore = Math.round((effectivePower / Math.max(1, zone.recommendedPower)) * 72);
    const clampedBase = Math.max(25, Math.min(buffs.maxWinRateCap, ratioScore));
    const totalRate = Math.max(
        25,
        Math.min(buffs.maxWinRateCap, clampedBase + buffs.winRateBonusPct + partyWinBonus)
    );

    return {
        rawPower,
        effectivePower,
        winRatePct: totalRate,
        maxWinRateCap: buffs.maxWinRateCap,
        buffs,
    };
}

export function generateBattleLog(params: {
    won: boolean;
    zone: AzitExpeditionZoneDef;
    mercenaryNames: string[];
    dishName: string;
    dishEmoji: string;
    dishQuality?: AzitDishQuality;
    buffs?: AzitDishEffectiveBuffs;
    rewardPoints: number;
    materialName: string;
    materialEmoji: string;
    dropQty: number;
}): string[] {
    const partyLabel = params.mercenaryNames.join(', ');
    const leadMerc = params.mercenaryNames[0] || '용병대';
    const dishLabel = params.dishQuality === 'special' ? `★특제 ${params.dishName}` : params.dishName;
    const buffParts: string[] = [];
    if (params.buffs) {
        if (params.buffs.powerBonusPct > 0) buffParts.push(`전투력 +${params.buffs.powerBonusPct}%`);
        if (params.buffs.rewardBonusPct > 0) buffParts.push(`전리품 +${params.buffs.rewardBonusPct}%`);
        if (params.buffs.mercXpBonusPct > 0) buffParts.push(`용병EXP +${params.buffs.mercXpBonusPct}%`);
        if (params.buffs.expeditionSpeedBonusPct > 0) {
            buffParts.push(`시간 -${params.buffs.expeditionSpeedBonusPct}%`);
        }
    }
    const buffNote = buffParts.length > 0 ? ` (${buffParts.join(' · ')})` : '';
    if (params.won) {
        return [
            `${params.dishEmoji} 출정 전 [${dishLabel}] 도시락으로 파티 사기가 크게 상승했습니다!${buffNote}`,
            `⚔️ [${partyLabel}] 용병단이 ${params.zone.name}에 돌입해 ${params.zone.monsterName}의 약점을 포착했습니다.`,
            `💥 ${leadMerc}의 결정적인 일격으로 ${params.zone.monsterName} 토벌에 성공했습니다!`,
            `🏆 전리품으로 🪙 ${params.rewardPoints.toLocaleString()}P 및 ${params.materialEmoji} ${params.materialName} ×${params.dropQty}을 회수해 아지트로 귀환했습니다.`,
        ];
    }
    return [
        `${params.dishEmoji} [${dishLabel}] 도시락을 나누어 먹고 ${params.zone.name}에 진입했습니다.`,
        `⚔️ [${partyLabel}] 용병단이 ${params.zone.monsterName}와 격렬한 교전을 벌였습니다.`,
        `⚠️ ${params.zone.monsterName}의 맹공에 부대가 밀리며 전열이 무너져 전략적 후퇴를 감행했습니다.`,
        `💔 토벌에 실패해 출정비와 보급 도시락이 소실되었습니다. 용병 강화 또는 상위 도시락 준비 후 재도전하세요!`,
    ];
}

// =============================================================================
// F2: Mercenary Combat Stats & Combat-Only XP Helpers
// =============================================================================

export interface MercenaryComputedCombatStats {
    mercCode: AzitMercCode;
    level: number;
    mainSkillLevel: number;
    subSkillLevel: number;
    combatRole: AzitMercBaseCombatStats['combatRole'];
    hp: number;
    atk: number;
    def: number;
    moveSpeed: number;
    attackIntervalMs: number;
    range: number;
    critPct: number;
    mainSkillPowerPct: number;
    subSkillPowerPct: number;
}

export function getMercenaryCombatStats(
    mercCode: AzitMercCode,
    level: number,
    mainSkillLevel = 1,
    subSkillLevel = 1
): MercenaryComputedCombatStats {
    const def = getMercDef(mercCode) ?? AZIT_MERCENARIES[0];
    const rawLv = Number.isFinite(level) ? Math.floor(level) : 1;
    const rawMainLv = Number.isFinite(mainSkillLevel) ? Math.floor(mainSkillLevel) : 1;
    const rawSubLv = Number.isFinite(subSkillLevel) ? Math.floor(subSkillLevel) : 1;
    const safeLv = Math.max(1, Math.min(def.maxLevel, rawLv));
    const safeMainLv = Math.max(1, Math.min(MAX_SKILL_LEVEL, rawMainLv));
    const safeSubLv = Math.max(1, Math.min(MAX_SKILL_LEVEL, rawSubLv));

    const lvFactor = 1 + (safeLv - 1) * 0.25;
    const defFactor = 1 + (safeLv - 1) * 0.22;
    const intervalReduction = Math.min(180, (safeLv - 1) * 10);

    return {
        mercCode: def.mercCode,
        level: safeLv,
        mainSkillLevel: safeMainLv,
        subSkillLevel: safeSubLv,
        combatRole: def.combatRole,
        hp: Math.round(def.baseStats.hp * lvFactor),
        atk: Math.round(def.baseStats.atk * lvFactor),
        def: Math.round(def.baseStats.def * defFactor),
        moveSpeed: def.baseStats.moveSpeed + Math.min(20, (safeLv - 1) * 1),
        attackIntervalMs: Math.max(580, def.baseStats.attackIntervalMs - intervalReduction),
        range: def.baseStats.range,
        critPct: def.baseStats.critPct + Math.min(10, Math.floor((safeLv - 1) / 2)),
        mainSkillPowerPct: def.mainSkill.powerPct + (safeMainLv - 1) * def.mainSkill.perLevelPct,
        subSkillPowerPct: def.subSkill.powerPct + (safeSubLv - 1) * def.subSkill.perLevelPct,
    };
}

export function applyMercenaryCombatXp(
    currentLevel: number,
    currentXp: number,
    gainedXp: number,
    maxLevel = 15
): { level: number; xp: number; levelsGained: number; nextXp: number } {
    const safeMax = Number.isFinite(maxLevel) ? Math.max(1, Math.floor(maxLevel)) : 15;
    const rawLv = Number.isFinite(currentLevel) ? Math.floor(currentLevel) : 1;
    const rawCurXp = Number.isFinite(currentXp) ? Math.floor(currentXp) : 0;
    const rawGainXp = Number.isFinite(gainedXp) ? Math.floor(gainedXp) : 0;
    let lv = Math.max(1, Math.min(safeMax, rawLv));
    let xp = Math.max(0, rawCurXp) + Math.max(0, rawGainXp);
    let levelsGained = 0;

    while (lv < safeMax) {
        const needed = getMercNextXp(lv);
        if (xp < needed) break;
        xp -= needed;
        lv += 1;
        levelsGained += 1;
    }

    if (lv >= safeMax) {
        lv = safeMax;
        xp = 0;
    }

    return {
        level: lv,
        xp,
        levelsGained,
        nextXp: getMercNextXp(lv),
    };
}

export function buildMercCombatUnit(params: {
    mercCode: AzitMercCode;
    level: number;
    mainSkillLevel?: number;
    subSkillLevel?: number;
    unitId?: string;
}): CombatUnitInput {
    const def = getMercDef(params.mercCode) ?? AZIT_MERCENARIES[0];
    const stats = getMercenaryCombatStats(
        def.mercCode,
        params.level,
        params.mainSkillLevel ?? 1,
        params.subSkillLevel ?? 1
    );
    return {
        unitId: params.unitId ?? `ally-${def.mercCode}`,
        side: 'ally',
        code: def.mercCode,
        name: def.name,
        emoji: def.emoji,
        combatRole: stats.combatRole,
        level: stats.level,
        maxHp: stats.hp,
        atk: stats.atk,
        def: stats.def,
        moveSpeed: stats.moveSpeed,
        attackIntervalMs: stats.attackIntervalMs,
        range: stats.range,
        critPct: stats.critPct,
        mainSkill: def.mainSkill,
        subSkill: def.subSkill,
        mainSkillLevel: stats.mainSkillLevel,
        subSkillLevel: stats.subSkillLevel,
    };
}

export function buildZoneEnemyUnits(zone: AzitExpeditionZoneDef): CombatUnitInput[] {
    return zone.monsters.map((m, idx) => ({
        unitId: `enemy-${zone.zoneId}-${idx}-${m.monsterId}`,
        side: 'enemy',
        code: m.monsterId,
        name: m.name,
        emoji: m.emoji,
        combatRole: m.combatRole,
        level: zone.requiredAzitLevel,
        maxHp: m.maxHp,
        atk: m.atk,
        def: m.def,
        moveSpeed: m.moveSpeed,
        attackIntervalMs: m.attackIntervalMs,
        range: m.range,
        isBoss: m.isBoss,
        mainSkill: m.mainSkill,
        subSkill: m.subSkill,
        mainSkillLevel: 1,
        subSkillLevel: 1,
    }));
}

// =============================================================================
// F4: Item & Craft Recipe Lookup Helpers
// =============================================================================

export function getItemDef(itemId: string): AzitItemDef | undefined {
    return AZIT_ITEMS.find((item) => item.itemId === itemId);
}

export function getCraftRecipeDef(recipeId: string): AzitCraftRecipeDef | undefined {
    return AZIT_CRAFT_RECIPES.find((recipe) => recipe.recipeId === recipeId);
}

// =============================================================================
// F5: Vera's Tower 1–200F Catalog & Deterministic Floor Generator
// =============================================================================

export const AZIT_TOWER_THEMES: AzitTowerThemeDef[] = [
    {
        themeId: 'tower-1-forgotten',
        name: '잊혀진 탑 하층',
        floorStart: 1,
        floorEnd: 40,
        themeColor: '#64748b',
        primaryMaterialId: 'mat-slime-jelly',
        description: '슬라임과 고블린, 해골 파수병이 지키는 베라의 탑 입문 구역(1~40층)입니다.',
    },
    {
        themeId: 'tower-2-spirit',
        name: '정령의 회랑',
        floorStart: 41,
        floorEnd: 80,
        themeColor: '#10b981',
        primaryMaterialId: 'mat-forest-honey',
        description: '고대 정령과 고목 수호자가 배회하는 신비로운 숲 회랑(41~80층)입니다.',
    },
    {
        themeId: 'tower-3-obsidian',
        name: '흑요석 성채',
        floorStart: 81,
        floorEnd: 120,
        themeColor: '#6366f1',
        primaryMaterialId: 'mat-goblin-spice',
        description: '단단한 룬 골렘과 흑요석 암흑기사가 버티고 있는 중층 성채(81~120층)입니다.',
    },
    {
        themeId: 'tower-4-wyvern',
        name: '비룡의 첨탑',
        floorStart: 121,
        floorEnd: 160,
        themeColor: '#f97316',
        primaryMaterialId: 'mat-wyvern-jerky',
        description: '화염 마도사와 홍련의 와이번이 날아오르는 고층 첨탑(121~160층)입니다.',
    },
    {
        themeId: 'tower-5-abyss',
        name: '베라의 성소 심연',
        floorStart: 161,
        floorEnd: 200,
        themeColor: '#dc2626',
        primaryMaterialId: 'mat-dragon-powder',
        description: '고대 흑룡과 심연의 수호신 베라가 기다리는 최상층 결전 구역(161~200층)입니다.',
    },
];

interface TowerArchetypeTemplate {
    monsterId: string;
    name: string;
    emoji: string;
    role: AzitMonsterDef['role'];
    combatRole: CombatRole;
    range: number;
    moveSpeed: number;
    attackIntervalMs: number;
    mainSkill: CombatSkillSpec;
    subSkill: CombatSkillSpec;
}

const TOWER_ARCHETYPES: Record<AzitTowerThemeId, {
    guard: TowerArchetypeTemplate;
    ranged: TowerArchetypeTemplate;
    miniBoss: TowerArchetypeTemplate;
    majorBoss: TowerArchetypeTemplate;
    crops: AzitCropId[];
}> = {
    'tower-1-forgotten': {
        crops: ['crop-carrot', 'crop-pepper', 'crop-tomato'],
        guard: {
            monsterId: 'mon-slime',
            name: '탑 슬라임',
            emoji: '🟢',
            role: '탱커',
            combatRole: 'enemy-melee',
            range: 58,
            moveSpeed: 90,
            attackIntervalMs: 1250,
            mainSkill: createMonsterSkill('t1-slime-slam', '점액 압박', '🫧', 'main', 'damage', 'enemy_single', 7800, 130, 72, 0, '묵직한 점액으로 타격합니다.'),
            subSkill: createMonsterSkill('t1-slime-guard', '점액 방벽', '🟢', 'sub', 'shield', 'self', 6400, 100, 70, 0, '점액 보호막을 전개합니다.', { kind: 'shield', durationMs: 2800, value: 14 }),
        },
        ranged: {
            monsterId: 'mon-goblin',
            name: '탑 고블린 척후',
            emoji: '👺',
            role: '레인저',
            combatRole: 'enemy-ranged',
            range: 205,
            moveSpeed: 102,
            attackIntervalMs: 1180,
            mainSkill: createMonsterSkill('t1-gob-shot', '갈고리 화살', '🏹', 'main', 'damage', 'enemy_single', 7400, 140, 215, 0, '날카로운 화살을 발사합니다.'),
            subSkill: createMonsterSkill('t1-gob-aim', '약점 사격', '🎯', 'sub', 'damage', 'enemy_single', 5400, 120, 215, 0, '방어력을 낮추는 사격을 합니다.', { kind: 'defDown', durationMs: 2500, value: 10 }),
        },
        miniBoss: {
            monsterId: 'mon-goblin-chief',
            name: '고블린 문지기 대장',
            emoji: '🪓',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 72,
            moveSpeed: 104,
            attackIntervalMs: 1080,
            mainSkill: createMonsterSkill('t1-mb-cleave', '철퇴 난무', '🪓', 'main', 'aoe_damage', 'enemy_aoe', 7200, 160, 105, 95, '주변 적을 강하게 후려칩니다.'),
            subSkill: createMonsterSkill('t1-mb-roar', '수문장의 포효', '📣', 'sub', 'buff', 'self', 5800, 100, 80, 0, '공격력을 높입니다.', { kind: 'atkUp', durationMs: 3000, value: 18 }),
        },
        majorBoss: {
            monsterId: 'mon-skeleton',
            name: '해골 백부장 레기온',
            emoji: '💀',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 84,
            moveSpeed: 106,
            attackIntervalMs: 1040,
            mainSkill: createMonsterSkill('t1-boss-doom', '망자의 참격', '💀', 'main', 'aoe_damage', 'enemy_aoe', 7200, 175, 115, 110, '어둠의 검기를 방출해 방어력을 깎습니다.', { kind: 'defDown', durationMs: 3000, value: 16 }),
            subSkill: createMonsterSkill('t1-boss-bone', '뼈 갑주', '🛡️', 'sub', 'shield', 'self', 5600, 100, 80, 0, '뼈의 보호막을 생성합니다.', { kind: 'shield', durationMs: 3200, value: 20 }),
        },
    },
    'tower-2-spirit': {
        crops: ['crop-lettuce', 'crop-potato', 'crop-strawberry'],
        guard: {
            monsterId: 'mon-treant',
            name: '고목 파수꾼',
            emoji: '🌳',
            role: '탱커',
            combatRole: 'enemy-melee',
            range: 66,
            moveSpeed: 88,
            attackIntervalMs: 1180,
            mainSkill: createMonsterSkill('t2-treant-bash', '나무뿌리 강타', '🌳', 'main', 'damage', 'enemy_single', 7400, 150, 82, 0, '단단한 뿌리로 가격합니다.', { kind: 'stun', durationMs: 800, value: 1 }),
            subSkill: createMonsterSkill('t2-treant-bark', '수피 장갑', '🛡️', 'sub', 'buff', 'self', 5800, 100, 75, 0, '방어력을 증가시킵니다.', { kind: 'defUp', durationMs: 3000, value: 20 }),
        },
        ranged: {
            monsterId: 'mon-spirit',
            name: '회랑 정령',
            emoji: '🧚',
            role: '레인저',
            combatRole: 'enemy-ranged',
            range: 220,
            moveSpeed: 112,
            attackIntervalMs: 1050,
            mainSkill: createMonsterSkill('t2-spirit-wave', '정령 파동', '✨', 'main', 'aoe_damage', 'enemy_aoe', 7200, 155, 225, 100, '빛나는 정령 구체를 터뜨립니다.'),
            subSkill: createMonsterSkill('t2-spirit-bolt', '마력 침식', '💫', 'sub', 'damage', 'enemy_single', 4800, 130, 220, 0, '마력탄을 발사합니다.', { kind: 'defDown', durationMs: 2800, value: 14 }),
        },
        miniBoss: {
            monsterId: 'mon-forest-queen',
            name: '회랑 정령 대장',
            emoji: '🌺',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 200,
            moveSpeed: 108,
            attackIntervalMs: 1020,
            mainSkill: createMonsterSkill('t2-mb-storm', '만개한 영혼 폭풍', '🌺', 'main', 'aoe_damage', 'enemy_aoe', 7200, 175, 220, 120, '꽃잎의 폭풍을 일으킵니다.'),
            subSkill: createMonsterSkill('t2-mb-heal', '생명의 이슬', '💧', 'sub', 'heal_all', 'ally_all', 6200, 105, 240, 0, '아군 몬스터를 치유합니다.'),
        },
        majorBoss: {
            monsterId: 'mon-forest-queen',
            name: '정령왕 실피드',
            emoji: '🌿',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 210,
            moveSpeed: 112,
            attackIntervalMs: 980,
            mainSkill: createMonsterSkill('t2-boss-gale', '대자연의 심판', '🌪️', 'main', 'aoe_damage', 'enemy_aoe', 7000, 190, 230, 130, '거센 정령 폭풍으로 진영을 휩씁니다.', { kind: 'defDown', durationMs: 3200, value: 18 }),
            subSkill: createMonsterSkill('t2-boss-bless', '정령의 가호', '✨', 'sub', 'heal_all', 'ally_all', 5800, 115, 240, 0, '아군을 치유하고 공격력을 높입니다.', { kind: 'atkUp', durationMs: 3000, value: 16 }),
        },
    },
    'tower-3-obsidian': {
        crops: ['crop-strawberry', 'crop-blueberry'],
        guard: {
            monsterId: 'mon-golem',
            name: '흑요석 골렘',
            emoji: '🗿',
            role: '탱커',
            combatRole: 'enemy-melee',
            range: 70,
            moveSpeed: 84,
            attackIntervalMs: 1160,
            mainSkill: createMonsterSkill('t3-golem-crush', '암석 강타', '🗿', 'main', 'damage', 'enemy_single', 7400, 160, 86, 0, '거대한 돌주먹으로 내려칩니다.', { kind: 'stun', durationMs: 900, value: 1 }),
            subSkill: createMonsterSkill('t3-golem-shield', '흑요석 경화', '🛡️', 'sub', 'shield', 'self', 5800, 100, 75, 0, '보호막을 두릅니다.', { kind: 'shield', durationMs: 3200, value: 20 }),
        },
        ranged: {
            monsterId: 'mon-dark-knight',
            name: '성채 암흑기사',
            emoji: '🛡️',
            role: '딜러',
            combatRole: 'enemy-melee',
            range: 74,
            moveSpeed: 108,
            attackIntervalMs: 1020,
            mainSkill: createMonsterSkill('t3-dk-cleave', '어둠의 참격', '⚔️', 'main', 'damage', 'enemy_single', 7000, 165, 90, 0, '방어력을 깎는 참격을 가합니다.', { kind: 'defDown', durationMs: 3000, value: 16 }),
            subSkill: createMonsterSkill('t3-dk-aura', '전투 결의', '💢', 'sub', 'buff', 'self', 5400, 100, 80, 0, '공격력을 강화합니다.', { kind: 'atkUp', durationMs: 3000, value: 18 }),
        },
        miniBoss: {
            monsterId: 'mon-golem',
            name: '룬 카르나 골렘',
            emoji: '💎',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 92,
            moveSpeed: 88,
            attackIntervalMs: 1100,
            mainSkill: createMonsterSkill('t3-mb-quake', '지각 변동', '💥', 'main', 'aoe_damage', 'enemy_aoe', 7400, 185, 120, 120, '전장을 흔드는 충격파를 날립니다.', { kind: 'stun', durationMs: 1000, value: 1 }),
            subSkill: createMonsterSkill('t3-mb-fortify', '고대 룬 장벽', '🔮', 'sub', 'shield', 'self', 5800, 100, 80, 0, '단단한 룬 보호막을 생성합니다.', { kind: 'shield', durationMs: 3400, value: 22 }),
        },
        majorBoss: {
            monsterId: 'mon-dark-knight',
            name: '흑요석 군단장 바르크',
            emoji: '⚔️',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 95,
            moveSpeed: 112,
            attackIntervalMs: 980,
            mainSkill: createMonsterSkill('t3-boss-eclipse', '이클립스 브레이커', '🌑', 'main', 'aoe_damage', 'enemy_aoe', 7200, 200, 125, 130, '암흑 검풍을 일으켜 방어력을 무너뜨립니다.', { kind: 'defDown', durationMs: 3500, value: 20 }),
            subSkill: createMonsterSkill('t3-boss-wrath', '군단장의 진노', '💢', 'sub', 'buff', 'self', 5400, 100, 80, 0, '공격력을 크게 높입니다.', { kind: 'atkUp', durationMs: 3500, value: 22 }),
        },
    },
    'tower-4-wyvern': {
        crops: ['crop-pumpkin', 'crop-melon'],
        guard: {
            monsterId: 'mon-wyvern',
            name: '비룡 파수병',
            emoji: '🦅',
            role: '딜러',
            combatRole: 'enemy-melee',
            range: 90,
            moveSpeed: 116,
            attackIntervalMs: 1020,
            mainSkill: createMonsterSkill('t4-wyv-dive', '급강하 타격', '🦅', 'main', 'damage', 'enemy_single', 7200, 170, 110, 0, '창공에서 급강하하여 들이받습니다.'),
            subSkill: createMonsterSkill('t4-wyv-gust', '열풍 날개', '🌪️', 'sub', 'aoe_damage', 'enemy_aoe', 5400, 135, 110, 95, '열풍으로 방어력을 떨어뜨립니다.', { kind: 'defDown', durationMs: 2800, value: 16 }),
        },
        ranged: {
            monsterId: 'mon-flame-mage',
            name: '첨탑 화염술사',
            emoji: '🔥',
            role: '딜러',
            combatRole: 'enemy-ranged',
            range: 225,
            moveSpeed: 104,
            attackIntervalMs: 1000,
            mainSkill: createMonsterSkill('t4-fm-blast', '화염 폭발', '🔥', 'main', 'aoe_damage', 'enemy_aoe', 7200, 170, 230, 110, '불꽃 폭발로 화상을 입힙니다.', { kind: 'burn', durationMs: 3000, value: 32 }),
            subSkill: createMonsterSkill('t4-fm-bolt', '불꽃 화살', '💥', 'sub', 'damage', 'enemy_single', 4600, 145, 225, 0, '집중 화염탄을 발사합니다.'),
        },
        miniBoss: {
            monsterId: 'mon-wyvern',
            name: '홍련 와이번 친위대장',
            emoji: '🔥',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 112,
            moveSpeed: 118,
            attackIntervalMs: 980,
            mainSkill: createMonsterSkill('t4-mb-breath', '화염 폭풍 브레스', '🔥', 'main', 'aoe_damage', 'enemy_aoe', 7000, 195, 180, 125, '뜨거운 불꽃 숨결을 내뿜습니다.', { kind: 'burn', durationMs: 3000, value: 38 }),
            subSkill: createMonsterSkill('t4-mb-roar', '비룡의 포효', '🦅', 'sub', 'buff', 'self', 5500, 100, 80, 0, '공격력을 끌어올립니다.', { kind: 'atkUp', durationMs: 3200, value: 22 }),
        },
        majorBoss: {
            monsterId: 'mon-wyvern',
            name: '화염 비룡왕 이그니스',
            emoji: '🐉',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 120,
            moveSpeed: 120,
            attackIntervalMs: 950,
            mainSkill: createMonsterSkill('t4-boss-inferno', '인페르노 다이브', '☄️', 'main', 'aoe_damage', 'enemy_aoe', 7000, 210, 190, 135, '불타는 유성처럼 전장을 강타합니다.', { kind: 'burn', durationMs: 3500, value: 45 }),
            subSkill: createMonsterSkill('t4-boss-scale', '홍련 비늘 장막', '🛡️', 'sub', 'shield', 'self', 5400, 100, 80, 0, '용염 보호막을 전개합니다.', { kind: 'shield', durationMs: 3500, value: 24 }),
        },
    },
    'tower-5-abyss': {
        crops: ['crop-ginseng', 'crop-truffle', 'crop-moonfruit'],
        guard: {
            monsterId: 'mon-dark-knight',
            name: '심연 수호기사',
            emoji: '🛡️',
            role: '탱커',
            combatRole: 'enemy-melee',
            range: 76,
            moveSpeed: 110,
            attackIntervalMs: 980,
            mainSkill: createMonsterSkill('t5-dk-void', '공허 일격', '⚔️', 'main', 'damage', 'enemy_single', 7000, 180, 92, 0, '방어력을 관통하는 일격을 가합니다.', { kind: 'defDown', durationMs: 3200, value: 20 }),
            subSkill: createMonsterSkill('t5-dk-shield', '심연의 방벽', '🛡️', 'sub', 'shield', 'self', 5500, 100, 80, 0, '강력한 보호막을 생성합니다.', { kind: 'shield', durationMs: 3500, value: 22 }),
        },
        ranged: {
            monsterId: 'mon-flame-mage',
            name: '심연의 주술사',
            emoji: '🔥',
            role: '딜러',
            combatRole: 'enemy-ranged',
            range: 235,
            moveSpeed: 106,
            attackIntervalMs: 980,
            mainSkill: createMonsterSkill('t5-fm-meteor', '심연 유성우', '☄️', 'main', 'aoe_damage', 'enemy_aoe', 7200, 185, 240, 120, '타오르는 흑염 유성을 떨어뜨립니다.', { kind: 'burn', durationMs: 3000, value: 42 }),
            subSkill: createMonsterSkill('t5-fm-flare', '흑염탄', '🔥', 'sub', 'damage', 'enemy_single', 4600, 150, 235, 0, '암흑 화염탄을 발사합니다.'),
        },
        miniBoss: {
            monsterId: 'mon-dragon',
            name: '고대 심연의 비룡',
            emoji: '🐉',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 118,
            moveSpeed: 116,
            attackIntervalMs: 960,
            mainSkill: createMonsterSkill('t5-mb-flare', '흑염 브레스', '🐉', 'main', 'aoe_damage', 'enemy_aoe', 7000, 210, 200, 135, '검은 불꽃을 내뿜어 화상을 입힙니다.', { kind: 'burn', durationMs: 3200, value: 48 }),
            subSkill: createMonsterSkill('t5-mb-roar', '용의 포효', '💥', 'sub', 'aoe_damage', 'enemy_aoe', 5400, 160, 125, 115, '위압적인 포효로 기절시킵니다.', { kind: 'stun', durationMs: 900, value: 1 }),
        },
        majorBoss: {
            monsterId: 'mon-abyss-vera',
            name: '심연의 수호신 베라',
            emoji: '👁️',
            role: '보스',
            combatRole: 'enemy-boss',
            range: 125,
            moveSpeed: 120,
            attackIntervalMs: 940,
            mainSkill: createMonsterSkill('t5-boss-vera', '성소 멸망의 빛', '👁️', 'main', 'aoe_damage', 'enemy_aoe', 7200, 225, 215, 145, '베라 성소의 절대 마력을 방출해 전장을 뒤흔듭니다.', { kind: 'burn', durationMs: 3500, value: 52 }),
            subSkill: createMonsterSkill('t5-boss-aegis', '절대자의 권능', '👑', 'sub', 'buff', 'self', 5600, 100, 80, 0, '공격력을 대폭 상승시킵니다.', { kind: 'atkUp', durationMs: 3500, value: 24 }),
        },
    },
};

function getTowerThemeByFloor(floor: number): AzitTowerThemeDef {
    for (const theme of AZIT_TOWER_THEMES) {
        if (floor >= theme.floorStart && floor <= theme.floorEnd) {
            return theme;
        }
    }
    return AZIT_TOWER_THEMES[0];
}

function buildTowerMonsterFromTemplate(
    tpl: TowerArchetypeTemplate,
    suffix: string,
    maxHp: number,
    atk: number,
    def: number,
    isBoss: boolean
): AzitMonsterDef {
    return {
        monsterId: tpl.monsterId,
        name: `${tpl.name}${suffix}`,
        emoji: tpl.emoji,
        role: tpl.role,
        combatRole: tpl.combatRole,
        maxHp: Math.max(20, Math.round(maxHp)),
        atk: Math.max(5, Math.round(atk)),
        def: Math.max(1, Math.round(def)),
        moveSpeed: tpl.moveSpeed,
        attackIntervalMs: tpl.attackIntervalMs,
        range: tpl.range,
        isBoss,
        mainSkill: tpl.mainSkill,
        subSkill: tpl.subSkill,
    };
}

function generateTowerFloor(floor: number): AzitTowerFloorDef {
    const theme = getTowerThemeByFloor(floor);
    const arch = TOWER_ARCHETYPES[theme.themeId];
    const floorType: AzitTowerFloorType =
        floor % 10 === 0 ? 'major_boss' : floor % 5 === 0 ? 'mini_boss' : 'normal';
    const isBoss = floorType !== 'normal';

    const progress = (floor - 1) / (MAX_TOWER_FLOOR - 1); // 0.0 .. 1.0
    const baseHp = 95 + floor * 6.5 + Math.pow(floor, 1.38) * 0.45;
    const baseAtk = 11 + floor * 0.72 + Math.pow(floor, 1.24) * 0.08;
    const baseDef = 3 + floor * 0.34 + progress * 12;

    const powerBase = Math.round(60 + floor * 10 + Math.pow(floor, 1.48) * 0.62);
    const recommendedPower = Math.round(
        powerBase * (floorType === 'major_boss' ? 1.35 : floorType === 'mini_boss' ? 1.18 : 1)
    );

    const monsters: AzitMonsterDef[] = [];
    if (floorType === 'normal') {
        monsters.push(
            buildTowerMonsterFromTemplate(arch.guard, '', baseHp * 1.05, baseAtk * 0.95, baseDef * 1.08, false)
        );
        monsters.push(
            buildTowerMonsterFromTemplate(arch.ranged, '', baseHp * 0.85, baseAtk * 1.08, baseDef * 0.85, false)
        );
        if (floor >= 41) {
            monsters.push(
                buildTowerMonsterFromTemplate(
                    arch.guard,
                    ' B',
                    baseHp * 0.92,
                    baseAtk * 0.92,
                    baseDef,
                    false
                )
            );
        }
    } else if (floorType === 'mini_boss') {
        monsters.push(
            buildTowerMonsterFromTemplate(arch.guard, ' A', baseHp * 0.95, baseAtk * 0.92, baseDef, false)
        );
        monsters.push(
            buildTowerMonsterFromTemplate(arch.ranged, ' B', baseHp * 0.82, baseAtk * 1.02, baseDef * 0.88, false)
        );
        monsters.push(
            buildTowerMonsterFromTemplate(
                arch.miniBoss,
                ` (${floor}F)`,
                baseHp * 1.75,
                baseAtk * 1.22,
                baseDef * 1.15,
                true
            )
        );
    } else {
        monsters.push(
            buildTowerMonsterFromTemplate(arch.guard, ' 친위', baseHp * 1.05, baseAtk * 0.98, baseDef * 1.05, false)
        );
        monsters.push(
            buildTowerMonsterFromTemplate(arch.ranged, ' 호위', baseHp * 0.92, baseAtk * 1.08, baseDef * 0.92, false)
        );
        monsters.push(
            buildTowerMonsterFromTemplate(
                arch.majorBoss,
                floor === 200 ? ' (최종 보스)' : ` (${floor}F 보스)`,
                baseHp * 2.55,
                baseAtk * 1.32,
                baseDef * 1.25,
                true
            )
        );
    }

    const firstClearPoints = Math.round(
        (80 + floor * 12) * (floorType === 'major_boss' ? 3 : floorType === 'mini_boss' ? 2 : 1)
    );
    const firstClearMercXp = Math.round(
        (45 + floor * 6) * (floorType === 'major_boss' ? 2 : floorType === 'mini_boss' ? 1.5 : 1)
    );
    const firstClearAzitXp = 15 + Math.floor(floor / 2) + (floorType === 'major_boss' ? 30 : floorType === 'mini_boss' ? 12 : 0);

    const cropPick = arch.crops[(floor - 1) % arch.crops.length];
    const firstItems: Partial<Record<AzitItemId, number>> = {
        'item-skill-stone': floorType === 'major_boss' ? 2 : 1,
    };
    if (floorType === 'mini_boss') {
        firstItems['item-revival-herb'] = 1;
    } else if (floorType === 'major_boss') {
        firstItems['item-skill-tome'] = 1;
        if (floor % 20 === 0) {
            firstItems['item-phoenix-feather'] = 1;
        } else {
            firstItems['item-revival-herb'] = 2;
        }
    }

    const firstClearReward: AzitTowerRewardBundle = {
        veraPoints: firstClearPoints,
        mercXp: firstClearMercXp,
        azitXp: firstClearAzitXp,
        materials: {
            [theme.primaryMaterialId]:
                floorType === 'major_boss' ? 3 + Math.floor(floor / 40) : floorType === 'mini_boss' ? 2 : 1,
        },
        crops: {
            [cropPick]: floorType === 'major_boss' ? 3 : 1,
        },
        items: firstItems,
    };

    const repeatReward: AzitTowerRewardBundle = {
        veraPoints: Math.max(20, Math.round(firstClearPoints * 0.35)),
        mercXp: Math.max(15, Math.round(firstClearMercXp * 0.35)),
        azitXp: Math.max(5, Math.round(firstClearAzitXp * 0.35)),
        materials: {
            [theme.primaryMaterialId]: 1,
        },
        crops: {},
        items:
            floorType === 'major_boss'
                ? { 'item-skill-stone': 1 }
                : floorType === 'mini_boss'
                  ? { 'item-revival-herb': 1 }
                  : {},
    };

    const floorName =
        floorType === 'major_boss'
            ? `${floor}층 [대보스] ${arch.majorBoss.name}`
            : floorType === 'mini_boss'
              ? `${floor}층 [중간 보스] ${arch.miniBoss.name}`
              : `${floor}층 ${theme.name}`;

    return {
        floor,
        themeId: theme.themeId,
        themeName: theme.name,
        floorType,
        isBoss,
        name: floorName,
        recommendedPower,
        monsters,
        firstClearReward,
        repeatReward,
    };
}

export const AZIT_TOWER_FLOORS: AzitTowerFloorDef[] = Array.from(
    { length: MAX_TOWER_FLOOR },
    (_, idx) => generateTowerFloor(idx + 1)
);

export function getTowerFloorDef(floor: number): AzitTowerFloorDef | undefined {
    if (!Number.isInteger(floor) || floor < 1 || floor > MAX_TOWER_FLOOR) {
        return undefined;
    }
    return AZIT_TOWER_FLOORS[floor - 1];
}

export function getTowerFloorSummaries(from = 1, to = MAX_TOWER_FLOOR): AzitTowerFloorSummary[] {
    const start = Math.max(1, Math.min(MAX_TOWER_FLOOR, Math.floor(from)));
    const end = Math.max(start, Math.min(MAX_TOWER_FLOOR, Math.floor(to)));
    const summaries: AzitTowerFloorSummary[] = [];
    for (let f = start; f <= end; f += 1) {
        const def = AZIT_TOWER_FLOORS[f - 1];
        const leadMonster = def.monsters[def.monsters.length - 1];
        summaries.push({
            floor: def.floor,
            themeId: def.themeId,
            themeName: def.themeName,
            floorType: def.floorType,
            isBoss: def.isBoss,
            name: def.name,
            recommendedPower: def.recommendedPower,
            bossEmoji: leadMonster.emoji,
            bossName: leadMonster.name,
            firstClearPoints: def.firstClearReward.veraPoints,
            firstClearMercXp: def.firstClearReward.mercXp,
            repeatPoints: def.repeatReward.veraPoints,
        });
    }
    return summaries;
}

export function buildTowerEnemyUnits(floorDef: AzitTowerFloorDef): CombatUnitInput[] {
    return floorDef.monsters.map((m, idx) => ({
        unitId: `tower-${floorDef.floor}-enemy-${idx}-${m.monsterId}`,
        side: 'enemy',
        code: m.monsterId,
        name: m.name,
        emoji: m.emoji,
        combatRole: m.combatRole,
        level: Math.max(1, Math.ceil(floorDef.floor / 13)),
        maxHp: m.maxHp,
        atk: m.atk,
        def: m.def,
        moveSpeed: m.moveSpeed,
        attackIntervalMs: m.attackIntervalMs,
        range: m.range,
        isBoss: m.isBoss,
        mainSkill: m.mainSkill,
        subSkill: m.subSkill,
        mainSkillLevel: Math.max(1, Math.min(MAX_SKILL_LEVEL, Math.ceil(floorDef.floor / 20))),
        subSkillLevel: Math.max(1, Math.min(MAX_SKILL_LEVEL, Math.ceil(floorDef.floor / 20))),
    }));
}
