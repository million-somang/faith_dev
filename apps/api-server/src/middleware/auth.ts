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
    birth_date?: string | null
    birth_time?: string | null
    gender?: string | null
    is_solar?: number | boolean | null
}

export async function checkSession(c: Context): Promise<SessionUser | null> {
    try {
        const sessionId = getCookie(c, 'session_id')
        if (!sessionId) return null

        const res = await query(
            "SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP",
            [sessionId]
        )

        if (res.rows.length === 0) return null
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

    const isHttps = c.req.url.startsWith('https://') || c.req.header('x-forwarded-proto') === 'https';

    setCookie(c, 'session_id', sessionId, {
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: true,
        secure: isHttps, 
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

export const PBKDF2_ITERATIONS = 100000;

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex')
    return `v2:${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash) return false

    // v2 형식: v2:salt:hash (100,000회 반복)
    if (storedHash.startsWith('v2:')) {
        const [, salt, hash] = storedHash.split(':')
        const verifyHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex')
        return hash === verifyHash
    }

    // v1 형식: salt:hash (1,000회 반복)
    if (storedHash.includes(':')) {
        const [salt, hash] = storedHash.split(':')
        const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
        return hash === verifyHash
    }

    // 레거시 호환 (단순 SHA512 또는 평문)
    if (password === storedHash) return true;
    const rawSha512 = crypto.createHash('sha512').update(password).digest('hex');
    return rawSha512 === storedHash;
}
