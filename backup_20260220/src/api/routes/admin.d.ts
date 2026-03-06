import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
declare const adminRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
declare function logActivity(db: any, userId: number | string | null, action: string, description: string, ip?: string): Promise<void>;
declare function createNotification(db: any, type: string, title: string, message: string, targetUserId?: number, priority?: string): Promise<void>;
export { adminRoutes, logActivity, createNotification };
//# sourceMappingURL=admin.d.ts.map