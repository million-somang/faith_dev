-- 요약이 150자에서 잘리며 끝에 남은 불완전한 HTML 엔티티 조각 제거
-- 긴 패턴부터 순서대로 처리

UPDATE news SET summary = substr(summary, 1, length(summary)-5) WHERE summary LIKE '%&nbsp';
UPDATE news SET summary = substr(summary, 1, length(summary)-5) WHERE summary LIKE '%&apos';
UPDATE news SET summary = substr(summary, 1, length(summary)-5) WHERE summary LIKE '%&quot';
UPDATE news SET summary = substr(summary, 1, length(summary)-4) WHERE summary LIKE '%&nbs';
UPDATE news SET summary = substr(summary, 1, length(summary)-4) WHERE summary LIKE '%&amp';
UPDATE news SET summary = substr(summary, 1, length(summary)-4) WHERE summary LIKE '%&quo';
UPDATE news SET summary = substr(summary, 1, length(summary)-4) WHERE summary LIKE '%&apo';
UPDATE news SET summary = substr(summary, 1, length(summary)-4) WHERE summary LIKE '%&#39';
UPDATE news SET summary = substr(summary, 1, length(summary)-3) WHERE summary LIKE '%&nb';
UPDATE news SET summary = substr(summary, 1, length(summary)-3) WHERE summary LIKE '%&am';
UPDATE news SET summary = substr(summary, 1, length(summary)-3) WHERE summary LIKE '%&qu';
UPDATE news SET summary = substr(summary, 1, length(summary)-3) WHERE summary LIKE '%&ap';
UPDATE news SET summary = substr(summary, 1, length(summary)-3) WHERE summary LIKE '%&#3';
UPDATE news SET summary = substr(summary, 1, length(summary)-2) WHERE summary LIKE '%&n';
UPDATE news SET summary = substr(summary, 1, length(summary)-2) WHERE summary LIKE '%&a';
UPDATE news SET summary = substr(summary, 1, length(summary)-2) WHERE summary LIKE '%&q';
UPDATE news SET summary = substr(summary, 1, length(summary)-2) WHERE summary LIKE '%&#';
UPDATE news SET summary = substr(summary, 1, length(summary)-1) WHERE summary LIKE '%&';
UPDATE news SET summary = rtrim(summary) WHERE summary LIKE '% ';
