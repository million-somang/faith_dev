'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MinihomeRoomLayout, PlacedRoomItem } from '@/types/minihome.types';
import { ensureGardenState, getGardenCropById } from '@/data/minihomeCatalogData';

export const GARDEN_PLOT_COORDS: Array<{ plotIndex: number; gridX: number; gridY: number }> = [
    { plotIndex: 0, gridX: 2, gridY: 2 },
    { plotIndex: 1, gridX: 4, gridY: 2 },
    { plotIndex: 2, gridX: 6, gridY: 2 },
    { plotIndex: 3, gridX: 2, gridY: 5 },
    { plotIndex: 4, gridX: 4, gridY: 5 },
    { plotIndex: 5, gridX: 6, gridY: 5 },
];

export type AvatarActivityType =
    | 'walking'
    | 'idle'
    | 'watering'
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
    activityType: 'watering' | 'harvest-ready';
    badge: string;
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
    dwellMs: number;
    priority: number;
}

function clampGrid(v: number): number {
    return Math.max(0.4, Math.min(6.8, v));
}

function screenDeltaX(fromX: number, fromY: number, toX: number, toY: number): number {
    return (toX - toY) - (fromX - fromY);
}

function computeActivityMotion(
    activityType: AvatarActivityType,
    elapsedSec: number
): { bobOffsetY: number; tiltDeg: number } {
    switch (activityType) {
        case 'watering': {
            // 물조리개를 기울여 물을 주는 리드미컬한 상체 숙임 모션
            const pourCycle = (Math.sin(elapsedSec * Math.PI * 1.4) + 1) * 0.5; // 0 ~ 1
            return {
                bobOffsetY: pourCycle * 2.2,
                tiltDeg: 5 + pourCycle * 6.5, // 앞으로 5~11.5도 기울임
            };
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
    activeZone?: 'indoor' | 'garden';
    forcedGardenAction?: ForcedGardenActionTrigger | null;
}): AvatarLifeSimState {
    const { layout, isEditMode, activeZone = 'indoor', forcedGardenAction = null } = params;

    const waypoints = useMemo<ActivityWaypoint[]>(() => {
        if (activeZone === 'garden') {
            const gardenState = ensureGardenState(layout.garden);
            const gardenList: ActivityWaypoint[] = [];

            for (const plot of gardenState.plots) {
                const coord = GARDEN_PLOT_COORDS[plot.plotIndex] || GARDEN_PLOT_COORDS[0];
                const cropMeta = getGardenCropById(plot.cropId);
                if (cropMeta) {
                    const isReady = plot.stage === 3;
                    const badgeText = isReady
                        ? `✨ 다 자란 ${cropMeta.shortName} 수확 준비!`
                        : `💧 ${cropMeta.shortName} 밭에 정성껏 물 주는 중`;
                    gardenList.push({
                        id: `wp-garden-plot-${plot.plotIndex}`,
                        targetX: clampGrid(coord.gridX - 0.55),
                        targetY: clampGrid(coord.gridY + 0.55),
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
                    targetX: clampGrid(firstPlot.gridX - 0.55),
                    targetY: clampGrid(firstPlot.gridY + 0.55),
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
    });

    // 유저가 마당에서 물주기/파종/수확 클릭 시 아바타가 즉시 해당 이랑에서 액션 수행
    useEffect(() => {
        if (!forcedGardenAction || activeZone !== 'garden' || isEditMode) return;
        const coord = GARDEN_PLOT_COORDS[forcedGardenAction.plotIndex] || GARDEN_PLOT_COORDS[0];
        const targetX = clampGrid(coord.gridX - 0.55);
        const targetY = clampGrid(coord.gridY + 0.55);

        phaseRef.current = {
            mode: 'dwell',
            wpIndex: 0,
            startX: targetX,
            startY: targetY,
            targetX,
            targetY,
            phaseStartTime: performance.now(),
            phaseDurationMs: 5500,
            overrideWp: {
                id: `forced-plot-${forcedGardenAction.plotIndex}`,
                targetX,
                targetY,
                lookAtX: coord.gridX,
                lookAtY: coord.gridY,
                isSitting: false,
                sitOffsetY: 0,
                activityType: forcedGardenAction.activityType,
                badge: forcedGardenAction.badge,
                dwellMs: 5500,
                priority: 0,
            },
        };
    }, [forcedGardenAction, activeZone, isEditMode]);

    useEffect(() => {
        if (isEditMode || waypoints.length === 0) {
            setSimState({
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
            });
            return;
        }

        let rafId = 0;
        const firstWp = waypoints[0];
        const initDist = Math.hypot(firstWp.targetX - layout.minimiX, firstWp.targetY - layout.minimiY);

        phaseRef.current = {
            mode: 'walk',
            wpIndex: 0,
            startX: layout.minimiX,
            startY: layout.minimiY,
            targetX: firstWp.targetX,
            targetY: firstWp.targetY,
            phaseStartTime: performance.now(),
            phaseDurationMs: Math.max(3800, Math.min(6800, (initDist / 0.55) * 1000)),
            overrideWp: null,
        };

        const tick = (now: number) => {
            const p = phaseRef.current;
            const currentWp = p.overrideWp || waypoints[p.wpIndex % waypoints.length];
            const elapsed = now - p.phaseStartTime;
            const elapsedSec = elapsed / 1000;

            if (p.mode === 'walk') {
                const rawProgress = Math.min(1, elapsed / p.phaseDurationMs);
                const eased = rawProgress * rawProgress * (3 - 2 * rawProgress);
                const curX = p.startX + (p.targetX - p.startX) * eased;
                const curY = p.startY + (p.targetY - p.startY) * eased;

                const dxScreen = screenDeltaX(p.startX, p.startY, p.targetX, p.targetY);
                const facingLeft = dxScreen < -0.05;

                // 또박또박 걷는 발걸음 바운스 + 귀여운 좌우 스윙 각도
                const stepSin = Math.sin(elapsedSec * Math.PI * 2.2);
                const bobOffsetY = -Math.abs(stepSin) * 4.2;
                const tiltDeg = stepSin * 3.8;

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
                });

                if (rawProgress >= 1) {
                    p.mode = 'dwell';
                    p.startX = p.targetX;
                    p.startY = p.targetY;
                    p.phaseStartTime = now;
                    p.phaseDurationMs = currentWp.dwellMs;
                }
            } else {
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
                });

                if (elapsed >= p.phaseDurationMs) {
                    p.overrideWp = null;
                    const nextIdx = (p.wpIndex + 1) % waypoints.length;
                    const nextWp = waypoints[nextIdx];
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

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isEditMode, waypoints, layout.minimiX, layout.minimiY]);

    return simState;
}
