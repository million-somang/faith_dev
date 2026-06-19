-- 관심종목(주식) 테이블
-- 마이페이지 '주식' 섹션과 금융 앱 관심종목 동기화에 사용한다.
-- api-server의 MyPageService(getWatchlist/addWatchlist)가 읽고 쓰는 컬럼명에 맞춘다.
-- (stock_symbol/stock_name/market_type/target_price/memo/created_at)

CREATE TABLE IF NOT EXISTS user_watchlist_stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  market_type TEXT NOT NULL,
  target_price REAL,
  memo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, stock_symbol)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_stocks_user_id
  ON user_watchlist_stocks(user_id);
