import React from 'react';
import NewsHubClient from './NewsHubClient';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

export const dynamic = 'force-dynamic';

async function fetchInitialNewsServer(): Promise<any[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/news?limit=10&includeStocks=true`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success) {
      return data.newsletters || data.news || [];
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchInitialHotNewsServer(): Promise<any[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/news/hot?limit=10`, {
      next: { revalidate: 300 },
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

export default async function NewsPage() {
  const [initialNews, initialHotNews] = await Promise.all([
    fetchInitialNewsServer(),
    fetchInitialHotNewsServer(),
  ]);

  const newsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '실시간 뉴스 & AI 팩트 브리핑 | VERA',
    description:
      '정치, 경제, IT/과학, 증시 주요 뉴스와 핵심 팩트를 한눈에 확인하는 VERA 실시간 뉴스 허브입니다.',
    url: 'https://veranex.app/news',
    inLanguage: 'ko-KR',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://veranex.app/#website',
      url: 'https://veranex.app',
      name: 'VERA (베라)',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: initialNews.length,
      itemListElement: initialNews.slice(0, 10).map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: String(item.title || `뉴스 ${idx + 1}`),
        url: `https://veranex.app/news/${item.news_id || item.id}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }}
      />
      <NewsHubClient initialNews={initialNews} initialHotNews={initialHotNews} />
    </>
  );
}
