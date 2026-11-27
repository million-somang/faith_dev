import type { Context } from 'hono';
import type { SessionUser } from '../middleware/auth.js';
import {
  TodoService,
  TodoServiceError,
  type ImportTodoInput,
  type TodoCategory,
  type TodoPriority,
  type TodoSubtaskDto,
} from '../services/todo.service.js';
import {
  getKstTodayDateStr,
  isValidDateStr,
  type RecurrenceType,
  type TodoRecurrenceRule,
} from '../utils/todoRecurrence.js';

const VALID_PRIORITIES = new Set<TodoPriority>(['urgent', 'important', 'normal']);
const VALID_CATEGORIES = new Set<TodoCategory>(['work', 'personal', 'shopping', 'health', 'study']);
const VALID_RECURRENCE_TYPES = new Set<RecurrenceType>(['none', 'daily', 'workday', 'weekly', 'monthly', 'yearly']);
const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const VALID_REMIND_BEFORE = new Set([0, 5, 10, 30, 60]);

function parseDueTimeInput(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'string') {
    throw new TodoServiceError(400, '알림/마감 시각 형식이 올바르지 않습니다.');
  }
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (!HHMM_REGEX.test(trimmed)) {
    throw new TodoServiceError(400, '시각은 HH:MM (00:00~23:59) 형식이어야 합니다.');
  }
  return trimmed;
}

function parseRemindBeforeInput(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const num = Number(raw);
  if (!Number.isInteger(num) || !VALID_REMIND_BEFORE.has(num)) {
    throw new TodoServiceError(400, '알림 시점은 정시(0), 5분, 10분, 30분, 60분 전 중 하나여야 합니다.');
  }
  return num;
}

function getAuthUserId(c: Context): number | null {
  const user = c.get('user') as SessionUser | undefined;
  if (!user || typeof user.id !== 'number') return null;
  return user.id;
}

async function readJsonBody(c: Context): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await c.req.json();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function resolveTargetDate(c: Context, body?: Record<string, unknown>): string {
  const fromQuery = c.req.query('date');
  if (typeof fromQuery === 'string' && isValidDateStr(fromQuery)) {
    return fromQuery;
  }
  const fromBody = body?.date;
  if (typeof fromBody === 'string' && isValidDateStr(fromBody)) {
    return fromBody;
  }
  return getKstTodayDateStr();
}

function parseRecurrenceInput(raw: unknown): Partial<TodoRecurrenceRule> | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TodoServiceError(400, '반복 규칙 형식이 올바르지 않습니다.');
  }
  const obj = raw as Record<string, unknown>;
  const typeRaw = typeof obj.type === 'string' ? obj.type : 'none';
  if (!VALID_RECURRENCE_TYPES.has(typeRaw as RecurrenceType)) {
    throw new TodoServiceError(400, '지원하지 않는 반복 유형입니다.');
  }

  let weekdays: number[] | null = null;
  if (obj.weekdays !== undefined && obj.weekdays !== null) {
    if (!Array.isArray(obj.weekdays)) {
      throw new TodoServiceError(400, '주간 반복 요일 형식이 올바르지 않습니다.');
    }
    weekdays = obj.weekdays.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  }

  let endDate: string | null = null;
  if (typeof obj.endDate === 'string' && obj.endDate.trim() !== '') {
    if (!isValidDateStr(obj.endDate.trim())) {
      throw new TodoServiceError(400, '반복 종료일 형식(YYYY-MM-DD)이 올바르지 않습니다.');
    }
    endDate = obj.endDate.trim();
  }

  return {
    type: typeRaw as RecurrenceType,
    interval: obj.interval !== undefined ? Number(obj.interval) : 1,
    weekdays,
    monthDay: obj.monthDay !== undefined && obj.monthDay !== null ? Number(obj.monthDay) : null,
    yearMonth: obj.yearMonth !== undefined && obj.yearMonth !== null ? Number(obj.yearMonth) : null,
    yearDay: obj.yearDay !== undefined && obj.yearDay !== null ? Number(obj.yearDay) : null,
    endDate,
  };
}

function parseSubtasksInput(raw: unknown): TodoSubtaskDto[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    throw new TodoServiceError(400, '세부 할 일 목록 형식이 올바르지 않습니다.');
  }
  const result: TodoSubtaskDto[] = [];
  for (let i = 0; i < raw.length && result.length < 30; i += 1) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const title = typeof rec.title === 'string' ? rec.title.trim().slice(0, 120) : '';
    if (!title) continue;
    result.push({
      id: typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim().slice(0, 64) : `sub_${Date.now()}_${i}`,
      title,
      completed: Boolean(rec.completed),
    });
  }
  return result;
}

