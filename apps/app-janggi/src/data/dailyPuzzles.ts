import { Piece, Position } from '../types/janggi';

export interface JanggiPuzzle {
  id: number;
  title: string;
  desc: string;
  hint: string;
  turn: 'cho';
  maxMoves: number; // 몇 수 외통 (예: 3수, 5수)
  initialBoard: () => (Piece | null)[][];
  // 정답 수순 목록 (from -> to)
  solution: { from: Position; to: Position }[];
}

export const DAILY_PUZZLES: JanggiPuzzle[] = [
  {
    id: 1,
    title: '차(車)와 마(馬)의 협공 외통 (3수 묘수풀이)',
    desc: '한(漢)나라 궁성에 고립된 왕을 아군 차와 마의 절묘한 양수겸장으로 3수 만에 외통에 빠뜨리세요.',
    hint: '먼저 마로 멱을 뚫고 장군을 부른 뒤, 차가 궁성 중심으로 침투합니다.',
    turn: 'cho',
    maxMoves: 3,
    solution: [
      { from: { x: 3, y: 3 }, to: { x: 4, y: 1 } }, // 1수: 초 마가 궁성 중심으로 뛰어 장군!
      { from: { x: 0, y: 1 }, to: { x: 3, y: 1 } }, // 2수: 초 차가 궁성으로 질주하여 장군!
      { from: { x: 3, y: 1 }, to: { x: 4, y: 0 } }, // 3수: 차가 왕의 도주로를 차단하며 외통수!
    ],
    initialBoard: () => {
      const b: (Piece | null)[][] = Array.from({ length: 10 }, () => Array(9).fill(null));
      // 한 궁성 (위쪽)
      b[1][4] = { id: 'han_king', type: 'king', side: 'han' };
      b[0][3] = { id: 'han_guard_1', type: 'guard', side: 'han' };
      b[0][5] = { id: 'han_guard_2', type: 'guard', side: 'han' };
      // 초 공격 기물
      b[3][3] = { id: 'cho_horse', type: 'horse', side: 'cho' };
      b[0][1] = { id: 'cho_chariot', type: 'chariot', side: 'cho' };
      b[4][4] = { id: 'cho_soldier', type: 'soldier', side: 'cho' };
      // 한 수비 졸
      b[3][0] = { id: 'han_soldier', type: 'soldier', side: 'han' };
      // 초 왕 (안전 지대)
      b[8][4] = { id: 'cho_king', type: 'king', side: 'cho' };
      return b;
    }
  },
  {
    id: 2,
    title: '쌍포(雙包) 가늠쇠 포격 (3수 묘수풀이)',
    desc: '두 대의 포가 서로의 다리가 되어 적의 수비 진형을 일거에 꿰뚫는 통쾌한 포격전입니다.',
    hint: '앞 포를 이동시켜 뒷 포의 다리를 놓아주며 왕을 압박하세요.',
    turn: 'cho',
    maxMoves: 3,
    solution: [
      { from: { x: 4, y: 3 }, to: { x: 4, y: 1 } },
      { from: { x: 1, y: 1 }, to: { x: 3, y: 1 } },
      { from: { x: 3, y: 1 }, to: { x: 5, y: 1 } },
    ],
    initialBoard: () => {
      const b: (Piece | null)[][] = Array.from({ length: 10 }, () => Array(9).fill(null));
      b[0][4] = { id: 'han_king', type: 'king', side: 'han' };
      b[0][3] = { id: 'han_guard_1', type: 'guard', side: 'han' };
      b[0][5] = { id: 'han_guard_2', type: 'guard', side: 'han' };
      // 초 포 2문
      b[4][4] = { id: 'cho_cannon_1', type: 'cannon', side: 'cho' };
      b[1][1] = { id: 'cho_cannon_2', type: 'cannon', side: 'cho' };
      b[3][4] = { id: 'cho_soldier_bridge', type: 'soldier', side: 'cho' };
      // 초 왕
      b[8][4] = { id: 'cho_king', type: 'king', side: 'cho' };
      return b;
    }
  },
  {
    id: 3,
    title: '상(象)의 우람한 멱 뚫기 (5수 묘수풀이)',
    desc: '상이 적진 깊숙이 파고들어 사를 격파하고 궁성 전체를 제압하는 고난도 묘수풀이입니다.',
    hint: '상의 진로에 있는 장애물을 계산하여 대각선 2칸 전진을 성공시키세요.',
    turn: 'cho',
    maxMoves: 5,
    solution: [
      { from: { x: 2, y: 4 }, to: { x: 4, y: 1 } },
      { from: { x: 0, y: 0 }, to: { x: 3, y: 0 } },
      { from: { x: 3, y: 0 }, to: { x: 4, y: 0 } },
      { from: { x: 4, y: 1 }, to: { x: 2, y: 4 } },
      { from: { x: 4, y: 0 }, to: { x: 4, y: 1 } },
    ],
    initialBoard: () => {
      const b: (Piece | null)[][] = Array.from({ length: 10 }, () => Array(9).fill(null));
      b[1][4] = { id: 'han_king', type: 'king', side: 'han' };
      b[0][4] = { id: 'han_guard', type: 'guard', side: 'han' };
      b[2][4] = { id: 'cho_elephant', type: 'elephant', side: 'cho' };
      b[0][0] = { id: 'cho_chariot', type: 'chariot', side: 'cho' };
      b[8][4] = { id: 'cho_king', type: 'king', side: 'cho' };
      return b;
    }
  }
];

// 당일 날짜(YYYY-MM-DD)를 기반으로 오늘의 묘수풀이 문제 번호 산출 (모든 유저가 동일한 문제 풀이)
export function getDailyPuzzle(): JanggiPuzzle {
  const today = new Date();
  const dateNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = dateNum % DAILY_PUZZLES.length;
  return DAILY_PUZZLES[index];
}
