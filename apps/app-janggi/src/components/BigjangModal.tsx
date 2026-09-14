import React from 'react';
import { Side } from '../types/janggi';
import { soundEffects } from '../utils/soundEffects';

interface BigjangModalProps {
  isOpen: boolean;
  onAcceptDraw: () => void;
  onContinue: () => void;
}

export const BigjangModal: React.FC<BigjangModalProps> = ({
  isOpen,
  onAcceptDraw,
  onContinue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-amber-300 shadow-2xl p-5 text-slate-800 flex flex-col items-center text-center">
        {/* 아이콘 */}
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
          ⚖️
        </div>

        {/* 타이틀 */}
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          빅장 (Face-to-Face King) 발생!
        </h3>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed px-2">
          초(楚)와 한(漢) 두 궁(왕)이 같은 세로선상에서 사이에 아무 기물 없이 마주보았습니다!
        </p>

        {/* 룰 설명 카드 */}
        <div className="w-full mt-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left text-xs space-y-1">
          <div className="font-bold text-amber-900 flex items-center gap-1">
            <i className="fas fa-scroll text-amber-600"></i>
            <span>한국장기협회 공식 빅장 룰</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-snug">
            • <strong>무승부 선언</strong>: 빅장 상태에서 무승부를 합의하여 대국을 비김(점수 판정)으로 종료합니다.
          </p>
          <p className="text-[11px] text-amber-800 leading-snug">
            • <strong>대국 계속하기</strong>: 무승부를 거부하고 다른 수를 두어 대국을 이어갑니다.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="w-full pt-4 mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              soundEffects.playSnap();
              onContinue();
            }}
            className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            대국 계속하기
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playSnap();
              onAcceptDraw();
            }}
            className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            무승부 선언
          </button>
        </div>
      </div>
    </div>
  );
};
