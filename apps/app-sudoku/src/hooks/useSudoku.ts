import { useState, useCallback, useRef, useEffect } from 'react';
import {
    generatePuzzle, isBoardComplete, isBoardCorrect, hasConflict,
    type Board, type Difficulty
} from '../logic/sudoku';

export interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    bestTime: {
        easy: number | null;
        medium: number | null;
        hard: number | null;
    };
}

export interface GameState {
    puzzle: Board;       // 초기 퍼즐 (고정 셀 판별용)
    board: Board;        // 현재 보드
    solution: Board;     // 정답
    notes: number[][][]; // 9x9 각 셀의 메모 숫자 목록
    difficulty: Difficulty;
    selectedCell: [number, number] | null;
    mistakes: number;
    isComplete: boolean;
    timer: number;       // 초
    isPaused: boolean;
    isGameOver: boolean; // 실패 (실수 3회)
    isPencilMode: boolean; // 연필(메모) 모드
    hintsRemaining: number; // 잔여 힌트 수 (3개)
}

interface HistoryEntry {
    board: Board;
    notes: number[][][];
    mistakes: number;
}

const MAX_MISTAKES = 3;
const STATS_STORAGE_KEY = 'veranex_sudoku_stats';

function loadStats(): GameStats {
    try {
        const saved = localStorage.getItem(STATS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    return {
        gamesPlayed: 0,
        gamesWon: 0,
        bestTime: { easy: null, medium: null, hard: null }
    };
}

function saveStats(stats: GameStats) {
    try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch { }
}

function createEmptyNotes(): number[][][] {
    return Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => [])
    );
}

function newGameState(difficulty: Difficulty): GameState {
    const { puzzle, solution } = generatePuzzle(difficulty);
    return {
        puzzle: puzzle.map(r => [...r]),
        board: puzzle.map(r => [...r]),
        solution,
        notes: createEmptyNotes(),
        difficulty,
        selectedCell: null,
        mistakes: 0,
        isComplete: false,
        timer: 0,
        isPaused: false,
        isGameOver: false,
        isPencilMode: false,
        hintsRemaining: 3
    };
}

