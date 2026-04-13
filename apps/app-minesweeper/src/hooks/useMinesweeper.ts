import { useState, useRef, useCallback, useEffect } from 'react';

// ==================== 타입 정의 ====================
export type Difficulty = 'beginner' | 'intermediate' | 'expert';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
  icon: string;
}

export interface CellState {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  beginner:     { rows: 9,  cols: 9,  mines: 10,  label: '초급 (9×9)',    icon: '😊' },
  intermediate: { rows: 16, cols: 16, mines: 40,  label: '중급 (16×16)',  icon: '😐' },
  expert:       { rows: 16, cols: 30, mines: 99,  label: '고급 (30×16)',  icon: '💀' },
};

// ==================== 메인 훅 ====================
export function useMinesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [board, setBoard] = useState<CellState[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [isFirstClick, setIsFirstClick] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const config = DIFFICULTY_CONFIG[difficulty];

  // ---------- 보드 초기화 ----------
  const createEmptyBoard = useCallback((cfg: DifficultyConfig): CellState[][] => {
    return Array.from({ length: cfg.rows }, () =>
      Array.from({ length: cfg.cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );
  }, []);

  const initGame = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty;
    const cfg = DIFFICULTY_CONFIG[d];

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setDifficulty(d);
    setBoard(createEmptyBoard(cfg));
    setGameStatus('idle');
    setElapsedTime(0);
    setFlagCount(0);
    setIsFirstClick(true);
  }, [difficulty, createEmptyBoard]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 타이머 ----------
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => Math.min(prev + 1, 999));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { stopTimer(); };
  }, [stopTimer]);

  // ---------- 지뢰 배치 ----------
  const placeMines = useCallback((
    emptyBoard: CellState[][],
    excludeRow: number,
    excludeCol: number,
    cfg: DifficultyConfig
  ): CellState[][] => {
    const newBoard = emptyBoard.map(row => row.map(cell => ({ ...cell })));

    // 첫 클릭 주변 3x3 제외
    const excludeSet = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = excludeRow + dr;
        const nc = excludeCol + dc;
        if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
          excludeSet.add(`${nr},${nc}`);
        }
      }
    }

    let placed = 0;
    while (placed < cfg.mines) {
      const r = Math.floor(Math.random() * cfg.rows);
      const c = Math.floor(Math.random() * cfg.cols);
      if (!newBoard[r][c].isMine && !excludeSet.has(`${r},${c}`)) {
        newBoard[r][c].isMine = true;
        placed++;
      }
    }

    // 인접 지뢰 수 계산
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (newBoard[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && newBoard[nr][nc].isMine) {
              count++;
            }
          }
        }
        newBoard[r][c].adjacentMines = count;
      }
    }

    return newBoard;
  }, []);

  // ---------- 빈 칸 Flood Fill ----------
  const floodReveal = useCallback((
    b: CellState[][],
    row: number,
    col: number,
    cfg: DifficultyConfig
  ) => {
    const stack: [number, number][] = [[row, col]];
    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      if (r < 0 || r >= cfg.rows || c < 0 || c >= cfg.cols) continue;
      if (b[r][c].isRevealed || b[r][c].isFlagged) continue;

      b[r][c].isRevealed = true;

      if (b[r][c].adjacentMines === 0 && !b[r][c].isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            stack.push([r + dr, c + dc]);
          }
        }
      }
    }
  }, []);

  // ---------- 승리 판정 ----------
  const checkWin = useCallback((b: CellState[][], cfg: DifficultyConfig): boolean => {
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (!b[r][c].isMine && !b[r][c].isRevealed) return false;
      }
    }
    return true;
  }, []);

  // ---------- 셀 열기 (좌클릭) ----------
  const revealCell = useCallback((row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;

    setBoard(prevBoard => {
      let newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      const cfg = DIFFICULTY_CONFIG[difficulty];

      // 첫 클릭: 지뢰 배치
      if (isFirstClick) {
        newBoard = placeMines(newBoard, row, col, cfg);
        setIsFirstClick(false);
        setGameStatus('playing');
        startTimer();
      }

      const cell = newBoard[row][col];
      if (cell.isRevealed || cell.isFlagged) return prevBoard;

      // 지뢰 밟음
      if (cell.isMine) {
        // 모든 지뢰 공개
        for (let r = 0; r < cfg.rows; r++) {
          for (let c = 0; c < cfg.cols; c++) {
            if (newBoard[r][c].isMine) {
              newBoard[r][c].isRevealed = true;
            }
            // 잘못된 깃발 표시
            if (newBoard[r][c].isFlagged && !newBoard[r][c].isMine) {
              newBoard[r][c].isRevealed = true;
            }
          }
        }
        newBoard[row][col].isRevealed = true;
        setGameStatus('lost');
        stopTimer();
        return newBoard;
      }

      // 일반 셀: flood reveal
      floodReveal(newBoard, row, col, cfg);

      // 승리 체크
      if (checkWin(newBoard, cfg)) {
        setGameStatus('won');
        stopTimer();
      }

      return newBoard;
    });
  }, [gameStatus, difficulty, isFirstClick, placeMines, startTimer, stopTimer, floodReveal, checkWin]);

  // ---------- 깃발 토글 (우클릭) ----------
  const toggleFlag = useCallback((row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    if (gameStatus === 'idle') return; // 첫 클릭 전에는 깃발 X

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      const cell = newBoard[row][col];
      if (cell.isRevealed) return prevBoard;

      cell.isFlagged = !cell.isFlagged;
      setFlagCount(prev => cell.isFlagged ? prev + 1 : prev - 1);
      return newBoard;
    });
  }, [gameStatus]);

  // ---------- 코딩 (양클릭) ----------
  const chording = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing') return;

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      const cfg = DIFFICULTY_CONFIG[difficulty];
      const cell = newBoard[row][col];

      if (!cell.isRevealed || cell.adjacentMines === 0) return prevBoard;

      // 주변 깃발 수 확인
      let flaggedCount = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && newBoard[nr][nc].isFlagged) {
            flaggedCount++;
          }
        }
      }

      if (flaggedCount !== cell.adjacentMines) return prevBoard;

      // 주변 미공개 셀 열기
      let hitMine = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
            const neighbor = newBoard[nr][nc];
            if (!neighbor.isRevealed && !neighbor.isFlagged) {
              if (neighbor.isMine) {
                hitMine = true;
                // 모든 지뢰 공개
                for (let rr = 0; rr < cfg.rows; rr++) {
                  for (let cc = 0; cc < cfg.cols; cc++) {
                    if (newBoard[rr][cc].isMine) newBoard[rr][cc].isRevealed = true;
                    if (newBoard[rr][cc].isFlagged && !newBoard[rr][cc].isMine) newBoard[rr][cc].isRevealed = true;
                  }
                }
              } else {
                floodReveal(newBoard, nr, nc, cfg);
              }
            }
          }
        }
      }

      if (hitMine) {
        setGameStatus('lost');
        stopTimer();
      } else if (checkWin(newBoard, cfg)) {
        setGameStatus('won');
        stopTimer();
      }

      return newBoard;
    });
  }, [gameStatus, difficulty, floodReveal, checkWin, stopTimer]);

  // ---------- 난이도 변경 ----------
  const changeDifficulty = useCallback((d: Difficulty) => {
    initGame(d);
  }, [initGame]);

  return {
    // 상태
    board,
    difficulty,
    config,
    gameStatus,
    elapsedTime,
    flagCount,
    // 액션
    revealCell,
    toggleFlag,
    chording,
    initGame,
    changeDifficulty,
  };
}
