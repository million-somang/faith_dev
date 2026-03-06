-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  news_title TEXT,
  news_link TEXT,
  news_category TEXT,
  news_source TEXT,
  news_pub_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  UNIQUE(user_id, news_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_news_id ON bookmarks(news_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(news_category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
