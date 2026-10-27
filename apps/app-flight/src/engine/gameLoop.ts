import type {
  GameEngineState,
  Player,
  Enemy,
  ItemType,
  Cloud,
  Island,
  DifficultyRank,
  DifficultyScale,
  UpgradeOptionId,
  FlightSaveState,
} from './types';
import { sound } from '../utils/sound';
import { assetManager } from './assets';

export type { GameEngineState, DifficultyRank, DifficultyScale, UpgradeOptionId, FlightSaveState };


// 캔버스 크로스 브라우징 roundRect 헬퍼 (구형 브라우저 및 인앱 웹뷰 폴백)
function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export const CANVAS_WIDTH = 450;
export const CANVAS_HEIGHT = 600;

let nextEntityId = 1;

// 스테이지(1 ~ 99) 기반 실시간 위험도 랭크 및 난이도 배율 산출 순수 함수
export function getDifficultyScale(stage = 1): DifficultyScale {
  const clampedStage = Math.max(1, Math.min(99, Math.floor(stage || 1)));
  const s = clampedStage - 1;

  // 스테이지가 올라갈 때마다 물량·사격빈도·탄속·적기 HP가 완만하고 점진적으로 상승
  const spawnRateMultiplier = Number(Math.min(3.2, 0.88 + s * 0.14).toFixed(2));
  const shootRateMultiplier = Number(Math.min(2.8, 0.78 + s * 0.12).toFixed(2));
  const bulletSpeedMultiplier = Number(Math.min(2.0, 0.82 + s * 0.06).toFixed(2));
  const enemyHpMultiplier = Number((1.0 + s * 0.28 + Math.pow(s, 1.2) * 0.08).toFixed(2));

  if (clampedStage >= 19) {
    return {
      rank: 'HELL',
      rankLevel: 5,
      spawnRateMultiplier,
      shootRateMultiplier,
      bulletSpeedMultiplier,
      enemyHpMultiplier,
      color: '#DC2626',
    };
  }
  if (clampedStage >= 11) {
    return {
      rank: 'EXPERT',
      rankLevel: 4,
      spawnRateMultiplier,
      shootRateMultiplier,
      bulletSpeedMultiplier,
      enemyHpMultiplier,
      color: '#EA580C',
    };
  }
  if (clampedStage >= 6) {
    return {
      rank: 'HARD',
      rankLevel: 3,
      spawnRateMultiplier,
      shootRateMultiplier,
      bulletSpeedMultiplier,
      enemyHpMultiplier,
      color: '#D97706',
    };
  }
  if (clampedStage >= 3) {
    return {
      rank: 'NORMAL+',
      rankLevel: 2,
      spawnRateMultiplier,
      shootRateMultiplier,
      bulletSpeedMultiplier,
      enemyHpMultiplier,
      color: '#0284C7',
    };
  }
  return {
    rank: 'NORMAL',
    rankLevel: 1,
    spawnRateMultiplier,
    shootRateMultiplier,
    bulletSpeedMultiplier,
    enemyHpMultiplier,
    color: '#10B981',
  };
}


export function createInitialState(gameSpeed = 1.0): GameEngineState {
  assetManager.preloadAssets();
  let savedHighScore = 0;
  try {
    const s = localStorage.getItem('vera_flight_highscore');
    if (s) savedHighScore = parseInt(s, 10) || 0;
  } catch {
    // ignore
  }

  const clouds: Cloud[] = [];
  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: 40 + Math.random() * 60,
      speed: 0.8 + Math.random() * 1.2,
      alpha: 0.25 + Math.random() * 0.35,
    });
  }

  const islands: Island[] = [];

  const player: Player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 90,
    width: 36,
    height: 38,
    speed: 4.5,
    hp: 100,
    maxHp: 100,
    lives: 3,
    bombs: 2,
    rolls: 3,
    weaponLevel: 1,
    missileLevel: 0,
    plasmaLevel: 0,
    firepowerLevel: 0,
    speedLevel: 0,
    hullLevel: 0,
    upgradePoints: 0,
    stageKills: 0,
    hasEscorts: false,
    isInvincible: false,
    invincibleTimer: 120, // 시작 시 2초간 스폰 무적
    isRolling: false,
    rollAngle: 0,
    rollDuration: 80, // ~1.3초 360도 롤
    rollProgress: 0,
    score: 0,
    highScore: savedHighScore,
    kills: 0,
    lastShotFrame: 0,
    lastMissileFrame: 0,
    lastPlasmaFrame: 0,
  };

  return {
    status: 'ready',
    player,
    bullets: [],
    enemies: [],
    explosions: [],
    items: [],
    particles: [],
    floatingTexts: [],
    clouds,
    islands,
    currentFrame: 0,
    stage: 1,
    stageClearTimer: 0,
    bossActive: false,
    bossWarningTimer: 0,
    nextBossScore: 2200,
    bossEncounterCount: 0,
    difficultyRank: 'NORMAL',
    lastAnnouncedRank: 'NORMAL',
    redFormations: new Map(),
    screenShake: 0,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    gameSpeed: gameSpeed || 1.0,
  };
}

// 360도 공중제비 롤 회피기 발동 (Loop-the-loop)
export function triggerPlayerRoll(state: GameEngineState): boolean {
  if (state.status !== 'playing') return false;
  if (state.player.isRolling) return false;
  if (state.player.rolls <= 0) return false;

  state.player.rolls -= 1;
  state.player.isRolling = true;
  state.player.rollProgress = 0;
  state.player.isInvincible = true;
  state.player.invincibleTimer = state.player.rollDuration + 20;

  sound.playRollSound();

  state.floatingTexts.push({
    id: nextEntityId++,
    text: '360° LOOP ROLL!',
    x: state.player.x,
    y: state.player.y - 25,
    color: '#0284C7',
    alpha: 1,
    vy: -1.2,
  });

  return true;
}

// 메가 폭탄 발동 (전탄 소거 및 화면 전체 타격)
export function triggerPlayerBomb(state: GameEngineState): boolean {
  if (state.status !== 'playing') return false;
  if (state.player.bombs <= 0) return false;

  state.player.bombs -= 1;
  state.screenShake = 25;
  sound.playBombSound();

  // 적 탄환 전부 제거 및 파티클 변환
  const bulletCount = state.bullets.filter((b) => !b.isPlayer).length;
  state.bullets = state.bullets.filter((b) => b.isPlayer);

  if (bulletCount > 0) {
    state.player.score += bulletCount * 50;
  }

  // 화면 내 모든 적에게 400 데미지
  state.enemies.forEach((enemy) => {
    enemy.hp -= 400;
    createExplosion(state, enemy.x, enemy.y, 'medium', 15);
  });

  // 충격파 링 파티클
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 * i) / 30;
    const spd = 6 + Math.random() * 4;
    state.particles.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      radius: 4 + Math.random() * 4,
      color: '#F97316',
      alpha: 1,
      decay: 0.025,
      sizeDecay: 0.05,
    });
  }

  state.floatingTexts.push({
    id: nextEntityId++,
    text: 'MEGA BOMB!!',
    x: state.player.x,
    y: state.player.y - 35,
    color: '#DC2626',
    alpha: 1,
    vy: -1.5,
  });

  return true;
}

