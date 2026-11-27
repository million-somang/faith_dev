'use client';

import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import {
  getTodayLocalDateStr,
  type LocalTodoCategory,
  type LocalTodoPriority,
} from '@/hooks/useLocalTodos';
import {
  usePortalTodos,
  type PortalRecurrenceType,
} from '@/hooks/usePortalTodos';

interface MypageTodoCardProps {
  readonly variant?: 'full' | 'compact';
}

const PRIORITY_BADGE: Record<
  LocalTodoPriority,
  { readonly label: string; readonly dot: string; readonly badge: string; readonly chip: string }
> = {
  urgent: {
    label: '긴급',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    chip: 'bg-rose-600 text-white border-rose-600',
  },
  important: {
    label: '중요',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    chip: 'bg-amber-500 text-white border-amber-500',
  },
  normal: {
    label: '보통',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    chip: 'bg-indigo-600 text-white border-indigo-600',
  },
};

const RECURRENCE_PILLS: readonly { readonly key: PortalRecurrenceType; readonly label: string }[] = [
  { key: 'none', label: '1회' },
  { key: 'daily', label: '매일' },
  { key: 'workday', label: '영업일' },
  { key: 'weekly', label: '매주' },
  { key: 'monthly', label: '매월' },
  { key: 'yearly', label: '매년' },
];

const CATEGORY_LABEL: Record<LocalTodoCategory, string> = {
  work: '업무',
  personal: '개인',
  shopping: '쇼핑',
  health: '건강',
  study: '공부',
};

function getCompactDueLabel(
  dueDate: string | null,
  completed: boolean,
  todayStr: string
): {
  text: string;
  isOverdue: boolean;
} | null {
  if (!dueDate) return null;
  if (completed) {
    return { text: dueDate.slice(5).replace('-', '/'), isOverdue: false };
  }
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = dueDate.split('-').map(Number);
  const diff = Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ty, tm - 1, td)) / 86_400_000);
  if (diff < 0) return { text: `${Math.abs(diff)}일 지연`, isOverdue: true };
  if (diff === 0) return { text: '오늘 마감', isOverdue: false };
  if (diff === 1) return { text: '내일', isOverdue: false };
  return { text: `D-${diff}`, isOverdue: false };
}

