export interface InningRecord {
  inning: number;
  guess: string;
  strikes: number;
  balls: number;
  isOut: boolean;
  judgment: string;
}

export type GameStatus = 'READY' | 'PLAYING' | 'WON' | 'LOST';

export type SpecialBadge = 'SHUTOUT' | 'QUALITY_START' | 'REGULAR_WIN' | 'DEFEAT' | null;

export interface TeamProfile {
  teamName: string;
  wins: number;
  losses: number;
  shutouts: number;
  totalInnings: number;
  winRate: number;
}

export interface LeaderboardItem {
  rank: number;
  userId: number;
  teamName: string;
  playerName: string;
  wins: number;
  losses: number;
  shutouts: number;
  winRate: number;
  avgInnings: number;
}

export interface BaseRunners {
  first: boolean;
  second: boolean;
  third: boolean;
}

export interface PitchEffect {
  type: 'STRIKE' | 'BALL' | 'OUT' | 'HIT' | 'HOMERUN';
  message: string;
  key: number;
}
