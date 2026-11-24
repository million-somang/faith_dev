import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';
const BASE_URL = 'https://veranex.app';

export const dynamic = 'force-dynamic';

interface SitemapIndexMeta {
    travelHighQualityCount?: number;
    travelPageCount?: number;
    travelLastMod?: string | null;
    recentNewsCount?: number;
    recentNewsLastMod?: string | null;
}

function escapeXml(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function fetchIndexMeta(): Promise<SitemapIndexMeta> {
    try {
        const res = await fetch(`${API_SERVER_URL}/api/seo/sitemap-index-meta`, {
            cache: 'no-store',
        });
        if (!res.ok) return {};
        const json = (await res.json()) as { success?: boolean; data?: SitemapIndexMeta };
        if (json?.success && json.data) {
            return json.data;
        }
        return {};
    } catch {
        return {};
    }
}

export async function GET() {
    const meta = await fetchIndexMeta();
    const nowIso = new Date().toISOString();
    const travelPageCount = Math.max(0, Number(meta.travelPageCount ?? 0));
    const travelLastMod = meta.travelLastMod || nowIso;
    const recentNewsLastMod = meta.recentNewsLastMod || nowIso;

    const entries: Array<{ loc: string; lastmod: string }> = [
        { loc: `${BASE_URL}/sitemaps/core.xml`, lastmod: nowIso },
    ];

    for (let page = 1; page <= travelPageCount; page += 1) {
        entries.push({
            loc: `${BASE_URL}/sitemaps/travel-${page}.xml`,
            lastmod: travelLastMod,
        });
    }

    entries.push({
        loc: `${BASE_URL}/sitemaps/news-recent.xml`,
        lastmod: recentNewsLastMod,
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
        (entry) => `  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
  </sitemap>`
    )
    .join('\n')}
</sitemapindex>`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
    });
}
