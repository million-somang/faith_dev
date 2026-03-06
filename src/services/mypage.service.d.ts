import { D1Database } from '@cloudflare/workers-types';
import type { UserKeywordSubscription, UserNewsBookmark, UserGameScore, GameStats, LeaderboardEntry, UserWatchlistStock, StockAlert, WatchlistStats } from '../types/mypage.types';
export declare class MyPageService {
    private db;
    constructor(db: D1Database);
    addKeywordSubscription(userId: number, keyword: string): Promise<void>;
    getKeywordSubscriptions(userId: number): Promise<UserKeywordSubscription[]>;
    removeKeywordSubscription(userId: number, keywordId: number): Promise<void>;
    addNewsBookmark(userId: number, newsId: number): Promise<void>;
    getNewsBookmarks(userId: number, page?: number, limit?: number): Promise<{
        bookmarks: UserNewsBookmark[];
        total: number;
    }>;
    removeNewsBookmark(userId: number, newsId: number): Promise<void>;
    markNewsAsRead(userId: number, newsId: number): Promise<void>;
    getNewsByKeyword(userId: number, keyword: string, page?: number, limit?: number): Promise<{
        news: any[];
        total: number;
    }>;
    getNewsByMyKeywords(userId: number, page?: number, limit?: number): Promise<{
        news: any[];
        total: number;
    }>;
    addWatchlistStock(userId: number, stockSymbol: string, stockName: string, marketType: string, targetPrice?: number, memo?: string): Promise<void>;
    getWatchlistStocks(userId: number): Promise<UserWatchlistStock[]>;
    updateWatchlistStock(userId: number, stockId: number, targetPrice?: number, memo?: string): Promise<void>;
    removeWatchlistStock(userId: number, stockId: number): Promise<void>;
    addStockAlert(userId: number, stockSymbol: string, alertType: string, targetPrice: number): Promise<void>;
    getStockAlerts(userId: number): Promise<StockAlert[]>;
    deleteStockAlert(userId: number, alertId: number): Promise<void>;
    getWatchlistStats(userId: number): Promise<WatchlistStats>;
    saveGameScore(userId: number, gameType: string, score: number, gameData?: object): Promise<{
        rank: number;
        percentile: number;
    }>;
    getGameStats(userId: number, gameType?: string): Promise<Record<string, GameStats>>;
    getLeaderboard(gameType: string, limit?: number, userId?: number): Promise<{
        leaderboard: LeaderboardEntry[];
        userRank?: number;
        totalPlayers: number;
    }>;
    getGameHistory(userId: number, gameType?: string, page?: number, limit?: number): Promise<{
        history: UserGameScore[];
        total: number;
    }>;
    getGameLeaderboard(gameType: string, limit?: number): Promise<any[]>;
    saveUtilSetting(userId: number, settingKey: string, settingValue: object): Promise<void>;
    getUtilSettings(userId: number): Promise<Record<string, any>>;
    saveUtilHistory(userId: number, utilType: string, inputData: object, resultData?: object): Promise<void>;
    getUtilHistory(userId: number, utilType?: string, page?: number, limit?: number): Promise<{
        history: any[];
        total: number;
    }>;
    deleteUtilHistory(userId: number, historyId: number): Promise<void>;
}
//# sourceMappingURL=mypage.service.d.ts.map