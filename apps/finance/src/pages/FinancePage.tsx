import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';
import ProfitCalculator from '../components/ProfitCalculator';
import SparklineChart from '../components/SparklineChart';
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

type CountryKey = 'us' | 'cn' | 'jp' | 'fr' | 'kr' | 'all';

const COUNTRY_TABS: { key: CountryKey; label: string; flag: string; countDesc: string }[] = [
    { key: 'us', label: '미국', flag: '🇺🇸', countDesc: '다우·S&P·나스닥·필라델피아' },
    { key: 'cn', label: '중국', flag: '🇨🇳', countDesc: '상해·항셍·심천' },
    { key: 'jp', label: '일본', flag: '🇯🇵', countDesc: '닛케이 225' },
    { key: 'fr', label: '프랑스', flag: '🇫🇷', countDesc: 'CAC 40·유로스톡스' },
    { key: 'kr', label: '한국', flag: '🇰🇷', countDesc: '코스피·코스닥·환율' },
    { key: 'all', label: '전체 지수', flag: '🌐', countDesc: '글로벌 전 지수' },
];

export default function FinancePage() {
    const { user, logout } = useAuth();
    const [showCalculator, setShowCalculator] = useState(false);
    const [indices, setIndices] = useState<IndexData[]>(MOCK_INDICES);
    const [selectedCountry, setSelectedCountry] = useState<CountryKey>('us');
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

    // 선택된 국가 지수 필터링
    const filteredIndices = selectedCountry === 'all'
        ? indices
        : indices.filter(idx => idx.country === selectedCountry);

    const renderStockCard = (stock: StockCard, idx: number = 0, baseDelay: number = 0) => (
        <Link
            key={stock.ticker}
            to={`/stock/${stock.ticker}`}
            style={{ animationDelay: `${baseDelay + idx * 80}ms` }}
            className="animate-fade-in-up bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group hover:-translate-y-1"
        >
            <div className="flex items-start justify-between mb-1">
                <div>
                    <div className="font-bold text-gray-900 text-base group-hover:text-green-700 transition-colors">{stock.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{stock.ticker}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    stock.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                    {stock.status === 'up' ? '▲' : '▼'} {Math.abs(stock.rate).toFixed(2)}%
                </span>
            </div>
            <div className="stock-number text-2xl font-extrabold text-gray-900 mt-2">
                {stock.currency}{stock.price.toLocaleString('ko-KR')}
            </div>
            <div className={`stock-number text-sm mt-1 ${stock.status === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.currency === '$' ? '$' : ''}{Math.abs(stock.change).toLocaleString('ko-KR')} ({stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%)
            </div>
            <div className="mt-3">
                <SparklineChart data={stock.sparkline} status={stock.status} width={160} height={40} />
            </div>
        </Link>
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header baseUrl={MAIN_PORTAL_URL} user={user} onLogout={logout} />
            <FinanceSubMenu />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
                {/* 🌟 글로벌 주요 국가 주식 지수 섹션 */}
                <section className="mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <i className="fas fa-globe-americas text-blue-600"></i>
                                <span>주요 국가 주식 지수</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                미국, 중국, 일본, 프랑스 등 주요국 대표 주가지수 실시간 시세
                            </p>
                        </div>

                        {/* 국가 선택 탭 바 */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto">
                            {COUNTRY_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setSelectedCountry(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                        selectedCountry === tab.key
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                >
                                    <span>{tab.flag}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 지수 카드 그리드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredIndices.map(index => (
                            <Card 
                                key={index.symbol || index.name} 
                                className={`animate-fade-in-up p-5 hover:shadow-md transition-all duration-300 border border-slate-200/80 bg-white rounded-2xl ${loading ? 'animate-pulse' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            {index.flag && <span className="text-base">{index.flag}</span>}
                                            <h3 className="text-sm font-bold text-gray-900">{index.name}</h3>
                                        </div>
                                        {index.description && (
                                            <p className="text-[10px] text-gray-400 mt-0.5">{index.description}</p>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                        index.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {index.status === 'up' ? '▲ 상승' : '▼ 하락'}
                                    </span>
                                </div>

                                <div className="stock-number text-2xl font-black text-gray-900 my-1">
                                    {index.value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {index.currency && (
                                        <span className="text-xs font-bold text-gray-400 ml-1">{index.currency}</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`stock-number font-extrabold ${index.status === 'up' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {index.status === 'up' ? '+' : ''}{index.change.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className={`stock-number font-bold text-[11px] ${index.status === 'up' ? 'text-red-600' : 'text-blue-600'}`}>
                                            ({index.rate > 0 ? '+' : ''}{index.rate.toFixed(2)}%)
                                        </span>
                                    </div>
                                    {index.updatedAt && (
                                        <span className="text-[10px] text-gray-400 font-mono">{index.updatedAt}</span>
                                    )}
                                </div>
                            </Card>
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

                {/* 거시 경제 지표 */}
                {macro.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4 animate-fade-in-up animation-delay-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="mr-2">🌍</span>거시 경제 지표
                            </h2>
                            <span className="text-xs text-gray-400">실시간</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {macro.map((item, idx) => (
                                <div 
                                    key={item.symbol} 
                                    style={{ animationDelay: `${idx * 80 + 100}ms` }}
                                    className="animate-fade-in-up bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                                        </div>
                                        <span className={`w-0 h-0 border-l-[5px] border-r-[5px] border-l-transparent border-r-transparent ${
                                            item.status === 'up'
                                                ? 'border-b-[6px] border-b-red-500'
                                                : 'border-t-[6px] border-t-blue-500'
                                        }`}></span>
                                    </div>
                                    <div className="stock-number text-xl font-extrabold text-gray-900">
                                        {item.currency}{item.price.toLocaleString('ko-KR')}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`stock-number text-sm ${item.status === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                                            {item.rate >= 0 ? '+' : ''}{item.rate.toFixed(2)}%
                                        </span>
                                        {item.updatedAt && (
                                            <span className="text-[10px] text-gray-400 font-mono">{item.updatedAt}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KR 국내 대표 기업 */}
                {krStocks.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4 animate-fade-in-up animation-delay-150">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="text-blue-600 font-mono text-sm mr-2 bg-blue-50 px-2 py-1 rounded">KR</span>
                                국내 대표 기업
                            </h2>
                            <span className="text-xs text-gray-400">20분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {krStocks.map((stock, idx) => renderStockCard(stock, idx, 150))}
                        </div>
                    </div>
                )}

                {/* US 미국 빅테크 4대장 */}
                {usStocks.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4 animate-fade-in-up animation-delay-250">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="text-red-600 font-mono text-sm mr-2 bg-red-50 px-2 py-1 rounded">US</span>
                                미국 빅테크 4대장
                            </h2>
                            <span className="text-xs text-gray-400">15분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {usStocks.map((stock, idx) => renderStockCard(stock, idx, 250))}
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
