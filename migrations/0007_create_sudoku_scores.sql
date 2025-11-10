-- 스도쿠 최고 점수 테이블
CREATE TABLE IF NOT EXISTS sudoku_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  time INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sudoku_scores_user_id ON sudoku_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_sudoku_scores_time ON sudoku_scores(time ASC);
CREATE INDEX IF NOT EXISTS idx_sudoku_scores_difficulty ON sudoku_scores(difficulty);
