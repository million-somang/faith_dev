// MyPage Controller
// Handles HTTP requests for mypage features
// Date: 2026-01-26

import { Context } from 'hono'
import { MyPageService } from '../services/mypage.service'
import { AppError, ErrorCodes } from '../middleware/errors'
import { logger } from '../middleware/logger'
import type { Bindings } from '../types/bindings.types'

export class MyPageController {
  // ===== 키워드 구독 =====

  static async addKeyword(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { keyword } = await c.req.json()
      
      if (!keyword || keyword.trim().length === 0) {
        throw new AppError('키워드를 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addKeywordSubscription(user.id, keyword.trim())

      logger.info('Keyword subscription added', { userId: user.id, keyword })

      return c.json({
        success: true,
        message: '키워드가 추가되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add keyword subscription', error)
      throw error
    }
  }

  static async getKeywords(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const keywords = await service.getKeywordSubscriptions(user.id)

      return c.json({
        success: true,
        keywords
      })
    } catch (error) {
      logger.error('Failed to get keyword subscriptions', error)
      throw error
    }
  }

  static async deleteKeyword(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const keywordId = parseInt(c.req.param('keywordId'))
      
      if (isNaN(keywordId)) {
        throw new AppError('잘못된 키워드 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.removeKeywordSubscription(user.id, keywordId)

      logger.info('Keyword subscription removed', { userId: user.id, keywordId })

      return c.json({
        success: true,
        message: '키워드가 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete keyword subscription', error)
      throw error
    }
  }

  // ===== 뉴스 북마크 =====

  static async addBookmark(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { news_id } = await c.req.json()
      
      if (!news_id || isNaN(news_id)) {
        throw new AppError('잘못된 뉴스 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addNewsBookmark(user.id, news_id)

      logger.info('News bookmarked', { userId: user.id, newsId: news_id })

      return c.json({
        success: true,
        message: '북마크에 추가되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add news bookmark', error)
      throw error
    }
  }

  static async getBookmarks(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '20')

      const service = new MyPageService(c.env.DB)
      const { bookmarks, total } = await service.getNewsBookmarks(user.id, page, limit)

      return c.json({
        success: true,
        bookmarks,
        total,
        page,
        limit
      })
    } catch (error) {
      logger.error('Failed to get news bookmarks', error)
      throw error
    }
  }

  static async deleteBookmark(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const newsId = parseInt(c.req.param('newsId'))
      
      if (isNaN(newsId)) {
        throw new AppError('잘못된 뉴스 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.removeNewsBookmark(user.id, newsId)

      logger.info('News bookmark removed', { userId: user.id, newsId })

      return c.json({
        success: true,
        message: '북마크가 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete news bookmark', error)
      throw error
    }
  }

  // ===== 키워드별 뉴스 조회 =====

  static async getNewsByKeyword(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const keyword = c.req.query('keyword')
      if (!keyword) {
        throw new AppError('키워드를 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '10')

      const service = new MyPageService(c.env.DB)
      const { news, total } = await service.getNewsByKeyword(user.id, keyword, page, limit)

      return c.json({
        success: true,
        keyword,
        news,
        total,
        page,
        limit
      })
    } catch (error) {
      logger.error('Failed to get news by keyword', error)
      throw error
    }
  }

  // ===== 뉴스 읽음 표시 =====

  static async markNewsAsRead(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { news_id } = await c.req.json()
      
      if (!news_id || isNaN(news_id)) {
        throw new AppError('잘못된 뉴스 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.markNewsAsRead(user.id, news_id)

      return c.json({
        success: true,
        message: '읽음으로 표시되었습니다'
      })
    } catch (error) {
      logger.error('Failed to mark news as read', error)
      throw error
    }
  }

  // ===== 주식 관심 종목 =====

  static async addWatchlistStock(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { stock_symbol, stock_name, market_type, target_price, memo } = await c.req.json()
      
      if (!stock_symbol || !stock_name || !market_type) {
        throw new AppError('종목 정보를 모두 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addWatchlistStock(
        user.id, 
        stock_symbol, 
        stock_name, 
        market_type, 
        target_price, 
        memo
      )

      logger.info('Stock added to watchlist', { userId: user.id, stockSymbol: stock_symbol })

      return c.json({
        success: true,
        message: '관심 종목에 추가되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add stock to watchlist', error)
      throw error
    }
  }

  static async getWatchlistStocks(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const stocks = await service.getWatchlistStocks(user.id)

      return c.json({
        success: true,
        stocks
      })
    } catch (error) {
      logger.error('Failed to get watchlist stocks', error)
      throw error
    }
  }

  static async updateWatchlistStock(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const stockId = parseInt(c.req.param('stockId'))
      if (isNaN(stockId)) {
        throw new AppError('잘못된 종목 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const { target_price, memo } = await c.req.json()

      const service = new MyPageService(c.env.DB)
      await service.updateWatchlistStock(user.id, stockId, target_price, memo)

      logger.info('Watchlist stock updated', { userId: user.id, stockId })

      return c.json({
        success: true,
        message: '종목 정보가 수정되었습니다'
      })
    } catch (error) {
      logger.error('Failed to update watchlist stock', error)
      throw error
    }
  }

  static async deleteWatchlistStock(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const stockId = parseInt(c.req.param('stockId'))
      if (isNaN(stockId)) {
        throw new AppError('잘못된 종목 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.removeWatchlistStock(user.id, stockId)

      logger.info('Stock removed from watchlist', { userId: user.id, stockId })

      return c.json({
        success: true,
        message: '관심 종목에서 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete watchlist stock', error)
      throw error
    }
  }

  static async addStockAlert(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { stock_symbol, alert_type, target_price } = await c.req.json()
      
      if (!stock_symbol || !alert_type || !target_price) {
        throw new AppError('알림 정보를 모두 입력해주세요', 400, ErrorCodes.VALIDATION_ERROR)
      }

      if (!['above', 'below'].includes(alert_type)) {
        throw new AppError('잘못된 알림 타입입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.addStockAlert(user.id, stock_symbol, alert_type, target_price)

      logger.info('Stock alert added', { userId: user.id, stockSymbol: stock_symbol })

      return c.json({
        success: true,
        message: '가격 알림이 설정되었습니다'
      })
    } catch (error) {
      logger.error('Failed to add stock alert', error)
      throw error
    }
  }

  static async getStockAlerts(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const alerts = await service.getStockAlerts(user.id)

      return c.json({
        success: true,
        alerts
      })
    } catch (error) {
      logger.error('Failed to get stock alerts', error)
      throw error
    }
  }

  static async deleteStockAlert(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const alertId = parseInt(c.req.param('alertId'))
      if (isNaN(alertId)) {
        throw new AppError('잘못된 알림 ID입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.deleteStockAlert(user.id, alertId)

      logger.info('Stock alert deleted', { userId: user.id, alertId })

      return c.json({
        success: true,
        message: '알림이 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete stock alert', error)
      throw error
    }
  }

  static async getWatchlistStats(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const stats = await service.getWatchlistStats(user.id)

      return c.json({
        success: true,
        stats
      })
    } catch (error) {
      logger.error('Failed to get watchlist stats', error)
      throw error
    }
  }

  // ============================================
  // 게임 관련 핸들러
  // ============================================

  static async saveGameScore(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { game_type, score, metadata } = await c.req.json()

      if (!game_type || score === undefined) {
        throw new AppError('game_type과 score는 필수입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      const rankInfo = await service.saveGameScore(
        user.id,
        game_type,
        score,
        metadata  // Service will JSON.stringify
      )

      logger.info('Game score saved', { userId: user.id, gameType: game_type, score })

      return c.json({
        success: true,
        message: '게임 점수가 저장되었습니다',
        rank: rankInfo.rank,
        percentile: rankInfo.percentile
      })
    } catch (error) {
      logger.error('Failed to save game score', error)
      throw error
    }
  }

  static async getGameStats(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const gameType = c.req.query('game_type')

      const service = new MyPageService(c.env.DB)
      const stats = await service.getGameStats(user.id, gameType)

      return c.json({
        success: true,
        stats
      })
    } catch (error) {
      logger.error('Failed to get game stats', error)
      throw error
    }
  }

  static async getGameHistory(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const gameType = c.req.query('game_type')
      const limit = parseInt(c.req.query('limit') || '20')

      const service = new MyPageService(c.env.DB)
      const history = await service.getGameHistory(user.id, gameType, limit)

      return c.json({
        success: true,
        game_type: gameType,
        history
      })
    } catch (error) {
      logger.error('Failed to get game history', error)
      throw error
    }
  }

  static async getGameLeaderboard(c: Context<{ Bindings: Bindings }>) {
    try {
      const gameType = c.req.query('game_type')
      if (!gameType) {
        throw new AppError('game_type은 필수입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const limit = parseInt(c.req.query('limit') || '100')

      const service = new MyPageService(c.env.DB)
      const leaderboard = await service.getGameLeaderboard(gameType, limit)

      return c.json({
        success: true,
        game_type: gameType,
        leaderboard
      })
    } catch (error) {
      logger.error('Failed to get game leaderboard', error)
      throw error
    }
  }

  // ============================================
  // 유틸 관련 핸들러
  // ============================================

  static async saveUtilSetting(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { util_type, settings } = await c.req.json()

      if (!util_type || !settings) {
        throw new AppError('util_type과 settings는 필수입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.saveUtilSetting(
        user.id,
        util_type,  // settingKey
        settings    // settingValue (will be JSON.stringified in service)
      )

      logger.info('Util setting saved', { userId: user.id, utilType: util_type })

      return c.json({
        success: true,
        message: '설정이 저장되었습니다'
      })
    } catch (error) {
      logger.error('Failed to save util setting', error)
      throw error
    }
  }

  static async getUtilSettings(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const service = new MyPageService(c.env.DB)
      const settings = await service.getUtilSettings(user.id)

      return c.json({
        success: true,
        settings
      })
    } catch (error) {
      logger.error('Failed to get util settings', error)
      throw error
    }
  }

  static async saveUtilHistory(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const { util_type, input_data, result_data } = await c.req.json()

      if (!util_type || !input_data) {
        throw new AppError('util_type과 input_data는 필수입니다', 400, ErrorCodes.VALIDATION_ERROR)
      }

      const service = new MyPageService(c.env.DB)
      await service.saveUtilHistory(
        user.id,
        util_type,
        input_data,    // Already an object, service will JSON.stringify
        result_data    // Already an object, service will JSON.stringify
      )

      logger.info('Util history saved', { userId: user.id, utilType: util_type })

      return c.json({
        success: true,
        message: '히스토리가 저장되었습니다'
      })
    } catch (error) {
      logger.error('Failed to save util history', error)
      throw error
    }
  }

  static async getUtilHistory(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const utilType = c.req.query('util_type')
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '20')

      const service = new MyPageService(c.env.DB)
      const result = await service.getUtilHistory(user.id, utilType, page, limit)

      return c.json({
        success: true,
        util_type: utilType,
        ...result  // Contains history and total
      })
    } catch (error) {
      logger.error('Failed to get util history', error)
      throw error
    }
  }

  static async deleteUtilHistory(c: Context<{ Bindings: Bindings }>) {
    try {
      const user = c.get('user')
      if (!user) {
        throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
      }

      const historyId = parseInt(c.req.param('historyId'))

      const service = new MyPageService(c.env.DB)
      await service.deleteUtilHistory(user.id, historyId)

      logger.info('Util history deleted', { userId: user.id, historyId })

      return c.json({
        success: true,
        message: '히스토리가 삭제되었습니다'
      })
    } catch (error) {
      logger.error('Failed to delete util history', error)
      throw error
    }
  }
}
