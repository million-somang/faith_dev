-- Migration: Create user news read tracking table
-- Description: Track which news articles users have read
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_news_read (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  UNIQUE(user_id, news_id)
);

CREATE INDEX IF NOT EXISTS idx_user_news_read_user_id 
  ON user_news_read(user_id);

CREATE INDEX IF NOT EXISTS idx_user_news_read_news_id 
  ON user_news_read(news_id);

CREATE INDEX IF NOT EXISTS idx_user_news_read_read_at 
  ON user_news_read(read_at DESC);
