import React, { useState } from 'react';
import { Board, Player, Point, WinningLine } from '../types/omok';
import { BOARD_SIZE, STAR_POINTS } from '../utils/aiEngine';

interface OmokBoardProps {
  board: Board;
  currentTurn: Player;
  humanPlayer: Player;
  isThinking: boolean;
  lastMove: Point | null;
  winningLine: WinningLine | null;
  onCellClick: (r: number, c: number) => void;
}

const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

export const OmokBoard: React.FC<OmokBoardProps> = ({
  board,
  currentTurn,
  humanPlayer,
  isThinking,
  lastMove,
  winningLine,
  onCellClick,
}) => {
  const [hoverCoord, setHoverCoord] = useState<Point | null>(null);
  const isHumanTurn = currentTurn === humanPlayer && !isThinking && !winningLine;

  const isStarPoint = (r: number, c: number) => {
    return STAR_POINTS.some(p => p.r === r && p.c === c);
  };

  const isWinningPoint = (r: number, c: number) => {
    return winningLine?.points.some(p => p.r === r && p.c === c) ?? false;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-1 sm:p-2 select-none">
      {/* 바둑판 외곽 프레임 */}
      <div className="relative p-2.5 sm:p-3.5 rounded-2xl wood-board-texture border-4 border-[#8c5720]/40 shadow-xl max-w-[420px] w-full aspect-square flex flex-col justify-between">
        
        {/* 상단 열 좌표 (A ~ P) */}
        <div className="grid grid-cols-15 text-center text-[8px] sm:text-[9px] font-bold text-[#6b421a]/70 mb-1">
          {COL_LETTERS.map((letter) => (
            <div key={letter} className="flex items-center justify-center">
              {letter}
            </div>
          ))}
        </div>

        {/* 15×15 메인 격자 보드 영역 */}
        <div className="relative flex-1 w-full h-full">
          {/* 격자선 레이어 */}
          <div className="absolute inset-[3.33%] grid grid-cols-14 grid-rows-14 pointer-events-none border border-[#784c1f]/60">
            {Array.from({ length: 14 * 14 }).map((_, idx) => (
              <div
                key={idx}
                className="border-r border-b border-[#784c1f]/40"
              />
            ))}
          </div>

          {/* 5개 화점(Star Points) 마커 */}
          {STAR_POINTS.map((sp) => {
            const topPct = (sp.r / (BOARD_SIZE - 1)) * 93.34 + 3.33;
            const leftPct = (sp.c / (BOARD_SIZE - 1)) * 93.34 + 3.33;
            return (
              <div
                key={`star-${sp.r}-${sp.c}`}
                className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#5c3814] shadow-xs pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${topPct}%`, left: `${leftPct}%` }}
              />
            );
          })}

          {/* 승리 5목 연결선 SVG 오버레이 */}
          {winningLine && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <defs>
                <filter id="goldenLaser" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.9" />
                </filter>
              </defs>
              <line
                x1={`${(winningLine.start.c / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                y1={`${(winningLine.start.r / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                x2={`${(winningLine.end.c / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                y2={`${(winningLine.end.r / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                stroke="#fbbf24"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#goldenLaser)"
                className="animate-pulse"
              />
            </svg>
          )}

          {/* 15×15 인터랙티브 교차점 셀 그리드 */}
          <div className="absolute inset-0 grid grid-cols-15 grid-rows-15">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isLast = lastMove?.r === r && lastMove?.c === c;
                const isWinStone = isWinningPoint(r, c);
                const isHover = hoverCoord?.r === r && hoverCoord?.c === c && cell === null && isHumanTurn;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => onCellClick(r, c)}
                    onMouseEnter={() => setHoverCoord({ r, c })}
                    onMouseLeave={() => setHoverCoord(null)}
                    disabled={!isHumanTurn || cell !== null}
                    aria-label={`착수 좌표 ${COL_LETTERS[c]}${15 - r}`}
                    className="relative flex items-center justify-center w-full h-full p-0 m-0 cursor-pointer disabled:cursor-default focus:outline-hidden"
                  >
                    {/* 실제 놓인 3D 돌 */}
                    {cell && (
                      <div
                        className={`relative w-[84%] h-[84%] rounded-full flex items-center justify-center transition-all ${
                          cell === 'BLACK' ? 'stone-black' : 'stone-white'
                        } ${isLast ? 'animate-stone-drop' : ''} ${
                          isWinStone ? 'animate-golden-win z-25' : 'z-10'
                        }`}
                      >
                        {/* 마지막 수 인디케이터 펄스 링 */}
                        {isLast && !isWinStone && (
                          <div className="absolute inset-[-4px] rounded-full border-2 border-amber-400/90 animate-last-move pointer-events-none" />
                        )}

                        {/* 승리 돌 별빛 마커 */}
                        {isWinStone && (
                          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-md animate-ping" />
                        )}
                      </div>
                    )}

                    {/* 마우스 호버 고스트 스톤 (선공/후공 색상 반영) */}
                    {isHover && (
                      <div
                        className={`w-[78%] h-[78%] rounded-full pointer-events-none z-5 ${
                          humanPlayer === 'BLACK' ? 'ghost-stone-black' : 'ghost-stone-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 하단 행 번호 좌표 (15 ~ 1) */}
        <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-bold text-[#6b421a]/70 mt-1 px-1">
          <span>좌표계: 15×15 정통 바둑판</span>
          <span>중앙: H8 (천원)</span>
        </div>
      </div>
    </div>
  );
};
