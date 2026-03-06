-- 뉴스 투표 기록 테이블
CREATE TABLE IF NOT EXISTS news_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL,
  user_id INTEGER,  -- NULL 허용 (비로그인 사용자는 IP 기반)
  user_ip TEXT,     -- 비로그인 사용자 식별용
  vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')), -- 'up' or 'down'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_votes_news_id ON news_votes(news_id);
CREATE INDEX IF NOT EXISTS idx_news_votes_user_id ON news_votes(user_id);

-- 중복 투표 방지 (사용자당 뉴스당 1표)
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_votes_user_unique 
  ON news_votes(news_id, user_id) WHERE user_id IS NOT NULL;

-- IP 기반 중복 방지 (비로그인 사용자)
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_votes_ip_unique 
  ON news_votes(news_id, user_ip) WHERE user_id IS NULL;
