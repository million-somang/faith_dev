import { useState, useMemo } from 'react';

interface PresetStock {
    ticker: string;
    name: string;
    yield: number; // 연 배당수익률 (%)
    frequency: 'monthly' | 'quarterly';
    payMonths: number[]; // 배당 지급월 (1~12)
    desc: string;
}

const PRESET_STOCKS: PresetStock[] = [
    { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', yield: 3.65, frequency: 'quarterly', payMonths: [3, 6, 9, 12], desc: '미국 대표 배당성장 ETF (다우존스 배당 100 지수)' },
    { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', yield: 7.80, frequency: 'monthly', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], desc: '월배당 커버드콜 프리미엄 인컴 ETF' },
    { ticker: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium ETF', yield: 9.10, frequency: 'monthly', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], desc: '나스닥 기반 고배당 월배당 ETF' },
    { ticker: 'O', name: 'Realty Income Corp', yield: 5.40, frequency: 'monthly', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], desc: '50년 이상 배당 증액한 글로벌 상업용 리츠' },
    { ticker: 'QYLD', name: 'Global X NASDAQ 100 Covered Call ETF', yield: 11.50, frequency: 'monthly', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], desc: '나스닥 100 초고배당 월분배 ETF' },
    { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', yield: 1.45, frequency: 'quarterly', payMonths: [3, 6, 9, 12], desc: 'S&P 500 지수 추종 대표 인덱스 펀드' },
];

export default function DividendTaxCalculator() {
    const [selectedTicker, setSelectedTicker] = useState<string>('SCHD');
    const [customTicker, setCustomTicker] = useState<string>('');
    const [customYield, setCustomYield] = useState<number>(5.0);
    const [customFrequency, setCustomFrequency] = useState<'monthly' | 'quarterly'>('monthly');

    const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');
    const [principalAmount, setPrincipalAmount] = useState<number>(30000000); // 3천만원
    const [exchangeRate, setExchangeRate] = useState<number>(1380); // 환율

    // 현재 선택된 주식 정보
    const currentStock = useMemo(() => {
        if (selectedTicker === 'CUSTOM') {
            return {
                ticker: customTicker || 'CUSTOM',
                name: '직접 입력한 배당 종목',
                yield: customYield,
                frequency: customFrequency,
                payMonths: customFrequency === 'monthly' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [3, 6, 9, 12],
                desc: '사용자 지정 배당수익률 및 지급 주기',
            };
        }
        return PRESET_STOCKS.find(s => s.ticker === selectedTicker) || PRESET_STOCKS[0];
    }, [selectedTicker, customTicker, customYield, customFrequency]);

    // 계산 결과 산출
    const results = useMemo(() => {
        const principalKRW = currency === 'KRW' ? principalAmount : principalAmount * exchangeRate;
        const principalUSD = currency === 'USD' ? principalAmount : principalAmount / exchangeRate;

        // 세전 연간 배당금
        const annualGrossKRW = principalKRW * (currentStock.yield / 100);
        const annualGrossUSD = principalUSD * (currentStock.yield / 100);

        // 배당소득세 (미국 원천징수 15% + 국내 0.4% = 15.4%)
        const taxRate = 0.154;
        const annualTaxKRW = annualGrossKRW * taxRate;
        const annualNetKRW = annualGrossKRW - annualTaxKRW;

        const annualTaxUSD = annualGrossUSD * taxRate;
        const annualNetUSD = annualGrossUSD - annualTaxUSD;

        // 월 평균 세후 실수령액
        const monthlyNetKRW = annualNetKRW / 12;
        const monthlyNetUSD = annualNetUSD / 12;

        // 금융소득종합과세(2,000만원) 한도 도달 비율
        const taxThreshold = 20000000;
        const thresholdPercent = Math.min(100, (annualGrossKRW / taxThreshold) * 100);
        const isOverThreshold = annualGrossKRW > taxThreshold;

        // 월별 배당 캘린더 금액 (월별 지급액)
        const countPerYear = currentStock.payMonths.length;
        const perPayNetKRW = annualNetKRW / countPerYear;

        const monthlyCalendar = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const isPayMonth = currentStock.payMonths.includes(month);
            return {
                month,
                isPayMonth,
                netKRW: isPayMonth ? perPayNetKRW : 0,
            };
        });

        return {
            principalKRW,
            principalUSD,
            annualGrossKRW,
            annualGrossUSD,
            annualTaxKRW,
            annualNetKRW,
            annualNetUSD,
            monthlyNetKRW,
            monthlyNetUSD,
            thresholdPercent,
            isOverThreshold,
            monthlyCalendar,
        };
    }, [principalAmount, currency, exchangeRate, currentStock]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* 상단 소개 배너 */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                        💵
                    </div>
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                            Dividend Tax Simulator
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black">미국 배당주 세금 & 월배당 계산기</h2>
                    </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed max-w-2xl">
                    SCHD, JEPI 등 미국 인기 배당 ETF 및 주식의 배당소득세(15.4%)를 자동 공제하고, 
                    내 통장에 꽂히는 <strong>실제 월 실수령액과 12개월 배당 캘린더</strong>를 계산해 드립니다.
                </p>
            </div>

            {/* 입력 폼 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 좌측 입력 패널 */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <i className="fas fa-sliders-h text-amber-500"></i> 투자 조건 설정
                    </h3>

                    {/* 종목 선택 프리셋 */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">배당 종목 선택</label>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {PRESET_STOCKS.map((stock) => (
                                <button
                                    key={stock.ticker}
                                    type="button"
                                    onClick={() => setSelectedTicker(stock.ticker)}
                                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                                        selectedTicker === stock.ticker
                                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm ring-2 ring-amber-400/20'
                                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                    }`}
                                >
                                    <div className="font-extrabold text-sm">{stock.ticker}</div>
                                    <div className="text-[11px] font-mono text-amber-700 font-bold">{stock.yield}%</div>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedTicker('CUSTOM')}
                            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                selectedTicker === 'CUSTOM'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                            }`}
                        >
                            + 직접 배당수익률 입력하기
                        </button>
                    </div>

                    {/* 직접 입력 시 폼 */}
                    {selectedTicker === 'CUSTOM' && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 animate-fade-in">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">티커명 (선택)</label>
                                <input
                                    type="text"
                                    value={customTicker}
                                    onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                                    placeholder="예: O, TLTW"
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">연 배당수익률 (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={customYield}
                                        onChange={(e) => setCustomYield(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">지급 주기</label>
                                    <select
                                        value={customFrequency}
                                        onChange={(e: any) => setCustomFrequency(e.target.value)}
                                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="monthly">월배당 (12회)</option>
                                        <option value="quarterly">분기배당 (4회)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 투자 원금 입력 */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-700">투자 원금</label>
                            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-bold">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (currency === 'USD') setPrincipalAmount(principalAmount * exchangeRate);
                                        setCurrency('KRW');
                                    }}
                                    className={`px-2 py-0.5 rounded-md ${currency === 'KRW' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                                >
                                    원화(KRW)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (currency === 'KRW') setPrincipalAmount(Math.round(principalAmount / exchangeRate));
                                        setCurrency('USD');
                                    }}
                                    className={`px-2 py-0.5 rounded-md ${currency === 'USD' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                                >
                                    달러(USD)
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={principalAmount}
                                onChange={(e) => setPrincipalAmount(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 text-base font-extrabold rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none transition-all pr-14 font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                                {currency === 'KRW' ? '원' : '$'}
                            </span>
                        </div>
                        {/* 빠른 금액 버튼 */}
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                            {[10000000, 30000000, 50000000, 100000000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => {
                                        setPrincipalAmount(currency === 'KRW' ? amt : Math.round(amt / exchangeRate));
                                    }}
                                    className="py-1 px-2 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                    {amt >= 100000000 ? `${amt / 100000000}억` : `${amt / 10000}만`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 적용 환율 */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">기준 환율 (1 USD)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1350)}
                                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 pr-10 font-mono"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">원</span>
                        </div>
                    </div>
                </div>

                {/* 우측 계산 결과 패널 */}
                <div className="lg:col-span-7 space-y-6">
                    {/* 메인 결과 카드 */}
                    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-xs font-bold text-amber-400">
                                    {currentStock.ticker} (연 {currentStock.yield}%)
                                </span>
                                <h4 className="text-lg font-black text-white">{currentStock.name}</h4>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold">
                                {currentStock.frequency === 'monthly' ? '매월 배당' : '분기 배당'}
                            </span>
                        </div>

                        {/* 월 실수령액 강조 */}
                        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5 text-center">
                            <span className="text-xs font-bold text-amber-300">매월 통장에 꽂히는 세후 실수령액 (월평균)</span>
                            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-1">
                                ₩ {Math.round(results.monthlyNetKRW).toLocaleString()}
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-1">
                                ≈ $ {results.monthlyNetUSD.toFixed(2)} / month
                            </div>
                        </div>

                        {/* 상세 세금 및 연간 수령액 내역 */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 block mb-1">연간 세전 배당금</span>
                                <span className="font-bold font-mono text-sm text-slate-200">
                                    ₩ {Math.round(results.annualGrossKRW).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 block mb-1">배당소득세(15.4%)</span>
                                <span className="font-bold font-mono text-sm text-rose-400">
                                    - ₩ {Math.round(results.annualTaxKRW).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block mb-1">연간 세후 실수령액</span>
                                <span className="font-bold font-mono text-sm text-emerald-400">
                                    ₩ {Math.round(results.annualNetKRW).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* 금융소득종합과세(2,000만원) 게이지 바 */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">금융소득종합과세 2,000만원 기준선</span>
                                <span className={results.isOverThreshold ? 'text-rose-400 font-extrabold' : 'text-amber-400'}>
                                    {results.thresholdPercent.toFixed(1)}% ({Math.round(results.annualGrossKRW / 10000)}만 / 2,000만)
                                </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        results.isOverThreshold ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    }`}
                                    style={{ width: `${results.thresholdPercent}%` }}
                                />
                            </div>
                            {results.isOverThreshold ? (
                                <p className="text-[11px] text-rose-300 leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
                                    ⚠️ <strong>금융소득종합과세 대상자입니다:</strong> 연간 금융소득(이자+배당)이 2,000만 원을 초과하여 타 소득과 합산 과세됩니다. 
                                    ISA 계좌(비과세 500만원) 또는 연금저축/IRP(과세이연)를 활용해 절세 전략을 수립하세요.
                                </p>
                            ) : (
                                <p className="text-[11px] text-slate-400">
                                    ✨ 2,000만 원 이하 구간으로 전액 <strong>15.4% 분리과세</strong> 종결됩니다.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 12개월 배당 캘린더 시각화 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <i className="fas fa-calendar-alt text-amber-500"></i> 12개월 배당 입금 캘린더 (세후)
                        </h4>
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center">
                            {results.monthlyCalendar.map((m) => (
                                <div
                                    key={m.month}
                                    className={`p-2 rounded-xl border transition-all ${
                                        m.isPayMonth
                                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs'
                                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                                    }`}
                                >
                                    <div className="text-[10px] font-bold">{m.month}월</div>
                                    <div className="text-[11px] font-mono mt-1">
                                        {m.isPayMonth ? `${Math.round(m.netKRW / 10000)}만` : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 고단가 애드센스 광고 타겟팅 영역 (증권사/계좌개설/환전) */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg font-bold">
                        💡
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">미국 배당주 투자 시 세금 15.4% 아끼는 꿀팁</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                            국내 상장 미국 배당 ETF(예: TIGER 미국배당다우존스)를 <strong>ISA 및 개인연금(IRP)</strong> 계좌에서 매수하면 배당소득세가 면제되거나 3.3~5.5%로 대폭 절감됩니다.
                        </p>
                    </div>
                </div>
                <a
                    href="/guides/2026-global-interest-rate-dividend-strategy"
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors shadow-sm"
                >
                    배당 절세 가이드 읽기 →
                </a>
            </div>

            {/* SEO 지식 아티클 & FAQ 섹션 */}
            <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 text-slate-700">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <i className="fas fa-book-open text-amber-500"></i> 미국 배당주 투자 및 배당소득세 완전 정복
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-2 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/70">
                        <h4 className="font-extrabold text-slate-900 text-sm">1. 미국 배당소득세율은 왜 15.4%인가요?</h4>
                        <p>
                            한미 조세협정에 따라 미국 주식에서 발생하는 배당금은 미국 국세청(IRS)에서 <strong>15%를 원천징수</strong>합니다.
                            한국의 기본 배당소득세율은 14%(지방소득세 포함 15.4%)이며, 외국납부세액 공제가 적용되어 추가 과세 없이 미국 15% 징수로 대부분 완료됩니다.
                        </p>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/70">
                        <h4 className="font-extrabold text-slate-900 text-sm">2. 금융소득종합과세 2,000만 원 초과 시 불이익</h4>
                        <p>
                            1년간 은행 이자와 주식 배당금의 합계가 2,000만 원을 초과하면 초과분이 <strong>종합소득세율(6%~45%)</strong>에 합산됩니다.
                            특히 건보료 피부양자 자격이 박탈되고 지역가입자로 전환되어 건강보험료 부담이 크게 늘어날 수 있습니다.
                        </p>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-extrabold text-slate-900 text-base mb-3">자주 묻는 질문 (FAQ)</h4>
                    <dl className="space-y-3 text-xs">
                        <div>
                            <dt className="font-bold text-slate-900">Q. 환율 변동에 따라 배당금도 바뀌나요?</dt>
                            <dd className="text-slate-600 mt-0.5">
                                A. 네, 미국 배당주는 달러($)로 지급되므로, 원화 환산 시 입금 당일의 전신환매도율(송금받을 때 환율)에 따라 최종 원화 수령액이 달라집니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold text-slate-900">Q. 분기 배당 ETF(SCHD)와 월배당 ETF(JEPI)의 차이는 무엇인가요?</dt>
                            <dd className="text-slate-600 mt-0.5">
                                A. SCHD는 연 3~4%대의 배당을 3, 6, 9, 12월에 지급하며 장기적인 배당 증액(배당 성장)에 특화되어 있고, JEPI는 옵션 프리미엄을 활용해 매월 7~9%대의 높은 인컴을 즉시 지급하는 데 특화되어 있습니다.
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>
        </div>
    );
}
