import { NextResponse } from 'next/server';
import { GUIDES_DATA } from '@/data/guidesData';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';
const BASE_URL = 'https://veranex.app';

export const dynamic = 'force-dynamic';

interface TravelRssItem {
    id: number;
    title: string;
    destination: string;
    region: string;
    province?: string | null;
    city?: string | null;
    category: string;
    summary: string;
    author?: string | null;
    publishedAt?: string | null;
    createdAt?: string | null;
}

function escapeCdata(str: string): string {
    return (str || '').replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function toRfc822(raw?: string | null): string {
    if (!raw) return new Date().toUTCString();
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date().toUTCString() : parsed.toUTCString();
}

export async function GET() {
    let travelItems: TravelRssItem[] = [];
    try {
        const res = await fetch(`${API_SERVER_URL}/api/seo/rss/travel?limit=100`, {
            cache: 'no-store',
        });
        if (res.ok) {
            const json = (await res.json()) as {
                success?: boolean;
                data?: { items?: TravelRssItem[] };
            };
            if (json?.success && Array.isArray(json.data?.items)) {
                travelItems = json.data.items;
            }
        }
    } catch {
        travelItems = [];
    }

    const xmlItems: string[] = [];

    for (const t of travelItems) {
        if (!t || !t.id || !t.title) continue;
        const link = `${BASE_URL}/entertainment/travel/${t.id}`;
        const desc = t.summary || `${t.destination || '추천 여행지'} 상세 여행 코스 및 방문 정보`;
        const locLabel = [t.province, t.city, t.category].filter(Boolean).join(' · ') || '여행 큐레이션';
        xmlItems.push(`    <item>
      <title><![CDATA[${escapeCdata(t.title)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${escapeCdata(desc)}]]></description>
      <category><![CDATA[${escapeCdata(locLabel)}]]></category>
      <author><![CDATA[${escapeCdata(t.author || 'VERA 여행 큐레이션팀')}]]></author>
      <pubDate>${toRfc822(t.publishedAt || t.createdAt)}</pubDate>
    </item>`);
    }

    for (const guide of GUIDES_DATA) {
        const link = `${BASE_URL}/guides/${guide.slug}`;
        xmlItems.push(`    <item>
      <title><![CDATA[${escapeCdata(guide.title)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${escapeCdata(guide.description || guide.summary)}]]></description>
      <category><![CDATA[${escapeCdata(guide.categoryLabel)}]]></category>
      <author><![CDATA[${escapeCdata(guide.author)}]]></author>
      <pubDate>${toRfc822(guide.updatedAt || guide.publishedAt)}</pubDate>
    </item>`);
    }

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VERA (베라) - 전국 여행 명소 &amp; 전문 지식 가이드 피드</title>
    <link>${BASE_URL}/entertainment/travel</link>
    <atom:link href="${BASE_URL}/rss-travel.xml" rel="self" type="application/rss+xml" />
    <description>검증된 전국·해외 여행 명소 코스 가이드와 금융·사주·생활·IT 전문 칼럼 RSS 피드입니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlItems.join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
        status: 200,
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
        },
    });
}
