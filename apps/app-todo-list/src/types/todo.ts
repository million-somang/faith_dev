import type { RecurrenceType, TodoOccurrenceState, TodoRecurrenceRule } from '../utils/recurrence';

export type { RecurrenceType, TodoOccurrenceState, TodoRecurrenceRule };

export type TodoPriority = 'urgent' | 'important' | 'normal';

export type TodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'study';

export type RemindBeforeMinutes = 0 | 5 | 10 | 30 | 60;

export type TodoStatusFilter = 'all' | 'active' | 'recurring' | 'today' | 'completed';

export type TodoSortKey = 'manual' | 'priority' | 'dueDate' | 'createdAt';

export type MainTab = 'todo' | 'howto' | 'faq';

export type WorkspaceView = 'todo' | 'report' | 'timer';

export type ReportPeriod = 'today' | 'week' | 'month' | 'all';

export interface TodoCompletionLog {
  readonly id: string;
  readonly todoId: string;
  readonly periodKey: string;
  readonly completedAt: string;
}

export type ReportGradeCode = 'START' | 'S+' | 'S' | 'A' | 'B' | 'C';

export interface ReportGradeInfo {
  readonly grade: ReportGradeCode;
  readonly title: string;
  readonly comment: string;
  readonly badgeClass: string;
}

export interface ReportAchievement {
  readonly id: string;
  readonly title: string;
  readonly desc: string;
  readonly iconClass: string;
  readonly unlocked: boolean;
  readonly progressLabel: string;
}

export interface PeriodDailyBar {
  readonly dateStr: string;
  readonly label: string;
  readonly count: number;
  readonly isToday: boolean;
}

export interface MonthCalendarCell {
  readonly day: number | null;
  readonly dateStr: string | null;
  readonly count: number;
  readonly level: 0 | 1 | 2 | 3;
  readonly isToday: boolean;
}

export interface WeekChunkBar {
  readonly weekIndex: number;
  readonly label: string;
  readonly count: number;
}

export interface TimeSlotBucket {
  readonly key: 'morning' | 'afternoon' | 'evening';
  readonly label: string;
  readonly rangeLabel: string;
  readonly count: number;
  readonly percent: number;
}

export interface RoutineSincerityItem {
  readonly id: string;
  readonly title: string;
  readonly category: TodoCategory;
  readonly summaryLabel: string;
  readonly streakCount: number;
  readonly completedToday: boolean;
}

export interface CategoryInsightSummary {
  readonly bestCategory: {
    readonly category: TodoCategory;
    readonly rate: number;
    readonly completed: number;
    readonly total: number;
  } | null;
  readonly focusCategory: {
    readonly category: TodoCategory;
    readonly remaining: number;
    readonly total: number;
  } | null;
}

export interface TodoReportInsights {
  readonly todayTimeSlots: readonly TimeSlotBucket[];
  readonly todayLoggedCount: number;
  readonly weekBars: readonly PeriodDailyBar[];
  readonly weekTotalCompleted: number;
  readonly weekActiveDays: number;
  readonly weekDailyAvg: string;
  readonly weekBestDay: { readonly label: string; readonly count: number } | null;
  readonly monthLabel: string;
  readonly monthCells: readonly MonthCalendarCell[];
  readonly monthWeekBars: readonly WeekChunkBar[];
  readonly monthTotalCompleted: number;
  readonly monthActiveDays: number;
  readonly monthMaxDaily: number;
  readonly allTotalCompletions: number;
  readonly allActiveDays: number;
  readonly allMaxStreak: number;
  readonly allPomodoroSessions: number;
  readonly topRoutines: readonly RoutineSincerityItem[];
  readonly categoryInsights: CategoryInsightSummary;
  readonly gradeByPeriod: Record<ReportPeriod, ReportGradeInfo>;
  readonly achievements: readonly ReportAchievement[];
  readonly unlockedAchievementCount: number;
}

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
  readonly dueTime: string | null; // 'HH:MM'
  readonly reminderEnabled: boolean;
  readonly remindBeforeMinutes: RemindBeforeMinutes;
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
  readonly dueTime?: string | null;
  readonly reminderEnabled?: boolean;
  readonly remindBeforeMinutes?: RemindBeforeMinutes;
  readonly recurrence?: Partial<TodoRecurrenceRule> | null;
}

export interface TodoPatchInput {
  readonly title?: string;
  readonly memo?: string;
  readonly priority?: TodoPriority;
  readonly category?: TodoCategory;
  readonly dueDate?: string | null;
  readonly dueTime?: string | null;
  readonly reminderEnabled?: boolean;
  readonly remindBeforeMinutes?: RemindBeforeMinutes;
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
