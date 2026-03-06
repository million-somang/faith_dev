export async function errorHandler(c, next) {
    try {
        await next();
    }
    catch (err) {
        console.error('Unhandled error:', err);
        return c.json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        }, 500);
    }
}
