import type { Context } from 'hono';
import type { SessionUser } from '../middleware/auth.js';
import { DriveAuthService } from '../services/drive-auth.service.js';

const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{10,120}$/;

const FORWARDED_RESPONSE_HEADERS = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'cache-control',
    'etag',
    'last-modified',
] as const;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUpstreamWithRetry(
    url: string,
    headers: Headers,
    maxRetries = 2
): Promise<Response> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers,
                redirect: 'follow',
            });
            if (
                (res.status === 429 || res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) &&
                attempt < maxRetries
            ) {
                await delay(250 * (attempt + 1));
                continue;
            }
            return res;
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                await delay(250 * (attempt + 1));
            }
        }
    }
    throw lastError instanceof Error ? lastError : new Error('Upstream fetch failed');
}

export class DriveStreamController {
    /**
     * GET /api/user/drive/token
     * 저장된 구글 드라이브 토큰 상태 조회 및 만료 시 서버 자동 리프레시 수행
     */
    static async getDriveToken(c: Context): Promise<Response> {
        try {
            const user = c.get('user') as SessionUser | null;
            if (!user) {
                return c.json({ success: false, message: 'Unauthorized' }, 401);
            }
            const forceRefresh = c.req.query('refresh') === '1';
            const status = await DriveAuthService.getConnectionStatus(user.id, forceRefresh);
            return c.json({
                success: true,
                data: status,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '구글 드라이브 토큰 조회 실패';
            return c.json({ success: false, error: { code: 500, message: msg } }, 500);
        }
    }

    /**
     * POST /api/user/drive/oauth/exchange
     * 1) Authorization Code 교환 (refresh_token 영구 발급) 또는
     * 2) 프론트에서 발급된 access_token 서버 동기화
     */
    static async exchangeOrSaveToken(c: Context): Promise<Response> {
        try {
            const user = c.get('user') as SessionUser | null;
            if (!user) {
                return c.json({ success: false, message: 'Unauthorized' }, 401);
            }

            const body = (await c.req.json()) as {
                code?: string;
                accessToken?: string;
                expiresIn?: number;
                clientId?: string;
                clientSecret?: string;
                redirectUri?: string;
            };

            if (body.code && body.code.trim()) {
                const status = await DriveAuthService.exchangeAuthCode(
                    user.id,
                    body.code.trim(),
                    body.clientId,
                    body.clientSecret,
                    body.redirectUri || 'postmessage'
                );
                return c.json({
                    success: true,
                    data: status,
                });
            }

            if (body.accessToken && body.accessToken.trim()) {
                const status = await DriveAuthService.saveDirectAccessToken(
                    user.id,
                    body.accessToken.trim(),
                    Number(body.expiresIn) || 3500,
                    body.clientId,
                    body.clientSecret
                );
                return c.json({
                    success: true,
                    data: status,
                });
            }

            return c.json(
                {
                    success: false,
                    error: { code: 400, message: '유효한 인증 코드(code) 또는 액세스 토큰이 필요합니다.' },
                },
                400
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '구글 드라이브 인증 처리 중 오류가 발생했습니다.';
            return c.json(
                {
                    success: false,
                    error: { code: 400, message: msg },
                },
                400
            );
        }
    }

    /**
     * POST /api/user/drive/config
     * Google OAuth Client ID 및 Client Secret 설정을 회원 계정에 저장
     */
    static async saveDriveConfig(c: Context): Promise<Response> {
        try {
            const user = c.get('user') as SessionUser | null;
            if (!user) {
                return c.json({ success: false, message: 'Unauthorized' }, 401);
            }

            const body = (await c.req.json()) as {
                clientId?: string;
                clientSecret?: string;
            };

            const status = await DriveAuthService.saveClientConfig(
                user.id,
                body.clientId || '',
                body.clientSecret
            );

            return c.json({
                success: true,
                data: status,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '설정 저장 실패';
            return c.json({ success: false, error: { code: 500, message: msg } }, 500);
        }
    }

    /**
     * GET /api/user/drive/stream/:fileId
     * 구글 드라이브 비디오·오디오 파일을 HTML5 <video>/<audio>에서 Range(206 Partial Content) 탐색이 가능하도록 스트리밍 프록시합니다.
     * 토큰이 만료(401)된 경우 서버의 refresh_token으로 즉시 새 토큰을 자동 발급받아 끊김 없이 이어서 스트리밍합니다.
     */
    static async streamVideo(c: Context): Promise<Response> {
        try {
            const fileId = (c.req.param('fileId') || '').trim();
            if (!FILE_ID_REGEX.test(fileId)) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 400,
                            message: '유효하지 않은 구글 드라이브 파일 ID입니다.',
                        },
                    },
                    400
                );
            }

            const user = c.get('user') as SessionUser | null;
            const queryToken = (c.req.query('token') || '').trim();
            const rangeHeader = c.req.header('range') || c.req.header('Range');

            const upstreamHeaders = new Headers();
            if (rangeHeader) {
                upstreamHeaders.set('Range', rangeHeader);
            }

            // 1. 회원 DB에 저장된 최신 유효 토큰(필요 시 자동 리프레시 포함) 우선 조회
            let activeToken = queryToken;
            if (user) {
                const resolvedToken = await DriveAuthService.getValidAccessToken(
                    user.id,
                    queryToken,
                    false
                );
                if (resolvedToken) {
                    activeToken = resolvedToken;
                }
            }

            const driveApiUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
            const publicFallbackUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
            let upstreamResponse: Response;

            if (activeToken) {
                const authHeaders = new Headers(upstreamHeaders);
                authHeaders.set('Authorization', `Bearer ${activeToken}`);
                upstreamResponse = await fetchUpstreamWithRetry(driveApiUrl, authHeaders, 2);

                // 2. 만약 토큰 만료로 401/403이 발생하면, 서버가 즉시 refresh_token으로 강제 재발급하여 그 자리에서 재시도!
                if ((upstreamResponse.status === 401 || upstreamResponse.status === 403) && user) {
                    const refreshedToken = await DriveAuthService.getValidAccessToken(
                        user.id,
                        activeToken,
                        true
                    );
                    if (refreshedToken && refreshedToken !== activeToken) {
                        const retryAuthHeaders = new Headers(upstreamHeaders);
                        retryAuthHeaders.set('Authorization', `Bearer ${refreshedToken}`);
                        const refreshedRes = await fetchUpstreamWithRetry(
                            driveApiUrl,
                            retryAuthHeaders,
                            1
                        );
                        if (refreshedRes.ok || refreshedRes.status === 206) {
                            upstreamResponse = refreshedRes;
                        }
                    }
                }

                // 3. 그래도 401/403이면 공개 공유 파일일 수 있으므로 공개 다운로드 URL로 1회 폴백 시도
                if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
                    const fallbackRes = await fetchUpstreamWithRetry(publicFallbackUrl, upstreamHeaders, 1);
                    const fallbackContentType = (fallbackRes.headers.get('content-type') || '').toLowerCase();
                    if ((fallbackRes.ok || fallbackRes.status === 206) && !fallbackContentType.includes('text/html')) {
                        upstreamResponse = fallbackRes;
                    }
                }
            } else {
                upstreamResponse = await fetchUpstreamWithRetry(publicFallbackUrl, upstreamHeaders, 2);
            }

            const upstreamContentType = (upstreamResponse.headers.get('content-type') || '').toLowerCase();

            // 구글 드라이브가 인증 필요/권한 부족으로 로그인 HTML 페이지(text/html)를 200 OK로 반환한 경우 차단
            if (upstreamContentType.includes('text/html')) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 401,
                            message: '구글 드라이브 인증 토큰이 만료되었거나 비공개 파일입니다. 다시 연동해 주세요.',
                        },
                    },
                    401
                );
            }

            if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
                const status = upstreamResponse.status;
                if (status === 401 || status === 403) {
                    return c.json(
                        {
                            success: false,
                            error: {
                                code: status,
                                message: '구글 드라이브 접근 권한이 만료되었거나 권한이 없습니다. 다시 연동해 주세요.',
                            },
                        },
                        status as 401 | 403
                    );
                }
                if (status === 404) {
                    return c.json(
                        {
                            success: false,
                            error: {
                                code: 404,
                                message: '요청한 구글 드라이브 미디어 파일을 찾을 수 없습니다.',
                            },
                        },
                        404
                    );
                }
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 502,
                            message: `구글 드라이브 스트리밍 응답 오류 (HTTP ${status})`,
                        },
                    },
                    502
                );
            }

            const responseHeaders = new Headers();
            for (const headerName of FORWARDED_RESPONSE_HEADERS) {
                const value = upstreamResponse.headers.get(headerName);
                if (value) {
                    responseHeaders.set(headerName, value);
                }
            }

            if (!responseHeaders.has('accept-ranges')) {
                responseHeaders.set('accept-ranges', 'bytes');
            }
            if (!responseHeaders.has('cache-control')) {
                responseHeaders.set('cache-control', 'private, max-age=3600');
            }
            if (!responseHeaders.has('content-type')) {
                responseHeaders.set('content-type', 'application/octet-stream');
            }

            return new Response(upstreamResponse.body, {
                status: upstreamResponse.status,
                headers: responseHeaders,
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 서버 오류';
            console.error('[DriveStreamController.streamVideo] Error:', errorMessage);
            return c.json(
                {
                    success: false,
                    error: {
                        code: 500,
                        message: '구글 드라이브 미디어 스트리밍 중 서버 오류가 발생했습니다.',
                    },
                },
                500
            );
        }
    }
}
