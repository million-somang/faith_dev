import { pool } from '@faithportal/database';

export function getDB(c: any) {
    return {
        prepare: (query: string) => {
            let binds: any[] = [];

            const executor = {
                bind: (...args: any[]) => {
                    binds = args;
                    return executor;
                },
                all: async () => {
                    const result = await pool.query(query, binds);
                    return { results: result.rows };
                },
                first: async () => {
                    // query execution with binds
                    const result = await pool.query(query, binds);
                    return result.rows[0] || null;
                },
                run: async () => {
                    const result = await pool.query(query, binds);
                    return { success: true, changes: result.rowCount, lastInsertRowid: result.lastInsertRowid };
                }
            };

            return executor;
        }
    };
}
