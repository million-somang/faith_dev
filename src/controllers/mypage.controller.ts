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
}
