import { useState } from 'react';
import { sound } from '../utils/sound';

interface FaqItem {
  question: string;
  answer: string;
  badge: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Base64 인코딩은 암호화(Encryption)인가요?',
    answer:
      '아닙니다. Base64는 이진 데이터를 ASCII 문자열로 치환하는 "데이터 표현(Encoding)" 방식일 뿐입니다. 복호화 키 없이 누구나 원래 데이터로 복원할 수 있으므로 비밀번호나 민감한 개인정보를 보호하는 암호화 목적으로 사용해서는 안 됩니다.',
    badge: '보안 상식',
  },
  {
    question: '한글을 인코딩하면 왜 글자가 깨지거나 오류가 나나요?',
    answer:
      '자바스크립트의 기본 btoa() 함수는 Latin1(1바이트) 문자 집합만 처리하여 2~3바이트인 한글(UTF-8) 입력 시 에러를 유발합니다. VeraNex Base64 Studio는 UTF-8 다국어 바이트 스트림 변환 엔진을 내장하여 한글, 한자, 이모지까지 손실 없이 안전하게 변환합니다.',
    badge: '인코딩 이슈',
  },
  {
    question: '일반 Base64와 URL-Safe Base64는 무슨 차이인가요?',
    answer:
      '표준 Base64는 "+", "/" 문자와 끝자리 패딩 "="을 사용합니다. 하지만 이 문자들은 웹 URL 쿼리나 파일 경로에서 특수 기호로 예약되어 왜곡될 위험이 있습니다. URL-Safe 모드는 "+"를 "-", "/"를 "_"로 치환하고 "=" 패딩을 생략하여 웹 주소 및 JWT 토큰에서도 안전하게 전송되도록 보장합니다.',
    badge: 'RFC 4648',
  },
  {
    question: '웹사이트에 이미지 Data URI를 쓰면 어떤 점이 좋나요?',
    answer:
      '별도의 이미지 파일 다운로드를 위한 추가적인 HTTP 요청(Round-trip)을 줄여 첫 화면 로딩 체감 속도를 높일 수 있습니다. 단, Base64 인코딩 시 파일 용량이 원본 대비 약 33% 증가하므로 작은 아이콘이나 로고 배지(10KB 이하)에 사용하는 것이 가장 효율적입니다.',
    badge: '웹 성능 최적화',
  },
  {
    question: 'JWT(JSON Web Token)도 Base64인가요?',
    answer:
      '네, JWT는 점(".")으로 구분된 3개 파트(헤더, 페이로드, 서명)로 구성되며, 이 중 헤더와 페이로드는 URL-Safe Base64로 인코딩된 표준 JSON 문자열입니다. VeraNex Base64 Studio는 "ey..."로 시작하는 JWT 토큰 감지 시 자동으로 페이로드를 파싱해 보여줍니다.',
    badge: '개발자 도구',
  },
];

export default function Base64Guide() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    sound.playClick();
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fadeIn" data-screenshot-target="guide-faq">
      {/* 1. Base64 핵심 개념 카드 */}
      <div className="neu-flat rounded-2xl p-4 border border-slate-200/80 bg-gradient-to-br from-white to-slate-50">
        <div className="flex items-center gap-2 mb-2 text-indigo-600">
          <i className="fas fa-microchip text-sm" />
          <h3 className="text-xs font-bold uppercase tracking-wider">RFC 4648 표준 변환 원리</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Base64는 8비트 2진 데이터 3개(총 24비트)를 6비트씩 4개로 쪼갠 뒤, 총 64개의 안전한 ASCII 영숫자 문자표에 일대일 대응시키는 표준 데이터 전송 규격입니다.
        </p>

        <div className="neu-inset rounded-xl p-3 bg-slate-50/80 text-[11px] font-mono text-slate-700 flex flex-col gap-1.5 border border-slate-200/60">
          <div className="flex justify-between items-center text-slate-500 font-sans text-[10px]">
            <span>원본 텍스트 ("Man")</span>
            <span className="text-indigo-600 font-bold">인코딩 결과 ("TWFu")</span>
          </div>
          <div className="grid grid-cols-3 text-center py-1 border-y border-slate-200/60 font-semibold text-slate-800">
            <div>M (77)</div>
            <div>a (97)</div>
            <div>n (110)</div>
          </div>
          <div className="text-[10px] text-center text-slate-400 py-0.5">
            01001101 · 01100001 · 01101110 (24비트)
          </div>
          <div className="grid grid-cols-4 text-center py-1 bg-white/70 rounded font-bold text-indigo-700">
            <div>19 (T)</div>
            <div>22 (W)</div>
            <div>5 (F)</div>
            <div>46 (u)</div>
          </div>
        </div>
      </div>

      {/* 2. 유의사항 및 베스트 프랙티스 배너 */}
      <div className="rounded-xl p-3 bg-amber-50/90 border border-amber-200 flex items-start gap-2.5">
        <i className="fas fa-triangle-exclamation text-amber-600 text-sm mt-0.5" />
        <div className="text-[11px] leading-relaxed text-amber-900">
          <strong className="font-bold text-amber-950">용량 33% 증가 법칙:</strong> 바이너리 파일을 Base64로 변환하면 6비트 단위 팽창으로 인해 데이터 크기가 원본보다 약 33% 커집니다. 대용량 동영상이나 고해상도 사진은 CDN 파일 링크를 권장합니다.
        </div>
      </div>

      {/* 3. 자주 묻는 질문 아코디언 */}
      <div className="neu-flat rounded-2xl p-4 border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <i className="fas fa-circle-question text-indigo-600 text-sm" />
            <h3 className="text-xs font-bold">자주 묻는 질문 (FAQ)</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">총 {FAQS.length}개</span>
        </div>

        <div className="flex flex-col gap-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/70 rounded-xl overflow-hidden transition-all duration-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 pr-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {faq.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{faq.question}</span>
                  </div>
                  <i
                    className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 저작권 및 표준 규격 명시 */}
      <div className="text-center text-[10px] text-slate-400 py-1 font-medium">
        RFC 4648 Base64 Specification Compliant · VeraNex Dev Studio
      </div>
    </div>
  );
}
