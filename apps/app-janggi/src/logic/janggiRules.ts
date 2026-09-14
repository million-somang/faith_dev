import { Piece, Position, Side, SetupType, Move, ScoreBreakdown } from '../types/janggi';

// 기물 공식 점수표 (사단법인 한국장기협회 공식 규정)
export const PIECE_VALUES = {
  king: 0,
  chariot: 13,
  cannon: 7,
  horse: 5,
  elephant: 3,
  guard: 3,
  soldier: 2,
};

// 정규 9×10 궁성 좌표 판별
export function isPalace(x: number, y: number, cols = 9): boolean {
  if (cols === 9) {
    // 9×10 정규 보드: 한나라(위 y: 0~2), 초나라(아래 y: 7~9)
    const inX = x >= 3 && x <= 5;
    const inHanY = y >= 0 && y <= 2; // 한나라 궁성 (상단)
    const inChoY = y >= 7 && y <= 9; // 초나라 궁성 (하단)
    return inX && (inHanY || inChoY);
  } else {
    // 7×7 미니 보드: 한나라(위 y: 0~2), 초나라(아래 y: 4~6)
    const inX = x >= 2 && x <= 4;
    const inHanY = y >= 0 && y <= 2;
    const inChoY = y >= 4 && y <= 6;
    return inX && (inHanY || inChoY);
  }
}

// 궁성 대각선 중심점
export function isPalaceCenter(x: number, y: number, cols = 9): boolean {
  if (cols === 9) {
    return (x === 4 && y === 1) || (x === 4 && y === 8);
  } else {
    return (x === 3 && y === 1) || (x === 3 && y === 5);
  }
}

// 궁성 모서리 점
export function isPalaceCorner(x: number, y: number, cols = 9): boolean {
  if (cols === 9) {
    return (
      (x === 3 && (y === 0 || y === 2 || y === 7 || y === 9)) ||
      (x === 5 && (y === 0 || y === 2 || y === 7 || y === 9))
    );
  } else {
    return (
      (x === 2 && (y === 0 || y === 2 || y === 4 || y === 6)) ||
      (x === 4 && (y === 0 || y === 2 || y === 4 || y === 6))
    );
  }
}

// 초기 보드 생성 (정규 9×10)
// 한국 정통 장기 표준: 한(漢, 컴퓨터/후공) 상단 y=0~3, 초(楚, 플레이어/선공) 하단 y=6~9
export function createClassicBoard(choSetup: SetupType = 'masangsangma', hanSetup: SetupType = 'masangsangma'): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array.from({ length: 10 }, () => Array(9).fill(null));

  // 상차림에 따른 [마, 상, 상, 마] 순서
  const getRowArrangement = (setup: SetupType, side: Side): Piece[] => {
    let order: ('horse' | 'elephant')[] = ['horse', 'elephant', 'elephant', 'horse'];
    if (setup === 'sangmamasang') {
      order = ['elephant', 'horse', 'horse', 'elephant'];
    } else if (setup === 'wonangma') {
      order = ['horse', 'elephant', 'horse', 'elephant'];
    } else if (setup === 'yanggwima') {
      order = ['elephant', 'horse', 'elephant', 'horse'];
    }

    return order.map((type, i) => ({
      id: `${side}_${type}_${i}`,
      type,
      side,
    }));
  };

  // 1. 한(漢) 기물 배치 (상단 y=0~3)
  const hanArr = getRowArrangement(hanSetup, 'han');
  board[0][0] = { id: 'han_chariot_1', type: 'chariot', side: 'han' };
  board[0][1] = hanArr[0];
  board[0][2] = hanArr[1];
  board[0][3] = { id: 'han_guard_1', type: 'guard', side: 'han' };
  board[0][5] = { id: 'han_guard_2', type: 'guard', side: 'han' };
  board[0][6] = hanArr[2];
  board[0][7] = hanArr[3];
  board[0][8] = { id: 'han_chariot_2', type: 'chariot', side: 'han' };

  board[1][4] = { id: 'han_king', type: 'king', side: 'han' };

  board[2][1] = { id: 'han_cannon_1', type: 'cannon', side: 'han' };
  board[2][7] = { id: 'han_cannon_2', type: 'cannon', side: 'han' };

  [0, 2, 4, 6, 8].forEach((x, i) => {
    board[3][x] = { id: `han_soldier_${i}`, type: 'soldier', side: 'han' };
  });

  // 2. 초(楚) 기물 배치 (하단 y=6~9)
  [0, 2, 4, 6, 8].forEach((x, i) => {
    board[6][x] = { id: `cho_soldier_${i}`, type: 'soldier', side: 'cho' };
  });

  board[7][1] = { id: 'cho_cannon_1', type: 'cannon', side: 'cho' };
  board[7][7] = { id: 'cho_cannon_2', type: 'cannon', side: 'cho' };

  board[8][4] = { id: 'cho_king', type: 'king', side: 'cho' };

  const choArr = getRowArrangement(choSetup, 'cho');
  board[9][0] = { id: 'cho_chariot_1', type: 'chariot', side: 'cho' };
  board[9][1] = choArr[0];
  board[9][2] = choArr[1];
  board[9][3] = { id: 'cho_guard_1', type: 'guard', side: 'cho' };
  board[9][5] = { id: 'cho_guard_2', type: 'guard', side: 'cho' };
  board[9][6] = choArr[2];
  board[9][7] = choArr[3];
  board[9][8] = { id: 'cho_chariot_2', type: 'chariot', side: 'cho' };

  return board;
}

