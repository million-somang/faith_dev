'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TODO_STORAGE_KEY,
  getTodayLocalDateStr,
  type LocalTodoCategory,
  type LocalTodoPriority,
  type LocalTodoSubtask,
} from '@/hooks/useLocalTodos';

export type PortalRecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PortalTodoRecurrence {
  readonly type: PortalRecurrenceType;
  readonly interval: number;
  readonly weekdays?: readonly number[] | null;
  readonly monthDay?: number | null;
  readonly yearMonth?: number | null;
  readonly yearDay?: number | null;
  readonly endDate?: string | null;
}

export interface PortalTodoOccurrence {
  readonly isRecurring: boolean;
  readonly isCompletedForPeriod: boolean;
  readonly isDueToday: boolean;
  readonly currentPeriodKey: string | null;
  readonly nextOccurrenceDate: string | null;
  readonly summaryLabel: string;
}

export interface PortalTodoItem {
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
  readonly recurrence: PortalTodoRecurrence;
  readonly lastCompletedPeriod: string | null;
  readonly streakCount: number;
  readonly occurrence: PortalTodoOccurrence;
  readonly isDeleted: boolean;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PortalTodoStats {
  readonly totalCount: number;
  readonly completedCount: number;
  readonly activeCount: number;
  readonly recurringCount: number;
  readonly maxStreak: number;
  readonly todayDueCount: number;
  readonly overdueCount: number;
  readonly trashCount: number;
  readonly completionRate: number;
}

const SYNC_CHANNEL_NAME = 'veranex_todo_sync';
const MIGRATED_MARKER_KEY = 'veranex_todo_db_migrated_v1';
const PRIORITY_WEIGHT: Record<LocalTodoPriority, number> = {
  urgent: 3,
  important: 2,
  normal: 1,
};
const WEEKDAY_KOREAN = ['일', '월', '화', '수', '목', '금', '토'] as const;

function sanitizeText(raw: string, maxLen: number): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatSummary(rule: PortalTodoRecurrence): string {
  switch (rule.type) {
    case 'none':
      return '';
    case 'daily':
      return rule.interval <= 1 ? '매일' : `${rule.interval}일마다`;
    case 'weekly': {
      const days = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [];
      const key = days.join(',');
      if (rule.interval <= 1 && key === '1,2,3,4,5') return '평일 매일';
      if (rule.interval <= 1 && key === '0,6') return '주말마다';
      const labels = days.map((d) => WEEKDAY_KOREAN[d] ?? '').filter(Boolean).join('·');
      return labels ? `매주 ${labels}` : '매주';
    }
    case 'monthly':
      return `매월 ${rule.monthDay ?? 1}일`;
    case 'yearly':
      return `매년 ${rule.yearMonth ?? 1}월 ${rule.yearDay ?? 1}일`;
  }
}

function buildDefaultRecurrence(type: PortalRecurrenceType, todayStr: string): PortalTodoRecurrence {
  if (type === 'none') {
    return { type: 'none', interval: 1 };
  }
  const [y, m, d] = todayStr.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (type === 'daily') return { type: 'daily', interval: 1 };
  if (type === 'weekly') return { type: 'weekly', interval: 1, weekdays: [weekday] };
  if (type === 'monthly') return { type: 'monthly', interval: 1, monthDay: d };
  return { type: 'yearly', interval: 1, yearMonth: m, yearDay: d };
}

function getLocalPeriodKey(type: PortalRecurrenceType, todayStr: string): string | null {
  if (type === 'none') return null;
  if (type === 'daily' || type === 'weekly') return todayStr;
  if (type === 'monthly') return todayStr.slice(0, 7);
  return todayStr.slice(0, 4);
}

function normalizeLocalRecord(raw: unknown, idx: number, todayStr: string): PortalTodoItem | null {
  if (!isRecord(raw)) return null;
  const title = typeof raw.title === 'string' ? sanitizeText(raw.title, 160) : '';
  if (!title) return null;

  const nowIso = new Date().toISOString();
  const priority: LocalTodoPriority =
    raw.priority === 'urgent' || raw.priority === 'important' || raw.priority === 'normal'
      ? raw.priority
      : 'normal';
  const category: LocalTodoCategory =
    raw.category === 'work' ||
    raw.category === 'personal' ||
    raw.category === 'shopping' ||
    raw.category === 'health' ||
    raw.category === 'study'
      ? raw.category
      : 'personal';

  const recObj = isRecord(raw.recurrence) ? raw.recurrence : null;
  const recType: PortalRecurrenceType =
    recObj &&
    (recObj.type === 'none' ||
      recObj.type === 'daily' ||
      recObj.type === 'weekly' ||
      recObj.type === 'monthly' ||
      recObj.type === 'yearly')
      ? recObj.type
      : 'none';

  const recurrence: PortalTodoRecurrence =
    recType === 'none'
      ? { type: 'none', interval: 1 }
      : {
          type: recType,
          interval: typeof recObj?.interval === 'number' ? Math.max(1, recObj.interval) : 1,
          weekdays: Array.isArray(recObj?.weekdays)
            ? recObj.weekdays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
            : null,
          monthDay: typeof recObj?.monthDay === 'number' ? recObj.monthDay : null,
          yearMonth: typeof recObj?.yearMonth === 'number' ? recObj.yearMonth : null,
          yearDay: typeof recObj?.yearDay === 'number' ? recObj.yearDay : null,
          endDate: typeof recObj?.endDate === 'string' ? recObj.endDate : null,
        };

  const lastCompletedPeriod =
    typeof raw.lastCompletedPeriod === 'string' ? raw.lastCompletedPeriod : null;
  const periodKey = getLocalPeriodKey(recType, todayStr);
  const completed =
    recType === 'none' ? Boolean(raw.completed) : Boolean(periodKey && lastCompletedPeriod === periodKey);

  const occObj = isRecord(raw.occurrence) ? raw.occurrence : null;
  const occurrence: PortalTodoOccurrence = occObj
    ? {
        isRecurring: recType !== 'none',
        isCompletedForPeriod: completed,
        isDueToday: Boolean(occObj.isDueToday),
        currentPeriodKey: periodKey,
        nextOccurrenceDate:
          typeof occObj.nextOccurrenceDate === 'string' ? occObj.nextOccurrenceDate : null,
        summaryLabel:
          typeof occObj.summaryLabel === 'string' && occObj.summaryLabel
            ? occObj.summaryLabel
            : formatSummary(recurrence),
      }
    : {
        isRecurring: recType !== 'none',
        isCompletedForPeriod: completed,
        isDueToday: raw.dueDate === todayStr,
        currentPeriodKey: periodKey,
        nextOccurrenceDate: null,
        summaryLabel: formatSummary(recurrence),
      };

  const subtasks: LocalTodoSubtask[] = [];
  if (Array.isArray(raw.subtasks)) {
    for (let i = 0; i < raw.subtasks.length && subtasks.length < 30; i += 1) {
      const sub = raw.subtasks[i];
      if (!isRecord(sub)) continue;
      const st = typeof sub.title === 'string' ? sanitizeText(sub.title, 120) : '';
      if (!st) continue;
      subtasks.push({
        id: typeof sub.id === 'string' ? sub.id : `sub_${Date.now()}_${i}`,
        title: st,
        completed: Boolean(sub.completed),
      });
    }
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `todo_${Date.now()}_${idx}`,
    title,
    memo: typeof raw.memo === 'string' ? sanitizeText(raw.memo, 400) : '',
    priority,
    category,
    dueDate: typeof raw.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate) ? raw.dueDate : null,
    completed,
    completedAt: completed && typeof raw.completedAt === 'string' ? raw.completedAt : null,
    subtasks,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : idx,
    recurrence,
    lastCompletedPeriod,
    streakCount: typeof raw.streakCount === 'number' ? Math.max(0, raw.streakCount) : 0,
    occurrence,
    isDeleted: Boolean(raw.isDeleted),
    deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso,
  };
}

