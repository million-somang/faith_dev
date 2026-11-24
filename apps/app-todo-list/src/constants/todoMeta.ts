import type { RecurrenceType, TodoCategory, TodoPriority, TodoRecurrenceRule } from '../types/todo';

export const TODO_STORAGE_KEY = 'veranex_todo_planner_v1';
export const TODO_MIGRATED_MARKER_KEY = 'veranex_todo_db_migrated_v1';
export const TODO_POMODORO_STATS_KEY = 'veranex_todo_pomodoro_v1';
export const TODO_POMODORO_SETTINGS_KEY = 'veranex_todo_pomodoro_settings_v1';
export const TODO_POMODORO_THEME_KEY = 'veranex_todo_pomodoro_theme_v1';
export const POMODORO_MIN_MINUTES = 1;
export const POMODORO_MAX_MINUTES = 180;
export const POMODORO_DEFAULT_FOCUS_MINUTES = 25;
export const POMODORO_DEFAULT_BREAK_MINUTES = 5;
export const POMODORO_FOCUS_PRESETS = [15, 25, 50] as const;
export const POMODORO_BREAK_PRESETS = [5, 10, 15] as const;
export const TODO_MAX_ITEMS = 500;
export const TODO_MAX_SUBTASKS = 30;

export interface PriorityMeta {
  readonly key: TodoPriority;
  readonly label: string;
  readonly shortLabel: string;
  readonly weight: number;
  readonly badgeVariant: 'red' | 'yellow' | 'blue';
  readonly pillClass: string;
  readonly activeClass: string;
  readonly dotClass: string;
}

export const PRIORITY_LIST: readonly PriorityMeta[] = [
  {
    key: 'urgent',
    label: '긴급 (P1)',
    shortLabel: '긴급',
    weight: 3,
    badgeVariant: 'red',
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeClass: 'bg-rose-600 text-white border-rose-600',
    dotClass: 'bg-rose-500',
  },
  {
    key: 'important',
    label: '중요 (P2)',
    shortLabel: '중요',
    weight: 2,
    badgeVariant: 'yellow',
    pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeClass: 'bg-amber-500 text-white border-amber-500',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'normal',
    label: '보통 (P3)',
    shortLabel: '보통',
    weight: 1,
    badgeVariant: 'blue',
    pillClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeClass: 'bg-indigo-600 text-white border-indigo-600',
    dotClass: 'bg-indigo-500',
  },
];

export const PRIORITY_MAP: Record<TodoPriority, PriorityMeta> = {
  urgent: PRIORITY_LIST[0],
  important: PRIORITY_LIST[1],
  normal: PRIORITY_LIST[2],
};

export interface CategoryMeta {
  readonly key: TodoCategory;
  readonly label: string;
  readonly iconClass: string;
  readonly badgeVariant: 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
  readonly badgeClass: string;
  readonly activeClass: string;
}

export const CATEGORY_LIST: readonly CategoryMeta[] = [
  {
    key: 'work',
    label: '업무',
    iconClass: 'fas fa-briefcase',
    badgeVariant: 'purple',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeClass: 'bg-indigo-600 text-white border-indigo-600',
  },
  {
    key: 'personal',
    label: '개인',
    iconClass: 'fas fa-house-user',
    badgeVariant: 'green',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    key: 'shopping',
    label: '쇼핑',
    iconClass: 'fas fa-bag-shopping',
    badgeVariant: 'orange',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeClass: 'bg-amber-600 text-white border-amber-600',
  },
  {
    key: 'health',
    label: '건강',
    iconClass: 'fas fa-heart-pulse',
    badgeVariant: 'pink',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeClass: 'bg-rose-600 text-white border-rose-600',
  },
  {
    key: 'study',
    label: '공부',
    iconClass: 'fas fa-book-open',
    badgeVariant: 'cyan',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    activeClass: 'bg-sky-600 text-white border-sky-600',
  },
];

