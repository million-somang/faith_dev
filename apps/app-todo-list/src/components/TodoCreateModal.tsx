import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { ToggleButton } from '@astryxdesign/core/ToggleButton';
import {
  CATEGORY_LIST,
  PRIORITY_LIST,
  QUICK_TIME_PRESETS,
  RECURRENCE_LIST,
  REMIND_BEFORE_OPTIONS,
  TODO_MEMO_MAX_LENGTH,
  WEEKDAY_OPTIONS,
} from '../constants/todoMeta';
import type {
  RecurrenceType,
  RemindBeforeMinutes,
  TodoCategory,
  TodoDraftInput,
  TodoPriority,
  TodoRecurrenceRule,
} from '../types/todo';
import { formatRecurrenceSummary, normalizeRecurrenceRule } from '../utils/recurrence';
import { getLocalDateString, getOffsetDateString } from '../utils/todoAnalytics';

interface TodoCreateModalProps {
  readonly isOpen: boolean;
  readonly initialTitle: string;
  readonly isAuthenticated: boolean;
  readonly pushPermission: NotificationPermission | 'unsupported';
  readonly isDeviceSubscribed: boolean;
  readonly isNotificationBusy: boolean;
  readonly isIosSafari: boolean;
  readonly onEnableNotifications: () => Promise<boolean>;
  readonly onClose: () => void;
  readonly onSubmit: (draft: TodoDraftInput) => void;
}

