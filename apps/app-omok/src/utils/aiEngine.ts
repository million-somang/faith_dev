import { Board, Cell, Difficulty, Player, Point, WinningLine, AdvantageScore } from '../types/omok';

export const BOARD_SIZE = 15;

const DIRECTIONS: [number, number][] = [
  [0, 1],   // 가로
  [1, 0],   // 세로
  [1, 1],   // 우하향 대각선
  [-1, 1]   // 우상향 대각선
];

// 화점(Star Points) 좌표: 천원(7,7) 및 4방 화점
export const STAR_POINTS: Point[] = [
  { r: 3, c: 3 },
  { r: 3, c: 11 },
  { r: 7, c: 7 },
  { r: 11, c: 3 },
  { r: 11, c: 11 }
];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

export function isValidCoord(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

/**
 * 5목 승리 판정
 */
export function checkWin(board: Board): WinningLine | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const stone = board[r][c];
      if (!stone) continue;

      for (const [dr, dc] of DIRECTIONS) {
        let count = 1;
        const points: Point[] = [{ r, c }];

        for (let step = 1; step < 5; step++) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (isValidCoord(nr, nc) && board[nr][nc] === stone) {
            count++;
            points.push({ r: nr, c: nc });
          } else {
            break;
          }
        }

        if (count >= 5) {
          return {
            start: points[0],
            end: points[points.length - 1],
            points
          };
        }
      }
    }
  }
  return null;
}

export function isBoardFull(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}

/**
 * 후보 좌표 추출: 기존에 놓인 돌들 기준 반경 2칸 이내 빈 칸
 */
export function getCandidateMoves(board: Board): Point[] {
  const candidates = new Set<string>();
  let hasStones = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        hasStones = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (isValidCoord(nr, nc) && board[nr][nc] === null) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  if (!hasStones) {
    return [{ r: 7, c: 7 }]; // 첫 수는 정중앙 천원
  }

  return Array.from(candidates).map(coord => {
    const [r, c] = coord.split(',').map(Number);
    return { r, c };
  });
}

/**
 * 한 줄(방향) 패턴 점수 평가
 */
function evaluateDirection(
  board: Board,
  r: number,
  c: number,
  dr: number,
  dc: number,
  player: Player
): { score: number; isOpen3: boolean; isFour: boolean } {
  let consecutive = 1;
  let openEnds = 0;

  // 정방향 탐색
  let step = 1;
  while (step <= 4) {
    const nr = r + dr * step;
    const nc = c + dc * step;
    if (!isValidCoord(nr, nc)) break;
    if (board[nr][nc] === player) {
      consecutive++;
      step++;
    } else {
      if (board[nr][nc] === null) openEnds++;
      break;
    }
  }

  // 역방향 탐색
  step = 1;
  while (step <= 4) {
    const nr = r - dr * step;
    const nc = c - dc * step;
    if (!isValidCoord(nr, nc)) break;
    if (board[nr][nc] === player) {
      consecutive++;
      step++;
    } else {
      if (board[nr][nc] === null) openEnds++;
      break;
    }
  }

  let score = 0;
  let isOpen3 = false;
  let isFour = false;

  if (consecutive >= 5) {
    score = 100000;
  } else if (consecutive === 4) {
    if (openEnds === 2) {
      score = 12000; // 양쪽 열린 4
      isFour = true;
    } else if (openEnds === 1) {
      score = 2500;  // 한쪽 막힌 4
      isFour = true;
    }
  } else if (consecutive === 3) {
    if (openEnds === 2) {
      score = 1800; // 양쪽 열린 3
      isOpen3 = true;
    } else if (openEnds === 1) {
      score = 300;  // 한쪽 막힌 3
    }
  } else if (consecutive === 2) {
    if (openEnds === 2) {
      score = 150;
    } else if (openEnds === 1) {
      score = 30;
    }
  }

  return { score, isOpen3, isFour };
}

/**
 * 특정 위치에 돌을 놓았을 때의 종합 점수 계산
 */
function evaluatePoint(board: Board, r: number, c: number, player: Player): number {
  let totalScore = 0;
  let open3Count = 0;
  let fourCount = 0;

  for (const [dr, dc] of DIRECTIONS) {
    const { score, isOpen3, isFour } = evaluateDirection(board, r, c, dr, dc, player);
    totalScore += score;
    if (isOpen3) open3Count++;
    if (isFour) fourCount++;
  }

  // 양수겸장(포크 공격: 3-3, 4-3, 4-4) 보너스
  if (open3Count >= 2) totalScore += 8000;
  if (fourCount >= 1 && open3Count >= 1) totalScore += 9000;
  if (fourCount >= 2) totalScore += 15000;

  // 중앙 집중도 보너스 (중앙 7,7에 가까울수록 유리)
  const distFromCenter = Math.abs(r - 7) + Math.abs(c - 7);
  totalScore += Math.max(0, 30 - distFromCenter * 2);

  return totalScore;
}

