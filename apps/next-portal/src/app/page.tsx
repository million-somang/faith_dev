import React from 'react';
import Link from 'next/link';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';
import { AdSlot } from '@/components/adsense/AdSlot';

export default function HomePage() {
  const popularTools = Object.values(TOOLS_DATA);
  const popularGames = Object.values(GAMES_DATA);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 통합 헤더 */}
      <header className="header-gradient text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-wider bg-white text-blue-600 px-2 py-0.5 rounded-lg shadow-sm">
                VERA
              </span>
              <span className="text-sm font-semibold text-blue-100 hidden sm:inline">
                통합 라이프 포털
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-4 text-xs font-bold text-white/90">
            <Link href="/utility" className="hover:text-white transition-colors">
              스마트도구
            </Link>
            <Link href="/game" className="hover:text-white transition-colors">
              미니게임
            </Link>
            <Link href="/guides" className="hover:text-white transition-colors">
              지식가이드
            </Link>
          </nav>
        </div>
      </header>

      {/* 메인 히어로 & 검색 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-10">
        <section className="text-center py-6">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
            매일 유용한 <span className="text-blue-600">스마트 생활 도구</span>와 <span className="text-indigo-600">미니게임</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            설치 없이 브라우저에서 바로 실행되는 무료 계산기, 텍스트 도구, 두뇌 퍼즐을 즐겨보세요.
          </p>
        </section>

        {/* 상단 Zero-CLS 애드센스 */}
        <AdSlot format="horizontal" />

        {/* 스마트 생활 도구 섹션 (모달 팝업 및 SEO 연동 카드) */}
        <section aria-labelledby="tools-section-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full"></span>
              <h2 id="tools-section-title" className="text-xl font-bold text-gray-900">
                인기 스마트 도구
              </h2>
            </div>
            <Link
              href="/utility"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              더보기 <i className="fas fa-chevron-right text-[10px]"></i>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popularTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                scroll={false}
                className="content-card p-4 sm:p-5 flex flex-col items-center text-center group cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center text-xl mb-3 shadow-inner group-hover:scale-105 transition-transform`}
                >
                  <i className={tool.icon}></i>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {tool.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 미니게임 섹션 */}
        <section aria-labelledby="games-section-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-amber-500 rounded-full"></span>
              <h2 id="games-section-title" className="text-xl font-bold text-gray-900">
                무료 미니게임존
              </h2>
            </div>
            <Link
              href="/game"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              더보기 <i className="fas fa-chevron-right text-[10px]"></i>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {popularGames.map((game) => (
              <Link
                key={game.slug}
                href={`/game/${game.slug}`}
                scroll={false}
                className="content-card p-4 flex flex-col items-center text-center group cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${game.iconBg} ${game.iconColor} flex items-center justify-center text-xl mb-3 shadow-inner group-hover:scale-105 transition-transform`}
                >
                  <i className={game.icon}></i>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                  {game.name}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  {game.categoryLabel}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 하단 Zero-CLS 애드센스 */}
        <AdSlot format="rectangle" />
      </main>

      {/* 하단 공통 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-700 mb-1">VERA (베라) 통합 라이프 포털</p>
            <p>모든 유틸리티 연산과 게임은 사용자 브라우저 보안 샌드박스 내에서 안전하게 작동합니다.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/utility" className="hover:text-gray-900">스마트도구</Link>
            <Link href="/game" className="hover:text-gray-900">게임존</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
