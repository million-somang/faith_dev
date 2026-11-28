'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
    AzitCombatFrame,
    AzitCombatFrameUnit,
    AzitCombatSkillSpec,
    AzitCombatStatusKind,
    AzitCombatUnitTemplate,
    AzitCombatVfxEvent,
    AzitExpeditionRecord,
    AzitFullGameState,
    AzitMercBaseCombatStats,
    AzitMercCode,
    AzitMonsterDef,
    AzitZoneThemeId,
} from '@/types/azit-game.types';
import {
    ARENA_HEIGHT,
    ARENA_WIDTH,
    formatCountdownLabel,
    getDishEffectiveBuffs,
} from '@/types/azit-game.types';
import {
    buildCampPreviewSimulation,
    interpolateCombatFrame,
} from '@/utils/azitCombatEngine';
import {
    getMercCombatVisual,
    getMercSpriteMeta,
    getMonsterVisual,
    getZoneThemeMeta,
    type AzitBattlefieldThemeMeta,
    type AzitMonsterVisualMeta,
} from '@/data/azitCharacterAssets';

export interface AzitBattlefieldCanvasProps {
    gameState: AzitFullGameState;
    nowMs: number;
    isActing?: boolean;
    selectedExpeditionId?: number | null;
    onSelectExpedition?: (expeditionId: number) => void;
    onClaimExpedition?: (expeditionId: number) => Promise<boolean>;
}

interface FloatingPopup {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
    isCrit: boolean;
    createdPerfMs: number;
}

const DEFAULT_FALLBACK_SKILL: AzitCombatSkillSpec = {
    id: 'fallback-strike',
    name: '전술 타격',
    emoji: '⚔️',
    slot: 'main',
    effectKind: 'damage',
    targetScope: 'enemy_single',
    cooldownMs: 4200,
    powerPct: 145,
    perLevelPct: 8,
    range: 90,
    aoeRadius: 0,
    description: '전술 타격으로 적에게 피해를 줍니다.',
};

const DEFAULT_FALLBACK_SUB_SKILL: AzitCombatSkillSpec = {
    id: 'fallback-guard',
    name: '전열 다지기',
    emoji: '🛡️',
    slot: 'sub',
    effectKind: 'buff',
    targetScope: 'self',
    cooldownMs: 5600,
    powerPct: 100,
    perLevelPct: 6,
    range: 80,
    aoeRadius: 0,
    description: '잠시 동안 공격력과 방어 태세를 높입니다.',
    statusEffect: { kind: 'atkUp', durationMs: 3000, value: 15 },
};

const FALLBACK_BASE_STATS: Record<AzitMercCode, AzitMercBaseCombatStats> = {
    'merc-leo': { combatRole: 'tank', hp: 520, atk: 44, def: 28, moveSpeed: 112, attackIntervalMs: 1020, range: 64, critPct: 10 },
    'merc-rina': { combatRole: 'ranger', hp: 330, atk: 58, def: 14, moveSpeed: 125, attackIntervalMs: 880, range: 240, critPct: 18 },
    'merc-kael': { combatRole: 'mage', hp: 310, atk: 66, def: 12, moveSpeed: 106, attackIntervalMs: 1050, range: 230, critPct: 14 },
    'merc-serena': { combatRole: 'healer', hp: 360, atk: 42, def: 18, moveSpeed: 110, attackIntervalMs: 1000, range: 220, critPct: 8 },
    'merc-garr': { combatRole: 'berserker', hp: 460, atk: 64, def: 18, moveSpeed: 124, attackIntervalMs: 920, range: 66, critPct: 20 },
    'merc-aria': { combatRole: 'allrounder', hp: 440, atk: 60, def: 22, moveSpeed: 130, attackIntervalMs: 860, range: 76, critPct: 16 },
};

function resolveThemeIdForZone(exp: AzitExpeditionRecord, zoneTheme?: AzitZoneThemeId): AzitZoneThemeId | undefined {
    if (exp.zoneTheme) return exp.zoneTheme;
    if (zoneTheme) return zoneTheme;
    switch (exp.zoneId) {
        case 'zone-slime':
            return 'theme-slime-marsh';
        case 'zone-goblin':
            return 'theme-goblin-camp';
        case 'zone-forest':
            return 'theme-ancient-forest';
        case 'zone-golem':
            return 'theme-obsidian-canyon';
        case 'zone-wyvern':
            return 'theme-wyvern-peak';
        case 'zone-dragon':
            return 'theme-dragon-abyss';
    }
}

