'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GardenCropId, GardenPlotItem, MinihomeRoomLayout, PlacedRoomItem } from '@/types/minihome.types';
import { ensureGardenState, getCatalogItemById, getGardenCropById, getGardenPlotWaterStatus } from '@/data/minihomeCatalogData';
import { useWeather, WeatherSceneType } from '@/hooks/useWeather';
import { ForcedGardenActionTrigger, getGardenPlotCoord, useAvatarLifeSim } from '@/hooks/useAvatarLifeSim';
import { MinihomeAvatarActionOverlay } from '@/components/minihome/MinihomeAvatarActionOverlay';
import {
    GardenBenchAndWateringCan,
    GardenCourtyardBackdrop,
    GardenFarmerIsoNode,
    GardenPlotActionBubble,
    GardenPlotBadgeOverlay,
    GardenPlotIsoNode,
    MinihomeGardenControlPanel,
} from '@/components/minihome/MinihomeGardenLayer';
import type {
    AzitTowerBattleResponse,
    AzitZoneType,
    FarmerActionLog,
    OwnedFarmer,
    UseAzitGameController,
} from '@/types/azit-game.types';
import { AzitLevelHeaderBadge } from '@/components/minihome/AzitLevelHeaderBadge';
import {
    AzitKitchenIsoScene,
    AzitKitchenControlPanel,
    KitchenStoveActionBubble,
} from '@/components/minihome/AzitKitchenLayer';
import {
    AzitCampIsoScene,
    AzitCampControlPanel,
    CampActionBubble,
    type CampNodeType,
} from '@/components/minihome/AzitCampLayer';
import { AzitGameModals, type AzitModalKind } from '@/components/minihome/AzitGameModals';
import { AzitTowerModal, type TowerLaunchContext } from '@/components/minihome/AzitTowerModal';
import { AzitTowerBattleFullscreen } from '@/components/minihome/AzitTowerBattleFullscreen';

interface TowerBattleSession extends TowerLaunchContext {
    response: AzitTowerBattleResponse;
}

interface IsometricRoomCanvasProps {
    layout: MinihomeRoomLayout;
    ownerName: string;
    roomTitle?: string;
    handle?: string;
    todayVisitors?: number;
    totalVisitors?: number;
    headingTag?: 'h1' | 'h2';
    backHref?: string;
    hasNeighbors?: boolean;
    onRandomSurf?: () => void;
    onOpenSurfModal?: () => void;
    onShare?: () => void;
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
    onOpenFertilizerShopModal?: () => void;
    onOpenWarehouseModal?: () => void;
    onSaveRoom?: () => void;
    onCancelEdit?: () => void;
    isSaving?: boolean;
    onPlantCrop?: (plotIndex: number, cropId: GardenCropId) => void;
    onWaterPlot?: (plotIndex: number) => boolean | void;
    onHarvestPlot?: (plotIndex: number) => void;
    onClearPlot?: (plotIndex: number) => void;
    azitGame?: UseAzitGameController;
    requestedZone?: AzitZoneType | null;
    zoneSyncNonce?: number;
    onOpenNotificationCenter?: () => void;
    isPushSubscribed?: boolean;
    unreadNotificationCount?: number;
}

const ORIGIN_X = 400;
const ORIGIN_Y = 236;
const TILE_W = 66;
const TILE_H = 33;
const WALL_H = 172;
const WALL_THICK = 14;
const FLOOR_THICK = 18;

