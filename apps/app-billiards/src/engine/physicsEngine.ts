import type {
  AiDifficulty,
  AimPrediction,
  BallId,
  BallState,
  BilliardsRuleMode,
  ShotResult,
  ShotTracker,
  SkillDama,
  SkillPhysicsProfile,
  SpinOffset,
  TrickShotPreset,
} from '../types/billiards';

/** 논리 당구대 내경(라사지) 규격: 국제 정통 캐럼 2:1 비율 */
export const TABLE_WIDTH = 600;
export const TABLE_HEIGHT = 300;
export const BALL_RADIUS = 12;

/**
 * 한국 당구장 정통 다마수(80 / 100 / 120 / 150 / 200 / 300 / 프로)별 물리 스케일링 프로필
 * - 다마수에 따라 큐 임팩트 파워, 회전량(히네리), 끌어치기(히끼), 밀어치기(오시), 유효 당점 한계가 차등 적용됨
 */
export const SKILL_PHYSICS_PROFILES: Record<SkillDama, SkillPhysicsProfile> = {
  80: {
    dama: 80,
    label: '80 다마 (입문)',
    shortLabel: '80다마',
    powerScale: 0.78,
    spinScale: 0.38,
    drawScale: 0.35,
    followScale: 0.45,
    maxTipOffset: 0.60,
    driveFrames: 10,
    desc: '입문자 구질: 회전이 적게 먹고 정직한 입사=반사각 위주. 끌어치기 시 제자리 스톱샷 수준',
  },
  100: {
    dama: 100,
    label: '100 다마 (초급)',
    shortLabel: '100다마',
    powerScale: 0.82,
    spinScale: 0.48,
    drawScale: 0.46,
    followScale: 0.55,
    maxTipOffset: 0.68,
    driveFrames: 12,
    desc: '초급자 구질: 부드러운 기본 회전과 단거리 밀어치기·끌어치기가 구사됨',
  },
  120: {
    dama: 120,
    label: '120 다마 (초중급)',
    shortLabel: '120다마',
    powerScale: 0.86,
    spinScale: 0.58,
    drawScale: 0.58,
    followScale: 0.65,
    maxTipOffset: 0.75,
    driveFrames: 13,
    desc: '초중급 구질: 기본 밀어치기·끌어치기 분리각이 안정적으로 형성되며 쿠션 꺾임이 완만함',
  },
  150: {
    dama: 150,
    label: '150 다마 (동호인)',
    shortLabel: '150다마',
    powerScale: 0.90,
    spinScale: 0.68,
    drawScale: 0.68,
    followScale: 0.74,
    maxTipOffset: 0.82,
    driveFrames: 15,
    desc: '표준 동호인 구질: 과장되지 않은 정석 회전과 깔끔한 중소거리 히끼·오시가 구사됨',
  },
  200: {
    dama: 200,
    label: '200 다마 (상급자)',
    shortLabel: '200다마',
    powerScale: 0.95,
    spinScale: 0.82,
    drawScale: 0.82,
    followScale: 0.85,
    maxTipOffset: 0.88,
    driveFrames: 18,
    desc: '상급자 구질: 3쿠션 대회전과 중장거리 끌어치기·밀어치기 커브가 날카롭게 살아남',
  },
  300: {
    dama: 300,
    label: '300 다마 (고수)',
    shortLabel: '300다마',
    powerScale: 1.00,
    spinScale: 0.96,
    drawScale: 0.96,
    followScale: 0.96,
    maxTipOffset: 0.94,
    driveFrames: 20,
    desc: '클럽 고수 구질: 강한 손목 스냅으로 당구대 한 바퀴 반 대회전 및 장거리 히끼·오시 구사',
  },
  500: {
    dama: 500,
    label: '프로 챔피언 (500+)',
    shortLabel: '프로(500)',
    powerScale: 1.05,
    spinScale: 1.08,
    drawScale: 1.08,
    followScale: 1.08,
    maxTipOffset: 0.98,
    driveFrames: 22,
    desc: '프로 예술구 구질: 극한 당점과 강력한 스트로크로 깊은 회전 반사각 및 파워 샷 구사',
  },
};

export function getSkillProfile(dama: SkillDama): SkillPhysicsProfile {
  return SKILL_PHYSICS_PROFILES[dama] ?? SKILL_PHYSICS_PROFILES[150];
}

export function aiDifficultyToDama(difficulty: AiDifficulty): SkillDama {
  switch (difficulty) {
    case 'dama80':
      return 80;
    case 'dama100':
      return 100;
    case 'dama120':
      return 120;
    case 'dama150':
      return 150;
    case 'dama200':
      return 200;
    case 'dama300':
      return 300;
    case 'master':
      return 500;
    default:
      return 150;
  }
}

/**
 * 정통 캐럼 대대(열선 라사지 & 고탄성 고무 쿠션) 물리 상수
 * - SUB_STEPS=12: 최고속 풀파워(31px/frame) 시에도 터널링 없이 정밀 충돌 연산
 * - HIGH_SPEED_FRICTION=0.9934: 풀파워 스트로크 시 다이 1.5~2바퀴(5~7쿠션, ~3,200px) 대회전 구현
 */
const SUB_STEPS = 12;
const BALL_RESTITUTION = 0.96;
const CUSHION_RESTITUTION = 0.90;
const HIGH_SPEED_FRICTION = 0.9934;
const ROLLING_FRICTION = 0.9895;
const LINEAR_ROLL_DRAG = 0.0075;
const STOP_SPEED_EPSILON = 0.042;

