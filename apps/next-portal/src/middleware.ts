import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 외부 자동화 봇/스캐너가 Next-Action: x 등 유효하지 않은 Server Action 헤더로
 * POST 요청을 보낼 때 app-page.runtime.prod.js에서
 * "Error: Failed to find Server Action" 예외를 출력하는 현상을 원천 차단합니다.
 */
export function middleware(request: NextRequest) {
    const nextAction = request.headers.get('next-action');
    if (nextAction) {
        return new NextResponse(
            JSON.stringify({
                success: false,
                error: 'Invalid or stale Server Action request.'
            }),
            {
                status: 400,
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'cache-control': 'no-store'
                }
            }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * 정적 에셋(_next/static, _next/image, favicon.ico, uploads 등) 및 백엔드 프록시(/api, /app 등) 제외
         */
        '/((?!api|app|onlinegame|finance|uploads|admin|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|rss.xml).*)'
    ]
};