// 7×7 미니 보드 생성 (한나라 상단, 초나라 하단)
export function createMiniBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array.from({ length: 7 }, () => Array(7).fill(null));

  // 한(漢) - 상단 y: 0~2
  board[0][0] = { id: 'han_chariot_1', type: 'chariot', side: 'han' };
  board[0][1] = { id: 'han_horse_1', type: 'horse', side: 'han' };
  board[0][2] = { id: 'han_guard_1', type: 'guard', side: 'han' };
  board[0][3] = { id: 'han_king', type: 'king', side: 'han' };
  board[0][4] = { id: 'han_guard_2', type: 'guard', side: 'han' };
  board[0][5] = { id: 'han_elephant_1', type: 'elephant', side: 'han' };
  board[0][6] = { id: 'han_chariot_2', type: 'chariot', side: 'han' };

  board[1][2] = { id: 'han_cannon_1', type: 'cannon', side: 'han' };
  board[1][4] = { id: 'han_cannon_2', type: 'cannon', side: 'han' };

  board[2][1] = { id: 'han_soldier_1', type: 'soldier', side: 'han' };
  board[2][3] = { id: 'han_soldier_2', type: 'soldier', side: 'han' };
  board[2][5] = { id: 'han_soldier_3', type: 'soldier', side: 'han' };

  // 초(楚) - 하단 y: 4~6
  board[4][1] = { id: 'cho_soldier_1', type: 'soldier', side: 'cho' };
  board[4][3] = { id: 'cho_soldier_2', type: 'soldier', side: 'cho' };
  board[4][5] = { id: 'cho_soldier_3', type: 'soldier', side: 'cho' };

  board[5][2] = { id: 'cho_cannon_1', type: 'cannon', side: 'cho' };
  board[5][4] = { id: 'cho_cannon_2', type: 'cannon', side: 'cho' };

  board[6][0] = { id: 'cho_chariot_1', type: 'chariot', side: 'cho' };
  board[6][1] = { id: 'cho_horse_1', type: 'horse', side: 'cho' };
  board[6][2] = { id: 'cho_guard_1', type: 'guard', side: 'cho' };
  board[6][3] = { id: 'cho_king', type: 'king', side: 'cho' };
  board[6][4] = { id: 'cho_guard_2', type: 'guard', side: 'cho' };
  board[6][5] = { id: 'cho_elephant_1', type: 'elephant', side: 'cho' };
  board[6][6] = { id: 'cho_chariot_2', type: 'chariot', side: 'cho' };

  return board;
}

