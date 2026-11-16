'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import FinanceSubMenu from '@/components/finance/FinanceSubMenu';

interface ExchangeRate {
    code: string;
    name: string;
    flag: string;
    unit: number;
    price: number;
    change: number;
    rate: number;
    status: 'up' | 'down';
    dayHigh?: number;
    dayLow?: number;
    cashBuy?: number;
    cashSell?: number;
    sendRemit?: number;
    receiveRemit?: number;
    updatedAt?: string;
}

const KRW = { code: 'KRW', name: '대한민국 원', flag: '🇰🇷', unit: 1 };

export default function ExchangePage() {
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<string>('');

    const [amount, setAmount] = useState('1000');
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('KRW');
    const [isRotating, setIsRotating] = useState(false);
    const converterRef = useRef<HTMLDivElement>(null);

    const fetchRates = () => {
        setLoading(true);
        fetch('/api/finance/exchange')
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setRates(data);
                    setLastRefreshed(
                        new Date().toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })
                    );
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRates();
        const timer = setInterval(fetchRates, 60000);
        return () => clearInterval(timer);
    }, []);

    const usd = useMemo(() => rates.find((r) => r.code === 'USD') || rates[0], [rates]);

    const perUnitKRW = useMemo(() => {
        const map: Record<string, number> = { KRW: 1 };
        rates.forEach((r) => {
            map[r.code] = r.price / r.unit;
        });
        return map;
    }, [rates]);

    const currencyOptions = useMemo(
        () => [
            KRW,
            ...rates.map((r) => ({ code: r.code, name: r.name, flag: r.flag, unit: r.unit })),
        ],
        [rates]
    );

    const converted = useMemo(() => {
        const cleanAmt = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(cleanAmt) || cleanAmt < 0) return null;
        const fromRate = perUnitKRW[from];
        const toRate = perUnitKRW[to];
        if (!fromRate || !toRate) return null;
        return (cleanAmt * fromRate) / toRate;
    }, [amount, from, to, perUnitKRW]);

    const handleSwap = () => {
        setIsRotating(true);
        setTimeout(() => setIsRotating(false), 300);
        setFrom(to);
        setTo(from);
    };

    const addPreset = (val: number) => {
        const cur = parseFloat(amount.replace(/,/g, '')) || 0;
        setAmount(String(Math.round(cur + val)));
    };

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

    const usdRangePercent = useMemo(() => {
        if (!usd || !usd.dayHigh || !usd.dayLow || usd.dayHigh === usd.dayLow) return 50;
        const pct = ((usd.price - usd.dayLow) / (usd.dayHigh - usd.dayLow)) * 100;
        return Math.min(100, Math.max(0, Math.round(pct)));
    }, [usd]);

    return (
        <div className="flex flex-col flex-1 text-slate-800">
            <FinanceSubMenu />

            <div className="border-b border-slate-200/60 bg-white">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 w-full flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="hover:text-indigo-600 transition-colors">
                            홈
                        </Link>
                        <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
                        <Link href="/finance" className="hover:text-indigo-600 transition-colors">
                            금융
                        </Link>
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
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors ml-1 cursor-pointer"
                        >
                            <i className={`fas fa-rotate-right ${loading ? 'animate-spin' : ''}`}></i>
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 w-full space-y-8 sm:space-y-12">
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
                </div>

                {/* 대표 환율 카드 */}
                {loading && !usd ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 animate-pulse space-y-4">
                        <div className="h-6 bg-slate-200 rounded w-40"></div>
                        <div className="h-12 bg-slate-200 rounded w-64"></div>
                        <div className="h-4 bg-slate-100 rounded w-80"></div>
                    </div>
                ) : usd ? (
                    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-3xl sm:text-4xl">{usd.flag}</span>
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

                                <div className="flex items-baseline gap-3 flex-wrap pt-1 font-mono">
                                    <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                        ₩
                                        {usd.price.toLocaleString('ko-KR', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                    <div
                                        className={`inline-flex items-center gap-1 text-xs sm:text-base font-extrabold px-3 py-1 rounded-xl shadow-xs ${
                                            usd.status === 'up'
                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}
                                    >
                                        <span>{usd.status === 'up' ? '▲' : '▼'}</span>
                                        <span>
                                            {Math.abs(usd.change).toLocaleString('ko-KR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                        <span>
                                            ({usd.rate >= 0 ? '+' : ''}
                                            {usd.rate.toFixed(2)}%)
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 max-w-md">
                                    <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                                        <span>
                                            당일 최저 ₩
                                            {(usd.dayLow || usd.price * 0.997).toFixed(2)}
                                        </span>
                                        <span className="text-indigo-600 font-bold">
                                            당일 밴드 위치 {usdRangePercent}%
                                        </span>
                                        <span>
                                            당일 최고 ₩
                                            {(usd.dayHigh || usd.price * 1.003).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-red-500 rounded-full transition-all duration-700"
                                            style={{ width: `${usdRangePercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-5 rounded-2xl lg:w-96 flex flex-col justify-between">
                                <div className="text-xs font-bold text-slate-600 mb-3 flex items-center justify-between">
                                    <span>은행 고시 환율 기준표</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                        스프레드 포함
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                        <span className="text-[10px] text-slate-400 block font-sans font-medium">
                                            현찰 사실 때 (살때)
                                        </span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            ₩
                                            {(usd.cashBuy || usd.price * 1.0175).toLocaleString(
                                                'ko-KR',
                                                { minimumFractionDigits: 2 }
                                            )}
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                        <span className="text-[10px] text-slate-400 block font-sans font-medium">
                                            현찰 파실 때 (팔때)
                                        </span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            ₩
                                            {(usd.cashSell || usd.price * 0.9825).toLocaleString(
                                                'ko-KR',
                                                { minimumFractionDigits: 2 }
                                            )}
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                        <span className="text-[10px] text-slate-400 block font-sans font-medium">
                                            송금 보낼 때 (전신환)
                                        </span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            ₩
                                            {(usd.sendRemit || usd.price * 1.01).toLocaleString(
                                                'ko-KR',
                                                { minimumFractionDigits: 2 }
                                            )}
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                        <span className="text-[10px] text-slate-400 block font-sans font-medium">
                                            송금 받을 때 (전신환)
                                        </span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            ₩
                                            {(usd.receiveRemit || usd.price * 0.99).toLocaleString(
                                                'ko-KR',
                                                { minimumFractionDigits: 2 }
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => selectCurrencyForCalc('USD')}
                                    className="mt-3.5 w-full py-2 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <i className="fas fa-calculator text-indigo-500"></i>
                                    <span>미국 달러 환전 계산하기</span>
                                </button>
                            </div>
                        </div>
                    </section>
                ) : null}

                {/* 스마트 양방향 환전 계산기 */}
                <section
                    ref={converterRef}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs">
                                    <i className="fas fa-calculator"></i>
                                </span>
                                스마트 양방향 환전 계산기
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                실시간 시장 환율을 기반으로 통화 간 교환 가치를 즉시 역산합니다.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
                        <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-bold flex items-center gap-1.5 text-slate-700">
                                    <i className="fas fa-arrow-up-from-bracket text-indigo-500"></i>
                                    보내는 금액
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">From</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        inputMode="decimal"
                                        placeholder="0"
                                        className="w-full bg-transparent text-right font-black font-mono text-xl sm:text-2xl text-slate-900 outline-none"
                                    />
                                </div>
                                <select
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="bg-white px-3 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-800 outline-none cursor-pointer shrink-0 border border-slate-200"
                                >
                                    {currencyOptions.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.code} ({c.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-bold">
                                <span className="text-slate-400 text-[10px] mr-0.5">빠른 추가:</span>
                                {[10, 50, 100, 500, 1000].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => addPreset(val)}
                                        className="bg-white border border-slate-200 px-2.5 py-1 text-slate-600 hover:text-indigo-600 transition-all rounded-lg text-xs cursor-pointer"
                                    >
                                        +{val.toLocaleString()}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setAmount('0')}
                                    className="bg-white border border-slate-200 px-2.5 py-1 text-red-500 hover:text-red-700 transition-all rounded-lg text-xs cursor-pointer"
                                >
                                    초기화
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex justify-center py-2 lg:py-0">
                            <button
                                type="button"
                                onClick={handleSwap}
                                aria-label="통화 양방향 맞교환"
                                title="통화 교환"
                                className={`w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center cursor-pointer shadow-md transition-transform duration-300 ${
                                    isRotating ? 'rotate-180 scale-95' : 'hover:scale-105'
                                }`}
                            >
                                <i className="fas fa-right-left text-sm sm:text-base"></i>
                            </button>
                        </div>

                        <div className="lg:col-span-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-bold flex items-center gap-1.5 text-indigo-700">
                                    <i className="fas fa-arrow-down-to-bracket text-indigo-500"></i>
                                    받는 금액 (환전 결과)
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">To</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white border border-indigo-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-end overflow-x-auto">
                                    <span className="font-black font-mono text-xl sm:text-2xl text-indigo-900 tracking-tight whitespace-nowrap">
                                        {converted === null
                                            ? '-'
                                            : converted.toLocaleString('ko-KR', {
                                                  maximumFractionDigits: 2,
                                              })}
                                    </span>
                                </div>
                                <select
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="bg-white px-3 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-800 outline-none cursor-pointer shrink-0 border border-slate-200"
                                >
                                    {currencyOptions.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.code} ({c.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span className="font-mono text-slate-600">
                                    1 {from} ={' '}
                                    {perUnitKRW[from] && perUnitKRW[to]
                                        ? (perUnitKRW[from] / perUnitKRW[to]).toLocaleString(
                                              'ko-KR',
                                              { maximumFractionDigits: 4 }
                                          )
                                        : '-'}{' '}
                                    {to}
                                </span>
                                <span className="text-indigo-600 font-medium hidden sm:inline">
                                    * 모바일 우대율 최대 90% 반영 가능
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 주요 통화 그리드 */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                            <i className="fas fa-coins text-indigo-600"></i>
                            주요 8대 기축 통화 시세
                        </h2>
                        <span className="text-xs text-slate-400 font-mono">
                            총 {rates.length}개 통화 고시
                        </span>
                    </div>

                    {loading && rates.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3"
                                >
                                    <div className="h-5 bg-slate-200 rounded w-24"></div>
                                    <div className="h-8 bg-slate-200 rounded w-32"></div>
                                    <div className="h-4 bg-slate-100 rounded w-20"></div>
                                </div>
                            ))}
                        </div>
                    ) : rates.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {rates.map((r) => (
                                <div
                                    key={r.code}
                                    onClick={() => selectCurrencyForCalc(r.code)}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 group cursor-pointer"
                                >
                                    <div>
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
                                            <span
                                                className={`text-[11px] font-extrabold font-mono px-2 py-0.5 rounded-lg ${
                                                    r.status === 'up'
                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}
                                            >
                                                {r.rate >= 0 ? '+' : ''}
                                                {r.rate.toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="my-2 font-mono">
                                            <div className="text-[10px] text-slate-400 font-sans font-medium">
                                                매매기준율 (1단위당)
                                            </div>
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                                ₩
                                                {r.price.toLocaleString('ko-KR', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </div>
                                            <div
                                                className={`text-xs mt-0.5 font-bold flex items-center gap-1 ${
                                                    r.status === 'up'
                                                        ? 'text-red-500'
                                                        : 'text-blue-500'
                                                }`}
                                            >
                                                <span>{r.status === 'up' ? '▲' : '▼'}</span>
                                                <span>
                                                    {Math.abs(r.change).toLocaleString('ko-KR', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-sans font-normal ml-0.5">
                                                    전일대비
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-xs text-slate-500">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            현찰 살때 ₩
                                            {(r.cashBuy || r.price * 1.0175).toFixed(1)}
                                        </span>
                                        <span className="text-indigo-600 font-bold text-[11px] flex items-center gap-1">
                                            환전하기{' '}
                                            <i className="fas fa-chevron-right text-[9px]"></i>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-400">
                            실시간 환율 정보를 불러올 수 없습니다. 잠시 후 새로고침해 주세요.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
