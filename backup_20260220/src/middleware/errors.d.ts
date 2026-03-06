export declare const ErrorCodes: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly NEWS_NOT_FOUND: "NEWS_NOT_FOUND";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly DUPLICATE_EMAIL: "DUPLICATE_EMAIL";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR";
};
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
export declare class AppError extends Error {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: any | undefined;
    constructor(code: ErrorCode, message: string, statusCode?: number, details?: any | undefined);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map