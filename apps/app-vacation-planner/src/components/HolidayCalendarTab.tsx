import React from 'react';
import { getHolidaysForYear } from '../utils/koreanHolidays';

interface HolidayCalendarTabProps {
  year: number;
  onYearChange: (year: number) => void;
  onSelectMonth?: (month: number) => void;
}

export const HolidayCalendarTab: React.FC<HolidayCalendarTabProps> = ({
  year,
  onYearChange,
}) => {
  const holidays = getHolidaysForYear(year);

  // Group holidays by month
  const monthMap = new Map<number, typeof holidays>();
  for (let m = 1; m <= 12; m++) monthMap.set(m, []);
  holidays.forEach((h) => {
    const m = Number(h.date.split('-')[1]);
    monthMap.get(m)?.push(h);
  });

  const getDayName = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[new Date(dateStr).getDay()];
  };

  return (
    <div className="space-y-3.5 pb-2">
      {/* Year Switcher */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-[#EBE6DD] shadow-2xs">
        <span className="text-xs font-black text-[#2D2A26] ml-1">연도 선택</span>
        <div className="flex items-center gap-1 bg-[#F5F2EB] p-0.5 rounded-xl border border-[#EBE6DD]">
          {[2026, 2027].map((y) => (
            <button
              key={y}
              onClick={() => onYearChange(y)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                year === y
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#7A7369] hover:text-[#2D2A26]'
              }`}
            >
              {y}년
            </button>
          ))}
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-amber-100">{year}년 대한민국 법정공휴일</span>
          <span className="text-[11px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
            총 {holidays.length}일
          </span>
        </div>
        <p className="text-xs font-medium text-white/90">
          대체공휴일이 법적으로 보장되어 주말과 겹치더라도 월요일 대체휴무가 적용됩니다.
        </p>
      </div>

      {/* Holiday Grid by month */}
      <div className="space-y-2">
        {Array.from(monthMap.entries()).map(([month, list]) => {
          if (list.length === 0) return null;
          return (
            <div
              key={month}
              className="bg-white rounded-2xl p-3 border border-[#EBE6DD] shadow-2xs flex items-start gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-amber-700 leading-none">MONTH</span>
                <span className="text-base font-black text-amber-800 leading-tight">{month}월</span>
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                {list.map((h) => {
                  const dayName = getDayName(h.date);
                  const isWeekendDay = dayName === '토' || dayName === '일';
                  return (
                    <div key={h.date} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-extrabold text-[#2D2A26] truncate">{h.name}</span>
                        {h.isSubstitute && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                            대체휴일
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold shrink-0 ${isWeekendDay ? 'text-rose-500' : 'text-[#7A7369]'}`}>
                        {h.date.slice(5)} ({dayName})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
