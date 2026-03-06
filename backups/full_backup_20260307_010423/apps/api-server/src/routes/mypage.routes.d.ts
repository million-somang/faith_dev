import { Hono } from 'hono';
import { SessionUser } from '../middleware/auth.js';
type Variables = {
    user: SessionUser | null;
};
declare const mypage: Hono<{
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export default mypage;
//# sourceMappingURL=mypage.routes.d.ts.map