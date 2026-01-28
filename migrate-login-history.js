import Database from 'better-sqlite3';

console.log('🔄 login_history 테이블 추가 시작...\n');

const db = new Database('faith-portal.db');

try {
  // login_history 테이블이 이미 있는지 확인
  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='login_history'"
  ).get();

  if (tableExists) {
    console.log('ℹ️  login_history 테이블이 이미 존재합니다.');
  } else {
    // 테이블 생성
    db.exec(`
      CREATE TABLE login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE INDEX idx_login_history_user_id ON login_history(user_id);
    `);
    
    console.log('✅ login_history 테이블 생성 완료!');
  }

  // 테이블 스키마 확인
  const schema = db.prepare(
    "SELECT sql FROM sqlite_master WHERE name='login_history'"
  ).get();
  
  console.log('\n📋 테이블 스키마:');
  console.log(schema.sql);
  
  console.log('\n✅ 마이그레이션 완료!');
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
} finally {
  db.close();
}