/** 초기 공 배치 생성 */
export function createInitialBalls(mode: BilliardsRuleMode): BallState[] {
  const r = BALL_RADIUS;
  if (mode === 'four-ball') {
    return [
      {
        id: 'cue_white',
        x: 150,
        y: 195,
        vx: 0,
        vy: 0,
        radius: r,
        color: 'white',
        rollAngleX: 0,
        rollAngleY: 0,
        sideSpin: 0,
        topBottomSpin: 0,
        hasHitFirstBall: false,
      },
      {
        id: 'cue_yellow',
        x: 150,
        y: 105,
        vx: 0,
        vy: 0,
        radius: r,
        color: 'yellow',
        rollAngleX: 0,
        rollAngleY: 0,
        sideSpin: 0,
        topBottomSpin: 0,
        hasHitFirstBall: false,
      },
      {
        id: 'obj_red1',
        x: 450,
        y: 150,
        vx: 0,
        vy: 0,
        radius: r,
        color: 'red',
        rollAngleX: 0,
        rollAngleY: 0,
        sideSpin: 0,
        topBottomSpin: 0,
        hasHitFirstBall: false,
      },
      {
        id: 'obj_red2',
        x: 150,
        y: 150,
        vx: 0,
        vy: 0,
        radius: r,
        color: 'red',
        rollAngleX: 0,
        rollAngleY: 0,
        sideSpin: 0,
        topBottomSpin: 0,
        hasHitFirstBall: false,
      },
    ];
  }

  // 3구(3쿠션) 공식 초구 배치
  return [
    {
      id: 'cue_white',
      x: 150,
      y: 188,
      vx: 0,
      vy: 0,
      radius: r,
      color: 'white',
      rollAngleX: 0,
      rollAngleY: 0,
      sideSpin: 0,
      topBottomSpin: 0,
      hasHitFirstBall: false,
    },
    {
      id: 'cue_yellow',
      x: 150,
      y: 150,
      vx: 0,
      vy: 0,
      radius: r,
      color: 'yellow',
      rollAngleX: 0,
      rollAngleY: 0,
      sideSpin: 0,
      topBottomSpin: 0,
      hasHitFirstBall: false,
    },
    {
      id: 'obj_red1',
      x: 450,
      y: 150,
      vx: 0,
      vy: 0,
      radius: r,
      color: 'red',
      rollAngleX: 0,
      rollAngleY: 0,
      sideSpin: 0,
      topBottomSpin: 0,
      hasHitFirstBall: false,
    },
  ];
}

/** 새로운 샷 추적기 초기화 */
export function createShotTracker(cueBallId: BallId): ShotTracker {
  return {
    cueBallId,
    hitBalls: new Set<BallId>(),
    cushionCount: 0,
    cushionCountBeforeSecondObject: 0,
    firstContactWasCushion: false,
    firstObjectHit: null,
    secondObjectHit: null,
    maxImpactSpeed: 0,
  };
}

export interface StepCallbacks {
  onBallCollision?: (x: number, y: number, speed: number) => void;
  onCushionBounce?: (x: number, y: number, speed: number, spin: number) => void;
}

/**
 * 쿠션 충돌 시 법선(nx, ny) 및 접선(tx = ny, ty = -nx) 기반 정통 히네리(Side English) 반사 물리 적용
 * - 우측 당점(sideSpin > 0): 공 진행 방향 기준 우측(시계방향 접선 t = (ny, -nx))으로 반사각 확장
 * - 좌측 당점(sideSpin < 0): 공 진행 방향 기준 좌측(반시계방향 접선)으로 반사각 굴절
 * - 정회전(Running English) 시 가속 및 비거리 증가, 역회전(Reverse English) 시 강한 제동 및 각도 꺾임
 */
