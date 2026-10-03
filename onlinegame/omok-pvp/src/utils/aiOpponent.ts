import { Board, Player, Point, WinningLine } from '../types/omok';

const BOARD_SIZE = 15;

const DIRECTIONS = [
  { dr: 0, dc: 1 },  // 가로
  { dr: 1, dc: 0 },  // 세로
  { dr: 1, dc: 1 },  // 우하향 대각선
  { dr: 1, dc: -1 }, // 좌하향 대각선
];

/**
 * 특정 착수가 승리(5목 이상)를 달성하는지 확인
 */
export function checkWin(board: Board, r: number, c: number, player: Player): WinningLine | null {
  for (const { dr, dc } of DIRECTIONS) {
    let count = 1;
    const points: Point[] = [{ r, c }];

    // 정방향 탐색
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        count++;
        points.push({ r: nr, c: nc });
        step++;
      } else {
        break;
      }
    }

    // 역방향 탐색
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        count++;
        points.push({ r: nr, c: nc });
        step++;
      } else {
        break;
      }
    }

    if (count >= 5) {
      // 시작점과 끝점 정렬
      points.sort((a, b) => (a.r === b.r ? a.c - b.c : a.r - b.r));
      return {
        start: points[0],
        end: points[points.length - 1],
        points
      };
    }
  }

  return null;
}

/**
 * 스마트 휴리스틱 오목 AI 착수 계산
 */
export function calculateAIMove(board: Board, aiPlayer: Player): Point {
  const opponent: Player = aiPlayer === 'BLACK' ? 'WHITE' : 'BLACK';

  // 1. 빈 칸 목록 수집
  const emptyPoints: Point[] = [];
  let hasAnyStone = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) {
        emptyPoints.push({ r, c });
      } else {
        hasAnyStone = true;
      }
    }
  }

  if (emptyPoints.length === 0) {
    return { r: 7, c: 7 };
  }

  // 아무 돌도 없으면 중앙 화점(7, 7) 착수
  if (!hasAnyStone) {
    return { r: 7, c: 7 };
  }

  // 2. 1순위: AI가 즉시 5목을 만들 수 있는 자리 (즉시 승리)
  for (const p of emptyPoints) {
    if (checkWin(board, p.r, p.c, aiPlayer)) {
      return p;
    }
  }

  // 3. 2순위: 상대방이 다음 턴에 5목을 만들 수 있는 자리 (즉시 방어)
  for (const p of emptyPoints) {
    if (checkWin(board, p.r, p.c, opponent)) {
      return p;
    }
  }

  // 4. 패턴 점수 기반 휴리스틱 탐색
  let bestScore = -Infinity;
  let bestMoves: Point[] = [];

  for (const p of emptyPoints) {
    // 기존 돌들과 인접(거리 2 이내)한 곳만 우선 탐색
    let isNear = false;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = p.r + dr;
        const nc = p.c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== null) {
          isNear = true;
          break;
        }
      }
      if (isNear) break;
    }
    if (!isNear) continue;

    // 공격 점수 + 수비 점수 산정
    const attackScore = evaluatePoint(board, p.r, p.c, aiPlayer);
    const defenseScore = evaluatePoint(board, p.r, p.c, opponent);
    const centerBias = 7 - Math.abs(7 - p.r) + (7 - Math.abs(7 - p.c)); // 중앙 선호

    const totalScore = attackScore * 1.2 + defenseScore * 1.0 + centerBias;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMoves = [p];
    } else if (totalScore === bestScore) {
      bestMoves.push(p);
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return emptyPoints[Math.floor(Math.random() * emptyPoints.length)];
}

function evaluatePoint(board: Board, r: number, c: number, player: Player): number {
  let score = 0;

  for (const { dr, dc } of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    // 정방향
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        count++;
        step++;
      } else if (board[nr][nc] === null) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    // 역방향
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        count++;
        step++;
      } else if (board[nr][nc] === null) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    if (count >= 5) score += 100000;
    else if (count === 4 && openEnds === 2) score += 10000;
    else if (count === 4 && openEnds === 1) score += 1500;
    else if (count === 3 && openEnds === 2) score += 1000;
    else if (count === 3 && openEnds === 1) score += 200;
    else if (count === 2 && openEnds === 2) score += 100;
    else if (count === 2 && openEnds === 1) score += 20;
  }

  return score;
}
