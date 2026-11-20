import { useState, type FormEvent } from 'react';
import { CATEGORY_LIST, CATEGORY_MAP, PRIORITY_LIST, PRIORITY_MAP } from '../constants/todoMeta';
import type { TodoCategory, TodoItem, TodoPatchInput, TodoPriority } from '../types/todo';
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
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>(item.title);
  const [draftMemo, setDraftMemo] = useState<string>(item.memo);
  const [draftPriority, setDraftPriority] = useState<TodoPriority>(item.priority);
  const [draftCategory, setDraftCategory] = useState<TodoCategory>(item.category);
  const [draftDueDate, setDraftDueDate] = useState<string>(item.dueDate || '');
  const [subtaskInput, setSubtaskInput] = useState<string>('');

  const priorityMeta = PRIORITY_MAP[item.priority];
  const categoryMeta = CATEGORY_MAP[item.category];
  const dueBadge = getDueDateBadge(item.dueDate, item.completed);
  const completedSubtasks = item.subtasks.filter((s) => s.completed).length;

  const handleOpenEdit = () => {
    setDraftTitle(item.title);
    setDraftMemo(item.memo);
    setDraftPriority(item.priority);
    setDraftCategory(item.category);
    setDraftDueDate(item.dueDate || '');
    setIsEditing(true);
    setExpanded(true);
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
      className={`rounded-2xl border transition-all p-2.5 sm:p-3 ${
        item.completed
          ? 'bg-[#FAF8F5]/90 border-[#EBE6DD] opacity-85'
          : isPinned
          ? 'bg-indigo-50/40 border-indigo-300 shadow-xs'
          : 'bg-white border-[#EBE6DD] hover:border-indigo-200 shadow-2xs'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* 커스텀 스프링 SVG 체크박스 */}
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          aria-label={item.completed ? `${item.title} 완료 해제` : `${item.title} 완료 체크`}
          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 ${
            item.completed
              ? 'bg-emerald-600 border-emerald-600 text-white animate-check-pop'
              : 'bg-white border-[#CEC6B8] hover:border-indigo-500 text-transparent'
          }`}
        >
          <svg viewBox="0 0 16 16" className="w-3 h-3" aria-hidden="true">
            <path
              d="M3.5 8.2L6.6 11.2L12.5 4.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 메인 텍스트 + 메타 뱃지 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-left min-w-0 flex-1 cursor-pointer group"
            >
              <p
                className={`text-xs sm:text-[13px] font-extrabold leading-snug break-words transition-colors ${
                  item.completed
                    ? 'line-through text-[#948D82]'
                    : 'text-[#2D2A26] group-hover:text-indigo-700'
                }`}
              >
                {item.title}
              </p>
            </button>

            {/* 우측 컴팩트 액션 버튼 */}
            <div className="flex items-center gap-0.5 shrink-0">
              {!item.completed && (
                <button
                  type="button"
                  onClick={() => onTogglePin(item.id)}
                  title={isPinned ? '집중 타이머 핀 해제' : '25분 집중 타이머에 고정'}
                  aria-label="집중 타이머에 고정"
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] transition-colors cursor-pointer ${
                    isPinned
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-[#948D82] hover:bg-[#F5F2EB] hover:text-indigo-600'
                  }`}
                >
                  <i className="fas fa-thumbtack"></i>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenEdit}
                title="할 일 수정"
                aria-label="할 일 수정"
                className="w-6 h-6 rounded-lg text-[#948D82] hover:bg-[#F5F2EB] hover:text-indigo-600 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
              >
                <i className="fas fa-pen"></i>
              </button>

              {canReorder && (
                <>
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => onMoveOrder(item.id, 'up')}
                    title="위로 이동"
                    aria-label="위로 이동"
                    className="w-5 h-6 rounded-md text-[#A39C90] hover:bg-[#F5F2EB] hover:text-[#2D2A26] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[9px] cursor-pointer"
                  >
                    <i className="fas fa-chevron-up"></i>
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => onMoveOrder(item.id, 'down')}
                    title="아래로 이동"
                    aria-label="아래로 이동"
                    className="w-5 h-6 rounded-md text-[#A39C90] hover:bg-[#F5F2EB] hover:text-[#2D2A26] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[9px] cursor-pointer"
                  >
                    <i className="fas fa-chevron-down"></i>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => onSoftDelete(item.id)}
                title="휴지통으로 이동"
                aria-label={`${item.title} 삭제`}
                className="w-6 h-6 rounded-lg text-[#948D82] hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
              >
                <i className="fas fa-trash-can"></i>
              </button>
            </div>
          </div>

          {/* 메타 칩 줄 */}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-black ${priorityMeta.pillClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dotClass}`}></span>
              {priorityMeta.shortLabel}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${categoryMeta.badgeClass}`}
            >
              <i className={`${categoryMeta.iconClass} text-[8px]`}></i>
              {categoryMeta.label}
            </span>

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
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E5E0D5] text-[9px] font-bold text-[#6B645B] cursor-pointer"
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

          {/* 메모 요약 (접힘 상태일 때 한 줄 미리보기) */}
          {!expanded && item.memo && (
            <p className="text-[10px] text-[#7A7369] mt-1 truncate">{item.memo}</p>
          )}
        </div>
      </div>

      {/* 확장 아코디언: 편집 폼 또는 메모 + 서브태스크 체크리스트 */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-[#F0EBE2] pl-7 space-y-2.5 animate-fade-in">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DD]">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                maxLength={160}
                aria-label="할 일 제목 수정"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DFD9CE] focus:border-indigo-500 text-xs font-bold text-[#2D2A26] outline-none"
              />
              <textarea
                value={draftMemo}
                onChange={(e) => setDraftMemo(e.target.value)}
                maxLength={400}
                rows={2}
                placeholder="상세 메모 (선택)"
                aria-label="할 일 메모 수정"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DFD9CE] focus:border-indigo-500 text-[11px] font-medium text-[#2D2A26] outline-none resize-none"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  value={draftPriority}
                  onChange={(e) => setDraftPriority(e.target.value as TodoPriority)}
                  aria-label="우선순위 수정"
                  className="px-2 py-1 rounded-lg bg-white border border-[#DFD9CE] text-[10px] font-bold text-[#2D2A26]"
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
                  className="px-2 py-1 rounded-lg bg-white border border-[#DFD9CE] text-[10px] font-bold text-[#2D2A26]"
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
                  className="px-2 py-1 rounded-lg bg-white border border-[#DFD9CE] text-[10px] font-bold text-[#2D2A26]"
                />
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-stone-700 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black cursor-pointer"
                >
                  저장
                </button>
              </div>
            </form>
          ) : (
            item.memo && (
              <p className="text-[11px] text-[#57514A] bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#EBE6DD] leading-relaxed">
                {item.memo}
              </p>
            )
          )}

          {/* 서브태스크 리스트 */}
          <div className="space-y-1.5">
            {item.subtasks.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-2 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#EFEAE0]"
              >
                <button
                  type="button"
                  onClick={() => onToggleSubtask(item.id, sub.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 text-[8px] ${
                      sub.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-[#CEC6B8] text-transparent'
                    }`}
                  >
                    <i className="fas fa-check"></i>
                  </span>
                  <span
                    className={`text-[11px] font-semibold truncate ${
                      sub.completed ? 'line-through text-[#A39C90]' : 'text-[#2D2A26]'
                    }`}
                  >
                    {sub.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSubtask(item.id, sub.id)}
                  aria-label="세부 단계 삭제"
                  className="text-[10px] text-[#A39C90] hover:text-rose-600 px-1 cursor-pointer"
                >
                  <i className="fas fa-times"></i>
                </button>
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
                className="flex-1 h-7 px-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D5] focus:bg-white focus:border-indigo-500 text-[11px] font-medium text-[#2D2A26] outline-none"
              />
              <button
                type="submit"
                className="h-7 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black cursor-pointer shrink-0"
              >
                + 단계
              </button>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
