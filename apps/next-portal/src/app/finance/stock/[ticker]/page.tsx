'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@faithportal/ui';
import FinanceSubMenu from '@/components/finance/FinanceSubMenu';
import ProfitCalculator from '@/components/finance/ProfitCalculator';
import { BannerSlot } from '@/components/BannerSlot';
import { useFavorites } from '@/hooks/useFavorites';

type Tab = 'summary' | 'financial' | 'news';
type ChartRange = '1d' | '1w' | '1mo' | '3mo' | '1y' | '3y';

interface StockDetailData {
    ticker: string;
    symbol: string;
    name: string;
    englishName: string;
    market: 'KRX' | 'NASDAQ' | 'NYSE';
    sector: string;
    currency: string;
    price: number;
    previousClose: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    open: number;
    high: number;
    low: number;
    volume: string;
    tradingValue: string;
    high52: number;
    low52: number;
    rangePercent: number;
    marketCap: string;
    marketCapRank: string;
    sharesCount: string;
    foreignRate: string;
    per: number;
    pbr: number;
    eps: number;
    bps: number;
    roe: number;
    dividendYield: number;
    dividendPerShare: number;
    summary: string;
    products: string;
    ceo: string;
    establishedYear: string;
    headquarters: string;
    rivals: {
        ticker: string;
        name: string;
        price: number;
        rate: number;
        marketCap: string;
        per: number;
    }[];
    financials: {
        annual: {
            year: string;
            revenue: string;
            opIncome: string;
            netIncome: string;
            opMargin: string;
            roe: string;
        }[];
        quarterly: {
            quarter: string;
            revenue: string;
            opIncome: string;
            netIncome: string;
            opMargin: string;
        }[];
    };
}

interface NewsItem {
    id: number;
    title: string;
    summary: string;
    source: string;
    time: string;
    link: string;
}

interface ChartPoint {
    date: string;
    price: number;
}

const CHART_RANGES: { key: ChartRange; label: string }[] = [
    { key: '1d', label: '1일' },
    { key: '1w', label: '1주일' },
    { key: '1mo', label: '1개월' },
    { key: '3mo', label: '3개월' },
    { key: '1y', label: '1년' },
    { key: '3y', label: '3년' },
];

