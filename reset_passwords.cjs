const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('faith-portal.db');

// 현재 해시 방식으로 비밀번호 재설정
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

const newPassword = 'test1234';
const hashedPassword = hashPassword(newPassword);

// 모든 기존 유저의 비밀번호를 test1234로 재설정 (테스트용)
const users = db.prepare('SELECT id, email, name FROM users').all();
console.log('=== Resetting passwords for all users ===');
console.log(`New password: "${newPassword}"`);
console.log(`Hash: ${hashedPassword.substring(0, 50)}...`);
console.log('');

const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
users.forEach(u => {
    stmt.run(hashedPassword, u.id);
    console.log(`  ✅ id=${u.id}, email=${u.email} → password reset`);
});

// 검증
console.log('\n=== Verification ===');
const testUser = db.prepare('SELECT password FROM users WHERE id = 1').get();
const [salt, hash] = testUser.password.split(':');
const verifyHash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
console.log('Password match:', hash === verifyHash);

db.close();
console.log('\nDone! All users can now login with password: test1234');
