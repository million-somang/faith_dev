import { useState, useCallback, useEffect, useRef } from 'react';
import { Board, Piece, Position, TetrominoType } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINO_COLORS, TETROMINO_SHAPES, SCORES, INITIAL_DROP_TIME, MIN_DROP_TIME, DROP_TIME_DECREMENT } from './constants';

const createEmptyBoard = (): Board => {
    return Array.from({ length: BOARD_HEIGHT }, () =>
        Array(BOARD_WIDTH).fill(null)
    );
};

const getRandomTetrominoType = (): TetrominoType => {
    const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return types[Math.floor(Math.random() * types.length)];
};

const createPiece = (type: TetrominoType): Piece => {
    return {
        type,
        shape: TETROMINO_SHAPES[type],
        color: TETROMINO_COLORS[type],
        position: { row: 0, col: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINO_SHAPES[type][0].length / 2) }
    };
};

export const useTetris = () => {
    // 1. State 선언
    const [board, setBoard] = useState<Board>(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
    const [nextPieceType, setNextPieceType] = useState<TetrominoType>(getRandomTetrominoType());
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lines, setLines] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // 2. Ref 선언 (최상단으로 집합 배치하여 HMR 안정성 확보 및 훅 규칙 준수)
    const requestRef = useRef<number>();
    const lastUpdateTimeRef = useRef<number>(0);
    const isPausedRef = useRef(isPaused);
    const isGameOverRef = useRef(isGameOver);
    const getDropTimeRef = useRef<() => number>(() => 1000);
    const movePieceRef = useRef<(rowOffset: number, colOffset: number) => boolean | undefined>(() => false);

    // 3. Callback 선언
    const checkCollision = useCallback((piece: Piece, boardState: Board, move: Position = { row: 0, col: 0 }): boolean => {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] !== 0) {
                    const newRow = piece.position.row + r + move.row;
                    const newCol = piece.position.col + c + move.col;

                    if (
                        newRow < 0 ||
                        newRow >= BOARD_HEIGHT ||
                        newCol < 0 ||
                        newCol >= BOARD_WIDTH ||
                        (newRow >= 0 && boardState[newRow][newCol] !== null)
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }, []);

    const clearLines = useCallback((boardState: Board) => {
        let linesCleared = 0;
        const newBoard = boardState.filter(row => {
            const isLineFull = row.every(cell => cell !== null);
            if (isLineFull) {
                linesCleared++;
                return false;
            }
            return true;
        });

        while (newBoard.length < BOARD_HEIGHT) {
            newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        }

        if (linesCleared > 0) {
            setLines(prev => {
                const newLines = prev + linesCleared;
                const newLevel = Math.floor(newLines / 10) + 1;
                setLevel(newLevel);
                return newLines;
            });

            setScore(prev => {
                let addedScore = 0;
                switch (linesCleared) {
                    case 1: addedScore = SCORES.SINGLE_LINE; break;
                    case 2: addedScore = SCORES.DOUBLE_LINE; break;
                    case 3: addedScore = SCORES.TRIPLE_LINE; break;
                    case 4: addedScore = SCORES.TETRIS; break;
                }
                return prev + addedScore * level;
            });
        }

        return newBoard;
    }, [level]);

    const lockSpecificPiece = useCallback((pieceToLock: Piece) => {
        setBoard(prevBoard => {
            const newBoard = prevBoard.map(row => [...row]);
            pieceToLock.shape.forEach((row, rIdx) => {
                row.forEach((value, cIdx) => {
                    if (value !== 0) {
                        const rowPos = pieceToLock.position.row + rIdx;
                        const colPos = pieceToLock.position.col + cIdx;
                        if (rowPos >= 0 && rowPos < BOARD_HEIGHT && colPos >= 0 && colPos < BOARD_WIDTH) {
                            newBoard[rowPos][colPos] = {
                                type: pieceToLock.type,
                                color: pieceToLock.color
                            };
                        }
                    }
                });
            });

            const clearedBoard = clearLines(newBoard);

            const newPiece = createPiece(nextPieceType);
            if (checkCollision(newPiece, clearedBoard)) {
                setIsGameOver(true);
                setCurrentPiece(null);
            } else {
                setCurrentPiece(newPiece);
                setNextPieceType(getRandomTetrominoType());
            }

            return clearedBoard;
        });
    }, [nextPieceType, clearLines, checkCollision]);

    const lockPiece = useCallback(() => {
        if (!currentPiece) return;
        lockSpecificPiece(currentPiece);
    }, [currentPiece, lockSpecificPiece]);

    const movePiece = useCallback((rowOffset: number, colOffset: number) => {
        if (isGameOver || isPaused || !currentPiece) return;

        if (!checkCollision(currentPiece, board, { row: rowOffset, col: colOffset })) {
            setCurrentPiece({
                ...currentPiece,
                position: {
                    row: currentPiece.position.row + rowOffset,
                    col: currentPiece.position.col + colOffset
                }
            });
            return true;
        } else if (rowOffset > 0) {
            lockPiece();
        }
        return false;
    }, [currentPiece, board, isGameOver, isPaused, checkCollision, lockPiece]);

    const rotatePiece = useCallback(() => {
        if (isGameOver || isPaused || !currentPiece) return;

        const rotatedShape = currentPiece.shape[0].map((_, index) =>
            currentPiece.shape.map(row => row[index]).reverse()
        );

        const rotatedPiece = { ...currentPiece, shape: rotatedShape };

        // Wall kick (간단한 구현)
        if (!checkCollision(rotatedPiece, board)) {
            setCurrentPiece(rotatedPiece);
        } else if (!checkCollision(rotatedPiece, board, { row: 0, col: 1 })) {
            setCurrentPiece({ ...rotatedPiece, position: { ...rotatedPiece.position, col: rotatedPiece.position.col + 1 } });
        } else if (!checkCollision(rotatedPiece, board, { row: 0, col: -1 })) {
            setCurrentPiece({ ...rotatedPiece, position: { ...rotatedPiece.position, col: rotatedPiece.position.col - 1 } });
        }
    }, [currentPiece, board, isGameOver, isPaused, checkCollision]);

    const dropPiece = useCallback(() => {
        if (isGameOver || isPaused || !currentPiece) return;

        let dropDistance = 0;
        while (!checkCollision(currentPiece, board, { row: dropDistance + 1, col: 0 })) {
            dropDistance++;
        }

        const droppedPiece = {
            ...currentPiece,
            position: {
                ...currentPiece.position,
                row: currentPiece.position.row + dropDistance
            }
        };

        // 즉각적으로 해당 위치에 고정 처리
        lockSpecificPiece(droppedPiece);
    }, [currentPiece, board, isGameOver, isPaused, checkCollision, lockSpecificPiece]);

    const startGame = useCallback(() => {
        console.log('[useTetris] startGame called');
        setBoard(createEmptyBoard());
        setScore(0);
        setLevel(1);
        setLines(0);
        setIsGameOver(false);
        setIsPaused(false);
        setNextPieceType(getRandomTetrominoType());
        setCurrentPiece(createPiece(getRandomTetrominoType()));
    }, []);

    const togglePause = useCallback(() => {
        if (!isGameOver) {
            setIsPaused(prev => !prev);
        }
    }, [isGameOver]);

    const getDropTime = useCallback(() => {
        return Math.max(MIN_DROP_TIME, INITIAL_DROP_TIME - (level - 1) * DROP_TIME_DECREMENT);
    }, [level]);

    // 4. Ref 값 실시간 업데이트
    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => {
        isGameOverRef.current = isGameOver;
    }, [isGameOver]);

    useEffect(() => {
        getDropTimeRef.current = getDropTime;
    }, [getDropTime]);

    useEffect(() => {
        movePieceRef.current = movePiece;
    }, [movePiece]);

    // 5. Game Loop & Effect 선언
    useEffect(() => {
        console.log('[useTetris] useEffect check startGame. currentPiece:', currentPiece, 'isGameOver:', isGameOver);
        if (!currentPiece && !isGameOver) {
            startGame();
        }
    }, [currentPiece, isGameOver, startGame]);

    const gameLoop = useCallback((time: number) => {
        if (!lastUpdateTimeRef.current) lastUpdateTimeRef.current = time;
        const deltaTime = time - lastUpdateTimeRef.current;

        if (!isPausedRef.current && !isGameOverRef.current && deltaTime > getDropTimeRef.current()) {
            movePieceRef.current(1, 0);
            lastUpdateTimeRef.current = time;
        }

        requestRef.current = requestAnimationFrame(gameLoop);
    }, []); // gameLoop 재생성 완전 억제

    useEffect(() => {
        requestRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameLoop]);

    return {
        board,
        currentPiece,
        nextPieceType,
        score,
        level,
        lines,
        isGameOver,
        isPaused,
        moveLeft: () => movePiece(0, -1),
        moveRight: () => movePiece(0, 1),
        moveDown: () => {
            movePiece(1, 0);
        },
        rotatePiece,
        dropPiece,
        startGame,
        togglePause
    };
};
