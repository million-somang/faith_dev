export declare function getDB(c: any): {
    prepare: (query: string) => {
        bind: (...args: any[]) => /*elided*/ any;
        all: () => Promise<{
            results: any[];
        }>;
        first: () => Promise<any>;
        run: () => Promise<{
            success: boolean;
            changes: number;
            lastInsertRowid: number | bigint | undefined;
        }>;
    };
};
//# sourceMappingURL=adapter.d.ts.map