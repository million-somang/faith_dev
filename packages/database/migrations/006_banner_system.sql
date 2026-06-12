-- 배너 관리 시스템
-- banner_slots: 배너 자리(슬롯) 정의, banners: 슬롯에 등록되는 배너

CREATE TABLE IF NOT EXISTS banner_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_key TEXT NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    open_new_tab INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    start_at DATETIME,
    end_at DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banners_slot ON banners(slot_key, is_active, sort_order);

-- 초기 슬롯 시드
INSERT OR IGNORE INTO banner_slots (slot_key, name, width, height, description) VALUES
    ('home_main_top', '홈 메인 상단', 728, 90, '메인 페이지 뉴스 칼럼 상단 가로 배너'),
    ('news_list_top', '뉴스 목록 상단', 728, 90, '뉴스 페이지 목록 상단 가로 배너'),
    ('home_sidebar', '홈 우측 사이드바', 300, 250, '메인 페이지 우측 위젯 영역 사각 배너');

-- 기존 하드코딩 쿠팡 배너를 첫 데이터로 이관
INSERT OR IGNORE INTO banners (slot_key, title, image_url, link_url, open_new_tab, sort_order, is_active)
SELECT 'home_main_top', '쿠팡 파트너스 배너',
    'https://ads-partners.coupang.com/banners/959332?subId=&traceId=V0-301-879dd1202e5c73b2-I959332&w=728&h=90',
    'https://ads-partners.coupang.com/banners/959332?subId=&traceId=V0-301-879dd1202e5c73b2-I959332&w=728&h=90',
    1, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE slot_key = 'home_main_top' AND title = '쿠팡 파트너스 배너');
