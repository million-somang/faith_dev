// SVG 기반 미니 스파크라인 차트 (반응형 지원)
interface SparklineChartProps {
    data: number[];
    status: 'up' | 'down';
    width?: number | string;
    height?: number;
    className?: string;
}

export default function SparklineChart({ data, status, width, height = 40, className = '' }: SparklineChartProps) {
    if (!data || data.length < 2) return null;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const baseWidth = typeof width === 'number' ? width : 120;
    const baseHeight = height;
    const padding = 2;
    const chartWidth = baseWidth - padding * 2;
    const chartHeight = baseHeight - padding * 2;
    
    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((val - min) / range) * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    
    // 영역 채우기 경로
    const firstX = padding;
    const lastX = padding + chartWidth;
    const areaPath = `M${firstX},${padding + chartHeight} L${points.split(' ').map(p => p).join(' L')} L${lastX},${padding + chartHeight} Z`;
    
    const color = status === 'up' ? '#dc2626' : '#2563eb';
    const fillColor = status === 'up' ? 'rgba(220, 38, 38, 0.10)' : 'rgba(37, 99, 235, 0.10)';
    
    return (
        <svg 
            width={width ?? '100%'} 
            height={height} 
            viewBox={`0 0 ${baseWidth} ${baseHeight}`}
            preserveAspectRatio="none"
            className={`overflow-visible ${className}`}
        >
            <path d={areaPath} fill={fillColor} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

