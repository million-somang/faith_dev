import React from 'react';

export default function HowToGuide() {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs text-slate-700 space-y-5 text-xs leading-relaxed animate-fade-in">
      <div>
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1.5">
          <i className="fas fa-book-open text-blue-600"></i>
          <span>예·적금 이자 & 비과세 절세 완벽 가이드</span>
        </h3>
        <p className="text-slate-500 text-[11px]">
          복잡한 금융 수식 없이도 예금과 적금의 실수령액 차이를 이해하고, 비과세 계좌를 활용해 세금을 아끼는 핵심 전략을 정리해 드립니다.
        </p>
      </div>

      <div className="space-y-3.5">
        {/* 예금 vs 적금 차이 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
          <h4 className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
            <i className="fas fa-balance-scale text-blue-600"></i> 예금(거치식) vs 적금(적립식) 차이
          </h4>
          <p className="text-slate-600 text-[11px]">
            • <strong>정기예금</strong>: 목돈 1,000만원을 1년간 4.0%로 예치 시, 1년 내내 1,000만원 전액에 대해 4.0% 이자(40만원)가 붙습니다.<br />
            • <strong>정기적금</strong>: 매월 100만원씩 1년간 4.0%로 불입 시, 1회차는 12개월치, 2회차는 11개월치... 마지막 12회차는 1개월치 이자만 붙어 실제 세전 이자는 약 26만원 수준이 됩니다.
          </p>
        </div>

        {/* 단리 vs 월복리 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
          <h4 className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
            <i className="fas fa-layer-group text-emerald-600"></i> 단리 vs 월복리 이자 원리
          </h4>
          <p className="text-slate-600 text-[11px]">
            • <strong>단리(Simple Interest)</strong>: 최초 원금에 대해서만 약정 이율이 적용됩니다.<br />
            • <strong>월복리(Compound Interest)</strong>: 매월 발생한 이자가 다음 달 원금에 가산되어 다시 이자가 붙는 구조로, 저축 기간이 길어질수록 단리 대비 수령액이 기하급수적으로 증가합니다.
          </p>
        </div>

        {/* 3대 과세 유형 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <h4 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
            <i className="fas fa-percentage text-indigo-600"></i> 3대 과세 유형별 세율 및 절세 팁
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-800 block mb-0.5">일반과세 (15.4%)</span>
              <span className="text-slate-500 text-[10px]">이자소득세 14% + 지방소득세 1.4%. 시중은행 일반 통장에 기본 적용.</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-bold text-amber-700 block mb-0.5">세금우대 (9.5%)</span>
              <span className="text-slate-500 text-[10px]">신협, 농협, 수협, 새마을금고 준조합원 예탁금 저율과세 혜택.</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-bold text-emerald-700 block mb-0.5">비과세 (0%) ✨</span>
              <span className="text-slate-500 text-[10px]">ISA(개인종합자산관리), 청년도약계좌, 65세 이상 비과세종합저축.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
