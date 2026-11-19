import { Hono } from 'hono'
import { Context } from 'hono'
import { query } from '@faithportal/database'
import {
    checkSession,
    createSession,
    deleteSession,
    hashPassword,
    verifyPassword
} from '../middleware/auth.js'
import type { SessionUser } from '../middleware/auth.js'
import { getActorLabel, logActivity, logApiError } from '../middleware/activityLogger.js'

const authRoutes = new Hono<{ Variables: { user: SessionUser | null; errorLogged?: boolean } }>()

// IP 기반 로그인 실패 레이트 리미터 (5분 내 10회 실패 시 일시 차단)
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000
const LOGIN_MAX_FAILURES = 10
const loginFailureMap = new Map<string, { count: number; resetAt: number }>()

// IP 기반 회원가입 레이트 리미터 (1시간 내 5회 초과 차단)
const SIGNUP_RATE_WINDOW_MS = 60 * 60 * 1000
const SIGNUP_MAX_PER_HOUR = 5
const signupRateMap = new Map<string, { count: number; resetAt: number }>()

function checkAndIncrementSignupRate(ip: string): boolean {
    const now = Date.now()
    if (signupRateMap.size > 2000) {
        for (const [k, v] of signupRateMap.entries()) {
            if (now > v.resetAt) signupRateMap.delete(k)
        }
    }
    const entry = signupRateMap.get(ip)
    if (!entry || now > entry.resetAt) {
        signupRateMap.set(ip, { count: 1, resetAt: now + SIGNUP_RATE_WINDOW_MS })
        return false
    }
    if (entry.count >= SIGNUP_MAX_PER_HOUR) return true
    entry.count += 1
    return false
}

function getClientIp(c: Context): string {
    const forwarded = c.req.header('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return c.req.header('x-real-ip') || 'unknown'
}

function isLoginRateLimited(ip: string): boolean {
    const now = Date.now()
    const entry = loginFailureMap.get(ip)
    if (!entry) return false
    if (now > entry.resetAt) {
        loginFailureMap.delete(ip)
        return false
    }
    return entry.count >= LOGIN_MAX_FAILURES
}

function recordLoginFailure(ip: string): void {
    const now = Date.now()
    if (loginFailureMap.size > 2000) {
        for (const [k, v] of loginFailureMap.entries()) {
            if (now > v.resetAt) loginFailureMap.delete(k)
        }
    }
    const entry = loginFailureMap.get(ip)
    if (!entry || now > entry.resetAt) {
        loginFailureMap.set(ip, { count: 1, resetAt: now + LOGIN_RATE_WINDOW_MS })
    } else {
        entry.count += 1
    }
}

// 사용자 정보 조회 API
authRoutes.get('/api/auth/me', async (c: Context) => {
    try {
        const user = await checkSession(c)

        if (!user) {
            return c.json({
                success: true,
                loggedIn: false,
                user: null
            })
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
                birth_date: user.birth_date || null,
                birth_time: user.birth_time || null,
                gender: user.gender || 'M',
                is_solar: user.is_solar !== 0
            }
        })
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error)
        return c.json({
            success: false,
            message: '사용자 정보 조회 실패'
        }, 500)
    }
})

