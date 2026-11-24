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

interface TravelArticleRecord {
  id: number;
  title: string;
  destination: string;
  region: string;
  category: string;
  summary: string | null;
  ai_summary: string | null;
  content: string;
  travel_tips: string | null;
  thumbnail: string | null;
  gallery: string | null;
  best_season: string | null;
  duration: string | null;
  estimated_cost: string | null;
  location_address: string | null;
  province?: string | null;
  city?: string | null;
  tags: string | null;
  author: string | null;
  source: string | null;
  source_url: string | null;
  view_count: number;
  like_count: number;
  published_at: string;
  updated_at?: string;
}

function stripHtmlAndWhitespace(raw?: string | null): string {
  return (raw || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTravelJsonLd(article: TravelArticleRecord) {
  const pageUrl = `https://veranex.app/entertainment/travel/${article.id}`;
  const placeName = (article.destination || article.title).trim();
  const rawDesc =
    stripHtmlAndWhitespace(article.ai_summary || article.summary || article.content).slice(0, 220) ||
    article.title;
  const imageUrl = article.thumbnail || 'https://veranex.app/logo-512.png';

  const faqEntries: Array<{ '@type': 'Question'; name: string; acceptedAnswer: { '@type': 'Answer'; text: string } }> = [];
  if (article.best_season && article.best_season.trim()) {
    faqEntries.push({
      '@type': 'Question',
      name: `${placeName} 여행 최적 방문 시기는 언제인가요?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${placeName}의 추천 방문 시기는 ${article.best_season.trim()}입니다.`,
      },
    });
  }
  if ((article.duration && article.duration.trim()) || (article.estimated_cost && article.estimated_cost.trim())) {
    const parts: string[] = [];
    if (article.duration?.trim()) parts.push(`추천 일정은 ${article.duration.trim()}`);
    if (article.estimated_cost?.trim()) parts.push(`예상 경비는 ${article.estimated_cost.trim()}`);
    faqEntries.push({
      '@type': 'Question',
      name: `${placeName} 추천 일정과 예상 경비는 어느 정도인가요?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${parts.join(', ')}입니다.`,
      },
    });
  }
  const addressLabel = (article.location_address || [article.province, article.city].filter(Boolean).join(' ')).trim();
  if (addressLabel) {
    faqEntries.push({
      '@type': 'Question',
      name: `${placeName} 위치(주소)는 어디인가요?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${placeName}의 위치는 ${addressLabel}입니다.`,
      },
    });
  }
  const cleanTips = stripHtmlAndWhitespace(article.travel_tips).slice(0, 260);
  if (cleanTips) {
    faqEntries.push({
      '@type': 'Question',
      name: `${placeName} 방문 전 참고할 여행 팁은 무엇인가요?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: cleanTips,
      },
    });
  }

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: article.title,
      description: rawDesc,
      image: [imageUrl],
      datePublished: article.published_at,
      dateModified: article.updated_at || article.published_at,
      author: {
        '@type': 'Organization',
        name: article.author || 'VERA 여행 큐레이션팀',
      },
      publisher: {
        '@type': 'Organization',
        name: 'VERA (베라)',
        url: 'https://veranex.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://veranex.app/logo-512.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': pageUrl,
      },
      inLanguage: 'ko-KR',
    },
    {
      '@type': 'TouristAttraction',
      name: placeName,
      description: rawDesc,
      image: imageUrl,
      url: pageUrl,
      touristType: article.category || '관광 명소',
      ...(addressLabel
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: addressLabel,
              addressCountry: article.region === 'korea' ? 'KR' : undefined,
            },
          }
        : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://veranex.app' },
        { '@type': 'ListItem', position: 2, name: '여행 가이드', item: 'https://veranex.app/entertainment/travel' },
        { '@type': 'ListItem', position: 3, name: article.title, item: pageUrl },
      ],
    },
  ];

  if (faqEntries.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqEntries,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export default async function TravelDetailPage({ params }: { params: { id: string } }) {
  const data = await fetchTravelDetailServer(params.id);

  if (!data || !data.article) {
    notFound();
  }

  const travelJsonLd = buildTravelJsonLd(data.article as TravelArticleRecord);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(travelJsonLd) }}
      />
      <TravelDetailClient initialArticle={data.article} initialRelated={data.related} />
    </>
  );
}
