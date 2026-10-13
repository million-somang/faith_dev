import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { GAMES_DATA } from '@/data/gamesData';
import { getGameSeoData } from '@/data/gamesSeoData';
import { GAME_CONFIGS } from '@/data/gameConfigs';
import GameInfoClient from './GameInfoClient';

interface GamePageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = Array.from(new Set([...Object.keys(GAMES_DATA), ...Object.keys(GAME_CONFIGS)]));
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const slug = params.slug;
  const config = GAME_CONFIGS[slug];
  const seoData = getGameSeoData(slug);
  const legacyGame = GAMES_DATA[slug];

  if (!config && !legacyGame) return {};

  const title = seoData?.title || `${config?.label || legacyGame?.name} - 무료 웹 게임`;
  const description = seoData?.description || config?.description || legacyGame?.description || '';
  const pageUrl = `https://veranex.app/game/${slug}`;

  return {
    title,
    description,
    keywords: seoData?.keywords || legacyGame?.keywords || ['무료게임', '웹게임', '미니게임', 'VERA'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: '/logo-512.png',
          width: 512,
          height: 512,
          alt: config?.label || legacyGame?.name || 'VERA Game',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function GamePage({ params }: GamePageProps) {
  const slug = params.slug;
  const config = GAME_CONFIGS[slug];
  const legacyGame = GAMES_DATA[slug];

  if (!config && !legacyGame) {
    notFound();
  }

  const seoData = getGameSeoData(slug);
  const pageUrl = `https://veranex.app/game/${slug}`;
  const label = config?.label || legacyGame?.name || slug;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: label,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    url: pageUrl,
    description: seoData?.description || config?.description || legacyGame?.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GameInfoClient slug={slug} />
    </>
  );
}