export function useSudoku() {
    const [state, setState] = useState<GameState>(() => newGameState('easy'));
    const [stats, setStats] = useState<GameStats>(loadStats);
    const historyRef = useRef<HistoryEntry[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gameOverHandled = useRef<boolean>(false);

    // 타이머 처리
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

    // 게임 클리어 또는 게임오버 시 통계 갱신
    useEffect(() => {
        if (state.isComplete && !gameOverHandled.current) {
            setStats(prev => {
                const currentBest = prev.bestTime[state.difficulty];
                const newBest = currentBest === null ? state.timer : Math.min(currentBest, state.timer);
                const updated: GameStats = {
                    gamesPlayed: prev.gamesPlayed + 1,
                    gamesWon: prev.gamesWon + 1,
                    bestTime: {
                        ...prev.bestTime,
                        [state.difficulty]: newBest
                    }
                };
                saveStats(updated);
                return updated;
            });
        } else if (state.isGameOver && !gameOverHandled.current) {
            setStats(prev => {
                const updated: GameStats = {
                    ...prev,
                    gamesPlayed: prev.gamesPlayed + 1
                };
                saveStats(updated);
                return updated;
            });
        }
    }, [state.isComplete, state.isGameOver]);

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

    const togglePencilMode = useCallback(() => {
        setState(prev => ({ ...prev, isPencilMode: !prev.isPencilMode }));
    }, []);

    const inputNumber = useCallback((num: number, soundCallback?: (type: 'number' | 'note' | 'mistake' | 'victory') => void) => {
        setState(prev => {
            if (!prev.selectedCell || prev.isComplete || prev.isGameOver || prev.isPaused) return prev;
            const [row, col] = prev.selectedCell;

            // 고정 셀은 입력 불가
            if (prev.puzzle[row][col] !== null) return prev;

            // 히스토리 기록
            historyRef.current.push({
                board: prev.board.map(r => [...r]),
                notes: prev.notes.map(r => r.map(c => [...c])),
                mistakes: prev.mistakes
            });

            // 1. 연필(메모) 모드인 경우
            if (prev.isPencilMode) {
                const newNotes = prev.notes.map(r => r.map(c => [...c]));
                const cellNotes = newNotes[row][col];
                if (cellNotes.includes(num)) {
                    newNotes[row][col] = cellNotes.filter(n => n !== num);
                } else {
                    newNotes[row][col] = [...cellNotes, num].sort((a, b) => a - b);
                }
                soundCallback?.('note');
                return { ...prev, notes: newNotes };
            }

            // 2. 일반 숫자 입력 모드인 경우
            const newBoard = prev.board.map(r => [...r]);
            newBoard[row][col] = num;

            // 해당 셀에 숫자를 채웠으므로 메모는 초기화
            const newNotes = prev.notes.map(r => r.map(c => [...c]));
            newNotes[row][col] = [];

            // 동일 행/열/3x3 블록에서 해당 숫자 메모 자동 정리 (QoL 편의)
            for (let r = 0; r < 9; r++) {
                newNotes[r][col] = newNotes[r][col].filter(n => n !== num);
            }
            for (let c = 0; c < 9; c++) {
                newNotes[row][c] = newNotes[row][c].filter(n => n !== num);
            }
            const boxR = Math.floor(row / 3) * 3;
            const boxC = Math.floor(col / 3) * 3;
            for (let r = boxR; r < boxR + 3; r++) {
                for (let c = boxC; c < boxC + 3; c++) {
                    newNotes[r][c] = newNotes[r][c].filter(n => n !== num);
                }
            }

            // 정답 검증
            let mistakes = prev.mistakes;
            let isGameOver = prev.isGameOver;
            const isCorrect = num === prev.solution[row][col];

            if (!isCorrect) {
                mistakes++;
                soundCallback?.('mistake');
                if (mistakes >= MAX_MISTAKES) {
                    isGameOver = true;
                }
            } else {
                soundCallback?.('number');
            }

            const isComplete = isBoardComplete(newBoard) && isBoardCorrect(newBoard, prev.solution);
            if (isComplete) {
                soundCallback?.('victory');
            }

            return {
                ...prev,
                board: newBoard,
                notes: newNotes,
                mistakes,
                isComplete,
                isGameOver
            };
        });
    }, []);

    const eraseCell = useCallback(() => {
        setState(prev => {
            if (!prev.selectedCell || prev.isComplete || prev.isGameOver || prev.isPaused) return prev;
            const [row, col] = prev.selectedCell;
            if (prev.puzzle[row][col] !== null) return prev;

            historyRef.current.push({
                board: prev.board.map(r => [...r]),
                notes: prev.notes.map(r => r.map(c => [...c])),
                mistakes: prev.mistakes
            });

            const newBoard = prev.board.map(r => [...r]);
            newBoard[row][col] = null;
            const newNotes = prev.notes.map(r => r.map(c => [...c]));
            newNotes[row][col] = [];

            return { ...prev, board: newBoard, notes: newNotes };
        });
    }, []);

    const undo = useCallback(() => {
        if (historyRef.current.length === 0) return;
        const last = historyRef.current.pop();
        if (!last) return;

        setState(prev => ({
            ...prev,
            board: last.board,
            notes: last.notes,
            mistakes: last.mistakes
        }));
    }, []);

    const togglePause = useCallback(() => {
        setState(prev => {
            if (prev.isComplete || prev.isGameOver) return prev;
            return { ...prev, isPaused: !prev.isPaused };
        });
    }, []);

    const getHint = useCallback(() => {
        setState(prev => {
            if (prev.isComplete || prev.isGameOver || prev.isPaused || prev.hintsRemaining <= 0) return prev;

            // 선택된 셀이 있고 비어있다면 그 셀 우선 채우기, 아니면 임의 빈 셀 채우기
            let targetR = -1;
            let targetC = -1;

            if (prev.selectedCell && prev.board[prev.selectedCell[0]][prev.selectedCell[1]] === null) {
                [targetR, targetC] = prev.selectedCell;
            } else {
                const emptyCells: [number, number][] = [];
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (prev.board[r][c] === null) emptyCells.push([r, c]);
                    }
                }
                if (emptyCells.length === 0) return prev;
                const [hr, hc] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                targetR = hr;
                targetC = hc;
            }

            const correctNum = prev.solution[targetR][targetC];
            const newBoard = prev.board.map(r => [...r]);
            newBoard[targetR][targetC] = correctNum;

            const newPuzzle = prev.puzzle.map(r => [...r]);
            newPuzzle[targetR][targetC] = correctNum; // 힌트는 고정 셀 처리

            const newNotes = prev.notes.map(r => r.map(c => [...c]));
            newNotes[targetR][targetC] = [];

            const isComplete = isBoardComplete(newBoard) && isBoardCorrect(newBoard, prev.solution);

            return {
                ...prev,
                board: newBoard,
                puzzle: newPuzzle,
                notes: newNotes,
                isComplete,
                hintsRemaining: prev.hintsRemaining - 1,
                selectedCell: [targetR, targetC]
            };
        });
    }, []);

    const checkConflict = useCallback((row: number, col: number) => {
        return hasConflict(state.board, row, col);
    }, [state.board]);

    return {
        ...state,
        stats,
        canUndo: historyRef.current.length > 0,
        startGame,
        selectCell,
        togglePencilMode,
        inputNumber,
        eraseCell,
        undo,
        togglePause,
        getHint,
        checkConflict,
        gameOverHandled
    };
}
