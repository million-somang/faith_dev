import { Context, Next } from 'hono';
import { logApiError } from './activityLogger.js';

export async function errorHandler(c: Context, next: Next) {
    const start = performance.now();
    try {
        await next();
    } catch (err) {
        const elapsed = performance.now() - start;
        const msg = err instanceof Error ? err.message : String(err);
        c.set('errorLogged', true);
        logApiError(c, 500, `Unhandled Exception: ${msg}`, elapsed, err);
        return c.json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? msg : undefined
        }, 500);
    }
}
