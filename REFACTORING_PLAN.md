# Faith Portal 코드 리팩토링 플랜

## 📊 현재 상황 분석

### 코드 규모
- **src/index.tsx**: 24,501 라인 (1.1MB) 🔴 **너무 큼!**
- **전체 TypeScript**: 25,402 라인
- **API 라우트**: 130개
- **헬퍼 함수**: 20개 이상
- **console.log**: 261개 🔴 **너무 많음!**

### 현재 구조
```
src/
├── index.tsx (24,501 lines) ⚠️ 모놀리식 파일
├── middleware/
│   └── auth.ts (인증 미들웨어)
└── utils/
    ├── stockDataFetcher.ts
    ├── stockMapper.ts
    ├── stockNewsCollector.ts
    ├── stockNewsFilter.ts
    └── exchangeRateProvider.ts
```

---

## 🎯 리팩토링 목표

### 1. 파일 분리 (Modularization)
**목표**: 24,501 라인 → 500 라인 이하로 분할

### 2. 코드 중복 제거 (DRY)
**목표**: 중복 코드 90% 제거

### 3. 에러 핸들링 개선
**목표**: 모든 API에 일관된 에러 처리

### 4. 로깅 정리
**목표**: 261개 console.log → 50개 이하 (구조화된 로깅)

### 5. 타입 안전성 강화
**목표**: any 타입 제거, 엄격한 타입 체크

---

## 📁 Phase 1: 파일 구조 재설계 (우선순위: 🔥 높음)

### 새로운 디렉토리 구조
```
src/
├── index.tsx (라우트 등록만, ~200 lines)
├── middleware/
│   ├── auth.ts (✅ 이미 존재)
│   ├── errorHandler.ts (새로 생성)
│   └── logger.ts (새로 생성)
├── routes/
│   ├── auth.routes.ts (로그인, 회원가입, 로그아웃)
│   ├── news.routes.ts (뉴스 API)
│   ├── admin.routes.ts (관리자 API)
│   ├── game.routes.ts (게임 API)
│   ├── lifestyle.routes.ts (라이프스타일 API)
│   ├── finance.routes.ts (금융 API)
│   ├── shopping.routes.ts (쇼핑 API)
│   └── entertainment.routes.ts (엔터테인먼트 API)
├── controllers/
│   ├── auth.controller.ts
│   ├── news.controller.ts
│   ├── admin.controller.ts
│   └── ... (각 도메인별 컨트롤러)
├── services/
│   ├── auth.service.ts (비즈니스 로직)
│   ├── news.service.ts
│   ├── user.service.ts
│   └── ... (각 도메인별 서비스)
├── templates/ (새로 생성)
│   ├── components/
│   │   ├── header.ts (getCommonHeader)
│   │   ├── footer.ts (getCommonFooter)
│   │   ├── stickyHeader.ts (getStickyHeader)
│   │   ├── authScript.ts (getCommonAuthScript)
│   │   └── menus/
│   │       ├── gameMenu.ts
│   │       ├── lifestyleMenu.ts
│   │       ├── financeMenu.ts
│   │       └── ... (각 메뉴 컴포넌트)
│   ├── pages/
│   │   ├── home.ts
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   ├── news.ts
│   │   └── ... (각 페이지 템플릿)
│   └── admin/
│       ├── dashboard.ts
│       ├── users.ts
│       ├── news.ts
│       └── ... (관리자 페이지 템플릿)
├── utils/
│   ├── stockDataFetcher.ts (✅ 이미 존재)
│   ├── stockMapper.ts (✅ 이미 존재)
│   ├── stockNewsCollector.ts (✅ 이미 존재)
│   ├── stockNewsFilter.ts (✅ 이미 존재)
│   ├── exchangeRateProvider.ts (✅ 이미 존재)
│   ├── validator.ts (새로 생성 - 입력 검증)
│   ├── formatter.ts (새로 생성 - 날짜, 숫자 포맷)
│   └── htmlEscape.ts (새로 생성 - escapeHtml)
├── types/
│   ├── index.ts (모든 타입 export)
│   ├── user.types.ts
│   ├── news.types.ts
│   ├── admin.types.ts
│   └── ... (각 도메인별 타입 정의)
└── config/
    ├── constants.ts (상수 정의)
    └── database.ts (DB 설정)
```

