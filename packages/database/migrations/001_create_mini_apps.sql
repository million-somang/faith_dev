-- mini_apps: 미니앱 레지스트리
CREATE TABLE IF NOT EXISTS mini_apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    app_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' / 'maintenance' / 'inactive'
    require_auth INTEGER DEFAULT 0,        -- 0=전체공개 / 1=로그인필요
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- mini_app_logs: 사용자 실행 로그 (통계용)
CREATE TABLE IF NOT EXISTS mini_app_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mini_app_id INTEGER NOT NULL,
    user_id INTEGER,
    action_type TEXT NOT NULL DEFAULT 'LAUNCH',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mini_app_id) REFERENCES mini_apps(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_mini_app_logs_app ON mini_app_logs(mini_app_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_logs_user ON mini_app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_logs_created ON mini_app_logs(created_at);

-- 초기 데이터 삽입 (기존 다기능 계산기앱)
INSERT OR IGNORE INTO mini_apps (id, name, slug, icon_url, description, app_url, status, require_auth, sort_order)
VALUES (1, '다기능 계산기', 'calculator', 'fas fa-calculator', '기본/공학/나이/퍼센트/BMI/단위변환 계산기', '/app/calculator/', 'active', 0, 1);
