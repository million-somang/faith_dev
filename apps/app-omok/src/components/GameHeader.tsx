import React from 'react';
import { Volume2, VolumeX, Clock, Hash, Cpu, User } from 'lucide-react';
import { Difficulty, Player } from '../types/omok';

interface GameHeaderProps {
  currentTurn: Player;
  humanPlayer: Player;
  isThinking: boolean;
  difficulty: Difficulty;
  timeElapsed: number;
  moveCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentTurn,
  humanPlayer,
  isThinking,
  difficulty,
  timeElapsed,
  moveCount,
  isMuted,
  onToggleMute,
}) => {
  const isHumanTurn = currentTurn === humanPlayer;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const difficultyBadge = {
    EASY: { label: '초급', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    NORMAL: { label: '중급', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    HARD: { label: '고급', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[difficulty];

  return (
    <header className="w-full bg-white border-b border-slate-200/80 px-4 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between">
        {/* 브랜드 로고 및 난이도 */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-xs">
            <span className="text-white text-xs font-black">五</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-slate-800 tracking-tight">베라오목</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${difficultyBadge.color}`}>
                {difficultyBadge.label}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Vera Omok • 15×15</span>
          </div>
        </div>

        {/* 턴 인디케이터 */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
          <div className="relative flex items-center justify-center">
            {currentTurn === 'BLACK' ? (
              <div className="w-4 h-4 rounded-full stone-black" />
            ) : (
              <div className="w-4 h-4 rounded-full stone-white border border-slate-300" />
            )}
            {isThinking && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
            {isHumanTurn ? (
              <>
                <User className="w-3 h-3 text-slate-500" />
                <span>내 턴</span>
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3 text-amber-600 animate-pulse" />
                <span className="text-amber-700">AI 연산중...</span>
              </>
            )}
          </div>
        </div>

        {/* 타이머 & 수순 & 사운드 버튼 */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium bg-slate-100/80 px-2 py-0.5 rounded-md">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatTime(timeElapsed)}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-0.5">
              <Hash className="w-3 h-3 text-slate-400" />
              {moveCount}수
            </span>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? '음소거 해제' : '음소거'}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
