'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MinihomeRoomLayout, PlacedRoomItem } from '@/types/minihome.types';
import { ensureGardenState, getGardenCropById } from '@/data/minihomeCatalogData';

export const GARDEN_PLOT_COORDS: Array<{ plotIndex: number; gridX: number; gridY: number }> = [
    // Lv.1 기본 6칸: 중앙 2×3
    { plotIndex: 0, gridX: 1.5, gridY: 2.8 },
    { plotIndex: 1, gridX: 3.15, gridY: 2.8 },
    { plotIndex: 2, gridX: 4.8, gridY: 2.8 },
    { plotIndex: 3, gridX: 1.5, gridY: 4.4 },
    { plotIndex: 4, gridX: 3.15, gridY: 4.4 },
    { plotIndex: 5, gridX: 4.8, gridY: 4.4 },
    // Lv.5~10 (7~8칸): 중앙 우측 열 완성 → 2×4
    { plotIndex: 6, gridX: 6.45, gridY: 2.8 },
    { plotIndex: 7, gridX: 6.45, gridY: 4.4 },
    // Lv.15~30 (9~12칸): 상단 1행 추가 → 3×4
    { plotIndex: 8, gridX: 1.5, gridY: 1.2 },
    { plotIndex: 9, gridX: 3.15, gridY: 1.2 },
    { plotIndex: 10, gridX: 4.8, gridY: 1.2 },
    { plotIndex: 11, gridX: 6.45, gridY: 1.2 },
    // Lv.35~50 (13~16칸): 하단 4행 추가 → 4×4 완성
    { plotIndex: 12, gridX: 1.5, gridY: 6.0 },
    { plotIndex: 13, gridX: 3.15, gridY: 6.0 },
    { plotIndex: 14, gridX: 4.8, gridY: 6.0 },
    { plotIndex: 15, gridX: 6.45, gridY: 6.0 },
];

export function getGardenPlotCoord(plotIndex: number): { plotIndex: number; gridX: number; gridY: number } {
    return GARDEN_PLOT_COORDS.find((c) => c.plotIndex === plotIndex) || GARDEN_PLOT_COORDS[0];
}

export type AvatarActivityType =
    | 'walking'
    | 'idle'
    | 'planting'
    | 'watering'
    | 'harvesting'
    | 'drinking-tea'
    | 'looking-window'
    | 'reading-book'
    | 'listening-music'
    | 'working-desk'
    | 'playing-game'
    | 'petting-animal'
    | 'harvest-ready'
    | 'admiring-lamp';

export interface ForcedGardenActionTrigger {
    plotIndex: number;
    activityType: 'planting' | 'watering' | 'harvesting';
    badge: string;
    cropEmoji?: string;
    durationMs?: number;
    timestamp: number;
}

export interface AvatarLifeSimState {
    animX: number;
    animY: number;
    facingLeft: boolean;
    bobOffsetY: number;
    sitOffsetY: number;
    tiltDeg: number;
    isSitting: boolean;
    isWalking: boolean;
    activityType: AvatarActivityType;
    actionPhase: number; // 초 단위 연속 애니메이션 시간값 (물방울 낙하, 찻잔 홀짝임, 김 상승 등 계산용)
    activityBadge: string | null;
    actionCropEmoji: string | null;
}

interface ActivityWaypoint {
    id: string;
    targetX: number;
    targetY: number;
    lookAtX: number;
    lookAtY: number;
    isSitting: boolean;
    sitOffsetY: number;
    activityType: AvatarActivityType;
    badge: string;
    cropEmoji?: string | null;
    dwellMs: number;
    priority: number;
}

function clampGrid(v: number): number {
    return Math.max(0.4, Math.min(6.8, v));
}

function getGardenStandTarget(coord: { gridX: number; gridY: number }): { targetX: number; targetY: number } {
    const offsetX = coord.gridX < 1.12 ? 0.72 : -0.72;
    return {
        targetX: clampGrid(coord.gridX + offsetX),
        targetY: clampGrid(coord.gridY + 0.25),
    };
}

function screenDeltaX(fromX: number, fromY: number, toX: number, toY: number): number {
    return (toX - toY) - (fromX - fromY);
}

