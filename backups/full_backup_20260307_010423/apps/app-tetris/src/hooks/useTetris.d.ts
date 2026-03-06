import { Board, Piece, TetrominoType } from '../types';
export declare const useTetris: () => {
    board: Board;
    currentPiece: Piece | null;
    nextPieceType: TetrominoType;
    score: number;
    level: number;
    lines: number;
    isGameOver: boolean;
    isPaused: boolean;
    moveLeft: () => boolean | undefined;
    moveRight: () => boolean | undefined;
    moveDown: () => void;
    rotatePiece: () => void;
    dropPiece: () => void;
    startGame: () => void;
    togglePause: () => void;
};
//# sourceMappingURL=useTetris.d.ts.map