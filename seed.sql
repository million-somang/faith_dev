-- 테스트용 샘플 회원 데이터
-- 비밀번호는 실제로는 해시화되어야 하지만, 테스트용으로 평문 저장
INSERT OR IGNORE INTO users (email, password, name, phone) VALUES 
  ('test@example.com', 'test1234', '테스트유저', '010-1234-5678'),
  ('admin@naver.com', 'admin1234', '관리자', '010-9999-9999');
