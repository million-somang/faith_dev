import React from 'react';
import { GameMode, Side, SajuElementBuff } from '../types/janggi';

interface GameHeaderProps {
  currentMode: GameMode;
  currentTurn: Side;
  isCheck: boolean;
  timeRemaining: number; // 샷클락 또는 제한시간(초)
  isMiniMode: boolean;
  isMuted: boolean;
  sajuBuff: SajuElementBuff;
  onToggleMute: () => void;
  onOpenRules: () => void;
  onSelectMode: (mode: GameMode) => void;
}

export function GameHeader({
  currentMode,
  currentTurn,
  isCheck,
  timeRemaining,
  isMiniMode,
  isMuted,
  sajuBuff,
  onToggleMute,
  onOpenRules,
  onSelectMode,
}: GameHeaderProps) {
  // 시간 분:초 포맷
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isChoTurn = currentTurn === 'cho';

  return (
    <header className="w-full space-y-2.5">
      {/* 1. 최상단 모드 탭 바 (Clean Neumorphism 알약 트랙) */}
      <nav className="flex w-full p-1 bg-slate-200/80 rounded-2xl gap-1 overflow-x-auto shadow-inner" role="tablist">
        <button
          type="button"
          onClick={() => onSelectMode('classic')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            currentMode === 'classic'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏆 정통 장기</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('puzzle')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            currentMode === 'puzzle'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🧩 묘수풀이</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('mini')}
          className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            currentMode === 'mini'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>⚡ 미니 7×7</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('battle')}
          className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            currentMode === 'battle'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>💥 배틀 장기</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('saju')}
          className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            currentMode === 'saju'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>☯️ 오행 장기</span>
        </button>
      </nav>

      {/* 2. 대국 현황 바: 현재 턴, 타이머, 장군 알림, 사운드 토글 */}
      <div className="nm-card-sm p-3 bg-white border border-slate-200/90 flex items-center justify-between gap-2 shadow-xs">
        {/* 턴 상태 인디케이터 */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-xs ${
              isChoTurn
                ? 'bg-cyan-500 text-white shadow-cyan-200'
                : 'bg-rose-500 text-white shadow-rose-200'
            }`}
          >
            {isChoTurn ? '楚' : '漢'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">
                {isChoTurn ? '초(楚)나라 턴' : '한(漢)나라 턴'}
              </span>
              {isCheck && (
                <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded text-[10px] font-black animate-ping">
                  장군!
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {isChoTurn ? '에메랄드 시안 진영' : '루비 코랄 진영 (덤 1.5점)'}
            </p>
          </div>
        </div>

        {/* 중앙 샷클락 / 대국 타이머 */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-black text-slate-800">
          <i className={`fas fa-stopwatch ${timeRemaining <= 5 ? 'text-rose-500 animate-bounce' : 'text-slate-500'}`}></i>
          <span className={timeRemaining <= 5 ? 'text-rose-600 font-black' : ''}>
            {isMiniMode ? `${timeRemaining}초` : formatTime(timeRemaining)}
          </span>
        </div>

        {/* 우측 유틸 버튼: 룰 가이드 & 사운드 토글 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenRules}
            title="장기 룰 및 행마법 가이드"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs cursor-pointer transition-colors border border-slate-200"
          >
            <i className="fas fa-question"></i>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? '음소거 해제' : '음소거'}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs cursor-pointer transition-colors border border-slate-200"
          >
            <i className={`fas ${isMuted ? 'fa-volume-xmark text-slate-400' : 'fa-volume-high text-blue-600'}`}></i>
          </button>
        </div>
      </div>

      {/* 3. 오행 만세력 모드 활성화 시 상단 버프 알림 배너 */}
      {currentMode === 'saju' && (
        <div className="nm-card-sm p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between text-xs px-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{sajuBuff.icon}</span>
            <span className="font-extrabold text-amber-900">{sajuBuff.title}</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold">{sajuBuff.desc}</span>
        </div>
      )}
    </header>
  );
}
