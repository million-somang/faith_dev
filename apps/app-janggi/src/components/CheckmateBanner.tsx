import React, { useEffect } from 'react';
import { Side } from '../types/janggi';

interface CheckmateBannerProps {
  winner: Side;
  playerSide: Side;
  onClose: () => void;
}

export const CheckmateBanner: React.FC<CheckmateBannerProps> = ({ winner, playerSide, onClose }) => {
  const isPlayerWinner = winner === playerSide;
  const isChoWinner = winner === 'cho';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="absolute top-2.5 inset-x-3 z-40 flex items-center justify-center cursor-pointer select-none animate-fade-in"
    >
      <div className="relative w-full rounded-2xl px-4 py-2.5 shadow-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50/95 via-white/95 to-amber-100/95 flex items-center justify-between gap-2 animate-janggun-pop">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-base font-black px-2 py-0.5 rounded-lg text-white shadow-sm bg-gradient-to-r from-rose-600 to-red-600 animate-bounce">
            外痛手 외통!
          </span>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-black text-slate-900 truncate">
              {isPlayerWinner
                ? '🎉 완벽한 외통수 승리! 마지막 수를 확인하세요'
                : '⚔️ 외통수에 걸렸습니다! 마지막 수를 확인하세요'}
            </span>
            <span className="text-[10px] font-bold text-amber-800 truncate">
              {isChoWinner ? '초(楚) 승리' : '한(漢) 승리'} • 터치하여 배너 닫기
            </span>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-extrabold px-2 py-1 rounded-md bg-amber-200/80 text-amber-950">
          닫기 ✕
        </span>
      </div>
    </div>
  );
};
