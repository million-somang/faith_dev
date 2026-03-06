import { TetrominoType } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
    I: 'bg-cyan-400',
    J: 'bg-blue-500',
    L: 'bg-orange-500',
    O: 'bg-yellow-400',
    S: 'bg-green-500',
    T: 'bg-purple-500',
    Z: 'bg-red-500',
};

export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

export const SCORES = {
    SINGLE_LINE: 100,
    DOUBLE_LINE: 300,
    TRIPLE_LINE: 500,
    TETRIS: 800,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

export const INITIAL_DROP_TIME = 1000;
export const MIN_DROP_TIME = 100;
export const DROP_TIME_DECREMENT = 50; // 밀리초 단위로 레벨업 시 감소하는 시간
