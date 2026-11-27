import crypto from 'crypto';
import { pool } from '@faithportal/database';
import { NotificationService } from './notification.service.js';
import {
  evaluateTodoOccurrence,
  formatRecurrenceSummary,
  getKstTodayDateStr,
  getPreviousPeriodKey,
  isValidDateStr,
  normalizeRecurrenceRule,
  type RecurrenceType,
  type TodoOccurrenceState,
  type TodoRecurrenceRule,
} from '../utils/todoRecurrence.js';

export type TodoPriority = 'urgent' | 'important' | 'normal';
export type TodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'study';

export const TODO_MEMO_MAX_LEN = 2000;
const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const VALID_REMIND_BEFORE_MINUTES = new Set([0, 5, 10, 30, 60]);
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface TodoSubtaskDto {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

export interface TodoItemDto {
  readonly id: string;
  readonly title: string;
  readonly memo: string;
  readonly priority: TodoPriority;
  readonly category: TodoCategory;
  readonly dueDate: string | null;
  readonly dueTime: string | null;
  readonly reminderEnabled: boolean;
  readonly remindBeforeMinutes: number;
  readonly completed: boolean;
  readonly completedAt: string | null;
  readonly subtasks: readonly TodoSubtaskDto[];
  readonly order: number;
  readonly recurrence: TodoRecurrenceRule;
  readonly lastCompletedPeriod: string | null;
  readonly streakCount: number;
  readonly occurrence: TodoOccurrenceState;
  readonly isDeleted: boolean;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TodoCompletionLogDto {
  readonly id: number;
  readonly todoId: string;
  readonly periodKey: string;
  readonly completedAt: string;
}

export interface CreateTodoInput {
  readonly title: string;
  readonly memo?: string;
  readonly priority: TodoPriority;
  readonly category: TodoCategory;
  readonly dueDate: string | null;
  readonly dueTime?: string | null;
  readonly reminderEnabled?: boolean;
  readonly remindBeforeMinutes?: number;
  readonly subtasks?: readonly TodoSubtaskDto[];
  readonly recurrence?: Partial<TodoRecurrenceRule> | null;
}

export interface UpdateTodoInput {
  readonly title?: string;
  readonly memo?: string;
  readonly priority?: TodoPriority;
  readonly category?: TodoCategory;
  readonly dueDate?: string | null;
  readonly dueTime?: string | null;
  readonly reminderEnabled?: boolean;
  readonly remindBeforeMinutes?: number;
  readonly completed?: boolean;
  readonly subtasks?: readonly TodoSubtaskDto[];
  readonly order?: number;
  readonly recurrence?: Partial<TodoRecurrenceRule> | null;
}

export interface ImportTodoInput {
  readonly id?: string;
  readonly title: string;
  readonly memo?: string;
  readonly priority: TodoPriority;
  readonly category: TodoCategory;
  readonly dueDate: string | null;
  readonly dueTime?: string | null;
  readonly reminderEnabled?: boolean;
  readonly remindBeforeMinutes?: number;
  readonly completed?: boolean;
  readonly completedAt?: string | null;
  readonly subtasks?: readonly TodoSubtaskDto[];
  readonly order?: number;
  readonly recurrence?: Partial<TodoRecurrenceRule> | null;
  readonly lastCompletedPeriod?: string | null;
  readonly streakCount?: number;
  readonly isDeleted?: boolean;
  readonly deletedAt?: string | null;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

interface TodoRow {
  id: string;
  user_id: number;
  title: string;
  memo: string;
  priority: string;
  category: string;
  due_date: string | null;
  due_time: string | null;
  reminder_enabled: number;
  remind_before_minutes: number;
  completed: number;
  completed_at: string | null;
  subtasks_json: string;
  sort_order: number;
  recurrence_type: string;
  recurrence_interval: number;
  recurrence_weekdays: string | null;
  recurrence_month_day: number | null;
  recurrence_year_month: number | null;
  recurrence_year_day: number | null;
  recurrence_end_date: string | null;
  last_completed_period: string | null;
  streak_count: number;
  is_deleted: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeDueTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return HHMM_REGEX.test(trimmed) ? trimmed : null;
}

function normalizeRemindBeforeMinutes(value: unknown): number {
  const num = Number(value);
  return Number.isInteger(num) && VALID_REMIND_BEFORE_MINUTES.has(num) ? num : 0;
}

function parseKstDateTimeMs(dateStr: string, hhmm: string): number | null {
  if (!isValidDateStr(dateStr) || !HHMM_REGEX.test(hhmm)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm, 0, 0) - KST_OFFSET_MS;
}

function formatRemindLeadLabel(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes === 60) return '1시간 전';
  return `${minutes}분 전`;
}

export class TodoServiceError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'TodoServiceError';
    this.statusCode = statusCode;
  }
}

const VALID_PRIORITIES = new Set<TodoPriority>(['urgent', 'important', 'normal']);
const VALID_CATEGORIES = new Set<TodoCategory>(['work', 'personal', 'shopping', 'health', 'study']);

let tablesReadyPromise: Promise<void> | null = null;

function sanitizePlainText(raw: string, maxLen: number): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

