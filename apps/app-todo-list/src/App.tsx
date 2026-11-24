import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { type QuickRoutineStarter } from './constants/todoMeta';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useAuthSession } from './hooks/useAuthSession';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { usePortalMessenger } from './hooks/usePortalMessenger';
import { useTodos } from './hooks/useTodos';
import { useViewMode } from './hooks/useViewMode';
import type { MainTab, TodoDraftInput, WorkspaceView } from './types/todo';
import {
  formatTodayKoreanLabel,
  getLocalDateString,
  getOffsetDateString,
  isTodoForToday,
} from './utils/todoAnalytics';
import {
  createBackupJson,
  downloadTextFile,
  formatTodosAsMarkdown,
  formatTodosAsText,
} from './utils/todoExport';
import ConfettiBurst from './components/ConfettiBurst';
import ErrorBoundary from './components/ErrorBoundary';
import FaqSection from './components/FaqSection';
import Header from './components/Header';
import HowToGuide from './components/HowToGuide';
import LegalFooterModal, { type LegalDocType } from './components/LegalFooterModal';
import SplashScreen from './components/SplashScreen';
import TodoEmptyState from './components/TodoEmptyState';
import TodoFilterBar from './components/TodoFilterBar';
import TodoFocusTimerPanel from './components/TodoFocusTimerPanel';
import TodoItemCard from './components/TodoItemCard';
import TodoQuickAdd from './components/TodoQuickAdd';
import TodoReportPanel from './components/TodoReportPanel';
import TodoWorkspaceNav from './components/TodoWorkspaceNav';
import TrashDrawerModal from './components/TrashDrawerModal';

declare global {
  interface Document {
    parentKeyboardCallback?: ((key: string) => void) | null;
  }
}

