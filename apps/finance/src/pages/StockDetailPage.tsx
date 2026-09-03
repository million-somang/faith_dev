import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import FinanceSubMenu from '../components/FinanceSubMenu';
import ProfitCalculator from '../components/ProfitCalculator';
import BannerSlot from '../components/BannerSlot';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../hooks/useAuth';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

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
    rivals: { ticker: string; name: string; price: number; rate: number; marketCap: string; per: number }[];
    financials: {
        annual: { year: string; revenue: string; opIncome: string; netIncome: string; opMargin: string; roe: string }[];
        quarterly: { quarter: string; revenue: string; opIncome: string; netIncome: string; opMargin: string }[];
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
    const { ticker } = useParams<{ ticker: string }>();
    const { user, logout } = useAuth();
    const { isFavorite, toggle } = useFavorites();

    const [activeTab, setActiveTab] = useState<Tab>('summary');
    const [selectedRange, setSelectedRange] = useState<ChartRange>('1mo');
    const [showCalculator, setShowCalculator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);

    const [stock, setStock] = useState<StockDetailData | null>(null);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);

    // 0. 상세 페이지 진입 및 종목 변경 시 화면 최상단으로 스크롤 이동
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [ticker]);

    // 1. 종목 상세 종합 데이터 가져오기
    useEffect(() => {
        if (!ticker) return;
        setLoading(true);
        fetch(`${API_BASE}/api/finance/stock-detail/${ticker}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) setStock(data);
            })
            .catch((e) => console.warn('종목 상세 로드 실패:', e))
            .finally(() => setLoading(false));
    }, [ticker]);

    // 2. 멀티 타임프레임 차트 데이터 가져오기
    useEffect(() => {
        if (!ticker) return;
        setChartLoading(true);
        fetch(`${API_BASE}/api/finance/chart/${ticker}?range=${selectedRange}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => {
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    setChartData(res.data);
                } else {
                    // 데이터가 비어있을 경우 대체 포인트 생성
                    generateFallbackChart(stock?.price || 50000, selectedRange);
                }
            })
            .catch((e) => {
                console.warn('차트 로드 실패:', e);
                generateFallbackChart(stock?.price || 50000, selectedRange);
            })
            .finally(() => setChartLoading(false));
    }, [ticker, selectedRange, stock?.price]);

    // 차트 대체 시계열 생성 함수
    const generateFallbackChart = (basePrice: number, range: ChartRange) => {
        const pointsCount = range === '1d' ? 12 : range === '1w' ? 7 : range === '1mo' ? 22 : range === '3mo' ? 30 : 40;
        const generated: ChartPoint[] = [];
        const now = new Date();
        let current = basePrice * 0.96;
        for (let i = pointsCount; i >= 0; i--) {
            const d = new Date(now);
            if (range === '1d') {
                d.setMinutes(d.getMinutes() - i * 30);
                const dateStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                current += (Math.random() - 0.48) * (basePrice * 0.008);
                generated.push({ date: dateStr, price: Math.round(current) });
            } else {
                d.setDate(d.getDate() - i * (range === '1w' ? 1 : range === '1mo' ? 1 : range === '3mo' ? 3 : 7));
                const dateStr = d.toISOString().split('T')[0];
                current += (Math.random() - 0.48) * (basePrice * 0.015);
                generated.push({ date: dateStr, price: Math.round(current) });
            }
        }
        if (generated.length > 0) {
            generated[generated.length - 1].price = basePrice;
            setChartData(generated);
        }
    };

    // 3. 종목 실시간 뉴스 가져오기
    useEffect(() => {
        if (!ticker) return;
        fetch(`${API_BASE}/api/finance/stock-news/${ticker}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setNews(Array.isArray(data) ? data : []))
            .catch(() => setNews([]));
    }, [ticker]);


    const isFav = ticker ? isFavorite(ticker) : false;

    // 차트 설정
    const chartConfig = {
        labels: chartData.map((d) => {
            if (selectedRange === '1d') return d.date;
            const parts = d.date.split('-');
            return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d.date;
        }),
        datasets: [
            {
                label: '종가',
                data: chartData.map((d) => d.price),
                borderColor: stock?.status === 'up' ? 'rgb(220, 38, 38)' : 'rgb(37, 99, 235)',
                backgroundColor: stock?.status === 'up' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(37, 99, 235, 0.08)',
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: stock?.status === 'up' ? 'rgb(220, 38, 38)' : 'rgb(37, 99, 235)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: (context: { parsed: { y: number | null } }) => 
                        `${stock?.currency || '₩'}${(context.parsed.y ?? 0).toLocaleString('ko-KR')}`,
                },
            },
        },
        scales: {
            x: { 
                grid: { display: false },
                ticks: { maxTicksLimit: 8, font: { size: 11 } }
            },
            y: {
                grid: { color: 'rgba(0, 0, 0, 0.04)' },
                ticks: {
                    callback: (value: string | number) => `${stock?.currency || '₩'}${Number(value).toLocaleString('ko-KR')}`,
                    font: { size: 11 }
                },
            },
        },
    };

    const chartStats = (() => {
        if (chartData.length === 0) return null;
        const prices = chartData.map(d => d.price);
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
                        <Link to="/stocks" className="hover:text-blue-600 transition-colors">종목</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-bold">{stock?.name || ticker}</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full">
                
                {/* 🌟 1. 종목 시세 헤더 & 52주 레인지 게이지 카드 */}
                <div className={`bg-white rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm mb-6 ${loading ? 'animate-pulse' : ''}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
                        {/* 좌측: 종목명, 시장태그, 실시간 가격 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h1 className="text-xl sm:text-3xl font-black text-gray-900 truncate" title={stock?.name || ticker}>
                                    {stock?.name || ticker}
                                </h1>
                                <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg font-mono shrink-0 ${
                                    stock?.market === 'KRX' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                    {stock?.market || 'KRX'}: {stock?.ticker || ticker}
                                </span>
                                {stock?.sector && (
                                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                                        {stock.sector}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-mono mb-3 sm:mb-4 truncate">{stock?.englishName}</p>

                            {/* 현재가 및 등락폭 */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <div className="stock-number text-2xl sm:text-4xl font-black text-gray-900 whitespace-nowrap">
                                    {stock?.currency}{stock?.price.toLocaleString('ko-KR')}
                                </div>
                                <div className={`inline-flex items-center gap-0.5 sm:gap-1 text-xs sm:text-lg font-extrabold stock-number px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl whitespace-nowrap ${
                                    stock?.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    <span>{stock?.status === 'up' ? '▲' : '▼'}</span>
                                    <span>{Math.abs(stock?.change || 0).toLocaleString('ko-KR')}</span>
                                    <span>({(stock?.rate || 0) >= 0 ? '+' : ''}{(stock?.rate || 0).toFixed(2)}%)</span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-slate-400 font-mono hidden sm:inline self-center">
                                    {stock?.market === 'KRX' ? '20분 지연' : '15분 지연'}
                                </span>
                            </div>

                            {/* 당일 시가/고가/저가 요약 칩 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 text-xs">
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px]">전일종가</span>
                                    <span className="font-bold text-slate-800 stock-number whitespace-nowrap">{stock?.currency}{stock?.previousClose.toLocaleString('ko-KR')}</span>
                                </div>
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px]">시가</span>
                                    <span className="font-bold text-slate-800 stock-number whitespace-nowrap">{stock?.currency}{stock?.open.toLocaleString('ko-KR')}</span>
                                </div>
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px]">고가 (당일최고)</span>
                                    <span className="font-bold text-red-600 stock-number whitespace-nowrap">{stock?.currency}{stock?.high.toLocaleString('ko-KR')}</span>
                                </div>
                                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] sm:text-[11px]">저가 (당일최저)</span>
                                    <span className="font-bold text-blue-600 stock-number whitespace-nowrap">{stock?.currency}{stock?.low.toLocaleString('ko-KR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 우측: 52주 최고/최저가 게이지 & 관심종목 버튼 */}
                        <div className="w-full lg:w-80 bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                                <span className="text-xs font-bold text-slate-700">52주 가격 밴드</span>
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

                            {/* 52주 프로그레스 게이지 */}
                            <div className="my-1 sm:my-2">
                                <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono mb-1">
                                    <span>최저 {stock?.currency}{(stock?.low52 || 0).toLocaleString('ko-KR')}</span>
                                    <span>최고 {stock?.currency}{(stock?.high52 || 0).toLocaleString('ko-KR')}</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-red-500 rounded-full transition-all duration-500"
                                        style={{ width: `${stock?.rangePercent || 50}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-[10px] sm:text-[11px] font-bold text-slate-600 mt-1">
                                    52주 밴드 내 위치: <span className="text-blue-600 font-mono">{stock?.rangePercent || 50}%</span>
                                </div>
                            </div>

                            <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-200/80 space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 shrink-0">시가총액</span>
                                    <span className="font-bold text-slate-900 text-right truncate ml-2">
                                        {stock?.marketCap || '산출 중'}{stock?.marketCapRank ? ` (${stock.marketCapRank})` : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 shrink-0">외국인 지분율</span>
                                    <span className="font-bold text-slate-900 font-mono text-right">
                                        {stock?.foreignRate || '32.5%'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* 📈 2. 멀티 타임프레임 인터랙티브 차트 */}
                <div className={`bg-white rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm mb-6 ${chartLoading ? 'animate-pulse' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📈</span>
                            <h2 className="text-base sm:text-xl font-black text-gray-900">
                                기간별 시세 차트
                            </h2>
                            <span className="text-xs text-slate-400 font-mono">
                                ({CHART_RANGES.find(r => r.key === selectedRange)?.label})
                            </span>
                        </div>

                        {/* 기간 선택 탭 버튼 (1일, 1주일, 1개월, 3개월, 1년, 3년) */}
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
                                                ? 'bg-slate-900 text-white shadow-sm font-black scale-[1.02]'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative h-[260px] sm:h-[380px]">
                        {chartData.length > 0 ? (
                            <Line data={chartConfig} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                차트 데이터를 불러오는 중입니다…
                            </div>
                        )}
                    </div>

                    {/* 기간 차트 요약 통계 */}
                    {chartStats && (
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 text-center text-xs">
                            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px] sm:text-[11px]">기간 최고가</span>
                                <span className="font-extrabold text-red-600 stock-number whitespace-nowrap">{stock?.currency}{chartStats.high.toLocaleString('ko-KR')}</span>
                            </div>
                            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px] sm:text-[11px]">기간 최저가</span>
                                <span className="font-extrabold text-blue-600 stock-number whitespace-nowrap">{stock?.currency}{chartStats.low.toLocaleString('ko-KR')}</span>
                            </div>
                            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px] sm:text-[11px]">기간 평균가</span>
                                <span className="font-extrabold text-slate-800 stock-number whitespace-nowrap">{stock?.currency}{chartStats.avg.toLocaleString('ko-KR')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🌟 중간 광고 & 스폰서 배너 슬롯 */}
                <BannerSlot slotKey="finance_detail_middle" fallbackSlotKey="main_center" className="my-8" />

                {/* 📑 3. 3대 상세 정보 탭 시스템 */}
                <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    {/* 탭 네비게이션 */}
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
                        
                        {/* 📑 탭 1: 종합 정보 (밸류에이션, 기업개요, 라이벌 비교, 계산기) */}
                        {activeTab === 'summary' && stock && (
                            <div className="space-y-6 sm:space-y-8 animate-fade-in">
                                
                                {/* 💎 6대 핵심 밸류에이션 지표 */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                                        <span>💎</span>
                                        <span>핵심 투자 밸류에이션 지표</span>
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block">PER (주가수익)</span>
                                            <span className="text-base sm:text-lg font-black text-slate-900 stock-number whitespace-nowrap">{stock.per}배</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">업종평균 18.2배</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block">PBR (주가순자산)</span>
                                            <span className="text-base sm:text-lg font-black text-slate-900 stock-number whitespace-nowrap">{stock.pbr}배</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">{stock.pbr < 1 ? '저PBR 수혜' : '적정 자산가치'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block">ROE (자기자본)</span>
                                            <span className="text-base sm:text-lg font-black text-emerald-600 stock-number whitespace-nowrap">{stock.roe}%</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">수익성 우수</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block">EPS (주당순이익)</span>
                                            <span className="text-base sm:text-lg font-black text-slate-900 stock-number whitespace-nowrap">{stock.currency}{stock.eps.toLocaleString('ko-KR')}</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">1주당 이익</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block">BPS (주당순자산)</span>
                                            <span className="text-base sm:text-lg font-black text-slate-900 stock-number whitespace-nowrap">{stock.currency}{stock.bps.toLocaleString('ko-KR')}</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">청산가치 기준</span>
                                        </div>
                                        <div className="bg-amber-50/70 p-3 sm:p-4 rounded-2xl border border-amber-200/80 text-center">
                                            <span className="text-[10px] sm:text-[11px] text-amber-700 font-bold block">배당수익률</span>
                                            <span className="text-base sm:text-lg font-black text-amber-700 stock-number whitespace-nowrap">{stock.dividendYield}%</span>
                                            <span className="text-[9px] sm:text-[10px] text-amber-600 block mt-0.5 whitespace-nowrap">주당 {stock.currency}{stock.dividendPerShare.toLocaleString('ko-KR')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 🏢 기업 개요 & 비즈니스 요약 */}
                                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                                        <span>🏢</span>
                                        <span>기업 개요 및 주요 사업 모델</span>
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3 sm:mb-4">
                                        {stock.summary}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs pt-3 border-t border-slate-200/60">
                                        <div><span className="text-slate-400">주력 제품: </span><span className="font-semibold text-slate-800">{stock.products}</span></div>
                                        <div><span className="text-slate-400">대표이사: </span><span className="font-semibold text-slate-800">{stock.ceo}</span></div>
                                        <div><span className="text-slate-400">설립연도: </span><span className="font-semibold text-slate-800">{stock.establishedYear}</span></div>
                                        <div><span className="text-slate-400">본사위치: </span><span className="font-semibold text-slate-800 truncate block" title={stock.headquarters}>{stock.headquarters}</span></div>
                                    </div>
                                </div>

                                {/* ⚔️ 동일 업종 라이벌 비교 */}
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
                                                <tr className="bg-blue-50/40 font-bold">
                                                    <td className="p-3 text-blue-700">{stock.name} (현재종목)</td>
                                                    <td className="p-3 text-right stock-number whitespace-nowrap">{stock.currency}{stock.price.toLocaleString('ko-KR')}</td>
                                                    <td className="p-3 text-right stock-number text-red-600 whitespace-nowrap">{stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%</td>
                                                    <td className="p-3 text-right whitespace-nowrap">{stock.marketCap}</td>
                                                    <td className="p-3 text-right whitespace-nowrap">{stock.per}배</td>
                                                </tr>
                                                {stock.rivals.map((rival) => (
                                                    <tr key={rival.ticker} className="hover:bg-slate-50">
                                                        <td className="p-3 font-semibold text-slate-800">
                                                            <Link to={`/stock/${rival.ticker}`} className="hover:text-blue-600 transition-colors">
                                                                {rival.name} <span className="text-[10px] text-slate-400 font-mono">({rival.ticker})</span>
                                                            </Link>
                                                        </td>
                                                        <td className="p-3 text-right stock-number whitespace-nowrap">{rival.price.toLocaleString('ko-KR')}</td>
                                                        <td className={`p-3 text-right stock-number whitespace-nowrap ${rival.rate >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                            {rival.rate >= 0 ? '+' : ''}{rival.rate.toFixed(2)}%
                                                        </td>
                                                        <td className="p-3 text-right text-slate-600 whitespace-nowrap">{rival.marketCap}</td>
                                                        <td className="p-3 text-right text-slate-600 whitespace-nowrap">{rival.per}배</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* 🧮 투자 수익률 & 배당 계산기 배너 */}
                                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base sm:text-lg font-bold shrink-0">
                                            🧮
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-xs sm:text-sm">{stock.name} 수익률 & 배당 시뮬레이터</h4>
                                            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">매수 목표가 대비 예상 수익률 및 연간 세후 배당금을 즉시 계산해보세요.</p>
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
                                            to="/util?tab=dividend"
                                            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl transition-all shadow-xs text-center whitespace-nowrap"
                                        >
                                            배당금 계산
                                        </Link>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* 📊 탭 2: 기업 재무 분석 (연간 3개년 + 분기 실적 요약) */}
                        {activeTab === 'financial' && stock && (
                            <div className="space-y-6 sm:space-y-8 animate-fade-in">
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
                                                    {stock.financials.annual.map(a => (
                                                        <th key={a.year} className="p-3 sm:p-3.5 text-right font-mono">{a.year}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900">매출액</td>
                                                    {stock.financials.annual.map(a => <td key={a.year} className="p-3 sm:p-3.5 text-right font-black stock-number whitespace-nowrap">{a.revenue}</td>)}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900">영업이익</td>
                                                    {stock.financials.annual.map(a => <td key={a.year} className="p-3 sm:p-3.5 text-right font-black stock-number text-blue-600 whitespace-nowrap">{a.opIncome}</td>)}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900">당기순이익</td>
                                                    {stock.financials.annual.map(a => <td key={a.year} className="p-3 sm:p-3.5 text-right font-black stock-number whitespace-nowrap">{a.netIncome}</td>)}
                                                </tr>
                                                <tr className="bg-slate-50/60">
                                                    <td className="p-3 sm:p-3.5 font-semibold text-slate-600">영업이익률</td>
                                                    {stock.financials.annual.map(a => <td key={a.year} className="p-3 sm:p-3.5 text-right font-semibold stock-number whitespace-nowrap">{a.opMargin}</td>)}
                                                </tr>
                                                <tr className="bg-slate-50/60">
                                                    <td className="p-3 sm:p-3.5 font-semibold text-slate-600">ROE (자기자본이익률)</td>
                                                    {stock.financials.annual.map(a => <td key={a.year} className="p-3 sm:p-3.5 text-right font-semibold stock-number text-emerald-600 whitespace-nowrap">{a.roe}</td>)}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
                                        <span>📅</span>
                                        <span>최근 4분기 분기별 실적 추이</span>
                                    </h3>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                        <table className="w-full text-left text-xs sm:text-sm min-w-[460px]">
                                            <thead className="bg-slate-100 text-slate-700 font-bold">
                                                <tr>
                                                    <th className="p-3 sm:p-3.5">주요 재무 항목</th>
                                                    {stock.financials.quarterly.map(q => (
                                                        <th key={q.quarter} className="p-3 sm:p-3.5 text-right font-mono">{q.quarter}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900">매출액</td>
                                                    {stock.financials.quarterly.map(q => <td key={q.quarter} className="p-3 sm:p-3.5 text-right font-black stock-number whitespace-nowrap">{q.revenue}</td>)}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900">영업이익</td>
                                                    {stock.financials.quarterly.map(q => <td key={q.quarter} className="p-3 sm:p-3.5 text-right font-black stock-number text-blue-600 whitespace-nowrap">{q.opIncome}</td>)}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 sm:p-3.5 font-bold text-slate-900">당기순이익</td>
                                                    {stock.financials.quarterly.map(q => <td key={q.quarter} className="p-3 sm:p-3.5 text-right font-black stock-number whitespace-nowrap">{q.netIncome}</td>)}
                                                </tr>
                                                <tr className="bg-slate-50/60">
                                                    <td className="p-3 sm:p-3.5 font-semibold text-slate-600">영업이익률</td>
                                                    {stock.financials.quarterly.map(q => <td key={q.quarter} className="p-3 sm:p-3.5 text-right font-semibold stock-number whitespace-nowrap">{q.opMargin}</td>)}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* 📰 탭 3: 관련 뉴스 피드 */}
                        {activeTab === 'news' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <span>📰</span>
                                        <span>{stock?.name || ticker} 실시간 관련 뉴스</span>
                                    </h3>
                                    <a
                                        href={`https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(stock?.name || ticker || '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <span>포털 뉴스 더보기</span>
                                        <i className="fas fa-external-link-alt text-[10px]"></i>
                                    </a>
                                </div>

                                {news.map((item) => (
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
                                            <span className="font-bold text-slate-700">{item.source}</span>
                                            <span>·</span>
                                            <span>{item.time}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}

                    </div>
                </Card>

            </main>

            <ProfitCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
