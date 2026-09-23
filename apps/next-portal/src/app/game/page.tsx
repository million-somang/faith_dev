import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GAMES_DATA } from '@/data/gamesData';
import { AdSlot } from '@/components/adsense/AdSlot';

export const metadata: Metadata = {
  title: '무료 미니게임존 - 스도쿠, 2048, 야구게임, 지뢰찾기, 오목',
  description: '설치 없이 브라우저에서 바로 즐기는 무료 두뇌 퍼즐 및 보드게임 모음입니다. 스도쿠, 2048, 9이닝 숫자야구, 클래식 지뢰찾기를 만나보세요.',
  keywords: ['무료게임', '웹게임', '스도쿠', '2048', '숫자야구', '지뢰찾기', '오목'],
  alternates: {
    canonical: 'https://veranex.app/game',
  },
};

export default function GameHubPage() {
  const games = Object.values(GAMES_DATA);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f6f7]">
      <header className="header-gradient text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-white text-blue-600 px-2 py-0.5 rounded-lg shadow-sm">
              VERA
            </span>
            <span className="text-sm font-semibold text-blue-100 hidden sm:inline">
              게임존
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold text-white/90">
            <Link href="/" className="hover:text-white transition-colors">홈</Link>
            <Link href="/utility" className="hover:text-white transition-colors">도구모음</Link>
            <Link href="/game" className="text-white underline underline-offset-4">게임존</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="text-center py-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            무료 웹 미니게임존
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            남녀노소 누구나 가볍게 즐길 수 있는 정통 두뇌 퍼즐과 보드게임입니다.
          </p>
        </div>

        <AdSlot format="horizontal" />

        <section aria-label="게임 목록" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/game/${game.slug}`}
              scroll={false}
              className="content-card p-5 flex flex-col justify-between group cursor-pointer border border-gray-200 hover:border-amber-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${game.iconBg} ${game.iconColor} flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform`}
                  >
                    <i className={game.icon}></i>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    {game.categoryLabel}
                  </span>
                </div>
                <h2 className="font-bold text-base text-gray-900 mb-1.5 group-hover:text-amber-600 transition-colors">
                  {game.name}
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {game.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                <span>게임 시작</span>
                <i className="fas fa-play text-[10px] group-hover:translate-x-1 transition-transform"></i>
              </div>
            </Link>
          ))}
        </section>

        <AdSlot format="rectangle" />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12 py-6 text-xs text-center text-gray-500">
        <p>© 2026 VERA. 대한민국 대표 무료 웹게임 포털</p>
      </footer>
    </div>
  );
}
