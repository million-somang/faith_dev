export declare class MyPageService {
    static getKeywords(userId: number): Promise<any[]>;
    static addKeyword(userId: number, keyword: string): Promise<void>;
    static deleteKeyword(userId: number, keywordId: number): Promise<void>;
    static getBookmarks(userId: number, page?: number, limit?: number): Promise<{
        items: any[];
        total: number;
    }>;
    static addBookmark(userId: number, newsId: number): Promise<void>;
    static deleteBookmark(userId: number, newsId: number): Promise<void>;
    static getWatchlist(userId: number): Promise<any[]>;
    static addWatchlist(userId: number, data: {
        symbol: string;
        name: string;
        market: string;
        targetPrice?: number;
        memo?: string;
    }): Promise<void>;
    static deleteWatchlist(userId: number, stockId: number): Promise<void>;
    static getGameStats(userId: number): Promise<any[]>;
}
//# sourceMappingURL=mypage.service.d.ts.map