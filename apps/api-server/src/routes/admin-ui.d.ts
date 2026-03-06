import { Hono } from 'hono';
export declare const adminUi: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export declare function getBreadcrumb(items: Array<{
    label: string;
    href?: string;
}>): string;
export declare function getGameMenu(currentPage: string): string;
export declare function getSimpleGameSidebar(currentPage: string): string;
export declare function getLifestyleMenu(currentPage: string): string;
export declare function getFinanceMenu(currentPage: string): string;
export declare function getEntertainmentMenu(currentPage: string): string;
export declare function getEducationMenu(currentPage: string): string;
export declare function getShoppingMenu(currentPage: string): string;
export declare function getCommonHeader(sectionName?: string): string;
export declare function getStickyHeader(): string;
export declare function getCommonAuthScript(): string;
export declare function getAuthPopupScript(): string;
export declare function getCommonFooter(): string;
export declare function getAdminNavigation(currentPage: string): string;
//# sourceMappingURL=admin-ui.d.ts.map