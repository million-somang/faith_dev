const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DB 경로 찾기
let rootDir = process.cwd();
while (!fs.existsSync(path.join(rootDir, 'faith-portal.db')) && rootDir !== path.parse(rootDir).root) {
    rootDir = path.dirname(rootDir);
}
const dbPath = path.join(rootDir, 'faith-portal.db');
console.log('[DB 경로]', dbPath);

const db = new Database(dbPath);

const email = 'sukman@naver.com';

// 현재 상태 확인
const user = db.prepare('SELECT id, email, name, role, level, status FROM users WHERE email = ?').get(email);

if (!user) {
    console.log(`❌ 사용자 "${email}"을(를) 찾을 수 없습니다.`);
    // 전체 사용자 목록 표시
    const allUsers = db.prepare('SELECT id, email, name, role, level, status FROM users').all();
    console.log('\n현재 등록된 사용자 목록:');
    allUsers.forEach(u => console.log(`  [${u.id}] ${u.email} (role: ${u.role}, level: ${u.level}, status: ${u.status})`));
    db.close();
    process.exit(1);
}

console.log('\n[변경 전]');
console.log(`  이메일: ${user.email}`);
console.log(`  이름: ${user.name}`);
console.log(`  역할: ${user.role}`);
console.log(`  레벨: ${user.level}`);
console.log(`  상태: ${user.status}`);

// admin 권한 부여: role = 'admin', level = 10 (슈퍼바이저), status = 'active'
db.prepare("UPDATE users SET role = 'admin', level = 10, status = 'active' WHERE email = ?").run(email);

// 변경 확인
const updated = db.prepare('SELECT id, email, name, role, level, status FROM users WHERE email = ?').get(email);
console.log('\n[변경 후]');
console.log(`  이메일: ${updated.email}`);
console.log(`  이름: ${updated.name}`);
console.log(`  역할: ${updated.role} ✅`);
console.log(`  레벨: ${updated.level} ✅ (6 이상이어야 관리자 인증 통과)`);
console.log(`  상태: ${updated.status} ✅`);

db.close();
console.log('\n✅ 관리자 권한 설정 완료! (role=admin, level=10, status=active)');
