-- 뉴스 테이블 생성
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  description TEXT,
  link TEXT NOT NULL UNIQUE,
  image_url TEXT,
  thumbnail TEXT,
  publisher TEXT,
  author TEXT,
  source TEXT,
  source_url TEXT,
  tags TEXT,
  published_at TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  vote_up INTEGER DEFAULT 0,
  vote_down INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_popularity ON news(popularity_score DESC);