export default function TodoCreateModal({
  isOpen,
  initialTitle,
  isAuthenticated,
  pushPermission,
  isDeviceSubscribed,
  isNotificationBusy,
  isIosSafari,
  onEnableNotifications,
  onClose,
  onSubmit,
}: TodoCreateModalProps) {
  const todayStr = getLocalDateString();
  const tomorrowStr = getOffsetDateString(1);

  const [title, setTitle] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [priority, setPriority] = useState<TodoPriority>('important');
  const [category, setCategory] = useState<TodoCategory>('work');
  const [dueDate, setDueDate] = useState<string | null>(todayStr);
  const [dueTime, setDueTime] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState<RemindBeforeMinutes>(0);

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [interval, setInterval] = useState<number>(1);
  const [weekdays, setWeekdays] = useState<number[]>(() => [new Date().getDay()]);
  const [monthDay, setMonthDay] = useState<number>(() => new Date().getDate());
  const [yearMonth, setYearMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [yearDay, setYearDay] = useState<number>(() => new Date().getDate());
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    setTitle(initialTitle);
    setMemo('');
    setPriority('important');
    setCategory('work');
    setDueDate(getLocalDateString());
    setDueTime('');
    setReminderEnabled(true);
    setRemindBeforeMinutes(0);
    setRecurrenceType('none');
    setInterval(1);
    setWeekdays([now.getDay()]);
    setMonthDay(now.getDate());
    setYearMonth(now.getMonth() + 1);
    setYearDay(now.getDate());
    setEndDate('');
  }, [isOpen, initialTitle]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime);
  const pushNeedsConnect = isAuthenticated
    ? !isDeviceSubscribed
    : pushPermission !== 'granted';

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
      endDate: endDate || null,
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
    const cleanedTitle = title.trim();
    if (!cleanedTitle) return;

    onSubmit({
      title: cleanedTitle,
      memo: memo.trim(),
      priority,
      category,
      dueDate: dueDate ?? (recurrenceType !== 'none' || hasValidTime ? todayStr : null),
      dueTime: hasValidTime ? dueTime : null,
      reminderEnabled: hasValidTime ? reminderEnabled : false,
      remindBeforeMinutes: hasValidTime ? remindBeforeMinutes : 0,
      recurrence: buildRecurrence(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="todo-create-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-[#FAF8F5] border border-[#E5DDD0] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="px-5 py-3.5 bg-white border-b border-[#EFE8DC] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs shrink-0">
              <i className="fas fa-pen-to-square"></i>
            </span>
            <div className="min-w-0">
              <h2
                id="todo-create-modal-title"
                className="text-sm sm:text-base font-black text-[#1C1917] tracking-tight truncate"
              >
                상세 할 일 &amp; 시간 알람 등록
              </h2>
              <p className="text-[11px] text-[#78716C] truncate">
                상세 내용을 남기고 지정 시간에 푸시 알람을 받아보세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="등록 창 닫기"
            className="w-8 h-8 rounded-xl bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#57534E] flex items-center justify-center text-sm cursor-pointer transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 모달 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. 제목 */}
          <div className="space-y-1.5">
            <label htmlFor="modal-todo-title" className="block text-xs font-black text-[#24211D]">
              할 일 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              id="modal-todo-title"
              type="text"
              required
              autoFocus
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 160))}
              placeholder="예: 월간 매출 보고서 제출, 병원 진료 예약"
              className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#D9D0C1] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 text-sm font-bold text-[#1C1917] placeholder-[#A8A29E] outline-none"
            />
          </div>

          {/* 2. 상세 내용 (최대 2,000자) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-todo-memo" className="text-xs font-black text-[#24211D]">
                상세 내용
              </label>
              <span className="text-[10px] font-bold text-[#8E8579] tabular-nums">
                {memo.length.toLocaleString()} / {TODO_MEMO_MAX_LENGTH.toLocaleString()}자
              </span>
            </div>
            <textarea
              id="modal-todo-memo"
              rows={4}
              maxLength={TODO_MEMO_MAX_LENGTH}
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, TODO_MEMO_MAX_LENGTH))}
              placeholder="준비물, 참고 링크, 체크 포인트, 진행 메모 등 상세 내용을 자유롭게 적어주세요."
              className="w-full p-3 rounded-xl bg-white border border-[#D9D0C1] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 text-xs sm:text-[13px] font-medium text-[#24211D] placeholder-[#A8A29E] leading-relaxed outline-none resize-y"
            />
          </div>

          {/* 3. 날짜 + 시간 설정 */}
          <div className="bg-white rounded-2xl border border-[#E5DDD0] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black text-[#24211D] flex items-center gap-1.5">
                <i className="far fa-calendar-alt text-indigo-600"></i>
                <span>날짜 &amp; 시간</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDueDate(todayStr)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
                    dueDate === todayStr
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0]'
                  }`}
                >
                  오늘
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(tomorrowStr)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
                    dueDate === tomorrowStr
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0]'
                  }`}
                >
                  내일
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDueDate(null);
                    setDueTime('');
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
                    dueDate === null
                      ? 'bg-stone-700 text-white border-stone-700'
                      : 'bg-[#FAF8F5] text-[#6C655B] border-[#E5DDD0]'
                  }`}
                >
                  기한없음
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="modal-due-date" className="block text-[10px] font-bold text-[#6C655B] mb-1">
                  {recurrenceType === 'none' ? '마감 날짜' : '반복 시작 날짜'}
                </label>
                <input
                  id="modal-due-date"
                  type="date"
                  value={dueDate || ''}
                  onChange={(e) => setDueDate(e.target.value || null)}
                  className="w-full h-9 px-2.5 rounded-xl bg-[#FAF8F5] border border-[#D9D0C1] focus:border-indigo-500 text-xs font-bold text-[#1C1917] outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="modal-due-time" className="text-[10px] font-bold text-[#6C655B]">
                    지정 시간 (선택)
                  </label>
                  {dueTime && (
                    <button
                      type="button"
                      onClick={() => setDueTime('')}
                      className="text-[10px] font-bold text-[#8E8579] hover:text-rose-600 cursor-pointer"
                    >
                      지우기
                    </button>
                  )}
                </div>
                <input
                  id="modal-due-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDueTime(next);
                    if (next && !dueDate) {
                      setDueDate(todayStr);
                    }
                  }}
                  className="w-full h-9 px-2.5 rounded-xl bg-[#FAF8F5] border border-[#D9D0C1] focus:border-indigo-500 text-xs font-bold text-[#1C1917] outline-none"
                />
              </div>
            </div>

            {/* 빠른 시간 프리셋 칩 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-[#8E8579]">빠른 시간:</span>
              {QUICK_TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDueTime(preset);
                    if (!dueDate) setDueDate(todayStr);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
                    dueTime === preset
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#57534E] border-[#E5DDD0]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* 푸시 알람 설정 영역 */}
            {hasValidTime && (
              <div className="pt-2.5 border-t border-[#EFE8DC] space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                      <i className="fas fa-bell"></i>
                    </span>
                    <div>
                      <p className="text-xs font-black text-[#1C1917]">지정 시간 푸시 알람</p>
                      <p className="text-[10px] text-[#78716C]">
                        방해금지 시간에도 설정한 알람은 정시에 발송됩니다
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reminderEnabled}
                    aria-label="푸시 알람 켜기/끄기"
                    onClick={() => setReminderEnabled((prev) => !prev)}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition-colors cursor-pointer ${
                      reminderEnabled
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#E7E0D5] text-[#57534E]'
                    }`}
                  >
                    {reminderEnabled ? '알람 ON' : '알람 OFF'}
                  </button>
                </div>

                {reminderEnabled && (
                  <>
                    <div className="flex items-center gap-1 flex-wrap">
                      {REMIND_BEFORE_OPTIONS.map((opt) => (
                        <button
                          key={opt.minutes}
                          type="button"
                          onClick={() => setRemindBeforeMinutes(opt.minutes)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black border cursor-pointer transition-colors ${
                            remindBeforeMinutes === opt.minutes
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-[#FAF8F5] text-[#57534E] border-[#E5DDD0] hover:bg-[#EFEAE0]'
                          }`}
                        >
                          {opt.shortLabel}
                        </button>
                      ))}
                    </div>

                    {pushNeedsConnect && (
                      <div className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold text-indigo-950">
                            {isAuthenticated
                              ? '이 기기의 웹 푸시가 아직 연결되지 않았습니다'
                              : '로컬 모드 · 브라우저 알림 허용이 필요합니다'}
                          </p>
                          <p className="text-[10px] text-indigo-700 leading-snug">
                            {isIosSafari
                              ? 'iPhone Safari 공유 → [홈 화면에 추가] 후 알람을 켤 수 있어요.'
                              : isAuthenticated
                                ? '버튼을 눌러 지금 바로 백그라운드 푸시를 켜보세요.'
                                : '로그인하시면 화면이 닫혀 있어도 웹 푸시 알람을 받을 수 있습니다.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isNotificationBusy}
                          onClick={() => void onEnableNotifications()}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-black shrink-0 cursor-pointer"
                        >
                          {isNotificationBusy ? '연결 중...' : '알람 켜기'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 4. 우선순위 & 카테고리 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-[#E5DDD0] p-3 space-y-1.5">
              <span className="block text-[11px] font-black text-[#24211D]">우선순위</span>
              <div className="flex items-center gap-1">
                {PRIORITY_LIST.map((item) => {
                  const active = priority === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPriority(item.key)}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer flex items-center justify-center gap-1 ${
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
            </div>

            <div className="bg-white rounded-2xl border border-[#E5DDD0] p-3 space-y-1.5">
              <label htmlFor="modal-category" className="block text-[11px] font-black text-[#24211D]">
                카테고리
              </label>
              <select
                id="modal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TodoCategory)}
                className="w-full h-8 px-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] text-xs font-bold text-[#24211D] outline-none focus:border-indigo-500 cursor-pointer"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. 반복 주기 */}
          <div className="bg-white rounded-2xl border border-[#E5DDD0] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-[#24211D] flex items-center gap-1.5">
                <i className="fas fa-repeat text-indigo-600 text-[10px]"></i>
                <span>반복 주기</span>
              </span>
              {recurrencePreview && (
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  🔁 {recurrencePreview}
                </span>
              )}
            </div>

            <SegmentedControl
              label="모달 반복 주기 선택"
              layout="fill"
              size="sm"
              value={recurrenceType}
              onChange={(val) => {
                setRecurrenceType(val as RecurrenceType);
                setInterval(1);
              }}
            >
              {RECURRENCE_LIST.map((opt) => (
                <SegmentedControlItem key={opt.key} value={opt.key} label={opt.shortLabel} />
              ))}
            </SegmentedControl>

            {recurrenceType !== 'none' && (
              <div className="pt-2 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 flex-wrap">
                  {(recurrenceType === 'daily' || recurrenceType === 'workday') && (
                    <select
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                      aria-label="반복 간격"
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] font-bold text-[#24211D]"
                    >
                      <option value={1}>매 1주기</option>
                      <option value={2}>매 2주기</option>
                      <option value={3}>매 3주기</option>
                      <option value={5}>매 5주기</option>
                    </select>
                  )}

                  {recurrenceType === 'weekly' && (
                    <>
                      <select
                        value={interval}
                        onChange={(e) => setInterval(Number(e.target.value))}
                        aria-label="주간 반복 간격"
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] font-bold text-[#24211D]"
                      >
                        <option value={1}>매주</option>
                        <option value={2}>격주</option>
                        <option value={3}>3주마다</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setWeekdays([1, 2, 3, 4, 5])}
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] font-bold text-indigo-700 cursor-pointer"
                      >
                        평일
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeekdays([0, 6])}
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] font-bold text-indigo-700 cursor-pointer"
                      >
                        주말
                      </button>
                    </>
                  )}

                  {recurrenceType === 'monthly' && (
                    <select
                      value={monthDay}
                      onChange={(e) => setMonthDay(Number(e.target.value))}
                      aria-label="월간 반복 일"
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] font-bold text-[#24211D]"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          매월 {d}일
                        </option>
                      ))}
                    </select>
                  )}

                  {recurrenceType === 'yearly' && (
                    <>
                      <select
                        value={yearMonth}
                        onChange={(e) => setYearMonth(Number(e.target.value))}
                        aria-label="연간 반복 월"
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] font-bold text-[#24211D]"
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
                        aria-label="연간 반복 일"
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] font-bold text-[#24211D]"
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

                {recurrenceType === 'weekly' && (
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAY_OPTIONS.map((w) => (
                      <ToggleButton
                        key={w.day}
                        label={w.label}
                        size="sm"
                        isPressed={weekdays.includes(w.day)}
                        onPressedChange={() => toggleWeekday(w.day)}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <label htmlFor="modal-rec-end" className="text-[10px] font-bold text-[#6C655B]">
                    반복 종료일 (선택)
                  </label>
                  <input
                    id="modal-rec-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D0C1] text-[11px] font-bold text-[#24211D]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 바 */}
          <div className="pt-1 flex items-center justify-end gap-2">
            <Button type="button" label="취소" variant="ghost" size="md" onClick={onClose} />
            <Button
              type="submit"
              label={hasValidTime && reminderEnabled ? '할 일 · 알람 등록하기' : '할 일 등록하기'}
              variant="primary"
              size="md"
              icon={<i className="fas fa-check text-xs"></i>}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
