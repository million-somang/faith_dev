const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// DB 경로 탐색
let dbPath = path.join(process.cwd(), 'faith-portal.db');
if (!fs.existsSync(dbPath)) {
    dbPath = path.join(__dirname, 'faith-portal.db');
}
console.log('[DB 경로]', dbPath);

const db = new Database(dbPath);

// 비밀번호 해싱 (프로젝트와 동일한 방식)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

const email = 'sukman@naver.com';
const newPassword = 'jsj9402!@';
const hashedPassword = hashPassword(newPassword);

try {
    // role 컬럼 확인/추가
    try {
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    } catch (e) { /* 이미 존재 */ }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existing) {
        db.prepare(`
            UPDATE users SET password = ?, role = 'admin', level = 10, status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE email = ?
        `).run(hashedPassword, email);
        console.log(`✅ 비밀번호 재설정 완료: ${email}`);
    } else {
        db.prepare(`
            INSERT INTO users (email, password, name, phone, level, status, role)
            VALUES (?, ?, 'Admin', '010-0000-0000', 10, 'active', 'admin')
        `).run(email, hashedPassword);
        console.log(`✅ 관리자 계정 생성 완료: ${email}`);
    }

    const verify = db.prepare('SELECT id, email, name, role, level, status FROM users WHERE email = ?').get(email);
    console.log('📋 최종 확인:', verify);
} catch (error) {
    console.error('❌ 오류:', error.message);
} finally {
    db.close();
}
