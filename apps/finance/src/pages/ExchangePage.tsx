import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';
import { useAuth } from '../hooks/useAuth';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

interface ExchangeRate {
    code: string;       // 'USD'
    name: string;       // '미국 달러'
    flag: string;       // '🇺🇸'
    unit: number;       // 1 (JPY는 100)
    price: number;      // unit당 원화 매매기준율
    change: number;     // unit당 원화 변동
    rate: number;       // 등락률 %
    status: 'up' | 'down';
    dayHigh?: number;
    dayLow?: number;
    cashBuy?: number;
    cashSell?: number;
    sendRemit?: number;
    receiveRemit?: number;
    updatedAt?: string;
}

// 초기 로딩용 폴백 데이터 (8대 기축/인기 통화)
const INITIAL_EXCHANGE: ExchangeRate[] = [
    { code: 'USD', name: '미국 달러', flag: '🇺🇸', unit: 1, price: 1305.5, change: 8.2, rate: 0.63, status: 'up', dayHigh: 1310.2, dayLow: 1301.8, cashBuy: 1328.35, cashSell: 1282.65, sendRemit: 1318.55, receiveRemit: 1292.45, updatedAt: '실시간' },
    { code: 'JPY', name: '일본 엔(100)', flag: '🇯🇵', unit: 100, price: 880.4, change: 2.5, rate: 0.28, status: 'up', dayHigh: 884.2, dayLow: 878.1, cashBuy: 895.8, cashSell: 865.0, sendRemit: 889.2, receiveRemit: 871.6, updatedAt: '실시간' },
    { code: 'EUR', name: '유로', flag: '🇪🇺', unit: 1, price: 1412.3, change: -3.1, rate: -0.22, status: 'down', dayHigh: 1418.0, dayLow: 1409.5, cashBuy: 1437.0, cashSell: 1387.6, sendRemit: 1426.4, receiveRemit: 1398.2, updatedAt: '실시간' },
    { code: 'CNY', name: '중국 위안', flag: '🇨🇳', unit: 1, price: 182.6, change: 0.4, rate: 0.22, status: 'up', dayHigh: 183.5, dayLow: 181.9, cashBuy: 191.7, cashSell: 171.6, sendRemit: 184.4, receiveRemit: 180.8, updatedAt: '실시간' },
    { code: 'GBP', name: '영국 파운드', flag: '🇬🇧', unit: 1, price: 1655.8, change: -5.2, rate: -0.31, status: 'down', dayHigh: 1664.2, dayLow: 1651.0, cashBuy: 1688.9, cashSell: 1622.7, sendRemit: 1672.4, receiveRemit: 1639.2, updatedAt: '실시간' },
    { code: 'AUD', name: '호주 달러', flag: '🇦🇺', unit: 1, price: 862.1, change: 1.3, rate: 0.15, status: 'up', dayHigh: 865.8, dayLow: 859.4, cashBuy: 879.3, cashSell: 844.9, sendRemit: 870.7, receiveRemit: 853.5, updatedAt: '실시간' },
    { code: 'CAD', name: '캐나다 달러', flag: '🇨🇦', unit: 1, price: 955.2, change: 2.1, rate: 0.22, status: 'up', dayHigh: 958.4, dayLow: 951.8, cashBuy: 974.3, cashSell: 936.1, sendRemit: 964.8, receiveRemit: 945.6, updatedAt: '실시간' },
    { code: 'CHF', name: '스위스 프랑', flag: '🇨🇭', unit: 1, price: 1488.6, change: -2.8, rate: -0.19, status: 'down', dayHigh: 1494.0, dayLow: 1483.5, cashBuy: 1518.4, cashSell: 1458.8, sendRemit: 1503.5, receiveRemit: 1473.7, updatedAt: '실시간' },
];

const KRW = { code: 'KRW', name: '대한민국 원', flag: '🇰🇷', unit: 1 };

