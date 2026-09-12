import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Frown, RotateCcw, Clock, Hash, Zap } from 'lucide-react';
import { Difficulty, GameStatus } from '../types/omok';

interface VictoryModalProps {
  status: GameStatus;
  difficulty: Difficulty;
  timeElapsed: number;
  moveCount: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  status,
  difficulty,
  timeElapsed,
  moveCount,
  onRestart,
}) => {
  useEffect(() => {
    if (status === 'WIN') {
      // 콘페티 축포 발사
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // ignore
      }
    }
  }, [status]);

  if (status === 'PLAYING') return null;

  const isWin = status === 'WIN';
  const isDraw = status === 'DRAW';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}분 ${s}초`;
  };

  const diffLabel = {
    EASY: '초급 AI',
    NORMAL: '중급 AI',
    HARD: '고급 AI (마스터)',
  }[difficulty];

  return (
    <div
      data-screenshot-result
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-xs w-full p-5 text-center flex flex-col items-center space-y-3">
        {/* 아이콘 */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
            isWin
              ? 'bg-amber-100 text-amber-600 border border-amber-300'
              : isDraw
              ? 'bg-slate-100 text-slate-600 border border-slate-300'
              : 'bg-rose-100 text-rose-600 border border-rose-300'
          }`}
        >
          {isWin ? (
            <Trophy className="w-7 h-7" />
          ) : isDraw ? (
            <Zap className="w-7 h-7" />
          ) : (
            <Frown className="w-7 h-7" />
          )}
        </div>

        {/* 결과 타이틀 */}
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {isWin ? '대국 승리! 축하합니다' : isDraw ? '무승부' : '아쉬운 패배'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isWin
              ? `${diffLabel}를 상대로 멋진 승리를 거두었습니다!`
              : isDraw
              ? '팽팽한 접전 끝에 승부를 가리지 못했습니다.'
              : `${diffLabel}의 정밀한 수읽기에 패배했습니다. 다시 도전해보세요!`}
          </p>
        </div>

        {/* 대국 결과 요약 카드 */}
        <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-2 text-slate-600">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-slate-400">
              <Hash className="w-3.5 h-3.5" /> 총 착수 수
            </span>
            <strong className="text-slate-800">{moveCount}수</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" /> 대국 소요 시간
            </span>
            <strong className="text-slate-800">{formatTime(timeElapsed)}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3.5 h-3.5" /> 대결 난이도
            </span>
            <strong className="text-amber-700">{diffLabel}</strong>
          </div>
        </div>

        {/* 다시 하기 버튼 */}
        <button
          onClick={onRestart}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>새 대국 시작하기</span>
        </button>
      </div>
    </div>
  );
};
