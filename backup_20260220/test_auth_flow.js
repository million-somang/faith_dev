import { getDB } from './src/db/adapter';
import { createSession, checkSession } from './src/middleware/auth';
async function testSessionFlow() {
    console.log('--- SESSION FLOW TEST ---');
    try {
        const dummyContext = {
            req: { url: 'http://localhost:5000' },
            header: () => { },
            get: () => { },
            set: () => { },
            cookie: {} // Mocking cookie handling
        };
        // 1. 세션 생성 시도 (관리자 ID 2번 가정)
        const userId = 2;
        console.log(`Attempting to create session for user ID: ${userId}`);
        // createSession 내의 setCookie를 캡처하기 위해 mock
        let capturedSessionId = '';
        dummyContext.header = (name, value) => {
            if (name.toLowerCase() === 'set-cookie' && value.includes('session_id=')) {
                capturedSessionId = value.split('session_id=')[1].split(';')[0];
            }
        };
        const sessionId = await createSession(dummyContext, userId);
        console.log('Created Session ID:', sessionId);
        // 2. 세션 확인 시도
        // checkSession 내의 getCookie를 위해 mock
        dummyContext.req.header = (name) => {
            if (name.toLowerCase() === 'cookie')
                return `session_id=${sessionId}`;
            return '';
        };
        console.log('Checking session validity...');
        const user = await checkSession(dummyContext);
        if (user) {
            console.log('✅ Success: Session is valid. User:', user.name);
        }
        else {
            console.error('❌ Failure: Session is invalid immediately after creation.');
            // 왜 실패했는지 DB 데이터 직접 확인
            const db = getDB();
            const sessionInDb = await db.prepare("SELECT * FROM sessions WHERE session_id = ?").bind(sessionId).first();
            console.log('Session in DB:', sessionInDb);
            const now = await db.prepare("SELECT datetime('now') as now").first('now');
            console.log('SQLite Time:', now);
            if (sessionInDb) {
                console.log('Expiry Check:', sessionInDb.expires_at, '>', now, '?', sessionInDb.expires_at > now);
            }
        }
    }
    catch (e) {
        console.error('Test Flow Failed:', e);
    }
}
testSessionFlow();
