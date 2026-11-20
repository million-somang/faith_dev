import { HOW_TO_STEPS, KEYBOARD_SHORTCUTS } from '../constants/todoMeta';

export default function HowToGuide() {
  return (
    <section
      aria-label="스마트 투두 플래너 사용방법 및 정리 원칙"
      className="bg-white rounded-3xl p-4 sm:p-6 border border-[#EBE6DD] shadow-xs space-y-5 animate-fade-in"
    >
      <div className="space-y-1.5 border-b border-[#F0EBE2] pb-3.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black">
          <i className="fas fa-book-open"></i> HOW-TO GUIDE
        </span>
        <h2 className="text-base sm:text-lg font-black text-[#2D2A26]">
          스마트 투두(TO-DO) 플래너 3단계 활용 가이드
        </h2>
        <p className="text-xs text-[#6B645B] leading-relaxed">
          단순히 할 일을 적기만 하면 목록이 길어져 쉽게 지칩니다. 우선순위 배정, 작은 단계 쪼개기, 25분 집중 타이머를 결합해 하루를 가볍고 확실하게 마무리해 보세요.
        </p>
      </div>

      {/* 3단계 핵심 사용법 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {HOW_TO_STEPS.map((step) => (
          <article
            key={step.step}
            className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] flex flex-col justify-between gap-2.5"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {step.step}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[#2D2A26]">{step.title}</h3>
              </div>
              <p className="text-xs text-[#57514A] leading-relaxed">{step.desc}</p>
            </div>
            <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-2 font-semibold">
              💡 {step.tip}
            </div>
          </article>
        ))}
      </div>

      {/* 아이젠하워 매트릭스 원칙 & 마이페이지 연동 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-2">
          <h3 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
            <i className="fas fa-layer-group text-indigo-600"></i>
            우선순위 P1 · P2 · P3 정리 기준
          </h3>
          <ul className="text-xs text-[#47413A] space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-rose-700">• 긴급 (P1):</strong> 오늘 마감되거나 미루면 큰 지연이 생기는 핵심 과제
            </li>
            <li>
              <strong className="text-amber-700">• 중요 (P2):</strong> 장기 목표와 성장을 위해 반드시 챙겨야 하는 계획 업무
            </li>
            <li>
              <strong className="text-indigo-700">• 보통 (P3):</strong> 틈틈이 처리하거나 체크리스트로 잊지 않아야 할 일상 루틴
            </li>
          </ul>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE6DD] space-y-2">
          <h3 className="text-xs sm:text-sm font-black text-[#2D2A26] flex items-center gap-1.5">
            <i className="fas fa-keyboard text-indigo-600"></i>
            빠른 작업을 위한 키보드 단축키
          </h3>
          <div className="space-y-1.5">
            {KEYBOARD_SHORTCUTS.map((sc) => (
              <div
                key={sc.keyLabel}
                className="flex items-center justify-between gap-2 text-[11px] bg-white px-2.5 py-1.5 rounded-xl border border-[#EBE6DD]"
              >
                <kbd className="px-2 py-0.5 rounded-md bg-[#F5F2EB] border border-[#DFD9CE] font-mono font-black text-indigo-700 text-[10px]">
                  {sc.keyLabel}
                </kbd>
                <span className="text-[#57514A] font-medium text-right">{sc.actionLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
