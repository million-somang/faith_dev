import { useEffect, useState } from 'react';
import {
  POMODORO_BREAK_PRESETS,
  POMODORO_FOCUS_PRESETS,
  POMODORO_MAX_MINUTES,
  POMODORO_MIN_MINUTES,
  TODO_POMODORO_THEME_KEY,
} from '../constants/todoMeta';
import { useCircularDial } from '../hooks/useCircularDial';
import type { PomodoroMode, PomodoroTheme } from '../hooks/usePomodoroTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { safeStorage } from '../utils/safeStorage';

interface TodoFocusTimerPanelProps {
  readonly mode: PomodoroMode;
  readonly secondsLeft: number;
  readonly formattedTime: string;
  readonly elapsedPercent: number;
  readonly isRunning: boolean;
  readonly completedSessions: number;
  readonly focusMinutes: number;
  readonly breakMinutes: number;
  readonly isFullscreen: boolean;
  readonly isFullscreenSupported: boolean;
  readonly onToggleRun: () => void;
  readonly onReset: () => void;
  readonly onSwitchMode: (mode: PomodoroMode) => void;
  readonly onUpdateFocusMinutes: (minutes: number) => void;
  readonly onUpdateBreakMinutes: (minutes: number) => void;
  readonly onToggleFullscreen: () => void;
  readonly onExitTimer: () => void;
}

interface DurationCardProps {
  readonly title: string;
  readonly iconClass: string;
  readonly minutes: number;
  readonly presets: readonly number[];
  readonly accent: 'indigo' | 'emerald';
  readonly isDark: boolean;
  readonly isDisabled: boolean;
  readonly onChangeMinutes: (minutes: number) => void;
}

const MINUTES_PER_REVOLUTION = 60;
const DIAL_CENTER = 120;
const DIAL_RADIUS = 94;
const OUTER_LAP_RADIUS = 102.5;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

interface DialTick {
  readonly key: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly isMajor: boolean;
}

interface DialQuarterLabel {
  readonly label: string;
  readonly x: number;
  readonly y: number;
}

const DIAL_TICKS: readonly DialTick[] = Array.from({ length: 12 }, (_, index) => {
  const rad = ((index * 30 - 90) * Math.PI) / 180;
  const isMajor = index % 3 === 0;
  const innerRadius = isMajor ? 80 : 83;
  const outerRadius = 87;
  return {
    key: index,
    x1: DIAL_CENTER + innerRadius * Math.cos(rad),
    y1: DIAL_CENTER + innerRadius * Math.sin(rad),
    x2: DIAL_CENTER + outerRadius * Math.cos(rad),
    y2: DIAL_CENTER + outerRadius * Math.sin(rad),
    isMajor,
  };
});

const DIAL_QUARTER_LABELS: readonly DialQuarterLabel[] = [
  { label: '60', angleDeg: 0 },
  { label: '15', angleDeg: 90 },
  { label: '30', angleDeg: 180 },
  { label: '45', angleDeg: 270 },
].map(({ label, angleDeg }) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const labelRadius = 111.5;
  return {
    label,
    x: DIAL_CENTER + labelRadius * Math.cos(rad),
    y: DIAL_CENTER + labelRadius * Math.sin(rad),
  };
});

function loadStoredTheme(): PomodoroTheme {
  const stored = safeStorage.get<string>(TODO_POMODORO_THEME_KEY, 'light');
  return stored === 'dark' ? 'dark' : 'light';
}

