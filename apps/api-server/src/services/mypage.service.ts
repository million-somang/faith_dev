import { pool } from '@faithportal/database';

export class MyPageService {
    // ===== News Keywords =====

    static async getKeywords(userId: number) {
        const res = await pool.query(
            'SELECT id, keyword, created_at FROM user_keywords WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return res.rows;
    }

    static async addKeyword(userId: number, keyword: string) {
        await pool.query(
            'INSERT INTO user_keywords (user_id, keyword) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, keyword]
        );
    }

    static async deleteKeyword(userId: number, keywordId: number) {
        await pool.query(
            'DELETE FROM user_keywords WHERE id = $1 AND user_id = $2',
            [keywordId, userId]
        );
    }

    // ===== News Bookmarks =====

    static async getBookmarks(userId: number, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const res = await pool.query(
            `SELECT b.id, b.news_id, n.title, n.summary, n.category, n.published_at, n.link, n.thumbnail
             FROM bookmarks b
             JOIN news n ON b.news_id = n.id
             WHERE b.user_id = $1
             ORDER BY b.id DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const countRes = await pool.query(
            'SELECT COUNT(*) FROM bookmarks WHERE user_id = $1',
            [userId]
        );

        return {
            items: res.rows,
            total: parseInt(countRes.rows[0].count || countRes.rows[0]['COUNT(*)'] || '0')
        };
    }

    static async addBookmark(userId: number, newsId: number) {
        await pool.query(
            'INSERT INTO bookmarks (user_id, news_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, newsId]
        );
    }

    static async deleteBookmark(userId: number, newsId: number) {
        await pool.query(
            'DELETE FROM bookmarks WHERE user_id = $1 AND news_id = $2',
            [userId, newsId]
        );
    }

    // ===== Stock Watchlist =====

    static async getWatchlist(userId: number) {
        const res = await pool.query(
            `SELECT id, stock_symbol, stock_name, market_type, target_price, memo, created_at
             FROM user_watchlist_stocks
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        return res.rows;
    }

    static async addWatchlist(userId: number, data: { symbol: string, name: string, market: string, targetPrice?: number, memo?: string }) {
        await pool.query(
            `INSERT INTO user_watchlist_stocks (user_id, stock_symbol, stock_name, market_type, target_price, memo)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, stock_symbol) DO UPDATE 
             SET target_price = EXCLUDED.target_price, memo = EXCLUDED.memo`,
            [userId, data.symbol, data.name, data.market, data.targetPrice, data.memo]
        );
    }

    static async deleteWatchlist(userId: number, stockId: number) {
        await pool.query(
            'DELETE FROM user_watchlist_stocks WHERE id = $1 AND user_id = $2',
            [stockId, userId]
        );
    }

    // ===== Game Stats =====

    static async getGameStats(userId: number) {
        const res = await pool.query(
            `SELECT game_type, MAX(score) as high_score, COUNT(*) as play_count, MAX(played_at) as last_played
             FROM user_game_scores
             WHERE user_id = $1
             GROUP BY game_type`,
            [userId]
        );
        return res.rows;
    }

    // ===== User Schedules (Today's Biz Agenda) =====

    static async getSchedules(userId: number) {
        const res = await pool.query(
            `SELECT id, schedule_time, schedule_text, created_at
             FROM user_schedules
             WHERE user_id = $1
             ORDER BY schedule_time ASC, id ASC`,
            [userId]
        );
        return res.rows;
    }

    static async addSchedule(userId: number, time: string, text: string) {
        const res = await pool.query(
            `INSERT INTO user_schedules (user_id, schedule_time, schedule_text)
             VALUES ($1, $2, $3)`,
            [userId, time, text]
        );
        return res;
    }

    static async deleteSchedule(userId: number, scheduleId: number) {
        await pool.query(
            'DELETE FROM user_schedules WHERE id = $1 AND user_id = $2',
            [scheduleId, userId]
        );
    }
}
