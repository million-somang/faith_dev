import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { QUICK_STARTER_ROUTINES, PRIORITY_MAP, type QuickRoutineStarter } from '../constants/todoMeta';
import { formatRecurrenceSummary, normalizeRecurrenceRule } from '../utils/recurrence';
import { getLocalDateString } from '../utils/todoAnalytics';

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
  const todayStr = getLocalDateString();

  if (isFiltered) {
    return (
      <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-5 bg-white/85 rounded-2xl border border-dashed border-[#D9D0C1] animate-fade-in">
        <EmptyState
          isCompact
          icon={<i className="fas fa-filter-circle-xmark text-xl text-[#8E8579]"></i>}
          title="조건에 일치하는 할 일이 없습니다"
          description="필터 또는 검색어를 초기화해 전체 할 일을 확인해 보세요."
          actions={
            <Button
              label="필터 전체 초기화"
              variant="primary"
              size="sm"
              onClick={onResetFilters}
            />
          }
        />
      </div>
    );
  }

  return (
    <div className="h-full min-h-[190px] flex flex-col items-center justify-center p-3 sm:p-4 bg-white/90 rounded-2xl border border-dashed border-[#D9D0C1] animate-fade-in">
      <EmptyState
        isCompact
        icon={
          <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E5DDD0] flex items-center justify-center text-indigo-600 text-base">
            <i className="fas fa-list-check"></i>
          </div>
        }
        title="아직 등록된 할 일이 없습니다"
        description="상단 입력창에 할 일을 적거나 반복 루틴을 바로 선택해 시작하세요."
      />

      {/* 사용자가 직접 클릭할 때만 추가되는 4대 반복 스타터 루틴 */}
      <div className="w-full max-w-sm space-y-1 mt-1.5">
        <div className="text-[10px] font-extrabold text-[#8E8579] text-center uppercase tracking-wider">
          원클릭 반복 루틴 빠른 시작 (클릭 시 추가)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-left">
          {QUICK_STARTER_ROUTINES.map((routine) => {
            const pri = PRIORITY_MAP[routine.priority];
            const recSummary = routine.recurrence
              ? formatRecurrenceSummary(normalizeRecurrenceRule(routine.recurrence, todayStr))
              : '';
            return (
              <button
                key={routine.id}
                type="button"
                onClick={() => onAddRoutine(routine)}
                className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-indigo-50/70 border border-[#E5DDD0] hover:border-indigo-300 transition-all flex items-center gap-2 cursor-pointer group active:scale-98"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${pri.dotClass}`}></span>
                <span className="text-[11px] font-bold text-[#24211D] group-hover:text-indigo-700 truncate flex-1">
                  + {routine.title}
                </span>
                {recSummary && <Badge variant="info" label={recSummary} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
