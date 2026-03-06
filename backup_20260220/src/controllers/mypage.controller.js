// MyPage Controller
// Handles HTTP requests for mypage features
// Date: 2026-01-26
import { getDB } from '../db/adapter';
import { MyPageService } from '../services/mypage.service';
import { AppError, ErrorCodes } from '../middleware/errors';
import { logger } from '../middleware/logger';
export class MyPageController {
    // ===== 키워드 구독 =====
    static async addKeyword(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { keyword } = await c.req.json();
            if (!keyword || keyword.trim().length === 0) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '키워드를 입력해주세요', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.addKeywordSubscription(user.id, keyword.trim());
            logger.info('Keyword subscription added', { userId: user.id, keyword });
            return c.json({
                success: true,
                message: '키워드가 추가되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to add keyword subscription', error);
            throw error;
        }
    }
    static async getKeywords(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const service = new MyPageService(getDB(c));
            const keywords = await service.getKeywordSubscriptions(user.id);
            return c.json({
                success: true,
                keywords
            });
        }
        catch (error) {
            logger.error('Failed to get keyword subscriptions', error);
            throw error;
        }
    }
    static async deleteKeyword(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const keywordId = parseInt(c.req.param('keywordId'));
            if (isNaN(keywordId)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 키워드 ID입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.removeKeywordSubscription(user.id, keywordId);
            logger.info('Keyword subscription removed', { userId: user.id, keywordId });
            return c.json({
                success: true,
                message: '키워드가 삭제되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to delete keyword subscription', error);
            throw error;
        }
    }
    // ===== 뉴스 북마크 =====
    static async addBookmark(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { news_id } = await c.req.json();
            if (!news_id || isNaN(news_id)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 뉴스 ID입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.addNewsBookmark(user.id, news_id);
            logger.info('News bookmarked', { userId: user.id, newsId: news_id });
            return c.json({
                success: true,
                message: '북마크에 추가되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to add news bookmark', error);
            throw error;
        }
    }
    static async getBookmarks(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '20');
            const service = new MyPageService(getDB(c));
            const { bookmarks, total } = await service.getNewsBookmarks(user.id, page, limit);
            return c.json({
                success: true,
                bookmarks,
                total,
                page,
                limit
            });
        }
        catch (error) {
            logger.error('Failed to get news bookmarks', error);
            throw error;
        }
    }
    static async deleteBookmark(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const newsId = parseInt(c.req.param('newsId'));
            if (isNaN(newsId)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 뉴스 ID입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.removeNewsBookmark(user.id, newsId);
            logger.info('News bookmark removed', { userId: user.id, newsId });
            return c.json({
                success: true,
                message: '북마크가 삭제되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to delete news bookmark', error);
            throw error;
        }
    }
    // ===== 키워드별 뉴스 조회 =====
    static async getNewsByKeyword(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const keyword = c.req.query('keyword');
            if (!keyword) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '키워드를 입력해주세요', 400);
            }
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '10');
            const service = new MyPageService(getDB(c));
            const { news, total } = await service.getNewsByKeyword(user.id, keyword, page, limit);
            return c.json({
                success: true,
                keyword,
                news,
                total,
                page,
                limit
            });
        }
        catch (error) {
            logger.error('Failed to get news by keyword', error);
            throw error;
        }
    }
    static async getNewsByMyKeywords(c) {
        try {
            console.log('[Debug] getNewsByMyKeywords 시작');
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const page = parseInt(c.req.query('page') || '1');
            const offset = parseInt(c.req.query('offset') || '0');
            const limit = parseInt(c.req.query('limit') || '10');
            console.log('[Debug] Params - page:', page, 'offset:', offset, 'limit:', limit);
            // offset이 제공되면 page 계산 (뉴스 페이지 무한 스크롤 지원)
            const calculatedPage = offset > 0 ? Math.floor(offset / limit) + 1 : page;
            console.log('[Debug] calculatedPage:', calculatedPage);
            const service = new MyPageService(getDB(c));
            console.log('[Debug] service 호출 직전');
            const { news, total } = await service.getNewsByMyKeywords(user.id, calculatedPage, limit);
            console.log('[Debug] service 결과 - news:', news.length, 'total:', total);
            return c.json({
                success: true,
                news,
                total,
                page: calculatedPage,
                limit
            });
        }
        catch (error) {
            console.error('[Debug Error] getNewsByMyKeywords 오류:', error);
            logger.error('Failed to get news by my keywords', error);
            throw error;
        }
    }
    // ===== 뉴스 읽음 표시 =====
    static async markNewsAsRead(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { news_id } = await c.req.json();
            if (!news_id || isNaN(news_id)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 뉴스 ID입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.markNewsAsRead(user.id, news_id);
            return c.json({
                success: true,
                message: '읽음으로 표시되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to mark news as read', error);
            throw error;
        }
    }
    // ===== 주식 관심 종목 =====
    static async addWatchlistStock(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { stock_symbol, stock_name, market_type, target_price, memo } = await c.req.json();
            if (!stock_symbol || !stock_name || !market_type) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '종목 정보를 모두 입력해주세요', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.addWatchlistStock(user.id, stock_symbol, stock_name, market_type, target_price, memo);
            logger.info('Stock added to watchlist', { userId: user.id, stockSymbol: stock_symbol });
            return c.json({
                success: true,
                message: '관심 종목에 추가되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to add stock to watchlist', error);
            throw error;
        }
    }
    static async getWatchlistStocks(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const service = new MyPageService(getDB(c));
            const stocks = await service.getWatchlistStocks(user.id);
            return c.json({
                success: true,
                stocks
            });
        }
        catch (error) {
            logger.error('Failed to get watchlist stocks', error);
            throw error;
        }
    }
    static async updateWatchlistStock(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const stockId = parseInt(c.req.param('stockId'));
            if (isNaN(stockId)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 종목 ID입니다', 400);
            }
            const { target_price, memo } = await c.req.json();
            const service = new MyPageService(getDB(c));
            await service.updateWatchlistStock(user.id, stockId, target_price, memo);
            logger.info('Watchlist stock updated', { userId: user.id, stockId });
            return c.json({
                success: true,
                message: '종목 정보가 수정되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to update watchlist stock', error);
            throw error;
        }
    }
    static async deleteWatchlistStock(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const stockId = parseInt(c.req.param('stockId'));
            if (isNaN(stockId)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 종목 ID입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.removeWatchlistStock(user.id, stockId);
            logger.info('Stock removed from watchlist', { userId: user.id, stockId });
            return c.json({
                success: true,
                message: '관심 종목에서 삭제되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to delete watchlist stock', error);
            throw error;
        }
    }
    static async addStockAlert(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { stock_symbol, alert_type, target_price } = await c.req.json();
            if (!stock_symbol || !alert_type || !target_price) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '알림 정보를 모두 입력해주세요', 400);
            }
            if (!['above', 'below'].includes(alert_type)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 알림 타입입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.addStockAlert(user.id, stock_symbol, alert_type, target_price);
            logger.info('Stock alert added', { userId: user.id, stockSymbol: stock_symbol });
            return c.json({
                success: true,
                message: '가격 알림이 설정되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to add stock alert', error);
            throw error;
        }
    }
    static async getStockAlerts(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const service = new MyPageService(getDB(c));
            const alerts = await service.getStockAlerts(user.id);
            return c.json({
                success: true,
                alerts
            });
        }
        catch (error) {
            logger.error('Failed to get stock alerts', error);
            throw error;
        }
    }
    static async deleteStockAlert(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const alertId = parseInt(c.req.param('alertId'));
            if (isNaN(alertId)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, '잘못된 알림 ID입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.deleteStockAlert(user.id, alertId);
            logger.info('Stock alert deleted', { userId: user.id, alertId });
            return c.json({
                success: true,
                message: '알림이 삭제되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to delete stock alert', error);
            throw error;
        }
    }
    static async getWatchlistStats(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const service = new MyPageService(getDB(c));
            const stats = await service.getWatchlistStats(user.id);
            return c.json({
                success: true,
                stats
            });
        }
        catch (error) {
            logger.error('Failed to get watchlist stats', error);
            throw error;
        }
    }
    // ============================================
    // 게임 관련 핸들러
    // ============================================
    static async saveGameScore(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { game_type, score, metadata } = await c.req.json();
            if (!game_type || score === undefined) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, 'game_type과 score는 필수입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            const rankInfo = await service.saveGameScore(user.id, game_type, score, metadata // Service will JSON.stringify
            );
            logger.info('Game score saved', { userId: user.id, gameType: game_type, score });
            return c.json({
                success: true,
                message: '게임 점수가 저장되었습니다',
                rank: rankInfo.rank,
                percentile: rankInfo.percentile
            });
        }
        catch (error) {
            logger.error('Failed to save game score', error);
            throw error;
        }
    }
    static async getGameStats(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const gameType = c.req.query('game_type');
            const service = new MyPageService(getDB(c));
            const stats = await service.getGameStats(user.id, gameType);
            return c.json({
                success: true,
                stats
            });
        }
        catch (error) {
            logger.error('Failed to get game stats', error);
            throw error;
        }
    }
    static async getGameHistory(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const gameType = c.req.query('game_type');
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '20');
            console.log('🎮 [Controller] getGameHistory:', { userId: user.id, gameType, page, limit });
            const service = new MyPageService(getDB(c));
            const history = await service.getGameHistory(user.id, gameType, page, limit);
            return c.json({
                success: true,
                game_type: gameType,
                history
            });
        }
        catch (error) {
            logger.error('Failed to get game history', error);
            throw error;
        }
    }
    static async getGameLeaderboard(c) {
        try {
            const gameType = c.req.query('game_type');
            if (!gameType) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, 'game_type은 필수입니다', 400);
            }
            const limit = parseInt(c.req.query('limit') || '100');
            const service = new MyPageService(getDB(c));
            const leaderboard = await service.getGameLeaderboard(gameType, limit);
            return c.json({
                success: true,
                game_type: gameType,
                leaderboard
            });
        }
        catch (error) {
            logger.error('Failed to get game leaderboard', error);
            throw error;
        }
    }
    // ============================================
    // 유틸 관련 핸들러
    // ============================================
    static async saveUtilSetting(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { util_type, settings } = await c.req.json();
            if (!util_type || !settings) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, 'util_type과 settings는 필수입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.saveUtilSetting(user.id, util_type, // settingKey
            settings // settingValue (will be JSON.stringified in service)
            );
            logger.info('Util setting saved', { userId: user.id, utilType: util_type });
            return c.json({
                success: true,
                message: '설정이 저장되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to save util setting', error);
            throw error;
        }
    }
    static async getUtilSettings(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const service = new MyPageService(getDB(c));
            const settings = await service.getUtilSettings(user.id);
            return c.json({
                success: true,
                settings
            });
        }
        catch (error) {
            logger.error('Failed to get util settings', error);
            throw error;
        }
    }
    static async saveUtilHistory(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const { util_type, input_data, result_data } = await c.req.json();
            if (!util_type || !input_data) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, 'util_type과 input_data는 필수입니다', 400);
            }
            const service = new MyPageService(getDB(c));
            await service.saveUtilHistory(user.id, util_type, input_data, // Already an object, service will JSON.stringify
            result_data // Already an object, service will JSON.stringify
            );
            logger.info('Util history saved', { userId: user.id, utilType: util_type });
            return c.json({
                success: true,
                message: '히스토리가 저장되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to save util history', error);
            throw error;
        }
    }
    static async getUtilHistory(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const utilType = c.req.query('util_type');
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '20');
            const service = new MyPageService(getDB(c));
            const result = await service.getUtilHistory(user.id, utilType, page, limit);
            return c.json({
                success: true,
                util_type: utilType,
                ...result // Contains history and total
            });
        }
        catch (error) {
            logger.error('Failed to get util history', error);
            throw error;
        }
    }
    static async deleteUtilHistory(c) {
        try {
            const user = c.get('user');
            if (!user) {
                throw new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
            }
            const historyId = parseInt(c.req.param('historyId'));
            const service = new MyPageService(getDB(c));
            await service.deleteUtilHistory(user.id, historyId);
            logger.info('Util history deleted', { userId: user.id, historyId });
            return c.json({
                success: true,
                message: '히스토리가 삭제되었습니다'
            });
        }
        catch (error) {
            logger.error('Failed to delete util history', error);
            throw error;
        }
    }
}
