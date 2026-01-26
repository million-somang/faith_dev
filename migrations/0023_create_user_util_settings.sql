-- Migration: Create user utility settings table
-- Description: Store user preferences for utility tools
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_util_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  setting_key TEXT NOT NULL, -- 'default_currency', 'favorite_tools', etc.
  setting_value TEXT NOT NULL, -- JSON format
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_user_util_settings_user_id 
  ON user_util_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_util_settings_setting_key 
  ON user_util_settings(setting_key);
