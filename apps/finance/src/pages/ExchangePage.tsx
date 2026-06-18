import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

interface ExchangeRate {
    code: string;       // 'USD'
    name: string;       // '미국 달러'
    flag: string;       // '🇺🇸'
    unit: number;       // 1 (JPY는 100)
    price: number;      // unit당 원화 가격
    change: number;     // unit당 원화 변동
    rate: number;       // 등락률 %
    status: 'up' | 'down';
    updatedAt?: string;
}

// 실시간 데이터가 없어도 페이지가 비지 않도록 폴백을 둔다.
const MOCK_EXCHANGE: ExchangeRate[] = [
    { code: 'USD', name: '미국 달러', flag: '🇺🇸', unit: 1, price: 1305.5, change: 8.2, rate: 0.63, status: 'up' },
    { code: 'EUR', name: '유로', flag: '🇪🇺', unit: 1, price: 1412.3, change: -3.1, rate: -0.22, status: 'down' },
    { code: 'JPY', name: '일본 엔(100)', flag: '🇯🇵', unit: 100, price: 880.4, change: 2.5, rate: 0.28, status: 'up' },
    { code: 'CNY', name: '중국 위안', flag: '🇨🇳', unit: 1, price: 182.6, change: 0.4, rate: 0.22, status: 'up' },
    { code: 'GBP', name: '영국 파운드', flag: '🇬🇧', unit: 1, price: 1655.8, change: -5.2, rate: -0.31, status: 'down' },
    { code: 'AUD', name: '호주 달러', flag: '🇦🇺', unit: 1, price: 862.1, change: 1.3, rate: 0.15, status: 'up' },
];

const KRW = { code: 'KRW', name: '대한민국 원', flag: '🇰🇷' };

export default function ExchangePage() {
    const [rates, setRates] = useState<ExchangeRate[]>(MOCK_EXCHANGE);
    const [loading, setLoading] = useState(true);

    // 계산기 상태
    const [amount, setAmount] = useState('1');
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('KRW');

    useEffect(() => {
        let cancelled = false;
        fetch(`${API_BASE}/api/finance/exchange`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (!cancelled && Array.isArray(data) && data.length > 0) setRates(data);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const usd = rates.find((r) => r.code === 'USD');

    // 통화별 "1단위당 원화" 환산값 (KRW=1)
    const perUnitKRW = useMemo(() => {
        const map: Record<string, number> = { KRW: 1 };
        rates.forEach((r) => { map[r.code] = r.price / r.unit; });
        return map;
    }, [rates]);

    const currencyOptions = useMemo(
        () => [KRW, ...rates.map((r) => ({ code: r.code, name: r.name, flag: r.flag }))],
        [rates]
    );

    const converted = useMemo(() => {
        const amt = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(amt)) return null;
        const fromRate = perUnitKRW[from];
        const toRate = perUnitKRW[to];
        if (!fromRate || !toRate) return null;
        return (amt * fromRate) / toRate;
    }, [amount, from, to, perUnitKRW]);

    const swap = () => { setFrom(to); setTo(from); };

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
                        <span className="text-gray-900 font-medium">환율</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
                {/* 대표 환율(USD/KRW) 히어로 */}
                {usd && (
                    <Card className={`p-6 mb-8 ${loading ? 'animate-pulse' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <span className="text-2xl">{usd.flag}</span>
                                    <span className="font-medium">미국 달러 / 원 (USD/KRW)</span>
                                </div>
                                <div className="stock-number text-4xl font-bold text-gray-900">
                                    ₩{usd.price.toLocaleString('ko-KR')}
                                </div>
                                <div className={`stock-number text-sm mt-1 ${usd.status === 'up' ? 'text-red-600' : 'text-blue-600'}`}>
                                    {usd.status === 'up' ? '▲' : '▼'} {Math.abs(usd.change).toLocaleString('ko-KR')} ({usd.rate >= 0 ? '+' : ''}{usd.rate.toFixed(2)}%)
                                </div>
                            </div>
                            {usd.updatedAt && (
                                <span className="text-xs text-gray-400 self-start">{usd.updatedAt} 기준</span>
                            )}
                        </div>
                    </Card>
                )}

                {/* 주요 통화 환율 */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        <i className="fas fa-globe text-green-600 mr-2"></i>주요 통화 환율
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {rates.map((r) => (
                            <div key={r.code} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{r.flag}</span>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{r.code}</div>
                                            <div className="text-xs text-gray-400">{r.name}</div>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${r.status === 'up' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {r.rate >= 0 ? '+' : ''}{r.rate.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="stock-number text-2xl font-extrabold text-gray-900">
                                    ₩{r.price.toLocaleString('ko-KR')}
                                </div>
                                <div className={`stock-number text-sm mt-1 ${r.status === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                                    {r.status === 'up' ? '▲' : '▼'} {Math.abs(r.change).toLocaleString('ko-KR')}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 환율 계산기 */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        <i className="fas fa-calculator text-green-600 mr-2"></i>환율 계산기
                    </h2>
                    <Card className="p-6">
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                            {/* 보내는 통화 */}
                            <div className="flex-1">
                                <label className="block text-sm text-gray-500 mb-1">변환할 금액</label>
                                <div className="flex gap-2">
                                    <input
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        inputMode="decimal"
                                        className="stock-number flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-right text-lg"
                                    />
                                    <select
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 bg-white"
                                    >
                                        {currencyOptions.map((c) => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 스왑 버튼 */}
                            <button
                                type="button"
                                onClick={swap}
                                aria-label="통화 교환"
                                className="self-center md:self-end w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 transition-colors"
                            >
                                <i className="fas fa-right-left"></i>
                            </button>

                            {/* 받는 통화 */}
                            <div className="flex-1">
                                <label className="block text-sm text-gray-500 mb-1">변환 결과</label>
                                <div className="flex gap-2">
                                    <div className="stock-number flex-1 px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-right text-lg font-bold text-gray-900 overflow-x-auto whitespace-nowrap">
                                        {converted === null
                                            ? '-'
                                            : converted.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                                    </div>
                                    <select
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 bg-white"
                                    >
                                        {currencyOptions.map((c) => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-4">
                            * 실시간 시장 환율 기준이며, 실제 은행 환전 시 우대율·수수료에 따라 차이가 있을 수 있습니다.
                        </p>
                    </Card>
                </section>
            </main>

            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