function buildFallbackAllies(
    exp: AzitExpeditionRecord,
    gameState: AzitFullGameState
): AzitCombatUnitTemplate[] {
    if (Array.isArray(exp.partySnapshot) && exp.partySnapshot.length > 0) {
        return exp.partySnapshot;
    }

    const codes = exp.partyMercCodes.length > 0 ? exp.partyMercCodes : (['merc-leo'] as AzitMercCode[]);
    return codes.map((code, idx) => {
        const owned = gameState.mercenaries.find((m) => m.mercCode === code);
        const def = gameState.catalog.mercenaries.find((m) => m.mercCode === code);
        const lv = Math.max(1, owned?.level ?? 1);
        const lvFactor = 1 + (lv - 1) * 0.25;
        const defFactor = 1 + (lv - 1) * 0.22;
        const base = def?.baseStats ?? FALLBACK_BASE_STATS[code] ?? FALLBACK_BASE_STATS['merc-leo'];

        const mainLv = owned?.mainSkill?.level ?? 1;
        const subLv = owned?.subSkill?.level ?? 1;

        return {
            unitId: `camp-ally-${idx}-${code}`,
            side: 'ally',
            code,
            name: def?.name ?? code,
            emoji: def?.emoji ?? '⚔️',
            combatRole: owned?.combatRole ?? def?.combatRole ?? base.combatRole,
            level: lv,
            maxHp: owned?.maxHp ?? Math.round(base.hp * lvFactor),
            atk: owned?.atk ?? Math.round(base.atk * lvFactor),
            def: owned?.def ?? Math.round(base.def * defFactor),
            moveSpeed: owned?.spd ?? base.moveSpeed + Math.min(20, lv - 1),
            attackIntervalMs: Math.max(580, base.attackIntervalMs - Math.min(180, (lv - 1) * 10)),
            range: owned?.range ?? base.range,
            critPct: base.critPct + Math.min(10, Math.floor((lv - 1) / 2)),
            mainSkill: def?.mainSkill ?? DEFAULT_FALLBACK_SKILL,
            subSkill: def?.subSkill ?? DEFAULT_FALLBACK_SUB_SKILL,
            mainSkillLevel: mainLv,
            subSkillLevel: subLv,
        };
    });
}

function buildFallbackMonsters(
    exp: AzitExpeditionRecord,
    gameState: AzitFullGameState
): AzitMonsterDef[] {
    if (Array.isArray(exp.monsters) && exp.monsters.length > 0) {
        return exp.monsters;
    }
    const zone = gameState.catalog.zones.find((z) => z.zoneId === exp.zoneId);
    if (zone?.monsters && zone.monsters.length > 0) {
        return zone.monsters;
    }
    const basePower = Math.max(80, zone?.recommendedPower ?? 120);
    return [
        {
            monsterId: `mon-${exp.zoneId.replace('zone-', '')}`,
            name: zone?.monsterName ?? '야생 몬스터',
            emoji: zone?.emoji ?? '👾',
            role: zone?.isBoss ? '보스' : '딜러',
            combatRole: zone?.isBoss ? 'enemy-boss' : 'enemy-melee',
            maxHp: Math.round(basePower * 3.2),
            atk: Math.round(basePower * 0.35),
            def: Math.round(basePower * 0.14),
            moveSpeed: 98,
            attackIntervalMs: 1050,
            range: 74,
            isBoss: Boolean(zone?.isBoss),
            mainSkill: {
                ...DEFAULT_FALLBACK_SKILL,
                id: 'mon-fallback-main',
                name: '야수의 돌진',
                emoji: zone?.emoji ?? '💥',
            },
            subSkill: {
                ...DEFAULT_FALLBACK_SUB_SKILL,
                id: 'mon-fallback-sub',
                name: '광폭 포효',
                emoji: '💢',
            },
        },
    ];
}

