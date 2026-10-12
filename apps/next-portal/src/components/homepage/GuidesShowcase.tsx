'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { GUIDES_DATA, GuideArticle } from '@/data/guidesData';

type GuideTabKey = 'all' | 'finance' | 'saju' | 'novel' | 'tech';

const GUIDE_TABS: { key: GuideTabKey; label: string; icon: string }[] = [
  { key: 'all', label: '전체', icon: 'fa-layer-group' },
  { key: 'finance', label: '금융·재테크', icon: 'fa-chart-line' },
  { key: 'saju', label: '명리학·문화', icon: 'fa-yin-yang' },
  { key: 'novel', label: '웹소설 작법', icon: 'fa-book-open' },
  { key: 'tech', label: 'IT·알고리즘', icon: 'fa-microchip' },
];

const CURATED_TOP_SLUGS = [
  '2026-global-interest-rate-dividend-strategy',
  'saju-manseryeok-principles-and-four-pillars',
  'webnovel-trends-regression-possession-reincarnation',
  'loan-interest-calculation-and-repayment-methods',
  'sudoku-advanced-solving-techniques-naked-single-to-x-wing',
  'sp500-index-fund-dollar-investing-principles',
  'character-conflict-design-and-villain-writing',
  'ai-news-curation-and-smart-current-affairs-literacy',
];

export const GuidesShowcase: React.FC = () => {
  const [selectedGuideTab, setSelectedGuideTab] = useState<GuideTabKey>('all');

  const displayedGuides = useMemo(() => {
    if (selectedGuideTab === 'all') {
      const curated = CURATED_TOP_SLUGS
        .map((slug) => GUIDES_DATA.find((g) => g.slug === slug))
        .filter((g): g is GuideArticle => !!g);
      if (curated.length >= 8) return curated.slice(0, 8);
      const remaining = GUIDES_DATA.filter((g) => !curated.some((c) => c.slug === g.slug));
      return [...curated, ...remaining].slice(0, 8);
    }
    if (selectedGuideTab === 'finance') {
      return GUIDES_DATA.filter((g) => g.category === 'finance').slice(0, 8);
    }
    if (selectedGuideTab === 'saju') {
      return GUIDES_DATA.filter((g) => g.category === 'saju').slice(0, 8);
    }
    if (selectedGuideTab === 'novel') {
      return GUIDES_DATA.filter((g) => g.category === 'novel').slice(0, 8);
    }
    if (selectedGuideTab === 'tech') {
      return GUIDES_DATA.filter((g) => g.category === 'tech' || g.category === 'game').slice(0, 8);
    }
    return GUIDES_DATA.slice(0, 8);
  }, [selectedGuideTab]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-sm">
      {/* 섹션 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-200/50">
            <i className="fas fa-book-open text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                지식 가이드 &amp; 전문 칼럼
              </h2>
              <span className="text-[11px] bg-teal-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                25편 완비
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              금융·명리·작법·IT 분석까지 VERA 전문 편집팀이 집필한 심층 지식 매거진
            </p>
          </div>
        </div>
        <Link
          href="/guides"
          className="text-xs sm:text-sm font-extrabold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition-colors self-start sm:self-auto bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200/60"
        >
          <span>25편 전체보기</span>
          <i className="fas fa-arrow-right text-xs"></i>
        </Link>
      </div>

      {/* 25편 완비 & 매주 정기 업데이트 신뢰성 안내 띠지 */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-200/80 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            <i className="fas fa-shield-alt"></i>
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-teal-900 text-sm">
                VERA 편집국 공인 E-E-A-T 심층 칼럼
              </span>
              <span className="bg-teal-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                25편 완비 · 정기 업데이트
              </span>
            </div>
            <p className="text-teal-800 text-[11px] mt-0.5 leading-relaxed">
              공공 데이터 및 전문 원전에 기반해 집필되며, 전담 팩트체커의 상시 교차 검증을 거쳐 투명하게 무료 제공됩니다.
            </p>
          </div>
        </div>
        <Link
          href="/editorial-policy"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 hover:underline px-3 py-1.5 rounded-lg bg-white/80 border border-teal-200 self-start sm:self-auto"
        >
          <span>편집 원칙 및 팩트체크 기준</span>
          <i className="fas fa-chevron-right text-[10px]"></i>
        </Link>
      </div>

      {/* 카테고리 필터 탭 (전체, 금융·재테크, 명리학·문화, 웹소설 작법, IT·알고리즘) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 mb-5">
        {GUIDE_TABS.map((tab) => {
          const isActive = selectedGuideTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedGuideTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              <i className={`fas ${tab.icon} text-[11px] ${isActive ? 'text-teal-300' : 'text-gray-400'}`}></i>
              <span>{tab.label}</span>
              {tab.key === 'all' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  25
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 8대 엄선 대표 칼럼 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayedGuides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="p-5 rounded-2xl border border-gray-200/85 hover:border-teal-400 hover:bg-gradient-to-b hover:from-white hover:to-teal-50/25 transition-all group flex flex-col justify-between bg-white shadow-xs hover:shadow-md"
          >
            <div>
              {/* 상단 뱃지 & 팩트체크 & 소요 시간 */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${guide.categoryColor}`}>
                  {guide.categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  <i className="fas fa-shield-alt text-emerald-600"></i>
                  <span>팩트체크 완료</span>
                </span>
                <span className="text-gray-400 text-[11px] font-medium ml-auto flex items-center gap-1">
                  <i className="far fa-clock text-[10px]"></i>
                  <span>{guide.readTime}</span>
                </span>
              </div>

              {/* 칼럼 제목 */}
              <h3 className="font-extrabold text-gray-900 group-hover:text-teal-700 transition-colors text-base line-clamp-2 leading-snug mb-2">
                {guide.title}
              </h3>

              {/* 요약문 */}
              <p className="text-gray-600 text-xs line-clamp-2 font-normal leading-relaxed mb-4">
                {guide.summary || guide.description}
              </p>
            </div>

            {/* 저자 및 상세 보기 링크 */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-500 min-w-0 pr-2">
                <i className="fas fa-feather-alt text-teal-600 text-[11px] shrink-0"></i>
                <span className="font-bold text-gray-800 truncate">{guide.author}</span>
                {guide.authorRole && (
                  <span className="text-[10px] text-gray-400 hidden md:inline truncate">
                    · {guide.authorRole}
                  </span>
                )}
              </div>
              <span className="text-teal-700 font-extrabold text-xs shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>전문 읽기</span>
                <i className="fas fa-chevron-right text-[9px]"></i>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* 하단 공지 및 허브 바로가기 */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <i className="fas fa-info-circle text-teal-600"></i>
          <span>모든 칼럼은 통계청·한국은행·금융위 공식 공공 데이터에 기반하여 정기 개정됩니다.</span>
        </div>
        <Link
          href="/guides"
          className="text-teal-700 font-extrabold hover:text-teal-900 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>25편 지식 아카이브 전체 탐색하기 →</span>
        </Link>
      </div>
    </div>
  );
};
