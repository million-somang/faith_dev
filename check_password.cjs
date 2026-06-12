const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('faith-portal.db');

// 전체 유저의 비밀번호 포맷 확인
const users = db.prepare('SELECT id, email, password FROM users').all();
console.log('=== Password format analysis ===');
users.forEach(u => {
    const pw = u.password;
    const hasColon = pw.includes(':');
    if (hasColon) {
        const [salt, hash] = pw.split(':');
        console.log(`id=${u.id}, email=${u.email}: salt_len=${salt.length}, hash_len=${hash.length}, total=${pw.length}`);
    } else {
        console.log(`id=${u.id}, email=${u.email}: NO COLON, len=${pw.length}`);
    }
});

// 테스트: 알려진 비밀번호로 직접 해시 생성해서 비교
console.log('\n=== Direct hash test ===');
const testPasswords = ['test1234', 'password', '123456', 'testtest'];
const user1 = users[0];
const [salt1, hash1] = user1.password.split(':');
console.log(`User 1 (${user1.email}):`);
console.log(`  Salt: ${salt1} (${salt1.length} chars)`);
console.log(`  Hash: ${hash1} (${hash1.length} chars)`);

testPasswords.forEach(pw => {
    const verifyHash = crypto.pbkdf2Sync(pw, salt1, 1000, 64, 'sha512').toString('hex');
    console.log(`  pw="${pw}": hash_len=${verifyHash.length}, starts_with="${verifyHash.substring(0,10)}...", stored_starts="${hash1.substring(0,10)}..."`);
    // Try matching with truncation
    if (verifyHash.startsWith(hash1) || hash1.startsWith(verifyHash.substring(0, hash1.length))) {
        console.log(`    >>> PARTIAL MATCH FOUND! pw="${pw}" <<<`);
    }
});

db.close();
