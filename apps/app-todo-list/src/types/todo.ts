import type { RecurrenceType, TodoOccurrenceState, TodoRecurrenceRule } from '../utils/recurrence';

export type { RecurrenceType, TodoOccurrenceState, TodoRecurrenceRule };

export type TodoPriority = 'urgent' | 'important' | 'normal';

export type TodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'study';

export type TodoStatusFilter = 'all' | 'active' | 'recurring' | 'today' | 'completed';

export type TodoSortKey = 'manual' | 'priority' | 'dueDate' | 'createdAt';

export type MainTab = 'todo' | 'howto' | 'faq';

export type MobileViewMode = 'board' | 'report';

export interface TodoSubtask {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

export interface TodoItem {
  readonly id: string;
  readonly title: string;
  readonly memo: string;
  readonly priority: TodoPriority;
  readonly category: TodoCategory;
  readonly dueDate: string | null; // 'YYYY-MM-DD'
  readonly completed: boolean;
  readonly completedAt: string | null;
  readonly subtasks: readonly TodoSubtask[];
  readonly order: number;
  readonly recurrence: TodoRecurrenceRule;
  readonly lastCompletedPeriod: string | null;
  readonly streakCount: number;
  readonly occurrence: TodoOccurrenceState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isDeleted: boolean;
  readonly deletedAt: string | null;
}

export interface TodoDraftInput {
  readonly title: string;
  readonly memo?: string;
  readonly priority: TodoPriority;
  readonly category: TodoCategory;
  readonly dueDate: string | null;
  readonly recurrence?: Partial<TodoRecurrenceRule> | null;
}

export interface TodoPatchInput {
  readonly title?: string;
  readonly memo?: string;
  readonly priority?: TodoPriority;
  readonly category?: TodoCategory;
  readonly dueDate?: string | null;
  readonly subtasks?: readonly TodoSubtask[];
  readonly order?: number;
  readonly recurrence?: Partial<TodoRecurrenceRule> | null;
}

export interface TodoFilterState {
  readonly status: TodoStatusFilter;
  readonly category: TodoCategory | 'all';
  readonly priority: TodoPriority | 'all';
  readonly searchQuery: string;
  readonly sortBy: TodoSortKey;
}

export interface PriorityBreakdown {
  readonly priority: TodoPriority;
  readonly total: number;
  readonly completed: number;
  readonly remaining: number;
}

export interface CategoryBreakdown {
  readonly category: TodoCategory;
  readonly total: number;
  readonly completed: number;
  readonly rate: number;
}

export interface TodoStatsReport {
  readonly totalCount: number;
  readonly completedCount: number;
  readonly activeCount: number;
  readonly recurringCount: number;
  readonly maxStreak: number;
  readonly overdueCount: number;
  readonly todayDueCount: number;
  readonly todayTotalCount: number;
  readonly todayCompletedCount: number;
  readonly todayActiveCount: number;
  readonly todayCompletionRate: number;
  readonly upcomingCount: number;
  readonly trashCount: number;
  readonly completionRate: number;
  readonly byPriority: readonly PriorityBreakdown[];
  readonly byCategory: readonly CategoryBreakdown[];
}

export interface StoredTodoEnvelope {
  readonly schemaVersion: 1 | 2;
  readonly items: readonly TodoItem[];
}

export interface TodoBackupPayload {
  readonly schemaVersion: 2;
  readonly exportedAt: string;
  readonly source: 'VeraNex-Todo-Planner';
  readonly items: readonly TodoItem[];
}
