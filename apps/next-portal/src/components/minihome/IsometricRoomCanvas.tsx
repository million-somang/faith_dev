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
}

const ORIGIN_X = 400;
const ORIGIN_Y = 228;
const TILE_W = 66;
const TILE_H = 33;
const WALL_H = 162;

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
}) => {
    // 벽면 스타일 테마 컬러 계산
    const getWallTheme = (wallId: string) => {
        switch (wallId) {
            case 'wall-cozy-beige':
                return { left: '#f5ebe0', right: '#e3d5ca', trim: '#d5bdaf', bgSky: '#fffbeb' };
            case 'wall-pastel-sky':
                return { left: '#e0f2fe', right: '#bae6fd', trim: '#7dd3fc', bgSky: '#f0f9ff' };
            case 'wall-retro-brick':
                return { left: '#b91c1c', right: '#991b1b', trim: '#7f1d1d', bgSky: '#fef2f2' };
            case 'wall-hanok-paper':
                return { left: '#fef3c7', right: '#fde68a', trim: '#92400e', bgSky: '#1e1b4b' };
            case 'wall-cyber-neon':
                return { left: '#1e1b4b', right: '#0f172a', trim: '#818cf8', bgSky: '#090d16' };
            case 'wall-vip-gold':
                return { left: '#fffbeb', right: '#fef3c7', trim: '#d97706', bgSky: '#1e293b' };
            default:
                return { left: '#f8fafc', right: '#f1f5f9', trim: '#cbd5e1', bgSky: '#f8fafc' };
        }
    };

    // 바닥 스타일 테마 컬러 계산
    const getFloorTheme = (floorId: string) => {
        switch (floorId) {
            case 'floor-gray-tile':
                return { base: '#e2e8f0', line: '#cbd5e1', sideLeft: '#94a3b8', sideRight: '#64748b' };
            case 'floor-herringbone':
                return { base: '#d97706', line: '#b45309', sideLeft: '#92400e', sideRight: '#78350f' };
            case 'floor-green-lawn':
                return { base: '#4ade80', line: '#22c55e', sideLeft: '#16a34a', sideRight: '#15803d' };
            case 'floor-retro-checker':
                return { base: '#f8fafc', line: '#334155', sideLeft: '#475569', sideRight: '#1e293b' };
            case 'floor-galaxy':
                return { base: '#312e81', line: '#4f46e5', sideLeft: '#1e1b4b', sideRight: '#0f172a' };
            default:
                return { base: '#f3d5b5', line: '#d4a373', sideLeft: '#bc8a5f', sideRight: '#a47148' };
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

    // 개별 가구/소품 SVG 그래픽 렌더러
    const renderItemGraphic = (itemId: string) => {
        switch (itemId) {
            case 'prop-coffee-rug':
                return (
                    <g>
                        <ellipse cx="0" cy="4" rx="52" ry="26" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" />
                        <ellipse cx="0" cy="4" rx="38" ry="18" fill="#fde68a" opacity="0.7" />
                    </g>
                );
            case 'furn-wood-desk':
                return (
                    <g>
                        {/* 책상 다리 & 상판 */}
                        <polygon points="-32,-18 0,-34 32,-18 0,-2" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
                        <polygon points="-32,-18 0,-2 0,18 -32,2" fill="#b45309" />
                        <polygon points="0,-2 32,-18 32,2 0,18" fill="#92400e" />
                        {/* 노트북 & 머그컵 */}
                        <polygon points="-10,-22 4,-29 14,-23 0,-16" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                        <polygon points="-10,-22 -10,-34 4,-41 4,-29" fill="#38bdf8" stroke="#1e293b" strokeWidth="1.5" />
                        <circle cx="14" cy="-16" r="4" fill="#fb7185" />
                    </g>
                );
            case 'furn-gaming-setup':
                return (
                    <g>
                        {/* 블랙 게이밍 데스크 + 네온 엣지 */}
                        <polygon points="-36,-20 0,-38 36,-20 0,-2" fill="#1e293b" stroke="#ec4899" strokeWidth="2" />
                        <polygon points="-36,-20 0,-2 0,18 -36,0" fill="#0f172a" />
                        <polygon points="0,-2 36,-20 36,0 0,18" fill="#334155" />
                        {/* 듀얼 모니터 */}
                        <polygon points="-22,-26 -4,-35 -4,-50 -22,-41" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
                        <polygon points="-2,-35 18,-26 18,-41 -2,-50" fill="#a855f7" stroke="#0f172a" strokeWidth="2" />
                        {/* RGB 본체 */}
                        <rect x="18" y="-36" width="10" height="18" rx="2" fill="#1e1b4b" stroke="#22d3ee" strokeWidth="1.5" />
                    </g>
                );
            case 'furn-floor-lamp':
                return (
                    <g>
                        <ellipse cx="0" cy="4" rx="12" ry="6" fill="#94a3b8" />
                        <line x1="0" y1="4" x2="0" y2="-44" stroke="#64748b" strokeWidth="3" />
                        <polygon points="-14,-40 14,-40 9,-58 -9,-58" fill="#fef08a" stroke="#f59e0b" strokeWidth="1.5" />
                        <circle cx="0" cy="-42" r="22" fill="#fef08a" opacity="0.22" />
                    </g>
                );
            case 'furn-beanbag':
                return (
                    <g>
                        <ellipse cx="0" cy="2" rx="26" ry="15" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" />
                        <path d="M-22,0 Q0,-34 22,0 Z" fill="#f9a8d4" stroke="#db2777" strokeWidth="1.5" />
                        <circle cx="-4" cy="-8" r="6" fill="#fef08a" />
                    </g>
                );
            case 'furn-bookshelf':
                return (
                    <g>
                        <polygon points="-26,-56 12,-74 26,-66 -12,-48" fill="#b45309" />
                        <polygon points="-26,-56 -12,-48 -12,6 -26,-2" fill="#78350f" />
                        <polygon points="-12,-48 26,-66 26,-12 -12,6" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
                        {/* 책꽂이 컬러 북 */}
                        <rect x="-6" y="-44" width="5" height="12" fill="#ef4444" />
                        <rect x="0" y="-46" width="5" height="12" fill="#3b82f6" />
                        <rect x="6" y="-48" width="5" height="12" fill="#10b981" />
                        <rect x="-4" y="-26" width="6" height="12" fill="#f59e0b" />
                        <rect x="4" y="-29" width="6" height="12" fill="#8b5cf6" />
                    </g>
                );
            case 'furn-turntable':
                return (
                    <g>
                        <polygon points="-24,-16 0,-28 24,-16 0,-4" fill="#fcd34d" stroke="#b45309" strokeWidth="1.5" />
                        <polygon points="-24,-16 0,-4 0,14 -24,2" fill="#d97706" />
                        <polygon points="0,-4 24,-16 24,2 0,14" fill="#b45309" />
                        {/* LP 레코드 판 */}
                        <ellipse cx="0" cy="-18" rx="13" ry="7" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1" />
                        <circle cx="0" cy="-18" r="3.5" fill="#ef4444" />
                        <text x="10" y="-28" fontSize="12">🎵</text>
                    </g>
                );
            case 'furn-arcade-cabinet':
                return (
                    <g>
                        <polygon points="-18,-58 6,-70 20,-62 -4,-50" fill="#ec4899" />
                        <polygon points="-18,-58 -4,-50 -4,8 -18,0" fill="#4f46e5" />
                        <polygon points="-4,-50 20,-62 20,-4 -4,8" fill="#312e81" stroke="#c084fc" strokeWidth="1.5" />
                        {/* 오락기 화면 */}
                        <polygon points="0,-44 16,-52 16,-34 0,-26" fill="#22d3ee" />
                        <circle cx="6" cy="-20" r="2.5" fill="#ef4444" />
                        <circle cx="12" cy="-23" r="2.5" fill="#facc15" />
                    </g>
                );
            case 'prop-mini-plant':
                return (
                    <g>
                        <polygon points="-9,-8 9,-8 6,6 -6,6" fill="#d97706" stroke="#92400e" strokeWidth="1.2" />
                        <ellipse cx="-7" cy="-16" rx="8" ry="5" transform="rotate(-25 -7 -16)" fill="#10b981" />
                        <ellipse cx="7" cy="-18" rx="8" ry="5" transform="rotate(25 7 -18)" fill="#059669" />
                        <ellipse cx="0" cy="-24" rx="6" ry="9" fill="#34d399" />
                    </g>
                );
            case 'prop-moon-lamp':
                return (
                    <g>
                        <ellipse cx="0" cy="4" rx="10" ry="5" fill="#78350f" />
                        <circle cx="0" cy="-12" r="15" fill="#fef08a" stroke="#facc15" strokeWidth="2" />
                        <circle cx="-4" cy="-15" r="3" fill="#fde047" />
                        <circle cx="5" cy="-9" r="4" fill="#fde047" />
                        <circle cx="0" cy="-12" r="22" fill="#fef08a" opacity="0.25" />
                    </g>
                );
            case 'prop-neon-sign':
                return (
                    <g>
                        <rect x="-22" y="-44" width="44" height="24" rx="6" fill="#0f172a" stroke="#f43f5e" strokeWidth="2.5" />
                        <text x="0" y="-28" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900">VERA✨</text>
                        <line x1="0" y1="-20" x2="0" y2="4" stroke="#475569" strokeWidth="3" />
                    </g>
                );
            case 'prop-cheese-cat':
                return (
                    <g>
                        <ellipse cx="0" cy="4" rx="18" ry="9" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.5" />
                        <ellipse cx="0" cy="-2" rx="13" ry="9" fill="#fb923c" />
                        <circle cx="-6" cy="-8" r="8" fill="#f97316" />
                        <polygon points="-12,-13 -9,-20 -5,-14" fill="#ea580c" />
                        <polygon points="-5,-14 -1,-20 1,-13" fill="#ea580c" />
                        <text x="10" y="-14" fontSize="10" fill="#f97316" fontWeight="bold">Zzz</text>
                    </g>
                );
            case 'prop-corgi-dog':
                return (
                    <g>
                        <ellipse cx="2" cy="-2" rx="14" ry="9" fill="#f59e0b" />
                        <circle cx="11" cy="-2" r="6" fill="#fef3c7" />
                        <circle cx="-9" cy="-10" r="8" fill="#d97706" />
                        <polygon points="-14,-15 -11,-24 -7,-16" fill="#92400e" />
                        <polygon points="-6,-16 -2,-24 0,-15" fill="#92400e" />
                        <text x="-12" y="-26" fontSize="10">❤️</text>
                    </g>
                );
            case 'trophy-2048':
                return (
                    <g>
                        <polygon points="-12,4 12,4 9,-6 -9,-6" fill="#1e293b" />
                        <rect x="-12" y="-30" width="24" height="24" rx="5" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
                        <text x="0" y="-14" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">2048</text>
                        <text x="0" y="-34" textAnchor="middle" fontSize="12">👑</text>
                    </g>
                );
            case 'trophy-sudoku':
                return (
                    <g>
                        <polygon points="-12,4 12,4 9,-6 -9,-6" fill="#1e293b" />
                        <polygon points="0,-38 14,-20 0,-6 -14,-20" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
                        <text x="0" y="-17" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="900">9x9</text>
                    </g>
                );
            case 'trophy-minesweeper':
                return (
                    <g>
                        <ellipse cx="0" cy="4" rx="12" ry="6" fill="#f59e0b" />
                        <line x1="-4" y1="4" x2="-4" y2="-34" stroke="#fef08a" strokeWidth="3" />
                        <polygon points="-4,-34 16,-26 -4,-18" fill="#ef4444" />
                        <text x="0" y="-38" textAnchor="middle" fontSize="11">🏆</text>
                    </g>
                );
            default:
                return <circle cx="0" cy="-10" r="12" fill="#94a3b8" />;
        }
    };

    // 미니미 아바타 SVG 렌더러
    const renderMinimiGraphic = (minimiId: string) => {
        let bodyColor = '#3b82f6';
        let hatEmoji = '';
        let accessory = '';

        switch (minimiId) {
            case 'minimi-hoodie':
                bodyColor = '#10b981';
                hatEmoji = '🎧';
                break;
            case 'minimi-ceo':
                bodyColor = '#1e293b';
                accessory = '☕';
                break;
            case 'minimi-astronaut':
                bodyColor = '#e2e8f0';
                hatEmoji = '🧑‍🚀';
                accessory = '🚀';
                break;
            case 'minimi-hanbok':
                bodyColor = '#0d9488';
                hatEmoji = '🎩';
                accessory = '🪭';
                break;
            case 'minimi-wizard':
                bodyColor = '#9333ea';
                hatEmoji = '🧙';
                accessory = '✨';
                break;
            case 'minimi-champion':
                bodyColor = '#dc2626';
                hatEmoji = '👑';
                accessory = '🏆';
                break;
            default:
                bodyColor = '#3b82f6';
                break;
        }

        return (
            <g>
                {/* 발 밑 그림자 */}
                <ellipse cx="0" cy="5" rx="14" ry="7" fill="rgba(15,23,42,0.22)" />
                {/* 다리 */}
                <rect x="-6" y="-8" width="5" height="12" rx="2" fill="#334155" />
                <rect x="1" y="-8" width="5" height="12" rx="2" fill="#334155" />
                {/* 몸통 */}
                <rect x="-10" y="-26" width="20" height="20" rx="7" fill={bodyColor} stroke="#ffffff" strokeWidth="1.5" />
                {/* 얼굴 */}
                <circle cx="0" cy="-38" r="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.2" />
                {/* 머리카락 */}
                <path d="M-12,-40 Q0,-54 12,-40 Q6,-46 -12,-40 Z" fill="#1e293b" />
                {/* 눈 & 미소 */}
                <circle cx="-4" cy="-38" r="1.7" fill="#0f172a" />
                <circle cx="4" cy="-38" r="1.7" fill="#0f172a" />
                <circle cx="-6.5" cy="-35" r="2" fill="#fda4af" opacity="0.8" />
                <circle cx="6.5" cy="-35" r="2" fill="#fda4af" opacity="0.8" />
                <path d="M-3,-34 Q0,-31 3,-34" stroke="#0f172a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                {/* 모자 / 액세서리 */}
                {hatEmoji && (
                    <text x="0" y="-50" textAnchor="middle" fontSize="14">
                        {hatEmoji}
                    </text>
                )}
                {accessory && (
                    <text x="15" y="-18" textAnchor="middle" fontSize="12">
                        {accessory}
                    </text>
                )}
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
        <div className="relative bg-gradient-to-b from-slate-100 via-white to-slate-100 rounded-2xl border border-slate-200/90 overflow-hidden shadow-inner">
            {/* 상단 미니룸 뱃지 & 편집 상태 안내 바 */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-xs border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-black tracking-wide">
                        MINI ROOM
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                        {ownerName}님의 2.5D 아이소메트릭 미니룸
                    </span>
                </div>

                {isEditMode ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                        <i className="fas fa-hand-pointer animate-bounce"></i>
                        <span>바닥 타일을 클릭하면 선택된 [{selectedItemMeta?.name || '미니미'}] 위치가 이동합니다!</span>
                    </div>
                ) : (
                    <div className="text-[11px] text-slate-400 font-semibold">
                        가구 {layout.placedItems.length}개 배치됨
                    </div>
                )}
            </div>

            {/* 메인 2.5D 아이소메트릭 SVG 스테이지 */}
            <div
                className="relative w-full aspect-[16/11] min-h-[300px] max-h-[480px] flex items-center justify-center select-none"
                data-screenshot-point="result"
            >
                <svg
                    viewBox="0 0 800 540"
                    className="w-full h-full object-contain"
                    role="img"
                    aria-label={`${ownerName}의 미니룸 캔버스`}
                >
                    <defs>
                        <radialGradient id="roomGlow" cx="50%" cy="45%" r="55%">
                            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.65" />
                            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* 배경 후광 */}
                    <rect x="0" y="0" width="800" height="540" fill="url(#roomGlow)" />

                    {/* ==================== 1. 좌/우 벽면 (Back Walls) ==================== */}
                    {/* 좌측 벽 */}
                    <polygon
                        points={`${floorLeft.x},${floorLeft.y - WALL_H} ${floorTop.x},${floorTop.y - WALL_H} ${floorTop.x},${floorTop.y} ${floorLeft.x},${floorLeft.y}`}
                        fill={wallTheme.left}
                        stroke={wallTheme.trim}
                        strokeWidth="3"
                    />
                    {/* 우측 벽 */}
                    <polygon
                        points={`${floorTop.x},${floorTop.y - WALL_H} ${floorRight.x},${floorRight.y - WALL_H} ${floorRight.x},${floorRight.y} ${floorTop.x},${floorTop.y}`}
                        fill={wallTheme.right}
                        stroke={wallTheme.trim}
                        strokeWidth="3"
                    />

                    {/* 좌측 벽 창문 데코레이션 */}
                    <g transform="translate(245, 165) skewY(-26.5)">
                        <rect x="-48" y="-42" width="96" height="76" rx="4" fill={wallTheme.bgSky} stroke={wallTheme.trim} strokeWidth="4" />
                        {layout.wallItemId === 'wall-cyber-neon' || layout.wallItemId === 'wall-hanok-paper' ? (
                            <>
                                <circle cx="18" cy="-18" r="12" fill="#fef08a" />
                                <circle cx="-20" cy="-22" r="1.5" fill="#ffffff" />
                                <circle cx="-5" cy="-8" r="1.5" fill="#ffffff" />
                            </>
                        ) : (
                            <>
                                <circle cx="-20" cy="-16" r="11" fill="#fde047" />
                                <ellipse cx="14" cy="-8" rx="18" ry="8" fill="#ffffff" opacity="0.9" />
                            </>
                        )}
                        <line x1="0" y1="-42" x2="0" y2="34" stroke={wallTheme.trim} strokeWidth="3" />
                        <line x1="-48" y1="-4" x2="48" y2="-4" stroke={wallTheme.trim} strokeWidth="3" />
                    </g>

                    {/* 우측 벽 액자/시계 데코레이션 */}
                    <g transform="translate(540, 160) skewY(26.5)">
                        <rect x="-36" y="-32" width="72" height="48" rx="4" fill="#ffffff" stroke={wallTheme.trim} strokeWidth="3" />
                        <text x="0" y="-4" textAnchor="middle" fill="#6366f1" fontSize="12" fontWeight="900">
                            VERA HOME
                        </text>
                    </g>

                    {/* ==================== 2. 바닥 베이스 & 두께 ==================== */}
                    {/* 바닥 좌/우 측면 두께 */}
                    <polygon
                        points={`${floorLeft.x},${floorLeft.y} ${floorBottom.x},${floorBottom.y} ${floorBottom.x},${floorBottom.y + 14} ${floorLeft.x},${floorLeft.y + 14}`}
                        fill={floorTheme.sideLeft}
                    />
                    <polygon
                        points={`${floorBottom.x},${floorBottom.y} ${floorRight.x},${floorRight.y} ${floorRight.x},${floorRight.y + 14} ${floorBottom.x},${floorBottom.y + 14}`}
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
                            const isCheckerDark =
                                layout.floorItemId === 'floor-retro-checker' && (gx + gy) % 2 === 1;
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
                                            : isCheckerDark
                                            ? '#334155'
                                            : 'transparent'
                                    }
                                    stroke={isEditMode ? 'rgba(99, 102, 241, 0.35)' : floorTheme.line}
                                    strokeWidth={isEditMode ? '1.3' : '0.6'}
                                    strokeOpacity={isEditMode ? 0.9 : 0.45}
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
                                    <ellipse cx="0" cy="4" rx="58" ry="30" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeDasharray="4 2" />
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
                                            cy="4"
                                            rx="32"
                                            ry="16"
                                            fill="rgba(99, 102, 241, 0.2)"
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

                        // 미니미 아바타 + 말풍선
                        const minimiPos = getTileCenter(layout.minimiX, layout.minimiY);
                        const isMinimiSelected = isEditMode && selectedTargetId === 'minimi';
                        const bubbleText = layout.speechBubble || `${ownerName}의 미니룸에 오신 것을 환영합니다!`;

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
                                        cy="5"
                                        rx="24"
                                        ry="12"
                                        fill="rgba(79, 70, 229, 0.25)"
                                        stroke="#4f46e5"
                                        strokeWidth="2.5"
                                    />
                                )}
                                {renderMinimiGraphic(layout.minimiItemId)}

                                {/* 미니미 이름표 */}
                                <rect x="-38" y="10" width="76" height="16" rx="8" fill="rgba(15, 23, 42, 0.78)" />
                                <text x="0" y="21" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800">
                                    {ownerName.slice(0, 8)}
                                </text>

                                {/* 머리 위 한줄 말풍선 */}
                                <g transform="translate(0, -76)">
                                    <rect
                                        x="-125"
                                        y="-24"
                                        width="250"
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
                                    ? `미니미 캐릭터 (${selectedItemMeta?.name || '기본'})`
                                    : selectedItemMeta?.name || '가구'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onSelectTarget('minimi')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    selectedTargetId === 'minimi'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                🧍 미니미 선택
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

            {/* 꾸미기 모드 시 미니미 한줄 말풍선 즉시 편집 바 */}
            {isEditMode && onChangeSpeechBubble && (
                <div className="px-4 py-3 bg-indigo-50/70 border-t border-indigo-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <label className="text-xs font-extrabold text-indigo-900 shrink-0 flex items-center gap-1.5">
                        <i className="fas fa-comment-dots text-indigo-600"></i>
                        <span>미니미 말풍선:</span>
                    </label>
                    <input
                        type="text"
                        maxLength={40}
                        value={layout.speechBubble}
                        onChange={(e) => onChangeSpeechBubble(e.target.value)}
                        placeholder="미니미 머리 위에 띄울 한줄 인사말을 입력하세요 (최대 40자)"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            )}
        </div>
    );
};
