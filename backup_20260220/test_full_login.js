import { getDB } from './src/db/adapter';
import { verifyPassword, createSession } from './src/middleware/auth';
async function testFullLoginHandle() {
    console.log('--- FULL LOGIN API SIMULATION ---');
    try {
        const db = getDB();
        const email = 'sukman1@naver.com';
        const password = '1234';
        // 1. 사용자 조회 (authRoutes.post('/api/auth/login') 로직 시뮬레이션)
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user) {
            console.error('User not found');
            return;
        }
        // 2. 비밀번호 검증
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            console.error('Invalid password');
            return;
        }
        // 3. 세션 생성
        console.log('Creating session...');
        const dummyContext = {
            req: { url: 'http://localhost:5000', header: () => 'unknown' },
            header: () => { },
            get: () => { },
            set: () => { },
            cookie: {}
        };
        await createSession(dummyContext, user.id);
        // 4. 마지막 로그인 시간 업데이트
        console.log('Updating last login time...');
        await db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").bind(user.id).run();
        // 5. 로그인 기록 저장 (가장 의심되는 부분!)
        console.log('Inserting into login_history...');
        try {
            await db.prepare('INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?, ?, ?)')
                .bind(user.id, '127.0.0.1', 'testui-agent')
                .run();
            console.log('✅ Success: Login history recorded.');
        }
        catch (historyErr) {
            console.error('❌ Failure in login_history:', historyErr.message);
        }
        console.log('✅ Full Login Logic Success!');
    }
    catch (e) {
        console.error('Overall Simulation Failed:', e);
    }
}
testFullLoginHandle();
