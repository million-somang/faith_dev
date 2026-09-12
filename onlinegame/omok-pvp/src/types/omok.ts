export type Player = 'BLACK' | 'WHITE';
export type Cell = Player | null;
export type Board = Cell[][];

export interface Point {
  r: number;
  c: number;
}

export interface WinningLine {
  start: Point;
  end: Point;
  points: Point[];
}

export interface OnlineRoom {
  id: string;
  title: string;
  hostName: string;
  hostRating: number;
  playerCount: number;
  isPrivate: boolean;
}

export interface PlayerProfile {
  name: string;
  rating: number;
  tier: string;
  wins: number;
  losses: number;
}