const BASE_VB_X = 95;
const BASE_VB_Y = 30;
const BASE_VB_W = 610;
const BASE_VB_H = 505;
const BASE_CENTER_X = BASE_VB_X + BASE_VB_W / 2; // 400
const BASE_CENTER_Y = BASE_VB_Y + BASE_VB_H / 2; // 282.5
const MIN_SAFE_ZOOM = 1.0;
const MAX_SAFE_ZOOM = 2.0; // 512x512 원본 스프라이트 및 SVG 벡터 무손실 최대 배율(200%)
const ZOOM_STEP = 0.25;

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
    handle,
    todayVisitors = 1,
    totalVisitors = 1,
    headingTag = 'h2',
    backHref,
    hasNeighbors = false,
    onRandomSurf,
    onOpenSurfModal,
    onShare,
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
    onOpenFertilizerShopModal,
    onOpenWarehouseModal,
    onSaveRoom,
    onCancelEdit,
    isSaving,
    onPlantCrop,
    onWaterPlot,
    onHarvestPlot,
    onClearPlot,
    azitGame,
    requestedZone = null,
    zoneSyncNonce = 0,
    onOpenNotificationCenter,
    isPushSubscribed = false,
    unreadNotificationCount = 0,
}) => {
    const [activeZone, setActiveZone] = useState<AzitZoneType>('indoor');
    const [openBubblePlotIndex, setOpenBubblePlotIndex] = useState<number | null>(null);
    const [openKitchenSlotIndex, setOpenKitchenSlotIndex] = useState<number | null>(null);
    const [openCampNode, setOpenCampNode] = useState<CampNodeType | null>(null);
    const [activeAzitModal, setActiveAzitModal] = useState<AzitModalKind>(null);
    const [isTowerModalOpen, setIsTowerModalOpen] = useState<boolean>(false);
    const [towerBattleSession, setTowerBattleSession] = useState<TowerBattleSession | null>(null);
    const [forcedGardenAction, setForcedGardenAction] = useState<ForcedGardenActionTrigger | null>(null);

    // ─── 무손실 스마트 줌 (100% ~ 200% 안전 배율) & 드래그 팬(Pan) 상태 ───
    const [zoomLevel, setZoomLevel] = useState<number>(1.0);
    const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isFollowingAvatar, setIsFollowingAvatar] = useState<boolean>(false);
    const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
    const [dragStartInfo, setDragStartInfo] = useState<{
        clientX: number;
        clientY: number;
        originPanX: number;
        originPanY: number;
    } | null>(null);

    const handleZoomChange = (nextZoom: number, followAvatar = false) => {
        const clamped = Math.max(MIN_SAFE_ZOOM, Math.min(MAX_SAFE_ZOOM, Math.round(nextZoom * 100) / 100));
        setZoomLevel(clamped);
        if (clamped <= 1.0) {
            setPanOffset({ x: 0, y: 0 });
            setIsFollowingAvatar(false);
        } else if (followAvatar) {
            setIsFollowingAvatar(true);
        }
    };

    const handleToggleFollowAvatar = () => {
        if (isFollowingAvatar && zoomLevel > 1.0) {
            handleZoomChange(1.0, false);
        } else {
            setZoomLevel((prev) => (prev < 1.5 ? 1.75 : prev));
            setIsFollowingAvatar(true);
        }
    };

    useEffect(() => {
        if (!requestedZone) return;
        if (
            requestedZone === 'indoor' ||
            requestedZone === 'garden' ||
            requestedZone === 'kitchen' ||
            requestedZone === 'camp'
        ) {
            setActiveZone(requestedZone);
            setActiveAzitModal(null);
            setIsTowerModalOpen(false);
            setTowerBattleSession(null);
        }
    }, [requestedZone, zoneSyncNonce]);

    useEffect(() => {
        if (isEditMode && activeZone !== 'indoor') {
            setActiveZone('indoor');
        }
        if (isEditMode || activeZone !== 'garden') {
            setOpenBubblePlotIndex(null);
        }
        if (isEditMode || activeZone !== 'kitchen') {
            setOpenKitchenSlotIndex(null);
        }
        if (isEditMode || activeZone !== 'camp') {
            setOpenCampNode(null);
            setIsTowerModalOpen(false);
            setTowerBattleSession(null);
        }
    }, [isEditMode, activeZone]);

    useEffect(() => {
        if (openBubblePlotIndex === null && openKitchenSlotIndex === null && openCampNode === null) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpenBubblePlotIndex(null);
                setOpenKitchenSlotIndex(null);
                setOpenCampNode(null);
            }
        };
        const handlePointerDown = (e: PointerEvent) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            if (target.closest('[data-garden-bubble="true"]') || target.closest('[data-garden-plot]')) return;
            if (target.closest('[data-kitchen-bubble="true"]') || target.closest('[data-kitchen-stove]')) return;
            if (target.closest('[data-camp-bubble="true"]') || target.closest('[data-camp-node]')) return;
            setOpenBubblePlotIndex(null);
            setOpenKitchenSlotIndex(null);
            setOpenCampNode(null);
        };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('pointerdown', handlePointerDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [openBubblePlotIndex, openKitchenSlotIndex, openCampNode]);

    const { weather } = useWeather();
    const avatarSim = useAvatarLifeSim({ layout, isEditMode, activeZone, forcedGardenAction });
    const gardenState = ensureGardenState(isOwner && azitGame?.state?.garden ? azitGame.state.garden : layout.garden);
    const ownerAzitLevel = isOwner ? azitGame?.state?.profile.azitLevel : undefined;
    const [gardenTickMs, setGardenTickMs] = useState<number>(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setGardenTickMs(Date.now());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    const activeGameNowMs = azitGame?.nowMs ?? gardenTickMs;
    const readyHarvestCount = gardenState.plots.filter(
        (p) => p.isUnlocked !== false && Boolean(p.cropId) && p.stage === 3
    ).length;
    const needWaterCount = gardenState.plots.filter((p) => {
        if (p.isUnlocked === false) return false;
        const st = getGardenPlotWaterStatus(p, activeGameNowMs);
        return st.isPlanted && !st.isHarvestReady && st.canWater;
    }).length;
    const openBubblePlot =
        openBubblePlotIndex !== null
            ? gardenState.plots.find((p) => p.plotIndex === openBubblePlotIndex) || null
            : null;
    const openKitchenSlot =
        openKitchenSlotIndex !== null && azitGame?.state
            ? azitGame.state.kitchenSlots.find((s) => s.slotIndex === openKitchenSlotIndex) || null
            : null;
    const kitchenReadyCount = azitGame?.state
        ? azitGame.state.kitchenSlots.filter(
              (s) => s.status === 'cooking' && s.endsAtMs !== null && s.endsAtMs <= activeGameNowMs
          ).length
        : 0;
    const campReadyCount = azitGame?.state
        ? azitGame.state.activeExpeditions.filter((e) => e.endsAtMs <= activeGameNowMs).length
        : 0;

    const handleGardenPlantCrop = (plotIdx: number, cropId: GardenCropId) => {
        if (onPlantCrop) {
            onPlantCrop(plotIdx, cropId);
        }
        const cropMeta = getGardenCropById(cropId);
        setForcedGardenAction({
            plotIndex: plotIdx,
            activityType: 'planting',
            cropEmoji: cropMeta?.emoji || '🌱',
            durationMs: 1900,
            badge: `🌱 ${plotIdx + 1}번 텃밭에 ${cropMeta?.shortName || '씨앗'} 심는 중`,
            timestamp: Date.now(),
        });
    };

    const handleGardenWaterPlot = (plotIdx: number): boolean => {
        let watered = true;
        if (onWaterPlot) {
            const res = onWaterPlot(plotIdx);
            if (res === false) watered = false;
        }
        if (watered) {
            setForcedGardenAction({
                plotIndex: plotIdx,
                activityType: 'watering',
                durationMs: 1900,
                badge: `💧 ${plotIdx + 1}번 텃밭에 시원하게 물 주는 중`,
                timestamp: Date.now(),
            });
        }
        return watered;
    };

    const handleGardenHarvestPlot = (plotIdx: number) => {
        const existingPlot = gardenState.plots.find((p) => p.plotIndex === plotIdx);
        const cropMeta = getGardenCropById(existingPlot?.cropId || null);
        if (onHarvestPlot) {
            onHarvestPlot(plotIdx);
        }
        setForcedGardenAction({
            plotIndex: plotIdx,
            activityType: 'harvesting',
            cropEmoji: cropMeta?.emoji || '🧺',
            durationMs: 2000,
            badge: `🧺 ${plotIdx + 1}번 텃밭 ${cropMeta?.shortName || '작물'} 수확 완료!`,
            timestamp: Date.now(),
        });
    };
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

    const hiredFarmers: OwnedFarmer[] = isOwner && azitGame?.state?.farmers ? azitGame.state.farmers : [];
    const farmerLogs: FarmerActionLog[] = isOwner && azitGame?.state?.farmerLogs ? azitGame.state.farmerLogs : [];

    type GardenRenderEntity =
        | { kind: 'plot'; depth: number; plot: GardenPlotItem; gridX: number; gridY: number }
        | { kind: 'bench'; depth: number; gridX: number; gridY: number }
        | {
              kind: 'farmer';
              depth: number;
              farmer: OwnedFarmer;
              gridX: number;
              gridY: number;
              latestLog?: FarmerActionLog;
              facingLeft: boolean;
          }
        | { kind: 'minimi'; depth: number };

    const sortedGardenEntities: GardenRenderEntity[] = [
        ...gardenState.plots
            .filter((plot) => plot.isUnlocked !== false)
            .map((plot) => {
                const coord = getGardenPlotCoord(plot.plotIndex);
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
        ...(() => {
            const plantedPlots = gardenState.plots.filter(
                (p) => p.isUnlocked !== false && p.cropId && p.stage > 0
            );
            const plotOccupancy = new Map<number, number>();
            return hiredFarmers.map((farmer, idx) => {
                const latestLog = farmerLogs.find((l) => l.farmerCode === farmer.farmerCode);
                const targetPlot =
                    latestLog !== undefined
                        ? gardenState.plots.find((p) => p.plotIndex === latestLog.plotIndex && p.isUnlocked !== false)
                        : plantedPlots.length > 0
                          ? plantedPlots[idx % plantedPlots.length]
                          : undefined;
                if (targetPlot) {
                    const occ = plotOccupancy.get(targetPlot.plotIndex) ?? 0;
                    plotOccupancy.set(targetPlot.plotIndex, occ + 1);
                    const coord = getGardenPlotCoord(targetPlot.plotIndex);
                    const standRight = coord.gridX < 1.12;
                    const baseGx = coord.gridX + (standRight ? 0.68 : -0.68);
                    const baseGy = coord.gridY + 0.25;
                    const gx = Math.max(
                        0.4,
                        Math.min(6.8, baseGx + (occ > 0 ? (standRight ? 0.45 * occ : -0.45 * occ) : 0))
                    );
                    const gy = Math.max(0.4, Math.min(6.8, baseGy + occ * 0.45));
                    return {
                        kind: 'farmer' as const,
                        depth: gx + gy + 0.1,
                        farmer,
                        gridX: gx,
                        gridY: gy,
                        latestLog,
                        facingLeft: standRight,
                    };
                }
                const station = idx === 0 ? { gridX: 0.9, gridY: 2.2 } : { gridX: 6.7, gridY: 3.0 };
                return {
                    kind: 'farmer' as const,
                    depth: station.gridX + station.gridY + 0.1,
                    farmer,
                    gridX: station.gridX,
                    gridY: station.gridY,
                    latestLog,
                    facingLeft: idx !== 0,
                };
            });
        })(),
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

    // ─── 동적 SVG viewBox 계산 (최대 200% 무손실 벡터/고해상도 카메라 줌) ───
    const currentVbW = BASE_VB_W / zoomLevel;
    const currentVbH = BASE_VB_H / zoomLevel;
    const maxPanX = (BASE_VB_W - currentVbW) / 2;
    const maxPanY = (BASE_VB_H - currentVbH) / 2;

    const avatarCenterPos = getTileCenter(avatarSim.animX, avatarSim.animY);
    const targetPanX =
        isFollowingAvatar && zoomLevel > 1
            ? avatarCenterPos.x - BASE_CENTER_X
            : panOffset.x;
    const targetPanY =
        isFollowingAvatar && zoomLevel > 1
            ? avatarCenterPos.y - 34 - BASE_CENTER_Y
            : panOffset.y;

    const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, targetPanX));
    const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, targetPanY));
    const dynamicViewBox = `${(BASE_CENTER_X + clampedPanX - currentVbW / 2).toFixed(1)} ${(
        BASE_CENTER_Y +
        clampedPanY -
        currentVbH / 2
    ).toFixed(1)} ${currentVbW.toFixed(1)} ${currentVbH.toFixed(1)}`;

    return (
        <div className="relative h-full flex-1 flex flex-col bg-[#f0f4f8] rounded-3xl border border-white/80 overflow-hidden shadow-[6px_6px_14px_rgba(163,177,198,0.45),-6px_-6px_14px_rgba(255,255,255,0.85)]">
            {/* 통합 아지트 헤더 바 (3단 기능별 그룹화: 1단 아이덴티티+소셜·알림 / 2단 성장·운영 허브 / 3단 4구역 탭) */}
            <div className="flex flex-col gap-2.5 px-4 sm:px-5 py-3.5 bg-[#f0f4f8] border-b border-slate-200/80 shrink-0">
                {/* 1단: 아이덴티티(타이틀·핸들·방문자) + 우측 소셜·알림 통합 뉴모피즘 독 */}
                <div className="w-full flex flex-wrap items-start sm:items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
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
                                    className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] text-sm font-extrabold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={handleConfirmTitleSave}
                                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[11px] font-black shadow-xs shrink-0 cursor-pointer transition-all"
                                >
                                    저장
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTitleDraft(displayRoomTitle);
                                        setIsEditingTitle(false);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#e8edf2] hover:bg-white text-[#64748b] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[11px] font-bold shrink-0 cursor-pointer transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                                {headingTag === 'h1' ? (
                                    <h1 className="text-lg sm:text-xl font-black text-[#1e293b] tracking-tight break-words">
                                        {displayRoomTitle}
                                    </h1>
                                ) : (
                                    <h2 className="text-lg sm:text-xl font-black text-[#1e293b] tracking-tight break-words">
                                        {displayRoomTitle}
                                    </h2>
                                )}
                                {isOwner && onSaveRoomTitle && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTitleDraft(displayRoomTitle);
                                            setIsEditingTitle(true);
                                        }}
                                        className="px-2 py-0.5 rounded-lg bg-[#e8edf2] hover:bg-white text-[#64748b] hover:text-[#6366f1] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[10px] font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1"
                                        title="아지트 이름 수정"
                                    >
                                        <i className="fas fa-pen text-[9px]"></i>
                                        <span>수정</span>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-[#64748b]">
                            {handle && (
                                <>
                                    <span className="font-extrabold text-[#6366f1]">@{handle}</span>
                                    <span className="text-slate-300" aria-hidden="true">
                                        ·
                                    </span>
                                </>
                            )}
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-black">
                                <span className="text-rose-600">TODAY {todayVisitors.toLocaleString()}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-[#475569]">TOTAL {totalVisitors.toLocaleString()}</span>
                            </span>
                            {backHref && (
                                <>
                                    <span className="text-slate-300" aria-hidden="true">
                                        ·
                                    </span>
                                    <Link
                                        href={backHref}
                                        className="text-[11px] font-bold text-[#64748b] hover:text-[#6366f1] transition-colors shrink-0"
                                    >
                                        ← 마이페이지
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {((isOwner && Boolean(onOpenNotificationCenter)) ||
                        Boolean(onOpenGuestbookModal) ||
                        (hasNeighbors && (Boolean(onRandomSurf) || Boolean(onOpenSurfModal))) ||
                        Boolean(onShare)) && (
                        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-[#e8edf2] border border-white/70 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] shrink-0">
                            {isOwner && onOpenNotificationCenter && (
                                <button
                                    type="button"
                                    onClick={onOpenNotificationCenter}
                                    className="px-2 sm:px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                                    title={
                                        isPushSubscribed
                                            ? '푸시 알림 ON · 클릭해 알림함 및 설정 열기'
                                            : '푸시 알림 OFF · 클릭해 알림 구독 및 설정 열기'
                                    }
                                    aria-label={`알림 ${isPushSubscribed ? 'ON' : 'OFF'}${unreadNotificationCount > 0 ? `, 미읽음 ${unreadNotificationCount}건` : ''}`}
                                >
                                    <span>🔔</span>
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            isPushSubscribed ? 'bg-emerald-500' : 'bg-slate-300'
                                        }`}
                                        aria-hidden="true"
                                    />
                                    {unreadNotificationCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black leading-tight">
                                            {unreadNotificationCount}
                                        </span>
                                    )}
                                </button>
                            )}
                            {onOpenGuestbookModal && (
                                <button
                                    type="button"
                                    onClick={onOpenGuestbookModal}
                                    className="px-2 sm:px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                    title={`방명록 (${guestbookCount})`}
                                    aria-label={`방명록 ${guestbookCount}개`}
                                >
                                    <span>📖</span>
                                    <span className="hidden sm:inline">방명록</span>
                                    <span className="font-mono text-[#6366f1] font-black">
                                        {guestbookCount}
                                    </span>
                                </button>
                            )}
                            {hasNeighbors && onRandomSurf && (
                                <button
                                    type="button"
                                    onClick={onRandomSurf}
                                    className="px-2 sm:px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                    title="이웃 아지트 놀러가기"
                                >
                                    <span>🌊</span>
                                    <span className="hidden sm:inline">이웃</span>
                                </button>
                            )}
                            {hasNeighbors && onOpenSurfModal && (
                                <button
                                    type="button"
                                    onClick={onOpenSurfModal}
                                    className="px-2 sm:px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                    title="이웃 아지트 목록"
                                    aria-label="이웃 아지트 목록"
                                >
                                    <i className="fas fa-users text-[10px] text-[#64748b]" aria-hidden="true"></i>
                                </button>
                            )}
                            {onShare && (
                                <button
                                    type="button"
                                    onClick={onShare}
                                    className="px-2 sm:px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                    title="내 아지트 주소 복사/공유"
                                >
                                    <i className="fas fa-share-nodes text-[10px] text-[#64748b]" aria-hidden="true"></i>
                                    <span className="hidden sm:inline">공유</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 2단·3단: 편집 모드 바 또는 성장·운영 허브 + 4구역 메인 공간 탭 */}
                {isEditMode ? (
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200/80">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6366f1] bg-[#e8edf2] px-3 py-1 rounded-xl border border-white/80 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
                            <i className="fas fa-hand-pointer animate-bounce"></i>
                            <span>바닥 타일 클릭 시 [{selectedItemMeta?.name || '아바타'}] 이동</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {onOpenShopModal && (
                                <button
                                    type="button"
                                    onClick={onOpenShopModal}
                                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>🎁 아지트 상점·보관함 팝업</span>
                                </button>
                            )}
                            {onCancelEdit && (
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    className="px-2.5 py-1 rounded-xl bg-[#e8edf2] hover:bg-white text-[#64748b] border border-white/80 shadow-[2px_2px_4px_rgba(163,177,198,0.35),-2px_-2px_4px_rgba(255,255,255,0.85)] text-[11px] font-bold transition-all cursor-pointer"
                                >
                                    취소
                                </button>
                            )}
                            {onSaveRoom && (
                                <button
                                    type="button"
                                    onClick={onSaveRoom}
                                    disabled={isSaving}
                                    className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-indigo-600 hover:to-violet-600 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? '저장 중...' : '💾 저장'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full space-y-2.5 pt-2.5 border-t border-slate-200/80">
                        {/* 2단: 성장·자산 & 경제·운영 허브 카드 */}
                        {isOwner && azitGame?.state && (
                            <AzitLevelHeaderBadge
                                gameState={azitGame.state}
                                onOpenMarketModal={() => setActiveAzitModal('market')}
                                onOpenFarmerModal={() => setActiveAzitModal('farmers')}
                                onOpenChefModal={() => setActiveAzitModal('chefs')}
                                onOpenMercModal={() => setActiveAzitModal('mercs')}
                                onOpenWarehouseModal={onOpenWarehouseModal}
                                onOpenShopModal={onOpenShopModal}
                            />
                        )}

                        {/* 3단: 4구역 메인 공간 탭 (캔버스 상단 밀착) */}
                        <div className="w-full flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex flex-wrap items-center p-1 rounded-2xl bg-[#e8edf2] border border-white/70 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.35),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] gap-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveZone('indoor')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                        activeZone === 'indoor'
                                            ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-sm'
                                            : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/70'
                                    }`}
                                >
                                    <span>🏠 실내</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveZone('garden')}
                                    data-screenshot-click="action"
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                        activeZone === 'garden'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/70'
                                    }`}
                                >
                                    <span>🌿 텃밭</span>
                                    {needWaterCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-sky-400 text-slate-950 text-[10px] font-black animate-pulse">
                                            💧 {needWaterCount}
                                        </span>
                                    )}
                                    {readyHarvestCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                                            수확 {readyHarvestCount}
                                        </span>
                                    )}
                                </button>

                                {isOwner && azitGame?.state && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setActiveZone('kitchen')}
                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                                activeZone === 'kitchen'
                                                    ? 'bg-orange-500 text-white shadow-sm'
                                                    : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/70'
                                            }`}
                                        >
                                            <span>👨‍🍳 주방</span>
                                            {kitchenReadyCount > 0 && (
                                                <span className="px-1.5 py-0.2 rounded-full bg-amber-300 text-slate-950 text-[10px] font-black animate-pulse">
                                                    완성 {kitchenReadyCount}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveZone('camp')}
                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                                activeZone === 'camp'
                                                    ? 'bg-rose-600 text-white shadow-sm'
                                                    : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/70'
                                            }`}
                                        >
                                            <span>⚔️ 용병 캠프</span>
                                            {campReadyCount > 0 && (
                                                <span className="px-1.5 py-0.2 rounded-full bg-amber-300 text-slate-950 text-[10px] font-black animate-pulse">
                                                    정산 {campReadyCount}
                                                </span>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                            {isOwner && azitGame?.state ? (
                                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl bg-[#e8edf2]/80 text-[11px] text-[#64748b] font-bold">
                                    {activeZone === 'indoor'
                                        ? `가구 ${layout.placedItems.length}개`
                                        : activeZone === 'garden'
                                          ? `수확 누적 ${gardenState.totalHarvested}개`
                                          : activeZone === 'kitchen'
                                            ? `요리사 ${azitGame.state.chefs.length}명`
                                            : `용병 ${azitGame.state.mercenaries.length}명`}
                                </span>
                            ) : (
                                (onOpenWarehouseModal || onOpenShopModal) && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {onOpenWarehouseModal && (
                                            <button
                                                type="button"
                                                onClick={onOpenWarehouseModal}
                                                className="px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/90 shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.85)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                                                title="농장 창고"
                                            >
                                                <span>🏚️ 창고</span>
                                            </button>
                                        )}
                                        {onOpenShopModal && (
                                            <button
                                                type="button"
                                                onClick={onOpenShopModal}
                                                className="px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/90 shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.85)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                                                title="상점·보관함 (0원)"
                                            >
                                                <span>🎁 상점</span>
                                            </button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 메인 2.5D 아이소메트릭 디오라마 스테이지 */}
            <div
                className={`relative w-full flex-1 min-h-[300px] sm:min-h-[460px] lg:min-h-[560px] p-2 sm:p-4 flex flex-col items-center justify-center select-none ${
                    zoomLevel > 1 && !isEditMode
                        ? isDraggingPan
                            ? 'cursor-grabbing'
                            : 'cursor-grab'
                        : ''
                }`}
                data-screenshot-point="result"
                onPointerDown={(e) => {
                    if (zoomLevel <= 1 || isEditMode) return;
                    // 버튼 클릭은 드래그 제외
                    if ((e.target as HTMLElement).closest('button')) return;
                    setIsDraggingPan(true);
                    setIsFollowingAvatar(false);
                    setDragStartInfo({
                        clientX: e.clientX,
                        clientY: e.clientY,
                        originPanX: clampedPanX,
                        originPanY: clampedPanY,
                    });
                }}
                onPointerMove={(e) => {
                    if (!isDraggingPan || !dragStartInfo || zoomLevel <= 1) return;
                    const scaleFactor = 1 / zoomLevel;
                    const dx = (dragStartInfo.clientX - e.clientX) * scaleFactor;
                    const dy = (dragStartInfo.clientY - e.clientY) * scaleFactor;
                    setPanOffset({
                        x: Math.max(-maxPanX, Math.min(maxPanX, dragStartInfo.originPanX + dx)),
                        y: Math.max(-maxPanY, Math.min(maxPanY, dragStartInfo.originPanY + dy)),
                    });
                }}
                onPointerUp={() => {
                    setIsDraggingPan(false);
                    setDragStartInfo(null);
                }}
                onPointerLeave={() => {
                    if (isDraggingPan) {
                        setIsDraggingPan(false);
                        setDragStartInfo(null);
                    }
                }}
            >
                {/* 좌측 상단: 무손실 스마트 줌 컨트롤러 (100% ~ 200% 안전 배율 제한 + 아바타 클로즈업) */}
                <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-4 z-10 flex items-center gap-1.5">
                    <div className="inline-flex items-center bg-white/92 backdrop-blur-xs border border-slate-200/90 rounded-full p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => handleZoomChange(zoomLevel - ZOOM_STEP, isFollowingAvatar)}
                            disabled={zoomLevel <= MIN_SAFE_ZOOM}
                            title="화면 축소"
                            aria-label="화면 축소"
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                            −
                        </button>
                        <button
                            type="button"
                            onClick={() => handleZoomChange(1.0, false)}
                            title="기본 크기(100%)로 초기화"
                            className="px-1.5 py-0.5 text-[11px] font-mono font-black text-indigo-700 hover:text-indigo-900 cursor-pointer"
                        >
                            {Math.round(zoomLevel * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={() => handleZoomChange(zoomLevel + ZOOM_STEP, isFollowingAvatar)}
                            disabled={zoomLevel >= MAX_SAFE_ZOOM}
                            title="화면 확대 (최대 200% 화질 유지)"
                            aria-label="화면 확대"
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                            +
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleToggleFollowAvatar}
                        aria-label={isFollowingAvatar && zoomLevel > 1 ? '아바타 추적 해제' : '아바타 추적'}
                        className={`w-7 h-7 rounded-full border shadow-2xs backdrop-blur-xs transition-all cursor-pointer flex items-center justify-center ${
                            isFollowingAvatar && zoomLevel > 1
                                ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-300/60'
                                : 'bg-white/90 hover:bg-indigo-50 text-slate-700 border-slate-200/90'
                        }`}
                        title={isFollowingAvatar && zoomLevel > 1 ? '아바타 실시간 자동 추적 중 (클릭 시 해제)' : '아바타 클로즈업 및 실시간 자동 추적'}
                    >
                        <i className="fas fa-crosshairs text-xs"></i>
                    </button>

                    {zoomLevel > 1 && !isFollowingAvatar && (
                        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900/75 text-white text-[10px] font-bold">
                            🖐️ 드래그하여 이동
                        </span>
                    )}
                </div>

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
                        <span className="hidden sm:inline text-[10px] opacity-75">({weather.location})</span>
                    </div>
                )}

                <div className="relative w-full max-w-[676px] aspect-[610/505] mx-auto flex items-center justify-center">
                <svg
                    viewBox={dynamicViewBox}
                    className="w-full h-full object-contain"
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

                            {/* ==================== [앞마당 텃밭 모드] 3. 깊이(Z-Order) 정렬된 최대 16구획 텃밭·벤치·농부·아바타 ==================== */}
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
                                            isSelected={openBubblePlotIndex === entity.plot.plotIndex}
                                            isBubbleOpen={openBubblePlotIndex === entity.plot.plotIndex}
                                            hideBadge
                                            onSelectPlot={(idx) =>
                                                setOpenBubblePlotIndex((prev) => (prev === idx ? null : idx))
                                            }
                                            nowMs={activeGameNowMs}
                                            azitLevel={ownerAzitLevel}
                                        />
                                    );
                                }

                                if (entity.kind === 'farmer') {
                                    return (
                                        <GardenFarmerIsoNode
                                            key={`garden-farmer-${entity.farmer.farmerCode}`}
                                            farmer={entity.farmer}
                                            pos={getTileCenter(entity.gridX, entity.gridY)}
                                            latestLog={entity.latestLog}
                                            facingLeft={entity.facingLeft}
                                            onClick={() => setActiveAzitModal('farmers')}
                                        />
                                    );
                                }

                                const minimiPos = getTileCenter(avatarSim.animX, avatarSim.animY);
                                return (
                                    <g
                                        key="garden-minimi-avatar"
                                        transform={`translate(${minimiPos.x}, ${minimiPos.y})`}
                                        className="pointer-events-none"
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

                            {/* ==================== [앞마당 텃밭 모드] 4. 최상단 상태·원클릭 수확/물주기 배지 오버레이 ==================== */}
                            {gardenState.plots
                                .filter((plot) => plot.isUnlocked !== false)
                                .map((plot) => {
                                    const coord = getGardenPlotCoord(plot.plotIndex);
                                    const pos = getTileCenter(coord.gridX, coord.gridY);
                                    return (
                                        <GardenPlotBadgeOverlay
                                            key={`garden-plot-badge-${plot.plotIndex}`}
                                            plot={plot}
                                            pos={pos}
                                            isOwner={isOwner}
                                            isSelected={openBubblePlotIndex === plot.plotIndex}
                                            isBubbleOpen={openBubblePlotIndex === plot.plotIndex}
                                            onSelectPlot={(idx) =>
                                                setOpenBubblePlotIndex((prev) => (prev === idx ? null : idx))
                                            }
                                            onQuickWater={(idx) => {
                                                handleGardenWaterPlot(idx);
                                                setOpenBubblePlotIndex(null);
                                            }}
                                            onQuickHarvest={(idx) => {
                                                handleGardenHarvestPlot(idx);
                                                setOpenBubblePlotIndex(null);
                                            }}
                                            nowMs={activeGameNowMs}
                                            azitLevel={ownerAzitLevel}
                                        />
                                    );
                                })}
                        </>
                    ) : activeZone === 'kitchen' && isOwner && azitGame?.state ? (
                        <AzitKitchenIsoScene
                            gameState={azitGame.state}
                            nowMs={azitGame.nowMs}
                            selectedSlotIndex={openKitchenSlotIndex}
                            isActing={azitGame.isActing}
                            minimiItemId={layout.minimiItemId}
                            ownerName={ownerName}
                            onSelectSlot={(slotIdx) =>
                                setOpenKitchenSlotIndex((prev) => (prev === slotIdx ? null : slotIdx))
                            }
                            onQuickClaimSlot={async (slotIdx) => {
                                const ok = await azitGame.claimCooking(slotIdx);
                                if (ok) {
                                    setOpenKitchenSlotIndex(null);
                                }
                                return ok;
                            }}
                            onEnterIndoor={() => setActiveZone('indoor')}
                            onOpenChefModal={() => setActiveAzitModal('chefs')}
                            onOpenMarketModal={() => setActiveAzitModal('market')}
                        />
                    ) : activeZone === 'camp' && isOwner && azitGame?.state ? (
                        <AzitCampIsoScene
                            gameState={azitGame.state}
                            nowMs={azitGame.nowMs}
                            selectedNode={openCampNode}
                            onSelectNode={(node) => setOpenCampNode((prev) => (prev === node ? null : node))}
                            onEnterIndoor={() => setActiveZone('indoor')}
                            onEnterKitchen={() => setActiveZone('kitchen')}
                        />
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

                    {/* 텃밭 이랑 클릭 시 현재 상태 기반 액션 말풍선 */}
                    {activeZone === 'garden' && !isEditMode && openBubblePlot && (
                        <GardenPlotActionBubble
                            plot={openBubblePlot}
                            gardenState={gardenState}
                            isOwner={isOwner}
                            isZoomed={zoomLevel > 1}
                            nowMs={activeGameNowMs}
                            azitLevel={ownerAzitLevel}
                            veraPoints={isOwner ? azitGame?.state?.veraPoints : undefined}
                            isActing={azitGame?.isActing}
                            cropCatalog={azitGame?.state?.catalog.crops}
                            fertilizerCatalog={azitGame?.state?.catalog.fertilizers}
                            soilLevelsCatalog={azitGame?.state?.catalog.soilLevels}
                            onClose={() => setOpenBubblePlotIndex(null)}
                            onPlantCrop={handleGardenPlantCrop}
                            onWaterPlot={handleGardenWaterPlot}
                            onHarvestPlot={handleGardenHarvestPlot}
                            onClearPlot={onClearPlot}
                            onUnlockPlot={isOwner ? azitGame?.unlockPlot : undefined}
                            onUpgradeSoil={isOwner ? azitGame?.upgradeSoil : undefined}
                            onFertilizePlot={isOwner ? azitGame?.fertilizePlot : undefined}
                            onOpenSeedShop={onOpenSeedShopModal || onOpenShopModal}
                            onOpenFertilizerShop={onOpenFertilizerShopModal || onOpenSeedShopModal || onOpenShopModal}
                        />
                    )}

                    {/* 주방 화구 클릭 시 조리/수령 액션 말풍선 */}
                    {activeZone === 'kitchen' && !isEditMode && isOwner && azitGame?.state && openKitchenSlot && (
                        <KitchenStoveActionBubble
                            slot={openKitchenSlot}
                            gameState={azitGame.state}
                            nowMs={azitGame.nowMs}
                            isZoomed={zoomLevel > 1}
                            isActing={azitGame.isActing}
                            onClose={() => setOpenKitchenSlotIndex(null)}
                            onStartCooking={azitGame.startCooking}
                            onClaimCooking={azitGame.claimCooking}
                            onOpenChefModal={() => setActiveAzitModal('chefs')}
                            onGoToGarden={() => setActiveZone('garden')}
                        />
                    )}

                    {/* 용병 캠프 텐트/관문 클릭 시 출정/영입 액션 말풍선 */}
                    {activeZone === 'camp' && !isEditMode && isOwner && azitGame?.state && openCampNode && (
                        <CampActionBubble
                            node={openCampNode}
                            gameState={azitGame.state}
                            nowMs={azitGame.nowMs}
                            isZoomed={zoomLevel > 1}
                            isActing={azitGame.isActing}
                            onClose={() => setOpenCampNode(null)}
                            onOpenMercModal={() => setActiveAzitModal('mercs')}
                            onOpenExpeditionModal={() => setActiveAzitModal('expedition')}
                            onClaimExpedition={azitGame.claimExpedition}
                            onOpenTower={() => setIsTowerModalOpen(true)}
                        />
                    )}
                </div>

                {/* 앞마당 텃밭 모드일 때 하단 안내·알림·일괄 관리·창고 현황 패널 */}
                {activeZone === 'garden' && !isEditMode && (
                    <MinihomeGardenControlPanel
                        gardenState={gardenState}
                        isOwner={isOwner}
                        isRainWeather={isRainWeather}
                        nowMs={activeGameNowMs}
                        azitLevel={ownerAzitLevel}
                        veraPoints={azitGame?.state?.veraPoints}
                        isActing={azitGame?.isActing}
                        cropCatalog={azitGame?.state?.catalog.crops}
                        fertilizerCatalog={azitGame?.state?.catalog.fertilizers}
                        farmers={isOwner ? azitGame?.state?.farmers : undefined}
                        maxFarmers={isOwner ? azitGame?.state?.profile.limits.maxFarmers : undefined}
                        onOpenSeedShop={onOpenSeedShopModal || onOpenShopModal}
                        onOpenFertilizerShop={onOpenFertilizerShopModal || onOpenSeedShopModal || onOpenShopModal}
                        onOpenFarmerModal={isOwner && azitGame?.state ? () => setActiveAzitModal('farmers') : undefined}
                        onOpenWarehouse={onOpenWarehouseModal || onOpenShopModal}
                        onOpenMarket={isOwner && azitGame?.state ? () => setActiveAzitModal('market') : undefined}
                        onOpenNotificationCenter={onOpenNotificationCenter}
                        externalPushSubscribed={onOpenNotificationCenter ? isPushSubscribed : undefined}
                        onWaterPlot={handleGardenWaterPlot}
                        onHarvestPlot={handleGardenHarvestPlot}
                        onWaterAll={isOwner ? azitGame?.waterAll : undefined}
                        onHarvestAll={isOwner ? azitGame?.harvestAll : undefined}
                        onPlantAll={isOwner ? azitGame?.plantAll : undefined}
                        onUnlockPlot={isOwner ? azitGame?.unlockPlot : undefined}
                    />
                )}

                {/* 아지트 주방 하단 제어·보유 요리·재료 패널 */}
                {activeZone === 'kitchen' && !isEditMode && isOwner && azitGame?.state && (
                    <AzitKitchenControlPanel
                        gameState={azitGame.state}
                        nowMs={azitGame.nowMs}
                        isActing={azitGame.isActing}
                        onClaimCooking={azitGame.claimCooking}
                        onOpenChefModal={() => setActiveAzitModal('chefs')}
                        onOpenMarketModal={() => setActiveAzitModal('market')}
                        onGoToCamp={() => setActiveZone('camp')}
                    />
                )}

                {/* 용병 캠프 하단 진행중 원정대·전투력 요약 패널 */}
                {activeZone === 'camp' && !isEditMode && isOwner && azitGame?.state && (
                    <AzitCampControlPanel
                        gameState={azitGame.state}
                        nowMs={azitGame.nowMs}
                        isActing={azitGame.isActing}
                        onClaimExpedition={azitGame.claimExpedition}
                        onOpenMercModal={() => setActiveAzitModal('mercs')}
                        onOpenExpeditionModal={() => setActiveAzitModal('expedition')}
                        onGoToKitchen={() => setActiveZone('kitchen')}
                        onOpenTower={() => setIsTowerModalOpen(true)}
                    />
                )}

                {/* 아지트 타이쿤 게임 모달 (장터 / 요리사 길드 / 용병 길드 / 원정 출정 / 전투 결과) */}
                {isOwner && azitGame?.state && (
                    <>
                        <AzitGameModals
                            activeModal={activeAzitModal}
                            onCloseModal={() => setActiveAzitModal(null)}
                            gameState={azitGame.state}
                            azitGame={azitGame}
                            onGoToKitchen={() => setActiveZone('kitchen')}
                            onOpenMercModal={() => setActiveAzitModal('mercs')}
                        />
                        <AzitTowerModal
                            isOpen={isTowerModalOpen && towerBattleSession === null}
                            onClose={() => setIsTowerModalOpen(false)}
                            gameState={azitGame.state}
                            azitGame={azitGame}
                            onOpenMercModal={() => setActiveAzitModal('mercs')}
                            onBattleStarted={(response, launchContext) => {
                                setTowerBattleSession({
                                    response,
                                    ...launchContext,
                                });
                            }}
                        />
                        <AzitTowerBattleFullscreen
                            battleResponse={towerBattleSession?.response ?? null}
                            gameState={azitGame.state}
                            isActing={azitGame.isActing}
                            canUseElixir={
                                (azitGame.state.items?.find(
                                    (it) => it.itemId === 'item-battle-elixir'
                                )?.qty ?? 0) > 0
                            }
                            onClose={() => setTowerBattleSession(null)}
                            onRetryFloor={async (floor) => {
                                if (!towerBattleSession || !azitGame.battleTowerFloor) return;
                                const hasElixir =
                                    (azitGame.state?.items?.find(
                                        (it) => it.itemId === 'item-battle-elixir'
                                    )?.qty ?? 0) > 0;
                                const useElixirNow = towerBattleSession.useElixir && hasElixir;
                                const res = await azitGame.battleTowerFloor({
                                    floor,
                                    ...(towerBattleSession.groupId !== undefined
                                        ? { groupId: towerBattleSession.groupId }
                                        : { partyMercCodes: towerBattleSession.partyMercCodes }),
                                    ...(useElixirNow ? { elixirItemId: 'item-battle-elixir' } : {}),
                                });
                                if (res) {
                                    setTowerBattleSession({
                                        ...towerBattleSession,
                                        floor,
                                        useElixir: useElixirNow,
                                        response: res,
                                    });
                                }
                            }}
                            onChallengeNextFloor={async (nextFloor) => {
                                if (!towerBattleSession || !azitGame.battleTowerFloor) return;
                                const hasElixir =
                                    (azitGame.state?.items?.find(
                                        (it) => it.itemId === 'item-battle-elixir'
                                    )?.qty ?? 0) > 0;
                                const useElixirNow = towerBattleSession.useElixir && hasElixir;
                                const res = await azitGame.battleTowerFloor({
                                    floor: nextFloor,
                                    ...(towerBattleSession.groupId !== undefined
                                        ? { groupId: towerBattleSession.groupId }
                                        : { partyMercCodes: towerBattleSession.partyMercCodes }),
                                    ...(useElixirNow ? { elixirItemId: 'item-battle-elixir' } : {}),
                                });
                                if (res) {
                                    setTowerBattleSession({
                                        ...towerBattleSession,
                                        floor: nextFloor,
                                        useElixir: useElixirNow,
                                        response: res,
                                    });
                                }
                            }}
                        />
                    </>
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
