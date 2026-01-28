import Database from 'better-sqlite3';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 환경 변수 로드
const dotenv = require('dotenv');
dotenv.config();

let db;

// Node.js 환경에서 SQLite 데이터베이스 초기화
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  const dbPath = process.env.DATABASE_PATH || './faith-portal.db';
  db = new Database(dbPath);
  console.log(`✅ SQLite 데이터베이스 연결: ${dbPath}`);
}

// D1과 호환되는 SQLite 어댑터
export const getDB = (c) => {
  // Cloudflare Pages 환경
  if (c && c.env && c.env.DB) {
    return c.env.DB;
  }
  
  // Node.js 환경
  if (db) {
    return {
      prepare: (query) => {
        const stmt = db.prepare(query);
        return {
          bind: (...params) => {
            return {
              run: async () => {
                const info = stmt.run(...params);
                return {
                  success: true,
                  meta: {
                    changes: info.changes,
                    last_row_id: info.lastInsertRowid
                  }
                };
              },
              first: async () => {
                return stmt.get(...params);
              },
              all: async () => {
                return stmt.all(...params);
              }
            };
          },
          run: async () => {
            const info = stmt.run();
            return {
              success: true,
              meta: {
                changes: info.changes,
                last_row_id: info.lastInsertRowid
              }
            };
          },
          first: async () => {
            return stmt.get();
          },
          all: async () => {
            return stmt.all();
          }
        };
      }
    };
  }
  
  throw new Error('데이터베이스가 초기화되지 않았습니다.');
};
