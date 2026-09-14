import React, { useEffect } from 'react';
import { Side } from '../types/janggi';

interface JanggunBannerProps {
  attacker: Side;
  onClose: () => void;
}

export const JanggunBanner: React.FC<JanggunBannerProps> = ({ attacker, onClose }) => {
  const isChoAttacker = attacker === 'cho';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[1px] cursor-pointer select-none"
    >
      <div
        className={`relative max-w-[320px] w-full rounded-2xl p-4 sm:p-5 shadow-2xl border-2 animate-janggun-pop text-center flex flex-col items-center justify-center ${
          isChoAttacker
            ? 'bg-gradient-to-b from-[#ecfdf5] via-[#ffffff] to-[#d1fae5] border-[#059669] shadow-emerald-900/30'
            : 'bg-gradient-to-b from-[#fff1f2] via-[#ffffff] to-[#ffe4e6] border-[#dc2626] shadow-rose-900/30'
        }`}
      >
        {/* 상단 장식 리본 태그 */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-xs mb-1.5 ${
            isChoAttacker
              ? 'bg-[#065f46] text-emerald-100'
              : 'bg-[#991b1b] text-rose-100'
          }`}
        >
          <i className="fas fa-crosshairs text-amber-300"></i>
          <span>{isChoAttacker ? '초(楚) 선공 진영' : '한(漢) 후공 진영'}</span>
        </div>

        {/* 웅장한 장군(將軍) 한자 & 한글 타이틀 */}
        <div className="relative my-1 flex items-center justify-center">
          <span
            className={`text-5xl sm:text-6xl font-black tracking-tight leading-none ${
              isChoAttacker ? 'text-[#065f46]' : 'text-[#991b1b]'
            }`}
            style={{
              fontFamily: "'Pretendard Variable', 'Batang', 'Song Myung', serif",
              textShadow: isChoAttacker
                ? '0 2px 10px rgba(5, 150, 105, 0.35), 0 0 2px #047857'
                : '0 2px 10px rgba(220, 38, 38, 0.35), 0 0 2px #b91c1c',
            }}
          >
            將 軍
          </span>
          <span
            className={`ml-2 text-2xl sm:text-3xl font-black px-2 py-0.5 rounded-lg text-white shadow-md animate-bounce ${
              isChoAttacker ? 'bg-[#059669]' : 'bg-[#dc2626]'
            }`}
          >
            장군!
          </span>
        </div>

        {/* 상황 설명 자막 */}
        <div className="mt-2 text-xs sm:text-[13px] font-bold text-slate-700 leading-snug">
          {isChoAttacker ? (
            <p className="text-[#065f46]">
              <span className="font-extrabold text-emerald-900">초(楚)</span>의 맹렬한 공격!{' '}
              <span className="text-rose-700 font-extrabold">한(漢)의 왕</span>이 위기에 빠졌습니다!
            </p>
          ) : (
            <p className="text-[#991b1b]">
              <span className="font-extrabold text-rose-900">한(漢)</span>의 날카로운 일격!{' '}
              <span className="text-emerald-800 font-extrabold">내 왕(楚)</span>을 즉시 대피시키세요!
            </p>
          )}
        </div>

        {/* 닫기 힌트 */}
        <div className="mt-3 text-[10px] text-slate-400 font-medium">
          화면을 터치하거나 잠시 후 자동으로 닫힙니다
        </div>
      </div>
    </div>
  );
};
