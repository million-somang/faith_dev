import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';
import ProfitCalculator from '../components/ProfitCalculator';
import SparklineChart from '../components/SparklineChart';
import { MOCK_INDICES, MOCK_FINANCE_NEWS } from '../data/mockData';
import type { MarketIndex } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

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

export default function FinancePage() {
    const { user, logout } = useAuth();
    const [showCalculator, setShowCalculator] = useState(false);
    const [indices, setIndices] = useState<IndexData[]>(MOCK_INDICES);
    const [krStocks, setKrStocks] = useState<StockCard[]>([]);
    const [usStocks, setUsStocks] = useState<StockCard[]>([]);
    const [macro, setMacro] = useState<MacroIndicator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [indicesRes, krRes, usRes, macroRes] = await Promise.all([
                    fetch(`${API_BASE}/api/finance/indices`),
                    fetch(`${API_BASE}/api/finance/kr-stocks`),
                    fetch(`${API_BASE}/api/finance/us-stocks`),
                    fetch(`${API_BASE}/api/finance/macro`),
                ]);
                
                if (indicesRes.ok) {
                    const data = await indicesRes.json();
                    if (data.length > 0) setIndices(data);
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

    const renderStockCard = (stock: StockCard) => (
        <Link
            key={stock.ticker}
            to={`/stock/${stock.ticker}`}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all group"
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

            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                {/* 주요 지수 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    {indices.map((index) => (
                        <Card key={index.name} className={`p-6 hover:shadow-md transition-shadow ${loading ? 'animate-pulse' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-600">{index.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    index.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {index.status === 'up' ? '상승' : '하락'}
                                </span>
                            </div>
                            <div className="stock-number text-2xl font-bold text-gray-900 mb-1">
                                {index.value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`stock-number ${index.status === 'up' ? 'text-red-600' : 'text-blue-600'} font-medium`}>
                                        {index.status === 'up' ? '▲' : '▼'} {Math.abs(index.change).toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className={`stock-number ${index.status === 'up' ? 'text-red-600' : 'text-blue-600'} text-sm`}>
                                        {index.rate > 0 ? '+' : ''}{index.rate.toFixed(2)}%
                                    </span>
                                </div>
                                {index.updatedAt && (
                                    <span className="text-[10px] text-gray-400 font-mono">{index.updatedAt}</span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* 거시 경제 지표 */}
                {macro.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="mr-2">🌍</span>거시 경제 지표
                            </h2>
                            <span className="text-xs text-gray-400">실시간</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {macro.map((item) => (
                                <div key={item.symbol} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="text-blue-600 font-mono text-sm mr-2 bg-blue-50 px-2 py-1 rounded">KR</span>
                                국내 대표 기업
                            </h2>
                            <span className="text-xs text-gray-400">20분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {krStocks.map(renderStockCard)}
                        </div>
                    </div>
                )}

                {/* US 미국 빅테크 4대장 */}
                {usStocks.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="text-red-600 font-mono text-sm mr-2 bg-red-50 px-2 py-1 rounded">US</span>
                                미국 빅테크 4대장
                            </h2>
                            <span className="text-xs text-gray-400">15분 지연 시세</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {usStocks.map(renderStockCard)}
                        </div>
                    </div>
                )}

                {/* 뉴스 + 빠른 링크 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                <i className="fas fa-newspaper text-blue-500 mr-2"></i>
                                증시 뉴스
                            </h2>
                            <a href={`${MAIN_PORTAL_URL}/news`} className="text-sm text-green-600 hover:text-green-700 font-medium">
                                더보기 <i className="fas fa-chevron-right text-xs"></i>
                            </a>
                        </div>
                        <div className="space-y-4">
                            {MOCK_FINANCE_NEWS.map((news, idx) => (
                                <a key={idx} href="#" className="block p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="font-medium text-gray-900 mb-1 line-clamp-2">{news.title}</div>
                                    <div className="text-sm text-gray-500">{news.time}</div>
                                </a>
                            ))}
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
