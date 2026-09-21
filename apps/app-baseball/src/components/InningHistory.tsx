import React from 'react';
import { InningRecord } from '../types/baseball';

interface InningHistoryProps {
  history: InningRecord[];
  currentInning: number;
}

export const InningHistory: React.FC<InningHistoryProps> = ({ history, currentInning }) => {
  const innings = Array.from({ length: 9 }, (_, i) => i + 1);
  const reversedHistory = [...history].reverse();

  return (
    <div className="w-full bg-[#f0f4f8] rounded-2xl p-2 shadow-[4px_4px_10px_#d1d9e6,-4px_-4px_10px_#ffffff] border border-white/80 flex flex-col justify-between">
      {/* 상단 미니 타이틀 바 */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 tracking-tight">이닝별 투구 기록</span>
        </div>
        <span className="text-[9px] font-extrabold text-slate-600 font-mono">
          {history.length}/9회 완료
        </span>
      </div>

      {/* 고정 높이 2열 그리드 (최신 투구 결과가 상단에 노출되며, 회를 거듭해도 전체 화면이 밀리지 않음) */}
      <div className="h-[76px] overflow-y-auto pr-0.5 custom-scrollbar">
        {reversedHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-[10px] text-slate-600 font-bold">
            ⚾ 1회말 공격 시작! 3자리 숫자를 입력하세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {reversedHistory.map((record, index) => {
              const isLatest = index === 0;
              const isStrikeout = record.strikes === 3;
              const isOut = record.isOut;

              return (
                <div
                  key={record.inning}
                  className={`flex items-center justify-between px-2 py-1 rounded-xl text-[10px] transition-all ${
                    isStrikeout
                      ? 'bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-400 shadow-2xs'
                      : isOut
                      ? 'bg-rose-50 border border-rose-200'
                      : isLatest
                      ? 'bg-white border-2 border-indigo-400 shadow-xs'
                      : 'bg-white border border-slate-200 shadow-[inset_1px_1px_2px_#e2e8f0]'
                  }`}
                >
                  {/* 이닝 번호 & 숫자 */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center px-1 h-4 rounded text-[9px] font-black shrink-0 ${
                        isLatest ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-900'
                      }`}
                    >
                      {record.inning}회
                    </span>
                    <span className="font-mono font-black text-xs tracking-wider text-slate-950 shrink-0">
                      {record.guess}
                    </span>
                  </div>

                  {/* S / B / O 배지 */}
                  <div className="shrink-0 ml-1">
                    {isStrikeout ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 shadow-2xs">
                        HOMERUN
                      </span>
                    ) : isOut ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white">
                        OUT
                      </span>
                    ) : (
                      <div className="flex items-center gap-0.5 font-black text-[9px]">
                        {record.strikes > 0 && (
                          <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-400">
                            {record.strikes}S
                          </span>
                        )}
                        {record.balls > 0 && (
                          <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-900 border border-blue-400">
                            {record.balls}B
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 9회 이닝 인디케이터 바 (슬림 4px) */}
      <div className="grid grid-cols-9 gap-1 mt-1.5 pt-1 border-t border-slate-200/60">
        {innings.map((inn) => {
          const isCurrent = inn === currentInning;
          const isDone = inn < currentInning;
          return (
            <div
              key={inn}
              className={`h-1 rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500'
                  : isCurrent
                  ? 'bg-amber-400 ring-1 ring-amber-300 animate-pulse'
                  : 'bg-slate-200'
              }`}
              title={`${inn}회말`}
            />
          );
        })}
      </div>
    </div>
  );
};
