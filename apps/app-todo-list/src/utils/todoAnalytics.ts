import { CATEGORY_LIST, PRIORITY_LIST } from '../constants/todoMeta';
import type {
  CategoryBreakdown,
  PriorityBreakdown,
  TodoItem,
  TodoStatsReport,
} from '../types/todo';

function padTwo(num: number): string {
  return num < 10 ? `0${num}` : String(num);
}

/**
 * 로컬 타임존 기준 'YYYY-MM-DD' 문자열을 반환합니다.
 */
export function getLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
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

export function roundPercent(numerator: number, denominator: number): number {
  if (denominator <= 0 || numerator <= 0) return 0;
  return Math.min(100, Math.round((numerator * 100) / denominator));
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

  const overdueCount = activeList.filter(
    (item) => !item.completed && item.dueDate !== null && item.dueDate < todayStr
  ).length;

  const todayDueCount = activeList.filter(
    (item) => !item.completed && item.dueDate === todayStr
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
    overdueCount,
    todayDueCount,
    trashCount,
    completionRate: roundPercent(completedCount, totalCount),
    byPriority,
    byCategory,
  };
}
