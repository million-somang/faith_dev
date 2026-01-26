-- Migration: Create user keyword subscriptions table
-- Description: Store user's subscribed keywords for personalized news filtering
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_keyword_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_user_keyword_subscriptions_user_id 
  ON user_keyword_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_keyword_subscriptions_keyword 
  ON user_keyword_subscriptions(keyword);
