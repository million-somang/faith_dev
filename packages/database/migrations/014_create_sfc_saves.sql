-- Create sfc_saves table for Vera Super Comboy Save/Load
CREATE TABLE IF NOT EXISTS sfc_saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    save_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sfc_saves_user_game ON sfc_saves(user_id, game_name);

-- Seed Vera Super Comboy Mini App
INSERT INTO mini_apps (name, slug, icon_url, description, app_url, status, require_auth, sort_order, category)
SELECT '베라 슈퍼컴보이', 'sfc', 'fas fa-gamepad', '16비트 슈퍼패미콤 SNES 에뮬레이터 플레이어', '/app/sfc/', 'active', 0, 15, 'game'
WHERE NOT EXISTS (SELECT 1 FROM mini_apps WHERE slug = 'sfc');