// 플레이어 사격 처리 (주포 + 자동 추적 유도 미사일 + 플라즈마 캐논 동시 발사)
export function playerShoot(state: GameEngineState) {
  if (state.status !== 'playing') return;
  if (state.player.isRolling) return; // 롤 중에는 사격 중단
  const gameSpeed = state.gameSpeed || 1.0;
  const p = state.player;
  const fpBonus = p.firepowerLevel || 0;
  const dmgMult = 1 + fpBonus * 0.16;
  const baseInterval = Math.max(5.5, 9 - fpBonus * 0.5);
  const shotInterval = Math.max(5, Math.round(baseInterval / gameSpeed));

  // 1. 보조 무기: 자동 추적 유도 미사일 (M 아이템 / 개조 장착 시 총탄과 함께 발사)
  if ((p.missileLevel || 0) > 0) {
    const mInterval = Math.max(16, Math.round((36 - p.missileLevel * 5) / gameSpeed));
    if (state.currentFrame - (p.lastMissileFrame || 0) >= mInterval) {
      p.lastMissileFrame = state.currentFrame;
      const mDmg = Math.round((20 + p.missileLevel * 6) * dmgMult);
      const offsets =
        p.missileLevel === 1
          ? [{ dx: 0, vx: 0 }]
          : p.missileLevel === 2
          ? [
              { dx: -16, vx: -1.8 },
              { dx: 16, vx: 1.8 },
            ]
          : [
              { dx: -22, vx: -2.8 },
              { dx: -10, vx: -1.1 },
              { dx: 10, vx: 1.1 },
              { dx: 22, vx: 2.8 },
            ];

      offsets.forEach(({ dx, vx }) => {
        state.bullets.push({
          id: nextEntityId++,
          x: p.x + dx,
          y: p.y - 6,
          vx,
          vy: -5.8,
          radius: 4.5,
          color: '#A855F7',
          isPlayer: true,
          damage: mDmg,
          kind: 'homing',
          angle: -Math.PI / 2,
        });
      });
    }
  }

  // 2. 보조 무기: 고화력 플라즈마 레이저 캐논 (W 아이템 / 개조 장착 시 총탄과 함께 발사)
  if ((p.plasmaLevel || 0) > 0) {
    const pInterval = Math.max(12, Math.round((24 - p.plasmaLevel * 3) / gameSpeed));
    if (state.currentFrame - (p.lastPlasmaFrame || 0) >= pInterval) {
      p.lastPlasmaFrame = state.currentFrame;
      const pDmg = Math.round((15 + p.plasmaLevel * 5) * dmgMult);
      const offsets =
        p.plasmaLevel === 1
          ? [{ dx: 0, vx: 0 }]
          : p.plasmaLevel === 2
          ? [
              { dx: -14, vx: 0 },
              { dx: 14, vx: 0 },
            ]
          : [
              { dx: -18, vx: -0.9 },
              { dx: 0, vx: 0 },
              { dx: 18, vx: 0.9 },
            ];

      offsets.forEach(({ dx, vx }) => {
        state.bullets.push({
          id: nextEntityId++,
          x: p.x + dx,
          y: p.y - 16,
          vx,
          vy: -11.5,
          radius: 4.5,
          color: '#06B6D4',
          isPlayer: true,
          damage: pDmg,
          kind: 'plasma',
        });
      });
    }
  }

  if (state.currentFrame - p.lastShotFrame < shotInterval) return; // 주포 연사 딜레이

  p.lastShotFrame = state.currentFrame;
  sound.playGunSound();

  const bulletSpeed = -9.5;

  // 3. 주무기 티어별 발사 탄환 패턴
  if (p.weaponLevel === 1) {
    state.bullets.push({
      id: nextEntityId++,
      x: p.x,
      y: p.y - 18,
      vx: 0,
      vy: bulletSpeed,
      radius: 3.5,
      color: '#FBBF24',
      isPlayer: true,
      damage: Math.round(10 * dmgMult),
      kind: 'normal',
    });
  } else if (p.weaponLevel === 2) {
    state.bullets.push(
      {
        id: nextEntityId++,
        x: p.x - 9,
        y: p.y - 16,
        vx: 0,
        vy: bulletSpeed,
        radius: 3.5,
        color: '#FBBF24',
        isPlayer: true,
        damage: Math.round(11 * dmgMult),
        kind: 'normal',
      },
      {
        id: nextEntityId++,
        x: p.x + 9,
        y: p.y - 16,
        vx: 0,
        vy: bulletSpeed,
        radius: 3.5,
        color: '#FBBF24',
        isPlayer: true,
        damage: Math.round(11 * dmgMult),
        kind: 'normal',
      }
    );
  } else if (p.weaponLevel === 3) {
    state.bullets.push(
      {
        id: nextEntityId++,
        x: p.x,
        y: p.y - 18,
        vx: 0,
        vy: bulletSpeed,
        radius: 4,
        color: '#F59E0B',
        isPlayer: true,
        damage: Math.round(12 * dmgMult),
        kind: 'normal',
      },
      {
        id: nextEntityId++,
        x: p.x - 12,
        y: p.y - 14,
        vx: -2.2,
        vy: bulletSpeed * 0.96,
        radius: 3.5,
        color: '#F59E0B',
        isPlayer: true,
        damage: Math.round(10 * dmgMult),
        kind: 'normal',
      },
      {
        id: nextEntityId++,
        x: p.x + 12,
        y: p.y - 14,
        vx: 2.2,
        vy: bulletSpeed * 0.96,
        radius: 3.5,
        color: '#F59E0B',
        isPlayer: true,
        damage: Math.round(10 * dmgMult),
        kind: 'normal',
      }
    );
  } else {
    state.bullets.push(
      {
        id: nextEntityId++,
        x: p.x - 6,
        y: p.y - 18,
        vx: -0.6,
        vy: bulletSpeed,
        radius: 4.5,
        color: '#EF4444',
        isPlayer: true,
        damage: Math.round(14 * dmgMult),
        kind: 'normal',
      },
      {
        id: nextEntityId++,
        x: p.x + 6,
        y: p.y - 18,
        vx: 0.6,
        vy: bulletSpeed,
        radius: 4.5,
        color: '#EF4444',
        isPlayer: true,
        damage: Math.round(14 * dmgMult),
        kind: 'normal',
      },
      {
        id: nextEntityId++,
        x: p.x - 16,
        y: p.y - 12,
        vx: -3.2,
        vy: bulletSpeed * 0.92,
        radius: 4,
        color: '#F97316',
        isPlayer: true,
        damage: Math.round(12 * dmgMult),
        kind: 'normal',
      },
      {
        id: nextEntityId++,
        x: p.x + 16,
        y: p.y - 12,
        vx: 3.2,
        vy: bulletSpeed * 0.92,
        radius: 4,
        color: '#F97316',
        isPlayer: true,
        damage: Math.round(12 * dmgMult),
        kind: 'normal',
      }
    );
  }

  // 호위기(옵션) 2기 발사
  if (p.hasEscorts) {
    state.bullets.push(
      {
        id: nextEntityId++,
        x: p.x - 28,
        y: p.y - 8,
        vx: 0,
        vy: bulletSpeed,
        radius: 3,
        color: '#10B981',
        isPlayer: true,
        damage: Math.round(9 * dmgMult),
        kind: 'normal',
      },
      {
        id: nextEntityId++,
        x: p.x + 28,
        y: p.y - 8,
        vx: 0,
        vy: bulletSpeed,
        radius: 3,
        color: '#10B981',
        isPlayer: true,
        damage: Math.round(9 * dmgMult),
        kind: 'normal',
      }
    );
  }
}

// 플레이어 격추 시 대폭발 애니메이션 생성
export function triggerPlayerExplosion(state: GameEngineState, x: number, y: number) {
  state.explosions.push({
    id: nextEntityId++,
    x,
    y,
    type: 'player',
    frame: 0,
    totalFrames: 6,
    frameDuration: 4,
    frameTimer: 0,
    scale: 1.5,
    rotation: 0,
  });
}

// 폭발 이펙트 생성 (파티클 + 실제 비행기 폭파 애니메이션)
export function createExplosion(
  state: GameEngineState,
  x: number,
  y: number,
  scale: 'small' | 'medium' | 'boss',
  count = 12
) {
  sound.playExplosionSound(scale);
  const colors = ['#EF4444', '#F97316', '#FBBF24', '#FEF08A', '#FFFFFF'];

  const multiplier = scale === 'boss' ? 2.5 : scale === 'medium' ? 1.6 : 1;
  const particleCount = count * multiplier;

  // 1. 파티클 불꽃 스파크 생성
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = (1.5 + Math.random() * 4) * multiplier;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      radius: (2.5 + Math.random() * 3.5) * multiplier,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.02 + Math.random() * 0.025,
      sizeDecay: 0.04,
    });
  }

  // 2. 비행기 폭파 애니메이션 시퀀스 생성
  if (scale === 'boss') {
    // 보스 전함 연속 다단 폭발 5회 시퀀스
    const offsets = [
      { dx: 0, dy: 0, delay: 0 },
      { dx: -45, dy: -25, delay: 4 },
      { dx: 45, dy: -25, delay: 8 },
      { dx: -30, dy: 30, delay: 12 },
      { dx: 30, dy: 30, delay: 16 },
    ];
    offsets.forEach(({ dx, dy, delay }) => {
      state.explosions.push({
        id: nextEntityId++,
        x: x + dx,
        y: y + dy,
        type: 'boss',
        frame: 0,
        totalFrames: 6,
        frameDuration: 4,
        frameTimer: -delay,
        scale: 1.8,
        rotation: Math.random() * Math.PI * 2,
      });
    });
  } else {
    // 일반 적기 / 중형 폭격기 폭발
    state.explosions.push({
      id: nextEntityId++,
      x,
      y,
      type: 'enemy',
      frame: 0,
      totalFrames: 6,
      frameDuration: scale === 'medium' ? 4 : 3,
      frameTimer: 0,
      scale: scale === 'medium' ? 1.5 : 1.0,
      rotation: Math.random() * Math.PI * 2,
    });
  }
}

// 아이템 스폰 (P: 주포, M: 유도탄, W: 플라즈마, L: 호위기, B: 폭탄, S: 스피드)
function spawnItem(state: GameEngineState, x: number, y: number, specificType?: ItemType) {
  let type: ItemType = specificType || 'P';
  if (!specificType) {
    const roll = Math.random();
    if (roll < 0.28) type = 'P';
    else if (roll < 0.52) type = 'M';
    else if (roll < 0.70) type = 'W';
    else if (roll < 0.82) type = 'L';
    else if (roll < 0.92) type = 'B';
    else type = 'S';
  }

  const colorMap: Record<ItemType, string> = {
    P: '#EF4444', // 주포 강화 (레드)
    M: '#9333EA', // 유도 미사일 (퍼플)
    W: '#0891B2', // 플라즈마 캐논 (시안)
    L: '#10B981', // 호위기 편대 (에메랄드)
    B: '#2563EB', // 메가 폭탄 (블루)
    S: '#F59E0B', // 엔진 스피드 (앰버)
  };

  state.items.push({
    id: nextEntityId++,
    type,
    x,
    y,
    vy: 1.2,
    width: 26,
    height: 26,
    color: colorMap[type],
    label: type,
    bounceCount: 0,
  });
}

