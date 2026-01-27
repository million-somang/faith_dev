// MyPage Service Layer
// Handles all mypage-related database operations
// Date: 2026-01-26

import { D1Database } from '@cloudflare/workers-types'
import type { 
  UserKeywordSubscription, 
  UserNewsBookmark,
  UserGameScore,
  GameStats,
  LeaderboardEntry,
  UserWatchlistStock,
  StockAlert,
  WatchlistStats
} from '../types/mypage.types'

export class MyPageService {
  constructor(private db: D1Database) {}

  // ===== 뉴스 키워드 관리 =====
  
  async addKeywordSubscription(userId: number, keyword: string): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_keyword_subscriptions (user_id, keyword)
        VALUES (?, ?)
        ON CONFLICT(user_id, keyword) DO NOTHING
      `)
      .bind(userId, keyword)
      .run()
  }

  async getKeywordSubscriptions(userId: number): Promise<UserKeywordSubscription[]> {
    const result = await this.db
      .prepare(`
        SELECT id, user_id, keyword, created_at
        FROM user_keyword_subscriptions
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .bind(userId)
      .all()

    return result.results as UserKeywordSubscription[]
  }

  async removeKeywordSubscription(userId: number, keywordId: number): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM user_keyword_subscriptions
        WHERE id = ? AND user_id = ?
      `)
      .bind(keywordId, userId)
      .run()
  }

  // ===== 뉴스 북마크 =====

  async addNewsBookmark(userId: number, newsId: number): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_news_bookmarks (user_id, news_id)
        VALUES (?, ?)
        ON CONFLICT(user_id, news_id) DO NOTHING
      `)
      .bind(userId, newsId)
      .run()
  }

  async getNewsBookmarks(
    userId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ bookmarks: UserNewsBookmark[], total: number }> {
    const offset = (page - 1) * limit

    const [bookmarks, totalResult] = await Promise.all([
      this.db
        .prepare(`
          SELECT 
            b.id,
            b.user_id,
            b.news_id,
            n.title,
            n.content,
            n.category,
            n.created_at,
            b.created_at as bookmarked_at
          FROM user_news_bookmarks b
          JOIN news n ON b.news_id = n.id
          WHERE b.user_id = ?
          ORDER BY b.created_at DESC
          LIMIT ? OFFSET ?
        `)
        .bind(userId, limit, offset)
        .all(),
      this.db
        .prepare(`SELECT COUNT(*) as count FROM user_news_bookmarks WHERE user_id = ?`)
        .bind(userId)
        .first()
    ])

    return {
      bookmarks: bookmarks.results as UserNewsBookmark[],
      total: (totalResult as any)?.count || 0
    }
  }

  async removeNewsBookmark(userId: number, newsId: number): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM user_news_bookmarks
        WHERE user_id = ? AND news_id = ?
      `)
      .bind(userId, newsId)
      .run()
  }

  // ===== 뉴스 읽음 표시 =====

  async markNewsAsRead(userId: number, newsId: number): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO user_news_read (user_id, news_id)
        VALUES (?, ?)
        ON CONFLICT(user_id, news_id) DO NOTHING
      `)
      .bind(userId, newsId)
      .run()
  }

  // ===== 구독 키워드별 뉴스 조회 =====

  async getNewsByKeyword(
    userId: number,
    keyword: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ news: any[], total: number }> {
    const offset = (page - 1) * limit

    const [news, totalResult] = await Promise.all([
      this.db
        .prepare(`
          SELECT 
            n.id,
            n.title,
            n.content,
            n.category,
            n.created_at,
            CASE WHEN r.news_id IS NOT NULL THEN 1 ELSE 0 END as is_read,
            CASE WHEN b.news_id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
          FROM news n
          LEFT JOIN user_news_read r ON n.id = r.news_id AND r.user_id = ?
          LEFT JOIN user_news_bookmarks b ON n.id = b.news_id AND b.user_id = ?
          WHERE (
            n.title LIKE ? OR 
            n.content LIKE ? OR
            n.keywords LIKE ?
          )
          ORDER BY n.created_at DESC
          LIMIT ? OFFSET ?
        `)
        .bind(
          userId, 
          userId, 
          `%${keyword}%`, 
          `%${keyword}%`, 
          `%${keyword}%`,
          limit, 
          offset
        )
        .all(),
      this.db
        .prepare(`
          SELECT COUNT(*) as count FROM news
          WHERE title LIKE ? OR content LIKE ? OR keywords LIKE ?
        `)
        .bind(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
        .first()
    ])

    return {
      news: news.results,
      total: (totalResult as any)?.count || 0
    }
  }

  // 이후 게임, 유틸, 주식 관련 메서드는 필요 시 추가 구현
}
