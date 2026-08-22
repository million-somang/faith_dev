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

const authRoutes = new Hono<{ Variables: { user: SessionUser | null } }>()

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
            return c.json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            }, 401)
        }

        // 계정 상태 확인
        if (user.status !== 'active') {
            return c.json({
                success: false,
                message: '비활성화된 계정입니다. 관리자에게 문의하세요'
            }, 403)
        }

        // 비밀번호 검증
        const isValid = await verifyPassword(password, user.password as string)

        if (!isValid) {
            return c.json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            }, 401)
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
        console.error('로그인 오류 상세:', error)
        if (error instanceof Error) {
            console.error('Stack:', error.stack)
        }
        return c.json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error))
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
        await deleteSession(c)

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
        const body = await c.req.json()
        const { email, password, name, phone, birth_date, birthDate, birth_time, birthTime, gender, is_solar, isSolar } = body

        // 입력 검증
        if (!email || !password || !name) {
            return c.json({
                success: false,
                message: '필수 항목을 모두 입력해주세요'
            }, 400)
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return c.json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다'
            }, 400)
        }

        // 비밀번호 길이 검증
        if (password.length < 6) {
            return c.json({
                success: false,
                message: '비밀번호는 최소 6자 이상이어야 합니다'
            }, 400)
        }

        // 중복 이메일 확인
        const existingUserRes = await query('SELECT id FROM users WHERE email = $1', [email])

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
        `, [email, hashedPassword, name, phone || null, finalBirthDate, finalBirthTime, finalGender, finalIsSolar])

        const userId = Number(result.lastInsertRowid)

        // 자동 로그인 (세션 생성)
        await createSession(c, userId)

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
        console.error('회원가입 오류:', error)
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
