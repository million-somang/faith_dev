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
    <div className="w-full flex flex-col gap-2.5">
      {/* 3자리 투구 입력 현황판 */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f0f4f8] rounded-2xl shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border border-white/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">구종 선택:</span>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((idx) => {
              const val = inputDigits[idx];
              const isFilled = Boolean(val);
              return (
                <div
                  key={idx}
                  className={`w-9 h-10 rounded-xl flex items-center justify-center font-mono text-lg font-black transition-all ${
                    isFilled
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 shadow-[3px_3px_6px_#cbd5e1,-2px_-2px_5px_#ffffff] scale-105'
                      : 'bg-slate-200/60 text-slate-400 border border-dashed border-slate-300'
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs tracking-wide transition-all transform active:scale-95 ${
            isReadyToPitch
              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:brightness-105 animate-pulse cursor-pointer'
              : 'bg-slate-300/80 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>투구 (PITCH)</span>
        </button>
      </div>

      {/* 키패드 (1~9, Clear, 0, Backspace) */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isSelected = inputDigits.includes(String(num));
          return (
            <button
              key={num}
              onClick={() => onPushDigit(num)}
              disabled={disabled || isSelected || inputDigits.length >= 3}
              className={`h-11 rounded-xl font-bold text-base transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-slate-200/70 text-slate-300 shadow-[inset_2px_2px_4px_#cbd5e1] cursor-not-allowed'
                  : disabled
                  ? 'bg-[#f0f4f8] text-slate-300 cursor-not-allowed'
                  : 'bg-[#f0f4f8] text-slate-700 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] active:scale-95 cursor-pointer'
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
          className="h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 bg-[#f0f4f8] text-slate-500 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>초기화</span>
        </button>

        <button
          onClick={() => onPushDigit(0)}
          disabled={disabled || inputDigits.includes('0') || inputDigits.length >= 3}
          className={`h-11 rounded-xl font-bold text-base transition-all flex items-center justify-center ${
            inputDigits.includes('0')
              ? 'bg-slate-200/70 text-slate-300 shadow-[inset_2px_2px_4px_#cbd5e1] cursor-not-allowed'
              : disabled
              ? 'bg-[#f0f4f8] text-slate-300 cursor-not-allowed'
              : 'bg-[#f0f4f8] text-slate-700 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] active:scale-95 cursor-pointer'
          }`}
        >
          0
        </button>

        <button
          onClick={onDeleteDigit}
          disabled={disabled || inputDigits.length === 0}
          className="h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 bg-[#f0f4f8] text-rose-500 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        >
          <Delete className="w-4 h-4" />
          <span>삭제</span>
        </button>
      </div>
    </div>
  );
};
