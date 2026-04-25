-- page_views: 방문자 페이지뷰 기록
CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    user_id INTEGER,
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    screen_width INTEGER,
    duration_ms INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_session ON page_views(session_id);

-- page_views_daily: 일별 집계 테이블 (원본 삭제 후 보존)
CREATE TABLE IF NOT EXISTS page_views_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    path TEXT NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_duration_ms INTEGER DEFAULT 0,
    mobile_views INTEGER DEFAULT 0,
    desktop_views INTEGER DEFAULT 0,
    tablet_views INTEGER DEFAULT 0,
    top_referrers TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, path)
);
CREATE INDEX IF NOT EXISTS idx_pvd_date ON page_views_daily(date);
CREATE INDEX IF NOT EXISTS idx_pvd_path ON page_views_daily(path);
