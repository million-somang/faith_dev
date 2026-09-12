import { Difficulty, GameScoreDetails, GameStatus, Player } from '../types/omok';

/**
 * 오목 대국 종료 시 최종 점수를 계산합니다.
 * 
 * 점수 구조:
 * 1. 난이도별 기본 승리 점수 (EASY: 3,000점, NORMAL: 5,000점, HARD: 10,000점)
 * 2. 착수 수 보너스: 적은 수로 신속하게 이길수록 고득점 (최대 4,500점)
 * 3. 시간 보너스: 5분(300초) 이내 완승 시 잔여 시간 비례 가산 (최대 4,500점)
 * 4. 후공(백돌) 보너스: 오목의 흑선공 유리함을 감안하여 백돌 승리 시 +2,000점 역전 보너스
 * 5. 무승부/패배 시에도 기본 참가 및 접전 격려 점수 부여
 */
export function calculateOmokScore(
  status: GameStatus,
  difficulty: Difficulty,
  moveCount: number,
  timeElapsed: number,
  humanPlayer: Player
): GameScoreDetails {
  if (status === 'LOSS') {
    const score = Math.max(100, Math.min(1000, moveCount * 20));
    return {
      totalScore: score,
      baseScore: score,
      moveBonus: 0,
      timeBonus: 0,
      handicapBonus: 0,
    };
  }

  if (status === 'DRAW') {
    const moveBonus = moveCount * 20;
    const totalScore = 1000 + moveBonus;
    return {
      totalScore,
      baseScore: 1000,
      moveBonus,
      timeBonus: 0,
      handicapBonus: 0,
    };
  }

  // 승리 (WIN)
  const baseScores: Record<Difficulty, number> = {
    EASY: 3000,
    NORMAL: 5000,
    HARD: 10000,
  };

  const baseScore = baseScores[difficulty];
  // 50수 이내 승리 시 수당 100점 보너스 (예: 25수 승리 -> (50-25)*100 = 2,500점)
  const moveBonus = Math.max(0, Math.round((50 - moveCount) * 100));
  // 300초(5분) 이내 승리 시 초당 15점 보너스 (예: 60초 승리 -> (300-60)*15 = 3,600점)
  const timeBonus = Math.max(0, Math.round((300 - timeElapsed) * 15));
  // 후공(백돌) 승리 핸디캡 보너스
  const handicapBonus = humanPlayer === 'WHITE' ? 2000 : 0;

  const totalScore = baseScore + moveBonus + timeBonus + handicapBonus;

  return {
    totalScore,
    baseScore,
    moveBonus,
    timeBonus,
    handicapBonus,
  };
}