function applyCushionBounceWithSpin(
  b: BallState,
  nx: number,
  ny: number,
  speedBefore: number
): void {
  // 입사 속도를 쿠션 법선 성분(vn < 0)과 시계방향 접선 성분(vt)으로 분해
  const tx = ny;
  const ty = -nx;
  const vn = b.vx * nx + b.vy * ny;
  const vt = b.vx * tx + b.vy * ty;

  // 다마수(실력 등급)별 회전 계수 (기본값: 150 다마 0.68)
  const spinScale = b.spinScale ?? 0.68;

  // 기본 탄성 반사 법선 속도 (상/하단 스핀이 쿠션에 닿을 때 반발 각도에 주는 미세 영향 반영)
  const topBottomRailFactor = !b.hasHitFirstBall ? 1 - b.topBottomSpin * 0.07 * spinScale : 1;
  let newVn = Math.abs(vn) * CUSHION_RESTITUTION * Math.max(0.78, Math.min(1.12, topBottomRailFactor));

  // 기본 쿠션 마찰 감쇠된 접선 속도
  let newVt = vt * 0.92;

  if (Math.abs(b.sideSpin) > 0.015) {
    // 다마수별 회전 반사 킥(Kick): 300다마 기준 정통 계수에 다마수별 spinScale(0.38 ~ 1.08) 곱셈 적용
    const spinKick =
      b.sideSpin *
      spinScale *
      (Math.max(1.30, speedBefore * 0.44) + Math.abs(vn) * 0.24);
    const isRunningEnglish = vt * b.sideSpin >= 0;

    // 다마수가 높을수록 쿠션 마찰 시 회전 유지율이 높아 4~6쿠션까지 회전이 살아남음
    const retentionBoost = 0.78 + Math.min(0.24, spinScale * 0.22);

    if (isRunningEnglish) {
      // 정회전(Running English): 회전이 진행 방향과 같아 쿠션을 타고 길고 빠르게 뻗어나감
      newVt += spinKick;
      const targetSpeed = Math.min(
        speedBefore * (0.91 + Math.abs(b.sideSpin) * spinScale * 0.06),
        Math.hypot(newVn, newVt)
      );
      const curSpeed = Math.hypot(newVn, newVt) || 1;
      newVn = (newVn / curSpeed) * targetSpeed;
      newVt = (newVt / curSpeed) * targetSpeed;
      b.sideSpin *= 0.86 * retentionBoost;
    } else {
      // 역회전(Reverse English): 입사 접선 속도를 강하게 브레이크 걸고 둔각/역각으로 꺾어냄
      newVt = vt * (0.76 - 0.10 * spinScale) + spinKick * 1.12;
      newVn *= 0.96;
      b.sideSpin *= 0.76 * retentionBoost;
    }
  }

  b.vx = nx * newVn + tx * newVt;
  b.vy = ny * newVn + ty * newVt;

  // 쿠션 반사 후 진행 방향 벡터 갱신
  const newSpeed = Math.hypot(b.vx, b.vy);
  if (newSpeed > 0.1) {
    b.forwardDirX = b.vx / newSpeed;
    b.forwardDirY = b.vy / newSpeed;
  }
}

/**
 * 1프레임 물리 시뮬레이션 (서브스텝 12회 분할 적분)
 * @returns 모든 공이 정지했는지 여부 (boolean)
 */
