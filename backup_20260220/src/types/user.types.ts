// User 관련 타입 정의
export interface User {
  id: number
  email: string
  password?: string  // 조회 시 제외
  name: string
  phone?: string
  level: number
  status: 'active' | 'suspended' | 'deleted'
  role: 'user' | 'admin'
  created_at: string
  last_login?: string
  updated_at?: string
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

export interface UpdateUserDTO {
  name?: string
  phone?: string
  level?: number
}
