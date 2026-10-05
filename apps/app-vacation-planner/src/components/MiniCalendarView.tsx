import React from 'react';
import { VacationPlan } from '../types/vacation';
import { getHolidayMap } from '../utils/koreanHolidays';

interface MiniCalendarViewProps {
  year: number;
  month: number;
  plan: VacationPlan | null;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export const MiniCalendarView: React.FC<MiniCalendarViewProps> = ({
  year,
  month,
  plan,
  onPrevMonth,
  onNextMonth,
}) => {
  const holidayMap = getHolidayMap(year);

  // Month info
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonthLastDate = new Date(year, month - 1, 0).getDate();

  const vacationSet = new Set(plan?.vacationDates || []);
  const startDateStr = plan?.startDate || '';
  const endDateStr = plan?.endDate || '';

  const cells = [];

  // Previous month padded days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthLastDate - i,
      isCurrentMonth: false,
      dateStr: '',
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(month).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    const holiday = holidayMap.get(dateStr);

    const isInPlanRange = startDateStr && endDateStr && dateStr >= startDateStr && dateStr <= endDateStr;
    const isVacation = vacationSet.has(dateStr);
    const isHoliday = !!holiday;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    cells.push({
      day: d,
      isCurrentMonth: true,
      dateStr,
      dayOfWeek,
      isHoliday,
      holidayName: holiday?.name,
      isWeekend,
      isInPlanRange,
      isVacation,
    });
  }

  // Next month padded days to complete 35 or 42 grid
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      day: i,
      isCurrentMonth: false,
      dateStr: '',
    });
  }

  return (
    <div className="bg-white rounded-2xl p-3 border border-[#EBE6DD] shadow-xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm text-[#2D2A26] tracking-tight">
            {year}년 {month}월
          </span>
          {plan && (
            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded-full border border-amber-200/80">
              추천 하이라이트
            </span>
          )}
        </div>
        {(onPrevMonth || onNextMonth) && (
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevMonth}
              className="w-6 h-6 rounded-lg bg-[#F5F2EB] hover:bg-[#EBE6DD] text-[#2D2A26] flex items-center justify-center text-[10px] cursor-pointer transition-colors"
              title="이전 달"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              onClick={onNextMonth}
              className="w-6 h-6 rounded-lg bg-[#F5F2EB] hover:bg-[#EBE6DD] text-[#2D2A26] flex items-center justify-center text-[10px] cursor-pointer transition-colors"
              title="다음 달"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#A39C90] mb-1 border-b border-[#F5F2EB] pb-1">
        <span className="text-rose-500">일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span className="text-sky-600">토</span>
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div key={idx} className="h-8 flex items-center justify-center text-[#D6D0C5] text-[11px]">
                {cell.day}
              </div>
            );
          }

          let bgClass = 'bg-transparent text-[#2D2A26] hover:bg-[#FAF8F5]';
          let borderClass = 'border-transparent';

          if (cell.isVacation) {
            bgClass = 'bg-emerald-600 text-white font-extrabold shadow-xs shadow-emerald-200';
            borderClass = 'border-emerald-600';
          } else if (cell.isInPlanRange) {
            bgClass = 'bg-amber-50 text-amber-900 font-bold';
            borderClass = 'border-amber-200';
          } else if (cell.isHoliday) {
            bgClass = 'bg-rose-50 text-rose-600 font-bold';
            borderClass = 'border-rose-100';
          } else if (cell.dayOfWeek === 0) {
            bgClass = 'text-rose-500 font-medium';
          } else if (cell.dayOfWeek === 6) {
            bgClass = 'text-sky-600 font-medium';
          }

          return (
            <div
              key={idx}
              className={`h-8 rounded-lg flex flex-col items-center justify-center relative border transition-all ${bgClass} ${borderClass}`}
              title={cell.holidayName || (cell.isVacation ? '추천 연차 소진일' : '')}
            >
              <span className="text-[11px] leading-none">{cell.day}</span>
              {cell.isVacation && (
                <span className="text-[8px] font-black leading-none text-emerald-100 scale-90">연차</span>
              )}
              {cell.isHoliday && !cell.isVacation && (
                <span className="text-[7px] font-bold leading-none truncate max-w-[28px] text-rose-500/90 scale-90">
                  {cell.holidayName?.slice(0, 2)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2.5 pt-2 border-t border-[#F5F2EB] flex items-center justify-center gap-3 text-[10px] text-[#7A7369] font-medium">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300 inline-block"></span>
          공휴일
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
          연차사용
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-200 inline-block"></span>
          연속휴가
        </span>
      </div>
    </div>
  );
};
