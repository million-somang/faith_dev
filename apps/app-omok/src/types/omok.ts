export type Player = 'BLACK' | 'WHITE';
export type Cell = Player | null;
export type Board = Cell[][];
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
export type GameStatus = 'PLAYING' | 'WIN' | 'LOSS' | 'DRAW';

export interface Point {
  r: number;
  c: number;
}

export interface WinningLine {
  start: Point;
  end: Point;
  points: Point[];
}

export interface MoveRecord {
  r: number;
  c: number;
  player: Player;
  moveNumber: number;
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
}

export interface AdvantageScore {
  blackRatio: number; // 0 to 100
  whiteRatio: number; // 0 to 100
  description: string;
}

export interface GameScoreDetails {
  totalScore: number;
  baseScore: number;
  moveBonus: number;
  timeBonus: number;
  handicapBonus: number;
}

