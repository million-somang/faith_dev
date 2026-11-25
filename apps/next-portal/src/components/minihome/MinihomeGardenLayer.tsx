'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    GardenCropId,
    GardenPlotItem,
    MinihomeGardenState,
} from '@/types/minihome.types';
import {
    GARDEN_CROP_CATALOG,
    MAX_FERTILIZER_PER_CROP,
    MAX_SOIL_LEVEL,
    getGardenCropById,
    getGardenPlotWaterStatus,
} from '@/data/minihomeCatalogData';
import { getGardenPlotCoord } from '@/hooks/useAvatarLifeSim';
import type {
    AzitCropCatalogItem,
    AzitFertilizerCatalogItem,
    AzitFertilizerId,
    AzitSoilLevelCatalogItem,
    FarmerActionLog,
    OwnedFarmer,
} from '@/types/azit-game.types';
import {
    getFarmerGradeBadge,
    getFarmerRoleBadge,
    getFarmerVisualMeta,
} from '@/data/azitCharacterAssets';

interface GardenBackdropProps {
    floorTop: { x: number; y: number };
    floorLeft: { x: number; y: number };
    floorRight: { x: number; y: number };
    floorBottom: { x: number; y: number };
    wallH: number;
    floorThick: number;
    onEnterIndoor: () => void;
}

/**
 * 2.5D 아이소메트릭 앞마당 외벽(좌측 아지트 집 테라스 & 출입문) + 우측 원목 정원 울타리 + 잔디 마당 베이스
 */
export const GardenCourtyardBackdrop: React.FC<GardenBackdropProps> = ({
    floorTop,
    floorLeft,
    floorRight,
    floorBottom,
    wallH,
    floorThick,
    onEnterIndoor,
}) => {
    const houseWallH = Math.round(wallH * 0.86);
    const fenceH = 54;

    return (
        <g>
            {/* 1. 마당 잔디 바닥 좌/우 측면 두께 (흙 + 잔디 단면) */}
            <polygon
                points={`${floorLeft.x},${floorLeft.y} ${floorBottom.x},${floorBottom.y} ${floorBottom.x},${floorBottom.y + floorThick} ${floorLeft.x},${floorLeft.y + floorThick}`}
                fill="#15803d"
            />
            <polygon
                points={`${floorBottom.x},${floorBottom.y} ${floorRight.x},${floorRight.y} ${floorRight.x},${floorRight.y + floorThick} ${floorBottom.x},${floorBottom.y + floorThick}`}
                fill="#166534"
            />
            {/* 메인 푸른 잔디 마당 바닥면 */}
            <polygon
                points={`${floorTop.x},${floorTop.y} ${floorRight.x},${floorRight.y} ${floorBottom.x},${floorBottom.y} ${floorLeft.x},${floorLeft.y}`}
                fill="#4ade80"
                stroke="#22c55e"
                strokeWidth="2"
            />

            {/* 2. 좌측 뒤편: 아지트 집 외벽 & 따뜻한 원목 테라스 포치 */}
            <polygon
                points={`${floorLeft.x - 12},${floorLeft.y - houseWallH - 6} ${floorLeft.x},${floorLeft.y - houseWallH} ${floorLeft.x},${floorLeft.y + floorThick} ${floorLeft.x - 12},${floorLeft.y + floorThick - 6}`}
                fill="#d6ccc2"
            />
            <polygon
                points={`${floorLeft.x},${floorLeft.y - houseWallH} ${floorTop.x},${floorTop.y - houseWallH} ${floorTop.x},${floorTop.y} ${floorLeft.x},${floorLeft.y}`}
                fill="#fefae0"
                stroke="#d4a373"
                strokeWidth="1.5"
            />
            {/* 집 처마 지붕 (아이소메트릭 어닝/지붕 처마) */}
            <polygon
                points={`${floorLeft.x - 10},${floorLeft.y - houseWallH + 6} ${floorTop.x},${floorTop.y - houseWallH + 6} ${floorTop.x + 14},${floorTop.y - houseWallH + 22} ${floorLeft.x + 4},${floorLeft.y - houseWallH + 22}`}
                fill="#b45309"
                stroke="#78350f"
                strokeWidth="1.5"
            />
            <polygon
                points={`${floorLeft.x - 12},${floorLeft.y - houseWallH - 8} ${floorTop.x},${floorTop.y - houseWallH - 12} ${floorTop.x},${floorTop.y - houseWallH + 6} ${floorLeft.x - 10},${floorLeft.y - houseWallH + 6}`}
                fill="#d97706"
                stroke="#92400e"
                strokeWidth="1.2"
            />

            {/* 집 외벽 하단 원목 데크 몰딩 */}
            <polygon
                points={`${floorLeft.x},${floorLeft.y - 16} ${floorTop.x},${floorTop.y - 16} ${floorTop.x},${floorTop.y} ${floorLeft.x},${floorLeft.y}`}
                fill="#9c6644"
            />

            {/* 집 안으로 들어가는 테라스 유리문 (클릭 시 실내 아지트로 이동) */}
            <g
                transform="translate(278, 224)"
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onEnterIndoor();
                }}
            >
                <polygon
                    points="-34,17 34,-17 34,-108 -34,-74"
                    fill="#78350f"
                    stroke="#451a03"
                    strokeWidth="2"
                />
                <polygon
                    points="-28,12 28,-16 28,-100 -28,-72"
                    fill="#bae6fd"
                    stroke="#fde68a"
                    strokeWidth="1.5"
                />
                {/* 창살 및 문 손잡이 */}
                <line x1="0" y1="-2" x2="0" y2="-86" stroke="#78350f" strokeWidth="2.5" />
                <line x1="-28" y1="-30" x2="28" y2="-58" stroke="#78350f" strokeWidth="2" />
                <circle cx="8" cy="-42" r="3" fill="#fbbf24" />
                {/* '🏠 집 안으로' 안내 뱃지 */}
                <g transform="translate(0, -116)">
                    <rect
                        x="-42"
                        y="-12"
                        width="84"
                        height="18"
                        rx="9"
                        fill="rgba(30, 27, 75, 0.85)"
                        stroke="#a5b4fc"
                        strokeWidth="1"
                    />
                    <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="800"
                    >
                        🏠 실내로 입장
                    </text>
                </g>
            </g>

            {/* 3. 우측 뒤편: 탁 트인 야외 원목 정원 울타리(Picket Fence) & 꽃덤불 */}
            {/* 울타리 가로 레일 2줄 */}
            <line
                x1={floorTop.x}
                y1={floorTop.y - fenceH + 14}
                x2={floorRight.x}
                y2={floorRight.y - fenceH + 14}
                stroke="#b45309"
                strokeWidth="5"
                strokeLinecap="round"
            />
            <line
                x1={floorTop.x}
                y1={floorTop.y - 16}
                x2={floorRight.x}
                y2={floorRight.y - 16}
                stroke="#92400e"
                strokeWidth="5"
                strokeLinecap="round"
            />
            {/* 울타리 세로 기둥들 */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                const px = floorTop.x + (step / 8) * (floorRight.x - floorTop.x);
                const py = floorTop.y + (step / 8) * (floorRight.y - floorTop.y);
                return (
                    <g key={`fence-post-${step}`}>
                        <polygon
                            points={`${px - 5},${py} ${px + 5},${py} ${px + 5},${py - fenceH} ${px},${py - fenceH - 8} ${px - 5},${py - fenceH}`}
                            fill="#fef3c7"
                            stroke="#b45309"
                            strokeWidth="1.5"
                        />
                    </g>
                );
            })}

            {/* 우측 울타리 끝 빨간 우체통 & 정원 물조리개 */}
            <g transform={`translate(${floorRight.x - 24}, ${floorRight.y - 10})`}>
                {/* 우체통 기둥 */}
                <rect x="-3" y="-44" width="6" height="44" fill="#78350f" />
                {/* 빨간 우체통 본체 */}
                <rect x="-16" y="-64" width="32" height="22" rx="8" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                <rect x="-10" y="-56" width="14" height="5" rx="2" fill="#fee2e2" />
                <line x1="12" y1="-56" x2="12" y2="-72" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="-72" r="3.5" fill="#facc15" />
            </g>
        </g>
    );
};

/**
 * 마당 좌측 정원 원목 벤치 & 파란 물조리개 오브제
 */
export const GardenBenchAndWateringCan: React.FC<{ pos: { x: number; y: number } }> = ({ pos }) => {
    return (
        <g transform={`translate(${pos.x}, ${pos.y})`}>
            {/* 벤치 바닥 그림자 */}
            <ellipse cx="0" cy="8" rx="34" ry="15" fill="rgba(15, 23, 42, 0.2)" />
            {/* 원목 벤치 다리 */}
            <rect x="-24" y="-8" width="5" height="14" rx="2" fill="#78350f" />
            <rect x="18" y="-8" width="5" height="14" rx="2" fill="#78350f" />
            {/* 벤치 좌판 */}
            <polygon
                points="-30,-6 24,-18 32,-10 -22,2"
                fill="#d97706"
                stroke="#92400e"
                strokeWidth="1.5"
            />
            {/* 벤치 등받이 */}
            <polygon
                points="-30,-24 24,-36 24,-22 -30,-10"
                fill="#f59e0b"
                stroke="#92400e"
                strokeWidth="1.5"
            />
            {/* 옆에 놓인 하늘색 물조리개 */}
            <g transform="translate(34, 6)">
                <ellipse cx="0" cy="4" rx="12" ry="6" fill="rgba(15, 23, 42, 0.18)" />
                <rect x="-9" y="-12" width="18" height="14" rx="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
                <path d="M-9,-10 C-16,-14 -16,-2 -9,-3" fill="none" stroke="#0284c7" strokeWidth="2" />
                <line x1="9" y1="-6" x2="18" y2="-14" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="19" cy="-15" rx="3.5" ry="2" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
            </g>
        </g>
    );
};

/**
 * 6종 작물(당근·고추·방울토마토·청상추·딸기·햇감자)의 1~3단계 2.5D 아이소메트릭 그래픽 렌더러
 * - Stage 1 (새싹): 작고 낮은 연두빛 여린 떡잎 (높이 ~7px)
 * - Stage 2 (성장·개화): 중간 크기 초록 줄기·잎 + 꽃봉오리 (열매·구근 색상 일체 없음, 높이 ~15px)
 * - Stage 3 (완숙·수확 가능!): 1.6배 이상 풍성한 수관 + 큼직하고 선명한 열매·구근 대량 돌출 + 황금 반짝임
 */