export const CATEGORY_MAP: Record<TodoCategory, CategoryMeta> = {
  work: CATEGORY_LIST[0],
  personal: CATEGORY_LIST[1],
  shopping: CATEGORY_LIST[2],
  health: CATEGORY_LIST[3],
  study: CATEGORY_LIST[4],
};

export interface RecurrenceOptionMeta {
  readonly key: RecurrenceType;
  readonly label: string;
  readonly shortLabel: string;
}

export const RECURRENCE_LIST: readonly RecurrenceOptionMeta[] = [
  { key: 'none', label: '반복 안함', shortLabel: '1회' },
  { key: 'daily', label: '매일 반복', shortLabel: '매일' },
  { key: 'workday', label: '영업일 (토·일·공휴일 제외)', shortLabel: '영업일' },
  { key: 'weekly', label: '주단위 반복', shortLabel: '매주' },
  { key: 'monthly', label: '월단위 반복', shortLabel: '매월' },
  { key: 'yearly', label: '년단위 반복', shortLabel: '매년' },
];

export const WEEKDAY_OPTIONS: readonly { readonly day: number; readonly label: string }[] = [
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
  { day: 0, label: '일' },
];

export interface QuickRoutineStarter {
  readonly id: string;
  readonly title: string;
  readonly priority: TodoPriority;
  readonly category: TodoCategory;
  readonly dueOffsetDays: number | null;
  readonly memo: string;
  readonly recurrence?: Partial<TodoRecurrenceRule>;
}

/**
 * 초기 상태는 항상 0건(Empty State)을 유지하며,
 * 아래 루틴은 사용자가 칩을 직접 클릭했을 때만 실제 할 일로 등록됩니다.
 */
export const QUICK_STARTER_ROUTINES: readonly QuickRoutineStarter[] = [
  {
    id: 'routine-water-daily',
    title: '아침 물 1잔 마시기 & 5분 스트레칭',
    priority: 'normal',
    category: 'health',
    dueOffsetDays: 0,
    memo: '매일 아침 기상 직후 수분 보충 및 목·어깨 스트레칭',
    recurrence: { type: 'daily', interval: 1 },
  },
  {
    id: 'routine-work-weekday',
    title: '오늘 핵심 업무 3가지 우선순위 정리',
    priority: 'urgent',
    category: 'work',
    dueOffsetDays: 0,
    memo: '가장 임팩트 큰 일 1개부터 25분 집중 타이머로 시작하기',
    recurrence: { type: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] },
  },
  {
    id: 'routine-monthly-bill',
    title: '월간 고정지출 · 공과금 & 가계부 정산',
    priority: 'important',
    category: 'personal',
    dueOffsetDays: 0,
    memo: '카드값·관리비·정기구독 내역 한눈에 점검하기',
    recurrence: { type: 'monthly', interval: 1, monthDay: 25 },
  },
  {
    id: 'routine-yearly-checkup',
    title: '연간 건강검진 예약 & 가족 기념일 점검',
    priority: 'important',
    category: 'health',
    dueOffsetDays: 0,
    memo: '매년 놓치기 쉬운 건강검진과 주요 일정 미리 확인',
    recurrence: { type: 'yearly', interval: 1, yearMonth: 11, yearDay: 20 },
  },
];

export interface HowToStepItem {
  readonly step: number;
  readonly title: string;
  readonly desc: string;
  readonly tip: string;
}

