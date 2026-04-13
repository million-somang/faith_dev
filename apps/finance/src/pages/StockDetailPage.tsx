import { useState, useMemo, useEffect } from 'react';
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
import { MOCK_POPULAR_STOCKS, generateMockChartData } from '../data/mockData';
import type { ChartDataPoint } from '../data/mockData';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

type Tab = 'summary' | 'news' | 'discussion' | 'financial';

interface StockQuote {
    ticker: string;
    name: string;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    previousClose?: number;
    currency?: string;
    exchangeName?: string;
}

export default function StockDetailPage() {
    const { ticker } = useParams<{ ticker: string }>();
    const [activeTab, setActiveTab] = useState<Tab>('summary');
    const [showCalculator, setShowCalculator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);

    // Mock fallback 데이터
    const mockStock = MOCK_POPULAR_STOCKS.find((s) => s.ticker === ticker) || {
        rank: 0, ticker: ticker || '', name: ticker || '',
        price: 50000, change: 0, rate: 0, status: 'up' as const,
    };

    const [stock, setStock] = useState<StockQuote>({
        ticker: mockStock.ticker, name: mockStock.name,
        price: mockStock.price, change: mockStock.change,
        rate: mockStock.rate, status: mockStock.status,
    });

    const [chartData, setChartData] = useState<ChartDataPoint[]>(generateMockChartData(mockStock.price));

    // 실시간 시세 가져오기
    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/finance/quote/${ticker}`);
                if (res.ok) {
                    const data = await res.json();
                    setStock(data);
                }
            } catch (e) {
                console.warn('시세 조회 실패, Mock 사용:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [ticker]);

    // 차트 데이터 가져오기
    useEffect(() => {
        const fetchChart = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/finance/chart/${ticker}?range=1mo`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.length > 0) {
                        setChartData(data.data);
                    }
                }
            } catch (e) {
                console.warn('차트 데이터 조회 실패, Mock 사용:', e);
            } finally {
                setChartLoading(false);
            }
        };
        fetchChart();
    }, [ticker]);

    const chartConfig = {
        labels: chartData.map((d) => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [
            {
                label: '종가',
                data: chartData.map((d) => d.price),
                borderColor: stock.status === 'up' ? 'rgb(220, 38, 38)' : 'rgb(37, 99, 235)',
                backgroundColor: stock.status === 'up' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: stock.status === 'up' ? 'rgb(220, 38, 38)' : 'rgb(37, 99, 235)',
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
                    label: (context: { parsed: { y: number | null } }) => `₩${(context.parsed.y ?? 0).toLocaleString('ko-KR')}`,
                },
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: {
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: {
                    callback: (value: string | number) => `₩${Number(value).toLocaleString('ko-KR')}`,
                },
            },
        },
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'summary', label: '종합' },
        { key: 'news', label: '뉴스' },
        { key: 'discussion', label: '토론' },
        { key: 'financial', label: '재무' },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header baseUrl={MAIN_PORTAL_URL} />
            <FinanceSubMenu />

            {/* 브레드크럼 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-green-600 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link to="/" className="hover:text-green-600 transition-colors">금융</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-medium">{stock.name}</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                {/* 주식 헤더 */}
                <Card className={`p-6 mb-6 ${loading ? 'animate-pulse' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{stock.name}</h1>
                            <p className="text-gray-500">
                                {stock.ticker}
                                {stock.exchangeName && <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{stock.exchangeName}</span>}
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            <i className="far fa-star mr-1"></i>
                            관심종목
                        </button>
                    </div>
                    <div className="flex items-end gap-4">
                        <div className="stock-number text-4xl font-bold text-gray-900">
                            {stock.price.toLocaleString('ko-KR')}
                        </div>
                        <div className={`stock-number mb-2 ${stock.status === 'up' ? 'text-red-600' : 'text-blue-600'} font-semibold text-lg`}>
                            {stock.status === 'up' ? '▲' : '▼'} {Math.abs(stock.change).toLocaleString('ko-KR')}{' '}
                            ({stock.rate > 0 ? '+' : ''}{stock.rate.toFixed(2)}%)
                        </div>
                    </div>
                </Card>

                {/* 차트 영역 */}
                <Card className={`p-6 mb-6 ${chartLoading ? 'animate-pulse' : ''}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            <i className="fas fa-chart-area text-green-600 mr-2"></i>
                            가격 차트 (1개월)
                        </h2>
                    </div>
                    <div style={{ position: 'relative', height: '400px' }}>
                        <Line data={chartConfig} options={chartOptions} />
                    </div>
                </Card>

                {/* 탭 메뉴 */}
                <Card className="mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-8 px-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-6">
                        {activeTab === 'summary' && (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">기업 정보</h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: '현재가', value: stock.price.toLocaleString('ko-KR') },
                                                { label: '전일 종가', value: (stock.previousClose || stock.price - stock.change).toLocaleString('ko-KR') },
                                                { label: '등락', value: `${stock.change >= 0 ? '+' : ''}${stock.change.toLocaleString('ko-KR')}` },
                                                { label: '등락률', value: `${stock.rate >= 0 ? '+' : ''}${stock.rate.toFixed(2)}%` },
                                            ].map((item) => (
                                                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">{item.label}</span>
                                                    <span className="stock-number font-medium">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">차트 요약</h3>
                                        <div className="space-y-3">
                                            {(() => {
                                                const prices = chartData.map(d => d.price);
                                                const high = Math.max(...prices);
                                                const low = Math.min(...prices);
                                                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                                                return [
                                                    { label: '1개월 최고', value: high.toLocaleString('ko-KR') },
                                                    { label: '1개월 최저', value: low.toLocaleString('ko-KR') },
                                                    { label: '1개월 평균', value: Math.round(avg).toLocaleString('ko-KR') },
                                                    { label: '데이터 기간', value: `${chartData.length}일` },
                                                ];
                                            })().map((item) => (
                                                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">{item.label}</span>
                                                    <span className="stock-number font-medium">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">
                                                <i className="fas fa-calculator text-green-600 mr-2"></i>
                                                이 주식 수익률 계산해 보기
                                            </h4>
                                            <p className="text-sm text-gray-600">투자했다면 얼마를 벌었을까?</p>
                                        </div>
                                        <button
                                            onClick={() => setShowCalculator(true)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            계산하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'news' && (
                            <p className="text-gray-500 text-center py-8">관련 뉴스가 곧 공개될 예정입니다.</p>
                        )}
                        {activeTab === 'discussion' && (
                            <p className="text-gray-500 text-center py-8">토론 기능이 곧 공개될 예정입니다.</p>
                        )}
                        {activeTab === 'financial' && (
                            <p className="text-gray-500 text-center py-8">재무 정보가 곧 공개될 예정입니다.</p>
                        )}
                    </div>
                </Card>
            </main>

            <ProfitCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
