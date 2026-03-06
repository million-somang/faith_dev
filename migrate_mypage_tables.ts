import { pool } from '@faithportal/database';

async function migrateKeywordsTable() {
    console.log('Recreating user_keywords table with correct schema...');
    try {
        await pool.query('DROP TABLE IF EXISTS user_keywords');

        await pool.query(`
            CREATE TABLE user_keywords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                keyword TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, keyword)
            );
        `);
        console.log('Recreated user_keywords table with created_at column.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrateKeywordsTable();
