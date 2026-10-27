import React from 'react';
import {
  ScoreBreakdown,
  Piece,
  GameMode,
  Difficulty,
  JanggiRecordsMap,
  createEmptyJanggiRecords,
} from '../types/janggi';

interface StatusInsightPanelProps {
  score: ScoreBreakdown;
  moveCount: number;
  capturedByCho: Piece[];
  capturedByHan: Piece[];
  currentMode: GameMode;
  aiDifficulty?: Difficulty;
  recordsByTier?: JanggiRecordsMap;
  puzzleProgress?: { current: number; max: number };
}

const TIER_BADGES: { id: Difficulty; label: string }[] = [
  { id: 'beginner', label: '18급' },
  { id: 'easy', label: '10급' },
  { id: 'normal', label: '3급' },
  { id: 'hard', label: '1단' },
  { id: 'master', label: '9단' },
];

const PIECE_LABEL_SHORT: Record<string, string> = {
  chariot: '車',
  cannon: '包',
  horse: '馬',
  elephant: '象',
  guard: '士',
  soldier: '卒',
};

export function StatusInsightPanel({
  score,
  moveCount,
  capturedByCho,
  capturedByHan,
  currentMode,
  aiDifficulty = 'normal',
  recordsByTier,
  puzzleProgress,
}: StatusInsightPanelProps) {
  // 점수 백분율 계산 (기준 73.5점 기준)
  const total = score.choPoints + score.hanPoints;
  const choPercent = total > 0 ? Math.round((score.choPoints / total) * 100) : 50;
  const hanPercent = 100 - choPercent;
  const tierRecords = recordsByTier || createEmptyJanggiRecords();
  const currentTierRec = tierRecords[aiDifficulty] || { wins: 0, losses: 0, draws: 0 };
  const currentTierLabel = TIER_BADGES.find((t) => t.id === aiDifficulty)?.label || '3급';
  const currentTierDecided = currentTierRec.wins + currentTierRec.losses;
  const currentTierWinRate =
    currentTierDecided > 0 ? Math.round((currentTierRec.wins / currentTierDecided) * 100) : 0;

  return (
    <div className="w-full nm-card-sm p-3 bg-white border border-slate-200/90 space-y-2 shadow-xs select-none">
      {/* 0. 급수별 승·무·패 전적 현황 바 */}
      {currentMode !== 'puzzle' && (
        <div className="bg-slate-50/90 rounded-xl px-2.5 py-1.5 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-black text-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black">
                {currentTierLabel}
              </span>
              <span>대국 전적</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold">
              <span className="text-emerald-600">{currentTierRec.wins}승</span>
              {currentTierRec.draws > 0 && <span className="text-slate-500">{currentTierRec.draws}무</span>}
              <span className="text-rose-600">{currentTierRec.losses}패</span>
              <span className="text-slate-400 text-[10px]">({currentTierWinRate}%)</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {TIER_BADGES.map((t) => {
              const r = tierRecords[t.id] || { wins: 0, losses: 0, draws: 0 };
              const isCurrent = t.id === aiDifficulty;
              return (
                <div
                  key={t.id}
                  className={`px-1 py-0.5 rounded-lg border text-center flex flex-col items-center justify-center ${
                    isCurrent
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-black'
                      : 'bg-white border-slate-200/80 text-slate-600 font-bold'
                  }`}
                >
                  <span className="text-[9px] leading-tight">{t.label}</span>
                  <span className="text-[9px] font-mono leading-tight text-slate-700">
                    {r.wins}승{r.losses}패
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 1. 점수제 실시간 우세도 게이지 (한국 장기 공식 73.5점 체계) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-1.5 text-cyan-600">
            <span>楚 초나라</span>
            <span className="font-mono">{score.choPoints}점</span>
          </div>

          <div className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {score.difference > 0
              ? `초 +${score.difference} 우세`
              : score.difference < 0
              ? `한 +${Math.abs(score.difference)} 우세`
              : '동점 (균형)'}
          </div>

          <div className="flex items-center gap-1.5 text-rose-600">
            <span className="font-mono">{score.hanPoints}점</span>
            <span>漢 한나라 (덤 1.5)</span>
          </div>
        </div>

        {/* 듀얼 네온 게이지 바 */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-200">
          <div
            className="bg-cyan-500 h-full transition-all duration-300"
            style={{ width: `${choPercent}%` }}
          ></div>
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${hanPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 2. 포획한 기물 트레이 (Captured Pieces) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
        {/* 초나라가 잡은 한나라 기물 */}
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
          <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
            <span className="text-cyan-600 font-black">楚 포획 기물</span>
            <span>{capturedByCho.length}개</span>
          </div>
          <div className="flex flex-wrap gap-1 min-h-[22px]">
            {capturedByCho.length > 0 ? (
              capturedByCho.map((p, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center justify-center font-mono shadow-2xs"
                >
                  {PIECE_LABEL_SHORT[p.type] || '卒'}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-300">없음</span>
            )}
          </div>
        </div>

        {/* 한나라가 잡은 초나라 기물 */}
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
          <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
            <span className="text-rose-600 font-black">漢 포획 기물</span>
            <span>{capturedByHan.length}개</span>
          </div>
          <div className="flex flex-wrap gap-1 min-h-[22px]">
            {capturedByHan.length > 0 ? (
              capturedByHan.map((p, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-bold flex items-center justify-center font-mono shadow-2xs"
                >
                  {PIECE_LABEL_SHORT[p.type] || '卒'}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-300">없음</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. 대국 진행 상태 요약 인포 바 (850px 하단 데드 스페이스 방지) */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span>총 수순: <strong className="text-slate-800 font-mono">{moveCount}수</strong></span>
          {puzzleProgress && (
            <span className="text-blue-600 font-bold">
              • 외통 수순: {puzzleProgress.current} / {puzzleProgress.max}수
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400">
          {currentMode === 'classic'
            ? '공식 정통 9×10 한국 장기 룰'
            : currentMode === 'puzzle'
            ? '오늘의 외통수 묘수풀이'
            : currentMode === 'mini'
            ? '15초 샷클락 3분 초속기'
            : 'VeraNex 아케이드 장기'}
        </span>
      </div>
    </div>
  );
}
