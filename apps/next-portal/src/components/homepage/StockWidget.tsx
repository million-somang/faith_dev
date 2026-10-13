'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Rate {
  code: string;
  name: string;
  price: number;
  change: number;
  rate: number;
  status: string;
}

interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  rate: number;
  status: string;
}

export const StockWidget: React.FC = () => {
  const [usd, setUsd] = useState<Rate | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [exRes, stRes] = await Promise.all([
          fetch('/api/finance/exchange').then((r) => r.json()).catch(() => []),
          fetch('/api/finance/kr-stocks').then((r) => r.json()).catch(() => []),
        ]);
        if (!active) return;
        const exList = Array.isArray(exRes) ? exRes : exRes?.data || [];
        const stList = Array.isArray(stRes) ? stRes : stRes?.data || [];

        setUsd(exList.find((r: Rate) => r.code === 'USD') || null);
        setStocks(stList.slice(0, 3));

        const d = new Date();
        setUpdatedAt(
          `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(
            2,
            '0'
          )} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        );
      } catch (e) {
        console.error('[Stock] 로드 실패:', e);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error || (!loading && !usd && stocks.length === 0)) return null;

  const color = (status: string) => (status === 'up' ? 'text-red-500' : 'text-blue-500');
  const arrow = (status: string) => (status === 'up' ? 'fa-caret-up' : 'fa-caret-down');
  const firstStock = stocks[0];

  return (
    <>
      {/* 모바일 1/5 크기 초소형 마이크로 위젯 (초슬림 원라인 칩) */}
      {usd && (
        <div className="lg:hidden flex-shrink-0 bg-white border border-slate-200/90 shadow-2xs rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-xs text-gray-800">
          <span className="text-[10px] font-black text-slate-500">USD</span>
          <span className="font-extrabold text-gray-900 text-xs">
            {usd.price.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
          <span className={`text-[10px] font-bold ${color(usd.status)}`}>
            <i className={`fas ${arrow(usd.status)}`}></i>
            {Math.abs(usd.rate).toFixed(1)}%
          </span>
        </div>
      )}
      {firstStock && (
        <div className="lg:hidden flex-shrink-0 bg-white border border-slate-200/90 shadow-2xs rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-xs text-gray-800">
          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[50px]">{firstStock.name}</span>
          <span className="font-extrabold text-gray-900 text-xs">{firstStock.price.toLocaleString()}</span>
          <span className={`text-[10px] font-bold ${color(firstStock.status)}`}>
            <i className={`fas ${arrow(firstStock.status)}`}></i>
            {Math.abs(firstStock.rate).toFixed(1)}%
          </span>
        </div>
      )}

      {/* PC 카드 (데스크탑: 슬림하고 정돈된 카드) */}
      <div className="hidden lg:block bg-white border border-slate-200/90 shadow-sm rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
            <i className="fas fa-chart-line text-green-500"></i> 증시
          </h3>
          {updatedAt && <span className="text-xs text-gray-400">{updatedAt}</span>}
        </div>

        {loading ? (
          <div className="py-6 flex items-center justify-center text-gray-300">
            <i className="fas fa-circle-notch fa-spin text-xl"></i>
          </div>
        ) : (
          <>
            {usd && (
              <div className="pb-4 mb-3 border-b border-gray-100">
                <div className="text-xs font-bold text-gray-400 mb-1">환율 USD</div>
                <div className="text-2xl font-black text-gray-900 leading-none">
                  {usd.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-sm font-bold text-gray-400 ml-1">원</span>
                </div>
                <div className={`text-sm font-bold mt-1 ${color(usd.status)}`}>
                  <i className={`fas ${arrow(usd.status)} mr-0.5`}></i>
                  {Math.abs(usd.change).toFixed(2)} ({usd.rate > 0 ? '+' : ''}
                  {usd.rate.toFixed(2)}%)
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {stocks.map((s) => (
                <div key={s.ticker} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 truncate max-w-[45%]">
                    {s.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`font-bold ${color(s.status)}`}>
                      <i className={`fas ${arrow(s.status)} mr-0.5`}></i>
                      {Math.abs(s.rate).toFixed(2)}%
                    </span>
                    <span className="font-bold text-gray-900 tabular-nums">
                      {s.price.toLocaleString()}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/finance"
              className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-sm font-semibold text-gray-500 hover:text-green-600 transition-colors"
            >
              <span>인기종목 더보기</span>
              <i className="fas fa-chevron-right text-xs"></i>
            </Link>
          </>
        )}
      </div>
    </>
  );
};
