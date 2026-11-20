export type AzitCropId =
    | 'crop-carrot'
    | 'crop-pepper'
    | 'crop-tomato'
    | 'crop-lettuce'
    | 'crop-potato'
    | 'crop-strawberry';

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

export interface AzitCropDef {
    cropId: AzitCropId;
    name: string;
    shortName: string;
    emoji: string;
    seedPrice: number;
    harvestYield: number;
    sellPrice: number;
    description: string;
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

export interface AzitRecipeDef {
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
}

export const GARDEN_WATER_COOLDOWN_MS = 8 * 60 * 60 * 1000;
export const GARDEN_HARVEST_AZIT_XP = 8;

export const AZIT_CROPS: AzitCropDef[] = [
    {
        cropId: 'crop-carrot',
        name: '달콤 미니당근',
        shortName: '당근',
        emoji: '🥕',
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
        seedPrice: 45,
        harvestYield: 2,
        sellPrice: 55,
        description: '최고급 디저트와 드래곤 정식에 쓰이는 희귀 고급 과일입니다.',
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
        cookDurationSec: 120,
        sellPrice: 30,
        powerBonusPct: 15,
        winRateBonusPct: 5,
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
        cookDurationSec: 300,
        sellPrice: 75,
        powerBonusPct: 25,
        winRateBonusPct: 8,
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
        cookDurationSec: 600,
        sellPrice: 130,
        powerBonusPct: 35,
        winRateBonusPct: 10,
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
        cookDurationSec: 900,
        sellPrice: 185,
        powerBonusPct: 45,
        winRateBonusPct: 12,
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
        cookDurationSec: 1800,
        sellPrice: 260,
        powerBonusPct: 60,
        winRateBonusPct: 15,
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
        cookDurationSec: 2700,
        sellPrice: 420,
        powerBonusPct: 80,
        winRateBonusPct: 18,
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
        cookDurationSec: 3600,
        sellPrice: 680,
        powerBonusPct: 110,
        winRateBonusPct: 22,
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
        cookDurationSec: 5400,
        sellPrice: 1200,
        powerBonusPct: 160,
        winRateBonusPct: 28,
        azitXpReward: 75,
        requiredAzitLevel: 7,
        description: '드래곤 비늘 가루로 완성하는 최강 4티어 궁극 보스 공략 정식입니다.',
        ingredients: [
            { kind: 'crop', id: 'crop-strawberry', qty: 3 },
            { kind: 'crop', id: 'crop-tomato', qty: 2 },
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
        baseSpeedBonusPct: 15,
        baseGreatChancePct: 10,
        maxLevel: 10,
        description: '따뜻한 손맛으로 조리 시간을 줄여주는 성실한 수습 셰프입니다.',
    },
    {
        chefCode: 'chef-bulta',
        name: '불타',
        title: '화덕 중식 셰프',
        emoji: '🔥',
        hireCost: 250,
        requiredAzitLevel: 2,
        baseSpeedBonusPct: 25,
        baseGreatChancePct: 18,
        maxLevel: 10,
        description: '강렬한 불 조절로 요리를 빠르게 완성하고 대성공을 노립니다.',
    },
    {
        chefCode: 'chef-claire',
        name: '클레어',
        title: '로열 파티시에',
        emoji: '🧁',
        hireCost: 600,
        requiredAzitLevel: 4,
        baseSpeedBonusPct: 35,
        baseGreatChancePct: 25,
        maxLevel: 10,
        description: '정교한 레시피 계량으로 고급 요리 대성공 확률을 크게 높입니다.',
    },
    {
        chefCode: 'chef-dragon',
        name: '마스터 용왕',
        title: '전설 궁중 요리장',
        emoji: '🐲',
        hireCost: 1400,
        requiredAzitLevel: 6,
        baseSpeedBonusPct: 45,
        baseGreatChancePct: 35,
        maxLevel: 10,
        description: '궁중 비법으로 전설급 요리를 순식간에 빚어내는 최고봉 셰프입니다.',
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
    { level: 1, requiredXp: 0, title: '새내기 개척지', kitchenSlots: 1, maxChefs: 1, maxMercs: 2, maxPartySize: 1, maxActiveExpeditions: 1 },
    { level: 2, requiredXp: 80, title: '활기찬 초원 아지트', kitchenSlots: 1, maxChefs: 2, maxMercs: 2, maxPartySize: 2, maxActiveExpeditions: 1 },
    { level: 3, requiredXp: 220, title: '향긋한 비스트로 아지트', kitchenSlots: 2, maxChefs: 2, maxMercs: 3, maxPartySize: 2, maxActiveExpeditions: 1 },
    { level: 4, requiredXp: 460, title: '모험가 길드 쉼터', kitchenSlots: 2, maxChefs: 3, maxMercs: 3, maxPartySize: 3, maxActiveExpeditions: 1 },
    { level: 5, requiredXp: 820, title: '이중 원정 사령부', kitchenSlots: 2, maxChefs: 3, maxMercs: 4, maxPartySize: 3, maxActiveExpeditions: 2 },
    { level: 6, requiredXp: 1350, title: '황금 화덕 대저택', kitchenSlots: 3, maxChefs: 4, maxMercs: 4, maxPartySize: 3, maxActiveExpeditions: 2 },
    { level: 7, requiredXp: 2100, title: '로열 토벌 기사단 본부', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2 },
    { level: 8, requiredXp: 3100, title: '영웅의 성채 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2 },
    { level: 9, requiredXp: 4400, title: '그랜드 마스터 요새', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2 },
    { level: 10, requiredXp: 6200, title: '전설의 베라 왕국 아지트', kitchenSlots: 3, maxChefs: 4, maxMercs: 6, maxPartySize: 3, maxActiveExpeditions: 2 },
];

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

export function getAzitLevelInfo(xp: number): AzitLevelStep & {
    nextLevelXp: number | null;
    progressPct: number;
} {
    const safeXp = Math.max(0, Math.floor(xp));
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
        speedBonusPct: Math.min(75, def.baseSpeedBonusPct + bonusLv * 2),
        greatChancePct: Math.min(70, def.baseGreatChancePct + bonusLv * 2),
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
}): {
    rawPower: number;
    effectivePower: number;
    winRatePct: number;
} {
    const recipe = getRecipeDef(params.recipeId);
    const zone = getZoneDef(params.zoneId);
    if (!recipe || !zone || params.mercenaries.length === 0) {
        return { rawPower: 0, effectivePower: 0, winRatePct: 25 };
    }

    let rawPower = 0;
    let partyWinBonus = 0;
    for (const m of params.mercenaries) {
        rawPower += getMercenaryEffectivePower(m.mercCode, m.level);
        const def = getMercDef(m.mercCode);
        if (def) {
            partyWinBonus += def.partyWinBonusPct;
        }
    }

    const effectivePower = Math.round(rawPower * (1 + recipe.powerBonusPct / 100));
    const ratioScore = Math.round((effectivePower / Math.max(1, zone.recommendedPower)) * 72);
    const clampedBase = Math.max(25, Math.min(95, ratioScore));
    const totalRate = Math.max(
        25,
        Math.min(96, clampedBase + recipe.winRateBonusPct + partyWinBonus)
    );

    return {
        rawPower,
        effectivePower,
        winRatePct: totalRate,
    };
}

export function generateBattleLog(params: {
    won: boolean;
    zone: AzitExpeditionZoneDef;
    mercenaryNames: string[];
    dishName: string;
    dishEmoji: string;
    rewardPoints: number;
    materialName: string;
    materialEmoji: string;
    dropQty: number;
}): string[] {
    const partyLabel = params.mercenaryNames.join(', ');
    const leadMerc = params.mercenaryNames[0] || '용병대';
    if (params.won) {
        return [
            `${params.dishEmoji} 출정 전 [${params.dishName}] 도시락으로 파티 사기가 크게 상승했습니다!`,
            `⚔️ [${partyLabel}] 용병단이 ${params.zone.name}에 돌입해 ${params.zone.monsterName}의 약점을 포착했습니다.`,
            `💥 ${leadMerc}의 결정적인 일격으로 ${params.zone.monsterName} 토벌에 성공했습니다!`,
            `🏆 전리품으로 🪙 ${params.rewardPoints.toLocaleString()}P 및 ${params.materialEmoji} ${params.materialName} ×${params.dropQty}을 회수해 아지트로 귀환했습니다.`,
        ];
    }
    return [
        `${params.dishEmoji} [${params.dishName}] 도시락을 나누어 먹고 ${params.zone.name}에 진입했습니다.`,
        `⚔️ [${partyLabel}] 용병단이 ${params.zone.monsterName}와 격렬한 교전을 벌였습니다.`,
        `⚠️ ${params.zone.monsterName}의 맹공에 부대가 밀리며 전열이 무너져 전략적 후퇴를 감행했습니다.`,
        `💔 토벌에 실패해 출정비와 보급 도시락이 소실되었습니다. 용병 강화 또는 상위 도시락 준비 후 재도전하세요!`,
    ];
}
