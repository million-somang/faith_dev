import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    question: '한 번에 몇 장까지 이미지를 일괄 처리할 수 있나요?',
    answer:
      '최대 50장의 이미지를 동시에 드래그 앤 드롭으로 업로드하여 일괄 리사이즈 및 포맷 변환할 수 있습니다. 장당 최대 30MB까지 지원하며, 변환 완료 후 "ZIP 일괄 다운로드" 버튼을 통해 하나의 압축 파일로 일괄 저장할 수 있습니다.',
  },
  {
    question: '업로드한 사진이 서버에 저장되거나 외부에 유출될 위험이 있나요?',
    answer:
      '전혀 없습니다. 본 서비스는 최신 HTML5 Canvas API를 활용하여 100% 사용자 기기(브라우저 메모리) 내에서만 모든 변환 작업을 처리합니다. 어떤 이미지 데이터도 외부 서버로 업로드되지 않으므로 안심하고 사용하실 수 있습니다.',
  },
  {
    question: '작은 이미지가 원본보다 확대되어 흐릿해지는 것을 방지할 수 있나요?',
    answer:
      '옵션 패널의 "[v] 원본보다 크게 확대 금지" 체크박스를 활성화하면, 원본 크기보다 큰 해상도로 지정하더라도 원본 치수를 넘어서 강제로 확대되지 않고 원본 해상도를 보존합니다.',
  },
  {
    question: 'WebP 포맷으로 변환하면 어떤 장점이 있나요?',
    answer:
      'WebP는 구글이 개발한 현대적인 웹 이미지 포맷으로, 기존 JPEG나 PNG와 동등한 화질을 유지하면서 파일 크기를 25%~35% 이상 대폭 줄여줍니다. 웹사이트 로딩 속도 향상과 SEO(검색엔진 최적화)에 매우 유리합니다.',
  },
  {
    question: '목표 용량(KB) 단위는 어떻게 작동하나요?',
    answer:
      '원하는 목표 파일 크기(예: 300KB)를 입력하면, 지능형 이분 탐색(Binary Search) 알고리즘이 이미지 압축률과 스케일을 정밀하게 반복 계산하여 지정된 용량 이하로 최적화된 결과물을 도출합니다.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <i className="fa-regular fa-circle-question text-indigo-600"></i>
        자주 묻는 질문 (FAQ)
      </h3>

      <div className="space-y-3">
        {FAQ_LIST.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200/70 rounded-xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">Q.</span>
                  {faq.question}
                </span>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                ></i>
              </button>

              {isOpen && (
                <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
