import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PRIORITY_MAP,
  TODO_MAX_ITEMS,
  TODO_MAX_SUBTASKS,
  TODO_STORAGE_KEY,
} from '../constants/todoMeta';
import type {
  StoredTodoEnvelope,
  TodoDraftInput,
  TodoFilterState,
  TodoItem,
  TodoPatchInput,
  TodoSubtask,
} from '../types/todo';
import { safeStorage } from '../utils/safeStorage';
import {
  isValidDateString,
  parseValidatedBackupPayload,
  sanitizeText,
  sanitizeTodoRecord,
} from '../utils/security';
import { computeTodoStats, getLocalDateString } from '../utils/todoAnalytics';

const DEFAULT_FILTER: TodoFilterState = {
  status: 'all',
  category: 'all',
  priority: 'all',
  searchQuery: '',
  sortBy: 'manual',
};

function createUniqueId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredTodos(): TodoItem[] {
  const raw = safeStorage.get<unknown>(TODO_STORAGE_KEY, null);
  if (!raw) return [];

  let candidateList: unknown = null;
  if (Array.isArray(raw)) {
    candidateList = raw;
  } else if (typeof raw === 'object' && raw !== null && 'items' in raw) {
    candidateList = (raw as { items: unknown }).items;
  }

  if (!Array.isArray(candidateList)) return [];

  const result: TodoItem[] = [];
  for (let i = 0; i < candidateList.length && result.length < TODO_MAX_ITEMS; i += 1) {
    const cleaned = sanitizeTodoRecord(candidateList[i], i);
    if (cleaned) result.push(cleaned);
  }
  return result;
}

function persistTodos(items: readonly TodoItem[]): boolean {
  const envelope: StoredTodoEnvelope = {
    schemaVersion: 1,
    items,
  };
  const ok = safeStorage.set(TODO_STORAGE_KEY, envelope);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('veranex:todo-updated'));
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          { type: 'VERANEX_TODO_UPDATED', source: 'VERANEX_TODO_PLANNER' },
          window.location.origin
        );
      } catch {
        // 크로스 오리진 부모 창은 postMessage 생략
      }
    }
  }
  return ok;
}

