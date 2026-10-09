import type {
  GameEngineState,
  Player,
  Enemy,
  ItemType,
  Cloud,
  Island,
} from './types';
import { sound } from '../utils/sound';
import { assetManager } from './assets';

export type { GameEngineState };


export const CANVAS_WIDTH = 450;
export const CANVAS_HEIGHT = 600;

let nextEntityId = 1;

export function createInitialState(): GameEngineState {
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
  for (let i = 0; i < 3; i++) {
    islands.push({
      x: 60 + Math.random() * (CANVAS_WIDTH - 120),
      y: Math.random() * CANVAS_HEIGHT,
      radius: 25 + Math.random() * 35,
      speed: 0.5,
      color: Math.random() > 0.5 ? '#86EFAC' : '#6EE7B7',
    });
  }

  const player: Player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 90,
    width: 36,
    height: 38,
    speed: 4.5,
    lives: 3,
    bombs: 2,
    rolls: 3,
    weaponLevel: 1,
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
  };

  return {
    status: 'ready',
    player,
    bullets: [],
    enemies: [],
    items: [],
    particles: [],
    floatingTexts: [],
    clouds,
    islands,
    currentFrame: 0,
    stage: 1,
    bossActive: false,
    bossWarningTimer: 0,
    redFormations: new Map(),
    screenShake: 0,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
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

// 플레이어 사격 처리
export function playerShoot(state: GameEngineState) {
  if (state.status !== 'playing') return;
  if (state.player.isRolling) return; // 롤 중에는 사격 중단
  if (state.currentFrame - state.player.lastShotFrame < 9) return; // 연사 딜레이

  state.player.lastShotFrame = state.currentFrame;
  sound.playGunSound();

  const p = state.player;
  const bulletSpeed = -9.5;

  // 무기 티어별 발사 탄환 패턴
  if (p.weaponLevel === 1) {
    // 1단계: 단발 전방
    state.bullets.push({
      id: nextEntityId++,
      x: p.x,
      y: p.y - 18,
      vx: 0,
      vy: bulletSpeed,
      radius: 3.5,
      color: '#FBBF24',
      isPlayer: true,
      damage: 10,
    });
  } else if (p.weaponLevel === 2) {
    // 2단계: 트윈 건 (좌우 2열)
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
        damage: 11,
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
        damage: 11,
      }
    );
  } else if (p.weaponLevel === 3) {
    // 3단계: 부채꼴 3-way 스프레드
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
        damage: 12,
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
        damage: 10,
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
        damage: 10,
      }
    );
  } else {
    // 4단계: 4열 헤비 캐논
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
        damage: 14,
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
        damage: 14,
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
        damage: 12,
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
        damage: 12,
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
        damage: 9,
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
        damage: 9,
      }
    );
  }
}

// 폭발 이펙트 생성
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
}

