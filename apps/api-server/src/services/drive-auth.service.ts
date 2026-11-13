import { pool } from '@faithportal/database';

export interface DriveTokenRow {
    user_id: number;
    client_id: string;
    client_secret: string;
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    playlist_json?: string;
    updated_at?: string;
}

export interface DriveConnectionStatus {
    clientId: string;
    hasClientSecret: boolean;
    accessToken: string;
    expiryDate: number;
    hasRefreshToken: boolean;
    isPermanentConnected: boolean;
    hasEverConnected?: boolean;
    playlist?: unknown[];
}

interface GoogleOAuthTokenPayload {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
}

let isTableReady = false;
const inflightRefreshMap = new Map<number, Promise<string | null>>();

export class DriveAuthService {
    static async ensureTable(): Promise<void> {
        if (isTableReady) return;
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_drive_tokens (
                    user_id INTEGER PRIMARY KEY,
                    client_id TEXT DEFAULT '',
                    client_secret TEXT DEFAULT '',
                    access_token TEXT DEFAULT '',
                    refresh_token TEXT DEFAULT '',
                    expiry_date INTEGER DEFAULT 0,
                    playlist_json TEXT DEFAULT '[]',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            try {
                await pool.query(
                    "ALTER TABLE user_drive_tokens ADD COLUMN playlist_json TEXT DEFAULT '[]'"
                );
            } catch (_) {
                // 이미 playlist_json 컬럼이 존재하면 무시
            }
            isTableReady = true;
        } catch (err) {
            console.error('[DriveAuthService.ensureTable] Error:', err);
        }
    }

    static async getRow(userId: number): Promise<DriveTokenRow | null> {
        await this.ensureTable();
        const res = await pool.query(
            'SELECT * FROM user_drive_tokens WHERE user_id = $1',
            [userId]
        );
        if (!res.rows || res.rows.length === 0) return null;
        const raw = res.rows[0] as Record<string, unknown>;
        return {
            user_id: Number(raw.user_id) || userId,
            client_id: String(raw.client_id || ''),
            client_secret: String(raw.client_secret || ''),
            access_token: String(raw.access_token || ''),
            refresh_token: String(raw.refresh_token || ''),
            expiry_date: Number(raw.expiry_date) || 0,
            playlist_json: typeof raw.playlist_json === 'string' ? raw.playlist_json : '[]',
            updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
        };
    }

    static async savePlaylist(userId: number, playlistJson: string): Promise<void> {
        await this.ensureTable();
        const existing = await this.getRow(userId);
        await pool.query(
            `
            INSERT INTO user_drive_tokens (user_id, client_id, client_secret, access_token, refresh_token, expiry_date, playlist_json, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                playlist_json = excluded.playlist_json,
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                userId,
                existing?.client_id || '',
                existing?.client_secret || '',
                existing?.access_token || '',
                existing?.refresh_token || '',
                existing?.expiry_date || 0,
                playlistJson,
            ]
        );
    }

    static async saveClientConfig(
        userId: number,
        clientId: string,
        clientSecret?: string
    ): Promise<DriveConnectionStatus> {
        await this.ensureTable();
        const existing = await this.getRow(userId);
        const nextClientId = clientId.trim() || existing?.client_id || '';
        const nextClientSecret =
            clientSecret !== undefined && clientSecret.trim() !== ''
                ? clientSecret.trim()
                : existing?.client_secret || '';

        await pool.query(
            `
            INSERT INTO user_drive_tokens (user_id, client_id, client_secret, access_token, refresh_token, expiry_date, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                client_id = excluded.client_id,
                client_secret = excluded.client_secret,
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                userId,
                nextClientId,
                nextClientSecret,
                existing?.access_token || '',
                existing?.refresh_token || '',
                existing?.expiry_date || 0,
            ]
        );

        return this.getConnectionStatus(userId);
    }

