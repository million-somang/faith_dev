import React from 'react';

const FAQS = [
  {
    q: '생성된 QR코드에 유효기간이나 스캔 횟수 제한이 있나요?',
    a: '전혀 없습니다. 베라넥스 QR코드 생성기는 중간 광고 서버나 단축 URL 리다이렉트를 거치지 않고, 입력하신 원문 데이터를 ISO/IEC 18004 국제 표준 행렬에 직접 기록하는 정적(Static) QR코드 방식을 사용합니다. 따라서 한 번 다운로드한 QR코드는 평생 유효기간 없이 무제한 무료로 작동합니다.',
  },
  {
    q: '매장 와이파이(Wi-Fi) 비밀번호나 명함 연락처를 입력해도 개인정보가 안전한가요?',
    a: '100% 안전합니다. 본 도구는 서버로 데이터를 전송하는 외부 API를 일체 사용하지 않으며, 사용자의 웹 브라우저 로컬 메모리(HTML5 Canvas 및 자체 내장 Reed-Solomon 인코더) 내부에서만 QR코드를 생성합니다. 창을 닫는 즉시 모든 입력 데이터는 브라우저 메모리에서 완전히 소멸됩니다.',
  },
  {
    q: '매장 와이파이 QR코드는 아이폰과 갤럭시 모두에서 자동으로 연결되나요?',
    a: '네, 국제 표준 WIFI 스키마(WIFI:T:WPA;S:네트워크명;P:비밀번호;;) 규격을 준수하므로 아이폰(iOS 11 이상 기본 카메라)과 안드로이드(갤럭시 기본 카메라 및 네이버·카카오톡 QR 스캐너)에서 스캔하는 즉시 "네트워크에 연결하시겠습니까?" 알림이 떠서 비밀번호 입력 없이 원터치로 접속됩니다.',
  },
  {
    q: '인쇄소에 맡길 명함이나 배너에는 어떤 파일 포맷(PNG vs SVG)을 써야 하나요?',
    a: '웹사이트 게시나 문서 삽입용으로는 1024px 이상의 PNG 포맷이 편리하며, 일러스트레이터(AI)·인디자인 등 인쇄 편집 작업이나 대형 현수막·간판 출력용으로는 아무리 확대해도 픽셀이 깨지지 않는 순수 벡터 파일인 SVG 포맷으로 다운로드하시는 것을 권장합니다.',
  },
  {
    q: 'QR코드 중앙에 로고 이미지를 넣었는데 가려진 부분 때문에 인식이 안 되지 않나요?',
    a: '걱정하지 않으셔도 됩니다. 중앙 배지나 커스텀 로고를 선택하면 오류 복원 등급이 자동으로 최고 등급인 Level H(최대 30% 손상 복원)로 전환되어, 중앙 영역이 로고로 덮여 있어도 주변 복원 코드워드를 통해 모든 스마트폰 카메라에서 즉시 인식됩니다.',
  },
];

export function FaqSection() {
  return (
    <section className="min-h-[calc(850px-160px)] bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] shadow-xs space-y-4 animate-fade-in">
      <div className="border-b border-[#EBE6DD] pb-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 block mb-1">
          FREQUENTLY ASKED QUESTIONS
        </span>
        <h2 className="text-lg sm:text-xl font-black text-[#2D2A26] flex items-center gap-2">
          <i className="fas fa-circle-question text-indigo-600"></i>
          <span>자주 묻는 질문 (FAQ)</span>
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          QR코드 유효기간, 개인정보 보안, 인쇄 규격 및 와이파이 자동 연결에 관해 가장 많이 궁금해하시는 내용입니다.
        </p>
      </div>

      <div className="space-y-3 text-xs">
        {FAQS.map((item, idx) => (
          <details
            key={idx}
            open={idx < 2}
            className="group border border-[#EBE6DD] bg-[#FAF8F5]/60 rounded-2xl p-4 transition-all open:bg-white open:shadow-2xs [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex items-center justify-between cursor-pointer font-black text-[#2D2A26] text-xs sm:text-sm gap-3">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 text-[11px] font-black flex items-center justify-center shrink-0">
                  Q
                </span>
                <span>{item.q}</span>
              </span>
              <i className="fas fa-chevron-down text-stone-400 group-open:rotate-180 transition-transform text-xs shrink-0"></i>
            </summary>
            <p className="mt-3 text-stone-600 leading-relaxed border-t border-[#EBE6DD] pt-3 pl-7">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default FaqSection;