function DurationCard({
  title,
  iconClass,
  minutes,
  presets,
  accent,
  isDark,
  isDisabled,
  onChangeMinutes,
}: DurationCardProps) {
  const [draft, setDraft] = useState<string>(() => String(minutes));

  useEffect(() => {
    setDraft(String(minutes));
  }, [minutes]);

  const commitDraft = () => {
    const parsed = Number(draft);
    if (!draft.trim() || !Number.isFinite(parsed)) {
      setDraft(String(minutes));
      return;
    }
    const clamped = Math.min(
      POMODORO_MAX_MINUTES,
      Math.max(POMODORO_MIN_MINUTES, Math.round(parsed))
    );
    onChangeMinutes(clamped);
    setDraft(String(clamped));
  };

  const cardSurface = isDark
    ? 'bg-[#131C31] border-slate-800/80 shadow-[6px_6px_16px_rgba(2,6,23,0.65),-4px_-4px_12px_rgba(30,41,59,0.4)]'
    : 'bg-[#F0F4F8] border-white/80 shadow-[6px_6px_14px_rgba(163,177,198,0.45),-6px_-6px_14px_rgba(255,255,255,0.9)]';

  const insetSurface = isDark
    ? 'bg-[#0B1120] border-slate-800/90 text-slate-100 shadow-[inset_3px_3px_7px_rgba(2,6,23,0.8),inset_-2px_-2px_6px_rgba(30,41,59,0.45)]'
    : 'bg-white border-slate-200/70 text-[#1E293B] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.32),inset_-3px_-3px_6px_rgba(255,255,255,0.85)]';

  const stepBtnClass = isDark
    ? 'bg-[#1A2540] hover:bg-[#223052] text-slate-200 border-slate-700/70 shadow-[3px_3px_8px_rgba(2,6,23,0.6),-2px_-2px_6px_rgba(30,41,59,0.4)]'
    : 'bg-white hover:bg-slate-50 text-[#1E293B] border-white shadow-[3px_3px_8px_rgba(163,177,198,0.4),-3px_-3px_8px_rgba(255,255,255,0.9)]';

  const activePresetClass =
    accent === 'indigo'
      ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white border-transparent shadow-md'
      : 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white border-transparent shadow-md';

  const idlePresetClass = isDark
    ? 'bg-[#0F172A] hover:bg-[#1E293B] text-slate-300 border-slate-800'
    : 'bg-white hover:bg-slate-50 text-[#475569] border-slate-200/80 shadow-[2px_2px_5px_rgba(163,177,198,0.28),-2px_-2px_5px_rgba(255,255,255,0.8)]';

  const iconBadgeClass =
    accent === 'indigo'
      ? isDark
        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
        : 'bg-indigo-50 text-[#6366F1] border-indigo-200/70'
      : isDark
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        : 'bg-emerald-50 text-[#10B981] border-emerald-200/70';

  return (
    <div className={`rounded-2xl border p-3 transition-colors ${cardSurface}`}>
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[11px] ${iconBadgeClass}`}
          >
            <i className={iconClass}></i>
          </span>
          <span
            className={`text-xs font-extrabold tracking-tight ${
              isDark ? 'text-slate-100' : 'text-[#1E293B]'
            }`}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {presets.map((preset) => {
            const isSelected = minutes === preset;
            return (
              <button
                key={preset}
                type="button"
                disabled={isDisabled}
                onClick={() => onChangeMinutes(preset)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
                  isSelected ? activePresetClass : idlePresetClass
                }`}
              >
                {preset}분
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isDisabled || minutes <= POMODORO_MIN_MINUTES}
          onClick={() => onChangeMinutes(minutes - 1)}
          aria-label={`${title} 1분 감소`}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${stepBtnClass}`}
        >
          <i className="fas fa-minus text-[10px]"></i>
        </button>

        <div
          className={`flex-1 h-8 rounded-xl border px-2.5 flex items-center justify-center gap-0.5 ${insetSurface}`}
        >
          <input
            type="number"
            min={POMODORO_MIN_MINUTES}
            max={POMODORO_MAX_MINUTES}
            value={draft}
            disabled={isDisabled}
            aria-label={`${title} (분)`}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft(raw);
              if (!raw.trim()) return;
              const num = Number(raw);
              if (
                Number.isFinite(num) &&
                num >= POMODORO_MIN_MINUTES &&
                num <= POMODORO_MAX_MINUTES
              ) {
                onChangeMinutes(Math.round(num));
              }
            }}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitDraft();
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
            className="w-9 sm:w-11 bg-transparent text-right pr-0.5 font-mono text-sm font-black tabular-nums outline-none disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span
            className={`text-[11px] font-bold shrink-0 ${
              isDark ? 'text-slate-400' : 'text-[#64748B]'
            }`}
          >
            분
          </span>
        </div>

        <button
          type="button"
          disabled={isDisabled || minutes >= POMODORO_MAX_MINUTES}
          onClick={() => onChangeMinutes(minutes + 1)}
          aria-label={`${title} 1분 증가`}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${stepBtnClass}`}
        >
          <i className="fas fa-plus text-[10px]"></i>
        </button>
      </div>
    </div>
  );
}

