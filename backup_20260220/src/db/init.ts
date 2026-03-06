import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function initializeDatabase(db: Database.Database) {
  console.log('🔧 데이터베이스 초기화 시작...');

  try {
    // migrations 디렉토리 경로
    const migrationsDir = join(__dirname, '../../migrations');
    
    // 모든 SQL 파일 읽기
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // 파일명 순서대로 정렬

    console.log(`📁 발견된 마이그레이션 파일: ${files.length}개`);

    // 각 마이그레이션 파일 실행
    for (const file of files) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');
      
      console.log(`  ✅ 실행: ${file}`);
      
      // SQL을 세미콜론으로 분리하여 각각 실행
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          db.exec(statement);
        } catch (error: any) {
          // 테이블이 이미 존재하는 경우 무시
          if (!error.message.includes('already exists')) {
            console.error(`  ⚠️  경고: ${file} - ${error.message}`);
          }
        }
      }
    }

    console.log('✅ 데이터베이스 초기화 완료!');
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}