function renderCropStageGraphic(cropId: GardenCropId | null, stage: 0 | 1 | 2 | 3) {
    if (!cropId || stage === 0) {
        // 빈 텃밭: 고운 흙 이랑 결만 표시
        return (
            <g>
                <line x1="-18" y1="-2" x2="14" y2="-14" stroke="#78350f" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
                <line x1="-12" y1="5" x2="20" y2="-7" stroke="#78350f" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
            </g>
        );
    }

    // Stage 1: 흙에서 막 고개를 내민 작고 여린 떡잎 3포기 (높이 낮음, 열매/꽃 전혀 없음)
    if (stage === 1) {
        const positions = [
            { x: -13, y: 2 },
            { x: 0, y: -4 },
            { x: 13, y: 0 },
        ];
        switch (cropId) {
            case 'crop-blueberry':
                return (
                    <g>
                        {positions.map((p, idx) => (
                            <g key={`bb-s1-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="2" rx="4.5" ry="2.2" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-6" stroke="#78350f" strokeWidth="1.7" strokeLinecap="round" />
                                <ellipse cx="-3" cy="-5" rx="3" ry="1.8" transform="rotate(-24 -3 -5)" fill="#15803d" />
                                <ellipse cx="3" cy="-6" rx="3" ry="1.8" transform="rotate(24 3 -6)" fill="#22c55e" />
                            </g>
                        ))}
                    </g>
                );
            case 'crop-pumpkin':
                return (
                    <g>
                        {positions.map((p, idx) => (
                            <g key={`pumpkin-s1-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="2" rx="5" ry="2.4" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-4.5" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
                                <ellipse cx="-3.8" cy="-5.5" rx="4" ry="2.2" transform="rotate(-18 -3.8 -5.5)" fill="#84cc16" stroke="#3f6212" strokeWidth="0.7" />
                                <ellipse cx="3.8" cy="-5.5" rx="4" ry="2.2" transform="rotate(18 3.8 -5.5)" fill="#a3e635" stroke="#3f6212" strokeWidth="0.7" />
                            </g>
                        ))}
                    </g>
                );
            case 'crop-melon':
                return (
                    <g>
                        {positions.map((p, idx) => (
                            <g key={`melon-s1-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="2" rx="4.8" ry="2.2" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-5" stroke="#4d7c0f" strokeWidth="1.8" strokeLinecap="round" />
                                <circle cx="-2.8" cy="-5.5" r="2.6" fill="#bef264" stroke="#4d7c0f" strokeWidth="0.7" />
                                <circle cx="2.8" cy="-5.5" r="2.6" fill="#a3e635" stroke="#4d7c0f" strokeWidth="0.7" />
                            </g>
                        ))}
                    </g>
                );
            case 'crop-ginseng':
                return (
                    <g>
                        {positions.map((p, idx) => (
                            <g key={`ginseng-s1-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="2" rx="4.5" ry="2.2" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-6.5" stroke="#047857" strokeWidth="1.6" strokeLinecap="round" />
                                <ellipse cx="-3.2" cy="-6" rx="2.8" ry="1.4" transform="rotate(-30 -3.2 -6)" fill="#34d399" />
                                <ellipse cx="0" cy="-7.8" rx="1.6" ry="2.8" fill="#10b981" />
                                <ellipse cx="3.2" cy="-6" rx="2.8" ry="1.4" transform="rotate(30 3.2 -6)" fill="#34d399" />
                            </g>
                        ))}
                    </g>
                );
            case 'crop-truffle':
                return (
                    <g>
                        {positions.map((p, idx) => (
                            <g key={`truffle-s1-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="2" rx="5.5" ry="2.6" fill="#292524" />
                                <circle cx="-2.5" cy="0" r="1.4" fill="#e7e5e4" opacity="0.85" />
                                <circle cx="2.5" cy="0.5" r="1.2" fill="#d6d3d1" opacity="0.85" />
                                <circle cx="0" cy="-1.5" r="1.5" fill="#f5f5f4" opacity="0.9" />
                            </g>
                        ))}
                    </g>
                );
            case 'crop-moonfruit':
                return (
                    <g>
                        {positions.map((p, idx) => (
                            <g key={`moon-s1-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="2" rx="4.8" ry="2.2" fill="#312e81" />
                                <line x1="0" y1="2" x2="0" y2="-6" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" />
                                <ellipse cx="-3" cy="-6" rx="3.2" ry="1.7" transform="rotate(-24 -3 -6)" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="0.7" />
                                <ellipse cx="3" cy="-6" rx="3.2" ry="1.7" transform="rotate(24 3 -6)" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="0.7" />
                                <circle cx="0" cy="-8.5" r="1.3" fill="#fef08a" />
                            </g>
                        ))}
                    </g>
                );
            default:
                return (
                    <g>
                        {positions.map((p, idx) => (
                            <g key={`sprout-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="2" rx="4.5" ry="2.2" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
                                <ellipse cx="-3" cy="-6" rx="3.5" ry="1.8" transform="rotate(-22 -3 -6)" fill="#86efac" stroke="#16a34a" strokeWidth="0.8" />
                                <ellipse cx="3" cy="-6" rx="3.5" ry="1.8" transform="rotate(22 3 -6)" fill="#4ade80" stroke="#16a34a" strokeWidth="0.8" />
                            </g>
                        ))}
                    </g>
                );
        }
    }

    const triPositions = [
        { x: -15, y: 2 },
        { x: 0, y: -5 },
        { x: 15, y: 0 },
    ];

    // Stage 2: 중간 크기 초록 줄기·잎 + 꽃봉오리 (열매/구근 색상 일체 배제하여 3단계와 확실히 구분!)
    if (stage === 2) {
        switch (cropId) {
            case 'crop-carrot':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`carrot-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6.5" ry="3" fill="#3b2212" />
                                {/* 중간 높이의 초록 당근 잎사귀만 자란 상태 (주황색 뿌리 노출 전혀 없음) */}
                                <path d="M0,1 C-5,-8 -8,-13 -3,-15 C-1,-11 0,-5 0,1 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.9" />
                                <path d="M0,1 C0,-10 3,-16 6,-14 C4,-9 1,-4 0,1 Z" fill="#4ade80" stroke="#15803d" strokeWidth="0.9" />
                                <path d="M0,1 C5,-7 9,-11 6,-13 C3,-9 1,-4 0,1 Z" fill="#16a34a" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-pepper':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`pepper-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6" ry="3" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-15" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
                                <ellipse cx="-5" cy="-10" rx="5" ry="2.8" transform="rotate(-18 -5 -10)" fill="#22c55e" stroke="#166534" strokeWidth="0.8" />
                                <ellipse cx="5" cy="-11" rx="5" ry="2.8" transform="rotate(18 5 -11)" fill="#4ade80" stroke="#166534" strokeWidth="0.8" />
                                <ellipse cx="0" cy="-16" rx="5.5" ry="3" fill="#16a34a" stroke="#14532d" strokeWidth="0.8" />
                                {/* 하얀 고추꽃 봉오리만 피어 있음 */}
                                <circle cx="-4" cy="-9" r="2.2" fill="#ffffff" stroke="#fde047" strokeWidth="0.9" />
                                <circle cx="4" cy="-10" r="2.2" fill="#ffffff" stroke="#fde047" strokeWidth="0.9" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-tomato':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`tomato-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6" ry="3" fill="#3b2212" />
                                <line x1="-1.5" y1="2" x2="-1.5" y2="-19" stroke="#92400e" strokeWidth="1.8" />
                                <circle cx="0" cy="-9" r="5.5" fill="#22c55e" />
                                <circle cx="-3" cy="-14" r="4.8" fill="#16a34a" />
                                <circle cx="3" cy="-13" r="4.8" fill="#4ade80" />
                                {/* 노란 토마토 꽃봉오리 */}
                                <circle cx="-3" cy="-11" r="2.1" fill="#fde047" stroke="#ca8a04" strokeWidth="0.7" />
                                <circle cx="3" cy="-13" r="2.1" fill="#facc15" stroke="#ca8a04" strokeWidth="0.7" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-lettuce':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`lettuce-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6.5" ry="3" fill="#3b2212" />
                                {/* 아직 결구되기 전의 아담한 연초록 잎 3장 */}
                                <circle cx="-3.5" cy="-2.5" r="4.5" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
                                <circle cx="3.5" cy="-2.5" r="4.5" fill="#4ade80" stroke="#15803d" strokeWidth="0.8" />
                                <circle cx="0" cy="-5.5" r="4.8" fill="#86efac" stroke="#16a34a" strokeWidth="0.8" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-strawberry':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`strawberry-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6.5" ry="3" fill="#3b2212" />
                                <ellipse cx="-4.5" cy="-4" rx="5" ry="3.2" fill="#16a34a" />
                                <ellipse cx="4.5" cy="-4" rx="5" ry="3.2" fill="#22c55e" />
                                <ellipse cx="0" cy="-7.5" rx="5.5" ry="3.2" fill="#4ade80" />
                                {/* 하얀 딸기 꽃 */}
                                <circle cx="-3.5" cy="-5" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.7" />
                                <circle cx="-3.5" cy="-5" r="1" fill="#facc15" />
                                <circle cx="4" cy="-5" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.7" />
                                <circle cx="4" cy="-5" r="1" fill="#facc15" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-blueberry':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`blueberry-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6.5" ry="3.2" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-13" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="-4" cy="-8" r="4.8" fill="#15803d" />
                                <circle cx="4" cy="-9" r="4.8" fill="#16a34a" />
                                <circle cx="0" cy="-13" r="5" fill="#22c55e" />
                                {/* 푸른 꽃봉오리 (성숙 열매 이전 단계) */}
                                <circle cx="-3.5" cy="-10" r="2" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="0.7" />
                                <circle cx="3.5" cy="-11" r="2" fill="#93c5fd" stroke="#3b82f6" strokeWidth="0.7" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-pumpkin':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`pumpkin-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="7" ry="3.4" fill="#3b2212" />
                                <path d="M-7,0 Q0,-8 8,-1" fill="none" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
                                <ellipse cx="-4.5" cy="-4.5" rx="5.2" ry="3.5" fill="#4d7c0f" stroke="#365314" strokeWidth="0.8" />
                                <ellipse cx="4.5" cy="-5" rx="5.2" ry="3.5" fill="#65a30d" stroke="#365314" strokeWidth="0.8" />
                                {/* 노란 호박꽃 */}
                                <circle cx="0" cy="-8" r="2.6" fill="#fde047" stroke="#eab308" strokeWidth="0.8" />
                                <circle cx="0" cy="-8" r="1" fill="#fb923c" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-melon':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`melon-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6.8" ry="3.2" fill="#3b2212" />
                                <path d="M-7,1 C-3,-7 3,-9 8,-2" fill="none" stroke="#84cc16" strokeWidth="1.9" strokeLinecap="round" />
                                <circle cx="-4" cy="-5" r="4.4" fill="#65a30d" />
                                <circle cx="4" cy="-6" r="4.4" fill="#84cc16" />
                                <circle cx="0" cy="-9.5" r="2.2" fill="#ecfccb" stroke="#84cc16" strokeWidth="0.8" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-ginseng':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`ginseng-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6.2" ry="3" fill="#3b2212" />
                                <line x1="0" y1="2" x2="0" y2="-15" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
                                <ellipse cx="-5.5" cy="-9" rx="4.5" ry="2.2" transform="rotate(-24 -5.5 -9)" fill="#10b981" stroke="#064e3b" strokeWidth="0.7" />
                                <ellipse cx="5.5" cy="-9" rx="4.5" ry="2.2" transform="rotate(24 5.5 -9)" fill="#34d399" stroke="#064e3b" strokeWidth="0.7" />
                                <ellipse cx="0" cy="-13" rx="2.4" ry="4.5" fill="#059669" stroke="#064e3b" strokeWidth="0.7" />
                                <circle cx="0" cy="-17" r="2" fill="#a7f3d0" stroke="#059669" strokeWidth="0.7" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-truffle':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`truffle-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="7.2" ry="3.6" fill="#292524" />
                                <ellipse cx="0" cy="0" rx="5.5" ry="2.8" fill="#44403c" />
                                <path d="M-5,1 Q-2,-4 1,0 Q4,-3 6,1" fill="none" stroke="#e7e5e4" strokeWidth="1.3" strokeLinecap="round" />
                                <circle cx="-2.5" cy="-2.5" r="1.8" fill="#f5f5f4" stroke="#a8a29e" strokeWidth="0.6" />
                                <circle cx="3" cy="-2" r="1.6" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="0.6" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-moonfruit':
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`moonfruit-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="6.5" ry="3.2" fill="#312e81" />
                                <line x1="0" y1="2" x2="0" y2="-15" stroke="#7c3aed" strokeWidth="2.1" strokeLinecap="round" />
                                <ellipse cx="-5" cy="-9" rx="4.6" ry="2.5" transform="rotate(-20 -5 -9)" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="0.8" />
                                <ellipse cx="5" cy="-10" rx="4.6" ry="2.5" transform="rotate(20 5 -10)" fill="#a78bfa" stroke="#5b21b6" strokeWidth="0.8" />
                                <circle cx="0" cy="-16" r="2.6" fill="#fef08a" stroke="#a78bfa" strokeWidth="0.9" />
                            </g>
                        ))}
                    </g>
                );

            case 'crop-potato':
            default:
                return (
                    <g>
                        {triPositions.map((p, idx) => (
                            <g key={`potato-s2-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                                <ellipse cx="0" cy="3" rx="7" ry="3.5" fill="#5c3a21" />
                                <circle cx="-3.5" cy="-6" r="4.8" fill="#15803d" />
                                <circle cx="3.5" cy="-6" r="4.8" fill="#16a34a" />
                                <circle cx="0" cy="-10" r="4.5" fill="#22c55e" />
                                {/* 연보라색 감자꽃 봉오리만 피어 있음 (감자 구근 노출 없음) */}
                                <circle cx="0" cy="-11.5" r="2.4" fill="#e9d5ff" stroke="#a855f7" strokeWidth="0.7" />
                                <circle cx="0" cy="-11.5" r="0.9" fill="#facc15" />
                            </g>
                        ))}
                    </g>
                );
        }
    }

    // Stage 3 (수확 가능 결실! — 이미지만 봐도 즉시 수확 가능함을 알 수 있도록 큼직한 열매/구근 대량 돌출 + 황금 반짝임)
    switch (cropId) {
        case 'crop-carrot':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`carrot-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="9" ry="4.5" fill="#3b2212" />
                            {/* 높고 무성하게 뻗은 당근 수관 */}
                            <path
                                d="M0,-10 C-9,-22 -14,-29 -6,-31 C-1,-24 0,-15 0,-10 Z"
                                fill="#16a34a"
                                stroke="#14532d"
                                strokeWidth="1"
                            />
                            <path
                                d="M0,-10 C0,-25 5,-33 10,-30 C7,-22 2,-14 0,-10 Z"
                                fill="#22c55e"
                                stroke="#14532d"
                                strokeWidth="1"
                            />
                            <path
                                d="M0,-10 C9,-21 15,-25 10,-28 C5,-22 1,-14 0,-10 Z"
                                fill="#4ade80"
                            />
                            {/* 흙 위로 쑥 솟아오른 큼직하고 선명한 주황색 당근 몸통 */}
                            <path
                                d="M-7,-10 Q0,-15 7,-10 L4.5,5 Q0,9 -4.5,5 Z"
                                fill="#f97316"
                                stroke="#9a3412"
                                strokeWidth="1.4"
                            />
                            {/* 당근 광택 및 가로 결 디테일 */}
                            <path d="M-4,-9 L-2,3" stroke="#ffedd5" strokeWidth="1.3" strokeLinecap="round" opacity="0.65" />
                            <line x1="-4" y1="-5" x2="3" y2="-5" stroke="#fed7aa" strokeWidth="1.3" strokeLinecap="round" />
                            <line x1="-3" y1="-1" x2="3.5" y2="-1" stroke="#fed7aa" strokeWidth="1.3" strokeLinecap="round" />
                            <line x1="-2" y1="2.5" x2="2" y2="2.5" stroke="#fed7aa" strokeWidth="1.2" strokeLinecap="round" />
                        </g>
                    ))}
                </g>
            );

        case 'crop-pepper':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`pepper-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="8.5" ry="4" fill="#3b2212" />
                            {/* 굵고 무성한 고추나무 */}
                            <line x1="0" y1="2" x2="0" y2="-27" stroke="#14532d" strokeWidth="3.2" strokeLinecap="round" />
                            <ellipse cx="-9" cy="-18" rx="9" ry="5" transform="rotate(-22 -9 -18)" fill="#15803d" stroke="#14532d" strokeWidth="1" />
                            <ellipse cx="9" cy="-20" rx="9" ry="5" transform="rotate(22 9 -20)" fill="#16a34a" stroke="#14532d" strokeWidth="1" />
                            <ellipse cx="0" cy="-28" rx="10" ry="5.5" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
                            {/* 크고 윤기 나는 새빨간 홍고추 주렁주렁 */}
                            <g>
                                <path
                                    d="M-6,-17 C-12,-10 -11,1 -4,3 C-1,-1 -2,-11 -6,-17 Z"
                                    fill="#ef4444"
                                    stroke="#7f1d1d"
                                    strokeWidth="1.2"
                                />
                                <path d="M-7,-12 C-8,-7 -7,-2 -5,0" stroke="#fecaca" strokeWidth="1.1" strokeLinecap="round" fill="none" />
                                <path
                                    d="M6,-18 C12,-11 11,0 4,2 C1,-2 2,-12 6,-18 Z"
                                    fill="#dc2626"
                                    stroke="#7f1d1d"
                                    strokeWidth="1.2"
                                />
                                <path d="M7,-13 C8,-8 7,-3 5,-1" stroke="#fecaca" strokeWidth="1.1" strokeLinecap="round" fill="none" />
                                <path
                                    d="M0,-23 C4,-15 3,-4 -2,-2 C-4,-6 -3,-17 0,-23 Z"
                                    fill="#f43f5e"
                                    stroke="#881337"
                                    strokeWidth="1.2"
                                />
                            </g>
                        </g>
                    ))}
                </g>
            );

        case 'crop-tomato':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`tomato-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="8.5" ry="4" fill="#3b2212" />
                            {/* 튼튼한 나무 지지대 */}
                            <line x1="-2" y1="2" x2="-2" y2="-31" stroke="#78350f" strokeWidth="2.4" />
                            {/* 풍성하게 우거진 토마토 덩굴 */}
                            <circle cx="0" cy="-14" r="10" fill="#15803d" />
                            <circle cx="-5" cy="-23" r="8.5" fill="#16a34a" />
                            <circle cx="5" cy="-22" r="8.5" fill="#22c55e" />
                            {/* 큼직하고 탐스러운 새빨간 완숙 방울토마토 다발 */}
                            <g>
                                <circle cx="-6" cy="-13" r="5.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.2" />
                                <circle cx="-7.5" cy="-14.5" r="1.5" fill="#ffe4e6" />
                                <path d="M-8,-18 L-6,-16 L-4,-18" stroke="#14532d" strokeWidth="1.2" fill="none" />

                                <circle cx="6" cy="-15" r="5.5" fill="#e11d48" stroke="#881337" strokeWidth="1.2" />
                                <circle cx="4.5" cy="-16.5" r="1.5" fill="#ffe4e6" />
                                <path d="M4,-20 L6,-18 L8,-20" stroke="#14532d" strokeWidth="1.2" fill="none" />

                                <circle cx="0" cy="-24" r="5.2" fill="#f43f5e" stroke="#881337" strokeWidth="1.2" />
                                <circle cx="-1.5" cy="-25.5" r="1.4" fill="#ffe4e6" />
                                <path d="M-2,-29 L0,-27 L2,-29" stroke="#14532d" strokeWidth="1.2" fill="none" />
                            </g>
                        </g>
                    ))}
                </g>
            );

        case 'crop-lettuce':
            return (
                <g>
                    {/* 3단계 상추: 텃밭 화단을 가득 채우는 초대형 프릴 결구 상추 풍성한 수확물 */}
                    {triPositions.map((p, idx) => (
                        <g key={`lettuce-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="11" ry="5.5" fill="#3b2212" />
                            {/* 바깥쪽 진초록 프릴 잎 */}
                            <circle cx="-7" cy="-5" r="9.5" fill="#15803d" stroke="#052e16" strokeWidth="1.2" />
                            <circle cx="7" cy="-5" r="9.5" fill="#16a34a" stroke="#052e16" strokeWidth="1.2" />
                            <circle cx="0" cy="-12" r="10" fill="#16a34a" stroke="#052e16" strokeWidth="1.2" />
                            {/* 중간층 연초록 풍성한 잎 */}
                            <circle cx="-4" cy="-8" r="7.5" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
                            <circle cx="4" cy="-8" r="7.5" fill="#4ade80" stroke="#14532d" strokeWidth="1" />
                            {/* 안쪽 아삭한 황금연두 속배추/상추 하트 */}
                            <circle cx="0" cy="-10" r="6.5" fill="#86efac" stroke="#15803d" strokeWidth="1" />
                            <circle cx="0" cy="-10" r="3.8" fill="#fef08a" opacity="0.9" />
                            {/* 잎맥 디테일 */}
                            <path d="M0,-4 L0,-13 M-3,-8 L0,-6 L3,-8" stroke="#ecfccb" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                        </g>
                    ))}
                </g>
            );

        case 'crop-strawberry':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`strawberry-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="9" ry="4.5" fill="#3b2212" />
                            {/* 풍성한 딸기 잎 덤불 */}
                            <ellipse cx="-7" cy="-8" rx="8.5" ry="5.5" fill="#15803d" stroke="#052e16" strokeWidth="1" />
                            <ellipse cx="7" cy="-8" rx="8.5" ry="5.5" fill="#16a34a" stroke="#052e16" strokeWidth="1" />
                            <ellipse cx="0" cy="-14" rx="9" ry="5.5" fill="#22c55e" stroke="#052e16" strokeWidth="1" />
                            {/* 큼직하고 새빨간 하트 모양 설향 딸기 2알씩 (총 6알) */}
                            <g>
                                <path
                                    d="M-10,-6 C-5,-12 1,-6 -4,3 C-7,6 -12,-1 -10,-6 Z"
                                    fill="#e11d48"
                                    stroke="#881337"
                                    strokeWidth="1.2"
                                />
                                <circle cx="-7" cy="-4" r="1" fill="#fde047" />
                                <circle cx="-5" cy="-2" r="1" fill="#fde047" />
                                <circle cx="-7" cy="0" r="1" fill="#fde047" />

                                <path
                                    d="M3,-7 C8,-13 14,-7 9,2 C6,5 1,-2 3,-7 Z"
                                    fill="#f43f5e"
                                    stroke="#881337"
                                    strokeWidth="1.2"
                                />
                                <circle cx="6" cy="-5" r="1" fill="#fde047" />
                                <circle cx="8" cy="-3" r="1" fill="#fde047" />
                                <circle cx="6" cy="-1" r="1" fill="#fde047" />
                            </g>
                        </g>
                    ))}
                </g>
            );

        case 'crop-blueberry':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`blueberry-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="9.5" ry="4.6" fill="#3b2212" />
                            {/* 짙푸른 블루베리 관목 덤불 */}
                            <circle cx="-6" cy="-11" r="8" fill="#14532d" stroke="#052e16" strokeWidth="1" />
                            <circle cx="6" cy="-11" r="8" fill="#15803d" stroke="#052e16" strokeWidth="1" />
                            <circle cx="0" cy="-18" r="9" fill="#16a34a" stroke="#052e16" strokeWidth="1" />
                            {/* 서리 빛 블루베리 송이 */}
                            <g>
                                <circle cx="-6" cy="-11" r="4.2" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1" />
                                <circle cx="-7.2" cy="-12.2" r="1.3" fill="#bfdbfe" />
                                <circle cx="5.5" cy="-12" r="4.3" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1" />
                                <circle cx="4.2" cy="-13.2" r="1.3" fill="#bfdbfe" />
                                <circle cx="0" cy="-20" r="4.5" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1" />
                                <circle cx="-1.3" cy="-21.4" r="1.4" fill="#dbeafe" />
                                <circle cx="-2.5" cy="-7.5" r="3.4" fill="#1e40af" stroke="#172554" strokeWidth="0.9" />
                                <circle cx="2.8" cy="-8" r="3.4" fill="#2563eb" stroke="#172554" strokeWidth="0.9" />
                            </g>
                        </g>
                    ))}
                </g>
            );

        case 'crop-pumpkin':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`pumpkin-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="10.5" ry="5" fill="#3b2212" />
                            {/* 넓은 호박 덩굴 잎 */}
                            <ellipse cx="-8" cy="-10" rx="8" ry="5" fill="#3f6212" stroke="#1a2e05" strokeWidth="1" />
                            <ellipse cx="8" cy="-10" rx="8" ry="5" fill="#4d7c0f" stroke="#1a2e05" strokeWidth="1" />
                            {/* 큼직한 리브드 황금 호박 2덩이 */}
                            <g transform="translate(-4.5, -2)">
                                <ellipse cx="0" cy="0" rx="8.5" ry="6.8" fill="#f59e0b" stroke="#92400e" strokeWidth="1.3" />
                                <ellipse cx="0" cy="0" rx="4.2" ry="6.6" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
                                <path d="M-1,-7 C-1,-11 3,-12 4,-9" fill="none" stroke="#3f6212" strokeWidth="2.2" strokeLinecap="round" />
                            </g>
                            <g transform="translate(6.5, 1)">
                                <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#d97706" stroke="#78350f" strokeWidth="1.2" />
                                <ellipse cx="0" cy="0" rx="3.4" ry="5.4" fill="#f59e0b" stroke="#92400e" strokeWidth="0.9" />
                                <path d="M0,-5.5 C0,-9 3,-9.5 3.5,-7" fill="none" stroke="#3f6212" strokeWidth="1.8" strokeLinecap="round" />
                            </g>
                        </g>
                    ))}
                </g>
            );

        case 'crop-melon':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`melon-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="10" ry="4.8" fill="#3b2212" />
                            <ellipse cx="-7" cy="-11" rx="7.5" ry="4.8" fill="#4d7c0f" stroke="#365314" strokeWidth="1" />
                            <ellipse cx="7" cy="-11" rx="7.5" ry="4.8" fill="#65a30d" stroke="#365314" strokeWidth="1" />
                            {/* 왕실 머스크멜론 (그물 무늬) */}
                            <g transform="translate(-4, -3)">
                                <circle cx="0" cy="0" r="7.5" fill="#a3e635" stroke="#3f6212" strokeWidth="1.3" />
                                <path d="M-5,-3 Q0,0 5,-3 M-5,3 Q0,0 5,3 M-3,-5 Q0,0 -3,5 M3,-5 Q0,0 3,5" fill="none" stroke="#ecfccb" strokeWidth="1" opacity="0.85" />
                                <path d="M0,-7.5 L0,-11 L3,-12" fill="none" stroke="#3f6212" strokeWidth="1.8" strokeLinecap="round" />
                            </g>
                            <g transform="translate(6.5, 1)">
                                <circle cx="0" cy="0" r="6" fill="#84cc16" stroke="#3f6212" strokeWidth="1.2" />
                                <path d="M-4,-2 L4,2 M-4,2 L4,-2" fill="none" stroke="#ecfccb" strokeWidth="0.9" opacity="0.8" />
                            </g>
                        </g>
                    ))}
                </g>
            );

        case 'crop-ginseng':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`ginseng-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="9" ry="4.5" fill="#3b2212" />
                            {/* 5엽 에메랄드 산삼 잎 */}
                            <line x1="0" y1="-2" x2="0" y2="-25" stroke="#065f46" strokeWidth="2.4" strokeLinecap="round" />
                            <ellipse cx="-9" cy="-16" rx="7" ry="3.2" transform="rotate(-24 -9 -16)" fill="#059669" stroke="#064e3b" strokeWidth="0.9" />
                            <ellipse cx="9" cy="-16" rx="7" ry="3.2" transform="rotate(24 9 -16)" fill="#10b981" stroke="#064e3b" strokeWidth="0.9" />
                            <ellipse cx="-6" cy="-22" rx="6" ry="2.8" transform="rotate(-12 -6 -22)" fill="#10b981" stroke="#064e3b" strokeWidth="0.9" />
                            <ellipse cx="6" cy="-22" rx="6" ry="2.8" transform="rotate(12 6 -22)" fill="#34d399" stroke="#064e3b" strokeWidth="0.9" />
                            {/* 붉은 산삼 열매 왕관 */}
                            <circle cx="0" cy="-27" r="3.4" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
                            <circle cx="-3.5" cy="-25" r="2.8" fill="#dc2626" stroke="#991b1b" strokeWidth="0.9" />
                            <circle cx="3.5" cy="-25" r="2.8" fill="#f87171" stroke="#991b1b" strokeWidth="0.9" />
                            {/* 황금빛 굵은 산삼 뿌리 */}
                            <path d="M-5,-4 Q0,-7 5,-4 L3,4 Q0,7 -3,4 Z" fill="#fde68a" stroke="#b45309" strokeWidth="1.2" />
                            <path d="M-3,3 L-5,6 M3,3 L5,6" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
                        </g>
                    ))}
                </g>
            );

        case 'crop-truffle':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`truffle-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="10" ry="5" fill="#1c1917" />
                            <ellipse cx="0" cy="1" rx="8" ry="3.8" fill="#3f6212" opacity="0.65" />
                            {/* 다면체 심연 블랙 트러플 */}
                            <g transform="translate(-5, -2)">
                                <polygon points="-6,2 -4,-6 3,-7 7,0 4,5 -3,5" fill="#292524" stroke="#0c0a09" strokeWidth="1.3" />
                                <polygon points="-3,-4 2,-5 4,-1 0,2" fill="#57534e" />
                            </g>
                            <g transform="translate(6, 0)">
                                <polygon points="-5,2 -3,-5 3,-5 6,1 3,4 -2,4" fill="#1c1917" stroke="#0c0a09" strokeWidth="1.2" />
                                <polygon points="-2,-3 2,-3 3,0 0,2" fill="#78716c" />
                            </g>
                            {/* 황금 아로마 입자 */}
                            <circle cx="-7" cy="-11" r="1.4" fill="#fde047" />
                            <circle cx="5" cy="-10" r="1.6" fill="#facc15" />
                            <circle cx="0" cy="-14" r="1.2" fill="#fef08a" />
                        </g>
                    ))}
                </g>
            );

        case 'crop-moonfruit':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`moonfruit-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="9.5" ry="4.6" fill="#312e81" />
                            {/* 수정 보라빛 신비 잎사귀 */}
                            <line x1="0" y1="2" x2="0" y2="-25" stroke="#6d28d9" strokeWidth="2.8" strokeLinecap="round" />
                            <ellipse cx="-8" cy="-13" rx="7.5" ry="4.2" transform="rotate(-22 -8 -13)" fill="#7c3aed" stroke="#4c1d95" strokeWidth="1" />
                            <ellipse cx="8" cy="-14" rx="7.5" ry="4.2" transform="rotate(22 8 -14)" fill="#8b5cf6" stroke="#4c1d95" strokeWidth="1" />
                            {/* 빛나는 달빛 구체 열매 & 초승달 링 */}
                            <circle cx="0" cy="-21" r="8.5" fill="rgba(167, 139, 250, 0.35)" />
                            <circle cx="0" cy="-21" r="6.2" fill="#fef08a" stroke="#7c3aed" strokeWidth="1.3" />
                            <path d="M-7,-17 A8,8 0 0,0 7,-17" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" />
                            <circle cx="-5.5" cy="-26" r="1.5" fill="#fef9c3" />
                            <circle cx="6" cy="-25" r="1.3" fill="#e9d5ff" />
                        </g>
                    ))}
                </g>
            );

        case 'crop-potato':
        default:
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`potato-s3-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="4" rx="10" ry="5" fill="#5c3a21" />
                            {/* 뒤쪽 무성한 감자 잎사귀 */}
                            <circle cx="-5" cy="-13" r="7.5" fill="#15803d" stroke="#052e16" strokeWidth="1" />
                            <circle cx="5" cy="-13" r="7.5" fill="#16a34a" stroke="#052e16" strokeWidth="1" />
                            <circle cx="0" cy="-19" r="7.5" fill="#22c55e" stroke="#052e16" strokeWidth="1" />
                            {/* 흙 위로 수북하게 쏟아져 나온 큼직한 황금 햇감자 더미 */}
                            <g>
                                <ellipse cx="-7" cy="0" rx="7" ry="5" transform="rotate(-12 -7 0)" fill="#f59e0b" stroke="#78350f" strokeWidth="1.3" />
                                <circle cx="-8" cy="-1" r="0.9" fill="#92400e" />
                                <circle cx="-5" cy="1" r="0.9" fill="#92400e" />

                                <ellipse cx="7" cy="1" rx="7.5" ry="5.2" transform="rotate(14 7 1)" fill="#fbbf24" stroke="#78350f" strokeWidth="1.3" />
                                <circle cx="6" cy="0" r="0.9" fill="#92400e" />
                                <circle cx="9" cy="2" r="0.9" fill="#92400e" />

                                <ellipse cx="0" cy="4" rx="7" ry="4.8" fill="#fde68a" stroke="#92400e" strokeWidth="1.3" />
                                <circle cx="-2" cy="3.5" r="0.9" fill="#92400e" />
                                <circle cx="2" cy="4.5" r="0.9" fill="#92400e" />
                            </g>
                        </g>
                    ))}
                </g>
            );
    }
}

