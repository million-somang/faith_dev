'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type {
    AzitExpeditionRecord,
    AzitFullGameState,
    AzitMercCode,
    AzitMercenaryRecord,
} from '@/types/azit-game.types';
import { formatCountdownLabel } from '@/types/azit-game.types';
import { getMercSpriteMeta } from '@/data/azitCharacterAssets';

const ORIGIN_X = 400;
const ORIGIN_Y = 236;
const TILE_W = 66;
const TILE_H = 33;

const MERC_CAMP_COORDS: Array<{ gridX: number; gridY: number }> = [
    { gridX: 1.5, gridY: 3.4 },
    { gridX: 3.5, gridY: 2.3 },
    { gridX: 1.9, gridY: 5.5 },
    { gridX: 3.5, gridY: 5.2 },
    { gridX: 5.9, gridY: 3.6 },
    { gridX: 5.2, gridY: 4.7 },
];

type CampDepthEntity =
    | { kind: 'dummy'; depth: number }
    | { kind: 'campfire'; depth: number }
    | { kind: 'target'; depth: number }
    | {
          kind: 'mercenary';
          depth: number;
          merc: AzitMercenaryRecord;
          idx: number;
          coord: { gridX: number; gridY: number };
      };

interface MercTrainingAnimState {
    dx: number;
    dy: number;
    tiltDeg: number;
    isBurst: boolean;
    burstPhase: number;
}

function computeMercTrainingAnim(mercCode: AzitMercCode, animSec: number, idx: number): MercTrainingAnimState {
    const localT = (animSec + idx * 0.85) % 4.2;
    if (localT >= 2.6) {
        return {
            dx: 0,
            dy: Math.sin(animSec * 2.2 + idx) * 1.6,
            tiltDeg: 0,
            isBurst: false,
            burstPhase: 0,
        };
    }

    const p = localT / 2.6;
    switch (mercCode) {
        case 'merc-leo': {
            // 전진 방패 돌진 2연타
            const strike = Math.abs(Math.sin(p * Math.PI * 2));
            return {
                dx: strike * 6,
                dy: -strike * 2.5,
                tiltDeg: strike * 8,
                isBurst: true,
                burstPhase: p,
            };
        }
        case 'merc-rina': {
            // 활 당겼다 발사 반동
            const draw = Math.sin(p * Math.PI * 2);
            return {
                dx: -Math.max(0, draw) * 3.5,
                dy: -Math.abs(draw) * 1.5,
                tiltDeg: -draw * 6,
                isBurst: true,
                burstPhase: p,
            };
        }
        case 'merc-kael': {
            // 화염 마법 부양 영창
            return {
                dx: 0,
                dy: -5 - Math.sin(p * Math.PI * 3) * 2.5,
                tiltDeg: Math.sin(p * Math.PI * 2) * 3.5,
                isBurst: true,
                burstPhase: p,
            };
        }
        case 'merc-serena': {
            // 성스러운 치유 부양 스웨이
            return {
                dx: 0,
                dy: -6 - Math.sin(p * Math.PI * 2) * 2.2,
                tiltDeg: Math.sin(p * Math.PI * 2) * 2.5,
                isBurst: true,
                burstPhase: p,
            };
        }
        case 'merc-garr': {
            // 좌우 쌍도끼 스윙 + 점프 내려찍기
            const jump = Math.abs(Math.sin(p * Math.PI * 2));
            return {
                dx: Math.sin(p * Math.PI * 2) * 3.5,
                dy: -jump * 9,
                tiltDeg: Math.sin(p * Math.PI * 4) * 11,
                isBurst: true,
                burstPhase: p,
            };
        }
        case 'merc-aria': {
            // 고속 발키리 스텝 검무
            const dash = Math.sin(p * Math.PI * 3);
            return {
                dx: dash * 5.5,
                dy: -Math.abs(dash) * 4.2,
                tiltDeg: dash * 7.5,
                isBurst: true,
                burstPhase: p,
            };
        }
    }
}