// 로그인 API
authRoutes.post('/api/auth/login', async (c: Context) => {
    try {
        const clientIp = getClientIp(c)
        if (isLoginRateLimited(clientIp)) {
            return c.json({
                success: false,
                message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요'
            }, 429)
        }

        const { email, password } = await c.req.json()

        // 입력 검증
        if (!email || !password) {
            return c.json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요'
            }, 400)
        }

        // 사용자 조회
        const res = await query('SELECT * FROM users WHERE email = $1', [email])
        const user = res.rows[0]

        if (!user) {
            recordLoginFailure(clientIp)
            c.set('errorLogged', true)
            logApiError(c, 401, `로그인 실패 (존재하지 않는 이메일: ${email})`)
            return c.json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            }, 401)
        }

        // 계정 상태 확인
        if (user.status !== 'active') {
            recordLoginFailure(clientIp)
            c.set('errorLogged', true)
            logApiError(c, 403, `비활성 계정 로그인 시도 (${email})`)
            return c.json({
                success: false,
                message: '비활성화된 계정입니다. 관리자에게 문의하세요'
            }, 403)
        }

        // 비밀번호 검증
        const isValid = await verifyPassword(password, user.password as string)

        if (!isValid) {
            recordLoginFailure(clientIp)
            c.set('errorLogged', true)
            logApiError(c, 401, `로그인 실패 (비밀번호 불일치: ${email})`)
            return c.json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            }, 401)
        }

        // 로그인 성공 시 실패 카운트 초기화
        loginFailureMap.delete(clientIp)

        // v1(1,000회) 계정은 로그인 성공 시 v2(100,000회) 해시로 자동 업그레이드
        if (typeof user.password === 'string' && !user.password.startsWith('v2:')) {
            try {
                const upgradedHash = await hashPassword(password)
                await query('UPDATE users SET password = $1 WHERE id = $2', [upgradedHash, user.id])
            } catch { /* non-fatal upgrade */ }
        }

        // 세션 생성
        await createSession(c, user.id as number)

        // 마지막 로그인 시간 업데이트
        await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

        // 로그인 기록 저장
        const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
        const userAgent = c.req.header('User-Agent') || 'unknown'

        await query(
            'INSERT INTO login_history (user_id, ip_address, user_agent) VALUES ($1, $2, $3)',
            [user.id, ipAddress, userAgent]
        )

        logActivity('🔐', '로그인성공', `회원(${user.name || user.email})`, `${user.email} 로그인 완료 (Lv.${user.level || 1})`)

        return c.json({
            success: true,
            message: '로그인 성공',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                level: user.level,
                birth_date: user.birth_date || null,
                birth_time: user.birth_time || null,
                gender: user.gender || 'M',
                is_solar: user.is_solar !== 0
            }
        })
    } catch (error) {
        c.set('errorLogged', true)
        logApiError(c, 500, '로그인 처리 중 서버 오류', undefined, error)
        return c.json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다'
        }, 500)
    }
})

// 세션 확인 핸들러 (공통 로직)
const handleAuthCheck = async (c: Context) => {
    try {
        const user = await checkSession(c)

        if (!user) {
            return c.json({
                success: false,
                loggedIn: false,
                message: '로그인이 필요합니다'
            })
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
                status: user.status,
                birth_date: user.birth_date || null,
                birth_time: user.birth_time || null,
                gender: user.gender || 'M',
                is_solar: user.is_solar !== 0
            }
        })
    } catch (error) {
        console.error('세션 확인 오류:', error)
        return c.json({
            success: false,
            loggedIn: false,
            message: '세션 확인 중 오류가 발생했습니다'
        }, 500)
    }
}

// 세션 확인 API
authRoutes.get('/api/auth/check', handleAuthCheck)

// 로그아웃 API
authRoutes.post('/api/auth/logout', async (c: Context) => {
    try {
        const user = await checkSession(c)
        await deleteSession(c)
        if (user) {
            logActivity('👋', '로그아웃', `회원(${user.name || user.email})`, `${user.email} 로그아웃`)
        }

        return c.json({
            success: true,
            message: '로그아웃 성공'
        })
    } catch (error) {
        console.error('로그아웃 오류:', error)
        return c.json({
            success: false,
            message: '로그아웃 처리 중 오류가 발생했습니다'
        }, 500)
    }
})

