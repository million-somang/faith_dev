import { getDB } from './src/db/adapter';

async function verify() {
    try {
        const db = getDB();
        console.log('--- DATABASE RE-VERIFICATION ---');

        // 1. 관리자 계정 정밀 정보
        const admin = await db.prepare("SELECT id, email, role, level, status FROM users WHERE email = 'sukman1@naver.com'").first();
        console.log('Admin User Details:', JSON.stringify(admin, null, 2));

        // 2. 전체 사용자 수 및 세션 수
        const stats = await db.prepare("SELECT (SELECT COUNT(*) FROM users) as userCount, (SELECT COUNT(*) FROM sessions) as sessionCount").first();
        console.log('Current Stats:', stats);

        if (admin) {
            // 3. 해당 사용자의 최근 세션 확인
            const sessions = await db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT 3").bind(admin.id).all();
            console.log('Latest Sessions for Admin:', JSON.stringify(sessions.results, null, 2));
        }

    } catch (e) {
        console.error('Verification failed:', e);
    }
}

verify();
