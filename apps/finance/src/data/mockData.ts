// 주요 지수 데이터
export interface MarketIndex {
    name: string;
    value: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
}

export const MOCK_INDICES: MarketIndex[] = [
    { name: 'KOSPI', value: 2650.12, change: 15.40, rate: 0.58, status: 'up' },
    { name: 'KOSDAQ', value: 845.32, change: -3.25, rate: -0.38, status: 'down' },
    { name: 'USD/KRW', value: 1305.50, change: 8.20, rate: 0.63, status: 'up' },
];

// 인기 종목 데이터
export interface PopularStock {
    rank: number;
    ticker: string;
    name: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
}

export const MOCK_POPULAR_STOCKS: PopularStock[] = [
    { rank: 1, ticker: '005930', name: '삼성전자', price: 72500, change: 1200, rate: 1.68, status: 'up' },
    { rank: 2, ticker: 'NVDA', name: 'NVIDIA', price: 495.50, change: -8.30, rate: -1.65, status: 'down' },
    { rank: 3, ticker: 'TSLA', name: '테슬라', price: 242.84, change: 5.12, rate: 2.15, status: 'up' },
    { rank: 4, ticker: '000660', name: 'SK하이닉스', price: 168000, change: 3500, rate: 2.13, status: 'up' },
    { rank: 5, ticker: 'AAPL', name: '애플', price: 185.64, change: -2.15, rate: -1.14, status: 'down' },
];

// 차트 데이터 생성 (1개월)
export interface ChartDataPoint {
    date: string;
    price: number;
}

export const generateMockChartData = (basePrice: number): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const randomChange = (Math.random() - 0.5) * basePrice * 0.05;
        const price = Math.round((basePrice + randomChange) * 100) / 100;
        data.push({
            date: date.toISOString().split('T')[0],
            price: price,
        });
    }
    return data;
};

// Mock 뉴스
export interface FinanceNews {
    title: string;
    time: string;
}

export const MOCK_FINANCE_NEWS: FinanceNews[] = [
    { title: '코스피, 미국의 매수세에 상승 마감...2650선 돌파', time: '10분 전' },
    { title: '삼성전자, 차세대 AI 칩 개발 발표...주가 급등', time: '1시간 전' },
    { title: '미국 증시 상승 마감, 나스닥 1.2% 상승', time: '2시간 전' },
    { title: '반도체 상황 개선 기대감...SK하이닉스 강세', time: '3시간 전' },
];