export default function TodoFocusTimerPanel({
  mode,
  secondsLeft,
  formattedTime,
  isRunning,
  completedSessions,
  focusMinutes,
  breakMinutes,
  isFullscreen,
  isFullscreenSupported,
  onToggleRun,
  onReset,
  onSwitchMode,
  onUpdateFocusMinutes,
  onUpdateBreakMinutes,
  onToggleFullscreen,
  onExitTimer,
}: TodoFocusTimerPanelProps) {
  const [theme, setTheme] = useState<PomodoroTheme>(() => loadStoredTheme());
  const [logoError, setLogoError] = useState<boolean>(false);
  const wakeLock = useWakeLock(isRunning);

  const isDark = theme === 'dark';
  const isFocus = mode === 'focus';
  const activeMinutes = isFocus ? focusMinutes : breakMinutes;
  const handleActiveMinutesChange = isFocus ? onUpdateFocusMinutes : onUpdateBreakMinutes;

  const dial = useCircularDial({
    valueMinutes: activeMinutes,
    minMinutes: POMODORO_MIN_MINUTES,
    maxMinutes: POMODORO_MAX_MINUTES,
    minutesPerRevolution: MINUTES_PER_REVOLUTION,
    onChangeMinutes: handleActiveMinutesChange,
  });

  const displayMinutesExact = Math.max(0, secondsLeft / 60);
  const completedLaps =
    displayMinutesExact > MINUTES_PER_REVOLUTION
      ? Math.floor((displayMinutesExact - 0.0001) / MINUTES_PER_REVOLUTION)
      : 0;
  const lapMinutes =
    displayMinutesExact <= 0
      ? 0
      : displayMinutesExact - completedLaps * MINUTES_PER_REVOLUTION;
  const sweepRatio = Math.min(1, Math.max(0, lapMinutes / MINUTES_PER_REVOLUTION));
  const dashOffset = DIAL_CIRCUMFERENCE * (1 - sweepRatio);
  const knobAngleRad = ((sweepRatio * 360 - 90) * Math.PI) / 180;
  const knobX = DIAL_CENTER + DIAL_RADIUS * Math.cos(knobAngleRad);
  const knobY = DIAL_CENTER + DIAL_RADIUS * Math.sin(knobAngleRad);

  const handleSelectTheme = (nextTheme: PomodoroTheme) => {
    setTheme(nextTheme);
    safeStorage.set(TODO_POMODORO_THEME_KEY, nextTheme);
  };

  const statusLabel = isRunning
    ? isFocus
      ? '집중 진행 중'
      : '휴식 중'
    : isFocus
      ? '집중 준비'
      : '휴식 준비';
  const isLongFormattedTime = formattedTime.length >= 6;

  const rootThemeClass = isDark
    ? 'bg-[#0B1120] text-[#F1F5F9]'
    : 'bg-[#F4F7FA] text-[#1E293B]';

  const controlPillClass = isDark
    ? 'bg-[#131C31] hover:bg-[#1A2540] text-slate-200 border-slate-800 shadow-[4px_4px_12px_rgba(2,6,23,0.65),-3px_-3px_10px_rgba(30,41,59,0.45)]'
    : 'bg-white hover:bg-[#F8FAFC] text-[#1E293B] border-white/90 shadow-[4px_4px_12px_rgba(163,177,198,0.45),-4px_-4px_12px_rgba(255,255,255,0.95)]';

  const insetTrackClass = isDark
    ? 'bg-[#070C18] border-slate-800/90 shadow-[inset_3px_3px_8px_rgba(2,6,23,0.85),inset_-2px_-2px_6px_rgba(30,41,59,0.45)]'
    : 'bg-[#E6ECF3] border-white/60 shadow-[inset_3px_3px_7px_rgba(163,177,198,0.45),inset_-3px_-3px_7px_rgba(255,255,255,0.85)]';

  const dialShellClass = isDark
    ? 'bg-[#131C31] border-slate-800/80 shadow-[12px_12px_28px_rgba(2,6,23,0.75),-10px_-10px_24px_rgba(30,41,59,0.5)]'
    : 'bg-white border-white/90 shadow-[10px_10px_24px_rgba(163,177,198,0.48),-10px_-10px_24px_rgba(255,255,255,0.95)]';

  const logoBadgeClass = isDark
    ? 'bg-white border-indigo-400/40 ring-2 ring-indigo-400/20 shadow-[0_0_16px_rgba(129,140,248,0.28)]'
    : 'bg-white border-white shadow-[3px_3px_8px_rgba(163,177,198,0.45),-3px_-3px_8px_rgba(255,255,255,0.95)]';

  const primaryActionClass = isRunning
    ? isDark
      ? 'bg-[#1A2540] hover:bg-[#233154] text-slate-100 border-slate-700/80 shadow-[6px_6px_16px_rgba(2,6,23,0.75),-4px_-4px_12px_rgba(30,41,59,0.45)]'
      : 'bg-white hover:bg-slate-50 text-[#1E293B] border-white shadow-[6px_6px_14px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.95)]'
    : isFocus
      ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E6] hover:to-[#7C4DFF] text-white border-transparent shadow-[0_8px_20px_rgba(99,102,241,0.38)]'
      : 'bg-gradient-to-br from-[#10B981] to-[#059669] hover:from-[#0EA572] hover:to-[#047857] text-white border-transparent shadow-[0_8px_20px_rgba(16,185,129,0.35)]';

  const strokeTrackColor = isDark ? '#1E293B' : '#E2E8F0';
  const strokeProgressColor = isFocus
    ? isDark
      ? '#818CF8'
      : '#6366F1'
    : isDark
      ? '#34D399'
      : '#10B981';

  return (
    <section
      data-workspace-panel="timer"
      data-timer-theme={theme}
      aria-label="전체 화면 포모도로 집중 타이머"
      className={`fixed inset-0 z-50 flex flex-col overflow-y-auto select-none transition-colors duration-300 ${rootThemeClass}`}
    >
      {/* 상단 컨트롤 바 */}
      <header className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-1.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={onExitTimer}
            data-timer-exit="true"
            className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0 ${controlPillClass}`}
          >
            <i className="fas fa-arrow-left text-[11px]"></i>
            <span>투두로 돌아가기</span>
          </button>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px] font-bold ${
              isDark
                ? 'bg-[#131C31]/80 border-slate-800 text-slate-300'
                : 'bg-white/80 border-white text-[#475569] shadow-xs'
            }`}
          >
            <i
              className={`fas fa-fire text-[11px] ${
                isDark ? 'text-indigo-400' : 'text-[#6366F1]'
              }`}
            ></i>
            <span>
              누적 <strong className="font-mono tabular-nums">{completedSessions}</strong>세션
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 화면 꺼짐 방지(Screen Wake Lock) 상태 표시 */}
          {isRunning && wakeLock.isLocked && (
            <span
              data-wakelock-status="active"
              title="타이머 실행 중 화면 꺼짐 방지 활성화됨"
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl border text-[10.5px] sm:text-[11px] font-bold inline-flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="hidden sm:inline">화면 켜짐 유지 중</span>
              <span className="sm:hidden">켜짐</span>
            </span>
          )}

          {/* 2종 테마 전환 토글 (하얀배경 / 다크디자인) */}
          <div
            role="group"
            aria-label="집중 타이머 배경 테마 선택"
            className={`p-0.5 sm:p-1 rounded-xl border inline-flex items-center gap-0.5 sm:gap-1 ${insetTrackClass}`}
          >
            <button
              type="button"
              data-theme-option="light"
              aria-pressed={!isDark}
              onClick={() => handleSelectTheme('light')}
              className={`h-7 px-1.5 sm:px-2.5 rounded-lg text-[10.5px] sm:text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all ${
                !isDark
                  ? 'bg-white text-[#1E293B] shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fas fa-sun text-[10px] text-amber-500"></i>
              <span>화이트</span>
            </button>
            <button
              type="button"
              data-theme-option="dark"
              aria-pressed={isDark}
              onClick={() => handleSelectTheme('dark')}
              className={`h-7 px-1.5 sm:px-2.5 rounded-lg text-[10.5px] sm:text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#1E293B] text-slate-100 shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <i className="fas fa-moon text-[10px] text-indigo-400"></i>
              <span>다크</span>
            </button>
          </div>

          {/* 브라우저 전체화면 토글 버튼 */}
          {isFullscreenSupported && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? '브라우저 전체화면 해제' : '브라우저 전체화면 확대'}
              title={isFullscreen ? '전체화면 해제' : '전체화면 확대'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center text-xs cursor-pointer transition-all active:scale-95 ${controlPillClass}`}
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          )}
        </div>
      </header>

      {/* 중앙 몰입형 타이머 & 설정 스테이지 */}
      <main className="flex-1 w-full max-w-xl mx-auto px-3 sm:px-4 pt-3 pb-6 sm:py-3 flex flex-col items-center justify-start sm:justify-center gap-3 sm:gap-5">
        {/* 집중 / 휴식 모드 전환 세그먼트 */}
        <div
          role="group"
          aria-label="타이머 모드 선택"
          className={`p-1 rounded-2xl border inline-flex items-center gap-1 ${insetTrackClass}`}
        >
          <button
            type="button"
            onClick={() => onSwitchMode('focus')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              isFocus
                ? isDark
                  ? 'bg-[#1E293B] text-indigo-300 shadow-md'
                  : 'bg-white text-[#6366F1] shadow-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            집중 {focusMinutes}분
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('break')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              !isFocus
                ? isDark
                  ? 'bg-[#1E293B] text-emerald-300 shadow-md'
                  : 'bg-white text-[#10B981] shadow-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            휴식 {breakMinutes}분
          </button>
        </div>

        {/* 뉴모피즘 대형 원형 시계 다이얼 + 회전하는 베라 로고 */}
        <div
          className={`relative w-[272px] h-[272px] max-w-[calc(100vw-2rem)] aspect-square sm:w-72 sm:h-72 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${dialShellClass}`}
        >
          <svg
            ref={dial.svgRef}
            viewBox="0 0 240 240"
            role="slider"
            tabIndex={0}
            aria-label={`${isFocus ? '집중' : '휴식'} 시간 원형 다이얼`}
            aria-valuemin={POMODORO_MIN_MINUTES}
            aria-valuemax={POMODORO_MAX_MINUTES}
            aria-valuenow={activeMinutes}
            aria-valuetext={`${activeMinutes}분`}
            data-dial-minutes={activeMinutes}
            data-dial-laps={completedLaps}
            onPointerDown={dial.handlePointerDown}
            onPointerMove={dial.handlePointerMove}
            onPointerUp={dial.handlePointerUp}
            onPointerCancel={dial.handlePointerUp}
            onWheel={dial.handleWheel}
            onKeyDown={dial.handleKeyDown}
            className={`w-[260px] h-[260px] max-w-full max-h-full sm:w-[276px] sm:h-[276px] touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
              dial.isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* 60분 초과 바퀴(+1h / +2h) 외곽 보조 링 */}
            {completedLaps >= 1 && (
              <circle
                cx={DIAL_CENTER}
                cy={DIAL_CENTER}
                r={OUTER_LAP_RADIUS}
                fill="none"
                stroke={strokeProgressColor}
                strokeOpacity={completedLaps >= 2 ? 0.55 : 0.28}
                strokeWidth={completedLaps >= 2 ? 3.5 : 2.25}
              />
            )}

            {/* 5분 단위 시계 눈금 (15분 단위 강조) */}
            {DIAL_TICKS.map((tick) => (
              <line
                key={tick.key}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={
                  tick.isMajor
                    ? isDark
                      ? '#64748B'
                      : '#94A3B8'
                    : isDark
                      ? '#334155'
                      : '#CBD5E1'
                }
                strokeWidth={tick.isMajor ? 2 : 1.25}
                strokeLinecap="round"
              />
            ))}

            {/* 15 / 30 / 45 / 60 숫자 라벨 */}
            {DIAL_QUARTER_LABELS.map((item) => (
              <text
                key={item.label}
                x={item.x}
                y={item.y}
                fill={isDark ? '#94A3B8' : '#64748B'}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {item.label}
              </text>
            ))}

            {/* 기본 트랙 링 */}
            <circle
              cx={DIAL_CENTER}
              cy={DIAL_CENTER}
              r={DIAL_RADIUS}
              fill="none"
              stroke={strokeTrackColor}
              strokeWidth="8"
            />

            {/* 설정/남은 시간 진행 호 */}
            <circle
              cx={DIAL_CENTER}
              cy={DIAL_CENTER}
              r={DIAL_RADIUS}
              fill="none"
              stroke={strokeProgressColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={DIAL_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${DIAL_CENTER} ${DIAL_CENTER})`}
              className={dial.isDragging ? 'transition-none' : 'transition-all duration-300'}
            />

            {/* 뉴모피즘 드래그 노브 핸들 */}
            <g className={dial.isDragging ? 'transition-none' : 'transition-all duration-300'}>
              <circle
                cx={knobX}
                cy={knobY}
                r={dial.isDragging ? 13 : 11.5}
                fill={strokeProgressColor}
                fillOpacity={dial.isDragging ? 0.25 : 0.14}
              />
              <circle
                cx={knobX}
                cy={knobY}
                r={dial.isDragging ? 9.5 : 8.5}
                fill={isDark ? '#1E293B' : '#FFFFFF'}
                stroke={strokeProgressColor}
                strokeWidth="2.8"
              />
              <circle
                cx={knobX}
                cy={knobY}
                r={dial.isDragging ? 3 : 2.5}
                fill={strokeProgressColor}
              />
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-7 sm:px-8">
            {/* 회전하는 베라(VeraNex) 로고 배지 */}
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border p-1 overflow-hidden flex items-center justify-center mb-1 sm:mb-1.5 ${logoBadgeClass}`}
            >
              {!logoError ? (
                <img
                  src="https://veranex.app/logo-192.png"
                  alt="VeraNex 로고"
                  data-vera-spinning={isRunning ? 'true' : 'false'}
                  className={`w-full h-full object-contain rounded-full ${
                    isRunning ? 'animate-vera-spin' : 'animate-vera-spin-paused'
                  }`}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <svg
                  viewBox="0 0 40 40"
                  aria-label="VeraNex 로고"
                  data-vera-spinning={isRunning ? 'true' : 'false'}
                  className={`w-full h-full ${
                    isRunning ? 'animate-vera-spin' : 'animate-vera-spin-paused'
                  }`}
                >
                  <defs>
                    <linearGradient id="veraTimerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                  <circle cx="20" cy="20" r="18" fill="url(#veraTimerLogoGrad)" />
                  <path
                    d="M12 13l8 16 8-16"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <span
                className={`text-[10.5px] sm:text-[11px] font-black tracking-wider uppercase ${
                  isRunning
                    ? isFocus
                      ? isDark
                        ? 'text-indigo-300'
                        : 'text-[#6366F1]'
                      : isDark
                        ? 'text-emerald-300'
                        : 'text-[#10B981]'
                    : isDark
                      ? 'text-slate-400'
                      : 'text-[#64748B]'
                }`}
              >
                {statusLabel}
              </span>
              {completedLaps >= 1 && (
                <span
                  data-dial-lap-badge={completedLaps}
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none border ${
                    isFocus
                      ? isDark
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
                        : 'bg-indigo-50 text-[#6366F1] border-indigo-200'
                      : isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-emerald-50 text-[#059669] border-emerald-200'
                  }`}
                >
                  +{completedLaps}h
                </span>
              )}
            </div>

            <span
              data-timer-display="true"
              className={`${
                isLongFormattedTime ? 'text-[28px] sm:text-4xl' : 'text-[34px] sm:text-5xl'
              } font-mono font-black tabular-nums tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-[#1E293B]'
              }`}
            >
              {formattedTime}
            </span>

            <span
              className={`text-[10.5px] sm:text-[11px] font-semibold mt-1 sm:mt-1.5 ${
                isDark ? 'text-slate-400' : 'text-[#64748B]'
              }`}
            >
              {isFocus ? `${focusMinutes}분 몰입 세션` : `${breakMinutes}분 짧은 휴식`}
            </span>
          </div>
        </div>

        {/* 시작 / 일시정지 & 초기화 버튼 */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onToggleRun}
            data-timer-toggle="true"
            className={`h-11 px-6 rounded-2xl border text-sm font-black inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${primaryActionClass}`}
          >
            <i className={`fas ${isRunning ? 'fa-pause' : 'fa-play'} text-xs`}></i>
            <span>{isRunning ? '일시정지' : isFocus ? '집중 시작' : '휴식 시작'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            data-timer-reset="true"
            className={`h-11 px-4 rounded-2xl border text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${controlPillClass}`}
          >
            <i className="fas fa-rotate-left text-xs"></i>
            <span>초기화</span>
          </button>
        </div>

        {/* 집중·휴식 시간 맞춤 설정 패널 */}
        <div className="w-full space-y-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            <DurationCard
              title="집중 시간"
              iconClass="fas fa-bolt"
              minutes={focusMinutes}
              presets={POMODORO_FOCUS_PRESETS}
              accent="indigo"
              isDark={isDark}
              isDisabled={false}
              onChangeMinutes={onUpdateFocusMinutes}
            />
            <DurationCard
              title="휴식 시간"
              iconClass="fas fa-mug-hot"
              minutes={breakMinutes}
              presets={POMODORO_BREAK_PRESETS}
              accent="emerald"
              isDark={isDark}
              isDisabled={false}
              onChangeMinutes={onUpdateBreakMinutes}
            />
          </div>

          <p
            className={`text-center text-[11px] font-medium min-h-4 ${
              isDark ? 'text-slate-400' : 'text-[#64748B]'
            }`}
          >
            {`다이얼을 돌리거나 숫자를 입력해 ${POMODORO_MIN_MINUTES}~${POMODORO_MAX_MINUTES}분까지 자유롭게 설정할 수 있습니다. (실행 중 즉시 조절 · 자동 저장)`}
          </p>
        </div>
      </main>
    </section>
  );
}
