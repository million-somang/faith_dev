import React, { useEffect, useRef } from 'react';
import { Side } from '../types/janggi';

interface CheckmateBannerProps {
  winner: Side;
  playerSide: Side;
  onClose: () => void;
}

export const CheckmateBanner: React.FC<CheckmateBannerProps> = ({ winner, playerSide, onClose }) => {
  const isPlayerWinner = winner === playerSide;
  const isChoWinner = winner === 'cho';

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onCloseRef.current();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={() => onCloseRef.current()}
      className="absolute inset-0 z-30 rounded-2xl px-3 shadow-md border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-white to-amber-100 flex items-center justify-between gap-2 cursor-pointer select-none animate-janggun-pop"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 text-xs font-black px-2.5 py-1 rounded-xl text-white shadow-xs bg-gradient-to-r from-rose-600 to-red-600">
          外痛手 외통!
        </span>
        <div className="flex flex-col text-left min-w-0">
          <span className="text-xs font-black text-slate-900 truncate">
            {isPlayerWinner
              ? '🎉 완벽한 외통수 승리! 마지막 수를 확인하세요'
              : '⚔️ 외통수에 걸렸습니다! 마지막 수를 확인하세요'}
          </span>
          <span className="text-[10px] font-bold text-amber-800 truncate">
            {isChoWinner ? '초(楚) 승리' : '한(漢) 승리'} • 터치하여 닫기
          </span>
        </div>
      </div>
      <span className="shrink-0 text-[10px] font-extrabold px-2 py-1 rounded-md bg-amber-200/80 text-amber-950">
        닫기 ✕
      </span>
    </div>
  );
};