function normalizePriority(value: unknown): TodoPriority {
  if (typeof value === 'string' && VALID_PRIORITIES.has(value as TodoPriority)) {
    return value as TodoPriority;
  }
  return 'normal';
}

function normalizeCategory(value: unknown): TodoCategory {
  if (typeof value === 'string' && VALID_CATEGORIES.has(value as TodoCategory)) {
    return value as TodoCategory;
  }
  return 'personal';
}

function normalizeSubtasks(raw: unknown): TodoSubtaskDto[] {
  if (!Array.isArray(raw)) return [];
  const result: TodoSubtaskDto[] = [];
  for (let i = 0; i < raw.length && result.length < 30; i += 1) {
    const entry = raw[i];
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const title = typeof obj.title === 'string' ? sanitizePlainText(obj.title, 120) : '';
    if (!title) continue;
    const id =
      typeof obj.id === 'string' && obj.id.trim()
        ? sanitizePlainText(obj.id, 64)
        : `sub_${crypto.randomBytes(4).toString('hex')}`;
    result.push({
      id,
      title,
      completed: Boolean(obj.completed),
    });
  }
  return result;
}

function extractAnchorDate(dueDate: string | null, createdAt: string | null | undefined, fallback: string): string {
  if (dueDate && isValidDateStr(dueDate)) return dueDate;
  if (typeof createdAt === 'string') {
    const prefix = createdAt.slice(0, 10);
    if (isValidDateStr(prefix)) return prefix;
  }
  return fallback;
}

function parseWeekdaysJson(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const nums = parsed
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    return nums.length > 0 ? nums : null;
  } catch {
    return null;
  }
}

function parseSubtasksJson(raw: string | null): TodoSubtaskDto[] {
  if (!raw) return [];
  try {
    return normalizeSubtasks(JSON.parse(raw));
  } catch {
    return [];
  }
}

function buildRuleFromRow(row: TodoRow, fallbackDate: string): TodoRecurrenceRule {
  const anchor = extractAnchorDate(row.due_date, row.created_at, fallbackDate);
  return normalizeRecurrenceRule(
    {
      type: (row.recurrence_type || 'none') as RecurrenceType,
      interval: Number(row.recurrence_interval) || 1,
      weekdays: parseWeekdaysJson(row.recurrence_weekdays),
      monthDay: row.recurrence_month_day,
      yearMonth: row.recurrence_year_month,
      yearDay: row.recurrence_year_day,
      endDate: row.recurrence_end_date,
    },
    anchor
  );
}

