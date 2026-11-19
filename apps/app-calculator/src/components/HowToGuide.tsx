export function HowToGuide() {
  return (
    <article
      className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-7 nm-warm-card space-y-6 animate-fade-in"
      role="tabpanel"
    >
      <div className="border-b border-[#EBE6DD] pb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black mb-2">
          <i className="fas fa-book-open text-[9px]" aria-hidden="true"></i>
          <span>USER GUIDE</span>
        </span>
        <h2 className="text-lg sm:text-xl font-black text-[#2D2A26] tracking-tight">
          스마트 일반 · 공학 계산기 사용방법 및 연산 공식
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
          일상 사칙연산부터 이공계 삼각함수, 로그, 팩토리얼까지 부동소수점 오차 없이 계산하는 방법을 안내합니다.
        </p>
      </div>

      {/* 단계별 이용 방법 */}
      <section className="space-y-3">
        <h3 className="text-sm font-black text-[#2D2A26] flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">
            1
          </span>
          <span>기본 사용 절차</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] space-y-1">
            <div className="font-black text-indigo-700">STEP 1 · 모드 선택</div>
            <p className="text-stone-600 leading-relaxed">
              상단 스위치에서 <strong>일반 계산기</strong> 또는 <strong>공학 계산기</strong>를 선택합니다. 공학 모드에서는 <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">DEG / RAD</code>와 <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">2nd</code> 역함수를 즉시 전환할 수 있습니다.
            </p>
          </div>
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] space-y-1">
            <div className="font-black text-indigo-700">STEP 2 · 수식 입력 &amp; 미리보기</div>
            <p className="text-stone-600 leading-relaxed">
              버튼 터치 또는 데스크톱 물리 키보드 숫자패드로 수식을 입력하면 하단에 <strong>실시간 중간 계산값</strong>이 즉시 미리 보입니다.
            </p>
          </div>
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] space-y-1">
            <div className="font-black text-indigo-700">STEP 3 · 메모리 &amp; Ans 이어 계산</div>
            <p className="text-stone-600 leading-relaxed">
              <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">M+</code>, <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">M-</code>, <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">MR</code>, <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">MC</code>로 값을 누적 저장하고, <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">Ans</code> 버튼으로 직전 결과를 바로 불러옵니다.
            </p>
          </div>
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] space-y-1">
            <div className="font-black text-indigo-700">STEP 4 · 기록 보관 및 복사</div>
            <p className="text-stone-600 leading-relaxed">
              <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">=</code> 버튼(또는 <code className="px-1 py-0.5 rounded bg-white border border-[#EBE6DD] font-calc-mono">Enter</code>)을 누르면 브라우저 로컬 기록에 최대 30건까지 자동 저장되며 클릭 시 수식을 재호출할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 공학 연산 기준표 (AEO 최적화) */}
      <section className="space-y-3 border-t border-[#EBE6DD] pt-5">
        <h3 className="text-sm font-black text-[#2D2A26] flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-mono">
            2
          </span>
          <span>연산자 우선순위 및 공학 함수 기준표</span>
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-[#EBE6DD]">
          <table className="min-w-full divide-y divide-[#EBE6DD] text-xs">
            <thead className="bg-[#F7F4EE]">
              <tr>
                <th className="px-3.5 py-2.5 text-left font-black text-[#2D2A26]">항목</th>
                <th className="px-3.5 py-2.5 text-left font-black text-[#2D2A26]">지원 문법 · 공식</th>
                <th className="px-3.5 py-2.5 text-left font-black text-[#2D2A26]">계산 예시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DD] bg-white">
              <tr>
                <td className="px-3.5 py-2.5 font-bold text-indigo-700">사칙·백분율</td>
                <td className="px-3.5 py-2.5 text-stone-600">곱셈·나눗셈 우선 후 덧셈·뺄셈, <code className="font-calc-mono">A ± B% = A ± (A × B/100)</code></td>
                <td className="px-3.5 py-2.5 font-calc-mono text-[#2D2A26]">200+10% = 220</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-bold text-indigo-700">삼각 · 역삼각</td>
                <td className="px-3.5 py-2.5 text-stone-600"><code className="font-calc-mono">sin, cos, tan</code> 및 <code className="font-calc-mono">2nd</code> (<code className="font-calc-mono">sin⁻¹, cos⁻¹, tan⁻¹</code>)</td>
                <td className="px-3.5 py-2.5 font-calc-mono text-[#2D2A26]">sin(30) DEG = 0.5</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-bold text-indigo-700">로그 · 지수</td>
                <td className="px-3.5 py-2.5 text-stone-600"><code className="font-calc-mono">log(상용)</code>, <code className="font-calc-mono">ln(자연)</code>, <code className="font-calc-mono">10ˣ</code>, <code className="font-calc-mono">eˣ</code>, <code className="font-calc-mono">xʸ</code></td>
                <td className="px-3.5 py-2.5 font-calc-mono text-[#2D2A26]">log(1000) = 3</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-bold text-indigo-700">거듭제곱 · 근 · !</td>
                <td className="px-3.5 py-2.5 text-stone-600"><code className="font-calc-mono">x², x³, √, ∛, n!(0~170), 1/x</code></td>
                <td className="px-3.5 py-2.5 font-calc-mono text-[#2D2A26]">5! = 120, √144 = 12</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2.5 font-bold text-indigo-700">상수 · 암시적 곱셈</td>
                <td className="px-3.5 py-2.5 text-stone-600"><code className="font-calc-mono">π</code>, <code className="font-calc-mono">e</code> 상수 및 인접 괄호·상수 자동 곱셈</td>
                <td className="px-3.5 py-2.5 font-calc-mono text-[#2D2A26]">3(4+5) = 27</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 키보드 단축키 안내 */}
      <section className="space-y-3 border-t border-[#EBE6DD] pt-5">
        <h3 className="text-sm font-black text-[#2D2A26] flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs flex items-center justify-center font-mono">
            3
          </span>
          <span>물리 키보드 및 숫자패드 단축키</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EBE6DD]">
            <div className="font-calc-mono font-black text-indigo-700">0 ~ 9 , .</div>
            <div className="text-[11px] text-stone-500 mt-0.5">숫자 및 소수점 입력</div>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EBE6DD]">
            <div className="font-calc-mono font-black text-indigo-700">+ - * / ^ %</div>
            <div className="text-[11px] text-stone-500 mt-0.5">사칙 · 거듭제곱 · %</div>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EBE6DD]">
            <div className="font-calc-mono font-black text-emerald-700">Enter / =</div>
            <div className="text-[11px] text-stone-500 mt-0.5">최종 수식 계산 실행</div>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EBE6DD]">
            <div className="font-calc-mono font-black text-rose-600">Backspace / Esc</div>
            <div className="text-[11px] text-stone-500 mt-0.5">한 글자 삭제 · 전체 초기화</div>
          </div>
        </div>
      </section>
    </article>
  );
}

export default HowToGuide;
