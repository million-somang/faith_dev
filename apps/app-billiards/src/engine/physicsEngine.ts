import {
  AimPrediction,
  BallId,
  BallState,
  BilliardsRuleMode,
  ShotResult,
  ShotTracker,
  SpinOffset,
  TrickShotPreset,
} from '../types/billiards';

/** 논리 당구대 내경(라사지) 규격: 국제 정통 캐럼 2:1 비율 */
export const TABLE_WIDTH = 600;
export const TABLE_HEIGHT = 300;
export const BALL_RADIUS = 12;

const SUB_STEPS = 6;
const BALL_RESTITUTION = 0.95;
const CUSHION_RESTITUTION = 0.84;
const FRICTION_PER_FRAME = 0.9865;
const STOP_SPEED_EPSILON = 0.045;

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
 * 1프레임 물리 시뮬레이션 (서브스텝 6회 분할 적분)
 * @returns 모든 공이 정지했는지 여부 (boolean)
 */
export function stepPhysicsFrame(
  balls: BallState[],
  tracker: ShotTracker,
  callbacks?: StepCallbacks
): boolean {
  const dt = 1 / SUB_STEPS;

  for (let s = 0; s < SUB_STEPS; s++) {
    // 1. 위치 적분 및 쿠션 반사 검사
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // 회전 시각화 위상 업데이트
      b.rollAngleX += (b.vx * dt) / b.radius;
      b.rollAngleY += (b.vy * dt) / b.radius;

      const r = b.radius;
      let hitCushion = false;
      let bounceX = b.x;
      let bounceY = b.y;
      const speedBefore = Math.hypot(b.vx, b.vy);

      // 좌측 쿠션
      if (b.x < r) {
        b.x = r;
        b.vx = Math.abs(b.vx) * CUSHION_RESTITUTION;
        // 좌측 쿠션 충돌 시 우회전(+)은 위(-y), 좌회전(-)은 아래(+y)로 반사각 변화
        b.vy -= b.sideSpin * Math.max(1.2, speedBefore * 0.34);
        b.sideSpin *= 0.72;
        hitCushion = true;
        bounceX = 0;
      } else if (b.x > TABLE_WIDTH - r) {
        // 우측 쿠션
        b.x = TABLE_WIDTH - r;
        b.vx = -Math.abs(b.vx) * CUSHION_RESTITUTION;
        b.vy += b.sideSpin * Math.max(1.2, speedBefore * 0.34);
        b.sideSpin *= 0.72;
        hitCushion = true;
        bounceX = TABLE_WIDTH;
      }

      // 상단 쿠션
      if (b.y < r) {
        b.y = r;
        b.vy = Math.abs(b.vy) * CUSHION_RESTITUTION;
        b.vx += b.sideSpin * Math.max(1.2, speedBefore * 0.34);
        b.sideSpin *= 0.72;
        hitCushion = true;
        bounceY = 0;
      } else if (b.y > TABLE_HEIGHT - r) {
        // 하단 쿠션
        b.y = TABLE_HEIGHT - r;
        b.vy = -Math.abs(b.vy) * CUSHION_RESTITUTION;
        b.vx -= b.sideSpin * Math.max(1.2, speedBefore * 0.34);
        b.sideSpin *= 0.72;
        hitCushion = true;
        bounceY = TABLE_HEIGHT;
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

    // 2. 공-공 탄성 충돌 및 밀어치기/끌어치기(topBottomSpin) 물리 적용
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b1.radius + b2.radius;

        if (dist > 0 && dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;

          // 겹침 보정 (Positional Correction)
          const overlap = minDist - dist;
          b1.x -= nx * (overlap * 0.5);
          b1.y -= ny * (overlap * 0.5);
          b2.x += nx * (overlap * 0.5);
          b2.y += ny * (overlap * 0.5);

          // 상대 속도 계산
          const rvx = b1.vx - b2.vx;
          const rvy = b1.vy - b2.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal > 0) {
            const impulse = ((1 + BALL_RESTITUTION) * velAlongNormal) / 2;
            const prevV1x = b1.vx;
            const prevV1y = b1.vy;
            const prevV2x = b2.vx;
            const prevV2y = b2.vy;

            b1.vx -= impulse * nx;
            b1.vy -= impulse * ny;
            b2.vx += impulse * nx;
            b2.vy += impulse * ny;

            // 수구의 상하 당점(밀어치기 + / 끌어치기 -) 반영
            if (b1.id === tracker.cueBallId && Math.abs(b1.topBottomSpin) > 0.05) {
              const spinPower = b1.topBottomSpin * Math.min(4.8, velAlongNormal * 0.42);
              const speed1 = Math.hypot(prevV1x, prevV1y) || 1;
              const fwdX = prevV1x / speed1;
              const fwdY = prevV1y / speed1;
              if (b1.topBottomSpin > 0) {
                // 밀어치기(Follow): 원래 수구 전진 방향과 충돌 법선 방향으로 전진 가속
                b1.vx += (fwdX * 0.65 + nx * 0.35) * spinPower;
                b1.vy += (fwdY * 0.65 + ny * 0.35) * spinPower;
              } else {
                // 끌어치기(Draw): 충돌 법선 반대 방향으로 강하게 역주행
                b1.vx += nx * spinPower * 0.95;
                b1.vy += ny * spinPower * 0.95;
              }
              b1.topBottomSpin *= 0.35;
            } else if (b2.id === tracker.cueBallId && Math.abs(b2.topBottomSpin) > 0.05) {
              const spinPower = b2.topBottomSpin * Math.min(4.8, velAlongNormal * 0.42);
              const speed2 = Math.hypot(prevV2x, prevV2y) || 1;
              const fwdX = prevV2x / speed2;
              const fwdY = prevV2y / speed2;
              if (b2.topBottomSpin > 0) {
                b2.vx += (fwdX * 0.65 - nx * 0.35) * spinPower;
                b2.vy += (fwdY * 0.65 - ny * 0.35) * spinPower;
              } else {
                b2.vx -= nx * spinPower * 0.95;
                b2.vy -= ny * spinPower * 0.95;
              }
              b2.topBottomSpin *= 0.35;
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

  // 3. 프레임당 라사지 마찰 감쇠 및 정지 판정
  let allStopped = true;
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    b.vx *= FRICTION_PER_FRAME;
    b.vy *= FRICTION_PER_FRAME;
    b.sideSpin *= 0.992;
    b.topBottomSpin *= 0.988;

    if (Math.hypot(b.vx, b.vy) < STOP_SPEED_EPSILON) {
      b.vx = 0;
      b.vy = 0;
      b.sideSpin = 0;
      b.topBottomSpin = 0;
    } else {
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
 * 실시간 고스트볼(Ghost Ball) 조준선 & 분리각(밀어치기/끌어치기/스핀) 예측선 계산
 */
export function computeAimPrediction(
  balls: BallState[],
  cueBallId: BallId,
  aimAngleRad: number,
  spin: SpinOffset
): AimPrediction | null {
  const cueBall = balls.find((b) => b.id === cueBallId);
  if (!cueBall) return null;

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

    // 기본 90도 분리각 접선 벡터
    let tx = dirX - (dirX * nx + dirY * ny) * nx;
    let ty = dirY - (dirX * nx + dirY * ny) * ny;
    const tLen = Math.hypot(tx, ty) || 1;
    tx /= tLen;
    ty /= tLen;

    // 상하 당점(밀어치기 +y / 끌어치기 -y)에 따른 수구 분리각 변화 반영
    const spinInfluence = spin.y * 0.55;
    const deflectDirX = tx * 0.75 + (spin.y >= 0 ? dirX : -nx) * Math.abs(spinInfluence);
    const deflectDirY = ty * 0.75 + (spin.y >= 0 ? dirY : -ny) * Math.abs(spinInfluence);
    const dLen = Math.hypot(deflectDirX, deflectDirY) || 1;

    return {
      cueStart: { x: cueBall.x, y: cueBall.y },
      impactPoint: { x: impactX, y: impactY },
      hitBallId: hitBall.id,
      hitCushionNormal: null,
      cueDeflectEnd: {
        x: impactX + (deflectDirX / dLen) * 95,
        y: impactY + (deflectDirY / dLen) * 95,
      },
      targetBallEnd: {
        x: hitBall.x + nx * 105,
        y: hitBall.y + ny * 105,
      },
    };
  }

  // 쿠션 직격(뱅크샷) 시 입사각-반사각 + 좌우 스핀(sideSpin) 변화 예측선
  const n = hitNormal || { nx: 0, ny: 1 };
  const dot = dirX * n.nx + dirY * n.ny;
  let rx = dirX - 2 * dot * n.nx;
  let ry = dirY - 2 * dot * n.ny;

  // 좌우 당점(sideSpin)에 의한 반사각 굴절 반영
  const tangentX = -n.ny;
  const tangentY = n.nx;
  rx += tangentX * spin.x * 0.38;
  ry += tangentY * spin.x * 0.38;
  const rLen = Math.hypot(rx, ry) || 1;

  return {
    cueStart: { x: cueBall.x, y: cueBall.y },
    impactPoint: { x: impactX, y: impactY },
    hitBallId: null,
    hitCushionNormal: n,
    cueDeflectEnd: {
      x: impactX + (rx / rLen) * 125,
      y: impactY + (ry / rLen) * 125,
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
    badge: '4구 +10점 확정',
    ruleMode: 'four-ball',
    desc: '제1적구를 얇게 맞혀 부드러운 밀어치기로 제2적구까지 연달아 득점하는 4구 정석 배치',
    aimAngleDeg: 0,
    power: 52,
    spin: { x: 0.15, y: 0.45 },
    balls: [
      { id: 'cue_white', x: 140, y: 150 },
      { id: 'obj_red1', x: 300, y: 150 },
      { id: 'obj_red2', x: 460, y: 150 },
      { id: 'cue_yellow', x: 140, y: 55 },
    ],
  },
  {
    id: 'three-cushion-bank',
    label: '3구 쓰리뱅크 묘수',
    badge: '3구 뱅크샷 +2점',
    ruleMode: 'three-cushion',
    desc: '상단-하단-상단 3쿠션 뱅크샷 후 적구 2개를 관통하는 프로 당구 하이라이트 배치',
    aimAngleDeg: -58,
    power: 88,
    spin: { x: 0.65, y: 0.35 },
    balls: [
      { id: 'cue_white', x: 120, y: 230 },
      { id: 'obj_red1', x: 425, y: 145 },
      { id: 'cue_yellow', x: 470, y: 195 },
    ],
  },
  {
    id: 'four-ball-draw',
    label: '4구 끌어치기(히끼)',
    badge: '강력 하단 당점',
    ruleMode: 'four-ball',
    desc: '하단 당점(Draw)으로 제1적구 타격 후 수구를 뒤로 끌어당겨 뒤쪽 적구를 맞히는 기술',
    aimAngleDeg: 0,
    power: 68,
    spin: { x: 0, y: -0.85 },
    balls: [
      { id: 'cue_white', x: 250, y: 150 },
      { id: 'obj_red1', x: 410, y: 150 },
      { id: 'obj_red2', x: 115, y: 150 },
      { id: 'cue_yellow', x: 300, y: 50 },
    ],
  },
];
