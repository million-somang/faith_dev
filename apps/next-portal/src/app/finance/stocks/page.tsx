'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FinanceSubMenu from '@/components/finance/FinanceSubMenu';
import StockListCard, { type StockCard } from '@/components/finance/StockListCard';
import SparklineChart from '@/components/finance/SparklineChart';
import ProfitCalculator from '@/components/finance/ProfitCalculator';
import { BannerSlot } from '@/components/BannerSlot';
import { useFavorites } from '@/hooks/useFavorites';

type LeaderType =
    | 'price_top'
    | 'popular'
    | 'gainers'
    | 'losers'
    | 'market_cap'
    | 'volume'
    | 'dividend';

interface LeaderStock {
    rank: number;
    ticker: string;
    symbol: string;
    name: string;
    market: 'KRX' | 'NASDAQ' | 'NYSE';
    currency: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    marketCap: string;
    detail: string;
    sparkline: number[];
}

interface ThemeStock {
    ticker: string;
    symbol: string;
    name: string;
    currency: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    note: string;
}

interface ThemeGroup {
    key: string;
    name: string;
    icon: string;
    highlight: string;
    description: string;
    stocks: ThemeStock[];
}

interface SearchStockItem {
    ticker: string;
    name: string;
    englishName: string;
    market: string;
    sector: string;
}

const LEADER_TABS: {
    key: LeaderType;
    label: string;
    shortLabel: string;
    icon: string;
    highlight: string;
    insight: string;
}[] = [
    {
        key: 'price_top',
        label: '거래대금 상위 TOP 10',
        shortLabel: '거래대금 상위',
        icon: '💰',
        highlight: '자금 집중 1위',
        insight: '당일 시장에서 거래 대금이 가장 많이 몰린 실시간 코스피 상위 종목입니다.',
    },
    {
        key: 'popular',
        label: '실시간 인기 종목 TOP 10',
        shortLabel: '인기 종목',
        icon: '🔥',
        highlight: '실시간 검색 1위',
        insight: '현재 투자자들의 관심과 검색량이 가장 집중되고 있는 실시간 핫 종목입니다.',
    },
    {
        key: 'gainers',
        label: '실시간 상승 TOP 10',
        shortLabel: '상승',
        icon: '🚀',
        highlight: '당일 최고 상승률',
        insight: '강력한 매수세와 호재로 당일 가장 높은 상승률을 기록 중인 실시간 급등 종목입니다.',
    },
    {
        key: 'losers',
        label: '실시간 하락 TOP 10',
        shortLabel: '하락',
        icon: '📉',
        highlight: '당일 낙폭 과대',
        insight: '차익 실현 매물 또는 악재로 당일 낙폭이 가장 큰 하락률 상위 종목입니다.',
    },
    {
        key: 'market_cap',
        label: '시가총액 TOP 10',
        shortLabel: '시가총액',
        icon: '👑',
        highlight: '국내 대표 대장주',
        insight: '대한민국 KOSPI 증시를 이끄는 실제 시가총액 기준 상위 대표 우량주입니다.',
    },
    {
        key: 'volume',
        label: '거래량 상위 TOP 10',
        shortLabel: '거래량 상위',
        icon: '📊',
        highlight: '유동성 최다 거래',
        insight: '당일 주식 체결 및 거래량 회전이 가장 활발한 실시간 상위 종목입니다.',
    },
    {
        key: 'dividend',
        label: '고배당 TOP 10',
        shortLabel: '고배당',
        icon: '💵',
        highlight: '주주환원 배당주',
        insight: '연 4~8%대의 안정적인 배당수익률과 자사주 소각 등 주주환원율이 높은 종목입니다.',
    },
];

const POPULAR_TAGS = [
    { label: '#삼성전자', ticker: '005930' },
    { label: '#SK하이닉스', ticker: '000660' },
    { label: '#엔비디아', ticker: 'NVDA' },
    { label: '#테슬라', ticker: 'TSLA' },
    { label: '#애플', ticker: 'AAPL' },
    { label: '#현대차', ticker: '005380' },
    { label: '#한미반도체', ticker: '042700' },
    { label: '#SCHD배당', ticker: 'SCHD' },
];

