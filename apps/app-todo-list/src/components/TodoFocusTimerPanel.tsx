import { useEffect, useState } from 'react';
import {
  POMODORO_BREAK_PRESETS,
  POMODORO_FOCUS_PRESETS,
  POMODORO_MAX_MINUTES,
  POMODORO_MIN_MINUTES,
  TODO_POMODORO_THEME_KEY,
} from '../constants/todoMeta';
import type { PomodoroMode, PomodoroTheme } from '../hooks/usePomodoroTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { safeStorage } from '../utils/safeStorage';

interface TodoFocusTimerPanelProps {
  readonly mode: PomodoroMode;
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

const DIAL_RADIUS = 96;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

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
      <div className="flex items-center justify-between gap-2 mb-2.5">
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
          className={`flex-1 h-8 rounded-xl border px-2.5 flex items-center justify-center gap-1 ${insetSurface}`}
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
            className="w-14 bg-transparent text-center font-mono text-sm font-black tabular-nums outline-none disabled:opacity-60"
          />
          <span
            className={`text-[11px] font-bold ${
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
  formattedTime,
  elapsedPercent,
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
  const dashOffset = DIAL_CIRCUMFERENCE - (DIAL_CIRCUMFERENCE * elapsedPercent) / 100;

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
      <header className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-1.5 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onExitTimer}
            data-timer-exit="true"
            className={`h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0 ${controlPillClass}`}
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

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 화면 꺼짐 방지(Screen Wake Lock) 상태 표시 */}
          {isRunning && wakeLock.isLocked && (
            <span
              data-wakelock-status="active"
              title="타이머 실행 중 화면 꺼짐 방지 활성화됨"
              className={`h-9 px-2 sm:px-3 rounded-xl border text-[10.5px] sm:text-[11px] font-bold inline-flex items-center gap-1 sm:gap-1.5 ${
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
            className={`p-1 rounded-xl border inline-flex items-center gap-0.5 sm:gap-1 ${insetTrackClass}`}
          >
            <button
              type="button"
              data-theme-option="light"
              aria-pressed={!isDark}
              onClick={() => handleSelectTheme('light')}
              className={`h-7 px-2 sm:px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all ${
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
              className={`h-7 px-2 sm:px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all ${
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
              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs cursor-pointer transition-all active:scale-95 ${controlPillClass}`}
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          )}
        </div>
      </header>

      {/* 중앙 몰입형 타이머 & 설정 스테이지 */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-2 sm:py-3 flex flex-col items-center justify-center gap-3.5 sm:gap-5">
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

        {/* 뉴모피즘 대형 원형 다이얼 + 회전하는 베라 로고 */}
        <div
          className={`relative w-56 h-56 sm:w-68 sm:h-68 rounded-full border flex items-center justify-center transition-all duration-300 ${dialShellClass}`}
        >
          <svg
            viewBox="0 0 220 220"
            className="w-52 h-52 sm:w-64 sm:h-64 -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="110"
              cy="110"
              r={DIAL_RADIUS}
              fill="none"
              stroke={strokeTrackColor}
              strokeWidth="9"
            />
            <circle
              cx="110"
              cy="110"
              r={DIAL_RADIUS}
              fill="none"
              stroke={strokeProgressColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={DIAL_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            {/* 회전하는 베라(VeraNex) 로고 배지 */}
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border p-1 overflow-hidden flex items-center justify-center mb-1.5 ${logoBadgeClass}`}
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

            <span
              className={`text-[11px] font-black tracking-wider uppercase mb-0.5 ${
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

            <span
              data-timer-display="true"
              className={`text-4xl sm:text-5xl font-mono font-black tabular-nums tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-[#1E293B]'
              }`}
            >
              {formattedTime}
            </span>

            <span
              className={`text-[11px] font-semibold mt-1.5 ${
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
              isDisabled={isRunning}
              onChangeMinutes={onUpdateFocusMinutes}
            />
            <DurationCard
              title="휴식 시간"
              iconClass="fas fa-mug-hot"
              minutes={breakMinutes}
              presets={POMODORO_BREAK_PRESETS}
              accent="emerald"
              isDark={isDark}
              isDisabled={isRunning}
              onChangeMinutes={onUpdateBreakMinutes}
            />
          </div>

          <p
            className={`text-center text-[11px] font-medium h-4 ${
              isDark ? 'text-slate-400' : 'text-[#64748B]'
            }`}
          >
            {isRunning
              ? '타이머 실행 중에는 일시정지 후 시간을 변경할 수 있습니다.'
              : `설정값은 자동 저장되며 ${POMODORO_MIN_MINUTES}~${POMODORO_MAX_MINUTES}분까지 자유롭게 입력할 수 있습니다.`}
          </p>
        </div>
      </main>
    </section>
  );
}