### 예상 효과
- **index.tsx**: 24,501 → 200 라인 (99% 감소 🎉)
- **유지보수성**: 특정 기능 수정 시 해당 파일만 수정
- **테스트 용이성**: 각 모듈 독립적으로 테스트 가능
- **협업 개선**: 파일 충돌 최소화

---

## 🔧 Phase 2: 공통 코드 추출 (우선순위: 🔥 높음)

### 2.1. 중복된 HTML 템플릿 컴포넌트화

#### 문제점
```typescript
// 현재: 같은 코드가 여러 곳에 중복
app.get('/page1', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/..."></link>
        <!-- 중복된 CDN 링크들 -->
      </head>
      <body>
        ${getCommonHeader('페이지1')}
        <!-- 콘텐츠 -->
        ${getCommonFooter()}
      </body>
    </html>
  `)
})
```

#### 해결책
```typescript
// templates/layout.ts
export function getLayout(options: {
  title: string
  sectionName?: string
  content: string
  scripts?: string[]
}): string {
  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title} - Faith Portal</title>
        ${getCommonCDNLinks()}
        ${options.scripts?.map(s => `<script src="${s}"></script>`).join('\n') || ''}
      </head>
      <body class="bg-gray-50" id="html-root">
        ${getCommonAuthScript()}
        ${getCommonHeader(options.sectionName || '')}
        ${getStickyHeader()}
        
        <main class="min-h-screen">
          ${options.content}
        </main>
        
        ${getCommonFooter()}
      </body>
    </html>
  `
}

// 사용법
app.get('/page1', (c) => {
  return c.html(getLayout({
    title: '페이지1',
    sectionName: '페이지1',
    content: `<div>페이지 콘텐츠</div>`
  }))
})
```

### 2.2. 중복된 API 패턴 추출

#### 문제점
```typescript
// 현재: 모든 API에 동일한 try-catch 패턴 반복
app.post('/api/endpoint1', async (c) => {
  try {
    const data = await c.req.json()
    // 로직
    return c.json({ success: true, data })
  } catch (error) {
    console.error('오류:', error)
    return c.json({ success: false, message: '처리 실패' }, 500)
  }
})
```

#### 해결책
```typescript
// middleware/errorHandler.ts
export function asyncHandler(
  fn: (c: Context) => Promise<Response>
) {
  return async (c: Context) => {
    try {
      return await fn(c)
    } catch (error) {
      logger.error('API 오류:', error)
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : '서버 오류',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      }, 500)
    }
  }
}

// 사용법
app.post('/api/endpoint1', asyncHandler(async (c) => {
  const data = await c.req.json()
  // 로직
  return c.json({ success: true, data })
}))
```

### 2.3. 중복된 검증 로직 추출

#### 문제점
```typescript
// 현재: 이메일 검증 로직이 여러 곳에 중복
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return c.json({ success: false, message: '올바른 이메일이 아닙니다' }, 400)
}
```

#### 해결책
```typescript
// utils/validator.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError('올바른 이메일 형식이 아닙니다')
  }
}

export function validatePassword(password: string): void {
  if (!password || password.length < 6) {
    throw new ValidationError('비밀번호는 최소 6자 이상이어야 합니다')
  }
}

export function validateRequired(value: any, fieldName: string): void {
  if (!value) {
    throw new ValidationError(`${fieldName}은(는) 필수 항목입니다`)
  }
}

// 사용법
app.post('/api/auth/signup', asyncHandler(async (c) => {
  const { email, password, name } = await c.req.json()
  
  validateRequired(email, '이메일')
  validateRequired(password, '비밀번호')
  validateRequired(name, '이름')
  validateEmail(email)
  validatePassword(password)
  
  // 비즈니스 로직
}))
```