function readLocalTodos(): PortalTodoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawStr = window.localStorage.getItem(TODO_STORAGE_KEY);
    if (!rawStr) return [];
    const parsed: unknown = JSON.parse(rawStr);
    const list = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.items)
        ? parsed.items
        : [];
    const todayStr = getTodayLocalDateStr();
    const out: PortalTodoItem[] = [];
    for (let i = 0; i < list.length && out.length < 500; i += 1) {
      const normalized = normalizeLocalRecord(list[i], i, todayStr);
      if (normalized) out.push(normalized);
    }
    return out;
  } catch {
    return [];
  }
}

function writeLocalTodos(items: readonly PortalTodoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify({ schemaVersion: 2, items }));
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(SYNC_CHANNEL_NAME);
      ch.postMessage({ type: 'SYNC_TODOS', timestamp: Date.now() });
      ch.close();
    }
  } catch {
    // 스토리지 제한 시 무시
  }
}

function broadcastDbSync(): void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  try {
    const ch = new BroadcastChannel(SYNC_CHANNEL_NAME);
    ch.postMessage({ type: 'SYNC_TODOS', timestamp: Date.now() });
    ch.close();
  } catch {
    // 무시
  }
}

export function usePortalTodos() {
  const [source, setSource] = useState<'db' | 'local'>('local');
  const [userId, setUserId] = useState<number | null>(null);
  const [items, setItems] = useState<PortalTodoItem[]>([]);
  const itemsRef = useRef<PortalTodoItem[]>(items);
  itemsRef.current = items;

  const [hydrated, setHydrated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastDeleted, setLastDeleted] = useState<PortalTodoItem | null>(null);
  const [migrationDismissed, setMigrationDismissed] = useState<boolean>(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    const todayStr = getTodayLocalDateStr();

    try {
      const authRes = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const authJson = authRes.ok
        ? ((await authRes.json()) as { success?: boolean; user?: { id?: number } | null })
        : null;
      const authedId =
        authJson?.success && authJson.user && typeof authJson.user.id === 'number'
          ? authJson.user.id
          : null;

      if (!authedId) {
        setUserId(null);
        setSource('local');
        const local = readLocalTodos();
        itemsRef.current = local;
        setItems(local);
        return;
      }

      const dbRes = await fetch(
        `/api/todos?date=${encodeURIComponent(todayStr)}&includeTrash=1`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      if (dbRes.ok) {
        const json = (await dbRes.json()) as {
          success?: boolean;
          data?: { items?: PortalTodoItem[]; trash?: PortalTodoItem[] };
        };
        if (json.success && json.data) {
          const merged = [...(json.data.items ?? []), ...(json.data.trash ?? [])];
          setUserId(authedId);
          setSource('db');
          itemsRef.current = merged;
          setItems(merged);
          return;
        }
      }

      // 폴백
      const local = readLocalTodos();
      itemsRef.current = local;
      setItems(local);
    } catch {
      const local = readLocalTodos();
      itemsRef.current = local;
      setItems(local);
    } finally {
      setHydrated(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTodos();

    let ch: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        ch = new BroadcastChannel(SYNC_CHANNEL_NAME);
        ch.onmessage = () => {
          void loadTodos();
        };
      }
    } catch {
      ch = null;
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TODO_STORAGE_KEY) {
        void loadTodos();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadTodos();
      }
    };
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (
        e.data &&
        typeof e.data === 'object' &&
        (e.data as { source?: string; type?: string }).source === 'VERANEX_TODO'
      ) {
        void loadTodos();
      }
    };
    const handleFocus = () => {
      void loadTodos();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      ch?.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    };
  }, [loadTodos]);

  const addQuickTodo = useCallback(
    (
      rawTitle: string,
      priority: LocalTodoPriority = 'important',
      dueToday: boolean = true,
      recurrenceType: PortalRecurrenceType = 'none'
    ) => {
      const title = sanitizeText(rawTitle, 160);
      if (!title) return;
      const todayStr = getTodayLocalDateStr();
      const recurrence = buildDefaultRecurrence(recurrenceType, todayStr);
      const dueDate = dueToday || recurrenceType !== 'none' ? todayStr : null;

      if (source === 'db') {
        void (async () => {
          try {
            const res = await fetch('/api/todos', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                priority,
                category: 'personal',
                dueDate,
                recurrence,
                date: todayStr,
              }),
            });
            if (res.ok) {
              broadcastDbSync();
              await loadTodos();
            }
          } catch {
            // 무시
          }
        })();
        return;
      }

      const nowIso = new Date().toISOString();
      const minOrder = itemsRef.current.reduce((min, item) => Math.min(min, item.order), 0);
      const newItem: PortalTodoItem = {
        id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        memo: '',
        priority,
        category: 'personal',
        dueDate,
        completed: false,
        completedAt: null,
        subtasks: [],
        order: minOrder - 1,
        recurrence,
        lastCompletedPeriod: null,
        streakCount: 0,
        occurrence: {
          isRecurring: recurrenceType !== 'none',
          isCompletedForPeriod: false,
          isDueToday: dueDate === todayStr,
          currentPeriodKey: getLocalPeriodKey(recurrenceType, todayStr),
          nextOccurrenceDate: dueDate,
          summaryLabel: formatSummary(recurrence),
        },
        isDeleted: false,
        deletedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const next = [newItem, ...itemsRef.current].slice(0, 500);
      itemsRef.current = next;
      setItems(next);
      writeLocalTodos(next);
    },
    [loadTodos, source]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      const todayStr = getTodayLocalDateStr();
      if (source === 'db') {
        // 낙관적 반영 후 DB API 호출
        const optimistic = itemsRef.current.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        );
        itemsRef.current = optimistic;
        setItems(optimistic);

        void (async () => {
          try {
            const res = await fetch(`/api/todos/${encodeURIComponent(id)}/toggle`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: todayStr }),
            });
            if (res.ok) {
              broadcastDbSync();
              await loadTodos();
            }
          } catch {
            void loadTodos();
          }
        })();
        return;
      }

      const nowIso = new Date().toISOString();
      const next = itemsRef.current.map((item) => {
        if (item.id !== id) return item;
        const nextDone = !item.completed;
        const periodKey = getLocalPeriodKey(item.recurrence.type, todayStr);
        return {
          ...item,
          completed: nextDone,
          completedAt: nextDone ? nowIso : null,
          lastCompletedPeriod:
            item.recurrence.type !== 'none' ? (nextDone ? periodKey : null) : item.lastCompletedPeriod,
          streakCount:
            item.recurrence.type !== 'none'
              ? nextDone
                ? item.streakCount + 1
                : Math.max(0, item.streakCount - 1)
              : item.streakCount,
          updatedAt: nowIso,
        };
      });
      itemsRef.current = next;
      setItems(next);
      writeLocalTodos(next);
    },
    [loadTodos, source]
  );

  const softDeleteTodo = useCallback(
    (id: string) => {
      const target = itemsRef.current.find((item) => item.id === id && !item.isDeleted) || null;
      if (!target) return;

      const nowIso = new Date().toISOString();
      const next = itemsRef.current.map((item) =>
        item.id === id ? { ...item, isDeleted: true, deletedAt: nowIso } : item
      );
      itemsRef.current = next;
      setItems(next);

      if (source === 'db') {
        void (async () => {
          try {
            await fetch(`/api/todos/${encodeURIComponent(id)}/soft-delete`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
            broadcastDbSync();
          } catch {
            void loadTodos();
          }
        })();
      } else {
        writeLocalTodos(next);
      }

      setLastDeleted(target);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setLastDeleted(null);
        undoTimerRef.current = null;
      }, 5000);
    },
    [loadTodos, source]
  );

  const undoSoftDelete = useCallback(() => {
    if (!lastDeleted) return;
    const targetId = lastDeleted.id;
    const todayStr = getTodayLocalDateStr();
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setLastDeleted(null);

    if (source === 'db') {
      void (async () => {
        try {
          await fetch(`/api/todos/${encodeURIComponent(targetId)}/restore`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: todayStr }),
          });
          broadcastDbSync();
          await loadTodos();
        } catch {
          void loadTodos();
        }
      })();
      return;
    }

    const next = itemsRef.current.map((item) =>
      item.id === targetId ? { ...item, isDeleted: false, deletedAt: null } : item
    );
    itemsRef.current = next;
    setItems(next);
    writeLocalTodos(next);
  }, [lastDeleted, loadTodos, source]);

  const pendingLocalItems = useMemo(() => {
    if (source !== 'db' || !userId || migrationDismissed) return [];
    if (typeof window !== 'undefined') {
      const marker = window.localStorage.getItem(MIGRATED_MARKER_KEY);
      if (marker === JSON.stringify(`u_${userId}`)) return [];
    }
    const local = readLocalTodos().filter((item) => !item.isDeleted);
    if (local.length === 0) return [];
    const existingIds = new Set(items.map((item) => item.id));
    return local.filter((item) => !existingIds.has(item.id));
  }, [items, migrationDismissed, source, userId]);

  const migrateLocalToDb = useCallback(async () => {
    if (source !== 'db' || !userId || pendingLocalItems.length === 0) return;
    const todayStr = getTodayLocalDateStr();
    try {
      const res = await fetch('/api/todos/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingLocalItems, date: todayStr }),
      });
      if (res.ok) {
        window.localStorage.setItem(MIGRATED_MARKER_KEY, JSON.stringify(`u_${userId}`));
        setMigrationDismissed(true);
        broadcastDbSync();
        await loadTodos();
      }
    } catch {
      // 무시
    }
  }, [loadTodos, pendingLocalItems, source, userId]);

  const activeItems = useMemo(() => items.filter((item) => !item.isDeleted), [items]);

  const sortedTodos = useMemo(() => {
    return [...activeItems].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (pDiff !== 0) return pDiff;
      const aDate = a.occurrence.nextOccurrenceDate ?? a.dueDate;
      const bDate = b.occurrence.nextOccurrenceDate ?? b.dueDate;
      if (aDate && bDate && aDate !== bDate) return aDate.localeCompare(bDate);
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      return a.order - b.order;
    });
  }, [activeItems]);

  const stats: PortalTodoStats = useMemo(() => {
    const todayStr = getTodayLocalDateStr();
    const totalCount = activeItems.length;
    const completedCount = activeItems.filter((item) => item.completed).length;
    const activeCount = totalCount - completedCount;
    const recurringCount = activeItems.filter((item) => item.recurrence.type !== 'none').length;
    const maxStreak = activeItems.reduce((acc, item) => Math.max(acc, item.streakCount), 0);
    const todayDueCount = activeItems.filter((item) => {
      if (item.completed) return false;
      if (item.recurrence.type !== 'none') return item.occurrence.isDueToday;
      return item.dueDate === todayStr;
    }).length;
    const overdueCount = activeItems.filter(
      (item) =>
        !item.completed &&
        item.recurrence.type === 'none' &&
        item.dueDate !== null &&
        item.dueDate < todayStr
    ).length;
    const trashCount = items.length - totalCount;
    const completionRate =
      totalCount > 0 ? Math.min(100, Math.round((completedCount * 100) / totalCount)) : 0;

    return {
      totalCount,
      completedCount,
      activeCount,
      recurringCount,
      maxStreak,
      todayDueCount,
      overdueCount,
      trashCount,
      completionRate,
    };
  }, [activeItems, items.length]);

  return {
    source,
    hydrated,
    isLoading,
    todos: sortedTodos,
    stats,
    lastDeleted,
    pendingLocalCount: pendingLocalItems.length,
    addQuickTodo,
    toggleTodo,
    softDeleteTodo,
    undoSoftDelete,
    migrateLocalToDb,
    refreshTodos: loadTodos,
  };
}
