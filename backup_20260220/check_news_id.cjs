
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db', { verbose: console.log });
const row = db.prepare('SELECT id, title FROM news ORDER BY id DESC LIMIT 1').get();
console.log(JSON.stringify(row));
