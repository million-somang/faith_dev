-- 사용자 키워드 구독 테이블
CREATE TABLE IF NOT EXISTS user_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_keywords_user_id ON user_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keywords_keyword ON user_keywords(keyword);

-- 중복 방지를 위한 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_keywords_unique ON user_keywords(user_id, keyword);
