import { Context, Next } from 'hono';
export declare function errorHandler(c: Context, next: Next): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    message: string;
    error: string | undefined;
}, 500, "json">) | undefined>;
//# sourceMappingURL=errors.d.ts.map