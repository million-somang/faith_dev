-- 022_update_coupang_banner_link.sql
-- 메인 홈 상단 쿠팡 파트너스 배너 제휴 링크 연동
UPDATE banners
SET link_url = 'https://link.coupang.com/a/g0xNo8o8fk',
    updated_at = CURRENT_TIMESTAMP
WHERE slot_key = 'home_main_top' AND (title LIKE '%쿠팡%' OR id = 1);