export function App() {
  const { isStandalone } = useViewMode();
  const { sendToPortal } = usePortalMessenger();
  const { user, isAuthenticated, isCheckingAuth } = useAuthSession();
  const audio = useAudioFeedback();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<MainTab>('todo');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('todo');
  const [showTrashModal, setShowTrashModal] = useState<boolean>(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [toastState, setToastState] = useState<{
    readonly message: string;
    readonly showAllAction?: boolean;
    readonly showTimerAction?: boolean;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [localBannerDismissed, setLocalBannerDismissed] = useState<boolean>(false);

  const quickAddInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (
      message: string,
      options?: { readonly showAllAction?: boolean; readonly showTimerAction?: boolean }
    ) => {
      setToastState({
        message,
        showAllAction: options?.showAllAction,
        showTimerAction: options?.showTimerAction,
      });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      const hasAction = Boolean(options?.showAllAction || options?.showTimerAction);
      toastTimerRef.current = setTimeout(() => {
        setToastState(null);
        toastTimerRef.current = null;
      }, hasAction ? 4200 : 2600);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const {
    activeItems,
    filteredTodos,
    trashItems,
    stats,
    hiddenWorkdayCount,
    nonWorkdayReason,
    filter,
    setFilter,
    resetFilters,
    lastDeletedItem,
    storageWarning,
    isLoadingRemote,
    syncError,
    pendingLocalMigrationCount,
    migrateLocalToDb,
    dismissLocalMigration,
    addTodo,
    toggleTodo,
    updateTodo,
    softDeleteTodo,
    restoreTodo,
    undoLastDelete,
    dismissUndoToast,
    restoreAllTrash,
    softDeleteCompleted,
    moveTodoOrder,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    importBackupJson,
  } = useTodos({
    isAuthenticated,
    isCheckingAuth,
    userId: user?.id ?? null,
  });

  const pomodoro = usePomodoroTimer({
    onSessionComplete: (completedMode) => {
      audio.playTimerDone();
      if (completedMode === 'focus') {
        showToast('25분 집중 세션 완료! 5분간 가볍게 휴식하세요.');
        sendToPortal('POINTS_UPDATED');
      } else {
        showToast('5분 휴식 종료! 다음 집중을 시작해 보세요.');
      }
    },
  });

  const pinnedTodo = useMemo(
    () => activeItems.find((item) => item.id === pomodoro.pinnedTodoId) || null,
    [activeItems, pomodoro.pinnedTodoId]
  );

  const timerCandidateTodos = useMemo(() => {
    const todayStr = getLocalDateString();
    const todayPending = activeItems.filter((it) => !it.completed && isTodoForToday(it, todayStr));
    if (todayPending.length > 0) return todayPending.slice(0, 5);
    return activeItems.filter((it) => !it.completed).slice(0, 5);
  }, [activeItems]);

  const handleTogglePinTodo = useCallback(
    (id: string) => {
      const willPin = pomodoro.pinnedTodoId !== id;
      pomodoro.togglePinTodo(id);
      if (willPin) {
        showToast('집중타이머에 할 일을 고정했습니다.', { showTimerAction: true });
      }
    },
    [pomodoro, showToast]
  );

  // 포털 키보드·단축키 브릿지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'KEYBOARD_INPUT') {
        const key = event.data.key;
        if (typeof key === 'string' && typeof document.parentKeyboardCallback === 'function') {
          document.parentKeyboardCallback(key);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      try {
        window.parent.postMessage({ type: 'MINI_APP_READY' }, '*');
      } catch {
        // 무시
      }
    }, 50);

    const handleShortcutKey = (key: string, ctrlOrMeta: boolean, fromInput: boolean) => {
      if (key === 'Escape') {
        setShowTrashModal(false);
        setLegalDoc(null);
        return;
      }
      if (fromInput) return;

      if (key === '/' && activeTab === 'todo') {
        setWorkspaceView('todo');
        setTimeout(() => quickAddInputRef.current?.focus(), 20);
        return;
      }
      if (ctrlOrMeta && key.toLowerCase() === 'z') {
        if (undoLastDelete()) {
          showToast('방금 삭제한 할 일을 복구했습니다.');
        }
      }
    };

    const myCallback = (key: string) => handleShortcutKey(key, false, false);
    document.parentKeyboardCallback = myCallback;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName || '';
      const fromInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === '/' && !fromInput) {
        e.preventDefault();
      }
      handleShortcutKey(e.key, e.ctrlKey || e.metaKey, fromInput);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      if (document.parentKeyboardCallback === myCallback) {
        document.parentKeyboardCallback = null;
      }
    };
  }, [activeTab, showToast, undoLastDelete]);

  const handleAddTodo = useCallback(
    (draft: TodoDraftInput) => {
      const { added } = addTodo(draft);
      if (added) {
        audio.playAdd();
        const todayStr = getLocalDateString();
        const tomorrowStr = getOffsetDateString(1);
        const shortTitle = added.title.slice(0, 16);

        if (!isTodoForToday(added, todayStr)) {
          if (added.recurrence.type === 'workday') {
            const nextLabel = added.occurrence.nextOccurrenceDate
              ? added.occurrence.nextOccurrenceDate.slice(5).replace('-', '/')
              : '다음 영업일';
            showToast(
              `'${shortTitle}' (${added.occurrence.summaryLabel || '영업일 반복'}) 등록 완료 · 다음 영업일(${nextLabel}) 실행 예정`,
              { showAllAction: true }
            );
            return;
          }
          if (added.recurrence.type !== 'none') {
            const nextLabel = added.occurrence.nextOccurrenceDate
              ? added.occurrence.nextOccurrenceDate.slice(5).replace('-', '/')
              : '다음 주기';
            showToast(
              `'${shortTitle}' (${added.occurrence.summaryLabel}) 등록 완료 · ${nextLabel} 실행 예정`,
              { showAllAction: true }
            );
            return;
          }
          if (added.dueDate === tomorrowStr) {
            const dateLabel = added.dueDate.slice(5).replace('-', '/');
            showToast(`'${shortTitle}' 내일(${dateLabel}) 예정으로 등록됨`, {
              showAllAction: true,
            });
            return;
          }
          if (added.dueDate && added.dueDate > todayStr) {
            const dateLabel = added.dueDate.slice(5).replace('-', '/');
            showToast(`'${shortTitle}' ${dateLabel} 예정으로 등록됨`, {
              showAllAction: true,
            });
            return;
          }
          if (added.dueDate === null) {
            showToast(`'${shortTitle}' 기한없음으로 등록됨`, {
              showAllAction: true,
            });
            return;
          }
          const pastLabel = added.dueDate.slice(5).replace('-', '/');
          showToast(`'${shortTitle}' ${pastLabel} 마감으로 등록됨`, {
            showAllAction: true,
          });
          return;
        }

        const recSuffix = added.occurrence.summaryLabel
          ? ` (${added.occurrence.summaryLabel})`
          : '';
        showToast(`'${shortTitle}'${recSuffix} 추가됨`);
      }
    },
    [addTodo, audio, showToast]
  );

  const handleAddRoutine = useCallback(
    (routine: QuickRoutineStarter) => {
      const dueDate =
        routine.dueOffsetDays === null ? null : getOffsetDateString(routine.dueOffsetDays);
      handleAddTodo({
        title: routine.title,
        memo: routine.memo,
        priority: routine.priority,
        category: routine.category,
        dueDate,
        recurrence: routine.recurrence,
      });
    },
    [handleAddTodo]
  );

  const handleToggleTodo = useCallback(
    (id: string) => {
      const { completed, allCompletedNow } = toggleTodo(id);
      if (allCompletedNow) {
        audio.playFanfare();
        setShowConfetti(true);
        sendToPortal('MISSION_CLEAR');
        showToast('오늘의 모든 할 일을 100% 완료했습니다!');
      } else if (completed) {
        audio.playComplete();
      }
    },
    [audio, sendToPortal, showToast, toggleTodo]
  );

  const handleOpenLogin = useCallback(() => {
    const loginUrl = `${window.location.origin}/login?redirect=/mypage`;
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.location.href = loginUrl;
        window.opener.focus();
        return;
      } catch {
        // 크로스 오리진 폴백
      }
    }
    window.open(loginUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const handleMigrateLocal = useCallback(async () => {
    const res = await migrateLocalToDb();
    if (res.ok) {
      audio.playComplete();
      showToast(`로컬 할 일 ${res.count}건을 DB 계정에 안전하게 저장했습니다.`);
    }
  }, [audio, migrateLocalToDb, showToast]);

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '스마트 투두(TO-DO) 할일 정리 플래너 | VeraNex',
          text: '매일·매주·매월·매년 반복 루틴과 DB 동기화, 25분 집중 타이머를 지원하는 무료 할일 플래너',
          url: shareUrl,
        });
        return;
      } catch {
        // 사용자 공유 취소 무시
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('플래너 주소가 클립보드에 복사되었습니다.');
    } catch {
      showToast('클립보드 복사에 실패했습니다.');
    }
  }, [showToast]);

  const handleCopyReport = useCallback(async () => {
    const text = formatTodosAsText(activeItems, stats);
    try {
      await navigator.clipboard.writeText(text);
      showToast('오늘의 TO-DO 리포트를 클립보드에 복사했습니다.');
    } catch {
      showToast('리포트 복사에 실패했습니다.');
    }
  }, [activeItems, showToast, stats]);

  const handleDownloadMarkdown = useCallback(() => {
    const md = formatTodosAsMarkdown(activeItems, stats);
    downloadTextFile(md, `veranex-todo-${getLocalDateString()}.md`, 'text/markdown;charset=utf-8');
    showToast('마크다운(.md) 파일을 저장했습니다.');
  }, [activeItems, showToast, stats]);

  const handleDownloadText = useCallback(() => {
    const text = formatTodosAsText(activeItems, stats);
    downloadTextFile(text, `veranex-todo-${getLocalDateString()}.txt`, 'text/plain;charset=utf-8');
    showToast('텍스트(.txt) 파일을 저장했습니다.');
  }, [activeItems, showToast, stats]);

  const handleDownloadBackupJson = useCallback(() => {
    const json = createBackupJson(activeItems);
    downloadTextFile(
      json,
      `veranex-todo-backup-${getLocalDateString()}.json`,
      'application/json;charset=utf-8'
    );
    showToast('JSON 백업 파일을 다운로드했습니다.');
  }, [activeItems, showToast]);

  const handleImportBackupJson = useCallback(
    (raw: string) => {
      const result = importBackupJson(raw);
      if (result.ok) {
        audio.playComplete();
        showToast(`백업에서 ${result.count}건의 할 일을 안전하게 복원했습니다.`);
      } else {
        showToast('올바른 VeraNex TO-DO JSON 백업 파일이 아닙니다.');
      }
    },
    [audio, importBackupJson, showToast]
  );

  const hasSecondaryFilter =
    filter.category !== 'all' ||
    filter.priority !== 'all' ||
    filter.searchQuery.trim().length > 0;

  const isFiltered = filter.status !== 'today' || hasSecondaryFilter;

  const canReorder =
    filter.sortBy === 'manual' &&
    (filter.status === 'today' || filter.status === 'all') &&
    !hasSecondaryFilter;

  const isTodayAllDone = stats.todayTotalCount > 0 && stats.todayActiveCount === 0;
  const nonTodayTotalCount = Math.max(0, stats.totalCount - stats.todayTotalCount);

  return (
    <ErrorBoundary>
      <div
        className={`w-full min-h-screen bg-[#FAF8F5] text-[#24211D] flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white ${
          isStandalone ? 'md:py-4 md:px-4' : ''
        }`}
      >
        {/* 4초 불투명 웜 베이지 스플래시 */}
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        {/* 100% 올클리어 콘페티 축하 이펙트 */}
        <ConfettiBurst active={showConfetti} onComplete={() => setShowConfetti(false)} />

        {/* 메인 반응형 컨테이너: 모바일/팝업 450px ➔ 태블릿 3xl ➔ PC 5xl (단일 페이지 스크롤) */}
        <div
          className={`w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto flex-1 flex flex-col ${
            isStandalone
              ? 'md:bg-white md:border md:border-[#E5DDD0] md:rounded-3xl md:shadow-sm md:overflow-clip'
              : ''
          }`}
        >
          {/* Astryx 상단 헤더 + TabList */}
          <Header
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            onShare={handleShare}
            isAuthenticated={isAuthenticated}
            userName={user?.name}
          />

          {/* DB 이관 / 비회원 로그인 안내 Astryx Banner */}
          {!isCheckingAuth && isAuthenticated && pendingLocalMigrationCount > 0 && (
            <div className="px-3 pt-2 shrink-0">
              <Banner
                status="info"
                title={`이 브라우저의 할 일 ${pendingLocalMigrationCount}건을 DB에 저장할까요?`}
                description="계정에 저장하면 마이페이지와 모든 기기에서 동기화됩니다."
                isDismissable
                onDismiss={dismissLocalMigration}
                endContent={
                  <Button
                    label="DB로 저장"
                    variant="primary"
                    size="sm"
                    onClick={() => void handleMigrateLocal()}
                  />
                }
              />
            </div>
          )}

          {!isCheckingAuth && !isAuthenticated && !localBannerDismissed && (
            <div className="px-2.5 sm:px-4 pt-1.5 shrink-0">
              <div className="px-2.5 py-1 rounded-xl bg-indigo-50/85 border border-indigo-200/80 text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <i className="fas fa-circle-info text-indigo-600 text-[10px] shrink-0"></i>
                  <span className="font-bold text-indigo-950 truncate">
                    로컬 모드 · 로그인 시 DB 영구 저장
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenLogin}
                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-black cursor-pointer transition-colors"
                  >
                    로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalBannerDismissed(true)}
                    aria-label="로컬 모드 안내 닫기"
                    className="w-5 h-5 rounded-md text-indigo-500 hover:bg-indigo-100 hover:text-indigo-800 flex items-center justify-center cursor-pointer"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {syncError && (
            <div className="px-3 pt-2 shrink-0">
              <Banner status="warning" title="DB 동기화 지연 안내" description={syncError} isDismissable />
            </div>
          )}

          {storageWarning && (
            <div className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 shrink-0">
              브라우저 저장 공간이 제한되어 일부 변경 사항이 유지되지 않을 수 있습니다.
            </div>
          )}

          {/* 메인 워크스페이스 (3단 메뉴: TODO · 보고서 · 집중타이머) */}
          <main className="flex-1 p-2.5 sm:p-4 flex flex-col">
            {activeTab === 'todo' && (
              <div className="flex-1 flex flex-col gap-2.5 w-full md:max-w-2xl md:mx-auto">
                <TodoWorkspaceNav
                  activeView={workspaceView}
                  onChangeView={setWorkspaceView}
                  todayActiveCount={stats.todayActiveCount}
                  todayCompletionRate={stats.todayCompletionRate}
                  isTodayAllDone={isTodayAllDone}
                  pomodoroRunning={pomodoro.isRunning}
                  pomodoroTime={pomodoro.formattedTime}
                  pomodoroMode={pomodoro.mode}
                />

                {workspaceView === 'todo' && (
                  <section
                    aria-label="할 일 정리 워크스페이스"
                    className="flex-1 flex flex-col gap-2"
                  >
                    {/* 1. 슬림 1행 빠른 입력 + 펼침 반복 스케줄러 카드 */}
                    <TodoQuickAdd inputRef={quickAddInputRef} onAdd={handleAddTodo} />

                    {/* 2. 시그니처 화이트 통합 체크리스트 보드 */}
                    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[#E7E0D5] shadow-[0_2px_10px_rgba(36,33,29,0.04)] overflow-clip">
                      {/* 보드 상단 심플 헤더 + 얇은 가로 진행률 바 */}
                      <div className="px-3.5 pt-3 pb-2.5 border-b border-[#F1ECE3] bg-white space-y-2 shrink-0">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                            <h2 className="text-[15px] sm:text-base font-black text-[#1C1917] tracking-tight">
                              오늘의 할 일
                            </h2>
                            <span className="text-[11px] font-semibold text-[#8E8579]">
                              {formatTodayKoreanLabel()}
                            </span>
                          </div>
                          {isLoadingRemote && (
                            <span className="text-[10px] font-bold text-indigo-600">동기화 중...</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <svg
                            viewBox="0 0 100 4"
                            preserveAspectRatio="none"
                            className="flex-1 h-1.5 rounded-full overflow-hidden block"
                            aria-hidden="true"
                          >
                            <rect x="0" y="0" width="100" height="4" rx="2" fill="#EFEAE1" />
                            <rect
                              x="0"
                              y="0"
                              width={stats.todayCompletionRate}
                              height="4"
                              rx="2"
                              fill={isTodayAllDone ? '#059669' : '#4338CA'}
                            />
                          </svg>
                          <span
                            className={`text-[11px] font-bold tabular-nums shrink-0 ${
                              isTodayAllDone ? 'text-emerald-700' : 'text-[#6C655B]'
                            }`}
                          >
                            {isTodayAllDone
                              ? `오늘 100% 완료 (${stats.todayTotalCount}/${stats.todayTotalCount})`
                              : `${stats.todayCompletedCount}/${stats.todayTotalCount} 완료 (${stats.todayCompletionRate}%)`}
                          </span>
                        </div>
                      </div>

                      {/* 보드 통합 필터 · 정렬 · 검색 바 */}
                      <TodoFilterBar
                        filter={filter}
                        onChangeFilter={setFilter}
                        activeCount={stats.activeCount}
                        completedCount={stats.completedCount}
                        recurringCount={stats.recurringCount}
                        todayCount={stats.todayTotalCount}
                        totalCount={stats.totalCount}
                      />

                      {/* 메인 할 일 리스트 (단일 시트 + 얇은 구분선) */}
                      <div className="flex-1 min-h-[260px] md:min-h-[420px] bg-white">
                        {filter.status === 'today' && (nonTodayTotalCount > 0 || hiddenWorkdayCount > 0) && (
                          <div className="px-3 pt-2.5 pb-1">
                            <div className="px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-1.5 min-w-0 text-amber-900 font-bold">
                                <i className="fas fa-calendar-clock text-amber-600 text-[11px] shrink-0"></i>
                                <span className="truncate">
                                  {hiddenWorkdayCount > 0 && stats.upcomingCount === 0
                                    ? `${nonWorkdayReason ? `${nonWorkdayReason} 휴무 — ` : ''}영업일 반복 ${hiddenWorkdayCount}건은 다음 영업일에 자동 실행됩니다`
                                    : stats.upcomingCount > 0
                                      ? `내일 이후 예정 ${stats.upcomingCount}건${nonTodayTotalCount > stats.upcomingCount ? ` 포함 오늘 외 ${nonTodayTotalCount}건` : ''}이 등록되어 있습니다`
                                      : `오늘 외 할 일 ${nonTodayTotalCount}건이 전체 목록에 있습니다`}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFilter({ ...filter, status: 'all' })}
                                className="text-[10px] font-black text-indigo-700 hover:underline shrink-0 cursor-pointer"
                              >
                                전체 탭에서 보기 →
                              </button>
                            </div>
                          </div>
                        )}
                        {filter.status !== 'today' &&
                          filter.status !== 'recurring' &&
                          hiddenWorkdayCount > 0 && (
                            <div className="px-3 pt-2.5 pb-1">
                              <div className="px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between gap-2 text-[11px]">
                                <div className="flex items-center gap-1.5 min-w-0 text-amber-900 font-bold">
                                  <i className="fas fa-calendar-clock text-amber-600 text-[11px] shrink-0"></i>
                                  <span className="truncate">
                                    오늘은 {nonWorkdayReason ? `${nonWorkdayReason}(휴무)` : '비영업일'}입니다 · 영업일 반복 {hiddenWorkdayCount}건 다음 영업일 실행 대기 중
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFilter({ ...filter, status: 'today' })}
                                  className="text-[10px] font-black text-indigo-700 hover:underline shrink-0 cursor-pointer"
                                >
                                  오늘 할 일만 보기 →
                                </button>
                              </div>
                            </div>
                          )}
                        {filteredTodos.length > 0 ? (
                          <div className="divide-y divide-[#F1ECE3]">
                            {filteredTodos.map((item, idx) => {
                              const prevItem = idx > 0 ? filteredTodos[idx - 1] : null;
                              const nextItem =
                                idx < filteredTodos.length - 1 ? filteredTodos[idx + 1] : null;
                              const isFirstInGroup =
                                !prevItem ||
                                prevItem.completed !== item.completed ||
                                prevItem.priority !== item.priority;
                              const isLastInGroup =
                                !nextItem ||
                                nextItem.completed !== item.completed ||
                                nextItem.priority !== item.priority;
                              return (
                                <TodoItemCard
                                  key={item.id}
                                  item={item}
                                  isPinned={pomodoro.pinnedTodoId === item.id}
                                  isTodayView={filter.status === 'today'}
                                  canReorder={canReorder}
                                  isFirst={isFirstInGroup}
                                  isLast={isLastInGroup}
                                  onToggle={handleToggleTodo}
                                  onUpdate={updateTodo}
                                  onSoftDelete={softDeleteTodo}
                                  onMoveOrder={moveTodoOrder}
                                  onTogglePin={handleTogglePinTodo}
                                  onAddSubtask={addSubtask}
                                  onToggleSubtask={toggleSubtask}
                                  onRemoveSubtask={removeSubtask}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3">
                            <TodoEmptyState
                              isFiltered={isFiltered}
                              isTodayView={filter.status === 'today'}
                              hasSecondaryFilter={hasSecondaryFilter}
                              totalActiveCount={stats.totalCount}
                              upcomingCount={stats.upcomingCount}
                              onResetFilters={resetFilters}
                              onShowAll={() => setFilter((prev) => ({ ...prev, status: 'all' }))}
                              onAddRoutine={handleAddRoutine}
                            />
                          </div>
                        )}
                      </div>

                      {/* 슬림 보드 푸터 (1줄 휴지통 · 정리 · 복사 유틸 바) */}
                      <div className="px-3 py-2 border-t border-[#F1ECE3] bg-[#FCFBF9] flex items-center justify-between gap-1.5 shrink-0">
                        <Button
                          label={`휴지통 (${stats.trashCount})`}
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowTrashModal(true)}
                          icon={<i className="fas fa-box-archive text-amber-600 text-[9px]"></i>}
                        />

                        <div className="flex items-center gap-1.5">
                          {stats.completedCount > 0 && (
                            <Button
                              label="완료 정리"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                softDeleteCompleted();
                                showToast('완료된 1회성 할 일을 휴지통으로 정리했습니다.');
                              }}
                            />
                          )}
                          <Button
                            label="복사"
                            variant="secondary"
                            size="sm"
                            onClick={handleCopyReport}
                            icon={<i className="fas fa-copy text-[9px] text-indigo-600"></i>}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {workspaceView === 'report' && (
                  <TodoReportPanel
                    stats={stats}
                    isAuthenticated={isAuthenticated}
                    onCopyReport={handleCopyReport}
                    onDownloadMarkdown={handleDownloadMarkdown}
                    onDownloadText={handleDownloadText}
                    onDownloadBackupJson={handleDownloadBackupJson}
                    onImportBackupJson={handleImportBackupJson}
                  />
                )}

                {workspaceView === 'timer' && (
                  <TodoFocusTimerPanel
                    mode={pomodoro.mode}
                    formattedTime={pomodoro.formattedTime}
                    elapsedPercent={pomodoro.elapsedPercent}
                    isRunning={pomodoro.isRunning}
                    completedSessions={pomodoro.completedSessions}
                    pinnedTodo={pinnedTodo}
                    candidateTodos={timerCandidateTodos}
                    onToggleRun={pomodoro.toggleRun}
                    onReset={pomodoro.resetTimer}
                    onSwitchMode={pomodoro.switchMode}
                    onPinTodo={pomodoro.togglePinTodo}
                    onClearPin={pomodoro.clearPin}
                    onCompletePinned={handleToggleTodo}
                    onGoToTodo={() => setWorkspaceView('todo')}
                  />
                )}
              </div>
            )}

            {activeTab === 'howto' && <HowToGuide />}
            {activeTab === 'faq' && <FaqSection />}
          </main>

          {/* 하단 도킹 푸터 */}
          <footer className="px-3 sm:px-5 py-1.5 border-t border-[#E5DDD0] bg-white/90 text-[10px] text-[#6C655B] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="font-bold text-[#24211D]">© 2026 VeraNex. All rights reserved.</span>
            {isStandalone ? (
              <div className="flex items-center gap-2.5 font-bold">
                <button type="button" onClick={() => setLegalDoc('about')} className="hover:text-indigo-600 cursor-pointer">
                  서비스 소개
                </button>
                <button type="button" onClick={() => setLegalDoc('privacy')} className="hover:text-indigo-600 cursor-pointer">
                  개인정보처리방침
                </button>
                <button type="button" onClick={() => setLegalDoc('terms')} className="hover:text-indigo-600 cursor-pointer">
                  이용약관
                </button>
                <button type="button" onClick={() => setLegalDoc('contact')} className="hover:text-indigo-600 cursor-pointer">
                  고객 문의
                </button>
              </div>
            ) : (
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <i className="fas fa-database text-[9px]"></i>
                {isAuthenticated ? 'SQLite DB 저장 · 마이페이지 실시간 연동' : 'Astryx UI · 마이페이지 실시간 연동'}
              </span>
            )}
          </footer>
        </div>

        {/* 5초 Soft Delete 실행취소(Undo) 토스트 */}
        {lastDeletedItem && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#24211D] text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in max-w-[92vw]">
            <span className="truncate max-w-[190px]">
              &apos;{lastDeletedItem.title}&apos; 휴지통 이동
            </span>
            <button
              type="button"
              onClick={() => {
                undoLastDelete();
                showToast('삭제한 할 일을 복구했습니다.');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#24211D] text-[11px] font-black shrink-0 cursor-pointer"
            >
              실행취소
            </button>
            <button
              type="button"
              onClick={dismissUndoToast}
              aria-label="알림 닫기"
              className="text-stone-400 hover:text-white cursor-pointer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* 일반 피드백 토스트 */}
        {!lastDeletedItem && toastState && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#24211D] text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in max-w-[92vw]">
            <i className="fas fa-circle-check text-emerald-400 shrink-0"></i>
            <span className="truncate">{toastState.message}</span>
            {toastState.showAllAction && (
              <button
                type="button"
                onClick={() => {
                  setFilter((prev) => ({ ...prev, status: 'all' }));
                  setToastState(null);
                }}
                className="px-2 py-0.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-black shrink-0 cursor-pointer"
              >
                전체 보기
              </button>
            )}
            {toastState.showTimerAction && (
              <button
                type="button"
                onClick={() => {
                  setWorkspaceView('timer');
                  setToastState(null);
                }}
                className="px-2 py-0.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-black shrink-0 cursor-pointer"
              >
                타이머 보기
              </button>
            )}
          </div>
        )}

        {/* 휴지통 복구 Dialog */}
        <TrashDrawerModal
          isOpen={showTrashModal}
          trashItems={trashItems}
          onClose={() => setShowTrashModal(false)}
          onRestore={(id) => {
            restoreTodo(id);
            showToast('할 일을 복구했습니다.');
          }}
          onRestoreAll={() => {
            restoreAllTrash();
            setShowTrashModal(false);
            showToast('휴지통의 모든 할 일을 복구했습니다.');
          }}
        />

        {/* E-E-A-T 법적 문서 Dialog */}
        <LegalFooterModal docType={legalDoc} onClose={() => setLegalDoc(null)} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
