'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { decodeHtmlEntities } from '@faithportal/core-utils';
import { TOOLS_DATA, ToolDetailItem } from '@/data/toolsData';
import { GAMES_DATA, GameItem } from '@/data/gamesData';
import { GUIDES_DATA } from '@/data/guidesData';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import { recordAppUsage } from '@/hooks/useFrequentApps';

interface SearchNewsItem {
  id: number;
  news_id?: number;
  title: string;
  category?: string;
  source?: string;
}

interface ShortcutItem {
  label: string;
  href: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

const PORTAL_SHORTCUTS: ShortcutItem[] = [
  {
    label: '뉴스',
    href: '/news',
    icon: 'fa-newspaper',
    iconBg: 'bg-blue-50 border-blue-100 group-hover:bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'LIVE',
  },
  {
    label: '생활도구',
    href: '/lifestyle',
    icon: 'fa-toolbox',
    iconBg: 'bg-teal-50 border-teal-100 group-hover:bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    label: '무료게임',
    href: '/game',
    icon: 'fa-gamepad',
    iconBg: 'bg-indigo-50 border-indigo-100 group-hover:bg-indigo-100',
    iconColor: 'text-indigo-600',
    badge: '11+',
  },
  {
    label: '금융·증시',
    href: '/finance',
    icon: 'fa-chart-line',
    iconBg: 'bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: '정통사주',
    href: '/entertainment/saju',
    icon: 'fa-yin-yang',
    iconBg: 'bg-violet-50 border-violet-100 group-hover:bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    label: '여행정보',
    href: '/entertainment/travel',
    icon: 'fa-plane-departure',
    iconBg: 'bg-sky-50 border-sky-100 group-hover:bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    label: '웹소설',
    href: '/entertainment/novel',
    icon: 'fa-book-open',
    iconBg: 'bg-rose-50 border-rose-100 group-hover:bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    label: '라운지',
    href: '/lounge',
    icon: 'fa-comments',
    iconBg: 'bg-fuchsia-50 border-fuchsia-100 group-hover:bg-fuchsia-100',
    iconColor: 'text-fuchsia-600',
  },
];

const QUICK_SEARCH_CHIPS = ['퇴직금', '평수', '스도쿠', '베라장기', '배당주'];
const ALL_GAMES: GameItem[] = Object.values(GAMES_DATA);

export const HomePortalTopBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [newsResults, setNewsResults] = useState<SearchNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { launchApp } = useAppLauncher();

  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();

  const matchedTools = useMemo(() => {
    if (!normalized) return [];
    return TOOLS_DATA.filter(
      (t) =>
        t.name.toLowerCase().includes(normalized) ||
        t.categoryLabel.toLowerCase().includes(normalized) ||
        t.description.toLowerCase().includes(normalized) ||
        t.keywords.some((kw) => kw.toLowerCase().includes(normalized))
    ).slice(0, 4);
  }, [normalized]);

  const matchedGames = useMemo(() => {
    if (!normalized) return [];
    return ALL_GAMES.filter(
      (g) =>
        g.name.toLowerCase().includes(normalized) ||
        g.categoryLabel.toLowerCase().includes(normalized) ||
        g.summary.toLowerCase().includes(normalized) ||
        g.keywords.some((kw) => kw.toLowerCase().includes(normalized))
    ).slice(0, 4);
  }, [normalized]);

  const matchedGuides = useMemo(() => {
    if (!normalized) return [];
    return GUIDES_DATA.filter(
      (g) =>
        g.title.toLowerCase().includes(normalized) ||
        g.categoryLabel.toLowerCase().includes(normalized) ||
        g.description.toLowerCase().includes(normalized) ||
        g.tags.some((tag) => tag.toLowerCase().includes(normalized))
    ).slice(0, 4);
  }, [normalized]);

