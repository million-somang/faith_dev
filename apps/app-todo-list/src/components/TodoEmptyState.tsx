import { QUICK_STARTER_ROUTINES, PRIORITY_MAP, type QuickRoutineStarter } from '../constants/todoMeta';

interface TodoEmptyStateProps {
  readonly isFiltered: boolean;
  readonly onResetFilters: () => void;
  readonly onAddRoutine: (routine: QuickRoutineStarter) => void;
}

export default function TodoEmptyState({
  isFiltered,
  onResetFilters,
  onAddRoutine,
}: TodoEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-5 bg-white/70 rounded-2xl border border-dashed border-[#DFD9CE] animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] text-[#7A7369] flex items-center justify-center text-lg mb-2.5 border border-[#EBE6DD]">
          <i className="fas fa-filter-circle-xmark"></i>
        </div>
        <p className="text-xs font-black text-[#2D2A26] mb-1">
          조건에 일치하는 할 일이 없습니다
        </p>
        <p className="text-[11px] text-[#7A7369] mb-3">
          필터 또는 검색어를 초기화해 전체 할 일을 확인해 보세요.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black transition-all cursor-pointer active:scale-95"
        >
          필터 전체 초기화
        </button>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4 sm:p-5 bg-white/85 rounded-2xl border border-dashed border-[#DCD4C6] animate-fade-in">
      {/* 정직한 Empty State SVG 일러스트 */}
      <svg viewBox="0 0 88 72" className="w-20 h-16 mb-2.5" aria-hidden="true">
        <rect x="14" y="8" width="60" height="56" rx="14" fill="#FAF8F5" stroke="#DFD9CE" strokeWidth="2" />
        <rect x="26" y="22" width="36" height="6" rx="3" fill="#E5E0D5" />
        <rect x="26" y="34" width="28" height="6" rx="3" fill="#E5E0D5" />
        <rect x="26" y="46" width="20" height="6" rx="3" fill="#E5E0D5" />
        <circle cx="64" cy="52" r="13" fill="#10B981" />
        <path d="M58.5 52l3.8 3.8 7.2-7.6" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <h3 className="text-sm font-black text-[#2D2A26] mb-1">
        아직 등록된 할 일이 없습니다
      </h3>
      <p className="text-[11px] text-[#7A7369] max-w-xs leading-relaxed mb-3.5">
        위 입력창에 오늘 해야 할 일을 바로 적거나, 아래 자주 쓰는 루틴을 눌러 즉시 추가할 수 있습니다.
      </p>

      {/* 사용자가 직접 클릭할 때만 추가되는 퀵 루틴 스타터 */}
      <div className="w-full max-w-sm space-y-1.5">
        <div className="text-[10px] font-extrabold text-[#A39C90] uppercase tracking-wider">
          원클릭 빠른 시작 루틴 (클릭 시 추가)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-left">
          {QUICK_STARTER_ROUTINES.map((routine) => {
            const pri = PRIORITY_MAP[routine.priority];
            return (
              <button
                key={routine.id}
                type="button"
                onClick={() => onAddRoutine(routine)}
                className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50/70 border border-[#EBE6DD] hover:border-indigo-300 transition-all flex items-center gap-2 cursor-pointer group active:scale-98"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${pri.dotClass}`}></span>
                <span className="text-[11px] font-bold text-[#2D2A26] group-hover:text-indigo-700 truncate flex-1">
                  + {routine.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
