import { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getDB } from '../db/adapter'

// 세션 사용자 타입 정의
export interface SessionUser {
  id: number
  email: string
  name: string
  role: string
  level: number
  status: string
}

// 세션 확인 함수
export async function checkSession(c: Context): Promise<SessionUser | null> {
  try {
    const sessionId = getCookie(c, 'session_id')
    if (!sessionId) {
      return null
    }

    const DB = getDB(c)

    // DB에서 세션 조회
    const session = await DB
      .prepare('SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime("now")')
      .bind(sessionId)
      .first()

    if (!session) {
      return null
    }

    // 사용자 정보 조회
    const user = await DB
      .prepare('SELECT id, email, name, role, level, status FROM users WHERE id = ? AND status = "active"')
      .bind(session.user_id)
      .first()

    if (!user) {
      // 세션은 있지만 사용자가 없거나 비활성화된 경우
      await DB
        .prepare('DELETE FROM sessions WHERE session_id = ?')
        .bind(sessionId)
        .run()
      return null
    }

    return user as SessionUser
  } catch (error) {
    console.error('세션 확인 오류:', error)
    return null
  }
}

// 로그인 필수 미들웨어
export async function requireAuth(c: Context, next: Next) {
  const user = await checkSession(c)
  
  if (!user) {
    // JSON API 요청인 경우
    const acceptHeader = c.req.header('Accept') || ''
    if (acceptHeader.includes('application/json')) {
      return c.json({ 
        success: false, 
        message: '로그인이 필요합니다',
        requireAuth: true
      }, 401)
    }
    
    // 일반 페이지 요청인 경우 - 로그인 페이지로 리다이렉트
    const redirectUrl = encodeURIComponent(c.req.url)
    return c.redirect('/login?redirect=' + redirectUrl)
  }

  // 사용자 정보를 컨텍스트에 저장
  c.set('user', user)
  await next()
}

// 선택적 인증 미들웨어 (로그인 여부만 체크)
export async function optionalAuth(c: Context, next: Next) {
  const user = await checkSession(c)
  c.set('user', user)
  await next()
}

// 관리자 권한 필수 미들웨어
export async function requireAdmin(c: Context, next: Next) {
  const user = await checkSession(c)
  
  if (!user) {
    const acceptHeader = c.req.header('Accept') || ''
    if (acceptHeader.includes('application/json')) {
      return c.json({ success: false, message: '로그인이 필요합니다' }, 401)
    }
    return c.redirect('/login?redirect=' + encodeURIComponent(c.req.url))
  }

  if (user.role !== 'admin') {
    const acceptHeader = c.req.header('Accept') || ''
    if (acceptHeader.includes('application/json')) {
      return c.json({ success: false, message: '관리자 권한이 필요합니다' }, 403)
    }
    return c.html('<h1>403 - 권한이 없습니다</h1><p>관리자 권한이 필요합니다.</p>', 403)
  }

  c.set('user', user)
  await next()
}

// 세션 생성 헬퍼 함수
export async function createSession(c: Context, userId: number): Promise<string> {
  // 세션 ID 생성
  const sessionId = crypto.randomUUID()
  
  // 만료 시간: 7일 후
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const DB = getDB(c)

  // DB에 세션 저장
  await DB
    .prepare('INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt.toISOString())
    .run()

  // 쿠키 설정
  setCookie(c, 'session_id', sessionId, {
    maxAge: 7 * 24 * 60 * 60, // 7일
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/'
  })

  return sessionId
}

// 세션 삭제 헬퍼 함수
export async function deleteSession(c: Context): Promise<void> {
  const sessionId = getCookie(c, 'session_id')
  
  if (sessionId) {
    const DB = getDB(c)
    
    // DB에서 세션 삭제
    await DB
      .prepare('DELETE FROM sessions WHERE session_id = ?')
      .bind(sessionId)
      .run()
  }

  // 쿠키 삭제
  deleteCookie(c, 'session_id', {
    path: '/'
  })
}

// 비밀번호 해싱 (Web Crypto API 사용)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}
