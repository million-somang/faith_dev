-- 021_create_lounge_posts.sql: 라운지 커뮤니티 게시글 및 좋아요 테이블 생성

CREATE TABLE IF NOT EXISTS lounge_posts (
    id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_handle TEXT NOT NULL,
    author_avatar TEXT NOT NULL DEFAULT '🦊',
    author_badge TEXT,
    content TEXT NOT NULL,
    image TEXT,
    ladder_data TEXT,
    likes INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lounge_posts_created_at ON lounge_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lounge_posts_author_handle ON lounge_posts(author_handle);
CREATE INDEX IF NOT EXISTS idx_lounge_posts_user_id ON lounge_posts(user_id);

CREATE TABLE IF NOT EXISTS lounge_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL REFERENCES lounge_posts(id) ON DELETE CASCADE,
    user_id INTEGER,
    user_handle TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_handle)
);

CREATE INDEX IF NOT EXISTS idx_lounge_likes_post_id ON lounge_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_lounge_likes_user_handle ON lounge_likes(user_handle);
