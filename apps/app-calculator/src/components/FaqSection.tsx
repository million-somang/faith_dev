export function FaqSection() {
  return (
    <article
      className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-7 nm-warm-card space-y-4 animate-fade-in"
      role="tabpanel"
    >
      <div className="border-b border-[#EBE6DD] pb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black mb-2">
          <i className="far fa-circle-question text-[10px]" aria-hidden="true"></i>
          <span>FAQ</span>
        </span>
        <h2 className="text-lg sm:text-xl font-black text-[#2D2A26] tracking-tight">
          스마트 일반 · 공학 계산기 자주 묻는 질문
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          정밀 연산 처리 방식, 각도 단위 설정, 키보드 지원 및 로컬 보안 기준을 확인하세요.
        </p>
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm">
        <details open className="group bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-2 cursor-pointer font-black text-[#2D2A26]">
            <span>Q1. 0.1 + 0.2를 계산할 때 부동소수점 오차가 생기지 않나요?</span>
            <i className="fas fa-chevron-down text-stone-400 group-open:rotate-180 transition-transform text-xs shrink-0" aria-hidden="true"></i>
          </summary>
          <p className="mt-2.5 pt-2.5 border-t border-[#EBE6DD] text-xs text-stone-600 leading-relaxed">
            네. JavaScript 기본 연산에서 나타나는 이진 부동소수점 잔여 오차(<code className="font-calc-mono">0.30000000000000004</code>)와 삼각함수 미세 오차(<code className="font-calc-mono">cos 90°</code>, <code className="font-calc-mono">sin 30°</code>)를 유효숫자 정밀 보정 엔진으로 교정해 <code className="font-calc-mono">0.3</code>, <code className="font-calc-mono">0</code>, <code className="font-calc-mono">0.5</code>로 정확히 출력합니다.
          </p>
        </details>

        <details open className="group bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-2 cursor-pointer font-black text-[#2D2A26]">
            <span>Q2. 공학 계산기의 DEG와 RAD 차이는 무엇인가요?</span>
            <i className="fas fa-chevron-down text-stone-400 group-open:rotate-180 transition-transform text-xs shrink-0" aria-hidden="true"></i>
          </summary>
          <p className="mt-2.5 pt-2.5 border-t border-[#EBE6DD] text-xs text-stone-600 leading-relaxed">
            <strong>DEG(Degree, 도)</strong>는 원을 360도로 나누어 계산하며 기본값입니다(<code className="font-calc-mono">sin(30) = 0.5</code>). <strong>RAD(Radian, 라디안)</strong>는 호도법(<code className="font-calc-mono">π = 180°</code>) 기준으로 계산하며 <code className="font-calc-mono">cos(π) = -1</code>처럼 미적분·물리 공학 수식에 적합합니다.
          </p>
        </details>

        <details className="group bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-2 cursor-pointer font-black text-[#2D2A26]">
            <span>Q3. 역삼각함수(sin⁻¹, cos⁻¹, tan⁻¹)나 세제곱근(∛)은 어디서 쓰나요?</span>
            <i className="fas fa-chevron-down text-stone-400 group-open:rotate-180 transition-transform text-xs shrink-0" aria-hidden="true"></i>
          </summary>
          <p className="mt-2.5 pt-2.5 border-t border-[#EBE6DD] text-xs text-stone-600 leading-relaxed">
            공학 계산기 상단 제어 바의 <strong>2nd</strong> 버튼을 누르면 삼각함수가 <code className="font-calc-mono">sin⁻¹, cos⁻¹, tan⁻¹</code>으로, <code className="font-calc-mono">log/ln</code>이 <code className="font-calc-mono">10ˣ/eˣ</code>로, <code className="font-calc-mono">x²/√</code>가 <code className="font-calc-mono">x³/∛</code>로 즉시 전환됩니다.
          </p>
        </details>

        <details className="group bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-2 cursor-pointer font-black text-[#2D2A26]">
            <span>Q4. PC 키보드 숫자패드와 단축키가 포털 팝업 안에서도 작동하나요?</span>
            <i className="fas fa-chevron-down text-stone-400 group-open:rotate-180 transition-transform text-xs shrink-0" aria-hidden="true"></i>
          </summary>
          <p className="mt-2.5 pt-2.5 border-t border-[#EBE6DD] text-xs text-stone-600 leading-relaxed">
            네. 포털 모달 iframe 환경에서도 물리 키보드 릴레이 프로토콜을 지원하므로 별도 클릭 없이 바로 숫자(<code className="font-calc-mono">0~9</code>), 사칙연산(<code className="font-calc-mono">+ - * /</code>), 괄호(<code className="font-calc-mono">( )</code>), 거듭제곱(<code className="font-calc-mono">^</code>), <code className="font-calc-mono">Enter</code>, <code className="font-calc-mono">Backspace</code>, <code className="font-calc-mono">Esc</code> 입력이 즉시 동작합니다.
          </p>
        </details>

        <details className="group bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-2 cursor-pointer font-black text-[#2D2A26]">
            <span>Q5. 계산 기록과 입력 수식이 외부 서버로 전송되나요?</span>
            <i className="fas fa-chevron-down text-stone-400 group-open:rotate-180 transition-transform text-xs shrink-0" aria-hidden="true"></i>
          </summary>
          <p className="mt-2.5 pt-2.5 border-t border-[#EBE6DD] text-xs text-stone-600 leading-relaxed">
            전혀 전송되지 않습니다. 모든 수식 파싱(<code className="font-calc-mono">eval</code> 미사용 자체 엔진)과 최근 계산 기록(최대 30건) 저장은 사용자 브라우저 로컬 환경에서만 안전하게 실행됩니다.
          </p>
        </details>
      </div>
    </article>
  );
}

export default FaqSection;