const FALLBACK_FERTILIZERS: AzitFertilizerCatalogItem[] = [
    {
        fertilizerId: 'fert-basic',
        name: '일반 성장 비료',
        shortName: '일반 비료',
        emoji: '🧪',
        requiredAzitLevel: 1,
        price: 40,
        reductionMs: 4 * 60 * 60 * 1000,
        reductionHours: 4,
        description: '작물의 다음 물주기 대기 시간을 4시간 단축시킵니다.',
    },
    {
        fertilizerId: 'fert-rapid',
        name: '고농축 급속 비료',
        shortName: '급속 비료',
        emoji: '⚡',
        requiredAzitLevel: 1,
        price: 75,
        reductionMs: 8 * 60 * 60 * 1000,
        reductionHours: 8,
        description: '작물의 다음 물주기 대기 시간을 8시간 단축하여 즉시 물주기가 가능하게 합니다.',
    },
];

const FALLBACK_SOIL_LEVELS: AzitSoilLevelCatalogItem[] = [
    {
        level: 0,
        name: '기본 흙',
        upgradeCost: 0,
        requiredAzitLevel: 1,
        guaranteedBonusYield: 0,
        bonusChancePct: 0,
        description: '기본 상태의 텃밭 토양입니다.',
    },
    {
        level: 1,
        name: '비옥한 겉흙',
        upgradeCost: 80,
        requiredAzitLevel: 1,
        guaranteedBonusYield: 0,
        bonusChancePct: 25,
        description: '수확 시 25% 확률로 보너스 작물 +1개를 추가 획득합니다.',
    },
    {
        level: 2,
        name: '유기농 배양토',
        upgradeCost: 180,
        requiredAzitLevel: 5,
        guaranteedBonusYield: 1,
        bonusChancePct: 0,
        description: '수확 시 확정 보너스 작물 +1개를 추가로 획득합니다.',
    },
    {
        level: 3,
        name: '미네랄 황금토',
        upgradeCost: 350,
        requiredAzitLevel: 12,
        guaranteedBonusYield: 1,
        bonusChancePct: 35,
        description: '확정 보너스 +1개 및 35% 확률로 추가 보너스 +1개를 획득합니다.',
    },
    {
        level: 4,
        name: '정령의 축복토',
        upgradeCost: 620,
        requiredAzitLevel: 22,
        guaranteedBonusYield: 2,
        bonusChancePct: 25,
        description: '확정 보너스 +2개 및 25% 확률로 추가 보너스 +1개를 획득합니다.',
    },
    {
        level: 5,
        name: '전설의 에덴 토양',
        upgradeCost: 1000,
        requiredAzitLevel: 35,
        guaranteedBonusYield: 2,
        bonusChancePct: 60,
        description: '최고 등급 토양! 확정 보너스 +2개 및 60% 확률로 추가 보너스 +1개를 획득합니다.',
    },
];

