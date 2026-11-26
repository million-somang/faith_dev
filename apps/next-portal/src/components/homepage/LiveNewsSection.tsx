'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getCategoryName,
  getCategoryColor,
  getTimeAgo,
  decodeHtmlEntities,
} from '@faithportal/core-utils';

export interface HomeNewsItem {
  id: number;
  news_id?: number;
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  published_at?: string;
  created_at?: string;
  tags?: string;
  source?: string;
  thumbnail?: string;
  relatedStocks?: { name: string }[];
}

interface LiveNewsSectionProps {
  initialNews?: HomeNewsItem[];
}

type NewsTabKey = 'all' | 'economy' | 'tech' | 'society' | 'politics' | 'world' | 'sports';

const NEWS_TABS: { key: NewsTabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'economy', label: '경제' },
  { key: 'tech', label: 'IT·과학' },
  { key: 'society', label: '사회' },
  { key: 'politics', label: '정치' },
  { key: 'world', label: '세계' },
  { key: 'sports', label: '스포츠' },
];

function formatStaticDateLabel(dateStr?: string): string {
  if (!dateStr) return '최신';
  const match = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[2]}.${match[3]}`;
  }
  return '최신';
}

function toHttpsUrl(url?: string): string {
  if (!url) return '';
  return String(url).trim().replace(/^http:\/\//i, 'https://');
}

function parseHeadlineAndPublisher(item: HomeNewsItem): {
  displayTitle: string;
  publisher: string;
} {
  const rawTitle = decodeHtmlEntities(String(item.title || ''));
  let displayTitle = rawTitle;
  let publisher = '';
  const sepIdx = rawTitle.lastIndexOf(' - ');
  if (sepIdx > 0 && rawTitle.length - sepIdx - 3 <= 25) {
    publisher = rawTitle.slice(sepIdx + 3).trim();
    displayTitle = rawTitle.slice(0, sepIdx).trim();
  }
  if (!publisher && item.source && !/구글\s?뉴스/.test(item.source)) {
    publisher = decodeHtmlEntities(item.source);
  }
  return { displayTitle, publisher };
}

async function fetchNewsWithRetry(tab: NewsTabKey, limit: number): Promise<HomeNewsItem[]> {
  const query = tab === 'all' ? `/api/news?limit=${limit}` : `/api/news?category=${tab}&limit=${limit}`;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.success) {
        const list: HomeNewsItem[] = (data.newsletters || data.news || []).map((item: HomeNewsItem) => ({
          ...item,
          thumbnail: item.thumbnail ? toHttpsUrl(item.thumbnail) : item.thumbnail,
        }));
        return list;
      }
      throw new Error('Invalid news payload');
    } catch (err) {
      lastErr = err;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }
  throw lastErr;
}

export const LiveNewsSection: React.FC<LiveNewsSectionProps> = ({ initialNews }) => {
  const hasInitial = Array.isArray(initialNews) && initialNews.length > 0;
  const [activeTab, setActiveTab] = useState<NewsTabKey>('all');
  const [news, setNews] = useState<HomeNewsItem[]>(hasInitial ? initialNews.slice(0, 7) : []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [failedThumbs, setFailedThumbs] = useState<Record<number, boolean>>({});
  const tabCacheRef = useRef<Partial<Record<NewsTabKey, HomeNewsItem[]>>>(
    hasInitial ? { all: initialNews.slice(0, 7) } : {}
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadTabNews = useCallback(async (tab: NewsTabKey, force = false) => {
    if (!force && tabCacheRef.current[tab]) {
      setNews(tabCacheRef.current[tab] ?? []);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const items = await fetchNewsWithRetry(tab, 7);
      tabCacheRef.current[tab] = items;
      setNews(items);
    } catch (err) {
      console.error('실시간 뉴스 로드 실패:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasInitial) return;
    loadTabNews('all', true);
  }, [hasInitial, loadTabNews]);

  const handleSelectTab = (tab: NewsTabKey) => {
    setActiveTab(tab);
    loadTabNews(tab);
  };

  const markThumbFailed = (id: number) => {
    setFailedThumbs((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  const featured = news[0];
  const restNews = news.slice(1, 7);

  return (
    <section
      aria-label="실시간 뉴스 브리핑 데스크"
      className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm"
    >
      {/* 섹션 상단 헤더 */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <i className="fas fa-newspaper text-base sm:text-lg"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                실시간 뉴스 데스크
              </h2>
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-extrabold">
                CURATED
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              공식 언론사 피드 핵심 팩트 요약 · 분야별 실시간 브리핑
            </p>
          </div>
        </div>
        <Link
          href={activeTab === 'all' ? '/news' : `/news?category=${activeTab}`}
          className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors shrink-0"
        >
          <span>전체보기</span>
          <i className="fas fa-chevron-right text-[10px]"></i>
        </Link>
      </div>

      {/* 네이버 뉴스스탠드 감각의 카테고리 탭 */}
      <div
        role="tablist"
        aria-label="뉴스 카테고리"
        className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-3 mb-4 border-b border-slate-100"
      >
        {NEWS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 뉴스 본문 영역 */}
      {loading ? (
        <div className="space-y-3 py-2" aria-busy="true">
          <div className="h-36 rounded-2xl bg-slate-100 animate-pulse"></div>
          <div className="h-16 rounded-2xl bg-slate-100 animate-pulse"></div>
          <div className="h-16 rounded-2xl bg-slate-100 animate-pulse"></div>
          <div className="h-16 rounded-2xl bg-slate-100 animate-pulse"></div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center">
          <i className="fas fa-wifi text-slate-300 text-2xl mb-2"></i>
          <p className="text-sm font-bold text-slate-700 mb-1">
            뉴스를 불러오는 중 일시적인 지연이 발생했습니다.
          </p>
          <p className="text-xs text-slate-500 mb-4">잠시 후 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={() => loadTabNews(activeTab, true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <i className="fas fa-rotate-right mr-1.5"></i>다시 불러오기
          </button>
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-8 text-center">
          <i className="far fa-newspaper text-slate-300 text-2xl mb-2"></i>
          <p className="text-sm font-bold text-slate-700">
            해당 카테고리에 등록된 최신 뉴스가 없습니다.
          </p>
        </div>
      ) : (
        <div>
          {/* 1. 메인 헤드라인 피처드 카드 */}
          {featured && (() => {
            const rawDate = featured.created_at || featured.published_at;
            const timeAgo = mounted ? getTimeAgo(rawDate) : formatStaticDateLabel(rawDate);
            const safeThumbnail = toHttpsUrl(featured.thumbnail);
            const categories = String(featured.category || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            const { displayTitle, publisher } = parseHeadlineAndPublisher(featured);
            const summaryText = decodeHtmlEntities(featured.summary || featured.description || '');
            const showThumb = Boolean(safeThumbnail) && !failedThumbs[featured.id];

            return (
              <Link
                href={`/news/${featured.news_id || featured.id}`}
                className="group block rounded-2xl bg-slate-50/90 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 p-3.5 sm:p-4 mb-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-stretch">
                  <div className="relative w-full h-44 sm:w-52 sm:h-36 rounded-xl overflow-hidden bg-slate-200/70 flex items-center justify-center shrink-0 border border-slate-200/70">
                    <i className="far fa-newspaper text-slate-400 text-3xl"></i>
                    {showThumb && (
                      <img
                        src={safeThumbnail}
                        alt={displayTitle || '주요 뉴스 썸네일'}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => markThumbFailed(featured.id)}
                      />
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/85 text-white text-[10px] font-black tracking-wide">
                      HEADLINE
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryColor(
                              cat
                            )}`}
                          >
                            {getCategoryName(cat)}
                          </span>
                        ))}
                        <span
                          suppressHydrationWarning
                          className="text-slate-500 text-[11px] font-bold"
                        >
                          {timeAgo}
                        </span>
                        {publisher && (
                          <span className="text-[11px] font-bold text-slate-600 truncate max-w-[140px]">
                            · {publisher}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-700 leading-snug line-clamp-2 mb-1.5 transition-colors">
                        {displayTitle}
                      </h3>

                      {summaryText && (
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {summaryText}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-blue-600 font-bold">
                      <span>팩트 브리핑 읽기</span>
                      <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })()}

          {/* 2. 하단 컴팩트 뉴스 리스트 */}
          <div className="divide-y divide-slate-100">
            {restNews.map((item) => {
              const rawDate = item.created_at || item.published_at;
              const timeAgo = mounted ? getTimeAgo(rawDate) : formatStaticDateLabel(rawDate);
              const safeThumbnail = toHttpsUrl(item.thumbnail);
              const categories = String(item.category || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              const { displayTitle, publisher } = parseHeadlineAndPublisher(item);
              const summaryText = decodeHtmlEntities(item.summary || item.description || '');
              const showThumb = Boolean(safeThumbnail) && !failedThumbs[item.id];

              return (
                <Link
                  key={item.id}
                  href={`/news/${item.news_id || item.id}`}
                  className="block py-3 sm:py-3.5 px-2 hover:bg-slate-50/90 rounded-2xl transition-colors group"
                >
                  <div className="flex gap-3 sm:gap-4 items-center">
                    <div className="relative w-20 h-16 sm:w-24 sm:h-[68px] flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100">
                      <i className="far fa-newspaper text-slate-300 text-xl"></i>
                      {showThumb && (
                        <img
                          src={safeThumbnail}
                          alt={displayTitle || '뉴스 썸네일'}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => markThumbFailed(item.id)}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {categories.slice(0, 1).map((cat) => (
                          <span
                            key={cat}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(
                              cat
                            )}`}
                          >
                            {getCategoryName(cat)}
                          </span>
                        ))}
                        <span
                          suppressHydrationWarning
                          className="text-slate-500 text-[11px] font-semibold shrink-0"
                        >
                          {timeAgo}
                        </span>
                        {publisher && (
                          <span className="sm:hidden text-[11px] font-semibold text-slate-500 truncate max-w-[110px]">
                            · {publisher}
                          </span>
                        )}
                      </div>

                      <h3 className="text-slate-900 group-hover:text-blue-600 font-bold text-sm sm:text-[15px] leading-snug line-clamp-2 sm:line-clamp-1">
                        {displayTitle}
                      </h3>

                      {summaryText && (
                        <p className="hidden sm:block text-slate-500 text-xs mt-0.5 line-clamp-1">
                          {summaryText}
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:flex w-24 flex-shrink-0 items-center justify-center border-l border-slate-100 pl-3 self-stretch">
                      <span className="text-xs font-bold text-slate-700 text-center break-keep">
                        {publisher || '뉴스'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default LiveNewsSection;
