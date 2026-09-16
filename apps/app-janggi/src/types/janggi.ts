export type Side = 'cho' | 'han'; // 초(楚, 선공, 에메랄드 시안) / 한(漢, 후공, 루비 코랄)

export type PieceType = 
  | 'king'      // 궁 (將/楚/漢)
  | 'chariot'   // 차 (車)
  | 'cannon'    // 포 (包)
  | 'horse'     // 마 (馬)
  | 'elephant'  // 상 (象)
  | 'guard'     // 사 (士)
  | 'soldier';  // 졸/병 (卒/兵)

export interface Piece {
  id: string;
  type: PieceType;
  side: Side;
}

export interface Position {
  x: number; // 0 to 8 (정규) or 0 to 6 (미니)
  y: number; // 0 to 9 (정규) or 0 to 6 (미니)
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isPass?: boolean;
  skillUsed?: SpecialSkill;
}

// 4대 정통 상차림 (마와 상의 배치)
export type SetupType = 
  | 'masangsangma'  // 마-상-상-마 (안상차림, 표준)
  | 'sangmamasang'  // 상-마-마-상 (바깥상차림)
  | 'wonangma'      // 마-상-마-상 (원앙마)
  | 'yanggwima';    // 상-마-상-마 (양귀마)

// 5대 게임 모드
export type GameMode = 
  | 'classic'   // 🏆 9×10 정통 장기 공식 대국 (AI 대국 / 2인 대국)
  | 'puzzle'    // 🧩 1일 1외통수 오늘의 묘수풀이
  | 'mini'      // ⚡ 7×7 미니 장기 (15초 샷클락)
  | 'battle'    // 💥 특수 스킬 배틀 장기 (기력 게이지)
  | 'saju';     // ☯️ 사주 오행 버프 장기

export type MatchType = 'vs_ai' | 'pass_and_play';

export type Difficulty = 'beginner' | 'easy' | 'normal' | 'hard' | 'master';

export type GameStatus = 
  | 'READY' 
  | 'PLAYING' 
  | 'CHECK' 
  | 'CHECKMATE' 
  | 'BIGJANG' 
  | 'DRAW' 
  | 'RESIGNED';

export type SpecialSkill = 'booster' | 'cannon_fire' | 'swap';

export interface SajuElementBuff {
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  name: string;
  icon: string;
  favoredSide: Side;
  title: string;
  desc: string;
}

export interface BoardDimensions {
  cols: number; // 9 or 7
  rows: number; // 10 or 7
}

export interface ScoreBreakdown {
  choPoints: number;
  hanPoints: number; // 72점 만점 + 덤 1.5점
  difference: number; // cho - han
  leader: Side | 'draw';
}

export interface JanggiGameScoreDetails {
  totalScore: number;
  baseScore: number;
  winBonus: number;
  materialBonus: number;
  moveBonus: number;
  handicapBonus: number;
  earnedPoints: number;
  isWin: boolean;
  isDraw: boolean;
}
