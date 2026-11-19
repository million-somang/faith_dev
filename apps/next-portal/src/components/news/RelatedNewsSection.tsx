'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { decodeHtmlEntities, getCategoryColor, getCategoryName } from '@faithportal/core-utils';

export interface RelatedNewsItem {
    id: number;
    title: string;
    category?: string;
    publisher?: string;
    source?: string;
    thumbnail?: string;
    image_url?: string;
    published_at?: string;
    pubDate?: string;
    created_at?: string;
    view_count?: number;
}

interface RelatedNewsSectionProps {
    items: RelatedNewsItem[];
    categoryName: string;
}

function splitNewsTitle(raw: string, fallbackPublisher?: string): { title: string; publisher: string } {
    const cleaned = decodeHtmlEntities(raw || '').replace(/\s+/g, ' ').trim();
    const sepIdx = cleaned.lastIndexOf(' - ');
    if (sepIdx > 0 && cleaned.length - sepIdx - 3 <= 25) {
        return {
            title: cleaned.slice(0, sepIdx).trim(),
            publisher: fallbackPublisher || cleaned.slice(sepIdx + 3).trim(),
        };
    }
    return {
        title: cleaned,
        publisher: fallbackPublisher || 'VERA 뉴스',
    };
}

function formatKstShortDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Seoul',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(d);
        const get = (type: Intl.DateTimeFormatPartTypes) =>
            parts.find((p) => p.type === type)?.value || '';
        const rawHour = get('hour');
        const hour = rawHour === '24' ? '00' : rawHour;
        return `${get('month')}.${get('day')} ${hour}:${get('minute')}`;
    } catch {
        return '';
    }
}

function RelatedNewsCard({ item }: { item: RelatedNewsItem }) {
    const [imgError, setImgError] = useState(false);
    const { title, publisher } = splitNewsTitle(item.title, item.publisher || item.source);
    const rawThumb = (item.thumbnail || item.image_url || '').trim();
    const safeThumb = rawThumb ? rawThumb.replace(/^http:\/\//i, 'https://') : '';
    const primaryCat = (item.category || 'general').split(',')[0].trim() || 'general';
    const catName = getCategoryName(primaryCat);
    const catColor = getCategoryColor(primaryCat);
    const dateLabel = formatKstShortDate(item.published_at || item.pubDate || item.created_at);

    return (
        <Link
            href={`/news/${item.id}`}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-300 transition-all group shadow-2xs hover:shadow-xs"
        >
            <div className="w-20 h-20 sm:w-24 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70 shrink-0 flex items-center justify-center">
                {safeThumb && !imgError ? (
                    <img
                        src={safeThumb}
                        alt={title}
                        loading="lazy"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                        <i className="far fa-newspaper text-xl"></i>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[80px]">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${catColor}`}>
                            {catName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 truncate">
                            {publisher}
                        </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug break-keep">
                        {title}
                    </h3>
                </div>

                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-1.5 font-medium">
                    {dateLabel && (
                        <span className="flex items-center gap-1">
                            <i className="far fa-clock text-[10px]"></i>
                            <span>{dateLabel}</span>
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <i className="far fa-eye text-[10px]"></i>
                        <span>조회 {(item.view_count || 0).toLocaleString()}</span>
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function RelatedNewsSection({ items, categoryName }: RelatedNewsSectionProps) {
    const visibleItems = items.slice(0, 4);

    return (
        <section
            aria-label="비슷한 유형의 추천 뉴스"
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 mb-6"
        >
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-sm shrink-0">
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                            비슷한 유형의 뉴스 더보기
                        </h2>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                            {categoryName}
                        </span>
                    </div>
                </div>

                <Link
                    href="/news"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors shrink-0 group"
                >
                    <span>뉴스 전체보기</span>
                    <i className="fas fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                </Link>
            </div>

            {visibleItems.length === 0 ? (
                <div className="py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <div className="text-slate-400 text-lg">
                        <i className="far fa-newspaper"></i>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-500">
                        아직 비슷한 유형의 추천 뉴스가 없습니다.
                    </p>
                    <Link
                        href="/news"
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700"
                    >
                        <span>최신 전체 뉴스 보러가기</span>
                        <i className="fas fa-arrow-right text-[10px]"></i>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {visibleItems.map((item) => (
                        <RelatedNewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </section>
    );
}

export default RelatedNewsSection;
