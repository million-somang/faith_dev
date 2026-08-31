import React, { useState, useMemo } from 'react';

interface UnemploymentCalcProps {
  onShowToast: (msg: string) => void;
}

export default function UnemploymentCalc({ onShowToast }: UnemploymentCalcProps) {
  // 연령 구분: 만 50세 미만 vs 만 50세 이상
  const [ageGroup, setAgeGroup] = useState<'under50' | 'over50'>('under50');

  // 고용보험 가입기간
  const [insuredPeriod, setInsuredPeriod] = useState<string>('3to5');

  // 1일 소정근로시간 (시간)
  const [workingHours, setWorkingHours] = useState<number>(8);

  // 퇴직 전 3개월 평균 월급여
  const [monthlyWage, setMonthlyWage] = useState<number>(3000000);

  // 계산 애니메이션 트리거
  const [calcKey, setCalcKey] = useState<number>(0);

  // 소정급여일수 매핑 테이블 (고용보험법 제50조 별표1)
  const benefitDays = useMemo(() => {
    if (ageGroup === 'under50') {
      switch (insuredPeriod) {
        case 'under1': return 120;
        case '1to3': return 150;
        case '3to5': return 180;
        case '5to10': return 210;
        case 'over10': return 240;
        default: return 180;
      }
    } else {
      switch (insuredPeriod) {
        case 'under1': return 120;
        case '1to3': return 180;
        case '3to5': return 210;
        case '5to10': return 240;
        case 'over10': return 270;
        default: return 210;
      }
    }
  }, [ageGroup, insuredPeriod]);

  // 실업급여 산출 (2026년 기준)
  const result = useMemo(() => {
    // 1일 평균임금 (3개월 92일 기준)
    const dailyWage = Math.floor((monthlyWage * 3) / 92);
    const baseBenefit = Math.floor(dailyWage * 0.6); // 평균임금의 60%

    // 2026년 상한액 & 하한액
    const MAX_DAILY_BENEFIT = 66000;
    // 2026년 하한액: 2026 최저시급 10,030원 × 80% = 8,024원
    const MIN_HOURLY_BENEFIT = 8024;
    const minDailyBenefit = MIN_HOURLY_BENEFIT * workingHours;

    let appliedDailyBenefit = baseBenefit;
    let appliedReason = '평균임금의 60% 정률 적용';

    if (baseBenefit > MAX_DAILY_BENEFIT) {
      appliedDailyBenefit = MAX_DAILY_BENEFIT;
      appliedReason = '2026년 법정 상한액(66,000원) 초과로 상한 적용';
    } else if (baseBenefit < minDailyBenefit) {
      appliedDailyBenefit = minDailyBenefit;
      appliedReason = `2026년 법정 하한액(${minDailyBenefit.toLocaleString()}원) 미달로 하한 보장 적용`;
    }

    const totalBenefit = appliedDailyBenefit * benefitDays;

    // 월별 수급 스케줄 (1차 8일 + 2차~ 28일 주기)
    const schedule: { round: number; days: number; amount: number }[] = [];
    let remainingDays = benefitDays;
    let round = 1;

    while (remainingDays > 0) {
      const days = round === 1 ? Math.min(8, remainingDays) : Math.min(28, remainingDays);
      schedule.push({
        round,
        days,
        amount: days * appliedDailyBenefit
      });
      remainingDays -= days;
      round++;
    }

    return {
      dailyWage,
      baseBenefit,
      appliedDailyBenefit,
      minDailyBenefit,
      maxDailyBenefit: MAX_DAILY_BENEFIT,
      benefitDays,
      totalBenefit,
      schedule,
      appliedReason,
      isMaxCapped: baseBenefit > MAX_DAILY_BENEFIT,
      isMinCapped: baseBenefit < minDailyBenefit
    };
  }, [monthlyWage, workingHours, benefitDays]);

  const handleRecalculate = () => {
    setCalcKey(prev => prev + 1);
    onShowToast('고용노동부 2026 최신 기준으로 계산되었습니다! ⚡');
  };

  const copyResult = () => {
    const text = `[2026 실업급여(구직급여) 모의계산 결과]
- 월 평균 급여: ${monthlyWage.toLocaleString()}원 (1일 평균임금 ${result.dailyWage.toLocaleString()}원)
- 연령 및 가입기간: ${ageGroup === 'under50' ? '만 50세 미만' : '만 50세 이상'} | ${insuredPeriod}
- 1일 구직급여액: ${result.appliedDailyBenefit.toLocaleString()}원 (${result.appliedReason})
- 소정 급여일수: ${result.benefitDays}일 (약 ${(result.benefitDays / 30).toFixed(1)}개월)
- 총 예상 수급액: ${result.totalBenefit.toLocaleString()}원
출처: VERA 실업급여 계산기 (veranex.app)`;
    navigator.clipboard.writeText(text);
    onShowToast('실업급여 계산 결과가 복사되었습니다! 📋');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 안내 배너 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <i className="fas fa-hand-holding-usd text-xs"></i>
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-extrabold text-emerald-900 mb-0.5">2026년 고용노동부 최신 실업급여 산식 실시간 적용</p>
          <p className="text-slate-600">
            퇴직 전 3개월 평균임금의 60%를 산출한 뒤, 2026년 법정 <strong>상한액(66,000원)</strong> 및 <strong>하한액(64,192원)</strong>을 자동 비교 판정합니다.
          </p>
        </div>
      </div>

      {/* 1. 조건 설정 카드 */}
      <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <i className="fas fa-user-check text-emerald-600"></i>
          <span>수급 자격 및 급여 정보 입력</span>
        </h3>

        {/* 급여 입력 및 퀵 선택 칩 */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            퇴직 전 3개월 평균 월급여 (세전)
          </label>
          <div className="relative">
            <input
              type="number"
              value={monthlyWage || ''}
              onChange={(e) => setMonthlyWage(Number(e.target.value))}
              placeholder="예: 3000000"
              step={100000}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:border-emerald-600 outline-none pr-10"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
          </div>
          {/* 금액 퀵 칩 */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {[2000000, 2500000, 3000000, 3500000, 4000000, 5000000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMonthlyWage(val)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  monthlyWage === val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {(val / 10000).toLocaleString()}만원
              </button>
            ))}
          </div>
        </div>

        {/* 연령 선택 */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">퇴사 시점 연령 구분</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAgeGroup('under50')}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                ageGroup === 'under50'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              만 50세 미만
            </button>
            <button
              type="button"
              onClick={() => setAgeGroup('over50')}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                ageGroup === 'over50'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              만 50세 이상 또는 장애인
            </button>
          </div>
        </div>

        {/* 고용보험 가입기간 */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">고용보험 총 가입기간 (근속 기간)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { key: 'under1', label: '1년 미만', days: 120 },
              { key: '1to3', label: '1년 ~ 3년 미만', days: ageGroup === 'under50' ? 150 : 180 },
              { key: '3to5', label: '3년 ~ 5년 미만', days: ageGroup === 'under50' ? 180 : 210 },
              { key: '5to10', label: '5년 ~ 10년 미만', days: ageGroup === 'under50' ? 210 : 240 },
              { key: 'over10', label: '10년 이상', days: ageGroup === 'under50' ? 240 : 270 },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setInsuredPeriod(item.key)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  insuredPeriod === item.key
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-xs font-bold">{item.label}</span>
                <span className="block text-[10px] font-bold text-emerald-600 mt-0.5">{item.days}일 지급</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1일 근로시간 */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">1일 소정근로시간</label>
          <select
            value={workingHours}
            onChange={(e) => setWorkingHours(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
          >
            <option value={8}>8시간 (일반 전일제 근로)</option>
            <option value={7}>7시간</option>
            <option value={6}>6시간</option>
            <option value={5}>5시간</option>
            <option value={4}>4시간 이하 (단시간/파트타임)</option>
          </select>
        </div>

        {/* 즉시 계산 버튼 */}
        <button
          type="button"
          onClick={handleRecalculate}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <i className="fas fa-bolt text-amber-300"></i>
          <span>실업급여 모의계산 다시 실행</span>
        </button>
      </div>

      {/* 2. 계산 결과 리포트 카드 */}
      <div key={calcKey} className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-teal-800/40 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300">UNEMPLOYMENT BENEFIT ESTIMATE</span>
            <h4 className="text-base sm:text-lg font-black text-white">2026 실업급여 예상 수급액</h4>
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

        {/* 메인 결과값: 총 예상 수급액 */}
        <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 text-center space-y-1">
          <span className="text-xs text-teal-200 font-bold">총 예상 수급액 ({result.benefitDays}일 기준)</span>
          <div className="text-2xl sm:text-3xl font-black text-teal-300 tracking-tight">
            {result.totalBenefit.toLocaleString()}
            <span className="text-base sm:text-lg font-bold text-white ml-1">원</span>
          </div>
          <p className="text-[11px] text-slate-300">
            1일 {result.appliedDailyBenefit.toLocaleString()}원 × {result.benefitDays}일 (약 {(result.benefitDays / 30).toFixed(1)}개월 지급)
          </p>
        </div>

        {/* 3단계 산출 과정 안내 카드 (실시간 계산 근거) */}
        <div className="bg-emerald-950/40 rounded-2xl p-3.5 border border-emerald-500/20 space-y-2 text-xs">
          <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
            <i className="fas fa-calculator text-emerald-400"></i>
            <span>2026년 고용노동부 법정 산정 근거</span>
          </span>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>① 1일 평균임금 (3개월 총액 ÷ 92일)</span>
              <span className="font-bold text-white">{result.dailyWage.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>② 평균임금의 60%</span>
              <span className="font-bold text-slate-200">{result.baseBenefit.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>③ 2026년 법정 기준 (상한 / 하한)</span>
              <span className="font-bold text-amber-300">상한 66,000원 / 하한 {result.minDailyBenefit.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-emerald-300 font-extrabold">
              <span>👉 최종 1일 지급 판정액</span>
              <span className="text-sm text-emerald-400">{result.appliedDailyBenefit.toLocaleString()}원 ({result.appliedReason})</span>
            </div>
          </div>
        </div>

        {/* 세부 항목 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] text-slate-400 block mb-0.5">1일 구직급여액</span>
            <span className="font-bold text-teal-300 text-sm">{result.appliedDailyBenefit.toLocaleString()}원</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] text-slate-400 block mb-0.5">소정급여일수</span>
            <span className="font-bold text-white text-sm">{result.benefitDays}일</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block mb-0.5">적용 기준</span>
            <span className="font-bold text-amber-300 text-xs">
              {result.isMaxCapped ? '2026 상한액(6.6만) 적용' : result.isMinCapped ? '2026 하한액 보장 적용' : '평균임금의 60%'}
            </span>
          </div>
        </div>

        {/* 회차별 지급 스케줄표 (아코디언 토글 형태) */}
        <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 space-y-2">
          <span className="text-xs font-bold text-teal-200 block">📅 회차별 예상 지급 일정표</span>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {result.schedule.map((item) => (
              <div key={item.round} className="flex items-center justify-between text-xs py-1 px-2.5 bg-black/20 rounded-lg">
                <span className="text-slate-300 font-medium">{item.round}차 실업인정 ({item.days}일분)</span>
                <span className="font-bold text-white">{item.amount.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-teal-950/60 rounded-xl p-3 border border-teal-800/60 text-[10px] text-teal-200/80 leading-relaxed">
          <i className="fas fa-info-circle mr-1 text-teal-400"></i>
          실업급여를 수급하기 위해서는 퇴직 전 18개월간 피보험단위기간이 180일 이상이어야 하며, 경영상 해고·권고사직·계약만료 등 <strong>비자발적 퇴사</strong>여야 합니다. (이직확인서 처리 후 관할 고용센터 방문 신청)
        </div>
      </div>
    </div>
  );
}
