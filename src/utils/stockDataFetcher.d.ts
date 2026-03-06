/**
 * 주식 시세 일괄 조회 유틸리티
 * Yahoo Finance API를 통해 여러 종목의 시세를 한 번에 가져옵니다
 */
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
/**
 * 여러 종목의 시세를 한 번에 조회 (Mock 데이터 사용)
 * @param tickers - 조회할 티커 배열 (예: ['005930.KS', 'AAPL', 'TSLA'])
 * @returns 종목 데이터 배열
 */
export declare function fetchBatchStockData(tickers: string[]): Promise<StockData[]>;
/**
 * 단일 종목 시세 조회 (레거시 호환)
 * @param ticker - 종목 티커
 * @returns 종목 데이터 또는 null
 */
export declare function fetchStockData(ticker: string): Promise<StockData | null>;
//# sourceMappingURL=stockDataFetcher.d.ts.map