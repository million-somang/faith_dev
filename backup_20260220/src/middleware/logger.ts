// 로깅 레벨
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// 로그 컨텍스트
export interface LogContext {
  userId?: number
  email?: string
  ip?: string
  userAgent?: string
  requestId?: string
  [key: string]: any
}

// Logger 클래스
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

    // 개발 환경: 색상 콘솔 출력
    if (process.env.NODE_ENV !== 'production') {
      const color = {
        [LogLevel.DEBUG]: '\x1b[36m',  // Cyan
        [LogLevel.INFO]: '\x1b[32m',   // Green
        [LogLevel.WARN]: '\x1b[33m',   // Yellow
        [LogLevel.ERROR]: '\x1b[31m'   // Red
      }[level]
      console.log(`${color}[${LogLevel[level]}]\x1b[0m`, message, context || '')
    } else {
      // 프로덕션: JSON 로그
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

// 싱글톤 인스턴스
export const logger = new Logger(
  process.env.NODE_ENV !== 'production' ? LogLevel.DEBUG : LogLevel.INFO
)
