import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PRIORITY_MAP,
  TODO_MAX_ITEMS,
  TODO_MAX_SUBTASKS,
  TODO_MIGRATED_MARKER_KEY,
  TODO_STORAGE_KEY,
} from '../constants/todoMeta';
import {
  broadcastTodoSync,
  subscribeTodoSync,
  todoApi,
} from '../services/todoApi';
import type {
  StoredTodoEnvelope,
  TodoDraftInput,
  TodoFilterState,
  TodoItem,
  TodoPatchInput,
  TodoSubtask,
} from '../types/todo';
import {
  evaluateTodoOccurrence,
  getLocalTodayDateStr,
  getPreviousPeriodKey,
  normalizeRecurrenceRule,
} from '../utils/recurrence';
import { safeStorage } from '../utils/safeStorage';
import {
  isValidDateString,
  parseValidatedBackupPayload,
  sanitizeText,
  sanitizeTodoRecord,
} from '../utils/security';
import {
  computeTodoStats,
  getLocalDateString,
  hydrateTodoOccurrence,
} from '../utils/todoAnalytics';

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

function persistLocalTodos(items: readonly TodoItem[]): boolean {
  const envelope: StoredTodoEnvelope = {
    schemaVersion: 2,
    items,
  };
  const ok = safeStorage.set(TODO_STORAGE_KEY, envelope);
  broadcastTodoSync();
  return ok;
}

interface UseTodosOptions {
  readonly isAuthenticated: boolean;
  readonly isCheckingAuth: boolean;
  readonly userId: number | null;
}

