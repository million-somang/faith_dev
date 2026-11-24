import React from 'react';
import TravelHubClient from './TravelHubClient';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

export const dynamic = 'force-dynamic';

async function fetchInitialTravelListServer(): Promise<{ articles: any[]; total: number }> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/travel?limit=12&sort=latest`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { articles: [], total: 0 };
    const data = await res.json();
    if (data?.success && Array.isArray(data.articles)) {
      return {
        articles: data.articles,
        total: data.pagination?.total || data.articles.length,
      };
    }
    return { articles: [], total: 0 };
  } catch {
    return { articles: [], total: 0 };
  }
}

export default async function TravelPage() {
  const { articles, total } = await fetchInitialTravelListServer();

  const travelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '전국 & 해외 감성 여행 가이드 | VERA',
    description:
      '인터랙티브 대한민국 지도 기반으로 전국 명소, 로컬 맛집, 코스별 경비와 여행 가이드를 탐색하는 VERA 여행 허브입니다.',
    url: 'https://veranex.app/entertainment/travel',
    inLanguage: 'ko-KR',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://veranex.app/#website',
      url: 'https://veranex.app',
      name: 'VERA (베라)',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: articles.slice(0, 12).map((article, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: String(article.title || `여행 가이드 ${idx + 1}`),
        url: `https://veranex.app/entertainment/travel/${article.id}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(travelJsonLd) }}
      />
      <TravelHubClient initialArticles={articles} initialTotal={total} />
    </>
  );
}
