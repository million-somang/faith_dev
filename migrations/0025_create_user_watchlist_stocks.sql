-- Migration: Create user watchlist stocks table
-- Description: Store user's watchlist (favorite stocks)
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_watchlist_stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_symbol TEXT NOT NULL, -- 'AAPL', '005930.KS', etc.
  stock_name TEXT NOT NULL, -- 'Apple Inc.', '삼성전자', etc.
  market_type TEXT NOT NULL, -- 'US', 'KR', etc.
  target_price REAL, -- Target price (optional)
  memo TEXT, -- User memo for this stock
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, stock_symbol)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_stocks_user_id 
  ON user_watchlist_stocks(user_id);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_stocks_symbol 
  ON user_watchlist_stocks(stock_symbol);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_stocks_market 
  ON user_watchlist_stocks(market_type);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_stocks_added_at 
  ON user_watchlist_stocks(added_at DESC);
