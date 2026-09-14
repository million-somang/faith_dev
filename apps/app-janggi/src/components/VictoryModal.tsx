import React from 'react';
import { GameMode, Side } from '../types/janggi';
import { soundEffects } from '../utils/soundEffects';

interface VictoryModalProps {
  winner: Side | 'draw' | null;
  reason: string;
  choScore: number;
  hanScore: number;
  gameMode: GameMode;
  puzzleStreak?: number;
  onRestart: () => void;
  onNewGame: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  reason,
  choScore,
  hanScore,
  gameMode,
  puzzleStreak = 1,
  onRestart,
  onNewGame,
}) => {
  if (!winner) return null;

  const isCho = winner === 'cho';
  const isDraw = winner === 'draw';

  const title = isDraw
    ? '무승부 (빅장 / 동점)'
    : isCho
    ? '초(楚)나라 승리!'
    : '한(漢)나라 승리!';

  const getPointsReward = () => {
    if (isDraw) return 10;
    if (gameMode === 'puzzle') return 50 + puzzleStreak * 10;
    if (gameMode === 'mini') return 30;
    if (gameMode === 'battle') return 40;
    return 35;
  };

  const earnedPoints = getPointsReward();

  const handleShare = () => {
    soundEffects.playSnap();
    if (navigator.share) {
      navigator
        .share({
          title: '베라장기 승리 기록',
          text: `베라장기 [${title}] ${reason}! 점수 초 ${choScore} : 한 ${hanScore}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`[베라장기] ${title} - ${reason} (점수: 초 ${choScore} : 한 ${hanScore})`);
      alert('승리 기록이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 text-center relative overflow-hidden text-slate-800"
        data-screenshot-target="victory-dialog"
      >
        {/* Soft ambient background accent */}
        <div
          className={`absolute -top-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-20 ${
            isCho ? 'bg-emerald-400' : isDraw ? 'bg-amber-400' : 'bg-rose-400'
          }`}
        />
        <div
          className={`absolute -bottom-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 ${
            isCho ? 'bg-teal-400' : isDraw ? 'bg-blue-400' : 'bg-red-400'
          }`}
        />

        {/* Crown / Trophy icon */}
        <div className="relative inline-block mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-amber-500/25 mx-auto animate-bounce">
            <i className={`fas ${isDraw ? 'fa-handshake' : 'fa-trophy'}`}></i>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1">{title}</h2>
        <p className="text-xs text-slate-500 mb-5 font-medium">{reason}</p>

        {/* Score comparison card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 mb-5 shadow-xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">공식 점수 결과</div>
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-600 mb-0.5">초(楚)</span>
              <span className="text-2xl font-black text-slate-800">{choScore}</span>
            </div>
            <div className="text-slate-300 font-black text-xl">VS</div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-rose-600 mb-0.5">한(漢) (덤 +1.5)</span>
              <span className="text-2xl font-black text-slate-800">{hanScore}</span>
            </div>
          </div>

          {gameMode === 'puzzle' && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-amber-600 font-bold">
                <i className="fas fa-fire mr-1"></i>일일 묘수 연속 달성
              </span>
              <span className="font-extrabold text-slate-800">{puzzleStreak}일 연속</span>
            </div>
          )}
        </div>

        {/* Point reward */}
        <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <i className="fas fa-coins text-amber-500"></i>
          <span>베라 포인트 +{earnedPoints}P 획득!</span>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              soundEffects.playSnap();
              onNewGame();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fas fa-play"></i>
            <span>새 대국 시작하기</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundEffects.playSnap();
                onRestart();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <i className="fas fa-redo-alt mr-1.5"></i>다시하기
            </button>
            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <i className="fas fa-share-alt mr-1.5"></i>결과 공유
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
