import React from 'react';
import { Delete, RefreshCw, Send } from 'lucide-react';

interface BaseballKeypadProps {
  inputDigits: string[];
  disabled: boolean;
  onPushDigit: (d: number) => void;
  onDeleteDigit: () => void;
  onClearDigits: () => void;
  onPitch: () => void;
}

export const BaseballKeypad: React.FC<BaseballKeypadProps> = ({
  inputDigits,
  disabled,
  onPushDigit,
  onDeleteDigit,
  onClearDigits,
  onPitch,
}) => {
  const isReadyToPitch = inputDigits.length === 3 && !disabled;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* 3자리 투구 입력 현황판 & 투구 버튼 */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#f0f4f8] rounded-2xl shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] border border-white/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">선택:</span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((idx) => {
              const val = inputDigits[idx];
              const isFilled = Boolean(val);
              return (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-base font-black transition-all ${
                    isFilled
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-[2px_2px_4px_#cbd5e1,-1px_-1px_3px_#ffffff] scale-105'
                      : 'bg-slate-200 text-slate-500 border border-dashed border-slate-300'
                  }`}
                >
                  {val || '•'}
                </div>
              );
            })}
          </div>
        </div>

        {/* 투구(PITCH) 버튼 */}
        <button
          onClick={onPitch}
          disabled={!isReadyToPitch}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-black text-xs tracking-tight transition-all transform active:scale-95 ${
            isReadyToPitch
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_3px_10px_rgba(239,68,68,0.4)] hover:brightness-105 animate-pulse cursor-pointer'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-3 h-3" />
          <span>투구 (PITCH)</span>
        </button>
      </div>

      {/* 키패드 (1~9, Clear, 0, Backspace) - 컴팩트 38px 높이 */}
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isSelected = inputDigits.includes(String(num));
          return (
            <button
              key={num}
              onClick={() => onPushDigit(num)}
              disabled={disabled || isSelected || inputDigits.length >= 3}
              className={`h-9.5 rounded-xl font-black text-base transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-slate-200/80 text-slate-400 shadow-[inset_2px_2px_4px_#cbd5e1] cursor-not-allowed'
                  : disabled
                  ? 'bg-[#f0f4f8] text-slate-300 cursor-not-allowed'
                  : 'bg-[#f0f4f8] text-slate-900 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_3px_#d1d9e6,-1px_-1px_3px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] active:scale-95 cursor-pointer'
              }`}
            >
              {num}
            </button>
          );
        })}

        {/* 하단 줄: 전체 지우기 / 0 / 백스페이스 */}
        <button
          onClick={onClearDigits}
          disabled={disabled || inputDigits.length === 0}
          className="h-9.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-0.5 bg-[#f0f4f8] text-slate-800 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>초기화</span>
        </button>

        <button
          onClick={() => onPushDigit(0)}
          disabled={disabled || inputDigits.includes('0') || inputDigits.length >= 3}
          className={`h-9.5 rounded-xl font-black text-base transition-all flex items-center justify-center ${
            inputDigits.includes('0')
              ? 'bg-slate-200/80 text-slate-400 shadow-[inset_2px_2px_4px_#cbd5e1] cursor-not-allowed'
              : disabled
              ? 'bg-[#f0f4f8] text-slate-300 cursor-not-allowed'
              : 'bg-[#f0f4f8] text-slate-900 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_3px_#d1d9e6,-1px_-1px_3px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] active:scale-95 cursor-pointer'
          }`}
        >
          0
        </button>

        <button
          onClick={onDeleteDigit}
          disabled={disabled || inputDigits.length === 0}
          className="h-9.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-0.5 bg-[#f0f4f8] text-rose-700 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <Delete className="w-3.5 h-3.5" />
          <span>삭제</span>
        </button>
      </div>
    </div>
  );
};
