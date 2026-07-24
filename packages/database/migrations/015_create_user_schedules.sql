-- Create user_schedules table for MyPage Today's Biz Agenda
CREATE TABLE IF NOT EXISTS user_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    schedule_time TEXT NOT NULL,
    schedule_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