---

## 🚨 Phase 3: 에러 핸들링 개선 (우선순위: 🔥 높음)

### 3.1. 통일된 에러 응답 형식

```typescript
// types/error.types.ts
export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// middleware/errorHandler.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  // 인증 오류 (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // 권한 오류 (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 요청 오류 (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 리소스 오류 (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NEWS_NOT_FOUND: 'NEWS_NOT_FOUND',
  
  // 충돌 오류 (409)
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  
  // 서버 오류 (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
} as const

// 글로벌 에러 핸들러
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json<ApiError>({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    }, err.statusCode)
  }
  
  if (err instanceof ValidationError) {
    return c.json<ApiError>({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: err.message
      }
    }, 400)
  }
  
  // 예상치 못한 오류
  logger.error('Unexpected error:', err)
  return c.json<ApiError>({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: '서버 오류가 발생했습니다',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  }, 500)
})
```

### 3.2. 사용 예시

```typescript
// Before (inconsistent)
if (!user) {
  return c.json({ success: false, message: '사용자를 찾을 수 없습니다' }, 404)
}

// After (consistent)
if (!user) {
  throw new AppError(
    ErrorCodes.USER_NOT_FOUND,
    '사용자를 찾을 수 없습니다',
    404
  )
}
```

---

## 📝 Phase 4: 로깅 시스템 개선 (우선순위: 🟡 중간)

### 4.1. 구조화된 로깅

