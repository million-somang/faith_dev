import { useState, useCallback, useRef } from 'react';

export type Grid = number[][];

interface GameState {
    grid: Grid;
    score: number;
}

interface UseGame2048Return {
    grid: Grid;
    score: number;
    best: number;
    undosLeft: number;
    hasWon: boolean;
    isGameOver: boolean;
    move: (direction: 'left' | 'right' | 'up' | 'down') => void;
    undo: () => void;
    newGame: () => void;
    dismissWin: () => void;
    dismissGameOver: () => void;
}

const MAX_UNDOS = 3;

function createEmptyGrid(): Grid {
    return Array(4).fill(null).map(() => Array(4).fill(0));
}

function addRandomTile(grid: Grid): Grid {
    const newGrid = grid.map(row => [...row]);
    const empty: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (newGrid[r][c] === 0) {
                empty.push([r, c]);
            }
        }
    }
    if (empty.length > 0) {
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
    return newGrid;
}

function canMove(grid: Grid): boolean {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) return true;
            if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
            if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
        }
    }
    return false;
}

function slideRow(row: number[]): { newRow: number[]; scoreDelta: number; moved: boolean } {
    let arr = row.filter(val => val !== 0);
    let scoreDelta = 0;

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            scoreDelta += arr[i];
            arr.splice(i + 1, 1);
        }
    }

    while (arr.length < 4) {
        arr.push(0);
    }

    const moved = JSON.stringify(row) !== JSON.stringify(arr);
    return { newRow: arr, scoreDelta, moved };
}

function rotateLeft(grid: Grid): Grid {
    const newGrid = createEmptyGrid();
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            newGrid[3 - c][r] = grid[r][c];
        }
    }
    return newGrid;
}

function rotateRight(grid: Grid): Grid {
    const newGrid = createEmptyGrid();
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            newGrid[c][3 - r] = grid[r][c];
        }
    }
    return newGrid;
}

function getMaxTile(grid: Grid): number {
    return Math.max(...grid.flat());
}

function performMove(grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { newGrid: Grid; scoreDelta: number; moved: boolean } {
    let workingGrid = grid.map(row => [...row]);
    let totalScore = 0;
    let anyMoved = false;

    if (direction === 'up') {
        workingGrid = rotateLeft(workingGrid);
    } else if (direction === 'down') {
        workingGrid = rotateLeft(workingGrid);
        workingGrid = workingGrid.map(row => [...row].reverse());
    } else if (direction === 'right') {
        workingGrid = workingGrid.map(row => [...row].reverse());
    }

    for (let r = 0; r < 4; r++) {
        const { newRow, scoreDelta, moved } = slideRow(workingGrid[r]);
        workingGrid[r] = newRow;
        totalScore += scoreDelta;
        anyMoved = anyMoved || moved;
    }

    if (direction === 'up') {
        workingGrid = rotateRight(workingGrid);
    } else if (direction === 'down') {
        workingGrid = workingGrid.map(row => [...row].reverse());
        workingGrid = rotateRight(workingGrid);
    } else if (direction === 'right') {
        workingGrid = workingGrid.map(row => [...row].reverse());
    }

    return { newGrid: workingGrid, scoreDelta: totalScore, moved: anyMoved };
}

export function useGame2048(): UseGame2048Return {
    const [grid, setGrid] = useState<Grid>(() => {
        let g = createEmptyGrid();
        g = addRandomTile(g);
        g = addRandomTile(g);
        return g;
    });
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(() => {
        return parseInt(localStorage.getItem('2048-best') || '0');
    });
    const [hasWon, setHasWon] = useState(false);
    const [winDismissed, setWinDismissed] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const undoStack = useRef<GameState[]>([]);

    const undosLeft = MAX_UNDOS - undoStack.current.length;

    const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
        setGrid(currentGrid => {
            const currentScore = score;

            // 이전 상태 저장
            if (undoStack.current.length >= MAX_UNDOS) {
                undoStack.current.shift();
            }

            const { newGrid, scoreDelta, moved } = performMove(currentGrid, direction);

            if (!moved) {
                return currentGrid;
            }

            undoStack.current.push({ grid: currentGrid, score: currentScore });
            const finalGrid = addRandomTile(newGrid);
            const newScore = currentScore + scoreDelta;
            setScore(newScore);

            const newBest = Math.max(newScore, best);
            if (newBest > best) {
                setBest(newBest);
                localStorage.setItem('2048-best', String(newBest));
            }

            // 승리 체크
            if (!hasWon && !winDismissed && getMaxTile(finalGrid) >= 2048) {
                setHasWon(true);
            }

            // 게임 오버 체크
            if (!canMove(finalGrid)) {
                setTimeout(() => setIsGameOver(true), 300);
            }

            return finalGrid;
        });
    }, [score, best, hasWon, winDismissed]);

    const undo = useCallback(() => {
        if (undoStack.current.length > 0) {
            const state = undoStack.current.pop()!;
            setGrid(state.grid);
            setScore(state.score);
        }
    }, []);

    const newGame = useCallback(() => {
        let g = createEmptyGrid();
        g = addRandomTile(g);
        g = addRandomTile(g);
        setGrid(g);
        setScore(0);
        setHasWon(false);
        setWinDismissed(false);
        setIsGameOver(false);
        undoStack.current = [];
    }, []);

    const dismissWin = useCallback(() => {
        setHasWon(false);
        setWinDismissed(true);
    }, []);

    const dismissGameOver = useCallback(() => {
        setIsGameOver(false);
    }, []);

    return {
        grid,
        score,
        best,
        undosLeft,
        hasWon,
        isGameOver,
        move,
        undo,
        newGame,
        dismissWin,
        dismissGameOver,
    };
}

export { getMaxTile };
