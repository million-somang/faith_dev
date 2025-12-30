-- 스도쿠 점수 테이블
CREATE TABLE IF NOT EXISTS sudoku_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  difficulty TEXT NOT NULL,
  time INTEGER NOT NULL,
  mistakes INTEGER DEFAULT 0,
  player_name TEXT DEFAULT 'Anonymous',
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sudoku_difficulty ON sudoku_scores(difficulty);
CREATE INDEX IF NOT EXISTS idx_sudoku_time ON sudoku_scores(time);
CREATE INDEX IF NOT EXISTS idx_sudoku_user ON sudoku_scores(user_id);
