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

  // 함선 종류별 전술 아이콘 렌더링
  const renderShipIcon = (type?: string) => {
    switch (type) {
      case 'carrier':
        return <i className="fas fa-plane-departure text-[9px] text-amber-300 drop-shadow"></i>;
      case 'battleship':
        return <i className="fas fa-shield text-[9px] text-cyan-300 drop-shadow"></i>;
      case 'cruiser':
        return <i className="fas fa-crosshairs text-[9px] text-indigo-300 drop-shadow"></i>;
      case 'submarine':
        return <i className="fas fa-water text-[9px] text-emerald-300 drop-shadow"></i>;
      case 'destroyer':
        return <i className="fas fa-bolt text-[9px] text-yellow-300 drop-shadow"></i>;
      default:
        return <i className="fas fa-anchor text-[9px] text-cyan-200 drop-shadow"></i>;
    }
  };

  return (
    <div
      className="w-full flex flex-col items-center select-none"
      data-screenshot-point={isTargeting ? 'action' : undefined}
    >
      {/* 상단 열 인덱스 (1~10) */}
      <div className="grid grid-cols-11 w-full max-w-[370px] text-center mb-1 text-[11px] font-mono font-black text-cyan-900">
        <div className="flex items-center justify-center text-[#8C8479]">#</div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center text-cyan-900 font-extrabold">
            {i + 1}
          </div>
        ))}
      </div>

      {/* 10x10 격자 본체 (실제 바다 배경 & 전술 해역 뷰) */}
      <div className="w-full max-w-[370px] aspect-square rounded-2xl p-1.5 border-2 border-cyan-950/70 shadow-xl grid grid-rows-10 gap-0.5 relative overflow-hidden bg-ocean-theater animate-ocean-shimmer">
        {/* 바다 위 전술 나침반 & 경위도 워터마크 */}
        <div className="absolute right-2 bottom-2 pointer-events-none opacity-20 text-cyan-200 text-6xl select-none">
          <i className="fas fa-compass"></i>
        </div>
        <div className="absolute left-2.5 bottom-1 pointer-events-none opacity-30 text-[8px] font-mono text-cyan-200 select-none tracking-widest">
          SECTOR 37°N 131°E
        </div>

        {grid.map((row, y) => (
          <div key={y} className="grid grid-cols-11 gap-0.5 items-center relative z-10">
            {/* 좌측 행 인덱스 (A~J) */}
            <div className="text-[11px] font-mono font-black text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] flex items-center justify-center h-full">
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
                      ? 'bg-rose-500/30 border-2 border-rose-500 ring-4 ring-rose-400/70 animate-pulse z-20 scale-105'
                      : isHit
                      ? 'bg-gradient-to-br from-rose-600 via-amber-600 to-slate-950 border border-amber-300 text-white shadow-lg animate-explosion z-10'
                      : isMiss
                      ? 'bg-sky-900/50 border border-cyan-300/40 text-cyan-100 shadow-inner'
                      : !isTargeting && ship
                      ? ship.isSunk
                        ? 'bg-slate-900/90 border border-rose-900/70 text-slate-500 line-through opacity-70'
                        : 'bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 border-2 border-cyan-400/80 text-cyan-200 shadow-md'
                      : isHoveredSonarScope
                      ? 'bg-emerald-300/40 border-2 border-emerald-400 animate-pulse'
                      : cell.isSonarScanned
                      ? cell.hasSonarDetected
                        ? 'bg-amber-400/30 border border-amber-400 text-amber-300'
                        : 'bg-emerald-400/20 border border-emerald-400 text-emerald-300'
                      : 'bg-sky-950/20 hover:bg-cyan-500/25 active:bg-cyan-500/35 border border-sky-400/20 hover:border-cyan-300/70 hover:shadow-[0_0_8px_rgba(34,211,238,0.35)] backdrop-blur-[0.5px]'
                  }`}
                  aria-label={`${ROW_LABELS[y]}-${x + 1} 좌표 ${isHit ? '명중' : isMiss ? '빗나감' : '사격 가능'}`}
                >
                  {/* AI 조준 락온 마커 */}
                  {isAiAimingThisCell && (
                    <span className="absolute inset-0 flex items-center justify-center text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.9)]">
                      <i className="fas fa-crosshairs text-base animate-spin"></i>
                    </span>
                  )}

                  {/* 피격 명중 폭발 마커 */}
                  {isHit && (
                    <span className="flex items-center justify-center text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]">
                      <i className="fas fa-fire text-xs animate-bounce"></i>
                    </span>
                  )}

                  {/* 빗나감 바다 물보라 마커 */}
                  {isMiss && (
                    <span className="flex flex-col items-center justify-center relative">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-200/90 ring-4 ring-cyan-300/40 animate-ping absolute"></span>
                      <i className="fas fa-water text-[10px] text-cyan-100 drop-shadow relative z-10"></i>
                    </span>
                  )}

                  {/* 아군 함선 배치 표시 (레이더 뷰 - 함종별 선체 디테일) */}
                  {!isTargeting && !isHit && ship && (
                    <span className="text-[9px]">
                      {renderShipIcon(ship.type)}
                    </span>
                  )}

                  {/* 소나 스캔 결과 잔상 표시 */}
                  {isTargeting && !isFired && cell.isSonarScanned && (
                    <span className="text-[8px] font-mono font-black">
                      {cell.hasSonarDetected ? (
                        <i className="fas fa-radar text-amber-400 animate-bounce"></i>
                      ) : (
                        <span className="text-emerald-300 text-[10px]">·</span>
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
