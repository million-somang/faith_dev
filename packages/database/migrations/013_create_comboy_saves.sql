-- Create comboy_saves table for Vera Comboy Arcade Save/Load
CREATE TABLE IF NOT EXISTS comboy_saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    save_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_comboy_saves_user_game ON comboy_saves(user_id, game_name);

-- Seed Vera Comboy Arcade Mini App
INSERT INTO mini_apps (name, slug, icon_url, description, app_url, status, require_auth, sort_order, category)
SELECT '베라 컴보이 아케이드', 'comboy', 'fas fa-gamepad', '8비트 패미콤 NES 에뮬레이터 플레이어', '/app/comboy/', 'active', 0, 14, 'game'
WHERE NOT EXISTS (SELECT 1 FROM mini_apps WHERE slug = 'comboy');
