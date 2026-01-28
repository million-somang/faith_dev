import Database from 'better-sqlite3';
const db = new Database('faith-portal.db');

console.log('🔄 데이터베이스 초기화 시작...\n');

// 테이블 생성
db.exec(`
  -- 사용자 테이블
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    last_login DATETIME,
    level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'user'
  );

  -- 세션 테이블
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 뉴스 테이블
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    summary TEXT,
    source TEXT,
    link TEXT,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 게임 점수 테이블
  CREATE TABLE IF NOT EXISTS user_game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    game_data TEXT,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 스도쿠 점수 테이블
  CREATE TABLE IF NOT EXISTS sudoku_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    time INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    mistakes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 테트리스 점수 테이블
  CREATE TABLE IF NOT EXISTS tetris_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 2048 점수 테이블
  CREATE TABLE IF NOT EXISTS game2048_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_tile INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 지뢰찾기 점수 테이블
  CREATE TABLE IF NOT EXISTS minesweeper_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    time INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 북마크 테이블
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    news_id INTEGER NOT NULL,
    bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (news_id) REFERENCES news(id)
  );

  -- 관심 종목 테이블
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    market_type TEXT,
    memo TEXT,
    target_price REAL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 키워드 구독 테이블
  CREATE TABLE IF NOT EXISTS user_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 활동 로그 테이블
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 알림 테이블
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 로그인 이력 테이블
  CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
  CREATE INDEX IF NOT EXISTS idx_user_game_scores_user_id ON user_game_scores(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_game_scores_game_type ON user_game_scores(game_type);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_keywords_user_id ON user_keywords(user_id);
  CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
`);

console.log('✅ 테이블 생성 완료!\n');

// 테이블 목록 확인
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

console.log('📊 생성된 테이블 목록:');
tables.forEach((table, index) => {
  console.log(`   ${index + 1}. ${table.name}`);
});

console.log('\n✅ SQLite 데이터베이스 초기화 완료!');
console.log('📁 데이터베이스 파일: faith-portal.db');
console.log('\n🎯 다음 단계:');
console.log('   1. pm2 start ecosystem.nodejs.config.cjs');
console.log('   2. pm2 status');
console.log('   3. curl http://localhost:3000\n');

db.close();
