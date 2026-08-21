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

export const SajuRadarChart: React.FC<SajuRadarChartProps> = ({ elements, size = 260 }) => {
    const center = size / 2;
    const radius = size * 0.36;

    // 5각형 각도 (상단 목 0도 시작)
    // 목(상단 -90도), 화(-18도), 토(54도), 금(126도), 수(198도)
    const axes = [
        { key: 'wood', label: '목(木)', color: ELEMENT_CONFIG.wood.color, angle: -90, val: elements.wood },
        { key: 'fire', label: '화(火)', color: ELEMENT_CONFIG.fire.color, angle: -18, val: elements.fire },
        { key: 'earth', label: '토(土)', color: ELEMENT_CONFIG.earth.color, angle: 54, val: elements.earth },
        { key: 'metal', label: '금(金)', color: ELEMENT_CONFIG.metal.color, angle: 126, val: elements.metal },
        { key: 'water', label: '수(水)', color: ELEMENT_CONFIG.water.color, angle: 198, val: elements.water },
    ];

    const getCoord = (angleDeg: number, distance: number) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: center + distance * Math.cos(rad),
            y: center + distance * Math.sin(rad),
        };
    };

    // 데이터 다각형 포인트 계산 (0 ~ 50% 스케일링)
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
                {/* 배경 가이드 5각형 (3단계) */}
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
                            fill={i === 2 ? 'rgba(241, 245, 249, 0.6)' : 'none'}
                            stroke="#E2E8F0"
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
                            stroke="#CBD5E1"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* 실제 데이터 영역 */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(99, 102, 241, 0.25)"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    className="transition-all duration-700 ease-out"
                />

                {/* 데이터 꼭짓점 포인트 & 레이블 */}
                {axes.map((a, i) => {
                    const dist = (a.val / maxVal) * radius * 0.9 + radius * 0.1;
                    const coord = getCoord(a.angle, dist);
                    const labelCoord = getCoord(a.angle, radius + 22);

                    return (
                        <g key={i}>
                            {/* 꼭짓점 원 */}
                            <circle
                                cx={coord.x}
                                cy={coord.y}
                                r={4.5}
                                fill={a.color}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                className="shadow-sm"
                            />
                            {/* 레이블 */}
                            <text
                                x={labelCoord.x}
                                y={labelCoord.y - 4}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={a.color}
                                className="text-[11px] font-bold"
                            >
                                {a.label}
                            </text>
                            <text
                                x={labelCoord.x}
                                y={labelCoord.y + 10}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#475569"
                                className="text-[10px] font-extrabold"
                            >
                                {a.val}%
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
export default SajuRadarChart;