export default function ExchangePage() {
    const { user, logout } = useAuth();
    const [rates, setRates] = useState<ExchangeRate[]>(INITIAL_EXCHANGE);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<string>('');

    // 환전 계산기 상태
    const [amount, setAmount] = useState('1000');
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('KRW');
    const [isRotating, setIsRotating] = useState(false);
    const converterRef = useRef<HTMLDivElement>(null);

    // 실시간 환율 API 호출
    const fetchRates = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/finance/exchange`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setRates(data);
                    setLastRefreshed(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRates();
        const timer = setInterval(fetchRates, 60000); // 1분 자동 갱신
        return () => clearInterval(timer);
    }, []);

    // 대표 통화 (USD)
    const usd = useMemo(() => rates.find((r) => r.code === 'USD') || rates[0], [rates]);

    // 통화별 1단위당 원화 가치 매핑 (KRW=1)
    const perUnitKRW = useMemo(() => {
        const map: Record<string, number> = { KRW: 1 };
        rates.forEach((r) => { map[r.code] = r.price / r.unit; });
        return map;
    }, [rates]);

    // 환전 셀렉트용 통화 목록
    const currencyOptions = useMemo(
        () => [KRW, ...rates.map((r) => ({ code: r.code, name: r.name, flag: r.flag, unit: r.unit }))],
        [rates]
    );

    // 실시간 환전 계산
    const converted = useMemo(() => {
        const cleanAmt = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(cleanAmt) || cleanAmt < 0) return null;
        const fromRate = perUnitKRW[from];
        const toRate = perUnitKRW[to];
        if (!fromRate || !toRate) return null;
        return (cleanAmt * fromRate) / toRate;
    }, [amount, from, to, perUnitKRW]);

    // 통화 스왑
    const handleSwap = () => {
        setIsRotating(true);
        setTimeout(() => setIsRotating(false), 300);
        setFrom(to);
        setTo(from);
    };

    // 빠른 금액 추가 프리셋
    const addPreset = (val: number) => {
        const cur = parseFloat(amount.replace(/,/g, '')) || 0;
        setAmount(String(Math.round(cur + val)));
    };

    // 카드에서 바로 계산기로 설정
    const selectCurrencyForCalc = (code: string) => {
        if (code === 'KRW') {
            setFrom('USD');
            setTo('KRW');
        } else {
            setFrom(code);
            setTo('KRW');
        }
        if (converterRef.current) {
            converterRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // USD 레인지 바 퍼센트 계산
    const usdRangePercent = useMemo(() => {
        if (!usd || !usd.dayHigh || !usd.dayLow || usd.dayHigh === usd.dayLow) return 50;
        const pct = ((usd.price - usd.dayLow) / (usd.dayHigh - usd.dayLow)) * 100;
        return Math.min(100, Math.max(0, Math.round(pct)));
    }, [usd]);

    return (
        <div className="flex flex-col min-h-screen nm-bg-main text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
            <Header baseUrl={MAIN_PORTAL_URL} user={user} onLogout={logout} />
            <FinanceSubMenu />

            {/* 상단 브레드크럼 & 실시간 고시 상태 */}
            <div className="border-b border-slate-200/60 bg-[#eef3f8]/80 backdrop-blur-xs">
                <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="hover:text-indigo-600 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
                        <Link to="/finance" className="hover:text-indigo-600 transition-colors">금융</Link>
                        <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
                        <span className="text-slate-900 font-bold">실시간 환율</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                            {lastRefreshed ? `${lastRefreshed} 갱신` : '외환시장 실시간'}
                        </span>
                        <button
                            type="button"
                            onClick={fetchRates}
                            title="새로고침"
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors ml-1"
                        >
                            <i className={`fas fa-rotate-right ${loading ? 'animate-spin' : ''}`}></i>
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-4 py-6 sm:py-10 w-full space-y-8 sm:space-y-12">
                
                {/* 1. 페이지 헤더 타이틀 */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/80 mb-2 shadow-xs">
                            <i className="fas fa-globe-americas text-indigo-500"></i>
                            <span>글로벌 실시간 외환 시장</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            환율 정보 및 스마트 환전소
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            주요 8대 기축 통화의 실시간 매매기준율과 현찰·송금 우대 환율을 한눈에 비교하고 계산하세요.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                        <span className="nm-pill px-3 py-1 text-slate-600 font-medium">
                            <i className="far fa-clock text-slate-400 mr-1.5"></i>매매기준율 기준
                        </span>
                    </div>
                </div>

                {/* 2. [HERO] USD/KRW 대표 환율 뉴모피즘 모니터 카드 */}
                {usd && (
                    <section className="nm-card p-5 sm:p-7 relative overflow-hidden transition-all duration-300">
                        {/* 상단 장식 빛 반사 */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-200/20 via-transparent to-transparent rounded-full pointer-events-none -mr-20 -mt-20"></div>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                            {/* 좌측: 주요 시세 및 등락 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-3xl sm:text-4xl filter drop-shadow-xs">{usd.flag}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-800 font-mono">
                                                USD / KRW
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                                                글로벌 기축통화
                                            </span>
                                        </div>
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                                            미국 달러 (USD)
                                        </h2>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-3 flex-wrap pt-1">
                                    <div className="stock-number text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                        ₩{usd.price.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className={`inline-flex items-center gap-1 text-xs sm:text-base font-extrabold stock-number px-3 py-1 rounded-xl shadow-xs ${
                                        usd.status === 'up' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                        <span>{usd.status === 'up' ? '▲' : '▼'}</span>
                                        <span>{Math.abs(usd.change).toLocaleString('ko-KR', { minimumFractionDigits: 2 })}</span>
                                        <span>({usd.rate >= 0 ? '+' : ''}{usd.rate.toFixed(2)}%)</span>
                                    </div>
                                </div>

                                {/* 당일 고가/저가 레인지 바 */}
                                <div className="pt-2 max-w-md">
                                    <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                                        <span>당일 최저 ₩{(usd.dayLow || usd.price * 0.997).toFixed(2)}</span>
                                        <span className="text-indigo-600 font-bold">당일 밴드 위치 {usdRangePercent}%</span>
                                        <span>당일 최고 ₩{(usd.dayHigh || usd.price * 1.003).toFixed(2)}</span>
                                    </div>
                                    <div className="w-full h-2 nm-inset rounded-full overflow-hidden p-0.5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-red-500 rounded-full transition-all duration-700"
                                            style={{ width: `${usdRangePercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* 우측: 4대 고시 환율 칩 (현찰/송금) */}
                            <div className="nm-inset p-4 sm:p-5 rounded-2xl lg:w-96 flex flex-col justify-between">
                                <div className="text-xs font-bold text-slate-600 mb-3 flex items-center justify-between">
                                    <span>은행 고시 환율 기준표</span>
                                    <span className="text-[10px] text-slate-400 font-normal">스프레드 포함</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/50 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-medium">현찰 사실 때 (살때)</span>
                                        <span className="font-extrabold text-slate-900 stock-number text-sm">
                                            ₩{(usd.cashBuy || usd.price * 1.0175).toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/50 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-medium">현찰 파실 때 (팔때)</span>
                                        <span className="font-extrabold text-slate-900 stock-number text-sm">
                                            ₩{(usd.cashSell || usd.price * 0.9825).toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/50 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-medium">송금 보낼 때 (전신환)</span>
                                        <span className="font-extrabold text-indigo-700 stock-number text-sm">
                                            ₩{(usd.sendRemit || usd.price * 1.01).toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/50 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-medium">송금 받을 때 (전신환)</span>
                                        <span className="font-extrabold text-indigo-700 stock-number text-sm">
                                            ₩{(usd.receiveRemit || usd.price * 0.99).toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => selectCurrencyForCalc('USD')}
                                    className="mt-3.5 w-full py-2 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <i className="fas fa-calculator text-indigo-500"></i>
                                    <span>미국 달러 환전 계산하기</span>
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. [SIGNATURE ELEMENT] 스마트 듀얼 뉴모피즘 환전소 (Interactive Inset Converter) */}
                <section ref={converterRef} className="nm-card p-5 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg nm-btn flex items-center justify-center text-indigo-600 text-xs">
                                    <i className="fas fa-calculator"></i>
                                </span>
                                스마트 양방향 환전 계산기
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                실시간 시장 환율을 기반으로 통화 간 교환 가치를 즉시 역산합니다.
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                <i className="fas fa-bolt mr-1"></i>실시간 자동 계산
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
                        {/* 1) 보내는 통화 (오목 패널) */}
                        <div className="lg:col-span-5 nm-inset p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-bold flex items-center gap-1.5 text-slate-700">
                                    <i className="fas fa-arrow-up-from-bracket text-indigo-500"></i>
                                    보내는 금액
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">From</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 nm-inset-white px-3.5 py-2.5 flex items-center justify-between">
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        inputMode="decimal"
                                        placeholder="0"
                                        className="w-full bg-transparent text-right font-black stock-number text-xl sm:text-2xl text-slate-900 outline-none"
                                    />
                                </div>
                                <select
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="nm-btn px-3 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-800 outline-none cursor-pointer shrink-0 border border-slate-200"
                                >
                                    {currencyOptions.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.code} ({c.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 퀵 프리셋 금액 버튼 */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-bold">
                                <span className="text-slate-400 text-[10px] mr-0.5">빠른 추가:</span>
                                {[10, 50, 100, 500, 1000].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => addPreset(val)}
                                        className="nm-btn px-2.5 py-1 text-slate-600 hover:text-indigo-600 transition-all rounded-lg text-xs"
                                    >
                                        +{val.toLocaleString()}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setAmount('0')}
                                    className="nm-btn px-2.5 py-1 text-red-500 hover:text-red-700 transition-all rounded-lg text-xs"
                                >
                                    초기화
                                </button>
                            </div>
                        </div>

                        {/* 2) 중앙 3D 뉴모피즘 스왑 버튼 */}
                        <div className="lg:col-span-1 flex justify-center py-2 lg:py-0">
                            <button
                                type="button"
                                onClick={handleSwap}
                                aria-label="통화 양방향 맞교환"
                                title="통화 교환"
                                className={`w-12 h-12 rounded-full nm-btn-accent flex items-center justify-center cursor-pointer shadow-md transition-transform duration-300 ${
                                    isRotating ? 'rotate-180 scale-95' : 'hover:scale-105'
                                }`}
                            >
                                <i className="fas fa-right-left text-sm sm:text-base"></i>
                            </button>
                        </div>

                        {/* 3) 받는 통화 (오목 패널) */}
                        <div className="lg:col-span-5 nm-inset p-4 sm:p-5 space-y-3 bg-gradient-to-br from-[#f0f4f8] to-indigo-50/30">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-bold flex items-center gap-1.5 text-indigo-700">
                                    <i className="fas fa-arrow-down-to-bracket text-indigo-500"></i>
                                    받는 금액 (환전 결과)
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">To</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 nm-inset-white px-3.5 py-2.5 flex items-center justify-end overflow-x-auto">
                                    <span className="font-black stock-number text-xl sm:text-2xl text-indigo-900 tracking-tight whitespace-nowrap">
                                        {converted === null
                                            ? '-'
                                            : converted.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <select
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="nm-btn px-3 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-800 outline-none cursor-pointer shrink-0 border border-slate-200"
                                >
                                    {currencyOptions.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.code} ({c.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 환율 비율 요약 및 우대율 팁 */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span className="font-mono text-slate-600">
                                    1 {from} = {perUnitKRW[from] && perUnitKRW[to] ? (perUnitKRW[from] / perUnitKRW[to]).toLocaleString('ko-KR', { maximumFractionDigits: 4 }) : '-'} {to}
                                </span>
                                <span className="text-indigo-600 font-medium hidden sm:inline">
                                    * 모바일 우대율 최대 90% 반영 가능
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-100/70 rounded-xl p-3.5 text-[11px] text-slate-500 flex items-start gap-2 border border-slate-200/50">
                        <i className="fas fa-circle-info text-indigo-500 mt-0.5 shrink-0"></i>
                        <span>
                            외환시장의 실시간 <strong>매매기준율</strong>을 기준으로 계산된 순수 가치입니다. 실제 은행 환전 창구나 모바일 환전지갑을 이용하실 경우, 각 금융기관의 우대율(70%~90%) 및 환전 수수료에 따라 최종 수령액이 달라질 수 있습니다.
                        </span>
                    </div>
                </section>

                {/* 4. [MARKET GRID] 주요 8대 통화 인터랙티브 뉴모피즘 카드 그리드 */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg nm-btn flex items-center justify-center text-indigo-600 text-xs">
                                <i className="fas fa-coins"></i>
                            </span>
                            주요 8대 기축 통화 시세
                        </h2>
                        <span className="text-xs text-slate-400 font-mono">
                            총 {rates.length}개 통화 고시
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {rates.map((r) => (
                            <div 
                                key={r.code}
                                className="nm-card-sm p-4 sm:p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                                onClick={() => selectCurrencyForCalc(r.code)}
                            >
                                <div>
                                    {/* 카드 상단: 국기, 통화명, 등락 뱃지 */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-2xl">{r.flag}</span>
                                            <div>
                                                <div className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {r.code}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {r.name}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-extrabold stock-number px-2 py-0.5 rounded-lg ${
                                            r.status === 'up' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                            {r.rate >= 0 ? '+' : ''}{r.rate.toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* 환율 매매기준율 */}
                                    <div className="my-2">
                                        <div className="text-[10px] text-slate-400 font-medium">매매기준율 (1단위당)</div>
                                        <div className="stock-number text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                            ₩{r.price.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className={`stock-number text-xs mt-0.5 font-bold flex items-center gap-1 ${
                                            r.status === 'up' ? 'text-red-500' : 'text-blue-500'
                                        }`}>
                                            <span>{r.status === 'up' ? '▲' : '▼'}</span>
                                            <span>{Math.abs(r.change).toLocaleString('ko-KR', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-[10px] text-slate-400 font-normal ml-0.5">전일대비</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 카드 하단: 빠른 환전 액션 칩 */}
                                <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-xs text-slate-500">
                                    <span className="text-[10px] text-slate-400">
                                        현찰 살때 ₩{(r.cashBuy || r.price * 1.0175).toFixed(1)}
                                    </span>
                                    <span className="text-indigo-600 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                        환전하기 <i className="fas fa-chevron-right text-[9px]"></i>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. [KNOWLEDGE GUIDE] 스마트 환전 꿀팁 & 금융 가이드 */}
                <section className="nm-card p-6 sm:p-8 space-y-4">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg nm-btn flex items-center justify-center text-amber-500 text-xs">
                            <i className="fas fa-lightbulb"></i>
                        </span>
                        알아두면 돈이 되는 실전 환전 가이드
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="nm-inset p-4 rounded-xl space-y-2">
                            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                                <i className="fas fa-percent text-indigo-500"></i>
                                환율 우대율(스프레드 할인)이란?
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                은행이 매매기준율에 덧붙이는 마진(환전 수수료)을 할인해 주는 비율입니다. 90% 우대 시 수수료의 10%만 지불하므로 매우 유리합니다.
                            </p>
                        </div>

                        <div className="nm-inset p-4 rounded-xl space-y-2">
                            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                <i className="fas fa-plane-departure text-emerald-500"></i>
                                여행자 환전 꿀팁
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                공항 환전소는 수수료가 가장 비쌉니다. 출국 전 주거래 은행의 모바일 환전 지갑이나 외화 충전식 체크카드를 활용하면 최대 100% 우대를 받을 수 있습니다.
                            </p>
                        </div>

                        <div className="nm-inset p-4 rounded-xl space-y-2">
                            <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                                <i className="fas fa-chart-line text-amber-500"></i>
                                매매기준율 vs 고시환율 차이
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                매매기준율은 외환 시장의 도매 가격이며, 현찰 사실 때/파실 때는 은행 창구 운영 비용이 포함된 소매 가격입니다.
                            </p>
                        </div>
                    </div>
                </section>

            </main>

            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}

