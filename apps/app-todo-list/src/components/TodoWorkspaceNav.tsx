import type { PomodoroMode } from '../hooks/usePomodoroTimer';
import type { WorkspaceView } from '../types/todo';

export interface TodoWorkspaceNavProps {
  readonly activeView: WorkspaceView;
  readonly onChangeView: (view: WorkspaceView) => void;
  readonly todayActiveCount: number;
  readonly todayCompletionRate: number;
  readonly isTodayAllDone: boolean;
  readonly pomodoroRunning: boolean;
  readonly pomodoroTime: string;
  readonly pomodoroMode: PomodoroMode;
}

export default function TodoWorkspaceNav({
  activeView,
  onChangeView,
  todayActiveCount,
  todayCompletionRate,
  isTodayAllDone,
  pomodoroRunning,
  pomodoroTime,
  pomodoroMode,
}: TodoWorkspaceNavProps) {
  const raisedClass =
    'bg-white text-[#1C1917] shadow-[0_2px_8px_rgba(36,33,29,0.09),0_1px_2px_rgba(36,33,29,0.05)] border border-[#E7E0D5]';
  const idleClass =
    'text-[#6C655B] hover:text-[#24211D] hover:bg-white/55 border border-transparent';

  return (
    <nav
      role="tablist"
      aria-label="스마트 투두 메뉴"
      className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#EFEAE1] border border-[#E4DCCE] shadow-[inset_2px_2px_5px_rgba(138,124,102,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.75)] shrink-0"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'todo'}
        data-workspace-tab="todo"
        onClick={() => onChangeView('todo')}
        className={`h-10 px-2 rounded-xl text-[12px] font-black whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
          activeView === 'todo' ? raisedClass : idleClass
        }`}
      >
        <i
          className={`fas fa-list-check text-[11px] ${
            activeView === 'todo' ? 'text-indigo-600' : 'text-[#8E8579]'
          }`}
        ></i>
        <span>TODO</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black tabular-nums leading-none ${
            isTodayAllDone
              ? 'bg-emerald-50 text-emerald-700'
              : activeView === 'todo'
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-white/75 text-[#6C655B]'
          }`}
        >
          {isTodayAllDone ? '✓' : todayActiveCount}
        </span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'report'}
        data-workspace-tab="report"
        data-screenshot-click="result"
        onClick={() => onChangeView('report')}
        className={`h-10 px-2 rounded-xl text-[12px] font-black whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
          activeView === 'report' ? raisedClass : idleClass
        }`}
      >
        <i
          className={`fas fa-chart-pie text-[11px] ${
            activeView === 'report' ? 'text-indigo-600' : 'text-[#8E8579]'
          }`}
        ></i>
        <span>보고서</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black tabular-nums leading-none ${
            isTodayAllDone
              ? 'bg-emerald-50 text-emerald-700'
              : activeView === 'report'
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-white/75 text-[#6C655B]'
          }`}
        >
          {todayCompletionRate}%
        </span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'timer'}
        data-workspace-tab="timer"
        onClick={() => onChangeView('timer')}
        className={`h-10 px-2 rounded-xl text-[12px] font-black whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
          activeView === 'timer' ? raisedClass : idleClass
        }`}
      >
        <i
          className={`fas fa-stopwatch text-[11px] ${
            pomodoroRunning
              ? pomodoroMode === 'focus'
                ? 'text-indigo-600 animate-pulse-ring'
                : 'text-emerald-600 animate-pulse-ring'
              : activeView === 'timer'
                ? 'text-indigo-600'
                : 'text-[#8E8579]'
          }`}
        ></i>
        {pomodoroRunning ? (
          <>
            <span className="hidden sm:inline">집중타이머</span>
            <span className="sm:hidden">타이머</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black tabular-nums leading-none animate-pulse-ring ${
                pomodoroMode === 'focus'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {pomodoroTime}
            </span>
          </>
        ) : (
          <span>집중타이머</span>
        )}
      </button>
    </nav>
  );
}
