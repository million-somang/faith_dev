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

  return <TravelHubClient initialArticles={articles} initialTotal={total} />;
}