    static async saveDirectAccessToken(
        userId: number,
        accessToken: string,
        expiresInSec = 3500,
        clientId?: string,
        clientSecret?: string
    ): Promise<DriveConnectionStatus> {
        await this.ensureTable();
        const existing = await this.getRow(userId);
        const expiryDate = Date.now() + Math.max(60, expiresInSec) * 1000;
        const nextClientId = (clientId || '').trim() || existing?.client_id || '';
        const nextClientSecret =
            clientSecret !== undefined && clientSecret.trim() !== ''
                ? clientSecret.trim()
                : existing?.client_secret || '';

        await pool.query(
            `
            INSERT INTO user_drive_tokens (user_id, client_id, client_secret, access_token, refresh_token, expiry_date, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                client_id = CASE WHEN excluded.client_id != '' THEN excluded.client_id ELSE user_drive_tokens.client_id END,
                client_secret = CASE WHEN excluded.client_secret != '' THEN excluded.client_secret ELSE user_drive_tokens.client_secret END,
                access_token = excluded.access_token,
                expiry_date = excluded.expiry_date,
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                userId,
                nextClientId,
                nextClientSecret,
                accessToken.trim(),
                existing?.refresh_token || '',
                expiryDate,
            ]
        );

        return this.getConnectionStatus(userId);
    }

    static async exchangeAuthCode(
        userId: number,
        code: string,
        clientId?: string,
        clientSecret?: string,
        redirectUri = 'postmessage'
    ): Promise<DriveConnectionStatus> {
        await this.ensureTable();
        const existing = await this.getRow(userId);

        const activeClientId =
            (clientId || '').trim() ||
            existing?.client_id ||
            process.env.GOOGLE_CLIENT_ID ||
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            '';
        const activeClientSecret =
            (clientSecret || '').trim() ||
            existing?.client_secret ||
            process.env.GOOGLE_CLIENT_SECRET ||
            '';

        if (!activeClientId || !activeClientSecret) {
            throw new Error(
                '영구 자동 연결을 위해 Google OAuth Client ID와 Client Secret이 모두 필요합니다.'
            );
        }

        const params = new URLSearchParams({
            code: code.trim(),
            client_id: activeClientId,
            client_secret: activeClientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const payload = (await tokenRes.json()) as GoogleOAuthTokenPayload;

        if (!tokenRes.ok || !payload.access_token) {
            const errMsg =
                payload.error_description ||
                payload.error ||
                `Google 토큰 교환 실패 (HTTP ${tokenRes.status})`;
            throw new Error(errMsg);
        }

        const expiresIn = Number(payload.expires_in) || 3500;
        const expiryDate = Date.now() + expiresIn * 1000;
        const nextRefreshToken = payload.refresh_token || existing?.refresh_token || '';

        await pool.query(
            `
            INSERT INTO user_drive_tokens (user_id, client_id, client_secret, access_token, refresh_token, expiry_date, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                client_id = excluded.client_id,
                client_secret = excluded.client_secret,
                access_token = excluded.access_token,
                refresh_token = CASE WHEN excluded.refresh_token != '' THEN excluded.refresh_token ELSE user_drive_tokens.refresh_token END,
                expiry_date = excluded.expiry_date,
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                userId,
                activeClientId,
                activeClientSecret,
                payload.access_token,
                nextRefreshToken,
                expiryDate,
            ]
        );

        return this.getConnectionStatus(userId);
    }

    static async refreshAccessToken(userId: number): Promise<string | null> {
        const existingPromise = inflightRefreshMap.get(userId);
        if (existingPromise) {
            return existingPromise;
        }

        const refreshPromise = (async (): Promise<string | null> => {
            try {
                const row = await this.getRow(userId);
                if (!row || !row.refresh_token) {
                    return null;
                }

                const clientId =
                    row.client_id ||
                    process.env.GOOGLE_CLIENT_ID ||
                    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
                    '';
                const clientSecret =
                    row.client_secret || process.env.GOOGLE_CLIENT_SECRET || '';

                if (!clientId || !clientSecret) {
                    return null;
                }

                const params = new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: row.refresh_token,
                    grant_type: 'refresh_token',
                });

                const res = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params.toString(),
                });

