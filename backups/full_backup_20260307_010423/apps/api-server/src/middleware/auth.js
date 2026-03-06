import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { query } from '@faithportal/database';
import crypto from 'crypto';
export async function checkSession(c) {
    try {
        const sessionId = getCookie(c, 'session_id');
        console.log('[DEBUG AUTH] Cookie session_id =', sessionId);
        if (!sessionId)
            return null;
        const res = await query("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP", [sessionId]);
        console.log('[DEBUG AUTH] Query returned rows:', res.rows.length);
        if (res.rows.length === 0)
            return null;
        return res.rows[0];
        return res.rows[0];
    }
    catch (error) {
        console.error('Session check error:', error);
        return null;
    }
}
export async function optionalAuth(c, next) {
    const user = await checkSession(c);
    c.set('user', user);
    await next();
}
export async function requireAuth(c, next) {
    const user = await checkSession(c);
    if (!user)
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    c.set('user', user);
    await next();
}
export async function createSession(c, userId) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await query('INSERT INTO sessions (session_id, user_id, expires_at) VALUES ($1, $2, $3)', [sessionId, userId, expiresAt]);
    setCookie(c, 'session_id', sessionId, {
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    });
    return sessionId;
}
export async function deleteSession(c) {
    const sessionId = getCookie(c, 'session_id');
    if (sessionId) {
        await query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
    }
    deleteCookie(c, 'session_id', { path: '/' });
}
export async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}
export async function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':'))
        return false;
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}
