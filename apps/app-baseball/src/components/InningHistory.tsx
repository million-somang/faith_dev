import React from 'react';
import { InningRecord } from '../types/baseball';

interface InningHistoryProps {
  history: InningRecord[];
  currentInning: number;
}

export const InningHistory: React.FC<InningHistoryProps> = ({ history, currentInning }) => {
  // 9이닝 고정 슬롯 생성 (1~9회)
  const innings = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="w-full bg-[#f0f4f8] rounded-2xl p-3 shadow-[6px_6px_14px_#d1d9e6,-6px_-6px_14px_#ffffff] border border-white/60">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 tracking-tight">이닝별 투구 기록</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          {history.length}/9회 투구 완료
        </span>
      </div>

      {/* 이닝 스크롤 또는 컴팩트 그리드 */}
      <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
        {history.length === 0 ? (
          <div className="py-5 text-center text-xs text-slate-400 font-medium">
            ⚾ 1회말 공격 시작! 3자리 숫자를 입력하고 [투구] 버튼을 누르세요.
          </div>
        ) : (
          history.map((record) => {
            const isStrikeout = record.strikes === 3;
            const isOut = record.isOut;

            return (
              <div
                key={record.inning}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all ${
                  isStrikeout
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 shadow-[inset_2px_2px_5px_rgba(245,158,11,0.1)]'
                    : isOut
                    ? 'bg-rose-50/70 border border-rose-200/60'
                    : 'bg-white/80 border border-slate-100 shadow-[inset_1px_1px_3px_#e2e8f0]'
                }`}
              >
                {/* 이닝 번호 */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-5 rounded-md bg-slate-200/80 text-[11px] font-bold text-slate-700">
                    {record.inning}회
                  </span>
                  <span className="font-mono font-bold text-sm tracking-widest text-slate-800">
                    {record.guess}
                  </span>
                </div>

                {/* S / B / O 배지 */}
                <div className="flex items-center gap-1.5">
                  {isStrikeout ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white tracking-tight shadow-sm animate-bounce">
                      HOMERUN!
                    </span>
                  ) : isOut ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white tracking-tight">
                      OUT
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 font-bold text-[11px]">
                      {record.strikes > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 border border-amber-300/60">
                          {record.strikes}S
                        </span>
                      )}
                      {record.balls > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-300/60">
                          {record.balls}B
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 9회 이닝 인디케이터 바 */}
      <div className="grid grid-cols-9 gap-1 mt-2.5 pt-2 border-t border-slate-200/70">
        {innings.map((inn) => {
          const isCurrent = inn === currentInning;
          const isDone = inn < currentInning;
          return (
            <div
              key={inn}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500'
                  : isCurrent
                  ? 'bg-amber-400 ring-2 ring-amber-300 animate-pulse'
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
