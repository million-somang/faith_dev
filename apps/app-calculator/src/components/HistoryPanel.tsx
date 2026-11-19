import type { CalcHistoryItem } from '../types/calculator';

interface HistoryPanelProps {
  history: CalcHistoryItem[];
  onLoadItem: (item: CalcHistoryItem) => void;
  onCopyValue: (value: string) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  variant: 'mobile' | 'desktop';
}

export function HistoryPanel({
  history,
  onLoadItem,
  onCopyValue,
  onDeleteItem,
  onClearHistory,
  variant,
}: HistoryPanelProps) {
  if (variant === 'mobile') {
    return (
      <section
        aria-label="최근 계산 기록"
        className="md:hidden bg-white rounded-2xl border border-[#EBE6DD] p-2 shadow-2xs shrink-0"
      >
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-black text-[#2D2A26] flex items-center gap-1">
            <i className="fas fa-clock-rotate-left text-indigo-600 text-[9px]" aria-hidden="true"></i>
            <span>최근 기록 ({history.length})</span>
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-[10px] font-bold text-stone-400 hover:text-rose-600 cursor-pointer"
            >
              전체 삭제
            </button>
          )}
        </div>

        {/* 고정 높이(76px) + 2열 그리드 + 내부 스크롤로 동적 세로 팽창 차단 */}
        <div className="h-[76px] overflow-y-auto pr-0.5">
          {history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] font-medium text-stone-400 bg-[#FAF8F5] rounded-xl border border-dashed border-[#E2DDD3]">
              아직 계산 기록이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onLoadItem(item)}
                  className="text-left px-2 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50/70 border border-[#EBE6DD] hover:border-indigo-200 transition-colors cursor-pointer min-w-0"
                >
                  <div className="text-[10px] font-calc-mono text-stone-500 truncate">
                    {item.expression} =
                  </div>
                  <div className="text-xs font-calc-mono font-black text-[#2D2A26] truncate tabular-nums">
                    {item.result}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <aside
      aria-label="계산 히스토리 및 단축키 가이드"
      className="hidden md:flex flex-col gap-3 h-full min-h-0"
    >
      {/* 상단 가변 계산 기록 보드 */}
      <div className="flex-1 min-h-[260px] flex flex-col bg-white rounded-3xl border border-[#EBE6DD] p-4 sm:p-5 nm-warm-card">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EBE6DD] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
              <i className="fas fa-clock-rotate-left" aria-hidden="true"></i>
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-[#2D2A26]">
                최근 계산 기록
              </h2>
              <p className="text-[10px] text-stone-400 font-medium">
                클릭 시 결과값을 바로 불러옵니다
              </p>
            </div>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black border border-rose-200 transition-colors cursor-pointer"
            >
              비우기
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pt-3 pr-1">
          {history.length === 0 ? (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-4 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#DFD8CC] space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#EBE6DD] text-stone-400 flex items-center justify-center text-sm shadow-2xs">
                <i className="fas fa-calculator" aria-hidden="true"></i>
              </div>
              <p className="text-xs font-bold text-stone-500">아직 등록된 계산 기록이 없습니다.</p>
              <p className="text-[11px] text-stone-400 leading-relaxed max-w-[220px]">
                수식을 입력하고 <strong className="text-indigo-600">=</strong> 버튼을 누르면 여기에 최대 30건까지 자동 저장됩니다.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="group bg-[#FAF8F5] hover:bg-indigo-50/50 border border-[#EBE6DD] hover:border-indigo-200 rounded-2xl p-2.5 transition-colors flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onLoadItem(item)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-white border border-[#DFD8CC] text-stone-500">
                        {item.mode === 'basic' ? '일반' : `공학·${item.angleUnit}`}
                      </span>
                      <span className="text-[11px] font-calc-mono text-stone-500 truncate">
                        {item.expression} =
                      </span>
                    </div>
                    <div className="text-sm font-calc-mono font-black text-[#2D2A26] truncate tabular-nums">
                      {item.result}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onCopyValue(item.result)}
                      aria-label="기록 결과 복사"
                      title="결과 복사"
                      className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 text-stone-500 hover:text-indigo-700 border border-[#E3DDD2] flex items-center justify-center text-[10px] cursor-pointer"
                    >
                      <i className="far fa-copy" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label="기록 삭제"
                      title="삭제"
                      className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#E3DDD2] flex items-center justify-center text-[10px] cursor-pointer"
                    >
                      <i className="fas fa-xmark" aria-hidden="true"></i>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 하단 키보드 단축키 & 수학 상수 참조 카드 */}
      <div className="bg-white rounded-2xl border border-[#EBE6DD] p-3.5 shadow-2xs shrink-0 space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-[#2D2A26]">
          <span className="flex items-center gap-1.5">
            <i className="fas fa-keyboard text-indigo-600 text-xs" aria-hidden="true"></i>
            <span>키보드 빠른 조작</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            로컬 저장 100%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-stone-600">
          <div className="bg-[#FAF8F5] rounded-xl px-2.5 py-1.5 border border-[#EBE6DD] flex justify-between">
            <span className="font-bold">계산 실행</span>
            <kbd className="font-calc-mono font-black text-indigo-700">Enter / =</kbd>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl px-2.5 py-1.5 border border-[#EBE6DD] flex justify-between">
            <span className="font-bold">초기화</span>
            <kbd className="font-calc-mono font-black text-rose-600">Esc / Del</kbd>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl px-2.5 py-1.5 border border-[#EBE6DD] flex justify-between">
            <span className="font-bold">한 글자 지우기</span>
            <kbd className="font-calc-mono font-black text-[#2D2A26]">Backspace</kbd>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl px-2.5 py-1.5 border border-[#EBE6DD] flex justify-between">
            <span className="font-bold">거듭제곱 · !</span>
            <kbd className="font-calc-mono font-black text-[#2D2A26]">^ , ! , ( )</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default HistoryPanel;