// 빨간 편대 비행대 스폰 (1942 Signature Red Formation — 스테이지별 편대 수량 및 HP 점진 강화)
function spawnRedFormation(state: GameEngineState, diff: DifficultyScale) {
  const formationId = nextEntityId++;
  const stage = Math.max(1, Math.min(99, state.stage || 1));
  const count = Math.min(8, 5 + Math.floor((stage - 1) / 3)); // 5기 ➔ 최대 8기 편대 출격
  state.redFormations.set(formationId, { total: count, destroyed: 0 });

  const side = Math.random() > 0.5 ? 1 : -1;
  const startX = side === 1 ? -30 : CANVAS_WIDTH + 30;
  const baseHp = Math.round(36 * diff.enemyHpMultiplier);
  const speedScale = Math.min(1.5, 0.85 + (stage - 1) * 0.025);
  const vySpeed = 2.0 * speedScale;
  const shootInterval = Math.max(54, Math.round(150 / diff.shootRateMultiplier));

  for (let i = 0; i < count; i++) {
    state.enemies.push({
      id: nextEntityId++,
      type: 'red-formation',
      x: startX,
      y: -40 - i * 36,
      vx: side * (2.4 * speedScale),
      vy: vySpeed,
      width: 28,
      height: 28,
      hp: baseHp,
      maxHp: baseHp,
      scoreValue: 200 + (stage - 1) * 20,
      formationId,
      formationIndex: i,
      curveTimer: -i * 11,
      lastShotFrame: state.currentFrame + i * 10,
      shootInterval,
    });
  }
}

// 정찰기 편대 스폰 (스테이지가 올라갈수록 동시 출격 수량 1~4기 및 HP 점진 증가)
function spawnScout(state: GameEngineState, diff: DifficultyScale) {
  const stage = Math.max(1, Math.min(99, state.stage || 1));
  const waveCount =
    stage === 1
      ? Math.random() < 0.25
        ? 2
        : 1
      : stage === 2
      ? Math.random() < 0.35
        ? 2
        : 1
      : stage <= 5
      ? 2 + (Math.random() < 0.4 ? 1 : 0)
      : stage <= 9
      ? 2 + (Math.random() < 0.65 ? 1 : 0)
      : 3 + (Math.random() < 0.5 ? 1 : 0);

  const hp = Math.round(30 * diff.enemyHpMultiplier);
  const speedScale = Math.min(1.5, 0.84 + (stage - 1) * 0.025);

  for (let w = 0; w < waveCount; w++) {
    const slotWidth = (CANVAS_WIDTH - 60) / waveCount;
    const x = Math.max(
      28,
      Math.min(
        CANVAS_WIDTH - 28,
        30 + w * slotWidth + Math.random() * Math.max(20, slotWidth - 10)
      )
    );
    const shootInterval = Math.max(
      40,
      Math.round((120 + Math.floor(Math.random() * 45)) / diff.shootRateMultiplier)
    );

    state.enemies.push({
      id: nextEntityId++,
      type: 'scout',
      x,
      y: -30 - w * 22,
      vx: (Math.random() - 0.5) * (1.8 * speedScale),
      vy: (2.0 + Math.random() * 0.7) * speedScale,
      width: 26,
      height: 26,
      hp,
      maxHp: hp,
      scoreValue: 130 + (stage - 1) * 15,
      lastShotFrame: state.currentFrame + w * 8,
      shootInterval,
    });
  }
}

// 중형 폭격기 스폰 (고내구도 장갑 부여 & 스테이지 4+부터 복수 편대 점진 출격)
function spawnBomber(state: GameEngineState, diff: DifficultyScale) {
  const stage = Math.max(1, Math.min(99, state.stage || 1));
  const twinChance = stage >= 4 ? Math.min(0.5, (stage - 3) * 0.12) : 0;
  const bomberCount = Math.random() < twinChance ? 2 : 1;
  const hp = Math.round(135 * diff.enemyHpMultiplier);
  const shootInterval = Math.max(48, Math.round(125 / diff.shootRateMultiplier));
  const speedScale = Math.min(1.45, 0.85 + (stage - 1) * 0.02);

  for (let b = 0; b < bomberCount; b++) {
    const x =
      bomberCount === 2
        ? b === 0
          ? 85 + Math.random() * 75
          : CANVAS_WIDTH - 160 + Math.random() * 75
        : 55 + Math.random() * (CANVAS_WIDTH - 110);

    state.enemies.push({
      id: nextEntityId++,
      type: 'bomber',
      x,
      y: -50 - b * 32,
      vx: (Math.random() - 0.5) * 0.95 * speedScale,
      vy: 1.15 * speedScale,
      width: 48,
      height: 44,
      hp,
      maxHp: hp,
      scoreValue: 450 + (stage - 1) * 50,
      lastShotFrame: state.currentFrame + b * 14,
      shootInterval,
    });
  }
}

// 보스 출현 2초 사전 경보 시작 (2초 뒤 실제 보스 기체 스폰)
function startBossWarning(state: GameEngineState) {
  state.bossActive = true;
  state.bossWarningTimer = 120; // 60FPS 기준 2.0초간 '보스 출현' 경보 표시
  sound.playBossAlertSound();
}

// 거대 보스 전함 실제 스폰 (2초 경보 종료 시점에 호출 — 스테이지별 점진적 내구도 적용)
function spawnBoss(state: GameEngineState, diff: DifficultyScale) {
  const stage = Math.max(1, Math.min(99, state.stage || 1));
  const bossHp = Math.round((950 + (stage - 1) * 260) * diff.enemyHpMultiplier);
  const turretHp = Math.round((280 + (stage - 1) * 90) * diff.enemyHpMultiplier);
  const shootInterval = Math.max(28, Math.round(64 / diff.shootRateMultiplier));

  state.enemies.push({
    id: nextEntityId++,
    type: 'boss',
    x: CANVAS_WIDTH / 2,
    y: -60, // 화면 바로 위에서 신속하게 진입 시작
    vx: 1.15 * Math.min(1.8, 0.95 + (stage - 1) * 0.04),
    vy: 1.5, // 부드럽고 신속하게 화면에 안착
    width: 140,
    height: 100,
    hp: bossHp,
    maxHp: bossHp,
    scoreValue: 3500 + (stage - 1) * 800,
    lastShotFrame: state.currentFrame,
    shootInterval,
    turrets: [
      { id: 'left', relX: -45, relY: -15, hp: turretHp, maxHp: turretHp, lastShot: state.currentFrame },
      { id: 'right', relX: -45 + 90, relY: -15, hp: turretHp, maxHp: turretHp, lastShot: state.currentFrame },
    ],
  });
}