export function useTodos({ isAuthenticated, isCheckingAuth, userId }: UseTodosOptions) {
  const [items, setItems] = useState<TodoItem[]>(() => readStoredTodos());
  const itemsRef = useRef<TodoItem[]>(items);
  itemsRef.current = items;

  const [filter, setFilter] = useState<TodoFilterState>(DEFAULT_FILTER);
  const [lastDeletedItem, setLastDeletedItem] = useState<TodoItem | null>(null);
  const [storageWarning, setStorageWarning] = useState<boolean>(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [migrationDismissed, setMigrationDismissed] = useState<boolean>(false);
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

  const refreshFromDb = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingRemote(true);
    try {
      const todayStr = getLocalTodayDateStr();
      const res = await todoApi.list(true, todayStr);
      const merged = [...res.items, ...res.trash];
      itemsRef.current = merged;
      setItems(merged);
      setSyncError(null);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'DB 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingRemote(false);
    }
  }, [isAuthenticated]);

  const syncFromLocal = useCallback(() => {
    const todayStr = getLocalTodayDateStr();
    const next = readStoredTodos().map((item) => hydrateTodoOccurrence(item, todayStr));
    itemsRef.current = next;
    setItems(next);
  }, []);

  // 인증 상태 전환 시 DB 또는 로컬에서 초기 로드
  useEffect(() => {
    if (isCheckingAuth) return;
    if (isAuthenticated) {
      void refreshFromDb();
    } else {
      syncFromLocal();
    }
  }, [isAuthenticated, isCheckingAuth, refreshFromDb, syncFromLocal]);

  // 마이페이지·다른 탭·팝업 간 실시간 2-Way 동기화
  useEffect(() => {
    const handleSyncSignal = () => {
      if (isAuthenticated) {
        void refreshFromDb();
      } else {
        syncFromLocal();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (!isAuthenticated && e.key === TODO_STORAGE_KEY) {
        syncFromLocal();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleSyncSignal();
      }
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (
        e.data &&
        typeof e.data === 'object' &&
        (e.data as { type?: string }).type === 'TODO_UPDATED'
      ) {
        handleSyncSignal();
      }
    };

    const unsubBroadcast = subscribeTodoSync(handleSyncSignal);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleSyncSignal);
    window.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubBroadcast();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleSyncSignal);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, refreshFromDb, syncFromLocal]);

  const commitLocalItems = useCallback((updater: (prev: readonly TodoItem[]) => readonly TodoItem[]) => {
    const todayStr = getLocalTodayDateStr();
    const next = [...updater(itemsRef.current)].map((item) => hydrateTodoOccurrence(item, todayStr));
    itemsRef.current = next;
    setItems(next);
    const saved = persistLocalTodos(next);
    setStorageWarning(!saved);
  }, []);

  const addTodo = useCallback(
    (draft: TodoDraftInput): { added: TodoItem | null; allCompletedNow: boolean } => {
      const title = sanitizeText(draft.title, 160);
      if (!title) return { added: null, allCompletedNow: false };

      const memo = draft.memo ? sanitizeText(draft.memo, 400) : '';
      const todayStr = getLocalTodayDateStr();
      const rawDueDate = isValidDateString(draft.dueDate) ? draft.dueDate : null;
      const anchorDate = rawDueDate ?? todayStr;
      const rule = normalizeRecurrenceRule(draft.recurrence, anchorDate);
      const dueDate = rule.type !== 'none' && !rawDueDate ? todayStr : rawDueDate;

      const nowIso = new Date().toISOString();
      const minOrder = itemsRef.current.reduce((min, item) => Math.min(min, item.order), 0);
      const occurrence = evaluateTodoOccurrence({
        rule,
        anchorDate: dueDate ?? todayStr,
        lastCompletedPeriod: null,
        completed: false,
        targetDate: todayStr,
      });

      const tempId = createUniqueId('todo');
      const optimisticItem: TodoItem = {
        id: tempId,
        title,
        memo,
        priority: draft.priority,
        category: draft.category,
        dueDate,
        completed: false,
        completedAt: null,
        subtasks: [],
        order: minOrder - 1,
        recurrence: rule,
        lastCompletedPeriod: null,
        streakCount: 0,
        occurrence,
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
        deletedAt: null,
      };

      if (!isAuthenticated) {
        commitLocalItems((prev) => [optimisticItem, ...prev].slice(0, TODO_MAX_ITEMS));
        return { added: optimisticItem, allCompletedNow: false };
      }

      const nextOptimistic = [optimisticItem, ...itemsRef.current].slice(0, TODO_MAX_ITEMS);
      itemsRef.current = nextOptimistic;
      setItems(nextOptimistic);

      void (async () => {
        try {
          const created = await todoApi.create(
            {
              title,
              memo,
              priority: draft.priority,
              category: draft.category,
              dueDate,
              recurrence: rule,
            },
            todayStr
          );
          const reconciled = itemsRef.current.map((item) => (item.id === tempId ? created : item));
          itemsRef.current = reconciled;
          setItems(reconciled);
          setSyncError(null);
          broadcastTodoSync();
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : '할 일 저장에 실패했습니다.');
          void refreshFromDb();
        }
      })();

      return { added: optimisticItem, allCompletedNow: false };
    },
    [commitLocalItems, isAuthenticated, refreshFromDb]
  );

  const toggleTodo = useCallback(
    (id: string): { completed: boolean; allCompletedNow: boolean } => {
      const target = itemsRef.current.find((item) => item.id === id);
      if (!target) return { completed: false, allCompletedNow: false };

      const todayStr = getLocalTodayDateStr();
      const nowIso = new Date().toISOString();
      const nextDone = !target.completed;
      const anchorDate =
        target.dueDate && isValidDateString(target.dueDate)
          ? target.dueDate
          : target.createdAt.slice(0, 10) || todayStr;

      const updatedNext = itemsRef.current.map((item) => {
        if (item.id !== id) return item;
        if (item.recurrence.type === 'none') {
          return {
            ...item,
            completed: nextDone,
            completedAt: nextDone ? nowIso : null,
            occurrence: {
              ...item.occurrence,
              isCompletedForPeriod: nextDone,
            },
            updatedAt: nowIso,
          };
        }

        const periodKey = item.occurrence.currentPeriodKey || todayStr;
        const nextPeriod = nextDone ? periodKey : null;
        const prevPeriodKey = getPreviousPeriodKey(item.recurrence, anchorDate, periodKey);
        const nextStreak = nextDone
          ? prevPeriodKey && item.lastCompletedPeriod === prevPeriodKey
            ? item.streakCount + 1
            : 1
          : Math.max(0, item.streakCount - 1);

        const nextOcc = evaluateTodoOccurrence({
          rule: item.recurrence,
          anchorDate,
          lastCompletedPeriod: nextPeriod,
          completed: nextDone,
          targetDate: todayStr,
        });

        return {
          ...item,
          completed: nextDone,
          completedAt: nextDone ? nowIso : null,
          lastCompletedPeriod: nextPeriod,
          streakCount: nextStreak,
          occurrence: nextOcc,
          updatedAt: nowIso,
        };
      });

      const active = updatedNext.filter((item) => !item.isDeleted);
      const allCompletedNow =
        nextDone && active.length > 0 && active.every((item) => item.completed);

      itemsRef.current = updatedNext;
      setItems(updatedNext);

      if (!isAuthenticated) {
        const saved = persistLocalTodos(updatedNext);
        setStorageWarning(!saved);
      } else {
        void (async () => {
          try {
            const serverItem = await todoApi.toggle(id, todayStr);
            const reconciled = itemsRef.current.map((item) => (item.id === id ? serverItem : item));
            itemsRef.current = reconciled;
            setItems(reconciled);
            setSyncError(null);
            broadcastTodoSync();
          } catch (err) {
            setSyncError(err instanceof Error ? err.message : '완료 상태 저장에 실패했습니다.');
            void refreshFromDb();
          }
        })();
      }

      return { completed: nextDone, allCompletedNow };
    },
    [isAuthenticated, refreshFromDb]
  );

  const updateTodo = useCallback(
    (id: string, patch: TodoPatchInput) => {
      const nowIso = new Date().toISOString();
      const todayStr = getLocalTodayDateStr();

      if (!isAuthenticated) {
        commitLocalItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            const nextTitle =
              patch.title !== undefined ? sanitizeText(patch.title, 160) || item.title : item.title;
            const nextMemo = patch.memo !== undefined ? sanitizeText(patch.memo, 400) : item.memo;
            const nextDueDate =
              patch.dueDate !== undefined
                ? isValidDateString(patch.dueDate)
                  ? patch.dueDate
                  : null
                : item.dueDate;
            const anchor = nextDueDate ?? item.createdAt.slice(0, 10) ?? todayStr;
            const nextRecurrence =
              patch.recurrence !== undefined
                ? normalizeRecurrenceRule(patch.recurrence, anchor)
                : item.recurrence;

            return {
              ...item,
              title: nextTitle,
              memo: nextMemo,
              priority: patch.priority ?? item.priority,
              category: patch.category ?? item.category,
              dueDate: nextDueDate,
              subtasks: patch.subtasks ?? item.subtasks,
              order: patch.order ?? item.order,
              recurrence: nextRecurrence,
              updatedAt: nowIso,
            };
          })
        );
        return;
      }

      const nextOptimistic = itemsRef.current.map((item) => {
        if (item.id !== id) return item;
        const nextDueDate = patch.dueDate !== undefined ? patch.dueDate : item.dueDate;
        const anchor = nextDueDate ?? item.createdAt.slice(0, 10) ?? todayStr;
        const nextRecurrence =
          patch.recurrence !== undefined
            ? normalizeRecurrenceRule(patch.recurrence, anchor)
            : item.recurrence;

        return hydrateTodoOccurrence(
          {
            ...item,
            title: patch.title !== undefined ? sanitizeText(patch.title, 160) || item.title : item.title,
            memo: patch.memo !== undefined ? sanitizeText(patch.memo, 400) : item.memo,
            priority: patch.priority ?? item.priority,
            category: patch.category ?? item.category,
            dueDate: nextDueDate,
            subtasks: patch.subtasks ?? item.subtasks,
            order: patch.order ?? item.order,
            recurrence: nextRecurrence,
            updatedAt: nowIso,
          },
          todayStr
        );
      });
      itemsRef.current = nextOptimistic;
      setItems(nextOptimistic);

      void (async () => {
        try {
          const updated = await todoApi.update(id, patch, todayStr);
          const reconciled = itemsRef.current.map((item) => (item.id === id ? updated : item));
          itemsRef.current = reconciled;
          setItems(reconciled);
          setSyncError(null);
          broadcastTodoSync();
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : '할 일 수정 저장에 실패했습니다.');
          void refreshFromDb();
        }
      })();
    },
    [commitLocalItems, isAuthenticated, refreshFromDb]
  );

  const softDeleteTodo = useCallback(
    (id: string) => {
      const deletedTarget = itemsRef.current.find((item) => item.id === id && !item.isDeleted) || null;
      if (!deletedTarget) return;

      const nowIso = new Date().toISOString();
      const applySoftDelete = (list: readonly TodoItem[]) =>
        list.map((item) =>
          item.id === id
            ? {
                ...item,
                isDeleted: true,
                deletedAt: nowIso,
                updatedAt: nowIso,
              }
            : item
        );

      if (!isAuthenticated) {
        commitLocalItems(applySoftDelete);
      } else {
        const next = applySoftDelete(itemsRef.current);
        itemsRef.current = next;
        setItems(next);
        void (async () => {
          try {
            await todoApi.softDelete(id);
            setSyncError(null);
            broadcastTodoSync();
          } catch (err) {
            setSyncError(err instanceof Error ? err.message : '삭제 처리에 실패했습니다.');
            void refreshFromDb();
          }
        })();
      }

      setLastDeletedItem(deletedTarget);
      clearUndoTimer();
      undoTimerRef.current = setTimeout(() => {
        setLastDeletedItem(null);
        undoTimerRef.current = null;
      }, 5000);
    },
    [clearUndoTimer, commitLocalItems, isAuthenticated, refreshFromDb]
  );

  const restoreTodo = useCallback(
    (id: string) => {
      const nowIso = new Date().toISOString();
      const todayStr = getLocalTodayDateStr();
      const applyRestore = (list: readonly TodoItem[]) =>
        list.map((item) =>
          item.id === id
            ? {
                ...item,
                isDeleted: false,
                deletedAt: null,
                updatedAt: nowIso,
              }
            : item
        );

      if (!isAuthenticated) {
        commitLocalItems(applyRestore);
      } else {
        const next = applyRestore(itemsRef.current);
        itemsRef.current = next;
        setItems(next);
        void (async () => {
          try {
            const restored = await todoApi.restore(id, todayStr);
            const reconciled = itemsRef.current.map((item) => (item.id === id ? restored : item));
            itemsRef.current = reconciled;
            setItems(reconciled);
            setSyncError(null);
            broadcastTodoSync();
          } catch (err) {
            setSyncError(err instanceof Error ? err.message : '복원 처리에 실패했습니다.');
            void refreshFromDb();
          }
        })();
      }
      setLastDeletedItem((prev) => (prev && prev.id === id ? null : prev));
    },
    [commitLocalItems, isAuthenticated, refreshFromDb]
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
    const applyRestoreAll = (list: readonly TodoItem[]) =>
      list.map((item) =>
        item.isDeleted
          ? {
              ...item,
              isDeleted: false,
              deletedAt: null,
              updatedAt: nowIso,
            }
          : item
      );

    if (!isAuthenticated) {
      commitLocalItems(applyRestoreAll);
      return;
    }

    const next = applyRestoreAll(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
    void (async () => {
      try {
        await todoApi.restoreAll();
        broadcastTodoSync();
        await refreshFromDb();
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : '전체 복원에 실패했습니다.');
      }
    })();
  }, [commitLocalItems, isAuthenticated, refreshFromDb]);

  const softDeleteCompleted = useCallback(() => {
    const nowIso = new Date().toISOString();
    // 반복 루틴은 유지하고 완료된 1회성 항목만 휴지통으로 정리
    const applyClearCompleted = (list: readonly TodoItem[]) =>
      list.map((item) =>
        !item.isDeleted && item.completed && item.recurrence.type === 'none'
          ? {
              ...item,
              isDeleted: true,
              deletedAt: nowIso,
              updatedAt: nowIso,
            }
          : item
      );

    if (!isAuthenticated) {
      commitLocalItems(applyClearCompleted);
      return;
    }

    const next = applyClearCompleted(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
    void (async () => {
      try {
        await todoApi.softDeleteCompleted();
        broadcastTodoSync();
        await refreshFromDb();
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : '완료 항목 정리에 실패했습니다.');
      }
    })();
  }, [commitLocalItems, isAuthenticated, refreshFromDb]);

  const moveTodoOrder = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const nowIso = new Date().toISOString();
      const activeSorted = itemsRef.current
        .filter((item) => !item.isDeleted)
        .sort((a, b) => a.order - b.order);
      const index = activeSorted.findIndex((item) => item.id === id);
      if (index < 0) return;
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= activeSorted.length) return;

      const reordered = [...activeSorted];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(swapIndex, 0, moved);

      const orderMap = new Map<string, number>();
      reordered.forEach((item, idx) => {
        orderMap.set(item.id, idx);
      });

      const applyOrder = (list: readonly TodoItem[]) =>
        list.map((item) => {
          const nextOrder = orderMap.get(item.id);
          return nextOrder !== undefined ? { ...item, order: nextOrder, updatedAt: nowIso } : item;
        });

      if (!isAuthenticated) {
        commitLocalItems(applyOrder);
        return;
      }

      const next = applyOrder(itemsRef.current);
      itemsRef.current = next;
      setItems(next);
      const changed = reordered.filter((item, idx) => item.order !== idx);
      void (async () => {
        try {
          await Promise.all(changed.map((item) => todoApi.update(item.id, { order: orderMap.get(item.id) })));
          broadcastTodoSync();
        } catch {
          void refreshFromDb();
        }
      })();
    },
    [commitLocalItems, isAuthenticated, refreshFromDb]
  );

  const addSubtask = useCallback(
    (todoId: string, rawTitle: string) => {
      const title = sanitizeText(rawTitle, 120);
      if (!title) return;
      const target = itemsRef.current.find((item) => item.id === todoId);
      if (!target || target.subtasks.length >= TODO_MAX_SUBTASKS) return;

      const nextSub: TodoSubtask = {
        id: createUniqueId('sub'),
        title,
        completed: false,
      };
      updateTodo(todoId, { subtasks: [...target.subtasks, nextSub] });
    },
    [updateTodo]
  );

  const toggleSubtask = useCallback(
    (todoId: string, subId: string) => {
      const target = itemsRef.current.find((item) => item.id === todoId);
      if (!target) return;
      const nextSubtasks = target.subtasks.map((sub) =>
        sub.id === subId ? { ...sub, completed: !sub.completed } : sub
      );
      updateTodo(todoId, { subtasks: nextSubtasks });
    },
    [updateTodo]
  );

  const removeSubtask = useCallback(
    (todoId: string, subId: string) => {
      const target = itemsRef.current.find((item) => item.id === todoId);
      if (!target) return;
      const nextSubtasks = target.subtasks.filter((sub) => sub.id !== subId);
      updateTodo(todoId, { subtasks: nextSubtasks });
    },
    [updateTodo]
  );

  const importBackupJson = useCallback(
    (rawJson: string): { ok: boolean; count: number } => {
      const parsed = parseValidatedBackupPayload(rawJson);
      if (!parsed) return { ok: false, count: 0 };

      if (!isAuthenticated) {
        commitLocalItems((prev) => {
          const existingMap = new Map<string, TodoItem>();
          prev.forEach((item) => existingMap.set(item.id, item));
          parsed.forEach((item) => existingMap.set(item.id, item));
          return Array.from(existingMap.values()).slice(0, TODO_MAX_ITEMS);
        });
        return { ok: true, count: parsed.length };
      }

      void (async () => {
        try {
          const res = await todoApi.importItems(parsed, getLocalTodayDateStr());
          const merged = [...res.items, ...res.trash];
          itemsRef.current = merged;
          setItems(merged);
          broadcastTodoSync();
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : 'JSON 복원 저장에 실패했습니다.');
        }
      })();

      return { ok: true, count: parsed.length };
    },
    [commitLocalItems, isAuthenticated]
  );

  // 비회원 시절 로컬 데이터를 로그인 계정 DB로 1클릭 이관
  const pendingLocalItems = useMemo(() => {
    if (!isAuthenticated || !userId || migrationDismissed) return [];
    const marker = safeStorage.get<string>(TODO_MIGRATED_MARKER_KEY, '');
    if (marker === `u_${userId}`) return [];
    const localItems = readStoredTodos().filter((item) => !item.isDeleted);
    if (localItems.length === 0) return [];
    const existingIds = new Set(items.map((item) => item.id));
    return localItems.filter((item) => !existingIds.has(item.id));
  }, [isAuthenticated, items, migrationDismissed, userId]);

  const migrateLocalToDb = useCallback(async (): Promise<{ ok: boolean; count: number }> => {
    if (!isAuthenticated || !userId || pendingLocalItems.length === 0) {
      return { ok: false, count: 0 };
    }
    try {
      const res = await todoApi.importItems(pendingLocalItems, getLocalTodayDateStr());
      const merged = [...res.items, ...res.trash];
      itemsRef.current = merged;
      setItems(merged);
      safeStorage.set(TODO_MIGRATED_MARKER_KEY, `u_${userId}`);
      setMigrationDismissed(true);
      broadcastTodoSync();
      return { ok: true, count: res.importedCount };
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : '로컬 데이터 DB 이관에 실패했습니다.');
      return { ok: false, count: 0 };
    }
  }, [isAuthenticated, pendingLocalItems, userId]);

  const dismissLocalMigration = useCallback(() => {
    if (userId) {
      safeStorage.set(TODO_MIGRATED_MARKER_KEY, `u_${userId}`);
    }
    setMigrationDismissed(true);
  }, [userId]);

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
      if (filter.status === 'recurring' && item.recurrence.type === 'none') return false;
      if (filter.status === 'today') {
        const isRecurringToday = item.recurrence.type !== 'none' && item.occurrence.isDueToday;
        const isOneOffToday = item.recurrence.type === 'none' && item.dueDate === todayStr;
        if (!isRecurringToday && !isOneOffToday) return false;
      }
      if (filter.category !== 'all' && item.category !== filter.category) return false;
      if (filter.priority !== 'all' && item.priority !== filter.priority) return false;
      if (query) {
        const haystack = `${item.title} ${item.memo} ${item.occurrence.summaryLabel}`.toLowerCase();
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
        const aTarget = a.occurrence.nextOccurrenceDate ?? a.dueDate;
        const bTarget = b.occurrence.nextOccurrenceDate ?? b.dueDate;
        if (aTarget && bTarget && aTarget !== bTarget) {
          return aTarget.localeCompare(bTarget);
        }
        if (aTarget && !bTarget) return -1;
        if (!aTarget && bTarget) return 1;
        return a.order - b.order;
      }

      if (filter.sortBy === 'createdAt') {
        return b.createdAt.localeCompare(a.createdAt);
      }

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
    isLoadingRemote,
    syncError,
    pendingLocalMigrationCount: pendingLocalItems.length,
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
    refreshFromDb,
  };
}
