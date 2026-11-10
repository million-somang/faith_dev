import React, { useState } from 'react';
import { ActiveMissileStrike, GridCell, PlacedShip } from '../types/submarine';
import waterPillarImg from '../assets/water-pillar.png';
import firePillarImg from '../assets/fire-pillar.png';
import missileProjectileImg from '../assets/missile-projectile.png';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

interface SubmarineGridProps {
  mode: 'targeting' | 'radar';
  grid: GridCell[][];
  fleet?: PlacedShip[];
  onCellClick?: (x: number, y: number) => void;
  disabled?: boolean;
  isSonarActive?: boolean;
  aimingCoord?: { x: number; y: number } | null;
  activeMissile?: ActiveMissileStrike | null;
}

export const SubmarineGrid: React.FC<SubmarineGridProps> = ({
  mode,
  grid,
  fleet,
  onCellClick,
  disabled = false,
  isSonarActive = false,
  aimingCoord = null,
  activeMissile = null,
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
      <div className="w-full max-w-[370px] aspect-square rounded-2xl p-1.5 border-2 border-cyan-950/70 shadow-xl grid grid-rows-10 gap-0.5 relative bg-ocean-theater animate-ocean-shimmer">
        {/* 바다 위 전술 나침반 & 경위도 워터마크 */}
        <div className="absolute right-2 bottom-2 pointer-events-none opacity-20 text-cyan-200 text-6xl select-none overflow-hidden">
          <i className="fas fa-compass"></i>
        </div>
        <div className="absolute left-2.5 bottom-1 pointer-events-none opacity-30 text-[8px] font-mono text-cyan-200 select-none tracking-widest">
          SECTOR 37°N 131°E
        </div>

        {grid.map((row, y) => {
          const isRowActiveMissile =
            Boolean(activeMissile) &&
            activeMissile?.targetGrid === mode &&
            activeMissile?.y === y;

          return (
            <div
              key={y}
              className={`grid grid-cols-11 gap-0.5 items-center relative ${
                isRowActiveMissile ? 'z-30' : 'z-10'
              }`}
            >
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

                // 현재 이 셀에 미사일 타격(비행 or 임팩트)이 진행 중인지 확인
                const isCurrentMissile =
                  activeMissile &&
                  activeMissile.targetGrid === mode &&
                  activeMissile.x === x &&
                  activeMissile.y === y;

                return (
                  <button
                    key={`${x}_${y}`}
                    type="button"
                    disabled={disabled || (isTargeting && isFired && !isSonarActive)}
                    onClick={() => onCellClick?.(x, y)}
                    onMouseEnter={() => setHoveredCell({ x, y })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 touch-manipulation cursor-pointer ${
                      isCurrentMissile
                        ? 'z-40'
                        : isAiAimingThisCell
                        ? 'bg-rose-500/30 border-2 border-rose-500 ring-4 ring-rose-400/70 animate-pulse z-20 scale-105'
                        : isHit
                        ? 'bg-gradient-to-br from-rose-950/90 via-amber-900/80 to-slate-950 border border-amber-400/90 text-white shadow-lg animate-explosion z-20'
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
                    {/* 정밀 유도 대함 순항 미사일 급강하 비행 애니메이션 (실사 이미지) */}
                    {isCurrentMissile && activeMissile.phase === 'flight' && (
                      <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-visible">
                        {/* 목표 좌표 락온 링 */}
                        <div className="absolute w-8 h-8 rounded-full border-2 border-rose-500 animate-target-lock flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]"></span>
                        </div>
                        {/* 상공에서 대각선 급강하하는 실제 순항 미사일 이미지 */}
                        <div className="relative animate-missile-strike flex items-center justify-center pointer-events-none">
                          <img
                            src={missileProjectileImg}
                            alt="Cruise Missile"
                            className="w-12 h-12 max-w-none object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] select-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* 임팩트 1: 빗맞힘 (MISS) 시 실제 해수 물기둥(Water Pillar) 이미지 솟구침 */}
                    {isCurrentMissile && activeMissile.phase === 'impact' && !activeMissile.isHit && (
                      <div className="absolute inset-0 pointer-events-none z-40 flex flex-col items-center justify-end overflow-visible">
                        {/* 수면 충격파 링 확산 */}
                        <div className="absolute bottom-0.5 w-9 h-4 rounded-[50%] border-2 border-cyan-100/90 animate-shockwave-ring bg-cyan-200/35"></div>
                        {/* 하늘 높이 치솟는 실제 물기둥 이미지 */}
                        <img
                          src={waterPillarImg}
                          alt="Water Pillar Explosion"
                          className="w-16 h-22 sm:w-18 sm:h-24 max-w-none object-contain animate-water-geyser origin-bottom -mb-1 select-none pointer-events-none"
                        />
                      </div>
                    )}

                    {/* 임팩트 2: 명중 (HIT) 시 실제 화염 불기둥(Fire Pillar) 이미지 폭발 */}
                    {isCurrentMissile && activeMissile.phase === 'impact' && activeMissile.isHit && (
                      <div className="absolute inset-0 pointer-events-none z-40 flex flex-col items-center justify-end overflow-visible">
                        {/* 충격파 링 */}
                        <div className="absolute bottom-0.5 w-10 h-5 rounded-[50%] border-2 border-amber-300 animate-shockwave-ring bg-orange-500/30"></div>
                        {/* 하늘로 치솟는 실제 화염 불기둥 이미지 */}
                        <img
                          src={firePillarImg}
                          alt="Fire Pillar Detonation"
                          className="w-16 h-22 sm:w-18 sm:h-24 max-w-none object-contain animate-fiery-detonation origin-bottom -mb-1 select-none pointer-events-none"
                        />
                      </div>
                    )}

                    {/* AI 조준 락온 마커 */}
                    {isAiAimingThisCell && (
                      <span className="absolute inset-0 flex items-center justify-center text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.9)]">
                        <i className="fas fa-crosshairs text-base animate-spin"></i>
                      </span>
                    )}

                    {/* 피격 명중 후 타오르는 실제 불기둥 잔상 마커 */}
                    {isHit && (
                      <span className="relative flex items-center justify-center w-full h-full overflow-visible pointer-events-none">
                        <img
                          src={firePillarImg}
                          alt="Burning Hit"
                          className="w-8 h-10 -mt-2.5 max-w-none object-contain animate-flame-flicker select-none"
                        />
                      </span>
                    )}

                    {/* 빗나감 후 바다 물기둥 포말 잔상 마커 */}
                    {isMiss && (
                      <span className="relative flex items-center justify-center w-full h-full overflow-visible pointer-events-none">
                        <span className="w-3 h-1.5 rounded-[50%] bg-cyan-200/80 ring-2 ring-cyan-300/40 animate-ping absolute bottom-1"></span>
                        <img
                          src={waterPillarImg}
                          alt="Water Splash"
                          className="w-6 h-7 -mt-1 max-w-none object-contain opacity-85 select-none"
                        />
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
          );
        })}
      </div>
    </div>
  );
};
