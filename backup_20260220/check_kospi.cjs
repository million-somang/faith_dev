
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');
const rows = db.prepare("SELECT title FROM news WHERE title LIKE '%코스피%'").all();
console.log(JSON.stringify(rows, null, 2));