  useEffect(() => {
    if (!trimmed || trimmed.length < 2) {
      setNewsResults([]);
      setNewsLoading(false);
      return;
    }

    const controller = new AbortController();
    setNewsLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/news/search?q=${encodeURIComponent(trimmed)}&limit=4`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.news)) {
            setNewsResults(data.news.slice(0, 4));
          } else {
            setNewsResults([]);
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setNewsResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setNewsLoading(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    setIsOpen(false);
    router.push(`/guides?q=${encodeURIComponent(trimmed)}`);
  };

  const handleLaunchTool = (tool: ToolDetailItem) => {
    recordAppUsage(tool.slug);
    setIsOpen(false);
    if (tool.appUrl.startsWith('/app/')) {
      launchApp(tool.appUrl, tool.slug);
    } else {
      router.push(tool.appUrl);
    }
  };

  const handleLaunchGame = (game: GameItem) => {
    recordAppUsage(game.slug);
    setIsOpen(false);
    launchApp(game.legacyAppUrl, game.slug);
  };

  const hasAnyResult =
    matchedTools.length > 0 ||
    matchedGames.length > 0 ||
    matchedGuides.length > 0 ||
    newsResults.length > 0;

  return (
    <section
      ref={wrapperRef}
      aria-label="VERA 통합 포털 검색 및 주요 서비스 바로가기"
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm px-4 sm:px-6 py-4 sm:py-5 mb-4 sm:mb-5 relative"
    >
      {/* 상단 단일 H1 헤드라인 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-xs font-extrabold shrink-0">
            VERA PORTAL
          </span>
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
            VERA — 실시간 뉴스 · 스마트 생활도구 · 무료 미니게임 포털
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium mr-1">추천 검색</span>
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setQuery(chip);
                setIsOpen(true);
              }}
              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 네이버 스타일 슬림 통합 검색바 */}
      <div className="relative max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-white border-2 border-emerald-500 rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs focus-within:ring-4 focus-within:ring-emerald-500/15 transition-all"
        >
          <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center mr-2.5 shrink-0">
            V
          </span>
          <input
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="뉴스, 생활도구(퇴직금·평수), 게임(스도쿠·장기), 지식 가이드 통합 검색..."
            aria-label="VERA 통합 검색"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm sm:text-[15px] text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setNewsResults([]);
              }}
              aria-label="검색어 지우기"
              className="text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
            >
              <i className="fas fa-times-circle text-sm"></i>
            </button>
          )}
          <button
            type="submit"
            aria-label="통합 검색 실행"
            className="ml-1 px-3.5 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-search text-xs"></i>
            <span className="hidden sm:inline">검색</span>
          </button>
        </form>

        {/* 실시간 통합 검색 드롭다운 */}
        {isOpen && trimmed.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
            {!hasAnyResult && !newsLoading ? (
              <div className="p-6 text-center">
                <p className="text-sm font-bold text-slate-700 mb-1">
                  &ldquo;{trimmed}&rdquo;에 대한 바로가기 결과가 없습니다.
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Enter 키를 누르시면 25편 지식 가이드 전체 아카이브에서 검색합니다.
                </p>
                <Link
                  href={`/guides?q=${encodeURIComponent(trimmed)}`}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  <span>지식 가이드에서 검색하기</span>
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {matchedTools.length > 0 && (
                  <div className="p-3 sm:p-4">
                    <div className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <i className="fas fa-toolbox"></i>
                      <span>스마트 생활도구</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedTools.map((tool) => (
                        <div
                          key={tool.slug}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <Link
                            href={`/tools/${tool.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 min-w-0 flex-1"
                          >
                            <span
                              className={`w-8 h-8 rounded-lg ${tool.iconBg} ${tool.iconColor} flex items-center justify-center shrink-0 text-xs`}
                            >
                              <i className={tool.icon}></i>
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {tool.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {tool.categoryLabel} · 상세 안내 및 계산식 보기
                              </p>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleLaunchTool(tool)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            실행
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchedGames.length > 0 && (
                  <div className="p-3 sm:p-4">
                    <div className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <i className="fas fa-gamepad"></i>
                      <span>무설치 미니게임</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedGames.map((game) => (
                        <div
                          key={game.slug}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <Link
                            href={`/game/${game.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 min-w-0 flex-1"
                          >
                            <span
                              className={`w-8 h-8 rounded-lg ${game.iconBg} ${game.iconColor} flex items-center justify-center shrink-0 text-xs`}
                            >
                              <i className={game.icon}></i>
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {game.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {game.categoryLabel} · 공략 및 랭킹 보기
                              </p>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleLaunchGame(game)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            플레이
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(newsLoading || newsResults.length > 0) && (
                  <div className="p-3 sm:p-4">
                    <div className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wide mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-newspaper"></i>
                        <span>실시간 뉴스 검색</span>
                      </span>
                      {newsLoading && (
                        <span className="text-[10px] font-medium text-slate-400">조회 중...</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {newsResults.map((item) => (
                        <Link
                          key={item.id}
                          href={`/news/${item.news_id || item.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                            {decodeHtmlEntities(item.title)}
                          </span>
                          {item.source && (
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {decodeHtmlEntities(item.source)}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {matchedGuides.length > 0 && (
                  <div className="p-3 sm:p-4">
                    <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <i className="fas fa-book-open"></i>
                      <span>지식 가이드</span>
                    </div>
                    <div className="space-y-1">
                      {matchedGuides.map((guide) => (
                        <Link
                          key={guide.slug}
                          href={`/guides/${guide.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                            {guide.title}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-bold shrink-0">
                            {guide.categoryLabel}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 네이버형 1줄 퀵 바로가기 아이콘 바 */}
      <nav
        aria-label="주요 서비스 바로가기"
        className="mt-4 flex lg:grid lg:grid-cols-8 gap-2 overflow-x-auto lg:overflow-visible snap-x hide-scrollbar pb-0.5"
      >
        {PORTAL_SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group shrink-0 w-[72px] lg:w-auto snap-start flex flex-col items-center gap-1.5 py-1.5 px-1 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            <div className="relative">
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-colors shadow-2xs ${item.iconBg}`}
              >
                <i className={`fas ${item.icon} ${item.iconColor} text-base`}></i>
              </div>
              {item.badge && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[9px] font-black leading-tight shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-slate-950 whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
};

export default HomePortalTopBar;
