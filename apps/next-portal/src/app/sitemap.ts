import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';
import { GAME_CONFIGS } from '@/data/gameConfigs';
import { GUIDES_DATA } from '@/data/guidesData';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';
const STATIC_LAST_MOD = '2026-11-10T00:00:00.000Z';

export const revalidate = 3600;

async function fetchTravelArticlesForSitemap(): Promise<{ id: number; published_at?: string }[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/travel?limit=100&sort=popular`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success && Array.isArray(data.articles)) {
      return data.articles;
    }
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://veranex.app';

  // 1. 핵심 허브 및 정책 페이지 (중복 Canonical URL인 /utility, /entertainment 제외하여 색인 집중)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/lifestyle`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/game`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/entertainment/saju`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/entertainment/travel`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/entertainment/novel`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/finance`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/finance/util`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/lounge`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/editorial-policy`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // 2. 25편 지식 가이드 & 전문 칼럼 개별 페이지 (E-E-A-T 핵심)
  const guideRoutes: MetadataRoute.Sitemap = GUIDES_DATA.map((guide) => {
    const rawDate = guide.updatedAt || guide.publishedAt;
    let lastMod = STATIC_LAST_MOD;
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        lastMod = parsed.toISOString();
      }
    }
    return {
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: lastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.95,
    };
  });

  // 3. 도구(미니앱) 개별 SEO 페이지
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: STATIC_LAST_MOD,
    changeFrequency: 'weekly',
    priority: 0.95,
  }));

  // 4. 게임 개별 SEO 페이지
  const allGameSlugs = Array.from(
    new Set([...Object.keys(GAMES_DATA), ...Object.keys(GAME_CONFIGS)])
  ).filter((slug) => slug !== 'comboy' && slug !== 'sfc');

  const gameRoutes: MetadataRoute.Sitemap = allGameSlugs.map((slug) => ({
    url: `${baseUrl}/game/${slug}`,
    lastModified: STATIC_LAST_MOD,
    changeFrequency: 'weekly',
    priority: 0.95,
  }));

  // 5. 영구 보존 여행 명소 상세 페이지 (/entertainment/travel/[id])
  const travelArticles = await fetchTravelArticlesForSitemap();
  const travelRoutes: MetadataRoute.Sitemap = travelArticles
    .filter((item) => item && item.id)
    .map((item) => {
      let lastMod = STATIC_LAST_MOD;
      if (item.published_at) {
        const parsed = new Date(item.published_at);
        if (!isNaN(parsed.getTime())) {
          lastMod = parsed.toISOString();
        }
      }
      return {
        url: `${baseUrl}/entertainment/travel/${item.id}`,
        lastModified: lastMod,
        changeFrequency: 'monthly' as const,
        priority: 0.85,
      };
    });

  return [...staticRoutes, ...toolRoutes, ...gameRoutes, ...guideRoutes, ...travelRoutes];
}