const KNOWN_STOCK_NAMES: Record<string, string> = {
    '005930': '삼성전자',
    '000660': 'SK하이닉스',
    '373220': 'LG에너지솔루션',
    '005380': '현대차',
    '000270': '기아',
    '005490': 'POSCO홀딩스',
    '035420': 'NAVER',
    '035720': '카카오',
    '207940': '삼성바이오로직스',
    '068270': '셀트리온',
    '000100': '유한양행',
    '105560': 'KB금융',
    '055550': '신한지주',
    '086790': '하나금융지주',
    '138040': '메리츠금융지주',
    '042700': '한미반도체',
    '086520': '에코프로',
    '247540': '에코프로비엠',
    '003670': '포스코퓨처엠',
    '352820': '하이브',
    '259960': '크래프톤',
    NVDA: '엔비디아',
    AAPL: '애플',
    MSFT: '마이크로소프트',
    GOOGL: '알파벳 (구글)',
    AMZN: '아마존',
    META: '메타',
    TSLA: '테슬라',
    AVGO: '브로드컴',
    TSM: 'TSMC',
    ASML: 'ASML',
    AMD: 'AMD',
    PLTR: '팔란티어',
    LLY: '일라이릴리',
    NVO: '노보노디스크',
    SCHD: '슈왑 배당 ETF',
    JEPI: 'JP모건 커버드콜',
    QQQ: '나스닥 100 ETF',
    SPY: 'S&P 500 ETF',
    O: '리얼티인컴',
};

