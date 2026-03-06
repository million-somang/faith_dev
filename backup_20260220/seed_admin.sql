-- Admin User Seed
-- Password: test1234 (SHA-256 hashed)
INSERT OR IGNORE INTO users (email, password, name, phone, role, level, status) 
VALUES ('sukman1@naver.com', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '관리자', '010-0000-0000', 'admin', 10, 'active');