export const HOW_TO_STEPS: readonly HowToStepItem[] = [
  {
    step: 1,
    title: '할 일 입력 & 매일·주·월·년 반복 설정',
    desc: '해야 할 일을 입력하고 우선순위(긴급/중요/보통), 카테고리, 반복 주기(반복 안함/매일/매주 요일/매월 N일/매년 M월 D일)를 한 번에 지정하세요.',
    tip: '반복 루틴은 해당 주기를 완료하면 연속 달성 스트릭(🔥)이 쌓이고 다음 주기에 자동으로 초기화됩니다.',
  },
  {
    step: 2,
    title: 'DB 영구 저장 · 마이페이지 실시간 동기화',
    desc: 'VeraNex 계정으로 로그인하면 모든 할 일과 반복 이력이 데이터베이스(SQLite)에 안전하게 저장되어 PC·모바일·마이페이지 어디서나 즉시 동기화됩니다.',
    tip: '비회원 상태에서 로컬로 작성한 목록도 로그인 후 상단 배너 클릭 한 번으로 DB에 그대로 옮길 수 있습니다.',
  },
  {
    step: 3,
    title: '25분 집중 타이머 · 리포트 · 휴지통 복구',
    desc: '카드 핀(📌)을 눌러 25분 포모도로 집중 타이머를 가동하고, 달성률 리포트를 확인하거나 마크다운(.md)·JSON으로 내보내세요.',
    tip: '실수로 삭제한 항목도 DB Soft Delete로 보호되어 5초 실행취소 또는 휴지통에서 1클릭 복구가 가능합니다.',
  },
];

export interface KeyboardShortcutRow {
  readonly keyLabel: string;
  readonly actionLabel: string;
}

export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcutRow[] = [
  { keyLabel: '/', actionLabel: '할 일 빠른 입력창으로 즉시 포커스 이동' },
  { keyLabel: 'Enter', actionLabel: '입력 중인 할 일 바로 등록' },
  { keyLabel: 'Ctrl + Z', actionLabel: '방금 삭제한 할 일 1클릭 실행취소(Undo)' },
  { keyLabel: 'Esc', actionLabel: '열린 편집창 및 휴지통·법적 안내 모달 닫기' },
];

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export const TODO_FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: '작성한 할 일은 DB에 영구 저장되나요?',
    answer: '네. VeraNex에 로그인한 상태에서는 모든 할 일과 매일/매주/매월/매년 반복 규칙, 완료 이력이 서버 데이터베이스(SQLite)에 영구 저장됩니다. 로그인하지 않은 상태에서는 브라우저 로컬 임시 모드로 동작하며, 로그인 시 1클릭으로 DB에 이관할 수 있습니다.',
  },
  {
    question: '매일 · 주단위 · 월단위 · 년단위 반복은 어떻게 작동하나요?',
    answer: '매일(1~365일 간격), 매주(월~일 다중 요일 선택 및 평일·주말 프리셋), 매월(1~31일 지정, 31일 지정 시 2월·4월 등 짧은 달은 말일로 자동 보정), 매년(특정 월/일 및 윤년 2/29 보정) 반복을 지원합니다. 완료 체크 시 이번 주기만 완료 처리되고 다음 주기 도래 시 자동으로 다시 활성화됩니다.',
  },
  {
    question: '마이페이지(My Page)와 투두 팝업 창이 실시간으로 연동되나요?',
    answer: '네. 동일한 DB API와 실시간 BroadcastChannel을 공유합니다. 새 창 투두 플래너에서 반복 루틴을 완료 체크하거나 추가하면 마이페이지 위젯에도 즉시 반영됩니다.',
  },
  {
    question: '실수로 완료했거나 삭제한 할 일을 되살릴 수 있나요?',
    answer: '네. 모든 삭제 요청은 DB에서 영구 파기(Hard Delete)하지 않고 Soft Delete(휴지통 보관)로 처리됩니다. 삭제 직후 5초 실행취소 또는 우하단 휴지통에서 언제든 1클릭으로 복구할 수 있습니다.',
  },
  {
    question: '포모도로 25분 집중 타이머는 어떻게 활용하면 좋나요?',
    answer: '할 일 카드 우측의 핀(📌) 아이콘을 클릭하면 해당 할 일이 타이머에 고정됩니다. 25분 몰입 후 5분 휴식 리듬으로 반복하면 집중 효율이 크게 높아집니다.',
  },
  {
    question: '노션(Notion)이나 카카오톡에 오늘 할 일을 깔끔하게 공유할 수 있나요?',
    answer: '네. [리포트 복사]로 요약 텍스트를 복사하거나 [.md 저장]으로 반복 배지와 체크박스가 포함된 마크다운 문서를 다운로드할 수 있습니다.',
  },
];
