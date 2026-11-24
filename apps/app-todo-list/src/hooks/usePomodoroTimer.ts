import { useCallback, useEffect, useRef, useState } from 'react';
import {
  POMODORO_DEFAULT_BREAK_MINUTES,
  POMODORO_DEFAULT_FOCUS_MINUTES,
  POMODORO_MAX_MINUTES,
  POMODORO_MIN_MINUTES,
  TODO_POMODORO_SETTINGS_KEY,
  TODO_POMODORO_STATS_KEY,
} from '../constants/todoMeta';
import { safeStorage } from '../utils/safeStorage';

export type PomodoroMode = 'focus' | 'break';
export type PomodoroTheme = 'light' | 'dark';

export interface PomodoroSettings {
  readonly focusMinutes: number;
  readonly breakMinutes: number;
}

interface PomodoroHookOptions {
  readonly onSessionComplete?: (
    completedMode: PomodoroMode,
    settings: PomodoroSettings
  ) => void;
}

function clampMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(POMODORO_MAX_MINUTES, Math.max(POMODORO_MIN_MINUTES, rounded));
}

function loadStoredSettings(): PomodoroSettings {
  const stored = safeStorage.get<Partial<PomodoroSettings> | null>(
    TODO_POMODORO_SETTINGS_KEY,
    null
  );
  if (!stored || typeof stored !== 'object') {
    return {
      focusMinutes: POMODORO_DEFAULT_FOCUS_MINUTES,
      breakMinutes: POMODORO_DEFAULT_BREAK_MINUTES,
    };
  }
  return {
    focusMinutes: clampMinutes(
      typeof stored.focusMinutes === 'number'
        ? stored.focusMinutes
        : POMODORO_DEFAULT_FOCUS_MINUTES,
      POMODORO_DEFAULT_FOCUS_MINUTES
    ),
    breakMinutes: clampMinutes(
      typeof stored.breakMinutes === 'number'
        ? stored.breakMinutes
        : POMODORO_DEFAULT_BREAK_MINUTES,
      POMODORO_DEFAULT_BREAK_MINUTES
    ),
  };
}

export function usePomodoroTimer(options: PomodoroHookOptions = {}) {
  const [settings, setSettings] = useState<PomodoroSettings>(() => loadStoredSettings());
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(() => settings.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pinnedTodoId, setPinnedTodoId] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    const stored = safeStorage.get<number>(TODO_POMODORO_STATS_KEY, 0);
    return typeof stored === 'number' && Number.isFinite(stored) && stored >= 0 ? stored : 0;
  });

  const onCompleteRef = useRef(options.onSessionComplete);
  onCompleteRef.current = options.onSessionComplete;

  const settingsRef = useRef<PomodoroSettings>(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || secondsLeft > 0) return;

    const completedMode = mode;
    const nextMode: PomodoroMode = completedMode === 'focus' ? 'break' : 'focus';
    const currentSettings = settingsRef.current;

    setIsRunning(false);
    if (completedMode === 'focus') {
      setCompletedSessions((count) => {
        const next = count + 1;
        safeStorage.set(TODO_POMODORO_STATS_KEY, next);
        return next;
      });
    }
    setMode(nextMode);
    setSecondsLeft(
      (nextMode === 'focus' ? currentSettings.focusMinutes : currentSettings.breakMinutes) * 60
    );
    onCompleteRef.current?.(completedMode, currentSettings);
  }, [isRunning, secondsLeft, mode]);

  const toggleRun = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    const currentSettings = settingsRef.current;
    setSecondsLeft(
      (mode === 'focus' ? currentSettings.focusMinutes : currentSettings.breakMinutes) * 60
    );
  }, [mode]);

  const switchMode = useCallback((nextMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(nextMode);
    const currentSettings = settingsRef.current;
    setSecondsLeft(
      (nextMode === 'focus' ? currentSettings.focusMinutes : currentSettings.breakMinutes) * 60
    );
  }, []);

  const updateFocusMinutes = useCallback(
    (minutes: number) => {
      if (isRunning) return;
      const clamped = clampMinutes(minutes, settingsRef.current.focusMinutes);
      const next: PomodoroSettings = {
        ...settingsRef.current,
        focusMinutes: clamped,
      };
      settingsRef.current = next;
      setSettings(next);
      safeStorage.set(TODO_POMODORO_SETTINGS_KEY, next);
      if (mode === 'focus') {
        setSecondsLeft(clamped * 60);
      }
    },
    [isRunning, mode]
  );

  const updateBreakMinutes = useCallback(
    (minutes: number) => {
      if (isRunning) return;
      const clamped = clampMinutes(minutes, settingsRef.current.breakMinutes);
      const next: PomodoroSettings = {
        ...settingsRef.current,
        breakMinutes: clamped,
      };
      settingsRef.current = next;
      setSettings(next);
      safeStorage.set(TODO_POMODORO_SETTINGS_KEY, next);
      if (mode === 'break') {
        setSecondsLeft(clamped * 60);
      }
    },
    [isRunning, mode]
  );

  const togglePinTodo = useCallback((todoId: string) => {
    setPinnedTodoId((prev) => (prev === todoId ? null : todoId));
  }, []);

  const totalSeconds =
    (mode === 'focus' ? settings.focusMinutes : settings.breakMinutes) * 60;
  const elapsedPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalSeconds - secondsLeft) / Math.max(1, totalSeconds)) * 100))
  );

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes < 10 ? `0${minutes}` : minutes}:${
    seconds < 10 ? `0${seconds}` : seconds
  }`;

  return {
    mode,
    secondsLeft,
    formattedTime,
    elapsedPercent,
    isRunning,
    pinnedTodoId,
    completedSessions,
    focusMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
    toggleRun,
    resetTimer,
    switchMode,
    updateFocusMinutes,
    updateBreakMinutes,
    togglePinTodo,
    clearPin: () => setPinnedTodoId(null),
  };
}
