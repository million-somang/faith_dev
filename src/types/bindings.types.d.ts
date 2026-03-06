export type Bindings = {
    DB: D1Database;
    FIGMA_ACCESS_TOKEN?: string;
    BROWSERLESS_API_TOKEN?: string;
};
export interface Variables {
    user?: SessionUser;
    adminUserId?: string;
}
export interface SessionUser {
    id: number;
    email: string;
    name: string;
    role: string;
    level: number;
    status: string;
}
//# sourceMappingURL=bindings.types.d.ts.map