export default function StocksPage() {
    const { favorites, isFavorite, add, remove, toggle } = useFavorites();
    const router = useRouter();

    const [favoriteCards, setFavoriteCards] = useState<StockCard[]>([]);
    const [loadingFav, setLoadingFav] = useState(false);
    const [activeLeaderTab, setActiveLeaderTab] = useState<LeaderType>('price_top');
    const [leaders, setLeaders] = useState<LeaderStock[]>([]);
    const [loadingLeaders, setLoadingLeaders] = useState(true);

    const [themes, setThemes] = useState<ThemeGroup[]>([]);
    const [selectedThemeKey, setSelectedThemeKey] = useState<string>('semiconductor');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchStockItem[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [showCalculator, setShowCalculator] = useState(false);

    useEffect(() => {
        if (favorites.length === 0) {
            setFavoriteCards([]);
            return;
        }
        let cancelled = false;
        const loadFavorites = (initial = false) => {
            if (initial) setLoadingFav(true);
            fetch(`/api/finance/stocks?symbols=${encodeURIComponent(favorites.join(','))}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => {
                    if (!cancelled) setFavoriteCards(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    if (!cancelled && initial) setFavoriteCards([]);
                })
                .finally(() => {
                    if (!cancelled && initial) setLoadingFav(false);
                });
        };
        loadFavorites(true);
        const timer = setInterval(() => loadFavorites(false), 30 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [favorites]);

    useEffect(() => {
        let cancelled = false;
        const loadLeaders = (initial = false) => {
            if (initial) setLoadingLeaders(true);
            fetch(`/api/finance/market-leaders?type=${activeLeaderTab}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => {
                    if (!cancelled) setLeaders(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    if (!cancelled && initial) setLeaders([]);
                })
                .finally(() => {
                    if (!cancelled && initial) setLoadingLeaders(false);
                });
        };
        loadLeaders(true);
        const timer = setInterval(() => loadLeaders(false), 30 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [activeLeaderTab]);

    useEffect(() => {
        let cancelled = false;
        const loadThemes = () => {
            fetch('/api/finance/themes')
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => {
                    if (!cancelled && Array.isArray(data)) {
                        setThemes(data);
                        if (data.length > 0 && !selectedThemeKey) {
                            setSelectedThemeKey(data[0].key);
                        }
                    }
                })
                .catch(() => {});
        };
        loadThemes();
        const timer = setInterval(loadThemes, 30 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [selectedThemeKey]);

    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`/api/finance/search-stocks?q=${encodeURIComponent(q)}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => {
                    setSearchResults(Array.isArray(data) ? data : []);
                    setShowSearchDropdown(true);
                })
                .catch(() => setSearchResults([]));
        }, 200);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddDefaultFavorites = useCallback(() => {
        const defaults = ['005930', '000660', '005380', 'NVDA', 'AAPL', 'TSLA'];
        defaults.forEach((t) => add(t));
    }, [add]);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        if (searchResults.length > 0) {
            router.push(`/finance/stock/${encodeURIComponent(searchResults[0].ticker)}`);
            setShowSearchDropdown(false);
        } else {
            add(q);
            setSearchQuery('');
            setShowSearchDropdown(false);
        }
    };

    const currentLeaderTab =
        LEADER_TABS.find((t) => t.key === activeLeaderTab) || LEADER_TABS[0];
    const currentTheme = themes.find((t) => t.key === selectedThemeKey) || themes[0];

    const favStats = useMemo(() => {
        if (favoriteCards.length === 0) return null;
        const total = favoriteCards.length;
        const upCount = favoriteCards.filter((c) => c.status === 'up').length;
        const avgRate = favoriteCards.reduce((acc, c) => acc + c.rate, 0) / total;
        return { total, upCount, avgRate };
    }, [favoriteCards]);

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
                        <span className="text-gray-900 font-bold">주식 종목 정보 허브</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full">
                {/* 스마트 종목 검색 */}
                <section className="mb-8 sm:mb-10 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-blue-200 mb-3 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            실시간 글로벌 주식 &amp; 테마 분석
                        </div>
                        <h1 className="text-xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
                            어떤 종목의 정보를 찾으시나요?
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 mb-4 sm:mb-6 leading-relaxed">
                            국내 KOSPI·KOSDAQ 우량주부터 미국 나스닥 빅테크, 실시간 급등주 및 테마별 대장주를 검색하세요.
                        </p>

                        <div ref={searchRef} className="relative w-full">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <div className="relative flex items-center">
                                    <i className="fas fa-search absolute left-3.5 sm:left-4 text-slate-400 text-sm sm:text-base"></i>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => {
                                            if (searchResults.length > 0) setShowSearchDropdown(true);
                                        }}
                                        placeholder="종목명 또는 코드 (예: 삼성전자, NVDA, 테슬라)"
                                        className="w-full pl-10 sm:pl-11 pr-20 sm:pr-24 py-3 sm:py-4 bg-white/95 text-slate-900 placeholder-slate-400 rounded-2xl text-xs sm:text-base font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/40 shadow-lg border border-white/20 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1.5 sm:right-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
                                    >
                                        검색
                                    </button>
                                </div>
                            </form>

                            {showSearchDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-900 max-h-80 overflow-y-auto">
                                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 px-4">
                                        <span>일치하는 종목 ({searchResults.length}건)</span>
                                        <span>선택 시 상세 이동</span>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {searchResults.map((item) => (
                                            <div
                                                key={item.ticker}
                                                onClick={() => {
                                                    router.push(
                                                        `/finance/stock/${encodeURIComponent(
                                                            item.ticker
                                                        )}`
                                                    );
                                                    setShowSearchDropdown(false);
                                                }}
                                                className="p-3 sm:p-3.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                                                    <span
                                                        className={`text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded font-mono shrink-0 ${
                                                            item.market === 'KRX'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                    >
                                                        {item.market}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-mono truncate">
                                                            {item.ticker} · {item.englishName}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg whitespace-nowrap hidden sm:inline-block">
                                                        {item.sector}
                                                    </span>
                                                    <i className="fas fa-chevron-right text-xs text-slate-300 group-hover:text-blue-500 transition-colors"></i>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap mt-3 sm:mt-4">
                            <span className="text-xs text-slate-400 font-bold mr-1">인기:</span>
                            {POPULAR_TAGS.map((tag) => (
                                <button
                                    key={tag.ticker}
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/finance/stock/${encodeURIComponent(tag.ticker)}`
                                        )
                                    }
                                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-white/10"
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 관심종목 대시보드 */}
                <section className="mb-8 sm:mb-10 bg-white rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                                <span className="text-yellow-400 text-xl sm:text-2xl">★</span>
                                <span>내 관심종목 포트폴리오</span>
                                {favorites.length > 0 && (
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
                                        {favorites.length}개
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                실시간 시세와 차트를 관심종목으로 저장하고 자동 동기화됩니다.
                            </p>
                        </div>

                        {favStats && (
                            <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs self-start sm:self-auto">
                                <div>
                                    <span className="text-slate-400 text-[11px] sm:text-xs">
                                        당일 평균:{' '}
                                    </span>
                                    <span
                                        className={`font-black font-mono ${
                                            favStats.avgRate >= 0 ? 'text-red-600' : 'text-blue-600'
                                        }`}
                                    >
                                        {favStats.avgRate >= 0 ? '+' : ''}
                                        {favStats.avgRate.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="w-px h-3 bg-slate-300"></div>
                                <div>
                                    <span className="text-slate-400 text-[11px] sm:text-xs">
                                        상승/하락:{' '}
                                    </span>
                                    <span className="font-bold text-red-600">
                                        {favStats.upCount}
                                    </span>
                                    <span className="text-slate-400"> / </span>
                                    <span className="font-bold text-blue-600">
                                        {favStats.total - favStats.upCount}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {favorites.length === 0 ? (
                        <div className="bg-gradient-to-b from-slate-50 to-amber-50/20 border-2 border-dashed border-slate-200 rounded-2xl p-6 sm:p-10 text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center text-xl sm:text-2xl">
                                <i className="far fa-star"></i>
                            </div>
                            <h3 className="font-black text-slate-800 text-sm sm:text-base mb-1">
                                아직 등록된 관심종목이 없습니다
                            </h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 sm:mb-5 leading-relaxed">
                                관심 있는 종목의 별(★) 버튼을 누르면 실시간 시세와 차트가 이곳에 모아집니다.
                            </p>
                            <button
                                type="button"
                                onClick={handleAddDefaultFavorites}
                                className="px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 sm:gap-2"
                            >
                                <span>✨ 대표 6대장 한 번에 담기</span>
                                <span className="text-[10px] text-slate-300 font-mono hidden sm:inline">
                                    (삼전·하닉·현대차·NVDA·애플·TSLA)
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {favorites.map((ticker, idx) => {
                                const cleanT = (t: string) =>
                                    t.trim().toUpperCase().replace(/\.(KS|KQ)$/, '');
                                const clean = cleanT(ticker);
                                const card = favoriteCards.find((c) => cleanT(c.ticker) === clean);
                                const displayName = KNOWN_STOCK_NAMES[clean] || clean;

                                if (card) {
                                    return (
                                        <StockListCard
                                            key={ticker}
                                            stock={{
                                                ...card,
                                                ticker: clean,
                                                name:
                                                    card.name && card.name !== card.ticker
                                                        ? card.name
                                                        : displayName,
                                            }}
                                            isFavorite
                                            onToggleFavorite={toggle}
                                            index={idx}
                                            baseDelay={50}
                                        />
                                    );
                                }

                                if (loadingFav) {
                                    return (
                                        <div
                                            key={ticker}
                                            className="animate-pulse relative bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between min-h-[120px]"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="pr-6">
                                                    <div className="font-extrabold text-slate-900 text-sm truncate">
                                                        {displayName}
                                                    </div>
                                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                        {clean}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-3 space-y-1.5">
                                                <div className="h-5 w-24 bg-slate-200/80 rounded"></div>
                                                <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={ticker}
                                        className="relative bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between min-h-[120px] hover:shadow-md transition-all group"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => remove(ticker)}
                                            aria-label="관심종목 해제"
                                            className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full text-yellow-400 bg-yellow-50/80 cursor-pointer"
                                        >
                                            <i className="fas fa-star text-xs"></i>
                                        </button>
                                        <Link
                                            href={`/finance/stock/${encodeURIComponent(clean)}`}
                                            className="block pr-7"
                                        >
                                            <div className="font-extrabold text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate">
                                                {displayName}
                                            </div>
                                            <div className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                {clean}
                                            </div>
                                            <div className="text-xs text-blue-600 font-semibold mt-3 flex items-center gap-1">
                                                <span>상세 시세 보기</span>
                                                <i className="fas fa-chevron-right text-[10px]"></i>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 실시간 랭킹 리더보드 */}
                <section className="mb-10 sm:mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                                실시간 랭킹
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                거래대금, 실시간 인기 종목, 당일 등락률, 시가총액 및 거래량 기준 시장 순위
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto self-start sm:self-auto max-w-full pb-1 sm:pb-0 hide-scrollbar">
                            {LEADER_TABS.map((tab) => {
                                const isActive = activeLeaderTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveLeaderTab(tab.key)}
                                        className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? 'bg-stone-800 text-white shadow-sm border border-stone-800 font-bold'
                                                : 'bg-white text-stone-700 border border-stone-300/90 hover:border-stone-400 hover:bg-stone-50 font-medium'
                                        }`}
                                    >
                                        <span>{tab.shortLabel}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-4 p-3 sm:p-3.5 bg-gradient-to-r from-stone-50 via-slate-50 to-white rounded-2xl border border-stone-200 flex items-center gap-2.5 sm:gap-3 text-xs text-slate-700">
                        <span className="text-base sm:text-lg shrink-0">
                            {currentLeaderTab.icon}
                        </span>
                        <div className="leading-relaxed">
                            <span className="font-extrabold text-stone-900 mr-1.5">
                                [{currentLeaderTab.label}]
                            </span>
                            <span className="text-slate-600">{currentLeaderTab.insight}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* 모바일 뷰 */}
                        <div className="block sm:hidden divide-y divide-slate-100">
                            {loadingLeaders ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-4 animate-pulse flex items-center gap-3">
                                        <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 rounded w-28"></div>
                                            <div className="h-3 bg-slate-100 rounded w-40"></div>
                                        </div>
                                    </div>
                                ))
                            ) : leaders.length > 0 ? (
                                leaders.map((stock) => {
                                    const isFav = isFavorite(stock.ticker);
                                    return (
                                        <div
                                            key={stock.ticker}
                                            className="p-3.5 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-2.5"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <span
                                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs shrink-0 font-black ${
                                                        stock.rank === 1
                                                            ? 'bg-amber-400 text-slate-950'
                                                            : stock.rank === 2
                                                              ? 'bg-slate-300 text-slate-900'
                                                              : stock.rank === 3
                                                                ? 'bg-amber-700/80 text-white'
                                                                : 'text-slate-400 bg-slate-100'
                                                    }`}
                                                >
                                                    {stock.rank}
                                                </span>
                                                <Link
                                                    href={`/finance/stock/${encodeURIComponent(
                                                        stock.ticker
                                                    )}`}
                                                    className="min-w-0 flex-1"
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-extrabold text-slate-900 text-sm truncate">
                                                            {stock.name}
                                                        </span>
                                                        <span
                                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                                                stock.market === 'KRX'
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'bg-rose-50 text-rose-700'
                                                            }`}
                                                        >
                                                            {stock.ticker}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                                        시총: {stock.marketCap}
                                                    </div>
                                                </Link>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="text-right font-mono">
                                                    <div className="font-black text-slate-900 text-sm whitespace-nowrap">
                                                        {stock.currency}
                                                        {stock.price.toLocaleString('ko-KR')}
                                                    </div>
                                                    <div className="mt-0.5">
                                                        <span
                                                            className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                                                                stock.status === 'up'
                                                                    ? 'bg-red-50 text-red-600'
                                                                    : 'bg-blue-50 text-blue-600'
                                                            }`}
                                                        >
                                                            <span>
                                                                {stock.status === 'up' ? '▲' : '▼'}
                                                            </span>
                                                            <span>
                                                                {stock.rate >= 0 ? '+' : ''}
                                                                {stock.rate.toFixed(2)}%
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggle(stock.ticker, { name: stock.name })
                                                    }
                                                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                                        isFav
                                                            ? 'text-yellow-400 bg-yellow-50'
                                                            : 'text-slate-300 hover:text-yellow-400'
                                                    }`}
                                                    aria-label={
                                                        isFav ? '관심종목 해제' : '관심종목 추가'
                                                    }
                                                >
                                                    <i
                                                        className={`${
                                                            isFav ? 'fas' : 'far'
                                                        } fa-star text-xs`}
                                                    ></i>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    랭킹 데이터를 불러오는 중입니다.
                                </div>
                            )}
                        </div>

                        {/* 데스크톱 테이블 뷰 */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-4 w-14 text-center">순위</th>
                                        <th className="py-3.5 px-4">종목명 / 코드</th>
                                        <th className="py-3.5 px-4 text-right">현재가</th>
                                        <th className="py-3.5 px-4 text-right">등락률</th>
                                        <th className="py-3.5 px-4 hidden md:table-cell">
                                            핵심 정보 / 시가총액
                                        </th>
                                        <th className="py-3.5 px-4 hidden lg:table-cell text-center w-36">
                                            최근 추세
                                        </th>
                                        <th className="py-3.5 px-4 w-12 text-center">관심</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingLeaders ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="py-4 px-4 text-center text-slate-300">
                                                    #
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="h-4 bg-slate-200 rounded w-28"></div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="h-4 bg-slate-200 rounded w-14 ml-auto"></div>
                                                </td>
                                                <td className="py-4 px-4 hidden md:table-cell">
                                                    <div className="h-4 bg-slate-200 rounded w-36"></div>
                                                </td>
                                                <td className="py-4 px-4 hidden lg:table-cell">
                                                    <div className="h-4 bg-slate-200 rounded w-24 mx-auto"></div>
                                                </td>
                                                <td className="py-4 px-4 text-center">★</td>
                                            </tr>
                                        ))
                                    ) : (
                                        leaders.map((stock) => {
                                            const isFav = isFavorite(stock.ticker);
                                            return (
                                                <tr
                                                    key={stock.ticker}
                                                    className="hover:bg-blue-50/40 transition-colors group"
                                                >
                                                    <td className="py-4 px-4 text-center font-black">
                                                        <span
                                                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                                                stock.rank === 1
                                                                    ? 'bg-amber-400 text-slate-950 font-black'
                                                                    : stock.rank === 2
                                                                      ? 'bg-slate-300 text-slate-900 font-bold'
                                                                      : stock.rank === 3
                                                                        ? 'bg-amber-700/80 text-white font-bold'
                                                                        : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {stock.rank}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Link
                                                            href={`/finance/stock/${encodeURIComponent(
                                                                stock.ticker
                                                            )}`}
                                                            className="block"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                                    {stock.name}
                                                                </span>
                                                                <span
                                                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                                                        stock.market === 'KRX'
                                                                            ? 'bg-blue-50 text-blue-700'
                                                                            : 'bg-rose-50 text-rose-700'
                                                                    }`}
                                                                >
                                                                    {stock.market}: {stock.ticker}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </td>
                                                    <td className="py-4 px-4 text-right font-black font-mono text-slate-900 text-sm sm:text-base whitespace-nowrap">
                                                        {stock.currency}
                                                        {stock.price.toLocaleString('ko-KR')}
                                                    </td>
                                                    <td className="py-4 px-4 text-right font-bold font-mono whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${
                                                                stock.status === 'up'
                                                                    ? 'bg-red-50 text-red-600'
                                                                    : 'bg-blue-50 text-blue-600'
                                                            }`}
                                                        >
                                                            <span>
                                                                {stock.status === 'up' ? '▲' : '▼'}
                                                            </span>
                                                            <span>
                                                                {Math.abs(
                                                                    stock.change
                                                                ).toLocaleString('ko-KR')}
                                                            </span>
                                                            <span>
                                                                ({stock.rate >= 0 ? '+' : ''}
                                                                {stock.rate.toFixed(2)}%)
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 hidden md:table-cell">
                                                        <div
                                                            className="text-slate-600 text-xs truncate max-w-xs"
                                                            title={stock.detail}
                                                        >
                                                            {stock.detail}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            시가총액: {stock.marketCap}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 hidden lg:table-cell text-center">
                                                        {stock.sparkline &&
                                                            stock.sparkline.length > 0 && (
                                                                <div className="flex justify-center">
                                                                    <SparklineChart
                                                                        data={stock.sparkline}
                                                                        status={stock.status}
                                                                        width={100}
                                                                        height={28}
                                                                    />
                                                                </div>
                                                            )}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggle(stock.ticker, {
                                                                    name: stock.name,
                                                                })
                                                            }
                                                            className={`p-2 rounded-full transition-colors cursor-pointer ${
                                                                isFav
                                                                    ? 'text-yellow-400 hover:bg-yellow-50'
                                                                    : 'text-slate-300 hover:text-yellow-400 hover:bg-slate-100'
                                                            }`}
                                                            aria-label={
                                                                isFav
                                                                    ? '관심종목 해제'
                                                                    : '관심종목 추가'
                                                            }
                                                        >
                                                            <i
                                                                className={`${
                                                                    isFav ? 'fas' : 'far'
                                                                } fa-star text-sm`}
                                                            ></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <BannerSlot
                    slotKey="finance_stocks_middle"
                    fallbackSlotKey="main_center"
                    className="my-10"
                />

                {/* 핵심 산업 & 테마별 주도주 */}
                {themes.length > 0 && (
                    <section className="mb-12">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                                    <span className="text-2xl">🚀</span>
                                    <span>핵심 산업 &amp; 테마별 주도주 허브</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    반도체, 2차전지, 빅테크, 바이오 등 트렌드를 주도하는 핵심 테마별 종목 탐색
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar mb-4">
                            {themes.map((theme) => {
                                const isSelected = selectedThemeKey === theme.key;
                                return (
                                    <button
                                        key={theme.key}
                                        type="button"
                                        onClick={() => setSelectedThemeKey(theme.key)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                                            isSelected
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className="text-sm">{theme.icon}</span>
                                        <span>{theme.name}</span>
                                        <span
                                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {theme.stocks.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {currentTheme && (
                            <div className="bg-gradient-to-b from-slate-50/90 via-slate-100/40 to-slate-50 rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-200/80">
                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                        <span className="text-2xl sm:text-3xl shrink-0">
                                            {currentTheme.icon}
                                        </span>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                <span>{currentTheme.name}</span>
                                                <span className="text-[10px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                                                    {currentTheme.highlight}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {currentTheme.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {currentTheme.stocks.map((stock) => (
                                        <Link
                                            key={stock.ticker}
                                            href={`/finance/stock/${encodeURIComponent(
                                                stock.ticker
                                            )}`}
                                            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all group flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <div className="min-w-0 flex-1">
                                                        <div
                                                            className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate"
                                                            title={stock.name}
                                                        >
                                                            {stock.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            {stock.ticker}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap font-mono ${
                                                            stock.status === 'up'
                                                                ? 'bg-red-50 text-red-600'
                                                                : 'bg-blue-50 text-blue-600'
                                                        }`}
                                                    >
                                                        {stock.status === 'up' ? '▲' : '▼'}{' '}
                                                        {stock.rate >= 0 ? '+' : ''}
                                                        {stock.rate.toFixed(2)}%
                                                    </span>
                                                </div>

                                                <div className="font-mono text-lg sm:text-xl font-black text-slate-900 mt-1 sm:mt-2 whitespace-nowrap">
                                                    {stock.currency}
                                                    {stock.price.toLocaleString('ko-KR')}
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                                                <span className="font-semibold text-slate-700">
                                                    포인트:{' '}
                                                </span>
                                                <span className="line-clamp-2 sm:line-clamp-none">
                                                    {stock.note}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 스마트 투자 계산기 및 용어 가이드 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🧮</span>
                            <h4 className="font-black text-slate-900 text-sm">
                                주식 투자 수익률 시뮬레이터
                            </h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            매수가, 매도가, 수수료 및 제세금을 반영한 실질 수익률과 순수익금을 계산합니다.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCalculator(true)}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                            수익률 계산기 열기 →
                        </button>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💵</span>
                            <h4 className="font-black text-slate-900 text-sm">
                                미국 배당주 세후 실수령 계산기
                            </h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            SCHD, JEPI 등 배당소득세(15.4%) 공제 후 실제 월/분기 지급액을 계산합니다.
                        </p>
                        <Link
                            href="/finance/util?tab=dividend"
                            className="inline-block px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs transition-colors"
                        >
                            배당세 계산기 바로가기 →
                        </Link>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📚</span>
                            <h4 className="font-black text-slate-900 text-sm">
                                투자 핵심 용어 퀵 가이드
                            </h4>
                        </div>
                        <div className="space-y-1 text-xs text-slate-600">
                            <div>
                                <span className="font-bold text-slate-800">PER:</span> 주가수익비율 (저평가 척도)
                            </div>
                            <div>
                                <span className="font-bold text-slate-800">PBR:</span> 주가순자산비율 (1미만 저PBR)
                            </div>
                            <div>
                                <span className="font-bold text-slate-800">ROE:</span> 자기자본이익률 (수익성)
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ProfitCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
        </div>
    );
}
