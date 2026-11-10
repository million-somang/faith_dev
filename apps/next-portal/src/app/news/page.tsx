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

  return <NewsHubClient initialNews={initialNews} initialHotNews={initialHotNews} />;
}