function computeActivityMotion(
    activityType: AvatarActivityType,
    elapsedSec: number
): { bobOffsetY: number; tiltDeg: number } {
    switch (activityType) {
        case 'planting': {
            // 몸을 숙여 흙을 파고 씨앗을 톡톡 심는 모션
            const patWave = (Math.sin(elapsedSec * Math.PI * 2.6) + 1) * 0.5;
            return {
                bobOffsetY: 2.0 + patWave * 3.8,
                tiltDeg: 7 + patWave * 6.5,
            };
        }
        case 'watering': {
            // 물조리개를 기울여 물을 주는 리드미컬한 상체 숙임 모션
            const pourCycle = (Math.sin(elapsedSec * Math.PI * 1.4) + 1) * 0.5; // 0 ~ 1
            return {
                bobOffsetY: pourCycle * 2.4,
                tiltDeg: 6 + pourCycle * 7.0, // 앞으로 6~13도 기울임
            };
        }
        case 'harvesting': {
            // 웅크려 작물을 잡았다가 힘껏 위로 뽑아 올리는 2박자 수확 모션
            const cycle = (elapsedSec * 1.45) % 1;
            if (cycle < 0.42) {
                const crouch = Math.sin((cycle / 0.42) * Math.PI);
                return { bobOffsetY: crouch * 4.5, tiltDeg: crouch * 10 };
            }
            const pull = Math.sin(((cycle - 0.42) / 0.58) * Math.PI);
            return { bobOffsetY: -pull * 6.8, tiltDeg: -pull * 6.5 };
        }
        case 'drinking-tea': {
            // 주기적으로 찻잔을 입가로 가져가 홀짝이는(Sip) 모션
            const sipWave = Math.max(0, Math.sin(elapsedSec * Math.PI * 0.9));
            return {
                bobOffsetY: Math.sin(elapsedSec * Math.PI * 0.7) * 1.1,
                tiltDeg: -sipWave * 4.5, // 마실 때 살짝 뒤로 고개를 젖힘
            };
        }
        case 'looking-window': {
            // 창밖 풍경과 날씨를 바라보며 잔잔하게 고개를 갸웃거리는 모션
            return {
                bobOffsetY: Math.sin(elapsedSec * Math.PI * 0.65) * 1.2,
                tiltDeg: Math.sin(elapsedSec * Math.PI * 0.45) * 3.2,
            };
        }
        case 'reading-book': {
            // 책을 읽으며 고개를 끄덕이는 모션
            return {
                bobOffsetY: Math.sin(elapsedSec * Math.PI * 0.8) * 1.3,
                tiltDeg: 2.5 + Math.sin(elapsedSec * Math.PI * 1.1) * 1.8,
            };
        }
        case 'listening-music': {
            // LP 음악 비트에 맞춰 좌우로 신나게 리듬을 타는 그루브 스웨이
            return {
                bobOffsetY: -Math.abs(Math.sin(elapsedSec * Math.PI * 1.8)) * 3.2,
                tiltDeg: Math.sin(elapsedSec * Math.PI * 1.8) * 5.2,
            };
        }
        case 'working-desk':
        case 'playing-game': {
            // 키보드 타이핑 / 게임 컨트롤러 집중 조작 모션
            return {
                bobOffsetY: Math.sin(elapsedSec * Math.PI * 3.2) * 1.1,
                tiltDeg: 2.2 + Math.sin(elapsedSec * Math.PI * 2.6) * 2.0,
            };
        }
        case 'petting-animal': {
            // 반려동물을 다정하게 쓰다듬는 모션
            return {
                bobOffsetY: Math.sin(elapsedSec * Math.PI * 1.5) * 1.8,
                tiltDeg: 4 + Math.sin(elapsedSec * Math.PI * 1.5) * 3.5,
            };
        }
        case 'harvest-ready': {
            // 다 자란 농작물을 보고 기뻐하며 통통 튀는 모션
            return {
                bobOffsetY: -Math.abs(Math.sin(elapsedSec * Math.PI * 2.2)) * 4.5,
                tiltDeg: Math.sin(elapsedSec * Math.PI * 2.2) * 3.5,
            };
        }
        default: {
            return {
                bobOffsetY: Math.sin(elapsedSec * Math.PI * 0.85) * 1.4,
                tiltDeg: 0,
            };
        }
    }
}

