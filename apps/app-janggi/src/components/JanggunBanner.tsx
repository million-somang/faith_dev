import React, { useEffect, useRef } from 'react';
import { Side } from '../types/janggi';

interface JanggunBannerProps {
  attacker: Side;
  playerSide?: Side;
  onClose: () => void;
}

export const JanggunBanner: React.FC<JanggunBannerProps> = ({
  attacker,
  playerSide = 'cho',
  onClose,
}) => {
  const isChoAttacker = attacker === 'cho';
  const isPlayerAttacker = attacker === playerSide;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onCloseRef.current();
    }, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={() => onCloseRef.current()}
      className={`absolute inset-0 z-30 rounded-2xl px-3 flex items-center justify-between gap-2 cursor-pointer select-none border-2 shadow-md animate-janggun-pop ${
        isChoAttacker
          ? 'bg-gradient-to-r from-[#ecfdf5] via-[#ffffff] to-[#d1fae5] border-[#059669] text-[#065f46]'
          : 'bg-gradient-to-r from-[#fff1f2] via-[#ffffff] to-[#ffe4e6] border-[#dc2626] text-[#991b1b]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-black text-white shadow-xs tracking-tight ${
            isChoAttacker ? 'bg-[#059669]' : 'bg-[#dc2626]'
          }`}
        >
          將軍 장군!
        </span>
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-xs font-black truncate">
            {isPlayerAttacker
              ? `내 진영(${isChoAttacker ? '楚' : '漢'})의 날카로운 장군!`
              : `위기! 내 왕(${playerSide === 'cho' ? '楚' : '漢'})을 즉시 피하세요!`}
          </span>
          <span className="text-[10px] font-bold opacity-80 truncate">
            {isChoAttacker ? '초(楚) 공세 • 터치 시 바로 닫힘' : '한(漢) 공세 • 터치 시 바로 닫힘'}
          </span>
        </div>
      </div>
      <i className="fas fa-crosshairs text-base shrink-0 animate-pulse"></i>
    </div>
  );
};
