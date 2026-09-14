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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-center relative overflow-hidden"
        data-screenshot-target="victory-dialog"
      >
        {/* Glow backdrop */}
        <div
          className={`absolute -top-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-30 ${
            isCho ? 'bg-cyan-500' : isDraw ? 'bg-amber-500' : 'bg-rose-500'
          }`}
        />
        <div
          className={`absolute -bottom-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 ${
            isCho ? 'bg-emerald-500' : isDraw ? 'bg-indigo-500' : 'bg-red-500'
          }`}
        />

        {/* Crown / Trophy icon */}
        <div className="relative inline-block mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 text-3xl shadow-lg shadow-amber-500/30 mx-auto animate-bounce">
            <i className={`fas ${isDraw ? 'fa-handshake' : 'fa-trophy'}`}></i>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-tight text-white mb-1">{title}</h2>
        <p className="text-xs text-slate-400 mb-5 font-medium">{reason}</p>

        {/* Score comparison card */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 mb-5">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">공식 점수 결과</div>
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-cyan-400 mb-0.5">초(楚)</span>
              <span className="text-2xl font-black text-white">{choScore}</span>
            </div>
            <div className="text-slate-600 font-black text-xl">VS</div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-rose-400 mb-0.5">한(漢) (덤 +1.5)</span>
              <span className="text-2xl font-black text-white">{hanScore}</span>
            </div>
          </div>

          {gameMode === 'puzzle' && (
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold">
                <i className="fas fa-fire mr-1"></i>일일 묘수 연속 달성
              </span>
              <span className="font-extrabold text-white">{puzzleStreak}일 연속</span>
            </div>
          )}
        </div>

        {/* Point reward */}
        <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
          <i className="fas fa-coins text-amber-400"></i>
          <span>베라 포인트 +{earnedPoints}P 획득!</span>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              soundEffects.playSnap();
              onNewGame();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 active:scale-95 transition-all"
            >
              <i className="fas fa-redo-alt mr-1.5"></i>다시하기
            </button>
            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 active:scale-95 transition-all"
            >
              <i className="fas fa-share-alt mr-1.5"></i>결과 공유
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
