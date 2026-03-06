export type NewsCategory = 'general' | 'politics' | 'economy' | 'tech' | 'sports' | 'entertainment' | 'stock';
export interface News {
    id: number;
    category: NewsCategory;
    title: string;
    summary?: string;
    link: string;
    image_url?: string;
    publisher?: string;
    pub_date?: string;
    ai_summary?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    ai_processed?: number;
    vote_up: number;
    vote_down: number;
    view_count: number;
    comment_count: number;
    popularity_score: number;
    created_at: string;
    updated_at?: string;
    related_stocks?: string;
}
export interface FetchNewsDTO {
    category: NewsCategory;
    limit?: number;
    offset?: number;
}
export interface CreateNewsDTO {
    category: NewsCategory;
    title: string;
    summary?: string;
    link: string;
    image_url?: string;
    publisher?: string;
    pub_date?: string;
}
//# sourceMappingURL=news.types.d.ts.map