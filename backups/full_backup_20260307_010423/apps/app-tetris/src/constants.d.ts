import { TetrominoType } from './types';
export declare const BOARD_WIDTH = 10;
export declare const BOARD_HEIGHT = 20;
export declare const TETROMINO_COLORS: Record<TetrominoType, string>;
export declare const TETROMINO_SHAPES: Record<TetrominoType, number[][]>;
export declare const SCORES: {
    SINGLE_LINE: number;
    DOUBLE_LINE: number;
    TRIPLE_LINE: number;
    TETRIS: number;
    SOFT_DROP: number;
    HARD_DROP: number;
};
export declare const INITIAL_DROP_TIME = 1000;
export declare const MIN_DROP_TIME = 100;
export declare const DROP_TIME_DECREMENT = 50;
//# sourceMappingURL=constants.d.ts.map