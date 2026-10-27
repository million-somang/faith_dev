'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    GardenCropId,
    GardenPlotItem,
    MinihomeGardenState,
} from '@/types/minihome.types';
import {
    GARDEN_CROP_CATALOG,
    getGardenCropById,
    getGardenPlotWaterStatus,
} from '@/data/minihomeCatalogData';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

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

    // Stage 1: 흙에서 막 고개를 내민 작고 여린 연두색 떡잎 3포기 (높이 낮음, 열매/꽃 전혀 없음)
    if (stage === 1) {
        const positions = [
            { x: -13, y: 2 },
            { x: 0, y: -4 },
            { x: 13, y: 0 },
        ];
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

interface GardenPlotProps {
    plot: GardenPlotItem;
    pos: { x: number; y: number };
    isSelected: boolean;
    onSelectPlot: (plotIndex: number) => void;
    nowMs?: number;
}

/**
 * 개별 2.5D 아이소메트릭 텃밭 원목 화단 & 작물 렌더러
 */
export const GardenPlotIsoNode: React.FC<GardenPlotProps> = ({
    plot,
    pos,
    isSelected,
    onSelectPlot,
    nowMs,
}) => {
    const cropMeta = getGardenCropById(plot.cropId);
    const isReadyToHarvest = plot.stage === 3 && Boolean(cropMeta);
    const waterStatus = getGardenPlotWaterStatus(plot, nowMs ?? Date.now());
    const needsWater = Boolean(cropMeta && plot.stage > 0 && plot.stage < 3 && waterStatus.canWater);

    return (
        <g
            transform={`translate(${pos.x}, ${pos.y})`}
            className="cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onSelectPlot(plot.plotIndex);
            }}
        >
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

            {/* 텃밭 원목 테두리 프레임 (아이소메트릭 입체 화단) */}
            {/* 좌/우 하단 나무 두께 */}
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
                stroke={isReadyToHarvest ? '#fef08a' : needsWater ? '#bae6fd' : '#78350f'}
                strokeWidth={isReadyToHarvest || needsWater ? '1.8' : '1.5'}
            />
            {/* 안쪽 비옥한 텃밭 흙 (물 줄 시간이 되면 마른 흙 색상으로 표현) */}
            <polygon
                points="0,-15 31,0 0,15 -31,0"
                fill={needsWater ? '#7c4d25' : plot.waterCount > 0 ? '#4a2c18' : '#6b4423'}
                stroke="#3b2212"
                strokeWidth="1"
            />

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

            {/* 텃밭 번호 팻말 */}
            <g transform="translate(-28, -12)">
                <line x1="0" y1="6" x2="0" y2="-6" stroke="#78350f" strokeWidth="2" />
                <rect x="-9" y="-15" width="18" height="11" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
                <text x="0" y="-7.5" textAnchor="middle" fill="#78350f" fontSize="7.5" fontWeight="900">
                    #{plot.plotIndex + 1}
                </text>
            </g>

            {/* 단계별 직관적 플로팅 배지 (8시간 물주기 알림 & 남은 시간 표시) */}
            {isReadyToHarvest && cropMeta ? (
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
            ) : null}
        </g>
    );
};

interface GardenControlPanelProps {
    gardenState: MinihomeGardenState;
    selectedPlotIndex: number;
    onSelectPlot: (idx: number) => void;
    isOwner: boolean;
    isRainWeather: boolean;
    onPlantCrop?: (plotIndex: number, cropId: GardenCropId) => void;
    onWaterPlot?: (plotIndex: number) => boolean | void;
    onHarvestPlot?: (plotIndex: number) => void;
    onClearPlot?: (plotIndex: number) => void;
    onOpenSeedShop?: () => void;
    onOpenWarehouse?: () => void;
}

/**
 * 캔버스 하단 앞마당 텃밭 컨트롤 바 & 내 아지트 농장 창고(씨앗·수확 작물) 패널
 */
