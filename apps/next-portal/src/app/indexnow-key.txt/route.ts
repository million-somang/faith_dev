import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

export const dynamic = 'force-dynamic';

export async function GET() {
    let key = (process.env.INDEXNOW_KEY || '').trim();

    if (!key) {
        try {
            const res = await fetch(`${API_SERVER_URL}/api/seo/indexnow-key`, {
                cache: 'no-store',
            });
            if (res.ok) {
                const json = (await res.json()) as {
                    success?: boolean;
                    data?: { key?: string };
                };
                key = (json?.data?.key || '').trim();
            }
        } catch {
            key = '';
        }
    }

    if (!key || key.length < 8) {
        return new NextResponse('IndexNow key not configured', { status: 404 });
    }

    return new NextResponse(key, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
