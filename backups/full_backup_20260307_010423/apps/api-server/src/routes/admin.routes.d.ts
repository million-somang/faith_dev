import { Hono } from 'hono';
declare const adminRoutes: Hono<{
    Variables: {
        adminUserId: string;
    };
}, import("hono/types").BlankSchema, "/">;
declare const requireAdmin: (c: any, next: any) => Promise<any>;
declare function logActivity(db: any, userId: number | string | null, action: string, description: string, ip?: string): Promise<void>;
declare function createNotification(db: any, type: string, title: string, message: string, targetUserId?: number, priority?: string): Promise<void>;
export { adminRoutes, logActivity, createNotification, requireAdmin };
//# sourceMappingURL=admin.routes.d.ts.map