```typescript
// middleware/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  userId?: number
  email?: string
  ip?: string
  userAgent?: string
  requestId?: string
  [key: string]: any
}

export class Logger {
  private minLevel: LogLevel

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (level < this.minLevel) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...context
    }

    // 개발 환경: 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      const color = {
        [LogLevel.DEBUG]: '\x1b[36m',  // Cyan
        [LogLevel.INFO]: '\x1b[32m',   // Green
        [LogLevel.WARN]: '\x1b[33m',   // Yellow
        [LogLevel.ERROR]: '\x1b[31m'   // Red
      }[level]
      console.log(`${color}[${LogLevel[level]}]\x1b[0m`, message, context || '')
    }

    // 프로덕션: 구조화된 JSON 로그
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry))
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }
}

export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
)

// 사용법
logger.info('사용자 로그인 성공', { userId: 1, email: 'user@example.com' })
logger.error('DB 조회 실패', error, { query: 'SELECT * FROM users' })
```

### 4.2. 로그 정리 계획

**제거 대상 (개발용 디버깅 로그)**
```typescript
console.log('updateUserMenu 실행')  // ❌ 제거
console.log('API 응답:', data)       // ❌ 제거
console.log('로그인 상태 - 사용자:', data.user.name)  // ❌ 제거
```

**유지/변경 대상 (중요 로그)**
```typescript
// Before
console.error('로그인 오류:', error)

// After
logger.error('로그인 실패', error, { 
  email: email,
  ip: c.req.header('CF-Connecting-IP')
})
```

---

## 🎨 Phase 5: 타입 안전성 강화 (우선순위: 🟡 중간)

### 5.1. 타입 정의 파일 생성

```typescript
// types/user.types.ts
export interface User {
  id: number
  email: string
  name: string
  phone?: string
  level: number
  status: 'active' | 'suspended' | 'deleted'
  role: 'user' | 'admin'
  created_at: string
  last_login?: string
  updated_at?: string
}

export interface SessionUser {
  id: number
  email: string
  name: string
  role: string
  level: number
  status: string
}

export interface CreateUserDTO {
  email: string
  password: string
  name: string
  phone?: string
}

export interface LoginDTO {
  email: string
  password: string
}

// types/news.types.ts
export interface News {
  id: number
  category: NewsCategory
  title: string
  summary?: string
  link: string
  image_url?: string
  publisher?: string
  pub_date?: string
  ai_summary?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  vote_up: number
  vote_down: number
  view_count: number
  popularity_score: number
  created_at: string
  updated_at: string
}

export type NewsCategory = 
  | 'general' 
  | 'politics' 
  | 'economy' 
  | 'tech' 
  | 'sports' 
  | 'entertainment'

export interface FetchNewsDTO {
  category: NewsCategory
  limit?: number
  offset?: number
}

// types/api.types.ts
export interface PaginationParams {
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

### 5.2. Hono 타입 활용

```typescript
// types/bindings.types.ts
export type Bindings = {
  DB: D1Database
  FIGMA_ACCESS_TOKEN?: string
  BROWSERLESS_API_TOKEN?: string
}

export type Variables = {
  user?: SessionUser
}

// index.tsx
import { Hono } from 'hono'
import type { Bindings, Variables } from './types/bindings.types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 이제 c.env.DB, c.get('user') 등이 자동 완성되고 타입 체크됨
```

---

## 🔄 Phase 6: 비즈니스 로직 분리 (우선순위: 🟢 낮음)

### 6.1. 서비스 레이어 패턴

```typescript
// services/auth.service.ts
export class AuthService {
  constructor(private db: D1Database) {}

  async signup(dto: CreateUserDTO): Promise<User> {
    // 이메일 중복 체크
    const existing = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(dto.email)
      .first()
    
    if (existing) {
      throw new AppError(
        ErrorCodes.DUPLICATE_EMAIL,
        '이미 사용 중인 이메일입니다',
        409
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(dto.password)

    // 사용자 생성
    const result = await this.db
      .prepare(`
        INSERT INTO users (email, password, name, phone, level, status, role) 
        VALUES (?, ?, ?, ?, 1, 'active', 'user')
      `)
      .bind(dto.email, hashedPassword, dto.name, dto.phone || null)
      .run()

    const userId = result.meta.last_row_id as number

    // 사용자 정보 반환
    const user = await this.getUserById(userId)
    if (!user) {
      throw new AppError(ErrorCodes.INTERNAL_ERROR, '사용자 생성 후 조회 실패', 500)
    }

    return user
  }

  async login(dto: LoginDTO): Promise<User> {
    // 사용자 조회
    const user = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(dto.email)
      .first<User>()

    if (!user) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        '이메일 또는 비밀번호가 올바르지 않습니다',
        401
      )
    }

    // 계정 상태 확인
    if (user.status !== 'active') {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        '비활성화된 계정입니다',
        403
      )
    }

    // 비밀번호 검증
    const isValid = await verifyPassword(dto.password, user.password as string)
    if (!isValid) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        '이메일 또는 비밀번호가 올바르지 않습니다',
        401
      )
    }

    return user
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>()
  }
}

// controllers/auth.controller.ts
export class AuthController {
  private authService: AuthService

  constructor(db: D1Database) {
    this.authService = new AuthService(db)
  }

  signup = asyncHandler(async (c) => {
    const dto = await c.req.json<CreateUserDTO>()
    
    // 검증
    validateRequired(dto.email, '이메일')
    validateRequired(dto.password, '비밀번호')
    validateRequired(dto.name, '이름')
    validateEmail(dto.email)
    validatePassword(dto.password)

    // 비즈니스 로직
    const user = await this.authService.signup(dto)

    // 세션 생성
    await createSession(c, user.id)

    // 로그
    logger.info('회원가입 성공', { userId: user.id, email: user.email })

    return c.json<ApiSuccess<User>>({
      success: true,
      data: user
    })
  })

