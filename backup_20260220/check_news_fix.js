import Database from 'better-sqlite3';
import path from 'path';
const dbPath = path.resolve('faithportal.db');
const db = new Database(dbPath);
const rows = db.prepare('SELECT id, title, created_at, published_at FROM news ORDER BY created_at DESC LIMIT 5').all();
console.log('Current News Dates:', rows);
