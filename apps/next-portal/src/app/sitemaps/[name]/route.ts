import { NextResponse } from 'next/server';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';
import { GAME_CONFIGS } from '@/data/gameConfigs';
import { GUIDES_DATA } from '@/data/guidesData';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';
const BASE_URL = 'https://veranex.app';
const DEFAULT_LAST_MOD = '2026-11-24T00:00:00.000Z';

export const dynamic = 'force-dynamic';

interface UrlEntry {
    loc: string;
    lastmod: string;
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: string;
}

interface TravelSitemapRow {
    id: number;
    publishedAt?: string | null;
    updatedAt?: string | null;
}

interface RecentNewsRow {
    id: number;
    title: string;
    publishedAt?: string | null;
    createdAt?: string | null;
}

function escapeXml(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function normalizeIsoDate(raw?: string | null, fallback = DEFAULT_LAST_MOD): string {
    if (!raw) return fallback;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed.toISOString();
}

function renderUrlSet(entries: UrlEntry[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
        (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;
}

function buildCoreSitemap(): string {
    const nowIso = new Date().toISOString();
    const entries: UrlEntry[] = [
        { loc: `${BASE_URL}/`, lastmod: nowIso, changefreq: 'daily', priority: '1.0' },
        { loc: `${BASE_URL}/guides`, lastmod: nowIso, changefreq: 'weekly', priority: '1.0' },
        { loc: `${BASE_URL}/lifestyle`, lastmod: nowIso, changefreq: 'weekly', priority: '0.95' },
        { loc: `${BASE_URL}/game`, lastmod: nowIso, changefreq: 'weekly', priority: '0.95' },
        { loc: `${BASE_URL}/entertainment/saju`, lastmod: nowIso, changefreq: 'weekly', priority: '0.95' },
        { loc: `${BASE_URL}/entertainment/travel`, lastmod: nowIso, changefreq: 'daily', priority: '0.95' },
        { loc: `${BASE_URL}/entertainment/novel`, lastmod: nowIso, changefreq: 'weekly', priority: '0.85' },
        { loc: `${BASE_URL}/finance`, lastmod: nowIso, changefreq: 'daily', priority: '0.9' },
        { loc: `${BASE_URL}/finance/util`, lastmod: nowIso, changefreq: 'weekly', priority: '0.9' },
        { loc: `${BASE_URL}/news`, lastmod: nowIso, changefreq: 'hourly', priority: '0.85' },
        { loc: `${BASE_URL}/lounge`, lastmod: nowIso, changefreq: 'daily', priority: '0.8' },
        { loc: `${BASE_URL}/about`, lastmod: DEFAULT_LAST_MOD, changefreq: 'monthly', priority: '0.7' },
        { loc: `${BASE_URL}/editorial-policy`, lastmod: DEFAULT_LAST_MOD, changefreq: 'monthly', priority: '0.7' },
        { loc: `${BASE_URL}/privacy`, lastmod: DEFAULT_LAST_MOD, changefreq: 'monthly', priority: '0.6' },
        { loc: `${BASE_URL}/terms`, lastmod: DEFAULT_LAST_MOD, changefreq: 'monthly', priority: '0.6' },
        { loc: `${BASE_URL}/contact`, lastmod: DEFAULT_LAST_MOD, changefreq: 'monthly', priority: '0.6' },
    ];

    for (const tool of TOOLS_DATA) {
        entries.push({
            loc: `${BASE_URL}/tools/${tool.slug}`,
            lastmod: DEFAULT_LAST_MOD,
            changefreq: 'weekly',
            priority: '0.95',
        });
    }

    const allGameSlugs = Array.from(new Set([...Object.keys(GAMES_DATA), ...Object.keys(GAME_CONFIGS)])).filter(
        (slug) => slug !== 'comboy' && slug !== 'sfc'
    );
    for (const slug of allGameSlugs) {
        entries.push({
            loc: `${BASE_URL}/game/${slug}`,
            lastmod: DEFAULT_LAST_MOD,
            changefreq: 'weekly',
            priority: '0.95',
        });
    }

    for (const guide of GUIDES_DATA) {
        entries.push({
            loc: `${BASE_URL}/guides/${guide.slug}`,
            lastmod: normalizeIsoDate(guide.updatedAt || guide.publishedAt),
            changefreq: 'monthly',
            priority: '0.95',
        });
    }

    return renderUrlSet(entries);
}

async function buildTravelChunkSitemap(page: number): Promise<string | null> {
    try {
        const res = await fetch(`${API_SERVER_URL}/api/seo/sitemaps/travel?page=${page}&limit=5000`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const json = (await res.json()) as {
            success?: boolean;
            data?: { items?: TravelSitemapRow[] };
        };
        const items = json?.data?.items || [];
        if (!json?.success || items.length === 0) return null;

        const entries: UrlEntry[] = items
            .filter((item) => item && item.id)
            .map((item) => ({
                loc: `${BASE_URL}/entertainment/travel/${item.id}`,
                lastmod: normalizeIsoDate(item.updatedAt || item.publishedAt),
                changefreq: 'monthly',
                priority: '0.85',
            }));

        return renderUrlSet(entries);
    } catch {
        return null;
    }
}

async function buildRecentNewsSitemap(): Promise<string> {
    let items: RecentNewsRow[] = [];
    try {
        const res = await fetch(`${API_SERVER_URL}/api/seo/sitemaps/news-recent?limit=1000`, {
            cache: 'no-store',
        });
        if (res.ok) {
            const json = (await res.json()) as {
                success?: boolean;
                data?: { items?: RecentNewsRow[] };
            };
            if (json?.success && Array.isArray(json.data?.items)) {
                items = json.data.items;
            }
        }
    } catch {
        items = [];
    }

    const nowIso = new Date().toISOString();
    const urlNodes = items
        .filter((item) => item && item.id && item.title)
        .map((item) => {
            const pubIso = normalizeIsoDate(item.publishedAt || item.createdAt, nowIso);
            const cleanTitle = item.title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            return `  <url>
    <loc>${escapeXml(`${BASE_URL}/news/${item.id}`)}</loc>
    <lastmod>${escapeXml(pubIso)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>VERA 뉴스</news:name>
        <news:language>ko</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(pubIso)}</news:publication_date>
      <news:title>${escapeXml(cleanTitle)}</news:title>
    </news:news>
  </url>`;
        })
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlNodes}
</urlset>`;
}

export async function GET(_request: Request, { params }: { params: { name: string } }) {
    const name = (params.name || '').trim();

    if (name === 'core.xml') {
        return new NextResponse(buildCoreSitemap(), {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    }

    const travelMatch = /^travel-(\d+)\.xml$/.exec(name);
    if (travelMatch) {
        const page = Number(travelMatch[1]);
        if (!Number.isInteger(page) || page < 1) {
            return new NextResponse('Not Found', { status: 404 });
        }
        const xml = await buildTravelChunkSitemap(page);
        if (!xml) {
            return new NextResponse('Not Found', { status: 404 });
        }
        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    }

    if (name === 'news-recent.xml') {
        const xml = await buildRecentNewsSitemap();
        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
            },
        });
    }

    return new NextResponse('Not Found', { status: 404 });
}
