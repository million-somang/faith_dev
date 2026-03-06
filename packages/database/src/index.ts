import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the root directory where faith-portal.db is located
let rootDir = process.cwd();
while (!fs.existsSync(path.join(rootDir, 'faith-portal.db')) && rootDir !== path.parse(rootDir).root) {
    rootDir = path.dirname(rootDir);
}

const dbPath = process.env.DATABASE_PATH || path.join(rootDir, 'faith-portal.db');
const db = new Database(dbPath);
console.log(`[Database] Connected to SQLite: ${dbPath}`);

// Run migrations
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS migrations_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL UNIQUE,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            const isExecuted = db.prepare('SELECT id FROM migrations_history WHERE filename = ?').get(file);
            if (!isExecuted) {
                console.log(`[Database] Running migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
                db.exec(sql);
                db.prepare('INSERT INTO migrations_history (filename) VALUES (?)').run(file);
                console.log(`[Database] Migration completed: ${file}`);
            }
        }
    }
} catch (error) {
    console.error('[Database] Migration Error:', error);
}

export const pool = {
    query: async (text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number, lastInsertRowid?: number | bigint }> => {
        // Convert PostgreSQL syntax to SQLite
        const sqliteText = text
            .replace(/\$\d+/g, '?')
            .replace(/ILIKE/gi, 'LIKE')
            .replace(/NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*days'/gi, "datetime('now', '-$1 days')")
            .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

        try {
            const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
            const isPragma = sqliteText.trim().toUpperCase().startsWith('PRAGMA');

            const stmt = db.prepare(sqliteText);

            if (isSelect || isPragma) {
                const rows = stmt.all(...params);
                return { rows, rowCount: rows.length };
            } else {
                const info = stmt.run(...params);
                return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
            }
        } catch (error) {
            console.error('[DB Error]', sqliteText, params, error);
            throw error;
        }
    },
    end: async () => {
        db.close();
    }
};

export const query = pool.query;

export default {
    query,
    pool,
};
