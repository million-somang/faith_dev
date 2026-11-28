import type {
    AzitChefCode,
    AzitFarmerCode,
    AzitFarmerGrade,
    AzitFarmerRole,
    AzitItemId,
    AzitMercCode,
    AzitTowerThemeId,
    AzitZoneThemeId,
} from '@/types/azit-game.types';

export interface AzitCharacterSpriteMeta {
    spriteUrl: string;
    spriteWidth: number;
    spriteHeight: number;
    spriteOffsetY: number;
    shadowRx: number;
    shadowRy: number;
    accentRingColor: string;
}

export interface AzitFarmerVisualMeta {
    farmerCode: AzitFarmerCode;
    emoji: string;
    hatColor: string;
    outfitColor: string;
    accentRingColor: string;
    shadowRx: number;
    shadowRy: number;
    spriteUrl?: string;
}

export interface AzitFarmerGradeBadgeMeta {
    grade: AzitFarmerGrade;
    label: string;
    emoji: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
}

export interface AzitFarmerRoleBadgeMeta {
    role: AzitFarmerRole;
    label: string;
    emoji: string;
    bgClass: string;
    textClass: string;
}

export const AZIT_CHEF_SPRITES: Record<AzitChefCode, AzitCharacterSpriteMeta> = {
    'chef-momo': {
        spriteUrl: '/images/minihome/azit/chef-momo.png',
        spriteWidth: 86,
        spriteHeight: 86,
        spriteOffsetY: 10,
        shadowRx: 21,
        shadowRy: 9.5,
        accentRingColor: '#fb923c',
    },
    'chef-bulta': {
        spriteUrl: '/images/minihome/azit/chef-bulta.png',
        spriteWidth: 86,
        spriteHeight: 86,
        spriteOffsetY: 10,
        shadowRx: 21,
        shadowRy: 9.5,
        accentRingColor: '#ef4444',
    },
    'chef-claire': {
        spriteUrl: '/images/minihome/azit/chef-claire.png',
        spriteWidth: 86,
        spriteHeight: 86,
        spriteOffsetY: 10,
        shadowRx: 21,
        shadowRy: 9.5,
        accentRingColor: '#f472b6',
    },
    'chef-dragon': {
        spriteUrl: '/images/minihome/azit/chef-dragon.png',
        spriteWidth: 90,
        spriteHeight: 90,
        spriteOffsetY: 10,
        shadowRx: 22,
        shadowRy: 10,
        accentRingColor: '#eab308',
    },
};

export const AZIT_MERC_SPRITES: Record<AzitMercCode, AzitCharacterSpriteMeta> = {
    'merc-leo': {
        spriteUrl: '/images/minihome/azit/merc-leo.png',
        spriteWidth: 86,
        spriteHeight: 86,
        spriteOffsetY: 10,
        shadowRx: 21,
        shadowRy: 9.5,
        accentRingColor: '#3b82f6',
    },
    'merc-rina': {
        spriteUrl: '/images/minihome/azit/merc-rina.png',
        spriteWidth: 86,
        spriteHeight: 86,
        spriteOffsetY: 10,
        shadowRx: 21,
        shadowRy: 9.5,
        accentRingColor: '#22c55e',
    },
    'merc-kael': {
        spriteUrl: '/images/minihome/azit/merc-kael.png',
        spriteWidth: 86,
        spriteHeight: 86,
        spriteOffsetY: 10,
        shadowRx: 21,
        shadowRy: 9.5,
        accentRingColor: '#f97316',
    },
    'merc-serena': {
        spriteUrl: '/images/minihome/azit/merc-serena.png',
        spriteWidth: 86,
        spriteHeight: 86,
        spriteOffsetY: 10,
        shadowRx: 21,
        shadowRy: 9.5,
        accentRingColor: '#eab308',
    },
    'merc-garr': {
        spriteUrl: '/images/minihome/azit/merc-garr.png',
        spriteWidth: 88,
        spriteHeight: 88,
        spriteOffsetY: 10,
        shadowRx: 22,
        shadowRy: 10,
        accentRingColor: '#dc2626',
    },
    'merc-aria': {
        spriteUrl: '/images/minihome/azit/merc-aria.png',
        spriteWidth: 88,
        spriteHeight: 88,
        spriteOffsetY: 10,
        shadowRx: 22,
        shadowRy: 10,
        accentRingColor: '#6366f1',
    },
};