// 프레임 업데이트 메인 루프
export function updateGameEngine(
  state: GameEngineState,
  inputs: { left: boolean; right: boolean; up: boolean; down: boolean; shoot: boolean }
) {
  if (state.status !== 'playing') return;
  state.currentFrame++;
  const gameSpeed = state.gameSpeed || 1.0;
  const currentStage = Math.max(1, Math.min(99, state.stage || 1));
  const diff = getDifficultyScale(currentStage);
  state.difficultyRank = diff.rank;

  if (state.stageClearTimer && state.stageClearTimer > 0) {
    state.stageClearTimer--;
  }

  // 랭크 상승 감지 및 경보 알림
  if (state.lastAnnouncedRank !== diff.rank) {
    if (state.lastAnnouncedRank !== undefined && state.player.score > 0) {
      sound.playPowerUpSound();
      state.screenShake = 12;
      state.floatingTexts.push({
        id: nextEntityId++,
        text: `⚠ 위험도 상승: [${diff.rank}] ⚠`,
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2 - 70,
        color: diff.color,
        alpha: 1.4,
        vy: -0.9,
      });
    }
    state.lastAnnouncedRank = diff.rank;
  }

  if (state.screenShake > 0) {
    state.screenShake *= 0.9;
    if (state.screenShake < 0.5) state.screenShake = 0;
  }

  // 1. 배경 애니메이션 (구름 & 섬)
  state.clouds.forEach((c) => {
    c.y += c.speed * gameSpeed;
    if (c.y > CANVAS_HEIGHT + c.size) {
      c.y = -c.size;
      c.x = Math.random() * CANVAS_WIDTH;
    }
  });

  const p = state.player;

  // 2. 플레이어 이동 및 경계 체크
  let moveX = 0;
  let moveY = 0;
  if (inputs.left) moveX -= 1;
  if (inputs.right) moveX += 1;
  if (inputs.up) moveY -= 1;
  if (inputs.down) moveY += 1;

  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  p.x += moveX * p.speed * gameSpeed;
  p.y += moveY * p.speed * gameSpeed;

  // 캔버스 화면 가두기
  const halfW = p.width / 2;
  const halfH = p.height / 2;
  if (p.x < halfW + 10) p.x = halfW + 10;
  if (p.x > CANVAS_WIDTH - halfW - 10) p.x = CANVAS_WIDTH - halfW - 10;
  if (p.y < halfH + 20) p.y = halfH + 20;
  if (p.y > CANVAS_HEIGHT - halfH - 15) p.y = CANVAS_HEIGHT - halfH - 15;

  // 3. 360도 공중제비 롤링 진행
  if (p.isRolling) {
    p.rollProgress += gameSpeed;
    p.rollAngle = (p.rollProgress / p.rollDuration) * 360;

    if (p.rollProgress >= p.rollDuration) {
      p.isRolling = false;
      p.rollAngle = 0;
      p.rollProgress = 0;
    }
  }

  // 무적 타이머 감소
  if (p.invincibleTimer > 0) {
    p.invincibleTimer--;
    p.isInvincible = true;
  } else {
    p.isInvincible = p.isRolling;
  }

  // 플레이어 피격 플래시 타이머 감소
  if (p.hitFlashTimer && p.hitFlashTimer > 0) {
    p.hitFlashTimer--;
  }

  // 4. 플레이어 자동 사격
  if (inputs.shoot) {
    playerShoot(state);
  }

  // 5. 적기 생성 스폰 로직 (스테이지 1~99 난이도 배율 & gameSpeed 반영)
  const nextBossScore = state.nextBossScore || 2800;
  if (!state.bossActive && state.player.score >= nextBossScore) {
    // 보스 점수 도달 시 일반 적기 추가 스폰을 중단하고 화면이 비면 2초 보스 출현 경보 시작
    if (state.enemies.length === 0) {
      startBossWarning(state);
    }
  } else if (!state.bossActive && (!state.stageClearTimer || state.stageClearTimer <= 0)) {
    // 스테이지가 올라갈수록 스폰 주기가 점진적으로 단축되어 적기 편대가 출격
    const scoutInterval = Math.max(24, Math.round((86 / gameSpeed) / diff.spawnRateMultiplier));
    const redInterval = Math.max(70, Math.round((230 / gameSpeed) / diff.spawnRateMultiplier));
    const bomberInterval = Math.max(95, Math.round((310 / gameSpeed) / diff.spawnRateMultiplier));

    if (state.currentFrame % scoutInterval === 0) {
      spawnScout(state, diff);
    }
    if (state.currentFrame % redInterval === 0) {
      spawnRedFormation(state, diff);
    }
    if (state.currentFrame % bomberInterval === 0) {
      spawnBomber(state, diff);
    }
  }

  if (state.bossWarningTimer > 0) {
    state.bossWarningTimer--;
    // 2초(120프레임) '보스 출현' 경고가 끝나는 즉시 실제 보스 전함 등장
    if (state.bossWarningTimer === 0 && state.bossActive) {
      spawnBoss(state, diff);
    }
  }

  // 6. 탄환 업데이트 (유도 미사일 자동 추적 + gameSpeed 배율 일관 적용)
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    const bSpeed = b.isPlayer ? Math.max(0.8, gameSpeed) : gameSpeed;

    // 유도 미사일(homing) 가장 가까운 적기 자동 추적 조향
    if (b.isPlayer && b.kind === 'homing' && state.enemies.length > 0) {
      let nearestEnemy: Enemy | null = null;
      let minDist = Infinity;
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && enemy.y > -20) {
          const d = Math.hypot(enemy.x - b.x, enemy.y - b.y);
          if (d < minDist) {
            minDist = d;
            nearestEnemy = enemy;
          }
        }
      }
      if (nearestEnemy) {
        const targetAngle = Math.atan2(nearestEnemy.y - b.y, nearestEnemy.x - b.x);
        const speedMag = 7.2;
        const desiredVx = Math.cos(targetAngle) * speedMag;
        const desiredVy = Math.sin(targetAngle) * speedMag;
        b.vx = b.vx * 0.84 + desiredVx * 0.16;
        b.vy = b.vy * 0.84 + desiredVy * 0.16;
        b.angle = Math.atan2(b.vy, b.vx);
      }

      // 유도탄 꼬리 연기 파티클
      if (state.currentFrame % 2 === 0) {
        state.particles.push({
          x: b.x,
          y: b.y + 4,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 1.2,
          radius: 2.2,
          color: '#E9D5FF',
          alpha: 0.65,
          decay: 0.06,
          sizeDecay: 0.08,
        });
      }
    }

    b.x += b.vx * bSpeed;
    b.y += b.vy * bSpeed;

    // 화면 밖 제거
    if (b.y < -40 || b.y > CANVAS_HEIGHT + 40 || b.x < -40 || b.x > CANVAS_WIDTH + 40) {
      state.bullets.splice(i, 1);
      continue;
    }

    // 플레이어 피격 판정 (적 탄환 vs 플레이어 HP 차감)
    if (!b.isPlayer && !p.isInvincible) {
      const dist = Math.hypot(b.x - p.x, b.y - p.y);
      if (dist < b.radius + 9) {
        const dmg = b.damage > 1 ? b.damage : 14;
        state.bullets.splice(i, 1);
        handlePlayerHit(state, dmg);
        continue;
      }
    }
  }

  // 7. 적기 업데이트 (스테이지별 정조준 저격탄 & 다연장 탄막 단계적 강화)
  const stageDmgBonus = Math.min(18, Math.floor((currentStage - 1) * 1.2));

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];

    if (e.hitFlashTimer && e.hitFlashTimer > 0) {
      e.hitFlashTimer--;
    }

    // 이동 패턴 및 난이도별 발사 쿨다운
    const effectiveShootInterval = Math.max(
      22,
      Math.round(e.shootInterval / (gameSpeed * diff.shootRateMultiplier))
    );

    if (e.type === 'scout') {
      e.x += e.vx * gameSpeed;
      e.y += e.vy * gameSpeed;
      if (e.x < 20 || e.x > CANVAS_WIDTH - 20) e.vx = -e.vx;

      // 플레이어 현재 좌표 정조준 사격 (스테이지 5+부터 2~3방향 압박 사격)
      if (state.currentFrame - e.lastShotFrame > effectiveShootInterval && e.y > 20 && e.y < CANVAS_HEIGHT - 110) {
        e.lastShotFrame = state.currentFrame;
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const bulletSpeed = 3.1 * diff.bulletSpeedMultiplier;
        state.bullets.push({
          id: nextEntityId++,
          x: e.x,
          y: e.y + 12,
          vx: Math.cos(angle) * bulletSpeed,
          vy: Math.sin(angle) * bulletSpeed,
          radius: 4,
          color: '#DC2626',
          isPlayer: false,
          damage: 14 + stageDmgBonus,
        });

        if (currentStage >= 5) {
          const spreadOffsets = currentStage >= 10 ? [-0.18, 0.18] : [0.16];
          for (const offset of spreadOffsets) {
            const spreadAngle = angle + offset;
            state.bullets.push({
              id: nextEntityId++,
              x: e.x,
              y: e.y + 12,
              vx: Math.cos(spreadAngle) * bulletSpeed * 0.94,
              vy: Math.sin(spreadAngle) * bulletSpeed * 0.94,
              radius: 3.5,
              color: '#EA580C',
              isPlayer: false,
              damage: 13 + stageDmgBonus,
            });
          }
        }
      }
    } else if (e.type === 'red-formation') {
      e.curveTimer = (e.curveTimer || 0) + gameSpeed;
      if (e.curveTimer > 0) {
        // S자 선회 루프
        e.x += Math.sin(e.curveTimer * 0.05) * 2.9 * gameSpeed;
        e.y += e.vy * gameSpeed;
      } else {
        e.y += e.vy * gameSpeed;
      }

      // 붉은 정예 편대기도 선회 중 플레이어 좌표를 겨냥해 견제 사격
      if (
        state.currentFrame - e.lastShotFrame > effectiveShootInterval &&
        e.y > 35 &&
        e.y < CANVAS_HEIGHT - 140
      ) {
        e.lastShotFrame = state.currentFrame;
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const rSpeed = 3.0 * diff.bulletSpeedMultiplier;
        state.bullets.push({
          id: nextEntityId++,
          x: e.x,
          y: e.y + 10,
          vx: Math.cos(angle) * rSpeed,
          vy: Math.sin(angle) * rSpeed,
          radius: 3.8,
          color: '#F43F5E',
          isPlayer: false,
          damage: 13 + stageDmgBonus,
        });
      }
    } else if (e.type === 'bomber') {
      e.x += e.vx * gameSpeed;
      e.y += e.vy * gameSpeed;
      if (e.x < 40 || e.x > CANVAS_WIDTH - 40) e.vx = -e.vx;

      // 부채꼴 확산 탄환 + 플레이어 위치 정조준 탄환 동시 발사
      if (state.currentFrame - e.lastShotFrame > effectiveShootInterval && e.y > 35 && e.y < CANVAS_HEIGHT - 120) {
        e.lastShotFrame = state.currentFrame;
        const bSpeed = 2.9 * diff.bulletSpeedMultiplier;
        const angles =
          currentStage >= 10
            ? [-0.52, -0.26, 0, 0.26, 0.52]
            : currentStage >= 6
            ? [-0.45, -0.16, 0.16, 0.45]
            : currentStage >= 3
            ? [-0.36, 0, 0.36]
            : [-0.24, 0.24];

        for (const a of angles) {
          state.bullets.push({
            id: nextEntityId++,
            x: e.x,
            y: e.y + 20,
            vx: Math.sin(a) * bSpeed,
            vy: Math.cos(a) * bSpeed,
            radius: 4.5,
            color: '#EA580C',
            isPlayer: false,
            damage: 16 + stageDmgBonus,
          });
        }

        // 플레이어 현재 좌표 정조준 저격탄 추가
        const aimedAngle = Math.atan2(p.y - (e.y + 20), p.x - e.x);
        state.bullets.push({
          id: nextEntityId++,
          x: e.x,
          y: e.y + 20,
          vx: Math.cos(aimedAngle) * (bSpeed * 1.05),
          vy: Math.sin(aimedAngle) * (bSpeed * 1.05),
          radius: 4.5,
          color: '#DC2626',
          isPlayer: false,
          damage: 16 + stageDmgBonus,
        });
      }
    } else if (e.type === 'boss') {
      // 보스 진입 및 좌우 순항
      if (e.y < 90) {
        e.y += e.vy * gameSpeed;
      } else {
        e.x += e.vx * gameSpeed;
        if (e.x < 110 || e.x > CANVAS_WIDTH - 110) e.vx = -e.vx;
      }

      // 보스 주포 사격 (광역 확산탄 + 플레이어 정조준 중포탄)
      if (state.currentFrame - e.lastShotFrame > effectiveShootInterval && e.y >= 85) {
        e.lastShotFrame = state.currentFrame;
        const bossBulletSpeed = 3.15 * diff.bulletSpeedMultiplier;
        const bossAngles =
          currentStage >= 7
            ? [-0.66, -0.44, -0.22, 0, 0.22, 0.44, 0.66]
            : currentStage >= 3
            ? [-0.52, -0.26, 0, 0.26, 0.52]
            : [-0.36, 0, 0.36];

        for (const a of bossAngles) {
          state.bullets.push({
            id: nextEntityId++,
            x: e.x,
            y: e.y + 40,
            vx: Math.sin(a) * bossBulletSpeed,
            vy: Math.cos(a) * bossBulletSpeed,
            radius: 5,
            color: '#B91C1C',
            isPlayer: false,
            damage: 20 + stageDmgBonus,
          });
        }

        // 플레이어 직격 조준 포탄 (제자리 정지 시 집중 타격)
        const targetAngle = Math.atan2(p.y - (e.y + 40), p.x - e.x);
        state.bullets.push({
          id: nextEntityId++,
          x: e.x,
          y: e.y + 40,
          vx: Math.cos(targetAngle) * (bossBulletSpeed * 1.08),
          vy: Math.sin(targetAngle) * (bossBulletSpeed * 1.08),
          radius: 5.5,
          color: '#EF4444',
          isPlayer: false,
          damage: 22 + stageDmgBonus,
        });
      }

      // 보스 포탑 독립 사격 (화면 안착 후 사격)
      if (e.turrets && e.y >= 50) {
        const turretInterval = Math.max(28, Math.round((78 / gameSpeed) / diff.shootRateMultiplier));
        const turretBulletSpeed = 3.25 * diff.bulletSpeedMultiplier;
        e.turrets.forEach((turret) => {
          if (turret.hp > 0 && state.currentFrame - turret.lastShot > turretInterval) {
            turret.lastShot = state.currentFrame;
            const tX = e.x + turret.relX;
            const tY = e.y + turret.relY;
            const angle = Math.atan2(p.y - tY, p.x - tX);
            state.bullets.push({
              id: nextEntityId++,
              x: tX,
              y: tY,
              vx: Math.cos(angle) * turretBulletSpeed,
              vy: Math.sin(angle) * turretBulletSpeed,
              radius: 4.2,
              color: '#DC2626',
              isPlayer: false,
              damage: 16 + stageDmgBonus,
            });
          }
        });
      }
    }

    // 적 기체와 플레이어 기체 직접 충돌 판정 (HP 차감)
    if (!p.isInvincible) {
      const distToPlayer = Math.hypot(e.x - p.x, e.y - p.y);
      const hitRadius = e.type === 'boss' ? 52 : e.type === 'bomber' ? 28 : 20;
      if (distToPlayer < hitRadius) {
        handlePlayerHit(state, 24 + stageDmgBonus);
      }
    }

    // 플레이어 탄환과 충돌 판정
    for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
      const b = state.bullets[bi];
      if (!b.isPlayer) continue;

      let hit = false;

      // 보스 포탑 충돌 먼저 체크
      if (e.type === 'boss' && e.turrets) {
        for (const turret of e.turrets) {
          if (turret.hp > 0) {
            const tX = e.x + turret.relX;
            const tY = e.y + turret.relY;
            if (Math.hypot(b.x - tX, b.y - tY) < 18) {
              turret.hp -= b.damage;
              hit = true;
              if (turret.hp <= 0) {
                createExplosion(state, tX, tY, 'medium', 14);
                state.player.score += 800;
              }
              break;
            }
          }
        }
      }

      // 본체 충돌
      if (!hit) {
        const halfEW = e.width / 2;
        const halfEH = e.height / 2;
        if (
          b.x > e.x - halfEW &&
          b.x < e.x + halfEW &&
          b.y > e.y - halfEH &&
          b.y < e.y + halfEH
        ) {
          e.hp -= b.damage;
          hit = true;
        }
      }

      if (hit) {
        e.hitFlashTimer = 6;
        state.bullets.splice(bi, 1);
        createExplosion(state, b.x, b.y, 'small', 3);

        // 적기 사망 체크
        if (e.hp <= 0) {
          handleEnemyDestroyed(state, e);
          state.enemies.splice(i, 1);
          break;
        }
      }
    }

    // 화면 밖 이탈 처리
    if (e.y > CANVAS_HEIGHT + 60 || e.x < -100 || e.x > CANVAS_WIDTH + 100) {
      state.enemies.splice(i, 1);
    }
  }

  // 8. 아이템 업데이트 및 획득 판정 (gameSpeed 반영)
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    item.y += item.vy * gameSpeed;

    // 플레이어 획득 판정
    const dist = Math.hypot(item.x - p.x, item.y - p.y);
    if (dist < 30) {
      applyItem(state, item.type);
      state.items.splice(i, 1);
      continue;
    }

    if (item.y > CANVAS_HEIGHT + 30) {
      state.items.splice(i, 1);
    }
  }

  // 8.5 비행기 폭발 애니메이션 엔티티 업데이트
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    const exp = state.explosions[i];
    exp.frameTimer++;
    if (exp.frameTimer >= exp.frameDuration) {
      exp.frameTimer = 0;
      exp.frame++;
      if (exp.frame >= exp.totalFrames) {
        state.explosions.splice(i, 1);
      }
    }
  }

  // 9. 파티클 업데이트
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.alpha -= pt.decay;
    pt.radius = Math.max(0.5, pt.radius - pt.sizeDecay);

    if (pt.alpha <= 0 || pt.radius <= 0.6) {
      state.particles.splice(i, 1);
    }
  }

  // 10. 플로팅 텍스트 업데이트
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.y += ft.vy;
    ft.alpha -= 0.02;

    if (ft.alpha <= 0) {
      state.floatingTexts.splice(i, 1);
    }
  }

  // 하이스코어 갱신
  if (p.score > p.highScore) {
    p.highScore = p.score;
    try {
      localStorage.setItem('vera_flight_highscore', String(p.highScore));
    } catch {
      // ignore
    }
  }
}

