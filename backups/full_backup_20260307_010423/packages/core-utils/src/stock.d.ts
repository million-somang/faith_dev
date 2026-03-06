export interface StockInfo {
    name: string;
    keywords: string[];
    priority: number;
}
export declare const STOCK_KEYWORDS: Record<string, StockInfo>;
export declare function findRelatedStocks(title?: string, content?: string, tags?: string, maxResults?: number): string[];
export declare function getStockNameByTicker(ticker: string): string;
export declare function getKeywordsByTicker(ticker: string): string[];
//# sourceMappingURL=stock.d.ts.map