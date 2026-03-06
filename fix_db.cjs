const Database = require('better-sqlite3');
const db = new Database('c:/project/faithportal/faith-portal.db');

db.prepare("UPDATE mini_apps SET name = '글자수/맞춤법' WHERE id = 2").run();
console.log('Fixed DB text encoding for id 2.');