/** 요리사 코드에 대응하는 3D 미니미 스프라이트 메타 정보를 반환합니다. */
export function getChefSpriteMeta(chefCode: AzitChefCode): AzitCharacterSpriteMeta {
    return AZIT_CHEF_SPRITES[chefCode];
}

/** 용병 코드에 대응하는 3D 미니미 스프라이트 메타 정보를 반환합니다. */
export function getMercSpriteMeta(mercCode: AzitMercCode): AzitCharacterSpriteMeta {
    return AZIT_MERC_SPRITES[mercCode];
}

export const AZIT_FARMER_VISUALS: Record<string, AzitFarmerVisualMeta> = {
    'farmer-bomi': {
        farmerCode: 'farmer-bomi',
        emoji: '👩‍🌾',
        hatColor: '#f59e0b',
        outfitColor: '#10b981',
        accentRingColor: '#34d399',
        shadowRx: 20,
        shadowRy: 9,
    },
    'farmer-dori': {
        farmerCode: 'farmer-dori',
        emoji: '🧑‍🌾',
        hatColor: '#d97706',
        outfitColor: '#0ea5e9',
        accentRingColor: '#38bdf8',
        shadowRx: 20,
        shadowRy: 9,
    },
    'farmer-eldin': {
        farmerCode: 'farmer-eldin',
        emoji: '🧙‍♂️',
        hatColor: '#6366f1',
        outfitColor: '#8b5cf6',
        accentRingColor: '#a78bfa',
        shadowRx: 21,
        shadowRy: 9.5,
    },
};

export const AZIT_FARMER_GRADE_BADGES: Record<AzitFarmerGrade, AzitFarmerGradeBadgeMeta> = {
    1: {
        grade: 1,
        label: '견습 농부',
        emoji: '🌱',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
    },
    2: {
        grade: 2,
        label: '숙련 농부',
        emoji: '🌾',
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-700',
        borderClass: 'border-sky-200',
    },
    3: {
        grade: 3,
        label: '전문 농부',
        emoji: '🌻',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
    },
    4: {
        grade: 4,
        label: '마스터 농부',
        emoji: '👑',
        bgClass: 'bg-violet-50',
        textClass: 'text-violet-700',
        borderClass: 'border-violet-200',
    },
};

export const AZIT_FARMER_ROLE_BADGES: Record<AzitFarmerRole, AzitFarmerRoleBadgeMeta> = {
    water: {
        role: 'water',
        label: '물주기',
        emoji: '💧',
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-700',
    },
    harvest: {
        role: 'harvest',
        label: '수확',
        emoji: '🧺',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
    },
    plant: {
        role: 'plant',
        label: '심기',
        emoji: '🌱',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
    },
    fertilize: {
        role: 'fertilize',
        label: '비료',
        emoji: '🧪',
        bgClass: 'bg-violet-50',
        textClass: 'text-violet-700',
    },
};

const DEFAULT_FARMER_VISUAL: AzitFarmerVisualMeta = {
    farmerCode: 'farmer-default',
    emoji: '🧑‍🌾',
    hatColor: '#eab308',
    outfitColor: '#22c55e',
    accentRingColor: '#4ade80',
    shadowRx: 20,
    shadowRy: 9,
};

/** 농부 코드와 등급에 맞는 아이소메트릭/UI 비주얼 메타 정보를 반환합니다. */
export function getFarmerVisualMeta(farmerCode: AzitFarmerCode, grade = 1): AzitFarmerVisualMeta {
    const base = AZIT_FARMER_VISUALS[farmerCode] ?? {
        ...DEFAULT_FARMER_VISUAL,
        farmerCode,
    };
    const gradeBadge = getFarmerGradeBadge(grade);
    if (gradeBadge.grade === 4) {
        return {
            ...base,
            accentRingColor: '#8b5cf6',
        };
    }
    return base;
}

/** 농부 등급(1~4)에 대응하는 배지 메타 정보를 반환합니다. */
export function getFarmerGradeBadge(grade: number): AzitFarmerGradeBadgeMeta {
    if (grade >= 4) return AZIT_FARMER_GRADE_BADGES[4];
    if (grade === 3) return AZIT_FARMER_GRADE_BADGES[3];
    if (grade === 2) return AZIT_FARMER_GRADE_BADGES[2];
    return AZIT_FARMER_GRADE_BADGES[1];
}

