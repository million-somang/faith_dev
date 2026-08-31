import React, { useState, useMemo } from 'react';

interface InterestCalcProps {
  onShowToast: (msg: string) => void;
}

export default function InterestCalc({ onShowToast }: InterestCalcProps) {
  // 저축 상품 유형: 정기예금(거치식) vs 정기적금(적립식)
  const [productType, setProductType] = useState<'deposit' | 'savings'>('deposit');

  // 예치 금액 (예금: 총 예치금 / 적금: 월 납입액)
  const [principal, setPrincipal] = useState<number>(10000000);

  // 저축 기간 (개월 수)
  const [months, setMonths] = useState<number>(12);

  // 약정 연이율 (%)
  const [rate, setRate] = useState<number>(3.8);

  // 이자 계산 방식: 단리(simple) vs 월복리(compound)
  const [calcMethod, setCalcMethod] = useState<'simple' | 'compound'>('simple');

  // 선택된 기본 과세 유형: 일반과세(normal: 15.4%), 세금우대(preferential: 9.5%), 비과세(taxFree: 0%)
  const [selectedTax, setSelectedTax] = useState<'normal' | 'preferential' | 'taxFree'>('normal');

  // 계산 애니메이션 트리거
  const [calcKey, setCalcKey] = useState<number>(0);

  // 상품 유형 변경 시 기본 금액 프리셋 조정
  const handleProductTypeChange = (type: 'deposit' | 'savings') => {
    setProductType(type);
    if (type === 'deposit' && principal < 1000000) {
      setPrincipal(10000000);
    } else if (type === 'savings' && principal > 5000000) {
      setPrincipal(1000000);
    }
  };

  // 정밀 이자 및 과세 유형별 산출
  const result = useMemo(() => {
    const annualRate = rate / 100;
    const monthlyRate = annualRate / 12;

    let totalPrincipal = 0;
    let preTaxInterest = 0;

    // 월별 스케줄 데이터
    const schedule: {
      month: number;
      depositThisMonth: number;
      cumPrincipal: number;
      cumInterest: number;
      cumTotal: number;
    }[] = [];

    if (productType === 'deposit') {
      // 1. 정기예금 (거치식)
      totalPrincipal = principal;

      if (calcMethod === 'simple') {
        // 단리: 원금 * 연이율 * (개월수 / 12)
        preTaxInterest = principal * annualRate * (months / 12);

        const monthlySimpleInterest = (principal * annualRate) / 12;
        for (let m = 1; m <= months; m++) {
          const cumInt = monthlySimpleInterest * m;
          schedule.push({
            month: m,
            depositThisMonth: m === 1 ? principal : 0,
            cumPrincipal: principal,
            cumInterest: Math.floor(cumInt),
            cumTotal: Math.floor(principal + cumInt),
          });
        }
      } else {
        // 월복리: 원금 * (1 + 월이율)^개월수 - 원금
        let currentBalance = principal;
        for (let m = 1; m <= months; m++) {
          const interestThisMonth = currentBalance * monthlyRate;
          currentBalance += interestThisMonth;
          schedule.push({
            month: m,
            depositThisMonth: m === 1 ? principal : 0,
            cumPrincipal: principal,
            cumInterest: Math.floor(currentBalance - principal),
            cumTotal: Math.floor(currentBalance),
          });
        }
        preTaxInterest = currentBalance - principal;
      }
    } else {
      // 2. 정기적금 (적립식)
      totalPrincipal = principal * months;

      if (calcMethod === 'simple') {
        // 단리: 월납입액 * n(n+1)/2 * (연이율 / 12)
        preTaxInterest = principal * ((months * (months + 1)) / 2) * monthlyRate;

        let cumPrinc = 0;
        let cumInt = 0;
        for (let m = 1; m <= months; m++) {
          cumPrinc += principal;
          // m회차까지 누적된 각 불입금의 1개월치 이자 합산
          const intThisMonth = cumPrinc * monthlyRate;
          cumInt += intThisMonth;
          schedule.push({
            month: m,
            depositThisMonth: principal,
            cumPrincipal: cumPrinc,
            cumInterest: Math.floor(cumInt),
            cumTotal: Math.floor(cumPrinc + cumInt),
          });
        }
      } else {
        // 월복리 적금: 매월 불입금이 복리로 증식
        let currentBalance = 0;
        let cumPrinc = 0;
        for (let m = 1; m <= months; m++) {
          cumPrinc += principal;
          currentBalance = (currentBalance + principal) * (1 + monthlyRate);
          schedule.push({
            month: m,
            depositThisMonth: principal,
            cumPrincipal: cumPrinc,
            cumInterest: Math.floor(currentBalance - cumPrinc),
            cumTotal: Math.floor(currentBalance),
          });
        }
        preTaxInterest = currentBalance - totalPrincipal;
      }
    }

    preTaxInterest = Math.floor(preTaxInterest);

    // 과세 3종 계산
    // 1) 일반과세 (15.4% = 소득세 14% + 지방세 1.4%)
    const normalTax = Math.floor(preTaxInterest * 0.154);
    const normalIncomeTax = Math.floor(preTaxInterest * 0.14);
    const normalLocalTax = normalTax - normalIncomeTax;
    const normalNetInterest = preTaxInterest - normalTax;
    const normalFinalAmount = totalPrincipal + normalNetInterest;

    // 2) 세금우대 (9.5% 농특세 또는 저율과세)
    const prefTax = Math.floor(preTaxInterest * 0.095);
    const prefNetInterest = preTaxInterest - prefTax;
    const prefFinalAmount = totalPrincipal + prefNetInterest;

    // 3) 비과세 (0%)
    const taxFreeTax = 0;
    const taxFreeNetInterest = preTaxInterest;
    const taxFreeFinalAmount = totalPrincipal + taxFreeNetInterest;

    // 선택된 세금 유형의 결과
    let currentNetInterest = normalNetInterest;
    let currentTax = normalTax;
    let currentFinalAmount = normalFinalAmount;
    let taxLabel = '일반과세 (15.4%)';

    if (selectedTax === 'preferential') {
      currentNetInterest = prefNetInterest;
      currentTax = prefTax;
      currentFinalAmount = prefFinalAmount;
      taxLabel = '세금우대 (9.5%)';
    } else if (selectedTax === 'taxFree') {
      currentNetInterest = taxFreeNetInterest;
      currentTax = taxFreeTax;
      currentFinalAmount = taxFreeFinalAmount;
      taxLabel = '비과세 (0%)';
    }

    // 비과세로 가입 시 일반과세 대비 추가 절세 이득액
    const taxFreeBenefit = taxFreeFinalAmount - normalFinalAmount;
    const prefBenefit = prefFinalAmount - normalFinalAmount;

    // 원금 vs 이자 비율 (차트용)
    const interestRatio = currentFinalAmount > 0 ? ((currentNetInterest / currentFinalAmount) * 100).toFixed(1) : '0.0';
    const principalRatio = (100 - parseFloat(interestRatio)).toFixed(1);

    return {
      totalPrincipal,
      preTaxInterest,
      currentNetInterest,
      currentTax,
      currentFinalAmount,
      taxLabel,
      interestRatio,
      principalRatio,
      taxFreeBenefit,
      prefBenefit,
      normal: {
        tax: normalTax,
        incomeTax: normalIncomeTax,
        localTax: normalLocalTax,
        netInterest: normalNetInterest,
        finalAmount: normalFinalAmount,
      },
      preferential: {
        tax: prefTax,
        netInterest: prefNetInterest,
        finalAmount: prefFinalAmount,
      },
      taxFree: {
        tax: 0,
        netInterest: taxFreeNetInterest,
        finalAmount: taxFreeFinalAmount,
      },
      schedule,
    };
  }, [productType, principal, months, rate, calcMethod, selectedTax]);

  const handleRecalculate = () => {
    setCalcKey((prev) => prev + 1);
    onShowToast('2026 최신 세법 기준으로 이자가 다시 계산되었습니다! ⚡');
  };

  const copyResult = () => {
    const text = `[2026 예·적금 이자 & 비과세 모의계산 결과]
- 저축 상품: ${productType === 'deposit' ? '정기예금 (거치식)' : '정기적금 (적립식)'} (${calcMethod === 'simple' ? '단리' : '월복리'})
- 예치/불입액: ${productType === 'deposit' ? principal.toLocaleString() + '원' : '매월 ' + principal.toLocaleString() + '원'}
- 저축 기간 및 금리: ${months}개월 (${(months / 12).toFixed(1)}년) | 연 ${rate}%
- 총 납입원금: ${result.totalPrincipal.toLocaleString()}원
- 세전 이자: ${result.preTaxInterest.toLocaleString()}원
------------------------------------
[과세 유형별 최종 수령액 비교]
1. 일반과세 (15.4%): 세후 ${result.normal.finalAmount.toLocaleString()}원 (이자 ${result.normal.netInterest.toLocaleString()}원)
2. 세금우대 (9.5%):  세후 ${result.preferential.finalAmount.toLocaleString()}원 (이자 ${result.preferential.netInterest.toLocaleString()}원, +${result.prefBenefit.toLocaleString()}원 이득)
3. 비과세 (0%):      세후 ${result.taxFree.finalAmount.toLocaleString()}원 (이자 ${result.taxFree.netInterest.toLocaleString()}원, +${result.taxFreeBenefit.toLocaleString()}원 최대절세!)
출처: VERA 예적금 계산기 (veranex.app)`;

    navigator.clipboard.writeText(text);
    onShowToast('예·적금 계산 결과가 클립보드에 복사되었습니다! 📋');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 안내 배너 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <i className="fas fa-piggy-bank text-xs"></i>
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-extrabold text-blue-900 mb-0.5">2026 최신 예·적금 단리/복리 & 3대 과세 비교</p>
          <p className="text-slate-600">
            정기예금과 정기적금의 실수령액 차이를 계산하고, <strong>일반과세(15.4%) vs 세금우대(9.5%) vs 비과세(0%)</strong> 절세 혜택을 원클릭으로 비교합니다.
          </p>
        </div>
      </div>

      {/* 1. 조건 설정 카드 */}
      <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* 상품 유형 탭 (정기예금 vs 정기적금) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">저축 상품 선택</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleProductTypeChange('deposit')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                productType === 'deposit'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-vault"></i>
              <span>정기예금 (목돈 굴리기)</span>
            </button>
            <button
              type="button"
              onClick={() => handleProductTypeChange('savings')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                productType === 'savings'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-coins"></i>
              <span>정기적금 (목돈 모으기)</span>
            </button>
          </div>
        </div>

        {/* 예치금액 / 월 납입액 */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            {productType === 'deposit' ? '예치 원금 (목돈)' : '매월 납입 금액'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={principal || ''}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              placeholder={productType === 'deposit' ? '예: 10000000' : '예: 1000000'}
              step={productType === 'deposit' ? 1000000 : 100000}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none pr-10"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
          </div>

          {/* 금액 퀵 칩 */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {(productType === 'deposit'
              ? [1000000, 5000000, 10000000, 30000000, 50000000, 100000000]
              : [100000, 300000, 500000, 1000000, 2000000]
            ).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setPrincipal(val)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  principal === val
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {val >= 100000000 ? '1억원' : `${(val / 10000).toLocaleString()}만원`}
              </button>
            ))}
          </div>
        </div>

        {/* 저축 기간 & 약정 이율 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">저축 기간 (개월)</label>
            <div className="relative">
              <input
                type="number"
                value={months || ''}
                onChange={(e) => setMonths(Number(e.target.value))}
                placeholder="12"
                min={1}
                max={120}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">개월</span>
            </div>
            {/* 기간 퀵 칩 */}
            <div className="flex gap-1 mt-1.5 overflow-x-auto">
              {[6, 12, 24, 36, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer whitespace-nowrap ${
                    months === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {m >= 12 ? `${m / 12}년` : `${m}개월`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">약정 연이율 (%)</label>
            <div className="relative">
              <input
                type="number"
                value={rate || ''}
                onChange={(e) => setRate(Number(e.target.value))}
                placeholder="3.8"
                step={0.1}
                min={0.1}
                max={30}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
            {/* 이율 퀵 칩 */}
            <div className="flex gap-1 mt-1.5 overflow-x-auto">
              {[3.0, 3.5, 4.0, 4.5, 5.0].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer whitespace-nowrap ${
                    rate === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {r.toFixed(1)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 단리 / 복리 선택 & 과세 유형 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">이자 계산 방식</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setCalcMethod('simple')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  calcMethod === 'simple'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                단리 (일반)
              </button>
              <button
                type="button"
                onClick={() => setCalcMethod('compound')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  calcMethod === 'compound'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                월복리 (추천 ✨)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">기준 과세 유형</label>
            <select
              value={selectedTax}
              onChange={(e) => setSelectedTax(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
            >
              <option value="normal">일반과세 (15.4% 차감)</option>
              <option value="preferential">세금우대 (9.5% 상호금융)</option>
              <option value="taxFree">비과세 (0% ISA/청년도약/종합저축)</option>
            </select>
          </div>
        </div>

        {/* 즉시 계산 버튼 */}
        <button
          type="button"
          onClick={handleRecalculate}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <i className="fas fa-bolt text-amber-300"></i>
          <span>이자 및 만기 수령액 모의계산 다시 실행</span>
        </button>
      </div>

      {/* 2. 계산 결과 리포트 카드 */}
      <div key={calcKey} className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-800/40 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">INTEREST & MATURITY PAYOUT</span>
            <h4 className="text-base sm:text-lg font-black text-white">
              {productType === 'deposit' ? '정기예금' : '정기적금'} 만기 실수령 리포트
            </h4>
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

        {/* 메인 결과값: 세후 최종 수령액 */}
        <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 text-center space-y-1">
          <span className="text-xs text-cyan-200 font-bold">만기 최종 수령액 ({result.taxLabel})</span>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
            {result.currentFinalAmount.toLocaleString()}
            <span className="text-base sm:text-lg font-bold text-white ml-1">원</span>
          </div>
          <p className="text-[11px] text-slate-300">
            총 납입원금 {result.totalPrincipal.toLocaleString()}원 + 세후이자 {result.currentNetInterest.toLocaleString()}원
          </p>
        </div>

        {/* 원금 vs 세후 이자 시각화 바 차트 */}
        <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">납입 원금 ({result.principalRatio}%)</span>
            <span className="text-cyan-300">세후 이자 ({result.interestRatio}%)</span>
          </div>
          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-white/10">
            <div
              style={{ width: `${result.principalRatio}%` }}
              className="h-full bg-slate-400 rounded-l-full transition-all duration-500"
            ></div>
            <div
              style={{ width: `${result.interestRatio}%` }}
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-r-full transition-all duration-500"
            ></div>
          </div>
        </div>

        {/* 3대 과세 유형 실수령액 비교 카드 (핵심 강점) */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-cyan-200 block">📊 과세 유형별 실수령액 & 절세 혜택 비교</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 일반과세 */}
            <div
              onClick={() => setSelectedTax('normal')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedTax === 'normal'
                  ? 'bg-blue-900/60 border-blue-400 ring-1 ring-blue-400 shadow-md'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-300">일반과세 (15.4%)</span>
                {selectedTax === 'normal' && <i className="fas fa-check text-blue-400 text-xs"></i>}
              </div>
              <div className="text-sm font-black text-white">{result.normal.finalAmount.toLocaleString()}원</div>
              <div className="text-[10px] text-slate-400 mt-1">
                세후 이자: <span className="font-bold text-slate-200">{result.normal.netInterest.toLocaleString()}원</span><br />
                세금: -{result.normal.tax.toLocaleString()}원
              </div>
            </div>

            {/* 세금우대 */}
            <div
              onClick={() => setSelectedTax('preferential')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedTax === 'preferential'
                  ? 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400 shadow-md'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-300">세금우대 (9.5%)</span>
                <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  +{result.prefBenefit.toLocaleString()}원
                </span>
              </div>
              <div className="text-sm font-black text-amber-300">{result.preferential.finalAmount.toLocaleString()}원</div>
              <div className="text-[10px] text-slate-400 mt-1">
                세후 이자: <span className="font-bold text-amber-200">{result.preferential.netInterest.toLocaleString()}원</span><br />
                세금: -{result.preferential.tax.toLocaleString()}원
              </div>
            </div>

            {/* 비과세 */}
            <div
              onClick={() => setSelectedTax('taxFree')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedTax === 'taxFree'
                  ? 'bg-emerald-950/60 border-emerald-400 ring-1 ring-emerald-400 shadow-md'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-300">비과세 (0%) ✨</span>
                <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  +{result.taxFreeBenefit.toLocaleString()}원
                </span>
              </div>
              <div className="text-sm font-black text-emerald-400">{result.taxFree.finalAmount.toLocaleString()}원</div>
              <div className="text-[10px] text-slate-400 mt-1">
                세후 이자: <span className="font-bold text-emerald-200">{result.taxFree.netInterest.toLocaleString()}원</span><br />
                세금: <span className="font-bold text-emerald-400">0원 (전액 면제)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3단계 산출 공식 카드 (Formula Breakdown) */}
        <div className="bg-blue-950/40 rounded-2xl p-3.5 border border-blue-500/20 space-y-2 text-xs">
          <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5">
            <i className="fas fa-calculator text-cyan-400"></i>
            <span>정밀 이자 산출 내역</span>
          </span>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>① 총 납입원금 ({productType === 'deposit' ? '거치' : `${months}개월 납입`})</span>
              <span className="font-bold text-white">{result.totalPrincipal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>② 세전 이자 ({calcMethod === 'simple' ? '단리' : '월복리'}, 연 {rate}%)</span>
              <span className="font-bold text-slate-200">{result.preTaxInterest.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>③ 이자 세금 차감 ({result.taxLabel})</span>
              <span className="font-bold text-rose-300">-{result.currentTax.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-cyan-300 font-extrabold">
              <span>👉 세후 실수령 이자</span>
              <span className="text-sm text-cyan-300">{result.currentNetInterest.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 월별 스케줄표 (아코디언 토글) */}
        <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 space-y-2">
          <span className="text-xs font-bold text-cyan-200 block">📅 회차별(월별) 원리금 누적 스케줄</span>
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1 text-xs">
            {result.schedule.map((item) => (
              <div key={item.month} className="flex items-center justify-between py-1 px-2.5 bg-black/20 rounded-lg">
                <span className="text-slate-400 font-medium">{item.month}회차 ({item.month}개월)</span>
                <div className="text-right">
                  <span className="text-slate-300 mr-2">누적원금 {item.cumPrincipal.toLocaleString()}원</span>
                  <span className="font-bold text-cyan-300">합계 {item.cumTotal.toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-950/60 rounded-xl p-3 border border-blue-800/60 text-[10px] text-blue-200/80 leading-relaxed">
          <i className="fas fa-info-circle mr-1 text-cyan-400"></i>
          본 모의계산 결과는 은행별 이자 계산 일수(365일/366일 윤년) 및 중도해지, 우대금리 조건에 따라 실제 수령액과 약간의 오차가 발생할 수 있습니다.
        </div>
      </div>
    </div>
  );
}
