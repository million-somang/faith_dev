-- 005: 메인페이지 개인화 설정 테이블
-- user_homepage_config: 사용자별 홈 꾸미기 설정 저장

CREATE TABLE IF NOT EXISTS user_homepage_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homepage_config_user_id ON user_homepage_config(user_id);
