import { pool } from '@faithportal/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function init() {
    const schemaPath = path.resolve(__dirname, '../../packages/database/src/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Initializing PostgreSQL database...');
    try {
        await pool.query(schema);
        console.log('Database initialized successfully.');
    }
    catch (err) {
        console.error('Error initializing database:', err);
    }
    finally {
        await pool.end();
    }
}
init();