                const payload = (await res.json()) as GoogleOAuthTokenPayload;
                if (!res.ok || !payload.access_token) {
                    console.warn(
                        `[DriveAuthService] Refresh token failed for user ${userId}:`,
                        payload.error_description || payload.error || res.status
                    );
                    return null;
                }

                const expiresIn = Number(payload.expires_in) || 3500;
                const expiryDate = Date.now() + expiresIn * 1000;
                const nextRefresh = payload.refresh_token || row.refresh_token;

                await pool.query(
                    `
                    UPDATE user_drive_tokens
                    SET access_token = $1,
                        refresh_token = $2,
                        expiry_date = $3,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $4
                    `,
                    [payload.access_token, nextRefresh, expiryDate, userId]
                );

                return payload.access_token;
            } catch (err) {
                console.error('[DriveAuthService.refreshAccessToken] Error:', err);
                return null;
            } finally {
                inflightRefreshMap.delete(userId);
            }
        })();

        inflightRefreshMap.set(userId, refreshPromise);
        return refreshPromise;
    }

    static async getValidAccessToken(
        userId: number,
        fallbackQueryToken?: string,
        forceRefresh = false
    ): Promise<string> {
        const row = await this.getRow(userId);
        const now = Date.now();

        if (forceRefresh) {
            const refreshed = await this.refreshAccessToken(userId);
            if (refreshed) return refreshed;
            if (
                row?.access_token &&
                row.access_token !== fallbackQueryToken &&
                row.expiry_date > now + 30_000
            ) {
                return row.access_token;
            }
            if (row?.access_token) {
                return row.access_token;
            }
            return (fallbackQueryToken || '').trim();
        }

        // 1. DB에 유효한 토큰이 남아있는 경우 (만료 3분 전까지)
        if (row?.access_token && row.expiry_date > now + 3 * 60 * 1000) {
            return row.access_token;
        }

        // 2. 만료 임박 또는 만료되었고 refresh_token이 있는 경우 즉시 서버 자동 갱신
        if (row?.refresh_token) {
            const refreshed = await this.refreshAccessToken(userId);
            if (refreshed) {
                return refreshed;
            }
        }

        // 3. 쿼리로 전달된 토큰이 있으면 사용 (그리고 DB 토큰이 비어있다면 캐싱)
        if (fallbackQueryToken && fallbackQueryToken.trim()) {
            const trimmed = fallbackQueryToken.trim();
            if (!row?.access_token) {
                await this.saveDirectAccessToken(userId, trimmed, 3000);
            }
            return trimmed;
        }

        return row?.access_token || '';
    }

    static async getConnectionStatus(
        userId: number,
        forceRefresh = false
    ): Promise<DriveConnectionStatus> {
        const validToken = await this.getValidAccessToken(userId, undefined, forceRefresh);
        const row = await this.getRow(userId);
        const hasClientSecret = Boolean(
            (row?.client_secret && row.client_secret.length > 0) ||
                process.env.GOOGLE_CLIENT_SECRET
        );
        const hasRefreshToken = Boolean(row?.refresh_token && row.refresh_token.length > 0);
        let parsedPlaylist: unknown[] = [];
        if (row?.playlist_json) {
            try {
                const parsed = JSON.parse(row.playlist_json);
                if (Array.isArray(parsed)) {
                    parsedPlaylist = parsed;
                }
            } catch (_) {}
        }

        return {
            clientId:
                row?.client_id ||
                process.env.GOOGLE_CLIENT_ID ||
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
                '',
            hasClientSecret,
            accessToken: validToken || row?.access_token || '',
            expiryDate: row?.expiry_date || 0,
            hasRefreshToken,
            isPermanentConnected: hasRefreshToken && hasClientSecret,
            hasEverConnected: Boolean(row?.access_token || row?.refresh_token || row?.client_id),
            playlist: parsedPlaylist,
        };
    }
}