export function MypageTodoCard({ variant = 'full' }: MypageTodoCardProps) {
  const { launchApp } = useAppLauncher();
  const {
    source,
    hydrated,
    todos,
    todayTodos,
    nonTodayCount,
    stats,
    hiddenWorkdayCount,
    nonWorkdayReason,
    lastDeleted,
    pendingLocalCount,
    addQuickTodo,
    toggleTodo,
    softDeleteTodo,
    undoSoftDelete,
    migrateLocalToDb,
  } = usePortalTodos();

  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickOptionsOpen, setQuickOptionsOpen] = useState<boolean>(false);
  const [quickPriority, setQuickPriority] = useState<LocalTodoPriority>('important');
  const [quickRecurrence, setQuickRecurrence] = useState<PortalRecurrenceType>('none');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [showAllScope, setShowAllScope] = useState<boolean>(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const todayStr = getTodayLocalDateStr();
  const maxVisible = variant === 'compact' ? 4 : 6;
  const scopedTodos = showAllScope ? todos : todayTodos;
  const scopedActiveCount = showAllScope ? stats.activeCount : stats.todayActiveCount;
  const scopedCompletedCount = showAllScope ? stats.completedCount : stats.todayCompletedCount;
  const isTodayAllDone = stats.todayCompletionRate === 100 && stats.todayTotalCount > 0;
  const selectedPri = PRIORITY_BADGE[quickPriority];
  const selectedRecLabel =
    RECURRENCE_PILLS.find((r) => r.key === quickRecurrence)?.label ?? '1회';

  const visibleList = scopedTodos
    .filter((item) => (showCompleted ? true : !item.completed))
    .slice(0, maxVisible);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    addQuickTodo(trimmed, quickPriority, true, quickRecurrence);
    setQuickTitle('');
    if (quickRecurrence === 'workday' && nonWorkdayReason) {
      setShowAllScope(true);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      setQuickNotice(
        `'${trimmed.slice(0, 18)}' 영업일 반복 등록 완료 — ${nonWorkdayReason} 휴무 후 다음 영업일에 자동 실행됩니다.`
      );
      noticeTimerRef.current = setTimeout(() => {
        setQuickNotice(null);
      }, 4500);
    }
  };

  return (
    <section
      aria-label="마이페이지 TO-DO 할일 보드"
      className="bg-[#FAF8F5] rounded-3xl border border-[#E5DDD0] shadow-sm p-5 sm:p-6 space-y-4"
    >
      {/* 상단 Astryx Warm Stone 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3D7] pb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <i className="fas fa-list-check text-base"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#24211D] tracking-tight">
                나의 TO-DO (할일 정리)
              </h2>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                  source === 'db'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    source === 'db' ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                ></span>
                {source === 'db' ? 'DB 영구 저장' : '로컬 임시 모드'}
              </span>
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border tabular-nums ${
                  isTodayAllDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                오늘 완료 {stats.todayCompletedCount} / {stats.todayTotalCount}건 · {stats.todayCompletionRate}%
              </span>
              {stats.recurringCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-[#E5DDD0]">
                  🔁 반복 {stats.recurringCount}건
                </span>
              )}
              {stats.overdueCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  지연 {stats.overdueCount}건
                </span>
              )}
            </div>
            <p className="text-xs text-[#6C655B] mt-0.5">
              매일·매주·매월·매년 반복 루틴과 새 창 플래너 팝업이 DB로 실시간 동기화됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/tools/todo-list"
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F2EDE4] border border-[#E5DDD0] text-[#4D473F] text-xs font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <i className="fas fa-book-open text-[10px]"></i>
            <span>사용 가이드</span>
          </Link>
          <button
            type="button"
            onClick={() => launchApp('/app/todo-list/', 'todo-list')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <i className="fas fa-up-right-from-square text-[10px]"></i>
            <span>전체 플래너 열기 (새 창)</span>
          </button>
        </div>
      </div>

      {/* 기존 로컬 할 일 1클릭 DB 이관 배너 */}
      {source === 'db' && pendingLocalCount > 0 && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-200 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-950">
            이 브라우저에 임시 저장되어 있던 할 일 {pendingLocalCount}건이 있습니다. 계정 DB에 저장할까요?
          </span>
          <button
            type="button"
            onClick={() => void migrateLocalToDb()}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shrink-0 cursor-pointer"
          >
            내 계정에 저장하기
          </button>
        </div>
      )}

      {/* SVG 달성률 프로그레스 바 (오늘 할 일 기준) */}
      <div className="space-y-1">
        <svg
          viewBox="0 0 100 4"
          preserveAspectRatio="none"
          className="w-full h-2 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={stats.todayCompletionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="오늘 할 일 달성률"
        >
          <rect x="0" y="0" width="100" height="4" rx="2" fill="#E5DDD0" />
          <rect
            x="0"
            y="0"
            width={stats.todayCompletionRate}
            height="4"
            rx="2"
            fill={isTodayAllDone ? '#047857' : '#4338CA'}
          />
        </svg>
      </div>

      {/* Astryx Warm Stone 슬림 1줄 빠른 추가 폼 (옵션 클릭 시 우선순위 + 반복 주기 펼침) */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#E5DDD0] p-2.5 space-y-2"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            maxLength={160}
            placeholder="오늘 할 일 또는 반복 루틴을 입력하고 Enter..."
            aria-label="마이페이지 빠른 할 일 입력"
            className="flex-1 min-w-0 h-[38px] px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] focus:bg-white focus:border-indigo-500 text-[13px] font-bold text-[#1C1917] placeholder-[#8E8579] outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setQuickOptionsOpen((prev) => !prev)}
            aria-expanded={quickOptionsOpen}
            aria-label="우선순위 및 반복 설정 펼치기"
            className={`h-[38px] px-2.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              quickOptionsOpen || quickRecurrence !== 'none'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                : 'bg-[#FAF8F5] border-[#E5DDD0] text-[#4D473F] hover:bg-[#F2EDE4]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedPri.dot}`}></span>
            <span>{selectedPri.label}</span>
            <span className="hidden sm:inline text-[#6C655B]">· {selectedRecLabel}</span>
            <i
              className={`fas fa-chevron-down text-[9px] text-[#8E8579] transition-transform ${
                quickOptionsOpen ? 'rotate-180' : ''
              }`}
            ></i>
          </button>
          <button
            type="submit"
            className="h-[38px] px-3.5 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shrink-0 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
          >
            <i className="fas fa-plus text-[10px]"></i>
            <span>추가</span>
          </button>
        </div>

        {quickOptionsOpen && (
          <div className="pt-2 border-t border-[#EFE8DC] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {(['urgent', 'important', 'normal'] as const).map((priKey) => {
                const meta = PRIORITY_BADGE[priKey];
                const active = quickPriority === priKey;
                return (
                  <button
                    key={priKey}
                    type="button"
                    onClick={() => setQuickPriority(priKey)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                      active
                        ? meta.chip
                        : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0] hover:bg-[#F2EDE4]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : meta.dot}`}></span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5DDD0]">
              <span className="text-[10px] font-black text-[#6C655B] px-1.5 flex items-center gap-1">
                <i className="fas fa-repeat text-indigo-600 text-[9px]"></i>
                반복
              </span>
              {RECURRENCE_PILLS.map((rec) => {
                const active = quickRecurrence === rec.key;
                return (
                  <button
                    key={rec.key}
                    type="button"
                    onClick={() => setQuickRecurrence(rec.key)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      active
                        ? 'bg-[#24211D] text-white shadow-sm'
                        : 'text-[#6C655B] hover:text-[#24211D]'
                    }`}
                  >
                    {rec.label}
                  </button>
                );
              })}
              {quickRecurrence === 'workday' && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-800">
                  {nonWorkdayReason
                    ? `오늘(${nonWorkdayReason}) 등록 가능 · 다음 영업일 실행`
                    : '토·일·공휴일 자동 제외'}
                </span>
              )}
            </div>
          </div>
        )}

        {quickNotice && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
            <i className="fas fa-circle-check text-emerald-600 text-xs shrink-0"></i>
            <span>{quickNotice}</span>
          </div>
        )}
      </form>

      {/* 시그니처 화이트 할 일 리스트 보드 */}
      <div className="bg-white rounded-2xl border-2 border-[#D9CEBC] shadow-[0_4px_16px_rgba(36,33,29,0.06)] overflow-hidden">
        <div className="px-3.5 sm:px-4 py-2.5 border-b border-[#EFE8DC] bg-gradient-to-r from-indigo-50/60 via-white to-white flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-black text-[#1C1917] tracking-tight">
              {showAllScope ? '전체 할 일' : '오늘의 할 일'}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-white text-[10px] font-black tabular-nums ${
                !showAllScope && isTodayAllDone ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              {!showAllScope && isTodayAllDone ? '오늘 100% 완료' : `진행중 ${scopedActiveCount}건`}
            </span>
            <span className="text-[11px] font-bold text-[#6C655B]">
              완료 {scopedCompletedCount}건
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {scopedCompletedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowCompleted((prev) => !prev)}
                className="font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                {showCompleted
                  ? '진행 중인 할 일만 보기'
                  : `완료된 항목 ${scopedCompletedCount}건 함께 보기`}
              </button>
            )}
            {scopedTodos.length > maxVisible && (
              <button
                type="button"
                onClick={() => launchApp('/app/todo-list/', 'todo-list')}
                className="font-bold text-[#6C655B] hover:text-indigo-600 cursor-pointer"
              >
                +{scopedTodos.length - maxVisible}건 더 보기 →
              </button>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 bg-[#FAF8F5]/45 space-y-2.5">
          {hydrated && (nonTodayCount > 0 || hiddenWorkdayCount > 0) && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 text-amber-900 font-bold">
                <i className="fas fa-calendar-clock text-amber-600 text-[11px] shrink-0"></i>
                <span className="truncate">
                  {hiddenWorkdayCount > 0 && nonWorkdayReason
                    ? `${nonWorkdayReason} 휴무 영업일 대기 ${hiddenWorkdayCount}건 포함 · 오늘 외 할 일 ${nonTodayCount}건`
                    : `내일 이후 예정 · 대기 할 일 ${nonTodayCount}건 (전체 ${todos.length}건)`}
                </span>
              </div>
              <button
                type="button"
                data-mypage-standby-toggle="true"
                onClick={() => setShowAllScope((prev) => !prev)}
                className="text-[10px] font-black text-indigo-700 hover:underline shrink-0 cursor-pointer"
              >
                {showAllScope ? '오늘 할 일만 보기' : '전체 할 일 함께 보기'}
              </button>
            </div>
          )}

          {!hydrated ? (
            <div className="py-6 text-center text-xs font-bold text-[#8E8579]">
              할 일 목록을 불러오는 중입니다...
            </div>
          ) : todos.length === 0 ? (
            <div className="rounded-2xl bg-white/90 border border-dashed border-[#D9D0C1] p-5 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] text-[#8E8579] flex items-center justify-center text-sm">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <p className="text-xs font-extrabold text-[#24211D]">
                아직 등록된 할 일이 없습니다.
              </p>
              <p className="text-[11px] text-[#6C655B]">
                위 입력창에 바로 추가하거나 전체 플래너 팝업에서 세부 반복 주기와 집중 타이머를 설정해 보세요.
              </p>
            </div>
          ) : !showAllScope && stats.todayTotalCount === 0 ? (
            <div className="rounded-2xl bg-amber-50/75 border border-amber-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900">
                <i className="fas fa-calendar-clock text-amber-600 text-sm"></i>
                <span>
                  오늘 예정된 할 일이 없습니다. (전체·예정 {todos.length}건)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllScope(true)}
                className="text-[11px] font-black text-indigo-700 hover:underline cursor-pointer shrink-0"
              >
                전체 할 일 보기
              </button>
            </div>
          ) : visibleList.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                <i className="fas fa-circle-check text-emerald-600 text-sm"></i>
                <span>
                  {showAllScope
                    ? `진행 중인 모든 할 일을 완료했습니다! (${stats.completedCount}건 완료)`
                    : `오늘의 모든 할 일을 완료했습니다! (100% · ${stats.todayCompletedCount}건 완료)`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleted(true)}
                className="text-[11px] font-black text-emerald-800 hover:underline cursor-pointer shrink-0"
              >
                완료된 항목 보기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {visibleList.map((item) => {
                const pri = PRIORITY_BADGE[item.priority];
                const isRecurring = item.recurrence.type !== 'none';
                const isWorkdayStandby =
                  item.recurrence.type === 'workday' && !item.occurrence.isDueToday && !item.completed;
                const standbyNextDate = item.occurrence.nextOccurrenceDate
                  ? item.occurrence.nextOccurrenceDate.slice(5).replace('-', '/')
                  : '다음 영업일';
                const due = !isRecurring
                  ? getCompactDueLabel(item.dueDate, item.completed, todayStr)
                  : null;
                const subDone = item.subtasks.filter((s) => s.completed).length;

                return (
                  <div
                    key={item.id}
                    data-mypage-workday-standby={isWorkdayStandby ? 'true' : 'false'}
                    className={`group relative overflow-hidden flex items-center justify-between gap-2.5 pl-4 pr-3 py-3 rounded-xl border transition-all ${
                      item.completed
                        ? 'bg-[#F6F3EC] border-[#EAE3D7] opacity-80'
                        : isWorkdayStandby
                          ? 'bg-amber-50/35 border-amber-200/90 hover:border-amber-300 shadow-[0_1px_3px_rgba(36,33,29,0.05)] hover:shadow-md'
                          : 'bg-white border-[#E4DBD0] hover:border-indigo-300 shadow-[0_1px_3px_rgba(36,33,29,0.06)] hover:shadow-md'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-1.5 ${
                        item.completed ? 'bg-stone-300' : pri.dot
                      }`}
                    />
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleTodo(item.id)}
                        aria-label={item.completed ? `${item.title} 완료 해제` : `${item.title} 완료 처리`}
                        className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          item.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-[#C9BFAE] hover:border-indigo-500 text-transparent'
                        }`}
                      >
                        <i className="fas fa-check text-[10px]"></i>
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[14px] sm:text-[15px] font-extrabold leading-snug tracking-tight truncate ${
                            item.completed ? 'line-through text-[#8E8579]' : 'text-[#1C1917]'
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.memo && (
                          <p className="text-[11px] text-[#6C655B] truncate mt-0.5">
                            {item.memo}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded border font-black ${pri.badge}`}>
                            {pri.label}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5DDD0] text-[#6C655B] font-bold">
                            {CATEGORY_LABEL[item.category]}
                          </span>
                          {item.dueTime && (
                            <span
                              className={`px-1.5 py-0.5 rounded border font-black inline-flex items-center gap-1 ${
                                item.reminderEnabled
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-stone-50 text-stone-600 border-stone-200'
                              }`}
                            >
                              <i
                                className={`text-[9px] ${
                                  item.reminderEnabled ? 'fas fa-bell text-amber-600' : 'far fa-clock'
                                }`}
                              ></i>
                              <span>{item.dueTime}</span>
                            </span>
                          )}
                          {isRecurring && item.occurrence.summaryLabel && (
                            <span className="px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200 font-black">
                              🔁 {item.occurrence.summaryLabel}
                            </span>
                          )}
                          {isWorkdayStandby && (
                            <span className="px-1.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200 font-extrabold">
                              휴무 대기 · {standbyNextDate} 실행
                            </span>
                          )}
                          {isRecurring && item.streakCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 font-black">
                              🔥 {item.streakCount}연속
                            </span>
                          )}
                          {due && (
                            <span
                              className={`px-1.5 py-0.5 rounded border font-bold ${
                                due.isOverdue
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {due.text}
                            </span>
                          )}
                          {item.subtasks.length > 0 && (
                            <span className="text-[#6C655B] font-mono font-bold">
                              단계 {subDone}/{item.subtasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => softDeleteTodo(item.id)}
                      title="휴지통으로 이동"
                      aria-label={`${item.title} 삭제`}
                      className="w-7 h-7 rounded-xl text-[#8E8579] opacity-50 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-xs shrink-0 transition-all cursor-pointer"
                    >
                      <i className="fas fa-trash-can"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {lastDeleted && (
          <div className="px-3.5 py-2 border-t border-[#EFE8DC] bg-[#FCFBF8] flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 bg-[#24211D] text-white px-2.5 py-1 rounded-xl font-bold">
              <span className="truncate max-w-[180px]">&apos;{lastDeleted.title}&apos; 삭제됨</span>
              <button
                type="button"
                onClick={undoSoftDelete}
                className="text-emerald-400 font-black hover:underline cursor-pointer shrink-0"
              >
                실행취소
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
