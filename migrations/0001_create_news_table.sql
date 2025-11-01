-- 뉴스 테이블 생성
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  link TEXT NOT NULL UNIQUE,
  image_url TEXT,
  publisher TEXT,
  pub_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_pub_date ON news(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