// 특정 위치 기물의 이동 가능 좌표 계산 (기초 행마법)
export function getRawMoves(
  board: (Piece | null)[][],
  pos: Position,
  cols = 9,
  rows = 10,
  specialBooster = false
): Position[] {
  const piece = board[pos.y][pos.x];
  if (!piece) return [];

  const moves: Position[] = [];
  const { x, y } = pos;
  const isCho = piece.side === 'cho';

  const inBounds = (nx: number, ny: number) => nx >= 0 && nx < cols && ny >= 0 && ny < rows;

  switch (piece.type) {
    // 1. 졸/병 (Soldier): 초(하단)는 위로(y - 1), 한(상단)은 아래로(y + 1) 전진 및 좌우 1칸. 적 궁성 진입 시 대각선 전진 가능!
    case 'soldier': {
      const forwardY = isCho ? y - 1 : y + 1;
      const dirs = [
        { x: x, y: forwardY },     // 전진
        { x: x - 1, y: y },        // 좌
        { x: x + 1, y: y },        // 우
      ];

      // 궁성 대각선 전진 룰
      if (isPalace(x, y, cols)) {
        if (isPalaceCenter(x, y, cols)) {
          // 중심에서 대각선 전진
          dirs.push({ x: x - 1, y: forwardY }, { x: x + 1, y: forwardY });
        } else if (isPalaceCorner(x, y, cols)) {
          // 적 궁성 모서리에서 중심 방향 대각선 전진
          const centerPos = cols === 9 ? (isCho ? { x: 4, y: 1 } : { x: 4, y: 8 }) : (isCho ? { x: 3, y: 1 } : { x: 3, y: 5 });
          // 초나라(아래)는 적 궁성 모서리(y=2)에서 중심(y=1)으로 전진: y > centerPos.y
          // 한나라(위)는 적 궁성 모서리(y=7)에서 중심(y=8)으로 전진: y < centerPos.y
          if ((isCho && y > centerPos.y) || (!isCho && y < centerPos.y)) {
            dirs.push(centerPos);
          }
        }
      }

      dirs.forEach(d => {
        if (inBounds(d.x, d.y)) {
          const target = board[d.y][d.x];
          if (!target || target.side !== piece.side) {
            moves.push(d);
          }
        }
      });
      break;
    }

    // 2. 궁 & 사 (King & Guard): 궁성 안에서만 선을 따라 1칸 이동
    case 'king':
    case 'guard': {
      const orthogonal = [
        { x: x, y: y - 1 }, { x: x, y: y + 1 },
        { x: x - 1, y: y }, { x: x + 1, y: y },
      ];

      // 궁성 대각선 이동
      if (isPalaceCenter(x, y, cols)) {
        // 중심에서는 4개 모서리로 대각선 이동 가능
        orthogonal.push(
          { x: x - 1, y: y - 1 }, { x: x + 1, y: y - 1 },
          { x: x - 1, y: y + 1 }, { x: x + 1, y: y + 1 }
        );
      } else if (isPalaceCorner(x, y, cols)) {
        // 모서리에서는 중심점으로 대각선 이동 가능
        const centerY = cols === 9 ? (y <= 2 ? 1 : 8) : (y <= 2 ? 1 : 5);
        const centerX = cols === 9 ? 4 : 3;
        orthogonal.push({ x: centerX, y: centerY });
      }

      orthogonal.forEach(d => {
        if (inBounds(d.x, d.y) && isPalace(d.x, d.y, cols)) {
          const target = board[d.y][d.x];
          if (!target || target.side !== piece.side) {
            moves.push(d);
          }
        }
      });
      break;
    }

    // 3. 차 (Chariot): 직선 무제한. 궁성 내 대각선도 가능. (부스터 스킬 시 아군 1개 뛰어넘기 가능)
    case 'chariot': {
      const directions = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];

      directions.forEach(({ dx, dy }) => {
        let nx = x + dx;
        let ny = y + dy;
        let jumped = false;

        while (inBounds(nx, ny)) {
          const target = board[ny][nx];
          if (!target) {
            moves.push({ x: nx, y: ny });
          } else {
            if (specialBooster && !jumped && target.side === piece.side) {
              // 부스터 스킬: 아군 1개 뛰어넘기 허용
              jumped = true;
            } else {
              if (target.side !== piece.side) {
                moves.push({ x: nx, y: ny });
              }
              break;
            }
          }
          nx += dx;
          ny += dy;
        }
      });

      // 궁성 대각선 길
      if (isPalaceCorner(x, y, cols)) {
        const centerX = cols === 9 ? 4 : 3;
        const centerY = cols === 9 ? (y <= 2 ? 1 : 8) : (y <= 2 ? 1 : 5);
        const dx = centerX - x;
        const dy = centerY - y;

        // 중심점
        const target1 = board[centerY][centerX];
        if (!target1 || target1.side !== piece.side) moves.push({ x: centerX, y: centerY });

        // 반대편 모서리
        if (!target1) {
          const oppX = centerX + dx;
          const oppY = centerY + dy;
          if (inBounds(oppX, oppY) && isPalace(oppX, oppY, cols)) {
            const target2 = board[oppY][oppX];
            if (!target2 || target2.side !== piece.side) moves.push({ x: oppX, y: oppY });
          }
        }
      } else if (isPalaceCenter(x, y, cols)) {
        const diags = [
          { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
          { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        diags.forEach(({ dx, dy }) => {
          const nx = x + dx;
          const ny = y + dy;
          if (inBounds(nx, ny) && isPalace(nx, ny, cols)) {
            const target = board[ny][nx];
            if (!target || target.side !== piece.side) moves.push({ x: nx, y: ny });
          }
        });
      }
      break;
    }

    // 4. 포 (Cannon): 다른 기물 1개를 정확히 뛰어넘어 이동/포획. 포는 포를 넘을 수 없고 포를 잡을 수 없음!
    case 'cannon': {
      const directions = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];

      directions.forEach(({ dx, dy }) => {
        let nx = x + dx;
        let ny = y + dy;
        let foundBridge = false;

        while (inBounds(nx, ny)) {
          const target = board[ny][nx];
          if (!foundBridge) {
            if (target) {
              if (target.type === 'cannon') {
                // 포는 포를 다리로 삼을 수 없음
                break;
              }
              foundBridge = true;
            }
          } else {
            // 다리를 건넌 후
            if (!target) {
              moves.push({ x: nx, y: ny });
            } else {
              if (target.type !== 'cannon' && target.side !== piece.side) {
                // 포는 포를 잡을 수 없음
                moves.push({ x: nx, y: ny });
              }
              break; // 다리 건너 기물을 만나면 더 이상 진행 불가
            }
          }
          nx += dx;
          ny += dy;
        }
      });

      // 궁성 대각선 포 이동 (중심점을 다리로 건너 반대편 모서리)
      if (isPalaceCorner(x, y, cols)) {
        const centerX = cols === 9 ? 4 : 3;
        const centerY = cols === 9 ? (y <= 2 ? 1 : 8) : (y <= 2 ? 1 : 5);
        const bridge = board[centerY][centerX];

        if (bridge && bridge.type !== 'cannon') {
          const oppX = centerX + (centerX - x);
          const oppY = centerY + (centerY - y);
          if (inBounds(oppX, oppY) && isPalace(oppX, oppY, cols)) {
            const target = board[oppY][oppX];
            if (!target) {
              moves.push({ x: oppX, y: oppY });
            } else if (target.type !== 'cannon' && target.side !== piece.side) {
              moves.push({ x: oppX, y: oppY });
            }
          }
        }
      }
      break;
    }

    // 5. 마 (Horse): 직선 1칸 + 대각선 1칸. 직선 1칸(멱)이 막히면 불가.
    case 'horse': {
      const horseSteps = [
        { block: { dx: 0, dy: -1 }, target: [{ dx: -1, dy: -2 }, { dx: 1, dy: -2 }] }, // 상
        { block: { dx: 0, dy: 1 },  target: [{ dx: -1, dy: 2 }, { dx: 1, dy: 2 }] },   // 하
        { block: { dx: -1, dy: 0 }, target: [{ dx: -2, dy: -1 }, { dx: -2, dy: 1 }] }, // 좌
        { block: { dx: 1, dy: 0 },  target: [{ dx: 2, dy: -1 }, { dx: 2, dy: 1 }] },   // 우
      ];

      horseSteps.forEach(({ block, target }) => {
        const bx = x + block.dx;
        const by = y + block.dy;

        // 멱이 비어 있어야 이동 가능
        if (inBounds(bx, by) && !board[by][bx]) {
          target.forEach(t => {
            const tx = x + t.dx;
            const ty = y + t.dy;
            if (inBounds(tx, ty)) {
              const dest = board[ty][tx];
              if (!dest || dest.side !== piece.side) {
                moves.push({ x: tx, y: ty });
              }
            }
          });
        }
      });
      break;
    }

    // 6. 상 (Elephant): 직선 1칸 + 대각선 2칸 (한국 장기 고유). 멱 2곳이 모두 비어야 함!
    case 'elephant': {
      const elephantSteps = [
        // 위로 1칸 ➡️ 좌/우 대각선 2칸
        {
          b1: { dx: 0, dy: -1 },
          destinations: [
            { b2: { dx: -1, dy: -2 }, target: { dx: -2, dy: -3 } },
            { b2: { dx: 1, dy: -2 },  target: { dx: 2, dy: -3 } },
          ]
        },
        // 아래로 1칸 ➡️ 좌/우 대각선 2칸
        {
          b1: { dx: 0, dy: 1 },
          destinations: [
            { b2: { dx: -1, dy: 2 }, target: { dx: -2, dy: 3 } },
            { b2: { dx: 1, dy: 2 },  target: { dx: 2, dy: 3 } },
          ]
        },
        // 좌로 1칸 ➡️ 상/하 대각선 2칸
        {
          b1: { dx: -1, dy: 0 },
          destinations: [
            { b2: { dx: -2, dy: -1 }, target: { dx: -3, dy: -2 } },
            { b2: { dx: -2, dy: 1 },  target: { dx: -3, dy: 2 } },
          ]
        },
        // 우로 1칸 ➡️ 상/하 대각선 2칸
        {
          b1: { dx: 1, dy: 0 },
          destinations: [
            { b2: { dx: 2, dy: -1 }, target: { dx: 3, dy: -2 } },
            { b2: { dx: 2, dy: 1 },  target: { dx: 3, dy: 2 } },
          ]
        }
      ];

      elephantSteps.forEach(({ b1, destinations }) => {
        const b1x = x + b1.dx;
        const b1y = y + b1.dy;

        // 첫 번째 멱 확인
        if (inBounds(b1x, b1y) && !board[b1y][b1x]) {
          destinations.forEach(({ b2, target }) => {
            const b2x = x + b2.dx;
            const b2y = y + b2.dy;

            // 두 번째 멱 확인
            if (inBounds(b2x, b2y) && !board[b2y][b2x]) {
              const tx = x + target.dx;
              const ty = y + target.dy;
              if (inBounds(tx, ty)) {
                const dest = board[ty][tx];
                if (!dest || dest.side !== piece.side) {
                  moves.push({ x: tx, y: ty });
                }
              }
            }
          });
        }
      });
      break;
    }
  }

  return moves;
}

// 장군(Check) 여부 판별: 특정 사이드의 왕이 공격받고 있는가?
export function isCheck(board: (Piece | null)[][], side: Side, cols = 9, rows = 10): boolean {
  // 1. 왕의 위치 찾기
  let kingPos: Position | null = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.side === side) {
        kingPos = { x: c, y: r };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return false;

  // 2. 적 기물들이 왕의 위치로 이동할 수 있는지 확인
  const oppSide: Side = side === 'cho' ? 'han' : 'cho';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = board[r][c];
      if (p && p.side === oppSide) {
        const rawMoves = getRawMoves(board, { x: c, y: r }, cols, rows);
        if (rawMoves.some(m => m.x === kingPos!.x && m.y === kingPos!.y)) {
          return true;
        }
      }
    }
  }

  return false;
}

