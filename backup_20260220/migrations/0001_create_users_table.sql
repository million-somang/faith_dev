-- 회원 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- 이메일 인덱스 생성 (로그인 속도 향상)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 생성일 인덱스
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
