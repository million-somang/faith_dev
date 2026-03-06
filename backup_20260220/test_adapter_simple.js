import Database from 'better-sqlite3';
const dbPath = './faith-portal.db';
try {
    const db = new Database(dbPath);
    console.log(`✅ Database connected: ${dbPath}`);
    const row = db.prepare("SELECT role, email FROM users WHERE email = 'sukman1@naver.com'").get();
    console.log('User found:', row);
}
catch (error) {
    console.error('Database connection failed:', error);
}