function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawBattlefieldBackground(
    ctx: CanvasRenderingContext2D,
    theme: AzitBattlefieldThemeMeta,
    timeSec: number
) {
    // 1. Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 125);
    skyGrad.addColorStop(0, theme.skyTop);
    skyGrad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, 125);

    // Subtle atmospheric sun / moon / eclipse disc
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = theme.accentColor;
    ctx.beginPath();
    ctx.arc(670, 58, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(670, 58, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Distant mountain / silhouette ridge
    ctx.fillStyle = theme.horizonColor;
    ctx.beginPath();
    ctx.moveTo(0, 125);
    for (let x = 0; x <= ARENA_WIDTH; x += 40) {
        const ridgeY = 98 + Math.sin(x * 0.017 + 1.2) * 14 + Math.cos(x * 0.031) * 7;
        ctx.lineTo(x, ridgeY);
    }
    ctx.lineTo(ARENA_WIDTH, 125);
    ctx.closePath();
    ctx.fill();

    // 3. Battle ground gradient
    const groundGrad = ctx.createLinearGradient(0, 112, 0, ARENA_HEIGHT);
    groundGrad.addColorStop(0, theme.groundTop);
    groundGrad.addColorStop(1, theme.groundBottom);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 112, ARENA_WIDTH, ARENA_HEIGHT - 112);

    // Arena depth lane lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.2;
    for (const laneY of [162, 224, 286]) {
        ctx.beginPath();
        ctx.moveTo(24, laneY);
        ctx.lineTo(ARENA_WIDTH - 24, laneY);
        ctx.stroke();
    }
    ctx.restore();

    // 4. Decor props along horizon & edges
    const props = theme.decorProps;
    const propSlots = [70, 190, 340, 490, 620, 735];
    propSlots.forEach((px, idx) => {
        const prop = props[idx % props.length];
        const py = idx % 2 === 0 ? 116 : 332;
        ctx.save();
        ctx.translate(px, py);
        if (prop === 'grass') {
            ctx.strokeStyle = theme.accentColor;
            ctx.lineWidth = 2.2;
            for (let g = -6; g <= 6; g += 4) {
                ctx.beginPath();
                ctx.moveTo(g, 0);
                ctx.quadraticCurveTo(g + Math.sin(timeSec * 2 + idx) * 3, -10, g + 2, -16);
                ctx.stroke();
            }
        } else if (prop === 'rock') {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.beginPath();
            ctx.moveTo(-16, 4);
            ctx.lineTo(-10, -12);
            ctx.lineTo(4, -15);
            ctx.lineTo(16, 4);
            ctx.closePath();
            ctx.fill();
        } else if (prop === 'tree') {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(-4, -18, 8, 20);
            ctx.fillStyle = theme.accentColor;
            ctx.beginPath();
            ctx.arc(0, -24, 15, 0, Math.PI * 2);
            ctx.fill();
        } else if (prop === 'camp_tent') {
            ctx.fillStyle = '#7c2d12';
            ctx.beginPath();
            ctx.moveTo(-18, 4);
            ctx.lineTo(0, -24);
            ctx.lineTo(18, 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(-6, 4);
            ctx.lineTo(0, -10);
            ctx.lineTo(6, 4);
            ctx.closePath();
            ctx.fill();
        } else if (prop === 'crystal') {
            ctx.fillStyle = theme.accentColor;
            ctx.globalAlpha = 0.78;
            ctx.beginPath();
            ctx.moveTo(0, -26);
            ctx.lineTo(9, -6);
            ctx.lineTo(4, 4);
            ctx.lineTo(-7, 4);
            ctx.lineTo(-10, -9);
            ctx.closePath();
            ctx.fill();
        } else if (prop === 'lava') {
            ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 26, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 13, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (prop === 'pillar') {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.68)';
            ctx.fillRect(-8, -32, 16, 34);
            ctx.fillStyle = theme.accentColor;
            ctx.fillRect(-10, -35, 20, 4);
        }
        ctx.restore();
    });

    // 5. Ambient particles
    ctx.save();
    for (let i = 0; i < 18; i++) {
        const seed = i * 47.3;
        const speed = theme.particleKind === 'embers' || theme.particleKind === 'sparks' ? 28 : 16;
        const px = (seed * 19 + timeSec * 14 * (i % 2 === 0 ? 1 : -0.6)) % ARENA_WIDTH;
        const safeX = px < 0 ? px + ARENA_WIDTH : px;
        const rawY =
            theme.particleKind === 'embers' || theme.particleKind === 'sparks'
                ? ARENA_HEIGHT - ((seed * 11 + timeSec * speed) % ARENA_HEIGHT)
                : (seed * 13 + timeSec * speed) % ARENA_HEIGHT;
        ctx.globalAlpha = 0.35 + Math.sin(timeSec * 3 + i) * 0.2;
        ctx.fillStyle =
            theme.particleKind === 'embers' || theme.particleKind === 'sparks'
                ? i % 2 === 0
                    ? '#fde047'
                    : '#fb923c'
                : theme.particleKind === 'void'
                  ? '#c084fc'
                  : '#ffffff';
        ctx.beginPath();
        ctx.arc(safeX, rawY, theme.particleKind === 'leaves' ? 3 : 2.1, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawMonsterShape(
    ctx: CanvasRenderingContext2D,
    visual: AzitMonsterVisualMeta,
    unit: AzitCombatFrameUnit,
    timeSec: number
) {
    const r = 18 * visual.scale;
    const pulse = Math.sin(timeSec * 5 + unit.x * 0.05);

    // Boss aura
    if (visual.isBoss) {
        ctx.save();
        ctx.strokeStyle = visual.auraColor;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 0.55 + pulse * 0.2;
        ctx.beginPath();
        ctx.ellipse(0, 2, r + 9, (r + 9) * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    ctx.scale(unit.facing, 1);

    switch (visual.shape) {
        case 'slime': {
            const squash = 1 + pulse * 0.06;
            ctx.fillStyle = visual.primaryColor;
            ctx.strokeStyle = visual.secondaryColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.52, r * squash, r * 0.78 / squash, 0, Math.PI, 0, false);
            ctx.quadraticCurveTo(r * squash, 2, 0, 2);
            ctx.quadraticCurveTo(-r * squash, 2, -r * squash, -r * 0.52);
            ctx.fill();
            ctx.stroke();
            break;
        }
        case 'goblin':
        case 'skeleton':
        case 'knight': {
            ctx.fillStyle = visual.secondaryColor;
            drawRoundedRect(ctx, -r * 0.55, -r * 1.45, r * 1.1, r * 1.25, 6);
            ctx.fill();
            ctx.fillStyle = visual.primaryColor;
            ctx.beginPath();
            ctx.arc(0, -r * 1.65, r * 0.52, 0, Math.PI * 2);
            ctx.fill();
            if (visual.shape === 'goblin') {
                // Pointy ears
                ctx.beginPath();
                ctx.moveTo(-r * 0.48, -r * 1.68);
                ctx.lineTo(-r * 0.9, -r * 1.9);
                ctx.lineTo(-r * 0.35, -r * 1.45);
                ctx.fill();
            }
            if (visual.shape === 'knight') {
                // Shield & crest
                ctx.fillStyle = visual.auraColor;
                ctx.fillRect(-r * 0.78, -r * 1.35, r * 0.35, r * 0.85);
            }
            break;
        }
        case 'spirit':
        case 'mage': {
            const floatY = Math.sin(timeSec * 4) * 4;
            ctx.translate(0, floatY);
            ctx.fillStyle = visual.primaryColor;
            ctx.beginPath();
            ctx.moveTo(0, -r * 2.1);
            ctx.quadraticCurveTo(r * 0.9, -r * 1.1, r * 0.55, -4);
            ctx.lineTo(-r * 0.55, -4);
            ctx.quadraticCurveTo(-r * 0.9, -r * 1.1, 0, -r * 2.1);
            ctx.fill();
            ctx.fillStyle = visual.secondaryColor;
            ctx.beginPath();
            ctx.arc(0, -r * 1.45, r * 0.42, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'treant':
        case 'golem': {
            ctx.fillStyle = visual.secondaryColor;
            drawRoundedRect(ctx, -r * 0.72, -r * 1.75, r * 1.44, r * 1.65, 8);
            ctx.fill();
            ctx.fillStyle = visual.primaryColor;
            drawRoundedRect(ctx, -r * 0.54, -r * 1.55, r * 1.08, r * 1.1, 6);
            ctx.fill();
            if (visual.shape === 'treant') {
                ctx.fillStyle = visual.auraColor;
                ctx.beginPath();
                ctx.arc(-6, -r * 1.85, r * 0.55, 0, Math.PI * 2);
                ctx.arc(8, -r * 1.78, r * 0.48, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        }
        case 'wyvern':
        case 'dragon': {
            const wingFlap = Math.sin(timeSec * 7) * 6;
            // Wings
            ctx.fillStyle = visual.secondaryColor;
            ctx.beginPath();
            ctx.moveTo(-4, -r * 1.2);
            ctx.lineTo(-r * 1.35, -r * 2.0 + wingFlap);
            ctx.lineTo(-r * 0.85, -r * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(4, -r * 1.2);
            ctx.lineTo(r * 1.25, -r * 1.9 + wingFlap);
            ctx.lineTo(r * 0.75, -r * 0.7);
            ctx.closePath();
            ctx.fill();
            // Body & Head
            ctx.fillStyle = visual.primaryColor;
            drawRoundedRect(ctx, -r * 0.6, -r * 1.45, r * 1.2, r * 1.25, 10);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(r * 0.25, -r * 1.65, r * 0.48, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
    }

    // Glowing monster eyes
    ctx.fillStyle = visual.eyeColor;
    ctx.beginPath();
    ctx.arc(r * 0.12, -r * (visual.shape === 'slime' ? 0.62 : 1.58), 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.34, -r * (visual.shape === 'slime' ? 0.62 : 1.58), 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Boss crown
    if (visual.isBoss) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        const crownY = -r * (visual.shape === 'slime' ? 1.15 : 2.15);
        ctx.moveTo(-9, crownY);
        ctx.lineTo(-10, crownY - 10);
        ctx.lineTo(-3, crownY - 5);
        ctx.lineTo(0, crownY - 12);
        ctx.lineTo(3, crownY - 5);
        ctx.lineTo(10, crownY - 10);
        ctx.lineTo(9, crownY);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawStatusDots(
    ctx: CanvasRenderingContext2D,
    statuses: AzitCombatStatusKind[],
    x: number,
    y: number
) {
    if (statuses.length === 0) return;
    const colorMap: Record<AzitCombatStatusKind, string> = {
        shield: '#38bdf8',
        regen: '#10b981',
        atkUp: '#f59e0b',
        defUp: '#60a5fa',
        defDown: '#f43f5e',
        burn: '#f97316',
        stun: '#fde047',
    };
    const startX = x - ((statuses.length - 1) * 7) / 2;
    statuses.forEach((st, idx) => {
        ctx.fillStyle = colorMap[st] ?? '#ffffff';
        ctx.beginPath();
        ctx.arc(startX + idx * 7, y, 2.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.8;
        ctx.stroke();
    });
}

function drawVfxEvent(ctx: CanvasRenderingContext2D, fx: AzitCombatVfxEvent) {
    ctx.save();
    switch (fx.kind) {
        case 'slash': {
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(fx.toX, fx.toY - 18, 22, -Math.PI * 0.75, Math.PI * 0.25);
            ctx.stroke();
            break;
        }
        case 'arrow': {
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(fx.fromX, fx.fromY - 22);
            ctx.lineTo(fx.toX, fx.toY - 22);
            ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(fx.toX, fx.toY - 22, 3.2, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'fireball': {
            const mx = (fx.fromX + fx.toX) / 2;
            const my = (fx.fromY + fx.toY) / 2 - 28;
            const grad = ctx.createRadialGradient(mx, my, 2, mx, my, 16);
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.5, fx.color);
            grad.addColorStop(1, 'rgba(239,68,68,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(mx, my, 16, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'heal': {
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.ellipse(fx.toX, fx.toY, 20, 9, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✚', fx.toX, fx.toY - 36);
            break;
        }
        case 'shield': {
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 2.4;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(fx.toX, fx.toY - 20, 24, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }
        case 'meteor':
        case 'whirlwind': {
            const rad = Math.min(72, Math.max(26, (fx.radius ?? 60) * 0.55));
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.72;
            ctx.beginPath();
            ctx.arc(fx.toX, fx.toY - 10, rad, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = fx.color;
            ctx.globalAlpha = 0.2;
            ctx.fill();
            break;
        }
        case 'dash': {
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(fx.fromX, fx.fromY - 18);
            ctx.lineTo(fx.toX, fx.toY - 18);
            ctx.stroke();
            break;
        }
        case 'hit':
        case 'status': {
            ctx.fillStyle = fx.color;
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.arc(fx.toX, fx.toY - 20, 11, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
    }
    ctx.restore();
}

export const AzitBattlefieldCanvas: React.FC<AzitBattlefieldCanvasProps> = ({
    gameState,
    nowMs,
    isActing = false,
    selectedExpeditionId = null,
    onSelectExpedition,
    onClaimExpedition,
}) => {
    const activeExps = gameState.activeExpeditions;
    const [internalExpId, setInternalExpId] = useState<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const spriteCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const popupsRef = useRef<FloatingPopup[]>([]);
    const lastVfxTickRef = useRef<number>(-1);
    const popupSeqRef = useRef<number>(1);

    const activeExp = useMemo(() => {
        if (activeExps.length === 0) return null;
        const preferred = selectedExpeditionId ?? internalExpId;
        return activeExps.find((e) => e.id === preferred) ?? activeExps[0];
    }, [activeExps, selectedExpeditionId, internalExpId]);

    const selectedZone = useMemo(
        () =>
            activeExp
                ? gameState.catalog.zones.find((z) => z.zoneId === activeExp.zoneId) ?? null
                : null,
        [activeExp, gameState.catalog.zones]
    );

    const activeExpId = activeExp?.id ?? null;
    const resolvedThemeId = activeExp
        ? resolveThemeIdForZone(activeExp, selectedZone?.zoneTheme)
        : undefined;
    const themeMeta = useMemo(
        () => getZoneThemeMeta(resolvedThemeId),
        [resolvedThemeId]
    );

    // Preload PNG sprites for allies once
    useEffect(() => {
        if (!activeExp) return;
        for (const code of activeExp.partyMercCodes) {
            if (spriteCacheRef.current.has(code)) continue;
            const sprite = getMercSpriteMeta(code) ?? getMercSpriteMeta('merc-leo');
            if (!sprite?.spriteUrl) continue;
            const img = new Image();
            img.src = sprite.spriteUrl;
            spriteCacheRef.current.set(code, img);
        }
    }, [activeExp]);

    const simCacheKey = useMemo(() => {
        if (!activeExp) return '';
        const snapKey =
            Array.isArray(activeExp.partySnapshot) && activeExp.partySnapshot.length > 0
                ? `snap:${activeExp.partySnapshot
                      .map((u) => `${u.unitId}:${u.level}:${u.maxHp}:${u.atk}:${u.mainSkillLevel}:${u.subSkillLevel}`)
                      .join(',')}`
                : `merc:${activeExp.partyMercCodes
                      .map((code) => {
                          const m = gameState.mercenaries.find((rec) => rec.mercCode === code);
                          return `${code}:${m?.level ?? 1}:${m?.mainSkill?.level ?? 1}:${m?.subSkill?.level ?? 1}`;
                      })
                      .join(',')}`;
        const monKey =
            Array.isArray(activeExp.monsters) && activeExp.monsters.length > 0
                ? `mon:${activeExp.monsters.map((m) => `${m.monsterId}:${m.maxHp}:${m.atk}`).join(',')}`
                : `zone:${activeExp.zoneId}`;
        const recipe = gameState.catalog.recipes.find((r) => r.recipeId === activeExp.dishRecipeId);
        const dishQuality = activeExp.dishQuality ?? 'normal';
        const recipeKey = recipe ? `${recipe.recipeId}:${dishQuality}` : `none:${dishQuality}`;
        const seed =
            typeof activeExp.battleSeed === 'number' && Number.isFinite(activeExp.battleSeed)
                ? activeExp.battleSeed
                : activeExp.id * 7919 + (activeExp.startedAtMs % 10000);
        return `${activeExp.id}|${activeExp.zoneId}|${seed}|${snapKey}|${monKey}|${recipeKey}`;
    }, [activeExp, gameState.mercenaries, gameState.catalog.recipes]);

    const previewSimCacheRef = useRef<{
        key: string;
        sim: ReturnType<typeof buildCampPreviewSimulation> | null;
    }>({ key: '', sim: null });

    const previewSim = useMemo(() => {
        if (!activeExp || !simCacheKey) {
            previewSimCacheRef.current = { key: '', sim: null };
            return null;
        }
        if (previewSimCacheRef.current.key === simCacheKey && previewSimCacheRef.current.sim) {
            return previewSimCacheRef.current.sim;
        }
        const allies = buildFallbackAllies(activeExp, gameState);
        const monsters = buildFallbackMonsters(activeExp, gameState);
        const recipe = gameState.catalog.recipes.find((r) => r.recipeId === activeExp.dishRecipeId);
        const dishBuffs = recipe
            ? getDishEffectiveBuffs(recipe, activeExp.dishQuality ?? 'normal')
            : undefined;
        const seed =
            typeof activeExp.battleSeed === 'number' && Number.isFinite(activeExp.battleSeed)
                ? activeExp.battleSeed
                : activeExp.id * 7919 + (activeExp.startedAtMs % 10000);

        const sim = buildCampPreviewSimulation({
            seed,
            allies,
            monsters,
            dishBuffs,
        });
        previewSimCacheRef.current = { key: simCacheKey, sim };
        return sim;
    }, [simCacheKey, activeExp, gameState]);

    const previewSimRef = useRef(previewSim);
    const themeMetaRef = useRef(themeMeta);

    useEffect(() => {
        previewSimRef.current = previewSim;
        themeMetaRef.current = themeMeta;
    }, [previewSim, themeMeta]);

    useEffect(() => {
        popupsRef.current = [];
        lastVfxTickRef.current = -1;
    }, [activeExpId]);

    useEffect(() => {
        if (!activeExpId || !previewSimRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rafId = 0;
        const startPerf = performance.now();

        const renderFrame = (perfNow: number) => {
            const sim = previewSimRef.current;
            if (!sim) return;
            const theme = themeMetaRef.current;
            const cycleDuration = Math.max(3000, sim.durationMs + 1500);

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const targetW = Math.round(ARENA_WIDTH * dpr);
            const targetH = Math.round(ARENA_HEIGHT * dpr);
            if (canvas.width !== targetW || canvas.height !== targetH) {
                canvas.width = targetW;
                canvas.height = targetH;
            }

            ctx.save();
            ctx.scale(dpr, dpr);

            const elapsedCycle = (perfNow - startPerf) % cycleDuration;
            if (elapsedCycle < 120) {
                lastVfxTickRef.current = -1;
            }
            const clampedElapsed = Math.min(elapsedCycle, sim.durationMs);
            const frame: AzitCombatFrame | null = interpolateCombatFrame(
                sim.frames,
                clampedElapsed
            );
            const timeSec = perfNow / 1000;

            drawBattlefieldBackground(ctx, theme, timeSec);

            if (frame) {
                if (frame.tick !== lastVfxTickRef.current && frame.effects.length > 0) {
                    lastVfxTickRef.current = frame.tick;
                    for (const fx of frame.effects) {
                        if (typeof fx.value === 'number' && fx.value > 0) {
                            popupsRef.current.push({
                                id: popupSeqRef.current++,
                                x: fx.toX + (Math.random() - 0.5) * 14,
                                y: fx.toY - 46,
                                text: fx.isHeal ? `+${fx.value}` : `-${fx.value}`,
                                color: fx.isHeal
                                    ? '#4ade80'
                                    : fx.isCrit
                                      ? '#fde047'
                                      : '#f8fafc',
                                isCrit: Boolean(fx.isCrit),
                                createdPerfMs: perfNow,
                            });
                        }
                    }
                    if (popupsRef.current.length > 24) {
                        popupsRef.current = popupsRef.current.slice(-24);
                    }
                }

                // Depth sort units by y
                const sortedUnits = [...frame.units].sort((a, b) => a.y - b.y);

                for (const unit of sortedUnits) {
                    const isMoving = unit.action === 'move';
                    const isAttacking =
                        unit.action === 'attack' ||
                        unit.action === 'skill_main' ||
                        unit.action === 'skill_sub';
                    const bobY = !unit.alive
                        ? 0
                        : isMoving
                          ? Math.abs(Math.sin(timeSec * 12 + unit.x * 0.04)) * -4
                          : Math.sin(timeSec * 3.5 + unit.y * 0.04) * 1.5;
                    const lungeX = !unit.alive
                        ? 0
                        : isAttacking
                          ? unit.facing * 5
                          : 0;

                    ctx.save();
                    ctx.translate(unit.x + lungeX, unit.y + bobY);
                    if (!unit.alive) {
                        ctx.globalAlpha = 0.35;
                    }

                    // Ground shadow
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
                    ctx.beginPath();
                    ctx.ellipse(0, 4 - bobY, 18, 7, 0, 0, Math.PI * 2);
                    ctx.fill();

                    if (unit.side === 'ally') {
                        const mercCode = unit.code as AzitMercCode;
                        const visual = getMercCombatVisual(mercCode) ?? getMercCombatVisual('merc-leo');
                        const spriteMeta = getMercSpriteMeta(mercCode) ?? getMercSpriteMeta('merc-leo');
                        const img = spriteCacheRef.current.get(unit.code);

                        if (unit.action === 'skill_main' || unit.action === 'skill_sub') {
                            ctx.strokeStyle =
                                unit.action === 'skill_main'
                                    ? (visual?.mainSkillColor ?? '#6366f1')
                                    : (visual?.subSkillColor ?? '#38bdf8');
                            ctx.lineWidth = 2.2;
                            ctx.beginPath();
                            ctx.ellipse(0, 3, 24, 10, 0, 0, Math.PI * 2);
                            ctx.stroke();
                        }

                        if (img && img.complete && img.naturalWidth > 0) {
                            ctx.save();
                            ctx.scale(unit.facing, 1);
                            const drawW = (spriteMeta?.spriteWidth ?? 86) * 0.92;
                            const drawH = (spriteMeta?.spriteHeight ?? 86) * 0.92;
                            ctx.drawImage(img, -drawW / 2, -drawH + 6, drawW, drawH);
                            ctx.restore();
                        } else {
                            ctx.fillStyle = visual?.roleColor ?? '#3b82f6';
                            ctx.beginPath();
                            ctx.arc(0, -20, 16, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.font = '16px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(unit.emoji, 0, -20);
                        }
                    } else {
                        const monsterVisual = getMonsterVisual(unit.code);
                        drawMonsterShape(ctx, monsterVisual, unit, timeSec);
                    }

                    // Overhead HP + Shield bar
                    const barW = unit.side === 'enemy' ? 46 : 44;
                    const barH = 5;
                    const barY = -58;
                    const hpRatio = Math.max(0, Math.min(1, unit.hp / Math.max(1, unit.maxHp)));
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
                    drawRoundedRect(ctx, -barW / 2 - 1, barY - 1, barW + 2, barH + 2, 3);
                    ctx.fill();

                    ctx.fillStyle = unit.side === 'ally' ? '#22c55e' : '#ef4444';
                    if (hpRatio > 0) {
                        drawRoundedRect(ctx, -barW / 2, barY, barW * hpRatio, barH, 2.5);
                        ctx.fill();
                    }

                    if (unit.shield > 0) {
                        const shieldRatio = Math.min(1, unit.shield / Math.max(1, unit.maxHp * 0.5));
                        ctx.fillStyle = '#38bdf8';
                        drawRoundedRect(ctx, -barW / 2, barY - 3, barW * shieldRatio, 2.5, 1.5);
                        ctx.fill();
                    }

                    // Status indicators
                    drawStatusDots(ctx, unit.statuses, 0, barY - 6);

                    // Active skill callout pill
                    if (unit.alive && unit.activeSkillName) {
                        ctx.font = 'bold 9.5px sans-serif';
                        const labelW = Math.min(110, ctx.measureText(unit.activeSkillName).width + 12);
                        ctx.fillStyle =
                            unit.side === 'ally'
                                ? 'rgba(79, 70, 229, 0.92)'
                                : 'rgba(190, 18, 60, 0.92)';
                        drawRoundedRect(ctx, -labelW / 2, barY - 22, labelW, 14, 7);
                        ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(unit.activeSkillName, 0, barY - 15);
                    }

                    // Unit nameplate
                    ctx.font = 'bold 9.5px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
                    const nameW = Math.min(92, ctx.measureText(unit.name).width + 10);
                    drawRoundedRect(ctx, -nameW / 2, 8, nameW, 13, 6);
                    ctx.fill();
                    ctx.fillStyle = unit.side === 'ally' ? '#e0e7ff' : '#fecdd3';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(unit.name, 0, 14.5);

                    ctx.restore();
                }

                // Render active VFX
                for (const fx of frame.effects) {
                    drawVfxEvent(ctx, fx);
                }

                // Render floating damage/heal numbers
                popupsRef.current = popupsRef.current.filter((p) => perfNow - p.createdPerfMs < 750);
                for (const pop of popupsRef.current) {
                    const age = (perfNow - pop.createdPerfMs) / 750;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, 1 - age);
                    ctx.font = pop.isCrit ? '900 13px sans-serif' : '800 11px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 2.6;
                    const py = pop.y - age * 22;
                    ctx.strokeText(pop.text, pop.x, py);
                    ctx.fillStyle = pop.color;
                    ctx.fillText(pop.text, pop.x, py);
                    ctx.restore();
                }
            }

            ctx.restore();
            rafId = requestAnimationFrame(renderFrame);
        };

        rafId = requestAnimationFrame(renderFrame);
        return () => cancelAnimationFrame(rafId);
    }, [activeExpId]);

    // R1: Return null immediately when no expedition is active (zero canvas, zero rAF)
    if (activeExps.length === 0 || !activeExp) {
        return null;
    }

    const isFinished = activeExp.endsAtMs <= nowMs;

    const handleSelect = (expId: number) => {
        setInternalExpId(expId);
        onSelectExpedition?.(expId);
    };

    return (
        <div
            data-camp-battlefield="true"
            className="w-full rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-lg p-2.5 sm:p-3 space-y-2 overflow-hidden"
        >
            {/* Multi-expedition switcher when 2+ active */}
            {activeExps.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {activeExps.map((exp) => {
                        const zone = gameState.catalog.zones.find((z) => z.zoneId === exp.zoneId);
                        const isPicked = exp.id === activeExp.id;
                        const ready = exp.endsAtMs <= nowMs;
                        return (
                            <button
                                key={`battlefield-switch-${exp.id}`}
                                type="button"
                                onClick={() => handleSelect(exp.id)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 min-w-0 ${
                                    isPicked
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                <span className="truncate">
                                    {zone?.emoji} {zone?.name ?? exp.zoneId} ·{' '}
                                    {exp.groupName || '원정대'}
                                </span>
                                <span
                                    className={`px-1.5 py-0.2 rounded font-mono text-[9.5px] shrink-0 ${
                                        ready
                                            ? 'bg-amber-400 text-slate-950'
                                            : 'bg-slate-950/60 text-indigo-200'
                                    }`}
                                >
                                    {ready ? '정산!' : formatCountdownLabel(exp.endsAtMs, nowMs)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* HUD + Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700/90 bg-slate-950">
                <div className="px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-black shrink-0">
                            ⚔️ 실시간 전장
                        </span>
                        <span className="font-black text-slate-100 truncate">
                            {selectedZone?.emoji} {selectedZone?.name ?? activeExp.zoneId}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-200 font-bold shrink-0">
                            {activeExp.groupName || `${activeExp.partyMercCodes.length}인 원정대`}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {isFinished && onClaimExpedition ? (
                            <button
                                type="button"
                                disabled={isActing}
                                onClick={() => onClaimExpedition(activeExp.id)}
                                className="px-2.5 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer disabled:opacity-50"
                            >
                                🏆 정산 가능
                            </button>
                        ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-emerald-300 font-mono font-black">
                                자율 교전 · {formatCountdownLabel(activeExp.endsAtMs, nowMs)}
                            </span>
                        )}
                    </div>
                </div>

                <canvas
                    ref={canvasRef}
                    data-testid="azit-battlefield-canvas"
                    width={ARENA_WIDTH}
                    height={ARENA_HEIGHT}
                    className="w-full h-[176px] sm:h-[216px] md:h-[244px] block bg-slate-950"
                />
            </div>
        </div>
    );
};
