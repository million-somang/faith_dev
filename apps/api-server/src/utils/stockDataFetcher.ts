import { getStockNameByTicker } from '@faithportal/core-utils';

export interface StockData {
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    status: 'up' | 'down' | 'flat';
    currency: string;
    marketState: string;
}

const MOCK_STOCK_PRICES: Record<string, number> = {
    '005930.KS': 72000,
    '000660.KS': 125000,
    '373220.KS': 420000,
    '035420.KS': 165000,
    'NVDA': 520.30,
    'TSLA': 242.80,
    'AAPL': 185.50,
};

export async function fetchBatchStockData(tickers: string[]): Promise<StockData[]> {
    if (!tickers || tickers.length === 0) return [];

    const uniqueTickers = Array.from(new Set(tickers));

    try {
        return uniqueTickers.map((ticker): StockData => {
            const name = getStockNameByTicker(ticker);
            const basePrice = MOCK_STOCK_PRICES[ticker] || 50000;

            const changePercent = (Math.random() * 6 - 3);
            const change = basePrice * (changePercent / 100);
            const price = basePrice + change;

            let status: 'up' | 'down' | 'flat' = 'flat';
            if (change > 0.01) status = 'up';
            else if (change < -0.01) status = 'down';

            const isKorean = ticker.includes('.KS') || ticker.includes('.KQ');
            const currency = isKorean ? 'KRW' : 'USD';

            return {
                ticker,
                name,
                price,
                change,
                changePercent,
                status,
                currency,
                marketState: 'REGULAR'
            };
        }).filter(stock => stock.ticker);
    } catch (error) {
        console.error('Batch stock data fetch error:', error);
        return [];
    }
}

export async function fetchStockData(ticker: string): Promise<StockData | null> {
    const results = await fetchBatchStockData([ticker]);
    return results.length > 0 ? results[0] : null;
}
