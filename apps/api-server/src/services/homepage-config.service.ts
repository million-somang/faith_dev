import { pool } from '@faithportal/database';

// 홈페이지 설정 기본값 (백엔드 버전)
const DEFAULT_CONFIG_JSON = JSON.stringify({
    quickMenuItems: ['news', 'utility', 'game', 'finance'],
    quickMenuOrder: ['news', 'utility', 'game', 'finance', 'shopping', 'entertainment', 'education'],
    preferences: {
        mainInterest: 'news',
        newsCategories: ['politics', 'economy'],
        showStockWidget: false,
        showWeatherWidget: false,
        showTrendWidget: true,
        favoriteGames: ['tetris'],
        ageGroup: 'middle',
    },
    theme: {
        colorScheme: 'green',
        layout: 'portal',
        greeting: '',
    },
    isConfigured: false,
});

export class HomepageConfigService {
    /**
     * 사용자의 홈페이지 설정 조회
     * 설정이 없으면 기본값 반환
     */
    static async getConfig(userId: number): Promise<Record<string, unknown>> {
        const res = await pool.query(
            'SELECT config_json FROM user_homepage_config WHERE user_id = $1',
            [userId]
        );

        if (res.rows.length === 0) {
            return JSON.parse(DEFAULT_CONFIG_JSON) as Record<string, unknown>;
        }

        try {
            return JSON.parse(res.rows[0].config_json as string) as Record<string, unknown>;
        } catch {
            return JSON.parse(DEFAULT_CONFIG_JSON) as Record<string, unknown>;
        }
    }

    /**
     * 사용자의 홈페이지 설정 저장 (UPSERT)
     */
    static async saveConfig(userId: number, config: Record<string, unknown>): Promise<void> {
        const configJson = JSON.stringify(config);

        // SQLite: INSERT OR REPLACE (UPSERT 대체)
        await pool.query(
            `INSERT OR REPLACE INTO user_homepage_config (user_id, config_json, updated_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)`,
            [userId, configJson]
        );
    }
}
