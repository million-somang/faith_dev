-- 028_create_minihome_tables.sql: 미니홈피(내 방 꾸미기), 인벤토리, 방명록, 방문자 로그 테이블 생성 (Soft Delete 적용)

CREATE TABLE IF NOT EXISTS user_minihomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    handle TEXT NOT NULL UNIQUE,
    owner_name TEXT NOT NULL,
    room_title TEXT NOT NULL DEFAULT '사이좋은 사람들의 따뜻한 미니룸',
    status_mood TEXT NOT NULL DEFAULT 'happy',
    status_message TEXT NOT NULL DEFAULT '오늘도 내 방에 놀러와줘서 고마워요! ✨',
    bgm_track_id TEXT NOT NULL DEFAULT 'bgm-orgel',
    layout_json TEXT NOT NULL,
    today_visitors INTEGER NOT NULL DEFAULT 1,
    total_visitors INTEGER NOT NULL DEFAULT 1,
    last_visit_date TEXT NOT NULL DEFAULT ( date('now') ),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_minihomes_handle ON user_minihomes(handle);
CREATE INDEX IF NOT EXISTS idx_user_minihomes_user_id ON user_minihomes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_minihomes_updated_at ON user_minihomes(updated_at DESC);

CREATE TABLE IF NOT EXISTS user_minihome_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_handle TEXT NOT NULL,
    item_id TEXT NOT NULL,
    acquired_type TEXT NOT NULL DEFAULT 'free',
    price_paid INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_handle, item_id)
);

CREATE INDEX IF NOT EXISTS idx_minihome_inventory_handle ON user_minihome_inventory(user_handle);
CREATE INDEX IF NOT EXISTS idx_minihome_inventory_user_id ON user_minihome_inventory(user_id);

CREATE TABLE IF NOT EXISTS minihome_guestbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_handle TEXT NOT NULL,
    author_user_id INTEGER,
    author_name TEXT NOT NULL,
    author_handle TEXT NOT NULL,
    author_minimi_id TEXT NOT NULL DEFAULT 'minimi-casual',
    content TEXT NOT NULL,
    owner_reply TEXT,
    owner_replied_at DATETIME,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_minihome_guestbook_host ON minihome_guestbook(host_handle, is_deleted, created_at DESC);

CREATE TABLE IF NOT EXISTS minihome_visit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_handle TEXT NOT NULL,
    visitor_key TEXT NOT NULL,
    visit_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(host_handle, visitor_key, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_minihome_visit_logs_lookup ON minihome_visit_logs(host_handle, visit_date);
