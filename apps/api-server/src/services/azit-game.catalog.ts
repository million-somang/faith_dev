import crypto from 'crypto';

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
    },
];

export const AZIT_EXPEDITION_ZONES: AzitExpeditionZoneDef[] = [
    {
        zoneId: 'zone-slime',
        name: '초원 슬라임 정찰',
        monsterName: '킹 초원 슬라임',
        emoji: '🟢',
        durationSec: 180,
        entryCost: 15,
        minDishTier: 1,
        recommendedPower: 50,
        rewardPoints: 55,
        rewardAzitXp: 25,
        rewardMercXp: 20,
        dropMaterialId: 'mat-slime-jelly',
        dropMinQty: 1,
        dropMaxQty: 2,
        isBoss: false,
        requiredAzitLevel: 1,
        description: '가벼운 3분 정찰 코스입니다. 티어 1 이상 도시락으로 가볍게 시작해 보세요.',
    },
    {
        zoneId: 'zone-goblin',
        name: '고블린 야영지 습격',
        monsterName: '고블린 약탈대장',
        emoji: '👺',
        durationSec: 600,
        entryCost: 35,
        minDishTier: 1,
        recommendedPower: 120,
        rewardPoints: 125,
        rewardAzitXp: 55,
        rewardMercXp: 45,
        dropMaterialId: 'mat-goblin-spice',
        dropMinQty: 1,
        dropMaxQty: 2,
        isBoss: false,
        requiredAzitLevel: 1,
        description: '고블린 향신료를 확보할 수 있는 10분 중급 전투 구역입니다.',
    },
    {
        zoneId: 'zone-forest',
        name: '안개 숲 정령 토벌',
        monsterName: '안개 숲의 여왕 정령',
        emoji: '🧚',
        durationSec: 1500,
        entryCost: 70,
        minDishTier: 2,
        recommendedPower: 240,
        rewardPoints: 250,
        rewardAzitXp: 110,
        rewardMercXp: 85,
        dropMaterialId: 'mat-forest-honey',
        dropMinQty: 1,
        dropMaxQty: 2,
        isBoss: false,
        requiredAzitLevel: 2,
        description: '티어 2 이상 도시락이 필수인 안개 숲의 비보 탐색 원정입니다.',
    },
    {
        zoneId: 'zone-golem',
        name: '고대 유적 골렘전',
        monsterName: '룬 스톤 가디언',
        emoji: '🗿',
        durationSec: 3600,
        entryCost: 130,
        minDishTier: 2,
        recommendedPower: 420,
        rewardPoints: 460,
        rewardAzitXp: 210,
        rewardMercXp: 160,
        dropMaterialId: 'mat-forest-honey',
        dropMinQty: 2,
        dropMaxQty: 3,
        isBoss: false,
        requiredAzitLevel: 3,
        description: '단단한 고대 골렘을 격파하고 풍성한 포인트와 희귀 재료를 회수합니다.',
    },
    {
        zoneId: 'zone-wyvern',
        name: '화산 협곡 와이번',
        monsterName: '홍련의 와이번 로드',
        emoji: '🦅',
        durationSec: 7200,
        entryCost: 240,
        minDishTier: 3,
        recommendedPower: 700,
        rewardPoints: 860,
        rewardAzitXp: 380,
        rewardMercXp: 280,
        dropMaterialId: 'mat-wyvern-jerky',
        dropMinQty: 1,
        dropMaxQty: 2,
        isBoss: true,
        requiredAzitLevel: 5,
        description: '티어 3 이상 고급 도시락을 지참해야 도전 가능한 첫 번째 보스 토벌전입니다.',
    },
    {
        zoneId: 'zone-dragon',
        name: '흑룡의 둥지 토벌',
        monsterName: '심연의 흑룡 바하무트',
        emoji: '🐉',
        durationSec: 14400,
        entryCost: 450,
        minDishTier: 3,
        recommendedPower: 1150,
        rewardPoints: 1680,
        rewardAzitXp: 720,
        rewardMercXp: 520,
        dropMaterialId: 'mat-dragon-powder',
        dropMinQty: 1,
        dropMaxQty: 2,
        isBoss: true,
        requiredAzitLevel: 6,
        description: '최고 난이도 4시간 최종 보스 원정! 전설의 재료와 막대한 전리품을 노립니다.',
    },
];

