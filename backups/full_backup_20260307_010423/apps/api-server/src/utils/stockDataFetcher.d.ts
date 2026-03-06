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
export declare function fetchBatchStockData(tickers: string[]): Promise<StockData[]>;
export declare function fetchStockData(ticker: string): Promise<StockData | null>;
//# sourceMappingURL=stockDataFetcher.d.ts.map