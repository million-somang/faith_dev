-- 회원 등급 및 상태 컬럼 추가
ALTER TABLE users ADD COLUMN level INTEGER;
ALTER TABLE users ADD COLUMN status TEXT;
ALTER TABLE users ADD COLUMN updated_at DATETIME;

-- 기존 데이터에 기본값 설정
UPDATE users SET level = 1 WHERE level IS NULL;
UPDATE users SET status = 'active' WHERE status IS NULL;
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- 등급 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 회원 등급 설명:
-- 1: 일반 회원 (기본)
-- 2: 정회원
-- 3: 우수회원
-- 4: VIP 회원
-- 5: VVIP 회원
-- 6: 실버 관리자
-- 7: 골드 관리자
-- 8: 플래티넘 관리자
-- 9: 마스터 관리자
-- 10: 슈퍼바이저 (최고 관리자)
