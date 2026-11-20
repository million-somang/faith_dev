'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const TODO_STORAGE_KEY = 'veranex_todo_planner_v1';

export type LocalTodoPriority = 'urgent' | 'important' | 'normal';
export type LocalTodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'study';

export interface LocalTodoSubtask {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

export interface LocalTodoItem {
  readonly id: string;
  readonly title: string;
  readonly memo: string;
  readonly priority: LocalTodoPriority;
  readonly category: LocalTodoCategory;
  readonly dueDate: string | null;
  readonly completed: boolean;
  readonly completedAt: string | null;
  readonly subtasks: readonly LocalTodoSubtask[];
  readonly order: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isDeleted: boolean;
  readonly deletedAt: string | null;
}

export interface LocalTodoStats {
  readonly totalCount: number;
  readonly completedCount: number;
  readonly activeCount: number;
  readonly todayDueCount: number;
  readonly overdueCount: number;
  readonly trashCount: number;
  readonly completionRate: number;
}

const VALID_PRIORITIES = new Set<LocalTodoPriority>(['urgent', 'important', 'normal']);
const VALID_CATEGORIES = new Set<LocalTodoCategory>([
  'work',
  'personal',
  'shopping',
  'health',
  'study',
]);
const PRIORITY_WEIGHT: Record<LocalTodoPriority, number> = {
  urgent: 3,
  important: 2,
  normal: 1,
};

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function getTodayLocalDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`;
}

function sanitizePlainText(raw: string, maxLen: number): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTodoItem(raw: unknown, idx: number): LocalTodoItem | null {
  if (!isRecord(raw)) return null;
  const title = typeof raw.title === 'string' ? sanitizePlainText(raw.title, 160) : '';
  if (!title) return null;
  const nowIso = new Date().toISOString();

  const subtasks: LocalTodoSubtask[] = [];
  if (Array.isArray(raw.subtasks)) {
    for (let i = 0; i < raw.subtasks.length && subtasks.length < 30; i += 1) {
      const sub = raw.subtasks[i];
      if (!isRecord(sub)) continue;
      const subTitle = typeof sub.title === 'string' ? sanitizePlainText(sub.title, 120) : '';
      if (!subTitle) continue;
      subtasks.push({
        id:
          typeof sub.id === 'string' && sub.id.trim()
            ? sanitizePlainText(sub.id, 64)
            : `sub_${Date.now()}_${i}`,
        title: subTitle,
        completed: Boolean(sub.completed),
      });
    }
  }

  const priority: LocalTodoPriority =
    typeof raw.priority === 'string' && VALID_PRIORITIES.has(raw.priority as LocalTodoPriority)
      ? (raw.priority as LocalTodoPriority)
      : 'normal';

  const category: LocalTodoCategory =
    typeof raw.category === 'string' && VALID_CATEGORIES.has(raw.category as LocalTodoCategory)
      ? (raw.category as LocalTodoCategory)
      : 'personal';

  const dueDate =
    typeof raw.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate)
      ? raw.dueDate
      : null;

  return {
    id:
      typeof raw.id === 'string' && raw.id.trim()
        ? sanitizePlainText(raw.id, 64)
        : `todo_${Date.now()}_${idx}`,
    title,
    memo: typeof raw.memo === 'string' ? sanitizePlainText(raw.memo, 400) : '',
    priority,
    category,
    dueDate,
    completed: Boolean(raw.completed),
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
    subtasks,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : idx,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso,
    isDeleted: Boolean(raw.isDeleted),
    deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : null,
  };
}

function readTodosFromStorage(): LocalTodoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawStr = window.localStorage.getItem(TODO_STORAGE_KEY);
    if (!rawStr) return [];
    const parsed: unknown = JSON.parse(rawStr);
    let list: unknown = null;
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (isRecord(parsed) && Array.isArray(parsed.items)) {
      list = parsed.items;
    }
    if (!Array.isArray(list)) return [];

    const out: LocalTodoItem[] = [];
    for (let i = 0; i < list.length && out.length < 500; i += 1) {
      const normalized = normalizeTodoItem(list[i], i);
      if (normalized) out.push(normalized);
    }
    return out;
  } catch {
    return [];
  }
}

function writeTodosToStorage(items: readonly LocalTodoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      TODO_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, items })
    );
    window.dispatchEvent(new CustomEvent('veranex:todo-updated'));
  } catch {
    // QuotaExceededError 등 스토리지 예외 무시
  }
}

export function useLocalTodos() {
  const [items, setItems] = useState<LocalTodoItem[]>([]);
  const itemsRef = useRef<LocalTodoItem[]>(items);
  itemsRef.current = items;
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [lastDeleted, setLastDeleted] = useState<LocalTodoItem | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncFromStorage = useCallback(() => {
    const next = readTodosFromStorage();
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    syncFromStorage();
    setHydrated(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TODO_STORAGE_KEY) {
        syncFromStorage();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromStorage();
      }
    };
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (
        e.data &&
        typeof e.data === 'object' &&
        (e.data as { type?: string }).type === 'VERANEX_TODO_UPDATED'
      ) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', syncFromStorage);
    window.addEventListener('message', handleMessage);
    window.addEventListener('veranex:todo-updated', syncFromStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', syncFromStorage);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('veranex:todo-updated', syncFromStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    };
  }, [syncFromStorage]);

  const addQuickTodo = useCallback(
    (rawTitle: string, priority: LocalTodoPriority = 'important', dueToday: boolean = true) => {
      const title = sanitizePlainText(rawTitle, 160);
      if (!title) return;
      const nowIso = new Date().toISOString();
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `todo_${crypto.randomUUID()}`
          : `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const minOrder = itemsRef.current.reduce((min, item) => Math.min(min, item.order), 0);
      const newItem: LocalTodoItem = {
        id,
        title,
        memo: '',
        priority,
        category: 'personal',
        dueDate: dueToday ? getTodayLocalDateStr() : null,
        completed: false,
        completedAt: null,
        subtasks: [],
        order: minOrder - 1,
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
        deletedAt: null,
      };
      const next = [newItem, ...itemsRef.current].slice(0, 500);
      itemsRef.current = next;
      setItems(next);
      writeTodosToStorage(next);
    },
    []
  );

  const toggleTodo = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    const next = itemsRef.current.map((item) => {
      if (item.id !== id) return item;
      const nextDone = !item.completed;
      return {
        ...item,
        completed: nextDone,
        completedAt: nextDone ? nowIso : null,
        updatedAt: nowIso,
      };
    });
    itemsRef.current = next;
    setItems(next);
    writeTodosToStorage(next);
  }, []);

  const softDeleteTodo = useCallback((id: string) => {
    const removedTarget = itemsRef.current.find((item) => item.id === id && !item.isDeleted) || null;
    if (!removedTarget) return;

    const nowIso = new Date().toISOString();
    const next = itemsRef.current.map((item) =>
      item.id === id
        ? {
            ...item,
            isDeleted: true,
            deletedAt: nowIso,
            updatedAt: nowIso,
          }
        : item
    );
    itemsRef.current = next;
    setItems(next);
    writeTodosToStorage(next);

    setLastDeleted(removedTarget);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setLastDeleted(null);
      undoTimerRef.current = null;
    }, 5000);
  }, []);

  const undoSoftDelete = useCallback(() => {
    if (!lastDeleted) return;
    const targetId = lastDeleted.id;
    const nowIso = new Date().toISOString();
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setLastDeleted(null);
    const next = itemsRef.current.map((item) =>
      item.id === targetId
        ? {
            ...item,
            isDeleted: false,
            deletedAt: null,
            updatedAt: nowIso,
          }
        : item
    );
    itemsRef.current = next;
    setItems(next);
    writeTodosToStorage(next);
  }, [lastDeleted]);

  const activeItems = useMemo(() => items.filter((item) => !item.isDeleted), [items]);

  const sortedTodos = useMemo(() => {
    return [...activeItems].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (pDiff !== 0) return pDiff;
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return a.order - b.order;
    });
  }, [activeItems]);

  const stats: LocalTodoStats = useMemo(() => {
    const todayStr = getTodayLocalDateStr();
    const totalCount = activeItems.length;
    const completedCount = activeItems.filter((item) => item.completed).length;
    const activeCount = totalCount - completedCount;
    const todayDueCount = activeItems.filter(
      (item) => !item.completed && item.dueDate === todayStr
    ).length;
    const overdueCount = activeItems.filter(
      (item) => !item.completed && item.dueDate !== null && item.dueDate < todayStr
    ).length;
    const trashCount = items.length - totalCount;
    const completionRate =
      totalCount > 0 ? Math.min(100, Math.round((completedCount * 100) / totalCount)) : 0;

    return {
      totalCount,
      completedCount,
      activeCount,
      todayDueCount,
      overdueCount,
      trashCount,
      completionRate,
    };
  }, [activeItems, items.length]);

  return {
    hydrated,
    todos: sortedTodos,
    stats,
    lastDeleted,
    addQuickTodo,
    toggleTodo,
    softDeleteTodo,
    undoSoftDelete,
    refreshTodos: syncFromStorage,
  };
}
