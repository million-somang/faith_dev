import { useState, useEffect, useCallback, useRef } from 'react';
import { Board, Difficulty, GameStatus, MoveRecord, Player, Point, WinningLine, GameStats, AdvantageScore } from '../types/omok';
import { createEmptyBoard, checkWin, isBoardFull, findBestMove, calculateAdvantage } from '../utils/aiEngine';
import { playStoneSound, playWinSound } from '../utils/soundEffects';

const STATS_STORAGE_KEY = 'veranex_omok_stats_v1';
const MUTE_STORAGE_KEY = 'veranex_omok_muted';

export function useOmokGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [humanPlayer, setHumanPlayerState] = useState<Player>('BLACK');
  const [currentTurn, setCurrentTurn] = useState<Player>('BLACK');
  const [difficulty, setDifficultyState] = useState<Difficulty>('NORMAL');
  const [status, setStatus] = useState<GameStatus>('PLAYING');
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { wins: 0, losses: 0, draws: 0, totalGames: 0 };
  });

  const aiPlayer: Player = humanPlayer === 'BLACK' ? 'WHITE' : 'BLACK';
  const timerRef = useRef<number | null>(null);

  // 타이머 작동
  useEffect(() => {
    if (status === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const updateStats = useCallback((result: 'WIN' | 'LOSS' | 'DRAW') => {
    setStats(prev => {
      const updated = {
        wins: result === 'WIN' ? prev.wins + 1 : prev.wins,
        losses: result === 'LOSS' ? prev.losses + 1 : prev.losses,
        draws: result === 'DRAW' ? prev.draws + 1 : prev.draws,
        totalGames: prev.totalGames + 1,
      };
      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(m => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resetGame = useCallback((newHumanPlayer?: Player, newDifficulty?: Difficulty) => {
    const targetHuman = newHumanPlayer ?? humanPlayer;
    if (newHumanPlayer) setHumanPlayerState(newHumanPlayer);
    if (newDifficulty) setDifficultyState(newDifficulty);

    setBoard(createEmptyBoard());
    setCurrentTurn('BLACK');
    setStatus('PLAYING');
    setWinningLine(null);
    setLastMove(null);
    setMoveHistory([]);
    setIsThinking(false);
    setTimeElapsed(0);

    // 만약 인간이 백돌(후공)이면 AI가 흑돌(선공)로 첫 수 착수
    if (targetHuman === 'WHITE') {
      setIsThinking(true);
      setTimeout(() => {
        setBoard(b => {
          const next = b.map(row => [...row]);
          next[7][7] = 'BLACK';
          return next;
        });
        setLastMove({ r: 7, c: 7 });
        setMoveHistory([{ r: 7, c: 7, player: 'BLACK', moveNumber: 1 }]);
        setCurrentTurn('WHITE');
        setIsThinking(false);
        playStoneSound(isMuted);
      }, 500);
    }
  }, [humanPlayer, isMuted]);

  // AI 턴 처리
  const triggerAiMove = useCallback((currentBoard: Board, nextMoveNumber: number) => {
    setIsThinking(true);
    // 약간의 딜레이(350ms)를 주어 자연스러운 두뇌 생각 연출
    setTimeout(() => {
      const aiMove = findBestMove(currentBoard, aiPlayer, difficulty);
      const nextBoard = currentBoard.map(row => [...row]);
      nextBoard[aiMove.r][aiMove.c] = aiPlayer;

      playStoneSound(isMuted);
      setBoard(nextBoard);
      setLastMove(aiMove);
      setMoveHistory(h => [...h, { r: aiMove.r, c: aiMove.c, player: aiPlayer, moveNumber: nextMoveNumber }]);

      // 승패 판정
      const win = checkWin(nextBoard);
      if (win) {
        setWinningLine(win);
        setStatus('LOSS');
        updateStats('LOSS');
        setIsThinking(false);
        return;
      }

      if (isBoardFull(nextBoard)) {
        setStatus('DRAW');
        updateStats('DRAW');
        setIsThinking(false);
        return;
      }

      setCurrentTurn(humanPlayer);
      setIsThinking(false);
    }, 400);
  }, [aiPlayer, difficulty, humanPlayer, isMuted, updateStats]);

  // 플레이어 착수
  const makeMove = useCallback((r: number, c: number) => {
    if (status !== 'PLAYING') return;
    if (currentTurn !== humanPlayer) return;
    if (isThinking) return;
    if (board[r][c] !== null) return;

    playStoneSound(isMuted);

    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = humanPlayer;

    const moveNum = moveHistory.length + 1;
    setBoard(nextBoard);
    setLastMove({ r, c });
    setMoveHistory(h => [...h, { r, c, player: humanPlayer, moveNumber: moveNum }]);

    // 승패 판정
    const win = checkWin(nextBoard);
    if (win) {
      setWinningLine(win);
      setStatus('WIN');
      updateStats('WIN');
      playWinSound(isMuted);
      return;
    }

    if (isBoardFull(nextBoard)) {
      setStatus('DRAW');
      updateStats('DRAW');
      return;
    }

    setCurrentTurn(aiPlayer);
    triggerAiMove(nextBoard, moveNum + 1);
  }, [aiPlayer, board, currentTurn, humanPlayer, isMuted, isThinking, moveHistory.length, status, triggerAiMove, updateStats]);

  // 한 수 무르기 (플레이어와 AI 수 둘 다 롤백)
  const undoMove = useCallback(() => {
    if (status !== 'PLAYING' || isThinking) return;
    if (moveHistory.length < 2) {
      if (moveHistory.length === 1 && moveHistory[0].player === humanPlayer) {
        // 플레이어 1수만 놓았을 때
        setBoard(createEmptyBoard());
        setMoveHistory([]);
        setLastMove(null);
        setCurrentTurn(humanPlayer);
      }
      return;
    }

    const nextHistory = moveHistory.slice(0, -2);
    const nextBoard = createEmptyBoard();
    nextHistory.forEach(m => {
      nextBoard[m.r][m.c] = m.player;
    });

    setBoard(nextBoard);
    setMoveHistory(nextHistory);
    setLastMove(nextHistory.length > 0 ? { r: nextHistory[nextHistory.length - 1].r, c: nextHistory[nextHistory.length - 1].c } : null);
    setCurrentTurn(humanPlayer);
    setWinningLine(null);
  }, [humanPlayer, isThinking, moveHistory, status]);

  const advantage: AdvantageScore = calculateAdvantage(board);

  return {
    board,
    humanPlayer,
    aiPlayer,
    currentTurn,
    difficulty,
    status,
    winningLine,
    lastMove,
    moveHistory,
    isThinking,
    timeElapsed,
    isMuted,
    stats,
    advantage,
    makeMove,
    resetGame,
    undoMove,
    setDifficulty: (diff: Difficulty) => resetGame(humanPlayer, diff),
    setHumanPlayer: (player: Player) => resetGame(player, difficulty),
    toggleMute,
  };
}