/** 농부 자동화 역할에 대응하는 배지 메타 정보를 반환합니다. */
export function getFarmerRoleBadge(role: AzitFarmerRole): AzitFarmerRoleBadgeMeta {
    return AZIT_FARMER_ROLE_BADGES[role];
}

export type AzitWeaponVisualKind = 'shield_sword' | 'bow' | 'staff' | 'scepter' | 'twin_axe' | 'valkyrie_blade';

export interface AzitMercCombatVisualMeta {
    mercCode: AzitMercCode;
    weaponType: AzitWeaponVisualKind;
    roleColor: string;
    projectileColor: string;
    mainSkillColor: string;
    subSkillColor: string;
    spriteMeta: AzitCharacterSpriteMeta;
}

export type AzitMonsterShape =
    | 'slime'
    | 'goblin'
    | 'skeleton'
    | 'spirit'
    | 'treant'
    | 'golem'
    | 'knight'
    | 'wyvern'
    | 'mage'
    | 'dragon';

export interface AzitMonsterVisualMeta {
    monsterCode: string;
    name: string;
    emoji: string;
    shape: AzitMonsterShape;
    primaryColor: string;
    secondaryColor: string;
    eyeColor: string;
    auraColor: string;
    scale: number;
    isBoss: boolean;
}

export type AzitParticleKind = 'pollen' | 'sparks' | 'leaves' | 'dust' | 'embers' | 'void';

export interface AzitBattlefieldThemeMeta {
    themeId: AzitZoneThemeId;
    name: string;
    skyTop: string;
    skyBottom: string;
    horizonColor: string;
    groundTop: string;
    groundBottom: string;
    accentColor: string;
    particleKind: AzitParticleKind;
    decorProps: Array<'grass' | 'rock' | 'tree' | 'camp_tent' | 'crystal' | 'lava' | 'pillar'>;
}

export interface AzitTowerThemeMeta {
    themeId: AzitTowerThemeId;
    name: string;
    floorRange: [number, number];
    badgeColor: string;
    skyTop: string;
    skyBottom: string;
    floorColor: string;
    pillarColor: string;
    torchColor: string;
    particleKind: AzitParticleKind;
}

export interface AzitItemVisualMeta {
    itemId: AzitItemId;
    emoji: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    accentHex: string;
}

export const AZIT_MERC_COMBAT_VISUALS: Record<AzitMercCode, AzitMercCombatVisualMeta> = {
    'merc-leo': {
        mercCode: 'merc-leo',
        weaponType: 'shield_sword',
        roleColor: '#3b82f6',
        projectileColor: '#93c5fd',
        mainSkillColor: '#60a5fa',
        subSkillColor: '#2563eb',
        spriteMeta: AZIT_MERC_SPRITES['merc-leo'],
    },
    'merc-rina': {
        mercCode: 'merc-rina',
        weaponType: 'bow',
        roleColor: '#22c55e',
        projectileColor: '#4ade80',
        mainSkillColor: '#10b981',
        subSkillColor: '#86efac',
        spriteMeta: AZIT_MERC_SPRITES['merc-rina'],
    },
    'merc-kael': {
        mercCode: 'merc-kael',
        weaponType: 'staff',
        roleColor: '#f97316',
        projectileColor: '#fb923c',
        mainSkillColor: '#ef4444',
        subSkillColor: '#f59e0b',
        spriteMeta: AZIT_MERC_SPRITES['merc-kael'],
    },
    'merc-serena': {
        mercCode: 'merc-serena',
        weaponType: 'scepter',
        roleColor: '#eab308',
        projectileColor: '#fde047',
        mainSkillColor: '#fef08a',
        subSkillColor: '#4ade80',
        spriteMeta: AZIT_MERC_SPRITES['merc-serena'],
    },
    'merc-garr': {
        mercCode: 'merc-garr',
        weaponType: 'twin_axe',
        roleColor: '#dc2626',
        projectileColor: '#f87171',
        mainSkillColor: '#b91c1c',
        subSkillColor: '#fb7185',
        spriteMeta: AZIT_MERC_SPRITES['merc-garr'],
    },
    'merc-aria': {
        mercCode: 'merc-aria',
        weaponType: 'valkyrie_blade',
        roleColor: '#6366f1',
        projectileColor: '#a5b4fc',
        mainSkillColor: '#818cf8',
        subSkillColor: '#38bdf8',
        spriteMeta: AZIT_MERC_SPRITES['merc-aria'],
    },
};