function buildWaypointForItem(item: PlacedRoomItem): ActivityWaypoint | null {
    const gx = item.gridX;
    const gy = item.gridY;

    switch (item.itemId) {
        case 'furn-wood-desk':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.45),
                targetY: clampGrid(gy + 0.55),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: true,
                sitOffsetY: 9,
                activityType: 'working-desk',
                badge: '💻 책상에 앉아 집중 타이핑 중',
                dwellMs: 8500,
                priority: 1,
            };
        case 'furn-gaming-setup':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.45),
                targetY: clampGrid(gy + 0.55),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: true,
                sitOffsetY: 9,
                activityType: 'playing-game',
                badge: '🎧 게이밍 데스크에서 열겜 중',
                dwellMs: 8500,
                priority: 2,
            };
        case 'prop-mini-plant':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx - 0.75),
                targetY: clampGrid(gy + 0.65),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: false,
                sitOffsetY: 0,
                activityType: 'watering',
                badge: '💧 반려식물에 정성껏 물 주는 중',
                dwellMs: 8200,
                priority: 3,
            };
        case 'furn-bookshelf':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.35),
                targetY: clampGrid(gy + 0.85),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: false,
                sitOffsetY: 0,
                activityType: 'reading-book',
                badge: '📖 책장 앞에서 독서 삼매경',
                dwellMs: 8000,
                priority: 4,
            };
        case 'prop-coffee-rug':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.15),
                targetY: clampGrid(gy + 0.15),
                lookAtX: gx + 1,
                lookAtY: gy + 1,
                isSitting: true,
                sitOffsetY: 7,
                activityType: 'drinking-tea',
                badge: '☕ 러그에 앉아 따뜻한 차 마시는 중',
                dwellMs: 8600,
                priority: 5,
            };
        case 'furn-beanbag':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.15),
                targetY: clampGrid(gy + 0.2),
                lookAtX: gx + 1,
                lookAtY: gy + 1,
                isSitting: true,
                sitOffsetY: 10,
                activityType: 'drinking-tea',
                badge: '🍵 빈백 소파에서 향긋한 티타임',
                dwellMs: 8600,
                priority: 5,
            };
        case 'furn-turntable':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.3),
                targetY: clampGrid(gy + 0.8),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: false,
                sitOffsetY: 0,
                activityType: 'listening-music',
                badge: '🎵 LP 턴테이블 음악에 리듬 타는 중',
                dwellMs: 8200,
                priority: 6,
            };
        case 'furn-arcade-cabinet':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.35),
                targetY: clampGrid(gy + 0.8),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: false,
                sitOffsetY: 0,
                activityType: 'playing-game',
                badge: '🕹️ 오락실 아케이드 신기록 도전 중',
                dwellMs: 8000,
                priority: 6,
            };
        case 'prop-cheese-cat':
        case 'prop-corgi-dog':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.65),
                targetY: clampGrid(gy + 0.5),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: true,
                sitOffsetY: 5,
                activityType: 'petting-animal',
                badge: '🐾 귀여운 반려동물 쓰다듬는 중',
                dwellMs: 8200,
                priority: 4,
            };
        case 'furn-floor-lamp':
        case 'prop-moon-lamp':
            return {
                id: `wp-${item.instanceId}`,
                targetX: clampGrid(gx + 0.85),
                targetY: clampGrid(gy + 0.2),
                lookAtX: gx,
                lookAtY: gy,
                isSitting: false,
                sitOffsetY: 0,
                activityType: 'admiring-lamp',
                badge: '✨ 은은한 무드등 불빛 감상 중',
                dwellMs: 7000,
                priority: 7,
            };
        default:
            return null;
    }
}

