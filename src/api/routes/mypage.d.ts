import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
declare const mypageRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export { mypageRoutes };
//# sourceMappingURL=mypage.d.ts.map