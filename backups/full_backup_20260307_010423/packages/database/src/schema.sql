-- PostgreSQL Schema for FaithPortal

DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    password TEXT NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    level INTEGER DEFAULT 1,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    summary TEXT,
    source TEXT,
    link TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ai_summary TEXT,
    sentiment TEXT,
    ai_processed INTEGER DEFAULT 0,
    vote_up INTEGER DEFAULT 0,
    vote_down INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    popularity_score INTEGER DEFAULT 0,
    thumbnail TEXT,
    tags TEXT,
    author TEXT,
    source_url TEXT,
    description TEXT
);

CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