// 적기 파괴 시 보상 및 전멸 검사 (격추수 기반 개조 포인트 적립)
function handleEnemyDestroyed(state: GameEngineState, e: Enemy) {
  state.player.score += e.scoreValue;
  state.player.kills += 1;
  state.player.stageKills = (state.player.stageKills || 0) + 1;

  if (e.type === 'boss') {
    createExplosion(state, e.x, e.y, 'boss', 40);
    state.screenShake = 30;
    state.bossActive = false;
    state.bossEncounterCount = (state.bossEncounterCount || 0) + 1;
    state.player.upgradePoints = (state.player.upgradePoints || 0) + 5; // 보스 격파 보너스 +5 개조 포인트

    // 화면 내 적 탄환 모두 제거 및 플레이어 HP 회복 보상 (+30 HP)
    state.bullets = state.bullets.filter((b) => b.isPlayer);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 30);

    const clearedStage = state.stage || 1;
    state.floatingTexts.push({
      id: nextEntityId++,
      text: `STAGE ${clearedStage} 보스 격파! (+5 개조 포인트)`,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2 - 55,
      color: '#10B981',
      alpha: 1.3,
      vy: -0.8,
    });

    // 스테이지 종료: 격추수에 따라 비행기를 개조할 수 있는 격납고(hangar) 모드로 전환
    state.status = 'hangar';
    return;
  }

  if (e.type === 'bomber') {
    state.player.upgradePoints = (state.player.upgradePoints || 0) + 2; // 폭격기 격추 시 +2 KP
    createExplosion(state, e.x, e.y, 'medium', 18);
    if (Math.random() < 0.38) {
      spawnItem(state, e.x, e.y);
    }
    return;
  }

  // 일반 적기(정찰기, 편대기) 격추 시 +1 KP
  state.player.upgradePoints = (state.player.upgradePoints || 0) + 1;
  createExplosion(state, e.x, e.y, 'small', 10);

  // 빨간 편대 전멸 체크 (1942 Signature)
  if (e.type === 'red-formation' && e.formationId !== undefined) {
    const form = state.redFormations.get(e.formationId);
    if (form) {
      form.destroyed++;
      if (form.destroyed >= form.total) {
        // 전멸 성공! 아이템 확정 드롭 (유도탄/플라즈마/주포/호위기 중 드롭)
        const bonusPool: ItemType[] = ['M', 'W', 'P', 'L'];
        const dropType = bonusPool[Math.floor(Math.random() * bonusPool.length)];
        spawnItem(state, e.x, e.y, dropType);
        state.player.upgradePoints += 2;
        state.floatingTexts.push({
          id: nextEntityId++,
          text: '편대 전멸 보너스! +1,000점 & +2 KP',
          x: e.x,
          y: e.y - 20,
          color: '#EF4444',
          alpha: 1,
          vy: -1.2,
        });
        state.player.score += 1000;
        state.redFormations.delete(e.formationId);
      }
    }
  }
}

