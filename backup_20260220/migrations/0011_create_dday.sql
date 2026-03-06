-- D-Day 테이블 생성
CREATE TABLE IF NOT EXISTS dday (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  target_date TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('countdown', 'countup', 'datefinder')),
  is_anniversary BOOLEAN DEFAULT 0,
  color TEXT DEFAULT '#667eea',
  emoji TEXT DEFAULT '📅',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dday_user_id ON dday(user_id);
CREATE INDEX IF NOT EXISTS idx_dday_target_date ON dday(target_date);
CREATE INDEX IF NOT EXISTS idx_dday_created_at ON dday(created_at DESC);
