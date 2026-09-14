import React, { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

export default function OcrFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: '업로드한 이미지가 외부 서버에 저장되거나 전송되나요?',
      a: '아닙니다. VeraNex 브라우저 OCR은 Tesseract.js WebAssembly 기술을 기반으로 전적으로 사용자의 웹 브라우저 메모리 안에서만 동작합니다. 파일이 외부 서버나 인터넷 망으로 단 1바이트도 전송되지 않으므로 개인정보 및 기밀 문서가 완벽하게 보호됩니다.'
    },
    {
      q: '손글씨(필기체)도 인식이 가능한가요?',
      a: '정자체로 또박또박 쓴 손글씨나 화이트보드 필기는 비교적 높은 정확도로 인식됩니다. 다만 흘려 쓴 필기체나 캘리그라피는 인쇄체에 비해 오인식률이 다소 발생할 수 있으니 추출 후 결과를 확인 및 수정하여 활용하시기 바랍니다.'
    },
    {
      q: '인식 언어를 어떻게 선택해야 가장 정확한가요?',
      a: '일반적인 한글 서류, 영수증, 간판 사진은 [한국어 + 영어]를 선택하시면 두 언어가 자연스럽게 혼용 인식됩니다. 만약 해외 원서, 영문 논문, 해외 사이트 캡처본이라면 [영어 전용]으로 설정하시면 오인식이 훨씬 줄어듭니다.'
    },
    {
      q: '지원하는 이미지 포맷과 용량 제한이 있나요?',
      a: 'PNG, JPG, JPEG, WEBP, BMP, GIF 등 브라우저가 표시할 수 있는 모든 표준 이미지 형식을 지원합니다. 브라우저 메모리 안에서 처리되므로 별도의 용량 제한은 없으나, 일반적으로 10MB 이하의 고화질 이미지를 권장합니다.'
    },
    {
      q: '오프라인(비행기 모드)에서도 사용할 수 있나요?',
      a: '네, 최초 1회 방문 시 필요한 언어 학습 데이터(Tesseract traineddata)가 브라우저의 IndexedDB 로컬 저장소에 안전하게 자동 캐싱됩니다. 따라서 이후에는 인터넷 연결이 끊긴 오프라인 환경에서도 100% 정상 작동합니다.'
    },
    {
      q: '추출된 텍스트를 파일로 저장하려면 어떻게 하나요?',
      a: '글자 추출이 완료되면 결과창 상단의 [.txt 다운로드] 버튼을 클릭하시면 즉시 날짜와 시간이 포함된 메모장 텍스트 파일(UTF-8 인코딩)로 다운로드되어 한글 깨짐 없이 보관하실 수 있습니다.'
    }
  ];

  return (
    <article className="space-y-4 w-full text-slate-800 animate-fade-in">
      <header className="nm-card-sm p-4 bg-white border border-slate-200/80 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
            <i className="fas fa-circle-question"></i>
          </span>
          <h2 className="text-sm font-black text-slate-900">자주 묻는 질문 (FAQ)</h2>
        </div>
        <p className="text-xs text-slate-500">
          브라우저 OCR 글자 추출기의 동작 원리와 개인정보 보안 관련 궁금증을 확인하세요.
        </p>
      </header>

      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <section
              key={idx}
              className="nm-card-sm bg-white border border-slate-200/80 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/70 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-blue-600 font-extrabold font-mono">Q.</span>
                  <span>{faq.q}</span>
                </span>
                <i
                  className={`fas fa-chevron-down text-xs text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                ></i>
              </button>

              {isOpen && (
                <div className="p-3.5 pt-0 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed bg-slate-50/50">
                  <div className="flex gap-2 pt-2">
                    <span className="text-emerald-600 font-bold font-mono shrink-0">A.</span>
                    <span>{faq.a}</span>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </article>
  );
}
