import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  CATEGORY_LIST,
  CATEGORY_MAP,
  PRIORITY_LIST,
  RECURRENCE_LIST,
  WEEKDAY_OPTIONS,
} from '../constants/todoMeta';
import type {
  RecurrenceType,
  TodoCategory,
  TodoItem,
  TodoPatchInput,
  TodoPriority,
} from '../types/todo';
import {
  formatNextOccurrenceLabel,
  getLocalTodayDateStr,
} from '../utils/recurrence';
import { getDueDateBadge } from '../utils/todoAnalytics';

interface TodoItemCardProps {
  readonly item: TodoItem;
  readonly isPinned: boolean;
  readonly isTodayView?: boolean;
  readonly canReorder: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onToggle: (id: string) => void;
  readonly onUpdate: (id: string, patch: TodoPatchInput) => void;
  readonly onSoftDelete: (id: string) => void;
  readonly onMoveOrder: (id: string, direction: 'up' | 'down') => void;
  readonly onTogglePin: (id: string) => void;
  readonly onAddSubtask: (todoId: string, title: string) => void;
  readonly onToggleSubtask: (todoId: string, subId: string) => void;
  readonly onRemoveSubtask: (todoId: string, subId: string) => void;
}

export default function TodoItemCard({
  item,
  isPinned,
  isTodayView = false,
  canReorder,
  isFirst,
  isLast,
  onToggle,
  onUpdate,
  onSoftDelete,
  onMoveOrder,
  onTogglePin,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
}: TodoItemCardProps) {
  const todayStr = getLocalTodayDateStr();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>(item.title);
  const [draftMemo, setDraftMemo] = useState<string>(item.memo);
  const [draftPriority, setDraftPriority] = useState<TodoPriority>(item.priority);
  const [draftCategory, setDraftCategory] = useState<TodoCategory>(item.category);
  const [draftDueDate, setDraftDueDate] = useState<string>(item.dueDate || '');

  const [draftRecType, setDraftRecType] = useState<RecurrenceType>(item.recurrence.type);
  const [draftInterval, setDraftInterval] = useState<number>(item.recurrence.interval || 1);
  const [draftWeekdays, setDraftWeekdays] = useState<number[]>(
    item.recurrence.weekdays ? [...item.recurrence.weekdays] : [new Date().getDay()]
  );
  const [draftMonthDay, setDraftMonthDay] = useState<number>(
    item.recurrence.monthDay ?? new Date().getDate()
  );
  const [draftYearMonth, setDraftYearMonth] = useState<number>(
    item.recurrence.yearMonth ?? new Date().getMonth() + 1
  );
  const [draftYearDay, setDraftYearDay] = useState<number>(
    item.recurrence.yearDay ?? new Date().getDate()
  );
  const [draftEndDate, setDraftEndDate] = useState<string>(item.recurrence.endDate || '');
  const [subtaskInput, setSubtaskInput] = useState<string>('');

  const categoryMeta = CATEGORY_MAP[item.category];
  const isUrgentActive = !item.completed && item.priority === 'urgent';
  const isImportantActive = !item.completed && item.priority === 'important';
  const isRecurring = item.occurrence.isRecurring;
  const isWorkdayStandby =
    item.recurrence.type === 'workday' && !item.occurrence.isDueToday && !item.completed;
  const standbyNextDate = item.occurrence.nextOccurrenceDate
    ? item.occurrence.nextOccurrenceDate.slice(5).replace('-', '/')
    : '다음 영업일';
  const dueBadge = !isRecurring ? getDueDateBadge(item.dueDate, item.completed, todayStr) : null;
  const nextOccLabel =
    isRecurring && !isWorkdayStandby
      ? formatNextOccurrenceLabel(item.occurrence.nextOccurrenceDate, todayStr, item.completed)
      : null;
  const completedSubtasks = item.subtasks.filter((s) => s.completed).length;

  const metaParts: { readonly key: string; readonly node: ReactNode }[] = [];
  if (isUrgentActive) {
    metaParts.push({
      key: 'urgent',
      node: <span className="text-rose-600 font-extrabold">긴급</span>,
    });
  }
  metaParts.push({
    key: 'category',
    node: <span>{categoryMeta.label}</span>,
  });
  if (isRecurring && item.occurrence.summaryLabel) {
    metaParts.push({
      key: 'recurrence',
      node: (
        <span className="inline-flex items-center gap-1 text-[#57534E]">
          <i className="fas fa-repeat text-[9px] text-indigo-500/80"></i>
          <span>{item.occurrence.summaryLabel}</span>
        </span>
      ),
    });
  }
  if (isRecurring && item.streakCount > 0) {
    metaParts.push({
      key: 'streak',
      node: <span className="text-emerald-700 font-semibold">🔥 {item.streakCount}연속</span>,
    });
  }
  if (isWorkdayStandby) {
    metaParts.push({
      key: 'standby',
      node: <span className="text-amber-700 font-semibold">휴무 대기 · {standbyNextDate}</span>,
    });
  }
  if (nextOccLabel && !(isTodayView && nextOccLabel === '오늘 반복 예정')) {
    metaParts.push({
      key: 'next-occ',
      node: <span>{nextOccLabel}</span>,
    });
  }
  if (dueBadge) {
    const isOverdue = dueBadge.label.includes('지연');
    const dueText = dueBadge.label === '오늘 (D-Day)' ? '오늘 마감' : dueBadge.label;
    metaParts.push({
      key: 'due',
      node: (
        <span className={isOverdue ? 'text-rose-600 font-bold' : undefined}>{dueText}</span>
      ),
    });
  }
  if (item.subtasks.length > 0) {
    metaParts.push({
      key: 'subtasks',
      node: <span>단계 {completedSubtasks}/{item.subtasks.length}</span>,
    });
  }
  if (!expanded && item.memo) {
    metaParts.push({
      key: 'memo',
      node: (
        <span className="inline-flex items-center gap-0.5 text-[#8E8579] max-w-[140px] truncate">
          <i className="far fa-note-sticky text-[9px] shrink-0"></i>
          <span className="truncate">{item.memo}</span>
        </span>
      ),
    });
  }

  const handleOpenEdit = () => {
    const now = new Date();
    setDraftTitle(item.title);
    setDraftMemo(item.memo);
    setDraftPriority(item.priority);
    setDraftCategory(item.category);
    setDraftDueDate(item.dueDate || '');
    setDraftRecType(item.recurrence.type);
    setDraftInterval(item.recurrence.interval || 1);
    setDraftWeekdays(
      item.recurrence.weekdays && item.recurrence.weekdays.length > 0
        ? [...item.recurrence.weekdays]
        : [now.getDay()]
    );
    setDraftMonthDay(item.recurrence.monthDay ?? now.getDate());
    setDraftYearMonth(item.recurrence.yearMonth ?? now.getMonth() + 1);
    setDraftYearDay(item.recurrence.yearDay ?? now.getDate());
    setDraftEndDate(item.recurrence.endDate || '');
    setIsEditing(true);
    setExpanded(true);
  };

  const toggleDraftWeekday = (day: number) => {
    setDraftWeekdays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSaveEdit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanedTitle = draftTitle.trim();
    if (!cleanedTitle) return;

    onUpdate(item.id, {
      title: cleanedTitle,
      memo: draftMemo.trim(),
      priority: draftPriority,
      category: draftCategory,
      dueDate: draftDueDate || null,
      recurrence:
        draftRecType === 'none'
          ? { type: 'none' }
          : {
              type: draftRecType,
              interval: draftInterval,
              weekdays: draftRecType === 'weekly' ? draftWeekdays : null,
              monthDay: draftRecType === 'monthly' ? draftMonthDay : null,
              yearMonth: draftRecType === 'yearly' ? draftYearMonth : null,
              yearDay: draftRecType === 'yearly' ? draftYearDay : null,
              endDate: draftEndDate || null,
            },
    });
    setIsEditing(false);
  };

  const handleAddSubtaskSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    onAddSubtask(item.id, trimmed);
    setSubtaskInput('');
  };

  return (
    <article
      data-workday-standby={isWorkdayStandby ? 'true' : 'false'}
      className={`group px-3.5 py-3 transition-colors ${
        item.completed
          ? 'bg-[#FAF8F5]/75 opacity-65'
          : isPinned
            ? 'bg-indigo-50/40 hover:bg-indigo-50/60'
            : isUrgentActive
              ? 'bg-rose-50/35 hover:bg-rose-50/55'
              : isWorkdayStandby
                ? 'bg-amber-50/25 hover:bg-amber-50/45'
                : 'bg-white hover:bg-[#FAF8F5]/80'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Astryx CheckboxInput */}
        <div className="pt-0.5 shrink-0">
          <CheckboxInput
            label={item.completed ? `${item.title} 완료 해제` : `${item.title} 완료 체크`}
            isLabelHidden
            size="md"
            value={item.completed}
            onChange={() => onToggle(item.id)}
          />
        </div>

        {/* 제목 + 조용한 1줄 텍스트 메타 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-left min-w-0 flex-1 flex items-center gap-1.5 cursor-pointer pt-0.5"
            >
              {isUrgentActive && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
              )}
              {isImportantActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
              )}
              <span
                className={`text-[14px] sm:text-[14.5px] font-bold leading-snug tracking-tight break-words transition-colors ${
                  item.completed
                    ? 'line-through text-[#9B9183]'
                    : 'text-[#1C1917] group-hover:text-indigo-700'
                }`}
              >
                {item.title}
              </span>
            </button>

            {/* 우측: 고정 핀(활성 시) + 단일 더보기(⋯) 버튼 */}
            <div className="flex items-center gap-0.5 shrink-0">
              {isPinned && !item.completed && (
                <button
                  type="button"
                  onClick={() => onTogglePin(item.id)}
                  aria-label="집중 타이머 핀 해제"
                  title="집중 타이머에 고정됨 (클릭해 해제)"
                  className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center text-[11px] cursor-pointer transition-colors"
                >
                  <i className="fas fa-thumbtack"></i>
                </button>
              )}

              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-label={`${item.title} 상세 및 관리`}
                aria-expanded={expanded}
                title="상세 · 수정 · 삭제"
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] cursor-pointer transition-colors ${
                  expanded
                    ? 'bg-[#EFEAE1] text-[#24211D]'
                    : 'text-[#A8A29E] hover:text-[#4D473F] hover:bg-[#F2EDE4]'
                }`}
              >
                <i className="fas fa-ellipsis"></i>
              </button>
            </div>
          </div>

          {metaParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] leading-tight text-[#78716C] font-medium">
              {metaParts.map((part, idx) => (
                <span key={part.key} className="inline-flex items-center gap-1.5">
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-[#D6CFC2]">
                      ·
                    </span>
                  )}
                  {part.node}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 확장 영역: 인라인 관리 바 + 수정 폼 + 메모 + 서브태스크 */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-[#F1ECE3] pl-8 space-y-2.5 animate-fade-in">
          {!isEditing && (
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1">
                {!item.completed && (
                  <button
                    type="button"
                    onClick={() => onTogglePin(item.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors border ${
                      isPinned
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] border-[#E5DDD0] text-[#4D473F]'
                    }`}
                  >
                    <i className="fas fa-thumbtack text-[10px]"></i>
                    <span>{isPinned ? '고정 해제' : '집중 고정'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#E5DDD0] text-[11px] font-bold text-[#4D473F] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <i className="fas fa-pen text-[10px]"></i>
                  <span>수정</span>
                </button>

                {canReorder && (
                  <div className="inline-flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => onMoveOrder(item.id, 'up')}
                      aria-label="위로 이동"
                      className="w-7 h-7 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] disabled:opacity-35 border border-[#E5DDD0] text-[#4D473F] flex items-center justify-center text-[10px] cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-chevron-up"></i>
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => onMoveOrder(item.id, 'down')}
                      aria-label="아래로 이동"
                      className="w-7 h-7 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EDE4] disabled:opacity-35 border border-[#E5DDD0] text-[#4D473F] flex items-center justify-center text-[10px] cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-chevron-down"></i>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSoftDelete(item.id)}
                aria-label={`${item.title} 삭제`}
                className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <i className="fas fa-trash-can text-[10px]"></i>
                <span>삭제</span>
              </button>
            </div>
          )}

          {isEditing ? (
            <form
              onSubmit={handleSaveEdit}
              className="space-y-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E5DDD0]"
            >
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                maxLength={160}
                aria-label="할 일 제목 수정"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D9D0C1] focus:border-indigo-500 text-xs font-bold text-[#24211D] outline-none"
              />
              <textarea
                value={draftMemo}
                onChange={(e) => setDraftMemo(e.target.value)}
                maxLength={400}
                rows={2}
                placeholder="상세 메모 (선택)"
                aria-label="할 일 메모 수정"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D9D0C1] focus:border-indigo-500 text-[11px] font-medium text-[#24211D] outline-none resize-none"
              />

              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  value={draftPriority}
                  onChange={(e) => setDraftPriority(e.target.value as TodoPriority)}
                  aria-label="우선순위 수정"
                  className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] text-[10px] font-bold text-[#24211D]"
                >
                  {PRIORITY_LIST.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value as TodoCategory)}
                  aria-label="카테고리 수정"
                  className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] text-[10px] font-bold text-[#24211D]"
                >
                  {CATEGORY_LIST.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={draftDueDate}
                  onChange={(e) => setDraftDueDate(e.target.value)}
                  aria-label="마감일 수정"
                  className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] text-[10px] font-bold text-[#24211D]"
                />
              </div>

              {/* 반복 규칙 수정 */}
              <div className="space-y-1.5 pt-1 border-t border-[#E5DDD0] text-[10px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-black text-[#6C655B]">반복 설정:</span>
                  <select
                    value={draftRecType}
                    onChange={(e) => {
                      setDraftRecType(e.target.value as RecurrenceType);
                      setDraftInterval(1);
                    }}
                    aria-label="반복 유형 수정"
                    className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                  >
                    {RECURRENCE_LIST.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  {draftRecType === 'workday' ? (
                    <>
                      <select
                        value={draftInterval}
                        onChange={(e) => setDraftInterval(Number(e.target.value))}
                        aria-label="영업일 반복 간격 수정"
                        className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        <option value={1}>영업일 매일</option>
                        <option value={2}>2영업일마다</option>
                        <option value={3}>3영업일마다</option>
                        <option value={5}>5영업일마다</option>
                      </select>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                        토·일·공휴일 제외
                      </span>
                    </>
                  ) : draftRecType !== 'none' ? (
                    <select
                      value={draftInterval}
                      onChange={(e) => setDraftInterval(Number(e.target.value))}
                      aria-label="반복 간격 수정"
                      className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                    >
                      <option value={1}>매 1주기</option>
                      <option value={2}>매 2주기</option>
                      <option value={3}>매 3주기</option>
                      <option value={4}>매 4주기</option>
                    </select>
                  ) : null}

                  {draftRecType === 'monthly' && (
                    <select
                      value={draftMonthDay}
                      onChange={(e) => setDraftMonthDay(Number(e.target.value))}
                      aria-label="월간 반복 일 수정"
                      className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}일
                        </option>
                      ))}
                    </select>
                  )}

                  {draftRecType === 'yearly' && (
                    <>
                      <select
                        value={draftYearMonth}
                        onChange={(e) => setDraftYearMonth(Number(e.target.value))}
                        aria-label="연간 반복 월 수정"
                        className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {m}월
                          </option>
                        ))}
                      </select>
                      <select
                        value={draftYearDay}
                        onChange={(e) => setDraftYearDay(Number(e.target.value))}
                        aria-label="연간 반복 일 수정"
                        className="px-2 py-1 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}일
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                {draftRecType === 'weekly' && (
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAY_OPTIONS.map((w) => {
                      const active = draftWeekdays.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleDraftWeekday(w.day)}
                          className={`w-6 h-6 rounded-md font-black border cursor-pointer ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-[#6C655B] border-[#D9D0C1]'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {draftRecType !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#6C655B] font-bold">종료일:</span>
                    <input
                      type="date"
                      value={draftEndDate}
                      onChange={(e) => setDraftEndDate(e.target.value)}
                      aria-label="반복 종료일 수정"
                      className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  label="취소"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                />
                <Button
                  type="submit"
                  label="저장"
                  variant="primary"
                  size="sm"
                />
              </div>
            </form>
          ) : (
            item.memo && (
              <p className="text-[11px] text-[#4D473F] bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E5DDD0] leading-relaxed">
                {item.memo}
              </p>
            )
          )}

          {/* 서브태스크 리스트 */}
          <div className="space-y-1.5">
            {item.subtasks.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-2 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#EAE3D7]"
              >
                <div className="flex-1 min-w-0">
                  <CheckboxInput
                    label={sub.title}
                    size="sm"
                    value={sub.completed}
                    onChange={() => onToggleSubtask(item.id, sub.id)}
                  />
                </div>
                <IconButton
                  label="세부 단계 삭제"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSubtask(item.id, sub.id)}
                  icon={<i className="fas fa-times text-[10px]"></i>}
                />
              </div>
            ))}

            <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                maxLength={120}
                placeholder="세부 단계 추가 후 Enter..."
                aria-label="세부 단계 입력"
                className="flex-1 h-7 px-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5DDD0] focus:bg-white focus:border-indigo-500 text-[11px] font-medium text-[#24211D] outline-none"
              />
              <Button
                type="submit"
                label="+ 단계"
                variant="secondary"
                size="sm"
              />
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
