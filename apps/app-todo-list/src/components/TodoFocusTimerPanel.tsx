import { Button } from '@astryxdesign/core/Button';
import { CATEGORY_MAP } from '../constants/todoMeta';
import type { PomodoroMode } from '../hooks/usePomodoroTimer';
import type { TodoItem } from '../types/todo';

interface TodoFocusTimerPanelProps {
  readonly mode: PomodoroMode;
  readonly formattedTime: string;
  readonly elapsedPercent: number;
  readonly isRunning: boolean;
  readonly completedSessions: number;
  readonly pinnedTodo: TodoItem | null;
  readonly candidateTodos: readonly TodoItem[];
  readonly onToggleRun: () => void;
  readonly onReset: () => void;
  readonly onSwitchMode: (mode: PomodoroMode) => void;
  readonly onPinTodo: (id: string) => void;
  readonly onClearPin: () => void;
  readonly onCompletePinned: (id: string) => void;
  readonly onGoToTodo: () => void;
}

const DIAL_RADIUS = 74;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

export default function TodoFocusTimerPanel({
  mode,
  formattedTime,
  elapsedPercent,
  isRunning,
  completedSessions,
  pinnedTodo,
  candidateTodos,
  onToggleRun,
  onReset,
  onSwitchMode,
  onPinTodo,
  onClearPin,
  onCompletePinned,
  onGoToTodo,
}: TodoFocusTimerPanelProps) {
  const dashOffset = DIAL_CIRCUMFERENCE - (DIAL_CIRCUMFERENCE * elapsedPercent) / 100;
  const isFocus = mode === 'focus';

  const statusLabel = isRunning
    ? isFocus
      ? '집중 진행 중'
      : '휴식 중'
    : isFocus
      ? '집중 준비'
      : '휴식 준비';

  return (
    <section
      data-workspace-panel="timer"
      aria-label="25분 포모도로 집중 타이머"
      className="flex flex-col gap-3 animate-fade-in"
    >
      {/* 1. 메인 원형 포모도로 타이머 카드 */}
      <div className="bg-white rounded-2xl border border-[#E7E0D5] shadow-[0_2px_10px_rgba(36,33,29,0.04)] p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs ${
                isFocus
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <i className="fas fa-stopwatch"></i>
            </span>
            <div>
              <h2 className="text-[15px] font-black text-[#1C1917] leading-tight">
                포모도로 집중 타이머
              </h2>
              <p className="text-[11px] font-semibold text-[#6C655B]">
                누적 집중 <strong className="text-[#24211D] tabular-nums">{completedSessions}</strong>세션 완료
              </p>
            </div>
          </div>

          <div className="flex bg-[#EFEAE1] p-1 rounded-xl border border-[#E4DCCE] text-[11px] font-black">
            <button
              type="button"
              onClick={() => onSwitchMode('focus')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                isFocus
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-[#6C655B] hover:text-[#24211D]'
              }`}
            >
              집중 25분
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('break')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                !isFocus
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-[#6C655B] hover:text-[#24211D]'
              }`}
            >
              휴식 5분
            </button>
          </div>
        </div>

        {/* 뉴모피즘 원형 SVG 카운트다운 다이얼 */}
        <div className="py-1 flex justify-center">
          <div className="relative w-48 h-48 rounded-full bg-[#FAF8F5] border border-[#EAE3D7] shadow-[6px_6px_14px_rgba(138,124,102,0.14),-6px_-6px_14px_rgba(255,255,255,0.9)] flex items-center justify-center">
            <svg viewBox="0 0 180 180" className="w-44 h-44 -rotate-90" aria-hidden="true">
              <circle
                cx="90"
                cy="90"
                r={DIAL_RADIUS}
                fill="none"
                stroke="#E8E1D5"
                strokeWidth="8"
              />
              <circle
                cx="90"
                cy="90"
                r={DIAL_RADIUS}
                fill="none"
                stroke={isFocus ? '#4338CA' : '#059669'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={DIAL_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className={`text-[10px] font-black tracking-wide uppercase mb-1 ${
                  isRunning
                    ? isFocus
                      ? 'text-indigo-600'
                      : 'text-emerald-700'
                    : 'text-[#8E8579]'
                }`}
              >
                {statusLabel}
              </span>
              <span className="text-4xl font-mono font-black text-[#1C1917] tabular-nums tracking-tight leading-none">
                {formattedTime}
              </span>
              <span className="text-[10px] font-semibold text-[#8E8579] mt-1.5">
                {isFocus ? '25분 몰입 세션' : '5분 짧은 휴식'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-1">
          <Button
            label={isRunning ? '일시정지' : isFocus ? '집중 시작' : '휴식 시작'}
            variant={isRunning ? 'secondary' : 'primary'}
            size="md"
            onClick={onToggleRun}
            icon={<i className={`fas ${isRunning ? 'fa-pause' : 'fa-play'} text-[11px]`}></i>}
          />
          <Button
            label="초기화"
            variant="secondary"
            size="md"
            onClick={onReset}
            icon={<i className="fas fa-rotate-left text-xs"></i>}
          />
        </div>
      </div>

      {/* 2. 현재 집중할 할 일 선택/연동 카드 (실제 activeItems 기반) */}
      <div className="bg-white rounded-2xl border border-[#E7E0D5] shadow-[0_2px_10px_rgba(36,33,29,0.04)] overflow-clip">
        <div className="px-4 py-2.5 border-b border-[#F1ECE3] flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-black text-[#1C1917]">현재 집중할 할 일</h3>
          <span className="text-[11px] font-semibold text-[#8E8579]">
            {pinnedTodo ? '집중 대상 고정됨' : '1클릭으로 고정'}
          </span>
        </div>

        {pinnedTodo ? (
          <div className="p-3.5 bg-indigo-50/45 flex items-center justify-between gap-2.5">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <i className="fas fa-thumbtack text-indigo-600 text-xs mt-1 shrink-0"></i>
              <div className="min-w-0">
                <p
                  className={`text-[13.5px] font-bold leading-snug break-words ${
                    pinnedTodo.completed ? 'line-through text-[#8E8579]' : 'text-[#1C1917]'
                  }`}
                >
                  {pinnedTodo.title}
                </p>
                <p className="text-[11px] font-medium text-[#6C655B] mt-0.5">
                  {CATEGORY_MAP[pinnedTodo.category].label}
                  {pinnedTodo.occurrence.isRecurring && pinnedTodo.occurrence.summaryLabel
                    ? ` · ${pinnedTodo.occurrence.summaryLabel}`
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!pinnedTodo.completed && (
                <button
                  type="button"
                  onClick={() => onCompletePinned(pinnedTodo.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black cursor-pointer transition-colors"
                >
                  완료
                </button>
              )}
              <button
                type="button"
                onClick={onClearPin}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5DDD0] text-[#57534E] text-[11px] font-bold cursor-pointer transition-colors"
              >
                해제
              </button>
            </div>
          </div>
        ) : candidateTodos.length > 0 ? (
          <div className="divide-y divide-[#F1ECE3]">
            {candidateTodos.map((item) => {
              const dotClass =
                item.priority === 'urgent'
                  ? 'bg-rose-500'
                  : item.priority === 'important'
                    ? 'bg-amber-400'
                    : 'bg-stone-300';
              return (
                <div
                  key={item.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-2.5 hover:bg-[#FAF8F5]/80 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1C1917] truncate">{item.title}</p>
                      <p className="text-[10.5px] font-medium text-[#78716C] truncate">
                        {CATEGORY_MAP[item.category].label}
                        {item.occurrence.isRecurring && item.occurrence.summaryLabel
                          ? ` · ${item.occurrence.summaryLabel}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPinTodo(item.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-indigo-50 border border-[#E5DDD0] hover:border-indigo-200 text-[#4D473F] hover:text-indigo-700 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    <i className="fas fa-thumbtack text-[9px]"></i>
                    <span>고정</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center space-y-2.5">
            <p className="text-xs font-bold text-[#6C655B]">집중할 미완료 할 일이 없습니다.</p>
            <Button
              label="TODO에서 할 일 추가하기"
              variant="secondary"
              size="sm"
              onClick={onGoToTodo}
            />
          </div>
        )}
      </div>
    </section>
  );
}