export function stepPhysicsFrame(
  balls: BallState[],
  tracker: ShotTracker,
  callbacks?: StepCallbacks
): boolean {
  const dt = 1 / SUB_STEPS;

  for (let s = 0; s < SUB_STEPS; s++) {
    // 1. 위치 적분 및 4면 쿠션 반사 검사
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // 회전 시각화 위상 업데이트 (상하 스핀 및 좌우 스핀이 도트 회전 속도에 반영)
      const spinRollBoost = 1 + b.topBottomSpin * 0.45;
      b.rollAngleX += ((b.vx * spinRollBoost + b.sideSpin * 1.8) * dt) / b.radius;
      b.rollAngleY += ((b.vy * spinRollBoost + b.sideSpin * 1.8) * dt) / b.radius;

      const r = b.radius;
      let hitCushion = false;
      let bounceX = b.x;
      let bounceY = b.y;
      const speedBefore = Math.hypot(b.vx, b.vy);

      // 좌측 쿠션 (내측 법선 nx = +1, ny = 0)
      if (b.x < r) {
        b.x = r;
        if (b.vx < 0) {
          applyCushionBounceWithSpin(b, 1, 0, speedBefore);
          hitCushion = true;
          bounceX = 0;
        }
      } else if (b.x > TABLE_WIDTH - r) {
        // 우측 쿠션 (내측 법선 nx = -1, ny = 0)
        b.x = TABLE_WIDTH - r;
        if (b.vx > 0) {
          applyCushionBounceWithSpin(b, -1, 0, speedBefore);
          hitCushion = true;
          bounceX = TABLE_WIDTH;
        }
      }

      // 상단 쿠션 (내측 법선 nx = 0, ny = +1)
      if (b.y < r) {
        b.y = r;
        if (b.vy < 0) {
          applyCushionBounceWithSpin(b, 0, 1, speedBefore);
          hitCushion = true;
          bounceY = 0;
        }
      } else if (b.y > TABLE_HEIGHT - r) {
        // 하단 쿠션 (내측 법선 nx = 0, ny = -1)
        b.y = TABLE_HEIGHT - r;
        if (b.vy > 0) {
          applyCushionBounceWithSpin(b, 0, -1, speedBefore);
          hitCushion = true;
          bounceY = TABLE_HEIGHT;
        }
      }

      if (hitCushion && speedBefore > 0.12) {
        if (b.id === tracker.cueBallId) {
          if (tracker.hitBalls.size === 0 && tracker.cushionCount === 0) {
            tracker.firstContactWasCushion = true;
          }
          tracker.cushionCount += 1;
          if (!tracker.secondObjectHit) {
            tracker.cushionCountBeforeSecondObject = tracker.cushionCount;
          }
        }
        callbacks?.onCushionBounce?.(bounceX, bounceY, speedBefore, b.sideSpin);
      }
    }

    // 2. 공-공 탄성 충돌 및 밀어치기(Follow) / 끌어치기(Draw) / 스핀 스로우(Throw) 물리 적용
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b1.radius + b2.radius;

        if (dist > 0 && dist < minDist) {
          // nx, ny: b1 중심에서 b2 중심으로 향하는 단위 법선 벡터
          const nx = dx / dist;
          const ny = dy / dist;

          // 겹침 보정 (Positional Correction)
          const overlap = minDist - dist;
          b1.x -= nx * (overlap * 0.52);
          b1.y -= ny * (overlap * 0.52);
          b2.x += nx * (overlap * 0.52);
          b2.y += ny * (overlap * 0.52);

          // 상대 속도 계산
          const rvx = b1.vx - b2.vx;
          const rvy = b1.vy - b2.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal > 0) {
            const prevV1x = b1.vx;
            const prevV1y = b1.vy;
            const prevV2x = b2.vx;
            const prevV2y = b2.vy;

            const impulse = ((1 + BALL_RESTITUTION) * velAlongNormal) / 2;
            b1.vx -= impulse * nx;
            b1.vy -= impulse * ny;
            b2.vx += impulse * nx;
            b2.vy += impulse * ny;

            // 수구의 상하 당점(밀어치기 + / 끌어치기 -) 및 좌우 스핀 처리 헬퍼 (다마수별 물리 계수 연동)
            const applyCueBallSpinAfterImpact = (
              cue: BallState,
              target: BallState,
              inVx: number,
              inVy: number,
              hitNx: number, // 수구 -> 적구 방향 법선
              hitNy: number
            ) => {
              const inSpeed = Math.hypot(inVx, inVy);
              if (inSpeed < 0.25) return;

              const fwdX = cue.forwardDirX ?? inVx / inSpeed;
              const fwdY = cue.forwardDirY ?? inVy / inSpeed;

              // 다마수별 물리 배율 (기본값: 150 다마 동호인 프로필)
              const spinScale = cue.spinScale ?? 0.68;
              const drawScale = cue.drawScale ?? 0.68;
              const followScale = cue.followScale ?? 0.74;
              const profileDriveFrames = cue.driveFrames ?? 15;

              // 두께(Fullness of hit): 정면 충돌이면 1.0, 얇게 스치면 0에 가까움
              const fullness = Math.max(0.15, Math.min(1, fwdX * hitNx + fwdY * hitNy));

              // 충돌 접선 단위 벡터 (수구 분리 방향)
              let sepX = fwdX - (fwdX * hitNx + fwdY * hitNy) * hitNx;
              let sepY = fwdY - (fwdX * hitNx + fwdY * hitNy) * hitNy;
              const sepLen = Math.hypot(sepX, sepY);
              if (sepLen > 0.001) {
                sepX /= sepLen;
                sepY /= sepLen;
              }

              // (A) 좌우 당점(sideSpin)에 의한 충돌 스로우(Throw) 및 회전 보존
              if (Math.abs(cue.sideSpin) > 0.05) {
                const throwTangentX = hitNy;
                const throwTangentY = -hitNx;
                // 수구는 회전 방향으로 미세 가속, 적구는 반대 방향으로 미세 스로우 (다마수 비례)
                const throwMag = cue.sideSpin * spinScale * velAlongNormal * 0.085;
                cue.vx += throwTangentX * throwMag;
                cue.vy += throwTangentY * throwMag;
                target.vx -= throwTangentX * throwMag * 0.35;
                target.vy -= throwTangentY * throwMag * 0.35;
                // 다마수가 높을수록 적구 충돌 후에도 수구 좌우 회전이 더 많이 살아남음
                cue.sideSpin *= 0.76 + Math.min(0.14, spinScale * 0.12);
              }

              // (B) 상하 당점(topBottomSpin)에 의한 밀어치기(Follow) & 끌어치기(Draw)
              const spinY = cue.topBottomSpin;
              if (Math.abs(spinY) > 0.05) {
                if (spinY < 0) {
                  // ================= 끌어치기 (Draw / 히끼) =================
                  const drawStrength = Math.abs(spinY) * drawScale;
                  // 1. 다마수에 비례하는 전진 법선 속도 브레이크 (80~100다마는 살짝 밀리다 멈추고, 150~300다마는 칼같이 제동)
                  const remNormal = cue.vx * hitNx + cue.vy * hitNy;
                  const normalBrake = Math.min(1, 0.55 + drawScale * 0.48);
                  if (remNormal > 0) {
                    cue.vx -= hitNx * remNormal * normalBrake;
                    cue.vy -= hitNy * remNormal * normalBrake;
                  }
                  // 두꺼운 두께로 맞힐수록 횡방향(접선) 잔류 속도도 순간 감속되어 날카로운 역각 형성
                  const tangentBrake = Math.max(0.28, 1 - drawStrength * fullness * 0.60);
                  cue.vx *= tangentBrake;
                  cue.vy *= tangentBrake;

                  // 2. 역회전 방향 벡터: 적구 반대 법선(-hitN) 65% + 원래 큐 진행 반대 방향(-fwd) 35%
                  let pullDirX = -hitNx * 0.65 - fwdX * 0.35;
                  let pullDirY = -hitNy * 0.65 - fwdY * 0.35;
                  const pullLen = Math.hypot(pullDirX, pullDirY) || 1;
                  pullDirX /= pullLen;
                  pullDirY /= pullLen;

                  // 총 끌어치기 속도량 (다마수 drawScale이 직접 반영되어 100 vs 120 vs 150 vs 300 히끼 비거리 차등화)
                  const totalDrawSpeed =
                    drawStrength *
                    Math.max(4.0, inSpeed * (0.46 + 0.38 * fullness));

                  // 즉시 역방향 바이트(45%) + 다마수별 지속 프레임(10~22f) 동안 라사지를 할퀴며 빨려 들어오는 2차 가속(55%)
                  cue.vx += pullDirX * (totalDrawSpeed * 0.45);
                  cue.vy += pullDirY * (totalDrawSpeed * 0.45);

                  const driveFrames = profileDriveFrames;
                  cue.spinDriveFrames = driveFrames;
                  cue.spinDriveVx = (pullDirX * (totalDrawSpeed * 0.55)) / driveFrames;
                  cue.spinDriveVy = (pullDirY * (totalDrawSpeed * 0.55)) / driveFrames;
                } else {
                  // ================= 밀어치기 (Follow / 오시) =================
                  const followStrength = spinY * followScale;
                  // 전진 추진 방향: 원래 큐 진행 방향(fwd) 70% + 충돌 법선(hitN) 30%
                  let pushDirX = fwdX * 0.7 + hitNx * 0.3;
                  let pushDirY = fwdY * 0.7 + hitNy * 0.3;
                  const pushLen = Math.hypot(pushDirX, pushDirY) || 1;
                  pushDirX /= pushLen;
                  pushDirY /= pushLen;

                  const totalFollowSpeed =
                    followStrength *
                    Math.max(3.8, inSpeed * (0.42 + 0.34 * fullness));

                  // 충돌 직후 1차 밀림(40%) + 다마수별 지속 프레임(10~22f) 동안 포물선을 그리며 뻗어 나가는 2차 오시 가속(60%)
                  cue.vx += pushDirX * (totalFollowSpeed * 0.4);
                  cue.vy += pushDirY * (totalFollowSpeed * 0.4);

                  const driveFrames = profileDriveFrames;
                  cue.spinDriveFrames = driveFrames;
                  cue.spinDriveVx = (pushDirX * (totalFollowSpeed * 0.6)) / driveFrames;
                  cue.spinDriveVy = (pushDirY * (totalFollowSpeed * 0.6)) / driveFrames;
                }

                // 제1적구 충돌 후 상하 스핀은 2차 가속 드라이브(spinDrive)로 전환되었으므로 잔량 축소
                cue.topBottomSpin *= 0.25;
              }

              cue.hasHitFirstBall = true;
            };

            if (b1.id === tracker.cueBallId) {
              applyCueBallSpinAfterImpact(b1, b2, prevV1x, prevV1y, nx, ny);
            } else if (b2.id === tracker.cueBallId) {
              applyCueBallSpinAfterImpact(b2, b1, prevV2x, prevV2y, -nx, -ny);
            }

            // 수구 충돌 기록 업데이트
            const registerCueHit = (otherId: BallId) => {
              if (!tracker.hitBalls.has(otherId)) {
                if (!tracker.firstObjectHit) {
                  tracker.firstObjectHit = otherId;
                } else if (!tracker.secondObjectHit && otherId !== tracker.firstObjectHit) {
                  tracker.secondObjectHit = otherId;
                  tracker.cushionCountBeforeSecondObject = tracker.cushionCount;
                }
                tracker.hitBalls.add(otherId);
              }
            };

            if (b1.id === tracker.cueBallId) {
              registerCueHit(b2.id);
            } else if (b2.id === tracker.cueBallId) {
              registerCueHit(b1.id);
            }

            tracker.maxImpactSpeed = Math.max(tracker.maxImpactSpeed, velAlongNormal);
            callbacks?.onBallCollision?.((b1.x + b2.x) * 0.5, (b1.y + b2.y) * 0.5, velAlongNormal);
          }
        }
      }
    }
  }

  // 3. 프레임당 2차 스핀 드라이브(오시/히끼 그립 가속) 및 2단 라사지 마찰 감쇠
  let allStopped = true;
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];

    // 제1적구 충돌 직후 라사지를 움켜쥐며 휘어지는 밀어치기/끌어치기 지속 가속 적용
    if (b.spinDriveFrames && b.spinDriveFrames > 0) {
      // 초반 프레임에 더 강하게 그립이 걸리도록 가중치 부여
      const phaseWeight = 0.65 + (b.spinDriveFrames / 22) * 0.7;
      b.vx += (b.spinDriveVx ?? 0) * phaseWeight;
      b.vy += (b.spinDriveVy ?? 0) * phaseWeight;
      b.spinDriveFrames -= 1;
      if (b.spinDriveFrames <= 0) {
        b.spinDriveVx = 0;
        b.spinDriveVy = 0;
      }
    }

    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 0) {
      // 고속 활주 구간에서는 열선 라사지 특유의 낮은 마찰(0.9934)로 대회전 비거리를 보장하고,
      // 저속 구간에서는 구름 저항 + 미세 선형 감속으로 자연스럽게 멈춤
      const friction = speed > 3.5 ? HIGH_SPEED_FRICTION : ROLLING_FRICTION;
      b.vx *= friction;
      b.vy *= friction;

      if (speed < 2.2) {
        const afterSpeed = Math.max(0, Math.hypot(b.vx, b.vy) - LINEAR_ROLL_DRAG);
        const cur = Math.hypot(b.vx, b.vy) || 1;
        b.vx = (b.vx / cur) * afterSpeed;
        b.vy = (b.vy / cur) * afterSpeed;
      }
    }

    // 회전 보존: 제1적구 충돌 전까지는 상하/좌우 당점이 거의 소멸하지 않고 끝까지 살아있음
    b.sideSpin *= 0.9975;
    b.topBottomSpin *= b.hasHitFirstBall ? 0.96 : 0.9985;

    const finalSpeed = Math.hypot(b.vx, b.vy);
    if (finalSpeed < STOP_SPEED_EPSILON && (!b.spinDriveFrames || b.spinDriveFrames <= 0)) {
      b.vx = 0;
      b.vy = 0;
      b.sideSpin = 0;
      b.topBottomSpin = 0;
    } else {
      if (finalSpeed > 0.1) {
        b.forwardDirX = b.vx / finalSpeed;
        b.forwardDirY = b.vy / finalSpeed;
      }
      allStopped = false;
    }
  }

  return allStopped;
}

