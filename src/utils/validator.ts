import { ValidationError } from '../middleware/errors'

// 필수 필드 검증
export function validateRequired(value: any, fieldName: string): void {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName}은(는) 필수 항목입니다`)
  }
}

// 이메일 검증
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError('올바른 이메일 형식이 아닙니다')
  }
}

// 비밀번호 검증
export function validatePassword(password: string, minLength: number = 6): void {
  if (!password || password.length < minLength) {
    throw new ValidationError(`비밀번호는 최소 ${minLength}자 이상이어야 합니다`)
  }
}

// 문자열 길이 검증
export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value.length < min) {
    throw new ValidationError(`${fieldName}은(는) 최소 ${min}자 이상이어야 합니다`)
  }
  if (max !== undefined && value.length > max) {
    throw new ValidationError(`${fieldName}은(는) 최대 ${max}자 이하여야 합니다`)
  }
}

// 숫자 범위 검증
export function validateRange(
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName}은(는) ${min} 이상이어야 합니다`)
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName}은(는) ${max} 이하여야 합니다`)
  }
}
