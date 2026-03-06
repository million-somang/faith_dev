// 로깅 레벨
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
// Logger 클래스
export class Logger {
    minLevel;
    constructor(minLevel = LogLevel.INFO) {
        this.minLevel = minLevel;
    }
    log(level, message, context) {
        if (level < this.minLevel)
            return;
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel[level],
            message,
            ...context
        };
        // 개발 환경: 색상 콘솔 출력
        if (process.env.NODE_ENV !== 'production') {
            const color = {
                [LogLevel.DEBUG]: '\x1b[36m', // Cyan
                [LogLevel.INFO]: '\x1b[32m', // Green
                [LogLevel.WARN]: '\x1b[33m', // Yellow
                [LogLevel.ERROR]: '\x1b[31m' // Red
            }[level];
            console.log(`${color}[${LogLevel[level]}]\x1b[0m`, message, context || '');
        }
        else {
            // 프로덕션: JSON 로그
            console.log(JSON.stringify(logEntry));
        }
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    error(message, error, context) {
        this.log(LogLevel.ERROR, message, {
            ...context,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
}
// 싱글톤 인스턴스
export const logger = new Logger(process.env.NODE_ENV !== 'production' ? LogLevel.DEBUG : LogLevel.INFO);
