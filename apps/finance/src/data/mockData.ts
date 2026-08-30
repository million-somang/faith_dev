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

export const MOCK_INDICES: MarketIndex[] = [
    // 한국 (기본)
    { symbol: '^KS11', name: 'KOSPI', value: 2650.12, change: 15.40, rate: 0.58, status: 'up', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 유가증권시장 종합' },
    { symbol: '^KQ11', name: 'KOSDAQ', value: 845.32, change: -3.25, rate: -0.38, status: 'down', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 코스닥 시장' },
    { symbol: '^KS200', name: 'KOSPI 200', value: 355.20, change: 2.10, rate: 0.60, status: 'up', country: 'kr', currency: '₩', flag: '🇰🇷', description: '한국 대표 우량 200개 종목' },
    { symbol: 'KRW=X', name: 'USD/KRW', value: 1375.50, change: -4.20, rate: -0.30, status: 'down', country: 'kr', currency: '₩', flag: '🇰🇷', description: '원/달러 실시간 환율' },

    // 미국
    { symbol: '^GSPC', name: 'S&P 500', value: 5864.67, change: 24.35, rate: 0.42, status: 'up', country: 'us', currency: '$', flag: '🇺🇸', description: '미국 대형주 500개 지수' },
    { symbol: '^IXIC', name: '나스닥 종합', value: 18518.61, change: 115.40, rate: 0.63, status: 'up', country: 'us', currency: '$', flag: '🇺🇸', description: '미국 기술주 중심 지수' },
    { symbol: '^DJI', name: '다우 존스', value: 42863.86, change: -80.12, rate: -0.19, status: 'down', country: 'us', currency: '$', flag: '🇺🇸', description: '다우존스 30 산업평균지수' },
    { symbol: '^SOX', name: '필라델피아 반도체', value: 5310.25, change: 65.80, rate: 1.25, status: 'up', country: 'us', currency: '$', flag: '🇺🇸', description: '글로벌 반도체 대표 지수' },

    // 중국
    { symbol: '000001.SS', name: '상해 종합', value: 3261.56, change: 16.80, rate: 0.52, status: 'up', country: 'cn', currency: '¥', flag: '🇨🇳', description: '상하이 증권거래소 종합' },
    { symbol: '^HSI', name: '홍콩 항셍', value: 20590.15, change: -120.40, rate: -0.58, status: 'down', country: 'cn', currency: 'HK$', flag: '🇭🇰', description: '홍콩 증시 대표 우량주' },
    { symbol: '399001.SZ', name: '심천 종합', value: 10424.30, change: 35.60, rate: 0.34, status: 'up', country: 'cn', currency: '¥', flag: '🇨🇳', description: '선전 증권거래소 성분지수' },

    // 일본
    { symbol: '^N225', name: '닛케이 225', value: 38981.75, change: 72.30, rate: 0.19, status: 'up', country: 'jp', currency: '¥', flag: '🇯🇵', description: '도쿄 증시 대표 225개 종목' },

    // 프랑스
    { symbol: '^FCHI', name: '프랑스 CAC 40', value: 7497.48, change: -12.10, rate: -0.16, status: 'down', country: 'fr', currency: '€', flag: '🇫🇷', description: '파리 증권거래소 40개 우량주' },
    { symbol: '^STOXX50E', name: '유로 스톡스 50', value: 4940.85, change: 8.50, rate: 0.17, status: 'up', country: 'fr', currency: '€', flag: '🇪🇺', description: '유로존 50대 블루칩 지수' },
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