export function useTodos() {
  const [items, setItems] = useState<TodoItem[]>(() => readStoredTodos());
  const itemsRef = useRef<TodoItem[]>(items);
  itemsRef.current = items;
  const [filter, setFilter] = useState<TodoFilterState>(DEFAULT_FILTER);
  const [lastDeletedItem, setLastDeletedItem] = useState<TodoItem | null>(null);
  const [storageWarning, setStorageWarning] = useState<boolean>(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearUndoTimer();
  }, [clearUndoTimer]);

  // 마이페이지·타 탭 변경사항 실시간 반영
  useEffect(() => {
    const syncFromStorage = () => {
      const next = readStoredTodos();
      itemsRef.current = next;
      setItems(next);
    };

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
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', syncFromStorage);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const commitItems = useCallback((updater: (prev: readonly TodoItem[]) => readonly TodoItem[]) => {
    const next = [...updater(itemsRef.current)];
    itemsRef.current = next;
    setItems(next);
    const saved = persistTodos(next);
    setStorageWarning(!saved);
  }, []);

  const addTodo = useCallback(
    (draft: TodoDraftInput): { added: TodoItem | null; allCompletedNow: boolean } => {
      const title = sanitizeText(draft.title, 160);
      if (!title) return { added: null, allCompletedNow: false };

      const memo = draft.memo ? sanitizeText(draft.memo, 400) : '';
      const dueDate = isValidDateString(draft.dueDate) ? draft.dueDate : null;
      const nowIso = new Date().toISOString();

      const minOrder = itemsRef.current.reduce((min, item) => Math.min(min, item.order), 0);
      const newItem: TodoItem = {
        id: createUniqueId('todo'),
        title,
        memo,
        priority: draft.priority,
        category: draft.category,
        dueDate,
        completed: false,
        completedAt: null,
        subtasks: [],
        order: minOrder - 1,
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
        deletedAt: null,
      };

      commitItems((prev) => [newItem, ...prev].slice(0, TODO_MAX_ITEMS));
      return { added: newItem, allCompletedNow: false };
    },
    [commitItems]
  );

  const toggleTodo = useCallback(
    (id: string): { completed: boolean; allCompletedNow: boolean } => {
      const target = itemsRef.current.find((item) => item.id === id);
      if (!target) return { completed: false, allCompletedNow: false };

      const nextDone = !target.completed;
      const nowIso = new Date().toISOString();

      const next = itemsRef.current.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: nextDone,
              completedAt: nextDone ? nowIso : null,
              updatedAt: nowIso,
            }
          : item
      );

      const active = next.filter((item) => !item.isDeleted);
      const allCompletedNow =
        nextDone && active.length > 0 && active.every((item) => item.completed);

      itemsRef.current = next;
      setItems(next);
      const saved = persistTodos(next);
      setStorageWarning(!saved);

      return { completed: nextDone, allCompletedNow };
    },
    []
  );

  const updateTodo = useCallback(
    (id: string, patch: TodoPatchInput) => {
      const nowIso = new Date().toISOString();
      commitItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const nextTitle =
            patch.title !== undefined ? sanitizeText(patch.title, 160) || item.title : item.title;
          const nextMemo =
            patch.memo !== undefined ? sanitizeText(patch.memo, 400) : item.memo;
          const nextDueDate =
            patch.dueDate !== undefined
              ? isValidDateString(patch.dueDate)
                ? patch.dueDate
                : null
              : item.dueDate;

          return {
            ...item,
            title: nextTitle,
            memo: nextMemo,
            priority: patch.priority ?? item.priority,
            category: patch.category ?? item.category,
            dueDate: nextDueDate,
            updatedAt: nowIso,
          };
        })
      );
    },
    [commitItems]
  );

  /**
   * Soft Delete: 즉시 영구 삭제하지 않고 isDeleted=true 로 전환해 5초 Undo 및 휴지통 복구 제공
   */
  const softDeleteTodo = useCallback(
    (id: string) => {
      const deletedTarget = itemsRef.current.find((item) => item.id === id && !item.isDeleted) || null;
      if (!deletedTarget) return;

      const nowIso = new Date().toISOString();
      commitItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isDeleted: true,
                deletedAt: nowIso,
                updatedAt: nowIso,
              }
            : item
        )
      );

      setLastDeletedItem(deletedTarget);
      clearUndoTimer();
      undoTimerRef.current = setTimeout(() => {
        setLastDeletedItem(null);
        undoTimerRef.current = null;
      }, 5000);
    },
    [clearUndoTimer, commitItems]
  );

  const restoreTodo = useCallback(
    (id: string) => {
      const nowIso = new Date().toISOString();
      commitItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isDeleted: false,
                deletedAt: null,
                updatedAt: nowIso,
              }
            : item
        )
      );
      setLastDeletedItem((prev) => (prev && prev.id === id ? null : prev));
    },
    [commitItems]
  );

  const undoLastDelete = useCallback(() => {
    if (!lastDeletedItem) return false;
    const targetId = lastDeletedItem.id;
    clearUndoTimer();
    setLastDeletedItem(null);
    restoreTodo(targetId);
    return true;
  }, [clearUndoTimer, lastDeletedItem, restoreTodo]);

  const dismissUndoToast = useCallback(() => {
    clearUndoTimer();
    setLastDeletedItem(null);
  }, [clearUndoTimer]);

  const restoreAllTrash = useCallback(() => {
    const nowIso = new Date().toISOString();
    commitItems((prev) =>
      prev.map((item) =>
        item.isDeleted
          ? {
              ...item,
              isDeleted: false,
              deletedAt: null,
              updatedAt: nowIso,
            }
          : item
      )
    );
  }, [commitItems]);

  const softDeleteCompleted = useCallback(() => {
    const nowIso = new Date().toISOString();
    commitItems((prev) =>
      prev.map((item) =>
        !item.isDeleted && item.completed
          ? {
              ...item,
              isDeleted: true,
              deletedAt: nowIso,
              updatedAt: nowIso,
            }
          : item
      )
    );
  }, [commitItems]);

  const moveTodoOrder = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const nowIso = new Date().toISOString();
      commitItems((prev) => {
        const activeSorted = prev
          .filter((item) => !item.isDeleted)
          .sort((a, b) => a.order - b.order);
        const index = activeSorted.findIndex((item) => item.id === id);
        if (index < 0) return prev;
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= activeSorted.length) return prev;

        const reordered = [...activeSorted];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(swapIndex, 0, moved);

        const orderMap = new Map<string, number>();
        reordered.forEach((item, idx) => {
          orderMap.set(item.id, idx);
        });

        return prev.map((item) => {
          const nextOrder = orderMap.get(item.id);
          return nextOrder !== undefined
            ? { ...item, order: nextOrder, updatedAt: nowIso }
            : item;
        });
      });
    },
    [commitItems]
  );

  const addSubtask = useCallback(
    (todoId: string, rawTitle: string) => {
      const title = sanitizeText(rawTitle, 120);
      if (!title) return;
      const nowIso = new Date().toISOString();

      commitItems((prev) =>
        prev.map((item) => {
          if (item.id !== todoId || item.subtasks.length >= TODO_MAX_SUBTASKS) return item;
          const nextSub: TodoSubtask = {
            id: createUniqueId('sub'),
            title,
            completed: false,
          };
          return {
            ...item,
            subtasks: [...item.subtasks, nextSub],
            updatedAt: nowIso,
          };
        })
      );
    },
    [commitItems]
  );

  const toggleSubtask = useCallback(
    (todoId: string, subId: string) => {
      const nowIso = new Date().toISOString();
      commitItems((prev) =>
        prev.map((item) => {
          if (item.id !== todoId) return item;
          return {
            ...item,
            subtasks: item.subtasks.map((sub) =>
              sub.id === subId ? { ...sub, completed: !sub.completed } : sub
            ),
            updatedAt: nowIso,
          };
        })
      );
    },
    [commitItems]
  );

  const removeSubtask = useCallback(
    (todoId: string, subId: string) => {
      const nowIso = new Date().toISOString();
      commitItems((prev) =>
        prev.map((item) => {
          if (item.id !== todoId) return item;
          return {
            ...item,
            subtasks: item.subtasks.filter((sub) => sub.id !== subId),
            updatedAt: nowIso,
          };
        })
      );
    },
    [commitItems]
  );

  const importBackupJson = useCallback(
    (rawJson: string): { ok: boolean; count: number } => {
      const parsed = parseValidatedBackupPayload(rawJson);
      if (!parsed) return { ok: false, count: 0 };

      commitItems((prev) => {
        const existingMap = new Map<string, TodoItem>();
        prev.forEach((item) => existingMap.set(item.id, item));
        parsed.forEach((item) => existingMap.set(item.id, item));
        return Array.from(existingMap.values()).slice(0, TODO_MAX_ITEMS);
      });

      return { ok: true, count: parsed.length };
    },
    [commitItems]
  );

  const resetFilters = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  const activeItems = useMemo(
    () => items.filter((item) => !item.isDeleted),
    [items]
  );

  const trashItems = useMemo(
    () =>
      items
        .filter((item) => item.isDeleted)
        .sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || '')),
    [items]
  );

  const filteredTodos = useMemo(() => {
    const todayStr = getLocalDateString();
    const query = filter.searchQuery.trim().toLowerCase();

    const filtered = activeItems.filter((item) => {
      if (filter.status === 'active' && item.completed) return false;
      if (filter.status === 'completed' && !item.completed) return false;
      if (filter.status === 'today' && item.dueDate !== todayStr) return false;
      if (filter.category !== 'all' && item.category !== filter.category) return false;
      if (filter.priority !== 'all' && item.priority !== filter.priority) return false;
      if (query) {
        const haystack = `${item.title} ${item.memo}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (filter.sortBy === 'priority') {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const diff = PRIORITY_MAP[b.priority].weight - PRIORITY_MAP[a.priority].weight;
        if (diff !== 0) return diff;
        return a.order - b.order;
      }

      if (filter.sortBy === 'dueDate') {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        return a.order - b.order;
      }

      if (filter.sortBy === 'createdAt') {
        return b.createdAt.localeCompare(a.createdAt);
      }

      // 기본값 'manual'
      return a.order - b.order;
    });
  }, [activeItems, filter]);

  const stats = useMemo(() => computeTodoStats(items), [items]);

  return {
    allItems: items,
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
  };
}
