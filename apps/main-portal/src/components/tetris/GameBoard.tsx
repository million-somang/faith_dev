import React from 'react';
import { Board, Piece } from './types';

interface GameBoardProps {
    board: Board;
    currentPiece: Piece | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, currentPiece }) => {
    const renderBoard = () => {
        const finalBoard = board.map(row => [...row]);

        if (currentPiece) {
            currentPiece.shape.forEach((row, rIdx) => {
                row.forEach((value, cIdx) => {
                    if (value !== 0) {
                        const boardRow = currentPiece.position.row + rIdx;
                        const boardCol = currentPiece.position.col + cIdx;

                        if (boardRow >= 0 && boardRow < finalBoard.length && boardCol >= 0 && boardCol < finalBoard[0].length) {
                            finalBoard[boardRow][boardCol] = {
                                type: currentPiece.type,
                                color: currentPiece.color
                            };
                        }
                    }
                });
            });
        }

        return finalBoard;
    };

    const renderedBoard = renderBoard();

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 w-fit mx-auto shadow-md overflow-hidden">
                <div className="grid gap-[1px] bg-slate-900 grid-cols-10 grid-rows-[repeat(20,1fr)] w-[280px] h-[560px] rounded-lg overflow-hidden">
                    {renderedBoard.map((row, rIdx) => (
                        row.map((cell, cIdx) => (
                            <div
                                key={`${rIdx}-${cIdx}`}
                                className={`w-full h-full border  
                    ${cell ? cell.color : 'bg-slate-950 border-slate-900/40'} 
                    ${cell ? 'border-[4px] border-t-white/60 border-l-white/40 border-b-black/60 border-r-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.3)]' : ''}
                  `}
                            />
                        ))
                    ))}
                </div>
            </div>
            {/* 얇고 심플한 PC 조작법 가이드 */}
            <div className="hidden lg:flex items-center justify-center gap-4 text-[10px] text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm w-full max-w-[300px] tracking-tight">
                <div className="flex items-center gap-1">
                    <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono text-[9px] border border-slate-300/60">←→</span>
                    <span>이동</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono text-[9px] border border-slate-300/60">↑</span>
                    <span>회전</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[9px] border border-slate-300/60">Space</span>
                    <span>드롭</span>
                </div>
            </div>
        </div>
    );
};

export default GameBoard;
