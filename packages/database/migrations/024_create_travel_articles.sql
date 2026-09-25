-- 024_create_travel_articles.sql
-- 재미 - 여행 큐레이션 및 API용 테이블 생성

CREATE TABLE IF NOT EXISTS travel_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'domestic',
    category TEXT NOT NULL DEFAULT 'healing',
    summary TEXT,
    ai_summary TEXT,
    content TEXT NOT NULL,
    travel_tips TEXT,
    thumbnail TEXT,
    gallery TEXT,
    best_season TEXT,
    duration TEXT,
    estimated_cost TEXT,
    location_address TEXT,
    tags TEXT,
    author TEXT DEFAULT 'RoofAI 여행 큐레이터',
    source TEXT,
    source_url TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    hidden INTEGER DEFAULT 0,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_travel_region ON travel_articles(region);
CREATE INDEX IF NOT EXISTS idx_travel_category ON travel_articles(category);
CREATE INDEX IF NOT EXISTS idx_travel_published ON travel_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_featured ON travel_articles(is_featured);
