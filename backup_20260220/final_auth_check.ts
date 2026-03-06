import { getDB } from './src/db/adapter';
import { hashPassword } from './src/middleware/auth';

async function finalCheck() {
    try {
        const db = getDB();
        const email = 'sukman1@naver.com';
        const inputPassword = '1234';

        const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        const inputHash = await hashPassword(inputPassword);

        console.log('--- FINAL AUTH CHECK ---');
        console.log('Target Email:', email);
        console.log('User Found:', !!user);

        if (user) {
            console.log('User Status:', user.status);
            console.log('User Role:', user.role);
            console.log('User Level:', user.level);
            console.log('DB Password Hash:', user.password);
            console.log('Input Password Hash (1234):', inputHash);
            console.log('Match?', user.password === inputHash);

            if (user.password !== inputHash) {
                console.log('⚠️ Password in DB does NOT match "1234".');
                // 만약 'test'의 해시인지 확인
                const testHash = await hashPassword('test');
                if (user.password === testHash) {
                    console.log('💡 Note: DB password is currently set to "test".');
                }
            }
        }

        // 추가: 세션 테이블 스키마 확인 (expires_at 타입 등)
        const schema = await db.prepare("SELECT sql FROM sqlite_master WHERE name='sessions'").first();
        console.log('Sessions Schema:', schema.sql);

    } catch (e) {
        console.error('Final check failed:', e);
    }
}

finalCheck();
