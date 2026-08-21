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

    const [investmentAmountKRW, setInvestmentAmountKRW] = useState<number>(50000000); // 5,000만원
    const [exchangeRate, setExchangeRate] = useState<number>(1380); // 환율
    const [dripRate, setDripRate] = useState<number>(5.0); // 연간 배당성장률

    // 현재 선택된 종목 정보
    const currentStock = useMemo(() => {
        if (selectedTicker === 'CUSTOM') {
            return {
                ticker: customTicker || '직접입력',
                name: '사용자 지정 종목',
                yield: customYield,
                frequency: customFrequency,
                payMonths: customFrequency === 'monthly' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [3, 6, 9, 12],
                desc: '직접 설정한 배당 수익률 및 분배 주기',
            };
        }
        return PRESET_STOCKS.find((s) => s.ticker === selectedTicker) || PRESET_STOCKS[0];
    }, [selectedTicker, customTicker, customYield, customFrequency]);

    // 계산 엔진
    const results = useMemo(() => {
        const investUSD = investmentAmountKRW / exchangeRate;
        const annualGrossUSD = investUSD * (currentStock.yield / 100);
        const annualGrossKRW = annualGrossUSD * exchangeRate;

        // 배당소득세 (미국 원천징수 15% + 지방소득세 0.4% = 15.4%)
        const taxRate = 0.154;
        const annualTaxKRW = annualGrossKRW * taxRate;
        const annualNetKRW = annualGrossKRW - annualTaxKRW;

        const monthlyAvgGrossKRW = annualGrossKRW / 12;
        const monthlyAvgNetKRW = annualNetKRW / 12;

        // 금융소득종합과세 기준 (연 2,000만원)
        const taxThreshold = 20000000;
        const taxThresholdPercent = Math.min(100, (annualGrossKRW / taxThreshold) * 100);
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

        // 3년 후 배당 재투자(DRIP) 복리 예상
        const futureYears = [1, 3, 5, 10];
        const futureProjections = futureYears.map((years) => {
            const growthFactor = Math.pow(1 + (currentStock.yield * (1 - taxRate) + dripRate) / 100, years);
            const futureInvestKRW = investmentAmountKRW * growthFactor;
            const futureAnnualNetKRW = futureInvestKRW * (currentStock.yield / 100) * (1 - taxRate);
            const futureMonthlyNetKRW = futureAnnualNetKRW / 12;
            return {
                years,
                futureInvestKRW,
                futureMonthlyNetKRW,
            };
        });

        return {
            investUSD,
            annualGrossKRW,
            annualTaxKRW,
            annualNetKRW,
            monthlyAvgGrossKRW,
            monthlyAvgNetKRW,
            taxThresholdPercent,
            isOverThreshold,
            monthlyCalendar,
            futureProjections,
        };
    }, [investmentAmountKRW, exchangeRate, currentStock, dripRate]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* 상단 타이틀 카드 */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                        💵
                    </div>
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                            Dividend & Tax Simulator
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black">미국 배당주 세금 & 월배당 실수령액 계산기</h2>
                    </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed max-w-2xl">
                    SCHD, JEPI 등 미국 대표 배당 ETF 및 보유 종목의 <strong>배당소득세(15.4%) 공제 후 실제 월 입금액</strong>과 
                    <strong>금융소득종합과세(2,000만 원) 한도</strong>를 1초 만에 시뮬레이션해 드립니다.
                </p>
            </div>

            {/* 입력 폼 및 결과 섹션 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 좌측: 조건 입력 패널 */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <i className="fas fa-sliders text-amber-500"></i> 투자 종목 및 조건 설정
                    </h3>

                    {/* 종목 프리셋 선택 */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">투자 종목 선택 (인기 프리셋)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {PRESET_STOCKS.map((stock) => (
                                <button
                                    key={stock.ticker}
                                    type="button"
                                    onClick={() => setSelectedTicker(stock.ticker)}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                                        selectedTicker === stock.ticker
                                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="font-extrabold">{stock.ticker}</div>
                                    <div className="text-[10px] text-amber-700 font-semibold">{stock.yield}%</div>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setSelectedTicker('CUSTOM')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                                    selectedTicker === 'CUSTOM'
                                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <div className="font-extrabold">직접 입력</div>
                                <div className="text-[10px] text-slate-500 font-semibold">사용자 지정</div>
                            </button>
                        </div>
                    </div>

                    {/* 직접 입력 시 커스텀 폼 */}
                    {selectedTicker === 'CUSTOM' && (
                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">티커명 (선택)</label>
                                <input
                                    type="text"
                                    placeholder="예: O, SPY"
                                    value={customTicker}
                                    onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">연 배당수익률 (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={customYield}
                                        onChange={(e) => setCustomYield(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">배당 주기</label>
                                    <select
                                        value={customFrequency}
                                        onChange={(e: any) => setCustomFrequency(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                                    >
                                        <option value="monthly">월배당 (12회)</option>
                                        <option value="quarterly">분기배당 (4회)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 투자 원금 (원화) */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-700">총 투자 금액 (원화)</label>
                            <span className="text-xs font-mono font-bold text-amber-700">
                                {Math.round(investmentAmountKRW / 10000).toLocaleString()}만 원
                            </span>
                        </div>
                        <input
                            type="number"
                            step="1000000"
                            value={investmentAmountKRW}
                            onChange={(e) => setInvestmentAmountKRW(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none transition-all font-mono"
                        />
                        <div className="flex gap-1.5 mt-2">
                            {[10000000, 30000000, 50000000, 100000000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setInvestmentAmountKRW(amt)}
                                    className="py-1 px-2 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                    +{amt / 10000000}천만
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 환율 및 배당 성장률 */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">적용 환율 (USD/KRW)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 font-mono pr-7"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">원</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">배당 성장률 (연)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.5"
                                    value={dripRate}
                                    onChange={(e) => setDripRate(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 font-mono pr-7"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 우측: 계산 결과 대시보드 */}
                <div className="lg:col-span-7 space-y-6">
                    {/* 핵심 월 실수령액 강조 카드 */}
                    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-xs font-bold text-amber-400">{currentStock.ticker} 시뮬레이션 결과</span>
                                <h4 className="text-lg font-black text-white">{currentStock.name}</h4>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                연 {currentStock.yield}% ({currentStock.frequency === 'monthly' ? '월배당' : '분기배당'})
                            </span>
                        </div>

                        {/* 월 평균 실수령액 */}
                        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5 text-center">
                            <span className="text-xs font-bold text-amber-300">세금(15.4%) 제외 월평균 순수령액</span>
                            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-1">
                                ₩ {Math.round(results.monthlyAvgNetKRW).toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                (연간 세후 배당금: ₩ {Math.round(results.annualNetKRW).toLocaleString()})
                            </div>
                        </div>

                        {/* 세부 수령액 및 세금 breakdown */}
                        <div className="grid grid-cols-3 gap-3 text-xs">
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
                            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 block mb-1">투자 달러(USD)</span>
                                <span className="font-bold font-mono text-sm text-amber-300">
                                    ${Math.round(results.investUSD).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* 금융소득종합과세 2,000만원 한도 게이지 */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                            <div className="flex justify-between font-bold">
                                <span className="text-slate-400">금융소득종합과세 한도 (연 2,000만 원)</span>
                                <span className={results.isOverThreshold ? 'text-rose-400' : 'text-emerald-400'}>
                                    {results.taxThresholdPercent.toFixed(1)}% ({results.isOverThreshold ? '초과 - 종합과세 대상' : '안전 - 분리과세 종결'})
                                </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className={`h-full ${results.isOverThreshold ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'}`}
                                    style={{ width: `${results.taxThresholdPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 12개월 배당 캘린더 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <i className="fas fa-calendar-alt text-amber-500"></i> 12개월 예상 배당금 입금 캘린더
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {results.monthlyCalendar.map((item) => (
                                <div
                                    key={item.month}
                                    className={`p-2.5 rounded-xl text-center border transition-all ${
                                        item.isPayMonth
                                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                                            : 'bg-slate-50/60 border-slate-100 text-slate-400'
                                    }`}
                                >
                                    <div className="text-[11px] font-bold">{item.month}월</div>
                                    <div className="text-xs font-mono font-extrabold mt-0.5">
                                        {item.isPayMonth ? `₩${Math.round(item.netKRW / 10000).toLocaleString()}만` : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
