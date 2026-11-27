import { pool } from '@faithportal/database';
import {
    createEmptyLauncherLayout,
    LAUNCHER_SCHEMA_VERSION,
    UserAppLauncherLayout,
} from '../types/app-launcher.types.js';

export class AppLauncherService {
    private static tableInitPromise: Promise<void> | null = null;

    /**
     * 모듈 최상위 기동 블로킹 없이 최초 요청 시 1회 테이블 생성
     */
    private static async ensureTable(): Promise<void> {
        if (!this.tableInitPromise) {
            this.tableInitPromise = pool
                .query(`
                    CREATE TABLE IF NOT EXISTS user_app_launcher (
                        user_id INTEGER PRIMARY KEY,
                        layout_json TEXT NOT NULL,
                        wallpaper VARCHAR(40) DEFAULT 'nm-light',
                        version INTEGER DEFAULT 1,
                        is_deleted INTEGER DEFAULT 0,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `)
                .then(() => undefined)
                .catch((err) => {
                    this.tableInitPromise = null;
                    throw err;
                });
        }
        await this.tableInitPromise;
    }

    /**
     * 사용자의 스마트폰 홈 화면 런처 배치 조회
     * 등록 내역이 없으면 빈 레이아웃 반환 (가짜 시드 금지)
     */
    static async getLayout(userId: number): Promise<{
        layout: UserAppLauncherLayout;
        updatedAt: string | null;
    }> {
        await this.ensureTable();

        const res = await pool.query(
            `SELECT layout_json, updated_at
             FROM user_app_launcher
             WHERE user_id = $1 AND COALESCE(is_deleted, 0) = 0`,
            [userId]
        );

        if (res.rows.length === 0) {
            return {
                layout: createEmptyLauncherLayout(),
                updatedAt: null,
            };
        }

        const row = res.rows[0] as { layout_json?: unknown; updated_at?: unknown };
        try {
            const parsed = JSON.parse(String(row.layout_json || '')) as UserAppLauncherLayout;
            if (!parsed || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
                return {
                    layout: createEmptyLauncherLayout(),
                    updatedAt: row.updated_at ? String(row.updated_at) : null,
                };
            }
            return {
                layout: parsed,
                updatedAt: row.updated_at ? String(row.updated_at) : null,
            };
        } catch {
            return {
                layout: createEmptyLauncherLayout(),
                updatedAt: null,
            };
        }
    }

    /**
     * 사용자의 스마트폰 홈 화면 런처 배치 저장 (Hard Delete 없이 JSON 상태 UPSERT)
     */
    static async saveLayout(
        userId: number,
        layout: UserAppLauncherLayout
    ): Promise<{ layout: UserAppLauncherLayout; updatedAt: string }> {
        await this.ensureTable();

        const normalized: UserAppLauncherLayout = {
            ...layout,
            version: LAUNCHER_SCHEMA_VERSION,
        };
        const layoutJson = JSON.stringify(normalized);

        await pool.query(
            `INSERT OR REPLACE INTO user_app_launcher
                (user_id, layout_json, wallpaper, version, is_deleted, updated_at)
             VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP)`,
            [userId, layoutJson, normalized.wallpaper, LAUNCHER_SCHEMA_VERSION]
        );

        return {
            layout: normalized,
            updatedAt: new Date().toISOString(),
        };
    }
}
