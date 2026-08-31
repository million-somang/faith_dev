import React from 'react';

export default function HowToGuide() {
  return (
    <article className="space-y-6 text-slate-800 animate-fade-in">
      {/* 1. 퇴직금 산정 공식 및 법적 원리 */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
          <span>고용노동부 법정 퇴직금 산정 원리 및 공식</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          근로자퇴직급여 보장법 제8조에 따라 사용자는 계속근로기간 1년에 대하여 30일분 이상의 <strong>평균임금</strong>을 퇴직금으로 지급하여야 합니다.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 font-mono text-xs text-slate-800">
          <div className="font-bold text-blue-900">퇴직금 = 1일 평균임금 × 30일 × (총 재직일수 / 365)</div>
          <div className="text-[11px] text-slate-600 font-sans">
            • <strong>1일 평균임금</strong> = (퇴직 전 3개월간 지급받은 임금 총액 + 연간 상여금 3/12 + 연차수당 3/12) ÷ 3개월 총 일수(89~92일)
          </div>
          <div className="text-[11px] text-slate-600 font-sans">
            • <strong>통상임금 비교</strong>: 근로기준법 제19조 제2항에 따라 평균임금이 근로자의 통상임금보다 적으면 <strong>통상임금</strong>을 평균임금으로 간주합니다.
          </div>
        </div>
      </section>

      {/* 2. 2026년 퇴직소득세 절세 및 계산 구조 */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
          <span>2026년 개정 세법 기준 퇴직소득세 공제 체계</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          퇴직소득은 오랜 기간 형성된 소득이 일시에 실현되는 특성을 감안하여 종합소득과 합산하지 않고 <strong>분류과세</strong>하며, 대폭 완화된 근속연수 공제가 적용됩니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="p-2.5 font-bold">근속연수</th>
                <th className="p-2.5 font-bold">근속연수별 공제액 (소득세법 제48조)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-2.5 font-semibold">5년 이하</td>
                <td className="p-2.5">근속연수 × 100만원</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">6년 ~ 10년</td>
                <td className="p-2.5">500만원 + (근속연수 - 5년) × 200만원</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">11년 ~ 20년</td>
                <td className="p-2.5">1,500만원 + (근속연수 - 10년) × 250만원</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">20년 초과</td>
                <td className="p-2.5">4,000만원 + (근속연수 - 20년) × 300만원</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 실업급여 수급을 위한 필수 4대 조건 */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">3</span>
          <span>실업급여(구직급여) 수급 필수 요건 4가지</span>
        </h3>
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle text-emerald-500 mt-0.5"></i>
            <div>
              <strong>1. 피보험단위기간 180일 이상</strong>: 이직일 이전 18개월간 고용보험 가입 및 보수지급 기초일수가 180일 이상이어야 합니다.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle text-emerald-500 mt-0.5"></i>
            <div>
              <strong>2. 비자발적 이직 사유</strong>: 정년퇴직, 계약기간 만료, 경영상 해고, 권고사직 등 비자발적 퇴사여야 합니다. (정당한 사유의 자진퇴사 인정)
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle text-emerald-500 mt-0.5"></i>
            <div>
              <strong>3. 적극적 재취업 의사와 능력</strong>: 근로 의욕과 신체적 능력을 갖추고 적극적으로 구직활동을 진행해야 합니다.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle text-emerald-500 mt-0.5"></i>
            <div>
              <strong>4. 퇴직 후 1년 이내 신청</strong>: 퇴직일 다음 날부터 12개월(수급기간)이 지나면 잔여 급여가 소멸하므로 지체 없이 신청해야 합니다.
            </div>
          </li>
        </ul>
      </section>
    </article>
  );
}
