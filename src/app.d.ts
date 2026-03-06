import { Hono } from 'hono';
import type { Bindings, Variables } from './types';
declare const app: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=app.d.ts.map