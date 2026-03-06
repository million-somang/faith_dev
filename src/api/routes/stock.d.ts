import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
declare const stockRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export { stockRoutes };
//# sourceMappingURL=stock.d.ts.map