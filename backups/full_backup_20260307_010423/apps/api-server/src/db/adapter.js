import { pool } from '@faithportal/database';
export function getDB(c) {
    return {
        prepare: (query) => {
            let binds = [];
            const executor = {
                bind: (...args) => {
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
