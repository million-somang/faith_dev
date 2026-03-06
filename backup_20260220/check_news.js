import { getDB } from './src/db/adapter';
async function checkNews() {
    const db = getDB();
    const result = await db.prepare('SELECT id, title, created_at FROM news ORDER BY created_at DESC LIMIT 5').all();
    console.log('Current News Dates:', result.results);
}
checkNews();
