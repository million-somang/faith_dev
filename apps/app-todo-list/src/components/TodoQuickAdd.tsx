import { useState, type FormEvent, type RefObject } from 'react';
import { CATEGORY_LIST, PRIORITY_LIST } from '../constants/todoMeta';
import type { TodoCategory, TodoDraftInput, TodoPriority } from '../types/todo';
import { getLocalDateString, getOffsetDateString } from '../utils/todoAnalytics';

interface TodoQuickAddProps {
  readonly inputRef: RefObject<HTMLInputElement>;
  readonly onAdd: (draft: TodoDraftInput) => void;
}

export default function TodoQuickAdd({ inputRef, onAdd }: TodoQuickAddProps) {
  const [title, setTitle] = useState<string>('');
  const [priority, setPriority] = useState<TodoPriority>('important');
  const [category, setCategory] = useState<TodoCategory>('work');
  const [dueDate, setDueDate] = useState<string | null>(() => getLocalDateString());
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  const todayStr = getLocalDateString();
  const tomorrowStr = getOffsetDateString(1);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const domValue = inputRef.current ? inputRef.current.value : '';
    const trimmed = (domValue || title).trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      priority,
      category,
      dueDate,
    });
    setTitle('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-3 border border-[#EBE6DD] shadow-2xs space-y-2 shrink-0"
    >
      {/* 1행: 1초 빠른 입력 + h-9.5 추가 버튼 */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            data-screenshot-input="주간 업무 리포트 정리 및 장보기"
            placeholder="할 일을 입력하고 Enter (단축키 /)"
            aria-label="새 할 일 제목 입력"
            className="w-full h-9.5 pl-3 pr-2.5 bg-[#FAF8F5] border border-[#E2DDD3] focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-bold text-[#2D2A26] placeholder-[#A39C90] outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          data-screenshot-click="action"
          aria-label="할 일 추가"
          className="h-9.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <i className="fas fa-plus text-[10px]"></i>
          <span>추가</span>
        </button>
      </div>

      {/* 2행: 우선순위 + 마감일 (오버플로우 없이 한눈에 노출) */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-center gap-1 shrink-0">
          {PRIORITY_LIST.map((item) => {
            const active = priority === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setPriority(item.key)}
                aria-label={`우선순위 ${item.shortLabel} 선택`}
                className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  active ? item.activeClass : 'bg-[#FAF8F5] text-[#6B645B] border-[#E5E0D5] hover:bg-[#F2ECE1]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    active ? 'bg-white' : item.dotClass
                  }`}
                ></span>
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setDueDate(dueDate === todayStr ? null : todayStr);
              setShowCustomDate(false);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
              dueDate === todayStr
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[#FAF8F5] text-[#6B645B] border-[#E5E0D5] hover:bg-[#F2ECE1]'
            }`}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => {
              setDueDate(dueDate === tomorrowStr ? null : tomorrowStr);
              setShowCustomDate(false);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
              dueDate === tomorrowStr
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[#FAF8F5] text-[#6B645B] border-[#E5E0D5] hover:bg-[#F2ECE1]'
            }`}
          >
            내일
          </button>
          <button
            type="button"
            onClick={() => setShowCustomDate((prev) => !prev)}
            aria-label="직접 마감일 선택"
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              showCustomDate || (dueDate !== null && dueDate !== todayStr && dueDate !== tomorrowStr)
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-[#FAF8F5] text-[#6B645B] border-[#E5E0D5] hover:bg-[#F2ECE1]'
            }`}
          >
            <i className="far fa-calendar text-[9px]"></i>
            <span>
              {dueDate && dueDate !== todayStr && dueDate !== tomorrowStr
                ? dueDate.slice(5)
                : '날짜'}
            </span>
          </button>
        </div>
      </div>

      {/* 3행: 카테고리 5종 균등 배치 */}
      <div className="grid grid-cols-5 gap-1">
        {CATEGORY_LIST.map((cat) => {
          const active = category === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              aria-label={`카테고리 ${cat.label} 선택`}
              className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                active ? cat.activeClass : 'bg-[#FAF8F5] text-[#6B645B] border-[#E5E0D5] hover:bg-[#F2ECE1]'
              }`}
            >
              <i className={`${cat.iconClass} text-[9px]`}></i>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 사용자 지정 날짜 입력 (토글) */}
      {showCustomDate && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F0EBE2] animate-fade-in">
          <label className="text-[10px] font-bold text-[#7A7369] shrink-0">마감일 지정</label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value || null)}
              aria-label="마감일 날짜 선택"
              className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2DDD3] text-[11px] font-bold text-[#2D2A26] outline-none focus:border-indigo-500"
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => {
                  setDueDate(null);
                  setShowCustomDate(false);
                }}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-600 cursor-pointer"
              >
                없음
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