  login = asyncHandler(async (c) => {
    const dto = await c.req.json<LoginDTO>()
    
    // 검증
    validateRequired(dto.email, '이메일')
    validateRequired(dto.password, '비밀번호')

    // 비즈니스 로직
    const user = await this.authService.login(dto)

    // 세션 생성
    await createSession(c, user.id)

    // 로그인 기록
    const ipAddress = c.req.header('CF-Connecting-IP') || 'unknown'
    const userAgent = c.req.header('User-Agent') || 'unknown'
    
    await c.env.DB
      .prepare('INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?, ?, ?)')
      .bind(user.id, ipAddress, userAgent)
      .run()

    // 마지막 로그인 시간 업데이트
    await c.env.DB
      .prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
      .bind(user.id)
      .run()

    // 로그
    logger.info('로그인 성공', { userId: user.id, email: user.email, ip: ipAddress })

    return c.json<ApiSuccess<User>>({
      success: true,
      data: user
    })
  })
}

// routes/auth.routes.ts
import { Hono } from 'hono'
import { AuthController } from '../controllers/auth.controller'

export function createAuthRoutes(db: D1Database) {
  const router = new Hono()
  const authController = new AuthController(db)

  router.post('/signup', authController.signup)
  router.post('/login', authController.login)
  router.post('/logout', authController.logout)
  router.get('/me', authController.me)

  return router
}

// index.tsx
import { createAuthRoutes } from './routes/auth.routes'

const authRoutes = createAuthRoutes(app.env.DB)
app.route('/api/auth', authRoutes)
```

---

## 📋 실행 계획 (Execution Plan)

### Week 1: 긴급 정리 (우선순위 🔥)
1. **Day 1-2**: Phase 1 - 디렉토리 구조 생성
   - `templates/`, `routes/`, `controllers/`, `services/`, `types/` 디렉토리 생성
   - 파일 스켈레톤 생성

2. **Day 3-4**: Phase 2 - 템플릿 컴포넌트 분리
   - `getCommonHeader`, `getCommonFooter`, `getStickyHeader` → `templates/components/`
   - 각 메뉴 함수들 → `templates/components/menus/`
   - 레이아웃 헬퍼 생성

3. **Day 5**: Phase 3 - 에러 핸들링 설정
   - `middleware/errorHandler.ts` 생성
   - `types/error.types.ts` 생성
   - 글로벌 에러 핸들러 적용

### Week 2: 코어 리팩토링
4. **Day 1-2**: Phase 4 - 로깅 시스템
   - `middleware/logger.ts` 생성
   - 261개 console.log → 구조화된 로깅으로 변경

5. **Day 3-5**: Phase 5 - 타입 정의
   - 모든 타입 정의 파일 생성 (`types/`)
   - any 타입 제거

### Week 3: 라우트 분리
6. **Day 1-2**: 인증 라우트 분리
   - `routes/auth.routes.ts`
   - `controllers/auth.controller.ts`
   - `services/auth.service.ts`

7. **Day 3-4**: 뉴스 라우트 분리
   - `routes/news.routes.ts`
   - `controllers/news.controller.ts`
   - `services/news.service.ts`

8. **Day 5**: 관리자 라우트 분리
   - `routes/admin.routes.ts`
   - `controllers/admin.controller.ts`

### Week 4: 페이지 템플릿 분리
9. **Day 1-3**: 페이지 템플릿 분리
   - `templates/pages/` 에 모든 페이지 템플릿 이동

10. **Day 4-5**: 테스트 및 검증
    - 모든 API 엔드포인트 테스트
    - 모든 페이지 렌더링 테스트
    - 에러 케이스 테스트

---

## ✅ 완료 체크리스트

### Phase 1: 파일 분리
- [ ] 디렉토리 구조 생성
- [ ] index.tsx를 200줄 이하로 줄이기
- [ ] 라우트 파일 분리 (8개 도메인)
- [ ] 컨트롤러 파일 분리
- [ ] 서비스 파일 분리

### Phase 2: 공통 코드 추출
- [ ] 레이아웃 헬퍼 생성
- [ ] 템플릿 컴포넌트 분리 (20개+)
- [ ] asyncHandler 미들웨어 생성
- [ ] 검증 유틸리티 생성

### Phase 3: 에러 핸들링
- [ ] AppError 클래스 생성
- [ ] ErrorCodes 상수 정의
- [ ] 글로벌 에러 핸들러 구현
- [ ] 모든 API에 통일된 에러 응답 적용

### Phase 4: 로깅 시스템
- [ ] Logger 클래스 생성
- [ ] 구조화된 로깅 적용
- [ ] console.log 261개 → 50개 이하로 감소
- [ ] 프로덕션 로깅 설정

### Phase 5: 타입 안전성
- [ ] 모든 도메인 타입 정의 (10개+)
- [ ] Hono Bindings 타입 정의
- [ ] any 타입 제거
- [ ] 타입 체크 통과

### Phase 6: 비즈니스 로직 분리
- [ ] 서비스 레이어 구현 (8개 도메인)
- [ ] 컨트롤러에서 비즈니스 로직 제거
- [ ] 단위 테스트 가능하도록 구조화

---

## 📊 예상 개선 효과

### 코드 품질
| 지표 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| **index.tsx 라인 수** | 24,501 | 200 | **99% 감소** |
| **파일 수** | 10 | 80+ | **8배 증가** |
| **평균 파일 크기** | 2,450 라인 | 300 라인 | **88% 감소** |
| **console.log 개수** | 261 | 50 | **81% 감소** |
| **타입 안전성** | 낮음 | 높음 | **100% 개선** |
| **코드 중복** | 높음 | 낮음 | **90% 감소** |

### 유지보수성
- ✅ 특정 기능 수정 시 **단일 파일만 수정**
- ✅ 새 기능 추가 시 **기존 코드 영향 최소화**
- ✅ 버그 발생 시 **원인 파악 시간 80% 단축**
- ✅ 코드 리뷰 시간 **70% 단축**

### 테스트 가능성
- ✅ 단위 테스트 작성 가능
- ✅ 통합 테스트 작성 가능
- ✅ 모의(Mock) 객체 사용 가능
- ✅ 테스트 커버리지 측정 가능

### 협업 효율
- ✅ 파일 충돌 **90% 감소**
- ✅ 코드 리뷰 효율 **3배 향상**
- ✅ 신규 개발자 온보딩 시간 **50% 단축**

---

## 🚀 시작하기

### 1단계: 백업
```bash
# 현재 코드 백업
cd /home/user/webapp
git add .
git commit -m "Backup before refactoring"
git tag before-refactoring

