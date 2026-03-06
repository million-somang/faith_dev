import { Context } from 'hono';
import type { Bindings, Variables } from '../types/bindings.types';
export declare class MyPageController {
    static addKeyword(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getKeywords(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        keywords: {
            id: number;
            user_id: number;
            keyword: string;
            created_at: string;
        }[];
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static deleteKeyword(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static addBookmark(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getBookmarks(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        bookmarks: {
            id: number;
            user_id: number;
            news_id: number;
            title: string;
            content: string;
            category: string;
            created_at: string;
            bookmarked_at: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static deleteBookmark(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getNewsByKeyword(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        keyword: string;
        news: any[];
        total: number;
        page: number;
        limit: number;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getNewsByMyKeywords(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        news: any[];
        total: number;
        page: number;
        limit: number;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static markNewsAsRead(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static addWatchlistStock(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getWatchlistStocks(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        stocks: {
            id: number;
            user_id: number;
            stock_symbol: string;
            stock_name: string;
            market_type: "US" | "KR";
            target_price?: number | undefined;
            memo?: string | undefined;
            added_at: string;
            current_price?: number | undefined;
            change_percent?: number | undefined;
            change_amount?: number | undefined;
            volume?: number | undefined;
        }[];
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static updateWatchlistStock(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static deleteWatchlistStock(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static addStockAlert(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getStockAlerts(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        alerts: {
            id: number;
            user_id: number;
            stock_symbol: string;
            stock_name?: string | undefined;
            alert_type: "above" | "below";
            target_price: number;
            current_price?: number | undefined;
            is_triggered: boolean;
            triggered_at?: string | undefined;
            created_at: string;
        }[];
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static deleteStockAlert(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getWatchlistStats(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        stats: {
            total_stocks: number;
            market_distribution: {
                US: number;
                KR: number;
            };
            overall_change_percent: number;
            top_gainer?: {
                symbol: string;
                name: string;
                change_percent: number;
            } | undefined;
            top_loser?: {
                symbol: string;
                name: string;
                change_percent: number;
            } | undefined;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static saveGameScore(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
        rank: number;
        percentile: number;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getGameStats(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        stats: {
            [x: string]: {
                best_score: number;
                average_score: number;
                play_count: number;
                rank: number;
                percentile: number;
                last_played: string;
            };
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getGameHistory(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        game_type: string | undefined;
        history: {
            history: {
                id: number;
                user_id: number;
                game_type: import("../types").GameType;
                score: number;
                game_data?: undefined;
                played_at: string;
            }[];
            total: number;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getGameLeaderboard(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        game_type: string;
        leaderboard: any[];
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static saveUtilSetting(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getUtilSettings(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        settings: {
            [x: string]: any;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static saveUtilHistory(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static getUtilHistory(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        history: any[];
        total: number;
        success: true;
        util_type: string | undefined;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    static deleteUtilHistory(c: Context<{
        Bindings: Bindings;
        Variables: Variables;
    }>): Promise<Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
}
//# sourceMappingURL=mypage.controller.d.ts.map