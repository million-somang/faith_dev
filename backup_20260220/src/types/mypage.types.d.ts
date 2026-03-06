export interface UserKeywordSubscription {
    id: number;
    user_id: number;
    keyword: string;
    created_at: string;
}
export interface UserNewsBookmark {
    id: number;
    user_id: number;
    news_id: number;
    title: string;
    content: string;
    category: string;
    created_at: string;
    bookmarked_at: string;
}
export interface UserNewsRead {
    id: number;
    user_id: number;
    news_id: number;
    read_at: string;
}
export interface NewsByKeyword {
    keyword: string;
    news: Array<{
        id: number;
        title: string;
        content: string;
        category: string;
        created_at: string;
        is_read: boolean;
        is_bookmarked: boolean;
    }>;
    total: number;
}
export type GameType = 'tetris' | 'snake' | '2048' | 'minesweeper';
export interface UserGameScore {
    id: number;
    user_id: number;
    game_type: GameType;
    score: number;
    game_data?: object;
    played_at: string;
}
export interface GameStats {
    best_score: number;
    average_score: number;
    play_count: number;
    rank: number;
    percentile: number;
    last_played: string;
}
export interface LeaderboardEntry {
    rank: number;
    user_id: number;
    user_name: string;
    score: number;
    played_at: string;
    is_current_user: boolean;
}
export interface UserUtilSetting {
    id: number;
    user_id: number;
    setting_key: string;
    setting_value: object;
    updated_at: string;
}
export interface UserUtilHistory {
    id: number;
    user_id: number;
    util_type: string;
    input_data: object;
    result_data?: object;
    created_at: string;
}
export interface UserWatchlistStock {
    id: number;
    user_id: number;
    stock_symbol: string;
    stock_name: string;
    market_type: 'US' | 'KR';
    target_price?: number;
    memo?: string;
    added_at: string;
    current_price?: number;
    change_percent?: number;
    change_amount?: number;
    volume?: number;
}
export interface StockPrice {
    stock_symbol: string;
    current_price: number;
    change_percent: number;
    change_amount: number;
    volume: number;
    market_cap?: number;
    updated_at: string;
}
export interface StockAlert {
    id: number;
    user_id: number;
    stock_symbol: string;
    stock_name?: string;
    alert_type: 'above' | 'below';
    target_price: number;
    current_price?: number;
    is_triggered: boolean;
    triggered_at?: string;
    created_at: string;
}
export interface WatchlistStats {
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
    };
    top_loser?: {
        symbol: string;
        name: string;
        change_percent: number;
    };
}
//# sourceMappingURL=mypage.types.d.ts.map