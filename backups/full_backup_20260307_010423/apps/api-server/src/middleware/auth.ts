import { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { query } from '@faithportal/database'
import crypto from 'crypto'

export interface SessionUser {
    id: number
    email: string
    name: string
    role: string
    level: number
    status: string
}

export async function checkSession(c: Context): Promise<SessionUser | null> {
    try {
        const sessionId = getCookie(c, 'session_id')
        console.log('[DEBUG AUTH] Cookie session_id =', sessionId)
        if (!sessionId) return null

        const res = await query(
            "SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP",
            [sessionId]
        )

        console.log('[DEBUG AUTH] Query returned rows:', res.rows.length)

        if (res.rows.length === 0) return null
        return res.rows[0] as SessionUser
        return res.rows[0] as SessionUser
    } catch (error) {
        console.error('Session check error:', error)
        return null
    }
}

export async function optionalAuth(c: Context, next: Next) {
    const user = await checkSession(c)
    c.set('user', user)
    await next()
}

export async function requireAuth(c: Context, next: Next) {
    const user = await checkSession(c)
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)
    c.set('user', user)
    await next()
}

export async function createSession(c: Context, userId: number): Promise<string> {
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await query(
        'INSERT INTO sessions (session_id, user_id, expires_at) VALUES ($1, $2, $3)',
        [sessionId, userId, expiresAt]
    )

    setCookie(c, 'session_id', sessionId, {
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    })

    return sessionId
}

export async function deleteSession(c: Context) {
    const sessionId = getCookie(c, 'session_id')
    if (sessionId) {
        await query('DELETE FROM sessions WHERE session_id = $1', [sessionId])
    }
    deleteCookie(c, 'session_id', { path: '/' })
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash) return false

    // 콜론(:)이 없는 기존 유저의 비밀번호 값 호환 패치 (평문 비교 또는 단순 SHA512 비교)
    if (!storedHash.includes(':')) {
        if (password === storedHash) return true;

        // 추가로 단순 sha512 비교 허용
        const rawSha512 = crypto.createHash('sha512').update(password).digest('hex');
        if (rawSha512 === storedHash) return true;

        return false;
    }

    const [salt, hash] = storedHash.split(':')
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return hash === verifyHash
}
