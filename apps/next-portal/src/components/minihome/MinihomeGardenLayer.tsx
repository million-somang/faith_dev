'use client';

import React from 'react';
import {
    GardenCropId,
    GardenPlotItem,
    MinihomeGardenState,
} from '@/types/minihome.types';
import {
    GARDEN_CROP_CATALOG,
    getGardenCropById,
} from '@/data/minihomeCatalogData';

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
 * 6종 작물(당근·고추·방울토마토·청상추·딸기·햇감자)의 4단계 2.5D 아이소메트릭 그래픽 렌더러
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

    // Stage 1: 모든 작물 공통 귀여운 초록 새싹 3포기 + 물방울 반짝임
    if (stage === 1) {
        const positions = [
            { x: -14, y: 1 },
            { x: 0, y: -5 },
            { x: 14, y: -1 },
        ];
        return (
            <g>
                {positions.map((p, idx) => (
                    <g key={`sprout-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                        <ellipse cx="0" cy="2" rx="6" ry="3" fill="#3b2212" />
                        <line x1="0" y1="2" x2="0" y2="-9" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
                        <ellipse cx="-4" cy="-10" rx="5" ry="2.8" transform="rotate(-25 -4 -10)" fill="#4ade80" stroke="#15803d" strokeWidth="1" />
                        <ellipse cx="4" cy="-10" rx="5" ry="2.8" transform="rotate(25 4 -10)" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
                    </g>
                ))}
            </g>
        );
    }

    // Stage 2 (무성한 줄기·꽃) & Stage 3 (수확 가능 결실!)
    const triPositions = [
        { x: -15, y: 2 },
        { x: 0, y: -5 },
        { x: 15, y: 0 },
    ];

    switch (cropId) {
        case 'crop-carrot':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`carrot-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="8" ry="4" fill="#3b2212" />
                            {/* 풍성한 당근 잎사귀 */}
                            <path
                                d="M0,-6 C-8,-18 -12,-24 -5,-26 C-1,-20 0,-12 0,-6 Z"
                                fill="#22c55e"
                                stroke="#15803d"
                                strokeWidth="1"
                            />
                            <path
                                d="M0,-6 C0,-20 4,-28 8,-25 C6,-18 2,-10 0,-6 Z"
                                fill="#4ade80"
                                stroke="#15803d"
                                strokeWidth="1"
                            />
                            <path
                                d="M0,-6 C8,-16 13,-20 9,-23 C4,-18 1,-10 0,-6 Z"
                                fill="#16a34a"
                            />
                            {/* Stage 3일 때 흙 위로 통통하게 올라온 주황빛 당근 몸통 */}
                            {stage === 3 ? (
                                <g>
                                    <path
                                        d="M-6,-6 Q0,-10 6,-6 L4,5 Q0,9 -4,5 Z"
                                        fill="#f97316"
                                        stroke="#c2410c"
                                        strokeWidth="1.2"
                                    />
                                    <line x1="-3" y1="-2" x2="2" y2="-2" stroke="#fdba74" strokeWidth="1.2" strokeLinecap="round" />
                                    <line x1="-2" y1="1" x2="3" y2="1" stroke="#fdba74" strokeWidth="1.2" strokeLinecap="round" />
                                </g>
                            ) : (
                                <ellipse cx="0" cy="-2" rx="4" ry="2.5" fill="#fb923c" />
                            )}
                        </g>
                    ))}
                </g>
            );

        case 'crop-pepper':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`pepper-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="7" ry="3.5" fill="#3b2212" />
                            {/* 고추나무 줄기 및 잎 */}
                            <line x1="0" y1="2" x2="0" y2="-24" stroke="#15803d" strokeWidth="2.8" strokeLinecap="round" />
                            <ellipse cx="-7" cy="-16" rx="7" ry="4" transform="rotate(-20 -7 -16)" fill="#22c55e" stroke="#166534" strokeWidth="1" />
                            <ellipse cx="7" cy="-18" rx="7" ry="4" transform="rotate(20 7 -18)" fill="#4ade80" stroke="#166534" strokeWidth="1" />
                            <ellipse cx="0" cy="-25" rx="8" ry="4.5" fill="#16a34a" stroke="#14532d" strokeWidth="1" />
                            {stage === 3 ? (
                                /* 주렁주렁 열린 새빨간 태양초 고추 */
                                <g>
                                    <path
                                        d="M-5,-14 C-9,-8 -8,-1 -3,0 C-1,-3 -2,-10 -5,-14 Z"
                                        fill="#ef4444"
                                        stroke="#991b1b"
                                        strokeWidth="1"
                                    />
                                    <path
                                        d="M6,-15 C10,-9 9,-2 4,-1 C2,-4 3,-11 6,-15 Z"
                                        fill="#dc2626"
                                        stroke="#991b1b"
                                        strokeWidth="1"
                                    />
                                    <path
                                        d="M0,-20 C3,-14 2,-7 -2,-6 C-3,-9 -2,-16 0,-20 Z"
                                        fill="#ef4444"
                                        stroke="#991b1b"
                                        strokeWidth="1"
                                    />
                                </g>
                            ) : (
                                /* Stage 2: 하얀 고추꽃과 초록 풋고추 */
                                <g>
                                    <circle cx="-5" cy="-15" r="2.8" fill="#ffffff" stroke="#fde047" strokeWidth="1" />
                                    <circle cx="5" cy="-17" r="2.8" fill="#ffffff" stroke="#fde047" strokeWidth="1" />
                                </g>
                            )}
                        </g>
                    ))}
                </g>
            );

        case 'crop-tomato':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`tomato-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="7" ry="3.5" fill="#3b2212" />
                            {/* 나무 지지대 */}
                            <line x1="-2" y1="2" x2="-2" y2="-28" stroke="#92400e" strokeWidth="2" />
                            {/* 토마토 덩굴과 잎 */}
                            <circle cx="0" cy="-12" r="8" fill="#22c55e" />
                            <circle cx="-4" cy="-20" r="7" fill="#16a34a" />
                            <circle cx="4" cy="-19" r="7" fill="#4ade80" />
                            {stage === 3 ? (
                                <g>
                                    <circle cx="-5" cy="-13" r="4.2" fill="#e11d48" stroke="#881337" strokeWidth="1" />
                                    <circle cx="5" cy="-15" r="4.2" fill="#f43f5e" stroke="#881337" strokeWidth="1" />
                                    <circle cx="0" cy="-22" r="4" fill="#e11d48" stroke="#881337" strokeWidth="1" />
                                    <circle cx="-6" cy="-14" r="1.2" fill="#fecdd3" />
                                    <circle cx="4" cy="-16" r="1.2" fill="#fecdd3" />
                                </g>
                            ) : (
                                <g>
                                    <circle cx="-4" cy="-15" r="2.5" fill="#facc15" />
                                    <circle cx="4" cy="-18" r="2.5" fill="#fde047" />
                                </g>
                            )}
                        </g>
                    ))}
                </g>
            );

        case 'crop-lettuce':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`lettuce-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="9" ry="4.5" fill="#3b2212" />
                            <circle cx="-5" cy="-4" r={stage === 3 ? 8 : 5.5} fill="#16a34a" stroke="#14532d" strokeWidth="1" />
                            <circle cx="5" cy="-4" r={stage === 3 ? 8 : 5.5} fill="#22c55e" stroke="#14532d" strokeWidth="1" />
                            <circle cx="0" cy="-9" r={stage === 3 ? 8.5 : 6} fill="#4ade80" stroke="#15803d" strokeWidth="1" />
                            {stage === 3 && (
                                <circle cx="0" cy="-7" r="5" fill="#86efac" opacity="0.85" />
                            )}
                        </g>
                    ))}
                </g>
            );

        case 'crop-strawberry':
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`strawberry-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="8" ry="4" fill="#3b2212" />
                            <ellipse cx="-6" cy="-6" rx="7" ry="4.5" fill="#16a34a" />
                            <ellipse cx="6" cy="-6" rx="7" ry="4.5" fill="#22c55e" />
                            <ellipse cx="0" cy="-11" rx="7.5" ry="4.5" fill="#4ade80" />
                            {stage === 3 ? (
                                <g>
                                    <path
                                        d="M-8,-4 C-4,-8 0,-4 -4,2 C-6,4 -9,-1 -8,-4 Z"
                                        fill="#f43f5e"
                                        stroke="#9f1239"
                                        strokeWidth="1"
                                    />
                                    <path
                                        d="M3,-5 C7,-9 11,-5 7,1 C5,3 2,-2 3,-5 Z"
                                        fill="#e11d48"
                                        stroke="#9f1239"
                                        strokeWidth="1"
                                    />
                                    <circle cx="-5" cy="-2" r="0.8" fill="#fef08a" />
                                    <circle cx="6" cy="-3" r="0.8" fill="#fef08a" />
                                </g>
                            ) : (
                                <g>
                                    <circle cx="-4" cy="-7" r="3" fill="#ffffff" stroke="#fbcfe8" strokeWidth="1" />
                                    <circle cx="-4" cy="-7" r="1.2" fill="#facc15" />
                                    <circle cx="5" cy="-7" r="3" fill="#ffffff" stroke="#fbcfe8" strokeWidth="1" />
                                    <circle cx="5" cy="-7" r="1.2" fill="#facc15" />
                                </g>
                            )}
                        </g>
                    ))}
                </g>
            );

        case 'crop-potato':
        default:
            return (
                <g>
                    {triPositions.map((p, idx) => (
                        <g key={`potato-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
                            <ellipse cx="0" cy="3" rx="9" ry="4.5" fill="#5c3a21" />
                            <circle cx="-4" cy="-10" r="6.5" fill="#15803d" />
                            <circle cx="4" cy="-10" r="6.5" fill="#16a34a" />
                            <circle cx="0" cy="-15" r="6" fill="#22c55e" />
                            {stage === 3 ? (
                                <g>
                                    <ellipse cx="-6" cy="1" rx="5.5" ry="4" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
                                    <ellipse cx="5" cy="2" rx="6" ry="4.2" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
                                    <ellipse cx="0" cy="4" rx="5" ry="3.5" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
                                </g>
                            ) : (
                                <circle cx="0" cy="-16" r="2.5" fill="#e9d5ff" />
                            )}
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
}

/**
 * 개별 2.5D 아이소메트릭 텃밭 원목 화단 & 작물 렌더러
 */
export const GardenPlotIsoNode: React.FC<GardenPlotProps> = ({
    plot,
    pos,
    isSelected,
    onSelectPlot,
}) => {
    const cropMeta = getGardenCropById(plot.cropId);
    const isReadyToHarvest = plot.stage === 3 && Boolean(cropMeta);

    return (
        <g
            transform={`translate(${pos.x}, ${pos.y})`}
            className="cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onSelectPlot(plot.plotIndex);
            }}
        >
            {/* 선택 하이라이트 링 */}
            {isSelected && (
                <ellipse
                    cx="0"
                    cy="2"
                    rx="48"
                    ry="25"
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
            {/* 상단 나무 테두리 */}
            <polygon
                points="0,-19 38,0 0,19 -38,0"
                fill="#b45309"
                stroke="#78350f"
                strokeWidth="1.5"
            />
            {/* 안쪽 비옥한 텃밭 흙 */}
            <polygon
                points="0,-15 31,0 0,15 -31,0"
                fill={plot.waterCount > 0 ? '#4a2c18' : '#6b4423'}
                stroke="#3b2212"
                strokeWidth="1"
            />

            {/* 작물 그래픽 */}
            {renderCropStageGraphic(plot.cropId, plot.stage)}

            {/* 텃밭 번호 팻말 */}
            <g transform="translate(-28, -12)">
                <line x1="0" y1="6" x2="0" y2="-6" stroke="#78350f" strokeWidth="2" />
                <rect x="-9" y="-15" width="18" height="11" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
                <text x="0" y="-7.5" textAnchor="middle" fill="#78350f" fontSize="7.5" fontWeight="900">
                    #{plot.plotIndex + 1}
                </text>
            </g>

            {/* 수확 가능 또는 빈 밭 안내 플로팅 배지 */}
            {isReadyToHarvest && cropMeta ? (
                <g transform="translate(0, -38)">
                    <rect
                        x="-42"
                        y="-11"
                        width="84"
                        height="18"
                        rx="9"
                        fill="#15803d"
                        stroke="#bbf7d0"
                        strokeWidth="1.2"
                    />
                    <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="8.8" fontWeight="900">
                        {cropMeta.emoji} {cropMeta.shortName} 수확!
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
    onWaterPlot?: (plotIndex: number) => void;
    onHarvestPlot?: (plotIndex: number) => void;
    onClearPlot?: (plotIndex: number) => void;
}

/**
 * 캔버스 하단 앞마당 텃밭 컨트롤 바 & 내 아지트 수확 바구니 패널
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
}) => {
    const activePlot =
        gardenState.plots.find((p) => p.plotIndex === selectedPlotIndex) || gardenState.plots[0];
    const activeCropMeta = getGardenCropById(activePlot?.cropId);

    return (
        <div className="w-full mt-2 bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-emerald-950/95 text-white px-3.5 sm:px-5 py-3.5 rounded-2xl shadow-lg border border-emerald-700/60 space-y-3 shrink-0">
            {/* 1행: 선택된 텃밭 이랑 번호 탭 + 현재 작물 상태 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px]">
                        🌿 마당 텃밭
                    </span>
                    <div className="flex items-center gap-1">
                        {gardenState.plots.map((p) => {
                            const cMeta = getGardenCropById(p.cropId);
                            const active = p.plotIndex === selectedPlotIndex;
                            return (
                                <button
                                    key={`plot-tab-${p.plotIndex}`}
                                    type="button"
                                    onClick={() => onSelectPlot(p.plotIndex)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                        active
                                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    <span>#{p.plotIndex + 1}</span>
                                    <span>{cMeta ? cMeta.emoji : '🌱'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {isRainWeather && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[11px] font-bold">
                        🌧️ 단비가 내려 작물이 싱그럽게 자라요!
                    </span>
                )}
            </div>

            {/* 2행: 선택된 이랑 상세 상태 & 씨앗 심기 / 물주기 / 수확하기 액션 */}
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
                                    {activeCropMeta.stageLabels[activePlot.stage]} ({activePlot.stage}/3단계)
                                </span>
                            </>
                        ) : (
                            <span className="text-amber-300">비어있는 텃밭 이랑입니다 · 심고 싶은 야채를 골라보세요!</span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                        {activeCropMeta
                            ? activeCropMeta.description
                            : '당근, 고추, 방울토마토, 청상추, 딸기, 햇감자 중 원하는 작물을 심고 물을 주어 수확해보세요.'}
                    </p>
                </div>

                {/* 주인 전용 조작 버튼 */}
                {isOwner ? (
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {!activeCropMeta ? (
                            GARDEN_CROP_CATALOG.map((crop) => (
                                <button
                                    key={crop.cropId}
                                    type="button"
                                    onClick={() => onPlantCrop && onPlantCrop(activePlot.plotIndex, crop.cropId)}
                                    data-screenshot-click="action"
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                    <span>{crop.emoji}</span>
                                    <span>{crop.shortName} 심기</span>
                                </button>
                            ))
                        ) : activePlot.stage < 3 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onWaterPlot && onWaterPlot(activePlot.plotIndex)}
                                    data-screenshot-click="action"
                                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                    <span>💧 물주기 (쑥쑥 성장!)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onClearPlot && onClearPlot(activePlot.plotIndex)}
                                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                    🌱 다른 작물 심기
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
                                    <span>🧺 {activeCropMeta.shortName} 수확하기!</span>
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

            {/* 3행: 내 아지트 마당 수확 바구니 현황 */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-black text-amber-300 flex items-center gap-1.5">
                    <span>🧺 마당 수확 바구니 (총 {gardenState.totalHarvested}회 수확)</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                    {GARDEN_CROP_CATALOG.map((crop) => {
                        const count = gardenState.harvestCounts[crop.cropId] || 0;
                        return (
                            <span
                                key={`harvest-stat-${crop.cropId}`}
                                className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${
                                    count > 0
                                        ? 'bg-emerald-900/70 border-emerald-500/50 text-emerald-100'
                                        : 'bg-slate-800/70 border-slate-700 text-slate-400'
                                }`}
                            >
                                <span>{crop.emoji}</span>
                                <span>{crop.shortName}</span>
                                <span className="font-black text-amber-300">{count}</span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
