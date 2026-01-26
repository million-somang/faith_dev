-- Migration: Create user news bookmarks table
-- Description: Store user's bookmarked news articles
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_news_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  UNIQUE(user_id, news_id)
);

CREATE INDEX IF NOT EXISTS idx_user_news_bookmarks_user_id 
  ON user_news_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_user_news_bookmarks_news_id 
  ON user_news_bookmarks(news_id);

CREATE INDEX IF NOT EXISTS idx_user_news_bookmarks_created_at 
  ON user_news_bookmarks(created_at DESC);
