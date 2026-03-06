
import Database from 'better-sqlite3';
import path from 'path';

// .env refers to faith-portal.db
const dbPath = path.resolve('faith-portal.db');
console.log('Opening database at:', dbPath);

try {
    const db = new Database(dbPath, { fileMustExist: true });

    // Check current dates first
    const before = db.prepare('SELECT id, title, created_at FROM news LIMIT 3').all();
    console.log('Before Update:', before);

    // Update created_at and published_at to current timestamp for ALL news
    const info = db.prepare("UPDATE news SET created_at = datetime('now', 'localtime'), published_at = datetime('now', 'localtime')").run();
    console.log(`Updated ${info.changes} news items.`);

    // Check after update
    const after = db.prepare('SELECT id, title, created_at FROM news LIMIT 3').all();
    console.log('After Update:', after);

} catch (error) {
    console.error('Error updating news dates:', error);
}
