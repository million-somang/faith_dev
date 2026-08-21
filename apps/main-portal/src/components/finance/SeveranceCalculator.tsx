import { useState, useMemo } from 'react';

export default function SeveranceCalculator() {
    const [subTab, setSubTab] = useState<'severance' | 'unemployment'>('severance');

    // 1. 퇴직금 입력 필드
    const [startDate, setStartDate] = useState<string>('2021-01-01');
    const [endDate, setEndDate] = useState<string>('2026-01-01');
    const [monthlySalary3Months, setMonthlySalary3Months] = useState<number>(10500000); // 최근 3개월 급여 합계 (월 350만 * 3)
    const [annualBonus, setAnnualBonus] = useState<number>(3000000); // 연간 상여금 총액
    const [annualLeavePay, setAnnualLeavePay] = useState<number>(500000); // 연차수당

    // 2. 실업급여 입력 필드
    const [age, setAge] = useState<number>(35);
    const [disabled, setDisabled] = useState<boolean>(false);
    const [insuranceYears, setInsuranceYears] = useState<number>(3); // 1~3년
    const [avgMonthlyWage, setAvgMonthlyWage] = useState<number>(3500000); // 퇴직전 월급

    // 퇴직금 계산 엔진
    const severanceResults = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.max(0, end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalYears = totalDays / 365;

        // 365일 미만 체크
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

        // 1일 평균임금 = (3개월 급여 + (연간상여금 * 3/12) + (연차수당 * 3/12)) / 92일
        const bonus3Months = annualBonus * (3 / 12);
        const leave3Months = annualLeavePay * (3 / 12);
        const total3MonthsPay = monthlySalary3Months + bonus3Months + leave3Months;
        const dailyAvgWage = total3MonthsPay / 92; // 3개월 대략 92일

        // 법정 퇴직금 = 1일 평균임금 * 30일 * (재직일수 / 365)
        const grossSeverance = Math.floor(dailyAvgWage * 30 * (totalDays / 365));

        // 퇴직소득세 약식 산출 (근속연수 공제 및 표준세율)
        let serviceDeduction = 0;
        const serviceYears = Math.ceil(totalYears);
        if (serviceYears <= 5) serviceDeduction = serviceYears * 1000000;
        else if (serviceYears <= 10) serviceDeduction = 5000000 + (serviceYears - 5) * 2000000;
        else serviceDeduction = 15000000 + (serviceYears - 10) * 2500000;

        const taxableBase = Math.max(0, grossSeverance - serviceDeduction);
        const estTax = Math.floor(taxableBase * 0.055); // 대략적인 실효세율 3~6%
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
        // 1일 평균임금
        const dailyWage = (avgMonthlyWage * 3) / 92;
        // 기초일액 = 1일 평균임금의 60%
        let dailyBenefit = dailyWage * 0.60;

        // 상한액 및 하한액 보정 (2026년 기준 상한 66,000원, 하한 약 63,104원)
        const maxDaily = 66000;
        const minDaily = 63104;
        dailyBenefit = Math.min(maxDaily, Math.max(minDaily, dailyBenefit));

        // 소정급여일수 매핑
        const isOver50OrDisabled = age >= 50 || disabled;
        let benefitDays = 120;

        if (insuranceYears < 1) benefitDays = 120;
        else if (insuranceYears < 3) benefitDays = isOver50OrDisabled ? 180 : 150;
        else if (insuranceYears < 5) benefitDays = isOver50OrDisabled ? 210 : 180;
        else if (insuranceYears < 10) benefitDays = isOver50OrDisabled ? 240 : 210;
        else benefitDays = isOver50OrDisabled ? 270 : 240;

        // 총 예상 수급액
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

            {/* 고단가 IRP 계좌 및 취업지원 광고 슬롯 */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-6 border border-teal-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold">
                        📑
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">퇴직금을 IRP 계좌로 받으면 퇴직소득세 30% 감면!</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                            퇴직 시 IRP 계좌로 이체하여 55세 이후 연금으로 수령하면 세금이 30~40% 감면되고 과세이연 복리 혜택을 누릴 수 있습니다.
                        </p>
                    </div>
                </div>
                <a
                    href="/guides/compound-interest-calculator-guide-and-wealth-building"
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors shadow-sm"
                >
                    복리 & IRP 절세 가이드 →
                </a>
            </div>

            {/* 상세 사용자 설명서 & 완벽 퇴직/실업 가이드 섹션 */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-700">
                <div className="border-b border-slate-100 pb-5">
                    <span className="text-xs font-extrabold text-teal-600 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
                        Detailed Manual & Guide
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
                        <i className="fas fa-book-open text-teal-600"></i> 퇴직금 & 실업급여 계산기 상세 이용 설명서
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        본 계산기는 근로기준법 제34조(퇴직급여제도) 및 고용보험법에 규정된 최신 산정 기준(2026년 실업급여 상·하한액)을 바탕으로 내 통장에 입금되는 세후 실수령액과 정부 지원금을 정확하게 계산합니다.
                    </p>
                </div>

                {/* 1. 계산기 단계별 사용 매뉴얼 */}
                <div className="space-y-4">
                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                        계산기 단계별 사용 방법
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <span className="font-extrabold text-teal-700 block text-sm">STEP 1. 계산 모드 선택</span>
                            <p className="text-slate-600 leading-relaxed">
                                상단 탭에서 <strong>[퇴직금 계산기]</strong> 또는 <strong>[실업급여 계산기]</strong> 중 원하는 시뮬레이션 항목을 선택합니다.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <span className="font-extrabold text-teal-700 block text-sm">STEP 2. 근무 및 급여 정보 입력</span>
                            <p className="text-slate-600 leading-relaxed">
                                퇴직금은 입사/퇴사일과 직전 3개월 기본급/상여금을, 실업급여는 퇴사 당시 만 나이와 고용보험 가입기간을 입력합니다.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <span className="font-extrabold text-teal-700 block text-sm">STEP 3. 실수령액 및 IRP 절세 확인</span>
                            <p className="text-slate-600 leading-relaxed">
                                근속연수 공제가 반영된 퇴직소득세 차감 실수령액과, 실업급여 총 수급일수 및 비과세 총지원금을 즉시 확인합니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. 법정 퇴직금 산정 공식 & IRP 계좌 절세 원리 */}
                <div className="space-y-4 pt-2">
                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                        법정 퇴직금 산출 공식 및 퇴직소득세 절세 비법
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200/80 space-y-2">
                            <h5 className="font-extrabold text-teal-900 text-sm">📐 근로기준법상 퇴직금 산정 공식</h5>
                            <p className="text-slate-700">
                                <strong>퇴직금 = 1일 평균임금 × 30일 × (총 재직일수 ÷ 365)</strong><br />
                                1일 평균임금은 퇴직일 직전 3개월간 지급된 임금 총액(기본급 + 연간 상여금의 3/12 + 미사용 연차수당의 3/12)을 해당 3개월 총 일수로 나누어 계산합니다. (통상임금이 평균임금보다 클 경우 통상임금 적용)
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-2">
                            <h5 className="font-extrabold text-emerald-900 text-sm">💡 IRP 계좌 이전 시 퇴직소득세 30~40% 감면</h5>
                            <p className="text-slate-700">
                                퇴직금을 일반 급여통장이 아닌 <strong>개인형 퇴직연금(IRP)</strong> 계좌로 수령한 뒤 55세 이후 연금으로 수령하면, 퇴직소득세의 <strong>30%(10년 초과 수령 시 40%)</strong>를 감면받을 수 있으며 퇴직 시점 세금 징수가 연기되는 <strong>과세이연</strong> 효과를 누립니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. 2026 고용보험 실업급여(구직급여) 연령 및 기간별 지급일수 테이블 */}
                <div className="space-y-4 pt-2">
                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                        실업급여(구직급여) 연령 및 가입기간별 총 지급일수 표
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-200 rounded-2xl overflow-hidden">
                            <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">연령 및 구분</th>
                                    <th className="p-3">1년 미만 (180일 이상)</th>
                                    <th className="p-3">1년 이상 ~ 3년 미만</th>
                                    <th className="p-3">3년 이상 ~ 5년 미만</th>
                                    <th className="p-3">5년 이상 ~ 10년 미만</th>
                                    <th className="p-3">10년 이상</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                                <tr>
                                    <td className="p-3 font-bold text-slate-900">만 50세 미만</td>
                                    <td className="p-3 font-mono">120일</td>
                                    <td className="p-3 font-mono">150일</td>
                                    <td className="p-3 font-mono">180일</td>
                                    <td className="p-3 font-mono">210일</td>
                                    <td className="p-3 font-mono font-bold text-teal-700">240일 (8개월)</td>
                                </tr>
                                <tr className="bg-teal-50/30">
                                    <td className="p-3 font-bold text-teal-900">만 50세 이상 및 장애인</td>
                                    <td className="p-3 font-mono">120일</td>
                                    <td className="p-3 font-mono">180일</td>
                                    <td className="p-3 font-mono">210일</td>
                                    <td className="p-3 font-mono">240일</td>
                                    <td className="p-3 font-mono font-bold text-teal-700">270일 (9개월)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. 자주 묻는 질문 (FAQ) */}
                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
                        <i className="fas fa-question-circle text-teal-600"></i> 자주 묻는 질문 (FAQ)
                    </h4>
                    <dl className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                            <dt className="font-bold text-slate-900 text-sm">Q. 자진 퇴사(개인 사유) 시 실업급여를 받을 수 있는 예외 사유는?</dt>
                            <dd className="text-slate-600 mt-1 leading-relaxed">
                                A. 사업장 이전·이사로 통근시간이 왕복 3시간 이상 소요되는 경우, 최근 1년 내 2개월 이상 임금체불 또는 최저임금 미달이 발생한 경우, 질병·부상으로 업무 수행이 불가능하다는 의사 소견서가 있는 경우 정당한 이직 사유로 인정되어 수급이 가능합니다.
                            </dd>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                            <dt className="font-bold text-slate-900 text-sm">Q. 실업급여는 세금을 떼나요?</dt>
                            <dd className="text-slate-600 mt-1 leading-relaxed">
                                A. 아니요, 고용보험법상 실업급여(구직급여)는 사회복지 급여로서 <strong>전액 비과세</strong> 처리되므로 소득세 및 4대보험이 원천징수되지 않고 계산된 전액이 계좌로 지급됩니다.
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>
        </div>
    );
}