/**
 * AI 최적 착수점 산출
 */
export function findBestMove(board: Board, aiPlayer: Player, difficulty: Difficulty): Point {
  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) return { r: 7, c: 7 };

  const humanPlayer: Player = aiPlayer === 'BLACK' ? 'WHITE' : 'BLACK';

  // 1. 초급 (Easy)
  if (difficulty === 'EASY') {
    // 30% 확률로만 최선의 수 검토, 70%는 후보군 중 상위권 랜덤
    const scoredCandidates = candidates.map(pt => {
      const aiScore = evaluatePoint(board, pt.r, pt.c, aiPlayer);
      const humScore = evaluatePoint(board, pt.r, pt.c, humanPlayer);
      return { pt, total: aiScore + humScore * 0.8 };
    });

    scoredCandidates.sort((a, b) => b.total - a.total);

    if (Math.random() < 0.35 && scoredCandidates.length > 0) {
      return scoredCandidates[0].pt;
    }
    // 상위 30% 이내에서 무작위 선택
    const topN = Math.max(1, Math.floor(scoredCandidates.length * 0.3));
    const randomIdx = Math.floor(Math.random() * topN);
    return scoredCandidates[randomIdx].pt;
  }

  // 2. 중급 (Normal)
  if (difficulty === 'NORMAL') {
    let bestScore = -Infinity;
    let bestPoint = candidates[0];

    for (const pt of candidates) {
      const attackScore = evaluatePoint(board, pt.r, pt.c, aiPlayer);
      const defenseScore = evaluatePoint(board, pt.r, pt.c, humanPlayer);

      // 내가 5목이면 즉시 승리
      if (attackScore >= 100000) return pt;
      // 상대가 5목이면 즉시 방어
      if (defenseScore >= 100000) return pt;

      const total = attackScore * 1.0 + defenseScore * 1.1 + (Math.random() * 20);
      if (total > bestScore) {
        bestScore = total;
        bestPoint = pt;
      }
    }
    return bestPoint;
  }

  // 3. 고급 (Hard - Master)
  let bestScore = -Infinity;
  let bestPoint = candidates[0];

  for (const pt of candidates) {
    const attackScore = evaluatePoint(board, pt.r, pt.c, aiPlayer);
    const defenseScore = evaluatePoint(board, pt.r, pt.c, humanPlayer);

    // 1수 필승/필패 우선순위
    if (attackScore >= 100000) return pt;
    if (defenseScore >= 100000) return pt;

    // 공격 가중치와 수비 가중치의 정밀 밸런스
    // 상대방 열린 4(12000)나 3-3(8000) 위협 시 즉각 차단
    let total = attackScore * 1.05 + defenseScore * 1.15;

    // 2-ply 간이 룩어헤드: 착수 후 상대의 응수 점수 감산
    board[pt.r][pt.c] = aiPlayer;
    let maxCounterThreat = 0;
    const counterCandidates = getCandidateMoves(board);
    for (let i = 0; i < Math.min(counterCandidates.length, 8); i++) {
      const cpt = counterCandidates[i];
      const counterScore = evaluatePoint(board, cpt.r, cpt.c, humanPlayer);
      if (counterScore > maxCounterThreat) {
        maxCounterThreat = counterScore;
      }
    }
    board[pt.r][pt.c] = null; // 원상 복구

    total -= maxCounterThreat * 0.45;

    if (total > bestScore) {
      bestScore = total;
      bestPoint = pt;
    }
  }

  return bestPoint;
}

/**
 * 실시간 형세 유리도(Advantage Meter) 계산
 */
export function calculateAdvantage(board: Board): AdvantageScore {
  let blackTotal = 0;
  let whiteTotal = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'BLACK') {
        blackTotal += evaluatePoint(board, r, c, 'BLACK');
      } else if (board[r][c] === 'WHITE') {
        whiteTotal += evaluatePoint(board, r, c, 'WHITE');
      }
    }
  }

  const sum = blackTotal + whiteTotal;
  if (sum === 0) {
    return { blackRatio: 50, whiteRatio: 50, description: '호각세 (균형)' };
  }

  const blackRatio = Math.round((blackTotal / sum) * 100);
  const whiteRatio = 100 - blackRatio;

  let description = '팽팽한 접전';
  if (blackRatio > 65) description = '흑돌 우세 (공격 주도)';
  else if (blackRatio > 55) description = '흑돌 소폭 유리';
  else if (whiteRatio > 65) description = '백돌 우세 (역습 기회)';
  else if (whiteRatio > 55) description = '백돌 소폭 유리';

  return { blackRatio, whiteRatio, description };
}
