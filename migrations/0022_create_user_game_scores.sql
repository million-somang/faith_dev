-- Migration: Create user game scores table
-- Description: Store all user game scores for ranking and statistics
-- Date: 2026-01-26

CREATE TABLE IF NOT EXISTS user_game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_type TEXT NOT NULL, -- 'tetris', 'snake', '2048', 'minesweeper'
  score INTEGER NOT NULL,
  game_data TEXT, -- JSON format for additional game data
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_game_scores_user_id 
  ON user_game_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_user_game_scores_game_type 
  ON user_game_scores(game_type);

CREATE INDEX IF NOT EXISTS idx_user_game_scores_score 
  ON user_game_scores(game_type, score DESC);

CREATE INDEX IF NOT EXISTS idx_user_game_scores_played_at 
  ON user_game_scores(played_at DESC);