export const AZIT_MONSTER_VISUALS: Record<string, AzitMonsterVisualMeta> = {
    'mon-slime': {
        monsterCode: 'mon-slime',
        name: '초원 슬라임',
        emoji: '🟢',
        shape: 'slime',
        primaryColor: '#4ade80',
        secondaryColor: '#16a34a',
        eyeColor: '#0f172a',
        auraColor: '#86efac',
        scale: 0.9,
        isBoss: false,
    },
    'mon-king-slime': {
        monsterCode: 'mon-king-slime',
        name: '킹 초원 슬라임',
        emoji: '👑',
        shape: 'slime',
        primaryColor: '#22c55e',
        secondaryColor: '#15803d',
        eyeColor: '#fef08a',
        auraColor: '#facc15',
        scale: 1.25,
        isBoss: true,
    },
    'mon-goblin': {
        monsterCode: 'mon-goblin',
        name: '고블린 척후병',
        emoji: '👺',
        shape: 'goblin',
        primaryColor: '#84cc16',
        secondaryColor: '#4d7c0f',
        eyeColor: '#ef4444',
        auraColor: '#bef264',
        scale: 0.95,
        isBoss: false,
    },
    'mon-goblin-chief': {
        monsterCode: 'mon-goblin-chief',
        name: '고블린 약탈대장',
        emoji: '🪓',
        shape: 'goblin',
        primaryColor: '#65a30d',
        secondaryColor: '#3f6212',
        eyeColor: '#f97316',
        auraColor: '#fca5a5',
        scale: 1.2,
        isBoss: true,
    },
    'mon-skeleton': {
        monsterCode: 'mon-skeleton',
        name: '해골 파수병',
        emoji: '💀',
        shape: 'skeleton',
        primaryColor: '#e2e8f0',
        secondaryColor: '#94a3b8',
        eyeColor: '#38bdf8',
        auraColor: '#cbd5e1',
        scale: 1.0,
        isBoss: false,
    },
    'mon-spirit': {
        monsterCode: 'mon-spirit',
        name: '안개 정령',
        emoji: '🧚',
        shape: 'spirit',
        primaryColor: '#2dd4bf',
        secondaryColor: '#0f766e',
        eyeColor: '#f0fdfa',
        auraColor: '#5eead4',
        scale: 1.0,
        isBoss: false,
    },
    'mon-forest-queen': {
        monsterCode: 'mon-forest-queen',
        name: '안개 숲의 여왕 정령',
        emoji: '🌺',
        shape: 'spirit',
        primaryColor: '#10b981',
        secondaryColor: '#047857',
        eyeColor: '#fde047',
        auraColor: '#a7f3d0',
        scale: 1.25,
        isBoss: true,
    },
    'mon-treant': {
        monsterCode: 'mon-treant',
        name: '고목 수호자',
        emoji: '🌳',
        shape: 'treant',
        primaryColor: '#78350f',
        secondaryColor: '#166534',
        eyeColor: '#facc15',
        auraColor: '#4ade80',
        scale: 1.15,
        isBoss: false,
    },
    'mon-golem': {
        monsterCode: 'mon-golem',
        name: '룬 스톤 가디언',
        emoji: '🗿',
        shape: 'golem',
        primaryColor: '#64748b',
        secondaryColor: '#334155',
        eyeColor: '#38bdf8',
        auraColor: '#818cf8',
        scale: 1.25,
        isBoss: true,
    },
    'mon-dark-knight': {
        monsterCode: 'mon-dark-knight',
        name: '흑요석 암흑기사',
        emoji: '🛡️',
        shape: 'knight',
        primaryColor: '#4338ca',
        secondaryColor: '#1e1b4b',
        eyeColor: '#f43f5e',
        auraColor: '#818cf8',
        scale: 1.15,
        isBoss: false,
    },
    'mon-wyvern': {
        monsterCode: 'mon-wyvern',
        name: '홍련의 와이번 로드',
        emoji: '🦅',
        shape: 'wyvern',
        primaryColor: '#ea580c',
        secondaryColor: '#9a3412',
        eyeColor: '#fef08a',
        auraColor: '#fb923c',
        scale: 1.3,
        isBoss: true,
    },
    'mon-flame-mage': {
        monsterCode: 'mon-flame-mage',
        name: '화염 마도사',
        emoji: '🔥',
        shape: 'mage',
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        eyeColor: '#fde047',
        auraColor: '#f97316',
        scale: 1.05,
        isBoss: false,
    },
    'mon-dragon': {
        monsterCode: 'mon-dragon',
        name: '심연의 흑룡 바하무트',
        emoji: '🐉',
        shape: 'dragon',
        primaryColor: '#991b1b',
        secondaryColor: '#1f2937',
        eyeColor: '#facc15',
        auraColor: '#ef4444',
        scale: 1.45,
        isBoss: true,
    },
    'mon-abyss-vera': {
        monsterCode: 'mon-abyss-vera',
        name: '심연의 수호신 베라',
        emoji: '👁️',
        shape: 'dragon',
        primaryColor: '#7c3aed',
        secondaryColor: '#1e1b4b',
        eyeColor: '#f43f5e',
        auraColor: '#c084fc',
        scale: 1.5,
        isBoss: true,
    },
};

