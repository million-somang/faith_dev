const fs = require('fs');
const path = require('path');

// Find db.sqlite file
const findDbFile = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const result = findDbFile(fullPath);
      if (result) return result;
    } else if (file.name === 'db.sqlite') {
      return fullPath;
    }
  }
  return null;
};

const dbPath = findDbFile('.wrangler/state/v3/d1');
if (!dbPath) {
  console.error('Database not found!');
  process.exit(1);
}

console.log('Found database:', dbPath);

const Database = require('better-sqlite3');
const db = new Database(dbPath);

const sql = fs.readFileSync('migrations/0012_create_sudoku_scores.sql', 'utf8');
db.exec(sql);

console.log('Migration applied successfully!');
db.close();
