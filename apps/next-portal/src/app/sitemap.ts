import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';

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
      url: `${baseUrl}/utility`,
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
  ];

  // 2. 도구(미니앱) 개별 SEO 페이지 (구글 인덱싱 핵심)
  const toolRoutes: MetadataRoute.Sitemap = Object.keys(TOOLS_DATA).map((slug) => ({
    url: `${baseUrl}/tools/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 3. 게임 개별 SEO 페이지
  const gameRoutes: MetadataRoute.Sitemap = Object.keys(GAMES_DATA).map((slug) => ({
    url: `${baseUrl}/game/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticRoutes, ...toolRoutes, ...gameRoutes];
}
