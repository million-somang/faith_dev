import { TODO_MAX_ITEMS, TODO_MAX_SUBTASKS } from '../constants/todoMeta';
import type { TodoCategory, TodoItem, TodoPriority, TodoRecurrenceRule, TodoSubtask } from '../types/todo';
import {
  evaluateTodoOccurrence,
  getLocalTodayDateStr,
  isValidDateStr,
  normalizeRecurrenceRule,
} from './recurrence';

const VALID_PRIORITIES = new Set<TodoPriority>(['urgent', 'important', 'normal']);
const VALID_CATEGORIES = new Set<TodoCategory>(['work', 'personal', 'shopping', 'health', 'study']);

/**
 * 제어문자를 제거하고 허용 길이를 제한하여 안전한 평문 문자열로 정제합니다.
 */
export function sanitizeText(raw: string, maxLength: number): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

/**
 * HTML 특수 문자를 안전하게 이스케이프합니다.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && isValidDateStr(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeSubtask(raw: unknown, fallbackIndex: number): TodoSubtask | null {
  if (!isRecord(raw)) return null;
  const title = typeof raw.title === 'string' ? sanitizeText(raw.title, 120) : '';
  if (!title) return null;
  const id =
    typeof raw.id === 'string' && raw.id.trim().length > 0
      ? sanitizeText(raw.id, 64)
      : `sub_${Date.now()}_${fallbackIndex}`;
  return {
    id,
    title,
    completed: Boolean(raw.completed),
  };
}

export function sanitizeTodoRecord(raw: unknown, fallbackOrder: number): TodoItem | null {
  if (!isRecord(raw)) return null;
  const title = typeof raw.title === 'string' ? sanitizeText(raw.title, 160) : '';
  if (!title) return null;

  const nowIso = new Date().toISOString();
  const todayStr = getLocalTodayDateStr();

  const id =
    typeof raw.id === 'string' && raw.id.trim().length > 0
      ? sanitizeText(raw.id, 64)
      : `todo_${Date.now()}_${fallbackOrder}`;

  const priority: TodoPriority =
    typeof raw.priority === 'string' && VALID_PRIORITIES.has(raw.priority as TodoPriority)
      ? (raw.priority as TodoPriority)
      : 'normal';

  const category: TodoCategory =
    typeof raw.category === 'string' && VALID_CATEGORIES.has(raw.category as TodoCategory)
      ? (raw.category as TodoCategory)
      : 'personal';

  const memo = typeof raw.memo === 'string' ? sanitizeText(raw.memo, 400) : '';
  const dueDate = isValidDateString(raw.dueDate) ? raw.dueDate : null;

  const subtasks: TodoSubtask[] = [];
  if (Array.isArray(raw.subtasks)) {
    for (let i = 0; i < raw.subtasks.length && subtasks.length < TODO_MAX_SUBTASKS; i += 1) {
      const cleaned = sanitizeSubtask(raw.subtasks[i], i);
      if (cleaned) subtasks.push(cleaned);
    }
  }

  const order = typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : fallbackOrder;
  const createdAt =
    typeof raw.createdAt === 'string' && raw.createdAt.length <= 40 ? raw.createdAt : nowIso;
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt.length <= 40 ? raw.updatedAt : nowIso;

  const anchorCandidate = dueDate ?? createdAt.slice(0, 10);
  const anchorDate = isValidDateStr(anchorCandidate) ? anchorCandidate : todayStr;

  const rawRecurrence = isRecord(raw.recurrence) ? (raw.recurrence as Partial<TodoRecurrenceRule>) : null;
  const recurrence = normalizeRecurrenceRule(rawRecurrence, anchorDate);

  const lastCompletedPeriod =
    typeof raw.lastCompletedPeriod === 'string' && raw.lastCompletedPeriod.trim()
      ? sanitizeText(raw.lastCompletedPeriod, 20)
      : null;

  const streakCount =
    typeof raw.streakCount === 'number' && Number.isFinite(raw.streakCount)
      ? Math.max(0, Math.trunc(raw.streakCount))
      : 0;

  const oneOffCompleted = Boolean(raw.completed);
  const occurrence = evaluateTodoOccurrence({
    rule: recurrence,
    anchorDate,
    lastCompletedPeriod,
    completed: oneOffCompleted,
    targetDate: todayStr,
  });

  const effectiveCompleted = occurrence.isRecurring ? occurrence.isCompletedForPeriod : oneOffCompleted;
  const completedAt =
    effectiveCompleted && typeof raw.completedAt === 'string' && raw.completedAt.length <= 40
      ? raw.completedAt
      : effectiveCompleted
        ? nowIso
        : null;

  const isDeleted = Boolean(raw.isDeleted);
  const deletedAt =
    isDeleted && typeof raw.deletedAt === 'string' && raw.deletedAt.length <= 40
      ? raw.deletedAt
      : isDeleted
        ? nowIso
        : null;

  return {
    id,
    title,
    memo,
    priority,
    category,
    dueDate,
    completed: effectiveCompleted,
    completedAt,
    subtasks,
    order,
    recurrence,
    lastCompletedPeriod,
    streakCount,
    occurrence,
    createdAt,
    updatedAt,
    isDeleted,
    deletedAt,
  };
}

/**
 * JSON 백업 문자열을 파싱하고 스키마·길이·타입을 검증해 안전한 TodoItem 배열을 반환합니다.
 */
export function parseValidatedBackupPayload(rawJson: string): TodoItem[] | null {
  if (!rawJson || rawJson.length > 1_000_000) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }

  let rawItems: unknown = null;
  if (Array.isArray(parsed)) {
    rawItems = parsed;
  } else if (isRecord(parsed) && Array.isArray(parsed.items)) {
    rawItems = parsed.items;
  }

  if (!Array.isArray(rawItems)) {
    return null;
  }

  const sanitized: TodoItem[] = [];
  for (let i = 0; i < rawItems.length && sanitized.length < TODO_MAX_ITEMS; i += 1) {
    const cleaned = sanitizeTodoRecord(rawItems[i], i);
    if (cleaned) {
      sanitized.push(cleaned);
    }
  }

  return sanitized.length > 0 ? sanitized : null;
}
