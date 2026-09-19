import { useState } from 'react';
import { sound } from '../utils/sound';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: '업로드한 이미지가 서버에 저장되거나 전송되나요?',
    a: '절대 저장되지 않습니다. Vector Studio는 순수 자바스크립트 엔진으로 사용자의 로컬 브라우저 메모리 내부에서만 벡터 트레이싱 알고리즘을 구동합니다. 민감한 브랜드 심볼이나 서명도 데이터 유출 없이 100% 안전합니다.'
  },
  {
    q: '실제 사진(인물, 풍경 등)도 SVG로 깔끔하게 변환되나요?',
    a: '실사 사진은 수천만 개의 미세한 그라데이션 픽셀로 이루어져 있어 벡터화할 경우 용량이 매우 커지고 유화처럼 뭉개질 수 있습니다. 로고, 아이콘, 엠블럼, 타이포그래피, 캐릭터 일러스트처럼 경계선이 비교적 명확한 그래픽에 가장 적합합니다.'
  },
  {
    q: '변환된 SVG 파일의 크기를 줄이려면 어떻게 해야 하나요?',
    a: '하단 정밀 커스텀 설정에서 "추출 색상 수"를 줄이거나(예: 8색 이하), "곡선 부드러움"을 높여주시면 불필요한 미세 패스 노드가 합쳐지면서 SVG 파일 용량이 획기적으로 줄어듭니다.'
  },
  {
    q: '다운로드한 SVG 파일을 피그마(Figma)나 일러스트레이터에서 수정할 수 있나요?',
    a: '네, 완벽하게 호환됩니다. 표준 W3C SVG 규격으로 산출되므로 Figma, Adobe Illustrator, Inkscape 등 모든 전문 벡터 그래픽 소프트웨어에서 개별 패스 노드를 선택하고 색상과 선을 자유롭게 수정할 수 있습니다.'
  },
  {
    q: '어떤 파일 형식을 지원하나요?',
    a: 'PNG, JPG/JPEG, WEBP 비트맵 이미지 파일을 모두 지원합니다. 특히 투명 배경을 가진 PNG 이미지를 변환하면 투명도가 유지된 깨끗한 SVG를 얻으실 수 있습니다.'
  }
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    sound.playClick();
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="min-h-[calc(850px-140px)] bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
      {/* 상단 헤더 */}
      <div className="border-b border-slate-100 pb-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">FREQUENTLY ASKED</span>
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <i className="fas fa-question-circle text-indigo-600"></i>
          <span>SVG 변환기 자주 묻는 질문 (FAQ)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          벡터 변환과 그래픽 최적화에 대해 가장 많이 묻는 핵심 질문
        </p>
      </div>

      {/* 아코디언 FAQ 목록 */}
      <div className="space-y-2.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 overflow-hidden transition-all bg-slate-50/50"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 font-extrabold text-xs text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono shrink-0">
                    Q
                  </span>
                  <span>{faq.q}</span>
                </span>
                <i
                  className={`fas fa-chevron-down text-xs text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                ></i>
              </button>

              {isOpen && (
                <div className="p-3.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white animate-fade-in">
                  <div className="flex items-start gap-2 pt-1.5">
                    <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold mt-0.5">
                      A
                    </span>
                    <p className="flex-1 text-[11px] leading-relaxed text-slate-600">{faq.a}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
