'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
        console.error('Failed to load news:', err);
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

      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-10 text-gray-400">
            <i className="fas fa-circle-notch fa-spin text-xl mr-2"></i>
            뉴스를 불러오는 중입니다...
          </div>
        ) : news.length > 0 ? (
          news.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="block p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                {item.category && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {item.category}
                  </span>
                )}
                {item.source && (
                  <span className="text-[11px] text-slate-400 font-medium">{item.source}</span>
                )}
                <span className="text-[11px] text-slate-400 ml-auto">
                  {item.published_at
                    ? new Date(item.published_at).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                {item.title}
              </h4>
              {(item.summary || item.description) && (
                <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-normal">
                  {item.summary || item.description}
                </p>
              )}
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs">
            등록된 실시간 뉴스가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};
