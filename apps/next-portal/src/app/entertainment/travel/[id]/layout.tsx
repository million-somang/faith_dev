import React from 'react';
import type { Metadata } from 'next';

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

interface TravelDetailLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

async function fetchTravelArticleServer(id: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/travel/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success && data?.article) {
      return data.article;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await fetchTravelArticleServer(params.id);
  const pageUrl = `https://veranex.app/entertainment/travel/${params.id}`;

  if (!article) {
    return {
      title: '여행 명소 가이드 - VERA 여행 큐레이션',
      alternates: {
        canonical: pageUrl,
      },
    };
  }

  const title = article.title || `${article.destination || '추천 여행지'} 여행 코스 & 가이드`;
  const rawSummary = (article.summary || article.ai_summary || article.content || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const description =
    rawSummary.slice(0, 155) ||
    `${article.destination || ''} 추천 여행 코스, 최적 방문 시기, 예상 경비 및 주변 맛집·명소 가이드를 확인하세요.`;
  const imageUrl = article.thumbnail || 'https://veranex.app/logo-512.png';

  return {
    title: `${title} - ${article.destination || '여행'} 코스 · 맛집 · 경비 가이드`,
    description,
    keywords: [
      article.destination || '국내여행',
      article.location_address || '여행추천',
      '여행코스',
      '주말나들이',
      '맛집추천',
      'VERA여행',
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${title} | VERA 여행 가이드`,
      description,
      url: pageUrl,
      type: 'article',
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
    },
  };
}

export default function TravelDetailLayout({ children }: TravelDetailLayoutProps) {
  return <>{children}</>;
}
