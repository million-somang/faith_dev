-- 숫자야구 구단 프로필 및 전적 테이블 생성
CREATE TABLE IF NOT EXISTS baseball_profiles (
    user_id INTEGER PRIMARY KEY,
    team_name TEXT DEFAULT '베라 마린스',
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    shutouts INTEGER DEFAULT 0,
    total_innings INTEGER DEFAULT 0,
    win_rate REAL DEFAULT 0.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_baseball_ranking ON baseball_profiles (
    win_rate DESC, 
    wins DESC
);
