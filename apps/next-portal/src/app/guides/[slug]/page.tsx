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

export default function GuideDetailPage({ params }: GuideDetailPageProps) {
  const article = getGuideBySlug(params.slug);
  if (!article) notFound();

  const relatedArticles = getRelatedGuides(article.slug, article.category);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': article.category === 'tech' ? 'TechArticle' : 'Article',
    headline: article.title,
    description: article.description,
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
      '@id': `https://veranex.app/guides/${article.slug}`,
    },
    keywords: article.tags.join(', '),
    articleSection: article.categoryLabel,
    inLanguage: 'ko-KR',
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
