import { getStockNameByTicker } from '@faithportal/core-utils';
const MOCK_STOCK_PRICES = {
    '005930.KS': 72000,
    '000660.KS': 125000,
    '373220.KS': 420000,
    '035420.KS': 165000,
    'NVDA': 520.30,
    'TSLA': 242.80,
    'AAPL': 185.50,
};
export async function fetchBatchStockData(tickers) {
    if (!tickers || tickers.length === 0)
        return [];
    const uniqueTickers = Array.from(new Set(tickers));
    try {
        return uniqueTickers.map((ticker) => {
            const name = getStockNameByTicker(ticker);
            const basePrice = MOCK_STOCK_PRICES[ticker] || 50000;
            const changePercent = (Math.random() * 6 - 3);
            const change = basePrice * (changePercent / 100);
            const price = basePrice + change;
            let status = 'flat';
            if (change > 0.01)
                status = 'up';
            else if (change < -0.01)
                status = 'down';
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
    }
    catch (error) {
        console.error('Batch stock data fetch error:', error);
        return [];
    }
}
export async function fetchStockData(ticker) {
    const results = await fetchBatchStockData([ticker]);
    return results.length > 0 ? results[0] : null;
}
