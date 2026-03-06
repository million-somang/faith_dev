// 에러 코드 상수
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
};
// AppError 클래스
export class AppError extends Error {
    code;
    message;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}
// ValidationError 클래스
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
