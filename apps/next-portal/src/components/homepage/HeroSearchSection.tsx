'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export const HeroSearchSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/guides?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-12 py-9 sm:py-12 mb-8 shadow-xl">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-500/10 pointer-events-none blur-3xl"></div>
      <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-purple-500/10 pointer-events-none blur-3xl"></div>

      <div className="relative max-w-3xl mx-auto text-center">
        <span className="inline-block px-3.5 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-bold mb-3 border border-white/10 tracking-wide">
          VERA 프리미엄 지식 매거진 &amp; 라이프 포털
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
          세상의 모든 지식과 일상의 인사이트를 잇는 프리미엄 매거진 포털
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mb-6 font-normal leading-relaxed">
          금융 재테크, 명리학 인문, 웹소설 작법, IT 알고리즘 등 25편의 검증된 전문 지식 가이드와 스마트 도구를 만나보세요.
        </p>

        {/* 검색창 */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-xl flex items-center px-5 py-3 max-w-2xl mx-auto"
        >
          <i className="fas fa-search text-slate-400 mr-3"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="지식 칼럼, 뉴스, 생활도구, 게임 검색..."
            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400 font-medium"
          />
          <button
            type="submit"
            className="flex items-center justify-center px-5 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all ml-2 cursor-pointer"
            aria-label="검색"
          >
            검색
          </button>
        </form>
      </div>
    </section>
  );
};