export const MinihomeGardenControlPanel: React.FC<GardenControlPanelProps> = ({
    gardenState,
    selectedPlotIndex,
    onSelectPlot,
    isOwner,
    isRainWeather,
    onPlantCrop,
    onWaterPlot,
    onHarvestPlot,
    onClearPlot,
    onOpenSeedShop,
    onOpenWarehouse,
}) => {
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
    const [pushLoading, setPushLoading] = useState<boolean>(false);
    const [pushFeedback, setPushFeedback] = useState<string | null>(null);
    const localNotifiedKeysRef = useRef<Set<string>>(new Set());

    // 1초 간격 실시간 타이머 (8시간 물주기 카운트다운 및 알림 즉시 갱신)
    useEffect(() => {
        const timer = window.setInterval(() => {
            setNowMs(Date.now());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    // 모바일/웹 푸시 구독 상태 확인 및 서비스 워커 등록
    useEffect(() => {
        if (typeof window === 'undefined' || !isOwner) return;
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker
                .register('/sw.js')
                .catch(() => null)
                .then(() => navigator.serviceWorker.ready)
                .then((registration) => registration.pushManager.getSubscription())
                .then((sub) => {
                    setIsPushSubscribed(Boolean(sub));
                })
                .catch(() => {});
        }
    }, [isOwner]);

    // 8시간 도래 작물 로컬 브라우저/서비스워커 즉시 알림 (열려있는 동안 쿨타임 만료 시)
    useEffect(() => {
        if (typeof window === 'undefined' || !isOwner) return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        gardenState.plots.forEach((p) => {
            if (!p.cropId || p.stage <= 0 || p.stage >= 3) return;
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
                                data: { url: '/minihome/me' },
                            })
                        )
                        .catch(() => {});
                }
            }
        });
    }, [gardenState.plots, nowMs, isOwner]);

    const handleToggleFarmPush = async () => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPushFeedback('📱 모바일 홈 화면에 앱(PWA)을 추가하거나 푸시 지원 브라우저에서 이용해 주세요.');
            setTimeout(() => setPushFeedback(null), 4000);
            return;
        }

        try {
            setPushLoading(true);
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
                setPushFeedback('⚠️ 브라우저 알림 권한을 허용해야 8시간 물주기 푸시 알림을 받을 수 있습니다.');
                setTimeout(() => setPushFeedback(null), 4000);
                return;
            }

            await navigator.serviceWorker.register('/sw.js').catch(() => null);
            const registration = await navigator.serviceWorker.ready;
            let sub = await registration.pushManager.getSubscription();

            if (sub) {
                await sub.unsubscribe();
                await fetch('/api/user/push-subscription', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                });
                setIsPushSubscribed(false);
                setPushFeedback('🔕 아지트 농장 모바일 물주기 푸시 알림이 해제되었습니다.');
            } else {
                const keyRes = await fetch('/api/user/push-key', { credentials: 'include' });
                if (keyRes.status === 401) {
                    setPushFeedback('🔒 로그인 후 모바일 물주기 푸시 알림을 설정할 수 있습니다.');
                    setTimeout(() => setPushFeedback(null), 4000);
                    return;
                }
                const keyData = await keyRes.json();
                if (!keyData?.publicKey) {
                    throw new Error('VAPID public key load failed');
                }
                const convertedKey = urlBase64ToUint8Array(keyData.publicKey);
                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedKey,
                });

                const saveRes = await fetch('/api/user/push-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ subscription: sub.toJSON() }),
                });
                if (!saveRes.ok) {
                    throw new Error('Failed to save push subscription');
                }
                setIsPushSubscribed(true);
                setPushFeedback('🔔 모바일 물주기 푸시 알림 ON! 8시간마다 물 줄 시간이 되면 알려드려요.');
            }
        } catch (err) {
            console.error('Farm push toggle error:', err);
            setPushFeedback('⚠️ 푸시 알림 설정 중 오류가 발생했습니다. 로그인 상태를 확인해 주세요.');
        } finally {
            setPushLoading(false);
            setTimeout(() => setPushFeedback(null), 4500);
        }
    };

    const activePlot =
        gardenState.plots.find((p) => p.plotIndex === selectedPlotIndex) || gardenState.plots[0];
    const activeCropMeta = getGardenCropById(activePlot?.cropId);
    const activeWaterStatus = getGardenPlotWaterStatus(activePlot, nowMs);
    const totalSeeds = Object.values(gardenState.seedCounts || {}).reduce((acc, v) => acc + v, 0);

    const waterReadyPlots = gardenState.plots.filter((p) => {
        const st = getGardenPlotWaterStatus(p, nowMs);
        return st.isPlanted && !st.isHarvestReady && st.canWater;
    });

    return (
        <div className="w-full mt-2 bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-emerald-950/95 text-white px-3.5 sm:px-5 py-3.5 rounded-2xl shadow-lg border border-emerald-700/60 space-y-3 shrink-0">
            {/* 1행: 선택된 텃밭 이랑 번호 탭 + 모바일 푸시 알림 / 씨앗 상점 / 농장 창고 바로가기 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px]">
                        🌿 마당 텃밭
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[10px] font-extrabold">
                        💧 하루 3번 (8시간 간격 물주기)
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                        {gardenState.plots.map((p) => {
                            const cMeta = getGardenCropById(p.cropId);
                            const active = p.plotIndex === selectedPlotIndex;
                            const pWater = getGardenPlotWaterStatus(p, nowMs);
                            return (
                                <button
                                    key={`plot-tab-${p.plotIndex}`}
                                    type="button"
                                    onClick={() => onSelectPlot(p.plotIndex)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                        active
                                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                                            : pWater.canWater
                                              ? 'bg-sky-600/90 text-white ring-1 ring-sky-300 animate-pulse'
                                              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    <span>#{p.plotIndex + 1}</span>
                                    <span>{cMeta ? cMeta.emoji : '🌱'}</span>
                                    {pWater.isHarvestReady && <span className="text-[10px]">🧺</span>}
                                    {pWater.canWater && <span className="text-[10px]">💧</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {isRainWeather && (
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[11px] font-bold">
                            🌧️ 단비가 내려 작물이 싱그럽게 자라요!
                        </span>
                    )}
                    {isOwner && (
                        <button
                            type="button"
                            onClick={handleToggleFarmPush}
                            disabled={pushLoading}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                isPushSubscribed
                                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                                    : 'bg-slate-800 hover:bg-slate-700 text-sky-200 border border-sky-400/50'
                            }`}
                            title="모바일(앱 설치 시) 8시간마다 물주기 푸시 알림 받기"
                        >
                            <span>{isPushSubscribed ? '🔔 물주기 푸시 ON' : '🔕 모바일 물주기 알림 켜기'}</span>
                        </button>
                    )}
                    {isOwner && onOpenSeedShop && (
                        <button
                            type="button"
                            onClick={onOpenSeedShop}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                            <span>🎁 씨앗 상점 (0원)</span>
                        </button>
                    )}
                    {isOwner && onOpenWarehouse && (
                        <button
                            type="button"
                            onClick={onOpenWarehouse}
                            className="px-2.5 py-1 rounded-lg bg-amber-400/90 hover:bg-amber-300 text-slate-950 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                            <span>🏚️ 농장 창고 ({totalSeeds + gardenState.totalHarvested})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 푸시 알림 설정 피드백 메시지 */}
            {pushFeedback && (
                <div className="px-3 py-2 rounded-xl bg-sky-950/90 border border-sky-400/50 text-sky-100 text-xs font-bold flex items-center justify-between gap-2">
                    <span>{pushFeedback}</span>
                </div>
            )}

            {/* 8시간 경과 물주기 알림 배너 (물을 줄 수 있는 작물이 있을 때 즉시 노출) */}
            {isOwner && waterReadyPlots.length > 0 && (
                <div className="px-3 py-2 rounded-xl bg-sky-500/20 border border-sky-400/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-sky-200">
                        <span className="animate-bounce">💧</span>
                        <span>
                            물주기 알림! 8시간이 지나 지금 물을 줄 수 있는 작물이 {waterReadyPlots.length}개 있습니다!
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {waterReadyPlots.map((wp) => {
                            const wpMeta = getGardenCropById(wp.cropId);
                            return (
                                <button
                                    key={`quick-water-${wp.plotIndex}`}
                                    type="button"
                                    onClick={() => {
                                        onSelectPlot(wp.plotIndex);
                                        if (onWaterPlot) onWaterPlot(wp.plotIndex);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-[11px] font-black cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                                >
                                    <span>
                                        💧 #{wp.plotIndex + 1} {wpMeta?.emoji} {wpMeta?.shortName} 물주기
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2행: 선택된 이랑 상세 상태 & 씨앗 심기 / 물주기(8시간 간격) / 수확하기 액션 */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-black text-emerald-200 flex items-center gap-1.5 flex-wrap">
                        <span>[{activePlot.plotIndex + 1}번 텃밭 이랑]</span>
                        {activeCropMeta ? (
                            <>
                                <span className="text-white">
                                    {activeCropMeta.emoji} {activeCropMeta.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px]">
                                    {activeCropMeta.stageLabels[activePlot.stage]} ({activePlot.stage}/3단계 · 물주기 {activePlot.waterCount}/3회)
                                </span>
                                {activePlot.stage < 3 && (
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                            activeWaterStatus.canWater
                                                ? 'bg-sky-500 text-slate-950 animate-pulse'
                                                : 'bg-slate-800 border border-slate-600 text-sky-300'
                                        }`}
                                    >
                                        {activeWaterStatus.canWater
                                            ? '💧 지금 물주기 가능!'
                                            : `⏳ 다음 물주기까지 ${activeWaterStatus.shortRemainingLabel}`}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-amber-300">
                                비어있는 텃밭 이랑 · 창고에 보관된 씨앗을 꺼내 심어보세요! (보유 씨앗 총 {totalSeeds}개)
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                        {activeCropMeta
                            ? `${activeCropMeta.description} (하루 3번, 8시간마다 물을 주면 총 3단계로 자라나 수확할 수 있습니다.)`
                            : '상점에서 작물 씨앗을 0원에 구매하면 농장 창고에 들어갑니다. 씨앗을 심고 8시간마다 하루 3번 물을 주어 수확해보세요.'}
                    </p>
                </div>

                {/* 주인 전용 조작 버튼 */}
                {isOwner ? (
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {!activeCropMeta ? (
                            GARDEN_CROP_CATALOG.map((crop) => {
                                const seedQty = gardenState.seedCounts?.[crop.cropId] || 0;
                                return (
                                    <button
                                        key={crop.cropId}
                                        type="button"
                                        onClick={() => onPlantCrop && onPlantCrop(activePlot.plotIndex, crop.cropId)}
                                        data-screenshot-click="action"
                                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                            seedQty > 0
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-emerald-500/40'
                                        }`}
                                    >
                                        <span>{crop.emoji}</span>
                                        <span>{crop.shortName}</span>
                                        <span
                                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                                seedQty > 0
                                                    ? 'bg-slate-950/35 text-amber-300'
                                                    : 'bg-amber-400/20 text-amber-300'
                                            }`}
                                        >
                                            {seedQty > 0 ? `씨앗 ${seedQty}` : '0원구매'}
                                        </span>
                                    </button>
                                );
                            })
                        ) : activePlot.stage < 3 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onWaterPlot && onWaterPlot(activePlot.plotIndex)}
                                    data-screenshot-click="action"
                                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                                        activeWaterStatus.canWater
                                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 ring-2 ring-sky-200 animate-pulse'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
                                    }`}
                                >
                                    {activeWaterStatus.canWater ? (
                                        <span>💧 지금 물주기! ({activePlot.stage + 1}/3단계 성장)</span>
                                    ) : (
                                        <span>⏳ 다음 물주기 {activeWaterStatus.shortRemainingLabel}</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onClearPlot && onClearPlot(activePlot.plotIndex)}
                                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                    🌱 이랑 비우기
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onHarvestPlot && onHarvestPlot(activePlot.plotIndex)}
                                    data-screenshot-click="result"
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md animate-pulse"
                                >
                                    <span>🏚️ {activeCropMeta.shortName} 수확해 창고에 넣기!</span>
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <span className="text-[11px] text-slate-400 font-bold">
                        👀 이웃의 마당 텃밭을 구경 중입니다
                    </span>
                )}
            </div>

            {/* 3행: 내 아지트 농장 창고 현황 (보유 씨앗 & 수확 작물) */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-amber-300 flex items-center gap-1.5">
                        <span>🏚️ 내 농장 창고 보관 현황</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-900/80 border border-emerald-600/50 text-emerald-200 font-extrabold">
                        🌱 씨앗 {totalSeeds}봉지
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-900/60 border border-amber-500/50 text-amber-200 font-extrabold">
                        🧺 수확 작물 {gardenState.totalHarvested}개
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    {GARDEN_CROP_CATALOG.map((crop) => {
                        const seedCount = gardenState.seedCounts?.[crop.cropId] || 0;
                        const harvestCount = gardenState.harvestCounts?.[crop.cropId] || 0;
                        return (
                            <span
                                key={`warehouse-stat-${crop.cropId}`}
                                className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
                                    seedCount > 0 || harvestCount > 0
                                        ? 'bg-emerald-900/70 border-emerald-500/50 text-emerald-100'
                                        : 'bg-slate-800/70 border-slate-700 text-slate-400'
                                }`}
                            >
                                <span>{crop.emoji}</span>
                                <span>{crop.shortName}</span>
                                <span className="text-[10px] text-emerald-300 font-extrabold">
                                    씨앗 {seedCount}
                                </span>
                                <span className="text-slate-500">·</span>
                                <span className="text-[10px] font-black text-amber-300">
                                    작물 {harvestCount}
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
