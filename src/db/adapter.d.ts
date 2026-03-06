import { Context } from 'hono';
export type D1Database = {
    prepare: (query: string) => D1PreparedStatement;
    dump: () => Promise<ArrayBuffer>;
    batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>;
    exec: (query: string) => Promise<D1ExecResult>;
};
type D1PreparedStatement = {
    bind: (...values: any[]) => D1PreparedStatement;
    first: <T = unknown>(colName?: string) => Promise<T | null>;
    run: () => Promise<D1Result>;
    all: <T = unknown>() => Promise<D1Result<T>>;
    raw: <T = unknown>() => Promise<T[]>;
};
type D1Result<T = unknown> = {
    results: T[];
    success: boolean;
    meta: any;
    error?: string;
};
type D1ExecResult = {
    count: number;
    duration: number;
};
export declare const getDB: (c?: Context) => any;
export {};
//# sourceMappingURL=adapter.d.ts.map