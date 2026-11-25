import type {
    AzitChefCode,
    AzitFarmerCode,
    AzitFarmerGrade,
    AzitFarmerRole,
    AzitMercCode,
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