export const AZIT_LEVEL_TABLE: AzitLevelStep[] = [
    { level: 1, requiredXp: 0, title: '새내기 개척지', kitchenSlots: 1, maxChefs: 1, maxMercs: 2, maxPartySize: 1, maxActiveExpeditions: 1, gardenPlots: 6, maxFarmers: 0 },
    { level: 2, requiredXp: 80, title: '활기찬 초원 아지트', kitchenSlots: 1, maxChefs: 2, maxMercs: 2, maxPartySize: 2, maxActiveExpeditions: 1, gardenPlots: 6, maxFarmers: 0 },
    { level: 3, requiredXp: 220, title: '향긋한 비스트로 아지트', kitchenSlots: 2, maxChefs: 2, maxMercs: 3, maxPartySize: 2, maxActiveExpeditions: 1, gardenPlots: 6, maxFarmers: 0 },
    { level: 4, requiredXp: 460, title: '모험가 길드 쉼터', kitchenSlots: 2, maxChefs: 3, maxMercs: 3, maxPartySize: 3, maxActiveExpeditions: 1, gardenPlots: 6, maxFarmers: 0 },
    { level: 5, requiredXp: 820, title: '이중 원정 사령부', kitchenSlots: 2, maxChefs: 3, maxMercs: 4, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 7, maxFarmers: 0 },
    { level: 6, requiredXp: 1350, title: '황금 화덕 대저택', kitchenSlots: 3, maxChefs: 4, maxMercs: 4, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 7, maxFarmers: 0 },
    { level: 7, requiredXp: 2100, title: '로열 토벌 기사단 본부', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 7, maxFarmers: 0 },
    { level: 8, requiredXp: 3100, title: '영웅의 성채 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 7, maxFarmers: 0 },
    { level: 9, requiredXp: 4400, title: '그랜드 마스터 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 7, maxFarmers: 0 },
    { level: 10, requiredXp: 6200, title: '전설의 베라 왕국 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 8, maxFarmers: 0 },
    { level: 11, requiredXp: 8300, title: '은빛 개척단 전초기지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 8, maxFarmers: 0 },
    { level: 12, requiredXp: 10700, title: '비옥한 햇살 농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 8, maxFarmers: 0 },
    { level: 13, requiredXp: 13400, title: '상아탑 보급 장원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 8, maxFarmers: 0 },
    { level: 14, requiredXp: 16400, title: '황금 이삭 영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 8, maxFarmers: 0 },
    { level: 15, requiredXp: 19700, title: '수호자의 성역 농장', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 9, maxFarmers: 0 },
    { level: 16, requiredXp: 23300, title: '번영의 길드 대농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 9, maxFarmers: 0 },
    { level: 17, requiredXp: 27200, title: '창공의 바람 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 9, maxFarmers: 0 },
    { level: 18, requiredXp: 31400, title: '성좌의 축복 영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 9, maxFarmers: 0 },
    { level: 19, requiredXp: 35900, title: '여명의 대공국 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 9, maxFarmers: 0 },
    { level: 20, requiredXp: 40700, title: '농부 길드 개척령', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 10, maxFarmers: 1 },
    { level: 21, requiredXp: 45900, title: '청록빛 숲의 장원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 10, maxFarmers: 1 },
    { level: 22, requiredXp: 51500, title: '정령이 깃든 온실', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 10, maxFarmers: 1 },
    { level: 23, requiredXp: 57500, title: '백은 기사단 농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 10, maxFarmers: 1 },
    { level: 24, requiredXp: 63900, title: '풍요의 대지 성채', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 10, maxFarmers: 1 },
    { level: 25, requiredXp: 70700, title: '황금 호박 대영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 11, maxFarmers: 1 },
    { level: 26, requiredXp: 77900, title: '붉은 노을 왕립 농장', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 11, maxFarmers: 1 },
    { level: 27, requiredXp: 85500, title: '고대 수호수의 쉼터', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 11, maxFarmers: 1 },
    { level: 28, requiredXp: 93500, title: '비취빛 현자의 정원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 11, maxFarmers: 1 },
    { level: 29, requiredXp: 101900, title: '별빛 마도원의 영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 11, maxFarmers: 1 },
    { level: 30, requiredXp: 110700, title: '왕실 직할 대농장', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 12, maxFarmers: 1 },
    { level: 31, requiredXp: 120000, title: '오색 무지개 비경', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 12, maxFarmers: 1 },
    { level: 32, requiredXp: 129800, title: '백금 수확단 본부', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 12, maxFarmers: 1 },
    { level: 33, requiredXp: 140100, title: '용의 숨결 온실 성채', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 12, maxFarmers: 1 },
    { level: 34, requiredXp: 150900, title: '천공 정원의 관문', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 12, maxFarmers: 1 },
    { level: 35, requiredXp: 162200, title: '쌍둥이 농부 대영지', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 13, maxFarmers: 2 },
    { level: 36, requiredXp: 174000, title: '천년 영약의 계곡', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 13, maxFarmers: 2 },
    { level: 37, requiredXp: 186300, title: '태양왕의 황금 성소', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 13, maxFarmers: 2 },
    { level: 38, requiredXp: 199100, title: '대현자의 아카데미 농원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 13, maxFarmers: 2 },
    { level: 39, requiredXp: 212400, title: '성운의 축복 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 13, maxFarmers: 2 },
    { level: 40, requiredXp: 226200, title: '제국 최상급 영빈 장원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 14, maxFarmers: 2 },
    { level: 41, requiredXp: 240600, title: '영원한 봄의 낙원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 14, maxFarmers: 2 },
    { level: 42, requiredXp: 255600, title: '심연 트러플 성역', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 14, maxFarmers: 2 },
    { level: 43, requiredXp: 271200, title: '은하수 별빛 궁전', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 14, maxFarmers: 2 },
    { level: 44, requiredXp: 287400, title: '황혼의 대군주 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 14, maxFarmers: 2 },
    { level: 45, requiredXp: 304200, title: '신화의 대지 아발론', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 15, maxFarmers: 2 },
    { level: 46, requiredXp: 321600, title: '초월자의 황금 수목원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 15, maxFarmers: 2 },
    { level: 47, requiredXp: 339600, title: '성황의 천상 대정원', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 15, maxFarmers: 2 },
    { level: 48, requiredXp: 358200, title: '불멸의 아르카디아 성채', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 15, maxFarmers: 2 },
    { level: 49, requiredXp: 377400, title: '창세의 에덴 전당', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 15, maxFarmers: 2 },
    { level: 50, requiredXp: 397200, title: '절대군주의 달빛 에덴', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2, gardenPlots: 16, maxFarmers: 2 },
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
