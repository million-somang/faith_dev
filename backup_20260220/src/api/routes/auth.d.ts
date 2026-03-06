import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
declare const authRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export { authRoutes };
//# sourceMappingURL=auth.d.ts.map