// 아이템 획득 효과 (P: 주포, M: 유도 미사일, W: 플라즈마 캐논, L: 호위기, B: 메가폭탄, S: 스피드)
function applyItem(state: GameEngineState, type: ItemType) {
  sound.playItemSound();
  const p = state.player;

  let text = '';
  let color = '#10B981';

  if (type === 'P') {
    p.weaponLevel = Math.min(4, p.weaponLevel + 1);
    text = `주포 업그레이드 LV.${p.weaponLevel}!`;
    color = '#EF4444';
  } else if (type === 'M') {
    p.missileLevel = Math.min(3, (p.missileLevel || 0) + 1);
    text = `🚀 유도 미사일 장착 LV.${p.missileLevel}!`;
    color = '#9333EA';
  } else if (type === 'W') {
    p.plasmaLevel = Math.min(3, (p.plasmaLevel || 0) + 1);
    text = `⚡ 플라즈마 캐논 LV.${p.plasmaLevel}!`;
    color = '#0891B2';
  } else if (type === 'L') {
    p.hasEscorts = true;
    text = '호위기 편대 합류!';
    color = '#10B981';
  } else if (type === 'B') {
    p.bombs = Math.min(5, p.bombs + 1);
    text = `메가 폭탄 +1 (보유 ${p.bombs})!`;
    color = '#3B82F6';
  } else if (type === 'S') {
    p.speed = Math.min(6.8, p.speed + 0.45);
    text = '엔진 스피드 업!';
    color = '#F59E0B';
  }

  state.floatingTexts.push({
    id: nextEntityId++,
    text,
    x: p.x,
    y: p.y - 30,
    color,
    alpha: 1,
    vy: -1.2,
  });
}

// 스테이지 종료 후 격납고(Hangar)에서 격추 포인트(KP)로 비행기 개조 실행
export function applyPlayerUpgrade(state: GameEngineState, option: UpgradeOptionId): boolean {
  const p = state.player;
  const kp = p.upgradePoints || 0;

  if (option === 'hull') {
    const cost = 5 + (p.hullLevel || 0) * 2;
    if (kp < cost || (p.hullLevel || 0) >= 5) return false;
    p.upgradePoints -= cost;
    p.hullLevel = (p.hullLevel || 0) + 1;
    p.maxHp += 25;
    p.hp = Math.min(p.maxHp, p.hp + 40);
    sound.playPowerUpSound();
    return true;
  }

  if (option === 'repair') {
    const cost = 4;
    if (kp < cost || p.hp >= p.maxHp) return false;
    p.upgradePoints -= cost;
    p.hp = p.maxHp;
    sound.playItemSound();
    return true;
  }

  if (option === 'speed') {
    const cost = 5 + (p.speedLevel || 0) * 2;
    if (kp < cost || (p.speedLevel || 0) >= 5) return false;
    p.upgradePoints -= cost;
    p.speedLevel = (p.speedLevel || 0) + 1;
    p.speed = Number(Math.min(7.2, p.speed + 0.45).toFixed(2));
    sound.playPowerUpSound();
    return true;
  }

  if (option === 'firepower') {
    const cost = 6 + (p.firepowerLevel || 0) * 2;
    if (kp < cost || (p.firepowerLevel || 0) >= 5) return false;
    p.upgradePoints -= cost;
    p.firepowerLevel = (p.firepowerLevel || 0) + 1;
    if (p.weaponLevel < 4) p.weaponLevel += 1;
    sound.playPowerUpSound();
    return true;
  }

  if (option === 'missile') {
    const cost = 7 + (p.missileLevel || 0) * 3;
    if (kp < cost || (p.missileLevel || 0) >= 3) return false;
    p.upgradePoints -= cost;
    p.missileLevel = (p.missileLevel || 0) + 1;
    sound.playPowerUpSound();
    return true;
  }

  if (option === 'plasma') {
    const cost = 7 + (p.plasmaLevel || 0) * 3;
    if (kp < cost || (p.plasmaLevel || 0) >= 3) return false;
    p.upgradePoints -= cost;
    p.plasmaLevel = (p.plasmaLevel || 0) + 1;
    sound.playPowerUpSound();
    return true;
  }

  if (option === 'tactical') {
    const cost = 5;
    if (kp < cost) return false;
    p.upgradePoints -= cost;
    p.bombs = Math.min(6, p.bombs + 1);
    p.rolls = Math.min(6, p.rolls + 1);
    sound.playItemSound();
    return true;
  }

  return false;
}

// 격납고 개조 완료 후 다음 스테이지(Stage 2 ~ 99)로 출격
export function proceedFromHangar(state: GameEngineState) {
  const clearedStage = state.stage || 1;
  state.stage = Math.min(99, clearedStage + 1);
  state.stageClearTimer = 110;
  state.player.stageKills = 0;
  state.nextBossScore = state.player.score + 2800 + (state.stage - 1) * 650;
  state.enemies = [];
  state.bullets = [];
  state.player.x = CANVAS_WIDTH / 2;
  state.player.y = CANVAS_HEIGHT - 90;
  state.player.isInvincible = true;
  state.player.invincibleTimer = 90;
  state.status = 'playing';
}

// 현재 격납고(스테이지 클리어) 상태로부터 서버 세이브용 스냅샷 추출
export function extractSaveState(state: GameEngineState): FlightSaveState {
  const p = state.player;
  const nextStage = state.status === 'hangar' ? Math.min(99, (state.stage || 1) + 1) : state.stage || 1;
  return {
    stage: nextStage,
    score: p.score || 0,
    kills: p.kills || 0,
    hp: Math.max(20, p.hp || 100),
    maxHp: p.maxHp || 100,
    lives: Math.max(1, p.lives || 3),
    bombs: p.bombs ?? 2,
    rolls: p.rolls ?? 3,
    weaponLevel: p.weaponLevel || 1,
    missileLevel: p.missileLevel || 0,
    plasmaLevel: p.plasmaLevel || 0,
    firepowerLevel: p.firepowerLevel || 0,
    speedLevel: p.speedLevel || 0,
    hullLevel: p.hullLevel || 0,
    upgradePoints: p.upgradePoints || 0,
    hasEscorts: !!p.hasEscorts,
    savedAt: new Date().toISOString(),
  };
}

