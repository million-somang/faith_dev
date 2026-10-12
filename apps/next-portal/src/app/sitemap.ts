import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';
import { GUIDES_DATA } from '@/data/guidesData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://veranex.app';
  const currentDate = new Date().toISOString();

  // 1. 고정 핵심 페이지
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/game`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/utility`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/finance`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
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

  // 3. 도구(미니앱) 개별 SEO 페이지
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 4. 게임 개별 SEO 페이지 (베라 플라이트 1942 등 9개 게임)
  const gameRoutes: MetadataRoute.Sitemap = Object.keys(GAMES_DATA).map((slug) => ({
    url: `${baseUrl}/game/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...guideRoutes, ...gameRoutes, ...toolRoutes];
}