function mapRowToDto(row: TodoRow, targetDate: string): TodoItemDto {
  const anchorDate = extractAnchorDate(row.due_date, row.created_at, targetDate);
  const rule = buildRuleFromRow(row, targetDate);
  const oneOffCompleted = Boolean(row.completed);
  const occurrence = evaluateTodoOccurrence({
    rule,
    anchorDate,
    lastCompletedPeriod: row.last_completed_period,
    completed: oneOffCompleted,
    targetDate,
  });

  const effectiveCompleted = occurrence.isRecurring ? occurrence.isCompletedForPeriod : oneOffCompleted;
  const effectiveCompletedAt = effectiveCompleted ? row.completed_at : null;
  const dueTime = normalizeDueTime(row.due_time);
  const reminderEnabled = Boolean(dueTime && row.reminder_enabled);
  const remindBeforeMinutes = normalizeRemindBeforeMinutes(row.remind_before_minutes);

  return {
    id: row.id,
    title: row.title,
    memo: row.memo || '',
    priority: normalizePriority(row.priority),
    category: normalizeCategory(row.category),
    dueDate: row.due_date || null,
    dueTime,
    reminderEnabled,
    remindBeforeMinutes,
    completed: effectiveCompleted,
    completedAt: effectiveCompletedAt,
    subtasks: parseSubtasksJson(row.subtasks_json),
    order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
    recurrence: rule,
    lastCompletedPeriod: row.last_completed_period || null,
    streakCount: Math.max(0, Number(row.streak_count) || 0),
    occurrence,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createTodoId(): string {
  return `todo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

export class TodoService {
  static async ensureTables(): Promise<void> {
    if (!tablesReadyPromise) {
      tablesReadyPromise = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS todo_items (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            memo TEXT NOT NULL DEFAULT '',
            priority TEXT NOT NULL DEFAULT 'normal',
            category TEXT NOT NULL DEFAULT 'personal',
            due_date TEXT,
            due_time TEXT,
            reminder_enabled INTEGER NOT NULL DEFAULT 0,
            remind_before_minutes INTEGER NOT NULL DEFAULT 0,
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            subtasks_json TEXT NOT NULL DEFAULT '[]',
            sort_order INTEGER NOT NULL DEFAULT 0,
            recurrence_type TEXT NOT NULL DEFAULT 'none',
            recurrence_interval INTEGER NOT NULL DEFAULT 1,
            recurrence_weekdays TEXT,
            recurrence_month_day INTEGER,
            recurrence_year_month INTEGER,
            recurrence_year_day INTEGER,
            recurrence_end_date TEXT,
            last_completed_period TEXT,
            streak_count INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            deleted_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        const infoRes = await pool.query('PRAGMA table_info(todo_items)');
        const existingCols = new Set(
          (infoRes.rows as Array<{ name?: unknown }>).map((r) => String(r.name || ''))
        );
        const alterPairs: Array<[string, string]> = [
          ['due_time', 'ALTER TABLE todo_items ADD COLUMN due_time TEXT'],
          ['reminder_enabled', 'ALTER TABLE todo_items ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0'],
          [
            'remind_before_minutes',
            'ALTER TABLE todo_items ADD COLUMN remind_before_minutes INTEGER NOT NULL DEFAULT 0',
          ],
        ];
        for (const [colName, sql] of alterPairs) {
          if (!existingCols.has(colName)) {
            await pool.query(sql).catch(() => {});
          }
        }

        await pool.query(
          'CREATE INDEX IF NOT EXISTS idx_todo_items_user_active ON todo_items(user_id, is_deleted, sort_order)'
        );
        await pool.query(
          'CREATE INDEX IF NOT EXISTS idx_todo_items_user_recurrence ON todo_items(user_id, recurrence_type, is_deleted)'
        );
        await pool.query(`
          CREATE TABLE IF NOT EXISTS todo_completion_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            todo_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            period_key TEXT NOT NULL,
            completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            deleted_at TEXT
          )
        `);
        await pool.query(
          'CREATE INDEX IF NOT EXISTS idx_todo_logs_user_todo_period ON todo_completion_logs(user_id, todo_id, period_key, is_deleted)'
        );
      })().catch((err) => {
        tablesReadyPromise = null;
        throw err;
      });
    }
    return tablesReadyPromise;
  }

  static computeNextReminderAtMs(
    row: TodoRow,
    rule: TodoRecurrenceRule,
    safeDate: string,
    nowMs = Date.now(),
    skipToday = false
  ): { scheduledAtMs: number; occurrenceDate: string } | null {
    if (row.is_deleted) return null;
    const dueTime = normalizeDueTime(row.due_time);
    if (!dueTime || !row.reminder_enabled) return null;

    const remindBefore = normalizeRemindBeforeMinutes(row.remind_before_minutes);

    if (rule.type === 'none') {
      if (row.completed) return null;
      const targetDate = row.due_date && isValidDateStr(row.due_date) ? row.due_date : safeDate;
      const rawMs = parseKstDateTimeMs(targetDate, dueTime);
      if (rawMs === null) return null;
      const triggerMs = rawMs - remindBefore * 60_000;
      return triggerMs > nowMs - 60_000 ? { scheduledAtMs: triggerMs, occurrenceDate: targetDate } : null;
    }

    const anchorDate = extractAnchorDate(row.due_date, row.created_at, safeDate);
    const occToday = evaluateTodoOccurrence({
      rule,
      anchorDate,
      lastCompletedPeriod: row.last_completed_period,
      completed: Boolean(row.completed),
      targetDate: safeDate,
    });

    if (!skipToday && occToday.isDueToday && !occToday.isCompletedForPeriod) {
      const rawTodayMs = parseKstDateTimeMs(safeDate, dueTime);
      if (rawTodayMs !== null) {
        const triggerTodayMs = rawTodayMs - remindBefore * 60_000;
        if (triggerTodayMs > nowMs - 60_000) {
          return { scheduledAtMs: triggerTodayMs, occurrenceDate: safeDate };
        }
      }
    }

    const occNext = evaluateTodoOccurrence({
      rule,
      anchorDate,
      lastCompletedPeriod: occToday.currentPeriodKey,
      completed: false,
      targetDate: safeDate,
    });
    if (!occNext.nextOccurrenceDate) return null;

    const rawNextMs = parseKstDateTimeMs(occNext.nextOccurrenceDate, dueTime);
    if (rawNextMs === null) return null;
    const triggerNextMs = rawNextMs - remindBefore * 60_000;
    return triggerNextMs > nowMs - 60_000
      ? { scheduledAtMs: triggerNextMs, occurrenceDate: occNext.nextOccurrenceDate }
      : null;
  }

  static async syncTodoNotificationJob(
    userId: number,
    row: TodoRow,
    safeDate: string,
    options?: { skipToday?: boolean }
  ): Promise<void> {
    const dedupeKey = `todo:${row.id}`;
    const rule = buildRuleFromRow(row, safeDate);
    const nextAlarm = this.computeNextReminderAtMs(
      row,
      rule,
      safeDate,
      Date.now(),
      options?.skipToday ?? false
    );

    if (!nextAlarm) {
      await NotificationService.cancelScheduled({ userId, dedupeKey }).catch(() => {});
      return;
    }

    const remindBefore = normalizeRemindBeforeMinutes(row.remind_before_minutes);
    const leadLabel = formatRemindLeadLabel(remindBefore);
    const dueTime = normalizeDueTime(row.due_time) ?? '';
    const notifTitle = leadLabel
      ? `⏰ [스마트 투두] ${dueTime} (${leadLabel}) 알림`
      : `⏰ [스마트 투두] ${dueTime} 할 일 알림`;
    const memoSnippet = row.memo ? row.memo.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
    const notifBody = memoSnippet ? `${row.title} — ${memoSnippet}` : row.title;

    await NotificationService.scheduleNotification({
      userId,
      category: 'todo',
      sourceApp: 'todo-list',
      dedupeKey,
      title: notifTitle,
      body: notifBody,
      url: '/app/todo-list/',
      icon: '/logo-192.png',
      tag: `todo-${row.id}`,
      data: {
        todoId: row.id,
        dueTime,
        occurrenceDate: nextAlarm.occurrenceDate,
        isRecurring: rule.type !== 'none',
        remindBeforeMinutes: remindBefore,
      },
      scheduledAtMs: nextAlarm.scheduledAtMs,
      ignoreQuietHours: true,
    }).catch((err) => {
      console.error(`[TodoService] scheduleNotification failed (todo=${row.id}):`, err);
    });
  }

  static async rescheduleRecurringAfterPush(userId: number, todoId: string): Promise<void> {
    await this.ensureTables();
    const res = await pool.query(
      'SELECT * FROM todo_items WHERE id = $1 AND user_id = $2 AND is_deleted = 0',
      [todoId, userId]
    );
    const row = res.rows[0] as TodoRow | undefined;
    if (!row) return;
    if (!row.recurrence_type || row.recurrence_type === 'none') return;
    await this.syncTodoNotificationJob(userId, row, getKstTodayDateStr(), { skipToday: true });
  }

  static async listTodos(
    userId: number,
    targetDate: string,
    includeTrash: boolean
  ): Promise<{ items: TodoItemDto[]; trash: TodoItemDto[]; date: string }> {
    await this.ensureTables();
    const safeDate = isValidDateStr(targetDate) ? targetDate : getKstTodayDateStr();

    const activeRes = await pool.query(
      `SELECT * FROM todo_items
       WHERE user_id = $1 AND is_deleted = 0
       ORDER BY sort_order ASC, created_at DESC`,
      [userId]
    );

    const items = (activeRes.rows as TodoRow[]).map((row) => mapRowToDto(row, safeDate));

    let trash: TodoItemDto[] = [];
    if (includeTrash) {
      const trashRes = await pool.query(
        `SELECT * FROM todo_items
         WHERE user_id = $1 AND is_deleted = 1
         ORDER BY deleted_at DESC, updated_at DESC`,
        [userId]
      );
      trash = (trashRes.rows as TodoRow[]).map((row) => mapRowToDto(row, safeDate));
    }

    return { items, trash, date: safeDate };
  }

  static async createTodo(userId: number, input: CreateTodoInput, targetDate: string): Promise<TodoItemDto> {
    await this.ensureTables();
    const safeDate = isValidDateStr(targetDate) ? targetDate : getKstTodayDateStr();

    const title = sanitizePlainText(input.title, 160);
    if (!title) {
      throw new TodoServiceError(400, '할 일 제목을 입력해 주세요.');
    }

    const memo = typeof input.memo === 'string' ? sanitizePlainText(input.memo, TODO_MEMO_MAX_LEN) : '';
    const priority = normalizePriority(input.priority);
    const category = normalizeCategory(input.category);
    const dueDate = input.dueDate && isValidDateStr(input.dueDate) ? input.dueDate : null;
    const dueTime = normalizeDueTime(input.dueTime);
    const reminderEnabled = dueTime && input.reminderEnabled ? 1 : 0;
    const remindBeforeMinutes = normalizeRemindBeforeMinutes(input.remindBeforeMinutes);
    const subtasks = normalizeSubtasks(input.subtasks);

    const anchorDate = dueDate ?? safeDate;
    const rule = normalizeRecurrenceRule(input.recurrence, anchorDate);
    const effectiveDueDate = rule.type !== 'none' && !dueDate ? safeDate : dueDate;

    const minOrderRes = await pool.query(
      'SELECT COALESCE(MIN(sort_order), 0) AS min_order FROM todo_items WHERE user_id = $1 AND is_deleted = 0',
      [userId]
    );
    const currentMin = Number(minOrderRes.rows[0]?.min_order ?? 0);
    const nextSortOrder = Number.isFinite(currentMin) ? currentMin - 1 : 0;

    const id = createTodoId();
    const nowIso = new Date().toISOString();

    await pool.query(
      `INSERT INTO todo_items (
        id, user_id, title, memo, priority, category, due_date,
        due_time, reminder_enabled, remind_before_minutes,
        completed, completed_at, subtasks_json, sort_order,
        recurrence_type, recurrence_interval, recurrence_weekdays,
        recurrence_month_day, recurrence_year_month, recurrence_year_day, recurrence_end_date,
        last_completed_period, streak_count,
        is_deleted, deleted_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        0, NULL, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        NULL, 0,
        0, NULL, $20, $21
      )`,
      [
        id,
        userId,
        title,
        memo,
        priority,
        category,
        effectiveDueDate,
        dueTime,
        reminderEnabled,
        remindBeforeMinutes,
        JSON.stringify(subtasks),
        nextSortOrder,
        rule.type,
        rule.interval,
        rule.weekdays ? JSON.stringify(rule.weekdays) : null,
        rule.monthDay,
        rule.yearMonth,
        rule.yearDay,
        rule.endDate,
        nowIso,
        nowIso,
      ]
    );

    const createdRes = await pool.query('SELECT * FROM todo_items WHERE id = $1 AND user_id = $2', [id, userId]);
    const row = createdRes.rows[0] as TodoRow | undefined;
    if (!row) {
      throw new TodoServiceError(500, '할 일 생성 후 조회에 실패했습니다.');
    }

    await this.syncTodoNotificationJob(userId, row, safeDate);
    return mapRowToDto(row, safeDate);
  }

  static async updateTodo(
    userId: number,
    id: string,
    patch: UpdateTodoInput,
    targetDate: string
  ): Promise<TodoItemDto | null> {
    await this.ensureTables();
    const safeDate = isValidDateStr(targetDate) ? targetDate : getKstTodayDateStr();

    const existingRes = await pool.query(
      'SELECT * FROM todo_items WHERE id = $1 AND user_id = $2 AND is_deleted = 0',
      [id, userId]
    );
    const existing = existingRes.rows[0] as TodoRow | undefined;
    if (!existing) return null;

    const nextTitle =
      patch.title !== undefined ? sanitizePlainText(patch.title, 160) : existing.title;
    if (!nextTitle) {
      throw new TodoServiceError(400, '할 일 제목은 비워둘 수 없습니다.');
    }

    const nextMemo =
      patch.memo !== undefined ? sanitizePlainText(patch.memo, TODO_MEMO_MAX_LEN) : existing.memo;
    const nextPriority =
      patch.priority !== undefined ? normalizePriority(patch.priority) : normalizePriority(existing.priority);
    const nextCategory =
      patch.category !== undefined ? normalizeCategory(patch.category) : normalizeCategory(existing.category);
    const nextDueDate =
      patch.dueDate !== undefined
        ? patch.dueDate && isValidDateStr(patch.dueDate)
          ? patch.dueDate
          : null
        : existing.due_date;

    const nextDueTime =
      patch.dueTime !== undefined ? normalizeDueTime(patch.dueTime) : normalizeDueTime(existing.due_time);
    const rawReminderEnabled =
      patch.reminderEnabled !== undefined ? Boolean(patch.reminderEnabled) : Boolean(existing.reminder_enabled);
    const nextReminderEnabled = nextDueTime && rawReminderEnabled ? 1 : 0;
    const nextRemindBefore =
      patch.remindBeforeMinutes !== undefined
        ? normalizeRemindBeforeMinutes(patch.remindBeforeMinutes)
        : normalizeRemindBeforeMinutes(existing.remind_before_minutes);

    const nextSubtasks =
      patch.subtasks !== undefined ? normalizeSubtasks(patch.subtasks) : parseSubtasksJson(existing.subtasks_json);
    const nextOrder =
      typeof patch.order === 'number' && Number.isFinite(patch.order)
        ? Math.trunc(patch.order)
        : existing.sort_order;

    const currentRule = buildRuleFromRow(existing, safeDate);
    const anchorDate = extractAnchorDate(nextDueDate, existing.created_at, safeDate);
    const nextRule =
      patch.recurrence !== undefined
        ? normalizeRecurrenceRule(patch.recurrence, anchorDate)
        : currentRule;

    const effectiveDueDate =
      nextRule.type !== 'none' && !nextDueDate ? anchorDate : nextDueDate;

    const nowIso = new Date().toISOString();
    const ruleChanged =
      formatRecurrenceSummary(currentRule) !== formatRecurrenceSummary(nextRule) ||
      currentRule.type !== nextRule.type ||
      currentRule.endDate !== nextRule.endDate;

    const nextLastCompletedPeriod =
      nextRule.type === 'none'
        ? null
        : ruleChanged && currentRule.type !== nextRule.type
          ? null
          : existing.last_completed_period;
    const nextStreakCount =
      nextRule.type === 'none'
        ? 0
        : ruleChanged && currentRule.type !== nextRule.type
          ? 0
          : existing.streak_count;

    await pool.query(
      `UPDATE todo_items SET
        title = $1,
        memo = $2,
        priority = $3,
        category = $4,
        due_date = $5,
        due_time = $6,
        reminder_enabled = $7,
        remind_before_minutes = $8,
        subtasks_json = $9,
        sort_order = $10,
        recurrence_type = $11,
        recurrence_interval = $12,
        recurrence_weekdays = $13,
        recurrence_month_day = $14,
        recurrence_year_month = $15,
        recurrence_year_day = $16,
        recurrence_end_date = $17,
        last_completed_period = $18,
        streak_count = $19,
        updated_at = $20
      WHERE id = $21 AND user_id = $22 AND is_deleted = 0`,
      [
        nextTitle,
        nextMemo,
        nextPriority,
        nextCategory,
        effectiveDueDate,
        nextDueTime,
        nextReminderEnabled,
        nextRemindBefore,
        JSON.stringify(nextSubtasks),
        nextOrder,
        nextRule.type,
        nextRule.interval,
        nextRule.weekdays ? JSON.stringify(nextRule.weekdays) : null,
        nextRule.monthDay,
        nextRule.yearMonth,
        nextRule.yearDay,
        nextRule.endDate,
        nextLastCompletedPeriod,
        nextStreakCount,
        nowIso,
        id,
        userId,
      ]
    );

    const updatedRes = await pool.query('SELECT * FROM todo_items WHERE id = $1 AND user_id = $2', [id, userId]);
    const updatedRow = updatedRes.rows[0] as TodoRow | undefined;
    if (!updatedRow) return null;

    await this.syncTodoNotificationJob(userId, updatedRow, safeDate);
    return mapRowToDto(updatedRow, safeDate);
  }

  static async toggleTodo(userId: number, id: string, targetDate: string): Promise<TodoItemDto | null> {
    await this.ensureTables();
    const safeDate = isValidDateStr(targetDate) ? targetDate : getKstTodayDateStr();

    const existingRes = await pool.query(
      'SELECT * FROM todo_items WHERE id = $1 AND user_id = $2 AND is_deleted = 0',
      [id, userId]
    );
    const existing = existingRes.rows[0] as TodoRow | undefined;
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const rule = buildRuleFromRow(existing, safeDate);
    const anchorDate = extractAnchorDate(existing.due_date, existing.created_at, safeDate);

    if (rule.type === 'none') {
      const nextCompleted = existing.completed ? 0 : 1;
      const nextCompletedAt = nextCompleted ? nowIso : null;
      await pool.query(
        `UPDATE todo_items
         SET completed = $1, completed_at = $2, updated_at = $3
         WHERE id = $4 AND user_id = $5 AND is_deleted = 0`,
        [nextCompleted, nextCompletedAt, nowIso, id, userId]
      );
    } else {
      const occ = evaluateTodoOccurrence({
        rule,
        anchorDate,
        lastCompletedPeriod: existing.last_completed_period,
        completed: Boolean(existing.completed),
        targetDate: safeDate,
      });

      const periodKey = occ.currentPeriodKey || safeDate;
      const isCurrentlyCompleted = occ.isCompletedForPeriod;

      if (isCurrentlyCompleted) {
        await pool.query(
          `UPDATE todo_completion_logs
           SET is_deleted = 1, deleted_at = $1
           WHERE user_id = $2 AND todo_id = $3 AND period_key = $4 AND is_deleted = 0`,
          [nowIso, userId, id, periodKey]
        );

        const prevLogRes = await pool.query(
          `SELECT period_key, completed_at FROM todo_completion_logs
           WHERE user_id = $1 AND todo_id = $2 AND is_deleted = 0
           ORDER BY id DESC LIMIT 1`,
          [userId, id]
        );
        const prevLog = prevLogRes.rows[0] as { period_key?: string; completed_at?: string } | undefined;
        const nextPeriod = prevLog?.period_key || null;
        const nextStreak = Math.max(0, (Number(existing.streak_count) || 0) - 1);

        await pool.query(
          `UPDATE todo_items
           SET last_completed_period = $1, streak_count = $2, completed_at = $3, updated_at = $4
           WHERE id = $5 AND user_id = $6 AND is_deleted = 0`,
          [nextPeriod, nextStreak, prevLog?.completed_at || null, nowIso, id, userId]
        );
      } else {
        await pool.query(
          `INSERT INTO todo_completion_logs (todo_id, user_id, period_key, completed_at, is_deleted)
           VALUES ($1, $2, $3, $4, 0)`,
          [id, userId, periodKey, nowIso]
        );

        const prevPeriodKey = getPreviousPeriodKey(rule, anchorDate, periodKey);
        const currentStreak = Math.max(0, Number(existing.streak_count) || 0);
        const nextStreak =
          prevPeriodKey && existing.last_completed_period === prevPeriodKey ? currentStreak + 1 : 1;

        await pool.query(
          `UPDATE todo_items
           SET last_completed_period = $1, streak_count = $2, completed_at = $3, updated_at = $4
           WHERE id = $5 AND user_id = $6 AND is_deleted = 0`,
          [periodKey, nextStreak, nowIso, nowIso, id, userId]
        );
      }
    }

    const updatedRes = await pool.query('SELECT * FROM todo_items WHERE id = $1 AND user_id = $2', [id, userId]);
    const updatedRow = updatedRes.rows[0] as TodoRow | undefined;
    if (!updatedRow) return null;

    await this.syncTodoNotificationJob(userId, updatedRow, safeDate);
    return mapRowToDto(updatedRow, safeDate);
  }

  static async softDeleteTodo(userId: number, id: string): Promise<boolean> {
    await this.ensureTables();
    const nowIso = new Date().toISOString();
    const res = await pool.query(
      `UPDATE todo_items
       SET is_deleted = 1, deleted_at = $1, updated_at = $2
       WHERE id = $3 AND user_id = $4 AND is_deleted = 0`,
      [nowIso, nowIso, id, userId]
    );
    if (res.rowCount > 0) {
      await NotificationService.cancelScheduled({ userId, dedupeKey: `todo:${id}` }).catch(() => {});
    }
    return res.rowCount > 0;
  }

  static async restoreTodo(userId: number, id: string, targetDate: string): Promise<TodoItemDto | null> {
    await this.ensureTables();
    const safeDate = isValidDateStr(targetDate) ? targetDate : getKstTodayDateStr();
    const nowIso = new Date().toISOString();
    const res = await pool.query(
      `UPDATE todo_items
       SET is_deleted = 0, deleted_at = NULL, updated_at = $1
       WHERE id = $2 AND user_id = $3 AND is_deleted = 1`,
      [nowIso, id, userId]
    );
    if (res.rowCount === 0) return null;

    const restoredRes = await pool.query('SELECT * FROM todo_items WHERE id = $1 AND user_id = $2', [id, userId]);
    const row = restoredRes.rows[0] as TodoRow | undefined;
    if (!row) return null;

    await this.syncTodoNotificationJob(userId, row, safeDate);
    return mapRowToDto(row, safeDate);
  }

  static async restoreAllTrash(userId: number): Promise<number> {
    await this.ensureTables();
    const nowIso = new Date().toISOString();
    const res = await pool.query(
      `UPDATE todo_items
       SET is_deleted = 0, deleted_at = NULL, updated_at = $1
       WHERE user_id = $2 AND is_deleted = 1`,
      [nowIso, userId]
    );
    if (res.rowCount > 0) {
      const todayStr = getKstTodayDateStr();
      const activeReminders = await pool.query(
        'SELECT * FROM todo_items WHERE user_id = $1 AND is_deleted = 0 AND reminder_enabled = 1',
        [userId]
      );
      for (const row of activeReminders.rows as TodoRow[]) {
        await this.syncTodoNotificationJob(userId, row, todayStr);
      }
    }
    return res.rowCount;
  }

  static async softDeleteCompletedOneOffs(userId: number): Promise<number> {
    await this.ensureTables();
    const targetsRes = await pool.query(
      `SELECT id FROM todo_items
       WHERE user_id = $1 AND is_deleted = 0 AND recurrence_type = 'none' AND completed = 1`,
      [userId]
    );
    const nowIso = new Date().toISOString();
    const res = await pool.query(
      `UPDATE todo_items
       SET is_deleted = 1, deleted_at = $1, updated_at = $2
       WHERE user_id = $3 AND is_deleted = 0 AND recurrence_type = 'none' AND completed = 1`,
      [nowIso, nowIso, userId]
    );
    for (const r of targetsRes.rows as Array<{ id?: unknown }>) {
      if (typeof r.id === 'string' && r.id) {
        await NotificationService.cancelScheduled({ userId, dedupeKey: `todo:${r.id}` }).catch(() => {});
      }
    }
    return res.rowCount;
  }

  static async importTodos(
    userId: number,
    rawItems: readonly ImportTodoInput[],
    targetDate: string
  ): Promise<{ importedCount: number; items: TodoItemDto[]; trash: TodoItemDto[] }> {
    await this.ensureTables();
    const safeDate = isValidDateStr(targetDate) ? targetDate : getKstTodayDateStr();

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new TodoServiceError(400, '이관하거나 복원할 할 일 항목이 없습니다.');
    }

    const capped = rawItems.slice(0, 500);
    let importedCount = 0;

    for (let i = 0; i < capped.length; i += 1) {
      const item = capped[i];
      const title = typeof item.title === 'string' ? sanitizePlainText(item.title, 160) : '';
      if (!title) continue;

      const candidateId =
        typeof item.id === 'string' && item.id.trim()
          ? sanitizePlainText(item.id, 64)
          : createTodoId();

      const ownerCheck = await pool.query('SELECT user_id FROM todo_items WHERE id = $1', [candidateId]);
      const existingOwner = ownerCheck.rows[0] as { user_id?: number } | undefined;
      const safeId =
        existingOwner && existingOwner.user_id !== userId
          ? `${candidateId.slice(0, 32)}_u${userId}_${crypto.randomBytes(3).toString('hex')}`
          : candidateId;

      const memo = typeof item.memo === 'string' ? sanitizePlainText(item.memo, TODO_MEMO_MAX_LEN) : '';
      const priority = normalizePriority(item.priority);
      const category = normalizeCategory(item.category);
      const dueDate = item.dueDate && isValidDateStr(item.dueDate) ? item.dueDate : null;
      const dueTime = normalizeDueTime(item.dueTime);
      const reminderEnabled = dueTime && item.reminderEnabled ? 1 : 0;
      const remindBeforeMinutes = normalizeRemindBeforeMinutes(item.remindBeforeMinutes);
      const createdAt =
        typeof item.createdAt === 'string' && item.createdAt.trim()
          ? item.createdAt.slice(0, 40)
          : new Date().toISOString();
      const updatedAt = new Date().toISOString();

      const anchorDate = extractAnchorDate(dueDate, createdAt, safeDate);
      const rule = normalizeRecurrenceRule(item.recurrence, anchorDate);
      const completed = rule.type === 'none' && item.completed ? 1 : 0;
      const completedAt = item.completedAt ? String(item.completedAt).slice(0, 40) : null;
      const subtasks = normalizeSubtasks(item.subtasks);
      const sortOrder = typeof item.order === 'number' && Number.isFinite(item.order) ? Math.trunc(item.order) : i;
      const isDeleted = item.isDeleted ? 1 : 0;
      const deletedAt = isDeleted && item.deletedAt ? String(item.deletedAt).slice(0, 40) : isDeleted ? updatedAt : null;

      let lastCompletedPeriod =
        typeof item.lastCompletedPeriod === 'string' && item.lastCompletedPeriod.trim()
          ? sanitizePlainText(item.lastCompletedPeriod, 20)
          : null;
      if (rule.type !== 'none' && item.completed && !lastCompletedPeriod) {
        const occ = evaluateTodoOccurrence({
          rule,
          anchorDate,
          lastCompletedPeriod: null,
          completed: false,
          targetDate: safeDate,
        });
        lastCompletedPeriod = occ.currentPeriodKey;
      }

      const streakCount =
        typeof item.streakCount === 'number' && Number.isFinite(item.streakCount)
          ? Math.max(0, Math.trunc(item.streakCount))
          : lastCompletedPeriod
            ? 1
            : 0;

      if (existingOwner && existingOwner.user_id === userId) {
        await pool.query(
          `UPDATE todo_items SET
            title = $1,
            memo = $2,
            priority = $3,
            category = $4,
            due_date = $5,
            due_time = $6,
            reminder_enabled = $7,
            remind_before_minutes = $8,
            completed = $9,
            completed_at = $10,
            subtasks_json = $11,
            sort_order = $12,
            recurrence_type = $13,
            recurrence_interval = $14,
            recurrence_weekdays = $15,
            recurrence_month_day = $16,
            recurrence_year_month = $17,
            recurrence_year_day = $18,
            recurrence_end_date = $19,
            last_completed_period = $20,
            streak_count = $21,
            is_deleted = $22,
            deleted_at = $23,
            updated_at = $24
           WHERE id = $25 AND user_id = $26`,
          [
            title,
            memo,
            priority,
            category,
            dueDate,
            dueTime,
            reminderEnabled,
            remindBeforeMinutes,
            completed,
            completedAt,
            JSON.stringify(subtasks),
            sortOrder,
            rule.type,
            rule.interval,
            rule.weekdays ? JSON.stringify(rule.weekdays) : null,
            rule.monthDay,
            rule.yearMonth,
            rule.yearDay,
            rule.endDate,
            lastCompletedPeriod,
            streakCount,
            isDeleted,
            deletedAt,
            updatedAt,
            safeId,
            userId,
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO todo_items (
            id, user_id, title, memo, priority, category, due_date,
            due_time, reminder_enabled, remind_before_minutes,
            completed, completed_at, subtasks_json, sort_order,
            recurrence_type, recurrence_interval, recurrence_weekdays,
            recurrence_month_day, recurrence_year_month, recurrence_year_day, recurrence_end_date,
            last_completed_period, streak_count,
            is_deleted, deleted_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17,
            $18, $19, $20, $21,
            $22, $23,
            $24, $25, $26, $27
          )`,
          [
            safeId,
            userId,
            title,
            memo,
            priority,
            category,
            dueDate,
            dueTime,
            reminderEnabled,
            remindBeforeMinutes,
            completed,
            completedAt,
            JSON.stringify(subtasks),
            sortOrder,
            rule.type,
            rule.interval,
            rule.weekdays ? JSON.stringify(rule.weekdays) : null,
            rule.monthDay,
            rule.yearMonth,
            rule.yearDay,
            rule.endDate,
            lastCompletedPeriod,
            streakCount,
            isDeleted,
            deletedAt,
            createdAt,
            updatedAt,
          ]
        );
      }

      if (!isDeleted && reminderEnabled) {
        const rowRes = await pool.query('SELECT * FROM todo_items WHERE id = $1 AND user_id = $2', [
          safeId,
          userId,
        ]);
        const importedRow = rowRes.rows[0] as TodoRow | undefined;
        if (importedRow) {
          await this.syncTodoNotificationJob(userId, importedRow, safeDate);
        }
      }
      importedCount += 1;
    }

    const listed = await this.listTodos(userId, safeDate, true);
    return {
      importedCount,
      items: listed.items,
      trash: listed.trash,
    };
  }

  static async listCompletionLogs(userId: number, days = 365): Promise<TodoCompletionLogDto[]> {
    await this.ensureTables();
    const safeDays = Math.min(1095, Math.max(1, Math.round(days)));
    const cutoffIso = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();

    const res = await pool.query(
      `SELECT id, todo_id, period_key, completed_at
       FROM todo_completion_logs
       WHERE user_id = $1 AND is_deleted = 0 AND completed_at >= $2
       ORDER BY completed_at DESC
       LIMIT 2000`,
      [userId, cutoffIso]
    );

    return (
      res.rows as Array<{
        id: number;
        todo_id: string;
        period_key: string;
        completed_at: string;
      }>
    ).map((row) => ({
      id: Number(row.id) || 0,
      todoId: String(row.todo_id),
      periodKey: String(row.period_key),
      completedAt: String(row.completed_at),
    }));
  }
}

NotificationService.registerCategorySentHandler('todo', async (sentJobs) => {
  for (const job of sentJobs) {
    const todoId = typeof job.data?.todoId === 'string' ? job.data.todoId : '';
    const isRecurring = Boolean(job.data?.isRecurring);
    if (todoId && isRecurring) {
      await TodoService.rescheduleRecurringAfterPush(job.userId, todoId);
    }
  }
});