const SOIL_FILL_BY_LEVEL = ['#6b4423', '#5c371d', '#4c2b14', '#3e220e', '#331c0a', '#291506'];

interface GardenPlotProps {
    plot: GardenPlotItem;
    pos: { x: number; y: number };
    isSelected: boolean;
    isBubbleOpen?: boolean;
    hideBadge?: boolean;
    onSelectPlot: (plotIndex: number) => void;
    nowMs?: number;
    azitLevel?: number;
}

/**
 * 개별 2.5D 아이소메트릭 텃밭 원목 화단 & 작물 렌더러
 */
export const GardenPlotIsoNode: React.FC<GardenPlotProps> = ({
    plot,
    pos,
    isSelected,
    isBubbleOpen = false,
    hideBadge = false,
    onSelectPlot,
    nowMs,
    azitLevel = 1,
}) => {
    const isUnlocked = plot.isUnlocked !== false;
    const unlockLevel = plot.unlockLevel ?? 1;
    const canUnlock = !isUnlocked && azitLevel >= unlockLevel;
    const soilLevel = Math.max(0, Math.min(MAX_SOIL_LEVEL, plot.soilLevel ?? 0));
    const fertilizerUsedCount = Math.max(0, plot.fertilizerUsedCount ?? 0);

    const cropMeta = isUnlocked ? getGardenCropById(plot.cropId) : undefined;
    const isReadyToHarvest = isUnlocked && plot.stage === 3 && Boolean(cropMeta);
    const waterStatus = getGardenPlotWaterStatus(plot, nowMs ?? Date.now());
    const needsWater = isUnlocked && Boolean(cropMeta && plot.stage > 0 && plot.stage < 3 && waterStatus.canWater);

    const baseSoilFill = needsWater
        ? '#7c4d25'
        : plot.waterCount > 0 && soilLevel === 0
          ? '#4a2c18'
          : SOIL_FILL_BY_LEVEL[soilLevel] ?? '#6b4423';

    return (
        <g
            transform={`translate(${pos.x}, ${pos.y})`}
            data-garden-plot={plot.plotIndex}
            className="cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onSelectPlot(plot.plotIndex);
            }}
        >
            {/* 해금 가능 잠금 텃밭 하이라이트 링 */}
            {!isUnlocked && canUnlock && (
                <ellipse
                    cx="0"
                    cy="3"
                    rx="45"
                    ry="23"
                    fill="rgba(245, 158, 11, 0.16)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                />
            )}

            {/* 3단계(수확 가능) 황금빛 후광 오라 */}
            {isReadyToHarvest && (
                <ellipse
                    cx="0"
                    cy="3"
                    rx="46"
                    ry="24"
                    fill="rgba(250, 204, 21, 0.22)"
                    stroke="#fbbf24"
                    strokeWidth="2.2"
                />
            )}

            {/* 8시간 경과 물주기 알림 하늘빛 후광 오라 */}
            {needsWater && (
                <ellipse
                    cx="0"
                    cy="3"
                    rx="45"
                    ry="23"
                    fill="rgba(56, 189, 248, 0.22)"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="5 2"
                />
            )}

            {/* 선택 하이라이트 링 */}
            {isSelected && (
                <ellipse
                    cx="0"
                    cy="2"
                    rx="50"
                    ry="26"
                    fill="rgba(245, 158, 11, 0.24)"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                />
            )}

            {!isUnlocked ? (
                <>
                    {/* 잠긴 텃밭 석재 테두리 */}
                    <polygon
                        points="-38,0 0,19 0,27 -38,8"
                        fill="#475569"
                        stroke="#334155"
                        strokeWidth="1"
                    />
                    <polygon
                        points="0,19 38,0 38,8 0,27"
                        fill="#334155"
                        stroke="#1e293b"
                        strokeWidth="1"
                    />
                    <polygon
                        points="0,-19 38,0 0,19 -38,0"
                        fill={canUnlock ? '#64748b' : '#475569'}
                        stroke={canUnlock ? '#fcd34d' : '#94a3b8'}
                        strokeWidth="1.5"
                        strokeDasharray={canUnlock ? '4 2' : undefined}
                    />
                    <polygon
                        points="0,-15 31,0 0,15 -31,0"
                        fill="#1e293b"
                        stroke="#64748b"
                        strokeWidth="1"
                        opacity="0.85"
                    />
                    {/* 자물쇠 SVG 엠블럼 */}
                    <g transform="translate(0, -1)">
                        <path
                            d={canUnlock ? 'M-4,-6 V-9 A4,4 0 0,1 4,-9' : 'M-4,-4 V-8 A4,4 0 0,1 4,-8 V-4'}
                            fill="none"
                            stroke={canUnlock ? '#fbbf24' : '#cbd5e1'}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <rect
                            x="-6"
                            y="-4"
                            width="12"
                            height="9"
                            rx="2"
                            fill={canUnlock ? '#f59e0b' : '#64748b'}
                            stroke="#0f172a"
                            strokeWidth="1"
                        />
                        <circle cx="0" cy="0.5" r="1.4" fill="#0f172a" />
                    </g>
                </>
            ) : (
                <>
                    {/* 텃밭 원목 테두리 프레임 (아이소메트릭 입체 화단) */}
                    <polygon
                        points="-38,0 0,19 0,27 -38,8"
                        fill="#92400e"
                        stroke="#78350f"
                        strokeWidth="1"
                    />
                    <polygon
                        points="0,19 38,0 38,8 0,27"
                        fill="#78350f"
                        stroke="#451a03"
                        strokeWidth="1"
                    />
                    {/* 상단 나무 테두리 (수확 가능 시 황금빛 / 물주기 가능 시 청록빛 테두리 강조) */}
                    <polygon
                        points="0,-19 38,0 0,19 -38,0"
                        fill={isReadyToHarvest ? '#d97706' : needsWater ? '#0284c7' : '#b45309'}
                        stroke={
                            isReadyToHarvest
                                ? '#fef08a'
                                : needsWater
                                  ? '#bae6fd'
                                  : soilLevel === MAX_SOIL_LEVEL
                                    ? '#fbbf24'
                                    : '#78350f'
                        }
                        strokeWidth={isReadyToHarvest || needsWater || soilLevel === MAX_SOIL_LEVEL ? '1.8' : '1.5'}
                    />
                    {/* 안쪽 비옥한 텃밭 흙 (토양 레벨에 따라 점점 깊고 비옥한 색조) */}
                    <polygon
                        points="0,-15 31,0 0,15 -31,0"
                        fill={baseSoilFill}
                        stroke={soilLevel >= 4 ? '#f59e0b' : '#3b2212'}
                        strokeWidth={soilLevel >= 4 ? '1.2' : '1'}
                    />
                    {/* 토양 Lv.3+ 황금 미네랄 입자 표현 */}
                    {soilLevel >= 3 && (
                        <g opacity="0.75">
                            <circle cx="-12" cy="1" r="1.2" fill="#fbbf24" />
                            <circle cx="10" cy="-2" r="1.2" fill="#fde047" />
                            <circle cx="2" cy="6" r="1.1" fill="#fbbf24" />
                        </g>
                    )}

                    {/* 비료 적용 글로우 점 */}
                    {fertilizerUsedCount > 0 && plot.stage > 0 && plot.stage < 3 && (
                        <g opacity="0.9">
                            <circle cx="-16" cy="-2" r="1.8" fill="#a78bfa" />
                            <circle cx="15" cy="2" r="1.8" fill="#34d399" />
                        </g>
                    )}

                    {/* 화단 전면 나무 프레임 3단계 성장 게이지 램프 (●○○ / ●●○ / ●●●) */}
                    {cropMeta && plot.stage > 0 && (
                        <g transform="translate(14, 15)">
                            {[1, 2, 3].map((step) => {
                                const active = plot.stage >= step;
                                const fill = !active
                                    ? 'rgba(255,255,255,0.22)'
                                    : plot.stage === 3
                                      ? '#fde047'
                                      : '#4ade80';
                                return (
                                    <circle
                                        key={`step-dot-${step}`}
                                        cx={(step - 2) * 6}
                                        cy={(2 - step) * 3}
                                        r="2.3"
                                        fill={fill}
                                        stroke="#451a03"
                                        strokeWidth="0.7"
                                    />
                                );
                            })}
                        </g>
                    )}

                    {/* 작물 그래픽 */}
                    {renderCropStageGraphic(plot.cropId, plot.stage)}

                    {/* 3단계(수확 가능) 반짝이는 황금 별 이펙트 */}
                    {isReadyToHarvest && (
                        <g>
                            <text x="-28" y="-18" fontSize="11" fill="#fef08a">✦</text>
                            <text x="22" y="-22" fontSize="12" fill="#fde047">✨</text>
                            <text x="0" y="-31" fontSize="10" fill="#fef08a">✦</text>
                        </g>
                    )}

                    {/* 토양 레벨 코너 배지 (Lv.1+) */}
                    {soilLevel > 0 && (
                        <g transform="translate(24, -12)">
                            <rect
                                x="-13"
                                y="-6"
                                width="26"
                                height="11"
                                rx="4"
                                fill={soilLevel >= 5 ? '#f59e0b' : '#451a03'}
                                stroke="#fde68a"
                                strokeWidth="0.8"
                            />
                            <text
                                x="0"
                                y="1.8"
                                textAnchor="middle"
                                fill={soilLevel >= 5 ? '#1e293b' : '#fef3c7'}
                                fontSize="6.8"
                                fontWeight="900"
                            >
                                Lv.{soilLevel}
                            </text>
                        </g>
                    )}

                    {/* 비료 적용 횟수 배지 */}
                    {fertilizerUsedCount > 0 && plot.stage > 0 && plot.stage < 3 && (
                        <g transform="translate(-24, 16)">
                            <rect
                                x="-13"
                                y="-5.5"
                                width="26"
                                height="10.5"
                                rx="4"
                                fill="#5b21b6"
                                stroke="#ddd6fe"
                                strokeWidth="0.8"
                            />
                            <text x="0" y="1.8" textAnchor="middle" fill="#ffffff" fontSize="6.8" fontWeight="900">
                                🧪×{fertilizerUsedCount}
                            </text>
                        </g>
                    )}
                </>
            )}

            {/* 텃밭 번호 팻말 */}
            <g transform="translate(-28, -12)">
                <line x1="0" y1="6" x2="0" y2="-6" stroke="#78350f" strokeWidth="2" />
                <rect x="-9" y="-15" width="18" height="11" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
                <text x="0" y="-7.5" textAnchor="middle" fill="#78350f" fontSize="7.5" fontWeight="900">
                    #{plot.plotIndex + 1}
                </text>
            </g>

            {/* 단계별 직관적 플로팅 배지 (말풍선이 열려있거나 최상단 오버레이 분리 시 가림) */}
            {!hideBadge &&
                !isBubbleOpen &&
                isUnlocked &&
                (isReadyToHarvest && cropMeta ? (
                    <g transform="translate(0, -42)">
                        <rect
                            x="-46"
                            y="-12"
                            width="92"
                            height="19"
                            rx="9.5"
                            fill="#15803d"
                            stroke="#fde047"
                            strokeWidth="1.6"
                        />
                        <text x="0" y="1" textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="900">
                            🧺 {cropMeta.emoji} {cropMeta.shortName} 수확!
                        </text>
                    </g>
                ) : needsWater && cropMeta ? (
                    <g transform={`translate(0, ${plot.stage === 2 ? -36 : -30})`}>
                        <rect
                            x="-48"
                            y="-11"
                            width="96"
                            height="18"
                            rx="9"
                            fill="#0284c7"
                            stroke="#e0f2fe"
                            strokeWidth="1.5"
                        />
                        <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
                            💧 {cropMeta.shortName} 물주기! ({plot.stage}/3)
                        </text>
                    </g>
                ) : cropMeta && (plot.stage === 1 || plot.stage === 2) ? (
                    <g transform={`translate(0, ${plot.stage === 2 ? -30 : -24})`}>
                        <rect
                            x="-44"
                            y="-9"
                            width="88"
                            height="14"
                            rx="7"
                            fill="rgba(15, 23, 42, 0.78)"
                            stroke={plot.stage === 2 ? 'rgba(253, 224, 71, 0.55)' : 'rgba(134, 239, 172, 0.55)'}
                            strokeWidth="0.9"
                        />
                        <text
                            x="0"
                            y="0.5"
                            textAnchor="middle"
                            fill={plot.stage === 2 ? '#fde047' : '#86efac'}
                            fontSize="7.2"
                            fontWeight="800"
                        >
                            {plot.stage === 1 ? '🌱' : '🌼'} {plot.stage}/3 · ⏳{waterStatus.shortRemainingLabel}
                        </text>
                    </g>
                ) : !cropMeta && isSelected ? (
                    <g transform="translate(0, -28)">
                        <rect
                            x="-36"
                            y="-10"
                            width="72"
                            height="16"
                            rx="8"
                            fill="rgba(15, 23, 42, 0.8)"
                        />
                        <text x="0" y="1" textAnchor="middle" fill="#fde047" fontSize="8.2" fontWeight="800">
                            🌱 씨앗 심기
                        </text>
                    </g>
                ) : null)}
        </g>
    );
};

