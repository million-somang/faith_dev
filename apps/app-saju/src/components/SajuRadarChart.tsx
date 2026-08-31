import React from 'react';
import { ELEMENT_CONFIG } from '../utils/sajuCalculator';

interface SajuRadarChartProps {
    elements: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
    };
    size?: number;
}

export default function SajuRadarChart({ elements, size = 260 }: SajuRadarChartProps) {
    const center = size / 2;
    const radius = size * 0.36;

    // 5각형 각도: 목(상단 -90도), 화(-18도), 토(54도), 금(126도), 수(198도)
    const axes = [
        { key: 'wood', label: '木 (목)', color: '#2D5A43', angle: -90, val: elements.wood },
        { key: 'fire', label: '火 (화)', color: '#B9382C', angle: -18, val: elements.fire },
        { key: 'earth', label: '土 (토)', color: '#9E6728', angle: 54, val: elements.earth },
        { key: 'metal', label: '金 (금)', color: '#475569', angle: 126, val: elements.metal },
        { key: 'water', label: '水 (수)', color: '#1E3A8A', angle: 198, val: elements.water },
    ];

    const getCoord = (angleDeg: number, distance: number) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: center + distance * Math.cos(rad),
            y: center + distance * Math.sin(rad),
        };
    };

    const maxVal = Math.max(40, ...axes.map((a) => a.val));
    const polygonPoints = axes
        .map((a) => {
            const dist = (a.val / maxVal) * radius * 0.9 + radius * 0.1;
            const coord = getCoord(a.angle, dist);
            return `${coord.x},${coord.y}`;
        })
        .join(' ');

    return (
        <div className="flex flex-col items-center justify-center p-2">
            <svg width={size} height={size} className="overflow-visible select-none">
                {/* 배경 가이드 5각형 */}
                {[0.33, 0.66, 1].map((scale, i) => {
                    const guidePoints = axes
                        .map((a) => {
                            const coord = getCoord(a.angle, radius * scale);
                            return `${coord.x},${coord.y}`;
                        })
                        .join(' ');
                    return (
                        <polygon
                            key={i}
                            points={guidePoints}
                            fill={i === 2 ? '#FAFAF9' : 'none'}
                            stroke="#E7E5E4"
                            strokeWidth={1}
                            strokeDasharray={i < 2 ? '3 3' : 'none'}
                        />
                    );
                })}

                {/* 중심축 라인 */}
                {axes.map((a, i) => {
                    const outerCoord = getCoord(a.angle, radius);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={outerCoord.x}
                            y2={outerCoord.y}
                            stroke="#D6D3D1"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* 실제 데이터 영역 */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(120, 113, 108, 0.2)"
                    stroke="#57534E"
                    strokeWidth={2}
                    className="transition-all duration-700 ease-out"
                />

                {/* 데이터 포인트 & 레이블 */}
                {axes.map((a, i) => {
                    const dist = (a.val / maxVal) * radius * 0.9 + radius * 0.1;
                    const coord = getCoord(a.angle, dist);
                    const labelCoord = getCoord(a.angle, radius + 22);

                    return (
                        <g key={i}>
                            <circle
                                cx={coord.x}
                                cy={coord.y}
                                r={4}
                                fill={a.color}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                            />
                            <text
                                x={labelCoord.x}
                                y={labelCoord.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="text-[11px] font-semibold"
                                fill={a.color}
                            >
                                {a.label} ({a.val}%)
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