export const AZIT_ZONE_THEMES: Record<AzitZoneThemeId, AzitBattlefieldThemeMeta> = {
    'theme-slime-marsh': {
        themeId: 'theme-slime-marsh',
        name: '슬라임 습지대',
        skyTop: '#bae6fd',
        skyBottom: '#e0f2fe',
        horizonColor: '#86efac',
        groundTop: '#4ade80',
        groundBottom: '#16a34a',
        accentColor: '#22c55e',
        particleKind: 'pollen',
        decorProps: ['grass', 'rock'],
    },
    'theme-goblin-camp': {
        themeId: 'theme-goblin-camp',
        name: '고블린 약탈 캠프',
        skyTop: '#fed7aa',
        skyBottom: '#ffedd5',
        horizonColor: '#d97706',
        groundTop: '#b45309',
        groundBottom: '#78350f',
        accentColor: '#f97316',
        particleKind: 'sparks',
        decorProps: ['camp_tent', 'rock'],
    },
    'theme-ancient-forest': {
        themeId: 'theme-ancient-forest',
        name: '고대 정령의 숲',
        skyTop: '#a7f3d0',
        skyBottom: '#d1fae5',
        horizonColor: '#34d399',
        groundTop: '#059669',
        groundBottom: '#064e3b',
        accentColor: '#10b981',
        particleKind: 'leaves',
        decorProps: ['tree', 'crystal'],
    },
    'theme-obsidian-canyon': {
        themeId: 'theme-obsidian-canyon',
        name: '흑요석 골렘 협곡',
        skyTop: '#c7d2fe',
        skyBottom: '#e0e7ff',
        horizonColor: '#6366f1',
        groundTop: '#475569',
        groundBottom: '#1e293b',
        accentColor: '#818cf8',
        particleKind: 'dust',
        decorProps: ['crystal', 'rock', 'pillar'],
    },
    'theme-wyvern-peak': {
        themeId: 'theme-wyvern-peak',
        name: '창공 와이번 둥지',
        skyTop: '#fecaca',
        skyBottom: '#fed7aa',
        horizonColor: '#ea580c',
        groundTop: '#7c2d12',
        groundBottom: '#431407',
        accentColor: '#f97316',
        particleKind: 'embers',
        decorProps: ['lava', 'rock'],
    },
    'theme-dragon-abyss': {
        themeId: 'theme-dragon-abyss',
        name: '적염 고대 용의 심연',
        skyTop: '#450a0a',
        skyBottom: '#7f1d1d',
        horizonColor: '#dc2626',
        groundTop: '#292524',
        groundBottom: '#0c0a09',
        accentColor: '#ef4444',
        particleKind: 'embers',
        decorProps: ['lava', 'pillar', 'crystal'],
    },
};