# 백업 브랜치 생성
git checkout -b backup/before-refactoring
git checkout main
```

### 2단계: 리팩토링 브랜치 생성
```bash
git checkout -b refactor/phase1-file-structure
```

### 3단계: 디렉토리 생성
```bash
mkdir -p src/{routes,controllers,services,templates/{components,pages,admin},types,config}
mkdir -p src/templates/components/menus
```

### 4단계: 단계별 실행
- 각 Phase는 독립적으로 실행 가능
- 각 단계 완료 후 커밋
- 테스트 후 다음 단계 진행

---

## 💡 주의사항

### DO ✅
- **작은 단위로 커밋**: 각 파일 분리 후 바로 커밋
- **테스트 우선**: 분리 후 즉시 테스트
- **점진적 마이그레이션**: 한 번에 하나의 도메인만 분리
- **타입 정의 우선**: 파일 분리 전에 타입 먼저 정의

### DON'T ❌
- **한 번에 모든 것 변경**: 단계별로 진행
- **테스트 없이 진행**: 각 단계마다 검증
- **기존 API 변경**: 외부 인터페이스는 유지
- **브레이킹 체인지**: 호환성 유지

---

## 📞 다음 단계

이 플랜을 검토한 후, 다음 중 하나를 선택하세요:

1. **🟢 전체 진행**: Week 1부터 시작
2. **🟡 부분 진행**: 특정 Phase만 선택
3. **🔴 플랜 수정**: 우선순위 조정 또는 내용 변경

어떤 방식으로 진행하시겠습니까?
