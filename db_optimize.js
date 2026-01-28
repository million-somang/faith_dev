// 데이터베이스 성능 최적화 스크립트
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'faith-portal.db');
const db = new Database(dbPath);

console.log('\n🔧 데이터베이스 성능 최적화 시작...\n');

try {
  // 1. 뉴스 테이블 인덱스
  console.log('📊 뉴스 테이블 인덱스 생성...');
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
    CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_category_created ON news(category, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
  `);
  console.log('✅ 뉴스 인덱스 생성 완료');
  
  // 2. 사용자 테이블 인덱스
  console.log('📊 사용자 테이블 인덱스 생성...');
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  `);
  console.log('✅ 사용자 인덱스 생성 완료');
  
  // 3. 세션 테이블 인덱스
  console.log('📊 세션 테이블 인덱스 생성...');
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `);
  console.log('✅ 세션 인덱스 생성 완료');
  
  // 4. 북마크 테이블 인덱스
  console.log('📊 북마크 테이블 인덱스 생성...');
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_news_id ON bookmarks(news_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_news ON bookmarks(user_id, news_id);
  `);
  console.log('✅ 북마크 인덱스 생성 완료');
  
  // 5. 투표 테이블 인덱스
  console.log('📊 투표 테이블 인덱스 생성...');
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_votes_user_id ON news_votes(user_id);
    CREATE INDEX IF NOT EXISTS idx_news_votes_news_id ON news_votes(news_id);
  `);
  console.log('✅ 투표 인덱스 생성 완료');
  
  // 6. 키워드 테이블 인덱스 (테이블 존재 여부 확인)
  console.log('📊 키워드 테이블 인덱스 생성...');
  
  const keywordTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='user_news_keywords'
  `).get();
  
  if (keywordTableExists) {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_news_keywords_user_id ON user_news_keywords(user_id);
    `);
    console.log('✅ 키워드 인덱스 생성 완료');
  } else {
    console.log('⚠️  user_news_keywords 테이블이 없습니다. 스킵합니다.');
  }
  
  // 7. 데이터베이스 통계 업데이트
  console.log('📊 데이터베이스 통계 업데이트...');
  db.exec('ANALYZE;');
  console.log('✅ 통계 업데이트 완료');
  
  // 8. VACUUM 실행 (데이터베이스 최적화)
  console.log('📊 데이터베이스 VACUUM 실행...');
  db.exec('VACUUM;');
  console.log('✅ VACUUM 완료');
  
  console.log('\n✅ 데이터베이스 최적화 완료!\n');
  
  // 인덱스 목록 출력
  console.log('📋 생성된 인덱스 목록:');
  const indexes = db.prepare(`
    SELECT name, tbl_name 
    FROM sqlite_master 
    WHERE type='index' AND name LIKE 'idx_%'
    ORDER BY tbl_name, name
  `).all();
  
  indexes.forEach(idx => {
    console.log(`  - ${idx.name} (테이블: ${idx.tbl_name})`);
  });
  
} catch (error) {
  console.error('❌ 최적화 실패:', error);
  process.exit(1);
} finally {
  db.close();
}
