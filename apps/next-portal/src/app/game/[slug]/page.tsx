import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GAMES_DATA } from '@/data/gamesData';
import { JsonLd } from '@/components/seo/JsonLd';
import { ToolViewer } from '@/components/tools/ToolViewer';
import { AdSlot } from '@/components/adsense/AdSlot';

interface GamePageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return Object.keys(GAMES_DATA).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const game = GAMES_DATA[params.slug];
  if (!game) return {};

  const pageUrl = `https://veranex.app/game/${game.slug}`;

  return {
    title: `${game.name} - 무료 온라인 웹게임`,
    description: game.description,
    keywords: [...game.keywords, 'VERA', '무료게임', '웹게임', '미니게임'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${game.name} | VERA 게임존`,
      description: game.summary,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: '/logo-512.png',
          width: 512,
          height: 512,
          alt: game.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${game.name} | VERA`,
      description: game.summary,
    },
  };
}

export default function GamePage({ params }: GamePageProps) {
  const game = GAMES_DATA[params.slug];
  if (!game) notFound();

  const pageUrl = `https://veranex.app/game/${game.slug}`;

  return (
    <main className="min-h-screen bg-[#f5f6f7] flex flex-col items-center py-6 px-4 sm:px-6">
      <JsonLd item={game} url={pageUrl} />

      <div className="w-full max-w-4xl flex flex-col items-center">
        <nav aria-label="Breadcrumb" className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              홈
            </Link>
            <span>/</span>
            <Link href="/game" className="hover:text-blue-600 transition-colors">
              게임존
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-800">{game.name}</span>
          </div>

          <Link
            href="/game"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all"
          >
            <i className="fas fa-gamepad text-[11px]"></i>
            전체 게임 보기
          </Link>
        </nav>

        <header className="w-full text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-2">
            <i className={game.icon}></i>
            {game.categoryLabel}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {game.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
            {game.summary}
          </p>
        </header>

        <AdSlot format="horizontal" />

        <section aria-label={`${game.name} 플레이 및 게임 가이드`} className="w-full">
          <ToolViewer item={game} isStandalone={true} />
        </section>

        <AdSlot format="rectangle" />
      </div>
    </main>
  );
}