/**
 * 모든 공이 멈춘 후 4구 / 3구 규칙에 따른 공식 득점 및 파울 판정
 */
export function evaluateShotResult(
  mode: BilliardsRuleMode,
  tracker: ShotTracker,
  currentScore: number,
  targetScore: number,
  requireThreeCushionFinishInFourBall: boolean = true
): ShotResult {
  const opponentCueId: BallId = tracker.cueBallId === 'cue_white' ? 'cue_yellow' : 'cue_white';

  if (mode === 'four-ball') {
    const hitOpponentCue = tracker.hitBalls.has(opponentCueId);
    const hitRed1 = tracker.hitBalls.has('obj_red1');
    const hitRed2 = tracker.hitBalls.has('obj_red2');

    // 1. 상대 수구(노란공/흰공) 접촉 시 파울 (-10점)
    if (hitOpponentCue) {
      return {
        scored: false,
        foul: true,
        pointsDelta: -10,
        headline: '⚠️ 파울! 상대 수구 접촉 (-10점)',
        subline: '4구 규칙상 상대방의 수구를 맞히면 10점이 감점되고 공격권이 넘어갑니다.',
        shotTypeBadge: 'FOUL',
        cushionCount: tracker.cushionCount,
        isBankShot: false,
      };
    }

    // 2. 적구 2개 모두 적중
    if (hitRed1 && hitRed2) {
      const isFinalPoint = currentScore + 10 >= targetScore;
      if (
        isFinalPoint &&
        requireThreeCushionFinishInFourBall &&
        tracker.cushionCountBeforeSecondObject < 3
      ) {
        return {
          scored: false,
          foul: false,
          pointsDelta: 0,
          headline: `🎯 적구 2개 적중! (마무리 3쿠션 부족: ${tracker.cushionCountBeforeSecondObject}쿠션)`,
          subline: '마지막 다마수는 3쿠션 이상으로 성공해야 최종 승리합니다!',
          shotTypeBadge: 'MISS',
          cushionCount: tracker.cushionCount,
          isBankShot: false,
        };
      }

      const isThreeCushionShot = tracker.cushionCountBeforeSecondObject >= 3;
      return {
        scored: true,
        foul: false,
        pointsDelta: 10,
        headline: isThreeCushionShot
          ? `🔥 4구 3쿠션 예술구 성공! (+10점)`
          : `✨ 나이스 샷! 4구 득점 성공 (+10점)`,
        subline: isThreeCushionShot
          ? `${tracker.cushionCountBeforeSecondObject}쿠션 궤적으로 적구 2개를 완벽하게 공략했습니다!`
          : '적구 2개를 모두 맞혀 연속 공격(이닝 유지)을 이어갑니다!',
        shotTypeBadge: isThreeCushionShot ? 'THREE_CUSHION' : 'NICE_SHOT',
        cushionCount: tracker.cushionCount,
        isBankShot: tracker.firstContactWasCushion && isThreeCushionShot,
      };
    }

    // 3. 1개만 맞히거나 노터치
    return {
      scored: false,
      foul: false,
      pointsDelta: 0,
      headline:
        tracker.hitBalls.size === 1
          ? '💨 아깝습니다! 제2적구 빗나감 (턴 교대)'
          : '💨 노터치 미스 (턴 교대)',
      subline: '두 개의 빨간 적구를 모두 맞혀야 10점을 득점합니다.',
      shotTypeBadge: 'MISS',
      cushionCount: tracker.cushionCount,
      isBankShot: false,
    };
  }

  // ==================== 3구 (Three-Cushion) 판정 ====================
  const hitBothTargets = tracker.hitBalls.size >= 2;
  const validCushions = tracker.cushionCountBeforeSecondObject;
  const isBankShot = tracker.firstContactWasCushion && validCushions >= 3 && hitBothTargets;

  if (hitBothTargets && validCushions >= 3) {
    const pts = isBankShot ? 2 : 1;
    return {
      scored: true,
      foul: false,
      pointsDelta: pts,
      headline: isBankShot
        ? `👑 쓰리뱅크(Bank Shot) 대성공! (+${pts}점)`
        : `🎱 정통 ${validCushions}쿠션 득점 성공! (+${pts}점)`,
      subline: isBankShot
        ? `쿠션을 먼저 때려 ${validCushions}쿠션으로 제1·2적구를 완벽히 제압했습니다!`
        : `제2적구 접촉 전 ${validCushions}쿠션을 달성하여 이닝을 이어갑니다!`,
      shotTypeBadge: isBankShot ? 'BANK_SHOT' : 'THREE_CUSHION',
      cushionCount: validCushions,
      isBankShot,
    };
  }

  if (hitBothTargets && validCushions < 3) {
    return {
      scored: false,
      foul: false,
      pointsDelta: 0,
      headline: `📐 쿠션 수 부족 (${validCushions}/3 쿠션) — 노카운트`,
      subline: '3구(3쿠션)에서는 두 번째 공에 맞기 전 최소 3회 이상 쿠션에 닿아야 득점됩니다.',
      shotTypeBadge: 'MISS',
      cushionCount: validCushions,
      isBankShot: false,
    };
  }

  return {
    scored: false,
    foul: false,
    pointsDelta: 0,
    headline: '💨 아슬아슬하게 빗나갔습니다 (턴 교대)',
    subline: `현재 쿠션 ${tracker.cushionCount}회 · 당점과 두께를 미세 조정해 보세요.`,
    shotTypeBadge: 'MISS',
    cushionCount: tracker.cushionCount,
    isBankShot: false,
  };
}

