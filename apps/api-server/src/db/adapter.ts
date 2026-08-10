import { pool } from '@faithportal/database';

export function getDB(c: any) {
    return {
        prepare: (query: string) => {
            let binds: any[] = [];

            const toPgQuery = (q: string) => {
                let idx = 1;
                return q.replace(/\?/g, () => `$${idx++}`);
            };

            const executor = {
                bind: (...args: any[]) => {
                    binds = args;
                    return executor;
                },
                all: async () => {
                    const pgQuery = toPgQuery(query);
                    const result = await pool.query(pgQuery, binds);
                    return { results: result.rows };
                },
                first: async () => {
                    const pgQuery = toPgQuery(query);
                    const result = await pool.query(pgQuery, binds);
                    return result.rows[0] || null;
                },
                run: async () => {
                    const pgQuery = toPgQuery(query);
                    const result = await pool.query(pgQuery, binds);
                    return { success: true, changes: result.rowCount, lastInsertRowid: (result as any).lastInsertRowid };
                }
            };

            return executor;
        }
    };
}