export interface GardenPlotBadgeOverlayProps {
    plot: GardenPlotItem;
    pos: { x: number; y: number };
    isOwner: boolean;
    isSelected: boolean;
    isBubbleOpen?: boolean;
    onSelectPlot: (plotIndex: number) => void;
    onQuickWater?: (plotIndex: number) => boolean | void;
    onQuickHarvest?: (plotIndex: number) => void;
    nowMs?: number;
    azitLevel?: number;
}

/**
 * 캐릭터보다 위(최상단 SVG 레이어)에 렌더링되어 클릭 가림을 방지하고
 * 수확!/물주기!/해금 배지 클릭 시 원클릭 실행을 지원하는 텃밭 상태 배지 오버레이
 */
export const GardenPlotBadgeOverlay: React.FC<GardenPlotBadgeOverlayProps> = ({
    plot,
    pos,
    isOwner,
    isSelected,
    isBubbleOpen = false,
    onSelectPlot,
    onQuickWater,
    onQuickHarvest,
    nowMs,
    azitLevel = 1,
}) => {
    if (isBubbleOpen) return null;

    if (plot.isUnlocked === false) {
        const unlockLevel = plot.unlockLevel ?? 1;
        const unlockCost = plot.unlockCost ?? 0;
        const canUnlock = isOwner && azitLevel >= unlockLevel;
        return (
            <g
                transform={`translate(${pos.x}, ${pos.y})`}
                data-garden-plot={plot.plotIndex}
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlot(plot.plotIndex);
                }}
            >
                <g transform="translate(0, -26)">
                    <rect
                        x={canUnlock ? -56 : -36}
                        y="-10"
                        width={canUnlock ? 112 : 72}
                        height="17"
                        rx="8.5"
                        fill={canUnlock ? '#b45309' : 'rgba(15, 23, 42, 0.85)'}
                        stroke={canUnlock ? '#fde68a' : '#64748b'}
                        strokeWidth="1.2"
                    />
                    <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        fill={canUnlock ? '#fef9c3' : '#e2e8f0'}
                        fontSize="7.8"
                        fontWeight="900"
                    >
                        {canUnlock ? `🔓 해금 가능 (${unlockCost}P)` : `🔒 Lv.${unlockLevel}`}
                    </text>
                </g>
            </g>
        );
    }

    const cropMeta = getGardenCropById(plot.cropId);
    const isReadyToHarvest = plot.stage === 3 && Boolean(cropMeta);
    const waterStatus = getGardenPlotWaterStatus(plot, nowMs ?? Date.now());
    const needsWater = Boolean(cropMeta && plot.stage > 0 && plot.stage < 3 && waterStatus.canWater);

    if (isReadyToHarvest && cropMeta) {
        return (
            <g
                transform={`translate(${pos.x}, ${pos.y})`}
                data-garden-plot={plot.plotIndex}
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    if (isOwner && onQuickHarvest) {
                        onQuickHarvest(plot.plotIndex);
                    } else {
                        onSelectPlot(plot.plotIndex);
                    }
                }}
            >
                <g transform="translate(0, -42)">
                    <rect
                        x="-50"
                        y="-13"
                        width="100"
                        height="21"
                        rx="10.5"
                        fill="#15803d"
                        stroke="#fde047"
                        strokeWidth="1.6"
                    />
                    <text x="0" y="1" textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="900">
                        🧺 {cropMeta.emoji} {cropMeta.shortName} 수확!
                    </text>
                </g>
            </g>
        );
    }

    if (needsWater && cropMeta) {
        return (
            <g
                transform={`translate(${pos.x}, ${pos.y})`}
                data-garden-plot={plot.plotIndex}
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    if (isOwner && onQuickWater) {
                        onQuickWater(plot.plotIndex);
                    } else {
                        onSelectPlot(plot.plotIndex);
                    }
                }}
            >
                <g transform={`translate(0, ${plot.stage === 2 ? -36 : -30})`}>
                    <rect
                        x="-50"
                        y="-12"
                        width="100"
                        height="20"
                        rx="10"
                        fill="#0284c7"
                        stroke="#e0f2fe"
                        strokeWidth="1.5"
                    />
                    <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
                        💧 {cropMeta.shortName} 물주기! ({plot.stage}/3)
                    </text>
                </g>
            </g>
        );
    }

    if (cropMeta && (plot.stage === 1 || plot.stage === 2)) {
        return (
            <g
                transform={`translate(${pos.x}, ${pos.y})`}
                data-garden-plot={plot.plotIndex}
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlot(plot.plotIndex);
                }}
            >
                <g transform={`translate(0, ${plot.stage === 2 ? -30 : -24})`}>
                    <rect
                        x="-44"
                        y="-9"
                        width="88"
                        height="14"
                        rx="7"
                        fill="rgba(15, 23, 42, 0.78)"
                        stroke={plot.stage === 2 ? 'rgba(253, 224, 71, 0.55)' : 'rgba(134, 239, 172, 0.55)'}
                        strokeWidth="0.9"
                    />
                    <text
                        x="0"
                        y="0.5"
                        textAnchor="middle"
                        fill={plot.stage === 2 ? '#fde047' : '#86efac'}
                        fontSize="7.2"
                        fontWeight="800"
                    >
                        {plot.stage === 1 ? '🌱' : '🌼'} {plot.stage}/3 · ⏳{waterStatus.shortRemainingLabel}
                    </text>
                </g>
            </g>
        );
    }

    if (!cropMeta && isSelected) {
        return (
            <g
                transform={`translate(${pos.x}, ${pos.y})`}
                data-garden-plot={plot.plotIndex}
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlot(plot.plotIndex);
                }}
            >
                <g transform="translate(0, -28)">
                    <rect
                        x="-36"
                        y="-10"
                        width="72"
                        height="16"
                        rx="8"
                        fill="rgba(15, 23, 42, 0.8)"
                    />
                    <text x="0" y="1" textAnchor="middle" fill="#fde047" fontSize="8.2" fontWeight="800">
                        🌱 씨앗 심기
                    </text>
                </g>
            </g>
        );
    }

    return null;
};

