import React, { useState, useMemo } from 'react';

interface SeveranceCalcProps {
  onShowToast: (msg: string) => void;
}

export default function SeveranceCalc({ onShowToast }: SeveranceCalcProps) {
  // 날짜 기본값: 3년 전 오늘 ~ 오늘
  const todayStr = new Date().toISOString().split('T')[0];
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const threeYearsAgoStr = threeYearsAgo.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(threeYearsAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  // 급여 입력 (월 평균 급여 또는 3개월 개별 입력)
  const [isDetailSalary, setIsDetailSalary] = useState(false);
  const [monthlySalary, setMonthlySalary] = useState(3000000);
  const [m1Salary, setM1Salary] = useState(3000000);
  const [m2Salary, setM2Salary] = useState(3000000);
  const [m3Salary, setM3Salary] = useState(3000000);

  // 상여금 및 연차수당
  const [annualBonus, setAnnualBonus] = useState(0);
  const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState(0);

  // 통상임금 비교 옵션
  const [useRegularWage, setUseRegularWage] = useState(false);
  const [dailyRegularWage, setDailyRegularWage] = useState(0);

  // 계산 애니메이션 트리거
  const [calcKey, setCalcKey] = useState<number>(0);

  // 재직일수 및 3개월 일수 계산
  const { totalDays, serviceYears, threeMonthsDays } = useMemo(() => {
    if (!startDate || !endDate) return { totalDays: 0, serviceYears: 0, threeMonthsDays: 90 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const years = Math.max(1, Math.ceil(days / 365));

    // 최근 3개월 총 일수 (퇴사일 기준 직전 3개월 일수 정밀 계산)
    const threeMonthsAgo = new Date(end);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const tmDiff = Math.floor((end.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
    const tmDays = tmDiff > 80 && tmDiff < 100 ? tmDiff : 92;

    return { totalDays: days, serviceYears: years, threeMonthsDays: tmDays };
  }, [startDate, endDate]);

  // 계산 결과
  const result = useMemo(() => {
    if (totalDays <= 0) return null;

    // 3개월 임금 총액
    const threeMonthsBase = isDetailSalary
      ? (m1Salary + m2Salary + m3Salary)
      : (monthlySalary * 3);

    // 상여금 & 연차수당 3/12 가산
    const bonus3Months = (annualBonus * 3) / 12;
    const leave3Months = (annualLeaveAllowance * 3) / 12;
    const total3MonthsWage = threeMonthsBase + bonus3Months + leave3Months;

    // 1일 평균임금
    const avgDailyWage = threeMonthsDays > 0 ? (total3MonthsWage / threeMonthsDays) : 0;

    // 통상임금 비교 적용
    const appliedDailyWage = useRegularWage && dailyRegularWage > avgDailyWage
      ? dailyRegularWage
      : avgDailyWage;

    // 세전 법정 퇴직금: 1일 평균임금 * 30일 * (재직일수 / 365)
    const grossSeverance = Math.floor(appliedDailyWage * 30 * (totalDays / 365));

    // 2026년 개정 세법 기준 퇴직소득세 계산
    let deduction = 0;
    if (serviceYears <= 5) {
      deduction = serviceYears * 1000000;
    } else if (serviceYears <= 10) {
      deduction = 5000000 + (serviceYears - 5) * 2000000;
    } else if (serviceYears <= 20) {
      deduction = 15000000 + (serviceYears - 10) * 2500000;
    } else {
      deduction = 40000000 + (serviceYears - 20) * 3000000;
    }

    const afterServiceDeduction = Math.max(0, grossSeverance - deduction);
    const convertedSalary = (afterServiceDeduction / serviceYears) * 12;

    // 환산급여 공제
    let convertedDeduction = 0;
    if (convertedSalary <= 8000000) {
      convertedDeduction = convertedSalary;
    } else if (convertedSalary <= 70000000) {
      convertedDeduction = 8000000 + (convertedSalary - 8000000) * 0.6;
    } else if (convertedSalary <= 120000000) {
      convertedDeduction = 45200000 + (convertedSalary - 70000000) * 0.55;
    } else if (convertedSalary <= 300000000) {
      convertedDeduction = 72700000 + (convertedSalary - 120000000) * 0.45;
    } else {
      convertedDeduction = 153700000 + (convertedSalary - 300000000) * 0.35;
    }

    const taxableBase = Math.max(0, convertedSalary - convertedDeduction);

    // 기본 누진세율 적용
    let convertedTax = 0;
    if (taxableBase <= 14000000) {
      convertedTax = taxableBase * 0.06;
    } else if (taxableBase <= 50000000) {
      convertedTax = 840000 + (taxableBase - 14000000) * 0.15;
    } else if (taxableBase <= 88000000) {
      convertedTax = 6240000 + (taxableBase - 50000000) * 0.24;
    } else if (taxableBase <= 150000000) {
      convertedTax = 15360000 + (taxableBase - 88000000) * 0.35;
    } else if (taxableBase <= 300000000) {
      convertedTax = 37060000 + (taxableBase - 150000000) * 0.38;
    } else if (taxableBase <= 500000000) {
      convertedTax = 94060000 + (taxableBase - 300000000) * 0.40;
    } else if (taxableBase <= 1000000000) {
      convertedTax = 174060000 + (taxableBase - 500000000) * 0.42;
    } else {
      convertedTax = 384060000 + (taxableBase - 1000000000) * 0.45;
    }

    const calculatedTax = Math.floor((convertedTax / 12) * serviceYears);
    const localIncomeTax = Math.floor(calculatedTax * 0.1);
    const totalTax = calculatedTax + localIncomeTax;
    const netSeverance = Math.max(0, grossSeverance - totalTax);
    const effectiveTaxRate = grossSeverance > 0 ? ((totalTax / grossSeverance) * 100).toFixed(2) : '0.00';

    return {
      grossSeverance,
      netSeverance,
      totalTax,
      calculatedTax,
      localIncomeTax,
      effectiveTaxRate,
      deduction,
      taxableBase: Math.floor(taxableBase),
      threeMonthsBase,
      bonus3Months: Math.floor(bonus3Months),
      leave3Months: Math.floor(leave3Months),
      total3MonthsWage: Math.floor(total3MonthsWage),
      avgDailyWage: Math.floor(avgDailyWage),
      appliedDailyWage: Math.floor(appliedDailyWage),
      isRegularWageApplied: useRegularWage && dailyRegularWage > avgDailyWage
    };
  }, [totalDays, serviceYears, threeMonthsDays, isDetailSalary, monthlySalary, m1Salary, m2Salary, m3Salary, annualBonus, annualLeaveAllowance, useRegularWage, dailyRegularWage]);

  const handleRecalculate = () => {
    setCalcKey(prev => prev + 1);
    onShowToast('고용노동부 및 2026 개정 세법 기준으로 계산되었습니다! ⚡');
  };

  const copyResult = () => {
    if (!result) return;
    const text = `[2026 법정 퇴직금 계산 결과]
- 재직 기간: ${startDate} ~ ${endDate} (${totalDays.toLocaleString()}일, 근속 ${serviceYears}년)
- 1일 평균임금: ${result.appliedDailyWage.toLocaleString()}원
- 세전 예상 퇴직금: ${result.grossSeverance.toLocaleString()}원
- 퇴직소득세+지방세: ${result.totalTax.toLocaleString()}원 (실효세율 ${result.effectiveTaxRate}%)
- 세후 실수령액: ${result.netSeverance.toLocaleString()}원
출처: VERA 퇴직금 계산기 (veranex.app)`;
    navigator.clipboard.writeText(text);
    onShowToast('계산 결과가 클립보드에 복사되었습니다! 📋');
  };

  const isEligible = totalDays >= 365;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 안내 배너 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <i className="fas fa-calculator text-xs"></i>
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-extrabold text-blue-900 mb-0.5">고용노동부 법정 산정 기준 실시간 적용</p>
          <p className="text-slate-600">
            입사일/퇴사일과 급여를 변경하시면 1일 평균임금과 2026년 개정 세법 기준 <strong>세후 실수령 퇴직금</strong>이 실시간으로 산출됩니다.
          </p>
        </div>
      </div>

      {/* 1. 재직 기간 입력 카드 */}
      <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <i className="fas fa-calendar-check text-blue-600"></i>
            <span>재직 기간 설정</span>
          </h3>
          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
            isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700 animate-pulse'
          }`}>
            {isEligible ? `재직 ${totalDays.toLocaleString()}일 (수급 대상 ✓)` : `재직 ${totalDays.toLocaleString()}일 (1년 미만)`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">입사일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">퇴사일 (마지막 근무일 다음날)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            />
          </div>
        </div>

        {!isEligible && totalDays > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-700 leading-relaxed">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            근로자퇴직급여 보장법상 계속 근로기간이 <strong>1년(365일) 미만</strong>인 경우 법정 퇴직금 지급 의무가 발생하지 않습니다. (회사 내규 확인 필요)
          </div>
        )}
      </div>

      {/* 2. 임금 정보 입력 카드 */}
      <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <i className="fas fa-won-sign text-emerald-600"></i>
            <span>최근 3개월 임금 내역</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsDetailSalary(!isDetailSalary)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
          >
            {isDetailSalary ? '간편 월급 입력으로 전환' : '3개월 개별 입력'}
          </button>
        </div>

        {!isDetailSalary ? (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              월 기본급여 (세전 금액)
            </label>
            <div className="relative">
              <input
                type="number"
                value={monthlySalary || ''}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                placeholder="예: 3000000"
                step={100000}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors pr-10"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
            </div>
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {[2000000, 2500000, 3000000, 3500000, 4000000, 5000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMonthlySalary(val)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    monthlySalary === val ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {(val / 10000).toLocaleString()}만원
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">퇴직 1개월 전 급여</label>
              <input
                type="number"
                value={m1Salary || ''}
                onChange={(e) => setM1Salary(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">퇴직 2개월 전 급여</label>
              <input
                type="number"
                value={m2Salary || ''}
                onChange={(e) => setM2Salary(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">퇴직 3개월 전 급여</label>
              <input
                type="number"
                value={m3Salary || ''}
                onChange={(e) => setM3Salary(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
              />
            </div>
          </div>
        )}

        {/* 상여금 및 연차수당 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              연간 정기 상여금 총액 <span className="text-[10px] text-slate-400 font-normal">(3/12 가산)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={annualBonus || ''}
                onChange={(e) => setAnnualBonus(Number(e.target.value))}
                placeholder="0"
                step={500000}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              연차수당 총액 <span className="text-[10px] text-slate-400 font-normal">(미사용 3/12 가산)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={annualLeaveAllowance || ''}
                onChange={(e) => setAnnualLeaveAllowance(Number(e.target.value))}
                placeholder="0"
                step={100000}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
            </div>
          </div>
        </div>

        {/* 통상임금 비교 옵션 */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={useRegularWage}
              onChange={(e) => setUseRegularWage(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-700">1일 통상임금 비교 적용 (근로기준법 제19조 제2항)</span>
          </label>
          {useRegularWage && (
            <div className="pl-6">
              <input
                type="number"
                value={dailyRegularWage || ''}
                onChange={(e) => setDailyRegularWage(Number(e.target.value))}
                placeholder="1일 통상임금 입력 (예: 110000)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                평균임금이 통상임금보다 적을 경우 통상임금을 기준으로 퇴직금이 계산됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 즉시 계산 버튼 */}
        <button
          type="button"
          onClick={handleRecalculate}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <i className="fas fa-bolt text-amber-300"></i>
          <span>퇴직금 모의계산 다시 실행</span>
        </button>
      </div>

      {/* 3. 계산 결과 리포트 카드 */}
      {result && (
        <div key={calcKey} className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800/40 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">ESTIMATED SEVERANCE PAY</span>
              <h4 className="text-base sm:text-lg font-black text-white">2026 예상 퇴직금 산출 리포트</h4>
            </div>
            <button
              type="button"
              onClick={copyResult}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-copy"></i>
              <span>결과 복사</span>
            </button>
          </div>

          {/* 메인 결과값: 세후 실수령액 */}
          <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 text-center space-y-1">
            <span className="text-xs text-indigo-200 font-bold">세후 실수령 퇴직금 (지방세 포함 공제 후)</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {result.netSeverance.toLocaleString()}
              <span className="text-base sm:text-lg font-bold text-emerald-300 ml-1">원</span>
            </div>
            <p className="text-[11px] text-slate-400">
              세전 {result.grossSeverance.toLocaleString()}원 대비 약 {(100 - parseFloat(result.effectiveTaxRate)).toFixed(1)}% 실수령
            </p>
          </div>

          {/* 4단계 실시간 산출 근거 안내 카드 */}
          <div className="bg-indigo-950/50 rounded-2xl p-3.5 border border-indigo-500/20 space-y-2 text-xs">
            <span className="text-[11px] font-black text-indigo-300 flex items-center gap-1.5">
              <i className="fas fa-calculator text-indigo-400"></i>
              <span>고용노동부 & 2026 개정 세법 산정 근거</span>
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                <span>① 최근 3개월 임금 총액 (기본급+상여/연차 3/12)</span>
                <span className="font-bold text-white">{result.total3MonthsWage.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                <span>② 1일 평균임금 (3개월 총액 ÷ {threeMonthsDays}일)</span>
                <span className="font-bold text-emerald-400">{result.appliedDailyWage.toLocaleString()}원 {result.isRegularWageApplied && '(통상임금 적용)'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                <span>③ 세전 퇴직금 ({result.appliedDailyWage.toLocaleString()} × 30 × {totalDays}/365)</span>
                <span className="font-bold text-white">{result.grossSeverance.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-rose-300 font-extrabold">
                <span>④ 2026 퇴직소득세 (근속 {serviceYears}년 공제 {result.deduction.toLocaleString()}원 차감)</span>
                <span className="text-sm text-rose-400">-{result.totalTax.toLocaleString()}원 (실효세율 {result.effectiveTaxRate}%)</span>
              </div>
            </div>
          </div>

          {/* 세부 항목 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-slate-400 block mb-0.5">세전 법정 퇴직금</span>
              <span className="font-bold text-white text-sm">{result.grossSeverance.toLocaleString()}원</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-slate-400 block mb-0.5">퇴직소득세 (지방세 포함)</span>
              <span className="font-bold text-rose-400 text-sm">-{result.totalTax.toLocaleString()}원</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block mb-0.5">실효 세율</span>
              <span className="font-bold text-amber-300 text-sm">{result.effectiveTaxRate}%</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-slate-400 block mb-0.5">1일 평균임금</span>
              <span className="font-bold text-slate-200 text-xs">{result.avgDailyWage.toLocaleString()}원</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-slate-400 block mb-0.5">재직일수 / 근속연수</span>
              <span className="font-bold text-slate-200 text-xs">{totalDays.toLocaleString()}일 ({serviceYears}년)</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block mb-0.5">적용 기준</span>
              <span className="font-bold text-slate-200 text-xs">
                {result.isRegularWageApplied ? '통상임금 보정' : '평균임금'}
              </span>
            </div>
          </div>

          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-800/60 text-[10px] text-indigo-200/80 leading-relaxed">
            <i className="fas fa-info-circle mr-1 text-indigo-400"></i>
            본 모의계산은 2026년 소득세법 제55조(기본세율) 및 근속연수별 퇴직소득공제 규정을 준수하여 정밀 계산되었습니다. 실제 퇴직 시점의 수당 및 IRP(개인형 퇴직연금) 계좌 이전 시 과세이연 혜택에 따라 차이가 발생할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}
