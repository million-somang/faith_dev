import { Hono } from 'hono';
import { getDB } from '../../db/adapter';
import { checkSession, createSession, deleteSession, hashPassword, verifyPassword } from '../../middleware/auth';
const authRoutes = new Hono();
// 사용자 정보 조회 API
authRoutes.get('/api/auth/me', async (c) => {
    try {
        const user = await checkSession(c);
        if (!user) {
            return c.json({
                success: true,
                loggedIn: false,
                user: null
            });
        }
        return c.json({
            success: true,
            loggedIn: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                level: user.level
            }
        });
    }
    catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        return c.json({
            success: false,
            message: '사용자 정보 조회 실패'
        }, 500);
    }
});
// 로그인 API
authRoutes.post('/api/auth/login', async (c) => {
    try {
        const { email, password } = await c.req.json();
        // 입력 검증
        if (!email || !password) {
            return c.json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요'
            }, 400);
        }
        // 사용자 조회
        const user = await getDB(c)
            .prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first();
        if (!user) {
            return c.json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            }, 401);
        }
        // 계정 상태 확인
        if (user.status !== 'active') {
            return c.json({
                success: false,
                message: '비활성화된 계정입니다. 관리자에게 문의하세요'
            }, 403);
        }
        // 비밀번호 검증
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return c.json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            }, 401);
        }
        // 세션 생성
        await createSession(c, user.id);
        // 마지막 로그인 시간 업데이트
        await getDB(c)
            .prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?")
            .bind(user.id)
            .run();
        // 로그인 기록 저장
        const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
        const userAgent = c.req.header('User-Agent') || 'unknown';
        await getDB(c)
            .prepare('INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?, ?, ?)')
            .bind(user.id, ipAddress, userAgent)
            .run();
        return c.json({
            success: true,
            message: '로그인 성공',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                level: user.level
            }
        });
    }
    catch (error) {
        console.error('로그인 오류 상세:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        return c.json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error))
        }, 500);
    }
});
// 세션 확인 핸들러 (공통 로직)
const handleAuthCheck = async (c) => {
    try {
        const user = await checkSession(c);
        if (!user) {
            return c.json({
                success: false,
                loggedIn: false,
                message: '로그인이 필요합니다'
            });
        }
        return c.json({
            success: true,
            loggedIn: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                level: user.level,
                status: user.status
            }
        });
    }
    catch (error) {
        console.error('세션 확인 오류:', error);
        return c.json({
            success: false,
            loggedIn: false,
            message: '세션 확인 중 오류가 발생했습니다'
        }, 500);
    }
};
// 세션 확인 API
authRoutes.get('/api/auth/check', handleAuthCheck);
// 세션 확인 API (별칭 - 프론트엔드 호환성)
authRoutes.get('/api/auth/me', handleAuthCheck);
// 로그아웃 API
authRoutes.post('/api/auth/logout', async (c) => {
    try {
        await deleteSession(c);
        return c.json({
            success: true,
            message: '로그아웃 성공'
        });
    }
    catch (error) {
        console.error('로그아웃 오류:', error);
        return c.json({
            success: false,
            message: '로그아웃 처리 중 오류가 발생했습니다'
        }, 500);
    }
});
// 회원가입 API
authRoutes.post('/api/auth/signup', async (c) => {
    try {
        const { email, password, name, phone } = await c.req.json();
        // 입력 검증
        if (!email || !password || !name) {
            return c.json({
                success: false,
                message: '필수 항목을 모두 입력해주세요'
            }, 400);
        }
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return c.json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다'
            }, 400);
        }
        // 비밀번호 길이 검증
        if (password.length < 6) {
            return c.json({
                success: false,
                message: '비밀번호는 최소 6자 이상이어야 합니다'
            }, 400);
        }
        // 데이터베이스 어댑터 가져오기
        const DB = getDB(c);
        // 중복 이메일 확인
        const existingUser = await DB
            .prepare('SELECT id FROM users WHERE email = ?')
            .bind(email)
            .first();
        if (existingUser) {
            return c.json({
                success: false,
                message: '이미 사용 중인 이메일입니다'
            }, 409);
        }
        // 비밀번호 해싱
        const hashedPassword = await hashPassword(password);
        // 사용자 생성
        const result = await DB
            .prepare(`
        INSERT INTO users (email, password, name, phone, level, status, role) 
        VALUES (?, ?, ?, ?, 1, 'active', 'user')
      `)
            .bind(email, hashedPassword, name, phone || null)
            .run();
        // 자동 로그인 (세션 생성)
        const userId = result.meta.last_row_id;
        await createSession(c, userId);
        return c.json({
            success: true,
            message: '회원가입 성공',
            user: {
                id: userId,
                email,
                name,
                role: 'user',
                level: 1
            }
        });
    }
    catch (error) {
        console.error('회원가입 오류:', error);
        return c.json({
            success: false,
            message: '회원가입 처리 중 오류가 발생했습니다'
        }, 500);
    }
});
export { authRoutes };
