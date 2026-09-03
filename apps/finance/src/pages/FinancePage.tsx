import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';
import ProfitCalculator from '../components/ProfitCalculator';
import SparklineChart from '../components/SparklineChart';
import BannerSlot from '../components/BannerSlot';
import { MOCK_INDICES, MOCK_FINANCE_NEWS } from '../data/mockData';
import type { MarketIndex } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { getTimeAgo, decodeHtmlEntities } from '@faithportal/core-utils';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

interface StockCard {
    ticker: string;
    name: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    currency: string;
    sparkline: number[];
}

interface MacroIndicator {
    symbol: string;
    name: string;
    icon: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    currency: string;
    unit?: string;
    category?: 'agri' | 'energy' | 'metal' | 'forex' | 'crypto';
    description?: string;
    updatedAt: string;
}

interface IndexData extends MarketIndex {
    updatedAt?: string;
}

interface NewsItem {
    id: number;
    title: string;
    summary?: string;
    published_at?: string;
    created_at?: string;
    thumbnail?: string;
    link?: string;
    source?: string;
    category?: string;
}

type CountryKey = 'kr' | 'us' | 'cn' | 'jp' | 'fr';

const COUNTRY_TABS: { key: CountryKey; label: string; flag: string; title: string; desc: string }[] = [
    { key: 'kr', label: '대한민국', flag: '🇰🇷', title: '대한민국 주요 지수', desc: '코스피, 코스닥, 코스피 200, 원/달러 환율' },
    { key: 'us', label: '미국', flag: '🇺🇸', title: '미국 3대 & 대표 지수', desc: '다우존스, S&P 500, 나스닥 종합, 필라델피아 반도체' },
    { key: 'cn', label: '중국', flag: '🇨🇳', title: '중화권 대표 지수', desc: '상해 종합, 홍콩 항셍, 심천 종합' },
    { key: 'jp', label: '일본', flag: '🇯🇵', title: '일본 대표 지수', desc: '닛케이 225 (Nikkei 225)' },
    { key: 'fr', label: '프랑스', flag: '🇫🇷', title: '프랑스 & 유럽 대표 지수', desc: '프랑스 CAC 40, 유로 스톡스 50' },
];

export type MacroCategory = 'agri' | 'energy' | 'metal' | 'forex' | 'crypto' | 'all';

export const MACRO_CATEGORY_TABS: { key: MacroCategory; label: string; icon: string; highlight: string; insight: string }[] = [
    { key: 'agri', label: '농산물/곡물', icon: '🌾', highlight: '대두·밀·옥수수', insight: '곡물 가격은 글로벌 사료, 바이오에너지 및 밥상 물가(애그플레이션)의 척도입니다.' },
    { key: 'energy', label: '에너지/원유', icon: '⚡', highlight: 'WTI·천연가스', insight: '원유 및 천연가스는 생산·운송 원가와 글로벌 인플레이션을 이끄는 핵심 동력입니다.' },
    { key: 'metal', label: '귀금속/산업재', icon: '🥇', highlight: '금·은·구리', insight: '금은 대표적 안전자산이며, 닥터 코퍼(구리)는 실물 경기의 확장과 침체를 가장 먼저 선행합니다.' },
    { key: 'forex', label: '환율/국채금리', icon: '💵', highlight: '달러·미10년국채', insight: '원/달러 환율과 미국 국채금리는 전 세계 자산 가격과 외국인 수급의 결정적 기준입니다.' },
    { key: 'crypto', label: '가상자산', icon: '₿', highlight: '비트코인·이더', insight: '디지털 금으로 불리는 비트코인과 주요 레이어1 코인의 24시간 실시간 시세입니다.' },
    { key: 'all', label: '전체 지표', icon: '🌐', highlight: '종합 보기', insight: '글로벌 원자재, 에너지, 금속, 환율 및 가상자산 등 24종 핵심 지표를 종합 조망합니다.' },
];

