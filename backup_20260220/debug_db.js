import { getDB } from './src/db/adapter';
async function debug() {
    try {
        const db = getDB();
        // 1. 사용자 확인
        const users = await db.prepare('SELECT email, name, role, status FROM users LIMIT 5').all();
        console.log('--- Users ---');
        console.log(JSON.stringify(users.results, null, 2));
        // 2. 관리자 계정 구체적 확인
        const admin = await db.prepare("SELECT email, role, status FROM users WHERE email = 'sukman1@naver.com'").first();
        console.log('--- Admin User Check ---');
        console.log(admin);
        // 3. 시간 확인
        const sqliteTime = await db.prepare("SELECT datetime('now') as now").first('now');
        console.log('--- Time Check ---');
        console.log('SQLite now:', sqliteTime);
        console.log('JS now:    ', new Date().toISOString());
        console.log('JS Local:  ', new Date().toLocaleString());
        // 4. 최근 세션 확인
        const latestSession = await db.prepare('SELECT * FROM sessions ORDER BY expires_at DESC LIMIT 1').first();
        console.log('--- Latest Session ---');
        console.log(latestSession);
    }
    catch (e) {
        console.error('Debug failed:', e);
    }
}
debug();
