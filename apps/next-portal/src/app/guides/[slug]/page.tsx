import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { GUIDES_DATA, getGuideBySlug, getRelatedGuides } from '@/data/guidesData';
import { GuideDetailView } from '@/components/guides/GuideDetailView';

interface GuideDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return GUIDES_DATA.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const article = getGuideBySlug(params.slug);
  if (!article) return {};

  const pageUrl = `https://veranex.app/guides/${article.slug}`;

  return {
    title: `${article.title} - VERA 가이드`,
    description: article.description,
    keywords: [...article.tags, article.categoryLabel, 'VERA', '지식가이드', '칼럼'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${article.title} | VERA`,
      description: article.description,
      url: pageUrl,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author],
      tags: article.tags,
      images: [
        {
          url: '/logo-512.png',
          width: 512,
          height: 512,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | VERA`,
      description: article.description,
    },
  };
}

function cleanMarkdownLine(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildGuideFaqs(article: { title: string; summary: string; content: string }) {
  const faqs: Array<{ '@type': 'Question'; name: string; acceptedAnswer: { '@type': 'Answer'; text: string } }> = [];
  if (article.summary?.trim()) {
    faqs.push({
      '@type': 'Question',
      name: `${article.title}의 핵심 요약은 무엇인가요?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: article.summary.trim(),
      },
    });
  }

  const sections = article.content.split(/^##\s+/m).slice(1);
  for (const sec of sections) {
    if (faqs.length >= 4) break;
    const lines = sec.split(/\r?\n/);
    const heading = cleanMarkdownLine(lines[0] || '');
    if (!heading) continue;
    const bodyLines = lines
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('---') && !l.startsWith('###'));
    const answerText = cleanMarkdownLine(bodyLines.slice(0, 3).join(' ')).slice(0, 260);
    if (answerText.length >= 25) {
      faqs.push({
        '@type': 'Question',
        name: heading.endsWith('?') ? heading : `${heading}에 대해 어떻게 이해해야 하나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answerText,
        },
      });
    }
  }
  return faqs;
}

export default function GuideDetailPage({ params }: GuideDetailPageProps) {
  const article = getGuideBySlug(params.slug);
  if (!article) notFound();

  const relatedArticles = getRelatedGuides(article.slug, article.category);
  const pageUrl = `https://veranex.app/guides/${article.slug}`;
  const guideFaqs = buildGuideFaqs(article);

  const graph: Record<string, unknown>[] = [
    {
      '@type': article.category === 'tech' ? 'TechArticle' : 'Article',
      headline: article.title,
      description: article.description,
      image: ['https://veranex.app/logo-512.png'],
      author: {
        '@type': 'Person',
        name: article.author,
        jobTitle: article.authorRole,
        worksFor: {
          '@type': 'Organization',
          name: 'VERA Knowledge Center',
          url: 'https://veranex.app',
        },
      },
      publisher: {
        '@type': 'Organization',
        name: 'VERA',
        url: 'https://veranex.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://veranex.app/logo-512.png',
        },
      },
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': pageUrl,
      },
      keywords: article.tags.join(', '),
      articleSection: article.categoryLabel,
      inLanguage: 'ko-KR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://veranex.app' },
        { '@type': 'ListItem', position: 2, name: '지식 가이드', item: 'https://veranex.app/guides' },
        { '@type': 'ListItem', position: 3, name: article.title, item: pageUrl },
      ],
    },
  ];

  if (guideFaqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: guideFaqs,
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GuideDetailView article={article} relatedArticles={relatedArticles} />
    </>
  );
}
