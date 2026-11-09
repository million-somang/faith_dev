-- 베라 서브마린 제독 프로필 및 전적 테이블 생성
CREATE TABLE IF NOT EXISTS submarine_profiles (
    user_id TEXT PRIMARY KEY,
    fleet_name TEXT DEFAULT '베라 제독전대',
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    best_turns INTEGER DEFAULT 99,
    total_matches INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 1200,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submarine_rating ON submarine_profiles (
    rating DESC, 
    best_turns ASC
);
