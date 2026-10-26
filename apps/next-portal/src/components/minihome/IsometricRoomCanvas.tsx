'use client';

import React, { useState, useEffect } from 'react';
import { GardenCropId, GardenPlotItem, MinihomeRoomLayout, PlacedRoomItem } from '@/types/minihome.types';
import { ensureGardenState, getCatalogItemById } from '@/data/minihomeCatalogData';
import { useWeather, WeatherSceneType } from '@/hooks/useWeather';
import { ForcedGardenActionTrigger, GARDEN_PLOT_COORDS, useAvatarLifeSim } from '@/hooks/useAvatarLifeSim';
import { MinihomeAvatarActionOverlay } from '@/components/minihome/MinihomeAvatarActionOverlay';
import {
    GardenBenchAndWateringCan,
    GardenCourtyardBackdrop,
    GardenPlotIsoNode,
    MinihomeGardenControlPanel,
} from '@/components/minihome/MinihomeGardenLayer';

interface IsometricRoomCanvasProps {
    layout: MinihomeRoomLayout;
    ownerName: string;
    roomTitle?: string;
    isOwner?: boolean;
    onSaveRoomTitle?: (newTitle: string) => void;
    guestbookCount?: number;
    onOpenGuestbookModal?: () => void;
    isEditMode: boolean;
    selectedTargetId: string;
    onSelectTarget: (targetId: string) => void;
    onTileClick: (gridX: number, gridY: number) => void;
    onFlipSelected: () => void;
    onRemoveSelected: () => void;
    onChangeSpeechBubble?: (text: string) => void;
    onOpenShopModal?: () => void;
    onOpenSeedShopModal?: () => void;
    onOpenWarehouseModal?: () => void;
    onSaveRoom?: () => void;
    onCancelEdit?: () => void;
    isSaving?: boolean;
    onPlantCrop?: (plotIndex: number, cropId: GardenCropId) => void;
    onWaterPlot?: (plotIndex: number) => void;
    onHarvestPlot?: (plotIndex: number) => void;
    onClearPlot?: (plotIndex: number) => void;
}

const ORIGIN_X = 400;
const ORIGIN_Y = 236;
const TILE_W = 66;
const TILE_H = 33;
const WALL_H = 172;
const WALL_THICK = 14;
const FLOOR_THICK = 18;

function getTileCenter(gridX: number, gridY: number): { x: number; y: number } {
    const x = ORIGIN_X + (gridX - gridY) * (TILE_W / 2);
    const y = ORIGIN_Y + (gridX + gridY + 1) * (TILE_H / 2);
    return { x, y };
}

function getTilePolygonPoints(gridX: number, gridY: number): string {
    const topX = ORIGIN_X + (gridX - gridY) * (TILE_W / 2);
    const topY = ORIGIN_Y + (gridX + gridY) * (TILE_H / 2);
    const rightX = topX + TILE_W / 2;
    const rightY = topY + TILE_H / 2;
    const bottomX = topX;
    const bottomY = topY + TILE_H;
    const leftX = topX - TILE_W / 2;
    const leftY = topY + TILE_H / 2;
    return `${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`;
}

