import Database from 'better-sqlite3';
const db = new Database('./faith-portal.db');
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
async function resetPassword() {
    const password = 'test';
    const hashedPassword = await hashPassword(password);
    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('sukman1@naver.com');
    if (!user) {
        console.log('User sukman1@naver.com not found. Inserting...');
        // Insert logic if needed, but for now just log
        db.prepare(`
            INSERT INTO users (email, password, name, phone, role, level, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('sukman1@naver.com', hashedPassword, '관리자', '010-0000-0000', 'admin', 10, 'active');
        console.log('User created.');
    }
    else {
        const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
        const info = stmt.run(hashedPassword, 'sukman1@naver.com');
        console.log(`Password reset for existing user. Changes: ${info.changes}`);
    }
}
resetPassword().catch(console.error);
