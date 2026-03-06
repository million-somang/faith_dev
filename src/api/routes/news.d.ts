import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
declare const newsRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
declare function parseGoogleNewsRSS(category?: string): Promise<any[]>;
export { newsRoutes, parseGoogleNewsRSS };
//# sourceMappingURL=news.d.ts.map