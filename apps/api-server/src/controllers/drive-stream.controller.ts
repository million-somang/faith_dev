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

export class DriveStreamController {
    /**
     * GET /api/user/drive/stream/:fileId
     * 구글 드라이브 비디오 파일을 HTML5 <video>에서 Range(206 Partial Content) 탐색이 가능하도록 스트리밍 프록시합니다.
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

            let upstreamUrl: string;
            if (token) {
                upstreamHeaders.set('Authorization', `Bearer ${token}`);
                upstreamUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
            } else {
                upstreamUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
            }

            const upstreamResponse = await fetch(upstreamUrl, {
                method: 'GET',
                headers: upstreamHeaders,
                redirect: 'follow',
            });

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
                                message: '요청한 구글 드라이브 비디오 파일을 찾을 수 없습니다.',
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
            if (!responseHeaders.has('content-type')) {
                responseHeaders.set('content-type', 'video/mp4');
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
                        message: '구글 드라이브 비디오 스트리밍 중 서버 오류가 발생했습니다.',
                    },
                },
                500
            );
        }
    }
}
