import React from 'react';
import { ScoreBreakdown, Piece, GameMode } from '../types/janggi';

interface StatusInsightPanelProps {
  score: ScoreBreakdown;
  moveCount: number;
  capturedByCho: Piece[];
  capturedByHan: Piece[];
  currentMode: GameMode;
  puzzleProgress?: { current: number; max: number };
}

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
  puzzleProgress,
}: StatusInsightPanelProps) {
  // 점수 백분율 계산 (기준 73.5점 기준)
  const total = score.choPoints + score.hanPoints;
  const choPercent = total > 0 ? Math.round((score.choPoints / total) * 100) : 50;
  const hanPercent = 100 - choPercent;

  return (
    <div className="w-full nm-card-sm p-3 bg-white border border-slate-200/90 space-y-2.5 shadow-xs select-none">
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
