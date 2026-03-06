import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
declare const gameRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export { gameRoutes };
//# sourceMappingURL=game.d.ts.map