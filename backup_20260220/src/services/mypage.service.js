// MyPage Service Layer
// Handles all mypage-related database operations
// Date: 2026-01-26
export class MyPageService {
    db;
    constructor(db) {
        this.db = db;
    }
    // ===== 뉴스 키워드 관리 =====
    async addKeywordSubscription(userId, keyword) {
        await this.db
            .prepare(`
        INSERT INTO user_keywords (user_id, keyword)
        VALUES (?, ?)
      `)
            .bind(userId, keyword)
            .run();
    }
    async getKeywordSubscriptions(userId) {
        const result = await this.db
            .prepare(`
        SELECT id, user_id, keyword
        FROM user_keywords
        WHERE user_id = ?
        ORDER BY id DESC
      `)
            .bind(userId)
            .all();
        return result.results;
    }
    async removeKeywordSubscription(userId, keywordId) {
        await this.db
            .prepare(`
        DELETE FROM user_keywords
        WHERE id = ? AND user_id = ?
      `)
            .bind(keywordId, userId)
            .run();
    }
    // ===== 뉴스 북마크 =====
    async addNewsBookmark(userId, newsId) {
        await this.db
            .prepare(`
        INSERT INTO bookmarks (user_id, news_id)
        VALUES (?, ?)
      `)
            .bind(userId, newsId)
            .run();
    }
    async getNewsBookmarks(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [bookmarks, totalResult] = await Promise.all([
            this.db
                .prepare(`
          SELECT 
            b.id,
            b.user_id,
            b.news_id,
            n.title,
            n.category,
            n.summary,
            n.link
          FROM bookmarks b
          LEFT JOIN news n ON b.news_id = n.id
          WHERE b.user_id = ?
          ORDER BY b.id DESC
          LIMIT ? OFFSET ?
        `)
                .bind(userId, limit, offset)
                .all(),
            this.db
                .prepare(`SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?`)
                .bind(userId)
                .first()
        ]);
        return {
            bookmarks: bookmarks.results,
            total: totalResult?.count || 0
        };
    }
    async removeNewsBookmark(userId, newsId) {
        await this.db
            .prepare(`
        DELETE FROM bookmarks
        WHERE user_id = ? AND news_id = ?
      `)
            .bind(userId, newsId)
            .run();
    }
    // ===== 뉴스 읽음 표시 =====
    async markNewsAsRead(userId, newsId) {
        await this.db
            .prepare(`
        INSERT INTO user_news_read (user_id, news_id)
        VALUES (?, ?)
        ON CONFLICT(user_id, news_id) DO NOTHING
      `)
            .bind(userId, newsId)
            .run();
    }
    // ===== 구독 키워드별 뉴스 조회 =====
    async getNewsByKeyword(userId, keyword, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const [news, totalResult] = await Promise.all([
            this.db
                .prepare(`
          SELECT 
            n.id,
            n.title,
            n.summary,
            n.content,
            n.category,
            n.link,
            n.image_url,
            n.publisher,
            n.pub_date,
            n.created_at,
            CASE WHEN r.news_id IS NOT NULL THEN 1 ELSE 0 END as is_read,
            CASE WHEN b.news_id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
          FROM news n
          LEFT JOIN user_news_read r ON n.id = r.news_id AND r.user_id = ?
          LEFT JOIN bookmarks b ON n.id = b.news_id AND b.user_id = ?
          WHERE (
            n.title LIKE ? OR 
            n.summary LIKE ? OR
            n.content LIKE ?
          )
          ORDER BY n.created_at DESC
          LIMIT ? OFFSET ?
        `)
                .bind(userId, userId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, limit, offset)
                .all(),
            this.db
                .prepare(`
          SELECT COUNT(*) as count FROM news
          WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?
        `)
                .bind(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
                .first()
        ]);
        return {
            news: news.results,
            total: totalResult?.count || 0
        };
    }
    async getNewsByMyKeywords(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const keywords = await this.getKeywordSubscriptions(userId);
        if (keywords.length === 0) {
            return { news: [], total: 0 };
        }
        const keywordConditions = keywords.map(() => `(n.title LIKE ? OR n.summary LIKE ? OR n.description LIKE ? OR n.tags LIKE ?)`).join(' OR ');
        const countConditions = keywords.map(() => `(title LIKE ? OR summary LIKE ? OR description LIKE ? OR tags LIKE ?)`).join(' OR ');
        const bindParams = [userId, userId];
        keywords.forEach(kw => {
            const pattern = `%${kw.keyword}%`;
            // title, summary, description, tags 4개 필드에 대해 바인딩
            bindParams.push(pattern, pattern, pattern, pattern);
        });
        bindParams.push(limit, offset);
        const countBindParams = [];
        keywords.forEach(kw => {
            const pattern = `%${kw.keyword}%`;
            countBindParams.push(pattern, pattern, pattern, pattern);
        });
        console.log('[Debug SQL] keywords count:', keywords.length);
        console.log('[Debug SQL] bindParams length:', bindParams.length);
        try {
            const [news, totalResult] = await Promise.all([
                this.db
                    .prepare(`
            SELECT 
              n.id, n.title, n.summary, n.link, n.category, n.source, n.thumbnail,
              n.author, n.published_at, n.created_at, n.view_count, n.popularity_score,
              r.read_at, b.id as bookmark_id
            FROM news n
            LEFT JOIN user_news_read r ON n.id = r.news_id AND r.user_id = ?
            LEFT JOIN bookmarks b ON n.id = b.news_id AND b.user_id = ?
            WHERE ${keywordConditions}
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
          `)
                    .bind(...bindParams)
                    .all(),
                this.db
                    .prepare(`
            SELECT COUNT(*) as count FROM news
            WHERE ${countConditions}
          `)
                    .bind(...countBindParams)
                    .first()
            ]);
            return {
                news: news?.results || [],
                total: totalResult?.count || 0
            };
        }
        catch (error) {
            console.error('[Debug SQL Error] getNewsByMyKeywords 쿼리 실패:', error);
            throw error;
        }
    }
    // ===== 주식 관심 종목 관리 =====
    async addWatchlistStock(userId, stockSymbol, stockName, marketType, targetPrice, memo) {
        await this.db
            .prepare(`
        INSERT INTO user_watchlist_stocks (
          user_id, stock_symbol, stock_name, market_type, target_price, memo
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, stock_symbol) DO UPDATE 
        SET target_price = excluded.target_price, memo = excluded.memo
      `)
            .bind(userId, stockSymbol, stockName, marketType, targetPrice, memo)
            .run();
    }
    async getWatchlistStocks(userId) {
        const result = await this.db
            .prepare(`
        SELECT 
          id, user_id, stock_symbol, stock_name, 
          market_type, target_price, memo, added_at
        FROM user_watchlist_stocks
        WHERE user_id = ?
        ORDER BY added_at DESC
      `)
            .bind(userId)
            .all();
        return result.results;
    }
    async updateWatchlistStock(userId, stockId, targetPrice, memo) {
        await this.db
            .prepare(`
        UPDATE user_watchlist_stocks
        SET target_price = ?, memo = ?
        WHERE id = ? AND user_id = ?
      `)
            .bind(targetPrice, memo, stockId, userId)
            .run();
    }
    async removeWatchlistStock(userId, stockId) {
        await this.db
            .prepare(`
        DELETE FROM user_watchlist_stocks
        WHERE id = ? AND user_id = ?
      `)
            .bind(stockId, userId)
            .run();
    }
    // ===== 주식 알림 =====
    async addStockAlert(userId, stockSymbol, alertType, targetPrice) {
        await this.db
            .prepare(`
        INSERT INTO user_stock_alerts (
          user_id, stock_symbol, alert_type, target_price
        )
        VALUES (?, ?, ?, ?)
      `)
            .bind(userId, stockSymbol, alertType, targetPrice)
            .run();
    }
    async getStockAlerts(userId) {
        const result = await this.db
            .prepare(`
        SELECT 
          a.id, a.user_id, a.stock_symbol, w.stock_name,
          a.alert_type, a.target_price, a.is_triggered, 
          a.triggered_at, a.created_at
        FROM user_stock_alerts a
        LEFT JOIN user_watchlist_stocks w 
          ON a.stock_symbol = w.stock_symbol AND a.user_id = w.user_id
        WHERE a.user_id = ? AND a.is_triggered = 0
        ORDER BY a.created_at DESC
      `)
            .bind(userId)
            .all();
        return result.results;
    }
    async deleteStockAlert(userId, alertId) {
        await this.db
            .prepare(`
        DELETE FROM user_stock_alerts
        WHERE id = ? AND user_id = ?
      `)
            .bind(alertId, userId)
            .run();
    }
    async getWatchlistStats(userId) {
        const distributionResult = await this.db
            .prepare(`
        SELECT 
          COUNT(*) as total_stocks,
          SUM(CASE WHEN market_type = 'US' THEN 1 ELSE 0 END) as us_count,
          SUM(CASE WHEN market_type = 'KR' THEN 1 ELSE 0 END) as kr_count
        FROM user_watchlist_stocks
        WHERE user_id = ?
      `)
            .bind(userId)
            .first();
        const dist = distributionResult;
        return {
            total_stocks: dist?.total_stocks || 0,
            market_distribution: {
                US: dist?.us_count || 0,
                KR: dist?.kr_count || 0
            },
            overall_change_percent: 0,
            top_gainer: undefined,
            top_loser: undefined
        };
    }
    // ===== 게임 점수 =====
    async saveGameScore(userId, gameType, score, gameData) {
        // 점수 저장
        await this.db
            .prepare(`
        INSERT INTO user_game_scores (user_id, game_type, score, game_data)
        VALUES (?, ?, ?, ?)
      `)
            .bind(userId, gameType, score, gameData ? JSON.stringify(gameData) : null)
            .run();
        // 순위 계산
        const rankResult = await this.db
            .prepare(`
        SELECT 
          COUNT(*) + 1 as rank,
          (SELECT COUNT(DISTINCT user_id) FROM user_game_scores WHERE game_type = ?) as total_players
        FROM (
          SELECT user_id, MAX(score) as max_score
          FROM user_game_scores
          WHERE game_type = ?
          GROUP BY user_id
        ) scores
        WHERE max_score > ?
      `)
            .bind(gameType, gameType, score)
            .first();
        const rank = rankResult?.rank || 1;
        const totalPlayers = rankResult?.total_players || 1;
        const percentile = ((rank / totalPlayers) * 100).toFixed(1);
        return { rank, percentile: parseFloat(percentile) };
    }
    async getGameStats(userId, gameType) {
        console.log('🎮 [마이페이지] getGameStats 호출:', { userId, gameType });
        // 사용자가 실제로 플레이한 게임 타입만 조회
        let query = `
      SELECT DISTINCT game_type
      FROM user_game_scores
      WHERE user_id = ?
    `;
        const params = [userId];
        if (gameType) {
            query += ` AND game_type = ?`;
            params.push(gameType);
        }
        query += ` ORDER BY game_type`;
        const gamesResult = await this.db
            .prepare(query)
            .bind(...params)
            .all();
        console.log('🔍 [마이페이지] DB 쿼리 결과:', gamesResult);
        console.log('📊 [마이페이지] gamesResult.results:', gamesResult.results);
        const games = (gamesResult.results || []).map((row) => row.game_type);
        console.log('🎯 [마이페이지] 사용자가 플레이한 게임 목록:', games);
        const stats = {};
        for (const gameType of games) {
            console.log(`🔍 [마이페이지] ${gameType} 통계 조회 중...`);
            const result = await this.db
                .prepare(`
          SELECT 
            MAX(score) as best_score,
            AVG(score) as average_score,
            COUNT(*) as play_count,
            MAX(played_at) as last_played
          FROM user_game_scores
          WHERE user_id = ? AND game_type = ?
        `)
                .bind(userId, gameType)
                .first();
            console.log(`📊 [마이페이지] ${gameType} 결과:`, result);
            if (result && result.play_count > 0) {
                const bestScore = result.best_score;
                // 순위 계산
                const rankResult = await this.db
                    .prepare(`
            SELECT 
              COUNT(*) + 1 as rank,
              (SELECT COUNT(DISTINCT user_id) FROM user_game_scores WHERE game_type = ?) as total_players
            FROM (
              SELECT user_id, MAX(score) as max_score
              FROM user_game_scores
              WHERE game_type = ?
              GROUP BY user_id
            ) scores
            WHERE max_score > ?
          `)
                    .bind(gameType, gameType, bestScore)
                    .first();
                const rank = rankResult?.rank || 1;
                const totalPlayers = rankResult?.total_players || 1;
                const percentile = ((rank / totalPlayers) * 100).toFixed(1);
                console.log(`🏆 [마이페이지] ${gameType} 순위:`, { rank, totalPlayers, percentile });
                stats[gameType] = {
                    best_score: bestScore,
                    average_score: Math.round(result.average_score),
                    play_count: result.play_count,
                    rank,
                    percentile: parseFloat(percentile),
                    last_played: result.last_played
                };
            }
            else {
                console.log(`⚠️ [마이페이지] ${gameType} 플레이 기록 없음`);
            }
        }
        console.log('✅ [마이페이지] 전체 통계:', stats);
        return stats;
    }
    async getLeaderboard(gameType, limit = 100, userId) {
        // 리더보드 조회
        const leaderboard = await this.db
            .prepare(`
        SELECT 
          ROW_NUMBER() OVER (ORDER BY max_score DESC) as rank,
          user_id,
          u.name as user_name,
          max_score as score,
          played_at
        FROM (
          SELECT 
            user_id,
            MAX(score) as max_score,
            MAX(played_at) as played_at
          FROM user_game_scores
          WHERE game_type = ?
          GROUP BY user_id
        ) scores
        JOIN users u ON scores.user_id = u.id
        ORDER BY max_score DESC
        LIMIT ?
      `)
            .bind(gameType, limit)
            .all();
        const totalPlayersResult = await this.db
            .prepare(`SELECT COUNT(DISTINCT user_id) as count FROM user_game_scores WHERE game_type = ?`)
            .bind(gameType)
            .first();
        const entries = leaderboard.results.map(row => ({
            rank: row.rank,
            user_id: row.user_id,
            user_name: row.user_name,
            score: row.score,
            played_at: row.played_at,
            is_current_user: userId ? row.user_id === userId : false
        }));
        // 현재 사용자 순위 조회
        let userRank;
        if (userId) {
            const userBestScore = await this.db
                .prepare(`SELECT MAX(score) as max_score FROM user_game_scores WHERE user_id = ? AND game_type = ?`)
                .bind(userId, gameType)
                .first();
            if (userBestScore && userBestScore.max_score) {
                const rankResult = await this.db
                    .prepare(`
            SELECT COUNT(*) + 1 as rank
            FROM (
              SELECT user_id, MAX(score) as max_score
              FROM user_game_scores
              WHERE game_type = ?
              GROUP BY user_id
            ) scores
            WHERE max_score > ?
          `)
                    .bind(gameType, userBestScore.max_score)
                    .first();
                userRank = rankResult?.rank;
            }
        }
        return {
            leaderboard: entries,
            userRank,
            totalPlayers: totalPlayersResult?.count || 0
        };
    }
    async getGameHistory(userId, gameType, page = 1, limit = 10) {
        console.log('📜 [마이페이지] getGameHistory 호출:', { userId, gameType, page, limit });
        const offset = (page - 1) * limit;
        const query = gameType
            ? `WHERE user_id = ? AND game_type = ?`
            : `WHERE user_id = ?`;
        console.log('🔍 [마이페이지] SQL 쿼리:', query);
        const [history, totalResult] = await Promise.all([
            this.db
                .prepare(`
          SELECT id, user_id, game_type, score, game_data, played_at
          FROM user_game_scores
          ${query}
          ORDER BY played_at DESC
          LIMIT ? OFFSET ?
        `)
                .bind(...(gameType ? [userId, gameType, limit, offset] : [userId, limit, offset]))
                .all(),
            this.db
                .prepare(`SELECT COUNT(*) as count FROM user_game_scores ${query}`)
                .bind(...(gameType ? [userId, gameType] : [userId]))
                .first()
        ]);
        console.log('📊 [마이페이지] 히스토리 조회 결과:', {
            count: history.results.length,
            total: totalResult?.count || 0
        });
        console.log('🎮 [마이페이지] 히스토리 상세:', history.results);
        return {
            history: history.results,
            total: totalResult?.count || 0
        };
    }
    async getGameLeaderboard(gameType, limit = 100) {
        // For D1, we need to use a different approach since RANK() window function may not be fully supported
        // We'll calculate rank programmatically
        const result = await this.db
            .prepare(`
        SELECT 
          gs.id, 
          gs.user_id, 
          u.name as user_name, 
          MAX(gs.score) as score,
          MAX(gs.played_at) as played_at
        FROM user_game_scores gs
        LEFT JOIN users u ON gs.user_id = u.id
        WHERE gs.game_type = ?
        GROUP BY gs.user_id
        ORDER BY score DESC
        LIMIT ?
      `)
            .bind(gameType, limit)
            .all();
        // Add rank to each entry
        const leaderboard = result.results.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));
        return leaderboard;
    }
    // ===== 유틸 설정 =====
    async saveUtilSetting(userId, settingKey, settingValue) {
        await this.db
            .prepare(`
        INSERT INTO user_util_settings (user_id, setting_key, setting_value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, setting_key) 
        DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
      `)
            .bind(userId, settingKey, JSON.stringify(settingValue))
            .run();
    }
    async getUtilSettings(userId) {
        const result = await this.db
            .prepare(`
        SELECT setting_key, setting_value
        FROM user_util_settings
        WHERE user_id = ?
      `)
            .bind(userId)
            .all();
        const settings = {};
        for (const row of result.results) {
            settings[row.setting_key] = JSON.parse(row.setting_value);
        }
        return settings;
    }
    // ===== 유틸 히스토리 =====
    async saveUtilHistory(userId, utilType, inputData, resultData) {
        await this.db
            .prepare(`
        INSERT INTO user_util_history (user_id, util_type, input_data, result_data)
        VALUES (?, ?, ?, ?)
      `)
            .bind(userId, utilType, JSON.stringify(inputData), resultData ? JSON.stringify(resultData) : null)
            .run();
    }
    async getUtilHistory(userId, utilType, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const query = utilType
            ? `WHERE user_id = ? AND util_type = ?`
            : `WHERE user_id = ?`;
        const [history, totalResult] = await Promise.all([
            this.db
                .prepare(`
          SELECT id, util_type, input_data, result_data, created_at
          FROM user_util_history
          ${query}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `)
                .bind(...(utilType ? [userId, utilType, limit, offset] : [userId, limit, offset]))
                .all(),
            this.db
                .prepare(`SELECT COUNT(*) as count FROM user_util_history ${query}`)
                .bind(...(utilType ? [userId, utilType] : [userId]))
                .first()
        ]);
        return {
            history: history.results.map((row) => ({
                id: row.id,
                util_type: row.util_type,
                input_data: JSON.parse(row.input_data),
                result_data: row.result_data ? JSON.parse(row.result_data) : null,
                created_at: row.created_at
            })),
            total: totalResult?.count || 0
        };
    }
    async deleteUtilHistory(userId, historyId) {
        await this.db
            .prepare(`
        DELETE FROM user_util_history
        WHERE id = ? AND user_id = ?
      `)
            .bind(historyId, userId)
            .run();
    }
}