export function useAvatarLifeSim(params: {
    layout: MinihomeRoomLayout;
    isEditMode: boolean;
    activeZone?: 'indoor' | 'garden' | 'kitchen' | 'camp';
    forcedGardenAction?: ForcedGardenActionTrigger | null;
}): AvatarLifeSimState {
    const { layout, isEditMode, activeZone = 'indoor', forcedGardenAction = null } = params;

    const waypoints = useMemo<ActivityWaypoint[]>(() => {
        if (activeZone === 'garden') {
            const gardenState = ensureGardenState(layout.garden);
            const gardenList: ActivityWaypoint[] = [];

            for (const plot of gardenState.plots) {
                if (plot.isUnlocked === false) continue;
                const coord = getGardenPlotCoord(plot.plotIndex);
                const cropMeta = getGardenCropById(plot.cropId);
                if (cropMeta) {
                    const isReady = plot.stage === 3;
                    const badgeText = isReady
                        ? `✨ 다 자란 ${cropMeta.shortName} 수확 준비!`
                        : `💧 ${cropMeta.shortName} 밭에 정성껏 물 주는 중`;
                    const stand = getGardenStandTarget(coord);
                    gardenList.push({
                        id: `wp-garden-plot-${plot.plotIndex}`,
                        targetX: stand.targetX,
                        targetY: stand.targetY,
                        lookAtX: coord.gridX,
                        lookAtY: coord.gridY,
                        isSitting: false,
                        sitOffsetY: 0,
                        activityType: isReady ? 'harvest-ready' : 'watering',
                        badge: badgeText,
                        dwellMs: 8000,
                        priority: isReady ? 1 : 2,
                    });
                }
            }

            gardenList.push({
                id: 'wp-garden-bench',
                targetX: 0.9,
                targetY: 3.6,
                lookAtX: 3.0,
                lookAtY: 3.6,
                isSitting: true,
                sitOffsetY: 8,
                activityType: 'drinking-tea',
                badge: '🍵 마당 벤치에 앉아 시원한 차 마시는 중',
                dwellMs: 8500,
                priority: 3,
            });

            if (gardenList.length === 1) {
                // 작물이 아직 하나도 심어지지 않았을 때도 1번 텃밭에서 물조리개로 땅을 촉촉이 적시는 모션 제공
                const firstPlot = GARDEN_PLOT_COORDS[0];
                gardenList.unshift({
                    id: 'wp-garden-soil-care',
                    targetX: clampGrid(firstPlot.gridX - 0.72),
                    targetY: clampGrid(firstPlot.gridY + 0.25),
                    lookAtX: firstPlot.gridX,
                    lookAtY: firstPlot.gridY,
                    isSitting: false,
                    sitOffsetY: 0,
                    activityType: 'watering',
                    badge: '💧 텃밭 흙에 촉촉하게 물 주는 중',
                    dwellMs: 7800,
                    priority: 2,
                });
            }

            return gardenList;
        }

        const list: ActivityWaypoint[] = [];
        for (const item of layout.placedItems) {
            const wp = buildWaypointForItem(item);
            if (wp) list.push(wp);
        }
        list.sort((a, b) => a.priority - b.priority);

        // 창가 날씨 감상 스팟 (좌측 벽 창문 바로 앞)
        list.push({
            id: 'wp-window-view',
            targetX: 0.85,
            targetY: 2.35,
            lookAtX: 0,
            lookAtY: 2.35,
            isSitting: false,
            sitOffsetY: 0,
            activityType: 'looking-window',
            badge: '🪟 창밖 풍경과 날씨 감상 중',
            dwellMs: 8500,
            priority: 2,
        });

        // 만약 러그나 빈백이 없더라도 기본 차 마시기 스팟 제공
        const hasTeaSpot = list.some((w) => w.activityType === 'drinking-tea');
        if (!hasTeaSpot) {
            list.push({
                id: 'wp-home-tea',
                targetX: clampGrid(layout.minimiX),
                targetY: clampGrid(layout.minimiY),
                lookAtX: clampGrid(layout.minimiX) + 1,
                lookAtY: clampGrid(layout.minimiY) + 1,
                isSitting: false,
                sitOffsetY: 0,
                activityType: 'drinking-tea',
                badge: '☕ 향긋한 따뜻한 차 한 잔 마시는 중',
                dwellMs: 7800,
                priority: 8,
            });
        }

        return list;
    }, [activeZone, layout.garden, layout.placedItems, layout.minimiX, layout.minimiY]);

    const waypointsRef = useRef<ActivityWaypoint[]>(waypoints);
    waypointsRef.current = waypoints;

    const currentPosRef = useRef<{ x: number; y: number }>({
        x: layout.minimiX,
        y: layout.minimiY,
    });
    const initPosRef = useRef<{ x: number; y: number }>({
        x: layout.minimiX,
        y: layout.minimiY,
    });
    initPosRef.current = { x: layout.minimiX, y: layout.minimiY };

    const [simState, setSimState] = useState<AvatarLifeSimState>({
        animX: layout.minimiX,
        animY: layout.minimiY,
        facingLeft: false,
        bobOffsetY: 0,
        sitOffsetY: 0,
        tiltDeg: 0,
        isSitting: false,
        isWalking: false,
        activityType: 'idle',
        actionPhase: 0,
        activityBadge: null,
        actionCropEmoji: null,
    });

    const phaseRef = useRef<{
        mode: 'dwell' | 'walk';
        wpIndex: number;
        startX: number;
        startY: number;
        targetX: number;
        targetY: number;
        phaseStartTime: number;
        phaseDurationMs: number;
        overrideWp: ActivityWaypoint | null;
        isForcedRun: boolean;
    }>({
        mode: 'dwell',
        wpIndex: 0,
        startX: layout.minimiX,
        startY: layout.minimiY,
        targetX: layout.minimiX,
        targetY: layout.minimiY,
        phaseStartTime: 0,
        phaseDurationMs: 2200,
        overrideWp: null,
        isForcedRun: false,
    });

    useEffect(() => {
        const activeList = waypointsRef.current;
        if (isEditMode || activeZone === 'kitchen' || activeZone === 'camp' || activeList.length === 0) {
            setSimState({
                animX: initPosRef.current.x,
                animY: initPosRef.current.y,
                facingLeft: false,
                bobOffsetY: 0,
                sitOffsetY: 0,
                tiltDeg: 0,
                isSitting: false,
                isWalking: false,
                activityType: 'idle',
                actionPhase: 0,
                activityBadge: null,
                actionCropEmoji: null,
            });
            return;
        }

        let rafId = 0;
        const firstWp = activeList[0];
        const startPos = initPosRef.current;
        currentPosRef.current = { x: startPos.x, y: startPos.y };
        const initDist = Math.hypot(firstWp.targetX - startPos.x, firstWp.targetY - startPos.y);

        phaseRef.current = {
            mode: 'walk',
            wpIndex: 0,
            startX: startPos.x,
            startY: startPos.y,
            targetX: firstWp.targetX,
            targetY: firstWp.targetY,
            phaseStartTime: performance.now(),
            phaseDurationMs: Math.max(3800, Math.min(6800, (initDist / 0.55) * 1000)),
            overrideWp: null,
            isForcedRun: false,
        };

        const tick = (now: number) => {
            const p = phaseRef.current;
            const currentWaypoints = waypointsRef.current;
            const currentWp =
                p.overrideWp || currentWaypoints[p.wpIndex % Math.max(1, currentWaypoints.length)];
            if (!currentWp) {
                rafId = requestAnimationFrame(tick);
                return;
            }
            const elapsed = now - p.phaseStartTime;
            const elapsedSec = elapsed / 1000;

            if (p.mode === 'walk') {
                const rawProgress = Math.min(1, elapsed / Math.max(1, p.phaseDurationMs));
                const eased = rawProgress * rawProgress * (3 - 2 * rawProgress);
                const curX = p.startX + (p.targetX - p.startX) * eased;
                const curY = p.startY + (p.targetY - p.startY) * eased;
                currentPosRef.current = { x: curX, y: curY };

                const dxScreen = screenDeltaX(p.startX, p.startY, p.targetX, p.targetY);
                const facingLeft = dxScreen < -0.05;

                // 빠른 달리기 vs 산책 걸음 모션 구분
                const stepSin = p.isForcedRun
                    ? Math.sin(elapsedSec * Math.PI * 4.2)
                    : Math.sin(elapsedSec * Math.PI * 2.2);
                const bobOffsetY = p.isForcedRun ? -Math.abs(stepSin) * 5.8 : -Math.abs(stepSin) * 4.2;
                const tiltDeg = p.isForcedRun ? stepSin * 5.2 : stepSin * 3.8;

                setSimState({
                    animX: curX,
                    animY: curY,
                    facingLeft,
                    bobOffsetY,
                    sitOffsetY: 0,
                    tiltDeg,
                    isSitting: false,
                    isWalking: true,
                    activityType: 'walking',
                    actionPhase: elapsedSec,
                    activityBadge: null,
                    actionCropEmoji: null,
                });

                if (rawProgress >= 1) {
                    p.mode = 'dwell';
                    p.isForcedRun = false;
                    p.startX = p.targetX;
                    p.startY = p.targetY;
                    p.phaseStartTime = now;
                    p.phaseDurationMs = currentWp.dwellMs;
                }
            } else {
                currentPosRef.current = { x: currentWp.targetX, y: currentWp.targetY };
                const lookDx = screenDeltaX(
                    currentWp.targetX,
                    currentWp.targetY,
                    currentWp.lookAtX,
                    currentWp.lookAtY
                );
                const facingLeft = lookDx < -0.05;

                const motion = computeActivityMotion(currentWp.activityType, elapsedSec);

                setSimState({
                    animX: currentWp.targetX,
                    animY: currentWp.targetY,
                    facingLeft,
                    bobOffsetY: motion.bobOffsetY,
                    sitOffsetY: currentWp.sitOffsetY,
                    tiltDeg: motion.tiltDeg,
                    isSitting: currentWp.isSitting,
                    isWalking: false,
                    activityType: currentWp.activityType,
                    actionPhase: elapsedSec,
                    activityBadge: currentWp.badge,
                    actionCropEmoji: currentWp.cropEmoji ?? null,
                });

                if (elapsed >= p.phaseDurationMs) {
                    p.overrideWp = null;
                    p.isForcedRun = false;
                    const nextIdx = (p.wpIndex + 1) % Math.max(1, currentWaypoints.length);
                    const nextWp = currentWaypoints[nextIdx];
                    if (nextWp) {
                        const dist = Math.hypot(
                            nextWp.targetX - currentWp.targetX,
                            nextWp.targetY - currentWp.targetY
                        );
                        p.mode = 'walk';
                        p.wpIndex = nextIdx;
                        p.startX = currentWp.targetX;
                        p.startY = currentWp.targetY;
                        p.targetX = nextWp.targetX;
                        p.targetY = nextWp.targetY;
                        p.phaseStartTime = now;
                        p.phaseDurationMs = Math.max(3800, Math.min(6800, (dist / 0.55) * 1000));
                    }
                }
            }

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isEditMode, activeZone]);

    // 유저가 마당에서 물주기/파종/수확 클릭 시 현재 위치에서 빠르게 달려가 전용 모션을 1.8~2.0초 유지
    useEffect(() => {
        if (!forcedGardenAction || activeZone !== 'garden' || isEditMode) return;
        const coord = getGardenPlotCoord(forcedGardenAction.plotIndex);
        const { targetX, targetY } = getGardenStandTarget(coord);
        const fromX = currentPosRef.current.x;
        const fromY = currentPosRef.current.y;
        const dist = Math.hypot(targetX - fromX, targetY - fromY);
        const dwellMs = Math.max(1500, forcedGardenAction.durationMs ?? 1900);

        const overrideWp: ActivityWaypoint = {
            id: `forced-plot-${forcedGardenAction.plotIndex}`,
            targetX,
            targetY,
            lookAtX: coord.gridX,
            lookAtY: coord.gridY,
            isSitting: false,
            sitOffsetY: 0,
            activityType: forcedGardenAction.activityType,
            badge: forcedGardenAction.badge,
            cropEmoji: forcedGardenAction.cropEmoji ?? null,
            dwellMs,
            priority: 0,
        };

        if (dist < 0.22) {
            phaseRef.current = {
                mode: 'dwell',
                wpIndex: phaseRef.current.wpIndex,
                startX: targetX,
                startY: targetY,
                targetX,
                targetY,
                phaseStartTime: performance.now(),
                phaseDurationMs: dwellMs,
                overrideWp,
                isForcedRun: false,
            };
        } else {
            const runMs = Math.max(360, Math.min(580, Math.round(dist * 170 + 220)));
            phaseRef.current = {
                mode: 'walk',
                wpIndex: phaseRef.current.wpIndex,
                startX: fromX,
                startY: fromY,
                targetX,
                targetY,
                phaseStartTime: performance.now(),
                phaseDurationMs: runMs,
                overrideWp,
                isForcedRun: true,
            };
        }
    }, [forcedGardenAction, activeZone, isEditMode]);

    return simState;
}
