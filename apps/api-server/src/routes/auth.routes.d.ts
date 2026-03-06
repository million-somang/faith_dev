import { Hono } from 'hono';
import type { SessionUser } from '../middleware/auth.js';
declare const authRoutes: Hono<{
    Variables: {
        user: SessionUser | null;
    };
}, import("hono/types").BlankSchema, "/">;
export default authRoutes;
//# sourceMappingURL=auth.routes.d.ts.map