function handleControllerError(c: Context, err: unknown, fallbackMessage: string) {
  if (err instanceof TodoServiceError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.statusCode,
          message: err.message,
        },
      },
      err.statusCode as 400 | 404 | 409 | 500
    );
  }
  const message = err instanceof Error ? err.message : fallbackMessage;
  console.error('[TodoController] Unexpected error:', err);
  return c.json(
    {
      success: false,
      error: {
        code: 500,
        message,
      },
    },
    500
  );
}

export class TodoController {
  static async list(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const targetDate = resolveTargetDate(c);
      const includeTrash = c.req.query('includeTrash') === '1' || c.req.query('includeTrash') === 'true';
      const data = await TodoService.listTodos(userId, targetDate, includeTrash);
      return c.json({ success: true, data });
    } catch (err) {
      return handleControllerError(c, err, '할 일 목록을 불러오지 못했습니다.');
    }
  }

  static async create(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const body = await readJsonBody(c);
      const targetDate = resolveTargetDate(c, body);

      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) {
        return c.json({ success: false, error: { code: 400, message: '할 일 제목을 입력해 주세요.' } }, 400);
      }

      const priority: TodoPriority =
        typeof body.priority === 'string' && VALID_PRIORITIES.has(body.priority as TodoPriority)
          ? (body.priority as TodoPriority)
          : 'normal';

      const category: TodoCategory =
        typeof body.category === 'string' && VALID_CATEGORIES.has(body.category as TodoCategory)
          ? (body.category as TodoCategory)
          : 'personal';

      let dueDate: string | null = null;
      if (typeof body.dueDate === 'string' && body.dueDate.trim() !== '') {
        if (!isValidDateStr(body.dueDate.trim())) {
          return c.json(
            { success: false, error: { code: 400, message: '마감일 형식(YYYY-MM-DD)이 올바르지 않습니다.' } },
            400
          );
        }
        dueDate = body.dueDate.trim();
      }

      const dueTime = parseDueTimeInput(body.dueTime) ?? null;
      const reminderEnabled = dueTime ? Boolean(body.reminderEnabled) : false;
      const remindBeforeMinutes = parseRemindBeforeInput(body.remindBeforeMinutes) ?? 0;

      const recurrence = parseRecurrenceInput(body.recurrence);
      const subtasks = parseSubtasksInput(body.subtasks);

      const created = await TodoService.createTodo(
        userId,
        {
          title,
          memo: typeof body.memo === 'string' ? body.memo : '',
          priority,
          category,
          dueDate,
          dueTime,
          reminderEnabled,
          remindBeforeMinutes,
          subtasks,
          recurrence,
        },
        targetDate
      );

      return c.json({ success: true, data: { item: created } }, 201);
    } catch (err) {
      return handleControllerError(c, err, '할 일을 저장하지 못했습니다.');
    }
  }

  static async update(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const id = c.req.param('id')?.trim() || '';
      if (!id || id.length > 80) {
        return c.json({ success: false, error: { code: 400, message: '올바른 할 일 ID가 필요합니다.' } }, 400);
      }

      const body = await readJsonBody(c);
      const targetDate = resolveTargetDate(c, body);

      if (body.priority !== undefined) {
        if (typeof body.priority !== 'string' || !VALID_PRIORITIES.has(body.priority as TodoPriority)) {
          return c.json({ success: false, error: { code: 400, message: '우선순위 값이 올바르지 않습니다.' } }, 400);
        }
      }
      if (body.category !== undefined) {
        if (typeof body.category !== 'string' || !VALID_CATEGORIES.has(body.category as TodoCategory)) {
          return c.json({ success: false, error: { code: 400, message: '카테고리 값이 올바르지 않습니다.' } }, 400);
        }
      }

      let dueDatePatch: string | null | undefined = undefined;
      if (body.dueDate !== undefined) {
        if (body.dueDate === null || body.dueDate === '') {
          dueDatePatch = null;
        } else if (typeof body.dueDate === 'string' && isValidDateStr(body.dueDate.trim())) {
          dueDatePatch = body.dueDate.trim();
        } else {
          return c.json(
            { success: false, error: { code: 400, message: '마감일 형식(YYYY-MM-DD)이 올바르지 않습니다.' } },
            400
          );
        }
      }

      const dueTimePatch = parseDueTimeInput(body.dueTime);
      const reminderEnabledPatch =
        body.reminderEnabled !== undefined ? Boolean(body.reminderEnabled) : undefined;
      const remindBeforePatch = parseRemindBeforeInput(body.remindBeforeMinutes);

      const recurrence = parseRecurrenceInput(body.recurrence);
      const subtasks = parseSubtasksInput(body.subtasks);

      const updated = await TodoService.updateTodo(
        userId,
        id,
        {
          title: typeof body.title === 'string' ? body.title : undefined,
          memo: typeof body.memo === 'string' ? body.memo : undefined,
          priority: typeof body.priority === 'string' ? (body.priority as TodoPriority) : undefined,
          category: typeof body.category === 'string' ? (body.category as TodoCategory) : undefined,
          dueDate: dueDatePatch,
          dueTime: dueTimePatch,
          reminderEnabled: reminderEnabledPatch,
          remindBeforeMinutes: remindBeforePatch,
          subtasks,
          order: typeof body.order === 'number' ? body.order : undefined,
          recurrence,
        },
        targetDate
      );

      if (!updated) {
        return c.json({ success: false, error: { code: 404, message: '해당 할 일을 찾을 수 없습니다.' } }, 404);
      }
      return c.json({ success: true, data: { item: updated } });
    } catch (err) {
      return handleControllerError(c, err, '할 일을 수정하지 못했습니다.');
    }
  }

  static async toggle(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const id = c.req.param('id')?.trim() || '';
      if (!id || id.length > 80) {
        return c.json({ success: false, error: { code: 400, message: '올바른 할 일 ID가 필요합니다.' } }, 400);
      }
      const body = await readJsonBody(c);
      const targetDate = resolveTargetDate(c, body);

      const item = await TodoService.toggleTodo(userId, id, targetDate);
      if (!item) {
        return c.json({ success: false, error: { code: 404, message: '해당 할 일을 찾을 수 없습니다.' } }, 404);
      }
      return c.json({ success: true, data: { item } });
    } catch (err) {
      return handleControllerError(c, err, '완료 상태 변경에 실패했습니다.');
    }
  }

  static async softDelete(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const id = c.req.param('id')?.trim() || '';
      if (!id || id.length > 80) {
        return c.json({ success: false, error: { code: 400, message: '올바른 할 일 ID가 필요합니다.' } }, 400);
      }
      const removed = await TodoService.softDeleteTodo(userId, id);
      if (!removed) {
        return c.json({ success: false, error: { code: 404, message: '삭제할 할 일을 찾을 수 없습니다.' } }, 404);
      }
      return c.json({ success: true, data: { id, isDeleted: true } });
    } catch (err) {
      return handleControllerError(c, err, '할 일을 휴지통으로 이동하지 못했습니다.');
    }
  }

  static async restore(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const id = c.req.param('id')?.trim() || '';
      if (!id || id.length > 80) {
        return c.json({ success: false, error: { code: 400, message: '올바른 할 일 ID가 필요합니다.' } }, 400);
      }
      const body = await readJsonBody(c);
      const targetDate = resolveTargetDate(c, body);

      const item = await TodoService.restoreTodo(userId, id, targetDate);
      if (!item) {
        return c.json({ success: false, error: { code: 404, message: '복원할 할 일을 찾을 수 없습니다.' } }, 404);
      }
      return c.json({ success: true, data: { item } });
    } catch (err) {
      return handleControllerError(c, err, '할 일 복원에 실패했습니다.');
    }
  }

  static async restoreAll(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const restoredCount = await TodoService.restoreAllTrash(userId);
      return c.json({ success: true, data: { restoredCount } });
    } catch (err) {
      return handleControllerError(c, err, '휴지통 복원에 실패했습니다.');
    }
  }

  static async softDeleteCompleted(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const clearedCount = await TodoService.softDeleteCompletedOneOffs(userId);
      return c.json({ success: true, data: { clearedCount } });
    } catch (err) {
      return handleControllerError(c, err, '완료 항목 정리에 실패했습니다.');
    }
  }

  static async importItems(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const body = await readJsonBody(c);
      const targetDate = resolveTargetDate(c, body);
      const itemsRaw = Array.isArray(body.items) ? (body.items as ImportTodoInput[]) : [];
      if (itemsRaw.length === 0) {
        return c.json({ success: false, error: { code: 400, message: '이관할 항목 배열이 비어 있습니다.' } }, 400);
      }
      const result = await TodoService.importTodos(userId, itemsRaw, targetDate);
      return c.json({ success: true, data: result });
    } catch (err) {
      return handleControllerError(c, err, '할 일 백업/로컬 이관에 실패했습니다.');
    }
  }

  static async listCompletionLogs(c: Context) {
    try {
      const userId = getAuthUserId(c);
      if (!userId) {
        return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
      }
      const rawDays = c.req.query('days');
      const parsedDays = rawDays !== undefined ? Number(rawDays) : 365;
      if (rawDays !== undefined && (!Number.isFinite(parsedDays) || parsedDays <= 0)) {
        return c.json(
          { success: false, error: { code: 400, message: 'days 파라미터는 양의 정수여야 합니다.' } },
          400
        );
      }
      const days = Math.min(1095, Math.max(1, Math.round(parsedDays)));
      const logs = await TodoService.listCompletionLogs(userId, days);
      return c.json({ success: true, data: { logs } });
    } catch (err) {
      return handleControllerError(c, err, '완료 이력 조회에 실패했습니다.');
    }
  }
}