export default function FinancePage() {
    const { user, logout } = useAuth();
    const [showCalculator, setShowCalculator] = useState(false);
    const [indices, setIndices] = useState<IndexData[]>(MOCK_INDICES);
    const [selectedCountry, setSelectedCountry] = useState<CountryKey>('kr');
    const [selectedMacroCategory, setSelectedMacroCategory] = useState<MacroCategory>('agri');
    const [krStocks, setKrStocks] = useState<StockCard[]>([]);
    const [usStocks, setUsStocks] = useState<StockCard[]>([]);
    const [macro, setMacro] = useState<MacroIndicator[]>([]);
    const [stockNews, setStockNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [indicesRes, krRes, usRes, macroRes, newsRes] = await Promise.all([
                    fetch(`${API_BASE}/api/finance/indices`),
                    fetch(`${API_BASE}/api/finance/kr-stocks`),
                    fetch(`${API_BASE}/api/finance/us-stocks`),
                    fetch(`${API_BASE}/api/finance/macro`),
                    fetch(`${API_BASE}/api/news?category=stock&limit=6`),
                ]);
                
                if (indicesRes.ok) {
                    const data = await indicesRes.json();
                    if (Array.isArray(data) && data.length > 0) setIndices(data);
                }
                if (krRes.ok) {
                    const data = await krRes.json();
                    if (data.length > 0) setKrStocks(data);
                }
                if (usRes.ok) {
                    const data = await usRes.json();
                    if (data.length > 0) setUsStocks(data);
                }
                if (macroRes.ok) {
                    const data = await macroRes.json();
                    if (data.length > 0) setMacro(data);
                }
                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    if (newsData.success && Array.isArray(newsData.news) && newsData.news.length > 0) {
                        setStockNews(newsData.news.slice(0, 4));
                    } else {
                        // fallback: economy 뉴스 조회
                        const fallbackRes = await fetch(`${API_BASE}/api/news?category=economy&limit=4`);
                        if (fallbackRes.ok) {
                            const fallbackData = await fallbackRes.json();
                            if (fallbackData.success && Array.isArray(fallbackData.news) && fallbackData.news.length > 0) {
                                setStockNews(fallbackData.news.slice(0, 4));
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('실시간 데이터 로드 실패:', e);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // 선택된 해당 국가 지수만 정확히 필터링
    const currentTabInfo = COUNTRY_TABS.find(t => t.key === selectedCountry) || COUNTRY_TABS[0];
    const filteredIndices = indices.filter(idx => idx.country === selectedCountry);

    const renderStockCard = (stock: StockCard, idx: number = 0, baseDelay: number = 0, market: 'kr' | 'us' = 'kr') => {
        const isKR = market === 'kr';
        return (
            <Link
                key={stock.ticker}
                to={`/stock/${stock.ticker}`}
                style={{ animationDelay: `${baseDelay + idx * 80}ms` }}
                className={`animate-fade-in-up bg-white rounded-2xl p-3.5 sm:p-5 border shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between ${
                    isKR 
                        ? 'border-slate-200/90 border-t-4 border-t-blue-500 hover:border-blue-400' 
                        : 'border-slate-200/90 border-t-4 border-t-rose-500 hover:border-rose-400'
                }`}
            >
                <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate" title={stock.name}>
                                {stock.name}
                            </div>
                            <div className="mt-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono inline-block truncate max-w-full ${
                                    isKR ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                    {isKR ? stock.ticker : stock.ticker}
                                </span>
                            </div>
                        </div>
                        <span className={`text-[11px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap ${
                            stock.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            {stock.status === 'up' ? '▲' : '▼'} {Math.abs(stock.rate).toFixed(2)}%
                        </span>
                    </div>

                    <div className="stock-number text-lg sm:text-2xl font-black text-gray-900 mt-2 whitespace-nowrap">
                        {stock.currency}{stock.price.toLocaleString('ko-KR')}
                        {!isKR && (
                            <span className="text-[10px] sm:text-[11px] font-normal text-slate-400 ml-1 hidden sm:inline">
                                (약 ₩{Math.round(stock.price * 1380).toLocaleString('ko-KR')})
                            </span>
                        )}
                    </div>

                    <div className={`stock-number text-[11px] sm:text-xs font-semibold mt-1 whitespace-nowrap truncate ${stock.status === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.currency === '$' ? '$' : ''}{Math.abs(stock.change).toLocaleString('ko-KR')} ({stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%)
                    </div>
                </div>

                <div className={`mt-3 pt-2 border-t border-slate-100 rounded-xl p-1.5 flex justify-center w-full overflow-hidden ${
                    isKR ? 'bg-slate-50/80' : 'bg-rose-50/20'
                }`}>
                    <SparklineChart data={stock.sparkline} status={stock.status} height={34} className="w-full" />
                </div>
            </Link>
        );
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header baseUrl={MAIN_PORTAL_URL} user={user} onLogout={logout} />
            <FinanceSubMenu />

            {/* 브레드크럼 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-green-600 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link to="/" className="hover:text-green-600 transition-colors">금융</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-medium">주식</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 w-full">
                {/* 🌟 국가별 주식 지수 섹션 (탭 선택 시 해당 국가 지수만 표시) */}
                <section className="mb-8 sm:mb-10 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{currentTabInfo.flag}</span>
                                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                                    {currentTabInfo.title}
                                </h2>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {currentTabInfo.desc}
                            </p>
                        </div>

                        {/* 국가 선택 탭 바 (한국 기본, 미국, 중국, 일본, 프랑스) */}
                        <div className="flex items-center gap-1.5 p-1 sm:p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60 overflow-x-auto self-start sm:self-auto max-w-full">
                            {COUNTRY_TABS.map(tab => {
                                const isActive = selectedCountry === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setSelectedCountry(tab.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-sm font-black'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        <span className="text-sm">{tab.flag}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 선택된 국가의 지수 카드 그리드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filteredIndices.map(index => (
                            <div 
                                key={index.symbol || index.name} 
                                className={`p-4 sm:p-5 hover:shadow-md transition-all duration-300 border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 rounded-2xl ${loading ? 'animate-pulse' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-2 gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            {index.flag && <span className="text-base shrink-0">{index.flag}</span>}
                                            <h3 className="text-sm font-bold text-gray-900 truncate" title={index.name}>{index.name}</h3>
                                        </div>
                                        {index.description && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{index.description}</p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                                        index.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {index.status === 'up' ? '▲ 상승' : '▼ 하락'}
                                    </span>
                                </div>

                                <div className="stock-number text-xl sm:text-2xl font-black text-gray-900 my-1 whitespace-nowrap">
                                    {index.value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {index.currency && (
                                        <span className="text-xs font-bold text-gray-400 ml-1">{index.currency}</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                        <span className={`stock-number font-extrabold ${index.status === 'up' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {index.status === 'up' ? '+' : ''}{index.change.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className={`stock-number font-bold text-[11px] ${index.status === 'up' ? 'text-red-600' : 'text-blue-600'}`}>
                                            ({index.rate > 0 ? '+' : ''}{index.rate.toFixed(2)}%)
                                        </span>
                                    </div>
                                    {index.updatedAt && (
                                        <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{index.updatedAt}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>


                {/* 💡 금융Util 3대 킬러 계산기 섹션 */}
                <div className="mb-10 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-3xl p-6 border border-amber-200/80 animate-fade-in-up animation-delay-75">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg font-black shadow-sm">
                                📊
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                                    스마트 금융Util 시뮬레이터
                                </h2>
                                <p className="text-xs text-slate-600">
                                    세금, 대출 한도, 퇴직금/실업급여를 1초 만에 무료로 자동 계산해보세요.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/util"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm w-fit"
                        >
                            <span>금융Util 전체보기</span>
                            <i className="fas fa-arrow-right text-[10px]"></i>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Link
                            to="/util?tab=dividend"
                            className="p-4 bg-white rounded-2xl border border-amber-200/60 hover:border-amber-400 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-lg">💵</span>
                                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                                    미국 배당주 & 세금 계산기
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                SCHD, JEPI 등 배당소득세(15.4%) 공제 후 실제 월 수령액 및 12개월 캘린더
                            </p>
                        </Link>

                        <Link
                            to="/util?tab=dsr"
                            className="p-4 bg-white rounded-2xl border border-blue-200/60 hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-lg">🏠</span>
                                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    주담대 DSR / LTV 계산기
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                2026 스트레스 DSR 2단계 적용 최대 한도 및 상환방식별 이자 총액 비교
                            </p>
                        </Link>

                        <Link
                            to="/util?tab=severance"
                            className="p-4 bg-white rounded-2xl border border-teal-200/60 hover:border-teal-400 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-lg">💼</span>
                                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors">
                                    퇴직금 & 실업급여 계산기
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                근속연수별 법정 퇴직금 세후 실수령액 및 2026 고용보험 구직급여 총액
                            </p>
                        </Link>
                    </div>
                </div>

                {/* 🌍 1. 글로벌 거시 경제 지표 전용 대시보드 박스 */}
                {macro.length > 0 && (
                    <div className="mb-8 bg-gradient-to-b from-slate-50/90 via-slate-100/40 to-emerald-50/25 rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm animate-fade-in-up animation-delay-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                                    <span className="text-2xl">🌍</span>
                                    <span>글로벌 거시 경제 지표</span>
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                        24종 실시간 연동
                                    </span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    농산물/곡물, 원유, 귀금속, 환율 및 국채금리 등 글로벌 시장 핵심 원자재·선물 지표
                                </p>
                            </div>
                            <span className="text-[11px] text-gray-400 self-start sm:self-auto font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                5분 주기 자동 갱신
                            </span>
                        </div>

                        {/* 카테고리 탭 선택 바 */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
                            {MACRO_CATEGORY_TABS.map((tab) => {
                                const count = tab.key === 'all' 
                                    ? macro.length 
                                    : macro.filter(m => m.category === tab.key).length;
                                const isSelected = selectedMacroCategory === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setSelectedMacroCategory(tab.key)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                                            isSelected
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className="text-sm">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 선택된 카테고리 핵심 인사이트 안내 배너 */}
                        {(() => {
                            const currentTab = MACRO_CATEGORY_TABS.find(t => t.key === selectedMacroCategory) || MACRO_CATEGORY_TABS[0];
                            return (
                                <div className="mb-5 p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700 shadow-xs">
                                    <span className="text-base shrink-0">{currentTab.icon}</span>
                                    <div className="leading-relaxed">
                                        <span className="font-extrabold text-slate-900 mr-1.5">[{currentTab.label}]</span>
                                        <span className="text-slate-600">{currentTab.insight}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 지표 카드 그리드 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {(selectedMacroCategory === 'all' 
                                ? macro 
                                : macro.filter(m => m.category === selectedMacroCategory)
                            ).map((item, idx) => (
                                <div 
                                    key={item.symbol} 
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                    className="animate-fade-in bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 hover:shadow-lg hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* 헤더: 아이콘, 이름, 단위 배지 */}
                                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                                                <span className="text-lg sm:text-xl shrink-0">{item.icon}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-extrabold text-gray-900 text-xs sm:text-sm truncate" title={item.name}>
                                                        {item.name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono truncate">
                                                        {item.symbol}
                                                    </div>
                                                </div>
                                            </div>
                                            {item.unit && (
                                                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0 whitespace-nowrap hidden sm:inline-block">
                                                    {item.unit}
                                                </span>
                                            )}
                                        </div>

                                        {/* 현재가 */}
                                        <div className="stock-number text-base sm:text-2xl font-black text-gray-900 mt-1 sm:mt-2 whitespace-nowrap">
                                            {item.currency}{item.price >= 1000 
                                                ? item.price.toLocaleString('ko-KR') 
                                                : item.price.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            }
                                        </div>

                                        {/* 등락폭 및 등락률 */}
                                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                                            <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                                                item.status === 'up' 
                                                    ? 'bg-red-50 text-red-600' 
                                                    : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                <span>{item.status === 'up' ? '▲' : '▼'}</span>
                                                <span>{Math.abs(item.change).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}</span>
                                                <span>({item.rate >= 0 ? '+' : ''}{item.rate.toFixed(2)}%)</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* 카드 하단 설명 및 갱신 시각 */}
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                                        <span className="truncate pr-1 text-slate-500" title={item.description}>
                                            {item.description || '글로벌 주요 지표'}
                                        </span>
                                        {item.updatedAt && (
                                            <span className="shrink-0 font-mono text-[9px] sm:text-[10px] text-slate-400 hidden sm:inline">{item.updatedAt}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 🌟 2. 금융 중간 스폰서 / 구글 애드센스 광고 슬롯 */}
                <BannerSlot slotKey="finance_middle" fallbackSlotKey="main_center" className="my-8" />

                {/* 🇰🇷 3. KR 국내 대표 기업 (블루 테마 차별화) */}
                {krStocks.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4 animate-fade-in-up animation-delay-150">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                    KRX
                                </span>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-gray-900">
                                        국내 대표 기업 <span className="text-xs sm:text-sm font-semibold text-slate-500">(KOSPI 200 대형주)</span>
                                    </h2>
                                    <p className="text-[11px] text-slate-400">대한민국 증시를 주도하는 핵심 블루칩 실시간 시세</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 font-mono bg-slate-100 px-2.5 py-1 rounded-lg hidden sm:inline-block">20분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {krStocks.map((stock, idx) => renderStockCard(stock, idx, 150, 'kr'))}
                        </div>
                    </div>
                )}

                {/* 🇺🇸 4. US 미국 빅테크 4대장 (로즈/퍼플 테마 차별화) */}
                {usStocks.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4 animate-fade-in-up animation-delay-250">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                    US
                                </span>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-gray-900">
                                        미국 빅테크 주도주 <span className="text-xs sm:text-sm font-semibold text-slate-500">(Global Tech Leaders)</span>
                                    </h2>
                                    <p className="text-[11px] text-slate-400">전 세계 인공지능과 혁신을 이끄는 매그니피센트 대표주</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 font-mono bg-slate-100 px-2.5 py-1 rounded-lg hidden sm:inline-block">15분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {usStocks.map((stock, idx) => renderStockCard(stock, idx, 250, 'us'))}
                        </div>
                    </div>
                )}

                {/* 뉴스 + 빠른 링크 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6 animate-fade-in-up animation-delay-350">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                <i className="fas fa-newspaper text-blue-500 mr-2"></i>
                                증시 뉴스
                            </h2>
                            <a href={`${MAIN_PORTAL_URL}/news?category=stock`} className="text-sm text-green-600 hover:text-green-700 font-medium">
                                더보기 <i className="fas fa-chevron-right text-xs"></i>
                            </a>
                        </div>
                        <div className="space-y-4">
                            {stockNews.length > 0 ? (
                                stockNews.map((news, idx) => (
                                    <a 
                                        key={news.id} 
                                        href={`${MAIN_PORTAL_URL}/news/${news.id}`} 
                                        style={{ animationDelay: `${idx * 80 + 350}ms` }}
                                        className="animate-fade-in-up block p-4 rounded-lg hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-100 group"
                                    >
                                        <div className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
                                            {decodeHtmlEntities(news.title)}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            {news.source && <span>{news.source}</span>}
                                            {news.source && <span>·</span>}
                                            <span>{getTimeAgo(news.published_at || news.created_at || '')}</span>
                                        </div>
                                    </a>
                                ))
                            ) : (
                                MOCK_FINANCE_NEWS.map((news, idx) => (
                                    <a 
                                        key={idx} 
                                        href={`${MAIN_PORTAL_URL}/news?category=stock`} 
                                        style={{ animationDelay: `${idx * 80 + 350}ms` }}
                                        className="animate-fade-in-up block p-4 rounded-lg hover:bg-gray-50 transition-all duration-300"
                                    >
                                        <div className="font-medium text-gray-900 mb-1 line-clamp-2">{news.title}</div>
                                        <div className="text-sm text-gray-500">{news.time}</div>
                                    </a>
                                ))
                            )}
                        </div>
                    </Card>
                    
                    <div className="grid grid-cols-2 gap-4 content-start">
                        <Link to="/exchange" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center border border-gray-100">
                            <i className="fas fa-exchange-alt text-3xl text-blue-600 mb-3"></i>
                            <div className="font-semibold text-gray-900">환율</div>
                        </Link>
                        <Link to="/banking" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center border border-gray-100">
                            <i className="fas fa-university text-3xl text-indigo-600 mb-3"></i>
                            <div className="font-semibold text-gray-900">은행</div>
                        </Link>
                        <button onClick={() => setShowCalculator(true)} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center w-full border border-gray-100">
                            <i className="fas fa-calculator text-3xl text-green-600 mb-3"></i>
                            <div className="font-semibold text-gray-900">수익률 계산기</div>
                        </button>
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center opacity-50 cursor-not-allowed border border-gray-100">
                            <i className="fas fa-robot text-3xl text-gray-400 mb-3"></i>
                            <div className="font-semibold text-gray-500">AI 브리핑</div>
                            <div className="text-xs text-gray-400 mt-1">준비중</div>
                        </div>
                    </div>
                </div>
            </main>

            <ProfitCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
