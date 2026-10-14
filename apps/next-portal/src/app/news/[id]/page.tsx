import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategoryName, decodeHtmlEntities } from '@faithportal/core-utils';
import NewsDetailClient, { NewsItem } from './NewsDetailClient';

interface NewsDetailPageProps {
  params: {
    id: string;
  };
}

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

function cleanTitleAndPublisher(rawTitle: string, fallbackPublisher?: string) {
  const cleaned = decodeHtmlEntities(rawTitle || '').replace(/\s+/g, ' ').trim();
  const sepIdx = cleaned.lastIndexOf(' - ');
  if (sepIdx > 0 && cleaned.length - sepIdx - 3 <= 25) {
    return {
      title: cleaned.slice(0, sepIdx).trim(),
      publisher: cleaned.slice(sepIdx + 3).trim(),
    };
  }
  return {
    title: cleaned,
    publisher: fallbackPublisher || 'VERA 뉴스',
  };
}

async function fetchNewsByIdServer(id: string): Promise<NewsItem | null> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/news/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (data?.success && data?.news) {
      return data.news as NewsItem;
    }
    return null;
  } catch (err) {
    console.error(`[SSR NewsFetch] Failed to fetch news ${id}:`, err);
    return null;
  }
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const news = await fetchNewsByIdServer(params.id);
  if (!news) {
    return {
      title: '기사를 찾을 수 없습니다',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { title, publisher } = cleanTitleAndPublisher(news.title, news.publisher || news.source);
  const rawSummary = decodeHtmlEntities(news.summary || news.description || news.content || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const description = rawSummary.slice(0, 160) || `${title} - VERA 실시간 팩트 브리핑 뉴스`;
  const categoryName = getCategoryName(news.category || 'general');
  const pageUrl = `https://veranex.app/news/${news.id || params.id}`;
  const imageUrl = news.image_url || news.thumbnail || 'https://veranex.app/logo-512.png';

  return {
    title: `${title} - ${categoryName} 뉴스 브리핑`,
    description,
    keywords: [categoryName, publisher, '실시간뉴스', '팩트브리핑', 'VERA', '베라뉴스'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${title} | VERA 뉴스`,
      description,
      url: pageUrl,
      type: 'article',
      publishedTime: news.published_at || news.pubDate || news.created_at,
      authors: [publisher],
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | VERA`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const news = await fetchNewsByIdServer(params.id);

  // 존재하지 않는 과거/삭제된 뉴스 ID는 즉시 HTTP 404 반환 (Soft 404 완전 차단)
  if (!news) {
    notFound();
  }

  const { title, publisher } = cleanTitleAndPublisher(news.title, news.publisher || news.source);
  const rawSummary = decodeHtmlEntities(news.summary || news.description || news.content || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const pageUrl = `https://veranex.app/news/${news.id || params.id}`;
  const imageUrl = news.image_url || news.thumbnail || 'https://veranex.app/logo-512.png';
  const categoryName = getCategoryName(news.category || 'general');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        headline: title,
        description: rawSummary.slice(0, 200) || title,
        image: [imageUrl],
        datePublished: news.published_at || news.pubDate || news.created_at,
        dateModified: news.published_at || news.pubDate || news.created_at,
        author: {
          '@type': 'Organization',
          name: publisher,
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
        articleSection: categoryName,
        inLanguage: 'ko-KR',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '홈',
            item: 'https://veranex.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '뉴스',
            item: 'https://veranex.app/news',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDetailClient newsId={params.id} initialNews={news} />
    </>
  );
}
