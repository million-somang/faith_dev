-- Fix missing columns in bookmarks table
-- This is necessary because some environments have a bookmarks table created without these columns

-- Add created_at column if it doesn't exist (SQLite doesn't support IF NOT EXISTS for ADD COLUMN in standard syntax easily, but valid ALTER statements work)
ALTER TABLE bookmarks ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add news_category column
ALTER TABLE bookmarks ADD COLUMN news_category TEXT;

-- Re-create indices just in case
DROP INDEX IF EXISTS idx_bookmarks_category;
CREATE INDEX idx_bookmarks_category ON bookmarks(news_category);

DROP INDEX IF EXISTS idx_bookmarks_created_at;
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
