export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface ShipDefinition {
  type: ShipType;
  name: string;
  size: number;
  icon: string;
  description: string;
}

export const FLEET_DEFINITIONS: ShipDefinition[] = [
  {
    type: 'carrier',
    name: '핵추진 항공모함',
    size: 5,
    icon: 'fa-plane-departure',
    description: '전 해역을 지배하는 5칸 초대형 기함',
  },
  {
    type: 'battleship',
    name: '중장갑 전함',
    size: 4,
    icon: 'fa-ship',
    description: '강력한 화력의 4칸 주력 군함',
  },
  {
    type: 'cruiser',
    name: '유도탄 순양함',
    size: 3,
    icon: 'fa-crosshairs',
    description: '정밀 타격 능력을 갖춘 3칸 함정',
  },
  {
    type: 'submarine',
    name: '공격 잠수함',
    size: 3,
    icon: 'fa-water',
    description: '심해에서 은밀히 활동하는 3칸 잠수함',
  },
  {
    type: 'destroyer',
    name: '고속 구축함',
    size: 2,
    icon: 'fa-bolt',
    description: '기동성이 뛰어난 2칸 초계함',
  },
];

export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';

export interface GridCell {
  x: number; // 0..9 (Col 1..10)
  y: number; // 0..9 (Row A..J)
  status: CellStatus;
  shipId?: string;
  isSonarScanned?: boolean;
  hasSonarDetected?: boolean;
  isRecentTarget?: boolean;
}

export interface PlacedShip {
  id: string;
  type: ShipType;
  name: string;
  size: number;
  cells: { x: number; y: number }[];
  hits: number;
  isSunk: boolean;
  direction: 'horizontal' | 'vertical';
}

export type TurnOwner = 'player' | 'ai';
export type GamePhase = 'battle' | 'victory' | 'defeat';
export type DifficultyLevel = 'recruit' | 'captain' | 'admiral';

export interface BattleLogItem {
  id: string;
  turnNumber: number;
  attacker: TurnOwner;
  coordLabel: string; // 예: "B-7"
  x: number;
  y: number;
  isHit: boolean;
  isSunk: boolean;
  sunkShipName?: string;
  isBonusTurn: boolean;
  timestamp: string;
}

export interface SubmarineProfile {
  fleetName: string;
  rating: number;
  wins: number;
  losses: number;
  bestTurns: number;
  totalMatches: number;
  hitRate: number;
}

export interface LeaderboardEntry {
  rank: number;
  fleetName: string;
  rating: number;
  wins: number;
  losses: number;
  bestTurns: number;
  title: string;
}
