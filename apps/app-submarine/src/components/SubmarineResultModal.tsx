import React from 'react';
import { GamePhase } from '../types/submarine';

interface SubmarineResultModalProps {
  isOpen: boolean;
  gamePhase: GamePhase;
  turnCount: number;
  playerHits: number;
  playerMisses: number;
  isMember?: boolean;
  isSavingRecord?: boolean;
  savedRecordInfo?: {
    rating?: number;
    ratingDelta?: number;
    earnedPoints?: number;
    saved: boolean;
  } | null;
  onRestart: () => void;
  onViewLeaderboard?: () => void;
  onShare: () => void;
}

export const SubmarineResultModal: React.FC<SubmarineResultModalProps> = ({
  isOpen,
  gamePhase,
  turnCount,
  playerHits,
  playerMisses,
  isMember = false,
  isSavingRecord = false,
  savedRecordInfo = null,
  onRestart,
  onViewLeaderboard,
  onShare,
}) => {
  if (!isOpen || gamePhase === 'battle') return null;

  const isVictory = gamePhase === 'victory';
  const totalShots = playerHits + playerMisses;
  const accuracy = totalShots > 0 ? Math.round((playerHits / totalShots) * 100) : 0;
  const ratingScore = isVictory
    ? Math.max(1200, 3000 - turnCount * 45 + accuracy * 10)
    : 850;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in"
      data-screenshot-point="result"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 border-2 border-[#EBE6DD] shadow-2xl text-center space-y-4 relative overflow-hidden">
        {/* 상단 장식 바 */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            isVictory ? 'bg-gradient-to-r from-indigo-500 via-amber-400 to-indigo-600' : 'bg-slate-400'
          }`}
        />

        {/* 엠블럼 아이콘 */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-[#FAF8F5] border-2 border-[#EBE6DD] flex items-center justify-center shadow-inner relative">
          <i
            className={`fas ${
              isVictory ? 'fa-trophy text-amber-500 text-3xl animate-bounce' : 'fa-skull-crossbones text-slate-500 text-3xl'
            }`}
          ></i>
        </div>

        {/* 타이틀 */}
        <div>
          <span
            className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full ${
              isVictory ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isVictory ? 'OPERATION SUCCESS' : 'MISSION FAILED'}
          </span>
          <h2 className="text-2xl font-black text-[#2D2A26] mt-1.5">
            {isVictory ? '해역 제압 완승! 🏆' : '함대 격침 패배'}
          </h2>
          <p className="text-xs text-[#7A756D] mt-1">
            {isVictory
              ? '적 잠수함 및 주력 함대를 전원 침몰시키고 작전 해역을 평정했습니다.'
              : '아군 기동 전대가 모두 격침되었습니다. 새로운 작전으로 재출격하세요.'}
          </p>
        </div>

        {/* 통계 요약 카드 */}
        <div className="grid grid-cols-3 gap-2 bg-[#FAF8F5] p-3 rounded-2xl border border-[#EBE6DD]">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#8C8479]">소요 턴수</span>
            <div className="text-base font-black text-[#2D2A26] font-mono">{turnCount}턴</div>
          </div>
          <div className="space-y-0.5 border-x border-[#EBE6DD]">
            <span className="text-[10px] font-bold text-[#8C8479]">포격 명중률</span>
            <div className="text-base font-black text-indigo-600 font-mono">{accuracy}%</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#8C8479]">전술 평점</span>
            <div className="text-base font-black text-amber-600 font-mono">{ratingScore}점</div>
          </div>
        </div>

        {/* 명예의 전당 점수 반영 상태 배지 */}
        <div
          className={`px-3 py-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 ${
            isSavingRecord
              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-700'
              : isMember && savedRecordInfo?.saved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50/80 border-amber-200 text-amber-800'
          }`}
        >
          {isSavingRecord ? (
            <>
              <i className="fas fa-spinner fa-spin text-indigo-600"></i>
              <span>전적 및 랭킹 점수를 기록하는 중입니다...</span>
            </>
          ) : isMember && savedRecordInfo?.saved ? (
            <>
              <i className="fas fa-circle-check text-emerald-600"></i>
              <span>
                명예의 전당 반영 완료! (레이팅{' '}
                {(savedRecordInfo.ratingDelta ?? 0) >= 0
                  ? `+${savedRecordInfo.ratingDelta}`
                  : savedRecordInfo.ratingDelta}
                {savedRecordInfo.rating ? ` → ${savedRecordInfo.rating}P` : ''}
                {savedRecordInfo.earnedPoints ? ` · +${savedRecordInfo.earnedPoints} 베라P` : ''})
              </span>
            </>
          ) : (
            <>
              <i className="fas fa-circle-info text-amber-600"></i>
              <span>게스트 전적 반영됨 (로그인 시 명예의 전당 랭킹에 공식 등재)</span>
            </>
          )}
        </div>

        {/* 버튼 액션 */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="fas fa-rotate-right"></i>
            <span>새로운 작전 구역 출격</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            {onViewLeaderboard && (
              <button
                type="button"
                onClick={onViewLeaderboard}
                className="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-trophy text-amber-500"></i>
                <span>명예의 전당 보기</span>
              </button>
            )}
            <button
              type="button"
              onClick={onShare}
              className={`w-full py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#2D2A26] border border-[#EBE6DD] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                onViewLeaderboard ? '' : 'col-span-2'
              }`}
            >
              <i className="fas fa-share-nodes text-indigo-600"></i>
              <span>작전 결과 공유</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
