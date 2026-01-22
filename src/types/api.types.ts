// API 응답 타입
export interface ApiSuccess<T = any> {
  success: true
  data?: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  error?: {
    code?: string
    details?: any
  }
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// 페이지네이션
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
