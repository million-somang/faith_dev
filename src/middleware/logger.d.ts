export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogContext {
    userId?: number;
    email?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
    [key: string]: any;
}
export declare class Logger {
    private minLevel;
    constructor(minLevel?: LogLevel);
    private log;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map