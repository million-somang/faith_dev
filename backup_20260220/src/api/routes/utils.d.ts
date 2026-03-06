import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
declare const utilsRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export { utilsRoutes };
//# sourceMappingURL=utils.d.ts.map