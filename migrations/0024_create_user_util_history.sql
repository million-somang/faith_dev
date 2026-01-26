-- Migration: Create user utility history table
-- Description: Track user's utility tool usage history
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_util_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  util_type TEXT NOT NULL, -- 'exchange_rate', 'calculator', etc.
  input_data TEXT NOT NULL, -- JSON format
  result_data TEXT, -- JSON format
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_util_history_user_id 
  ON user_util_history(user_id);

CREATE INDEX IF NOT EXISTS idx_user_util_history_util_type 
  ON user_util_history(util_type);

CREATE INDEX IF NOT EXISTS idx_user_util_history_created_at 
  ON user_util_history(created_at DESC);