export const AZIT_TOWER_THEMES: Record<AzitTowerThemeId, AzitTowerThemeMeta> = {
    'tower-1-forgotten': {
        themeId: 'tower-1-forgotten',
        name: '잊혀진 탑 하층',
        floorRange: [1, 40],
        badgeColor: '#64748b',
        skyTop: '#1e293b',
        skyBottom: '#334155',
        floorColor: '#475569',
        pillarColor: '#64748b',
        torchColor: '#fbbf24',
        particleKind: 'dust',
    },
    'tower-2-spirit': {
        themeId: 'tower-2-spirit',
        name: '정령의 회랑',
        floorRange: [41, 80],
        badgeColor: '#10b981',
        skyTop: '#064e3b',
        skyBottom: '#065f46',
        floorColor: '#047857',
        pillarColor: '#34d399',
        torchColor: '#5eead4',
        particleKind: 'leaves',
    },
    'tower-3-obsidian': {
        themeId: 'tower-3-obsidian',
        name: '흑요석 성채',
        floorRange: [81, 120],
        badgeColor: '#6366f1',
        skyTop: '#1e1b4b',
        skyBottom: '#312e81',
        floorColor: '#3730a3',
        pillarColor: '#6366f1',
        torchColor: '#a5b4fc',
        particleKind: 'sparks',
    },
    'tower-4-wyvern': {
        themeId: 'tower-4-wyvern',
        name: '비룡의 첨탑',
        floorRange: [121, 160],
        badgeColor: '#f97316',
        skyTop: '#431407',
        skyBottom: '#7c2d12',
        floorColor: '#9a3412',
        pillarColor: '#ea580c',
        torchColor: '#fdba74',
        particleKind: 'embers',
    },
    'tower-5-abyss': {
        themeId: 'tower-5-abyss',
        name: '베라의 성소 심연',
        floorRange: [161, 200],
        badgeColor: '#dc2626',
        skyTop: '#18181b',
        skyBottom: '#4c0519',
        floorColor: '#881337',
        pillarColor: '#be123c',
        torchColor: '#fda4af',
        particleKind: 'void',
    },
};

export const AZIT_ITEM_VISUALS: Record<AzitItemId, AzitItemVisualMeta> = {
    'item-revival-herb': {
        itemId: 'item-revival-herb',
        emoji: '🌿',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
        accentHex: '#10b981',
    },
    'item-phoenix-feather': {
        itemId: 'item-phoenix-feather',
        emoji: '🪶',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        accentHex: '#f59e0b',
    },
    'item-skill-stone': {
        itemId: 'item-skill-stone',
        emoji: '💎',
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-700',
        borderClass: 'border-sky-200',
        accentHex: '#0ea5e9',
    },
    'item-skill-tome': {
        itemId: 'item-skill-tome',
        emoji: '📘',
        bgClass: 'bg-indigo-50',
        textClass: 'text-indigo-700',
        borderClass: 'border-indigo-200',
        accentHex: '#6366f1',
    },
    'item-battle-elixir': {
        itemId: 'item-battle-elixir',
        emoji: '⚗️',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-700',
        borderClass: 'border-rose-200',
        accentHex: '#f43f5e',
    },
};

const DEFAULT_MONSTER_VISUAL: AzitMonsterVisualMeta = {
    monsterCode: 'mon-slime',
    name: '수호 몬스터',
    emoji: '👾',
    shape: 'slime',
    primaryColor: '#64748b',
    secondaryColor: '#334155',
    eyeColor: '#facc15',
    auraColor: '#94a3b8',
    scale: 1.0,
    isBoss: false,
};

export function getMercCombatVisual(mercCode: AzitMercCode): AzitMercCombatVisualMeta {
    return AZIT_MERC_COMBAT_VISUALS[mercCode];
}

export function getMonsterVisual(monsterCode: string): AzitMonsterVisualMeta {
    if (AZIT_MONSTER_VISUALS[monsterCode]) {
        return AZIT_MONSTER_VISUALS[monsterCode];
    }
    const baseKey = Object.keys(AZIT_MONSTER_VISUALS).find((k) => monsterCode.startsWith(k));
    if (baseKey) {
        return AZIT_MONSTER_VISUALS[baseKey];
    }
    return {
        ...DEFAULT_MONSTER_VISUAL,
        monsterCode,
    };
}

export function getZoneThemeMeta(themeId: AzitZoneThemeId | undefined): AzitBattlefieldThemeMeta {
    if (themeId && AZIT_ZONE_THEMES[themeId]) {
        return AZIT_ZONE_THEMES[themeId];
    }
    return AZIT_ZONE_THEMES['theme-slime-marsh'];
}

export function getTowerThemeMeta(themeId: AzitTowerThemeId | undefined): AzitTowerThemeMeta {
    if (themeId && AZIT_TOWER_THEMES[themeId]) {
        return AZIT_TOWER_THEMES[themeId];
    }
    return AZIT_TOWER_THEMES['tower-1-forgotten'];
}

export function getItemVisualMeta(itemId: AzitItemId): AzitItemVisualMeta {
    return AZIT_ITEM_VISUALS[itemId];
}
