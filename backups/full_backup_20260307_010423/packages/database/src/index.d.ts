export declare const pool: {
    query: (text: string, params?: any[]) => Promise<{
        rows: any[];
        rowCount: number;
        lastInsertRowid?: number | bigint;
    }>;
    end: () => Promise<void>;
};
export declare const query: (text: string, params?: any[]) => Promise<{
    rows: any[];
    rowCount: number;
    lastInsertRowid?: number | bigint;
}>;
declare const _default: {
    query: (text: string, params?: any[]) => Promise<{
        rows: any[];
        rowCount: number;
        lastInsertRowid?: number | bigint;
    }>;
    pool: {
        query: (text: string, params?: any[]) => Promise<{
            rows: any[];
            rowCount: number;
            lastInsertRowid?: number | bigint;
        }>;
        end: () => Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map