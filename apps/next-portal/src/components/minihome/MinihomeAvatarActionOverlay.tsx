'use client';

import React from 'react';
import { AvatarLifeSimState } from '@/hooks/useAvatarLifeSim';

interface MinihomeAvatarActionOverlayProps {
    simState: AvatarLifeSimState;
    isEditMode: boolean;
    isRainWeather?: boolean;
    isNightWeather?: boolean;
}

/**
 * 아바타가 행동(물주기, 차 마시기, 창밖 구경, 독서, 음악 감상, 게임, 반려동물 교감 등)을 수행할 때
 * 실제 손 소품과 실시간 60fps 파티클 애니메이션을 렌더링하는 SVG 오버레이 컴포넌트
 */
export const MinihomeAvatarActionOverlay: React.FC<MinihomeAvatarActionOverlayProps> = ({
    simState,
    isEditMode,
    isRainWeather = false,
    isNightWeather = false,
}) => {
    if (isEditMode) return null;

    const { activityType, actionPhase, facingLeft, sitOffsetY, bobOffsetY } = simState;
    const dir = facingLeft ? -1 : 1;
    const baseY = sitOffsetY + bobOffsetY;

    // 1. 걸어갈 때 발밑 스텝 퍼프(발걸음 리플) 애니메이션
    if (activityType === 'walking') {
        const puffPhase = (actionPhase * 2.2) % 1;
        const puffPhase2 = (actionPhase * 2.2 + 0.5) % 1;
        return (
            <g pointerEvents="none">
                <circle
                    cx={-dir * (6 + puffPhase * 10)}
                    cy={4 - Math.sin(puffPhase * Math.PI) * 4}
                    r={2.5 + puffPhase * 3}
                    fill="rgba(255, 255, 255, 0.65)"
                    opacity={Math.max(0, 1 - puffPhase)}
                />
                <circle
                    cx={-dir * (4 + puffPhase2 * 12)}
                    cy={6 - Math.sin(puffPhase2 * Math.PI) * 3}
                    r={2 + puffPhase2 * 2.5}
                    fill="rgba(226, 232, 240, 0.6)"
                    opacity={Math.max(0, 1 - puffPhase2)}
                />
            </g>
        );
    }

    // 2. 물주기 애니메이션 (실제 물조리개 기울임 + 쏟아지는 물방울 줄기 + 물보라 파동)
    if (activityType === 'watering') {
        const pourWave = (Math.sin(actionPhase * Math.PI * 1.4) + 1) * 0.5; // 0 ~ 1
        const canAngle = 18 + pourWave * 22; // 18도 ~ 40도 기울임

        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                {/* 아바타가 바라보는 방향 앞쪽 손에 들린 물조리개 */}
                <g transform={`scale(${dir}, 1) translate(18, -32)`}>
                    <g transform={`rotate(${canAngle})`}>
                        {/* 물조리개 손잡이 */}
                        <path
                            d="M-8,-6 C-15,-10 -15,4 -8,3"
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                        />
                        {/* 물조리개 본체 */}
                        <rect
                            x="-8"
                            y="-7"
                            width="16"
                            height="13"
                            rx="3.5"
                            fill="#38bdf8"
                            stroke="#0369a1"
                            strokeWidth="1.5"
                        />
                        <rect x="-5" y="-4" width="10" height="3" rx="1.5" fill="#bae6fd" opacity="0.7" />
                        {/* 물조리개 긴 주둥이(Spout) */}
                        <line
                            x1="7"
                            y1="-1"
                            x2="19"
                            y2="-7"
                            stroke="#0284c7"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        {/* 물조리개 노즐(해바라기 헤드) */}
                        <ellipse
                            cx="20"
                            cy="-7.5"
                            rx="2.5"
                            ry="4"
                            transform="rotate(-20 20 -7.5)"
                            fill="#fde047"
                            stroke="#ca8a04"
                            strokeWidth="1.2"
                        />
                    </g>

                    {/* 노즐 끝에서 포물선을 그리며 쏟아지는 실시간 물방울 줄기 6개 */}
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const dropProgress = (actionPhase * 2.4 + idx * 0.17) % 1;
                        const spread = (idx % 3) - 1; // -1, 0, 1 갈래
                        const startX = 21;
                        const startY = 3;
                        const dropX = startX + dropProgress * (16 + spread * 4);
                        const dropY = startY + dropProgress * dropProgress * 30 + dropProgress * 6;
                        const alpha = Math.sin(dropProgress * Math.PI);

                        return (
                            <g key={`water-drop-${idx}`} opacity={alpha}>
                                <ellipse
                                    cx={dropX}
                                    cy={dropY}
                                    rx="2.2"
                                    ry="3.4"
                                    transform={`rotate(-18 ${dropX} ${dropY})`}
                                    fill={idx % 2 === 0 ? '#38bdf8' : '#7dd3fc'}
                                />
                            </g>
                        );
                    })}

                    {/* 땅/화분에 물이 닿아 퍼지는 물보라 원형 파동(Splash Ripple) */}
                    {[0, 1].map((rIdx) => {
                        const ripplePhase = (actionPhase * 1.8 + rIdx * 0.5) % 1;
                        return (
                            <ellipse
                                key={`water-ripple-${rIdx}`}
                                cx={36}
                                cy={35}
                                rx={3 + ripplePhase * 11}
                                ry={1.5 + ripplePhase * 5.5}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.6"
                                opacity={Math.max(0, 1 - ripplePhase)}
                            />
                        );
                    })}

                    {/* 물을 먹고 생기 있게 떠오르는 초록 새싹 반짝임 */}
                    <g
                        transform={`translate(36, ${22 - ((actionPhase * 18) % 16)})`}
                        opacity={Math.sin(((actionPhase * 1.2) % 1) * Math.PI)}
                    >
                        <text x="0" y="0" fontSize="11" textAnchor="middle">
                            🌱
                        </text>
                    </g>
                </g>
            </g>
        );
    }

    // 3. 차/커피 마시기 애니메이션 (찻잔을 입가로 들어 홀짝임 + 모락모락 피어오르는 스팀 곡선)
    if (activityType === 'drinking-tea') {
        // 홀짝이는(Sip) 주기: 0 ~ 1
        const sipWave = Math.max(0, Math.sin(actionPhase * Math.PI * 0.9));
        const cupLiftY = -sipWave * 8; // 입가로 들어 올림
        const cupShiftX = 13 - sipWave * 4;
        const cupRotate = -sipWave * 24;

        const steamPhase1 = (actionPhase * 0.9) % 1;
        const steamPhase2 = (actionPhase * 0.9 + 0.5) % 1;

        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                <g transform={`scale(${dir}, 1) translate(${cupShiftX}, ${-34 + cupLiftY})`}>
                    {/* 찻잔 본체 & 받침 */}
                    <g transform={`rotate(${cupRotate})`}>
                        {/* 찻잔 받침(Saucer) */}
                        <ellipse cx="0" cy="5.5" rx="8.5" ry="2.6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
                        {/* 찻잔 손잡이 */}
                        <path
                            d="M-5,-2 C-9,-2 -9,3 -5,3"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.8"
                        />
                        {/* 따뜻한 머그컵/찻잔 바디 */}
                        <path
                            d="M-6,-4 L6,-4 L5,4.5 C5,5.5 -5,5.5 -5,4.5 Z"
                            fill="#ffffff"
                            stroke="#d97706"
                            strokeWidth="1.4"
                        />
                        {/* 찻잔 속 따뜻한 차/커피 수면 */}
                        <ellipse cx="0" cy="-4" rx="5.5" ry="1.8" fill="#b45309" />
                    </g>

                    {/* 찻잔 위로 모락모락 피어오르는 하얀 김(Steam) 곡선 2줄 */}
                    <path
                        d={`M-2,${-7 - steamPhase1 * 14} Q${-5 + Math.sin(actionPhase * 4) * 2},${-12 - steamPhase1 * 14} -1,${-17 - steamPhase1 * 14}`}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        opacity={Math.sin(steamPhase1 * Math.PI) * 0.85}
                    />
                    <path
                        d={`M3,${-6 - steamPhase2 * 14} Q${6 + Math.cos(actionPhase * 4) * 2},${-11 - steamPhase2 * 14} 2,${-16 - steamPhase2 * 14}`}
                        fill="none"
                        stroke="#fef3c7"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        opacity={Math.sin(steamPhase2 * Math.PI) * 0.8}
                    />
                </g>

                {/* 홀짝일 때 머리 옆에 떠오르는 기분 좋은 티타임 아이콘 */}
                {sipWave > 0.35 && (
                    <g
                        transform={`translate(${dir * 24}, ${-62 - sipWave * 6})`}
                        opacity={Math.min(1, (sipWave - 0.35) * 2)}
                    >
                        <text x="0" y="0" fontSize="12" textAnchor="middle">
                            ☕
                        </text>
                        <text x={dir * 10} y="-6" fontSize="9" textAnchor="middle">
                            ✨
                        </text>
                    </g>
                )}
            </g>
        );
    }

    // 4. 창밖 보기 애니메이션 (창문 방향 시선 + 실시간 날씨 연동 구름 생각풍선)
    if (activityType === 'looking-window') {
        const floatY = Math.sin(actionPhase * Math.PI * 1.1) * 3;
        const pulseScale = 1 + Math.sin(actionPhase * Math.PI * 1.6) * 0.06;

        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                {/* 창문 방향(좌상단)으로 향하는 반짝이는 시선 라인 */}
                <g opacity={0.55 + Math.sin(actionPhase * Math.PI * 2) * 0.3}>
                    <line
                        x1="-14"
                        y1="-50"
                        x2="-36"
                        y2="-68"
                        stroke="#fde047"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        strokeLinecap="round"
                    />
                    <circle cx="-38" cy="-70" r="2.2" fill="#fde047" />
                </g>

                {/* 아바타 머리 옆 창밖 풍경 감상 생각풍선(Thought Bubble) */}
                <g transform={`translate(28, ${-68 + floatY}) scale(${pulseScale})`}>
                    {/* 작은 연결 구름 방울 2개 */}
                    <circle cx="-16" cy="14" r="3" fill="rgba(255, 255, 255, 0.92)" stroke="#94a3b8" strokeWidth="1" />
                    <circle cx="-10" cy="8" r="4.5" fill="rgba(255, 255, 255, 0.95)" stroke="#94a3b8" strokeWidth="1" />

                    {/* 메인 구름 풍선 */}
                    <rect
                        x="-16"
                        y="-16"
                        width="36"
                        height="24"
                        rx="12"
                        fill="rgba(255, 255, 255, 0.96)"
                        stroke="#6366f1"
                        strokeWidth="1.4"
                    />

                    {/* 날씨에 따라 달라지는 창밖 감상 아이콘 애니메이션 */}
                    {isRainWeather ? (
                        <g transform="translate(2, -4)">
                            <text x="0" y="3" fontSize="13" textAnchor="middle">
                                🌧️
                            </text>
                        </g>
                    ) : isNightWeather ? (
                        <g transform="translate(2, -4)">
                            <text x="0" y="3" fontSize="13" textAnchor="middle">
                                🌙
                            </text>
                        </g>
                    ) : (
                        <g transform="translate(2, -4)">
                            <text x="0" y="3" fontSize="13" textAnchor="middle">
                                ☀️
                            </text>
                        </g>
                    )}
                </g>
            </g>
        );
    }

    // 5. 독서 애니메이션 (펼쳐진 책 + 넘어가는 책장 + 반짝이는 영감 💡)
    if (activityType === 'reading-book') {
        const pageFlip = Math.sin(actionPhase * Math.PI * 1.4);
        const ideaFloat = (actionPhase * 0.7) % 1;

        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                {/* 아바타 가슴 앞에 들고 있는 펼쳐진 책 */}
                <g transform={`translate(${dir * 12}, -33)`}>
                    {/* 책 표지 */}
                    <path
                        d="M-11,2 L0,5 L11,2 L11,-7 L0,-4 L-11,-7 Z"
                        fill="#4f46e5"
                        stroke="#312e81"
                        strokeWidth="1.2"
                    />
                    {/* 펼쳐진 양쪽 하얀 페이지 */}
                    <path
                        d="M-9.5,0.5 L0,3.5 L9.5,0.5 L9.5,-6 L0,-3 L-9.5,-6 Z"
                        fill="#ffffff"
                        stroke="#cbd5e1"
                        strokeWidth="0.9"
                    />
                    <line x1="0" y1="-3" x2="0" y2="3.5" stroke="#94a3b8" strokeWidth="1" />
                    {/* 팔랑이며 넘어가는 책장 애니메이션 */}
                    <path
                        d={`M0,-3 Q${pageFlip * 7},-8 ${pageFlip * 8},-1 L0,3.5`}
                        fill="#f8fafc"
                        stroke="#94a3b8"
                        strokeWidth="0.8"
                    />
                </g>

                {/* 머리 위로 떠오르는 독서 영감 아이콘 */}
                <g
                    transform={`translate(${dir * 20}, ${-58 - ideaFloat * 14})`}
                    opacity={Math.sin(ideaFloat * Math.PI)}
                >
                    <text x="0" y="0" fontSize="12" textAnchor="middle">
                        💡
                    </text>
                </g>
            </g>
        );
    }

    // 6. 음악 감상 애니메이션 (LP 턴테이블 리듬 스웨이 + 떠오르는 음표 파티클)
    if (activityType === 'listening-music') {
        const notes = ['🎵', '🎶', '🎵'];
        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                {notes.map((note, idx) => {
                    const p = (actionPhase * 0.65 + idx * 0.33) % 1;
                    const nx = dir * (14 + idx * 6) + Math.sin((actionPhase + idx) * 3) * 6;
                    const ny = -42 - p * 34;
                    return (
                        <g key={`music-note-${idx}`} transform={`translate(${nx}, ${ny})`} opacity={Math.sin(p * Math.PI)}>
                            <text x="0" y="0" fontSize={idx === 1 ? '13' : '11'} textAnchor="middle">
                                {note}
                            </text>
                        </g>
                    );
                })}
            </g>
        );
    }

    // 7. 책상 집중 타이핑 / 오락실·게이밍 애니메이션
    if (activityType === 'working-desk' || activityType === 'playing-game') {
        const isGame = activityType === 'playing-game';
        const icons = isGame ? ['🎮', '⚡', '🔥'] : ['💻', '⚡', '✨'];
        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                {/* 손 앞쪽 빠른 조작 스파크 */}
                <g transform={`translate(${dir * 15}, -32)`}>
                    <circle
                        cx={Math.sin(actionPhase * 12) * 4}
                        cy={Math.cos(actionPhase * 12) * 2}
                        r="2.5"
                        fill={isGame ? '#f43f5e' : '#38bdf8'}
                        opacity="0.85"
                    />
                    <circle
                        cx={Math.cos(actionPhase * 10) * 5}
                        cy={Math.sin(actionPhase * 10) * 2.5}
                        r="2"
                        fill="#fde047"
                        opacity="0.85"
                    />
                </g>
                {icons.map((ic, idx) => {
                    const p = (actionPhase * 0.75 + idx * 0.33) % 1;
                    const ix = dir * (16 + (idx - 1) * 8);
                    const iy = -46 - p * 26;
                    return (
                        <g key={`desk-fx-${idx}`} transform={`translate(${ix}, ${iy})`} opacity={Math.sin(p * Math.PI)}>
                            <text x="0" y="0" fontSize="11" textAnchor="middle">
                                {ic}
                            </text>
                        </g>
                    );
                })}
            </g>
        );
    }

    // 8. 반려동물 교감 애니메이션 (다정하게 쓰다듬는 손길 + 떠오르는 핑크 하트)
    if (activityType === 'petting-animal') {
        const hearts = ['💕', '❤️', '🐾'];
        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                {hearts.map((h, idx) => {
                    const p = (actionPhase * 0.65 + idx * 0.33) % 1;
                    const hx = dir * 18 + Math.sin((actionPhase + idx) * 2.5) * 5;
                    const hy = -38 - p * 32;
                    return (
                        <g key={`pet-heart-${idx}`} transform={`translate(${hx}, ${hy})`} opacity={Math.sin(p * Math.PI)}>
                            <text x="0" y="0" fontSize="12" textAnchor="middle">
                                {h}
                            </text>
                        </g>
                    );
                })}
            </g>
        );
    }

    // 9. 다 자란 작물 수확 기쁨 / 무드등 감상 애니메이션
    if (activityType === 'harvest-ready' || activityType === 'admiring-lamp') {
        const sparkles = activityType === 'harvest-ready' ? ['✨', '🧺', '🌟'] : ['✨', '🌙', '💫'];
        return (
            <g transform={`translate(0, ${baseY})`} pointerEvents="none">
                {sparkles.map((sp, idx) => {
                    const p = (actionPhase * 0.7 + idx * 0.33) % 1;
                    const sx = (idx - 1) * 16 + Math.sin((actionPhase + idx) * 3) * 4;
                    const sy = -45 - p * 28;
                    return (
                        <g key={`sparkle-${idx}`} transform={`translate(${sx}, ${sy})`} opacity={Math.sin(p * Math.PI)}>
                            <text x="0" y="0" fontSize="12" textAnchor="middle">
                                {sp}
                            </text>
                        </g>
                    );
                })}
            </g>
        );
    }

    return null;
};
