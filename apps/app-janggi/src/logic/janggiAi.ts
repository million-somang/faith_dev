import { Piece, Side, Move } from '../types/janggi';
import { getAllLegalMoves, PIECE_VALUES, isCheck } from './janggiRules';

// 기물별 기본 가치
const PIECE_SCORE = {
  king: 10000,
  chariot: 130,
  cannon: 70,
  horse: 50,
  elephant: 30,
  guard: 30,
  soldier: 20,
};

// 보드 국면 평가 함수 (초 관점에서 점수 산출)
export function evaluateBoard(board: (Piece | null)[][], cols = 9, rows = 10): number {
  let score = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = board[r][c];
      if (p) {
        let pieceVal = PIECE_SCORE[p.type];

        // 위치 가산점 (중앙 지배 및 졸/병 전진 가산점)
        if (p.type === 'soldier') {
          // 전진할수록 가치 상승 (초는 위로, 한은 아래로 전진)
          const advance = p.side === 'cho' ? (rows - 1 - r) : r;
          pieceVal += advance * 3;
        } else if (p.type === 'horse' || p.type === 'elephant') {
          // 중앙에 가까울수록 활발한 활동력
          const distFromCenter = Math.abs(c - (cols / 2 - 0.5));
          pieceVal += (3 - distFromCenter) * 2;
        }

        if (p.side === 'cho') {
          score += pieceVal;
        } else {
          score -= pieceVal;
        }
      }
    }
  }

  // 덤 1.5점 반영 (15)
  score -= 15;

  return score;
}

// 미니맥스 + 알파베타 프루닝 알고리즘
export function findBestMove(
  board: (Piece | null)[][],
  currentTurn: Side,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
  cols = 9,
  rows = 10
): Move | null {
  const legalMoves = getAllLegalMoves(board, currentTurn, cols, rows);
  if (legalMoves.length === 0) return null;

  // 초급: 즉시 포획 우선 + 약간의 랜덤성
  if (difficulty === 'easy') {
    const captureMoves = legalMoves.filter(m => m.captured && m.captured.type !== 'soldier');
    if (captureMoves.length > 0 && Math.random() < 0.7) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // 탐색 깊이 설정 (Normal: 2, Hard: 3)
  const maxDepth = difficulty === 'hard' ? 3 : 2;
  const isMaximizing = currentTurn === 'cho';

  let bestMove: Move | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  // 착수 후보 셔플 (동점일 때 매 판 다른 수 착수)
  const shuffled = [...legalMoves].sort(() => Math.random() - 0.5);

  for (const move of shuffled) {
    // 1수 시뮬레이션
    const targetPiece = board[move.to.y][move.to.x];
    board[move.to.y][move.to.x] = move.piece;
    board[move.from.y][move.from.x] = null;

    const score = minimax(
      board,
      maxDepth - 1,
      -Infinity,
      Infinity,
      !isMaximizing,
      cols,
      rows
    );

    // 복원
    board[move.from.y][move.from.x] = move.piece;
    board[move.to.y][move.to.x] = targetPiece;

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove || legalMoves[0];
}

function minimax(
  board: (Piece | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  cols: number,
  rows: number
): number {
  if (depth === 0) {
    return evaluateBoard(board, cols, rows);
  }

  const side: Side = isMaximizing ? 'cho' : 'han';
  const moves = getAllLegalMoves(board, side, cols, rows);

  // 외통수 체크
  if (moves.length === 0) {
    if (isCheck(board, side, cols, rows)) {
      return isMaximizing ? -50000 : 50000;
    }
    return 0; // 빅장/무승부
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const targetPiece = board[move.to.y][move.to.x];
      board[move.to.y][move.to.x] = move.piece;
      board[move.from.y][move.from.x] = null;

      const evalScore = minimax(board, depth - 1, alpha, beta, false, cols, rows);

      board[move.from.y][move.from.x] = move.piece;
      board[move.to.y][move.to.x] = targetPiece;

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // 프루닝
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const targetPiece = board[move.to.y][move.to.x];
      board[move.to.y][move.to.x] = move.piece;
      board[move.from.y][move.from.x] = null;

      const evalScore = minimax(board, depth - 1, alpha, beta, true, cols, rows);

      board[move.from.y][move.from.x] = move.piece;
      board[move.to.y][move.to.x] = targetPiece;

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // 프루닝
    }
    return minEval;
  }
}
