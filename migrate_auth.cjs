const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'faith-portal.db');
const db = new Database(dbPath);

console.log('Migrating SQLite database...');

// users table check
try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasStatus = tableInfo.some(col => col.name === 'status');
    const hasLastLogin = tableInfo.some(col => col.name === 'last_login');
    const hasPassword = tableInfo.some(col => col.name === 'password');
    const hasPasswordHash = tableInfo.some(col => col.name === 'password_hash');

    if (!hasStatus) {
        db.exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
        console.log('Added status to users');
    }
    if (!hasLastLogin) {
        db.exec("ALTER TABLE users ADD COLUMN last_login TIMESTAMP");
        console.log('Added last_login to users');
    }
    if (!hasPassword && hasPasswordHash) {
        // SQLite doesn't directly support RENAME COLUMN in old versions, but better-sqlite3 supports modern SQLite
        db.exec("ALTER TABLE users RENAME COLUMN password_hash TO password");
        console.log('Renamed password_hash to password');
    }
} catch (e) { console.error('Error modifying users table:', e) }

// Create sessions table
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('Created sessions table');
} catch (e) { console.error('Error creating sessions table:', e) }

// Create login_history table
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('Created login_history table');
} catch (e) { console.error('Error creating login_history table:', e) }

console.log('Migration complete.');
db.close();
