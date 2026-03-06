
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');
const info = db.pragma('table_info(news)');
console.log(JSON.stringify(info, null, 2));