export const IsometricRoomCanvas: React.FC<IsometricRoomCanvasProps> = ({
    layout,
    ownerName,
    roomTitle,
    isOwner = false,
    onSaveRoomTitle,
    guestbookCount = 0,
    onOpenGuestbookModal,
    isEditMode,
    selectedTargetId,
    onSelectTarget,
    onTileClick,
    onFlipSelected,
    onRemoveSelected,
    onChangeSpeechBubble,
    onOpenShopModal,
    onOpenSeedShopModal,
    onOpenWarehouseModal,
    onSaveRoom,
    onCancelEdit,
    isSaving,
    onPlantCrop,
    onWaterPlot,
    onHarvestPlot,
    onClearPlot,
}) => {
    const [activeZone, setActiveZone] = useState<'indoor' | 'garden'>('indoor');
    const [selectedPlotIndex, setSelectedPlotIndex] = useState<number>(0);
    const [forcedGardenAction, setForcedGardenAction] = useState<ForcedGardenActionTrigger | null>(null);

    useEffect(() => {
        if (isEditMode && activeZone === 'garden') {
            setActiveZone('indoor');
        }
    }, [isEditMode, activeZone]);

    const { weather } = useWeather();
    const avatarSim = useAvatarLifeSim({ layout, isEditMode, activeZone, forcedGardenAction });
    const gardenState = ensureGardenState(layout.garden);
    const readyHarvestCount = gardenState.plots.filter((p) => p.cropId && p.stage === 3).length;
    const defaultRoomTitle = `${ownerName}님의 2.5D 아이소메트릭 아지트`;
    const displayRoomTitle = roomTitle?.trim() || defaultRoomTitle;

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(displayRoomTitle);

    useEffect(() => {
        if (!isEditingTitle) {
            setTitleDraft(displayRoomTitle);
        }
    }, [displayRoomTitle, isEditingTitle]);

    const handleConfirmTitleSave = () => {
        const trimmed = titleDraft.trim() || defaultRoomTitle;
        if (onSaveRoomTitle) {
            onSaveRoomTitle(trimmed);
        }
        setIsEditingTitle(false);
    };

    const weatherScene: WeatherSceneType = weather?.scene || 'clear-day';
    const isNightWeather =
        weatherScene === 'clear-night' || weatherScene === 'partly-cloudy-night' || (weather ? !weather.isDay : false);
    const isRainWeather = weatherScene === 'rain' || weatherScene === 'thunderstorm';
    const isSnowWeather = weatherScene === 'snow';
    const isCloudyWeather =
        weatherScene === 'partly-cloudy-day' ||
        weatherScene === 'partly-cloudy-night' ||
        weatherScene === 'cloudy' ||
        weatherScene === 'fog' ||
        isRainWeather ||
        isSnowWeather;
    // 벽면 스타일 테마 컬러 계산 (입체 두께감 포함)
    const getWallTheme = (wallId: string) => {
        switch (wallId) {
            case 'wall-cozy-beige':
                return {
                    left: '#f5ebe0',
                    right: '#e3d5ca',
                    topCap: '#faf5f0',
                    outerSide: '#d5bdaf',
                    baseboard: '#b08968',
                    stripe: 'rgba(213, 189, 175, 0.25)',
                };
            case 'wall-pastel-sky':
                return {
                    left: '#e0f2fe',
                    right: '#bae6fd',
                    topCap: '#f0f9ff',
                    outerSide: '#7dd3fc',
                    baseboard: '#38bdf8',
                    stripe: 'rgba(125, 211, 252, 0.28)',
                };
            case 'wall-retro-brick':
                return {
                    left: '#b91c1c',
                    right: '#991b1b',
                    topCap: '#dc2626',
                    outerSide: '#7f1d1d',
                    baseboard: '#450a0a',
                    stripe: 'rgba(254, 202, 202, 0.16)',
                };
            case 'wall-hanok-paper':
                return {
                    left: '#fef3c7',
                    right: '#fde68a',
                    topCap: '#fffbeb',
                    outerSide: '#b45309',
                    baseboard: '#78350f',
                    stripe: 'rgba(146, 64, 14, 0.22)',
                };
            case 'wall-cyber-neon':
                return {
                    left: '#1e1b4b',
                    right: '#0f172a',
                    topCap: '#312e81',
                    outerSide: '#4338ca',
                    baseboard: '#6366f1',
                    stripe: 'rgba(99, 102, 241, 0.22)',
                };
            case 'wall-vip-gold':
                return {
                    left: '#fffbeb',
                    right: '#fef3c7',
                    topCap: '#ffffff',
                    outerSide: '#d97706',
                    baseboard: '#b45309',
                    stripe: 'rgba(245, 158, 11, 0.22)',
                };
            default:
                return {
                    left: '#f8fafc',
                    right: '#e2e8f0',
                    topCap: '#ffffff',
                    outerSide: '#cbd5e1',
                    baseboard: '#94a3b8',
                    stripe: 'rgba(148, 163, 184, 0.18)',
                };
        }
    };

    // 바닥 스타일 테마 컬러 계산
    const getFloorTheme = (floorId: string) => {
        switch (floorId) {
            case 'floor-gray-tile':
                return {
                    base: '#e2e8f0',
                    alt: '#dbe4ef',
                    line: '#cbd5e1',
                    sideLeft: '#94a3b8',
                    sideRight: '#64748b',
                };
            case 'floor-herringbone':
                return {
                    base: '#d97706',
                    alt: '#c86a04',
                    line: '#92400e',
                    sideLeft: '#92400e',
                    sideRight: '#78350f',
                };
            case 'floor-green-lawn':
                return {
                    base: '#4ade80',
                    alt: '#3dd674',
                    line: '#22c55e',
                    sideLeft: '#16a34a',
                    sideRight: '#15803d',
                };
            case 'floor-retro-checker':
                return {
                    base: '#f8fafc',
                    alt: '#334155',
                    line: '#475569',
                    sideLeft: '#475569',
                    sideRight: '#1e293b',
                };
            case 'floor-galaxy':
                return {
                    base: '#312e81',
                    alt: '#28256e',
                    line: '#4f46e5',
                    sideLeft: '#1e1b4b',
                    sideRight: '#0f172a',
                };
            default:
                return {
                    base: '#f3d5b5',
                    alt: '#ecc8a1',
                    line: '#d4a373',
                    sideLeft: '#bc8a5f',
                    sideRight: '#9c6644',
                };
        }
    };

    const wallTheme = getWallTheme(layout.wallItemId);
    const floorTheme = getFloorTheme(layout.floorItemId);

    // 8x8 전체 바닥 다이아몬드 꼭짓점
    const floorTop = { x: ORIGIN_X, y: ORIGIN_Y };
    const floorRight = { x: ORIGIN_X + 8 * (TILE_W / 2), y: ORIGIN_Y + 8 * (TILE_H / 2) };
    const floorBottom = { x: ORIGIN_X, y: ORIGIN_Y + 16 * (TILE_H / 2) };
    const floorLeft = { x: ORIGIN_X - 8 * (TILE_W / 2), y: ORIGIN_Y + 8 * (TILE_H / 2) };

    // 러그류(바닥 밀착형)와 일반 입체 가구 분리 후 Z-Order 정렬
    const rugItems = layout.placedItems.filter((i) => i.itemId === 'prop-coffee-rug');
    const standingItems = layout.placedItems.filter((i) => i.itemId !== 'prop-coffee-rug');

    type RenderEntity =
        | { kind: 'item'; depth: number; data: PlacedRoomItem }
        | { kind: 'minimi'; depth: number };

    const sortedEntities: RenderEntity[] = [
        ...standingItems.map((item) => ({
            kind: 'item' as const,
            depth: item.gridX + item.gridY,
            data: item,
        })),
        {
            kind: 'minimi' as const,
            depth: avatarSim.animX + avatarSim.animY + 0.1,
        },
    ].sort((a, b) => a.depth - b.depth);

    type GardenRenderEntity =
        | { kind: 'plot'; depth: number; plot: GardenPlotItem; gridX: number; gridY: number }
        | { kind: 'bench'; depth: number; gridX: number; gridY: number }
        | { kind: 'minimi'; depth: number };

    const sortedGardenEntities: GardenRenderEntity[] = [
        ...gardenState.plots.map((plot) => {
            const coord = GARDEN_PLOT_COORDS[plot.plotIndex] || GARDEN_PLOT_COORDS[0];
            return {
                kind: 'plot' as const,
                depth: coord.gridX + coord.gridY,
                plot,
                gridX: coord.gridX,
                gridY: coord.gridY,
            };
        }),
        {
            kind: 'bench' as const,
            depth: 0 + 4,
            gridX: 0,
            gridY: 4,
        },
        {
            kind: 'minimi' as const,
            depth: avatarSim.animX + avatarSim.animY + 0.1,
        },
    ].sort((a, b) => a.depth - b.depth);

    // 나노바나나 고해상도 2.5D 스프라이트 렌더러 (가구/소품/펫/트로피)
    const renderItemGraphic = (itemId: string) => {
        const meta = getCatalogItemById(itemId);
        const spriteUrl = meta?.spriteUrl || `/images/minihome/items/${itemId}.png`;
        const w = meta?.spriteWidth || 88;
        const h = meta?.spriteHeight || 88;
        const offsetY = meta?.spriteOffsetY ?? 18;
        const isRug = itemId === 'prop-coffee-rug';

        return (
            <g>
                {/* 자연스러운 바닥 접지 그림자 */}
                {!isRug && (
                    <ellipse
                        cx="0"
                        cy="6"
                        rx={Math.round(w * 0.34)}
                        ry={Math.round(w * 0.17)}
                        fill="rgba(15, 23, 42, 0.22)"
                    />
                )}
                <image
                    href={spriteUrl}
                    x={-w / 2}
                    y={-h + offsetY}
                    width={w}
                    height={h}
                    preserveAspectRatio="xMidYMax meet"
                />
            </g>
        );
    };

    // 나노바나나 고해상도 3D 미니미 아바타 렌더러 (자율 이동·앉기·상황별 리얼 모션 & 소품 애니메이션 반영)
    const renderMinimiGraphic = (minimiId: string) => {
        const meta = getCatalogItemById(minimiId);
        const spriteUrl = meta?.spriteUrl || `/images/minihome/items/${minimiId}.png`;
        const w = meta?.spriteWidth || 98;
        const h = meta?.spriteHeight || 98;
        const offsetY = meta?.spriteOffsetY ?? 14;
        const totalOffsetY = avatarSim.sitOffsetY + avatarSim.bobOffsetY;
        const shadowScale = avatarSim.isWalking ? 0.92 : avatarSim.isSitting ? 1.08 : 1;

        return (
            <g>
                {/* 발 밑 바닥 그림자 */}
                <ellipse
                    cx="0"
                    cy="6"
                    rx={Math.round(24 * shadowScale)}
                    ry={Math.round(12 * shadowScale)}
                    fill="rgba(15, 23, 42, 0.26)"
                />
                <g
                    transform={`translate(0, ${totalOffsetY}) scale(${avatarSim.facingLeft ? -1 : 1}, ${
                        avatarSim.isSitting ? 0.94 : 1
                    }) rotate(${avatarSim.tiltDeg || 0} 0 -18)`}
                >
                    <image
                        href={spriteUrl}
                        x={-w / 2}
                        y={-h + offsetY}
                        width={w}
                        height={h}
                        preserveAspectRatio="xMidYMax meet"
                    />
                </g>
                {/* 상황별 실시간 소품(물조리개·찻잔·책 등) 및 파티클 애니메이션 오버레이 */}
                <MinihomeAvatarActionOverlay
                    simState={avatarSim}
                    isEditMode={isEditMode}
                    isRainWeather={isRainWeather}
                    isNightWeather={isNightWeather}
                />
            </g>
        );
    };

    const selectedItemMeta =
        selectedTargetId === 'minimi'
            ? getCatalogItemById(layout.minimiItemId)
            : getCatalogItemById(
                  layout.placedItems.find((i) => i.instanceId === selectedTargetId)?.itemId || ''
              );

    return (
        <div className="relative h-full flex-1 flex flex-col bg-gradient-to-b from-slate-100 via-white to-slate-100 rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            {/* 상단 아지트 뱃지 & 아지트 이름 수정 / 방명록·상점 팝업 안내 바 (2줄 구조) */}
            <div className="flex flex-col gap-2.5 px-4 sm:px-5 py-3.5 bg-white/90 backdrop-blur-xs border-b border-slate-200/70 shrink-0">
                {/* 1번째 줄: MY AGIT 뱃지 + 아지트 이름 전체 + 수정 버튼 */}
                <div className="w-full flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-black tracking-wide shrink-0">
                        MY AGIT
                    </span>

                    {isEditingTitle && isOwner ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-md">
                            <input
                                type="text"
                                maxLength={40}
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmTitleSave();
                                    if (e.key === 'Escape') {
                                        setTitleDraft(displayRoomTitle);
                                        setIsEditingTitle(false);
                                    }
                                }}
                                placeholder="나만의 아지트 이름을 입력하세요"
                                className="flex-1 min-w-0 px-2.5 py-1 rounded-xl bg-indigo-50/80 border border-indigo-300 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={handleConfirmTitleSave}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shrink-0 cursor-pointer transition-colors"
                            >
                                저장
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTitleDraft(displayRoomTitle);
                                    setIsEditingTitle(false);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-800 break-words">
                                {displayRoomTitle}
                            </span>
                            {isOwner && onSaveRoomTitle && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTitleDraft(displayRoomTitle);
                                        setIsEditingTitle(true);
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200/90 text-[10px] font-extrabold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                                    title="아지트 이름 수정"
                                >
                                    <i className="fas fa-pen text-[9px]"></i>
                                    <span>수정</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 2번째 줄: 가구 배치 현황 + 방명록 + 상점·보관함 팝업 버튼 */}
                {isEditMode ? (
                    <div className="w-full flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                            <i className="fas fa-hand-pointer animate-bounce"></i>
                            <span>바닥 타일 클릭 시 [{selectedItemMeta?.name || '아바타'}] 이동</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {onOpenShopModal && (
                                <button
                                    type="button"
                                    onClick={onOpenShopModal}
                                    className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>🎁 아지트 상점·보관함 팝업</span>
                                </button>
                            )}
                            {onCancelEdit && (
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                    취소
                                </button>
                            )}
                            {onSaveRoom && (
                                <button
                                    type="button"
                                    onClick={onSaveRoom}
                                    disabled={isSaving}
                                    className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? '저장 중...' : '💾 저장'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        {/* 좌측: 실내 아지트 ↔ 앞마당 텃밭 공간 전환 스위치 */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/90">
                                <button
                                    type="button"
                                    onClick={() => setActiveZone('indoor')}
                                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                        activeZone === 'indoor'
                                            ? 'bg-indigo-600 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span>🏠 실내 아지트</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveZone('garden')}
                                    data-screenshot-click="action"
                                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                        activeZone === 'garden'
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                >
                                    <span>🌿 앞마당 텃밭</span>
                                    {readyHarvestCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                                            수확 {readyHarvestCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <span className="hidden sm:inline text-[11px] text-slate-400 font-bold">
                                {activeZone === 'indoor'
                                    ? `· 가구 ${layout.placedItems.length}개`
                                    : `· 수확 누적 ${gardenState.totalHarvested}개`}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {onOpenGuestbookModal && (
                                <button
                                    type="button"
                                    onClick={onOpenGuestbookModal}
                                    className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <span>📖 방명록 ({guestbookCount})</span>
                                </button>
                            )}
                            {onOpenWarehouseModal && (
                                <button
                                    type="button"
                                    onClick={onOpenWarehouseModal}
                                    className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <span>🏚️ 농장 창고</span>
                                </button>
                            )}
                            {onOpenShopModal && (
                                <button
                                    type="button"
                                    onClick={onOpenShopModal}
                                    className="px-2.5 sm:px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <span>🎁 상점·보관함 (0원)</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 메인 2.5D 아이소메트릭 디오라마 스테이지 */}
            <div
                className="relative w-full flex-1 min-h-[300px] sm:min-h-[460px] lg:min-h-[560px] p-2 sm:p-4 flex flex-col items-center justify-center select-none"
                data-screenshot-point="result"
            >
                {/* 실시간 외부 날씨 배지 (포털 날씨 위젯 100% 연동) */}
                {weather && (
                    <div
                        className={`absolute top-2.5 right-2.5 sm:top-3.5 sm:right-4 z-10 px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-xs flex items-center gap-1.5 text-[11px] font-extrabold transition-colors ${
                            isNightWeather
                                ? 'bg-slate-900/85 text-slate-100 border-indigo-400/40'
                                : isRainWeather
                                ? 'bg-sky-900/80 text-sky-100 border-sky-400/40'
                                : 'bg-white/90 text-slate-800 border-slate-200/90'
                        }`}
                        title="포털 날씨 위젯 실시간 연동 날씨"
                    >
                        <i className={`fas ${weather.icon} text-xs`}></i>
                        <span>{weather.temp.toFixed(1)}°</span>
                        <span>{weather.label}</span>
                        <span className="text-[10px] opacity-75">({weather.location})</span>
                    </div>
                )}

                <svg
                    viewBox="95 30 610 505"
                    className="w-full flex-1 object-contain"
                    role="img"
                    aria-label={`${ownerName}의 미니룸 캔버스`}
                >
                    <defs>
                        <radialGradient id="roomGlow" cx="50%" cy="42%" r="58%">
                            <stop
                                offset="0%"
                                stopColor={
                                    isNightWeather
                                        ? '#1e1b4b'
                                        : isRainWeather
                                        ? '#bae6fd'
                                        : isSnowWeather
                                        ? '#e0f2fe'
                                        : weatherScene === 'cloudy' || weatherScene === 'fog'
                                        ? '#cbd5e1'
                                        : '#bae6fd'
                                }
                                stopOpacity={isNightWeather ? '0.88' : '0.75'}
                            />
                            <stop
                                offset="65%"
                                stopColor={
                                    isNightWeather
                                        ? '#312e81'
                                        : isRainWeather
                                        ? '#e0f2fe'
                                        : '#e0e7ff'
                                }
                                stopOpacity={isNightWeather ? '0.35' : '0.42'}
                            />
                            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="sunlightRay" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop
                                offset="0%"
                                stopColor={
                                    isNightWeather
                                        ? '#c7d2fe'
                                        : isRainWeather || weatherScene === 'cloudy'
                                        ? '#bae6fd'
                                        : '#fef08a'
                                }
                                stopOpacity={isNightWeather ? '0.26' : isRainWeather ? '0.18' : '0.36'}
                            />
                            <stop
                                offset="100%"
                                stopColor={isNightWeather ? '#c7d2fe' : '#fef08a'}
                                stopOpacity="0"
                            />
                        </linearGradient>
                        <filter id="roomDropShadow" x="-15%" y="-10%" width="130%" height="130%">
                            <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.16" />
                        </filter>
                    </defs>

                    {/* ==================== 0. 아지트 바깥 실시간 날씨 배경 (외벽 뒤쪽 하늘) ==================== */}
                    <rect x="0" y="0" width="800" height="540" fill="url(#roomGlow)" />

                    {/* 아지트 외벽 바깥 상단 하늘 아우라 */}
                    <ellipse
                        cx="400"
                        cy="155"
                        rx="285"
                        ry="115"
                        fill={
                            isNightWeather
                                ? 'rgba(30, 27, 75, 0.72)'
                                : isRainWeather
                                ? 'rgba(100, 116, 139, 0.34)'
                                : isSnowWeather
                                ? 'rgba(186, 230, 253, 0.55)'
                                : weatherScene === 'cloudy' || weatherScene === 'fog'
                                ? 'rgba(148, 163, 184, 0.34)'
                                : 'rgba(125, 211, 252, 0.42)'
                        }
                    />

                    {/* 낮/맑음·구름조금: 아지트 바깥 하늘의 태양 */}
                    {!isNightWeather && (weatherScene === 'clear-day' || weatherScene === 'partly-cloudy-day') && (
                        <g transform="translate(205, 78)">
                            <circle cx="0" cy="0" r="28" fill="#fef08a" opacity="0.45" />
                            <circle cx="0" cy="0" r="19" fill="#facc15" />
                            <circle cx="-4" cy="-4" r="6" fill="#fef9c3" opacity="0.8" />
                        </g>
                    )}

                    {/* 밤: 아지트 바깥 밤하늘의 초승달과 별빛 */}
                    {isNightWeather && (
                        <g>
                            {/* 반짝이는 별들 */}
                            {[
                                { x: 155, y: 92, r: 2.2 },
                                { x: 245, y: 66, r: 1.8 },
                                { x: 335, y: 52, r: 2.5 },
                                { x: 465, y: 55, r: 2.1 },
                                { x: 560, y: 74, r: 2.6 },
                                { x: 635, y: 105, r: 1.9 },
                                { x: 185, y: 140, r: 1.6 },
                                { x: 615, y: 145, r: 2.2 },
                            ].map((star, idx) => (
                                <circle
                                    key={`sky-star-${idx}`}
                                    cx={star.x}
                                    cy={star.y}
                                    r={star.r}
                                    fill="#fef08a"
                                    opacity="0.9"
                                />
                            ))}
                            {/* 초승달 */}
                            <g transform="translate(210, 78)">
                                <circle cx="0" cy="0" r="22" fill="#fef08a" opacity="0.25" />
                                <path
                                    d="M4,-16 A16,16 0 1,0 16,10 A13,13 0 1,1 4,-16 Z"
                                    fill="#fde047"
                                />
                            </g>
                        </g>
                    )}

                    {/* 구름 조금 / 흐림 / 비 / 눈 / 안개: 아지트 바깥 구름 레이어 */}
                    {isCloudyWeather && (
                        <g opacity={isNightWeather ? 0.65 : 0.92}>
                            {/* 좌측 상단 바깥 구름 */}
                            <g
                                transform="translate(238, 76)"
                                fill={
                                    isRainWeather
                                        ? '#94a3b8'
                                        : isNightWeather
                                        ? '#cbd5e1'
                                        : '#ffffff'
                                }
                            >
                                <ellipse cx="0" cy="6" rx="28" ry="13" />
                                <circle cx="-12" cy="0" r="14" />
                                <circle cx="6" cy="-3" r="16" />
                                <circle cx="20" cy="3" r="11" />
                            </g>
                            {/* 우측 상단 바깥 구름 */}
                            <g
                                transform="translate(555, 84)"
                                fill={
                                    isRainWeather
                                        ? '#94a3b8'
                                        : isNightWeather
                                        ? '#cbd5e1'
                                        : '#ffffff'
                                }
                            >
                                <ellipse cx="0" cy="6" rx="32" ry="14" />
                                <circle cx="-14" cy="0" r="15" />
                                <circle cx="6" cy="-4" r="18" />
                                <circle cx="22" cy="2" r="12" />
                            </g>
                        </g>
                    )}

                    {/* 비 / 이슬비 / 소나기 / 뇌우: 아지트 바깥 하늘에서 내리는 빗줄기 */}
                    {isRainWeather && (
                        <g stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.72">
                            {[
                                { x: 145, y: 110 },
                                { x: 175, y: 95 },
                                { x: 215, y: 88 },
                                { x: 255, y: 74 },
                                { x: 305, y: 66 },
                                { x: 495, y: 68 },
                                { x: 535, y: 82 },
                                { x: 575, y: 96 },
                                { x: 615, y: 112 },
                                { x: 648, y: 132 },
                                { x: 132, y: 165 },
                                { x: 662, y: 175 },
                            ].map((drop, idx) => (
                                <line
                                    key={`rain-outside-${idx}`}
                                    x1={drop.x}
                                    y1={drop.y}
                                    x2={drop.x - 6}
                                    y2={drop.y + 18}
                                />
                            ))}
                        </g>
                    )}

                    {/* 뇌우: 번개 포인트 */}
                    {weatherScene === 'thunderstorm' && (
                        <polygon
                            points="548,96 534,120 546,120 536,144 562,114 548,114"
                            fill="#facc15"
                            stroke="#ca8a04"
                            strokeWidth="1"
                        />
                    )}

                    {/* 눈: 아지트 바깥 하늘에 내리는 눈송이 */}
                    {isSnowWeather && (
                        <g fill="#ffffff" stroke="#7dd3fc" strokeWidth="1">
                            {[
                                { x: 148, y: 112, r: 4 },
                                { x: 188, y: 92, r: 3.5 },
                                { x: 228, y: 84, r: 4.5 },
                                { x: 278, y: 68, r: 3.5 },
                                { x: 515, y: 72, r: 4 },
                                { x: 558, y: 88, r: 4.5 },
                                { x: 602, y: 106, r: 3.5 },
                                { x: 642, y: 128, r: 4 },
                                { x: 130, y: 162, r: 3.5 },
                                { x: 665, y: 168, r: 4 },
                            ].map((flake, idx) => (
                                <circle key={`snow-outside-${idx}`} cx={flake.x} cy={flake.y} r={flake.r} />
                            ))}
                        </g>
                    )}

                    {/* 디오라마 전체 하단 그림자 */}
                    <polygon
                        points={`${floorTop.x},${floorTop.y + 8} ${floorRight.x + 6},${floorRight.y + 12} ${floorBottom.x},${floorBottom.y + 24} ${floorLeft.x - 6},${floorLeft.y + 12}`}
                        fill="rgba(15, 23, 42, 0.14)"
                        filter="url(#roomDropShadow)"
                    />

                    {activeZone === 'garden' ? (
                        <>
                            {/* ==================== [앞마당 텃밭 모드] 1. 집 테라스 외벽 & 정원 울타리 & 잔디 바닥 ==================== */}
                            <GardenCourtyardBackdrop
                                floorTop={floorTop}
                                floorLeft={floorLeft}
                                floorRight={floorRight}
                                floorBottom={floorBottom}
                                wallH={WALL_H}
                                floorThick={FLOOR_THICK}
                                onEnterIndoor={() => setActiveZone('indoor')}
                            />

                            {/* ==================== [앞마당 텃밭 모드] 2. 8x8 잔디 타일 & 현관 디딤돌 산책로 ==================== */}
                            {Array.from({ length: 8 }).map((_, gx) =>
                                Array.from({ length: 8 }).map((__, gy) => {
                                    const isCheckerAlt = (gx + gy) % 2 === 1;
                                    const isSteppingStone = gx === 0 && (gy === 1 || gy === 2 || gy === 3);
                                    return (
                                        <g key={`garden-tile-${gx}-${gy}`}>
                                            <polygon
                                                points={getTilePolygonPoints(gx, gy)}
                                                fill={isCheckerAlt ? '#4ade80' : '#3dd674'}
                                                stroke="#22c55e"
                                                strokeWidth="0.7"
                                                strokeOpacity="0.45"
                                            />
                                            {isSteppingStone && (
                                                <ellipse
                                                    cx={getTileCenter(gx, gy).x}
                                                    cy={getTileCenter(gx, gy).y}
                                                    rx="16"
                                                    ry="8"
                                                    fill="#e2e8f0"
                                                    stroke="#94a3b8"
                                                    strokeWidth="1.5"
                                                />
                                            )}
                                        </g>
                                    );
                                })
                            )}

                            {/* ==================== [앞마당 텃밭 모드] 3. 깊이(Z-Order) 정렬된 6구획 텃밭·벤치·아바타 ==================== */}
                            {sortedGardenEntities.map((entity) => {
                                if (entity.kind === 'bench') {
                                    return (
                                        <GardenBenchAndWateringCan
                                            key="garden-bench-node"
                                            pos={getTileCenter(entity.gridX, entity.gridY)}
                                        />
                                    );
                                }

                                if (entity.kind === 'plot') {
                                    const pos = getTileCenter(entity.gridX, entity.gridY);
                                    return (
                                        <GardenPlotIsoNode
                                            key={`garden-plot-${entity.plot.plotIndex}`}
                                            plot={entity.plot}
                                            pos={pos}
                                            isSelected={selectedPlotIndex === entity.plot.plotIndex}
                                            onSelectPlot={(idx) => setSelectedPlotIndex(idx)}
                                        />
                                    );
                                }

                                const minimiPos = getTileCenter(avatarSim.animX, avatarSim.animY);
                                return (
                                    <g
                                        key="garden-minimi-avatar"
                                        transform={`translate(${minimiPos.x}, ${minimiPos.y})`}
                                    >
                                        {renderMinimiGraphic(layout.minimiItemId)}

                                        {avatarSim.activityBadge && (
                                            <g transform={`translate(0, ${-88 + avatarSim.sitOffsetY})`}>
                                                <rect
                                                    x="-72"
                                                    y="-18"
                                                    width="144"
                                                    height="20"
                                                    rx="10"
                                                    fill="rgba(6, 78, 59, 0.88)"
                                                    stroke="rgba(167, 243, 208, 0.55)"
                                                    strokeWidth="1"
                                                />
                                                <text
                                                    x="0"
                                                    y="-5"
                                                    textAnchor="middle"
                                                    fill="#ffffff"
                                                    fontSize="9.5"
                                                    fontWeight="800"
                                                >
                                                    {avatarSim.activityBadge}
                                                </text>
                                            </g>
                                        )}

                                        <rect
                                            x="-40"
                                            y="12"
                                            width="80"
                                            height="17"
                                            rx="8.5"
                                            fill="rgba(15, 23, 42, 0.82)"
                                        />
                                        <text
                                            x="0"
                                            y="23.5"
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="9.5"
                                            fontWeight="800"
                                        >
                                            {ownerName.slice(0, 8)}
                                        </text>
                                    </g>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {/* ==================== 1. 3D 디오라마 외벽 두께 & 좌/우 벽면 ==================== */}
                            {/* 좌측 벽 외곽 단면 두께 */}
                            <polygon
                                points={`${floorLeft.x - WALL_THICK},${floorLeft.y - WALL_H - 7} ${floorLeft.x},${floorLeft.y - WALL_H} ${floorLeft.x},${floorLeft.y + FLOOR_THICK} ${floorLeft.x - WALL_THICK},${floorLeft.y + FLOOR_THICK - 7}`}
                                fill={wallTheme.outerSide}
                            />
                            {/* 우측 벽 외곽 단면 두께 */}
                            <polygon
                                points={`${floorRight.x},${floorRight.y - WALL_H} ${floorRight.x + WALL_THICK},${floorRight.y - WALL_H - 7} ${floorRight.x + WALL_THICK},${floorRight.y + FLOOR_THICK - 7} ${floorRight.x},${floorRight.y + FLOOR_THICK}`}
                                fill={wallTheme.outerSide}
                            />
                            {/* 좌측 벽 상단 캡(두께면) */}
                            <polygon
                                points={`${floorLeft.x - WALL_THICK},${floorLeft.y - WALL_H - 7} ${floorTop.x},${floorTop.y - WALL_H - WALL_THICK} ${floorTop.x},${floorTop.y - WALL_H} ${floorLeft.x},${floorLeft.y - WALL_H}`}
                                fill={wallTheme.topCap}
                                stroke={wallTheme.outerSide}
                                strokeWidth="1"
                            />
                            {/* 우측 벽 상단 캡(두께면) */}
                            <polygon
                                points={`${floorTop.x},${floorTop.y - WALL_H - WALL_THICK} ${floorRight.x + WALL_THICK},${floorRight.y - WALL_H - 7} ${floorRight.x},${floorRight.y - WALL_H} ${floorTop.x},${floorTop.y - WALL_H}`}
                                fill={wallTheme.topCap}
                                stroke={wallTheme.outerSide}
                                strokeWidth="1"
                            />

                            {/* 좌측 내벽 */}
                            <polygon
                                points={`${floorLeft.x},${floorLeft.y - WALL_H} ${floorTop.x},${floorTop.y - WALL_H} ${floorTop.x},${floorTop.y} ${floorLeft.x},${floorLeft.y}`}
                                fill={wallTheme.left}
                                stroke={wallTheme.outerSide}
                                strokeWidth="1.5"
                            />
                            {/* 우측 내벽 */}
                            <polygon
                                points={`${floorTop.x},${floorTop.y - WALL_H} ${floorRight.x},${floorRight.y - WALL_H} ${floorRight.x},${floorRight.y} ${floorTop.x},${floorTop.y}`}
                                fill={wallTheme.right}
                                stroke={wallTheme.outerSide}
                                strokeWidth="1.5"
                            />

                            {/* 벽지 세로 웨인스코팅/패널 디테일 라인 */}
                            {[1, 2, 3, 4, 5, 6, 7].map((step) => {
                                const lx = floorLeft.x + (step / 8) * (floorTop.x - floorLeft.x);
                                const ly = floorLeft.y + (step / 8) * (floorTop.y - floorLeft.y);
                                const rx = floorTop.x + (step / 8) * (floorRight.x - floorTop.x);
                                const ry = floorTop.y + (step / 8) * (floorRight.y - floorTop.y);
                                return (
                                    <g key={`wall-panel-${step}`}>
                                        <line
                                            x1={lx}
                                            y1={ly - WALL_H}
                                            x2={lx}
                                            y2={ly}
                                            stroke={wallTheme.stripe}
                                            strokeWidth="1.5"
                                        />
                                        <line
                                            x1={rx}
                                            y1={ry - WALL_H}
                                            x2={rx}
                                            y2={ry}
                                            stroke={wallTheme.stripe}
                                            strokeWidth="1.5"
                                        />
                                    </g>
                                );
                            })}

                            {/* 중앙 코너 앰비언트 오클루전 음영 */}
                            <line
                                x1={floorTop.x}
                                y1={floorTop.y - WALL_H}
                                x2={floorTop.x}
                                y2={floorTop.y}
                                stroke="rgba(15, 23, 42, 0.16)"
                                strokeWidth="4"
                            />

                            {/* 벽 하단 걸레받이(Baseboard Molding) */}
                            <polygon
                                points={`${floorLeft.x},${floorLeft.y - 10} ${floorTop.x},${floorTop.y - 10} ${floorTop.x},${floorTop.y} ${floorLeft.x},${floorLeft.y}`}
                                fill={wallTheme.baseboard}
                                opacity="0.85"
                            />
                            <polygon
                                points={`${floorTop.x},${floorTop.y - 10} ${floorRight.x},${floorRight.y - 10} ${floorRight.x},${floorRight.y} ${floorTop.x},${floorTop.y}`}
                                fill={wallTheme.baseboard}
                                opacity="0.95"
                            />

                            {/* 좌측 벽 나노바나나 3D 창문 & 따스한 햇살 광선 */}
                            <polygon
                                points="210,165 305,118 365,265 255,315"
                                fill="url(#sunlightRay)"
                                pointerEvents="none"
                            />
                            <image
                                href="/images/minihome/items/room-window-cozy.png"
                                x={206}
                                y={82}
                                width={118}
                                height={118}
                                preserveAspectRatio="xMidYMid meet"
                            />

                            {/* 우측 벽 나노바나나 3D 우드 선반 & 시계/액자 갤러리 (우측 벽 각도에 맞춰 좌우 미러링) */}
                            <g transform="translate(538, 152) scale(-1, 1)">
                                <image
                                    href="/images/minihome/items/room-wall-gallery.png"
                                    x={-62}
                                    y={-58}
                                    width={124}
                                    height={124}
                                    preserveAspectRatio="xMidYMid meet"
                                />
                            </g>

                            {/* ==================== 2. 바닥 베이스 & 입체 단면 두께 ==================== */}
                            {/* 바닥 좌/우 측면 두께 */}
                            <polygon
                                points={`${floorLeft.x},${floorLeft.y} ${floorBottom.x},${floorBottom.y} ${floorBottom.x},${floorBottom.y + FLOOR_THICK} ${floorLeft.x},${floorLeft.y + FLOOR_THICK}`}
                                fill={floorTheme.sideLeft}
                            />
                            <polygon
                                points={`${floorBottom.x},${floorBottom.y} ${floorRight.x},${floorRight.y} ${floorRight.x},${floorRight.y + FLOOR_THICK} ${floorBottom.x},${floorBottom.y + FLOOR_THICK}`}
                                fill={floorTheme.sideRight}
                            />
                            {/* 메인 바닥면 */}
                            <polygon
                                points={`${floorTop.x},${floorTop.y} ${floorRight.x},${floorRight.y} ${floorBottom.x},${floorBottom.y} ${floorLeft.x},${floorLeft.y}`}
                                fill={floorTheme.base}
                                stroke={floorTheme.line}
                                strokeWidth="2"
                            />

                            {/* ==================== 3. 8x8 아이소메트릭 타일 그리드 ==================== */}
                            {Array.from({ length: 8 }).map((_, gx) =>
                                Array.from({ length: 8 }).map((__, gy) => {
                                    const isCheckerAlt = (gx + gy) % 2 === 1;
                                    const isSelectedMinimiTile =
                                        isEditMode && selectedTargetId === 'minimi' && layout.minimiX === gx && layout.minimiY === gy;
                                    const isSelectedItemTile =
                                        isEditMode &&
                                        layout.placedItems.some(
                                            (it) => it.instanceId === selectedTargetId && it.gridX === gx && it.gridY === gy
                                        );

                                    return (
                                        <polygon
                                            key={`tile-${gx}-${gy}`}
                                            points={getTilePolygonPoints(gx, gy)}
                                            fill={
                                                isSelectedMinimiTile || isSelectedItemTile
                                                    ? 'rgba(99, 102, 241, 0.35)'
                                                    : isCheckerAlt
                                                    ? floorTheme.alt
                                                    : floorTheme.base
                                            }
                                            stroke={isEditMode ? 'rgba(99, 102, 241, 0.4)' : floorTheme.line}
                                            strokeWidth={isEditMode ? '1.3' : '0.75'}
                                            strokeOpacity={isEditMode ? 0.9 : 0.5}
                                            className={isEditMode ? 'cursor-pointer hover:fill-indigo-400/30 transition-colors' : ''}
                                            onClick={() => isEditMode && onTileClick(gx, gy)}
                                        />
                                    );
                                })
                            )}

                            {/* ==================== 4. 바닥 러그 레이어 ==================== */}
                            {rugItems.map((rug) => {
                                const pos = getTileCenter(rug.gridX, rug.gridY);
                                const isSelected = isEditMode && selectedTargetId === rug.instanceId;
                                return (
                                    <g
                                        key={rug.instanceId}
                                        transform={`translate(${pos.x}, ${pos.y}) scale(${rug.flipped ? -1 : 1}, 1)`}
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectTarget(rug.instanceId);
                                        }}
                                    >
                                        {isSelected && (
                                            <ellipse
                                                cx="0"
                                                cy="4"
                                                rx="58"
                                                ry="30"
                                                fill="rgba(99, 102, 241, 0.15)"
                                                stroke="#4f46e5"
                                                strokeWidth="2.5"
                                                strokeDasharray="4 2"
                                            />
                                        )}
                                        {renderItemGraphic(rug.itemId)}
                                    </g>
                                );
                            })}

                            {/* ==================== 5. 깊이(Z-Index) 정렬된 가구 & 미니미 레이어 ==================== */}
                            {sortedEntities.map((entity) => {
                                if (entity.kind === 'item') {
                                    const item = entity.data;
                                    const pos = getTileCenter(item.gridX, item.gridY);
                                    const isSelected = isEditMode && selectedTargetId === item.instanceId;
                                    return (
                                        <g
                                            key={item.instanceId}
                                            transform={`translate(${pos.x}, ${pos.y})`}
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectTarget(item.instanceId);
                                            }}
                                        >
                                            {isSelected && (
                                                <ellipse
                                                    cx="0"
                                                    cy="6"
                                                    rx="36"
                                                    ry="18"
                                                    fill="rgba(99, 102, 241, 0.22)"
                                                    stroke="#4f46e5"
                                                    strokeWidth="2.5"
                                                    strokeDasharray="4 2"
                                                />
                                            )}
                                            <g transform={`scale(${item.flipped ? -1 : 1}, 1)`}>
                                                {renderItemGraphic(item.itemId)}
                                            </g>
                                        </g>
                                    );
                                }

                                // 아바타 (자율 산책 및 가구 상호작용 연속 좌표 반영)
                                const minimiPos = getTileCenter(avatarSim.animX, avatarSim.animY);
                                const isMinimiSelected = isEditMode && selectedTargetId === 'minimi';

                                return (
                                    <g
                                        key="minimi-avatar"
                                        transform={`translate(${minimiPos.x}, ${minimiPos.y})`}
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectTarget('minimi');
                                        }}
                                    >
                                        {isMinimiSelected && (
                                            <ellipse
                                                cx="0"
                                                cy="6"
                                                rx="28"
                                                ry="14"
                                                fill="rgba(79, 70, 229, 0.28)"
                                                stroke="#4f46e5"
                                                strokeWidth="2.5"
                                            />
                                        )}
                                        {renderMinimiGraphic(layout.minimiItemId)}

                                        {/* 가구 상호작용 중일 때 표시되는 아담한 상태 배지 */}
                                        {!isEditMode && avatarSim.activityBadge && (
                                            <g transform={`translate(0, ${-88 + avatarSim.sitOffsetY})`}>
                                                <rect
                                                    x="-68"
                                                    y="-18"
                                                    width="136"
                                                    height="20"
                                                    rx="10"
                                                    fill="rgba(15, 23, 42, 0.78)"
                                                    stroke="rgba(255, 255, 255, 0.35)"
                                                    strokeWidth="1"
                                                />
                                                <text
                                                    x="0"
                                                    y="-5"
                                                    textAnchor="middle"
                                                    fill="#ffffff"
                                                    fontSize="9.5"
                                                    fontWeight="800"
                                                >
                                                    {avatarSim.activityBadge}
                                                </text>
                                            </g>
                                        )}

                                        {/* 미니미 이름표 */}
                                        <rect x="-40" y="12" width="80" height="17" rx="8.5" fill="rgba(15, 23, 42, 0.82)" />
                                        <text x="0" y="23.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800">
                                            {ownerName.slice(0, 8)}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* 실내 우측 하단 디딤돌: 클릭 시 앞마당 텃밭으로 이동 */}
                            {!isEditMode && (
                                <g
                                    transform={`translate(${floorRight.x - 54}, ${floorRight.y + 42})`}
                                    className="cursor-pointer"
                                    onClick={() => setActiveZone('garden')}
                                >
                                    <ellipse cx="0" cy="4" rx="46" ry="13" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
                                    <rect x="-48" y="-12" width="96" height="20" rx="10" fill="#15803d" stroke="#bbf7d0" strokeWidth="1.2" />
                                    <text x="0" y="1.5" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontWeight="900">
                                        🌿 앞마당 텃밭 나가기
                                    </text>
                                </g>
                            )}
                        </>
                    )}
                </svg>

                {/* 앞마당 텃밭 모드일 때 하단 야채 심기·물주기·수확하기 컨트롤 패널 */}
                {activeZone === 'garden' && !isEditMode && (
                    <MinihomeGardenControlPanel
                        gardenState={gardenState}
                        selectedPlotIndex={selectedPlotIndex}
                        onSelectPlot={(idx) => setSelectedPlotIndex(idx)}
                        isOwner={isOwner}
                        isRainWeather={isRainWeather}
                        onPlantCrop={(plotIdx, cropId) => {
                            if (onPlantCrop) {
                                onPlantCrop(plotIdx, cropId);
                            }
                            setForcedGardenAction({
                                plotIndex: plotIdx,
                                activityType: 'watering',
                                badge: `💧 새로 심은 씨앗에 정성껏 물 주는 중`,
                                timestamp: Date.now(),
                            });
                        }}
                        onWaterPlot={(plotIdx) => {
                            if (onWaterPlot) {
                                onWaterPlot(plotIdx);
                            }
                            setForcedGardenAction({
                                plotIndex: plotIdx,
                                activityType: 'watering',
                                badge: `💧 ${plotIdx + 1}번 텃밭에 시원하게 물 주는 중`,
                                timestamp: Date.now(),
                            });
                        }}
                        onHarvestPlot={(plotIdx) => {
                            if (onHarvestPlot) {
                                onHarvestPlot(plotIdx);
                            }
                            setForcedGardenAction({
                                plotIndex: plotIdx,
                                activityType: 'harvest-ready',
                                badge: `🧺 ${plotIdx + 1}번 텃밭 수확 완료!`,
                                timestamp: Date.now(),
                            });
                        }}
                        onClearPlot={onClearPlot}
                        onOpenSeedShop={onOpenSeedShopModal || onOpenShopModal}
                        onOpenWarehouse={onOpenWarehouseModal || onOpenShopModal}
                    />
                )}

                {/* 꾸미기 모드 시 하단 플로팅 오브젝트 조작 바 */}
                {isEditMode && (
                    <div className="w-full mt-2 lg:mt-0 lg:w-auto lg:absolute lg:bottom-3 lg:left-3 lg:right-3 bg-slate-900/90 backdrop-blur-md text-white px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-2 border border-slate-700 shrink-0">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500 font-black text-[10px]">
                                선택됨
                            </span>
                            <span className="font-bold text-indigo-200">
                                {selectedTargetId === 'minimi'
                                    ? `아바타 캐릭터 (${selectedItemMeta?.name || '기본'})`
                                    : selectedItemMeta?.name || '가구'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {onOpenShopModal && (
                                <button
                                    type="button"
                                    onClick={onOpenShopModal}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition-colors cursor-pointer"
                                >
                                    🎁 가구·벽지 상점 팝업
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onSelectTarget('minimi')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    selectedTargetId === 'minimi'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                🧍 아바타 선택
                            </button>
                            {selectedTargetId !== 'minimi' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={onFlipSelected}
                                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
                                    >
                                        <i className="fas fa-arrows-left-right mr-1"></i>방향 회전
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onRemoveSelected}
                                        className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-xs font-bold text-white transition-colors cursor-pointer"
                                    >
                                        <i className="fas fa-box-archive mr-1"></i>보관함 넣기
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
