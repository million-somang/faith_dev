import React, { useState } from 'react';
import { VacationPlan } from '../types/vacation';

interface VacationResultCardProps {
  plan: VacationPlan;
  onCopySound?: () => void;
}

export const VacationResultCard: React.FC<VacationResultCardProps> = ({ plan, onCopySound }) => {
  const [copied, setCopied] = useState(false);

  const formatShortDate = (dStr: string) => {
    const [, m, d] = dStr.split('-');
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][new Date(dStr).getDay()];
    return `${Number(m)}/${Number(d)}(${dayOfWeek})`;
  };

  const handleCopy = () => {
    const text = `[베라 연차 극대화 플래너 추천]
✨ ${plan.title}
📅 전체 휴가 기간: ${plan.startDate} ~ ${plan.endDate} (총 ${plan.totalDays}일 연속 휴식)
🏖️ 소진 연차: ${plan.vacationDaysUsed}일 (${plan.vacationDates.map(formatShortDate).join(', ')})
🚀 가성비 효율: ${plan.efficiency}% 달성!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (onCopySound) onCopySound();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 rounded-2xl p-3.5 border border-[#EBE6DD] shadow-xs relative overflow-hidden">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-xs">
          가장 긴 황금루트 ⭐
        </span>
        <span className="text-[11px] font-bold text-amber-800 bg-white/90 px-2 py-0.5 rounded-full border border-amber-200">
          효율 {plan.efficiency}%
        </span>
      </div>

      {/* Main title */}
      <h3 className="font-extrabold text-[#2D2A26] text-sm leading-snug mb-1">
        {plan.title}
      </h3>

      <div className="text-[11px] text-[#7A7369] font-medium mb-2.5">
        {plan.startDate} ~ {plan.endDate}
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-xl p-2 border border-[#EBE6DD] shadow-2xs text-center">
          <div className="text-[10px] text-[#7A7369] font-bold mb-0.5">총 연속 휴가</div>
          <div className="text-base font-black text-amber-700 tracking-tight">
            {plan.totalDays}<span className="text-xs font-bold text-[#7A7369] ml-0.5">일간</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-2 border border-[#EBE6DD] shadow-2xs text-center">
          <div className="text-[10px] text-[#7A7369] font-bold mb-0.5">필요 연차 소진</div>
          <div className="text-base font-black text-emerald-600 tracking-tight">
            {plan.vacationDaysUsed}<span className="text-xs font-bold text-[#7A7369] ml-0.5">일치</span>
          </div>
        </div>
      </div>

      {/* Vacation Dates recommendation badge list */}
      <div className="bg-[#FAF8F5] rounded-xl p-2.5 border border-[#EBE6DD] mb-2.5">
        <div className="text-[10px] font-bold text-[#2D2A26] mb-1.5 flex items-center justify-between">
          <span>연차 신청 권장일</span>
          <span className="text-[9px] text-emerald-600 font-bold">총 {plan.vacationDates.length}일 소진</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {plan.vacationDates.map((dateStr) => (
            <span
              key={dateStr}
              className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-2xs"
            >
              {formatShortDate(dateStr)}
            </span>
          ))}
        </div>
      </div>

      {/* Action copy button */}
      <button
        onClick={handleCopy}
        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
          copied
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-98'
        }`}
      >
        <i className={copied ? 'fas fa-check' : 'fas fa-copy'}></i>
        {copied ? '연차 일정 복사 완료!' : '연차 신청 텍스트 복사'}
      </button>
    </div>
  );
};