// 합법적 유효 이동(착수 후 아군 왕이 장군 상태에 빠지지 않는 수) 계산
export function getLegalMoves(
  board: (Piece | null)[][],
  pos: Position,
  cols = 9,
  rows = 10,
  specialBooster = false
): Position[] {
  const piece = board[pos.y][pos.x];
  if (!piece) return [];

  const raw = getRawMoves(board, pos, cols, rows, specialBooster);
  const legal: Position[] = [];

  raw.forEach(dest => {
    // 임시 착수
    const targetPiece = board[dest.y][dest.x];
    board[dest.y][dest.x] = piece;
    board[pos.y][pos.x] = null;

    // 아군 왕이 장군을 받는지 확인
    const inCheck = isCheck(board, piece.side, cols, rows);

    // 복원
    board[pos.y][pos.x] = piece;
    board[dest.y][dest.x] = targetPiece;

    if (!inCheck) {
      legal.push(dest);
    }
  });

  return legal;
}

export const getValidMovesForPiece = getLegalMoves;

// 해당 진영의 모든 합법적 수 목록
export function getAllLegalMoves(board: (Piece | null)[][], side: Side, cols = 9, rows = 10): Move[] {
  const allMoves: Move[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const piece = board[r][c];
      if (piece && piece.side === side) {
        const moves = getLegalMoves(board, { x: c, y: r }, cols, rows);
        moves.forEach(to => {
          allMoves.push({
            from: { x: c, y: r },
            to,
            piece,
            captured: board[to.y][to.x] || undefined
          });
        });
      }
    }
  }

  return allMoves;
}

