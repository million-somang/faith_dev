import React, { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    category: '보안 및 개인정보',
    q: '입력한 JSON 데이터가 외부 서버에 전송되거나 저장되나요?',
    a: '절대 전송되지 않습니다. VeraNex Pro JSON Studio의 모든 구문 검증, 포맷팅, 데이터 변환 및 통계 계산은 100% 사용자의 브라우저 로컬 메모리 환경에서 클라이언트 사이드로만 수행됩니다. 외부 API 통신이나 백엔드 데이터베이스 저장이 전혀 없어 민감한 개인정보나 사내 보안 API 응답도 안심하고 처리하실 수 있습니다.'
  },
  {
    category: '오류 복구',
    q: '오류가 있는 잘못된 JSON 문법도 자동으로 고칠 수 있나요?',
    a: '네, 상단 도구 모음의 [자동수정 (AutoFix)] 버튼을 클릭하시면 됩니다. JavaScript 객체 리터럴 형식(키 따옴표 누락, 작은따옴표 사용), 끝부분 쉼표(Trailing Comma), 주석(//, /* */) 등 유효하지 않은 구문을 감지하여 표준 RFC 8259 규격에 맞는 완벽한 JSON으로 즉시 정규화합니다.'
  },
  {
    category: '포맷 및 변환',
    q: 'TypeScript Interface나 YAML, CSV 변환 기능은 어떻게 사용하나요?',
    a: '포맷터에 JSON 데이터를 입력하신 후 상단 [변환] 탭을 클릭하시면 됩니다. 파싱된 데이터의 스키마를 정적 분석하여 즉시 프로덕션 수준의 TypeScript 인터페이스 정의(중첩 타입 분리 포함)를 생성하며, YAML, XML, 엑셀 호환 CSV로 실시간 원클릭 변환 및 다운로드가 가능합니다.'
  },
  {
    category: '성능 및 호환성',
    q: '대용량 JSON 파일도 브라우저에서 버벅임 없이 처리 가능한가요?',
    a: 'VeraNex Pro JSON Studio는 불필요한 무거운 에디터 런타임 대신 최적화된 고속 파서와 순수 리액트 렌더링 파이프라인을 채택했습니다. 수만 줄 이상의 대용량 JSON도 렉 없이 부드럽게 정렬, 미니파이, 트리 탐색이 가능합니다.'
  }
];

export const JsonFaqTab: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="h-full flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 bg-[#FAF8F5] scrollbar-thin select-text">
      {/* 1. Quick Summary Card (RFC 8259 Rules) */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E0D9CC] shadow-2xs">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs">
            <i className="fa-solid fa-book-bookmark"></i>
          </div>
          <h3 className="text-xs font-black text-[#2D2A26]">RFC 8259 표준 JSON 4대 원칙</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#554E44]">
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
            <span className="font-black text-[#8C521A] block mb-0.5">✓ 큰따옴표 필수</span>
            모든 키(Key)와 문자열 값은 반드시 쌍따옴표(")로 감싸야 합니다.
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
            <span className="font-black text-[#8C521A] block mb-0.5">✗ 쉼표 누락/초과 금지</span>
            마지막 항목 뒤 쉼표(Trailing Comma)는 표준 문법에서 금지됩니다.
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
            <span className="font-black text-[#8C521A] block mb-0.5">✗ 주석 불허</span>
            표준 JSON은 // 나 /* */ 주석을 허용하지 않습니다 (자동수정으로 제거 가능).
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
            <span className="font-black text-[#8C521A] block mb-0.5">✓ 6가지 허용 타입</span>
            String, Number, Object, Array, Boolean, null 만 유효합니다.
          </div>
        </div>
      </div>

      {/* 2. Common Syntax Errors Cheatsheet */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E0D9CC] shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#2D2A26] text-white flex items-center justify-center text-xs">
            <i className="fa-solid fa-bug text-xs"></i>
          </div>
          <h3 className="text-xs font-black text-[#2D2A26]">자주 발생하는 JSON 구문 오류</h3>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-between">
            <div>
              <span className="font-bold text-rose-700">작은따옴표 오류: </span>
              <code className="text-slate-600 bg-white px-1 py-0.5 rounded border border-[#E0D9CC] font-mono">&#123;'name': 'vera'&#125;</code>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">➔ 자동수정 지원</span>
          </div>
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-between">
            <div>
              <span className="font-bold text-rose-700">끝 쉼표 오류: </span>
              <code className="text-slate-600 bg-white px-1 py-0.5 rounded border border-[#E0D9CC] font-mono">&#91;1, 2, 3,&#93;</code>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">➔ 자동수정 지원</span>
          </div>
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-between">
            <div>
              <span className="font-bold text-rose-700">키 따옴표 누락: </span>
              <code className="text-slate-600 bg-white px-1 py-0.5 rounded border border-[#E0D9CC] font-mono">&#123;id: 100&#125;</code>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">➔ 자동수정 지원</span>
          </div>
        </div>
      </div>

      {/* 3. Accordion FAQs */}
      <div className="space-y-2">
        <h4 className="text-xs font-black text-[#2D2A26] px-1 flex items-center gap-1.5">
          <i className="fa-solid fa-circle-question text-amber-600"></i>
          자주 묻는 질문 (FAQ)
        </h4>

        {FAQ_LIST.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-[#E0D9CC] bg-white overflow-hidden transition-all shadow-2xs"
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="w-full text-left p-3.5 flex items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#ECE5D8] text-[#5C5449]">
                    {faq.category}
                  </span>
                  <span className="text-xs font-black text-[#2D2A26]">{faq.q}</span>
                </div>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-[#8C8479] transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                ></i>
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs text-[#554E44] leading-relaxed border-t border-[#F0EAE0] bg-[#FAF8F5]/80">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. E-E-A-T Guarantee Badge */}
      <div className="p-3 rounded-2xl bg-[#ECE5D8] border border-[#DDD5C7] text-center shadow-2xs">
        <p className="text-[11px] font-bold text-[#4A443B]">
          🛡️ 100% Client-Side In-Memory Processing Guarantee
        </p>
        <p className="text-[10px] text-[#7A7268] mt-0.5">
          VeraNex Web Standards Compliance • RFC 8259 Standard Validated • No Tracking
        </p>
      </div>
    </div>
  );
};
