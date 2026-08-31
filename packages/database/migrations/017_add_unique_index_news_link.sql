-- ROW_NUMBER() 윈도우 함수를 사용하여 중복 레코드(rn > 1)를 단 한 번의 정렬로 초고속(1초 미만) 삭제
DELETE FROM news 
WHERE rowid IN (
    SELECT rowid FROM (
        SELECT rowid, ROW_NUMBER() OVER (PARTITION BY link ORDER BY rowid) AS rn
        FROM news
    ) WHERE rn > 1
);

-- link 컬럼에 고유 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_link ON news(link);
