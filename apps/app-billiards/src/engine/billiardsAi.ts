import {
  AiDifficulty,
  BallId,
  BallState,
  BilliardsRuleMode,
  SpinOffset,
} from '../types/billiards';
import { createShotTracker, stepPhysicsFrame } from './physicsEngine';

export interface AiShotDecision {
  aimAngleDeg: number;
  power: number;
  spin: SpinOffset;
  comment: string;
}

const AI_COMMENTS: Record<AiDifficulty, { hit: string[]; normal: string[] }> = {
  beginner: {
    hit: ['어라? 이게 들어가네! 🎱', '두께가 딱 맞았네요!'],
    normal: ['음, 각도가 조금 어렵네요...', '초크 한 번 바르고 가겠습니다!'],
  },
  amateur: {
    hit: ['부드러운 밀어치기로 득점 노려봅니다!', '이번 각은 자신 있습니다!'],
    normal: ['수비 위주로 얇게 쳐볼게요.', '힘 조절이 핵심이죠!'],
  },
  pro: {
    hit: ['파이브 앤 하프 시스템 각이 보입니다.', '회전량을 살려 정확히 공략하겠습니다.'],
    normal: ['까다로운 공 배치군요. 정교하게 풀어보겠습니다.', '당점 2팁으로 진입합니다.'],
  },
  master: {
    hit: ['완벽한 분리각과 3쿠션 라인을 계산했습니다. 👑', '프로 챔피언의 스트로크를 보여드리죠!'],
    normal: ['이 각도는 대회전 뱅크샷이 정석입니다.', '오차 없는 스트로크로 마무리하겠습니다.'],
  },
};

/**
 * AI가 현재 테이블의 공 배치를 고속 시뮬레이션(Fast-Forward Rollout)하여
 * 난이도에 맞는 최적의 조준각, 파워, 당점을 찾아냅니다.
 */
export function findBestAiShot(
  balls: BallState[],
  cueBallId: BallId,
  mode: BilliardsRuleMode,
  difficulty: AiDifficulty
): AiShotDecision {
  const cueBall = balls.find((b) => b.id === cueBallId);
  const red1 = balls.find((b) => b.id === 'obj_red1');

  const defaultAngle =
    cueBall && red1
      ? (Math.atan2(red1.y - cueBall.y, red1.x - cueBall.x) * 180) / Math.PI
      : 0;

  // 난이도별 탐색 밀도 및 오차 범위
  const sampleCount =
    difficulty === 'master'
      ? 72
      : difficulty === 'pro'
      ? 48
      : difficulty === 'amateur'
      ? 28
      : 16;

  const angleJitter =
    difficulty === 'master'
      ? 0.2
      : difficulty === 'pro'
      ? 1.1
      : difficulty === 'amateur'
      ? 2.8
      : 5.5;

  let bestScore = -999;
  let bestDecision: AiShotDecision = {
    aimAngleDeg: defaultAngle,
    power: 62,
    spin: { x: 0.2, y: 0.2 },
    comment: AI_COMMENTS[difficulty].normal[0],
  };

  const opponentCueId: BallId = cueBallId === 'cue_white' ? 'cue_yellow' : 'cue_white';

  for (let i = 0; i < sampleCount; i++) {
    // 첫 절반은 제1적구 주변 각도 집중 탐색, 나머지는 360도 전방위 탐색
    let testAngleDeg: number;
    if (i < sampleCount * 0.65) {
      const offset = ((i / (sampleCount * 0.65)) - 0.5) * 70;
      testAngleDeg = defaultAngle + offset;
    } else {
      testAngleDeg = (i * 360) / sampleCount - 180;
    }

    const power = mode === 'three-cushion' ? 75 + (i % 3) * 10 : 48 + (i % 4) * 12;
    const spin: SpinOffset =
      i % 3 === 0
        ? { x: 0.45, y: 0.4 }
        : i % 3 === 1
        ? { x: -0.45, y: 0.35 }
        : { x: 0, y: -0.5 };

    // 가상 클론 시뮬레이션
    const simBalls: BallState[] = balls.map((b) => ({ ...b }));
    const simCue = simBalls.find((b) => b.id === cueBallId);
    if (!simCue) continue;

    const rad = (testAngleDeg * Math.PI) / 180;
    const topSpinBoost = spin.y > 0 ? 1 + spin.y * 0.08 : 1;
    const speed = (power / 100) * 28.5 * topSpinBoost;
    const dirX = Math.cos(rad);
    const dirY = Math.sin(rad);
    simCue.vx = dirX * speed;
    simCue.vy = dirY * speed;
    simCue.forwardDirX = dirX;
    simCue.forwardDirY = dirY;
    simCue.sideSpin = spin.x;
    simCue.topBottomSpin = spin.y;
    simCue.hasHitFirstBall = false;
    simCue.spinDriveFrames = 0;

    const tracker = createShotTracker(cueBallId);
    for (let step = 0; step < 260; step++) {
      const stopped = stepPhysicsFrame(simBalls, tracker);
      if (stopped) break;
    }

    let evalScore = 0;
    if (mode === 'four-ball') {
      const hitOpp = tracker.hitBalls.has(opponentCueId);
      const hitR1 = tracker.hitBalls.has('obj_red1');
      const hitR2 = tracker.hitBalls.has('obj_red2');
      if (hitOpp) {
        evalScore -= 100;
      } else if (hitR1 && hitR2) {
        evalScore += 200 + tracker.cushionCount * 5;
      } else if (hitR1 || hitR2) {
        evalScore += 40;
      }
    } else {
      const hitBoth = tracker.hitBalls.size >= 2;
      if (hitBoth && tracker.cushionCountBeforeSecondObject >= 3) {
        evalScore += 250;
      } else if (hitBoth) {
        evalScore += 45 + tracker.cushionCountBeforeSecondObject * 25;
      } else if (tracker.hitBalls.size === 1) {
        evalScore += 15 + tracker.cushionCount * 8;
      }
    }

    if (evalScore > bestScore) {
      bestScore = evalScore;
      const lines = evalScore >= 180 ? AI_COMMENTS[difficulty].hit : AI_COMMENTS[difficulty].normal;
      bestDecision = {
        aimAngleDeg: testAngleDeg + (Math.random() - 0.5) * angleJitter,
        power,
        spin,
        comment: lines[Math.floor(Math.random() * lines.length)],
      };
      if (evalScore >= 200 && difficulty !== 'beginner') break;
    }
  }

  return bestDecision;
}
