import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';
import { GAME_CONFIGS } from '@/data/gameConfigs';
import { GUIDES_DATA } from '@/data/guidesData';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

export const revalidate = 600;

async function fetchLatestNewsForSitemap(): Promise<{ id: number; published_at?: string; created_at?: string }[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/news?limit=50`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success && Array.isArray(data.news)) {
      return data.news;
    }
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://veranex.app';
  const currentDate = new Date().toISOString();

  // 1. 핵심 허브 및 정책 페이지
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/lifestyle`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/utility`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/finance`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/finance/util`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/game`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/entertainment`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/entertainment/saju`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/entertainment/travel`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/entertainment/novel`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/lounge`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/editorial-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // 2. 25편 지식 가이드 & 전문 칼럼 개별 페이지 (E-E-A-T 핵심)
  const guideRoutes: MetadataRoute.Sitemap = GUIDES_DATA.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: guide.updatedAt || guide.publishedAt || currentDate,
    changeFrequency: 'weekly',
    priority: 0.95,
  }));

  // 3. 도구(미니앱) 개별 SEO 페이지 (image-resizer, webp-converter 포함 14종 전체)
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 4. 게임 개별 SEO 페이지 (베라 플라이트, 장기, 오목, 스도쿠 등 전체)
  const allGameSlugs = Array.from(
    new Set([...Object.keys(GAMES_DATA), ...Object.keys(GAME_CONFIGS)])
  ).filter((slug) => slug !== 'comboy' && slug !== 'sfc');

  const gameRoutes: MetadataRoute.Sitemap = allGameSlugs.map((slug) => ({
    url: `${baseUrl}/game/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 5. 실시간 최신 뉴스 브리핑 상위 50건 동적 포함 (존재하는 유효 ID만 색인 유도)
  const latestNews = await fetchLatestNewsForSitemap();
  const newsRoutes: MetadataRoute.Sitemap = latestNews
    .filter((item) => item && item.id)
    .map((item) => {
      let lastMod = currentDate;
      const rawDate = item.published_at || item.created_at;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          lastMod = parsed.toISOString();
        }
      }
      return {
        url: `${baseUrl}/news/${item.id}`,
        lastModified: lastMod,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    });

  return [...staticRoutes, ...guideRoutes, ...gameRoutes, ...toolRoutes, ...newsRoutes];
}
