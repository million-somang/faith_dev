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
  gameScore?: number;
  earnedPoints?: number;
  isSavingScore?: boolean;
  saveMessage?: string | null;
  isLoggedIn?: boolean;
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
  gameScore = 0,
  earnedPoints = 35,
  isSavingScore = false,
  saveMessage = null,
  isLoggedIn = false,
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

  const handleShare = () => {
    soundEffects.playSnap();
    const shareText = `[베라장기] ${title} - ${reason} | 랭킹 점수: ${gameScore.toLocaleString()}점 (초 ${choScore} : 한 ${hanScore})`;
    if (navigator.share) {
      navigator
        .share({
          title: '베라장기 승리 기록',
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('승리 기록이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-6 text-center relative overflow-hidden text-slate-800"
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
        <div className="relative inline-block mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-amber-500/25 mx-auto animate-bounce">
            <i className={`fas ${isDraw ? 'fa-handshake' : 'fa-trophy'}`}></i>
          </div>
        </div>

        {/* Title & Reason */}
        <h2 className="text-xl font-black tracking-tight text-slate-900 mb-0.5">{title}</h2>
        <p className="text-xs text-slate-500 mb-3.5 font-medium">{reason}</p>

        {/* 종합 랭킹 점수 히어로 배너 */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white rounded-2xl p-3.5 border border-emerald-200/90 mb-3 text-center shadow-xs">
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block mb-0.5">
            대국 랭킹 점수
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
            {gameScore.toLocaleString()}
            <span className="text-xs font-bold text-emerald-700 ml-1">점</span>
          </div>
        </div>

        {/* 장기 공식 점수표 (초 vs 한) */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/90 mb-3 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
            한국장기협회 공식 기물 점수
          </div>
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-emerald-600 mb-0.5">초(楚)</span>
              <span className="text-xl font-black text-slate-800">{choScore}</span>
            </div>
            <div className="text-slate-300 font-black text-base">VS</div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-rose-600 mb-0.5">한(漢) (덤 +1.5)</span>
              <span className="text-xl font-black text-slate-800">{hanScore}</span>
            </div>
          </div>

          {gameMode === 'puzzle' && (
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-amber-600 font-bold">
                <i className="fas fa-fire mr-1"></i>일일 묘수 연속 달성
              </span>
              <span className="font-extrabold text-slate-800">{puzzleStreak}일 연속</span>
            </div>
          )}
        </div>

        {/* 베라 포인트 적립 & 서버 랭킹 저장 상태 인디케이터 */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-2xs">
            <i className="fas fa-coins text-amber-500"></i>
            <span>베라 포인트 +{earnedPoints}P 적립</span>
          </div>

          {isSavingScore ? (
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 py-0.5">
              <i className="fas fa-spinner fa-spin text-emerald-600"></i>
              <span>명예의 전당 랭킹 등록 중...</span>
            </div>
          ) : saveMessage ? (
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-50 py-1 px-3 rounded-lg border border-emerald-200">
              <i className="fas fa-check-circle text-emerald-600"></i>
              <span>{saveMessage}</span>
            </div>
          ) : !isLoggedIn ? (
            <div className="text-[10px] text-slate-400 font-medium py-0.5">
              💡 로그인 시 명예의 전당 랭킹 및 포인트가 영구 저장됩니다.
            </div>
          ) : null}
        </div>

        {/* 조작 버튼 */}
        <div className="space-y-2">
          <button
            onClick={() => {
              soundEffects.playSnap();
              onNewGame();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
