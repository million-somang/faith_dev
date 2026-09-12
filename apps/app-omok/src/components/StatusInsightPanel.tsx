import React from 'react';
import { AdvantageScore, GameStats, Point } from '../types/omok';
import { ShieldCheck, Lightbulb, Trophy, Compass, Info } from 'lucide-react';

interface StatusInsightPanelProps {
  advantage: AdvantageScore;
  lastMove: Point | null;
  stats: GameStats;
}

const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

export const StatusInsightPanel: React.FC<StatusInsightPanelProps> = ({
  advantage,
  lastMove,
  stats,
}) => {
  const lastMoveLabel = lastMove ? `${COL_LETTERS[lastMove.c]}${15 - lastMove.r}` : '대기 중';
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-3 bg-slate-50 space-y-3">
      {/* 1. 실시간 형세 분석기 (Advantage Meter) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>실시간 형세 분석</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">{advantage.description}</span>
        </div>

        {/* 형세 비례 게이지 바 */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/80">
          <div
            className="bg-slate-800 transition-all duration-300"
            style={{ width: `${advantage.blackRatio}%` }}
            title={`흑돌 유리도: ${advantage.blackRatio}%`}
          />
          <div
            className="bg-slate-300 transition-all duration-300"
            style={{ width: `${advantage.whiteRatio}%` }}
            title={`백돌 유리도: ${advantage.whiteRatio}%`}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-medium text-slate-400 mt-1">
          <span>흑돌 {advantage.blackRatio}%</span>
          <span>최근 착수: <strong className="text-slate-700">{lastMoveLabel}</strong></span>
          <span>백돌 {advantage.whiteRatio}%</span>
        </div>
      </div>

      {/* 2. 전적 리포트 & 오목 필승 전략 가이드 카드 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 나의 전적 요약 */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>나의 대국 전적</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-lg font-black text-slate-800">{stats.wins}승 {stats.losses}패</span>
            <span className="text-xs font-bold text-amber-600">승률 {winRate}%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">총 {stats.totalGames}회 대국 완료</div>
        </div>

        {/* 오목 비결 팁 박스 */}
        <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/60 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span>오목 마스터 비결</span>
          </div>
          <p className="text-[10px] text-amber-800 leading-snug mt-1">
            양쪽이 열린 <strong>'열린 3목'</strong>을 선점하고 상대방의 3목은 즉시 방어하세요.
          </p>
          <div className="text-[9px] text-amber-600/90 font-medium mt-0.5">Tip: 4-3 포크 공격이 승리의 열쇠</div>
        </div>
      </div>

      {/* 3. 저작권 고지문 & VeraNex 브랜딩 (100% 클린 정책) */}
      <div className="bg-white rounded-xl p-2.5 border border-slate-200/70 shadow-2xs flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>순수 자체 개발 알고리즘 및 절차적 사운드 탑재</span>
        </div>
        <span className="font-semibold text-slate-600 shrink-0">© 2026 VeraNex</span>
      </div>
    </div>
  );
};
