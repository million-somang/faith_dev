-- 마케팅 포스트 테이블 생성
CREATE TABLE IF NOT EXISTS marketing_posts (
    id TEXT PRIMARY KEY,
    target_service_slug TEXT NOT NULL,
    target_service_name TEXT NOT NULL,
    target_service_url TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'THREADS',
    headline TEXT,
    body_text TEXT NOT NULL,
    first_comment TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    scheduled_at DATETIME,
    published_at DATETIME,
    external_post_id TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_posts_status_scheduled 
ON marketing_posts (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_marketing_posts_created_at 
ON marketing_posts (created_at DESC);

-- 자동 마케팅 설정 테이블 생성
CREATE TABLE IF NOT EXISTS marketing_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정 시딩 (완전 자동화 토글 등)
INSERT OR IGNORE INTO marketing_settings (key, value) VALUES ('auto_pilot_enabled', 'false');
INSERT OR IGNORE INTO marketing_settings (key, value) VALUES ('auto_pilot_slots', '["08:30", "12:30", "18:30"]');
INSERT OR IGNORE INTO marketing_settings (key, value) VALUES ('default_platform', 'THREADS');
