// Cloudflare Bindings 타입 정의
export type Bindings = {
  DB: D1Database
  FIGMA_ACCESS_TOKEN?: string
  BROWSERLESS_API_TOKEN?: string
}

// Hono Context Variables
export interface Variables {
  user?: SessionUser
}

// SessionUser 타입
export interface SessionUser {
  id: number
  email: string
  name: string
  role: string
  level: number
  status: string
}
