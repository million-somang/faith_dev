import { Hono } from 'hono';
import { SessionUser } from '../middleware/auth.js';
declare const news: Hono<{
    Variables: {
        user: SessionUser | null;
    };
}, import("hono/types").BlankSchema, "/">;
export default news;
//# sourceMappingURL=news.routes.d.ts.map