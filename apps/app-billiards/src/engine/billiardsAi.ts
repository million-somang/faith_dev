import {
  AiDifficulty,
  BallId,
  BallState,
  BilliardsRuleMode,
  SpinOffset,
} from '../types/billiards';
import {
  aiDifficultyToDama,
  createShotTracker,
  getSkillProfile,
  stepPhysicsFrame,
} from './physicsEngine';

export interface AiShotDecision {
  aimAngleDeg: number;
  power: number;
  spin: SpinOffset;
  comment: string;
}

const AI_COMMENTS: Record<AiDifficulty, { hit: string[]; normal: string[] }> = {
  dama80: {
    hit: ['어라? 이게 들어가네! 🎱', '두께가 우연히 딱 맞았네요!'],
    normal: ['음, 각도가 조금 어렵네요...', '정직하게 두껍게 쳐보겠습니다!'],
  },
  dama100: {
    hit: ['기본 밀어치기로 가볍게 득점합니다!', '100다마 탈출 각이 보입니다!'],
    normal: ['무리한 회전 대신 두께 위주로 갑니다.', '초크 한 번 바르고 칠게요!'],
  },
  dama120: {
    hit: ['부드러운 분리각으로 연결했습니다!', '안정적인 중거리 샷 성공!'],
    normal: ['얇게 걸어치기로 풀어보겠습니다.', '힘 조절에 집중해 볼게요.'],
  },
  dama150: {
    hit: ['동호인 정석 히끼·오시 각이네요!', '이번 배치는 자신 있습니다!'],
    normal: ['수비와 공격을 겸해 침착하게 갑니다.', '적당한 2팁 회전으로 진입합니다.'],
  },
  dama200: {
    hit: ['상급자 3쿠션 라인을 정확히 짚었습니다!', '날카로운 끌어치기 각이네요!'],
    normal: ['회전량을 살려 제2적구를 노려봅니다.', '대회전 각도를 계산 중입니다.'],
  },
  dama300: {
    hit: ['파이브 앤 하프 시스템 각이 완벽합니다!', '300다마 고수의 손목 스냅을 보여드리죠!'],
    normal: ['까다로운 배치군요. 강한 히네리로 풀어봅니다.', '당점 극한으로 깊게 꺾어 치겠습니다.'],
  },
  master: {
    hit: ['완벽한 분리각과 3쿠션 라인을 계산했습니다. 👑', '프로 챔피언의 스트로크를 보여드리죠!'],
    normal: ['이 각도는 대회전 뱅크샷이 정석입니다.', '오차 없는 스트로크로 마무리하겠습니다.'],
  },
};

/**
 * AI가 현재 테이블의 공 배치를 고속 시뮬레이션(Fast-Forward Rollout)하여
 * 다마수(실력 등급)에 맞는 최적의 조준각, 파워, 당점을 찾아냅니다.
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

  const aiDama = aiDifficultyToDama(difficulty);
  const profile = getSkillProfile(aiDama);

  // 다마수별 탐색 밀도 및 조준 오차(Jitter) 범위
  const sampleCount =
    aiDama >= 500
      ? 72
      : aiDama >= 300
      ? 54
      : aiDama >= 200
      ? 40
      : aiDama >= 150
      ? 30
      : aiDama >= 120
      ? 24
      : aiDama >= 100
      ? 18
      : 14;

  const angleJitter =
    aiDama >= 500
      ? 0.18
      : aiDama >= 300
      ? 0.75
      : aiDama >= 200
      ? 1.5
      : aiDama >= 150
      ? 2.4
      : aiDama >= 120
      ? 3.4
      : aiDama >= 100
      ? 4.5
      : 6.0;

  const comments = AI_COMMENTS[difficulty] ?? AI_COMMENTS.dama150;

  let bestScore = -999;
  let bestDecision: AiShotDecision = {
    aimAngleDeg: defaultAngle,
    power: 60,
    spin: { x: 0.2, y: 0.2 },
    comment: comments.normal[0],
  };

  const opponentCueId: BallId = cueBallId === 'cue_white' ? 'cue_yellow' : 'cue_white';
  // AI도 자신의 다마수에 허용된 당점 한계(maxTipOffset) 내에서만 당점을 구사함
  const maxSpin = profile.maxTipOffset * 0.75;

  for (let i = 0; i < sampleCount; i++) {
    let testAngleDeg: number;
    if (i < sampleCount * 0.65) {
      const offset = (i / (sampleCount * 0.65) - 0.5) * 70;
      testAngleDeg = defaultAngle + offset;
    } else {
      testAngleDeg = (i * 360) / sampleCount - 180;
    }

    const power = mode === 'three-cushion' ? 72 + (i % 3) * 10 : 48 + (i % 4) * 12;
    const spin: SpinOffset =
      i % 3 === 0
        ? { x: Number((maxSpin * 0.7).toFixed(2)), y: Number((maxSpin * 0.6).toFixed(2)) }
        : i % 3 === 1
        ? { x: Number((-maxSpin * 0.7).toFixed(2)), y: Number((maxSpin * 0.5).toFixed(2)) }
        : { x: 0, y: Number((-maxSpin * 0.8).toFixed(2)) };

    // 가상 클론 시뮬레이션 (AI 다마수 물리 프로필 동일 적용)
    const simBalls: BallState[] = balls.map((b) => ({ ...b }));
    const simCue = simBalls.find((b) => b.id === cueBallId);
    if (!simCue) continue;

    const rad = (testAngleDeg * Math.PI) / 180;
    const topSpinBoost = spin.y > 0 ? 1 + spin.y * 0.08 * profile.followScale : 1;
    const speed = (power / 100) * 28.5 * profile.powerScale * topSpinBoost;
    const dirX = Math.cos(rad);
    const dirY = Math.sin(rad);
    simCue.vx = dirX * speed;
    simCue.vy = dirY * speed;
    simCue.forwardDirX = dirX;
    simCue.forwardDirY = dirY;
    simCue.sideSpin = spin.x;
    simCue.topBottomSpin = spin.y;
    simCue.spinScale = profile.spinScale;
    simCue.drawScale = profile.drawScale;
    simCue.followScale = profile.followScale;
    simCue.driveFrames = profile.driveFrames;
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
      const lines = evalScore >= 180 ? comments.hit : comments.normal;
      bestDecision = {
        aimAngleDeg: testAngleDeg + (Math.random() - 0.5) * angleJitter,
        power,
        spin,
        comment: lines[Math.floor(Math.random() * lines.length)],
      };
      if (evalScore >= 200 && aiDama >= 150) break;
    }
  }

  return bestDecision;
}