/**
 * 실시간 고스트볼(Ghost Ball) 조준선 & 분리각(밀어치기 곡선 / 끌어치기 역주행 / 히네리 반사각) 예측선 계산
 * - 다마수(playerDama)에 따라 초록색 분리각/쿠션 반사 가이드라인의 휘어짐 정도와 반사각이 실시간으로 달라짐
 */
export function computeAimPrediction(
  balls: BallState[],
  cueBallId: BallId,
  aimAngleRad: number,
  spin: SpinOffset,
  playerDama: SkillDama = 150
): AimPrediction | null {
  const cueBall = balls.find((b) => b.id === cueBallId);
  if (!cueBall) return null;

  const profile = getSkillProfile(playerDama);
  const dirX = Math.cos(aimAngleRad);
  const dirY = Math.sin(aimAngleRad);
  const r = cueBall.radius;

  let minT = Infinity;
  let hitBall: BallState | null = null;

  // 1. 다른 공과의 최근접 구체 충돌 거리(t) 계산
  for (const other of balls) {
    if (other.id === cueBallId) continue;
    const ocX = other.x - cueBall.x;
    const ocY = other.y - cueBall.y;
    const proj = ocX * dirX + ocY * dirY;
    if (proj <= 0) continue;

    const perpSq = ocX * ocX + ocY * ocY - proj * proj;
    const sumR = r + other.radius;
    if (perpSq < sumR * sumR) {
      const thc = Math.sqrt(sumR * sumR - perpSq);
      const t = proj - thc;
      if (t > 0 && t < minT) {
        minT = t;
        hitBall = other;
      }
    }
  }

  // 2. 4면 쿠션과의 충돌 거리(t) 계산
  let hitNormal: { nx: number; ny: number } | null = null;
  const checkWall = (tVal: number, nx: number, ny: number) => {
    if (tVal > 0 && tVal < minT) {
      minT = tVal;
      hitBall = null;
      hitNormal = { nx, ny };
    }
  };

  if (dirX > 0.0001) checkWall((TABLE_WIDTH - r - cueBall.x) / dirX, -1, 0);
  if (dirX < -0.0001) checkWall((r - cueBall.x) / dirX, 1, 0);
  if (dirY > 0.0001) checkWall((TABLE_HEIGHT - r - cueBall.y) / dirY, 0, -1);
  if (dirY < -0.0001) checkWall((r - cueBall.y) / dirY, 0, 1);

  if (!Number.isFinite(minT)) return null;

  const impactX = cueBall.x + dirX * minT;
  const impactY = cueBall.y + dirY * minT;

  if (hitBall) {
    // 적구 진행 방향 법선 벡터
    const nx = (hitBall.x - impactX) / (r + hitBall.radius);
    const ny = (hitBall.y - impactY) / (r + hitBall.radius);
    const fullness = Math.max(0.15, Math.min(1, dirX * nx + dirY * ny));

    // 기본 90도 분리각 접선 벡터
    let tx = dirX - (dirX * nx + dirY * ny) * nx;
    let ty = dirY - (dirX * nx + dirY * ny) * ny;
    const tLen = Math.hypot(tx, ty);
    if (tLen > 0.001) {
      tx /= tLen;
      ty /= tLen;
    }

    // 다마수별 좌우 스핀에 의한 미세 스로우 방향
    const throwTx = ny * spin.x * profile.spinScale * 0.14;
    const throwTy = -nx * spin.x * profile.spinScale * 0.14;

    // 상하 당점(밀어치기 +y / 끌어치기 -y) 및 다마수(drawScale/followScale)에 따른 수구 2차 분리 방향
    let finalDirX: number;
    let finalDirY: number;

    if (spin.y < -0.05) {
      // 끌어치기(Draw): 다마수(drawScale)가 높을수록 역방향으로 날카롭게 꺾여 들어감
      const drawAmt = Math.abs(spin.y) * profile.drawScale;
      const pullX = -nx * 0.65 - dirX * 0.35;
      const pullY = -ny * 0.65 - dirY * 0.35;
      const tangentKeep = (1 - fullness * 0.72) * (1 - drawAmt * 0.45);
      finalDirX = tx * tangentKeep + pullX * drawAmt * 1.35 + throwTx;
      finalDirY = ty * tangentKeep + pullY * drawAmt * 1.35 + throwTy;
    } else if (spin.y > 0.05) {
      // 밀어치기(Follow): 다마수(followScale)가 높을수록 전진 포물선이 깊게 형성됨
      const followAmt = spin.y * profile.followScale;
      const pushX = dirX * 0.72 + nx * 0.28;
      const pushY = dirY * 0.72 + ny * 0.28;
      finalDirX = tx * (1 - followAmt * 0.45) + pushX * followAmt * 1.25 + throwTx;
      finalDirY = ty * (1 - followAmt * 0.45) + pushY * followAmt * 1.25 + throwTy;
    } else {
      // 중점(Stun Shot): 정통 90도 분리선 (정면 두께일수록 스톱샷)
      finalDirX = tx * (1.05 - fullness * 0.75) + throwTx;
      finalDirY = ty * (1.05 - fullness * 0.75) + throwTy;
    }

    const dLen = Math.hypot(finalDirX, finalDirY) || 1;
    const guideLength = Math.round(85 + profile.spinScale * 30);
    const endX = impactX + (finalDirX / dLen) * guideLength;
    const endY = impactY + (finalDirY / dLen) * guideLength;

    // 초기 접선 방향에서 최종 오시/히끼 방향으로 휘어지는 2차 베지어 곡선 샘플링 포인트 생성
    const ctrlDist = 38 * (1 - fullness * 0.55);
    const ctrlX = impactX + (tx + throwTx) * ctrlDist;
    const ctrlY = impactY + (ty + throwTy) * ctrlDist;
    const cueCurvePoints: Array<{ x: number; y: number }> = [];
    const steps = 10;
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const inv = 1 - u;
      cueCurvePoints.push({
        x: inv * inv * impactX + 2 * inv * u * ctrlX + u * u * endX,
        y: inv * inv * impactY + 2 * inv * u * ctrlY + u * u * endY,
      });
    }

    return {
      cueStart: { x: cueBall.x, y: cueBall.y },
      impactPoint: { x: impactX, y: impactY },
      hitBallId: hitBall.id,
      hitCushionNormal: null,
      cueDeflectEnd: { x: endX, y: endY },
      cueCurvePoints,
      targetBallEnd: {
        x: hitBall.x + nx * 115,
        y: hitBall.y + ny * 115,
      },
    };
  }

  // 쿠션 직격(뱅크샷) 시 다마수(spinScale)가 반영된 법선-접선(t = (ny, -nx)) 스핀 반사각 예측
  const n = hitNormal || { nx: 0, ny: 1 };
  const tx = n.ny;
  const ty = -n.nx;
  const vn = dirX * n.nx + dirY * n.ny;
  const vt = dirX * tx + dirY * ty;

  const newVn = Math.abs(vn) * CUSHION_RESTITUTION;
  const isRunning = vt * spin.x >= 0;
  const spinKick = spin.x * profile.spinScale * (0.48 + Math.abs(vn) * 0.24);
  const newVt = isRunning
    ? vt * 0.92 + spinKick
    : vt * (0.76 - 0.10 * profile.spinScale) + spinKick * 1.12;

  const rx = n.nx * newVn + tx * newVt;
  const ry = n.ny * newVn + ty * newVt;
  const rLen = Math.hypot(rx, ry) || 1;

  return {
    cueStart: { x: cueBall.x, y: cueBall.y },
    impactPoint: { x: impactX, y: impactY },
    hitBallId: null,
    hitCushionNormal: n,
    cueDeflectEnd: {
      x: impactX + (rx / rLen) * 145,
      y: impactY + (ry / rLen) * 145,
    },
    targetBallEnd: null,
  };
}

