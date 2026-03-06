import { Context, Next } from 'hono';
export interface SessionUser {
    id: number;
    email: string;
    name: string;
    role: string;
    level: number;
    status: string;
}
export declare function checkSession(c: Context): Promise<SessionUser | null>;
export declare function requireAuth(c: Context, next: Next): Promise<(Response & import("hono").TypedResponse<undefined, 302, "redirect">) | (Response & import("hono").TypedResponse<{
    success: false;
    message: string;
    requireAuth: true;
}, 401, "json">) | undefined>;
export declare function optionalAuth(c: Context, next: Next): Promise<void>;
export declare function requireAdmin(c: Context, next: Next): Promise<Response | undefined>;
export declare function createSession(c: Context, userId: number): Promise<string>;
export declare function deleteSession(c: Context): Promise<void>;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
//# sourceMappingURL=auth.d.ts.map