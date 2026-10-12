import React from 'react';
import Link from 'next/link';
import { TOOLS_DATA } from '@/data/toolsData';
import { GAMES_DATA } from '@/data/gamesData';
import { GUIDES_DATA } from '@/data/guidesData';
import { AdSlot } from '@/components/adsense/AdSlot';

export default function HomePage() {
  const popularTools = Object.values(TOOLS_DATA);
  const popularGames = Object.values(GAMES_DATA);
  const featuredGuides = GUIDES_DATA.slice(0, 4);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-12">
      {/* 메인 히어로 영역 */}
      <section className="text-center py-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
          <i className="fas fa-sparkles text-amber-500"></i> 검증된 정보와 스마트 라이프
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          매일 유용한 <span className="text-blue-600">지식 가이드</span>와 <span className="text-indigo-600">미니게임</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          엄격한 팩트체크를 거친 25편의 전문 지식 칼럼, 무설치 브라우저 미니게임, 스마트 계산기를 VERA에서 만나보세요.
        </p>
      </section>

      {/* 상단 Zero-CLS 애드센스 */}
      <AdSlot format="horizontal" />

      {/* 추천 지식 가이드 & 칼럼 섹션 */}
      <section aria-labelledby="guides-section-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-teal-600 rounded-full"></span>
            <h2 id="guides-section-title" className="text-xl sm:text-2xl font-bold text-gray-900">
              추천 지식 가이드 & 칼럼
            </h2>
          </div>
          <Link
            href="/guides"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
          >
            25편 전체보기 <i className="fas fa-chevron-right text-[10px]"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${guide.categoryColor}`}>
                    {guide.categoryLabel}
                  </span>
                  <span className="text-slate-400 text-xs font-medium">
                    <i className="far fa-clock mr-1"></i>{guide.readTime}
                  </span>
                </div>
                <h3 className="font-bold text-base text-gray-900 group-hover:text-teal-700 transition-colors mb-2 line-clamp-2 leading-snug">
                  {guide.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                  {guide.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>{guide.author}</span>
                <span className="font-semibold text-teal-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  읽어보기 <i className="fas fa-chevron-right text-[10px]"></i>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 미니게임 섹션 (베라 플라이트 포함) */}
      <section aria-labelledby="games-section-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-amber-500 rounded-full"></span>
            <h2 id="games-section-title" className="text-xl sm:text-2xl font-bold text-gray-900">
              무료 미니게임존
            </h2>
          </div>
          <Link
            href="/game"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
          >
            게임존 전체보기 <i className="fas fa-chevron-right text-[10px]"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {popularGames.map((game) => (
            <Link
              key={game.slug}
              href={`/game/${game.slug}`}
              scroll={false}
              className="content-card p-4 flex flex-col items-center text-center group cursor-pointer hover:border-amber-300"
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

      {/* 스마트 생활 도구 섹션 */}
      <section aria-labelledby="tools-section-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full"></span>
            <h2 id="tools-section-title" className="text-xl sm:text-2xl font-bold text-gray-900">
              스마트 생활 도구
            </h2>
          </div>
          <Link
            href="/utility"
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            도구 전체보기 <i className="fas fa-chevron-right text-[10px]"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {popularTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              scroll={false}
              className="content-card p-4 sm:p-5 flex flex-col items-center text-center group cursor-pointer hover:border-blue-300"
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

      {/* 하단 Zero-CLS 애드센스 */}
      <AdSlot format="rectangle" />
    </main>
  );
}
