'use client';

import React from 'react';
import { MinihomeRoomLayout, PlacedRoomItem } from '@/types/minihome.types';
import { getCatalogItemById } from '@/data/minihomeCatalogData';

interface IsometricRoomCanvasProps {
    layout: MinihomeRoomLayout;
    ownerName: string;
    isEditMode: boolean;
    selectedTargetId: string;
    onSelectTarget: (targetId: string) => void;
    onTileClick: (gridX: number, gridY: number) => void;
    onFlipSelected: () => void;
    onRemoveSelected: () => void;
    onChangeSpeechBubble?: (text: string) => void;
    onOpenShopModal?: () => void;
    onSaveRoom?: () => void;
    onCancelEdit?: () => void;
    isSaving?: boolean;
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
    isEditMode,
    selectedTargetId,
    onSelectTarget,
    onTileClick,
    onFlipSelected,
    onRemoveSelected,
    onChangeSpeechBubble,
    onOpenShopModal,
    onSaveRoom,
    onCancelEdit,
    isSaving,
}) => {
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
            depth: layout.minimiX + layout.minimiY + 0.1,
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

    // 나노바나나 고해상도 3D 미니미 아바타 렌더러
    const renderMinimiGraphic = (minimiId: string) => {
        const meta = getCatalogItemById(minimiId);
        const spriteUrl = meta?.spriteUrl || `/images/minihome/items/${minimiId}.png`;
        const w = meta?.spriteWidth || 98;
        const h = meta?.spriteHeight || 98;
        const offsetY = meta?.spriteOffsetY ?? 14;

        return (
            <g>
                {/* 발 밑 바닥 그림자 */}
                <ellipse cx="0" cy="6" rx="24" ry="12" fill="rgba(15, 23, 42, 0.26)" />
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

    const selectedItemMeta =
        selectedTargetId === 'minimi'
            ? getCatalogItemById(layout.minimiItemId)
            : getCatalogItemById(
                  layout.placedItems.find((i) => i.instanceId === selectedTargetId)?.itemId || ''
              );

    return (
        <div className="relative h-full flex-1 flex flex-col bg-gradient-to-b from-slate-100 via-white to-slate-100 rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            {/* 상단 아지트 뱃지 & 상점 팝업 / 편집 상태 안내 바 */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-white/90 backdrop-blur-xs border-b border-slate-200/70 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-black tracking-wide">
                        MY AGIT
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                        {ownerName}님의 2.5D 아이소메트릭 아지트
                    </span>
                </div>

                {isEditMode ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                            <i className="fas fa-hand-pointer animate-bounce"></i>
                            <span>바닥 타일 클릭 시 [{selectedItemMeta?.name || '아바타'}] 이동</span>
                        </span>
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
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-semibold">
                            가구 {layout.placedItems.length}개 배치됨
                        </span>
                        {onOpenShopModal && (
                            <button
                                type="button"
                                onClick={onOpenShopModal}
                                className="px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <span>🎁 상점·보관함 팝업</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 메인 2.5D 아이소메트릭 디오라마 스테이지 */}
            <div
                className="relative w-full flex-1 min-h-[340px] sm:min-h-[460px] lg:min-h-[560px] p-2 sm:p-4 flex items-center justify-center select-none"
                data-screenshot-point="result"
            >
                <svg
                    viewBox="95 30 610 505"
                    className="w-full h-full object-contain"
                    role="img"
                    aria-label={`${ownerName}의 미니룸 캔버스`}
                >
                    <defs>
                        <radialGradient id="roomGlow" cx="50%" cy="46%" r="55%">
                            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="sunlightRay" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                        </linearGradient>
                        <filter id="roomDropShadow" x="-15%" y="-10%" width="130%" height="130%">
                            <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.16" />
                        </filter>
                    </defs>

                    {/* 배경 후광 */}
                    <rect x="0" y="0" width="800" height="540" fill="url(#roomGlow)" />

                    {/* 디오라마 전체 하단 그림자 */}
                    <polygon
                        points={`${floorTop.x},${floorTop.y + 8} ${floorRight.x + 6},${floorRight.y + 12} ${floorBottom.x},${floorBottom.y + 24} ${floorLeft.x - 6},${floorLeft.y + 12}`}
                        fill="rgba(15, 23, 42, 0.14)"
                        filter="url(#roomDropShadow)"
                    />

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

                        // 아바타 + 말풍선
                        const minimiPos = getTileCenter(layout.minimiX, layout.minimiY);
                        const isMinimiSelected = isEditMode && selectedTargetId === 'minimi';
                        const bubbleText = layout.speechBubble || `${ownerName}의 아지트에 오신 것을 환영합니다!`;

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

                                {/* 미니미 이름표 */}
                                <rect x="-40" y="12" width="80" height="17" rx="8.5" fill="rgba(15, 23, 42, 0.82)" />
                                <text x="0" y="23.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800">
                                    {ownerName.slice(0, 8)}
                                </text>

                                {/* 머리 위 한줄 말풍선 */}
                                <g transform="translate(0, -90)">
                                    <rect
                                        x="-128"
                                        y="-24"
                                        width="256"
                                        height="28"
                                        rx="14"
                                        fill="#ffffff"
                                        stroke="#6366f1"
                                        strokeWidth="2"
                                    />
                                    <polygon points="-6,4 6,4 0,11" fill="#6366f1" />
                                    <text
                                        x="0"
                                        y="-6"
                                        textAnchor="middle"
                                        fill="#1e293b"
                                        fontSize="11"
                                        fontWeight="800"
                                    >
                                        💬 {bubbleText.length > 22 ? `${bubbleText.slice(0, 22)}…` : bubbleText}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* 꾸미기 모드 시 하단 플로팅 오브젝트 조작 바 */}
                {isEditMode && (
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-2 border border-slate-700">
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

            {/* 꾸미기 모드 시 아바타 한줄 말풍선 즉시 편집 바 */}
            {isEditMode && onChangeSpeechBubble && (
                <div className="px-4 py-3 bg-indigo-50/70 border-t border-indigo-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <label className="text-xs font-extrabold text-indigo-900 shrink-0 flex items-center gap-1.5">
                        <i className="fas fa-comment-dots text-indigo-600"></i>
                        <span>아바타 말풍선:</span>
                    </label>
                    <input
                        type="text"
                        maxLength={40}
                        value={layout.speechBubble}
                        onChange={(e) => onChangeSpeechBubble(e.target.value)}
                        placeholder="아바타 머리 위에 띄울 한줄 인사말을 입력하세요 (최대 40자)"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            )}
        </div>
    );
};
