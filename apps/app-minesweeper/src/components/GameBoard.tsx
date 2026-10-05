import React from 'react';
import { type CellState, type GameStatus } from '../hooks/useMinesweeper';

interface GameBoardProps {
    board: CellState[][];
    cols: number;
    gameStatus: GameStatus;
    interactionMode: 'dig' | 'flag';
    onReveal: (row: number, col: number) => void;
    onFlag: (row: number, col: number) => void;
    onChord: (row: number, col: number) => void;
}

export default function GameBoard({
    board,
    cols,
    gameStatus,
    interactionMode,
    onReveal,
    onFlag,
    onChord,
}: GameBoardProps) {
    // 셀 크기 결정 (초급 9x9 -> 36px, 중급 16x16 -> 21px, 고급 -> 20px)
    const cellSize = cols <= 9 ? 36 : cols <= 16 ? 21 : 20;

    const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
        e.preventDefault();
        if (gameStatus === 'won' || gameStatus === 'lost') return;
        onFlag(row, col);
    };

    const handleClick = (e: React.MouseEvent, row: number, col: number) => {
        e.preventDefault();
        if (gameStatus === 'won' || gameStatus === 'lost') return;

        const cell = board[row][col];

        // 1. 이미 열린 셀 클릭 시 chording
        if (cell.isRevealed && cell.adjacentMines > 0) {
            onChord(row, col);
            return;
        }

        // 2. 모바일 터치 모드가 'flag'인 경우
        if (interactionMode === 'flag' && !cell.isRevealed) {
            onFlag(row, col);
            return;
        }

        // 3. 일반 파기(열기)
        onReveal(row, col);
    };

    // 숫자별 세련된 고대비 텍스트 색상
    const getNumberColor = (num: number): string => {
        switch (num) {
            case 1: return 'text-blue-600';
            case 2: return 'text-emerald-600';
            case 3: return 'text-rose-600';
            case 4: return 'text-indigo-700';
            case 5: return 'text-amber-700';
            case 6: return 'text-teal-600';
            case 7: return 'text-purple-700';
            case 8: return 'text-slate-800';
            default: return 'text-slate-700';
        }
    };

    return (
        <div className="flex justify-center items-center w-full overflow-x-auto py-1 custom-scrollbar">
            <div
                className="inline-grid bg-slate-200 p-1.5 rounded-2xl shadow-inner gap-0.5 select-none"
                style={{
                    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                }}
                onContextMenu={e => e.preventDefault()}
            >
                {board.map((row, r) =>
                    row.map((cell, c) => {
                        const isCenter = r === Math.floor(board.length / 2) && c === Math.floor(cols / 2);

                        // 셀 스타일 구성 (100% 라이트 뉴모피즘)
                        let cellStyle = `flex items-center justify-center font-black transition-all cursor-pointer rounded-md `;
                        let content: React.ReactNode = null;

                        if (cell.isRevealed) {
                            if (cell.isMine) {
                                cellStyle += 'bg-rose-500 text-white shadow-inner animate-shake';
                                content = <i className="fas fa-bomb text-xs"></i>;
                            } else if (cell.isFlagged && !cell.isMine) {
                                cellStyle += 'bg-amber-100 text-rose-500';
                                content = <i className="fas fa-xmark text-xs font-black"></i>;
                            } else if (cell.adjacentMines > 0) {
                                cellStyle += `bg-slate-100/90 border border-slate-200/60 shadow-2xs ${getNumberColor(cell.adjacentMines)}`;
                                content = (
                                    <span style={{ fontSize: cellSize <= 22 ? '11px' : '15px' }}>
                                        {cell.adjacentMines}
                                    </span>
                                );
                            } else {
                                // 빈 셀
                                cellStyle += 'bg-slate-100/80 border border-slate-200/40 shadow-2xs';
                            }
                        } else if (cell.isFlagged) {
                            cellStyle += 'bg-amber-50 border border-amber-300 shadow-xs hover:border-amber-400';
                            content = (
                                <span className="text-rose-600" style={{ fontSize: cellSize <= 22 ? '11px' : '14px' }}>
                                    🚩
                                </span>
                            );
                        } else {
                            // 미개봉 셀
                            cellStyle += 'bg-white border border-slate-200 shadow-2xs hover:border-blue-400 hover:bg-blue-50/50 active:scale-95';
                        }

                        return (
                            <div
                                key={`${r}-${c}`}
                                data-screenshot-click={isCenter ? 'action' : undefined}
                                className={cellStyle}
                                style={{
                                    width: `${cellSize}px`,
                                    height: `${cellSize}px`,
                                }}
                                onClick={e => handleClick(e, r, c)}
                                onContextMenu={e => handleContextMenu(e, r, c)}
                            >
                                {content}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