function renderMercSkillFx(mercCode: AzitMercCode, anim: MercTrainingAnimState, animSec: number) {
    if (!anim.isBurst) return null;
    const p = anim.burstPhase;

    switch (mercCode) {
        case 'merc-leo': {
            const pulse = (p * 2) % 1;
            return (
                <g pointerEvents="none" transform="translate(20, -32)">
                    <path
                        d={`M0,-14 L11,-8 L11,6 L0,14 L-6,8`}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        opacity={Math.sin(pulse * Math.PI)}
                    />
                    <circle cx={6 + pulse * 12} cy={-2} r={3 + pulse * 8} fill="none" stroke="#38bdf8" strokeWidth="1.6" opacity={1 - pulse} />
                    <line x1="2" y1="-8" x2="18" y2="-14" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" opacity={Math.sin(pulse * Math.PI)} />
                </g>
            );
        }
        case 'merc-rina': {
            const arrowP = (p * 2) % 1;
            const ax = 14 + arrowP * 38;
            const ay = -34 - arrowP * 14;
            return (
                <g pointerEvents="none" opacity={Math.sin(arrowP * Math.PI)}>
                    <line x1={ax - 14} y1={ay + 5} x2={ax} y2={ay} stroke="#e2e8f0" strokeWidth="1.4" strokeDasharray="3 2" />
                    <line x1={ax - 6} y1={ay + 2.2} x2={ax + 8} y2={ay - 2.8} stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" />
                    <polygon points={`${ax + 8},${ay - 2.8} ${ax + 3},${ay - 4.2} ${ax + 5},${ay + 0.5}`} fill="#fde047" />
                </g>
            );
        }
        case 'merc-kael': {
            const orbP = (p * 2) % 1;
            const rot = (animSec * 160) % 360;
            return (
                <g pointerEvents="none">
                    <ellipse
                        cx="0"
                        cy="2"
                        rx={24 + Math.sin(animSec * 6) * 2}
                        ry={11 + Math.sin(animSec * 6) * 1}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="1.4"
                        strokeDasharray="6 4"
                        transform={`rotate(${rot * 0.08} 0 2)`}
                        opacity="0.78"
                    />
                    <g transform={`translate(${18 + orbP * 24}, ${-36 - Math.sin(orbP * Math.PI) * 8})`} opacity={Math.sin(orbP * Math.PI)}>
                        <circle cx="0" cy="0" r="6" fill="#f97316" />
                        <circle cx="0" cy="0" r="3.2" fill="#fef08a" />
                    </g>
                </g>
            );
        }
        case 'merc-serena': {
            const wave1 = (p * 2) % 1;
            const wave2 = (p * 2 + 0.5) % 1;
            return (
                <g pointerEvents="none">
                    <ellipse cx="0" cy="3" rx={14 + wave1 * 22} ry={6 + wave1 * 10} fill="none" stroke="#fde047" strokeWidth="1.8" opacity={1 - wave1} />
                    <ellipse cx="0" cy="3" rx={14 + wave2 * 22} ry={6 + wave2 * 10} fill="none" stroke="#7dd3fc" strokeWidth="1.5" opacity={1 - wave2} />
                    {[0, 1, 2].map((sIdx) => {
                        const sp = (animSec * 1.1 + sIdx * 0.33) % 1;
                        return (
                            <text
                                key={`serena-heal-${sIdx}`}
                                x={(sIdx - 1) * 16}
                                y={-34 - sp * 28}
                                fontSize="11"
                                textAnchor="middle"
                                opacity={Math.sin(sp * Math.PI)}
                            >
                                {sIdx === 1 ? '✨' : '✚'}
                            </text>
                        );
                    })}
                </g>
            );
        }
        case 'merc-garr': {
            const arcP = (p * 2) % 1;
            return (
                <g pointerEvents="none">
                    <path
                        d="M-22,-50 Q4,-28 24,-12"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        opacity={Math.sin(arcP * Math.PI)}
                    />
                    <path
                        d="M22,-50 Q-4,-28 -24,-12"
                        fill="none"
                        stroke="#fca5a5"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        opacity={Math.sin(arcP * Math.PI)}
                    />
                    <ellipse cx="0" cy="5" rx={16 + arcP * 20} ry={7 + arcP * 9} fill="none" stroke="#fb923c" strokeWidth="1.8" opacity={1 - arcP} />
                </g>
            );
        }
        case 'merc-aria': {
            const slashP = (p * 3) % 1;
            return (
                <g pointerEvents="none">
                    <path
                        d={`M-18,-48 Q16,-36 26,-16`}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity={Math.sin(slashP * Math.PI)}
                    />
                    <path
                        d={`M-14,-44 Q14,-34 22,-18`}
                        fill="none"
                        stroke="#e0e7ff"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        opacity={Math.sin(slashP * Math.PI)}
                    />
                    <text
                        x={16 + slashP * 12}
                        y={-46 - slashP * 14}
                        fontSize="11"
                        textAnchor="middle"
                        opacity={Math.sin(slashP * Math.PI)}
                    >
                        ✨
                    </text>
                </g>
            );
        }
    }
}

function getIsoCenter(gridX: number, gridY: number): { x: number; y: number } {
    const x = ORIGIN_X + (gridX - gridY) * (TILE_W / 2);
    const y = ORIGIN_Y + (gridX + gridY + 1) * (TILE_H / 2);
    return { x, y };
}

function getIsoTilePolygon(gridX: number, gridY: number): string {
    const topX = ORIGIN_X + (gridX - gridY) * (TILE_W / 2);
    const topY = ORIGIN_Y + (gridX + gridY) * (TILE_H / 2);
    return `${topX},${topY} ${topX + TILE_W / 2},${topY + TILE_H / 2} ${topX},${topY + TILE_H} ${topX - TILE_W / 2},${topY + TILE_H / 2}`;
}

export type CampNodeType = 'tent' | 'portal';

interface AzitCampIsoSceneProps {
    gameState: AzitFullGameState;
    nowMs: number;
    selectedNode: CampNodeType | null;
    onSelectNode: (node: CampNodeType) => void;
    onEnterIndoor: () => void;
    onEnterKitchen: () => void;
}