// 저장된 세이브 스냅샷으로부터 게임 상태 복원 후 즉시 해당 스테이지 출격
export function restoreFromSaveState(state: GameEngineState, save: FlightSaveState) {
  const p = state.player;
  const targetStage = Math.max(1, Math.min(99, save.stage || 2));
  state.stage = targetStage;
  state.stageClearTimer = 100;
  state.bossActive = false;
  state.bossWarningTimer = 0;
  state.enemies = [];
  state.bullets = [];
  state.items = [];

  p.score = save.score || 0;
  p.highScore = Math.max(p.highScore || 0, p.score);
  p.kills = save.kills || 0;
  p.stageKills = 0;
  p.maxHp = Math.max(100, save.maxHp || 100);
  p.hp = Math.min(p.maxHp, Math.max(30, save.hp || p.maxHp));
  p.lives = Math.max(1, save.lives || 3);
  p.bombs = save.bombs ?? 2;
  p.rolls = save.rolls ?? 3;
  p.weaponLevel = Math.max(1, Math.min(4, save.weaponLevel || 1));
  p.missileLevel = Math.max(0, Math.min(3, save.missileLevel || 0));
  p.plasmaLevel = Math.max(0, Math.min(3, save.plasmaLevel || 0));
  p.firepowerLevel = Math.max(0, Math.min(5, save.firepowerLevel || 0));
  p.speedLevel = Math.max(0, Math.min(5, save.speedLevel || 0));
  p.hullLevel = Math.max(0, Math.min(5, save.hullLevel || 0));
  p.speed = Number(Math.min(7.2, 4.5 + p.speedLevel * 0.45).toFixed(2));
  p.upgradePoints = Math.max(0, save.upgradePoints || 0);
  p.hasEscorts = !!save.hasEscorts;

  p.x = CANVAS_WIDTH / 2;
  p.y = CANVAS_HEIGHT - 90;
  p.isInvincible = true;
  p.invincibleTimer = 120;

  state.nextBossScore = p.score + 2800 + (targetStage - 1) * 650;
  state.status = 'playing';
}

// 플레이어 피격 처리 (HP 차감 시스템 — HP가 0이 되었을 때만 격추)
function handlePlayerHit(state: GameEngineState, damage = 14) {
  const p = state.player;
  p.hp = Math.max(0, p.hp - damage);
  p.hitFlashTimer = 10;

  if (p.hp > 0) {
    // 아직 HP가 남아있는 경우: 기체 파괴 없이 HP만 감소 + 0.45초 연속피격 보호 무적
    p.isInvincible = true;
    p.invincibleTimer = 28;
    state.screenShake = 8;
    createExplosion(state, p.x, p.y - 6, 'small', 6);
    state.floatingTexts.push({
      id: nextEntityId++,
      text: `-${damage} HP`,
      x: p.x,
      y: p.y - 24,
      color: '#EF4444',
      alpha: 1.1,
      vy: -1.1,
    });
    return;
  }

  // HP가 0이 된 경우: 기체 격추 처리
  p.lives--;
  p.hasEscorts = false; // 격추 시 호위기 소실
  p.weaponLevel = Math.max(1, p.weaponLevel - 1); // 무기 1단계 하향
  triggerPlayerExplosion(state, p.x, p.y);
  createExplosion(state, p.x, p.y, 'medium', 25);
  state.screenShake = 20;

  if (p.lives <= 0) {
    p.hp = 0;
    state.status = 'gameover';
  } else {
    // 예비 기체 리스폰 및 HP 100% 완충 + 무적 부여
    p.hp = p.maxHp;
    p.x = CANVAS_WIDTH / 2;
    p.y = CANVAS_HEIGHT - 90;
    p.isInvincible = true;
    p.invincibleTimer = 150; // 2.5초 무적
    state.floatingTexts.push({
      id: nextEntityId++,
      text: `기체 재출격! (잔여 기체: ${p.lives})`,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 130,
      color: '#38BDF8',
      alpha: 1.2,
      vy: -0.9,
    });
  }
}

