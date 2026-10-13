'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getCategoryName,
  getCategoryColor,
  getTimeAgo,
  decodeHtmlEntities,
} from '@faithportal/core-utils';

interface NewsItem {
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

export const LiveNewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data && data.success) {
          setNews(data.newsletters || data.news || []);
        }
      })
      .catch((err) => {
        console.error('실시간 뉴스 로드 실패:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
      {/* 섹션 상단 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 text-white shadow-xs">
            <i className="fas fa-newspaper text-lg"></i>
          </div>
          <span>실시간 뉴스 &amp; 팩트 브리핑</span>
          <span className="ml-3 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
            CURATED
          </span>
        </h3>
        <Link
          href="/news"
          className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <span>뉴스 전체보기</span>
          <i className="fas fa-chevron-right text-xs"></i>
        </Link>
      </div>

      {/* 언론사 큐레이션 고지 */}
      <div className="bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5 mb-4 text-xs text-slate-500 flex items-center gap-2">
        <i className="fas fa-shield-alt text-teal-600 text-sm"></i>
        <span>
          공식 언론사 뉴스 피드의 핵심 팩트를 추출하고 실생활 영향 분석을 제공하는 브리핑 데스크입니다.
        </span>
      </div>

      {/* 뉴스 카드 리스트 */}
      <div className="space-y-1">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-circle-notch fa-spin text-xl mr-2"></i>
            뉴스를 불러오는 중입니다...
          </div>
        ) : news.length > 0 ? (
          news.slice(0, 6).map((item) => {
            const timeAgo = getTimeAgo(item.created_at || item.published_at);
            const categories: string[] = String(item.category || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

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

            const isAnalyzed =
              item.title.includes('환율') ||
              item.title.includes('주가') ||
              item.title.includes('증시') ||
              item.title.includes('달러') ||
              item.title.includes('코스피') ||
              item.title.includes('경제');

            const newsHref = `/news/${item.news_id || item.id}`;

            return (
              <Link
                key={item.id}
                href={newsHref}
                className="news-card block border-b border-gray-100 last:border-0 p-3.5 sm:p-4 hover:bg-gray-50/80 rounded-2xl transition-colors group relative cursor-pointer"
              >
                <div className="flex gap-3 sm:gap-4 items-start sm:items-center">
                  {/* 썸네일 */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-[80px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-100">
                    <i className="far fa-newspaper text-gray-300 text-2xl"></i>
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      <span className="text-gray-500 text-[11px] font-bold flex-shrink-0">
                        {timeAgo}
                      </span>
                      {isAnalyzed && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                          <i className="fas fa-chart-line mr-1"></i>분석됨
                        </span>
                      )}
                      {publisher && (
                        <span className="sm:hidden text-[11px] font-bold text-gray-500 truncate max-w-[45%]">
                          · {publisher}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-900 group-hover:text-blue-600 font-bold sm:font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2 sm:line-clamp-1">
                      {displayTitle}
                    </p>

                    {(item.summary || item.description) && (
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2 sm:line-clamp-1 font-normal">
                        {decodeHtmlEntities(item.summary || item.description || '')}
                      </p>
                    )}
                  </div>

                  {/* 언론사 (데스크탑 독립 컬럼) */}
                  <div className="hidden sm:flex w-24 flex-shrink-0 items-center justify-center border-l border-gray-100 pl-3 self-stretch">
                    <span className="text-xs font-bold text-gray-800 text-center break-keep">
                      {publisher || '뉴스'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>등록된 실시간 뉴스가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveNewsSection;
