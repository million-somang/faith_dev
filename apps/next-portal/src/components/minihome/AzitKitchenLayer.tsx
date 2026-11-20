'use client';

import React, { useMemo, useState } from 'react';
import type {
    AzitChefCode,
    AzitChefRecord,
    AzitFullGameState,
    AzitKitchenSlotState,
    AzitRecipeCatalogItem,
    AzitRecipeId,
} from '@/types/azit-game.types';
import { formatCountdownLabel, formatDurationCompact } from '@/types/azit-game.types';

const ORIGIN_X = 400;
const ORIGIN_Y = 236;
const TILE_W = 66;
const TILE_H = 33;

const KITCHEN_STOVE_COORDS: Array<{ slotIndex: number; gridX: number; gridY: number }> = [
    { slotIndex: 0, gridX: 2.1, gridY: 1.8 },
    { slotIndex: 1, gridX: 3.9, gridY: 1.8 },
    { slotIndex: 2, gridX: 5.7, gridY: 1.8 },
];

const CHEF_STATION_COORDS: Array<{ gridX: number; gridY: number }> = [
    { gridX: 1.6, gridY: 4.1 },
    { gridX: 3.2, gridY: 4.3 },
    { gridX: 4.7, gridY: 4.5 },
    { gridX: 6.1, gridY: 3.6 },
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

interface AzitKitchenIsoSceneProps {
    gameState: AzitFullGameState;
    nowMs: number;
    selectedSlotIndex: number | null;
    isActing?: boolean;
    onSelectSlot: (slotIndex: number) => void;
    onQuickClaimSlot?: (slotIndex: number) => Promise<boolean>;
    onEnterIndoor: () => void;
    onOpenChefModal: () => void;
    onOpenMarketModal: () => void;
}

export const AzitKitchenIsoScene: React.FC<AzitKitchenIsoSceneProps> = ({
    gameState,
    nowMs,
    selectedSlotIndex,
    isActing = false,
    onSelectSlot,
    onQuickClaimSlot,
    onEnterIndoor,
    onOpenChefModal,
    onOpenMarketModal,
}) => {
    const wallH = 166;
    const floorThick = 18;
    const top = { x: ORIGIN_X, y: ORIGIN_Y };
    const right = { x: ORIGIN_X + 8 * (TILE_W / 2), y: ORIGIN_Y + 8 * (TILE_H / 2) };
    const bottom = { x: ORIGIN_X, y: ORIGIN_Y + 8 * TILE_H };
    const left = { x: ORIGIN_X - 8 * (TILE_W / 2), y: ORIGIN_Y + 8 * (TILE_H / 2) };

    const recipeMap = useMemo(() => {
        const map = new Map<string, AzitRecipeCatalogItem>();
        gameState.catalog.recipes.forEach((r) => map.set(r.recipeId, r));
        return map;
    }, [gameState.catalog.recipes]);

    const chefCatalogMap = useMemo(() => {
        const map = new Map<string, { name: string; emoji: string }>();
        gameState.catalog.chefs.forEach((c) => map.set(c.chefCode, { name: c.name, emoji: c.emoji }));
        return map;
    }, [gameState.catalog.chefs]);

    const marketStallPos = getIsoCenter(5.8, 5.6);
    const exitDoorPos = getIsoCenter(0.9, 6.2);

    return (
        <g>
            {/* 왼쪽 뒷벽 (주방 타일 + 선반) */}
            <polygon
                points={`${left.x},${left.y} ${top.x},${top.y} ${top.x},${top.y - wallH} ${left.x},${left.y - wallH}`}
                fill="#fef3c7"
                stroke="#f59e0b"
                strokeWidth="1.2"
            />
            {/* 오른쪽 뒷벽 (따뜻한 셰프 월) */}
            <polygon
                points={`${top.x},${top.y} ${right.x},${right.y} ${right.x},${right.y - wallH} ${top.x},${top.y - wallH}`}
                fill="#ffedd5"
                stroke="#fb923c"
                strokeWidth="1.2"
            />
            {/* 상단 몰딩 */}
            <polygon
                points={`${left.x},${left.y - wallH} ${top.x},${top.y - wallH} ${top.x},${top.y - wallH - 10} ${left.x},${left.y - wallH - 10}`}
                fill="#92400e"
            />
            <polygon
                points={`${top.x},${top.y - wallH} ${right.x},${right.y - wallH} ${right.x},${right.y - wallH - 10} ${top.x},${top.y - wallH - 10}`}
                fill="#78350f"
            />

            {/* 오른쪽 벽 주방 창문 & 냄비 걸이 */}
            <g transform={`translate(${top.x + 115}, ${top.y - 78}) skewY(26.5)`}>
                <rect x="-46" y="-36" width="92" height="58" rx="4" fill="#bae6fd" stroke="#92400e" strokeWidth="4" />
                <line x1="0" y1="-36" x2="0" y2="22" stroke="#92400e" strokeWidth="3" />
                <line x1="-46" y1="-7" x2="46" y2="-7" stroke="#92400e" strokeWidth="3" />
                <circle cx="22" cy="-20" r="8" fill="#fef08a" opacity="0.85" />
            </g>

            {/* 왼쪽 벽 향신료 선반 & 간판 */}
            <g transform={`translate(${top.x - 115}, ${top.y - 72}) skewY(-26.5)`}>
                <rect x="-56" y="-26" width="112" height="10" rx="3" fill="#78350f" />
                <rect x="-42" y="-44" width="14" height="18" rx="2" fill="#ef4444" />
                <rect x="-20" y="-42" width="14" height="16" rx="2" fill="#22c55e" />
                <rect x="2" y="-45" width="16" height="19" rx="2" fill="#f59e0b" />
                <rect x="24" y="-40" width="14" height="14" rx="2" fill="#38bdf8" />
                <rect x="-48" y="8" width="96" height="24" rx="6" fill="#7c2d12" stroke="#fed7aa" strokeWidth="1.5" />
                <text x="0" y="23" textAnchor="middle" fill="#ffedd5" fontSize="10" fontWeight="900">
                    🍳 AZIT KITCHEN
                </text>
            </g>

            {/* 입체 주방 바닥 두께 */}
            <polygon
                points={`${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y + floorThick} ${left.x},${left.y + floorThick}`}
                fill="#b45309"
            />
            <polygon
                points={`${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y + floorThick} ${bottom.x},${bottom.y + floorThick}`}
                fill="#92400e"
            />

            {/* 8x8 따뜻한 테라코타/크림 체커보드 타일 바닥 */}
            {Array.from({ length: 8 }).map((_, gy) =>
                Array.from({ length: 8 }).map((__, gx) => {
                    const isAlt = (gx + gy) % 2 === 0;
                    return (
                        <polygon
                            key={`kitchen-tile-${gx}-${gy}`}
                            points={getIsoTilePolygon(gx, gy)}
                            fill={isAlt ? '#fff7ed' : '#fed7aa'}
                            stroke="#fdba74"
                            strokeWidth="0.7"
                        />
                    );
                })
            )}

            {/* 3개 아이소메트릭 주방 화구 */}
            {KITCHEN_STOVE_COORDS.map((coord) => {
                const slot = gameState.kitchenSlots.find((s) => s.slotIndex === coord.slotIndex);
                if (!slot) return null;
                const pos = getIsoCenter(coord.gridX, coord.gridY);
                const isSelected = selectedSlotIndex === slot.slotIndex;
                const isCooking = slot.status === 'cooking' && Boolean(slot.recipeId);
                const isReady = isCooking && slot.endsAtMs !== null && slot.endsAtMs <= nowMs;
                const recipe = slot.recipeId ? recipeMap.get(slot.recipeId) : undefined;
                const countdown = formatCountdownLabel(slot.endsAtMs, nowMs);

                return (
                    <g
                        key={`kitchen-stove-${slot.slotIndex}`}
                        data-kitchen-stove={slot.slotIndex}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectSlot(slot.slotIndex);
                        }}
                        className="cursor-pointer"
                    >
                        {isSelected && (
                            <ellipse
                                cx="0"
                                cy="4"
                                rx="42"
                                ry="21"
                                fill="rgba(249, 115, 22, 0.22)"
                                stroke="#f97316"
                                strokeWidth="2.5"
                            />
                        )}

                        {/* 화덕 베이스 블록 */}
                        <polygon
                            points="0,-24 38,-6 0,12 -38,-6"
                            fill={!slot.unlocked ? '#94a3b8' : isReady ? '#fef08a' : '#e2e8f0'}
                            stroke={!slot.unlocked ? '#475569' : '#94a3b8'}
                            strokeWidth="1.5"
                        />
                        <polygon
                            points="-38,-6 0,12 0,34 -38,16"
                            fill={!slot.unlocked ? '#64748b' : '#cbd5e1'}
                        />
                        <polygon
                            points="0,12 38,-6 38,16 0,34"
                            fill={!slot.unlocked ? '#475569' : '#94a3b8'}
                        />

                        {/* 화구 버너 링 */}
                        <ellipse
                            cx="0"
                            cy="-7"
                            rx="22"
                            ry="11"
                            fill={!slot.unlocked ? '#334155' : '#1e293b'}
                            stroke="#475569"
                            strokeWidth="1.5"
                        />

                        {/* 불꽃 및 조리 솥 */}
                        {isCooking && (
                            <g>
                                <ellipse
                                    cx="0"
                                    cy="-7"
                                    rx="16"
                                    ry="8"
                                    fill={isReady ? '#facc15' : '#f97316'}
                                    opacity="0.9"
                                />
                                {/* 냄비 몸체 */}
                                <ellipse cx="0" cy="-12" rx="17" ry="9" fill="#9a3412" stroke="#431407" strokeWidth="1.2" />
                                <rect x="-17" y="-27" width="34" height="15" rx="4" fill="#c2410c" stroke="#431407" strokeWidth="1.2" />
                                <ellipse cx="0" cy="-27" rx="17" ry="8" fill="#fb923c" stroke="#431407" strokeWidth="1.2" />
                                {/* 상승 김 효과 */}
                                <circle cx="-6" cy="-39" r="4" fill="#ffffff" opacity="0.8" />
                                <circle cx="5" cy="-44" r="5" fill="#ffffff" opacity="0.7" />
                                <text x="0" y="-22" textAnchor="middle" fontSize="14">
                                    {recipe?.emoji || '🍲'}
                                </text>
                            </g>
                        )}

                        {!slot.unlocked && (
                            <text x="0" y="-12" textAnchor="middle" fontSize="18">
                                🔒
                            </text>
                        )}

                        {slot.unlocked && !isCooking && (
                            <text x="0" y="-10" textAnchor="middle" fontSize="15" opacity="0.85">
                                🍳
                            </text>
                        )}

                        {/* 화구 상태 라벨 뱃지 (완성 시 클릭하면 즉시 원클릭 수령) */}
                        <g
                            transform="translate(0, -56)"
                            onClick={(e) => {
                                if (isReady && onQuickClaimSlot && !isActing) {
                                    e.stopPropagation();
                                    onQuickClaimSlot(slot.slotIndex).catch(() => {});
                                }
                            }}
                        >
                            <rect
                                x="-46"
                                y="-11"
                                width="92"
                                height="20"
                                rx="10"
                                fill={
                                    !slot.unlocked
                                        ? 'rgba(51, 65, 85, 0.92)'
                                        : isReady
                                          ? '#f59e0b'
                                          : isCooking
                                            ? 'rgba(15, 23, 42, 0.88)'
                                            : 'rgba(16, 185, 129, 0.92)'
                                }
                                stroke="#ffffff"
                                strokeWidth="1.2"
                            />
                            <text
                                x="0"
                                y="2.5"
                                textAnchor="middle"
                                fill={isReady ? '#0f172a' : '#ffffff'}
                                fontSize="9.5"
                                fontWeight="900"
                            >
                                {!slot.unlocked
                                    ? `Lv.${slot.unlockLevel} 해금`
                                    : isReady
                                      ? isActing
                                          ? '수령 중...'
                                          : '✨ 요리 수령!'
                                      : isCooking
                                        ? `⏱ ${countdown}`
                                        : `#${slot.slotIndex + 1} 조리 시작`}
                            </text>
                        </g>
                    </g>
                );
            })}

            {/* 고용된 요리사 2.5D 아바타 (미고용 시 모집 표지판 표시) */}
            {gameState.chefs.length > 0 ? (
                gameState.chefs.map((chef, idx) => {
                    const stCoord = CHEF_STATION_COORDS[idx] || CHEF_STATION_COORDS[0];
                    const pos = getIsoCenter(stCoord.gridX, stCoord.gridY);
                    const meta = chefCatalogMap.get(chef.chefCode);
                    const isBusy = gameState.kitchenSlots.some(
                        (s) => s.status === 'cooking' && s.chefCode === chef.chefCode
                    );
                    return (
                        <g
                            key={`chef-iso-${chef.chefCode}`}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenChefModal();
                            }}
                            className="cursor-pointer"
                        >
                            <ellipse cx="0" cy="4" rx="18" ry="8" fill="rgba(15, 23, 42, 0.22)" />
                            {/* 요리사 몸통 & 앞치마 */}
                            <rect x="-12" y="-32" width="24" height="30" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.4" />
                            <rect x="-9" y="-22" width="18" height="18" rx="4" fill="#fb923c" />
                            {/* 얼굴 */}
                            <circle cx="0" cy="-42" r="13" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
                            <circle cx="-4" cy="-42" r="1.6" fill="#0f172a" />
                            <circle cx="4" cy="-42" r="1.6" fill="#0f172a" />
                            {/* 셰프 모자 */}
                            <rect x="-11" y="-61" width="22" height="10" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
                            <circle cx="-5" cy="-64" r="6" fill="#ffffff" />
                            <circle cx="5" cy="-64" r="6" fill="#ffffff" />
                            <circle cx="0" cy="-66" r="7" fill="#ffffff" />
                            {/* 상태 배지 */}
                            <rect
                                x="-42"
                                y="10"
                                width="84"
                                height="17"
                                rx="8.5"
                                fill={isBusy ? '#ea580c' : 'rgba(15, 23, 42, 0.84)'}
                            />
                            <text x="0" y="21.5" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontWeight="800">
                                {meta?.emoji || '👨‍🍳'} {meta?.name || chef.chefCode} Lv.{chef.level}
                            </text>
                        </g>
                    );
                })
            ) : (
                <g
                    transform={`translate(${getIsoCenter(2.4, 4.4).x}, ${getIsoCenter(2.4, 4.4).y})`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenChefModal();
                    }}
                    className="cursor-pointer"
                >
                    <ellipse cx="0" cy="4" rx="22" ry="9" fill="rgba(15, 23, 42, 0.16)" />
                    <rect x="-4" y="-26" width="8" height="28" fill="#78350f" />
                    <rect x="-54" y="-56" width="108" height="32" rx="8" fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />
                    <text x="0" y="-42" textAnchor="middle" fill="#9a3412" fontSize="9.5" fontWeight="900">
                        👨‍🍳 요리사 미고용 상태
                    </text>
                    <text x="0" y="-30" textAnchor="middle" fill="#ea580c" fontSize="8.8" fontWeight="800">
                        클릭해 셰프 영입하기 →
                    </text>
                </g>
            )}

            {/* 우측 하단 장터 판매 가판대 */}
            <g
                transform={`translate(${marketStallPos.x}, ${marketStallPos.y})`}
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenMarketModal();
                }}
                className="cursor-pointer"
            >
                <ellipse cx="0" cy="4" rx="26" ry="11" fill="rgba(15, 23, 42, 0.18)" />
                <polygon points="-28,-8 0,6 28,-8 0,-22" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
                <rect x="-24" y="-40" width="48" height="22" rx="6" fill="#065f46" stroke="#a7f3d0" strokeWidth="1.4" />
                <text x="0" y="-26" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900">
                    💰 작물·요리 장터
                </text>
            </g>

            {/* 좌측 하단 실내 복귀 디딤돌 */}
            <g
                transform={`translate(${exitDoorPos.x}, ${exitDoorPos.y})`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEnterIndoor();
                }}
                className="cursor-pointer"
            >
                <ellipse cx="0" cy="4" rx="40" ry="12" fill="#c7d2fe" stroke="#4f46e5" strokeWidth="1.4" />
                <rect x="-44" y="-12" width="88" height="20" rx="10" fill="#4338ca" stroke="#e0e7ff" strokeWidth="1.2" />
                <text x="0" y="1.5" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontWeight="900">
                    🏠 실내로 들어가기
                </text>
            </g>
        </g>
    );
};

