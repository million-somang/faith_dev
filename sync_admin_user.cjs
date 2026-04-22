const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath = path.join(process.cwd(), 'faith-portal.db');
if (!fs.existsSync(dbPath)) {
    dbPath = path.join(__dirname, 'faith-portal.db');
}
console.log('[DB 경로]', dbPath);

const db = new Database(dbPath);

const adminUser = {
    email: 'sukman@naver.com',
    password: '9cd282be6a97be64174bbd5e7970ac0d:79780d68f33c4b645064dce31f4900cfe664944bf5f166b2d1d012ba8ffb6eeb548960d927cbdfa45221cb6b48a3fb3efaac305e215741c4c24162e32e8d43fc',
    name: 'TestUser',
    phone: '010-1234-5678',
    level: 10,
    status: 'active',
    role: 'admin'
};

try {
    // role 컬럼이 없을 수 있으므로 추가 시도
    try {
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
        console.log('role 컬럼 추가됨');
    } catch (e) {
        // 이미 존재하면 무시
    }

    // 기존 계정이 있는지 확인
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminUser.email);

    if (existing) {
        // 기존 계정 업데이트 (비밀번호 + 관리자 권한)
        db.prepare(`
            UPDATE users SET password = ?, name = ?, phone = ?, level = ?, status = ?, role = ?, updated_at = CURRENT_TIMESTAMP
            WHERE email = ?
        `).run(adminUser.password, adminUser.name, adminUser.phone, adminUser.level, adminUser.status, adminUser.role, adminUser.email);
        console.log(`✅ 기존 계정 업데이트 완료: ${adminUser.email} (id: ${existing.id})`);
    } else {
        // 새 계정 삽입
        const info = db.prepare(`
            INSERT INTO users (email, password, name, phone, level, status, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(adminUser.email, adminUser.password, adminUser.name, adminUser.phone, adminUser.level, adminUser.status, adminUser.role);
        console.log(`✅ 관리자 계정 생성 완료: ${adminUser.email} (id: ${info.lastInsertRowid})`);
    }

    // 확인
    const verify = db.prepare('SELECT id, email, name, role, level, status FROM users WHERE email = ?').get(adminUser.email);
    console.log('📋 최종 확인:', verify);

} catch (error) {
    console.error('❌ 오류 발생:', error.message);
} finally {
    db.close();
}
