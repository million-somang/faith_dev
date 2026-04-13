// SVG 기반 미니 스파크라인 차트
interface SparklineChartProps {
    data: number[];
    status: 'up' | 'down';
    width?: number;
    height?: number;
}

export default function SparklineChart({ data, status, width = 120, height = 40 }: SparklineChartProps) {
    if (!data || data.length < 2) return null;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((val - min) / range) * chartHeight;
        return `${x},${y}`;
    }).join(' ');
    
    // 영역 채우기 경로
    const firstX = padding;
    const lastX = padding + chartWidth;
    const areaPath = `M${firstX},${padding + chartHeight} L${points.split(' ').map(p => p).join(' L')} L${lastX},${padding + chartHeight} Z`;
    
    const color = status === 'up' ? '#dc2626' : '#2563eb';
    const fillColor = status === 'up' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(37, 99, 235, 0.08)';
    
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <path d={areaPath} fill={fillColor} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
