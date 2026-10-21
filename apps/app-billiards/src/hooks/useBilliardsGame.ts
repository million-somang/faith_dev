import { useState, useRef, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  AiDifficulty,
  AimPrediction,
  BallId,
  BallState,
  BilliardsRuleMode,
  ImpactEffect,
  InningRecord,
  MatchType,
  ShotResult,
  ShotTracker,
  SkillDama,
  SpinOffset,
  TrickShotPreset,
} from '../types/billiards';
import {
  aiDifficultyToDama,
  computeAimPrediction,
  createInitialBalls,
  createShotTracker,
  evaluateShotResult,
  getSkillProfile,
  stepPhysicsFrame,
  TRICK_SHOT_PRESETS,
} from '../engine/physicsEngine';
import { findBestAiShot } from '../engine/billiardsAi';
import { sound } from '../utils/sound';

export type ClothTheme = 'royal-blue' | 'emerald-green';

export function useBilliardsGame() {
  // 게임 설정 상태
  const [ruleMode, setRuleMode] = useState<BilliardsRuleMode>('four-ball');
  const [matchType, setMatchType] = useState<MatchType>('ai');
  const [playerDama, setPlayerDama] = useState<SkillDama>(150);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('dama150');
  const [targetScore, setTargetScore] = useState<number>(50); // 4구 기본 50다마, 3구 기본 5점
  const [requireThreeCushionFinish, setRequireThreeCushionFinish] = useState<boolean>(true);
  const [clothTheme, setClothTheme] = useState<ClothTheme>('royal-blue');

  // 경기 진행 상태
  const [balls, setBalls] = useState<BallState[]>(() => createInitialBalls('four-ball'));
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1); // 1: 플레이어(흰공), 2: AI 또는 2P(노란공)
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [inning, setInning] = useState<number>(1);
  const [currentRun, setCurrentRun] = useState<number>(0);
  const [highRun, setHighRun] = useState<number>(0);
  const [totalShots, setTotalShots] = useState<number>(0);
  const [scoredShots, setScoredShots] = useState<number>(0);
  const [liveCushionCount, setLiveCushionCount] = useState<number>(0);

  // 조작 파라미터 (조준각, 파워, 당점, 초크)
  const [aimAngleDeg, setAimAngleDeg] = useState<number>(0);
  const [power, setPower] = useState<number>(58);
  const [spin, setSpin] = useState<SpinOffset>({ x: 0, y: 0.2 });
  const [chalkLevel, setChalkLevel] = useState<number>(100);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // 피드백 & 히스토리 & 모달
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);
  const [aiComment, setAiComment] = useState<string>('큐대에 초크를 바르고 초구를 준비하세요! 🎱');
  const [inningHistory, setInningHistory] = useState<InningRecord[]>([]);
  const [impactEffects, setImpactEffects] = useState<ImpactEffect[]>([]);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  // 물리 루프용 Ref
  const ballsRef = useRef<BallState[]>(balls);
  ballsRef.current = balls;
  const trackerRef = useRef<ShotTracker | null>(null);
  const rafRef = useRef<number | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectIdRef = useRef<number>(1);

  // 현재 턴의 수구 ID
  const activeCueBallId: BallId =
    matchType === 'practice' ? 'cue_white' : currentPlayer === 1 ? 'cue_white' : 'cue_yellow';

  // 실시간 조준 예측선 계산 (플레이어 다마수에 따라 분리각·회전 반사각 연동)
  const aimPrediction: AimPrediction | null = !isSimulating
    ? computeAimPrediction(balls, activeCueBallId, (aimAngleDeg * Math.PI) / 180, spin, playerDama)
    : null;

  // 플레이어 다마수(실력 등급) 변경 핸들러
  const changePlayerDama = useCallback((nextDama: SkillDama) => {
    const profile = getSkillProfile(nextDama);
    setPlayerDama(nextDama);
    setSpin((prev) => {
      const mag = Math.hypot(prev.x, prev.y);
      if (mag > profile.maxTipOffset && mag > 0) {
        const ratio = profile.maxTipOffset / mag;
        return {
          x: Number((prev.x * ratio).toFixed(2)),
          y: Number((prev.y * ratio).toFixed(2)),
        };
      }
      return prev;
    });
    setAiComment(`🎱 내 구질 [${profile.label}] 적용 — ${profile.desc}`);
  }, []);

  // 충돌 이펙트 추가 헬퍼
  const pushImpactEffect = useCallback(
    (x: number, y: number, type: 'ball' | 'cushion' | 'score', color: string) => {
      const id = effectIdRef.current++;
      setImpactEffects((prev) => [
        ...prev.slice(-10),
        {
          id,
          x,
          y,
          type,
          color,
          alpha: 1,
          radius: 4,
          maxRadius: type === 'score' ? 36 : type === 'ball' ? 22 : 16,
        },
      ]);
    },
    []
  );

  // 새 게임 초기화
  const resetMatch = useCallback(
    (
      nextRuleMode: BilliardsRuleMode = ruleMode,
      nextMatchType: MatchType = matchType,
      nextTargetScore?: number
    ) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

      const defaultTarget =
        nextTargetScore !== undefined
          ? nextTargetScore
          : nextRuleMode === 'four-ball'
          ? 50
          : 5;

      const initial = createInitialBalls(nextRuleMode);
      ballsRef.current = initial;
      setBalls(initial);
      setRuleMode(nextRuleMode);
      setMatchType(nextMatchType);
      setTargetScore(defaultTarget);
      setIsSimulating(false);
      setCurrentPlayer(1);
      setP1Score(0);
      setP2Score(0);
      setInning(1);
      setCurrentRun(0);
      setHighRun(0);
      setTotalShots(0);
      setScoredShots(0);
      setLiveCushionCount(0);
      setAimAngleDeg(nextRuleMode === 'four-ball' ? -8 : -12);
      setPower(58);
      setSpin({ x: 0, y: 0.2 });
      setChalkLevel(100);
      setActivePresetId(null);
      setLastShotResult(null);
      setInningHistory([]);
      setImpactEffects([]);
      setWinner(null);
      setIsResultModalOpen(false);
      setAiComment(
        nextRuleMode === 'four-ball'
          ? '4구 경기 시작! 빨간 적구 2개를 맞히면 +10점입니다.'
          : '3구(3쿠션) 경기 시작! 제2적구 접촉 전 3쿠션 이상을 달성하세요.'
      );
    },
    [ruleMode, matchType]
  );

  // 초크 바르기 액션
  const applyChalk = useCallback(() => {
    sound.playChalkBrush();
    setChalkLevel(100);
    setAiComment('🟦 초크 도포 완료! 큐 팁 마찰력이 100%로 충전되어 극단적 당점도 안전합니다.');
  }, []);

  // 묘수 프리셋 세팅 (2단계 마케팅 캡처 `data-screenshot-click="action"` 겸용)
  const applyTrickShotPreset = useCallback(
    (preset?: TrickShotPreset) => {
      if (isSimulating) return;
      const chosen =
        preset ||
        TRICK_SHOT_PRESETS.find((p) => p.ruleMode === ruleMode) ||
        TRICK_SHOT_PRESETS[0];

      const baseBalls = createInitialBalls(chosen.ruleMode);
      const updatedBalls = baseBalls.map((b) => {
        const pos = chosen.balls.find((pb) => pb.id === b.id);
        return pos
          ? { ...b, x: pos.x, y: pos.y, vx: 0, vy: 0, sideSpin: 0, topBottomSpin: 0 }
          : b;
      });

      if (chosen.ruleMode !== ruleMode) {
        setRuleMode(chosen.ruleMode);
        setTargetScore(chosen.ruleMode === 'four-ball' ? 50 : 5);
      }

      if (chosen.recommendedDama && playerDama < chosen.recommendedDama) {
        setPlayerDama(chosen.recommendedDama);
      }

      ballsRef.current = updatedBalls;
      setBalls(updatedBalls);
      setCurrentPlayer(1);
      setAimAngleDeg(chosen.aimAngleDeg);
      setPower(chosen.power);
      setSpin(chosen.spin);
      setChalkLevel(100);
      setActivePresetId(chosen.id);
      sound.playChalkBrush();
      setAiComment(
        `🎯 [${chosen.label} (${chosen.badge})] 세팅 완료! 지금 '스트로크 샷!'을 누르면 묘수가 발동됩니다.`
      );
    },
    [isSimulating, ruleMode, playerDama]
  );

  // 스트로크 발사 함수 (플레이어 & AI 공용 — 다마수별 물리 계수 연동)
  const executeStroke = useCallback(
    (customShot?: { angleDeg: number; powerVal: number; spinVal: SpinOffset; actor: 1 | 2 }) => {
      if (isSimulating || winner !== null) return;

      const isCustom =
        Boolean(customShot) &&
        typeof customShot?.angleDeg === 'number' &&
        typeof customShot?.powerVal === 'number' &&
        Boolean(customShot?.spinVal) &&
        typeof customShot?.spinVal?.x === 'number';

      const actor = isCustom && customShot ? customShot.actor : currentPlayer;
      const cueId: BallId =
        matchType === 'practice' ? 'cue_white' : actor === 1 ? 'cue_white' : 'cue_yellow';

      // 현재 타격자의 다마수(실력 등급) 결정
      const shooterDama: SkillDama =
        actor === 2 && matchType === 'ai' ? aiDifficultyToDama(aiDifficulty) : playerDama;
      const skillProfile = getSkillProfile(shooterDama);

      const angleDeg = isCustom && customShot ? customShot.angleDeg : aimAngleDeg;
      const powerVal = isCustom && customShot ? customShot.powerVal : power;
      const rawSpinVal = isCustom && customShot ? customShot.spinVal : spin;

      // 다마수별 유효 당점 한계(maxTipOffset) 클램핑
      const rawSpinMag = Math.hypot(rawSpinVal.x, rawSpinVal.y);
      const clampedRatio =
        rawSpinMag > skillProfile.maxTipOffset && rawSpinMag > 0
          ? skillProfile.maxTipOffset / rawSpinMag
          : 1;
      const spinVal: SpinOffset = {
        x: rawSpinVal.x * clampedRatio,
        y: rawSpinVal.y * clampedRatio,
      };

      const spinMagnitude = Math.hypot(spinVal.x, spinVal.y);
      // 초크가 25% 미만이고 극단적 당점(>0.8)일 때 미스큐(삑사리) 발생 가능
      const isMiscue = actor === 1 && chalkLevel < 25 && spinMagnitude > 0.8;

      const rad = (angleDeg * Math.PI) / 180;
      // 다마수별 파워 효율(powerScale) 및 상단 당점 가속(followScale) 적용
      const topSpinSpeedBoost =
        !isMiscue && spinVal.y > 0 ? 1 + spinVal.y * 0.08 * skillProfile.followScale : 1;
      const baseSpeed =
        ((isMiscue ? powerVal * 0.35 : powerVal) / 100) *
        28.5 *
        skillProfile.powerScale *
        topSpinSpeedBoost;
      const finalAngle = isMiscue ? rad + (Math.random() - 0.5) * 0.35 : rad;
      const dirX = Math.cos(finalAngle);
      const dirY = Math.sin(finalAngle);

      sound.playCueStrike(powerVal / 100, spinMagnitude, isMiscue);

      const nextBalls = ballsRef.current.map((b) => {
        if (b.id !== cueId) {
          return {
            ...b,
            spinDriveVx: 0,
            spinDriveVy: 0,
            spinDriveFrames: 0,
            hasHitFirstBall: false,
          };
        }
        return {
          ...b,
          vx: dirX * baseSpeed,
          vy: dirY * baseSpeed,
          forwardDirX: dirX,
          forwardDirY: dirY,
          sideSpin: isMiscue ? 0 : spinVal.x,
          topBottomSpin: isMiscue ? 0 : spinVal.y,
          spinScale: skillProfile.spinScale,
          drawScale: skillProfile.drawScale,
          followScale: skillProfile.followScale,
          driveFrames: skillProfile.driveFrames,
          spinDriveVx: 0,
          spinDriveVy: 0,
          spinDriveFrames: 0,
          hasHitFirstBall: false,
        };
      });

      ballsRef.current = nextBalls;
      setBalls(nextBalls);
      setIsSimulating(true);
      setLiveCushionCount(0);
      setLastShotResult(null);

      if (actor === 1) {
        setTotalShots((prev) => prev + 1);
        setChalkLevel((prev) => Math.max(0, prev - 14));
      }

      const tracker = createShotTracker(cueId);
      trackerRef.current = tracker;

      const stepLoop = () => {
        const currentBalls = ballsRef.current.map((b) => ({ ...b }));
        const stopped = stepPhysicsFrame(currentBalls, tracker, {
          onBallCollision: (cx, cy, impactSpd) => {
            sound.playBallCollision(impactSpd);
            pushImpactEffect(cx, cy, 'ball', '#F59E0B');
          },
          onCushionBounce: (bx, by, impactSpd, sp) => {
            sound.playCushionBounce(impactSpd, sp);
            setLiveCushionCount(tracker.cushionCount);
            pushImpactEffect(bx, by, 'cushion', '#38BDF8');
          },
        });

        ballsRef.current = currentBalls;
        setBalls(currentBalls);

        // 이펙트 감쇠 업데이트
        setImpactEffects((prev) =>
          prev
            .map((ef) => ({
              ...ef,
              radius: ef.radius + (ef.maxRadius - ef.radius) * 0.22,
              alpha: ef.alpha - 0.06,
            }))
            .filter((ef) => ef.alpha > 0.05)
        );

        if (!stopped) {
          rafRef.current = requestAnimationFrame(stepLoop);
        } else {
          // 모든 공 정지 -> 판정 수행
          setIsSimulating(false);
          const actorPrevScore = actor === 1 ? p1Score : p2Score;
          const result = evaluateShotResult(
            ruleMode,
            tracker,
            actorPrevScore,
            targetScore,
            requireThreeCushionFinish
          );

          setLastShotResult(result);
          setAiComment(`${result.headline} — ${result.subline}`);

          const nextActorScore = Math.max(0, actorPrevScore + result.pointsDelta);
          if (actor === 1) {
            setP1Score(nextActorScore);
          } else {
            setP2Score(nextActorScore);
          }

          if (result.scored) {
            sound.playScoreChime(
              result.shotTypeBadge === 'THREE_CUSHION' || result.shotTypeBadge === 'BANK_SHOT'
            );
            if (actor === 1) {
              setScoredShots((prev) => prev + 1);
              setCurrentRun((prevRun) => {
                const nextRun = prevRun + 1;
                setHighRun((prevHigh) => Math.max(prevHigh, nextRun));
                return nextRun;
              });
            }
          } else if (result.foul) {
            sound.playFoulBuzz();
            if (actor === 1) setCurrentRun(0);
          } else {
            if (actor === 1) setCurrentRun(0);
          }

          // 이닝 히스토리 기록 추가 (최신순 상단 유지)
          const actorLabel =
            actor === 1
              ? `나 (${getSkillProfile(playerDama).shortLabel})`
              : matchType === 'ai'
              ? `AI (${getSkillProfile(aiDifficultyToDama(aiDifficulty)).shortLabel})`
              : 'Player 2';

          setInningHistory((prev) => [
            {
              id: Date.now() + Math.random(),
              inning,
              actorName: actorLabel,
              isPlayer1: actor === 1,
              mode: ruleMode,
              resultText: result.scored
                ? `${result.cushionCount}쿠션 득점`
                : result.foul
                ? '수구 접촉 파울'
                : `${result.cushionCount}쿠션 노카운트`,
              pointsDelta: result.pointsDelta,
              isScore: result.scored,
              isFoul: result.foul,
            },
            ...prev.slice(0, 29),
          ]);

          // 목표 점수 도달 승리 체크
          if (nextActorScore >= targetScore) {
            setWinner(actor);
            sound.playVictoryFanfare();
            if (actor === 1) {
              try {
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              } catch {
                // ignore confetti error
              }
            }
            setTimeout(() => {
              setIsResultModalOpen(true);
            }, 900);
            return;
          }

          // 득점 실패 또는 파울 시 턴 교대 (연습 모드는 계속 플레이어 1 유지)
          if (!result.scored && matchType !== 'practice') {
            const nextTurn: 1 | 2 = actor === 1 ? 2 : 1;
            setCurrentPlayer(nextTurn);
            if (nextTurn === 1) {
              setInning((prev) => prev + 1);
            }
          } else if (matchType === 'practice' && !result.scored) {
            setInning((prev) => prev + 1);
          }
        }
      };

      rafRef.current = requestAnimationFrame(stepLoop);
    },
    [
      isSimulating,
      winner,
      currentPlayer,
      matchType,
      aimAngleDeg,
      power,
      spin,
      chalkLevel,
      p1Score,
      p2Score,
      ruleMode,
      targetScore,
      requireThreeCushionFinish,
      playerDama,
      aiDifficulty,
      inning,
      pushImpactEffect,
    ]
  );

  const executeStrokeRef = useRef(executeStroke);
  executeStrokeRef.current = executeStroke;

  // AI 턴 자동 진행 (조준 상태 변경 시 타이머가 취소되지 않도록 Ref 사용)
  useEffect(() => {
    if (
      matchType === 'ai' &&
      currentPlayer === 2 &&
      !isSimulating &&
      winner === null
    ) {
      setAiComment('🤖 AI가 당구대 각도와 회전량을 계산하고 있습니다...');
      let innerTimer: ReturnType<typeof setTimeout> | null = null;
      const outerTimer = setTimeout(() => {
        const decision = findBestAiShot(
          ballsRef.current,
          'cue_yellow',
          ruleMode,
          aiDifficulty
        );
        setAiComment(`🤖 AI: "${decision.comment}"`);
        setAimAngleDeg(decision.aimAngleDeg);
        setPower(decision.power);
        setSpin(decision.spin);

        innerTimer = setTimeout(() => {
          executeStrokeRef.current({
            angleDeg: decision.aimAngleDeg,
            powerVal: decision.power,
            spinVal: decision.spin,
            actor: 2,
          });
        }, 650);
      }, 850);

      aiTimerRef.current = outerTimer;

      return () => {
        clearTimeout(outerTimer);
        if (innerTimer) clearTimeout(innerTimer);
      };
    }
  }, [matchType, currentPlayer, isSimulating, winner, ruleMode, aiDifficulty]);

  // 언마운트 시 오디오 및 RAF 클린업 (`miniapp.md` 제5.5절 준수)
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      sound.cleanup();
    };
  }, []);

  const accuracyPct = totalShots > 0 ? Math.round((scoredShots / totalShots) * 100) : 0;
  const averagePerInning =
    inning > 0
      ? Number(((ruleMode === 'four-ball' ? p1Score / 10 : p1Score) / inning).toFixed(2))
      : 0;

  return {
    // 상태
    ruleMode,
    matchType,
    playerDama,
    aiDifficulty,
    targetScore,
    requireThreeCushionFinish,
    clothTheme,
    balls,
    isSimulating,
    currentPlayer,
    activeCueBallId,
    p1Score,
    p2Score,
    inning,
    currentRun,
    highRun,
    totalShots,
    scoredShots,
    accuracyPct,
    averagePerInning,
    liveCushionCount,
    aimAngleDeg,
    power,
    spin,
    chalkLevel,
    activePresetId,
    aimPrediction,
    lastShotResult,
    aiComment,
    inningHistory,
    impactEffects,
    isResultModalOpen,
    winner,

    // 액션
    setRuleMode,
    setMatchType,
    changePlayerDama,
    setAiDifficulty,
    setTargetScore,
    setRequireThreeCushionFinish,
    setClothTheme,
    setAimAngleDeg,
    setPower,
    setSpin,
    setIsResultModalOpen,
    resetMatch,
    applyChalk,
    applyTrickShotPreset,
    executeStroke,
  };
}