export const AzitCampIsoScene: React.FC<AzitCampIsoSceneProps> = ({
    gameState,
    nowMs,
    selectedNode,
    onSelectNode,
    onEnterIndoor,
    onEnterKitchen,
}) => {
    const wallH = 110;
    const floorThick = 18;
    const top = { x: ORIGIN_X, y: ORIGIN_Y };
    const right = { x: ORIGIN_X + 8 * (TILE_W / 2), y: ORIGIN_Y + 8 * (TILE_H / 2) };
    const bottom = { x: ORIGIN_X, y: ORIGIN_Y + 8 * TILE_H };
    const left = { x: ORIGIN_X - 8 * (TILE_W / 2), y: ORIGIN_Y + 8 * (TILE_H / 2) };

    const mercCatalogMap = useMemo(() => {
        const map = new Map<string, { name: string; emoji: string; role: string }>();
        gameState.catalog.mercenaries.forEach((m) =>
            map.set(m.mercCode, { name: m.name, emoji: m.emoji, role: m.role })
        );
        return map;
    }, [gameState.catalog.mercenaries]);

    const tentPos = getIsoCenter(1.7, 1.9);
    const portalPos = getIsoCenter(5.6, 1.9);
    const dummyPos = getIsoCenter(2.3, 2.9);
    const targetPos = getIsoCenter(4.8, 2.7);
    const firePos = getIsoCenter(3.7, 3.7);
    const exitIndoorPos = getIsoCenter(0.9, 6.2);
    const goKitchenPos = getIsoCenter(6.3, 5.9);

    const [animSec, setAnimSec] = useState<number>(0);

    useEffect(() => {
        let rafId = 0;
        const startMs = performance.now();
        let lastEmitMs = startMs;
        const tick = (now: number) => {
            if (now - lastEmitMs >= 30) {
                lastEmitMs = now;
                setAnimSec((now - startMs) / 1000);
            }
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const hasMeleeTrainee = useMemo(
        () =>
            gameState.mercenaries.some(
                (m) =>
                    m.status === 'idle' &&
                    (m.mercCode === 'merc-leo' || m.mercCode === 'merc-garr' || m.mercCode === 'merc-aria')
            ),
        [gameState.mercenaries]
    );
    const hasRangedTrainee = useMemo(
        () =>
            gameState.mercenaries.some(
                (m) => m.status === 'idle' && (m.mercCode === 'merc-rina' || m.mercCode === 'merc-kael')
            ),
        [gameState.mercenaries]
    );

    const completedCount = gameState.activeExpeditions.filter((e) => e.endsAtMs <= nowMs).length;
    const runningCount = gameState.activeExpeditions.length;
    const nextFinishExp = gameState.activeExpeditions[0] || null;

    const campDepthEntities = useMemo<CampDepthEntity[]>(() => {
        const entities: CampDepthEntity[] = [
            { kind: 'dummy', depth: 5.2 },
            { kind: 'campfire', depth: 7.4 },
            { kind: 'target', depth: 7.5 },
        ];
        gameState.mercenaries.forEach((merc, idx) => {
            const coord = MERC_CAMP_COORDS[idx] || MERC_CAMP_COORDS[0];
            entities.push({
                kind: 'mercenary',
                depth: coord.gridX + coord.gridY,
                merc,
                idx,
                coord,
            });
        });
        return entities.sort((a, b) => a.depth - b.depth);
    }, [gameState.mercenaries]);

    return (
        <g>
            {/* 야영지 목재 성책 뒷벽 */}
            <polygon
                points={`${left.x},${left.y} ${top.x},${top.y} ${top.x},${top.y - wallH} ${left.x},${left.y - wallH}`}
                fill="#78350f"
                stroke="#451a03"
                strokeWidth="1.4"
            />
            <polygon
                points={`${top.x},${top.y} ${right.x},${right.y} ${right.x},${right.y - wallH} ${top.x},${top.y - wallH}`}
                fill="#92400e"
                stroke="#451a03"
                strokeWidth="1.4"
            />
            <polygon
                points={`${left.x},${left.y - wallH} ${top.x},${top.y - wallH} ${top.x},${top.y - wallH - 12} ${left.x},${left.y - wallH - 12}`}
                fill="#334155"
            />
            <polygon
                points={`${top.x},${top.y - wallH} ${right.x},${right.y - wallH} ${right.x},${right.y - wallH - 12} ${top.x},${top.y - wallH - 12}`}
                fill="#1e293b"
            />

            {/* 캠프 현판 */}
            <g transform={`translate(${top.x - 115}, ${top.y - 54}) skewY(-26.5)`}>
                <rect x="-56" y="-14" width="112" height="24" rx="6" fill="#1e1b4b" stroke="#a5b4fc" strokeWidth="1.4" />
                <text x="0" y="2" textAnchor="middle" fill="#e0e7ff" fontSize="9.8" fontWeight="900">
                    ⚔️ VERA GUILD CAMP
                </text>
            </g>

            {/* 바닥 두께 */}
            <polygon
                points={`${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y + floorThick} ${left.x},${left.y + floorThick}`}
                fill="#475569"
            />
            <polygon
                points={`${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y + floorThick} ${bottom.x},${bottom.y + floorThick}`}
                fill="#334155"
            />

            {/* 8x8 석재 광장 & 캠프 잔디 타일 */}
            {Array.from({ length: 8 }).map((_, gy) =>
                Array.from({ length: 8 }).map((__, gx) => {
                    const isStoneCenter = gx >= 2 && gx <= 5 && gy >= 2 && gy <= 5;
                    const isAlt = (gx + gy) % 2 === 0;
                    const fill = isStoneCenter
                        ? isAlt
                            ? '#cbd5e1'
                            : '#94a3b8'
                        : isAlt
                          ? '#86efac'
                          : '#4ade80';
                    const stroke = isStoneCenter ? '#64748b' : '#22c55e';
                    return (
                        <polygon
                            key={`camp-tile-${gx}-${gy}`}
                            points={getIsoTilePolygon(gx, gy)}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth="0.7"
                        />
                    );
                })
            )}

            {/* 좌측 상단: 용병 길드 텐트 */}
            <g
                data-camp-node="tent"
                transform={`translate(${tentPos.x}, ${tentPos.y})`}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode('tent');
                }}
                className="cursor-pointer"
            >
                {selectedNode === 'tent' && (
                    <ellipse
                        cx="0"
                        cy="4"
                        rx="54"
                        ry="25"
                        fill="rgba(99, 102, 241, 0.24)"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                    />
                )}
                <polygon points="-46,4 0,-56 46,4 0,18" fill="#4f46e5" stroke="#312e81" strokeWidth="1.8" />
                <polygon points="0,-56 46,4 0,18" fill="#4338ca" />
                <polygon points="-14,13 0,-22 14,13" fill="#1e1b4b" />
                <line x1="0" y1="-56" x2="0" y2="-74" stroke="#facc15" strokeWidth="2.5" />
                <polygon points="0,-74 24,-67 0,-60" fill="#f59e0b" />
                <rect x="-48" y="-94" width="96" height="20" rx="10" fill="rgba(49, 46, 129, 0.94)" stroke="#c7d2fe" strokeWidth="1.2" />
                <text x="0" y="-81" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900">
                    🛡️ 용병 길드 ({gameState.mercenaries.length}/{gameState.profile.limits.maxMercs})
                </text>
            </g>

            {/* 우측 상단: 몬스터 원정 차원 관문 */}
            <g
                data-camp-node="portal"
                transform={`translate(${portalPos.x}, ${portalPos.y})`}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode('portal');
                }}
                className="cursor-pointer"
            >
                {selectedNode === 'portal' && (
                    <ellipse
                        cx="0"
                        cy="4"
                        rx="52"
                        ry="24"
                        fill="rgba(244, 63, 94, 0.24)"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                    />
                )}
                <ellipse cx="0" cy="4" rx="40" ry="16" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                {/* 석재 아치 기둥 */}
                <path
                    d="M-32,4 L-32,-44 A32,32 0 0,1 32,-44 L32,4"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                {/* 포탈 내부 오라 */}
                <ellipse
                    cx="0"
                    cy="-24"
                    rx="22"
                    ry="32"
                    fill={completedCount > 0 ? '#f59e0b' : runningCount > 0 ? '#7c3aed' : '#0ea5e9'}
                    opacity="0.82"
                />
                <ellipse cx="0" cy="-24" rx="13" ry="20" fill="#ffffff" opacity="0.45" />
                <text x="0" y="-20" textAnchor="middle" fontSize="16">
                    {completedCount > 0 ? '🏆' : runningCount > 0 ? '⚔️' : '🌀'}
                </text>

                <rect
                    x="-50"
                    y="-96"
                    width="100"
                    height="20"
                    rx="10"
                    fill={
                        completedCount > 0
                            ? '#f59e0b'
                            : runningCount > 0
                              ? 'rgba(109, 40, 217, 0.94)'
                              : 'rgba(225, 29, 72, 0.94)'
                    }
                    stroke="#ffffff"
                    strokeWidth="1.2"
                />
                <text
                    x="0"
                    y="-83"
                    textAnchor="middle"
                    fill={completedCount > 0 ? '#0f172a' : '#ffffff'}
                    fontSize="9.5"
                    fontWeight="900"
                >
                    {completedCount > 0
                        ? `🏆 전리품 수령 (${completedCount})`
                        : nextFinishExp
                          ? `⚔️ 원정 ${formatCountdownLabel(nextFinishExp.endsAtMs, nowMs)}`
                          : '⚔️ 몬스터 원정 출발'}
                </text>
            </g>

            {/* 훈련장 오브제 · 모닥불 · 고용 용병들 Z-depth 통합 배치 */}
            {campDepthEntities.map((entity) => {
                if (entity.kind === 'dummy') {
                    const hitPulse = hasMeleeTrainee ? Math.max(0, Math.sin(animSec * 5.2)) : 0;
                    const wobble = hasMeleeTrainee ? Math.sin(animSec * 16) * hitPulse * 6.5 : 0;
                    return (
                        <g
                            key="camp-training-dummy"
                            data-camp-training-dummy="true"
                            transform={`translate(${dummyPos.x}, ${dummyPos.y})`}
                        >
                            <ellipse cx="0" cy="4" rx="16" ry="7.5" fill="rgba(15, 23, 42, 0.22)" />
                            <g transform={`rotate(${wobble} 0 2)`}>
                                {/* 나무 지지대 & 가로 팔 */}
                                <rect x="-3" y="-38" width="6" height="40" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                                <rect x="-15" y="-29" width="30" height="5" rx="2.5" fill="#92400e" stroke="#451a03" strokeWidth="1" />
                                {/* 짚단 몸통 */}
                                <rect x="-9" y="-36" width="18" height="22" rx="6" fill="#f59e0b" stroke="#92400e" strokeWidth="1.2" />
                                <line x1="-8" y1="-26" x2="8" y2="-26" stroke="#78350f" strokeWidth="2" />
                                {/* 머리 & 훈련 투구 */}
                                <circle cx="0" cy="-44" r="7.5" fill="#fde68a" stroke="#92400e" strokeWidth="1.2" />
                                <path d="M-8,-45 A8,7 0 0,1 8,-45 Z" fill="#64748b" stroke="#1e293b" strokeWidth="1.1" />
                                {/* 나무 방패 장식 */}
                                <ellipse cx="-10" cy="-24" rx="5.5" ry="7" fill="#b45309" stroke="#451a03" strokeWidth="1.2" />
                            </g>
                            {hasMeleeTrainee && hitPulse > 0.72 && (
                                <g transform="translate(-8, -32)" opacity={(hitPulse - 0.72) * 3.5}>
                                    <line x1="-6" y1="-6" x2="2" y2="2" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="-8" y1="2" x2="2" y2="-4" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="-2" cy="-2" r="3" fill="#fef08a" />
                                </g>
                            )}
                        </g>
                    );
                }

                if (entity.kind === 'target') {
                    const hitWave = hasRangedTrainee ? Math.max(0, Math.sin(animSec * 3.8 + 0.8)) : 0;
                    const shake = hasRangedTrainee && hitWave > 0.8 ? Math.sin(animSec * 32) * 2.5 : 0;
                    return (
                        <g
                            key="camp-archery-target"
                            data-camp-archery-target="true"
                            transform={`translate(${targetPos.x + shake}, ${targetPos.y})`}
                        >
                            <ellipse cx="0" cy="4" rx="16" ry="7.5" fill="rgba(15, 23, 42, 0.22)" />
                            {/* 나무 삼각대 */}
                            <line x1="-10" y1="3" x2="0" y2="-36" stroke="#78350f" strokeWidth="3.2" strokeLinecap="round" />
                            <line x1="10" y1="3" x2="0" y2="-36" stroke="#92400e" strokeWidth="3.2" strokeLinecap="round" />
                            {/* 동심원 과녁 */}
                            <circle cx="0" cy="-26" r="14" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.4" />
                            <circle cx="0" cy="-26" r="9.5" fill="#ffffff" />
                            <circle cx="0" cy="-26" r="5" fill="#ef4444" />
                            <circle cx="0" cy="-26" r="2.2" fill="#facc15" />
                            {/* 꽂힌 화살 */}
                            <line x1="-14" y1="-34" x2="-1" y2="-26" stroke="#fde68a" strokeWidth="1.8" strokeLinecap="round" />
                            <polygon points="-14,-34 -18,-37 -12,-36" fill="#22c55e" />
                            {hasRangedTrainee && hitWave > 0.8 && (
                                <g transform="translate(-2, -26)" opacity={(hitWave - 0.8) * 5}>
                                    <circle cx="0" cy="0" r="6" fill="none" stroke="#fde047" strokeWidth="1.8" />
                                    <text x="8" y="-12" fontSize="10" textAnchor="middle">
                                        🎯
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                }

                if (entity.kind === 'campfire') {
                    const flameSway = Math.sin(animSec * 7.5);
                    const flameScaleY = 1 + Math.sin(animSec * 9.5) * 0.14;
                    const glowR = 32 + Math.sin(animSec * 5) * 3;
                    return (
                        <g key="camp-central-fire" transform={`translate(${firePos.x}, ${firePos.y})`}>
                            <ellipse cx="0" cy="3" rx={glowR} ry={glowR * 0.45} fill="rgba(251, 146, 60, 0.22)" />
                            <ellipse cx="0" cy="4" rx="28" ry="13" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
                            <ellipse cx="0" cy="2" rx="20" ry="9" fill="#334155" />
                            <line x1="-14" y1="3" x2="14" y2="-1" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
                            <line x1="-12" y1="-2" x2="12" y2="5" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
                            <g transform={`scale(${1 + flameSway * 0.06}, ${flameScaleY}) skewX(${flameSway * 4})`}>
                                <path d="M-9,0 C-10,-16 0,-26 0,-30 C6,-18 12,-14 9,0 Z" fill="#f97316" />
                                <path d="M-5,0 C-5,-11 0,-18 0,-21 C4,-12 6,-9 5,0 Z" fill="#facc15" />
                            </g>
                            {/* 떠오르는 모닥불 불티 5개 */}
                            {[0, 1, 2, 3, 4].map((eIdx) => {
                                const ep = (animSec * 0.85 + eIdx * 0.2) % 1;
                                const ex = Math.sin(animSec * 4 + eIdx * 1.4) * (5 + ep * 7);
                                const ey = -16 - ep * 36;
                                return (
                                    <circle
                                        key={`campfire-ember-${eIdx}`}
                                        cx={ex}
                                        cy={ey}
                                        r={2.2 - ep * 1.3}
                                        fill={eIdx % 2 === 0 ? '#fde047' : '#fb923c'}
                                        opacity={Math.sin(ep * Math.PI)}
                                    />
                                );
                            })}
                        </g>
                    );
                }

                const { merc, idx, coord } = entity;
                const pos = getIsoCenter(coord.gridX, coord.gridY);
                const meta = mercCatalogMap.get(merc.mercCode);
                const sprite = getMercSpriteMeta(merc.mercCode);
                const isOut = merc.status === 'expedition';
                const trainAnim = isOut
                    ? { dx: 0, dy: 0, tiltDeg: 0, isBurst: false, burstPhase: 0 }
                    : computeMercTrainingAnim(merc.mercCode, animSec, idx);

                return (
                    <g
                        key={`merc-iso-${merc.mercCode}`}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        opacity={isOut ? 0.48 : 1}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectNode('tent');
                        }}
                        className="cursor-pointer"
                    >
                        <ellipse
                            cx="0"
                            cy="5"
                            rx={sprite.shadowRx}
                            ry={sprite.shadowRy}
                            fill="rgba(15, 23, 42, 0.26)"
                        />
                        {trainAnim.isBurst && (
                            <ellipse
                                cx="0"
                                cy="5"
                                rx={sprite.shadowRx + 4 + Math.sin(animSec * 7) * 1.5}
                                ry={sprite.shadowRy + 2 + Math.sin(animSec * 7) * 0.6}
                                fill="none"
                                stroke={sprite.accentRingColor}
                                strokeWidth="1.5"
                                opacity="0.65"
                            />
                        )}
                        <g transform={`translate(${trainAnim.dx}, ${trainAnim.dy}) rotate(${trainAnim.tiltDeg} 0 -18)`}>
                            <image
                                href={sprite.spriteUrl}
                                x={-sprite.spriteWidth / 2}
                                y={-sprite.spriteHeight + sprite.spriteOffsetY}
                                width={sprite.spriteWidth}
                                height={sprite.spriteHeight}
                                preserveAspectRatio="xMidYMax meet"
                            />
                        </g>
                        {!isOut && renderMercSkillFx(merc.mercCode, trainAnim, animSec)}
                        {isOut && (
                            <g transform={`translate(0, ${-sprite.spriteHeight + sprite.spriteOffsetY - 8})`}>
                                <rect
                                    x="-26"
                                    y="-9"
                                    width="52"
                                    height="15"
                                    rx="7.5"
                                    fill="#7c3aed"
                                    stroke="#ffffff"
                                    strokeWidth="1"
                                />
                                <text x="0" y="1.5" textAnchor="middle" fill="#ffffff" fontSize="8.2" fontWeight="900">
                                    ⚔️ 출정 중
                                </text>
                            </g>
                        )}
                        <rect
                            x="-46"
                            y="11"
                            width="92"
                            height="17"
                            rx="8.5"
                            fill={isOut ? '#7c3aed' : 'rgba(15, 23, 42, 0.86)'}
                            stroke="rgba(255, 255, 255, 0.35)"
                            strokeWidth="0.8"
                        />
                        <text x="0" y="22.5" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontWeight="800">
                            {isOut ? '⚔️ 원정 중' : `${meta?.name || merc.mercCode} Lv.${merc.level}`}
                        </text>
                    </g>
                );
            })}

            {gameState.mercenaries.length === 0 && (
                <g
                    transform={`translate(${getIsoCenter(2.1, 4.4).x}, ${getIsoCenter(2.1, 4.4).y})`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode('tent');
                    }}
                    className="cursor-pointer"
                >
                    <ellipse cx="0" cy="4" rx="22" ry="9" fill="rgba(15, 23, 42, 0.2)" />
                    <rect x="-4" y="-26" width="8" height="28" fill="#78350f" />
                    <rect x="-56" y="-56" width="112" height="32" rx="8" fill="#eef2ff" stroke="#4f46e5" strokeWidth="2" />
                    <text x="0" y="-42" textAnchor="middle" fill="#312e81" fontSize="9.5" fontWeight="900">
                        🛡️ 영입된 용병이 없습니다
                    </text>
                    <text x="0" y="-30" textAnchor="middle" fill="#4f46e5" fontSize="8.8" fontWeight="800">
                        텐트 클릭해 첫 용병 영입 →
                    </text>
                </g>
            )}

            {/* 좌측 하단: 실내 아지트 복귀 */}
            <g
                transform={`translate(${exitIndoorPos.x}, ${exitIndoorPos.y})`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEnterIndoor();
                }}
                className="cursor-pointer"
            >
                <ellipse cx="0" cy="4" rx="40" ry="12" fill="#c7d2fe" stroke="#4f46e5" strokeWidth="1.4" />
                <rect x="-44" y="-12" width="88" height="20" rx="10" fill="#4338ca" stroke="#e0e7ff" strokeWidth="1.2" />
                <text x="0" y="1.5" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontWeight="900">
                    🏠 실내 아지트 복귀
                </text>
            </g>

            {/* 우측 하단: 주방 이동 */}
            <g
                transform={`translate(${goKitchenPos.x}, ${goKitchenPos.y})`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEnterKitchen();
                }}
                className="cursor-pointer"
            >
                <ellipse cx="0" cy="4" rx="42" ry="12" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.4" />
                <rect x="-46" y="-12" width="92" height="20" rx="10" fill="#c2410c" stroke="#ffedd5" strokeWidth="1.2" />
                <text x="0" y="1.5" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontWeight="900">
                    👨‍🍳 도시락 조리하기
                </text>
            </g>
        </g>
    );
};

