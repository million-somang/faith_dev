import { Context, Next } from 'hono'

export async function errorHandler(c: Context, next: Next) {
    try {
        await next()
    } catch (err) {
        console.error('Unhandled error:', err)
        return c.json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
        }, 500)
    }
}
