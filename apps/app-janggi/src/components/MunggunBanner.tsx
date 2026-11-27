import React, { useEffect, useRef } from 'react';
import { Side } from '../types/janggi';

interface MunggunBannerProps {
  defender: Side;
  playerSide: Side;
  onClose: () => void;
}

export const MunggunBanner: React.FC<MunggunBannerProps> = ({
  defender,
  playerSide,
  onClose,
}) => {
  const isPlayerDefender = defender === playerSide;
  const isChoDefender = defender === 'cho';

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onCloseRef.current();
    }, 1100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={() => onCloseRef.current()}
      className={`absolute inset-0 z-30 rounded-2xl px-3 flex items-center justify-between gap-2 cursor-pointer select-none border-2 shadow-md animate-munggun-pop ${
        isChoDefender
          ? 'bg-emerald-50/98 border-emerald-500 text-emerald-950'
          : 'bg-sky-50/98 border-sky-500 text-sky-950'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-black text-white shadow-xs tracking-tight ${
            isChoDefender
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-sky-600 to-indigo-600'
          }`}
        >
          防 멍군!
        </span>
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-xs font-black truncate">
            {isPlayerDefender ? '장군 방어 성공! 반격의 기회입니다' : '상대가 장군을 막아냈습니다'}
          </span>
          <span className="text-[10px] font-bold opacity-75 truncate">
            {isChoDefender ? '초(楚) 진영 안정화' : '한(漢) 진영 안정화'}
          </span>
        </div>
      </div>
      <i
        className={`fas fa-shield-halved text-base shrink-0 ${
          isChoDefender ? 'text-emerald-600' : 'text-sky-600'
        }`}
      ></i>
    </div>
  );
};
