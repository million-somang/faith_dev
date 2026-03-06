import React from 'react';
import { Board, Piece } from '../types';

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
        <div className="bg-slate-900 border-4 border-slate-700 rounded-xl p-2 w-fit mx-auto shadow-2xl overflow-hidden shadow-emerald-900/40">
            <div
                className="grid gap-[1px] bg-slate-800"
                style={{
                    gridTemplateColumns: `repeat(${board[0].length}, 1fr)`,
                    gridTemplateRows: `repeat(${board.length}, 1fr)`,
                    width: '240px',
                    height: '480px'
                }}
            >
                {renderedBoard.map((row, rIdx) => (
                    row.map((cell, cIdx) => (
                        <div
                            key={`${rIdx}-${cIdx}`}
                            className={`w-full h-full border  
                ${cell ? cell.color : 'bg-slate-900 border-slate-800/80'} 
                ${cell ? 'border-[4px] border-t-white/60 border-l-white/40 border-b-black/60 border-r-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.3)]' : ''}
              `}
                            style={{
                                transition: cell ? 'none' : 'background-color 0.2s',
                            }}
                        />
                    ))
                ))}
            </div>
        </div>
    );
};

export default GameBoard;
