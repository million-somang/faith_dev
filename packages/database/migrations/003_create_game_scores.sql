-- 통합 게임 점수 테이블
CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(game_id, score DESC);

-- 기존 tetris_scores 데이터를 game_scores로 마이그레이션
INSERT INTO game_scores (game_id, user_id, score, metadata, created_at)
SELECT 'tetris', user_id, score, json_object('lines', lines, 'level', level), created_at
FROM tetris_scores;
