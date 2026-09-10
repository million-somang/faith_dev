// 주요 지수 데이터
export interface MarketIndex {
    symbol?: string;
    name: string;
    value: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    country?: 'us' | 'cn' | 'jp' | 'fr' | 'kr';
    currency?: string;
    flag?: string;
    description?: string;
}

export const MOCK_INDICES: MarketIndex[] = [];

// 차트 데이터 인터페이스
export interface ChartDataPoint {
    date: string;
    price: number;
}
