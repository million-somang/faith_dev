'use client';

import React, { useMemo } from 'react';
import type { AzitExpeditionRecord, AzitFullGameState } from '@/types/azit-game.types';
import { formatCountdownLabel } from '@/types/azit-game.types';

const ORIGIN_X = 400;
const ORIGIN_Y = 236;
const TILE_W = 66;
const TILE_H = 33;

const MERC_CAMP_COORDS: Array<{ gridX: number; gridY: number }> = [
    { gridX: 1.8, gridY: 4.3 },
    { gridX: 2.9, gridY: 5.2 },
    { gridX: 4.4, gridY: 5.1 },
    { gridX: 5.6, gridY: 4.3 },
    { gridX: 3.5, gridY: 2.4 },
    { gridX: 5.8, gridY: 3.2 },
];

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
    const firePos = getIsoCenter(3.7, 3.7);
    const exitIndoorPos = getIsoCenter(0.9, 6.2);
    const goKitchenPos = getIsoCenter(6.3, 5.9);

    const completedCount = gameState.activeExpeditions.filter((e) => e.endsAtMs <= nowMs).length;
    const runningCount = gameState.activeExpeditions.length;
    const nextFinishExp = gameState.activeExpeditions[0] || null;

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

            {/* 중앙 타오르는 모닥불 */}
            <g transform={`translate(${firePos.x}, ${firePos.y})`}>
                <ellipse cx="0" cy="4" rx="28" ry="13" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
                <ellipse cx="0" cy="2" rx="20" ry="9" fill="#334155" />
                <line x1="-14" y1="3" x2="14" y2="-1" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
                <line x1="-12" y1="-2" x2="12" y2="5" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
                <path d="M-9,0 C-10,-16 0,-26 0,-30 C6,-18 12,-14 9,0 Z" fill="#f97316" />
                <path d="M-5,0 C-5,-11 0,-18 0,-21 C4,-12 6,-9 5,0 Z" fill="#facc15" />
            </g>

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

            {/* 고용된 용병들 2.5D 배치 (미고용 시 모집 안내) */}
            {gameState.mercenaries.length > 0 ? (
                gameState.mercenaries.map((merc, idx) => {
                    const coord = MERC_CAMP_COORDS[idx] || MERC_CAMP_COORDS[0];
                    const pos = getIsoCenter(coord.gridX, coord.gridY);
                    const meta = mercCatalogMap.get(merc.mercCode);
                    const isOut = merc.status === 'expedition';

                    return (
                        <g
                            key={`merc-iso-${merc.mercCode}`}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            opacity={isOut ? 0.55 : 1}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectNode('tent');
                            }}
                            className="cursor-pointer"
                        >
                            <ellipse cx="0" cy="4" rx="17" ry="8" fill="rgba(15, 23, 42, 0.25)" />
                            {/* 갑옷 몸통 */}
                            <rect
                                x="-12"
                                y="-32"
                                width="24"
                                height="30"
                                rx="9"
                                fill={isOut ? '#64748b' : '#475569'}
                                stroke="#1e293b"
                                strokeWidth="1.4"
                            />
                            <rect x="-8" y="-26" width="16" height="14" rx="4" fill="#94a3b8" />
                            {/* 얼굴 & 투구 */}
                            <circle cx="0" cy="-42" r="12" fill="#fed7aa" stroke="#92400e" strokeWidth="1.2" />
                            <path d="M-13,-44 A13,12 0 0,1 13,-44 Z" fill="#64748b" stroke="#1e293b" strokeWidth="1.2" />
                            <circle cx="-4" cy="-41" r="1.5" fill="#0f172a" />
                            <circle cx="4" cy="-41" r="1.5" fill="#0f172a" />

                            <rect
                                x="-42"
                                y="10"
                                width="84"
                                height="17"
                                rx="8.5"
                                fill={isOut ? '#7c3aed' : 'rgba(15, 23, 42, 0.86)'}
                            />
                            <text x="0" y="21.5" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontWeight="800">
                                {isOut ? '⚔️ 원정 중' : `${meta?.emoji || '⚔️'} ${meta?.name || merc.mercCode} Lv.${merc.level}`}
                            </text>
                        </g>
                    );
                })
            ) : (
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
    onOpenMercModal,
    onOpenExpeditionModal,
    onGoToKitchen,
}) => {
    const totalPower = gameState.mercenaries.reduce((sum, m) => sum + m.power, 0);
    const totalDishes = Object.values(gameState.dishes).reduce((sum, v) => sum + v, 0);

    const calcProgressPct = (exp: AzitExpeditionRecord): number => {
        const total = Math.max(1, exp.endsAtMs - exp.startedAtMs);
        const elapsed = Math.max(0, nowMs - exp.startedAtMs);
        return Math.min(100, Math.max(4, Math.round((elapsed / total) * 100)));
    };

    return (
        <div className="w-full mt-2 bg-gradient-to-r from-indigo-950/95 via-slate-900/95 to-violet-950/95 text-white px-3.5 sm:px-5 py-3.5 rounded-2xl shadow-lg border border-indigo-700/60 space-y-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-black text-[11px]">
                        ⚔️ 용병 길드 &amp; 토벌 캠프
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-extrabold">
                        총 전투력 {totalPower.toLocaleString()} · 승 {gameState.profile.totalExpeditionsWon} / 패{' '}
                        {gameState.profile.totalExpeditionsLost}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-200 text-[10px] font-extrabold">
                        🍱 보유 도시락 {totalDishes}개
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onOpenMercModal}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-black cursor-pointer transition-colors"
                    >
                        🛡️ 용병 영입·강화 ({gameState.mercenaries.length}/{gameState.profile.limits.maxMercs})
                    </button>
                    <button
                        type="button"
                        onClick={onOpenExpeditionModal}
                        className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-black cursor-pointer transition-colors"
                    >
                        ⚔️ 몬스터 원정 출정 ({gameState.activeExpeditions.length}/
                        {gameState.profile.limits.maxActiveExpeditions})
                    </button>
                    <button
                        type="button"
                        onClick={onGoToKitchen}
                        className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-[11px] font-black cursor-pointer transition-colors"
                    >
                        👨‍🍳 주방 가기
                    </button>
                </div>
            </div>

            {/* 진행 중 / 완료 대기 원정대 카드 */}
            {gameState.activeExpeditions.length === 0 ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                    <span>
                        현재 출정 중인 원정대가 없습니다. 용병을 영입하고 주방 도시락을 챙겨 몬스터 토벌을 떠나보세요!
                    </span>
                    <button
                        type="button"
                        onClick={onOpenExpeditionModal}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/90 hover:bg-rose-400 text-white text-[11px] font-black cursor-pointer shrink-0"
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
                                        ? 'bg-amber-950/60 border-amber-400/80'
                                        : 'bg-slate-800/85 border-indigo-500/50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-xs font-black text-white truncate">
                                            {zone?.emoji} {zone?.name || exp.zoneId}
                                        </div>
                                        <div className="text-[10px] text-slate-300 truncate">
                                            도시락: {recipe?.emoji} {recipe?.name} · 예상 승률{' '}
                                            <span className="text-emerald-300 font-black">
                                                {exp.predictedWinRate}%
                                            </span>
                                        </div>
                                    </div>
                                    {isFinished ? (
                                        <button
                                            type="button"
                                            disabled={isActing}
                                            onClick={() => onClaimExpedition(exp.id)}
                                            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black shrink-0 cursor-pointer disabled:opacity-50"
                                        >
                                            🏆 전리품 정산!
                                        </button>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono text-[11px] font-black shrink-0">
                                            {formatCountdownLabel(exp.endsAtMs, nowMs)}
                                        </span>
                                    )}
                                </div>

                                <svg viewBox="0 0 100 6" className="w-full h-1.5" aria-hidden="true">
                                    <rect x="0" y="0" width="100" height="6" rx="3" fill="#1e293b" />
                                    <rect
                                        x="0"
                                        y="0"
                                        width={pct}
                                        height="6"
                                        rx="3"
                                        fill={isFinished ? '#f59e0b' : '#818cf8'}
                                    />
                                </svg>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 최근 원정 전적 요약 */}
            {gameState.recentExpeditions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-black text-slate-400 mr-1">최근 원정:</span>
                    {gameState.recentExpeditions.slice(0, 4).map((rec) => {
                        const zone = gameState.catalog.zones.find((z) => z.zoneId === rec.zoneId);
                        return (
                            <span
                                key={`recent-exp-${rec.id}`}
                                className={`px-2 py-0.5 rounded-full border font-bold ${
                                    rec.status === 'won'
                                        ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-200'
                                        : 'bg-rose-900/50 border-rose-500/40 text-rose-200'
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
