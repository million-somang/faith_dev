import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS_DATA } from '@/data/toolsData';
import { AdSlot } from '@/components/adsense/AdSlot';

export const metadata: Metadata = {
  title: '스마트 생활 도구 모음 - 무료 웹 계산기 및 텍스트 유틸리티',
  description: '사칙연산·할인율 계산기, 글자수 세기, 평수 변환, 예적금 이자, 퇴직금 계산기 등 실생활에 꼭 필요한 무료 웹 유틸리티 도구 모음입니다.',
  keywords: ['생활도구', '온라인계산기', '글자수세기', '평수계산기', '이자계산기', '퇴직금계산기'],
  alternates: {
    canonical: 'https://veranex.app/utility',
  },
};

export default function UtilityHubPage() {
  const tools = Object.values(TOOLS_DATA);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f6f7]">
      {/* 상단 헤더 */}
      <header className="header-gradient text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-white text-blue-600 px-2 py-0.5 rounded-lg shadow-sm">
              VERA
            </span>
            <span className="text-sm font-semibold text-blue-100 hidden sm:inline">
              스마트도구
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold text-white/90">
            <Link href="/" className="hover:text-white transition-colors">홈</Link>
            <Link href="/utility" className="text-white underline underline-offset-4">도구모음</Link>
            <Link href="/game" className="hover:text-white transition-colors">게임존</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="text-center py-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            스마트 생활 유틸리티 허브
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            정밀 연산과 안전한 브라우저 샌드박스를 제공하는 무료 웹 도구들입니다.
          </p>
        </div>

        <AdSlot format="horizontal" />

        {/* 도구 그리드 (포털 내에서는 모달, 검색엔진에는 독립 페이지로 연결) */}
        <section aria-label="도구 목록" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              scroll={false}
              className="content-card p-5 flex flex-col justify-between group cursor-pointer border border-gray-200 hover:border-blue-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform`}
                  >
                    <i className={tool.icon}></i>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    {tool.categoryLabel}
                  </span>
                </div>
                <h2 className="font-bold text-base text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {tool.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>실행하기</span>
                <i className="fas fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform"></i>
              </div>
            </Link>
          ))}
        </section>

        <AdSlot format="rectangle" />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12 py-6 text-xs text-center text-gray-500">
        <p>© 2026 VERA. 대한민국 대표 무료 스마트 유틸리티 포털</p>
      </footer>
    </div>
  );
}
