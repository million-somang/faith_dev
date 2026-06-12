const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');

// 1. 테이블 목록
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('=== Tables ===');
tables.forEach(t => console.log(' -', t.name));

// 2. 유저 확인
try {
    const users = db.prepare('SELECT id, email, name, status, substr(password,1,30) as pwd_prefix FROM users LIMIT 5').all();
    console.log('\n=== Users (first 5) ===');
    users.forEach(u => console.log(` id=${u.id}, email=${u.email}, name=${u.name}, status=${u.status}, pwd_prefix=${u.pwd_prefix}`));
} catch(e) {
    console.log('Users error:', e.message);
}

// 3. sessions 테이블
try {
    const sessions = db.prepare('SELECT count(*) as c FROM sessions').get();
    console.log('\n=== Sessions count:', sessions.c);
} catch(e) {
    console.log('\nSessions table error:', e.message);
}

// 4. login_history
try {
    const lh = db.prepare('SELECT count(*) as c FROM login_history').get();
    console.log('Login history count:', lh.c);
} catch(e) {
    console.log('Login history table error:', e.message);
}

db.close();
