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

const RELATED_STOP_WORDS = new Set([
  '기자', '뉴스', '속보', '단독', '종합', '오늘', '이번', '관련', '대한', '통해',
  '위해', '에서', '으로', '있는', '하는', '했다', '한다', '있다', '없다', '등',
]);

function extractTitleBody(rawTitle: string): string {
  const cleaned = decodeHtmlEntities(rawTitle || '').replace(/\s+/g, ' ').trim();
  const sepIdx = cleaned.lastIndexOf(' - ');
  if (sepIdx > 0 && cleaned.length - sepIdx - 3 <= 25) {
    return cleaned.slice(0, sepIdx).trim();
  }
  return cleaned;
}

function normalizeTitleKey(rawTitle: string): string {
  return extractTitleBody(rawTitle)
    .replace(/[^가-힣a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 24);
}

function extractKeywords(text: string): Set<string> {
  const tokens = decodeHtmlEntities(text || '')
    .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2 && !RELATED_STOP_WORDS.has(t) && !/^\d{1,2}$/.test(t));
  return new Set(tokens);
}

async function fetchNewsListServer(query: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/news?${query}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success && Array.isArray(data?.news)) {
      return data.news as NewsItem[];
    }
    return [];
  } catch (err) {
    console.error(`[SSR RelatedNewsFetch] Failed (${query}):`, err);
    return [];
  }
}

async function fetchRelatedNewsServer(currentNews: NewsItem): Promise<NewsItem[]> {
  const currentCategories = (currentNews.category || 'general')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const primaryCategory = currentCategories[0] || 'general';
  const currentKeywords = extractKeywords(
    `${extractTitleBody(currentNews.title || '')} ${currentNews.tags || ''}`
  );

  const seenIds = new Set<string>([String(currentNews.id)]);
  const seenTitleKeys = new Set<string>();
  const currentTitleKey = normalizeTitleKey(currentNews.title || '');
  if (currentTitleKey) seenTitleKeys.add(currentTitleKey);

  const sameCatPool = await fetchNewsListServer(
    `category=${encodeURIComponent(primaryCategory)}&limit=24`
  );

  const scored: Array<{ item: NewsItem; score: number; index: number }> = [];
  sameCatPool.forEach((item, index) => {
    if (!item || item.id === undefined || item.id === null) return;
    const idStr = String(item.id);
    if (seenIds.has(idStr)) return;
    const tKey = normalizeTitleKey(item.title || '');
    if (tKey && seenTitleKeys.has(tKey)) return;

    seenIds.add(idStr);
    if (tKey) seenTitleKeys.add(tKey);

    let score = 0;
    const candTitleKw = extractKeywords(extractTitleBody(item.title || ''));
    for (const kw of candTitleKw) {
      if (currentKeywords.has(kw)) score += 3;
    }

    const candMetaKw = extractKeywords(
      `${item.summary || item.description || ''} ${item.tags || ''}`
    );
    for (const kw of candMetaKw) {
      if (currentKeywords.has(kw)) score += 1;
    }

    const candCats = (item.category || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    for (const cat of candCats) {
      if (currentCategories.includes(cat)) score += 2;
    }

    scored.push({ item, score, index });
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = scored.slice(0, 4).map((entry) => entry.item);

  if (selected.length < 4) {
    const fallbackPool = await fetchNewsListServer('limit=12');
    for (const item of fallbackPool) {
      if (selected.length >= 4) break;
      if (!item || item.id === undefined || item.id === null) continue;
      const idStr = String(item.id);
      if (seenIds.has(idStr)) continue;
      const tKey = normalizeTitleKey(item.title || '');
      if (tKey && seenTitleKeys.has(tKey)) continue;

      seenIds.add(idStr);
      if (tKey) seenTitleKeys.add(tKey);
      selected.push(item);
    }
  }

  return selected.slice(0, 4);
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

  const relatedNews = await fetchRelatedNewsServer(news);

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
      <NewsDetailClient
        newsId={params.id}
        initialNews={news}
        initialRelatedNews={relatedNews}
      />
    </>
  );
}
