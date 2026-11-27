import { useState, type FormEvent, type RefObject } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ToggleButton } from '@astryxdesign/core/ToggleButton';
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
  TodoDraftInput,
  TodoPriority,
  TodoRecurrenceRule,
} from '../types/todo';
import {
  evaluateTodoOccurrence,
  formatRecurrenceSummary,
  getNonWorkdayReason,
  normalizeRecurrenceRule,
} from '../utils/recurrence';
import { getLocalDateString, getOffsetDateString } from '../utils/todoAnalytics';

interface TodoQuickAddProps {
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly onAdd: (draft: TodoDraftInput) => void;
  readonly onOpenDetailModal: (initialTitle: string) => void;
}

export default function TodoQuickAdd({ inputRef, onAdd, onOpenDetailModal }: TodoQuickAddProps) {
  const now = new Date();
  const [title, setTitle] = useState<string>('');
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [priority, setPriority] = useState<TodoPriority>('important');
  const [category, setCategory] = useState<TodoCategory>('work');
  const [dueDate, setDueDate] = useState<string | null>(() => getLocalDateString());
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  // 반복(Recurrence) 상태
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [interval, setInterval] = useState<number>(1);
  const [weekdays, setWeekdays] = useState<number[]>(() => [now.getDay()]);
  const [monthDay, setMonthDay] = useState<number>(() => now.getDate());
  const [yearMonth, setYearMonth] = useState<number>(() => now.getMonth() + 1);
  const [yearDay, setYearDay] = useState<number>(() => now.getDate());
  const [endDate, setEndDate] = useState<string>('');
  const [showEndDate, setShowEndDate] = useState<boolean>(false);

  const todayStr = getLocalDateString();
  const tomorrowStr = getOffsetDateString(1);
  const nonWorkdayReason = getNonWorkdayReason(todayStr);
  const nextWorkdayLabel = (() => {
    if (!nonWorkdayReason) return null;
    const occ = evaluateTodoOccurrence({
      rule: normalizeRecurrenceRule({ type: 'workday', interval }, dueDate ?? todayStr),
      anchorDate: dueDate ?? todayStr,
      lastCompletedPeriod: null,
      completed: false,
      targetDate: todayStr,
    });
    return occ.nextOccurrenceDate
      ? occ.nextOccurrenceDate.slice(5).replace('-', '/')
      : '다음 영업일';
  })();
  const selectedPriority = PRIORITY_MAP[priority];
  const selectedCategory = CATEGORY_MAP[category];
  const dueShortLabel =
    dueDate === todayStr
      ? '오늘'
      : dueDate === tomorrowStr
        ? '내일'
        : dueDate
          ? dueDate.slice(5).replace('-', '/')
          : '기한없음';
  const recShortLabel =
    RECURRENCE_LIST.find((r) => r.key === recurrenceType)?.shortLabel ?? '1회';

  const buildRecurrence = (): Partial<TodoRecurrenceRule> => {
    if (recurrenceType === 'none') {
      return { type: 'none' };
    }
    return {
      type: recurrenceType,
      interval,
      weekdays: recurrenceType === 'weekly' ? weekdays : null,
      monthDay: recurrenceType === 'monthly' ? monthDay : null,
      yearMonth: recurrenceType === 'yearly' ? yearMonth : null,
      yearDay: recurrenceType === 'yearly' ? yearDay : null,
      endDate: showEndDate && endDate ? endDate : null,
    };
  };

  const recurrencePreview =
    recurrenceType === 'none'
      ? ''
      : formatRecurrenceSummary(
          normalizeRecurrenceRule(buildRecurrence(), dueDate ?? todayStr)
        );

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const domValue = inputRef.current ? inputRef.current.value : '';
    const trimmed = (domValue || title).trim();
    if (!trimmed) return;

    onAdd({
      title: trimmed,
      priority,
      category,
      dueDate: dueDate ?? (recurrenceType !== 'none' ? todayStr : null),
      recurrence: buildRecurrence(),
    });

    setTitle('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="shrink-0 bg-white border border-[#E7E0D5] rounded-2xl p-2 shadow-[0_1px_3px_rgba(36,33,29,0.04)]">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* 1행: Astryx TextInput + 옵션 토글 칩 + Primary Button (모바일 1줄 컴팩트) */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <TextInput
              ref={inputRef}
              label="새 할 일 제목 입력"
              isLabelHidden
              size="md"
              width="100%"
              value={title}
              onChange={(val) => setTitle(val.slice(0, 160))}
              hasClear
              data-screenshot-input="주간 업무 리포트 정리 및 매일 스트레칭"
              placeholder="할 일을 입력하고 Enter (단축키 /)"
            />
          </div>
          <button
            type="button"
            onClick={() => setOptionsOpen((prev) => !prev)}
            aria-expanded={optionsOpen}
            aria-label="우선순위, 마감일, 반복 설정 펼치기"
            className={`shrink-0 h-8 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              optionsOpen || recurrenceType !== 'none'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                : 'bg-[#F7F4EE] border-transparent text-[#57534E] hover:bg-[#EFEAE0]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedPriority.dotClass}`} />
            <span>{selectedPriority.shortLabel}</span>
            {dueDate !== todayStr && (
              <span className="sm:hidden text-indigo-700 font-black">· {dueShortLabel}</span>
            )}
            {recurrenceType !== 'none' && (
              <i className="fas fa-repeat text-[9px] text-indigo-600"></i>
            )}
            <span className="hidden sm:inline text-[#6C655B] font-bold">
              · {selectedCategory.label} · {dueShortLabel}
              {recurrenceType !== 'none' ? ` · ${recShortLabel}` : ''}
            </span>
            <i
              className={`fas fa-chevron-down text-[9px] text-[#8E8579] transition-transform ${
                optionsOpen ? 'rotate-180' : ''
              }`}
            ></i>
          </button>
          <Button
            type="submit"
            label="추가"
            variant="primary"
            size="md"
            data-screenshot-click="action"
            icon={<i className="fas fa-plus text-[10px]"></i>}
          />
        </div>

        {/* 1.5행: 상세 내용 + 지정 시간 + 푸시 알람 모달 실행 띠 */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-[10.5px] font-medium text-[#78716C] truncate">
            빠른 제목 등록 또는 상세 메모 · 시간 알람 설정
          </span>
          <button
            type="button"
            data-screenshot-point="action"
            onClick={() => {
              const current = (inputRef.current ? inputRef.current.value : title).trim();
              onOpenDetailModal(current);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 text-indigo-700 text-[11px] font-black transition-colors cursor-pointer"
          >
            <i className="far fa-clock text-[10px]"></i>
            <span>상세 내용 · 시간 알람</span>
          </button>
        </div>

        {optionsOpen && (
          <div className="pt-2 border-t border-[#EFE8DC] space-y-2 animate-fade-in">
            {/* 2행: 우선순위 + 카테고리 + 마감일 */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
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
                    active
                      ? item.activeClass
                      : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0] hover:bg-[#F2EDE4]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : item.dotClass}`}
                  ></span>
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TodoCategory)}
              aria-label="카테고리 선택"
              className="h-[26px] px-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5DDD0] text-[10px] font-bold text-[#24211D] outline-none focus:border-indigo-500 cursor-pointer"
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setDueDate(dueDate === todayStr ? null : todayStr);
                setShowCustomDate(false);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                dueDate === todayStr
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0] hover:bg-[#F2EDE4]'
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
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0] hover:bg-[#F2EDE4]'
              }`}
            >
              내일
            </button>

            <button
              type="button"
              onClick={() => setShowCustomDate((prev) => !prev)}
              aria-label="날짜 직접 지정"
              className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                showCustomDate || (dueDate && dueDate !== todayStr && dueDate !== tomorrowStr)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0] hover:bg-[#F2EDE4]'
              }`}
            >
              <i className="far fa-calendar-alt"></i>
            </button>
          </div>
        </div>

        {showCustomDate && (
          <div className="flex items-center justify-between gap-2 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E5DDD0]">
            <label htmlFor="quick-due-date" className="text-[10px] font-bold text-[#6C655B]">
              {recurrenceType === 'none' ? '마감일' : '반복 시작일'}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="quick-due-date"
                type="date"
                value={dueDate || ''}
                onChange={(e) => setDueDate(e.target.value || null)}
                className="text-[11px] font-bold text-[#24211D] bg-white border border-[#D9D0C1] rounded-lg px-2 py-0.5 outline-none focus:border-indigo-500"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => {
                    setDueDate(null);
                    setShowCustomDate(false);
                  }}
                  className="text-[10px] font-bold text-[#8E8579] hover:text-rose-600 cursor-pointer"
                >
                  해제
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3행: Astryx SegmentedControl (반복 안함 | 매일 | 매주 | 매월 | 매년) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-[#6C655B] flex items-center gap-1 shrink-0">
              <i className="fas fa-repeat text-indigo-600 text-[9px]"></i>
              반복
            </span>
            <div className="flex-1 min-w-0">
              <SegmentedControl
                label="반복 주기 선택"
                layout="fill"
                size="sm"
                value={recurrenceType}
                onChange={(val) => {
                  const next = val as RecurrenceType;
                  setRecurrenceType(next);
                  setInterval(1);
                }}
              >
                {RECURRENCE_LIST.map((opt) => (
                  <SegmentedControlItem key={opt.key} value={opt.key} label={opt.shortLabel} />
                ))}
              </SegmentedControl>
            </div>
          </div>

          {/* 4행(조건부): 세부 반복 옵션 */}
          {recurrenceType !== 'none' && (
            <div className="bg-[#FAF8F5] rounded-xl p-2 border border-[#E5DDD0] space-y-1.5 animate-fade-in text-[10px]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {recurrenceType === 'daily' && (
                    <>
                      <span className="font-bold text-[#6C655B]">간격:</span>
                      <select
                        value={interval}
                        onChange={(e) => setInterval(Number(e.target.value))}
                        aria-label="매일 반복 간격"
                        className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        <option value={1}>매일 (1일)</option>
                        <option value={2}>격일 (2일)</option>
                        <option value={3}>3일마다</option>
                        <option value={5}>5일마다</option>
                        <option value={7}>7일마다</option>
                      </select>
                    </>
                  )}

                  {recurrenceType === 'workday' && (
                    <>
                      <span className="font-bold text-[#6C655B]">간격:</span>
                      <select
                        value={interval}
                        onChange={(e) => setInterval(Number(e.target.value))}
                        aria-label="영업일 반복 간격"
                        className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        <option value={1}>영업일 매일</option>
                        <option value={2}>2영업일마다</option>
                        <option value={3}>3영업일마다</option>
                        <option value={5}>5영업일마다</option>
                      </select>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                        토·일·공휴일 자동 제외
                      </span>
                      {nonWorkdayReason && nextWorkdayLabel && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-extrabold">
                          오늘({nonWorkdayReason}) 등록 가능 · {nextWorkdayLabel}부터 실행
                        </span>
                      )}
                    </>
                  )}

                  {recurrenceType === 'weekly' && (
                    <>
                      <select
                        value={interval}
                        onChange={(e) => setInterval(Number(e.target.value))}
                        aria-label="주 반복 간격"
                        className="px-1.5 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        <option value={1}>매주</option>
                        <option value={2}>격주(2주)</option>
                        <option value={3}>3주마다</option>
                        <option value={4}>4주마다</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setWeekdays([1, 2, 3, 4, 5])}
                        className="px-1.5 py-0.5 rounded-md bg-white hover:bg-indigo-50 border border-[#D9D0C1] font-bold text-indigo-700 cursor-pointer"
                      >
                        평일
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeekdays([0, 6])}
                        className="px-1.5 py-0.5 rounded-md bg-white hover:bg-indigo-50 border border-[#D9D0C1] font-bold text-indigo-700 cursor-pointer"
                      >
                        주말
                      </button>
                    </>
                  )}

                  {recurrenceType === 'monthly' && (
                    <>
                      <select
                        value={interval}
                        onChange={(e) => setInterval(Number(e.target.value))}
                        aria-label="월 반복 간격"
                        className="px-1.5 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        <option value={1}>매월</option>
                        <option value={2}>격월(2개월)</option>
                        <option value={3}>분기(3개월)</option>
                        <option value={6}>반기(6개월)</option>
                      </select>
                      <select
                        value={monthDay}
                        onChange={(e) => setMonthDay(Number(e.target.value))}
                        aria-label="매월 반복 날짜"
                        className="px-1.5 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}일 {d >= 29 ? '(말일 보정)' : ''}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {recurrenceType === 'yearly' && (
                    <>
                      <select
                        value={interval}
                        onChange={(e) => setInterval(Number(e.target.value))}
                        aria-label="연 반복 간격"
                        className="px-1.5 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        <option value={1}>매년</option>
                        <option value={2}>2년마다</option>
                      </select>
                      <select
                        value={yearMonth}
                        onChange={(e) => setYearMonth(Number(e.target.value))}
                        aria-label="매년 반복 월"
                        className="px-1.5 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {m}월
                          </option>
                        ))}
                      </select>
                      <select
                        value={yearDay}
                        onChange={(e) => setYearDay(Number(e.target.value))}
                        aria-label="매년 반복 일"
                        className="px-1.5 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
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

                <div className="flex items-center gap-1.5">
                  <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                    🔁 {recurrencePreview}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEndDate((prev) => !prev)}
                    className="text-[10px] font-bold text-[#6C655B] hover:text-indigo-700 cursor-pointer underline"
                  >
                    {showEndDate ? '종료일 닫기' : '+종료일'}
                  </button>
                </div>
              </div>

              {recurrenceType === 'weekly' && (
                <div className="grid grid-cols-7 gap-1 pt-0.5">
                  {WEEKDAY_OPTIONS.map((w) => {
                    const pressed = weekdays.includes(w.day);
                    return (
                      <ToggleButton
                        key={w.day}
                        label={w.label}
                        size="sm"
                        isPressed={pressed}
                        onPressedChange={() => toggleWeekday(w.day)}
                      />
                    );
                  })}
                </div>
              )}

              {showEndDate && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5DDD0]">
                  <label htmlFor="recurrence-end-date" className="font-bold text-[#6C655B]">
                    반복 종료일 (선택)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="recurrence-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D0C1] font-bold text-[#24211D]"
                    />
                    {endDate && (
                      <button
                        type="button"
                        onClick={() => setEndDate('')}
                        className="text-[#8E8579] hover:text-rose-600 cursor-pointer"
                      >
                        지우기
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
          </div>
        )}
      </form>
    </div>
  );
}
