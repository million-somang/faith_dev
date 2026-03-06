import { getDB } from './src/db/adapter';
import path from 'path';

async function debug() {
    console.log('--- Environment Info ---');
    console.log('Current Working Directory:', process.cwd());
    const dbPath = process.env.DATABASE_PATH || './faith-portal.db';
    console.log('DATABASE_PATH (env):', dbPath);
    console.log('Absolute DB Path:', path.resolve(dbPath));

    try {
        const db = getDB();
        console.log('DB adapter is using better-sqlite3:', !!db._db);

        const sessionsCount = await db.prepare('SELECT COUNT(*) as count FROM sessions').first('count');
        console.log('Total sessions in DB:', sessionsCount);

        const usersCount = await db.prepare('SELECT COUNT(*) as count FROM users').first('count');
        console.log('Total users in DB:', usersCount);

    } catch (e) {
        console.error('Debug failed:', e);
    }
}

debug();