// 캔버스 2D 렌더링 함수
export function renderGameEngine(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const p = state.player;
  ctx.save();

  // 화면 흔들림 효과
  if (state.screenShake > 0) {
    const sx = (Math.random() - 0.5) * state.screenShake;
    const sy = (Math.random() - 0.5) * state.screenShake;
    ctx.translate(sx, sy);
  }

  // 1. 에메랄드 태평양 바다 배경
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  oceanGrad.addColorStop(0, '#38BDF8'); // 맑은 하늘빛
  oceanGrad.addColorStop(1, '#0284C7'); // 깊은 에메랄드 블루
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 구름 렌더링
  state.clouds.forEach((c) => {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size * 0.5, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.35, c.y - c.size * 0.1, c.size * 0.4, 0, Math.PI * 2);
    ctx.arc(c.x - c.size * 0.35, c.y - c.size * 0.1, c.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 2. 적기 렌더링
  const sprites = assetManager.getSprites();

  state.enemies.forEach((e) => {
    ctx.save();
    ctx.translate(e.x, e.y);

    const isHitFlash = (e.hitFlashTimer || 0) > 0;
    if (isHitFlash) {
      ctx.filter = 'brightness(2.2)';
    }

    if (e.type === 'scout') {
      if (sprites.enemyScout && sprites.enemyScout.complete && sprites.enemyScout.naturalWidth > 0) {
        ctx.drawImage(sprites.enemyScout, -18, -18, 36, 36);
      } else {
        // 정찰기 벡터 폴백
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        ctx.lineTo(13, 0);
        ctx.lineTo(0, -13);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-3, -12, 6, 24);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(-6, -14, 12, 2);
      }
      if (isHitFlash) ctx.filter = 'none';

      // 정찰기 미니 체력바
      const scoutHpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(-13, -24, 26, 3);
      ctx.fillStyle = scoutHpPct > 0.4 ? '#38BDF8' : '#EF4444';
      ctx.fillRect(-13, -24, 26 * scoutHpPct, 3);
    } else if (e.type === 'red-formation') {
      // 붉은 정예 편대기 - S자 선회 뱅킹 틸트(기울임) 각도 계산
      const tilt = Math.sin((e.curveTimer || 0) * 0.08) * 0.35;
      ctx.save();
      ctx.rotate(tilt);

      if (sprites.enemyRed && sprites.enemyRed.complete && sprites.enemyRed.naturalWidth > 0) {
        ctx.drawImage(sprites.enemyRed, -20, -20, 40, 40);
      } else {
        // 편대기 벡터 폴백
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(-14, -8);
        ctx.lineTo(14, -8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (isHitFlash) ctx.filter = 'none';

      // 붉은 편대기 미니 체력바
      const redHpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(-14, -25, 28, 3);
      ctx.fillStyle = redHpPct > 0.4 ? '#F43F5E' : '#FBBF24';
      ctx.fillRect(-14, -25, 28 * redHpPct, 3);
    } else if (e.type === 'bomber') {
      if (sprites.enemyBomber && sprites.enemyBomber.complete && sprites.enemyBomber.naturalWidth > 0) {
        ctx.drawImage(sprites.enemyBomber, -36, -34, 72, 68);
      } else {
        // 폭격기 벡터 폴백
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-14, -6, 5, 12);
        ctx.fillRect(9, -6, 5, 12);
      }
      if (isHitFlash) ctx.filter = 'none';

      // 체력바
      const hpPercent = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-22, -42, 44, 4);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(-22, -42, 44 * hpPercent, 4);
    } else if (e.type === 'boss') {
      if (sprites.enemyBoss && sprites.enemyBoss.complete && sprites.enemyBoss.naturalWidth > 0) {
        ctx.drawImage(sprites.enemyBoss, -75, -55, 150, 110);
      } else {
        // 거대 공중 전함 본체 벡터 폴백
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        safeRoundRect(ctx, -70, -45, 140, 90, 16);
        ctx.fill();
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-50, -25, 100, 50);
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(0, 5, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 5, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      if (isHitFlash) ctx.filter = 'none';

      // 좌우 포탑 독립 렌더링
      if (e.turrets) {
        e.turrets.forEach((turret) => {
          ctx.save();
          ctx.translate(turret.relX, turret.relY);
          if (turret.hp > 0) {
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 플레이어 조준 포신 회전
            const tAngle = Math.atan2(p.y - (e.y + turret.relY), p.x - (e.x + turret.relX));
            ctx.rotate(tAngle);
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, -2.5, 14, 5);
          } else {
            // 파괴된 포탑 잔해
            ctx.fillStyle = '#1E293B';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#DC2626';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      }

      // 보스 대형 체력바
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-65, -68, 130, 8);
      ctx.fillStyle = hpRatio > 0.3 ? '#EF4444' : '#F97316';
      ctx.fillRect(-65, -68, 130 * hpRatio, 8);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-65, -68, 130, 8);
    }

    if (isHitFlash) ctx.filter = 'none';
    ctx.restore();
  });

  // 3. 아이템 렌더링
  state.items.forEach((item) => {
    ctx.save();
    ctx.translate(item.x, item.y);

    // 반짝이는 박스
    const glow = Math.sin(state.currentFrame * 0.15) * 3;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 14 + glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = item.color;
    ctx.beginPath();
    safeRoundRect(ctx, -11, -11, 22, 22, 5);
    ctx.fill();

    // 텍스트 (P, L, B, S)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, 0, 1);

    ctx.restore();
  });

  // 4. 탄환 렌더링 (일반탄 / 유도 미사일 / 플라즈마 캐논 차별화)
  state.bullets.forEach((b) => {
    ctx.save();
    if (b.isPlayer && b.kind === 'homing') {
      ctx.translate(b.x, b.y);
      ctx.rotate((b.angle ?? -Math.PI / 2) + Math.PI / 2);
      // 유도 미사일 본체
      ctx.fillStyle = '#A855F7';
      ctx.beginPath();
      safeRoundRect(ctx, -3, -7, 6, 14, 3);
      ctx.fill();
      // 탄두
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // 추진 화염
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(0, 7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.isPlayer && b.kind === 'plasma') {
      // 플라즈마 레이저 에너지 볼트
      ctx.fillStyle = '#06B6D4';
      ctx.beginPath();
      safeRoundRect(ctx, b.x - 3, b.y - 9, 6, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#CFFAFE';
      ctx.beginPath();
      safeRoundRect(ctx, b.x - 1.5, b.y - 7, 3, 14, 1.5);
      ctx.fill();
    } else {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // 플레이어 탄환 광원 이펙트
      if (b.isPlayer) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(b.x, b.y - 1, b.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });

  // 5. 플레이어 전투기 렌더링 (P-38 Lightning 스타일)
  const isBlinking = p.isInvincible && Math.floor(state.currentFrame / 4) % 2 === 0;

  if (!isBlinking) {
    ctx.save();
    ctx.translate(p.x, p.y);

    // 360도 공중제비 롤 회전 변형 (Perspective Roll)
    if (p.isRolling) {
      const rad = (p.rollAngle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      ctx.scale(1, Math.abs(cosA) > 0.05 ? cosA : 0.05);

      // 그림자 분리 효과 (고도 상승)
      const altitude = Math.sin((p.rollProgress / p.rollDuration) * Math.PI) * 24;
      ctx.save();
      ctx.translate(0, 15 + altitude);
      ctx.scale(0.8, 0.4);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const isPlayerHitFlash = (p.hitFlashTimer || 0) > 0;
    if (isPlayerHitFlash) {
      ctx.filter = 'brightness(2.2)';
    }

    if (sprites.playerP38 && sprites.playerP38.complete && sprites.playerP38.naturalWidth > 0) {
      // P-38 고화질 스프라이트 렌더링
      ctx.drawImage(sprites.playerP38, -25, -26, 50, 52);

      // 프로펠러 회전 블러 (좌우 엔진 팁)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      const propPhase = (state.currentFrame % 4) * 0.6;
      ctx.fillRect(-17 + propPhase, -22, 10, 2);
      ctx.fillRect(7 + propPhase, -22, 10, 2);
    } else {
      // 아군 P-38 벡터 폴백
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 좌우 엔진 붐 (Boom tails)
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(-13, -12, 5, 26);
      ctx.fillRect(8, -12, 5, 26);

      // 수평 꼬리날개
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(-15, 12, 30, 4);

      // 중앙 조종석 콕핏
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.ellipse(0, -4, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // 프로펠러 회전 블러 (좌우)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const propPhase = (state.currentFrame % 4) * 0.5;
      ctx.fillRect(-15 + propPhase, -14, 9, 2);
      ctx.fillRect(6 + propPhase, -14, 9, 2);
    }

    if (isPlayerHitFlash) ctx.filter = 'none';
    ctx.restore();

    // 호위기(옵션 2기) 동반 비행
    if (p.hasEscorts) {
      [-28, 28].forEach((offsetX) => {
        ctx.save();
        ctx.translate(p.x + offsetX, p.y + 8);
        if (sprites.playerEscort && sprites.playerEscort.complete && sprites.playerEscort.naturalWidth > 0) {
          ctx.drawImage(sprites.playerEscort, -13, -13, 26, 26);
        } else {
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#065F46';
          ctx.fillRect(-2, -6, 4, 12);
        }
        ctx.restore();
      });
    }
  }

  // 플레이어 전투기 직하단 미니 HP 게이지 바 (비행 중 직관적 체력 확인)
  if (state.status === 'playing' && p.hp > 0) {
    ctx.save();
    const barW = 42;
    const barH = 5;
    const barX = p.x - barW / 2;
    const barY = p.y + 28;
    const hpRatio = Math.max(0, Math.min(1, p.hp / (p.maxHp || 100)));

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    ctx.fillStyle = hpRatio > 0.5 ? '#22C55E' : hpRatio > 0.25 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.restore();
  }

  // 5.5 비행기 공중 폭발 애니메이션 렌더링 (Enemy & Player Explosion Sprite Sheet)
  state.explosions.forEach((exp) => {
    if (exp.frameTimer < 0) return; // 지연 스폰 대기 중인 경우 생략
    const img = exp.type === 'player' ? sprites.explosionPlayer : sprites.explosionEnemy;

    if (img && img.complete && img.naturalWidth > 0) {
      const fw = img.naturalWidth / exp.totalFrames;
      const fh = img.naturalHeight;
      const targetSize = (exp.type === 'player' ? 76 : 56) * exp.scale;

      ctx.save();
      ctx.translate(exp.x, exp.y);
      if (exp.type !== 'player') {
        ctx.rotate(exp.rotation);
      }

      // 초기 화구 충격파 링 효과 (0~2프레임)
      if (exp.frame <= 2) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, (targetSize / 2) * (0.6 + exp.frame * 0.25), 0, Math.PI * 2);
        ctx.fillStyle = exp.type === 'player' ? 'rgba(254, 240, 138, 0.4)' : 'rgba(249, 115, 22, 0.35)';
        ctx.fill();
        ctx.restore();
      }

      ctx.drawImage(
        img,
        exp.frame * fw, 0, fw, fh,
        -targetSize / 2, -targetSize / 2, targetSize, targetSize
      );
      ctx.restore();
    }
  });

  // 6. 파티클 렌더링
  state.particles.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 7. 플로팅 텍스트 렌더링
  state.floatingTexts.forEach((ft) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.alpha);
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  // 8. 보스 출현 2초 사전 경보 오버레이
  if (state.bossWarningTimer > 0) {
    const pulseAlpha = 0.14 + Math.abs(Math.sin(state.bossWarningTimer * 0.18)) * 0.18;
    ctx.save();
    ctx.fillStyle = `rgba(220, 38, 38, ${pulseAlpha.toFixed(2)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 중앙 경보 배너 박스
    const bannerW = 340;
    const bannerH = 92;
    const bannerX = (CANVAS_WIDTH - bannerW) / 2;
    const bannerY = CANVAS_HEIGHT / 2 - bannerH / 2 - 15;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    safeRoundRect(ctx, bannerX, bannerY, bannerW, bannerH, 16);
    ctx.fill();

    ctx.strokeStyle = Math.floor(state.bossWarningTimer / 8) % 2 === 0 ? '#EF4444' : '#FBBF24';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 메인 타이틀: 보스 출현!
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 26px sans-serif';
    ctx.fillStyle = '#FEF08A';
    ctx.fillText('🚨 보스 출현! 🚨', CANVAS_WIDTH / 2, bannerY + 34);

    // 서브 안내 문구
    const stageNum = state.stage || 1;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText(`STAGE ${stageNum} 거대 공중 전함 접근 중!`, CANVAS_WIDTH / 2, bannerY + 66);

    ctx.restore();
  }

  // 8.5 스테이지 클리어 & 다음 스테이지 돌입 배너
  if (state.stageClearTimer && state.stageClearTimer > 0 && state.bossWarningTimer <= 0) {
    ctx.save();
    const bannerW = 330;
    const bannerH = 84;
    const bannerX = (CANVAS_WIDTH - bannerW) / 2;
    const bannerY = CANVAS_HEIGHT / 2 - bannerH / 2 - 20;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.beginPath();
    safeRoundRect(ctx, bannerX, bannerY, bannerW, bannerH, 16);
    ctx.fill();

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 22px sans-serif';
    ctx.fillStyle = '#6EE7B7';
    ctx.fillText(`🎉 STAGE ${Math.max(1, state.stage - 1)} CLEAR!`, CANVAS_WIDTH / 2, bannerY + 30);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`➔ STAGE ${state.stage} / 99 출격 돌입!`, CANVAS_WIDTH / 2, bannerY + 60);
    ctx.restore();
  }

  // 9. 인캔버스 상단 아케이드 스코어 & 스테이지 오버레이 (비행 중 시선 이동 없이 실시간 확인)
  if (state.status === 'playing') {
    ctx.save();
    ctx.font = '900 13px monospace';
    ctx.textBaseline = 'top';

    // 좌상단: 1UP SCORE
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.lineWidth = 3;
    const scoreText = `SCORE ${p.score.toLocaleString()}`;
    ctx.strokeText(scoreText, 12, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(scoreText, 12, 10);

    // 중앙 상단: STAGE N / 99
    ctx.textAlign = 'center';
    const stageText = `STAGE ${state.stage || 1}/99`;
    ctx.strokeText(stageText, CANVAS_WIDTH / 2, 10);
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(stageText, CANVAS_WIDTH / 2, 10);

    // 우상단: HIGH SCORE
    ctx.textAlign = 'right';
    const bestVal = Math.max(p.highScore, p.score);
    const bestText = `HI ${bestVal.toLocaleString()}`;
    ctx.strokeText(bestText, CANVAS_WIDTH - 12, 10);
    ctx.fillStyle = '#FDE047';
    ctx.fillText(bestText, CANVAS_WIDTH - 12, 10);
    ctx.restore();
  }

  ctx.restore();
}
