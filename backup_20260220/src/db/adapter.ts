import { Context } from 'hono'
import Database, { Database as DatabaseType } from 'better-sqlite3'
import { createRequire } from 'module'
import path from 'path'

const require = createRequire(import.meta.url)

// 환경 변수 로드
const dotenv = require('dotenv')
dotenv.config()

// D1 데이터베이스 타입 정의
export type D1Database = {
  prepare: (query: string) => D1PreparedStatement
  dump: () => Promise<ArrayBuffer>
  batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>
  exec: (query: string) => Promise<D1ExecResult>
}

type D1PreparedStatement = {
  bind: (...values: any[]) => D1PreparedStatement
  first: <T = unknown>(colName?: string) => Promise<T | null>
  run: () => Promise<D1Result>
  all: <T = unknown>() => Promise<D1Result<T>>
  raw: <T = unknown>() => Promise<T[]>
}

type D1Result<T = unknown> = {
  results: T[]
  success: boolean
  meta: any
  error?: string
}

type D1ExecResult = {
  count: number
  duration: number
}

let db: DatabaseType | null = null

// Node.js 환경에서 SQLite 데이터베이스 초기화
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  const dbPath = process.env.DATABASE_PATH || './faith-portal.db'
  db = new Database(dbPath)
  console.log(`✅ SQLite 데이터베이스 연결 (Adapter): ${dbPath}`)

  try {
    const row = db.prepare("SELECT role FROM users WHERE email = 'sukman1@naver.com'").get() as any
    console.log(`[DB Debug] sukman1@naver.com role in ${dbPath}:`, row ? row.role : 'User not found')
  } catch (e) {
    console.error('[DB Debug] Failed to query user role:', e)
  }

  // 데이터베이스 테이블 상태 확인 (단순 로깅)
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get()
    if (!tableCheck) {
      console.warn('⚠️ [Warning] users 테이블이 존재하지 않습니다. 기존 데이터를 확인해주세요.')
    } else {
      console.log('✅ Found users table, database is ready.')
    }
  } catch (error) {
    console.error('⚠️ 데이터베이스 상태 확인 중 오류:', error)
  }
}

// D1과 호환되는 SQLite 어댑터
export const getDB = (c?: Context): any => {
  // 1. Cloudflare Workers 환경 (D1) - 환경 변수가 있는 경우 우선 시도 (단, 로컬 db가 있으면 로컬 우선)
  const d1 = c?.env ? (c.env as any).DB : null

  // 2. Node.js 환경 (better-sqlite3) - 로컬 db가 초기화된 경우 최우선 사용 (개발 환경 안정성)
  if (db) {
    return {
      _db: db, // 디버깅용 표시
      prepare: (query: string) => {
        const stmt = db!.prepare(query)

        const createExecutor = (boundParams: any[]) => ({
          bind: (...additionalParams: any[]) => createExecutor([...boundParams, ...additionalParams]),
          first: async <T = unknown>(colName?: string) => {
            try {
              const row = stmt.get(...boundParams) as any
              if (row && colName) return row[colName] as T
              return row as T
            } catch (e) {
              return null
            }
          },
          run: async () => {
            const info = stmt.run(...boundParams)
            return {
              success: true,
              meta: {
                changes: info.changes,
                last_row_id: info.lastInsertRowid
              }
            }
          },
          all: async <T = unknown>() => {
            try {
              const results = stmt.all(...boundParams) as T[]
              return {
                results,
                success: true,
                meta: { changes: 0, duration: 0 }
              }
            } catch (e) {
              console.error('[DB Adapter] Query Error:', e);
              throw e;
            }
          },
          raw: async <T = unknown>() => {
            return stmt.all(...boundParams) as T[]
          }
        });

        return createExecutor([]);
      },
      batch: async (statements: any[]) => {
        throw new Error('Batch not fully implemented for local sqlite adapter')
      },
      exec: async (query: string) => {
        db!.exec(query)
        return { count: 0, duration: 0 }
      },
      dump: async () => {
        throw new Error('Dump not implemented locally')
      }
    }
  }

  // 3. 마지막 수단: D1 반환
  if (d1) return d1

  throw new Error('Database not initialized')
}
