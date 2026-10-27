// 1942 스타일 베라 플라이트 게임 엔진 타입 정의

export type GameStatus = 'ready' | 'playing' | 'hangar' | 'paused' | 'gameover' | 'victory';

export type UpgradeOptionId = 'hull' | 'repair' | 'speed' | 'firepower' | 'missile' | 'plasma' | 'tactical';

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
  hp: number; // 현재 체력 (기본 100, 0 도달 시 기체 격추)
  maxHp: number; // 최대 체력 (기본 100)
  lives: number;
  bombs: number;
  rolls: number; // 360도 공중제비 롤 잔여 횟수
  weaponLevel: number; // 1 ~ 4
  missileLevel: number; // 0 ~ 3 (자동 추적 유도 미사일 등급)
  plasmaLevel: number; // 0 ~ 3 (고화력 플라즈마 캐논 등급)
  firepowerLevel: number; // 0 ~ 5 (주포 공격력/연사 개조 등급)
  speedLevel: number; // 0 ~ 5 (엔진 속도 개조 등급)
  hullLevel: number; // 0 ~ 5 (최대 HP 장갑 개조 등급)
  upgradePoints: number; // 격추수로 획득한 가용 개조 포인트 (KP)
  stageKills: number; // 현재 스테이지에서 기록한 격추 수
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
  lastMissileFrame: number;
  lastPlasmaFrame: number;
  hitFlashTimer?: number;
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
  kind?: 'normal' | 'homing' | 'plasma';
  angle?: number;
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
  hitFlashTimer?: number;
}

export interface BossTurret {
  id: string;
  relX: number;
  relY: number;
  hp: number;
  maxHp: number;
  lastShot: number;
}

export type ItemType = 'P' | 'L' | 'B' | 'S' | 'M' | 'W';

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

export interface Explosion {
  id: number;
  x: number;
  y: number;
  type: 'enemy' | 'player' | 'boss';
  frame: number;
  totalFrames: number;
  frameDuration: number;
  frameTimer: number;
  scale: number;
  rotation: number;
}

export type DifficultyRank = 'NORMAL' | 'NORMAL+' | 'HARD' | 'EXPERT' | 'HELL';

export interface DifficultyScale {
  rank: DifficultyRank;
  rankLevel: number; // 1 ~ 5
  spawnRateMultiplier: number; // 1.0 ~ 1.75
  shootRateMultiplier: number; // 1.0 ~ 1.6
  bulletSpeedMultiplier: number; // 1.0 ~ 1.4
  enemyHpMultiplier: number; // 1.0 ~ 1.6
  color: string;
}

export interface GameEngineState {
  status: GameStatus;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  items: Item[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  clouds: Cloud[];
  islands: Island[];
  currentFrame: number;
  stage: number;
  stageClearTimer?: number; // 보스 격파 후 다음 스테이지 전환 배너 타이머
  bossActive: boolean;
  bossWarningTimer: number; // 보스 경보 사이렌 카운트다운
  nextBossScore?: number; // 다음 보스 출현 목표 점수
  bossEncounterCount: number; // 격파한 보스 횟수
  difficultyRank: DifficultyRank; // 현재 위험도 랭크
  lastAnnouncedRank?: DifficultyRank; // 최근 경고 출력된 랭크
  redFormations: Map<number, { total: number; destroyed: number }>; // 편대 전멸 추적
  screenShake: number;
  canvasWidth: number;
  canvasHeight: number;
  assetsLoaded?: boolean;
  gameSpeed: number; // 속도 배율 (0.7: 느림/초보, 1.0: 보통, 1.3: 빠름)
}

export type GameSpeedOption = 0.7 | 1.0 | 1.3;

