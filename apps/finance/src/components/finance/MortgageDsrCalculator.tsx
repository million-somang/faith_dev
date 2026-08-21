import { useState, useMemo } from 'react';

export default function MortgageDsrCalculator() {
    // 1. 주택 및 소득 조건
    const [annualIncome, setAnnualIncome] = useState<number>(60000000); // 6천만원
    const [housePrice, setHousePrice] = useState<number>(600000000); // 6억원
    const [regionType, setRegionType] = useState<'non-regulated' | 'speculative' | 'first-time'>('non-regulated');
    
    // 2. 대출 조건
    const [loanTermYears, setLoanTermYears] = useState<number>(30); // 30년
    const [interestRate, setInterestRate] = useState<number>(4.0); // 4.0%
    const [stressDsrRate, setStressDsrRate] = useState<number>(1.2); // 스트레스 DSR 2단계 수도권 1.2%
    const [existingAnnualDebtPayment, setExistingAnnualDebtPayment] = useState<number>(0); // 기존 부채 연상환액

    // 3. 계산 엔진
    const results = useMemo(() => {
        // A. LTV 한도 비율
        let ltvPercent = 70;
        if (regionType === 'speculative') ltvPercent = 50;
        else if (regionType === 'first-time') ltvPercent = 80;

        const maxLtvLoan = housePrice * (ltvPercent / 100);

        // B. DSR 한도 계산 (은행권 DSR 40%)
        const maxAnnualDsrPayment = annualIncome * 0.40;
        const availableAnnualDsrPayment = Math.max(0, maxAnnualDsrPayment - existingAnnualDebtPayment);

        // 스트레스 DSR 적용 금리 (월이자율)
        const effectiveStressRate = (interestRate + stressDsrRate) / 100;
        const monthlyStressRate = effectiveStressRate / 12;
        const totalMonths = loanTermYears * 12;

        const availableMonthlyPayment = availableAnnualDsrPayment / 12;
        let maxDsrLoan = 0;
        if (monthlyStressRate > 0) {
            const factor = (Math.pow(1 + monthlyStressRate, totalMonths) - 1) / 
                           (monthlyStressRate * Math.pow(1 + monthlyStressRate, totalMonths));
            maxDsrLoan = availableMonthlyPayment * factor;
        }

        // C. 최종 대출 가능 한도 = Min(LTV 한도, DSR 한도)
        const finalMaxLoan = Math.floor(Math.min(maxLtvLoan, maxDsrLoan));
        const limitingFactor = maxLtvLoan < maxDsrLoan ? 'LTV (담보가치)' : 'DSR (소득한도)';

        // D. 실제 대출 시 월 상환액
        const actualMonthlyRate = (interestRate / 100) / 12;
        
        // 1) 원리금균등 상환
        let monthlyPaymentEqual = 0;
        let totalInterestEqual = 0;
        if (actualMonthlyRate > 0 && finalMaxLoan > 0) {
            monthlyPaymentEqual = (finalMaxLoan * actualMonthlyRate * Math.pow(1 + actualMonthlyRate, totalMonths)) /
                                 (Math.pow(1 + actualMonthlyRate, totalMonths) - 1);
            totalInterestEqual = (monthlyPaymentEqual * totalMonths) - finalMaxLoan;
        }

        // 2) 원금균등 상환
        const monthlyPrincipal = finalMaxLoan > 0 ? finalMaxLoan / totalMonths : 0;
        const firstMonthInterestPrincipal = finalMaxLoan * actualMonthlyRate;
        const firstMonthPaymentPrincipal = monthlyPrincipal + firstMonthInterestPrincipal;
        const totalInterestPrincipal = ((finalMaxLoan * actualMonthlyRate * (totalMonths + 1)) / 2);

        // 3) 만기일시 상환
        const monthlyInterestBullet = finalMaxLoan * actualMonthlyRate;
        const totalInterestBullet = monthlyInterestBullet * totalMonths;

        // DSR 실제 사용 비율
        const annualPaymentWithNewLoan = (monthlyPaymentEqual * 12) + existingAnnualDebtPayment;
        const actualDsrPercent = annualIncome > 0 ? (annualPaymentWithNewLoan / annualIncome) * 100 : 0;

        return {
            ltvPercent,
            maxLtvLoan,
            maxDsrLoan,
            finalMaxLoan,
            limitingFactor,
            monthlyPaymentEqual,
            totalInterestEqual,
            firstMonthPaymentPrincipal,
            totalInterestPrincipal,
            monthlyInterestBullet,
            totalInterestBullet,
            actualDsrPercent,
            availableAnnualDsrPayment,
        };
    }, [annualIncome, housePrice, regionType, loanTermYears, interestRate, stressDsrRate, existingAnnualDebtPayment]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* 상단 소개 배너 */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                        🏠
                    </div>
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                            Mortgage & DSR Simulator
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black">주택담보대출 DSR / LTV 한도 & 상환액 계산기</h2>
                    </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed max-w-2xl">
                    내 소득과 주택 시세에 따른 <strong>최대 대출 가능 한도(DSR 40% & LTV)</strong>와 
                    2026년 스트레스 DSR 2단계를 적용한 <strong>월별 상환액 및 총 이자액</strong>을 비교해 드립니다.
                </p>
            </div>

            {/* 입력 및 결과 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 좌측 입력 폼 */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <i className="fas fa-calculator text-blue-600"></i> 대출 조건 입력
                    </h3>

                    {/* 주택 매매가 (KB시세) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">주택 매매가 (KB 시세)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={housePrice}
                                onChange={(e) => setHousePrice(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all pr-12 font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5">
                            {[300000000, 600000000, 900000000, 1200000000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setHousePrice(amt)}
                                    className="py-1 px-2 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                    {amt / 100000000}억
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 연소득 (세전) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">연 소득 (세전)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={annualIncome}
                                onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all pr-12 font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5">
                            {[40000000, 60000000, 80000000, 100000000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setAnnualIncome(amt)}
                                    className="py-1 px-2 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                    {amt / 10000}만
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 규제 지역 */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">규제 지역 및 대상</label>
                        <select
                            value={regionType}
                            onChange={(e: any) => setRegionType(e.target.value)}
                            className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                        >
                            <option value="non-regulated">비규제지역 (LTV 70%)</option>
                            <option value="speculative">투기과열/조정대상지역 (LTV 50%)</option>
                            <option value="first-time">생애최초 주택구입자 (LTV 80%)</option>
                        </select>
                    </div>

                    {/* 대출 기간 & 금리 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">대출 기간</label>
                            <select
                                value={loanTermYears}
                                onChange={(e) => setLoanTermYears(parseInt(e.target.value))}
                                className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white font-mono"
                            >
                                <option value={10}>10년 (120개월)</option>
                                <option value={20}>20년 (240개월)</option>
                                <option value={30}>30년 (360개월)</option>
                                <option value={40}>40년 (480개월)</option>
                                <option value={50}>50년 (600개월)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">약정 금리 (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white pr-7 font-mono"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>
                        </div>
                    </div>

                    {/* 스트레스 DSR & 기존 부채 */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                스트레스 DSR
                            </label>
                            <select
                                value={stressDsrRate}
                                onChange={(e) => setStressDsrRate(parseFloat(e.target.value))}
                                className="w-full px-2.5 py-2 text-[11px] font-bold rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <option value={1.2}>수도권 (+1.20%p)</option>
                                <option value={0.75}>비수도권 (+0.75%p)</option>
                                <option value={0}>미적용 (0%p)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                타 대출 연상환액
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={existingAnnualDebtPayment}
                                    onChange={(e) => setExistingAnnualDebtPayment(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full px-2.5 py-2 text-[11px] font-bold rounded-xl border border-slate-200 bg-slate-50 pr-7 font-mono"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">원</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 우측 결과 패널 */}
                <div className="lg:col-span-7 space-y-6">
                    {/* 최종 최대 대출 한도 카드 */}
                    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-xs font-bold text-blue-400">규제 한도 종합 분석 결과</span>
                                <h4 className="text-lg font-black text-white">최대 대출 가능 금액</h4>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50">
                                {results.limitingFactor} 제한
                            </span>
                        </div>

                        {/* 한도 금액 강조 */}
                        <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-5 text-center">
                            <span className="text-xs font-bold text-blue-300">내 소득/담보 기준 최대 대출 가능액</span>
                            <div className="text-3xl sm:text-4xl font-black text-blue-400 font-mono mt-1">
                                ₩ {Math.round(results.finalMaxLoan).toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                (약 {Math.floor(results.finalMaxLoan / 100000000)}억 {Math.round((results.finalMaxLoan % 100000000) / 10000)}만 원)
                            </div>
                        </div>

                        {/* LTV vs DSR 세부 비교 */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 block mb-1">LTV ({results.ltvPercent}%) 담보 한도</span>
                                <span className="font-bold font-mono text-sm text-slate-200">
                                    ₩ {Math.round(results.maxLtvLoan).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                <span className="text-slate-400 block mb-1">DSR 40% 소득 한도 (스트레스 적용)</span>
                                <span className="font-bold font-mono text-sm text-slate-200">
                                    ₩ {Math.round(results.maxDsrLoan).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* DSR 게이지 바 */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                            <div className="flex justify-between font-bold">
                                <span className="text-slate-400">내 DSR 소진율</span>
                                <span className={results.actualDsrPercent > 40 ? 'text-rose-400' : 'text-blue-400'}>
                                    {results.actualDsrPercent.toFixed(1)}% / 40.0%
                                </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                    style={{ width: `${Math.min(100, (results.actualDsrPercent / 40) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 상환 방식별 월 상환액 및 이자 비교 카드 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <i className="fas fa-coins text-blue-600"></i> 상환 방식별 월 납입금 & 총 이자 비교
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* 원리금균등 */}
                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                                <div className="text-xs font-black text-blue-800">원리금 균등상환 (추천)</div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block">매월 납입액 (원금+이자)</span>
                                    <span className="text-base font-black text-slate-900 font-mono">
                                        ₩ {Math.round(results.monthlyPaymentEqual).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 pt-1 border-t border-blue-100">
                                    총 이자: <span className="font-bold text-slate-700">₩ {Math.round(results.totalInterestEqual / 10000).toLocaleString()}만</span>
                                </div>
                            </div>

                            {/* 원금균등 */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <div className="text-xs font-black text-slate-800">원금 균등상환</div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block">첫 달 최고 납입액</span>
                                    <span className="text-base font-black text-slate-900 font-mono">
                                        ₩ {Math.round(results.firstMonthPaymentPrincipal).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                                    총 이자: <span className="font-bold text-slate-700">₩ {Math.round(results.totalInterestPrincipal / 10000).toLocaleString()}만</span>
                                </div>
                            </div>

                            {/* 만기일시 */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <div className="text-xs font-black text-slate-800">만기일시 상환</div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block">매월 이자만 납입</span>
                                    <span className="text-base font-black text-slate-900 font-mono">
                                        ₩ {Math.round(results.monthlyInterestBullet).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                                    총 이자: <span className="font-bold text-slate-700">₩ {Math.round(results.totalInterestBullet / 10000).toLocaleString()}만</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
