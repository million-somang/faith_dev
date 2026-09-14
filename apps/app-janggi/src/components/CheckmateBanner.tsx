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
    }, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer select-none animate-fade-in"
    >
      <div className="relative max-w-[340px] w-full rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 via-white to-amber-100 text-center flex flex-col items-center justify-center animate-janggun-pop">
        {/* 상단 황금 리본 뱃지 */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md bg-gradient-to-r from-amber-500 to-amber-600 text-white mb-2">
          <span>{isPlayerWinner ? '🏆 대국 완승' : '⚔️ 대국 종결'}</span>
          <span>•</span>
          <span>{isChoWinner ? '초(楚) 승리' : '한(漢) 승리'}</span>
        </div>

        {/* 웅장한 외통수(外痛手) 한자 & 붓글씨 타이틀 */}
        <div className="relative my-2 flex items-center justify-center gap-2">
          <span
            className="text-5xl sm:text-6xl font-black tracking-tight leading-none text-amber-900"
            style={{
              fontFamily: "'Pretendard Variable', 'Batang', 'Song Myung', serif",
              textShadow: '0 3px 12px rgba(217, 119, 6, 0.4), 0 0 2px #b45309',
            }}
          >
            外 痛 手
          </span>
          <span className="text-2xl sm:text-3xl font-black px-2.5 py-1 rounded-xl text-white shadow-lg bg-gradient-to-r from-rose-600 to-red-600 animate-bounce">
            외통!
          </span>
        </div>

        {/* 승리 선언 및 설명 */}
        <div className="mt-3 text-xs sm:text-sm font-bold text-slate-800 leading-snug">
          {isPlayerWinner ? (
            <p className="text-emerald-900 font-extrabold">
              🎉 축하합니다! 완벽한 수읽기로 상대를 외통수에 몰아넣었습니다!
            </p>
          ) : (
            <p className="text-rose-900 font-extrabold">
              상대 인공지능의 날카로운 공세로 외통수에 걸렸습니다!
            </p>
          )}
          <p className="text-[11px] text-slate-500 mt-1">
            어떤 수도 장군을 피할 수 없는 완벽한 외통수입니다.
          </p>
        </div>

        {/* 닫기 힌트 */}
        <div className="mt-4 text-[10px] text-amber-800/80 font-medium">
          화면을 터치하면 최종 결과 창으로 이동합니다
        </div>
      </div>
    </div>
  );
};
