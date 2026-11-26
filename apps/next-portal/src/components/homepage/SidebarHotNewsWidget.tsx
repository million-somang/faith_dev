'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  decodeHtmlEntities,
  getCategoryName,
} from '@faithportal/core-utils';

export interface HotNewsItem {
  id: number;
  title: string;
  category?: string;
  source?: string;
  published_at?: string;
  created_at?: string;
  view_count?: number;
  popularity_score?: number;
  thumbnail?: string;
}

interface SidebarHotNewsWidgetProps {
  initialHotNews?: HotNewsItem[];
}

function cleanTitleAndSource(item: HotNewsItem): { title: string; publisher: string } {
  const raw = decodeHtmlEntities(String(item.title || ''));
  let title = raw;
  let publisher = '';
  const sepIdx = raw.lastIndexOf(' - ');
  if (sepIdx > 0 && raw.length - sepIdx - 3 <= 25) {
    publisher = raw.slice(sepIdx + 3).trim();
    title = raw.slice(0, sepIdx).trim();
  }
  if (!publisher && item.source && !/구글\s?뉴스/.test(item.source)) {
    publisher = decodeHtmlEntities(item.source);
  }
  return { title, publisher };
}

export const SidebarHotNewsWidget: React.FC<SidebarHotNewsWidgetProps> = ({
  initialHotNews,
}) => {
  const hasInitial = Array.isArray(initialHotNews) && initialHotNews.length > 0;
  const [items, setItems] = useState<HotNewsItem[]>(hasInitial ? initialHotNews.slice(0, 5) : []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState(false);

  const fetchHot = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/news/hot?limit=6');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.news)) {
        setItems(data.news.slice(0, 5));
      } else {
        setItems([]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasInitial) return;
    fetchHot();
  }, [hasInitial, fetchHot]);

  return (
    <section
      aria-label="실시간 HOT 뉴스 TOP 5"
      className="bg-white border border-slate-200/90 shadow-sm rounded-3xl p-5"
    >
      <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-100">
        <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
          <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs">
            <i className="fas fa-fire"></i>
          </span>
          <span>실시간 HOT 뉴스</span>
        </h2>
        <Link
          href="/news"
          className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          더보기 →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-10 rounded-xl bg-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="py-5 text-center">
          <p className="text-xs text-slate-500 mb-2.5">인기 뉴스를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={fetchHot}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          집계된 인기 뉴스가 아직 없습니다.
        </div>
      ) : (
        <ol className="space-y-2.5">
          {items.map((item, idx) => {
            const rank = idx + 1;
            const { title, publisher } = cleanTitleAndSource(item);
            const firstCat = String(item.category || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)[0];

            return (
              <li key={item.id}>
                <Link
                  href={`/news/${item.id}`}
                  className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                      rank <= 3
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-blue-600 line-clamp-2 leading-snug transition-colors">
                      {title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
                      {firstCat && (
                        <span className="text-slate-500 font-semibold">
                          {getCategoryName(firstCat)}
                        </span>
                      )}
                      {publisher && (
                        <span className="truncate max-w-[120px]">· {publisher}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default SidebarHotNewsWidget;
