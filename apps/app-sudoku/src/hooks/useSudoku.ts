import { useState, useCallback, useRef, useEffect } from 'react';
import {
    generatePuzzle, isBoardComplete, isBoardCorrect, hasConflict,
    type Board, type Difficulty
} from '../logic/sudoku';

export interface GameState {
    puzzle: Board;       // 초기 퍼즐 (고정 셀 판별용)
    board: Board;        // 현재 보드
    solution: Board;     // 정답
    difficulty: Difficulty;
    selectedCell: [number, number] | null;
    mistakes: number;
    isComplete: boolean;
    timer: number;       // 초
    isPaused: boolean;
    isGameOver: boolean; // 실패 (실수 3회)
}

const MAX_MISTAKES = 3;

export function useSudoku() {
    const [state, setState] = useState<GameState>(() => newGameState('easy'));
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gameOverHandled = useRef<boolean>(false);

    function newGameState(difficulty: Difficulty): GameState {
        const { puzzle, solution } = generatePuzzle(difficulty);
        return {
            puzzle: puzzle.map(r => [...r]),
            board: puzzle.map(r => [...r]),
            solution,
            difficulty,
            selectedCell: null,
            mistakes: 0,
            isComplete: false,
            timer: 0,
            isPaused: false,
            isGameOver: false,
        };
    }

    // 타이머
    useEffect(() => {
        if (state.isComplete || state.isPaused || state.isGameOver) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setState(prev => ({ ...prev, timer: prev.timer + 1 }));
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [state.isComplete, state.isPaused, state.isGameOver]);

    const startGame = useCallback((difficulty: Difficulty) => {
        gameOverHandled.current = false;
        setState(newGameState(difficulty));
    }, []);

    const selectCell = useCallback((row: number, col: number) => {
        setState(prev => {
            if (prev.isComplete || prev.isGameOver) return prev;
            return { ...prev, selectedCell: [row, col] };
        });
    }, []);

    const inputNumber = useCallback((num: number) => {
        setState(prev => {
            if (!prev.selectedCell || prev.isComplete || prev.isGameOver) return prev;
            const [row, col] = prev.selectedCell;

            // 고정 셀은 입력 불가
            if (prev.puzzle[row][col] !== null) return prev;

            const newBoard = prev.board.map(r => [...r]);
            newBoard[row][col] = num;

            // 정답 검증
            let mistakes = prev.mistakes;
            let isGameOver = prev.isGameOver;
            if (num !== prev.solution[row][col]) {
                mistakes++;
                if (mistakes >= MAX_MISTAKES) {
                    isGameOver = true;
                }
            }

            const isComplete = isBoardComplete(newBoard) && isBoardCorrect(newBoard, prev.solution);

            return { ...prev, board: newBoard, mistakes, isComplete, isGameOver };
        });
    }, []);

    const eraseCell = useCallback(() => {
        setState(prev => {
            if (!prev.selectedCell || prev.isComplete || prev.isGameOver) return prev;
            const [row, col] = prev.selectedCell;
            if (prev.puzzle[row][col] !== null) return prev;

            const newBoard = prev.board.map(r => [...r]);
            newBoard[row][col] = null;
            return { ...prev, board: newBoard };
        });
    }, []);

    const togglePause = useCallback(() => {
        setState(prev => {
            if (prev.isComplete || prev.isGameOver) return prev;
            return { ...prev, isPaused: !prev.isPaused };
        });
    }, []);

    const getHint = useCallback(() => {
        setState(prev => {
            if (prev.isComplete || prev.isGameOver) return prev;
            // 빈 셀 중 랜덤 하나 채우기
            const emptyCells: [number, number][] = [];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (prev.board[r][c] === null) emptyCells.push([r, c]);
                }
            }
            if (emptyCells.length === 0) return prev;

            const [hr, hc] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const newBoard = prev.board.map(r => [...r]);
            newBoard[hr][hc] = prev.solution[hr][hc];

            // 힌트로 채운 셀을 puzzle에도 반영 (고정 셀 취급)
            const newPuzzle = prev.puzzle.map(r => [...r]);
            newPuzzle[hr][hc] = prev.solution[hr][hc];

            const isComplete = isBoardComplete(newBoard) && isBoardCorrect(newBoard, prev.solution);

            return { ...prev, board: newBoard, puzzle: newPuzzle, isComplete, selectedCell: [hr, hc] };
        });
    }, []);

    // 셀 충돌 여부
    const checkConflict = useCallback((row: number, col: number) => {
        return hasConflict(state.board, row, col);
    }, [state.board]);

    return {
        ...state,
        startGame,
        selectCell,
        inputNumber,
        eraseCell,
        togglePause,
        getHint,
        checkConflict,
        gameOverHandled,
    };
}
