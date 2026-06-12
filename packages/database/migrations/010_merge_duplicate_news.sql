-- 중복 뉴스 통합: 같은 제목의 뉴스를 하나로 합치고 카테고리를 병합
-- 데이터 삭제 없이 hidden 플래그로 숨김 처리 (가장 먼저 수집된 행을 대표로 유지)

CREATE INDEX IF NOT EXISTS idx_news_title ON news(title);

ALTER TABLE news ADD COLUMN hidden INTEGER DEFAULT 0;

-- 1. 중복 그룹의 대표 행(최소 id)에 모든 카테고리를 병합 (예: 'stock,general')
UPDATE news SET category = (
    SELECT GROUP_CONCAT(DISTINCT n2.category)
    FROM news n2
    WHERE n2.title = news.title AND n2.category IS NOT NULL
)
WHERE id IN (
    SELECT MIN(id) FROM news GROUP BY title HAVING COUNT(*) > 1
);

-- 2. 대표 행을 제외한 중복 행은 숨김 처리 (삭제하지 않음)
UPDATE news SET hidden = 1
WHERE id NOT IN (SELECT MIN(id) FROM news GROUP BY title);
