'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TOOLS_DATA, ToolDetailItem } from '@/data/toolsData';
import { getUtilityVisualMeta } from '@/utils/utilityAssets';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import { getFrequentAppIds, recordAppUsage } from '@/hooks/useFrequentApps';

type ToolTabKey = 'popular' | 'finance-calc' | 'productivity' | 'dev' | 'text';

const TOOL_TABS: { key: ToolTabKey; label: string }[] = [
  { key: 'popular', label: '인기 TOP' },
  { key: 'finance-calc', label: '금융·계산' },
  { key: 'productivity', label: '일정·생활' },
  { key: 'dev', label: '이미지·개발' },
  { key: 'text', label: '텍스트·AI' },
];

const PRODUCTIVITY_SLUGS = new Set(['todo-list', 'dday-calc', 'age-calc', 'customs-calc']);
const DEFAULT_POPULAR_ORDER = [
  'severance-calc',
  'todo-list',
  'pyeong-calc',
  'finance-dsr',
  'interest-calc',
  'image-resizer',
  'qr-generator',
  'age-calc',
];

interface FrequentMiniAppRow {
  slug?: string;
}

export const LifestyleToolsShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTabKey>('popular');
  const [myFrequentIds, setMyFrequentIds] = useState<string[]>([]);
  const [serverPopularSlugs, setServerPopularSlugs] = useState<string[]>([]);
  const [apiDelayed, setApiDelayed] = useState(false);
  const { launchApp } = useAppLauncher();
  const router = useRouter();

  useEffect(() => {
    setMyFrequentIds(getFrequentAppIds());
  }, []);

  useEffect(() => {
    let active = true;
    const loadFrequent = async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const res = await fetch('/api/mini-apps/frequent?days=30');
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!active) return;
          if (data?.success && Array.isArray(data.apps)) {
            const slugs = (data.apps as FrequentMiniAppRow[])
              .map((a) => String(a.slug || '').trim())
              .filter(Boolean);
            setServerPopularSlugs(slugs);
            setApiDelayed(false);
            return;
          }
        } catch {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          } else if (active) {
            setApiDelayed(true);
          }
        }
      }
    };
    loadFrequent();
    return () => {
      active = false;
    };
  }, []);

  const myFrequentTools = useMemo(() => {
    if (myFrequentIds.length === 0) return [];
    return myFrequentIds
      .map((slug) => TOOLS_DATA.find((t) => t.slug === slug))
      .filter((t): t is ToolDetailItem => Boolean(t))
      .slice(0, 4);
  }, [myFrequentIds]);

  const displayedTools = useMemo(() => {
    if (activeTab === 'popular') {
      const rankList = serverPopularSlugs.length > 0 ? serverPopularSlugs : DEFAULT_POPULAR_ORDER;
      const ranked: ToolDetailItem[] = [];
      for (const slug of rankList) {
        const found = TOOLS_DATA.find((t) => t.slug === slug);
        if (found && !ranked.some((r) => r.slug === found.slug)) {
          ranked.push(found);
        }
      }
      for (const tool of TOOLS_DATA) {
        if (!ranked.some((r) => r.slug === tool.slug)) {
          ranked.push(tool);
        }
      }
      return ranked.slice(0, 8);
    }

    if (activeTab === 'finance-calc') {
      return TOOLS_DATA.filter((t) => t.category === 'finance' || t.category === 'calc').slice(0, 8);
    }

    if (activeTab === 'productivity') {
      return TOOLS_DATA.filter((t) => PRODUCTIVITY_SLUGS.has(t.slug)).slice(0, 8);
    }

    if (activeTab === 'dev') {
      return TOOLS_DATA.filter((t) => t.category === 'dev').slice(0, 8);
    }

    return TOOLS_DATA.filter((t) => t.category === 'text').slice(0, 8);
  }, [activeTab, serverPopularSlugs]);

  const handleLaunch = (tool: ToolDetailItem) => {
    recordAppUsage(tool.slug);
    setMyFrequentIds(getFrequentAppIds());
    if (tool.appUrl.startsWith('/app/')) {
      launchApp(tool.appUrl, tool.slug);
    } else {
      router.push(tool.appUrl);
    }
  };

  return (
    <section
      aria-label="스마트 생활도구 쇼케이스"
      className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <i className="fas fa-toolbox text-base sm:text-lg"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                스마트 생활도구
              </h2>
              <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-extrabold">
                {TOOLS_DATA.length}종 무료
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              카드 클릭 시 계산식·상세 안내, 실행 버튼 클릭 시 설치 없이 즉시 팝업 실행
            </p>
          </div>
        </div>
        <Link
          href="/lifestyle"
          className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors shrink-0"
        >
          <span>전체 16종</span>
          <i className="fas fa-chevron-right text-[10px]"></i>
        </Link>
      </div>

      {/* 내 자주 쓴 도구 (로컬 사용 기록이 있을 때만 노출) */}
      {myFrequentTools.length > 0 && (
        <div className="mb-3.5 p-3 rounded-2xl bg-teal-50/70 border border-teal-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <span className="text-[11px] font-extrabold text-teal-800 shrink-0 flex items-center gap-1">
              <i className="fas fa-bolt text-teal-600"></i>
              <span>자주 쓴 도구</span>
            </span>
            {myFrequentTools.map((tool) => (
              <button
                key={tool.slug}
                type="button"
                onClick={() => handleLaunch(tool)}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-teal-600 hover:text-white text-slate-800 border border-teal-200/80 text-xs font-bold transition-colors cursor-pointer"
              >
                <i className={`${tool.icon} text-[11px]`}></i>
                <span className="max-w-[130px] truncate">{tool.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 카테고리 필터 탭 */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {TOOL_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {apiDelayed && (
          <span className="hidden md:inline text-[11px] text-slate-400 shrink-0">
            인기순 집계 지연 중 · 추천순 표시
          </span>
        )}
      </div>

      {/* 생활도구 2열(모바일 1열) 이원화 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayedTools.map((tool) => {
          const visual = getUtilityVisualMeta(tool.slug, tool.description);
          return (
            <article
              key={tool.slug}
              className={`group rounded-2xl border border-slate-200/85 ${visual.borderHover} bg-white hover:shadow-md transition-all p-3.5 flex items-center gap-3 min-w-0`}
            >
              <Link
                href={`/tools/${tool.slug}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${visual.visualBg} border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-1.5`}
                >
                  <img
                    src={visual.image}
                    alt={tool.name}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                      {visual.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-teal-700 truncate transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {visual.shortDesc}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => handleLaunch(tool)}
                aria-label={`${tool.name} 즉시 실행`}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="fas fa-play text-[9px]"></i>
                <span>실행</span>
              </button>
            </article>
          );
        })}
      </div>

      {/* 하단 전체보기 CTA */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 truncate">
          모든 도구는 회원가입 없이 브라우저에서 무료로 즉시 사용할 수 있습니다.
        </span>
        <Link
          href="/lifestyle"
          className="font-extrabold text-teal-700 hover:text-teal-900 hover:underline shrink-0"
        >
          생활도구 전체보기 →
        </Link>
      </div>
    </section>
  );
};

export default LifestyleToolsShowcase;
