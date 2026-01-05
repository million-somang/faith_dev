-- 지뢰찾기 게임 점수 테이블
CREATE TABLE IF NOT EXISTS minesweeper_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  difficulty TEXT NOT NULL,
  time REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_minesweeper_scores_user_id ON minesweeper_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_minesweeper_scores_difficulty ON minesweeper_scores(difficulty);
CREATE INDEX IF NOT EXISTS idx_minesweeper_scores_time ON minesweeper_scores(time ASC);
