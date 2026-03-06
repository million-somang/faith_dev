-- Migration: Create user stock alerts table
-- Description: Store price alerts for stocks
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_stock_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'above' (이상), 'below' (이하)
  target_price REAL NOT NULL,
  is_triggered BOOLEAN DEFAULT 0,
  triggered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_stock_alerts_user_id 
  ON user_stock_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_stock_alerts_symbol 
  ON user_stock_alerts(stock_symbol);

CREATE INDEX IF NOT EXISTS idx_user_stock_alerts_triggered 
  ON user_stock_alerts(is_triggered);

CREATE INDEX IF NOT EXISTS idx_user_stock_alerts_created_at 
  ON user_stock_alerts(created_at DESC);
