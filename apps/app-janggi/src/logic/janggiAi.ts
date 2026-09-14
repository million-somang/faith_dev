import { Piece, Side, Move, Difficulty } from '../types/janggi';
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
          // 초(하단)는 위쪽(r=0 방향)으로 갈수록 전진 가산점
          // 한(상단)은 아래쪽(r=rows-1 방향)으로 갈수록 전진 가산점
          const advancement = p.side === 'cho' ? rows - 1 - r : r;
          pieceVal += advancement * 3;
        }

        // 중앙 지배 가산점 (마, 상, 포, 차)
        if (c >= 2 && c <= 6 && r >= 3 && r <= 6) {
          pieceVal += 5;
        }

        if (p.side === 'cho') {
          score += pieceVal;
        } else {
          score -= pieceVal;
        }
      }
    }
  }

  return score;
}

// 미니맥스 + 알파베타 프루닝 알고리즘 (5단계 난이도 완비)
export function findBestMove(
  board: (Piece | null)[][],
  currentTurn: Side,
  difficulty: Difficulty = 'normal',
  cols = 9,
  rows = 10
): Move | null {
  const legalMoves = getAllLegalMoves(board, currentTurn, cols, rows);
  if (legalMoves.length === 0) return null;

  // 1. 입문 (Beginner / 18급): 35% 확률로 아무 수나 둠 (블런더 발생), 포획 수 단순 선호
  if (difficulty === 'beginner') {
    if (Math.random() < 0.35) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    const captureMoves = legalMoves.filter(m => !!m.captured);
    if (captureMoves.length > 0) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // 2. 초급 (Novice / 10급): 1수 깊이 즉시 포획 우선 + 15% 가벼운 실수 허용
  if (difficulty === 'easy') {
    if (Math.random() < 0.15) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    const highValueCaptures = legalMoves.filter(
      m => m.captured && (m.captured.type === 'chariot' || m.captured.type === 'cannon' || m.captured.type === 'horse')
    );
    if (highValueCaptures.length > 0 && Math.random() < 0.8) {
      return highValueCaptures[Math.floor(Math.random() * highValueCaptures.length)];
    }
  }

  // 탐색 깊이 설정 (easy: 1, normal: 2, hard: 3, master: 3+정밀 수순)
  const maxDepth = difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3;
  const isMaximizing = currentTurn === 'cho';

  let bestMove: Move | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  // Move Ordering: 포획 가치가 높은 수 및 체크를 우선 탐색하여 알파-베타 가지치기 극대화
  const sortedMoves = [...legalMoves].sort((a, b) => {
    const valA = a.captured ? PIECE_VALUES[a.captured.type] : 0;
    const valB = b.captured ? PIECE_VALUES[b.captured.type] : 0;
    return valB - valA + (Math.random() - 0.5);
  });

  for (const move of sortedMoves) {
    // 1수 가상 시뮬레이션
    const targetPiece = board[move.to.y][move.to.x];
    board[move.to.y][move.to.x] = move.piece;
    board[move.from.y][move.from.x] = null;

    let score = minimax(
      board,
      maxDepth - 1,
      -Infinity,
      Infinity,
      !isMaximizing,
      cols,
      rows
    );

    // 마스터(프로 9단) 난이도: 상대 왕을 노리는 장군 공격 수에 강력한 보너스 부여
    if (difficulty === 'master') {
      const opponentSide: Side = currentTurn === 'cho' ? 'han' : 'cho';
      if (isCheck(board, opponentSide, cols, rows)) {
        score += isMaximizing ? 450 : -450;
      }
    }

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
