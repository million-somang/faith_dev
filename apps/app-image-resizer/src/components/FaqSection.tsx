import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    question: 'AI 업스케일링도 서버 업로드 없이 내 브라우저(CSR)에서만 처리되나요?',
    answer:
      '네, 100% 브라우저 로컬 메모리(WebGL2 GPU 또는 CPU)에서 연산합니다. 동일 출처에서 내려받은 경량 ESRGAN 가중치와 Lanczos-3 Web Worker를 사용하므로 어떠한 사진도 외부 서버로 전송되거나 저장되지 않습니다.',
  },
  {
    question: 'AI 초해상도(ESRGAN)와 초고속 정밀 보간(Lanczos-3)의 차이는 무엇인가요?',
    answer:
      'AI 초해상도는 딥러닝 신경망으로 계단 현상을 완화하고 사진·일러스트 디테일을 복원하며 최대 4K(4096px)까지 안전하게 확대합니다. 초고속 Lanczos-3는 모델 다운로드 없이 즉시 실행되어 글자가 많은 캡처나 대량 이미지를 최대 8K(8192px)까지 선명하게 키울 때 최적입니다.',
  },
  {
    question: '고해상도 사진을 4배로 키우면 브라우저가 멈추지 않나요?',
    answer:
      'AI 모드는 브라우저 탭 OOM(메모리 초과)을 막기 위해 긴 변 최대 4096px 안전 상한과 타일 분할(64px) 처리를 적용하며 실시간 진행률(%)을 표시합니다. 투명 PNG/WebP의 알파 채널 역시 별도로 보존해 투명 배경이 검게 변하지 않습니다.',
  },
  {
    question: '기존의 SNS 규격 리사이즈, 비율 축소, WebP 변환, 목표 용량(KB) 기능도 쓸 수 있나요?',
    answer:
      '물론입니다. STEP 2에서 "고화질 업스케일링" 아래에 있는 "포맷만 변환", "비율로 축소(%)", "픽셀 · SNS 규격", "목표 용량 맞춤" 버튼을 누르면 기존 네이버 블로그·유튜브·인스타 규격 맞추기와 목표 KB 압축 기능도 그대로 이용하실 수 있습니다.',
  },
  {
    question: 'Before/After 분할 비교기에서 화질 차이를 더 자세히 보려면 어떻게 하나요?',
    answer:
      'STEP 3 결과 상단의 분할 비교기에서 슬라이더를 좌우로 드래그하거나 우측 상단 "200% 돋보기" 버튼을 누르면 원본 픽셀과 업스케일 결과의 경계 선명도를 1:1 픽셀 단위로 정밀 비교할 수 있습니다.',
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
