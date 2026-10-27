import React from 'react';
import {
  GameMode,
  Side,
  Difficulty,
  JanggiRecordsMap,
  createEmptyJanggiRecords,
} from '../types/janggi';
import { soundEffects } from '../utils/soundEffects';

export interface VictoryModalProps {
  isOpen: boolean;
  winner: Side | 'draw' | null;
  playerSide?: Side;
  aiDifficulty?: Difficulty;
  recordsByTier?: JanggiRecordsMap;
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
  onClose: () => void;
  onRestart: () => void;
  onNewGame: () => void;
}

const TIER_ROWS: { id: Difficulty; badge: string; title: string }[] = [
  { id: 'master', badge: '9단', title: '프로 달인' },
  { id: 'hard', badge: '1단', title: '고급' },
  { id: 'normal', badge: '3급', title: '중급' },
  { id: 'easy', badge: '10급', title: '초급' },
  { id: 'beginner', badge: '18급', title: '입문' },
];

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winner,
  playerSide = 'cho',
  aiDifficulty = 'normal',
  recordsByTier,
  reason,
  choScore,
  hanScore,
  gameMode,
  puzzleStreak = 1,
  earnedPoints = 35,
  isSavingScore = false,
  saveMessage = null,
  isLoggedIn = false,
  onClose,
  onRestart,
  onNewGame,
}) => {
  if (!winner || !isOpen) return null;

  const isCho = winner === 'cho';
  const isDraw = winner === 'draw';
  const isPlayerWin = !isDraw && (gameMode === 'puzzle' ? winner === 'cho' : winner === playerSide);

  const tierRecords = recordsByTier || createEmptyJanggiRecords();
  const currentTierInfo = TIER_ROWS.find((t) => t.id === aiDifficulty) || TIER_ROWS[2];
  const currentTierRec = tierRecords[aiDifficulty] || { wins: 0, losses: 0, draws: 0 };
  const currentDecided = currentTierRec.wins + currentTierRec.losses;
  const currentWinRate =
    currentDecided > 0 ? Math.round((currentTierRec.wins / currentDecided) * 100) : 0;

  const totalStats = TIER_ROWS.reduce(
    (acc, t) => {
      const r = tierRecords[t.id] || { wins: 0, losses: 0, draws: 0 };
      acc.wins += r.wins;
      acc.losses += r.losses;
      acc.draws += r.draws;
      return acc;
    },
    { wins: 0, losses: 0, draws: 0 }
  );
  const totalDecided = totalStats.wins + totalStats.losses;
  const totalWinRate = totalDecided > 0 ? Math.round((totalStats.wins / totalDecided) * 100) : 0;

  const title = isDraw
    ? '무승부 (빅장 / 동점)'
    : isPlayerWin
    ? `${currentTierInfo.badge} 대국 승리!`
    : `${currentTierInfo.badge} 대국 패배`;

  const handleShare = () => {
    soundEffects.playSnap();
    const shareText = `[베라장기] ${title} (${reason}) | ${currentTierInfo.badge} 전적: ${currentTierRec.wins}승 ${currentTierRec.draws}무 ${currentTierRec.losses}패 | 통산 ${totalStats.wins}승 ${totalStats.losses}패 (승률 ${totalWinRate}%)`;
    if (navigator.share) {
      navigator
        .share({
          title: '베라장기 대국 전적',
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('대국 승패 전적이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-6 text-center relative overflow-hidden text-slate-800"
        data-screenshot-target="victory-dialog"
      >
        {/* 우측 상단 닫기 (판 확인하기) 버튼 */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playSnap();
            onClose();
          }}
          title="결과창 닫고 장기판 확인하기"
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <i className="fas fa-times text-xs"></i>
        </button>

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

        {/* 현재 급수 대국 결과 및 승패 히어로 배너 */}
        <div
          className={`rounded-2xl p-3 border mb-2.5 text-center shadow-xs ${
            isDraw
              ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-amber-200/90'
              : isPlayerWin
              ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border-emerald-200/90'
              : 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 border-rose-200/90'
          }`}
        >
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider block mb-0.5 ${
              isDraw ? 'text-amber-800' : isPlayerWin ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {currentTierInfo.badge} ({currentTierInfo.title}) 대국 전적
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2 font-mono">
            <span className="text-emerald-600">{currentTierRec.wins}승</span>
            <span className="text-slate-400 text-base">{currentTierRec.draws}무</span>
            <span className="text-rose-600">{currentTierRec.losses}패</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400">
              승률 {currentWinRate}%
            </span>
          </div>
        </div>

        {/* 전 급수별 (9단 · 1단 · 3급 · 10급 · 18급) 승·무·패 전적표 */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/90 mb-2.5 shadow-xs text-left">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider flex items-center gap-1">
              <i className="fas fa-medal text-amber-500"></i>
              급수별 승·무·패 전적 현황
            </span>
            <span className="text-[10px] font-mono font-extrabold text-slate-700">
              통산 {totalStats.wins}승 {totalStats.draws}무 {totalStats.losses}패 ({totalWinRate}%)
            </span>
          </div>

          <div className="space-y-1">
            {TIER_ROWS.map((t) => {
              const r = tierRecords[t.id] || { wins: 0, losses: 0, draws: 0 };
              const decided = r.wins + r.losses;
              const rate = decided > 0 ? Math.round((r.wins / decided) * 100) : 0;
              const isCurrent = t.id === aiDifficulty;
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-mono ${
                    isCurrent
                      ? 'bg-amber-50/90 border-amber-300 font-black text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200/70 font-bold text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-sans">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        isCurrent ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.badge}
                    </span>
                    <span className="text-[11px]">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-600 font-extrabold">{r.wins}승</span>
                    <span className="text-slate-400">{r.draws}무</span>
                    <span className="text-rose-600 font-extrabold">{r.losses}패</span>
                    <span className="text-[10px] text-slate-400 w-9 text-right">({rate}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 장기 공식 기물 점수 (초 vs 한) 요약 */}
          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] px-0.5">
            <span className="text-slate-400 font-bold">기물 점수 (공식 73.5점제)</span>
            <div className="flex items-center gap-2 font-mono font-bold">
              <span className="text-emerald-700">초(楚) {choScore}</span>
              <span className="text-slate-300">:</span>
              <span className="text-rose-700">한(漢) {hanScore}</span>
            </div>
          </div>

          {gameMode === 'puzzle' && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-amber-600 font-bold">
                <i className="fas fa-fire mr-1"></i>일일 묘수 연속 달성
              </span>
              <span className="font-extrabold text-slate-800">{puzzleStreak}일 연속</span>
            </div>
          )}
        </div>

        {/* 베라 포인트 적립 & 서버 랭킹 저장 상태 인디케이터 */}
        <div className="flex flex-col gap-1.5 mb-3.5">
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-2xs">
            <i className="fas fa-coins text-amber-500"></i>
            <span>베라 포인트 +{earnedPoints}P 적립</span>
          </div>

          {isSavingScore ? (
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 py-0.5">
              <i className="fas fa-spinner fa-spin text-emerald-600"></i>
              <span>급수별 승패 전적 저장 중...</span>
            </div>
          ) : saveMessage ? (
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-50 py-1 px-3 rounded-lg border border-emerald-200">
              <i className="fas fa-check-circle text-emerald-600"></i>
              <span>{saveMessage}</span>
            </div>
          ) : !isLoggedIn ? (
            <div className="text-[10px] text-slate-400 font-medium py-0.5">
              💡 로그인 시 급수별 승패 전적 및 포인트가 서버에 영구 저장됩니다.
            </div>
          ) : null}
        </div>

        {/* 조작 버튼 */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              soundEffects.playSnap();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-search-plus text-amber-600"></i>
            <span>장기판 확인하기 (마지막 수 보기)</span>
          </button>

          <button
            type="button"
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
              type="button"
              onClick={() => {
                soundEffects.playSnap();
                onRestart();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <i className="fas fa-redo-alt mr-1.5"></i>다시하기
            </button>
            <button
              type="button"
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
