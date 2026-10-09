// 1942 스타일 베라 플라이트 게임 엔진 타입 정의

export type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  bombs: number;
  rolls: number; // 360도 공중제비 롤 잔여 횟수
  weaponLevel: number; // 1 ~ 4
  hasEscorts: boolean; // 호위기 2기 동반 여부
  isInvincible: boolean;
  invincibleTimer: number; // 무적 잔여 프레임
  isRolling: boolean;
  rollAngle: number; // 0 ~ 360도
  rollDuration: number; // 롤 총 프레임 (90프레임 = 1.5초)
  rollProgress: number; // 0 ~ 90
  score: number;
  highScore: number;
  kills: number;
  lastShotFrame: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isPlayer: boolean;
  damage: number;
}

export type EnemyType = 'scout' | 'red-formation' | 'bomber' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  formationId?: number; // 빨간 편대 식별자
  formationIndex?: number;
  angle?: number;
  curveTimer?: number;
  lastShotFrame: number;
  shootInterval: number;
  turrets?: BossTurret[];
}

export interface BossTurret {
  id: string;
  relX: number;
  relY: number;
  hp: number;
  maxHp: number;
  lastShot: number;
}

export type ItemType = 'P' | 'L' | 'B' | 'S';

export interface Item {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  label: string;
  bounceCount: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  sizeDecay: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

export interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export interface Island {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
}

export interface GameEngineState {
  status: GameStatus;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  items: Item[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  clouds: Cloud[];
  islands: Island[];
  currentFrame: number;
  stage: number;
  bossActive: boolean;
  bossWarningTimer: number; // 보스 경보 사이렌 카운트다운
  redFormations: Map<number, { total: number; destroyed: number }>; // 편대 전멸 추적
  screenShake: number;
  canvasWidth: number;
  canvasHeight: number;
}
