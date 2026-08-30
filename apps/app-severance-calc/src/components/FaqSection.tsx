import React, { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: '1년 미만 재직자나 아르바이트생도 퇴직금을 받을 수 있나요?',
    a: '근로자퇴직급여 보장법 제4조에 따라 계속 근로기간이 1년(365일) 이상이고, 4주간을 평균하여 1주간의 소정근로시간이 15시간 이상인 근로자는 정규직, 계약직, 아르바이트 여부와 무관하게 법정 퇴직금을 전액 지급받을 수 있습니다. 1년 미만 근무 시에는 원칙적으로 법정 퇴직금이 발생하지 않습니다.'
  },
  {
    q: '퇴직금 산정 시 상여금과 연차수당은 어떻게 포함되나요?',
    a: '퇴직 전 1년 동안 지급받은 정기 상여금 총액과 퇴직 전 발생하여 지급받은 연차유급휴가 미사용 수당의 각각 3/12(12분의 3)을 최근 3개월 임금 총액에 가산하여 1일 평균임금을 계산합니다. 반면, 퇴직으로 인해 비로소 발생하는 미사용 연차수당은 평균임금 산정에서 제외됩니다.'
  },
  {
    q: '자발적 퇴사 시에도 실업급여를 받을 수 있는 예외 사유가 있나요?',
    a: '자진 퇴사라도 ① 직장 내 괴롭힘·성희롱 피해, ② 2개월 이상 임금 체불 또는 최저임금 미달, ③ 사업장 이전·이사 등으로 통근 왕복 3시간 이상 소요, ④ 9주간 주 52시간 초과 연장근로, ⑤ 질병/부상으로 업무 수행이 불가능하고 병가·휴직이 허용되지 않은 경우 등 법정 정당한 이직 사유에 해당하면 실업급여 수급 자격이 인정됩니다.'
  },
  {
    q: '2026년 실업급여(구직급여) 1일 지급 상한액과 하한액은 얼마인가요?',
    a: '2026년 기준 1일 구직급여 상한액은 66,000원이며, 하한액은 퇴직 당시 최저임금의 80%를 적용하여 1일 8시간 근로 기준 약 64,192원이 지급됩니다. 단시간 근로자의 경우 소정근로시간에 비례하여 하한액이 산출됩니다.'
  },
  {
    q: '퇴직소득세는 어떻게 계산되나요?',
    a: '퇴직금에서 근속연수에 따른 "근속연수 공제"를 차감한 후 12배 환산급여에 기본 공제를 적용하여 과세표준을 구하고, 6~45% 누진세율을 적용하여 최종 퇴직소득세와 지방소득세(10%)를 산출합니다. IRP(개인형 퇴직연금) 계좌로 이체하여 수령하면 30~40%의 감면 혜택을 누릴 수 있습니다.'
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="space-y-3 animate-fade-in">
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-3">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <i className="fas fa-question-circle text-indigo-600"></i>
          <span>고용노동부 자주 묻는 질문 (FAQ)</span>
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">퇴직금과 실업급여에 관해 가장 자주 묻는 법적 기준 안내</p>
      </div>

      <div className="space-y-2">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 font-black text-[10px] flex items-center justify-center shrink-0">
                    Q
                  </span>
                  <span>{faq.q}</span>
                </span>
                <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}></i>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50/50">
                  <p className="whitespace-pre-line">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