interface CampActionBubbleProps {
    node: CampNodeType;
    gameState: AzitFullGameState;
    nowMs: number;
    isZoomed: boolean;
    isActing: boolean;
    onClose: () => void;
    onOpenMercModal: () => void;
    onOpenExpeditionModal: () => void;
    onClaimExpedition: (expeditionId: number) => Promise<boolean>;
}

export const CampActionBubble: React.FC<CampActionBubbleProps> = ({
    node,
    gameState,
    nowMs,
    isZoomed,
    isActing,
    onClose,
    onOpenMercModal,
    onOpenExpeditionModal,
    onClaimExpedition,
}) => {
    const posClass = isZoomed
        ? 'top-14 left-1/2 -translate-x-1/2'
        : node === 'tent'
          ? 'bottom-[46%] left-[44%] -translate-x-1/2'
          : 'bottom-[46%] left-[64%] -translate-x-1/2';

    const idleMercs = gameState.mercenaries.filter((m) => m.status === 'idle');
    const idlePower = idleMercs.reduce((sum, m) => sum + m.power, 0);
    const completedExp = gameState.activeExpeditions.filter((e) => e.endsAtMs <= nowMs);
    const canDispatchMore =
        gameState.activeExpeditions.length < gameState.profile.limits.maxActiveExpeditions;

    return (
        <div
            data-camp-bubble="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`absolute z-30 ${posClass} w-[248px] sm:w-[276px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border-2 border-indigo-400/90 shadow-2xl p-3 space-y-2.5`}
        >
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-700/80">
                <span className="text-xs font-black text-indigo-200">
                    {node === 'tent' ? '🛡️ 용병 길드 텐트' : '🌀 몬스터 원정 관문'}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="말풍선 닫기"
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black flex items-center justify-center cursor-pointer"
                >
                    ×
                </button>
            </div>

            {node === 'tent' ? (
                <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs space-y-1">
                        <div className="flex justify-between font-bold">
                            <span className="text-slate-300">보유 용병</span>
                            <span className="text-indigo-300 font-black">
                                {gameState.mercenaries.length}/{gameState.profile.limits.maxMercs}명 (대기 {idleMercs.length})
                            </span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="text-slate-300">대기 전투력</span>
                            <span className="text-amber-300 font-black">⚔️ {idlePower.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onOpenMercModal();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black cursor-pointer"
                    >
                        🛡️ 용병 영입 · 훈련실 열기
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {completedExp.map((exp) => {
                        const zone = gameState.catalog.zones.find((z) => z.zoneId === exp.zoneId);
                        return (
                            <button
                                key={`camp-bubble-claim-${exp.id}`}
                                type="button"
                                disabled={isActing}
                                onClick={async () => {
                                    const ok = await onClaimExpedition(exp.id);
                                    if (ok) onClose();
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50"
                            >
                                🏆 [{zone?.emoji} {zone?.name}] 귀환 정산하기!
                            </button>
                        );
                    })}

                    {gameState.activeExpeditions
                        .filter((e) => e.endsAtMs > nowMs)
                        .map((exp) => {
                            const zone = gameState.catalog.zones.find((z) => z.zoneId === exp.zoneId);
                            return (
                                <div
                                    key={`camp-bubble-run-${exp.id}`}
                                    className="px-2.5 py-2 rounded-xl bg-violet-950/70 border border-violet-500/50 text-[11px] flex items-center justify-between"
                                >
                                    <span className="font-bold text-violet-200 truncate">
                                        {zone?.emoji} {zone?.name}
                                    </span>
                                    <span className="font-mono font-black text-amber-300 shrink-0">
                                        {formatCountdownLabel(exp.endsAtMs, nowMs)}
                                    </span>
                                </div>
                            );
                        })}

                    {canDispatchMore ? (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onOpenExpeditionModal();
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black cursor-pointer"
                        >
                            ⚔️ 새 몬스터 토벌 출정하기
                        </button>
                    ) : (
                        <div className="text-center text-[11px] font-bold text-slate-400 py-1">
                            최대 원정대({gameState.profile.limits.maxActiveExpeditions}팀) 모두 출정 중입니다.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface AzitCampControlPanelProps {
    gameState: AzitFullGameState;
    nowMs: number;
    isActing: boolean;
    onClaimExpedition: (expeditionId: number) => Promise<boolean>;
    onOpenMercModal: () => void;
    onOpenExpeditionModal: () => void;
    onGoToKitchen: () => void;
}

export const AzitCampControlPanel: React.FC<AzitCampControlPanelProps> = ({
    gameState,
    nowMs,
    isActing,
    onClaimExpedition,
    onOpenExpeditionModal,
}) => {
    const totalPower = gameState.mercenaries.reduce((sum, m) => sum + m.power, 0);
    const totalDishes =
        Object.values(gameState.dishes).reduce((sum, v) => sum + v, 0) +
        Object.values(gameState.specialDishes ?? {}).reduce((sum, v) => sum + v, 0);

    const calcProgressPct = (exp: AzitExpeditionRecord): number => {
        const total = Math.max(1, exp.endsAtMs - exp.startedAtMs);
        const elapsed = Math.max(0, nowMs - exp.startedAtMs);
        return Math.min(100, Math.max(4, Math.round((elapsed / total) * 100)));
    };

    return (
        <div className="w-full mt-2 rounded-2xl bg-[#f0f4f8] border border-white/85 shadow-[4px_4px_10px_rgba(163,177,198,0.35),-4px_-4px_10px_rgba(255,255,255,0.85)] p-3.5 sm:p-4 space-y-3 shrink-0">
            {/* 상단 요약 1줄 (중복 버튼 제거, 구역 고유 원정 출정 액션만 유지) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[11px] shadow-sm">
                        ⚔️ 용병 토벌 캠프
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e8edf2] border border-white/80 shadow-[inset_1px_1px_3px_rgba(163,177,198,0.35),inset_-1px_-1px_3px_rgba(255,255,255,0.8)] text-[#1e293b] text-[10px] font-extrabold font-mono">
                        전투력 {totalPower.toLocaleString()} · {gameState.profile.totalExpeditionsWon}승{' '}
                        {gameState.profile.totalExpeditionsLost}패
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/90 border border-white text-orange-700 text-[10px] font-black shadow-sm">
                        🍱 도시락 {totalDishes}개
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <button
                        type="button"
                        onClick={onOpenExpeditionModal}
                        className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black cursor-pointer transition-all shadow-sm active:scale-95"
                    >
                        ⚔️ 몬스터 원정 출정 ({gameState.activeExpeditions.length}/
                        {gameState.profile.limits.maxActiveExpeditions})
                    </button>
                </div>
            </div>

            {/* 진행 중 / 완료 대기 원정대 카드 */}
            {gameState.activeExpeditions.length === 0 ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-[#e8edf2]/80 border border-white/75 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] text-xs text-[#64748b] font-bold flex flex-wrap items-center justify-between gap-2">
                    <span>
                        출정 중인 원정대가 없습니다. 도시락을 챙겨 몬스터 토벌을 떠나보세요.
                    </span>
                    <button
                        type="button"
                        onClick={onOpenExpeditionModal}
                        className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black cursor-pointer shrink-0 shadow-sm"
                    >
                        출정 편성 →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gameState.activeExpeditions.map((exp) => {
                        const zone = gameState.catalog.zones.find((z) => z.zoneId === exp.zoneId);
                        const recipe = gameState.catalog.recipes.find((r) => r.recipeId === exp.dishRecipeId);
                        const isFinished = exp.endsAtMs <= nowMs;
                        const pct = calcProgressPct(exp);

                        return (
                            <div
                                key={`active-exp-card-${exp.id}`}
                                className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
                                    isFinished
                                        ? 'bg-amber-50 border-amber-300/80 shadow-sm'
                                        : 'bg-white/90 border-white shadow-[2px_2px_6px_rgba(163,177,198,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)]'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-xs font-black text-[#1e293b] truncate">
                                            {zone?.emoji} {zone?.name || exp.zoneId}
                                        </div>
                                        <div className="text-[10px] text-[#64748b] font-bold truncate">
                                            도시락:{' '}
                                            {exp.dishQuality === 'special' && (
                                                <span className="px-1 py-0.2 mr-1 rounded bg-amber-200 text-amber-900 font-black">
                                                    ★특제
                                                </span>
                                            )}
                                            {recipe?.emoji} {recipe?.name} · 예상 승률{' '}
                                            <span className="text-emerald-700 font-black">
                                                {exp.predictedWinRate}%
                                            </span>
                                        </div>
                                    </div>
                                    {isFinished ? (
                                        <button
                                            type="button"
                                            disabled={isActing}
                                            onClick={() => onClaimExpedition(exp.id)}
                                            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
                                        >
                                            🏆 전리품 정산!
                                        </button>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-lg bg-[#e8edf2] text-indigo-700 font-mono text-[11px] font-black shrink-0">
                                            {formatCountdownLabel(exp.endsAtMs, nowMs)}
                                        </span>
                                    )}
                                </div>

                                <svg viewBox="0 0 100 6" className="w-full h-1.5" aria-hidden="true">
                                    <rect x="0" y="0" width="100" height="6" rx="3" fill="#cbd5e1" />
                                    <rect
                                        x="0"
                                        y="0"
                                        width={pct}
                                        height="6"
                                        rx="3"
                                        fill={isFinished ? '#f59e0b' : '#6366f1'}
                                    />
                                </svg>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 최근 원정 전적 요약 */}
            {gameState.recentExpeditions.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-black text-[#64748b] mr-1">최근 원정</span>
                    {gameState.recentExpeditions.slice(0, 4).map((rec) => {
                        const zone = gameState.catalog.zones.find((z) => z.zoneId === rec.zoneId);
                        return (
                            <span
                                key={`recent-exp-${rec.id}`}
                                className={`px-2 py-0.5 rounded-full border font-extrabold ${
                                    rec.status === 'won'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}
                            >
                                {zone?.emoji} {zone?.name}{' '}
                                {rec.status === 'won' ? `승 (+${rec.rewardPoints}P)` : '패'}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
