import type { TodoCategory, TodoPriority } from '../types/todo';

export const TODO_STORAGE_KEY = 'veranex_todo_planner_v1';
export const TODO_POMODORO_STATS_KEY = 'veranex_todo_pomodoro_v1';
export const TODO_MAX_ITEMS = 500;
export const TODO_MAX_SUBTASKS = 30;

export interface PriorityMeta {
  readonly key: TodoPriority;
  readonly label: string;
  readonly shortLabel: string;
  readonly weight: number;
  readonly pillClass: string;
  readonly activeClass: string;
  readonly dotClass: string;
  readonly barColorClass: string;
}

export const PRIORITY_LIST: readonly PriorityMeta[] = [
  {
    key: 'urgent',
    label: '긴급 (P1)',
    shortLabel: '긴급',
    weight: 3,
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    dotClass: 'bg-rose-500',
    barColorClass: 'text-rose-500',
  },
  {
    key: 'important',
    label: '중요 (P2)',
    shortLabel: '중요',
    weight: 2,
    pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-xs',
    dotClass: 'bg-amber-500',
    barColorClass: 'text-amber-500',
  },
  {
    key: 'normal',
    label: '보통 (P3)',
    shortLabel: '보통',
    weight: 1,
    pillClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
    dotClass: 'bg-indigo-500',
    barColorClass: 'text-indigo-500',
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
  readonly badgeClass: string;
  readonly activeClass: string;
}

export const CATEGORY_LIST: readonly CategoryMeta[] = [
  {
    key: 'work',
    label: '업무',
    iconClass: 'fas fa-briefcase',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeClass: 'bg-indigo-600 text-white border-indigo-600',
  },
  {
    key: 'personal',
    label: '개인',
    iconClass: 'fas fa-house-user',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    key: 'shopping',
    label: '쇼핑',
    iconClass: 'fas fa-bag-shopping',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeClass: 'bg-amber-600 text-white border-amber-600',
  },
  {
    key: 'health',
    label: '건강',
    iconClass: 'fas fa-heart-pulse',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeClass: 'bg-rose-600 text-white border-rose-600',
  },
  {
    key: 'study',
    label: '공부',
    iconClass: 'fas fa-book-open',
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

export interface QuickRoutineStarter {
  readonly id: string;
  readonly title: string;
  readonly priority: TodoPriority;
  readonly category: TodoCategory;
  readonly dueOffsetDays: number | null;
  readonly memo: string;
}

/**
 * 초기 상태는 항상 0건(Empty State)을 유지하며,
 * 아래 루틴은 사용자가 칩을 직접 클릭했을 때만 실제 할 일로 등록됩니다.
 */
export const QUICK_STARTER_ROUTINES: readonly QuickRoutineStarter[] = [
  {
    id: 'routine-core-work',
    title: '오늘 핵심 업무 3가지 우선순위 정리',
    priority: 'urgent',
    category: 'work',
    dueOffsetDays: 0,
    memo: '가장 임팩트 큰 일 1개부터 25분 집중 타이머로 시작하기',
  },
  {
    id: 'routine-water',
    title: '물 2L 마시기 & 눈 휴식 스트레칭',
    priority: 'normal',
    category: 'health',
    dueOffsetDays: 0,
    memo: '오전·오후 500ml씩 나누어 수분 보충',
  },
  {
    id: 'routine-grocery',
    title: '장보기 및 생필품 재고 체크',
    priority: 'important',
    category: 'shopping',
    dueOffsetDays: 1,
    memo: '계란, 우유, 샐러드 채소 등 확인',
  },
  {
    id: 'routine-reading',
    title: '관심 분야 아티클·책 20분 읽기',
    priority: 'normal',
    category: 'study',
    dueOffsetDays: null,
    memo: '핵심 인사이트 3줄 요약 기록',
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
    title: '1초 빠른 할 일 등록 & 우선순위 배정',
    desc: '입력창에 해야 할 일을 적고 긴급(P1)·중요(P2)·보통(P3) 배지와 카테고리, 오늘·내일 마감일을 고른 뒤 Enter를 누르세요.',
    tip: '긴급한 일은 하루 최대 2~3개만 지정하면 번아웃 없이 실행력이 높아집니다.',
  },
  {
    step: 2,
    title: '서브태스크 세분화 & 25분 집중 타이머',
    desc: '크거나 막막한 할 일은 카드의 [세부 단계] 버튼으로 작은 행동 단위로 나누고, 핀(📌) 아이콘을 눌러 25분 포모도로 집중 타이머를 가동하세요.',
    tip: '작은 체크리스트 하나를 먼저 완료하면 도파민 피드백으로 다음 단계가 훨씬 수월해집니다.',
  },
  {
    step: 3,
    title: '실시간 리포트 · 휴지통 복구 · 백업 연동',
    desc: '오늘 리포트에서 달성률과 우선순위·카테고리 현황을 확인하고, 텍스트 복사나 마크다운(.md)·JSON 파일로 백업하세요. VeraNex 마이페이지에서도 실시간 동기화됩니다.',
    tip: '실수로 지운 할 일도 하단 5초 실행취소 또는 휴지통에서 1클릭 복구가 가능합니다.',
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
    question: '입력한 할 일 데이터가 외부 서버로 전송되나요?',
    answer: '전혀 전송되지 않습니다. VeraNex 스마트 투두 플래너는 100% 브라우저 로컬 저장소(LocalStorage)만을 사용하므로 업무 메모나 개인 일정이 외부 서버에 남지 않습니다.',
  },
  {
    question: '마이페이지(My Page)에서 보는 할 일과 어떻게 연동되나요?',
    answer: '동일한 브라우저의 로컬 저장소(veranex_todo_planner_v1)를 실시간 공유합니다. 마이페이지에서 할 일을 추가하거나 완료 체크하면 투두 플래너에 즉시 반영되고, 그 반대도 실시간 동기화됩니다.',
  },
  {
    question: '실수로 완료했거나 삭제한 할 일을 되살릴 수 있나요?',
    answer: '네. 삭제 시 영구 파기 대신 Soft Delete 방식으로 휴지통에 보관됩니다. 삭제 직후 하단 5초 실행취소(Undo) 버튼을 누르거나 우하단 휴지통 아이콘에서 언제든 복구할 수 있습니다.',
  },
  {
    question: '다른 PC나 스마트폰으로 할 일 목록을 옮기려면 어떻게 하나요?',
    answer: '리포트 영역의 [JSON 백업] 버튼을 눌러 백업 파일을 저장한 뒤, 새 기기나 다른 브라우저에서 [JSON 복원]을 선택하면 서브태스크와 마감일까지 그대로 안전하게 복구됩니다.',
  },
  {
    question: '포모도로 25분 집중 타이머는 어떻게 활용하면 좋나요?',
    answer: '할 일 카드 우측의 핀(📌) 아이콘을 클릭하면 해당 할 일이 타이머에 고정됩니다. 25분 동안 그 한 가지 일에만 몰입하고 5분 휴식하는 리듬을 반복하면 집중 효율이 크게 높아집니다.',
  },
  {
    question: '노션(Notion)이나 카카오톡에 오늘 할 일을 깔끔하게 공유할 수 있나요?',
    answer: '네. [리포트 복사]를 누르면 카카오톡이나 슬랙에 바로 붙여넣을 수 있는 요약본이 복사되며, [.md 저장]을 누르면 노션·옵시디언과 호환되는 마크다운 체크박스 문서가 저장됩니다.',
  },
];
