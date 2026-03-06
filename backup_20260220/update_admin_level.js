import Database from 'better-sqlite3';
const dbPath = './faith-portal.db';
const db = new Database(dbPath);
const email = 'sukman1@naver.com';
try {
    const user = db.prepare('SELECT id, email, role, level FROM users WHERE email = ?').get(email);
    if (!user) {
        console.error('User not found!');
        process.exit(1);
    }
    console.log(`Current user state: Role=${user.role}, Level=${user.level}`);
    if (user.level < 10) {
        const info = db.prepare("UPDATE users SET level = 10 WHERE email = ?").run(email);
        console.log(`Updated level to 10. Changes: ${info.changes}`);
    }
    else {
        console.log('User level is already sufficient.');
    }
}
catch (error) {
    console.error('Error:', error);
}
