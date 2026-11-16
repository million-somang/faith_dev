'use client';

import React from 'react';
import Link from 'next/link';
import SparklineChart from './SparklineChart';

export interface StockCard {
    ticker: string;
    name: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    currency: string;
    sparkline: number[];
}

interface StockListCardProps {
    stock: StockCard;
    isFavorite: boolean;
    onToggleFavorite: (ticker: string, meta?: { name?: string }) => void;
    index?: number;
    baseDelay?: number;
}

export default function StockListCard({
    stock,
    isFavorite,
    onToggleFavorite,
}: StockListCardProps) {
    return (
        <div className="animate-fade-in relative bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    onToggleFavorite(stock.ticker, { name: stock.name });
                }}
                aria-label={isFavorite ? '관심종목 해제' : '관심종목 추가'}
                className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                    isFavorite
                        ? 'text-yellow-400 bg-yellow-50/80 hover:bg-yellow-100'
                        : 'text-slate-300 hover:text-yellow-400 hover:bg-slate-50'
                }`}
            >
                <i className={`${isFavorite ? 'fas' : 'far'} fa-star text-xs sm:text-sm`}></i>
            </button>

            <Link href={`/finance/stock/${encodeURIComponent(stock.ticker)}`} className="block">
                <div className="mb-1.5 pr-7">
                    <div
                        className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate"
                        title={stock.name}
                    >
                        {stock.name}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-600">
                            {stock.ticker}
                        </span>
                    </div>
                </div>

                <div className="font-mono text-lg sm:text-2xl font-black text-slate-900 mt-1 whitespace-nowrap">
                    {stock.currency}
                    {stock.price.toLocaleString('ko-KR')}
                </div>

                <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <span
                        className={`inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap font-mono ${
                            stock.status === 'up'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-blue-50 text-blue-600'
                        }`}
                    >
                        <span>{stock.status === 'up' ? '▲' : '▼'}</span>
                        <span>{Math.abs(stock.change).toLocaleString('ko-KR')}</span>
                        <span>
                            ({stock.rate >= 0 ? '+' : ''}
                            {stock.rate.toFixed(2)}%)
                        </span>
                    </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 w-full overflow-hidden">
                    <SparklineChart
                        data={stock.sparkline}
                        status={stock.status}
                        height={32}
                        className="w-full"
                    />
                </div>
            </Link>
        </div>
    );
}
