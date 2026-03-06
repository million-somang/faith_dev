export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Block = {
    type: TetrominoType;
    color: string;
} | null;
export type Board = Block[][];
export interface Position {
    row: number;
    col: number;
}
export interface Piece {
    type: TetrominoType;
    shape: number[][];
    color: string;
    position: Position;
}
export interface GameState {
    board: Board;
    currentPiece: Piece | null;
    nextPieceType: TetrominoType;
    score: number;
    level: number;
    lines: number;
    isGameOver: boolean;
    isPaused: boolean;
}
//# sourceMappingURL=types.d.ts.map