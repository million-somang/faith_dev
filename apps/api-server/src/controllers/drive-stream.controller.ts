import type { Context } from 'hono';

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
     * GET /api/user/drive/stream/:fileId
     * 구글 드라이브 비디오·오디오 파일을 HTML5 <video>/<audio>에서 Range(206 Partial Content) 탐색이 가능하도록 스트리밍 프록시합니다.
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

            const token = (c.req.query('token') || '').trim();
            const rangeHeader = c.req.header('range') || c.req.header('Range');

            const upstreamHeaders = new Headers();
            if (rangeHeader) {
                upstreamHeaders.set('Range', rangeHeader);
            }

            const publicFallbackUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
            let upstreamResponse: Response;

            if (token) {
                const authHeaders = new Headers(upstreamHeaders);
                authHeaders.set('Authorization', `Bearer ${token}`);
                const driveApiUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
                upstreamResponse = await fetchUpstreamWithRetry(driveApiUrl, authHeaders, 2);

                // 토큰이 만료되었더라도 공유 링크가 열려있는 파일일 수 있으므로 공개 URL로 1회 폴백 시도
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
