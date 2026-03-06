import Database from 'better-sqlite3';
const dbPath = './faith-portal.db';
const db = new Database(dbPath);
const email = 'sukman1@naver.com';
const sessionId = 'debug-session-admin-fixed';
console.log(`Creating manual session for ${email}...`);
try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
        console.error('User not found!');
        process.exit(1);
    }
    // Expires in 1 hour
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    // Upsert session (delete old if exists)
    db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
    db.prepare('INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)')
        .run(sessionId, user.id, expiresAt);
    console.log(`✅ Session created with fixed ID: ${sessionId}`);
}
catch (error) {
    console.error('Error creating session:', error);
}
