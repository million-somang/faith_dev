DROP TABLE IF EXISTS sudoku_scores;

CREATE TABLE sudoku_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  difficulty TEXT NOT NULL,
  time INTEGER NOT NULL,
  mistakes INTEGER DEFAULT 0,
  player_name TEXT DEFAULT 'Anonymous',
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sudoku_difficulty ON sudoku_scores(difficulty);
CREATE INDEX idx_sudoku_time ON sudoku_scores(time);
CREATE INDEX idx_sudoku_user ON sudoku_scores(user_id);
