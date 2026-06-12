-- published_at 날짜 형식 정규화
-- RSS 원본(RFC2822: 'Fri, 12 Jun 2026 01:54:12 GMT') 형식으로 저장된 행을
-- ISO('2026-06-12 01:54:12') 형식으로 변환하여 ORDER BY 정렬이 올바르게 동작하도록 함

-- 일(day)이 2자리인 형식: 'Fri, 12 Jun 2026 01:54:12 GMT'
UPDATE news
SET published_at =
    substr(published_at, 13, 4) || '-' ||
    CASE substr(published_at, 9, 3)
        WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
        WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06'
        WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09'
        WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
    END || '-' ||
    substr(published_at, 6, 2) || ' ' ||
    substr(published_at, 18, 8)
WHERE published_at LIKE '___, __ ___ ____ __:__:__ GMT';

-- 일(day)이 1자리인 형식: 'Fri, 2 Jun 2026 01:54:12 GMT'
UPDATE news
SET published_at =
    substr(published_at, 12, 4) || '-' ||
    CASE substr(published_at, 8, 3)
        WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
        WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06'
        WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09'
        WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
    END || '-0' ||
    substr(published_at, 6, 1) || ' ' ||
    substr(published_at, 17, 8)
WHERE published_at LIKE '___, _ ___ ____ __:__:__ GMT';
