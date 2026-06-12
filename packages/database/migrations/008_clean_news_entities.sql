-- 뉴스 title/summary에 남아있는 HTML 엔티티(&nbsp; 등) 정리
-- 순서 중요: &amp;nbsp; → 공백 → &nbsp; → 공백 → 기타 엔티티 → &amp; 는 마지막에

UPDATE news SET summary =
    TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(summary,
        '&amp;nbsp;', ' '),
        '&nbsp;', ' '),
        '&quot;', '"'),
        '&#39;', ''''),
        '&apos;', ''''),
        '&amp;', '&'))
WHERE summary LIKE '%&%';

UPDATE news SET title =
    TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title,
        '&amp;nbsp;', ' '),
        '&nbsp;', ' '),
        '&quot;', '"'),
        '&#39;', ''''),
        '&apos;', ''''),
        '&amp;', '&'))
WHERE title LIKE '%&%';
