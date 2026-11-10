import React from 'react';
import { notFound } from 'next/navigation';
import TravelDetailClient from './TravelDetailClient';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

export const dynamic = 'force-dynamic';

async function fetchTravelDetailServer(id: string): Promise<{ article: any; related: any[] } | null> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/travel/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success && data?.article) {
      return {
        article: data.article,
        related: data.related || [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default async function TravelDetailPage({ params }: { params: { id: string } }) {
  const data = await fetchTravelDetailServer(params.id);

  if (!data || !data.article) {
    notFound();
  }

  return <TravelDetailClient initialArticle={data.article} initialRelated={data.related} />;
}
