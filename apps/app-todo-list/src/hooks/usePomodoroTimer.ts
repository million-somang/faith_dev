import { useCallback, useEffect, useRef, useState } from 'react';
import { TODO_POMODORO_STATS_KEY } from '../constants/todoMeta';
import { safeStorage } from '../utils/safeStorage';

export type PomodoroMode = 'focus' | 'break';

const FOCUS_DURATION_SEC = 25 * 60;
const BREAK_DURATION_SEC = 5 * 60;

interface PomodoroHookOptions {
  readonly onSessionComplete?: (completedMode: PomodoroMode) => void;
}

export function usePomodoroTimer(options: PomodoroHookOptions = {}) {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(FOCUS_DURATION_SEC);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pinnedTodoId, setPinnedTodoId] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    const stored = safeStorage.get<number>(TODO_POMODORO_STATS_KEY, 0);
    return typeof stored === 'number' && Number.isFinite(stored) && stored >= 0 ? stored : 0;
  });

  const onCompleteRef = useRef(options.onSessionComplete);
  onCompleteRef.current = options.onSessionComplete;

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === 'focus') {
            setCompletedSessions((count) => {
              const next = count + 1;
              safeStorage.set(TODO_POMODORO_STATS_KEY, next);
              return next;
            });
          }
          onCompleteRef.current?.(mode);
          return mode === 'focus' ? BREAK_DURATION_SEC : FOCUS_DURATION_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode]);

  const toggleRun = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(mode === 'focus' ? FOCUS_DURATION_SEC : BREAK_DURATION_SEC);
  }, [mode]);

  const switchMode = useCallback((nextMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(nextMode === 'focus' ? FOCUS_DURATION_SEC : BREAK_DURATION_SEC);
  }, []);

  const togglePinTodo = useCallback((todoId: string) => {
    setPinnedTodoId((prev) => (prev === todoId ? null : todoId));
  }, []);

  const totalSeconds = mode === 'focus' ? FOCUS_DURATION_SEC : BREAK_DURATION_SEC;
  const elapsedPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100))
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
    toggleRun,
    resetTimer,
    switchMode,
    togglePinTodo,
    clearPin: () => setPinnedTodoId(null),
  };
}
