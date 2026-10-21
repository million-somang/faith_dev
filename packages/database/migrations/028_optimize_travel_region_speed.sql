-- 028_optimize_travel_region_speed.sql
-- 재미 - 여행 지역별(시·도 / 시·군·구 / 권역) 진입 시 Overflow Page 디스크 탐색 병목 제거용 초경량 목록 테이블 및 복합 인덱스 구축

-- 1. 목록 및 인터랙티브 지도 스팟 전용 초경량 테이블 생성 (대용량 content, travel_tips, gallery, metadata 제외)
CREATE TABLE IF NOT EXISTS travel_articles_lite (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'domestic',
    category TEXT NOT NULL DEFAULT 'healing',
    summary TEXT,
    ai_summary TEXT,
    thumbnail TEXT,
    best_season TEXT,
    duration TEXT,
    estimated_cost TEXT,
    location_address TEXT,
    province TEXT DEFAULT '기타',
    city TEXT DEFAULT '',
    tags TEXT,
    author TEXT,
    source TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    hidden INTEGER DEFAULT 0,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 기존 travel_articles 데이터 전체 초기 동기화
INSERT OR REPLACE INTO travel_articles_lite (
    id, title, destination, region, category, summary, ai_summary, thumbnail,
    best_season, duration, estimated_cost, location_address, province, city, tags, author, source,
    view_count, like_count, is_featured, hidden, published_at
)
SELECT
    id, title, destination,
    COALESCE(region, 'domestic'),
    COALESCE(category, 'healing'),
    summary, ai_summary, thumbnail,
    best_season, duration, estimated_cost, location_address,
    COALESCE(province, '기타'),
    COALESCE(city, ''),
    tags, author, source,
    COALESCE(view_count, 0),
    COALESCE(like_count, 0),
    COALESCE(is_featured, 0),
    COALESCE(hidden, 0),
    published_at
FROM travel_articles;

-- 3. travel_articles 추가/수정 시 travel_articles_lite 실시간 자동 동기화 트리거
CREATE TRIGGER IF NOT EXISTS trg_travel_lite_after_insert
AFTER INSERT ON travel_articles
BEGIN
    INSERT OR REPLACE INTO travel_articles_lite (
        id, title, destination, region, category, summary, ai_summary, thumbnail,
        best_season, duration, estimated_cost, location_address, province, city, tags, author, source,
        view_count, like_count, is_featured, hidden, published_at
    ) VALUES (
        NEW.id, NEW.title, NEW.destination,
        COALESCE(NEW.region, 'domestic'),
        COALESCE(NEW.category, 'healing'),
        NEW.summary, NEW.ai_summary, NEW.thumbnail,
        NEW.best_season, NEW.duration, NEW.estimated_cost, NEW.location_address,
        COALESCE(NEW.province, '기타'),
        COALESCE(NEW.city, ''),
        NEW.tags, NEW.author, NEW.source,
        COALESCE(NEW.view_count, 0),
        COALESCE(NEW.like_count, 0),
        COALESCE(NEW.is_featured, 0),
        COALESCE(NEW.hidden, 0),
        NEW.published_at
    );
END;

CREATE TRIGGER IF NOT EXISTS trg_travel_lite_after_update
AFTER UPDATE ON travel_articles
BEGIN
    INSERT OR REPLACE INTO travel_articles_lite (
        id, title, destination, region, category, summary, ai_summary, thumbnail,
        best_season, duration, estimated_cost, location_address, province, city, tags, author, source,
        view_count, like_count, is_featured, hidden, published_at
    ) VALUES (
        NEW.id, NEW.title, NEW.destination,
        COALESCE(NEW.region, 'domestic'),
        COALESCE(NEW.category, 'healing'),
        NEW.summary, NEW.ai_summary, NEW.thumbnail,
        NEW.best_season, NEW.duration, NEW.estimated_cost, NEW.location_address,
        COALESCE(NEW.province, '기타'),
        COALESCE(NEW.city, ''),
        NEW.tags, NEW.author, NEW.source,
        COALESCE(NEW.view_count, 0),
        COALESCE(NEW.like_count, 0),
        COALESCE(NEW.is_featured, 0),
        COALESCE(NEW.hidden, 0),
        NEW.published_at
    );
END;

-- 4. travel_articles_lite 전용 초고속 복합 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_travel_lite_latest ON travel_articles_lite(hidden, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_popular ON travel_articles_lite(hidden, view_count DESC, like_count DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_featured_rank ON travel_articles_lite(hidden, is_featured DESC, view_count DESC, published_at DESC, province);
CREATE INDEX IF NOT EXISTS idx_travel_lite_region_latest ON travel_articles_lite(hidden, region, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_region_pop ON travel_articles_lite(hidden, region, view_count DESC, like_count DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_cat_latest ON travel_articles_lite(hidden, category, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_region_cat_latest ON travel_articles_lite(hidden, region, category, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_prov_latest ON travel_articles_lite(hidden, province, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_prov_pop ON travel_articles_lite(hidden, province, view_count DESC, like_count DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_prov_cat_latest ON travel_articles_lite(hidden, province, category, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_prov_city_latest ON travel_articles_lite(hidden, province, city, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_prov_city_cat_latest ON travel_articles_lite(hidden, province, city, category, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_prov_featured ON travel_articles_lite(hidden, province, is_featured DESC, view_count DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_lite_prov_city_featured ON travel_articles_lite(hidden, province, city, is_featured DESC, view_count DESC, published_at DESC);
