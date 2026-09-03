import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';
import StockListCard from '../components/StockListCard';
import type { StockCard } from '../components/StockListCard';
import BannerSlot from '../components/BannerSlot';
import SparklineChart from '../components/SparklineChart';
import ProfitCalculator from '../components/ProfitCalculator';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../hooks/useAuth';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

// 🏆 리더보드 랭킹 타입
type LeaderType = 'market_cap' | 'gainers' | 'volume' | 'dividend';

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

// 🚀 테마 데이터 타입
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

// 🔍 검색 아이템 타입
interface SearchStockItem {
    ticker: string;
    name: string;
    englishName: string;
    market: string;
    sector: string;
}

const LEADER_TABS: { key: LeaderType; label: string; icon: string; highlight: string; insight: string }[] = [
    { key: 'market_cap', label: '시가총액 TOP 10', icon: '👑', highlight: '글로벌 대장주', insight: '대한민국과 미국 증시를 이끄는 초대형 블루칩 대표 우량주입니다.' },
    { key: 'gainers', label: '실시간 급등 TOP 10', icon: '🚀', highlight: '상승 탄력주', insight: '실적 호조, 신약 승인, 기술 혁신 등으로 시장의 강력한 매수세가 유입된 종목입니다.' },
    { key: 'volume', label: '거래대금 TOP 10', icon: '💰', highlight: '자금 집중주', insight: '기관과 외국인, 개인 투자자의 자금이 가장 활발하게 거래되는 시장 핫플레이스입니다.' },
    { key: 'dividend', label: '고배당 TOP 10', icon: '💵', highlight: '주주환원 배당주', insight: '연 4~8%대의 안정적인 배당수익률과 자사주 소각 등 주주환원율이 높은 종목입니다.' },
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

export default function StocksPage() {
    const { favorites, isFavorite, add, remove, toggle } = useFavorites();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // 상태 관리
    const [favoriteCards, setFavoriteCards] = useState<StockCard[]>([]);
    const [loadingFav, setLoadingFav] = useState(false);
    const [activeLeaderTab, setActiveLeaderTab] = useState<LeaderType>('market_cap');
    const [leaders, setLeaders] = useState<LeaderStock[]>([]);
    const [loadingLeaders, setLoadingLeaders] = useState(true);

    // 테마 상태
    const [themes, setThemes] = useState<ThemeGroup[]>([]);
    const [selectedThemeKey, setSelectedThemeKey] = useState<string>('semiconductor');

    // 검색 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchStockItem[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // 계산기 모달
    const [showCalculator, setShowCalculator] = useState(false);

    // 1. 관심종목 시세 로드
    useEffect(() => {
        if (favorites.length === 0) {
            setFavoriteCards([]);
            return;
        }
        let cancelled = false;
        setLoadingFav(true);
        fetch(`${API_BASE}/api/finance/stocks?symbols=${encodeURIComponent(favorites.join(','))}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => { if (!cancelled) setFavoriteCards(Array.isArray(data) ? data : []); })
            .catch(() => { if (!cancelled) setFavoriteCards([]); })
            .finally(() => { if (!cancelled) setLoadingFav(false); });
        return () => { cancelled = true; };
    }, [favorites]);

    // 2. 리더보드 데이터 로드
    useEffect(() => {
        let cancelled = false;
        setLoadingLeaders(true);
        fetch(`${API_BASE}/api/finance/market-leaders?type=${activeLeaderTab}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (!cancelled) setLeaders(Array.isArray(data) ? data : []);
            })
            .catch(() => { if (!cancelled) setLeaders([]); })
            .finally(() => { if (!cancelled) setLoadingLeaders(false); });
        return () => { cancelled = true; };
    }, [activeLeaderTab]);

    // 3. 테마별 주도주 로드
    useEffect(() => {
        let cancelled = false;
        fetch(`${API_BASE}/api/finance/themes`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (!cancelled) {
                    setThemes(Array.isArray(data) ? data : []);
                    if (data.length > 0 && !selectedThemeKey) {
                        setSelectedThemeKey(data[0].key);
                    }
                }
            })
            .catch(() => { if (!cancelled) setThemes([]); });
        return () => { cancelled = true; };
    }, []);

    // 4. 실시간 검색 핸들러
    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`${API_BASE}/api/finance/search-stocks?q=${encodeURIComponent(q)}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => {
                    setSearchResults(Array.isArray(data) ? data : []);
                    setShowSearchDropdown(true);
                })
                .catch(() => setSearchResults([]));
        }, 200);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 외부 클릭 시 검색 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 관심종목 추천 6대장 원클릭 일괄 담기
    const handleAddDefaultFavorites = useCallback(() => {
        const defaults = ['005930', '000660', '005380', 'NVDA', 'AAPL', 'TSLA'];
        defaults.forEach(t => add(t));
    }, [add]);

    // 검색 폼 서밋
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        if (searchResults.length > 0) {
            navigate(`/stock/${searchResults[0].ticker}`);
            setShowSearchDropdown(false);
        } else {
            add(q);
            setSearchQuery('');
            setShowSearchDropdown(false);
        }
    };

    // 현재 선택된 리더보드 탭 메타정보
    const currentLeaderTab = LEADER_TABS.find(t => t.key === activeLeaderTab) || LEADER_TABS[0];

    // 현재 선택된 테마 그룹
    const currentTheme = themes.find(t => t.key === selectedThemeKey) || themes[0];

    // 관심종목 요약 통계 계산
    const favStats = useMemo(() => {
        if (favoriteCards.length === 0) return null;
        const total = favoriteCards.length;
        const upCount = favoriteCards.filter(c => c.status === 'up').length;
        const avgRate = favoriteCards.reduce((acc, c) => acc + c.rate, 0) / total;
        const topGainer = [...favoriteCards].sort((a, b) => b.rate - a.rate)[0];
        return { total, upCount, avgRate, topGainer };
    }, [favoriteCards]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            <Header baseUrl={MAIN_PORTAL_URL} user={user} onLogout={logout} />
            <FinanceSubMenu />

            {/* 브레드크럼 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-blue-600 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link to="/finance" className="hover:text-blue-600 transition-colors">금융</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-bold">주식 종목 정보 허브</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full">
                
                {/* 🔍 HERO: 스마트 종목 검색 & 인기 급상승 키워드 */}
                <section className="mb-8 sm:mb-10 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-10 -top-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-blue-200 mb-3 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            실시간 글로벌 주식 & 테마 분석
                        </div>
                        <h1 className="text-xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
                            어떤 종목의 정보를 찾으시나요?
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 mb-4 sm:mb-6 leading-relaxed">
                            국내 KOSPI·KOSDAQ 우량주부터 미국 나스닥 빅테크, 실시간 급등주 및 테마별 대장주를 검색하세요.
                        </p>

                        {/* 스마트 실시간 검색 인풋 */}
                        <div ref={searchRef} className="relative w-full">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <div className="relative flex items-center">
                                    <i className="fas fa-search absolute left-3.5 sm:left-4 text-slate-400 text-sm sm:text-base"></i>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
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

                            {/* 실시간 검색 자동완성 드롭다운 */}
                            {showSearchDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in text-slate-900 max-h-80 overflow-y-auto">
                                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 px-4">
                                        <span>일치하는 종목 ({searchResults.length}건)</span>
                                        <span>선택 시 상세 이동</span>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {searchResults.map((item) => (
                                            <div
                                                key={item.ticker}
                                                onClick={() => {
                                                    navigate(`/stock/${item.ticker}`);
                                                    setShowSearchDropdown(false);
                                                }}
                                                className="p-3 sm:p-3.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                                                    <span className={`text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded font-mono shrink-0 ${
                                                        item.market === 'KRX' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                                                    }`}>
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

                        {/* 인기 해시태그 칩 */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-3 sm:mt-4">
                            <span className="text-xs text-slate-400 font-bold mr-1">인기:</span>
                            {POPULAR_TAGS.map((tag) => (
                                <button
                                    key={tag.ticker}
                                    type="button"
                                    onClick={() => navigate(`/stock/${tag.ticker}`)}
                                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-white/10"
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ⭐ 1. 내 관심종목(Watchlist) 스마트 대시보드 */}
                <section className="mb-8 sm:mb-10 bg-white rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-sm animate-fade-in-up">
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

                        {/* 통계 요약 바 (종목이 있을 때) */}
                        {favStats && (
                            <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs self-start sm:self-auto">
                                <div>
                                    <span className="text-slate-400 text-[11px] sm:text-xs">당일 평균: </span>
                                    <span className={`font-black font-mono ${favStats.avgRate >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {favStats.avgRate >= 0 ? '+' : ''}{favStats.avgRate.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="w-px h-3 bg-slate-300"></div>
                                <div>
                                    <span className="text-slate-400 text-[11px] sm:text-xs">상승/하락: </span>
                                    <span className="font-bold text-red-600">{favStats.upCount}</span>
                                    <span className="text-slate-400"> / </span>
                                    <span className="font-bold text-blue-600">{favStats.total - favStats.upCount}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 관심종목 카드 리스트 or 빈 상태 안내 */}
                    {favorites.length === 0 ? (
                        <div className="bg-gradient-to-b from-slate-50 to-amber-50/20 border-2 border-dashed border-slate-200 rounded-2xl p-6 sm:p-10 text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center text-xl sm:text-2xl">
                                <i className="far fa-star"></i>
                            </div>
                            <h3 className="font-black text-slate-800 text-sm sm:text-base mb-1">아직 등록된 관심종목이 없습니다</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 sm:mb-5 leading-relaxed">
                                관심 있는 종목의 별(★) 버튼을 누르면 실시간 시세와 차트가 이곳에 모아집니다.
                            </p>
                            <button
                                type="button"
                                onClick={handleAddDefaultFavorites}
                                className="px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 sm:gap-2 max-w-full truncate"
                            >
                                <span>✨ 대표 6대장 한 번에 담기</span>
                                <span className="text-[10px] text-slate-300 font-mono hidden sm:inline">(삼전·하닉·현대차·NVDA·애플·TSLA)</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {favorites.map((ticker, idx) => {
                                const card = favoriteCards.find((c) => c.ticker.toUpperCase() === ticker.toUpperCase());
                                if (card) {
                                    return (
                                        <StockListCard
                                            key={ticker}
                                            stock={card}
                                            isFavorite
                                            onToggleFavorite={toggle}
                                            index={idx}
                                            baseDelay={50}
                                        />
                                    );
                                }
                                return (
                                    <div 
                                        key={ticker} 
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                        className="animate-fade-in relative bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between min-h-[120px] sm:min-h-[140px] hover:shadow-md transition-all"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => remove(ticker)}
                                            aria-label="관심종목 해제"
                                            className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full text-yellow-400 bg-yellow-50/80 cursor-pointer"
                                        >
                                            <i className="fas fa-star text-xs"></i>
                                        </button>
                                        <Link to={`/stock/${ticker}`} className="block pr-7">
                                            <div className="font-black text-gray-900 text-sm sm:text-base font-mono truncate">{ticker}</div>
                                            <div className="text-[11px] text-gray-400 mt-1">
                                                {loadingFav ? '시세 로딩…' : '시세 정보 로딩'}
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 🏆 2. 실시간 시장 리더보드 (4대 랭킹 탭) */}
                <section className="mb-10 sm:mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                                <span className="text-xl sm:text-2xl">🏆</span>
                                <span>실시간 시장 리더보드 TOP 10</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                시가총액, 당일 급등주, 거래대금 및 고배당 기준 실시간 시장 순위
                            </p>
                        </div>

                        {/* 4대 랭킹 선택 탭 바 */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl overflow-x-auto self-start sm:self-auto max-w-full">
                            {LEADER_TABS.map((tab) => {
                                const isActive = activeLeaderTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveLeaderTab(tab.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? 'bg-white text-slate-900 shadow-md font-black scale-[1.02]'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 선택된 리더보드 안내 배너 */}
                    <div className="mb-4 p-3 sm:p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white rounded-2xl border border-blue-100 flex items-center gap-2.5 sm:gap-3 text-xs text-slate-700">
                        <span className="text-base sm:text-lg shrink-0">{currentLeaderTab.icon}</span>
                        <div className="leading-relaxed">
                            <span className="font-extrabold text-blue-900 mr-1.5">[{currentLeaderTab.label}]</span>
                            <span className="text-slate-600">{currentLeaderTab.insight}</span>
                        </div>
                    </div>

                    {/* 리더보드 컨테이너: 모바일 전용 카드형 리스트 뷰 + 데스크톱 테이블 뷰 */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        
                        {/* 📱 모바일 전용 카드 리스트 뷰 (sm 미만) */}
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
                            ) : (
                                leaders.map((stock) => {
                                    const isFav = isFavorite(stock.ticker);
                                    return (
                                        <div key={stock.ticker} className="p-3.5 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-2.5">
                                            {/* 좌측: 순위 + 종목 정보 */}
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs shrink-0 font-black ${
                                                    stock.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-xs' :
                                                    stock.rank === 2 ? 'bg-slate-300 text-slate-900' :
                                                    stock.rank === 3 ? 'bg-amber-700/80 text-white' :
                                                    'text-slate-400 bg-slate-100'
                                                }`}>
                                                    {stock.rank}
                                                </span>
                                                <Link to={`/stock/${stock.ticker}`} className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-extrabold text-slate-900 text-sm truncate">
                                                            {stock.name}
                                                        </span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${
                                                            stock.market === 'KRX' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {stock.ticker}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                                        시총: {stock.marketCap}
                                                    </div>
                                                </Link>
                                            </div>

                                            {/* 우측: 현재가 + 등락률 + 관심 토글 */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="text-right">
                                                    <div className="stock-number font-black text-slate-900 text-sm whitespace-nowrap">
                                                        {stock.currency}{stock.price.toLocaleString('ko-KR')}
                                                    </div>
                                                    <div className="mt-0.5">
                                                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                                                            stock.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            <span>{stock.status === 'up' ? '▲' : '▼'}</span>
                                                            <span>{stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => toggle(stock.ticker, { name: stock.name })}
                                                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                                        isFav ? 'text-yellow-400 bg-yellow-50' : 'text-slate-300 hover:text-yellow-400'
                                                    }`}
                                                    aria-label={isFav ? '관심종목 해제' : '관심종목 추가'}
                                                >
                                                    <i className={`${isFav ? 'fas' : 'far'} fa-star text-xs`}></i>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* 🖥️ 데스크톱 전용 테이블 뷰 (sm 이상) */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-4 w-14 text-center">순위</th>
                                        <th className="py-3.5 px-4">종목명 / 코드</th>
                                        <th className="py-3.5 px-4 text-right">현재가</th>
                                        <th className="py-3.5 px-4 text-right">등락률</th>
                                        <th className="py-3.5 px-4 hidden md:table-cell">핵심 정보 / 시가총액</th>
                                        <th className="py-3.5 px-4 hidden lg:table-cell text-center w-36">최근 추세</th>
                                        <th className="py-3.5 px-4 w-12 text-center">관심</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingLeaders ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="py-4 px-4 text-center text-slate-300">#</td>
                                                <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                                                <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                                                <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-14 ml-auto"></div></td>
                                                <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                                                <td className="py-4 px-4 hidden lg:table-cell"><div className="h-4 bg-slate-200 rounded w-24 mx-auto"></div></td>
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
                                                    {/* 순위 */}
                                                    <td className="py-4 px-4 text-center font-black">
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                                            stock.rank === 1 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' :
                                                            stock.rank === 2 ? 'bg-slate-300 text-slate-900 font-bold' :
                                                            stock.rank === 3 ? 'bg-amber-700/80 text-white font-bold' :
                                                            'text-slate-400'
                                                        }`}>
                                                            {stock.rank}
                                                        </span>
                                                    </td>

                                                    {/* 종목명 / 코드 */}
                                                    <td className="py-4 px-4">
                                                        <Link to={`/stock/${stock.ticker}`} className="block">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                                    {stock.name}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                                                    stock.market === 'KRX' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                                                                }`}>
                                                                    {stock.market}: {stock.ticker}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </td>

                                                    {/* 현재가 */}
                                                    <td className="py-4 px-4 text-right font-black stock-number text-slate-900 text-sm sm:text-base whitespace-nowrap">
                                                        {stock.currency}{stock.price.toLocaleString('ko-KR')}
                                                    </td>

                                                    {/* 등락률 */}
                                                    <td className="py-4 px-4 text-right font-bold stock-number whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${
                                                            stock.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            <span>{stock.status === 'up' ? '▲' : '▼'}</span>
                                                            <span>{Math.abs(stock.change).toLocaleString('ko-KR')}</span>
                                                            <span>({stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%)</span>
                                                        </span>
                                                    </td>

                                                    {/* 핵심 설명 / 시총 */}
                                                    <td className="py-4 px-4 hidden md:table-cell">
                                                        <div className="text-slate-600 text-xs truncate max-w-xs" title={stock.detail}>
                                                            {stock.detail}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            시가총액: {stock.marketCap}
                                                        </div>
                                                    </td>

                                                    {/* 미니 스파크라인 */}
                                                    <td className="py-4 px-4 hidden lg:table-cell text-center">
                                                        {stock.sparkline && stock.sparkline.length > 0 && (
                                                            <div className="flex justify-center">
                                                                <SparklineChart data={stock.sparkline} status={stock.status} width={100} height={28} />
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* 관심 토글 */}
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggle(stock.ticker, { name: stock.name })}
                                                            className={`p-2 rounded-full transition-colors cursor-pointer ${
                                                                isFav ? 'text-yellow-400 hover:bg-yellow-50' : 'text-slate-300 hover:text-yellow-400 hover:bg-slate-100'
                                                            }`}
                                                            aria-label={isFav ? '관심종목 해제' : '관심종목 추가'}
                                                        >
                                                            <i className={`${isFav ? 'fas' : 'far'} fa-star text-sm`}></i>
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


                {/* 🌟 중간 광고 & 스폰서 배너 슬롯 */}
                <BannerSlot slotKey="finance_stocks_middle" fallbackSlotKey="main_center" className="my-10" />

                {/* 🚀 3. 6대 핵심 산업 & 테마별 주도주 허브 (Theme Explorer) */}
                <section className="mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                                <span className="text-2xl">🚀</span>
                                <span>핵심 산업 & 테마별 주도주 허브</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                반도체, 2차전지, 빅테크, 바이오 등 트렌드를 주도하는 핵심 테마별 종목 탐색
                            </p>
                        </div>
                    </div>

                    {/* 테마 탭 바 */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
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
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {theme.stocks.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 선택된 테마 카드 컨테이너 */}
                    {currentTheme && (
                        <div className="bg-gradient-to-b from-slate-50/90 via-slate-100/40 to-slate-50 rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-sm animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-200/80">
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <span className="text-2xl sm:text-3xl shrink-0">{currentTheme.icon}</span>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                            <span>{currentTheme.name}</span>
                                            <span className="text-[10px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                                                {currentTheme.highlight}
                                            </span>
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{currentTheme.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 테마 내 대표 종목 그리드 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {currentTheme.stocks.map((stock) => (
                                    <Link
                                        key={stock.ticker}
                                        to={`/stock/${stock.ticker}`}
                                        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate" title={stock.name}>
                                                        {stock.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {stock.ticker}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap ${
                                                    stock.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {stock.status === 'up' ? '▲' : '▼'} {stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%
                                                </span>
                                            </div>

                                            <div className="stock-number text-lg sm:text-xl font-black text-slate-900 mt-1 sm:mt-2 whitespace-nowrap">
                                                {stock.currency}{stock.price.toLocaleString('ko-KR')}
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                                            <span className="font-semibold text-slate-700">포인트: </span>
                                            <span className="line-clamp-2 sm:line-clamp-none">{stock.note}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* 📊 4. 스마트 투자 계산기 및 용어 가이드 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🧮</span>
                            <h4 className="font-black text-slate-900 text-sm">주식 투자 수익률 시뮬레이터</h4>
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
                            <h4 className="font-black text-slate-900 text-sm">미국 배당주 세후 실수령 계산기</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            SCHD, JEPI 등 배당소득세(15.4%) 공제 후 실제 월/분기 지급액을 계산합니다.
                        </p>
                        <Link
                            to="/util?tab=dividend"
                            className="inline-block px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs transition-colors"
                        >
                            배당세 계산기 바로가기 →
                        </Link>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📚</span>
                            <h4 className="font-black text-slate-900 text-sm">투자 핵심 용어 퀵 가이드</h4>
                        </div>
                        <div className="space-y-1 text-xs text-slate-600">
                            <div><span className="font-bold text-slate-800">PER:</span> 주가수익비율 (저평가 척도)</div>
                            <div><span className="font-bold text-slate-800">PBR:</span> 주가순자산비율 (1미만 저PBR)</div>
                            <div><span className="font-bold text-slate-800">ROE:</span> 자기자본이익률 (수익성)</div>
                        </div>
                    </div>
                </div>

            </main>

            <ProfitCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
