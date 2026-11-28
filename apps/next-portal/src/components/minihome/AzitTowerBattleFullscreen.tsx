'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
    AzitCombatFrame,
    AzitCombatFrameUnit,
    AzitCombatStatusKind,
    AzitCombatVfxEvent,
    AzitCropId,
    AzitFullGameState,
    AzitItemId,
    AzitMaterialId,
    AzitMercCode,
    AzitTowerBattleResponse,
    AzitTowerThemeId,
} from '@/types/azit-game.types';
import { ARENA_HEIGHT, ARENA_WIDTH, MAX_TOWER_FLOOR } from '@/types/azit-game.types';
import { interpolateCombatFrame } from '@/utils/azitCombatEngine';
import {
    getItemVisualMeta,
    getMercCombatVisual,
    getMercSpriteMeta,
    getMonsterVisual,
    getTowerThemeMeta,
    type AzitMonsterVisualMeta,
    type AzitTowerThemeMeta,
} from '@/data/azitCharacterAssets';

export interface AzitTowerBattleFullscreenProps {
    battleResponse: AzitTowerBattleResponse | null;
    gameState: AzitFullGameState;
    isActing: boolean;
    canUseElixir: boolean;
    onClose: () => void;
    onRetryFloor: (floor: number) => Promise<void>;
    onChallengeNextFloor?: (nextFloor: number) => Promise<void>;
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

const THEME_BADGE_CLASSES: Record<AzitTowerThemeId, string> = {
    'tower-1-forgotten': 'bg-slate-700 text-slate-100 border-slate-500',
    'tower-2-spirit': 'bg-emerald-700 text-emerald-50 border-emerald-500',
    'tower-3-obsidian': 'bg-indigo-700 text-indigo-50 border-indigo-400',
    'tower-4-wyvern': 'bg-orange-700 text-orange-50 border-orange-400',
    'tower-5-abyss': 'bg-rose-700 text-rose-50 border-rose-400',
};

const STATUS_BADGE_META: Record<AzitCombatStatusKind, { label: string; cls: string }> = {
    shield: { label: '보호막', cls: 'bg-sky-500/25 text-sky-200 border-sky-400/50' },
    regen: { label: '재생', cls: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50' },
    atkUp: { label: '공격↑', cls: 'bg-amber-500/25 text-amber-200 border-amber-400/50' },
    defUp: { label: '방어↑', cls: 'bg-blue-500/25 text-blue-200 border-blue-400/50' },
    defDown: { label: '방어↓', cls: 'bg-rose-500/25 text-rose-200 border-rose-400/50' },
    burn: { label: '화상', cls: 'bg-orange-500/25 text-orange-200 border-orange-400/50' },
    stun: { label: '기절', cls: 'bg-yellow-500/25 text-yellow-200 border-yellow-400/50' },
};

function resolveThemeIdByFloor(floor: number): AzitTowerThemeId {
    if (floor <= 40) return 'tower-1-forgotten';
    if (floor <= 80) return 'tower-2-spirit';
    if (floor <= 120) return 'tower-3-obsidian';
    if (floor <= 160) return 'tower-4-wyvern';
    return 'tower-5-abyss';
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

function drawTowerArenaBackground(
    ctx: CanvasRenderingContext2D,
    theme: AzitTowerThemeMeta,
    timeSec: number,
    floor: number
) {
    // 1. Tower chamber wall gradient
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 128);
    wallGrad.addColorStop(0, theme.skyTop);
    wallGrad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, 128);

    // 2. Gothic stone arches & pillars
    const pillarPositions = [60, 210, 400, 590, 740];
    for (let i = 0; i < pillarPositions.length; i++) {
        const px = pillarPositions[i];
        ctx.fillStyle = theme.pillarColor;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(px - 14, 0, 28, 128);
        ctx.globalAlpha = 0.65;
        ctx.fillRect(px - 18, 108, 36, 16);

        // Wall torch beside pillar
        if (i % 2 === 0 || i === 2) {
            const flicker = Math.sin(timeSec * 11 + i * 2.1) * 1.8;
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = theme.torchColor;
            ctx.beginPath();
            ctx.arc(px, 54, 22 + flicker, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.95;
            ctx.fillStyle = '#451a03';
            ctx.fillRect(px - 2.5, 58, 5, 14);
            ctx.fillStyle = theme.torchColor;
            ctx.beginPath();
            ctx.arc(px, 54, 5.5 + flicker * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef9c3';
            ctx.beginPath();
            ctx.arc(px, 55, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // Subtle floor watermark rune on floor center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${floor}F`, ARENA_WIDTH / 2, 72);

    // 3. Chamber stone floor
    const floorGrad = ctx.createLinearGradient(0, 120, 0, ARENA_HEIGHT);
    floorGrad.addColorStop(0, theme.floorColor);
    floorGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 120, ARENA_WIDTH, ARENA_HEIGHT - 120);

    // Perspective stone tile grid & battle lanes
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.1;
    for (const laneY of [162, 222, 284]) {
        ctx.beginPath();
        ctx.moveTo(20, laneY);
        ctx.lineTo(ARENA_WIDTH - 20, laneY);
        ctx.stroke();
    }
    for (let x = 80; x < ARENA_WIDTH; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 120);
        ctx.lineTo(x + (x - ARENA_WIDTH / 2) * 0.25, ARENA_HEIGHT);
        ctx.stroke();
    }
    ctx.restore();

    // 4. Ambient particles matching tower theme
    ctx.save();
    for (let i = 0; i < 22; i++) {
        const seed = i * 53.7;
        const rising = theme.particleKind === 'embers' || theme.particleKind === 'sparks';
        const speed = rising ? 28 : 16;
        const rawX = (seed * 17 + timeSec * 12 * (i % 2 === 0 ? 1 : -0.7)) % ARENA_WIDTH;
        const px = rawX < 0 ? rawX + ARENA_WIDTH : rawX;
        const py = rising
            ? ARENA_HEIGHT - ((seed * 13 + timeSec * speed) % ARENA_HEIGHT)
            : (seed * 11 + timeSec * speed) % ARENA_HEIGHT;
        ctx.globalAlpha = 0.32 + Math.sin(timeSec * 3.2 + i) * 0.18;
        ctx.fillStyle =
            theme.particleKind === 'embers' || theme.particleKind === 'sparks'
                ? theme.torchColor
                : theme.particleKind === 'leaves'
                  ? '#6ee7b7'
                  : theme.particleKind === 'void'
                    ? '#fb7185'
                    : '#cbd5e1';
        ctx.beginPath();
        ctx.arc(px, py, theme.particleKind === 'leaves' ? 3 : 2.1, 0, Math.PI * 2);
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
            ctx.ellipse(0, -r * 0.52, r * squash, (r * 0.78) / squash, 0, Math.PI, 0, false);
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
                ctx.beginPath();
                ctx.moveTo(-r * 0.48, -r * 1.68);
                ctx.lineTo(-r * 0.9, -r * 1.9);
                ctx.lineTo(-r * 0.35, -r * 1.45);
                ctx.fill();
            }
            if (visual.shape === 'knight') {
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
            ctx.fillStyle = visual.primaryColor;
            drawRoundedRect(ctx, -r * 0.6, -r * 1.45, r * 1.2, r * 1.25, 10);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(r * 0.25, -r * 1.65, r * 0.48, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
    }

    ctx.fillStyle = visual.eyeColor;
    ctx.beginPath();
    ctx.arc(r * 0.12, -r * (visual.shape === 'slime' ? 0.62 : 1.58), 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.34, -r * (visual.shape === 'slime' ? 0.62 : 1.58), 2.5, 0, Math.PI * 2);
    ctx.fill();

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

export const AzitTowerBattleFullscreen: React.FC<AzitTowerBattleFullscreenProps> = ({
    battleResponse,
    gameState,
    isActing,
    canUseElixir,
    onClose,
    onRetryFloor,
    onChallengeNextFloor,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const spriteCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const popupsRef = useRef<FloatingPopup[]>([]);
    const lastVfxTickRef = useRef<number>(-1);
    const popupSeqRef = useRef<number>(1);

    const [speed, setSpeed] = useState<1 | 2>(1);
    const speedRef = useRef<1 | 2>(1);
    const elapsedMsRef = useRef<number>(0);
    const [hudElapsedMs, setHudElapsedMs] = useState<number>(0);
    const [hudFrame, setHudFrame] = useState<AzitCombatFrame | null>(null);
    const [isPlaybackComplete, setIsPlaybackComplete] = useState<boolean>(false);
    const [isDomFullscreen, setIsDomFullscreen] = useState<boolean>(false);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    const floorSummary = useMemo(() => {
        if (!battleResponse) return null;
        return (
            gameState.catalog.towerFloorsSummary?.find((f) => f.floor === battleResponse.floor) ?? null
        );
    }, [battleResponse, gameState.catalog.towerFloorsSummary]);

    const themeId: AzitTowerThemeId = useMemo(() => {
        if (floorSummary) return floorSummary.themeId;
        return resolveThemeIdByFloor(battleResponse?.floor ?? 1);
    }, [floorSummary, battleResponse?.floor]);

    const themeMeta = useMemo(() => getTowerThemeMeta(themeId), [themeId]);

    // Lock body scroll while fullscreen overlay is mounted
    useEffect(() => {
        if (!battleResponse) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [battleResponse]);

    // Track browser Fullscreen API status safely
    useEffect(() => {
        const handleFsChange = () => {
            setIsDomFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Escape key closes fullscreen overlay when not acting
    useEffect(() => {
        if (!battleResponse) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isActing && !document.fullscreenElement) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [battleResponse, isActing, onClose]);

    // Preload ally PNG sprites for units in frames
    useEffect(() => {
        if (!battleResponse) return;
        const firstFrame = battleResponse.frames[0];
        if (!firstFrame) return;
        for (const unit of firstFrame.units) {
            if (unit.side !== 'ally') continue;
            if (spriteCacheRef.current.has(unit.code)) continue;
            const sprite =
                getMercSpriteMeta(unit.code as AzitMercCode) ?? getMercSpriteMeta('merc-leo');
            if (!sprite?.spriteUrl) continue;
            const img = new Image();
            img.src = sprite.spriteUrl;
            spriteCacheRef.current.set(unit.code, img);
        }
    }, [battleResponse]);

    // Reset & drive 60fps Canvas playback when battleResponse changes
    useEffect(() => {
        if (!battleResponse) return;
        popupsRef.current = [];
        lastVfxTickRef.current = -1;
        elapsedMsRef.current = 0;

        const frames = battleResponse.frames;
        const lastFrameMs = frames.length > 0 ? frames[frames.length - 1].timeMs : 0;
        const totalMs = Math.max(battleResponse.durationMs, lastFrameMs);

        if (frames.length === 0 || totalMs <= 0) {
            setHudElapsedMs(totalMs);
            setHudFrame(frames[frames.length - 1] ?? null);
            setIsPlaybackComplete(true);
            return;
        }

        setHudElapsedMs(0);
        setHudFrame(frames[0]);
        setIsPlaybackComplete(false);

        let rafId = 0;
        let lastPerf = performance.now();
        let lastHudEmitPerf = 0;
        let completed = false;

        const tickRender = (perfNow: number) => {
            const dt = Math.min(100, Math.max(0, perfNow - lastPerf));
            lastPerf = perfNow;

            if (!completed) {
                elapsedMsRef.current = Math.min(totalMs, elapsedMsRef.current + dt * speedRef.current);
                if (elapsedMsRef.current >= totalMs) {
                    completed = true;
                    setHudElapsedMs(totalMs);
                    setHudFrame(frames[frames.length - 1] ?? null);
                    setIsPlaybackComplete(true);
                }
            }

            const frame = interpolateCombatFrame(frames, elapsedMsRef.current);
            if (!completed && perfNow - lastHudEmitPerf >= 100) {
                lastHudEmitPerf = perfNow;
                setHudElapsedMs(Math.round(elapsedMsRef.current));
                if (frame) {
                    setHudFrame(frame);
                }
            }

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const targetW = Math.round(ARENA_WIDTH * dpr);
                const targetH = Math.round(ARENA_HEIGHT * dpr);
                if (canvas.width !== targetW || canvas.height !== targetH) {
                    canvas.width = targetW;
                    canvas.height = targetH;
                }

                ctx.save();
                ctx.scale(dpr, dpr);

                const timeSec = perfNow / 1000;
                drawTowerArenaBackground(ctx, themeMeta, timeSec, battleResponse.floor);

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
                        const lungeX = !unit.alive ? 0 : isAttacking ? unit.facing * 5 : 0;

                        ctx.save();
                        ctx.translate(unit.x + lungeX, unit.y + bobY);
                        if (!unit.alive) {
                            ctx.globalAlpha = 0.35;
                        }

                        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
                        ctx.beginPath();
                        ctx.ellipse(0, 4 - bobY, 18, 7, 0, 0, Math.PI * 2);
                        ctx.fill();

                        if (unit.side === 'ally') {
                            const mercCode = unit.code as AzitMercCode;
                            const visual =
                                getMercCombatVisual(mercCode) ?? getMercCombatVisual('merc-leo');
                            const spriteMeta =
                                getMercSpriteMeta(mercCode) ?? getMercSpriteMeta('merc-leo');
                            const img = spriteCacheRef.current.get(unit.code);

                            if (unit.action === 'skill_main' || unit.action === 'skill_sub') {
                                ctx.strokeStyle =
                                    unit.action === 'skill_main'
                                        ? (visual?.mainSkillColor ?? '#6366f1')
                                        : (visual?.subSkillColor ?? '#38bdf8');
                                ctx.lineWidth = 2.4;
                                ctx.beginPath();
                                ctx.ellipse(0, 3, 25, 11, 0, 0, Math.PI * 2);
                                ctx.stroke();
                            }

                            if (img && img.complete && img.naturalWidth > 0) {
                                ctx.save();
                                ctx.scale(unit.facing, 1);
                                const drawW = (spriteMeta?.spriteWidth ?? 86) * 0.94;
                                const drawH = (spriteMeta?.spriteHeight ?? 86) * 0.94;
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
                        const barW = unit.side === 'enemy' ? 48 : 44;
                        const barH = 5;
                        const barY = -58;
                        const hpRatio = Math.max(0, Math.min(1, unit.hp / Math.max(1, unit.maxHp)));
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                        drawRoundedRect(ctx, -barW / 2 - 1, barY - 1, barW + 2, barH + 2, 3);
                        ctx.fill();

                        ctx.fillStyle = unit.side === 'ally' ? '#22c55e' : '#ef4444';
                        if (hpRatio > 0) {
                            drawRoundedRect(ctx, -barW / 2, barY, barW * hpRatio, barH, 2.5);
                            ctx.fill();
                        }

                        if (unit.shield > 0) {
                            const shieldRatio = Math.min(
                                1,
                                unit.shield / Math.max(1, unit.maxHp * 0.5)
                            );
                            ctx.fillStyle = '#38bdf8';
                            drawRoundedRect(ctx, -barW / 2, barY - 3, barW * shieldRatio, 2.5, 1.5);
                            ctx.fill();
                        }

                        drawStatusDots(ctx, unit.statuses, 0, barY - 6);

                        if (unit.alive && unit.activeSkillName) {
                            ctx.font = 'bold 9.5px sans-serif';
                            const labelW = Math.min(
                                118,
                                ctx.measureText(unit.activeSkillName).width + 12
                            );
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

                        ctx.font = 'bold 9.5px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
                        const nameW = Math.min(96, ctx.measureText(unit.name).width + 10);
                        drawRoundedRect(ctx, -nameW / 2, 8, nameW, 13, 6);
                        ctx.fill();
                        ctx.fillStyle = unit.side === 'ally' ? '#e0e7ff' : '#fecdd3';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(unit.name, 0, 14.5);

                        ctx.restore();
                    }

                    for (const fx of frame.effects) {
                        drawVfxEvent(ctx, fx);
                    }

                    popupsRef.current = popupsRef.current.filter(
                        (p) => perfNow - p.createdPerfMs < 750
                    );
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
            }

            rafId = requestAnimationFrame(tickRender);
        };

        rafId = requestAnimationFrame(tickRender);
        return () => cancelAnimationFrame(rafId);
    }, [battleResponse, themeMeta]);

    const handleSkipToResult = () => {
        if (!battleResponse) return;
        const frames = battleResponse.frames;
        const lastFrameMs = frames.length > 0 ? frames[frames.length - 1].timeMs : 0;
        const totalMs = Math.max(battleResponse.durationMs, lastFrameMs);
        elapsedMsRef.current = totalMs;
        setHudElapsedMs(totalMs);
        setHudFrame(frames[frames.length - 1] ?? null);
        setIsPlaybackComplete(true);
    };

    const handleToggleDomFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await containerRef.current?.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            // Optional browser Fullscreen API — fixed inset-0 z-[70] remains active
        }
    };

    if (!battleResponse) return null;

    const lastFrameMs =
        battleResponse.frames.length > 0
            ? battleResponse.frames[battleResponse.frames.length - 1].timeMs
            : 0;
    const totalDurationMs = Math.max(battleResponse.durationMs, lastFrameMs);
    const activeUnits = hudFrame?.units ?? battleResponse.frames[0]?.units ?? [];
    const allyUnits = activeUnits.filter((u) => u.side === 'ally');
    const enemyUnits = activeUnits.filter((u) => u.side === 'enemy');

    const materialEntries = Object.entries(battleResponse.rewards.materials) as Array<
        [AzitMaterialId, number]
    >;
    const cropEntries = Object.entries(battleResponse.rewards.crops) as Array<[AzitCropId, number]>;
    const itemEntries = Object.entries(battleResponse.rewards.items) as Array<[AzitItemId, number]>;

    return (
        <div
            ref={containerRef}
            data-tower-fullscreen="true"
            data-testid="azit-tower-fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label={`베라의 탑 ${battleResponse.floor}층 실시간 자동 전투`}
            className="fixed inset-0 z-[70] bg-slate-950 text-white flex flex-col overflow-hidden min-w-0"
        >
            {/* Top HUD */}
            <div className="px-3 sm:px-5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center gap-2 shrink-0 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    <span
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-black shrink-0 ${
                            THEME_BADGE_CLASSES[themeId]
                        }`}
                    >
                        {themeMeta.name}
                    </span>
                    <h2 className="text-xs sm:text-sm font-black text-white truncate">
                        🏰 {battleResponse.floor}층 {floorSummary?.name ?? '수호전'}
                    </h2>
                    {floorSummary?.isBoss && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black shrink-0">
                            {floorSummary.floorType === 'major_boss' ? '👑 대보스' : '⚔️ 보스'}
                        </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 font-mono text-[10px] font-black shrink-0">
                        {(hudElapsedMs / 1000).toFixed(1)}s / {(totalDurationMs / 1000).toFixed(1)}s
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        data-testid="azit-tower-speed-btn"
                        onClick={() => setSpeed((prev) => (prev === 1 ? 2 : 1))}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black border cursor-pointer transition-all ${
                            speed === 2
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        {speed === 1 ? '⚡ 1x → 2x' : '⚡ 2x → 1x'}
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleToggleDomFullscreen()}
                        className="hidden sm:inline-flex px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-black cursor-pointer"
                    >
                        {isDomFullscreen ? '⛶ 창모드' : '⛶ 전체화면'}
                    </button>

                    {!isPlaybackComplete && (
                        <button
                            type="button"
                            data-testid="azit-tower-skip-btn"
                            onClick={handleSkipToResult}
                            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black cursor-pointer"
                        >
                            ⏭ 결과 보기
                        </button>
                    )}

                    <button
                        type="button"
                        data-testid="azit-tower-close-btn"
                        disabled={isActing}
                        onClick={onClose}
                        aria-label="전투 종료"
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-black cursor-pointer disabled:opacity-50"
                    >
                        × 나가기
                    </button>
                </div>
            </div>

            {/* Center Battlefield Canvas */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
                {battleResponse.frames.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 text-center space-y-2 max-w-md">
                        <div className="text-sm font-black text-slate-200">
                            전투 리플레이 프레임이 없습니다.
                        </div>
                        <p className="text-xs text-slate-400">
                            서버 전투 결과 및 전투 로그를 확인하세요.
                        </p>
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        data-testid="azit-tower-canvas"
                        width={ARENA_WIDTH}
                        height={ARENA_HEIGHT}
                        className="w-full max-w-5xl max-h-full aspect-[800/360] rounded-2xl border border-slate-700/90 bg-slate-950 shadow-2xl block"
                    />
                )}

                {/* Post-Battle Result Overlay */}
                {isPlaybackComplete && (
                    <div
                        data-tower-result={battleResponse.won ? 'won' : 'lost'}
                        data-testid="azit-tower-result"
                        className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                    >
                        <div className="w-full max-w-lg my-auto rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-4 sm:p-6 space-y-4 text-white min-w-0">
                            {battleResponse.won ? (
                                <>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-black mb-1.5">
                                                {battleResponse.isFirstClear
                                                    ? '🌟 최초 클리어 보상!'
                                                    : '🔄 반복 정복 보상'}
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-black text-white">
                                                🏆 {battleResponse.floor}층 공략 성공!
                                            </h3>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-xl bg-indigo-600/80 text-xs font-mono font-black shrink-0">
                                            {battleResponse.floor} / {MAX_TOWER_FLOOR}F
                                        </span>
                                    </div>

                                    {/* Itemized R5 Rewards */}
                                    <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2.5">
                                        <div className="text-xs font-black text-slate-300">
                                            🎁 획득 보상 내역
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                            <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/30">
                                                <div className="text-[10px] text-slate-400 font-bold">
                                                    아지트 골드
                                                </div>
                                                <div className="text-sm font-black font-mono text-amber-300">
                                                    +{battleResponse.rewards.veraPoints.toLocaleString()} P
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-xl bg-slate-900/90 border border-indigo-500/30">
                                                <div className="text-[10px] text-slate-400 font-bold">
                                                    용병 전투 EXP
                                                </div>
                                                <div className="text-sm font-black font-mono text-indigo-300">
                                                    +{battleResponse.rewards.mercXp.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                                                <div className="text-[10px] text-slate-400 font-bold">
                                                    아지트 EXP
                                                </div>
                                                <div className="text-sm font-black font-mono text-emerald-300">
                                                    +{battleResponse.rewards.azitXp.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {(materialEntries.length > 0 ||
                                            cropEntries.length > 0 ||
                                            itemEntries.length > 0) && (
                                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-700/80">
                                                {materialEntries.map(([matId, qty]) => {
                                                    const mat = gameState.catalog.materials.find(
                                                        (m) => m.materialId === matId
                                                    );
                                                    return (
                                                        <span
                                                            key={matId}
                                                            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-200"
                                                        >
                                                            {mat?.emoji ?? '🪨'} {mat?.name ?? matId} x{qty}
                                                        </span>
                                                    );
                                                })}
                                                {cropEntries.map(([cropId, qty]) => {
                                                    const crop = gameState.catalog.crops.find(
                                                        (c) => c.cropId === cropId
                                                    );
                                                    return (
                                                        <span
                                                            key={cropId}
                                                            className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-[11px] font-bold text-emerald-200"
                                                        >
                                                            {crop?.emoji ?? '🌿'} {crop?.name ?? cropId} x{qty}
                                                        </span>
                                                    );
                                                })}
                                                {itemEntries.map(([itemId, qty]) => {
                                                    const itemCat = gameState.catalog.items?.find(
                                                        (it) => it.itemId === itemId
                                                    );
                                                    const vis = getItemVisualMeta(itemId);
                                                    return (
                                                        <span
                                                            key={itemId}
                                                            className="px-2 py-0.5 rounded-lg bg-indigo-950/90 border border-indigo-600/70 text-[11px] font-black text-indigo-200"
                                                        >
                                                            {vis.emoji} {itemCat?.name ?? itemId} x{qty}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="text-[10px] font-semibold text-slate-400">
                                            💡 출전 용병에게 전투 경험치가 지급되어 조건 달성 시 자동으로 레벨업합니다.
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isActing}
                                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black cursor-pointer disabled:opacity-50"
                                        >
                                            탑 로비로
                                        </button>
                                        {battleResponse.floor < MAX_TOWER_FLOOR && onChallengeNextFloor && (
                                            <button
                                                type="button"
                                                data-testid="azit-tower-next-floor-btn"
                                                disabled={isActing}
                                                onClick={() =>
                                                    void onChallengeNextFloor(battleResponse.floor + 1)
                                                }
                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-black cursor-pointer shadow-lg disabled:opacity-50"
                                            >
                                                {isActing
                                                    ? '전투 준비 중...'
                                                    : `⚔️ 다음 층 도전 (${battleResponse.floor + 1}F)`}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-200 text-[11px] font-black">
                                            전투 패배
                                        </span>
                                        <h3 className="text-lg sm:text-xl font-black text-white">
                                            💔 {battleResponse.floor}층 공략 실패...
                                        </h3>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-100 space-y-1">
                                        <div className="text-xs font-black">
                                            🛡️ 패배 — 용병 상태 100% 회복 (사망 패널티 및 부활 아이템 소모 없음)
                                        </div>
                                        <p className="text-[11px] text-emerald-200/90 font-semibold">
                                            베라의 탑 수호 결계 덕분에 부활 아이템 소모나 전투불능 상태 없이 즉시 재도전하거나 파티를 재편성할 수 있습니다.
                                        </p>
                                        {!canUseElixir && (
                                            <p className="text-[10px] text-amber-300 font-bold">
                                                ℹ️ 보유한 투지의 비약이 없어 재도전 시 비약 버프 없이 진행됩니다.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isActing}
                                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black cursor-pointer disabled:opacity-50"
                                        >
                                            편성 변경
                                        </button>
                                        <button
                                            type="button"
                                            data-testid="azit-tower-retry-btn"
                                            disabled={isActing}
                                            onClick={() => void onRetryFloor(battleResponse.floor)}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black cursor-pointer shadow-lg disabled:opacity-50"
                                        >
                                            {isActing ? '전장 재진입 중...' : '🔄 즉시 다시 도전'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom HUD: Live Unit Cards + Battle Log */}
            <div className="px-3 sm:px-5 py-2.5 bg-slate-900/95 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-2.5 shrink-0 min-w-0">
                {/* Ally & Enemy Unit Strips */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                    {/* Allies */}
                    <div className="space-y-1 min-w-0">
                        <div className="text-[10px] font-black text-indigo-300">🛡️ 아군 용병</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {allyUnits.map((u) => {
                                const hpPct = Math.max(
                                    0,
                                    Math.min(100, Math.round((u.hp / Math.max(1, u.maxHp)) * 100))
                                );
                                const shieldPct = Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        Math.round((u.shield / Math.max(1, u.maxHp * 0.5)) * 100)
                                    )
                                );
                                return (
                                    <div
                                        key={u.unitId}
                                        className={`p-1.5 rounded-xl border text-[10px] min-w-0 ${
                                            u.alive
                                                ? 'bg-slate-800/90 border-slate-700'
                                                : 'bg-slate-950/80 border-rose-900/70 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1 min-w-0">
                                            <span className="font-black text-slate-100 truncate">
                                                {u.emoji} {u.name}
                                            </span>
                                            {!u.alive && (
                                                <span className="text-[9px] font-black text-rose-400 shrink-0">
                                                    KO
                                                </span>
                                            )}
                                        </div>
                                        <svg
                                            viewBox="0 0 100 6"
                                            className="w-full h-1.5 rounded-full overflow-hidden mt-1"
                                            aria-label={`${u.name} HP ${hpPct}%`}
                                        >
                                            <rect x="0" y="0" width="100" height="6" fill="#0f172a" />
                                            <rect
                                                x="0"
                                                y="0"
                                                width={hpPct}
                                                height="6"
                                                fill="#22c55e"
                                            />
                                        </svg>
                                        {u.shield > 0 && (
                                            <svg
                                                viewBox="0 0 100 4"
                                                className="w-full h-1 rounded-full overflow-hidden mt-0.5"
                                                aria-label={`${u.name} 보호막`}
                                            >
                                                <rect x="0" y="0" width="100" height="4" fill="#0f172a" />
                                                <rect
                                                    x="0"
                                                    y="0"
                                                    width={shieldPct}
                                                    height="4"
                                                    fill="#38bdf8"
                                                />
                                            </svg>
                                        )}
                                        <div className="flex flex-wrap items-center gap-1 mt-1 min-w-0">
                                            {u.activeSkillName && (
                                                <span className="px-1 rounded bg-indigo-600 text-white text-[9px] font-black truncate max-w-full">
                                                    {u.activeSkillName}
                                                </span>
                                            )}
                                            {u.statuses.slice(0, 2).map((st) => {
                                                const meta = STATUS_BADGE_META[st];
                                                return (
                                                    <span
                                                        key={st}
                                                        className={`px-1 rounded border text-[8.5px] font-bold ${
                                                            meta?.cls ??
                                                            'bg-slate-700/50 text-slate-200 border-slate-500/50'
                                                        }`}
                                                    >
                                                        {meta?.label ?? String(st)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Enemies */}
                    <div className="space-y-1 min-w-0">
                        <div className="text-[10px] font-black text-rose-300">👾 탑 수호 몬스터</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {enemyUnits.map((u) => {
                                const hpPct = Math.max(
                                    0,
                                    Math.min(100, Math.round((u.hp / Math.max(1, u.maxHp)) * 100))
                                );
                                return (
                                    <div
                                        key={u.unitId}
                                        className={`p-1.5 rounded-xl border text-[10px] min-w-0 ${
                                            u.alive
                                                ? 'bg-slate-800/90 border-slate-700'
                                                : 'bg-slate-950/80 border-slate-800 opacity-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1 min-w-0">
                                            <span className="font-black text-rose-100 truncate">
                                                {u.emoji} {u.name}
                                            </span>
                                            {!u.alive && (
                                                <span className="text-[9px] font-black text-slate-400 shrink-0">
                                                    처치
                                                </span>
                                            )}
                                        </div>
                                        <svg
                                            viewBox="0 0 100 6"
                                            className="w-full h-1.5 rounded-full overflow-hidden mt-1"
                                            aria-label={`${u.name} HP ${hpPct}%`}
                                        >
                                            <rect x="0" y="0" width="100" height="6" fill="#0f172a" />
                                            <rect
                                                x="0"
                                                y="0"
                                                width={hpPct}
                                                height="6"
                                                fill="#ef4444"
                                            />
                                        </svg>
                                        {u.activeSkillName && (
                                            <div className="mt-1">
                                                <span className="px-1 rounded bg-rose-600 text-white text-[9px] font-black truncate inline-block max-w-full">
                                                    {u.activeSkillName}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Live Battle Log */}
                <div className="lg:col-span-4 rounded-xl bg-slate-950/90 border border-slate-800 p-2 max-h-24 overflow-y-auto space-y-0.5 text-[10px] text-slate-300 font-medium min-w-0">
                    {battleResponse.battleLog.length === 0 ? (
                        <div className="text-slate-500 font-bold">전투 기록이 없습니다.</div>
                    ) : (
                        battleResponse.battleLog.map((line, idx) => (
                            <div key={`tower-log-${idx}`} className="leading-snug break-words">
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
