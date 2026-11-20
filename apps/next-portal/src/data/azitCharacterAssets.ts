import type { AzitChefCode, AzitMercCode } from '@/types/azit-game.types';

export interface AzitCharacterSpriteMeta {
    spriteUrl: string;
    spriteWidth: number;
    spriteHeight: number;
    spriteOffsetY: number;
    shadowRx: number;
    shadowRy: number;
    accentRingColor: string;
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