// 아이템 스폰
function spawnItem(state: GameEngineState, x: number, y: number, specificType?: ItemType) {
  let type: ItemType = specificType || 'P';
  if (!specificType) {
    const roll = Math.random();
    if (roll < 0.45) type = 'P';
    else if (roll < 0.7) type = 'L';
    else if (roll < 0.88) type = 'B';
    else type = 'S';
  }

  const colorMap: Record<ItemType, string> = {
    P: '#EF4444',
    L: '#10B981',
    B: '#3B82F6',
    S: '#F59E0B',
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

// 빨간 편대 비행대 스폰 (1942 Signature Red Formation)
function spawnRedFormation(state: GameEngineState) {
  const formationId = nextEntityId++;
  state.redFormations.set(formationId, { total: 5, destroyed: 0 });

  const side = Math.random() > 0.5 ? 1 : -1;
  const startX = side === 1 ? -30 : CANVAS_WIDTH + 30;

  for (let i = 0; i < 5; i++) {
    state.enemies.push({
      id: nextEntityId++,
      type: 'red-formation',
      x: startX,
      y: -40 - i * 36,
      vx: side * 2.8,
      vy: 2.2,
      width: 28,
      height: 28,
      hp: 18,
      maxHp: 18,
      scoreValue: 200,
      formationId,
      formationIndex: i,
      curveTimer: -i * 12,
      lastShotFrame: 0,
      shootInterval: 9999, // 빨간 편대는 폭탄 대신 곡예비행 집중
    });
  }
}

// 정찰기 스폰
function spawnScout(state: GameEngineState) {
  const x = 30 + Math.random() * (CANVAS_WIDTH - 60);
  state.enemies.push({
    id: nextEntityId++,
    type: 'scout',
    x,
    y: -30,
    vx: (Math.random() - 0.5) * 1.8,
    vy: 2.4 + Math.random() * 0.8,
    width: 26,
    height: 26,
    hp: 15,
    maxHp: 15,
    scoreValue: 100,
    lastShotFrame: state.currentFrame,
    shootInterval: 75 + Math.floor(Math.random() * 45),
  });
}

// 중형 폭격기 스폰
function spawnBomber(state: GameEngineState) {
  const x = 50 + Math.random() * (CANVAS_WIDTH - 100);
  state.enemies.push({
    id: nextEntityId++,
    type: 'bomber',
    x,
    y: -50,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 1.2,
    width: 48,
    height: 44,
    hp: 65,
    maxHp: 65,
    scoreValue: 400,
    lastShotFrame: state.currentFrame,
    shootInterval: 90,
  });
}

// 거대 보스 전함 스폰
function spawnBoss(state: GameEngineState) {
  state.bossActive = true;
  state.bossWarningTimer = 180; // 3초간 경보 사이렌
  sound.playBossAlertSound();

  state.enemies.push({
    id: nextEntityId++,
    type: 'boss',
    x: CANVAS_WIDTH / 2,
    y: -120, // 위에서 서서히 진입
    vx: 1.1,
    vy: 0.6,
    width: 140,
    height: 100,
    hp: 750,
    maxHp: 750,
    scoreValue: 5000,
    lastShotFrame: state.currentFrame,
    shootInterval: 45,
    turrets: [
      { id: 'left', relX: -45, relY: -15, hp: 160, maxHp: 160, lastShot: 0 },
      { id: 'right', relX: 45, relY: -15, hp: 160, maxHp: 160, lastShot: 0 },
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

  if (state.screenShake > 0) {
    state.screenShake *= 0.9;
    if (state.screenShake < 0.5) state.screenShake = 0;
  }

  // 1. 배경 애니메이션 (구름 & 섬)
  state.clouds.forEach((c) => {
    c.y += c.speed;
    if (c.y > CANVAS_HEIGHT + c.size) {
      c.y = -c.size;
      c.x = Math.random() * CANVAS_WIDTH;
    }
  });

  state.islands.forEach((isl) => {
    isl.y += isl.speed;
    if (isl.y > CANVAS_HEIGHT + isl.radius * 2) {
      isl.y = -isl.radius * 2;
      isl.x = 40 + Math.random() * (CANVAS_WIDTH - 80);
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

  p.x += moveX * p.speed;
  p.y += moveY * p.speed;

  // 캔버스 화면 가두기
  const halfW = p.width / 2;
  const halfH = p.height / 2;
  if (p.x < halfW + 10) p.x = halfW + 10;
  if (p.x > CANVAS_WIDTH - halfW - 10) p.x = CANVAS_WIDTH - halfW - 10;
  if (p.y < halfH + 20) p.y = halfH + 20;
  if (p.y > CANVAS_HEIGHT - halfH - 15) p.y = CANVAS_HEIGHT - halfH - 15;

  // 3. 360도 공중제비 롤링 진행
  if (p.isRolling) {
    p.rollProgress++;
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

  // 5. 적기 생성 스폰 로직
  if (!state.bossActive && state.player.score >= 4000 && state.enemies.length === 0) {
    spawnBoss(state);
  } else if (!state.bossActive) {
    // 일반 스폰
    if (state.currentFrame % 70 === 0) {
      spawnScout(state);
    }
    if (state.currentFrame % 260 === 0) {
      spawnRedFormation(state);
    }
    if (state.currentFrame % 380 === 0) {
      spawnBomber(state);
    }
  }

  if (state.bossWarningTimer > 0) {
    state.bossWarningTimer--;
  }

  // 6. 탄환 업데이트
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx;
    b.y += b.vy;

    // 화면 밖 제거
    if (b.y < -30 || b.y > CANVAS_HEIGHT + 30 || b.x < -30 || b.x > CANVAS_WIDTH + 30) {
      state.bullets.splice(i, 1);
      continue;
    }

    // 플레이어 피격 판정 (적 탄환 vs 플레이어)
    if (!b.isPlayer && !p.isInvincible) {
      const dist = Math.hypot(b.x - p.x, b.y - p.y);
      if (dist < b.radius + 10) {
        state.bullets.splice(i, 1);
        handlePlayerHit(state);
        continue;
      }
    }
  }

  // 7. 적기 업데이트
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];

    if (e.hitFlashTimer && e.hitFlashTimer > 0) {
      e.hitFlashTimer--;
    }

    // 이동 패턴
    if (e.type === 'scout') {
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < 20 || e.x > CANVAS_WIDTH - 20) e.vx = -e.vx;

      // 조준 사격
      if (state.currentFrame - e.lastShotFrame > e.shootInterval && e.y > 20 && e.y < CANVAS_HEIGHT - 100) {
        e.lastShotFrame = state.currentFrame;
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        state.bullets.push({
          id: nextEntityId++,
          x: e.x,
          y: e.y + 12,
          vx: Math.cos(angle) * 3.4,
          vy: Math.sin(angle) * 3.4,
          radius: 4,
          color: '#DC2626',
          isPlayer: false,
          damage: 1,
        });
      }
    } else if (e.type === 'red-formation') {
      e.curveTimer = (e.curveTimer || 0) + 1;
      if (e.curveTimer > 0) {
        // S자 선회 루프
        e.x += Math.sin(e.curveTimer * 0.05) * 3.2;
        e.y += e.vy;
      } else {
        e.y += e.vy;
      }
    } else if (e.type === 'bomber') {
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < 40 || e.x > CANVAS_WIDTH - 40) e.vx = -e.vx;

      // 3-way 부채꼴 탄환
      if (state.currentFrame - e.lastShotFrame > e.shootInterval && e.y > 40 && e.y < CANVAS_HEIGHT - 120) {
        e.lastShotFrame = state.currentFrame;
        for (let a = -0.4; a <= 0.4; a += 0.4) {
          state.bullets.push({
            id: nextEntityId++,
            x: e.x,
            y: e.y + 20,
            vx: Math.sin(a) * 3.2,
            vy: Math.cos(a) * 3.2,
            radius: 4.5,
            color: '#EA580C',
            isPlayer: false,
            damage: 1,
          });
        }
      }
    } else if (e.type === 'boss') {
      // 보스 진입 및 좌우 순항
      if (e.y < 90) {
        e.y += e.vy;
      } else {
        e.x += e.vx;
        if (e.x < 110 || e.x > CANVAS_WIDTH - 110) e.vx = -e.vx;
      }

      // 보스 주포 사격
      if (state.currentFrame - e.lastShotFrame > e.shootInterval && e.y >= 85) {
        e.lastShotFrame = state.currentFrame;
        // 5-way 원형 방사탄
        for (let a = -0.6; a <= 0.6; a += 0.3) {
          state.bullets.push({
            id: nextEntityId++,
            x: e.x,
            y: e.y + 40,
            vx: Math.sin(a) * 3.6,
            vy: Math.cos(a) * 3.6,
            radius: 5,
            color: '#B91C1C',
            isPlayer: false,
            damage: 1,
          });
        }
      }

      // 보스 포탑 독립 사격
      if (e.turrets) {
        e.turrets.forEach((turret) => {
          if (turret.hp > 0 && state.currentFrame - turret.lastShot > 70) {
            turret.lastShot = state.currentFrame;
            const tX = e.x + turret.relX;
            const tY = e.y + turret.relY;
            const angle = Math.atan2(p.y - tY, p.x - tX);
            state.bullets.push({
              id: nextEntityId++,
              x: tX,
              y: tY,
              vx: Math.cos(angle) * 3.8,
              vy: Math.sin(angle) * 3.8,
              radius: 4,
              color: '#DC2626',
              isPlayer: false,
              damage: 1,
            });
          }
        });
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

  // 8. 아이템 업데이트 및 획득 판정
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    item.y += item.vy;

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

// 적기 파괴 시 보상 및 전멸 검사
function handleEnemyDestroyed(state: GameEngineState, e: Enemy) {
  state.player.score += e.scoreValue;
  state.player.kills += 1;

  if (e.type === 'boss') {
    createExplosion(state, e.x, e.y, 'boss', 40);
    state.screenShake = 35;
    state.bossActive = false;
    state.floatingTexts.push({
      id: nextEntityId++,
      text: 'STAGE CLEAR! +5,000',
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2 - 40,
      color: '#10B981',
      alpha: 1,
      vy: -0.8,
    });
    // 보스 격파 시 폭탄 + 무기 풀파워 드롭
    spawnItem(state, e.x - 20, e.y, 'B');
    spawnItem(state, e.x + 20, e.y, 'P');
    return;
  }

  if (e.type === 'bomber') {
    createExplosion(state, e.x, e.y, 'medium', 18);
    if (Math.random() < 0.6) {
      spawnItem(state, e.x, e.y);
    }
    return;
  }

  createExplosion(state, e.x, e.y, 'small', 10);

  // 빨간 편대 전멸 체크 (1942 Signature)
  if (e.type === 'red-formation' && e.formationId !== undefined) {
    const form = state.redFormations.get(e.formationId);
    if (form) {
      form.destroyed++;
      if (form.destroyed >= form.total) {
        // 전멸 성공! 아이템 확정 드롭
        spawnItem(state, e.x, e.y, Math.random() > 0.5 ? 'P' : 'L');
        state.floatingTexts.push({
          id: nextEntityId++,
          text: 'FORMATION DESTROYED! +1,000',
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

// 아이템 획득 효과
function applyItem(state: GameEngineState, type: ItemType) {
  sound.playItemSound();
  const p = state.player;

  let text = '';
  let color = '#10B981';

  if (type === 'P') {
    p.weaponLevel = Math.min(4, p.weaponLevel + 1);
    text = `WEAPON UPGRADE LV.${p.weaponLevel}!`;
    color = '#EF4444';
  } else if (type === 'L') {
    p.hasEscorts = true;
    text = 'ESCORT WINGS ATTACHED!';
    color = '#10B981';
  } else if (type === 'B') {
    p.bombs = Math.min(5, p.bombs + 1);
    text = `MEGA BOMB +1 (TOTAL ${p.bombs})!`;
    color = '#3B82F6';
  } else if (type === 'S') {
    p.speed = Math.min(6.5, p.speed + 0.6);
    text = 'ENGINE SPEED UP!';
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

// 플레이어 피격 처리
function handlePlayerHit(state: GameEngineState) {
  const p = state.player;
  p.lives--;
  p.hasEscorts = false; // 피격 시 호위기 소실
  p.weaponLevel = Math.max(1, p.weaponLevel - 1); // 무기 1단계 하향
  p.hitFlashTimer = 12;
  createExplosion(state, p.x, p.y, 'medium', 25);
  state.screenShake = 18;

  if (p.lives <= 0) {
    state.status = 'gameover';
  } else {
    // 리스폰 및 무적 부여
    p.x = CANVAS_WIDTH / 2;
    p.y = CANVAS_HEIGHT - 90;
    p.isInvincible = true;
    p.invincibleTimer = 150; // 2.5초 무적
  }
}

// 캔버스 2D 렌더링 함수
export function renderGameEngine(ctx: CanvasRenderingContext2D, state: GameEngineState) {
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

  // 섬 렌더링
  state.islands.forEach((isl) => {
    ctx.save();
    // 백사장 모래사장 테두리
    ctx.beginPath();
    ctx.arc(isl.x, isl.y, isl.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();

    // 열대 섬
    ctx.beginPath();
    ctx.arc(isl.x, isl.y, isl.radius, 0, Math.PI * 2);
    ctx.fillStyle = isl.color;
    ctx.fill();
    ctx.restore();
  });

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
    } else if (e.type === 'red-formation') {
      // 붉은 정예 편대기 - S자 선회 뱅킹 틸트(기울임) 각도 계산
      const tilt = Math.sin((e.curveTimer || 0) * 0.08) * 0.35;
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
        ctx.roundRect(-70, -45, 140, 90, 16);
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
    ctx.roundRect(-11, -11, 22, 22, 5);
    ctx.fill();

    // 텍스트 (P, L, B, S)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, 0, 1);

    ctx.restore();
  });

  // 4. 탄환 렌더링
  state.bullets.forEach((b) => {
    ctx.save();
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
    ctx.restore();
  });

  // 5. 플레이어 전투기 렌더링 (P-38 Lightning 스타일)
  const p = state.player;
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

  // 8. 보스 경보 사이렌 오버레이
  if (state.bossWarningTimer > 0) {
    const flash = Math.floor(state.bossWarningTimer / 10) % 2 === 0;
    if (flash) {
      ctx.save();
      ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#DC2626';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeText('⚠ WARNING: BOSS APPROACHING ⚠', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText('⚠ WARNING: BOSS APPROACHING ⚠', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.restore();
    }
  }

  ctx.restore();
}
