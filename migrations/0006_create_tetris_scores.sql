-- 테트리스 최고 점수 테이블
CREATE TABLE IF NOT EXISTS tetris_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tetris_scores_user_id ON tetris_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_tetris_scores_score ON tetris_scores(score DESC);
