-- 027_optimize_news_travel_indexes.sql
-- 뉴스 및 여행 테이블 Full Table Scan 원천 차단용 정규화 및 복합 인덱스(Composite Index) 구축

-- 1. hidden 컬럼 NULL 제거 (단일 조건 hidden = 0 으로 복합 인덱스 100% 활용)
UPDATE travel_articles SET hidden = 0 WHERE hidden IS NULL;
UPDATE news SET hidden = 0 WHERE hidden IS NULL;

-- 2. news 테이블 created_at NULL 보정 (COALESCE 표현식 정렬 제거용)
UPDATE news SET created_at = published_at WHERE created_at IS NULL AND published_at IS NOT NULL;
UPDATE news SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- 3. travel_articles 최신순 / 인기순 / 추천순 / 권역·테마·시도별 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_travel_latest ON travel_articles(hidden, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_popular ON travel_articles(hidden, view_count DESC, like_count DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_featured_rank ON travel_articles(hidden, is_featured DESC, view_count DESC, published_at DESC, province);
CREATE INDEX IF NOT EXISTS idx_travel_region_latest ON travel_articles(hidden, region, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_category_latest ON travel_articles(hidden, category, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_region_cat_latest ON travel_articles(hidden, region, category, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_prov_latest ON travel_articles(hidden, province, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_prov_city_latest ON travel_articles(hidden, province, city, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_prov_featured ON travel_articles(hidden, province, is_featured DESC, view_count DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_prov_city_featured ON travel_articles(hidden, province, city, is_featured DESC, view_count DESC, published_at DESC);

-- 4. news 최신순 / 카테고리별 / 인기순 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_news_latest ON news(hidden, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_news_category_latest ON news(hidden, category, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_news_hot ON news(hidden, popularity_score DESC, created_at DESC);
