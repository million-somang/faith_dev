import { CATEGORY_LIST, PRIORITY_LIST } from '../constants/todoMeta';
import type {
  CategoryBreakdown,
  PriorityBreakdown,
  TodoItem,
  TodoStatsReport,
} from '../types/todo';
import {
  evaluateTodoOccurrence,
  getLocalTodayDateStr,
  isValidDateStr,
} from './recurrence';

/**
 * 로컬 타임존 기준 'YYYY-MM-DD' 문자열을 반환합니다.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const pad = (num: number) => (num < 10 ? `0${num}` : String(num));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getOffsetDateString(offsetDays: number): string {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  return getLocalDateString(target);
}

export function formatTodayKoreanLabel(): string {
  const now = new Date();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const;
  return `${now.getMonth() + 1}월 ${now.getDate()}일 (${weekdays[now.getDay()]})`;
}

export interface DueBadgeInfo {
  readonly label: string;
  readonly isOverdue: boolean;
  readonly isToday: boolean;
  readonly badgeClass: string;
}

export function getDueDateBadge(
  dueDate: string | null,
  completed: boolean,
  todayStr: string = getLocalDateString()
): DueBadgeInfo | null {
  if (!dueDate) return null;

  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = dueDate.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const dueUtc = Date.UTC(dy, dm - 1, dd);
  const diffDays = Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (completed) {
    return {
      label: dueDate.slice(5).replace('-', '/'),
      isOverdue: false,
      isToday: diffDays === 0,
      badgeClass: 'bg-stone-100 text-stone-500 border-stone-200',
    };
  }

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}일 지연`,
      isOverdue: true,
      isToday: false,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-black',
    };
  }

  if (diffDays === 0) {
    return {
      label: '오늘 (D-Day)',
      isOverdue: false,
      isToday: true,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-black',
    };
  }

  if (diffDays === 1) {
    return {
      label: '내일 (D-1)',
      isOverdue: false,
      isToday: false,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    };
  }

  return {
    label: `D-${diffDays}`,
    isOverdue: false,
    isToday: false,
    badgeClass: 'bg-stone-50 text-stone-600 border-stone-200',
  };
}

export function hydrateTodoOccurrence(
  item: TodoItem,
  targetDate: string = getLocalTodayDateStr()
): TodoItem {
  const anchorCandidate = item.dueDate ?? item.createdAt.slice(0, 10);
  const anchorDate = isValidDateStr(anchorCandidate) ? anchorCandidate : targetDate;
  const occurrence = evaluateTodoOccurrence({
    rule: item.recurrence,
    anchorDate,
    lastCompletedPeriod: item.lastCompletedPeriod,
    completed: item.completed,
    targetDate,
  });

  if (!occurrence.isRecurring) {
    return {
      ...item,
      occurrence,
    };
  }

  return {
    ...item,
    completed: occurrence.isCompletedForPeriod,
    completedAt: occurrence.isCompletedForPeriod ? item.completedAt : null,
    occurrence,
  };
}

export function roundPercent(numerator: number, denominator: number): number {
  if (denominator <= 0 || numerator <= 0) return 0;
  return Math.min(100, Math.round((numerator * 100) / denominator));
}

export function isTodoForToday(
  item: Pick<TodoItem, 'dueDate' | 'recurrence' | 'occurrence'>,
  todayStr: string = getLocalDateString()
): boolean {
  if (item.recurrence.type !== 'none') {
    return item.occurrence.isDueToday;
  }
  return item.dueDate === todayStr;
}

export function isTodoUpcoming(
  item: Pick<TodoItem, 'dueDate' | 'recurrence' | 'occurrence'>,
  todayStr: string = getLocalDateString()
): boolean {
  if (isTodoForToday(item, todayStr)) return false;
  if (item.recurrence.type !== 'none') {
    return Boolean(
      item.occurrence.nextOccurrenceDate && item.occurrence.nextOccurrenceDate > todayStr
    );
  }
  return item.dueDate !== null && item.dueDate > todayStr;
}

export function computeTodoStats(
  items: readonly TodoItem[],
  todayStr: string = getLocalDateString()
): TodoStatsReport {
  const activeList = items.filter((item) => !item.isDeleted);
  const trashCount = items.length - activeList.length;

  const totalCount = activeList.length;
  const completedCount = activeList.filter((item) => item.completed).length;
  const activeCount = totalCount - completedCount;
  const recurringCount = activeList.filter((item) => item.recurrence.type !== 'none').length;
  const maxStreak = activeList.reduce((acc, item) => Math.max(acc, item.streakCount), 0);

  const overdueCount = activeList.filter(
    (item) =>
      !item.completed &&
      item.recurrence.type === 'none' &&
      item.dueDate !== null &&
      item.dueDate < todayStr
  ).length;

  const todayItems = activeList.filter((item) => isTodoForToday(item, todayStr));
  const todayTotalCount = todayItems.length;
  const todayCompletedCount = todayItems.filter((item) => item.completed).length;
  const todayActiveCount = todayTotalCount - todayCompletedCount;
  const todayDueCount = todayActiveCount;
  const todayCompletionRate = roundPercent(todayCompletedCount, todayTotalCount);
  const upcomingCount = activeList.filter(
    (item) => !item.completed && isTodoUpcoming(item, todayStr)
  ).length;

  const byPriority: PriorityBreakdown[] = PRIORITY_LIST.map((meta) => {
    const subset = activeList.filter((item) => item.priority === meta.key);
    const done = subset.filter((item) => item.completed).length;
    return {
      priority: meta.key,
      total: subset.length,
      completed: done,
      remaining: subset.length - done,
    };
  });

  const byCategory: CategoryBreakdown[] = CATEGORY_LIST.map((meta) => {
    const subset = activeList.filter((item) => item.category === meta.key);
    const done = subset.filter((item) => item.completed).length;
    return {
      category: meta.key,
      total: subset.length,
      completed: done,
      rate: roundPercent(done, subset.length),
    };
  });

  return {
    totalCount,
    completedCount,
    activeCount,
    recurringCount,
    maxStreak,
    overdueCount,
    todayDueCount,
    todayTotalCount,
    todayCompletedCount,
    todayActiveCount,
    todayCompletionRate,
    upcomingCount,
    trashCount,
    completionRate: roundPercent(completedCount, totalCount),
    byPriority,
    byCategory,
  };
}
