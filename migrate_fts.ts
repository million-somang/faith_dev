import { pool } from '@faithportal/database';

async function migrateFts() {
    console.log('Setting up SQLite FTS5 for news search...');
    try {
        // Drop if exists to ensure clean state
        await pool.query('DROP TABLE IF EXISTS news_fts');

        // 1. Create FTS5 Virtual Table
        // We tokenize using Unicode61 which works reasonably well out of the box for multiple languages.
        await pool.query(`
            CREATE VIRTUAL TABLE news_fts USING fts5(
                title, summary, tags, 
                content='news', content_rowid='id'
            );
        `);
        console.log('Created news_fts virtual table.');

        // 2. Populate FTS5 table with existing news
        await pool.query(`
            INSERT INTO news_fts(rowid, title, summary, tags)
            SELECT id, title, summary, tags FROM news;
        `);
        console.log('Populated existing news into news_fts.');

        // 3. Create Triggers to keep FTS table in sync with news table

        await pool.query('DROP TRIGGER IF EXISTS news_ai');
        await pool.query('DROP TRIGGER IF EXISTS news_ad');
        await pool.query('DROP TRIGGER IF EXISTS news_au');

        // After Insert Trigger
        await pool.query(`
            CREATE TRIGGER news_ai AFTER INSERT ON news BEGIN
                INSERT INTO news_fts(rowid, title, summary, tags) 
                VALUES (new.id, new.title, new.summary, new.tags);
            END;
        `);
        console.log('Created INSERT trigger.');

        // After Delete Trigger
        await pool.query(`
            CREATE TRIGGER news_ad AFTER DELETE ON news BEGIN
                INSERT INTO news_fts(news_fts, rowid, title, summary, tags) 
                VALUES ('delete', old.id, old.title, old.summary, old.tags);
            END;
        `);
        console.log('Created DELETE trigger.');

        // After Update Trigger
        await pool.query(`
            CREATE TRIGGER news_au AFTER UPDATE ON news BEGIN
                INSERT INTO news_fts(news_fts, rowid, title, summary, tags) 
                VALUES ('delete', old.id, old.title, old.summary, old.tags);
                INSERT INTO news_fts(rowid, title, summary, tags) 
                VALUES (new.id, new.title, new.summary, new.tags);
            END;
        `);
        console.log('Created UPDATE trigger.');

        console.log('FTS5 Migration successfully completed.');
    } catch (err: any) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit(0);
    }
}

migrateFts();
