import React, { useState } from 'react';

interface FaqItem {
  q: string;
  directAnswer: string;
  detail: string;
}

export const PlannerFaqTab: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: '연차 사용촉진제도가 시행되면 남은 연차 수당을 못 받나요?',
      directAnswer: '회사가 법적 절차(1차·2차 서면 촉구)를 올바르게 이행했다면 미사용 연차 수당 지급 의무가 면제됩니다.',
      detail: '근로기준법 제61조에 따르면 회사가 휴가 만료 6개월 전 잔여 일수를 통보하고 사용 시기 지정을 서면으로 촉구했음에도 근로자가 사용하지 않은 경우, 회사의 보상 의무는 소멸됩니다. 따라서 촉진 통보를 받았다면 기한 내 소진하는 것이 유리합니다.',
    },
    {
      q: '대체공휴일은 5인 미만 사업장에도 유급으로 적용되나요?',
      directAnswer: '현행법상 공휴일 및 대체공휴일의 유급 휴일 의무 적용 대상은 상시 근로자 5인 이상 사업장입니다.',
      detail: '5인 미만 사업장의 경우 법정 유급휴일은 주휴일(주휴수당)과 근로자의 날(5월 1일)뿐입니다. 일반 관공서 공휴일이나 대체공휴일은 회사 취업규칙 또는 근로계약 체결 내용에 따릅니다.',
    },
    {
      q: '회사에서 연차 사용 날짜를 강제로 거부하거나 바꿀 수 있나요?',
      directAnswer: '원칙적으로 불가능하며, "사업 운영에 막대한 지장이 입증되는 경우"에만 예외적으로 시기 변경권을 행사할 수 있습니다.',
      detail: '근로기준법 제60조 제5항에 명시되어 있듯이 연차 휴가의 사용 시기는 원칙적으로 근로자가 지정합니다. 단순히 업무가 바쁘다는 이유만으로는 거부할 수 없으며, 동시 결근으로 인한 업무 마비 등 명백한 사유가 입증되어야 합니다.',
    },
    {
      q: '입사 1년 미만 신입사원은 연차를 어떻게 쓸 수 있나요?',
      directAnswer: '1개월 개근 시 익월에 1일씩 유급휴가가 발생하여 1년 미만 기간 동안 최대 11일을 사용할 수 있습니다.',
      detail: '2018년 근로기준법 개정 이후, 신입사원의 1년 차 월별 연차(최대 11일)는 2년 차에 발생하는 15일 연차에서 차감되지 않고 온전히 독립적으로 보장됩니다.',
    },
  ];

  return (
    <div className="space-y-3 pb-2">
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl p-3.5 shadow-xs">
        <h4 className="font-black text-sm mb-1 flex items-center gap-1.5">
          <i className="fas fa-question-circle text-amber-300"></i>
          연차 및 공휴일 자주 묻는 질문 (FAQ)
        </h4>
        <p className="text-xs text-white/90 font-medium leading-relaxed">
          근로기준법과 휴가 실무에 관한 정확하고 빠른 가이드를 제공합니다.
        </p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-3.5 text-left flex items-start justify-between gap-2.5 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="font-black text-xs text-indigo-600 shrink-0 mt-0.5">Q.</span>
                  <span className="font-extrabold text-xs text-slate-800 leading-snug">
                    {faq.q}
                  </span>
                </div>
                <span className={`text-slate-400 text-xs transition-transform duration-200 shrink-0 mt-0.5 ${isOpen ? 'rotate-180' : ''}`}>
                  <i className="fas fa-chevron-down"></i>
                </span>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-slate-100 bg-slate-50/50">
                  {/* Direct Answer highlight for AI search / GEO */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-100 text-xs font-bold text-indigo-900 leading-relaxed">
                    💡 <strong>핵심 요약:</strong> {faq.directAnswer}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    {faq.detail}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