/**
 * 고용된 농부 2.5D 아이소메트릭 벡터 캐릭터 렌더러
 */
export const GardenFarmerIsoNode: React.FC<{
    farmer: OwnedFarmer;
    pos: { x: number; y: number };
    latestLog?: FarmerActionLog;
    facingLeft?: boolean;
    onClick?: () => void;
}> = ({ farmer, pos, latestLog, facingLeft = false, onClick }) => {
    const visual = getFarmerVisualMeta(farmer.farmerCode, farmer.grade);
    const gradeBadge = getFarmerGradeBadge(farmer.grade);
    const activeRole = latestLog?.actionType ?? farmer.roles[farmer.roles.length - 1] ?? 'water';
    const roleMeta = getFarmerRoleBadge(activeRole);

    return (
        <g
            transform={`translate(${pos.x}, ${pos.y})`}
            className="cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            {/* 바닥 그림자 & 등급 링 */}
            <ellipse
                cx="0"
                cy="5"
                rx={visual.shadowRx}
                ry={visual.shadowRy}
                fill="rgba(15, 23, 42, 0.24)"
            />
            <ellipse
                cx="0"
                cy="4"
                rx={visual.shadowRx + 3}
                ry={visual.shadowRy + 1.5}
                fill="none"
                stroke={visual.accentRingColor}
                strokeWidth="1.6"
                strokeDasharray={farmer.autoEnabled ? undefined : '3 2'}
            />

            {/* 2.5D 치비 농부 벡터 실루엣 */}
            <g transform={`scale(${facingLeft ? -1 : 1}, 1)`}>
                {/* 다리 & 장화 */}
                <rect x="-7" y="-8" width="5" height="10" rx="2" fill="#334155" />
                <rect x="2" y="-8" width="5" height="10" rx="2" fill="#1e293b" />
                <ellipse cx="-4.5" cy="2" rx="4" ry="2.2" fill="#451a03" />
                <ellipse cx="4.5" cy="2" rx="4" ry="2.2" fill="#451a03" />
                {/* 작업복 멜빵 몸통 */}
                <rect
                    x="-11"
                    y="-27"
                    width="22"
                    height="20"
                    rx="7"
                    fill={visual.outfitColor}
                    stroke="#0f172a"
                    strokeWidth="1.3"
                />
                <rect x="-6" y="-23" width="12" height="11" rx="2.5" fill="rgba(255,255,255,0.22)" />
                {/* 머리 */}
                <circle cx="0" cy="-35" r="10.5" fill="#fde68a" stroke="#78350f" strokeWidth="1.2" />
                <circle cx="-3.5" cy="-35" r="1.4" fill="#1e293b" />
                <circle cx="3.5" cy="-35" r="1.4" fill="#1e293b" />
                <path d="M-2.5,-31.5 Q0,-29.5 2.5,-31.5" fill="none" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />
                {/* 농부 모자 */}
                <ellipse cx="0" cy="-42.5" rx="15" ry="4.5" fill={visual.hatColor} stroke="#78350f" strokeWidth="1.2" />
                <path
                    d="M-8,-43 C-7,-52 7,-52 8,-43 Z"
                    fill={visual.hatColor}
                    stroke="#78350f"
                    strokeWidth="1.2"
                />
                {/* 손에 든 작업 도구 (물조리개/수확바구니/새싹/비료) */}
                <g transform="translate(13, -18)">
                    <circle cx="0" cy="0" r="6.5" fill="#ffffff" stroke={visual.accentRingColor} strokeWidth="1.2" />
                    <text x="0" y="2.8" textAnchor="middle" fontSize="8">
                        {roleMeta.emoji}
                    </text>
                </g>
            </g>

            {/* 상단 농부 이름 & 등급 배지 */}
            <g transform="translate(0, -58)">
                <rect
                    x="-38"
                    y="-10"
                    width="76"
                    height="15"
                    rx="7.5"
                    fill="rgba(15, 23, 42, 0.86)"
                    stroke={visual.accentRingColor}
                    strokeWidth="1"
                />
                <text x="0" y="0.5" textAnchor="middle" fill="#ffffff" fontSize="7.8" fontWeight="900">
                    {gradeBadge.emoji} {farmer.name} {farmer.autoEnabled ? `Lv.${farmer.level}` : '⏸️'}
                </text>
            </g>
        </g>
    );
};

function getGardenBubblePlacement(plotIndex: number): {
    style: React.CSSProperties;
    openBelow: boolean;
} {
    const coord = getGardenPlotCoord(plotIndex);
    const svgX = 400 + (coord.gridX - coord.gridY) * 33;
    const svgY = 236 + (coord.gridX + coord.gridY + 1) * 16.5;
    const rawLeftPct = ((svgX - 95) / 610) * 100;
    const rawTopPct = ((svgY - 30) / 505) * 100;
    const openBelow = rawTopPct < 50;
    const clampedLeft = `clamp(var(--bubble-clamp, 124px), ${rawLeftPct.toFixed(2)}%, calc(100% - var(--bubble-clamp, 124px)))`;

    if (openBelow) {
        const topPct = Math.min(72, rawTopPct + 4.5);
        return {
            style: {
                left: clampedLeft,
                top: `${topPct.toFixed(2)}%`,
                maxHeight: `calc(${(100 - topPct).toFixed(2)}% - 8px)`,
            },
            openBelow,
        };
    }

    const bottomPct = Math.max(4, ((535 - (svgY - 16)) / 505) * 100);
    return {
        style: {
            left: clampedLeft,
            bottom: `${bottomPct.toFixed(2)}%`,
            maxHeight: `calc(${(100 - bottomPct).toFixed(2)}% - 8px)`,
        },
        openBelow,
    };
}

export interface GardenPlotActionBubbleProps {
    plot: GardenPlotItem;
    gardenState: MinihomeGardenState;
    isOwner: boolean;
    isZoomed: boolean;
    nowMs: number;
    azitLevel?: number;
    veraPoints?: number;
    isActing?: boolean;
    cropCatalog?: AzitCropCatalogItem[];
    fertilizerCatalog?: AzitFertilizerCatalogItem[];
    soilLevelsCatalog?: AzitSoilLevelCatalogItem[];
    onClose: () => void;
    onPlantCrop?: (plotIndex: number, cropId: GardenCropId) => void;
    onWaterPlot?: (plotIndex: number) => boolean | void;
    onHarvestPlot?: (plotIndex: number) => void;
    onClearPlot?: (plotIndex: number) => void;
    onUnlockPlot?: (plotIndex: number) => Promise<boolean> | void;
    onUpgradeSoil?: (plotIndex: number) => Promise<boolean> | void;
    onFertilizePlot?: (plotIndex: number, fertilizerId?: AzitFertilizerId) => Promise<boolean> | void;
    onOpenSeedShop?: () => void;
    onOpenFertilizerShop?: () => void;
}

/**
 * 텃밭 이랑 클릭 시 현재 상태에 맞는 행동(심기·물주기·수확·해금·토양강화·비료)을 실행하는 컨텍스트 말풍선
 */