interface KitchenStoveActionBubbleProps {
    slot: AzitKitchenSlotState;
    gameState: AzitFullGameState;
    nowMs: number;
    isZoomed: boolean;
    isActing: boolean;
    onClose: () => void;
    onStartCooking: (slotIndex: number, recipeId: AzitRecipeId, chefCode?: AzitChefCode | null) => Promise<boolean>;
    onClaimCooking: (slotIndex: number) => Promise<boolean>;
    onOpenChefModal: () => void;
    onGoToGarden: () => void;
}

export const KitchenStoveActionBubble: React.FC<KitchenStoveActionBubbleProps> = ({
    slot,
    gameState,
    nowMs,
    isZoomed,
    isActing,
    onClose,
    onStartCooking,
    onClaimCooking,
    onOpenChefModal,
    onGoToGarden,
}) => {
    const busyChefCodes = useMemo(() => {
        const set = new Set<string>();
        gameState.kitchenSlots.forEach((s) => {
            if (s.status === 'cooking' && s.chefCode) {
                set.add(s.chefCode);
            }
        });
        return set;
    }, [gameState.kitchenSlots]);

    const firstIdleChef = useMemo<AzitChefCode | null>(() => {
        const found = gameState.chefs.find((c) => !busyChefCodes.has(c.chefCode));
        return found ? found.chefCode : null;
    }, [gameState.chefs, busyChefCodes]);

    const [selectedChefCode, setSelectedChefCode] = useState<AzitChefCode | null>(firstIdleChef);

    const activeChef: AzitChefRecord | undefined = useMemo(
        () => gameState.chefs.find((c) => c.chefCode === selectedChefCode && !busyChefCodes.has(c.chefCode)),
        [gameState.chefs, selectedChefCode, busyChefCodes]
    );

    const speedBonusPct = activeChef?.speedBonusPct ?? 0;
    const isCooking = slot.status === 'cooking' && Boolean(slot.recipeId);
    const isCompleted = isCooking && slot.endsAtMs !== null && slot.endsAtMs <= nowMs;
    const currentRecipe = slot.recipeId
        ? gameState.catalog.recipes.find((r) => r.recipeId === slot.recipeId)
        : undefined;

    const getPosClass = () => {
        if (isZoomed) return 'top-14 left-1/2 -translate-x-1/2 max-h-[82%] overflow-y-auto';
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[92%] overflow-y-auto';
    };

    const canCookRecipe = (recipe: AzitRecipeCatalogItem): { ok: boolean; missingText: string } => {
        if (gameState.profile.azitLevel < recipe.requiredAzitLevel) {
            return { ok: false, missingText: `Lv.${recipe.requiredAzitLevel} 필요` };
        }
        for (const ing of recipe.ingredients) {
            if (ing.kind === 'crop') {
                const owned = gameState.garden.harvestCounts[ing.id as keyof typeof gameState.garden.harvestCounts] || 0;
                if (owned < ing.qty) {
                    const cropDef = gameState.catalog.crops.find((c) => c.cropId === ing.id);
                    return { ok: false, missingText: `${cropDef?.shortName || ing.id} 부족` };
                }
            } else {
                const owned = gameState.materials[ing.id as keyof typeof gameState.materials] || 0;
                if (owned < ing.qty) {
                    const matDef = gameState.catalog.materials.find((m) => m.materialId === ing.id);
                    return { ok: false, missingText: `${matDef?.name || ing.id} 부족` };
                }
            }
        }
        return { ok: true, missingText: '' };
    };

    return (
        <div
            data-kitchen-bubble="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`absolute z-30 ${getPosClass()} w-[264px] sm:w-[300px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border-2 border-orange-400/90 shadow-2xl p-3 space-y-2.5`}
        >
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-700/80">
                <div className="text-xs font-black text-amber-200">
                    🍳 #{slot.slotIndex + 1}번 주방 화구
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="말풍선 닫기"
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black flex items-center justify-center cursor-pointer"
                >
                    ×
                </button>
            </div>

            {!slot.unlocked ? (
                <div className="space-y-2 text-center py-2">
                    <div className="text-xs font-black text-slate-200">
                        🔒 아지트 Lv.{slot.unlockLevel} 달성 시 해금됩니다
                    </div>
                    <p className="text-[11px] text-slate-400">
                        현재 아지트 Lv.{gameState.profile.azitLevel} · 수확·요리·원정으로 경험치를 올려보세요!
                    </p>
                </div>
            ) : isCompleted && currentRecipe ? (
                <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/60 text-center">
                        <div className="text-sm font-black text-amber-200">
                            {currentRecipe.emoji} {currentRecipe.name} 완성!
                        </div>
                        <div className="text-[11px] text-amber-100/90 mt-0.5">
                            판매가 {currentRecipe.sellPrice.toLocaleString()}P · 티어 {currentRecipe.tier} 원정 도시락
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={isActing}
                        onClick={async () => {
                            const ok = await onClaimCooking(slot.slotIndex);
                            if (ok) onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50"
                    >
                        {isActing ? '수령 중...' : '🍱 완성된 요리 수령하기'}
                    </button>
                </div>
            ) : isCooking && currentRecipe ? (
                <div className="space-y-2 text-center py-1">
                    <div className="text-xs font-black text-orange-200">
                        {currentRecipe.emoji} {currentRecipe.name} 조리 중
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-sm font-black text-amber-300">
                        남은 시간 {formatCountdownLabel(slot.endsAtMs, nowMs)}
                    </div>
                    <p className="text-[10px] text-slate-400">
                        서버에서 안전하게 조리 중입니다. 다른 탭을 이용하셔도 완료됩니다.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* 요리사 선택 */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                            <span>담당 요리사 선택</span>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenChefModal();
                                }}
                                className="text-orange-300 hover:underline cursor-pointer"
                            >
                                셰프 영입·승급 →
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            <button
                                type="button"
                                onClick={() => setSelectedChefCode(null)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors ${
                                    activeChef === undefined
                                        ? 'bg-orange-500 text-slate-950'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                🍳 수습 조리 (1.0x)
                            </button>
                            {gameState.chefs.map((chef) => {
                                const def = gameState.catalog.chefs.find((c) => c.chefCode === chef.chefCode);
                                const isBusy = busyChefCodes.has(chef.chefCode);
                                const isPicked = activeChef?.chefCode === chef.chefCode;
                                return (
                                    <button
                                        key={`pick-chef-${chef.chefCode}`}
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => setSelectedChefCode(chef.chefCode)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                                            isBusy
                                                ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                                                : isPicked
                                                  ? 'bg-emerald-500 text-slate-950 cursor-pointer'
                                                  : 'bg-slate-800 text-emerald-200 hover:bg-slate-700 cursor-pointer'
                                        }`}
                                    >
                                        {def?.emoji} {def?.name} {isBusy ? '(조리중)' : `-${chef.speedBonusPct}%`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 레시피 목록 */}
                    <div className="space-y-1 max-h-[210px] overflow-y-auto pr-0.5">
                        {gameState.catalog.recipes.map((recipe) => {
                            const check = canCookRecipe(recipe);
                            const effSec = Math.max(
                                15,
                                Math.round(recipe.cookDurationSec * (1 - speedBonusPct / 100))
                            );
                            return (
                                <button
                                    key={`bubble-recipe-${recipe.recipeId}`}
                                    type="button"
                                    disabled={!check.ok || isActing}
                                    onClick={async () => {
                                        const ok = await onStartCooking(
                                            slot.slotIndex,
                                            recipe.recipeId,
                                            activeChef?.chefCode ?? null
                                        );
                                        if (ok) onClose();
                                    }}
                                    className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                        check.ok
                                            ? 'bg-slate-800 hover:bg-orange-950/70 border-slate-700 hover:border-orange-400 cursor-pointer'
                                            : 'bg-slate-900/60 border-slate-800 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-black text-white truncate flex items-center gap-1">
                                            <span>{recipe.emoji}</span>
                                            <span>{recipe.name}</span>
                                            <span className="px-1 py-0.2 rounded bg-slate-700 text-[9px] text-amber-300">
                                                T{recipe.tier}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-300 truncate mt-0.5">
                                            {recipe.ingredients
                                                .map((ing) => {
                                                    if (ing.kind === 'crop') {
                                                        const c = gameState.catalog.crops.find(
                                                            (cr) => cr.cropId === ing.id
                                                        );
                                                        return `${c?.emoji || ''}${c?.shortName || ing.id}×${ing.qty}`;
                                                    }
                                                    const m = gameState.catalog.materials.find(
                                                        (mt) => mt.materialId === ing.id
                                                    );
                                                    return `${m?.emoji || ''}${m?.name || ing.id}×${ing.qty}`;
                                                })
                                                .join(' + ')}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {check.ok ? (
                                            <>
                                                <div className="text-[10px] font-black text-emerald-300">
                                                    {formatDurationCompact(effSec)}
                                                </div>
                                                <div className="text-[9.5px] font-bold text-amber-300">
                                                    판매 {recipe.sellPrice}P
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-[10px] font-bold text-rose-300">
                                                {check.missingText}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onGoToGarden();
                        }}
                        className="w-full py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-200 text-[10px] font-extrabold cursor-pointer"
                    >
                        🌿 텃밭에서 작물 수확하기 →
                    </button>
                </div>
            )}
        </div>
    );
};

interface AzitKitchenControlPanelProps {
    gameState: AzitFullGameState;
    nowMs: number;
    isActing: boolean;
    onClaimCooking: (slotIndex: number) => Promise<boolean>;
    onOpenChefModal: () => void;
    onOpenMarketModal: () => void;
    onGoToCamp: () => void;
}

export const AzitKitchenControlPanel: React.FC<AzitKitchenControlPanelProps> = ({
    gameState,
    nowMs,
    isActing,
    onClaimCooking,
    onOpenChefModal,
    onOpenMarketModal,
    onGoToCamp,
}) => {
    const readySlots = gameState.kitchenSlots.filter(
        (s) => s.status === 'cooking' && s.endsAtMs !== null && s.endsAtMs <= nowMs
    );
    const totalDishes = Object.values(gameState.dishes).reduce((acc, v) => acc + v, 0);

    return (
        <div className="w-full mt-2 bg-gradient-to-r from-orange-950/95 via-slate-900/95 to-amber-950/95 text-white px-3.5 sm:px-5 py-3.5 rounded-2xl shadow-lg border border-orange-700/60 space-y-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-slate-950 font-black text-[11px]">
                        👨‍🍳 아지트 주방
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-extrabold">
                        화구 {gameState.profile.limits.kitchenSlots}/3개 해금
                    </span>
                    <span className="text-[11px] font-bold text-slate-300">
                        👆 위 화구를 클릭해 요리를 시작하거나 완성 요리를 수령하세요
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onOpenChefModal}
                        className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-[11px] font-black cursor-pointer transition-colors"
                    >
                        👨‍🍳 요리사 관리 ({gameState.chefs.length}/{gameState.profile.limits.maxChefs})
                    </button>
                    <button
                        type="button"
                        onClick={onOpenMarketModal}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black cursor-pointer transition-colors"
                    >
                        💰 작물·요리 장터
                    </button>
                    <button
                        type="button"
                        onClick={onGoToCamp}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-black cursor-pointer transition-colors"
                    >
                        ⚔️ 용병 캠프 →
                    </button>
                </div>
            </div>

            {readySlots.length > 0 && (
                <div className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/60 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-amber-200">
                        🔔 완성된 요리가 {readySlots.length}개 있습니다!
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {readySlots.map((slot) => (
                            <button
                                key={`quick-claim-${slot.slotIndex}`}
                                type="button"
                                disabled={isActing}
                                onClick={() => onClaimCooking(slot.slotIndex)}
                                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black cursor-pointer disabled:opacity-50"
                            >
                                #{slot.slotIndex + 1} 화구 즉시 수령
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 보유 완성 요리 & 몬스터 드롭 재료 현황 */}
            <div className="pt-1 space-y-1.5 text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-amber-300">🍱 보유 요리 · 도시락 ({totalDishes}개)</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {gameState.catalog.materials.map((mat) => {
                            const qty = gameState.materials[mat.materialId] || 0;
                            return (
                                <span
                                    key={`mat-chip-${mat.materialId}`}
                                    className={`px-2 py-0.5 rounded-md border font-bold ${
                                        qty > 0
                                            ? 'bg-violet-900/70 border-violet-500/50 text-violet-100'
                                            : 'bg-slate-800/70 border-slate-700 text-slate-400'
                                    }`}
                                >
                                    {mat.emoji} {mat.name} {qty}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {gameState.catalog.recipes.map((recipe) => {
                        const qty = gameState.dishes[recipe.recipeId] || 0;
                        return (
                            <span
                                key={`dish-chip-${recipe.recipeId}`}
                                className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
                                    qty > 0
                                        ? 'bg-orange-900/70 border-orange-500/60 text-orange-100'
                                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                                }`}
                            >
                                <span>{recipe.emoji}</span>
                                <span>{recipe.name}</span>
                                <span className="text-amber-300 font-mono">×{qty}</span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
