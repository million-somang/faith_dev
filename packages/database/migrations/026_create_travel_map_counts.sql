-- 026_create_travel_map_counts.sql
-- 여행 지도 수량 카운터 전용 테이블 생성 및 기사 지역 컬럼 정규화

-- 1. travel_articles 테이블에 정규화된 지역 컬럼 추가
ALTER TABLE travel_articles ADD COLUMN province TEXT DEFAULT '';
ALTER TABLE travel_articles ADD COLUMN city TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_travel_prov_city ON travel_articles(province, city);

-- 2. 지도 전용 카운터 집계 테이블 생성
CREATE TABLE IF NOT EXISTS travel_map_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    spot_count INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prov_city UNIQUE(province, city)
);

CREATE INDEX IF NOT EXISTS idx_map_counts_prov ON travel_map_counts(province);

-- 3. 1차 기본 행정구역 매핑 (SQL 기반)
UPDATE travel_articles 
SET province = CASE 
    WHEN region != 'domestic' AND region != '국내' THEN '해외'
    WHEN location_address LIKE '%서울%' OR destination LIKE '%서울%' THEN '서울특별시'
    WHEN location_address LIKE '%경기%' OR destination LIKE '%경기%' THEN '경기도'
    WHEN location_address LIKE '%인천%' OR destination LIKE '%인천%' THEN '인천광역시'
    WHEN location_address LIKE '%강원%' OR destination LIKE '%강원%' THEN '강원특별자치도'
    WHEN location_address LIKE '%충북%' OR location_address LIKE '%충청북도%' OR destination LIKE '%충북%' OR destination LIKE '%충청북도%' THEN '충청북도'
    WHEN location_address LIKE '%충남%' OR location_address LIKE '%충청남도%' OR destination LIKE '%충남%' OR destination LIKE '%충청남도%' THEN '충청남도'
    WHEN location_address LIKE '%대전%' OR destination LIKE '%대전%' THEN '대전광역시'
    WHEN location_address LIKE '%세종%' OR destination LIKE '%세종%' THEN '세종특별자치시'
    WHEN location_address LIKE '%전북%' OR location_address LIKE '%전라북도%' OR destination LIKE '%전북%' OR destination LIKE '%전라북도%' THEN '전북특별자치도'
    WHEN location_address LIKE '%전남%' OR location_address LIKE '%전라남도%' OR destination LIKE '%전남%' OR destination LIKE '%전라남도%' THEN '전라남도'
    WHEN location_address LIKE '%광주%' OR destination LIKE '%광주%' THEN '광주광역시'
    WHEN location_address LIKE '%경북%' OR location_address LIKE '%경상북도%' OR destination LIKE '%경북%' OR destination LIKE '%경상북도%' THEN '경상북도'
    WHEN location_address LIKE '%경남%' OR location_address LIKE '%경상남도%' OR destination LIKE '%경남%' OR destination LIKE '%경상남도%' THEN '경상남도'
    WHEN location_address LIKE '%대구%' OR destination LIKE '%대구%' THEN '대구광역시'
    WHEN location_address LIKE '%울산%' OR destination LIKE '%울산%' THEN '울산광역시'
    WHEN location_address LIKE '%부산%' OR destination LIKE '%부산%' THEN '부산광역시'
    WHEN location_address LIKE '%제주%' OR destination LIKE '%제주%' THEN '제주특별자치도'
    ELSE '기타'
END;
