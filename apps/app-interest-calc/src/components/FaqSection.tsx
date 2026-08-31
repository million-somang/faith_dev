import React, { useState } from 'react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: '연 4% 적금인데 왜 실제로 받는 이자는 4%보다 적나요?',
      a: '정기적금은 매달 분할 납입하는 방식이기 때문입니다. 첫 달에 넣은 100만원은 12개월 동안 은행에 예치되므로 4% 이자가 온전히 붙지만, 6번째 달에 넣은 돈은 7개월치, 마지막 달에 넣은 돈은 1개월치 이자만 붙습니다. 따라서 1년 만기 적금의 실제 체감 이율은 약정 이율의 약 55% 수준(연 4% 적금 ➜ 실제 약 2.16% 수준)이 됩니다.'
    },
    {
      q: '비과세 혜택을 받을 수 있는 대표적인 금융상품은 무엇인가요?',
      a: '대표적으로 중개형 ISA(개인종합자산관리계좌: 일반형 200만원, 서민형 400만원까지 비과세, 초과분 9.9% 분리과세), 청년도약계좌(5년 만기 이자 비과세 + 정부기여금), 그리고 만 65세 이상 및 장애인 등을 위한 비과세종합저축(원금 5,000만원 한도 전액 비과세)이 있습니다.'
    },
    {
      q: '상호금융 세금우대(9.5% / 1.4%) 혜택은 누구나 받을 수 있나요?',
      a: '만 19세 이상 거주자라면 신협, 농축협, 수협, 새마을금고, 산림조합에서 소액의 출자금을 내고 준조합원(또는 조합원)으로 가입하면 1인당 3,000만원 한도 내에서 이자소득세(14%)가 면제되고 농특세만 부과되는 세금우대 혜택을 받을 수 있습니다.'
    },
    {
      q: '단리와 월복리 중 어떤 상품을 선택하는 것이 유리한가요?',
      a: '당연히 월복리 상품이 유리합니다. 매월 발생한 이자가 다음 달 원금에 가산되어 다시 이자를 낳는 구조이기 때문입니다. 1년 단기 상품에서는 차이가 크지 않지만, 3년~5년 이상의 중장기 저축일수록 복리 효과가 커져 실수령액 차이가 눈에 띄게 벌어집니다.'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-fade-in">
      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
        <i className="fas fa-question-circle text-amber-500"></i>
        <span>예·적금 & 비과세 자주 묻는 질문 (FAQ)</span>
      </h3>
      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-800 hover:text-blue-600 cursor-pointer"
              >
                <span>Q. {faq.q}</span>
                <i className={`fas fa-chevron-down text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}></i>
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
