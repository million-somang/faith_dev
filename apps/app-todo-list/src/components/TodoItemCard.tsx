import { useState, type FormEvent } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  CATEGORY_LIST,
  CATEGORY_MAP,
  PRIORITY_LIST,
  PRIORITY_MAP,
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

  const priorityMeta = PRIORITY_MAP[item.priority];
  const categoryMeta = CATEGORY_MAP[item.category];
  const isRecurring = item.occurrence.isRecurring;
  const dueBadge = !isRecurring ? getDueDateBadge(item.dueDate, item.completed, todayStr) : null;
  const nextOccLabel = isRecurring
    ? formatNextOccurrenceLabel(item.occurrence.nextOccurrenceDate, todayStr, item.completed)
    : null;
  const completedSubtasks = item.subtasks.filter((s) => s.completed).length;

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
      className={`group relative overflow-hidden rounded-xl border transition-all ${
        item.completed
          ? 'bg-[#F6F3EC] border-[#EAE3D7] opacity-80'
          : isPinned
            ? 'bg-indigo-50/45 border-indigo-300 ring-1 ring-indigo-300 shadow-sm'
            : 'bg-white border-[#E4DBD0] hover:border-indigo-300 shadow-[0_1px_3px_rgba(36,33,29,0.06)] hover:shadow-md'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 ${
          item.completed ? 'bg-stone-300' : priorityMeta.dotClass
        }`}
      />
      <div className="pl-3.5 pr-2.5 py-2.5 sm:pl-4 sm:pr-3 sm:py-3">
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

          {/* 메인 텍스트 + Astryx Badge 행 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="text-left min-w-0 flex-1 cursor-pointer pt-0.5"
              >
                <p
                  className={`text-[14px] sm:text-[15px] font-extrabold leading-snug tracking-tight break-words transition-colors ${
                    item.completed
                      ? 'line-through text-[#8E8579]'
                      : 'text-[#1C1917] group-hover:text-indigo-700'
                  }`}
                >
                  {item.title}
                </p>
              </button>

              {/* 우측 Astryx IconButton 액션 (시선 분산 완화를 위해 기본 톤다운, 호버/포커스 시 선명) */}
              <div className="flex items-center gap-0.5 shrink-0 opacity-55 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              {!item.completed && (
                <IconButton
                  label="집중 타이머에 고정"
                  tooltip={isPinned ? '집중 타이머 핀 해제' : '25분 집중 타이머에 고정'}
                  variant={isPinned ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onTogglePin(item.id)}
                  icon={<i className="fas fa-thumbtack text-[10px]"></i>}
                />
              )}

              <IconButton
                label="할 일 수정"
                tooltip="수정 및 반복 설정"
                variant="ghost"
                size="sm"
                onClick={handleOpenEdit}
                icon={<i className="fas fa-pen text-[10px]"></i>}
              />

              {canReorder && (
                <>
                  <IconButton
                    label="위로 이동"
                    variant="ghost"
                    size="sm"
                    isDisabled={isFirst}
                    onClick={() => onMoveOrder(item.id, 'up')}
                    icon={<i className="fas fa-chevron-up text-[9px]"></i>}
                  />
                  <IconButton
                    label="아래로 이동"
                    variant="ghost"
                    size="sm"
                    isDisabled={isLast}
                    onClick={() => onMoveOrder(item.id, 'down')}
                    icon={<i className="fas fa-chevron-down text-[9px]"></i>}
                  />
                </>
              )}

              <IconButton
                label={`${item.title} 삭제`}
                tooltip="휴지통으로 이동"
                variant="ghost"
                size="sm"
                onClick={() => onSoftDelete(item.id)}
                icon={<i className="fas fa-trash-can text-[10px] text-rose-600"></i>}
              />
            </div>
          </div>

          {/* Astryx Badge 메타 행 (우선순위 · 카테고리 · 반복 · 스트릭 · 예정일) */}
          <div className="flex flex-wrap items-center gap-1 mt-1.5 opacity-90">
            <Badge variant={priorityMeta.badgeVariant} label={priorityMeta.shortLabel} />
            <Badge
              variant={categoryMeta.badgeVariant}
              icon={<i className={`${categoryMeta.iconClass} text-[9px]`}></i>}
              label={categoryMeta.label}
            />

            {isRecurring && item.occurrence.summaryLabel && (
              <Badge
                variant="info"
                icon={<i className="fas fa-repeat text-[9px]"></i>}
                label={item.occurrence.summaryLabel}
              />
            )}

            {isRecurring && item.streakCount > 0 && (
              <Badge
                variant="success"
                label={`🔥 ${item.streakCount}연속`}
              />
            )}

            {nextOccLabel && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[#E5DDD0] bg-[#FAF8F5] text-[9px] font-bold text-[#6C655B]">
                <i className="far fa-calendar-check text-[8px]"></i>
                {nextOccLabel}
              </span>
            )}

            {dueBadge && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] ${dueBadge.badgeClass}`}
              >
                <i className="far fa-clock text-[8px]"></i>
                {dueBadge.label}
              </span>
            )}

            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#E5DDD0] text-[9px] font-bold text-[#6C655B] cursor-pointer"
            >
              <i className="fas fa-list-ul text-[8px]"></i>
              <span>
                {item.subtasks.length > 0
                  ? `단계 ${completedSubtasks}/${item.subtasks.length}`
                  : '메모·단계'}
              </span>
              <i
                className={`fas fa-chevron-down text-[8px] transition-transform ${
                  expanded ? 'rotate-180' : ''
                }`}
              ></i>
            </button>
          </div>

          {!expanded && item.memo && (
            <p className="text-[10px] text-[#6C655B] mt-1 truncate">{item.memo}</p>
          )}
        </div>
      </div>

      {/* 확장 영역: 인라인 수정(반복 규칙 포함) + 서브태스크 */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-[#EAE3D7] pl-6 space-y-2.5 animate-fade-in">
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

                  {draftRecType !== 'none' && (
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
                  )}

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
      </div>
    </article>
  );
}