export const GardenPlotActionBubble: React.FC<GardenPlotActionBubbleProps> = ({
    plot,
    gardenState,
    isOwner,
    isZoomed,
    nowMs,
    azitLevel = 1,
    veraPoints,
    isActing = false,
    cropCatalog,
    fertilizerCatalog,
    soilLevelsCatalog,
    onClose,
    onPlantCrop,
    onWaterPlot,
    onHarvestPlot,
    onClearPlot,
    onUnlockPlot,
    onUpgradeSoil,
    onFertilizePlot,
    onOpenSeedShop,
    onOpenFertilizerShop,
}) => {
    const [confirmClear, setConfirmClear] = useState<boolean>(false);

    useEffect(() => {
        setConfirmClear(false);
    }, [plot.plotIndex, plot.cropId, plot.stage, plot.isUnlocked]);

    const isUnlocked = plot.isUnlocked !== false;
    const unlockLevel = plot.unlockLevel ?? 1;
    const unlockCost = plot.unlockCost ?? 0;
    const soilLevel = Math.max(0, Math.min(MAX_SOIL_LEVEL, plot.soilLevel ?? 0));
    const fertilizerUsedCount = Math.max(0, plot.fertilizerUsedCount ?? 0);

    const effectiveCrops =
        cropCatalog && cropCatalog.length > 0
            ? cropCatalog
            : GARDEN_CROP_CATALOG.map((c) => ({
                  cropId: c.cropId,
                  name: c.name,
                  shortName: c.shortName,
                  emoji: c.emoji,
                  requiredAzitLevel: c.requiredAzitLevel ?? 1,
                  seedPrice: c.seedPrice ?? 0,
                  harvestYield: 2,
                  sellPrice: c.sellPrice ?? 10,
                  description: c.description,
              }));
    const effectiveFertilizers =
        fertilizerCatalog && fertilizerCatalog.length > 0 ? fertilizerCatalog : FALLBACK_FERTILIZERS;
    const effectiveSoilLevels =
        soilLevelsCatalog && soilLevelsCatalog.length > 0 ? soilLevelsCatalog : FALLBACK_SOIL_LEVELS;

    const currentSoilMeta = effectiveSoilLevels.find((s) => s.level === soilLevel) ?? effectiveSoilLevels[0];
    const nextSoilMeta = effectiveSoilLevels.find((s) => s.level === soilLevel + 1);

    const cropMeta = isUnlocked ? getGardenCropById(plot.cropId) : undefined;
    const isEmpty = !cropMeta || plot.stage === 0;
    const isReadyToHarvest = isUnlocked && Boolean(cropMeta && plot.stage >= 3);
    const waterStatus = getGardenPlotWaterStatus(plot, nowMs);
    const needsWater = isUnlocked && Boolean(cropMeta && plot.stage > 0 && plot.stage < 3 && waterStatus.canWater);

    const ownedCrops = effectiveCrops.filter((crop) => (gardenState.seedCounts?.[crop.cropId] || 0) > 0);
    const ownedUnlockedCrops = ownedCrops.filter((crop) => azitLevel >= (crop.requiredAzitLevel ?? 1));

    const placement = getGardenBubblePlacement(plot.plotIndex);
    const widthClass = 'w-[232px] sm:w-[258px] max-w-[calc(100%-16px)] [--bubble-clamp:124px] sm:[--bubble-clamp:137px]';

    const borderColorClass = !isUnlocked
        ? azitLevel >= unlockLevel
            ? 'border-amber-400/90'
            : 'border-slate-500/80'
        : isReadyToHarvest
          ? 'border-amber-400/90'
          : needsWater
            ? 'border-sky-400/90'
            : isEmpty
              ? 'border-emerald-400/80'
              : 'border-slate-500/80';

    return (
        <div
            data-garden-bubble="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={isZoomed ? undefined : placement.style}
            className={`absolute z-30 ${
                isZoomed ? 'top-12 left-1/2 -translate-x-1/2 max-h-[calc(100%-56px)]' : '-translate-x-1/2'
            } ${widthClass} flex flex-col bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border-2 ${borderColorClass} shadow-2xl p-2.5 sm:p-3`}
        >
            {/* 상단 상태 헤더 & 닫기 버튼 */}
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-700/80 shrink-0">
                <div className="flex items-center gap-1 text-[11px] font-black truncate">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono text-[10px]">
                        #{plot.plotIndex + 1}
                    </span>
                    {!isUnlocked ? (
                        <span className="truncate text-amber-300">🔒 잠긴 텃밭</span>
                    ) : cropMeta && plot.stage > 0 ? (
                        <span className="truncate text-emerald-200">
                            {cropMeta.emoji} {cropMeta.shortName} · {plot.stage}/3
                        </span>
                    ) : (
                        <span className="truncate text-emerald-300">🌱 빈 텃밭</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="말풍선 닫기"
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                >
                    ×
                </button>
            </div>

            <div className="min-h-0 overflow-y-auto pt-2 space-y-2 pr-0.5">
                {!isUnlocked ? (
                    /* 잠긴 텃밭 상태 */
                    !isOwner ? (
                        <div className="py-1.5 px-2 rounded-xl bg-slate-800/80 text-center text-[11px] font-bold text-slate-300">
                            🔒 아직 해금되지 않은 텃밭 (Lv.{unlockLevel})
                        </div>
                    ) : (
                        <div className="space-y-2 text-center">
                            <div className="px-2.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 space-y-0.5">
                                <div className="text-[11px] font-black text-amber-300">
                                    해금 조건: 아지트 Lv.{unlockLevel}
                                </div>
                                <div className="text-[10px] font-bold text-slate-300">
                                    해금 비용: {unlockCost.toLocaleString()} P
                                </div>
                            </div>
                            {azitLevel < unlockLevel ? (
                                <div className="w-full py-2 px-3 rounded-xl bg-slate-800 text-slate-400 text-[11px] font-black">
                                    🔒 Lv.{unlockLevel} 달성 시 해금 가능
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    data-screenshot-click="action"
                                    disabled={
                                        isActing ||
                                        !onUnlockPlot ||
                                        (veraPoints !== undefined && veraPoints < unlockCost)
                                    }
                                    onClick={async () => {
                                        const ok = await onUnlockPlot?.(plot.plotIndex);
                                        if (ok !== false) onClose();
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-sm disabled:opacity-45 disabled:cursor-not-allowed"
                                >
                                    {veraPoints !== undefined && veraPoints < unlockCost
                                        ? `포인트 부족 (${unlockCost.toLocaleString()}P)`
                                        : `🔓 해금 가능 (${unlockCost.toLocaleString()}P)`}
                                </button>
                            )}
                        </div>
                    )
                ) : !isOwner ? (
                    /* 방문자 읽기 전용 안내 */
                    <div className="py-1 px-2 rounded-xl bg-slate-800/80 text-center text-[11px] font-bold text-slate-300">
                        {isEmpty
                            ? '비어있는 텃밭 이랑'
                            : isReadyToHarvest
                              ? '✨ 수확을 기다리는 중!'
                              : waterStatus.canWater
                                ? '💧 물을 줄 수 있는 상태예요'
                                : `⏳ 다음 물주기까지 ${waterStatus.shortRemainingLabel}`}
                    </div>
                ) : isEmpty ? (
                    /* 빈 밭: 보유 씨앗 원클릭 심기 */
                    ownedUnlockedCrops.length > 0 ? (
                        <div className="space-y-1.5">
                            <div className="grid grid-cols-2 gap-1.5">
                                {ownedUnlockedCrops.map((crop) => {
                                    const qty = gardenState.seedCounts?.[crop.cropId] || 0;
                                    return (
                                        <button
                                            key={`bubble-seed-${crop.cropId}`}
                                            type="button"
                                            data-screenshot-click="action"
                                            disabled={isActing}
                                            onClick={() => {
                                                onPlantCrop?.(plot.plotIndex, crop.cropId);
                                                onClose();
                                            }}
                                            className="px-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition-all cursor-pointer flex items-center justify-between gap-1 shadow-xs disabled:opacity-50"
                                        >
                                            <span className="truncate">
                                                {crop.emoji} {crop.shortName}
                                            </span>
                                            <span className="text-[10px] text-amber-200 font-mono shrink-0">
                                                ×{qty}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {onOpenSeedShop && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenSeedShop();
                                    }}
                                    className="w-full py-1 rounded-lg text-[10px] font-bold text-emerald-300 hover:text-emerald-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
                                >
                                    🌱 씨앗 상점 열기
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 text-center">
                            <p className="text-[11px] font-bold text-slate-300">
                                {ownedCrops.length > 0 ? '심을 수 있는 해금 씨앗이 없어요' : '보유 중인 씨앗이 없어요'}
                            </p>
                            {onOpenSeedShop && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenSeedShop();
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-sm"
                                >
                                    🌱 씨앗 상점 열기
                                </button>
                            )}
                        </div>
                    )
                ) : isReadyToHarvest && cropMeta ? (
                    /* 완숙(3단계): 즉시 수확하기 */
                    <button
                        type="button"
                        data-screenshot-click="result"
                        disabled={isActing}
                        onClick={() => {
                            onHarvestPlot?.(plot.plotIndex);
                            onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                        <span>🧺 {cropMeta.shortName} 수확하기</span>
                    </button>
                ) : (
                    /* 성장 중(1~2단계): 물주기 / 비료 / 이랑 비우기 */
                    <div className="space-y-1.5">
                        {waterStatus.canWater ? (
                            <button
                                type="button"
                                data-screenshot-click="action"
                                disabled={isActing}
                                onClick={() => {
                                    onWaterPlot?.(plot.plotIndex);
                                    onClose();
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                            >
                                <span>💧 물주기 ({plot.stage + 1}/3단계)</span>
                            </button>
                        ) : (
                            <>
                                <div className="px-2.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-center space-y-0.5">
                                    <div className="text-[11px] font-black text-sky-300">⏳ 땅이 촉촉해요</div>
                                    <div className="text-[10px] font-bold text-slate-300">
                                        다음 물주기까지 {waterStatus.shortRemainingLabel}
                                    </div>
                                </div>

                                {/* 비료 적용 섹션 (쿨타임 대기 중일 때만 표시) */}
                                {onFertilizePlot && (
                                    <div className="p-2 rounded-xl bg-violet-950/40 border border-violet-500/40 space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] font-black text-violet-200">
                                            <span>🧪 비료 사용</span>
                                            <span className="font-mono">
                                                {fertilizerUsedCount}/{MAX_FERTILIZER_PER_CROP}
                                            </span>
                                        </div>
                                        {fertilizerUsedCount >= MAX_FERTILIZER_PER_CROP ? (
                                            <div className="text-[10px] font-bold text-slate-400 text-center">
                                                이번 작물 비료 최대 적용 완료
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {effectiveFertilizers.map((fert) => {
                                                    const ownedQty =
                                                        gardenState.fertilizerCounts?.[fert.fertilizerId] || 0;
                                                    const fertLocked = azitLevel < (fert.requiredAzitLevel ?? 1);
                                                    return (
                                                        <div
                                                            key={`bubble-fert-${fert.fertilizerId}`}
                                                            className="flex items-center justify-between gap-1.5 text-[10px]"
                                                        >
                                                            <span className="font-bold text-slate-200 truncate">
                                                                {fert.emoji} {fert.shortName} (-{fert.reductionHours}h) · ×
                                                                {ownedQty}
                                                            </span>
                                                            {ownedQty > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={isActing || fertLocked}
                                                                    onClick={() => onFertilizePlot(plot.plotIndex, fert.fertilizerId)}
                                                                    className="px-2 py-0.5 rounded-md bg-violet-500 hover:bg-violet-400 text-white font-black cursor-pointer shrink-0 disabled:opacity-45 disabled:cursor-not-allowed"
                                                                >
                                                                    적용
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        onClose();
                                                                        (onOpenFertilizerShop ?? onOpenSeedShop)?.();
                                                                    }}
                                                                    className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-slate-600 text-violet-200 font-bold cursor-pointer shrink-0"
                                                                >
                                                                    구매
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {onClearPlot && (
                            <div className="pt-1 border-t border-slate-700/70">
                                {!confirmClear ? (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmClear(true)}
                                        className="w-full py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
                                    >
                                        🌱 이랑 비우기
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-between gap-1.5 bg-rose-950/50 border border-rose-500/40 rounded-lg px-2 py-1">
                                        <span className="text-[10px] font-bold text-rose-200">정말 비울까요?</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onClearPlot(plot.plotIndex);
                                                    onClose();
                                                }}
                                                className="px-2 py-0.5 rounded-md bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-black cursor-pointer"
                                            >
                                                비우기
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmClear(false)}
                                                className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold cursor-pointer"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 토양 강화 섹션 (소유자 + 해금된 텃밭 공통) */}
                {isOwner && isUnlocked && onUpgradeSoil && (
                    <div className="p-2 rounded-xl bg-slate-800/85 border border-amber-500/30 space-y-1.5">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-black">
                            <span className="text-amber-200">
                                🌱 토양 Lv.{soilLevel}/{MAX_SOIL_LEVEL}
                            </span>
                            <span className="text-emerald-300">
                                {currentSoilMeta.guaranteedBonusYield > 0 || currentSoilMeta.bonusChancePct > 0
                                    ? `+${currentSoilMeta.guaranteedBonusYield}확정 · ${currentSoilMeta.bonusChancePct}%보너스`
                                    : '기본 수확'}
                            </span>
                        </div>
                        {soilLevel >= MAX_SOIL_LEVEL ? (
                            <div className="py-1 rounded-lg bg-amber-500/20 text-amber-200 text-center text-[10px] font-black">
                                ✨ 토양 MAX (최고 등급)
                            </div>
                        ) : nextSoilMeta ? (
                            <button
                                type="button"
                                disabled={
                                    isActing ||
                                    azitLevel < nextSoilMeta.requiredAzitLevel ||
                                    (veraPoints !== undefined && veraPoints < nextSoilMeta.upgradeCost)
                                }
                                onClick={() => onUpgradeSoil(plot.plotIndex)}
                                className="w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                                {azitLevel < nextSoilMeta.requiredAzitLevel
                                    ? `🔒 Lv.${nextSoilMeta.requiredAzitLevel} 필요 (${nextSoilMeta.upgradeCost}P)`
                                    : veraPoints !== undefined && veraPoints < nextSoilMeta.upgradeCost
                                      ? `포인트 부족 (${nextSoilMeta.upgradeCost.toLocaleString()}P)`
                                      : `⬆️ 토양 Lv.${soilLevel + 1} 강화 (${nextSoilMeta.upgradeCost.toLocaleString()}P)`}
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {/* 말풍선 꼬리 (줌 미사용 시 해당 밭 방향 가리킴) */}
            {!isZoomed && (
                <div
                    className={`pointer-events-none absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-slate-900 ${
                        placement.openBelow
                            ? `-top-[7px] border-l-2 border-t-2 ${borderColorClass}`
                            : `-bottom-[7px] border-r-2 border-b-2 ${borderColorClass}`
                    }`}
                />
            )}
        </div>
    );
};

interface GardenControlPanelProps {
    gardenState: MinihomeGardenState;
    isOwner: boolean;
    isRainWeather: boolean;
    nowMs?: number;
    azitLevel?: number;
    isActing?: boolean;
    cropCatalog?: AzitCropCatalogItem[];
    fertilizerCatalog?: AzitFertilizerCatalogItem[];
    farmers?: OwnedFarmer[];
    maxFarmers?: number;
    onOpenSeedShop?: () => void;
    onOpenFertilizerShop?: () => void;
    onOpenFarmerModal?: () => void;
    onOpenWarehouse?: () => void;
    onOpenMarket?: () => void;
    onOpenNotificationCenter?: () => void;
    externalPushSubscribed?: boolean;
    onWaterPlot?: (plotIndex: number) => boolean | void;
    onHarvestPlot?: (plotIndex: number) => void;
    onWaterAll?: () => Promise<boolean> | void;
    onHarvestAll?: () => Promise<boolean> | void;
    onPlantAll?: (cropId: GardenCropId) => Promise<boolean> | void;
}

/**
 * 캔버스 하단 앞마당 텃밭 안내·알림·일괄 관리·내 아지트 농장 창고 현황 패널
 */
export const MinihomeGardenControlPanel: React.FC<GardenControlPanelProps> = ({
    gardenState,
    isOwner,
    isRainWeather,
    nowMs: nowMsProp,
    azitLevel = 1,
    isActing = false,
    cropCatalog,
    fertilizerCatalog,
    farmers = [],
    maxFarmers = 0,
    onOpenSeedShop,
    onOpenFertilizerShop,
    onOpenFarmerModal,
    onWaterPlot,
    onHarvestPlot,
    onWaterAll,
    onHarvestAll,
    onPlantAll,
}) => {
    const [localNowMs, setLocalNowMs] = useState<number>(() => Date.now());
    const nowMs = nowMsProp ?? localNowMs;
    const localNotifiedKeysRef = useRef<Set<string>>(new Set());

    // 외부 서버 동기화 clock이 없을 때만 1초 간격 로컬 타이머 가동
    useEffect(() => {
        if (nowMsProp !== undefined) return;
        const timer = window.setInterval(() => {
            setLocalNowMs(Date.now());
        }, 1000);
        return () => window.clearInterval(timer);
    }, [nowMsProp]);

    // 8시간 도래 작물 로컬 브라우저/서비스워커 즉시 알림 (열려있는 동안 쿨타임 만료 시)
    useEffect(() => {
        if (typeof window === 'undefined' || !isOwner) return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        gardenState.plots.forEach((p) => {
            if (p.isUnlocked === false || !p.cropId || p.stage <= 0 || p.stage >= 3) return;
            const status = getGardenPlotWaterStatus(p, nowMs);
            if (!status.canWater) return;

            const notifyKey = `${p.plotIndex}-${p.cropId}-${p.stage}-${p.lastWateredAt || 'init'}`;
            if (localNotifiedKeysRef.current.has(notifyKey)) return;
            localNotifiedKeysRef.current.add(notifyKey);

            // 이미 과거에 알림 확인된 건은 첫 마운트 시 스킵하지 않고, 방금 만료된 경우(최근 15초 이내 만료) 브라우저 알림 표시
            if (status.nextWaterAtMs && nowMs - status.nextWaterAtMs < 15000) {
                const cMeta = getGardenCropById(p.cropId);
                const title = '💧 [아지트 농장] 작물에 물을 줄 시간이에요!';
                const body = `${p.plotIndex + 1}번 텃밭의 [${cMeta?.emoji || '🌱'} ${cMeta?.name || '작물'}]에 물을 주면 다음 단계로 자라납니다!`;
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready
                        .then((reg) =>
                            reg.showNotification(title, {
                                body,
                                icon: '/logo-192.png',
                                badge: '/logo-192.png',
                                data: { url: '/mypage?section=dashboard&zone=garden' },
                            })
                        )
                        .catch(() => {});
                }
            }
        });
    }, [gardenState.plots, nowMs, isOwner]);

    const effectiveCrops =
        cropCatalog && cropCatalog.length > 0
            ? cropCatalog
            : GARDEN_CROP_CATALOG.map((c) => ({
                  cropId: c.cropId,
                  name: c.name,
                  shortName: c.shortName,
                  emoji: c.emoji,
                  requiredAzitLevel: c.requiredAzitLevel ?? 1,
                  seedPrice: c.seedPrice ?? 0,
                  harvestYield: 2,
                  sellPrice: c.sellPrice ?? 10,
                  description: c.description,
              }));
    const effectiveFertilizers =
        fertilizerCatalog && fertilizerCatalog.length > 0 ? fertilizerCatalog : FALLBACK_FERTILIZERS;

    const totalSeeds = Object.values(gardenState.seedCounts || {}).reduce((acc, v) => acc + v, 0);

    const unlockedPlots = gardenState.plots.filter((p) => p.isUnlocked !== false);
    const emptyUnlockedPlots = unlockedPlots.filter((p) => !p.cropId || p.stage === 0);

    const waterReadyPlots = unlockedPlots.filter((p) => {
        const st = getGardenPlotWaterStatus(p, nowMs);
        return st.isPlanted && !st.isHarvestReady && st.canWater;
    });

    const harvestReadyPlots = unlockedPlots.filter((p) => Boolean(p.cropId) && p.stage >= 3);

    const ownedUnlockedSeeds = effectiveCrops.filter(
        (crop) => (gardenState.seedCounts?.[crop.cropId] || 0) > 0 && (crop.requiredAzitLevel ?? 1) <= azitLevel
    );

    const [selectedBulkCropId, setSelectedBulkCropId] = useState<GardenCropId>(
        ownedUnlockedSeeds[0]?.cropId ?? 'crop-carrot'
    );

    useEffect(() => {
        if (ownedUnlockedSeeds.length === 0) return;
        if (!ownedUnlockedSeeds.some((c) => c.cropId === selectedBulkCropId)) {
            setSelectedBulkCropId(ownedUnlockedSeeds[0].cropId);
        }
    }, [ownedUnlockedSeeds, selectedBulkCropId]);

    const unlockedPlotCount = gardenState.unlockedPlotCount ?? unlockedPlots.length;
    const maxPlotCount = gardenState.maxPlotCount ?? gardenState.plots.length;

    return (
        <div className="w-full mt-2 rounded-2xl bg-[#f0f4f8] border border-white/85 shadow-[4px_4px_10px_rgba(163,177,198,0.35),-4px_-4px_10px_rgba(255,255,255,0.85)] p-3.5 sm:p-4 space-y-3 shrink-0">
            {/* 상단 요약 1줄 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px] shadow-sm">
                        🌿 마당 텃밭 {unlockedPlotCount}/{maxPlotCount}칸
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e8edf2] border border-white/80 shadow-[inset_1px_1px_3px_rgba(163,177,198,0.35),inset_-1px_-1px_3px_rgba(255,255,255,0.8)] text-sky-700 text-[10px] font-extrabold">
                        💧 하루 3번 · 8시간 간격
                    </span>
                    {isRainWeather && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold">
                            🌧️ 단비 성장 중
                        </span>
                    )}
                    <span className="text-[11px] font-bold text-[#64748b]">
                        {isOwner ? '밭·배지 클릭으로 심기·물주기·수확·토양강화' : '이웃의 마당 텃밭 구경 중'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <span className="px-2 py-0.5 rounded-full bg-white/90 border border-white text-[#1e293b] text-[10px] font-black font-mono shadow-sm">
                        🌱 씨앗 {totalSeeds} · 🧺 수확 {gardenState.totalHarvested}
                    </span>
                    {isOwner && onOpenSeedShop && (
                        <button
                            type="button"
                            onClick={onOpenSeedShop}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm active:scale-95"
                        >
                            <span>🌱 씨앗 상점</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 일괄 관리 툴바 (전체 물주기 / 일괄 수확 / 일괄 심기 / 비료 / 농부) */}
            {isOwner && (onWaterAll || onHarvestAll || onPlantAll || onOpenFarmerModal || onOpenFertilizerShop) && (
                <div className="rounded-xl bg-white/90 border border-white shadow-[2px_2px_6px_rgba(163,177,198,0.28),-2px_-2px_6px_rgba(255,255,255,0.9)] p-2.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-[#1e293b]">⚡ 일괄 관리</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {effectiveFertilizers.map((fert) => {
                                const qty = gardenState.fertilizerCounts?.[fert.fertilizerId] || 0;
                                return (
                                    <span
                                        key={`panel-fert-${fert.fertilizerId}`}
                                        className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-[10px] font-black font-mono"
                                        title={`${fert.name} (-${fert.reductionHours}h)`}
                                    >
                                        {fert.emoji} {fert.shortName} ×{qty}
                                    </span>
                                );
                            })}
                            {(onOpenFertilizerShop || onOpenSeedShop) && (
                                <button
                                    type="button"
                                    onClick={onOpenFertilizerShop ?? onOpenSeedShop}
                                    className="px-2 py-0.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black cursor-pointer transition-colors"
                                >
                                    🧪 비료 상점
                                </button>
                            )}
                            {onOpenFarmerModal && (
                                <button
                                    type="button"
                                    onClick={onOpenFarmerModal}
                                    className="px-2 py-0.5 rounded-lg bg-[#e8edf2] hover:bg-white border border-slate-200 text-[#1e293b] text-[10px] font-black cursor-pointer transition-colors inline-flex items-center gap-1"
                                >
                                    <span>👨‍🌾 농부</span>
                                    {azitLevel < 20 ? (
                                        <span className="text-amber-700 font-mono">🔒 Lv.20</span>
                                    ) : (
                                        <span className="text-emerald-700 font-mono">
                                            {farmers.length}/{maxFarmers}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {onWaterAll && (
                            <button
                                type="button"
                                disabled={isActing || waterReadyPlots.length === 0}
                                onClick={() => onWaterAll()}
                                className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black cursor-pointer transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                💧 전체 물주기 ({waterReadyPlots.length})
                            </button>
                        )}
                        {onHarvestAll && (
                            <button
                                type="button"
                                disabled={isActing || harvestReadyPlots.length === 0}
                                onClick={() => onHarvestAll()}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black cursor-pointer transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                🧺 일괄 수확 ({harvestReadyPlots.length})
                            </button>
                        )}

                        {onPlantAll && (
                            ownedUnlockedSeeds.length > 0 ? (
                                <div className="flex items-center gap-1 flex-wrap">
                                    <select
                                        aria-label="일괄 심기 씨앗 선택"
                                        value={selectedBulkCropId}
                                        onChange={(e) => setSelectedBulkCropId(e.target.value as GardenCropId)}
                                        className="px-2 py-1.5 rounded-xl bg-[#f0f4f8] border border-slate-200 text-[#1e293b] text-[11px] font-extrabold cursor-pointer"
                                    >
                                        {ownedUnlockedSeeds.map((crop) => (
                                            <option key={`bulk-opt-${crop.cropId}`} value={crop.cropId}>
                                                {crop.emoji} {crop.shortName} (×{gardenState.seedCounts?.[crop.cropId] || 0})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={isActing || emptyUnlockedPlots.length === 0}
                                        onClick={() => onPlantAll(selectedBulkCropId)}
                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        🌱 일괄 심기 ({emptyUnlockedPlots.length})
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500">
                                    <span>보유 씨앗 없음</span>
                                    {onOpenSeedShop && (
                                        <button
                                            type="button"
                                            onClick={onOpenSeedShop}
                                            className="text-emerald-700 font-black hover:underline cursor-pointer"
                                        >
                                            씨앗 상점 →
                                        </button>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* 완숙 작물 빠른 수확 배너 */}
            {isOwner && harvestReadyPlots.length > 0 && (
                <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-300/80 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                    <span className="text-xs font-black text-amber-900">
                        🧺 수확 가능한 작물이 {harvestReadyPlots.length}곳 있습니다!
                    </span>
                    {onHarvestPlot && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {harvestReadyPlots.map((plot) => {
                                const cropMeta = getGardenCropById(plot.cropId);
                                return (
                                    <button
                                        key={`quick-harvest-${plot.plotIndex}`}
                                        type="button"
                                        onClick={() => onHarvestPlot(plot.plotIndex)}
                                        className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black cursor-pointer transition-colors shadow-sm"
                                    >
                                        #{plot.plotIndex + 1} {cropMeta?.emoji || '🌱'} {cropMeta?.shortName || '작물'} 수확
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 8시간 경과 물주기 알림 배너 */}
            {isOwner && waterReadyPlots.length > 0 && (
                <div className="px-3 py-2 rounded-xl bg-sky-50 border border-sky-300/80 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-black text-sky-900">
                        <span className="animate-bounce">💧</span>
                        <span>물주기 알림! 물을 줄 수 있는 밭이 {waterReadyPlots.length}곳 있어요</span>
                    </div>
                    {onWaterPlot && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {waterReadyPlots.map((plot) => {
                                const cropMeta = getGardenCropById(plot.cropId);
                                return (
                                    <button
                                        key={`quick-water-${plot.plotIndex}`}
                                        type="button"
                                        onClick={() => onWaterPlot(plot.plotIndex)}
                                        className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black cursor-pointer transition-colors shadow-sm"
                                    >
                                        #{plot.plotIndex + 1} {cropMeta?.emoji || '💧'} 물주기
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 내 농장 창고 현황 (12종 전체 작물 컴팩트 미니 카드 그리드) */}
            <div className="rounded-xl bg-[#e8edf2]/80 border border-white/75 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] p-2.5 sm:p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-[#1e293b]">
                        🏚️ 내 농장 창고 현황
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#64748b]">
                        씨앗 {totalSeeds}봉지 · 수확 작물 {gardenState.totalHarvested}개
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {effectiveCrops.map((crop) => {
                        const seedCount = gardenState.seedCounts?.[crop.cropId] || 0;
                        const harvestCount = gardenState.harvestCounts?.[crop.cropId] || 0;
                        const reqLv = crop.requiredAzitLevel ?? 1;
                        const isLocked = reqLv > azitLevel;
                        const hasAny = seedCount > 0 || harvestCount > 0;
                        return (
                            <div
                                key={`warehouse-stat-${crop.cropId}`}
                                className={`px-2.5 py-1.5 rounded-xl border flex flex-col gap-0.5 transition-all ${
                                    hasAny
                                        ? 'bg-white/95 border-white text-[#1e293b] shadow-[2px_2px_5px_rgba(163,177,198,0.3),-2px_-2px_5px_rgba(255,255,255,0.9)]'
                                        : isLocked
                                          ? 'bg-[#e8edf2]/45 border-slate-200/60 text-[#94a3b8] opacity-75'
                                          : 'bg-[#e8edf2]/60 border-slate-200/70 text-[#94a3b8]'
                                }`}
                            >
                                <div className="text-[11px] font-black flex items-center justify-between gap-1 truncate">
                                    <span className="flex items-center gap-1 truncate">
                                        <span>{crop.emoji}</span>
                                        <span className="truncate">{crop.shortName}</span>
                                    </span>
                                    {isLocked && (
                                        <span className="text-[9px] font-mono font-black text-amber-700 shrink-0">
                                            🔒 Lv.{reqLv}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className={seedCount > 0 ? 'text-emerald-700 font-black' : 'text-[#94a3b8]'}>
                                        씨앗 {seedCount}
                                    </span>
                                    <span className={harvestCount > 0 ? 'text-amber-600 font-black' : 'text-[#94a3b8]'}>
                                        작물 {harvestCount}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
