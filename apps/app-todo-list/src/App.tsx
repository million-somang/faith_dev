import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePortalMessenger } from '@faithportal/mini-app-sdk';
import { type QuickRoutineStarter } from './constants/todoMeta';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { useTodos } from './hooks/useTodos';
import { useViewMode } from './hooks/useViewMode';
import type { MainTab, MobileViewMode, TodoDraftInput } from './types/todo';
import { formatTodayKoreanLabel, getLocalDateString, getOffsetDateString } from './utils/todoAnalytics';
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
import TodoItemCard from './components/TodoItemCard';
import TodoQuickAdd from './components/TodoQuickAdd';
import TodoReportPanel from './components/TodoReportPanel';
import TrashDrawerModal from './components/TrashDrawerModal';

declare global {
  interface Document {
    parentKeyboardCallback?: ((key: string) => void) | null;
  }
}

export function App() {
  const { isStandalone } = useViewMode();
  const { sendToPortal } = usePortalMessenger();
  const audio = useAudioFeedback();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<MainTab>('todo');
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>('board');
  const [showTrashModal, setShowTrashModal] = useState<boolean>(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const quickAddInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    activeItems,
    filteredTodos,
    trashItems,
    stats,
    filter,
    setFilter,
    resetFilters,
    lastDeletedItem,
    storageWarning,
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
  } = useTodos();

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const pomodoro = usePomodoroTimer({
    onSessionComplete: (completedMode) => {
      audio.playTimerDone();
      showToast(
        completedMode === 'focus'
          ? '25분 집중 세션 완료! 5분 휴식을 취해 보세요.'
          : '휴식 시간 종료! 다음 집중을 시작할 수 있습니다.'
      );
    },
  });

  const pinnedTodo = useMemo(
    () => activeItems.find((item) => item.id === pomodoro.pinnedTodoId) || null,
    [activeItems, pomodoro.pinnedTodoId]
  );

  // 모달 iframe 물리 키보드 릴레이 (MINI_APP_MODAL_SEO_GUIDE.md 표준)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'object' && (e.data as { type?: string }).type === 'PARENT_KEYBOARD_EVENT') {
        const key = (e.data as { key?: unknown }).key;
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
        setMobileViewMode('board');
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
        showToast(`'${added.title.slice(0, 18)}' 할 일이 추가되었습니다.`);
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
        showToast('모든 할 일을 100% 완료했습니다!');
      } else if (completed) {
        audio.playComplete();
      }
    },
    [audio, sendToPortal, showToast, toggleTodo]
  );

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '스마트 투두(TO-DO) 할일 정리 플래너 | VeraNex',
          text: '우선순위·마감 D-Day·집중 타이머·달성률 리포트까지 한 번에 정리하는 무료 할일 플래너',
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

  const isFiltered =
    filter.status !== 'all' ||
    filter.category !== 'all' ||
    filter.priority !== 'all' ||
    filter.searchQuery.trim().length > 0;

  const canReorder = filter.sortBy === 'manual' && !isFiltered;

  // 미니 원형 링 게이지 계산 (반지름 8, 둘레 50.26)
  const miniRingCircumference = 2 * Math.PI * 8;
  const miniRingOffset =
    miniRingCircumference - (miniRingCircumference * stats.completionRate) / 100;

  return (
    <ErrorBoundary>
      <div
        className={`w-full bg-[#FAF8F5] text-[#2D2A26] flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white ${
          isStandalone
            ? 'min-h-screen md:py-4 md:px-4'
            : 'h-screen max-h-[850px] overflow-hidden'
        }`}
      >
        {/* 4초 불투명 웜 베이지 스플래시 */}
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        {/* 100% 올클리어 콘페티 축하 이펙트 */}
        <ConfettiBurst active={showConfetti} onComplete={() => setShowConfetti(false)} />

        {/* 메인 반응형 컨테이너: 모바일 450px Zero-Scroll ➔ 태블릿 3xl ➔ PC 5xl */}
        <div
          className={`w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto flex-1 flex flex-col min-h-0 ${
            isStandalone
              ? 'md:bg-white md:border md:border-[#EBE6DD] md:rounded-3xl md:shadow-sm md:overflow-hidden'
              : 'h-full overflow-hidden'
          }`}
        >
          {/* 상단 통합 헤더 + 3단 알약 탭 */}
          <Header activeTab={activeTab} onChangeTab={setActiveTab} onShare={handleShare} />

          {/* 로컬 스토리지 제한 경고 */}
          {storageWarning && (
            <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 shrink-0">
              브라우저 저장 공간이 제한되어 일부 변경 사항이 유지되지 않을 수 있습니다. JSON 백업을 권장합니다.
            </div>
          )}

          {/* 메인 워크스페이스 */}
          <main
            className={`flex-1 min-h-0 p-3 sm:p-4 flex flex-col ${
              activeTab === 'todo' && mobileViewMode === 'board'
                ? 'overflow-hidden md:overflow-y-auto'
                : 'overflow-y-auto custom-scrollbar'
            }`}
          >
            {activeTab === 'todo' && (
              <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-12 md:gap-5">
                {/* 좌측 컬럼 (모바일 1열 전체 / PC 7컬럼): 상태바 + 빠른 입력 + 필터 + 가변 할일 리스트 + 하단 메트릭 툴바 */}
                <section
                  aria-label="할 일 정리 워크스페이스"
                  className={`flex-1 min-h-0 flex flex-col gap-2.5 md:col-span-7 ${
                    mobileViewMode === 'report' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  {/* 1. 원라인 통합 상태 바 */}
                  <div className="bg-white rounded-2xl px-3 py-2 border border-[#EBE6DD] shadow-2xs flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg viewBox="0 0 22 22" className="w-6 h-6 -rotate-90 shrink-0" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" fill="none" stroke="#EBE6DD" strokeWidth="3" />
                        <circle
                          cx="11"
                          cy="11"
                          r="8"
                          fill="none"
                          stroke="#4F46E5"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={miniRingCircumference}
                          strokeDashoffset={miniRingOffset}
                        />
                      </svg>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-[#2D2A26] truncate">
                          {formatTodayKoreanLabel()}
                        </div>
                        <div className="text-[10px] font-bold text-[#7A7369]">
                          완료 <strong className="text-indigo-700">{stats.completedCount}</strong> / {stats.totalCount}건 ({stats.completionRate}%)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {pomodoro.isRunning && (
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[10px] font-mono font-black text-indigo-700 animate-pulse-ring">
                          <i className="fas fa-stopwatch mr-1"></i>
                          {pomodoro.formattedTime}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setMobileViewMode('report')}
                        data-screenshot-click="result"
                        className="md:hidden px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[11px] font-black shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <i className="fas fa-chart-pie text-[10px]"></i>
                        <span>오늘 리포트</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. 1초 빠른 할일 입력 카드 */}
                  <TodoQuickAdd inputRef={quickAddInputRef} onAdd={handleAddTodo} />

                  {/* 3. 필터 · 정렬 · 검색 원라인 바 */}
                  <TodoFilterBar
                    filter={filter}
                    onChangeFilter={setFilter}
                    activeCount={stats.activeCount}
                    completedCount={stats.completedCount}
                    todayCount={stats.todayDueCount}
                    totalCount={stats.totalCount}
                  />

                  {/* 4. 가변 할 일 리스트 (flex-1 min-h-0 내부 스크롤 격리 -> 외부 밀림 0px!) */}
                  <div className="flex-1 min-h-[140px] md:min-h-[300px] md:max-h-[460px] overflow-y-auto custom-scrollbar pr-0.5 space-y-2">
                    {filteredTodos.length > 0 ? (
                      filteredTodos.map((item, idx) => (
                        <TodoItemCard
                          key={item.id}
                          item={item}
                          isPinned={pomodoro.pinnedTodoId === item.id}
                          canReorder={canReorder}
                          isFirst={idx === 0}
                          isLast={idx === filteredTodos.length - 1}
                          onToggle={handleToggleTodo}
                          onUpdate={updateTodo}
                          onSoftDelete={softDeleteTodo}
                          onMoveOrder={moveTodoOrder}
                          onTogglePin={pomodoro.togglePinTodo}
                          onAddSubtask={addSubtask}
                          onToggleSubtask={toggleSubtask}
                          onRemoveSubtask={removeSubtask}
                        />
                      ))
                    ) : (
                      <TodoEmptyState
                        isFiltered={isFiltered}
                        onResetFilters={resetFilters}
                        onAddRoutine={handleAddRoutine}
                      />
                    )}
                  </div>

                  {/* 5. 하단 실시간 메트릭 & 휴지통/정리 액션 바 */}
                  <div className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs space-y-2 shrink-0">
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="bg-[#FAF8F5] border border-[#F0EBE2] rounded-xl py-1 px-1">
                        <span className="block text-[9px] font-bold text-[#7A7369]">진행중</span>
                        <span className="text-[11px] font-mono font-black text-indigo-700">
                          {stats.activeCount}건
                        </span>
                      </div>
                      <div className="bg-[#FAF8F5] border border-[#F0EBE2] rounded-xl py-1 px-1">
                        <span className="block text-[9px] font-bold text-[#7A7369]">오늘마감</span>
                        <span className="text-[11px] font-mono font-black text-[#2D2A26]">
                          {stats.todayDueCount}건
                        </span>
                      </div>
                      <div className="bg-[#FAF8F5] border border-[#F0EBE2] rounded-xl py-1 px-1">
                        <span className="block text-[9px] font-bold text-[#7A7369]">지연</span>
                        <span
                          className={`text-[11px] font-mono font-black ${
                            stats.overdueCount > 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {stats.overdueCount}건
                        </span>
                      </div>
                      <div className="bg-[#FAF8F5] border border-[#F0EBE2] rounded-xl py-1 px-1">
                        <span className="block text-[9px] font-bold text-[#7A7369]">달성률</span>
                        <span className="text-[11px] font-mono font-black text-emerald-700">
                          {stats.completionRate}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#F0EBE2] text-[10px]">
                      <button
                        type="button"
                        onClick={() => setShowTrashModal(true)}
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#EBE6DD] font-bold text-[#57514A] flex items-center gap-1 cursor-pointer"
                      >
                        <i className="fas fa-box-archive text-amber-600 text-[9px]"></i>
                        <span>휴지통 ({stats.trashCount})</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {stats.completedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              softDeleteCompleted();
                              showToast('완료된 할 일을 휴지통으로 정리했습니다.');
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-rose-700 cursor-pointer"
                          >
                            완료 정리
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyReport}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-black text-indigo-700 cursor-pointer flex items-center gap-1"
                        >
                          <i className="fas fa-copy text-[9px]"></i>
                          <span>복사</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 우측 컬럼 (모바일 리포트 모드 시 전체 / PC 5컬럼 상시 노출) */}
                <div
                  className={`md:col-span-5 ${
                    mobileViewMode === 'report' ? 'block' : 'hidden md:block'
                  }`}
                >
                  <TodoReportPanel
                    stats={stats}
                    pinnedTodo={pinnedTodo}
                    pomodoroMode={pomodoro.mode}
                    pomodoroTime={pomodoro.formattedTime}
                    pomodoroPercent={pomodoro.elapsedPercent}
                    pomodoroRunning={pomodoro.isRunning}
                    pomodoroSessions={pomodoro.completedSessions}
                    onTogglePomodoroRun={pomodoro.toggleRun}
                    onResetPomodoro={pomodoro.resetTimer}
                    onSwitchPomodoroMode={pomodoro.switchMode}
                    onClearPin={pomodoro.clearPin}
                    onCompletePinned={handleToggleTodo}
                    onCopyReport={handleCopyReport}
                    onDownloadMarkdown={handleDownloadMarkdown}
                    onDownloadText={handleDownloadText}
                    onDownloadBackupJson={handleDownloadBackupJson}
                    onImportBackupJson={handleImportBackupJson}
                    onBackToBoard={() => setMobileViewMode('board')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'howto' && <HowToGuide />}
            {activeTab === 'faq' && <FaqSection />}
          </main>

          {/* 하단 도킹 푸터 (독립 도메인 시 E-E-A-T 4대 페이지 모달 링크 포함) */}
          <footer className="px-3 sm:px-5 py-2 border-t border-[#EBE6DD] bg-white/90 text-[10px] text-[#7A7369] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="font-bold text-[#2D2A26]">
              © 2026 VeraNex. All rights reserved.
            </span>
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
                <i className="fas fa-shield-halved text-[9px]"></i>
                100% 로컬 저장 · 마이페이지 실시간 연동
              </span>
            )}
          </footer>
        </div>

        {/* 5초 Soft Delete 실행취소(Undo) 토스트 */}
        {lastDeletedItem && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#2D2A26] text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in max-w-[92vw]">
            <span className="truncate max-w-[190px]">
              &apos;{lastDeletedItem.title}&apos; 휴지통 이동
            </span>
            <button
              type="button"
              onClick={() => {
                undoLastDelete();
                showToast('삭제한 할 일을 복구했습니다.');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#2D2A26] text-[11px] font-black shrink-0 cursor-pointer"
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
        {!lastDeletedItem && toastMessage && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#2D2A26] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in max-w-[92vw]">
            <i className="fas fa-circle-check text-emerald-400 shrink-0"></i>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* 휴지통 복구 모달 */}
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

        {/* E-E-A-T 법적 문서 모달 */}
        <LegalFooterModal docType={legalDoc} onClose={() => setLegalDoc(null)} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