// 회원가입 API
authRoutes.post('/api/auth/signup', async (c: Context) => {
    try {
        const clientIp = getClientIp(c)
        if (checkAndIncrementSignupRate(clientIp)) {
            return c.json({
                success: false,
                message: '회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요'
            }, 429)
        }

        const body = await c.req.json()
        const { email, password, name, phone, birth_date, birthDate, birth_time, birthTime, gender, is_solar, isSolar } = body

        // 입력 검증
        if (!email || !password || !name || typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
            return c.json({
                success: false,
                message: '필수 항목을 모두 입력해주세요'
            }, 400)
        }

        const normalizedEmail = email.trim()
        const trimmedName = name.trim()

        // 이메일 형식 및 길이 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (normalizedEmail.length > 120 || !emailRegex.test(normalizedEmail)) {
            return c.json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다'
            }, 400)
        }

        if (trimmedName.length < 1 || trimmedName.length > 40) {
            return c.json({
                success: false,
                message: '이름은 1자 이상 40자 이하로 입력해주세요'
            }, 400)
        }

        // 비밀번호 길이 검증
        if (password.length < 6 || password.length > 128) {
            return c.json({
                success: false,
                message: '비밀번호는 6자 이상 128자 이하로 입력해주세요'
            }, 400)
        }

        // 중복 이메일 확인
        const existingUserRes = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail])

        if (existingUserRes.rows.length > 0) {
            return c.json({
                success: false,
                message: '이미 사용 중인 이메일입니다'
            }, 409)
        }

        // 비밀번호 해싱
        const hashedPassword = await hashPassword(password)
        const finalBirthDate = birthDate || birth_date || null
        const finalBirthTime = birthTime !== undefined ? birthTime : (birth_time !== undefined ? birth_time : null)
        const finalGender = gender || 'M'
        const finalIsSolar = (isSolar === false || is_solar === 0 || is_solar === false) ? 0 : 1

        // 사용자 생성 (생년월일 및 사주 정보 컬럼 포함)
        const result = await query(`
            INSERT INTO users (email, password, name, phone, birth_date, birth_time, gender, is_solar, level, status, role) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 'active', 'user')
        `, [normalizedEmail, hashedPassword, trimmedName, phone || null, finalBirthDate, finalBirthTime, finalGender, finalIsSolar])

        const userId = Number(result.lastInsertRowid)

        // 자동 로그인 (세션 생성)
        await createSession(c, userId)

        logActivity('🎉', '신규회원가입', getActorLabel(c), `신규 회원 #${userId} 가입 완료! (${name} · ${email})`)

        return c.json({
            success: true,
            message: '회원가입 성공',
            user: {
                id: userId,
                email,
                name,
                role: 'user',
                level: 1,
                birth_date: finalBirthDate,
                birth_time: finalBirthTime,
                gender: finalGender,
                is_solar: finalIsSolar === 1
            }
        })
    } catch (error) {
        c.set('errorLogged', true)
        logApiError(c, 500, '회원가입 처리 중 서버 오류', undefined, error)
        return c.json({
            success: false,
            message: '회원가입 처리 중 오류가 발생했습니다'
        }, 500)
    }
})

// 사주 프로필(생년월일, 태어난시, 성별 등) 업데이트 API
const handleUpdateSajuProfile = async (c: Context) => {
    try {
        const user = await checkSession(c)
        if (!user) {
            return c.json({ success: false, message: '로그인이 필요합니다' }, 401)
        }

        const body = await c.req.json()
        const { birth_date, birthDate, birth_time, birthTime, gender, is_solar, isSolar, name } = body

        const finalBirthDate = birthDate !== undefined ? birthDate : (birth_date !== undefined ? birth_date : user.birth_date)
        const finalBirthTime = birthTime !== undefined ? birthTime : (birth_time !== undefined ? birth_time : user.birth_time)
        const finalGender = gender !== undefined ? gender : (user.gender || 'M')
        const finalIsSolar = isSolar !== undefined 
            ? (isSolar ? 1 : 0) 
            : (is_solar !== undefined ? (is_solar ? 1 : 0) : (user.is_solar ? 1 : 0))
        const finalName = (name && typeof name === 'string' && name.trim()) ? name.trim() : user.name

        await query(`
            UPDATE users 
            SET birth_date = $1, birth_time = $2, gender = $3, is_solar = $4, name = $5
            WHERE id = $6
        `, [finalBirthDate, finalBirthTime, finalGender, finalIsSolar, finalName, user.id])

        logActivity('🔮', '사주프로필저장', `회원(${finalName || user.email})`, `생년월일(${finalBirthDate || '미입력'}) 프로필 업데이트`)

        return c.json({
            success: true,
            message: '사주 프로필이 성공적으로 저장되었습니다',
            user: {
                id: user.id,
                email: user.email,
                name: finalName,
                role: user.role,
                level: user.level,
                birth_date: finalBirthDate,
                birth_time: finalBirthTime,
                gender: finalGender,
                is_solar: finalIsSolar === 1
            }
        })
    } catch (error) {
        console.error('사주 프로필 업데이트 오류:', error)
        return c.json({ success: false, message: '사주 프로필 저장 실패' }, 500)
    }
}

authRoutes.post('/api/user/saju-profile', handleUpdateSajuProfile)
authRoutes.put('/api/user/saju-profile', handleUpdateSajuProfile)
authRoutes.post('/api/auth/profile', handleUpdateSajuProfile)
authRoutes.put('/api/auth/profile', handleUpdateSajuProfile)

export default authRoutes
