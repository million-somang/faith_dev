import Database from 'better-sqlite3';
const dbPath = './faith-portal.db';
const db = new Database(dbPath);
console.log(`Connecting to ${dbPath}`);
const userEmail = 'sukman1@naver.com';
try {
    // 1. Check current role
    const user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(userEmail);
    if (!user) {
        console.error(`User ${userEmail} not found!`);
        process.exit(1);
    }
    console.log(`Current role for ${userEmail}:`, user.role);
    // 2. Update to admin
    if (user.role !== 'admin') {
        const info = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(userEmail);
        console.log(`Updated role to 'admin'. Changes: ${info.changes}`);
    }
    else {
        console.log('User is already admin.');
    }
    // 3. Verify update
    const updatedUser = db.prepare('SELECT role FROM users WHERE email = ?').get(userEmail);
    console.log(`Verified new role:`, updatedUser.role);
}
catch (error) {
    console.error('Error updating role:', error);
}
