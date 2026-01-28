import { getDB } from './src/db/adapter.ts';

// 테스트
const mockContext = { env: {} };
try {
  const db = getDB(mockContext);
  console.log('DB 객체:', db);
  console.log('DB.prepare 타입:', typeof db.prepare);
} catch (error) {
  console.error('오류:', error.message);
}
