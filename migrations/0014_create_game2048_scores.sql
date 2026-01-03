-- 2048 게임 점수 테이블
CREATE TABLE IF NOT EXISTS game2048_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  score INTEGER NOT NULL,
  max_tile INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_game2048_scores_user_id ON game2048_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game2048_scores_score ON game2048_scores(score DESC);