/**
 * 원클릭 체험 & 마케팅 2단계 캡처용 정밀 묘수 프리셋 (`data-screenshot-click="action"`)
 */
export const TRICK_SHOT_PRESETS: TrickShotPreset[] = [
  {
    id: 'four-ball-sweet',
    label: '4구 모아치기 정석',
    badge: '150다마 정석 +10점',
    ruleMode: 'four-ball',
    desc: '제1적구를 맞힌 뒤 상단 밀어치기(오시) 추진력으로 제2적구까지 연달아 관통하는 4구 정석 배치',
    aimAngleDeg: 0,
    power: 48,
    spin: { x: 0.1, y: 0.65 },
    recommendedDama: 150,
    balls: [
      { id: 'cue_white', x: 140, y: 150 },
      { id: 'obj_red1', x: 300, y: 150 },
      { id: 'obj_red2', x: 460, y: 150 },
      { id: 'cue_yellow', x: 140, y: 55 },
    ],
  },
  {
    id: 'three-cushion-bank',
    label: '3구 대회전 뱅크 묘수',
    badge: '300다마 뱅크샷 +2점',
    ruleMode: 'three-cushion',
    desc: '300다마 고수의 우측 히네리(정회전)로 다이 한 바퀴(3쿠션)를 크게 돌아 적구 2개를 연달아 맞히는 배치',
    aimAngleDeg: -52,
    power: 85,
    spin: { x: 0.85, y: 0.35 },
    recommendedDama: 300,
    balls: [
      { id: 'cue_white', x: 115, y: 225 },
      { id: 'obj_red1', x: 400, y: 196 },
      { id: 'cue_yellow', x: 368, y: 215 },
    ],
  },
  {
    id: 'four-ball-draw',
    label: '4구 강력 끌어치기(히끼)',
    badge: '300다마 히끼 +10점',
    ruleMode: 'four-ball',
    desc: '300다마 고수의 하단 당점(Draw)으로 앞쪽 적구 타격 후 수구를 뒤로 쫙 끌어당겨 등 뒤의 제2적구를 맞히는 기술',
    aimAngleDeg: 0,
    power: 68,
    spin: { x: 0, y: -0.9 },
    recommendedDama: 300,
    balls: [
      { id: 'cue_white', x: 250, y: 150 },
      { id: 'obj_red1', x: 410, y: 150 },
      { id: 'obj_red2', x: 115, y: 150 },
      { id: 'cue_yellow', x: 300, y: 50 },
    ],
  },
];
