import React, { useState } from 'react';
import { GridCell, PlacedShip } from '../types/submarine';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

interface SubmarineGridProps {
  mode: 'targeting' | 'radar';
  grid: GridCell[][];
  fleet?: PlacedShip[];
  onCellClick?: (x: number, y: number) => void;
  disabled?: boolean;
  isSonarActive?: boolean;
  aimingCoord?: { x: number; y: number } | null;
}

export const SubmarineGrid: React.FC<SubmarineGridProps> = ({
  mode,
  grid,
  fleet,
  onCellClick,
  disabled = false,
  isSonarActive = false,
  aimingCoord = null,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const isTargeting = mode === 'targeting';

  // 특정 좌표에 배치된 함선 찾기
  const findShipAt = (x: number, y: number) => {
    if (!fleet) return null;
    return fleet.find((s) => s.cells.some((c) => c.x === x && c.y === y));
  };

  return (
    <div
      className="w-full flex flex-col items-center select-none"
      data-screenshot-point={isTargeting ? 'action' : undefined}
    >
      {/* 상단 열 인덱스 (1~10) */}
      <div className="grid grid-cols-11 w-full max-w-[370px] text-center mb-1 text-[10px] font-mono font-black text-[#8C8479]">
        <div className="flex items-center justify-center">#</div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {i + 1}
          </div>
        ))}
      </div>

      {/* 10x10 격자 본체 */}
      <div className="w-full max-w-[370px] aspect-square bg-white rounded-2xl p-1.5 border-2 border-[#E5DEC9] shadow-md grid grid-rows-10 gap-0.5 relative overflow-hidden bg-nautical-grid">
        {grid.map((row, y) => (
          <div key={y} className="grid grid-cols-11 gap-0.5 items-center">
            {/* 좌측 행 인덱스 (A~J) */}
            <div className="text-[10px] font-mono font-black text-[#8C8479] flex items-center justify-center h-full">
              {ROW_LABELS[y]}
            </div>

            {/* 10개 셀 */}
            {row.map((cell, x) => {
              const ship = !isTargeting ? findShipAt(x, y) : null;
              const isHit = cell.status === 'hit';
              const isMiss = cell.status === 'miss';
              const isFired = isHit || isMiss;

              // 소나 스캔 범위 강조 (호버 시 3x3 프리뷰)
              const isHoveredSonarScope =
                isSonarActive &&
                hoveredCell &&
                Math.abs(hoveredCell.x - x) <= 1 &&
                Math.abs(hoveredCell.y - y) <= 1;

              // AI 조준 락온 타겟인지 확인 (아군 레이더 뷰)
              const isAiAimingThisCell =
                !isTargeting &&
                aimingCoord &&
                aimingCoord.x === x &&
                aimingCoord.y === y;

              return (
                <button
                  key={`${x}_${y}`}
                  type="button"
                  disabled={disabled || (isTargeting && isFired && !isSonarActive)}
                  onClick={() => onCellClick?.(x, y)}
                  onMouseEnter={() => setHoveredCell({ x, y })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 touch-manipulation cursor-pointer ${
                    isAiAimingThisCell
                      ? 'bg-rose-500/25 border-2 border-rose-600 ring-4 ring-rose-400/60 animate-pulse z-10 scale-105'
                      : isHit
                      ? 'bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-xs animate-explosion'
                      : isMiss
                      ? 'bg-blue-100/90 text-blue-600 border border-blue-200 shadow-2xs'
                      : !isTargeting && ship
                      ? ship.isSunk
                        ? 'bg-slate-400 text-white line-through opacity-70'
                        : 'bg-indigo-900 text-white shadow-2xs'
                      : isHoveredSonarScope
                      ? 'bg-emerald-200 border-2 border-emerald-500 animate-pulse'
                      : cell.isSonarScanned
                      ? cell.hasSonarDetected
                        ? 'bg-amber-100 border border-amber-400 text-amber-700'
                        : 'bg-emerald-50/70 border border-emerald-300 text-emerald-600'
                      : 'bg-white/80 hover:bg-indigo-50/80 active:bg-indigo-100/90 border border-[#EBE6DD]'
                  }`}
                  aria-label={`${ROW_LABELS[y]}-${x + 1} 좌표 ${isHit ? '명중' : isMiss ? '빗나감' : '사격 가능'}`}
                >
                  {/* AI 조준 락온 마커 */}
                  {isAiAimingThisCell && (
                    <span className="absolute inset-0 flex items-center justify-center text-rose-600 drop-shadow">
                      <i className="fas fa-crosshairs text-base animate-spin"></i>
                    </span>
                  )}

                  {/* 피격 명중 폭발 마커 */}
                  {isHit && (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-fire text-[11px] drop-shadow"></i>
                    </span>
                  )}

                  {/* 빗나감 물기둥 마커 */}
                  {isMiss && (
                    <span className="flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-splash-ripple"></span>
                    </span>
                  )}

                  {/* 아군 함선 배치 표시 (레이더 뷰) */}
                  {!isTargeting && !isHit && ship && (
                    <span className="text-[9px] text-cyan-200">
                      <i className={`fas ${ship.type === 'submarine' ? 'fa-water' : 'fa-anchor'}`}></i>
                    </span>
                  )}

                  {/* 소나 스캔 결과 잔상 표시 */}
                  {isTargeting && !isFired && cell.isSonarScanned && (
                    <span className="text-[8px] font-mono font-black">
                      {cell.hasSonarDetected ? (
                        <i className="fas fa-radar text-amber-600 animate-bounce"></i>
                      ) : (
                        <span className="text-emerald-500 text-[10px]">·</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
