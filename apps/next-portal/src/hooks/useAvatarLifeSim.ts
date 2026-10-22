'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MinihomeRoomLayout, PlacedRoomItem } from '@/types/minihome.types';

export interface AvatarLifeSimState {
    animX: number;
    animY: number;
    facingLeft: boolean;
    bobOffsetY: number;
    sitOffsetY: number;
    isSitting: boolean;
    isWalking: boolean;
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
                badge: '💻 책상에 앉아 집중 중',
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
                badge: '🎧 책상에 앉아 게임 중',
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
                badge: '🌱 반려식물 살펴보는 중',
                dwellMs: 8000,
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
                badge: '📖 책장에서 책 고르는 중',
                dwellMs: 7800,
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
                badge: '☕ 러그에 앉아 티타임',
                dwellMs: 8200,
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
                badge: '🛋️ 빈백에 앉아 휴식 중',
                dwellMs: 8500,
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
                badge: '🎵 LP 음악 감상 중',
                dwellMs: 7800,
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
                badge: '🕹️ 오락실 게임 플레이',
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
                badge: '🐾 반려동물과 교감 중',
                dwellMs: 8000,
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
                badge: '✨ 은은한 무드등 감상',
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
}): AvatarLifeSimState {
    const { layout, isEditMode } = params;

    const waypoints = useMemo<ActivityWaypoint[]>(() => {
        const list: ActivityWaypoint[] = [];
        for (const item of layout.placedItems) {
            const wp = buildWaypointForItem(item);
            if (wp) list.push(wp);
        }
        list.sort((a, b) => a.priority - b.priority);

        // 창가 날씨 감상 스팟 및 기본 아지트 산책 스팟 추가
        list.push({
            id: 'wp-window-view',
            targetX: 0.9,
            targetY: 2.3,
            lookAtX: 0,
            lookAtY: 2.3,
            isSitting: false,
            sitOffsetY: 0,
            badge: '🪟 창밖 날씨 구경 중',
            dwellMs: 7500,
            priority: 8,
        });

        list.push({
            id: 'wp-home-base',
            targetX: clampGrid(layout.minimiX),
            targetY: clampGrid(layout.minimiY),
            lookAtX: clampGrid(layout.minimiX) + 1,
            lookAtY: clampGrid(layout.minimiY) + 1,
            isSitting: false,
            sitOffsetY: 0,
            badge: '🏠 내 아지트 산책 중',
            dwellMs: 6200,
            priority: 9,
        });

        return list;
    }, [layout.placedItems, layout.minimiX, layout.minimiY]);

    const [simState, setSimState] = useState<AvatarLifeSimState>({
        animX: layout.minimiX,
        animY: layout.minimiY,
        facingLeft: false,
        bobOffsetY: 0,
        sitOffsetY: 0,
        isSitting: false,
        isWalking: false,
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
    }>({
        mode: 'dwell',
        wpIndex: 0,
        startX: layout.minimiX,
        startY: layout.minimiY,
        targetX: layout.minimiX,
        targetY: layout.minimiY,
        phaseStartTime: 0,
        phaseDurationMs: 2200,
    });

    useEffect(() => {
        if (isEditMode || waypoints.length === 0) {
            setSimState({
                animX: layout.minimiX,
                animY: layout.minimiY,
                facingLeft: false,
                bobOffsetY: 0,
                sitOffsetY: 0,
                isSitting: false,
                isWalking: false,
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
            // 천천히 걷는 속도 (최소 4.2초 ~ 최대 7.5초 동안 여유롭게 걸어감)
            phaseDurationMs: Math.max(4200, Math.min(7500, (initDist / 0.52) * 1000)),
        };

        const tick = (now: number) => {
            const p = phaseRef.current;
            const currentWp = waypoints[p.wpIndex % waypoints.length];
            const elapsed = now - p.phaseStartTime;

            if (p.mode === 'walk') {
                const rawProgress = Math.min(1, elapsed / p.phaseDurationMs);
                // 부드러운 Ease-In-Out 곡선
                const eased = rawProgress * rawProgress * (3 - 2 * rawProgress);
                const curX = p.startX + (p.targetX - p.startX) * eased;
                const curY = p.startY + (p.targetY - p.startY) * eased;

                const dxScreen = screenDeltaX(p.startX, p.startY, p.targetX, p.targetY);
                const facingLeft = dxScreen < -0.05;

                // 천천히 또박또박 걷는 발걸음 바운스 (초당 약 1.8보)
                const stepCycle = Math.abs(Math.sin((elapsed / 1000) * Math.PI * 1.8));
                const bobOffsetY = -stepCycle * 3.8;

                setSimState({
                    animX: curX,
                    animY: curY,
                    facingLeft,
                    bobOffsetY,
                    sitOffsetY: 0,
                    isSitting: false,
                    isWalking: true,
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
                // 가구 앞에서 머무르며 상호작용 (앉기 / 식물 관찰 / 책 고르기 등)
                const lookDx = screenDeltaX(
                    currentWp.targetX,
                    currentWp.targetY,
                    currentWp.lookAtX,
                    currentWp.lookAtY
                );
                const facingLeft = lookDx < -0.05;

                // 가만히 앉거나 서 있을 때 은은하게 숨쉬는 모션
                const breatheOffsetY = Math.sin((elapsed / 1000) * Math.PI * 0.85) * 1.4;

                setSimState({
                    animX: currentWp.targetX,
                    animY: currentWp.targetY,
                    facingLeft,
                    bobOffsetY: breatheOffsetY,
                    sitOffsetY: currentWp.sitOffsetY,
                    isSitting: currentWp.isSitting,
                    isWalking: false,
                    activityBadge: currentWp.badge,
                });

                if (elapsed >= p.phaseDurationMs) {
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
                    p.phaseDurationMs = Math.max(4200, Math.min(7500, (dist / 0.52) * 1000));
                }
            }

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isEditMode, waypoints, layout.minimiX, layout.minimiY]);

    return simState;
}
