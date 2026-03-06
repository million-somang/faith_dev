const SQLite = require('better-sqlite3');
const db = new SQLite('packages/database/faithlink.db');

try {
    console.log("DB Loaded");
    console.log(db.prepare("PRAGMA table_info(user_game_scores)").all());

    db.prepare("INSERT INTO user_game_scores (user_id, game_type, score, game_data, played_at) VALUES (?, ?, ?, ?, datetime('now'))").run(1, 'tetris', 100, '{}');
    console.log("Insert success!");
} catch (e) {
    console.error("DB Error:", e);
}