export default function StockDetailPage() {
    const params = useParams<{ ticker: string }>();
    const ticker = typeof params?.ticker === 'string' ? decodeURIComponent(params.ticker) : '';
    const { isFavorite, toggle } = useFavorites();

    const [activeTab, setActiveTab] = useState<Tab>('summary');
    const [selectedRange, setSelectedRange] = useState<ChartRange>('1mo');
    const [showCalculator, setShowCalculator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);

    const [stock, setStock] = useState<StockDetailData | null>(null);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [ticker]);

    useEffect(() => {
        if (!ticker) return;
        let cancelled = false;
        const loadDetail = (initial = false) => {
            if (initial) setLoading(true);
            fetch(`/api/finance/stock-detail/${encodeURIComponent(ticker)}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    if (!cancelled && data) setStock(data);
                })
                .catch(() => {})
                .finally(() => {
                    if (!cancelled && initial) setLoading(false);
                });
        };
        loadDetail(true);
        const timer = setInterval(() => loadDetail(false), 30 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [ticker]);

    useEffect(() => {
        if (!ticker) return;
        setChartLoading(true);
        fetch(`/api/finance/chart/${encodeURIComponent(ticker)}?range=${selectedRange}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => {
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    setChartData(res.data);
                } else {
                    setChartData([]);
                }
            })
            .catch(() => {
                setChartData([]);
            })
            .finally(() => setChartLoading(false));
    }, [ticker, selectedRange]);

    useEffect(() => {
        if (!ticker) return;
        fetch(`/api/finance/stock-news/${encodeURIComponent(ticker)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setNews(Array.isArray(data) ? data : []))
            .catch(() => setNews([]));
    }, [ticker]);

    const isFav = ticker ? isFavorite(ticker) : false;

    const chartStats = (() => {
        if (chartData.length === 0) return null;
        const prices = chartData.map((d) => d.price);
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        return { high, low, avg: Math.round(avg * 100) / 100 };
    })();

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'summary', label: '종합 정보', icon: '📑' },
        { key: 'financial', label: '기업 재무 분석', icon: '📊' },
        { key: 'news', label: '관련 뉴스', icon: '📰' },
    ];

    const renderSvgPriceChart = () => {
        if (chartData.length < 2) {
            return (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs sm:text-sm">
                    {chartLoading
                        ? '차트 데이터를 불러오는 중입니다…'
                        : '선택한 기간의 시세 차트 데이터가 없습니다.'}
                </div>
            );
        }

        const prices = chartData.map((d) => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const span = max - min || 1;
        const w = 800;
        const h = 280;
        const padX = 24;
        const padY = 24;
        const innerW = w - padX * 2;
        const innerH = h - padY * 2;

        const pts = chartData.map((d, i) => {
            const x = padX + (i / (chartData.length - 1)) * innerW;
            const y = padY + innerH - ((d.price - min) / span) * innerH;
            return { x, y, date: d.date, price: d.price };
        });

        const polylinePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const areaPath = `M${pts[0].x.toFixed(1)},${padY + innerH} L${pts
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' L')} L${pts[pts.length - 1].x.toFixed(1)},${padY + innerH} Z`;

        const isUp = stock?.status !== 'down';
        const strokeColor = isUp ? '#dc2626' : '#2563eb';
        const fillColor = isUp ? 'rgba(220, 38, 38, 0.10)' : 'rgba(37, 99, 235, 0.10)';

        return (
            <svg
                viewBox={`0 0 ${w} ${h}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                <path d={areaPath} fill={fillColor} />
                <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <FinanceSubMenu />

            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 w-full">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-blue-600 transition-colors">
                            홈
                        </Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link href="/finance" className="hover:text-blue-600 transition-colors">
                            금융
                        </Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link
                            href="/finance/stocks"
                            className="hover:text-blue-600 transition-colors"
                        >
                            종목
                        </Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-bold">{stock?.name || ticker}</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full">
                {/* 종목 시세 헤더 */}
                <div
                    className={`bg-white rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm mb-6 ${
                        loading ? 'animate-pulse' : ''
                    }`}
                >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h1
                                    className="text-xl sm:text-3xl font-black text-gray-900 truncate"
                                    title={stock?.name || ticker}
                                >
                                    {stock?.name || ticker}
                                </h1>
                                <span
                                    className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg font-mono shrink-0 ${
                                        stock?.market === 'KRX'
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                >
                                    {stock?.market || 'KRX'}: {stock?.ticker || ticker}
                                </span>
                                {stock?.sector && (
                                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                                        {stock.sector}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-mono mb-3 sm:mb-4 truncate">
                                {stock?.englishName}
                            </p>

                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-mono">
                                <div className="text-2xl sm:text-4xl font-black text-gray-900 whitespace-nowrap">
                                    {stock?.currency}
                                    {(stock?.price || 0).toLocaleString('ko-KR')}
                                </div>
                                <div
                                    className={`inline-flex items-center gap-0.5 sm:gap-1 text-xs sm:text-lg font-extrabold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl whitespace-nowrap ${
                                        stock?.status === 'up'
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-blue-50 text-blue-600'
                                    }`}
                                >
                                    <span>{stock?.status === 'up' ? '▲' : '▼'}</span>
                                    <span>{Math.abs(stock?.change || 0).toLocaleString('ko-KR')}</span>
                                    <span>
                                        ({(stock?.rate || 0) >= 0 ? '+' : ''}
                                        {(stock?.rate || 0).toFixed(2)}%)
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 text-xs font-mono">
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px] font-sans">
                                        전일종가
                                    </span>
                                    <span className="font-bold text-slate-800 whitespace-nowrap">
                                        {stock?.currency}
                                        {(stock?.previousClose || 0).toLocaleString('ko-KR')}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px] font-sans">
                                        시가
                                    </span>
                                    <span className="font-bold text-slate-800 whitespace-nowrap">
                                        {stock?.currency}
                                        {(stock?.open || 0).toLocaleString('ko-KR')}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px] font-sans">
                                        고가 (당일최고)
                                    </span>
                                    <span className="font-bold text-red-600 whitespace-nowrap">
                                        {stock?.currency}
                                        {(stock?.high || 0).toLocaleString('ko-KR')}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px] font-sans">
                                        저가 (당일최저)
                                    </span>
                                    <span className="font-bold text-blue-600 whitespace-nowrap">
                                        {stock?.currency}
                                        {(stock?.low || 0).toLocaleString('ko-KR')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-80 bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                                <span className="text-xs font-bold text-slate-700">
                                    52주 가격 밴드
                                </span>
                                <button
                                    type="button"
                                    onClick={() => ticker && toggle(ticker, { name: stock?.name })}
                                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                        isFav
                                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-500'
                                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <i className={`${isFav ? 'fas' : 'far'} fa-star`}></i>
                                    <span>{isFav ? '관심종목 해제' : '관심종목 담기'}</span>
                                </button>
                            </div>

                            <div className="my-1 sm:my-2">
                                <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono mb-1">
                                    <span>
                                        최저 {stock?.currency}
                                        {(stock?.low52 || 0).toLocaleString('ko-KR')}
                                    </span>
                                    <span>
                                        최고 {stock?.currency}
                                        {(stock?.high52 || 0).toLocaleString('ko-KR')}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-red-500 rounded-full transition-all duration-500"
                                        style={{ width: `${stock?.rangePercent || 50}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-200/80 space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 shrink-0">시가총액</span>
                                    <span className="font-bold text-slate-900 text-right truncate ml-2">
                                        {stock?.marketCap || '-'}
                                        {stock?.marketCapRank ? ` (${stock.marketCapRank})` : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 shrink-0">외국인 지분율</span>
                                    <span className="font-bold text-slate-900 font-mono text-right">
                                        {stock?.foreignRate || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 기간별 시세 차트 */}
                <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📈</span>
                            <h2 className="text-base sm:text-xl font-black text-gray-900">
                                기간별 시세 차트
                            </h2>
                            <span className="text-xs text-slate-400 font-mono">
                                ({CHART_RANGES.find((r) => r.key === selectedRange)?.label})
                            </span>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto self-start sm:self-auto max-w-full">
                            {CHART_RANGES.map((range) => {
                                const isActive = selectedRange === range.key;
                                return (
                                    <button
                                        key={range.key}
                                        type="button"
                                        onClick={() => setSelectedRange(range.key)}
                                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-sm font-black'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative h-[220px] sm:h-[300px]">{renderSvgPriceChart()}</div>

                    {chartStats && (
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 text-center text-xs font-mono">
                            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px] sm:text-[11px] font-sans">
                                    기간 최고가
                                </span>
                                <span className="font-extrabold text-red-600 whitespace-nowrap">
                                    {stock?.currency}
                                    {chartStats.high.toLocaleString('ko-KR')}
                                </span>
                            </div>
                            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px] sm:text-[11px] font-sans">
                                    기간 최저가
                                </span>
                                <span className="font-extrabold text-blue-600 whitespace-nowrap">
                                    {stock?.currency}
                                    {chartStats.low.toLocaleString('ko-KR')}
                                </span>
                            </div>
                            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px] sm:text-[11px] font-sans">
                                    기간 평균가
                                </span>
                                <span className="font-extrabold text-slate-800 whitespace-nowrap">
                                    {stock?.currency}
                                    {chartStats.avg.toLocaleString('ko-KR')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <BannerSlot
                    slotKey="finance_detail_middle"
                    fallbackSlotKey="main_center"
                    className="my-8"
                />

                {/* 3대 상세 정보 탭 */}
                <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="bg-slate-50/80 border-b border-slate-200 px-4 sm:px-6 pt-2">
                        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b-2 font-black text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                                        activeTab === tab.key
                                            ? 'border-blue-600 text-blue-600 bg-white rounded-t-2xl shadow-xs'
                                            : 'border-transparent text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-8">
                        {activeTab === 'summary' && stock && (
                            <div className="space-y-6 sm:space-y-8">
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                                        <span>💎</span>
                                        <span>핵심 투자 밸류에이션 지표</span>
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 font-mono">
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block font-sans">
                                                PER (주가수익)
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-slate-900">
                                                {stock.per}배
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block font-sans">
                                                PBR (주가순자산)
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-slate-900">
                                                {stock.pbr}배
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block font-sans">
                                                ROE (자기자본)
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-emerald-600">
                                                {stock.roe}%
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block font-sans">
                                                EPS (주당순이익)
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-slate-900">
                                                {stock.currency}
                                                {stock.eps.toLocaleString('ko-KR')}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block font-sans">
                                                BPS (주당순자산)
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-slate-900">
                                                {stock.currency}
                                                {stock.bps.toLocaleString('ko-KR')}
                                            </span>
                                        </div>
                                        <div className="bg-amber-50/70 p-3 sm:p-4 rounded-2xl border border-amber-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-amber-700 font-bold block font-sans">
                                                배당수익률
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-amber-700">
                                                {stock.dividendYield}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                                        <span>🏢</span>
                                        <span>기업 개요 및 주요 사업 모델</span>
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3 sm:mb-4">
                                        {stock.summary}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs pt-3 border-t border-slate-200/60">
                                        <div>
                                            <span className="text-slate-400">주력 제품: </span>
                                            <span className="font-semibold text-slate-800">
                                                {stock.products}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">대표이사: </span>
                                            <span className="font-semibold text-slate-800">
                                                {stock.ceo}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">설립연도: </span>
                                            <span className="font-semibold text-slate-800">
                                                {stock.establishedYear}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">본사위치: </span>
                                            <span className="font-semibold text-slate-800">
                                                {stock.headquarters}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {stock.rivals && stock.rivals.length > 0 && (
                                    <div>
                                        <h3 className="text-sm sm:text-base font-black text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                                            <span>⚔️</span>
                                            <span>동일 업종 라이벌 경쟁사 비교</span>
                                        </h3>
                                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                            <table className="w-full text-left text-xs min-w-[480px]">
                                                <thead className="bg-slate-100 text-slate-600 font-bold">
                                                    <tr>
                                                        <th className="p-3">종목명</th>
                                                        <th className="p-3 text-right">현재가</th>
                                                        <th className="p-3 text-right">등락률</th>
                                                        <th className="p-3 text-right">시가총액</th>
                                                        <th className="p-3 text-right">PER</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {stock.rivals.map((rival) => (
                                                        <tr
                                                            key={rival.ticker}
                                                            className="hover:bg-slate-50"
                                                        >
                                                            <td className="p-3 font-semibold text-slate-800">
                                                                <Link
                                                                    href={`/finance/stock/${encodeURIComponent(
                                                                        rival.ticker
                                                                    )}`}
                                                                    className="hover:text-blue-600 transition-colors"
                                                                >
                                                                    {rival.name}{' '}
                                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                                        ({rival.ticker})
                                                                    </span>
                                                                </Link>
                                                            </td>
                                                            <td className="p-3 text-right font-mono whitespace-nowrap">
                                                                {rival.price.toLocaleString(
                                                                    'ko-KR'
                                                                )}
                                                            </td>
                                                            <td
                                                                className={`p-3 text-right font-mono whitespace-nowrap ${
                                                                    rival.rate >= 0
                                                                        ? 'text-red-600'
                                                                        : 'text-blue-600'
                                                                }`}
                                                            >
                                                                {rival.rate >= 0 ? '+' : ''}
                                                                {rival.rate.toFixed(2)}%
                                                            </td>
                                                            <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                                                                {rival.marketCap}
                                                            </td>
                                                            <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                                                                {rival.per}배
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base sm:text-lg font-bold shrink-0">
                                            🧮
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                                                {stock.name} 수익률 &amp; 배당 시뮬레이터
                                            </h4>
                                            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                                                매수 목표가 대비 예상 수익률 및 연간 세후 배당금을 즉시 계산해보세요.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => setShowCalculator(true)}
                                            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer text-center whitespace-nowrap"
                                        >
                                            수익률 계산
                                        </button>
                                        <Link
                                            href="/finance/util?tab=dividend"
                                            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl transition-all shadow-xs text-center whitespace-nowrap"
                                        >
                                            배당금 계산
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'financial' && stock && (
                            <div className="space-y-6 sm:space-y-8">
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                                        <span>📊</span>
                                        <span>최근 3개년 연간 실적 추이</span>
                                    </h3>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                        <table className="w-full text-left text-xs sm:text-sm min-w-[460px]">
                                            <thead className="bg-slate-100 text-slate-700 font-bold">
                                                <tr>
                                                    <th className="p-3 sm:p-3.5">주요 재무 항목</th>
                                                    {stock.financials.annual.map((a) => (
                                                        <th
                                                            key={a.year}
                                                            className="p-3 sm:p-3.5 text-right font-mono"
                                                        >
                                                            {a.year}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white font-mono">
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900 font-sans">
                                                        매출액
                                                    </td>
                                                    {stock.financials.annual.map((a) => (
                                                        <td
                                                            key={a.year}
                                                            className="p-3 sm:p-3.5 text-right font-black whitespace-nowrap"
                                                        >
                                                            {a.revenue}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900 font-sans">
                                                        영업이익
                                                    </td>
                                                    {stock.financials.annual.map((a) => (
                                                        <td
                                                            key={a.year}
                                                            className="p-3 sm:p-3.5 text-right font-black text-blue-600 whitespace-nowrap"
                                                        >
                                                            {a.opIncome}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900 font-sans">
                                                        당기순이익
                                                    </td>
                                                    {stock.financials.annual.map((a) => (
                                                        <td
                                                            key={a.year}
                                                            className="p-3 sm:p-3.5 text-right font-black whitespace-nowrap"
                                                        >
                                                            {a.netIncome}
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'news' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <span>📰</span>
                                        <span>{stock?.name || ticker} 실시간 관련 뉴스</span>
                                    </h3>
                                </div>

                                {news.length > 0 ? (
                                    news.map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                                        >
                                            <div className="font-extrabold text-slate-900 text-sm sm:text-base mb-1.5 group-hover:text-blue-600 transition-colors">
                                                {item.title}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
                                                {item.summary}
                                            </p>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                                                <span className="font-bold text-slate-700">
                                                    {item.source}
                                                </span>
                                                <span>·</span>
                                                <span>{item.time}</span>
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        관련 뉴스가 없습니다.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </main>

            <ProfitCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
        </div>
    );
}
