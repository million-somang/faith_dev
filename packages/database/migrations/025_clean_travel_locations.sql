-- 025_clean_travel_locations.sql
-- 정규 행정구역 표준화: 전남광주통합특별시 데이터를 광주광역시와 전라남도로 분리 정제

-- 1. 광주광역시 5대 자치구(동구, 서구, 남구, 북구, 광산구) 소속 명소 정제
UPDATE travel_articles 
SET 
    destination = replace(destination, '전남광주통합특별시 동구', '광주광역시 동구'),
    location_address = replace(location_address, '전남광주통합특별시 동구', '광주광역시 동구'),
    title = replace(title, '[전남광주통합특별시]', '[광주광역시]')
WHERE destination LIKE '%전남광주통합특별시 동구%' OR location_address LIKE '%전남광주통합특별시 동구%';

UPDATE travel_articles 
SET 
    destination = replace(destination, '전남광주통합특별시 서구', '광주광역시 서구'),
    location_address = replace(location_address, '전남광주통합특별시 서구', '광주광역시 서구'),
    title = replace(title, '[전남광주통합특별시]', '[광주광역시]')
WHERE destination LIKE '%전남광주통합특별시 서구%' OR location_address LIKE '%전남광주통합특별시 서구%';

UPDATE travel_articles 
SET 
    destination = replace(destination, '전남광주통합특별시 남구', '광주광역시 남구'),
    location_address = replace(location_address, '전남광주통합특별시 남구', '광주광역시 남구'),
    title = replace(title, '[전남광주통합특별시]', '[광주광역시]')
WHERE destination LIKE '%전남광주통합특별시 남구%' OR location_address LIKE '%전남광주통합특별시 남구%';

UPDATE travel_articles 
SET 
    destination = replace(destination, '전남광주통합특별시 북구', '광주광역시 북구'),
    location_address = replace(location_address, '전남광주통합특별시 북구', '광주광역시 북구'),
    title = replace(title, '[전남광주통합특별시]', '[광주광역시]')
WHERE destination LIKE '%전남광주통합특별시 북구%' OR location_address LIKE '%전남광주통합특별시 북구%';

UPDATE travel_articles 
SET 
    destination = replace(destination, '전남광주통합특별시 광산구', '광주광역시 광산구'),
    location_address = replace(location_address, '전남광주통합특별시 광산구', '광주광역시 광산구'),
    title = replace(title, '[전남광주통합특별시]', '[광주광역시]')
WHERE destination LIKE '%전남광주통합특별시 광산구%' OR location_address LIKE '%전남광주통합특별시 광산구%';

-- 2. 나머지 전라남도 시/군 소속 명소 정제
UPDATE travel_articles 
SET 
    destination = replace(destination, '전남광주통합특별시', '전라남도'),
    location_address = replace(location_address, '전남광주통합특별시', '전라남도'),
    title = replace(title, '[전남광주통합특별시]', '[전라남도]'),
    tags = replace(tags, '전남광주통합특별시', '전라남도')
WHERE destination LIKE '%전남광주통합특별시%' OR location_address LIKE '%전남광주통합특별시%' OR title LIKE '%전남광주통합특별시%' OR tags LIKE '%전남광주통합특별시%';

-- 3. 오타 데이터 자동 보정
UPDATE travel_articles 
SET 
    destination = replace(destination, '전남광주통특별시', '전라남도'),
    location_address = replace(location_address, '전남광주통특별시', '전라남도'),
    title = replace(title, '[전남광주통특별시]', '[전라남도]')
WHERE destination LIKE '%전남광주통특별시%' OR location_address LIKE '%전남광주통특별시%';

UPDATE travel_articles 
SET 
    destination = replace(destination, '광주광역사', '광주광역시'),
    location_address = replace(location_address, '광주광역사', '광주광역시'),
    title = replace(title, '[광주광역사]', '[광주광역시]')
WHERE destination LIKE '%광주광역사%' OR location_address LIKE '%광주광역사%';
