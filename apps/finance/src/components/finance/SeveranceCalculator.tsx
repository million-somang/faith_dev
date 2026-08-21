import { useState, useMemo } from 'react';

export default function SeveranceCalculator() {
    const [subTab, setSubTab] = useState<'severance' | 'unemployment'>('severance');

    // 1. 퇴직금 입력 필드
    const [startDate, setStartDate] = useState<string>('2021-01-01');
    const [endDate, setEndDate] = useState<string>('2026-01-01');
    const [monthlySalary3Months, setMonthlySalary3Months] = useState<number>(10500000); // 최근 3개월 급여 합계
    const [annualBonus, setAnnualBonus] = useState<number>(3000000); // 연간 상여금 총액
    const [annualLeavePay, setAnnualLeavePay] = useState<number>(500000); // 연차수당

    // 2. 실업급여 입력 필드
    const [age, setAge] = useState<number>(35);
    const [disabled, setDisabled] = useState<boolean>(false);
    const [insuranceYears, setInsuranceYears] = useState<number>(3);
    const [avgMonthlyWage, setAvgMonthlyWage] = useState<number>(3500000);

    // 퇴직금 계산 엔진
    const severanceResults = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.max(0, end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalYears = totalDays / 365;

        if (totalDays < 365) {
            return {
                totalDays,
                totalYears,
                isEligible: false,
                dailyAvgWage: 0,
                grossSeverance: 0,
                estTax: 0,
                netSeverance: 0,
            };
        }

        const bonus3Months = annualBonus * (3 / 12);
        const leave3Months = annualLeavePay * (3 / 12);
        const total3MonthsPay = monthlySalary3Months + bonus3Months + leave3Months;
        const dailyAvgWage = total3MonthsPay / 92;

        const grossSeverance = Math.floor(dailyAvgWage * 30 * (totalDays / 365));

        let serviceDeduction = 0;
        const serviceYears = Math.ceil(totalYears);
        if (serviceYears <= 5) serviceDeduction = serviceYears * 1000000;
        else if (serviceYears <= 10) serviceDeduction = 5000000 + (serviceYears - 5) * 2000000;
        else serviceDeduction = 15000000 + (serviceYears - 10) * 2500000;

        const taxableBase = Math.max(0, grossSeverance - serviceDeduction);
        const estTax = Math.floor(taxableBase * 0.055);
        const netSeverance = grossSeverance - estTax;

        return {
            totalDays,
            totalYears,
            isEligible: true,
            dailyAvgWage,
            grossSeverance,
            estTax,
            netSeverance,
        };
    }, [startDate, endDate, monthlySalary3Months, annualBonus, annualLeavePay]);

    // 실업급여 계산 엔진 (2026년 기준)
    const unemploymentResults = useMemo(() => {
        const dailyWage = (avgMonthlyWage * 3) / 92;
        let dailyBenefit = dailyWage * 0.60;

        const maxDaily = 66000;
        const minDaily = 63104;
        dailyBenefit = Math.min(maxDaily, Math.max(minDaily, dailyBenefit));

        const isOver50OrDisabled = age >= 50 || disabled;
        let benefitDays = 120;

        if (insuranceYears < 1) benefitDays = 120;
        else if (insuranceYears < 3) benefitDays = isOver50OrDisabled ? 180 : 150;
        else if (insuranceYears < 5) benefitDays = isOver50OrDisabled ? 210 : 180;
        else if (insuranceYears < 10) benefitDays = isOver50OrDisabled ? 240 : 210;
        else benefitDays = isOver50OrDisabled ? 270 : 240;

        const totalBenefit = Math.floor(dailyBenefit * benefitDays);
        const monthlyBenefit = Math.floor(dailyBenefit * 30);

        return {
            dailyBenefit: Math.floor(dailyBenefit),
            benefitDays,
            totalBenefit,
            monthlyBenefit,
            monthsCount: (benefitDays / 30).toFixed(1),
        };
    }, [age, disabled, insuranceYears, avgMonthlyWage]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* 상단 소개 배너 */}
            <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                        💼
                    </div>
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                            Severance & Unemployment Benefits
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black">퇴직금 & 실업급여 실수령액 시뮬레이터</h2>
                    </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed max-w-2xl">
                    근속연수와 최근 급여를 기준으로 <strong>법정 퇴직금 및 세후 실수령액</strong>을 계산하고, 
                    고용보험 가입기간에 따른 <strong>2026년 실업급여(구직급여) 수급일수와 총 지원금</strong>을 안내합니다.
                </p>
            </div>

            {/* 서브 탭 스위처 */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner max-w-md mx-auto">
                <button
                    type="button"
                    onClick={() => setSubTab('severance')}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        subTab === 'severance'
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <i className="fas fa-hand-holding-usd"></i> 법정 퇴직금 계산
                </button>
                <button
                    type="button"
                    onClick={() => setSubTab('unemployment')}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        subTab === 'unemployment'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <i className="fas fa-user-shield"></i> 고용보험 실업급여 계산
                </button>
            </div>

            {/* 1. 퇴직금 계산기 뷰 */}
            {subTab === 'severance' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* 입력 폼 */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <i className="fas fa-calendar-check text-teal-600"></i> 재직 기간 및 급여 입력
                        </h3>

                        {/* 입사일 & 퇴사일 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">입사일</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">퇴사일</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                                />
                            </div>
                        </div>

                        {/* 최근 3개월 급여 합계 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">최근 3개월 급여 총액 (세전)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={monthlySalary3Months}
                                    onChange={(e) => setMonthlySalary3Months(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-teal-600 focus:outline-none transition-all pr-12 font-mono"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                (월평균 약 {Math.round(monthlySalary3Months / 3).toLocaleString()}원)
                            </span>
                        </div>

                        {/* 연간 상여금 & 연차수당 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">연간 상여금 총액</label>
                                <input
                                    type="number"
                                    value={annualBonus}
                                    onChange={(e) => setAnnualBonus(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">연차유급휴가 수당</label>
                                <input
                                    type="number"
                                    value={annualLeavePay}
                                    onChange={(e) => setAnnualLeavePay(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 결과 패널 */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <span className="text-xs font-bold text-teal-400">
                                        총 재직기간: {severanceResults.totalDays}일 ({severanceResults.totalYears.toFixed(1)}년)
                                    </span>
                                    <h4 className="text-lg font-black text-white">예상 법정 퇴직금 및 실수령액</h4>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                    severanceResults.isEligible ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50' : 'bg-rose-900/60 text-rose-300'
                                }`}>
                                    {severanceResults.isEligible ? '수급 대상 (1년 이상)' : '수급 불가 (1년 미만)'}
                                </span>
                            </div>

                            {severanceResults.isEligible ? (
                                <>
                                    {/* 세후 실수령액 강조 */}
                                    <div className="bg-gradient-to-r from-teal-600/20 to-emerald-600/20 border border-teal-500/30 rounded-2xl p-5 text-center">
                                        <span className="text-xs font-bold text-teal-300">내 통장에 꽂히는 세후 예상 실수령액</span>
                                        <div className="text-3xl sm:text-4xl font-black text-teal-400 font-mono mt-1">
                                            ₩ {severanceResults.netSeverance.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* 상세 내역 */}
                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                            <span className="text-slate-400 block mb-1">1일 평균임금</span>
                                            <span className="font-bold font-mono text-sm text-slate-200">
                                                ₩ {Math.round(severanceResults.dailyAvgWage).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                            <span className="text-slate-400 block mb-1">세전 법정 퇴직금</span>
                                            <span className="font-bold font-mono text-sm text-slate-200">
                                                ₩ {severanceResults.grossSeverance.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                            <span className="text-slate-400 block mb-1">예상 퇴직소득세</span>
                                            <span className="font-bold font-mono text-sm text-rose-400">
                                                - ₩ {severanceResults.estTax.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center bg-rose-950/40 border border-rose-900/50 rounded-2xl">
                                    <p className="text-sm text-rose-300 font-bold">
                                        근로기준법상 총 재직일수가 1년(365일) 미만인 경우 법정 퇴직금 지급 대상에 해당하지 않습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* 2. 실업급여 계산기 뷰 */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* 입력 폼 */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <i className="fas fa-user-clock text-emerald-600"></i> 고용보험 가입 조건
                        </h3>

                        {/* 퇴사 시 만 나이 & 장애인 여부 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">퇴사 당시 만 나이</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white font-mono"
                                />
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={disabled}
                                        onChange={(e) => setDisabled(e.target.checked)}
                                        className="rounded text-emerald-600"
                                    />
                                    장애인 여부
                                </label>
                            </div>
                        </div>

                        {/* 고용보험 가입기간 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">고용보험 총 가입기간</label>
                            <select
                                value={insuranceYears}
                                onChange={(e) => setInsuranceYears(parseFloat(e.target.value))}
                                className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                            >
                                <option value={0.5}>1년 미만 (180일 이상)</option>
                                <option value={2}>1년 이상 ~ 3년 미만</option>
                                <option value={4}>3년 이상 ~ 5년 미만</option>
                                <option value={7}>5년 이상 ~ 10년 미만</option>
                                <option value={12}>10년 이상</option>
                            </select>
                        </div>

                        {/* 퇴직 전 월급 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">퇴직 전 평균 월급 (세전)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={avgMonthlyWage}
                                    onChange={(e) => setAvgMonthlyWage(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all pr-12 font-mono"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
                            </div>
                        </div>
                    </div>

                    {/* 결과 패널 */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <span className="text-xs font-bold text-emerald-400">
                                        총 수급 기간: {unemploymentResults.benefitDays}일 (약 {unemploymentResults.monthsCount}개월)
                                    </span>
                                    <h4 className="text-lg font-black text-white">예상 총 구직급여(실업급여)</h4>
                                </div>
                                <span className="text-xs px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/50">
                                    비과세 수급
                                </span>
                            </div>

                            {/* 총 수급액 강조 */}
                            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-5 text-center">
                                <span className="text-xs font-bold text-emerald-300">총 예상 구직급여 수령액 (전액 비과세)</span>
                                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
                                    ₩ {unemploymentResults.totalBenefit.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    (1일 지급액: ₩ {unemploymentResults.dailyBenefit.toLocaleString()}원 × {unemploymentResults.benefitDays}일)
                                </div>
                            </div>

                            {/* 월 지급액 */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                    <span className="text-slate-400 block mb-1">월 환산 수령액 (30일 기준)</span>
                                    <span className="font-bold font-mono text-sm text-slate-200">
                                        ₩ {unemploymentResults.monthlyBenefit.toLocaleString()}
                                    </span>
                                </div>
                                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                                    <span className="text-slate-400 block mb-1">1일 상/하한 보정</span>
                                    <span className="font-bold text-sm text-emerald-300">
                                        2026년 기준 적용
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
