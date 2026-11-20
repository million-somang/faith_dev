import type { TodoDraftInput, TodoItem, TodoPatchInput } from '../types/todo';
import { getLocalTodayDateStr } from '../utils/recurrence';

const TODO_SYNC_CHANNEL_NAME = 'veranex_todo_sync';

interface ApiSuccess<T> {
  readonly success: true;
  readonly data: T;
}

interface ApiFailure {
  readonly success: false;
  readonly error?: { readonly code?: number; readonly message?: string };
  readonly message?: string;
}

export class TodoApiHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'TodoApiHttpError';
    this.status = status;
  }
}

async function requestApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  let body: (ApiSuccess<T> | ApiFailure) | null = null;
  try {
    body = (await res.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    body = null;
  }

  if (!res.ok || !body || !body.success) {
    const message =
      (body && !body.success ? body.error?.message || body.message : null) ||
      `요청 처리에 실패했습니다. (HTTP ${res.status})`;
    throw new TodoApiHttpError(res.status, message);
  }

  return body.data;
}

export function broadcastTodoSync(): void {
  if (typeof window === 'undefined') return;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(TODO_SYNC_CHANNEL_NAME);
      ch.postMessage({ type: 'SYNC_TODOS', timestamp: Date.now() });
      ch.close();
    }
  } catch {
    // BroadcastChannel 미지원 브라우저 무시
  }
  try {
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(
        { type: 'TODO_UPDATED', source: 'VERANEX_TODO', timestamp: Date.now() },
        window.location.origin
      );
    }
  } catch {
    // 오프너 postMessage 실패 무시
  }
}

export function subscribeTodoSync(onSync: () => void): () => void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {};
  }
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(TODO_SYNC_CHANNEL_NAME);
    channel.onmessage = () => {
      onSync();
    };
  } catch {
    return () => {};
  }
  return () => {
    channel?.close();
  };
}

export const todoApi = {
  async list(includeTrash = true, date = getLocalTodayDateStr()): Promise<{
    items: TodoItem[];
    trash: TodoItem[];
    date: string;
  }> {
    const query = new URLSearchParams({
      date,
      includeTrash: includeTrash ? '1' : '0',
    });
    return requestApi(`/api/todos?${query.toString()}`, { method: 'GET' });
  },

  async create(draft: TodoDraftInput, date = getLocalTodayDateStr()): Promise<TodoItem> {
    const data = await requestApi<{ item: TodoItem }>('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ ...draft, date }),
    });
    return data.item;
  },

  async update(id: string, patch: TodoPatchInput, date = getLocalTodayDateStr()): Promise<TodoItem> {
    const data = await requestApi<{ item: TodoItem }>(`/api/todos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...patch, date }),
    });
    return data.item;
  },

  async toggle(id: string, date = getLocalTodayDateStr()): Promise<TodoItem> {
    const data = await requestApi<{ item: TodoItem }>(
      `/api/todos/${encodeURIComponent(id)}/toggle`,
      {
        method: 'POST',
        body: JSON.stringify({ date }),
      }
    );
    return data.item;
  },

  async softDelete(id: string): Promise<{ id: string; isDeleted: boolean }> {
    return requestApi(`/api/todos/${encodeURIComponent(id)}/soft-delete`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async restore(id: string, date = getLocalTodayDateStr()): Promise<TodoItem> {
    const data = await requestApi<{ item: TodoItem }>(
      `/api/todos/${encodeURIComponent(id)}/restore`,
      {
        method: 'POST',
        body: JSON.stringify({ date }),
      }
    );
    return data.item;
  },

  async restoreAll(): Promise<{ restoredCount: number }> {
    return requestApi('/api/todos/restore-all', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async softDeleteCompleted(): Promise<{ clearedCount: number }> {
    return requestApi('/api/todos/soft-delete-completed', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async importItems(
    items: readonly Partial<TodoItem>[],
    date = getLocalTodayDateStr()
  ): Promise<{ importedCount: number; items: TodoItem[]; trash: TodoItem[] }> {
    return requestApi('/api/todos/import', {
      method: 'POST',
      body: JSON.stringify({ items, date }),
    });
  },
};