// 빅장 (Face-to-face King) 판별: 두 궁이 같은 세로줄에서 마주보고 사이에 기물이 없는가?
export function isBigjang(board: (Piece | null)[][], cols = 9, rows = 10): boolean {
  let choKing: Position | null = null;
  let hanKing: Position | null = null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = board[r][c];
      if (p && p.type === 'king') {
        if (p.side === 'cho') choKing = { x: c, y: r };
        else hanKing = { x: c, y: r };
      }
    }
  }

  if (!choKing || !hanKing) return false;
  if (choKing.x !== hanKing.x) return false;

  const fileX = choKing.x;
  const minY = Math.min(choKing.y, hanKing.y);
  const maxY = Math.max(choKing.y, hanKing.y);

  // 두 궁 사이에 아무 기물도 없어야 빅장 성립
  for (let y = minY + 1; y < maxY; y++) {
    if (board[y][fileX]) return false;
  }

  return true;
}

// 점수제 판정 계산 (초 vs 한 + 덤 1.5점)
export function calculateJanggiScore(board: (Piece | null)[][], cols = 9, rows = 10): ScoreBreakdown {
  let choPoints = 0;
  let hanPoints = 1.5; // 한나라 덤 1.5점

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = board[r][c];
      if (p) {
        const val = PIECE_VALUES[p.type];
        if (p.side === 'cho') choPoints += val;
        else hanPoints += val;
      }
    }
  }

  const difference = Math.round((choPoints - hanPoints) * 10) / 10;
  let leader: Side | 'draw' = 'draw';
  if (difference > 0) leader = 'cho';
  else if (difference < 0) leader = 'han';

  return {
    choPoints,
    hanPoints,
    difference,
    leader,
  };
}

// 동일 국면 3회 반복(반복수) 감지용 보드 해시 생성
export function getBoardHash(board: (Piece | null)[][], turn: Side): string {
  const parts: string[] = [turn];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const p = board[r][c];
      if (p) {
        parts.push(`${r},${c}:${p.side[0]}${p.type[0]}`);
      }
    }
  }
  return parts.join('|');
}

// 양측 외통 불능(공격 기물 고착) 여부 판정
// 차, 포, 마, 상 등 핵심 공격 기물이 모두 소진되어 외통수가 물리적으로 불가능한 국면
export function hasInsufficientMaterial(board: (Piece | null)[][]): boolean {
  let hasChoAttacker = false;
  let hasHanAttacker = false;

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const p = board[r][c];
      if (p && (p.type === 'chariot' || p.type === 'cannon' || p.type === 'horse' || p.type === 'elephant')) {
        if (p.side === 'cho') hasChoAttacker = true;
        else hasHanAttacker = true;
      }
      if (hasChoAttacker && hasHanAttacker) return false;
    }
  }

  // 양측 모두 공격 기물이 없으면 판정승으로 유도
  return !hasChoAttacker && !hasHanAttacker;
}

