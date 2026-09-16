import { Difficulty, GameMode, Side, JanggiGameScoreDetails } from '../types/janggi';

interface CalculateScoreParams {
  winner: Side | 'draw' | null;
  playerSide: Side;
  gameMode: GameMode;
  aiDifficulty: Difficulty;
  moveCount: number;
  choScore: number;
  hanScore: number;
  winReason: string;
  puzzleStreak?: number;
}

/**
 * 베라 장기 대국 종료 시 최종 랭킹 점수 및 베라 포인트를 정밀 산정합니다.
 */
export function calculateJanggiGameScore({
  winner,
  playerSide,
  gameMode,
  aiDifficulty,
  moveCount,
  choScore,
  hanScore,
  winReason,
  puzzleStreak = 1,
}: CalculateScoreParams): JanggiGameScoreDetails {
  const isWin = winner === playerSide;
  const isDraw = winner === 'draw';
  const myMaterialScore = playerSide === 'cho' ? choScore : hanScore;

  // 1. 무승부 (빅장, 삼복수 등)
  if (isDraw) {
    const baseScore = 2000;
    const materialBonus = Math.round(myMaterialScore * 20);
    const moveBonus = Math.min(1000, moveCount * 20);
    const totalScore = baseScore + materialBonus + moveBonus;
    return {
      totalScore,
      baseScore,
      winBonus: 0,
      materialBonus,
      moveBonus,
      handicapBonus: 0,
      earnedPoints: 15,
      isWin: false,
      isDraw: true,
    };
  }

  // 2. 패배 (접전 격려 점수)
  if (!isWin) {
    const consolationScore = Math.max(
      300,
      Math.min(2000, moveCount * 30 + Math.round(myMaterialScore * 20))
    );
    return {
      totalScore: consolationScore,
      baseScore: consolationScore,
      winBonus: 0,
      materialBonus: 0,
      moveBonus: 0,
      handicapBonus: 0,
      earnedPoints: 5,
      isWin: false,
      isDraw: false,
    };
  }

  // 3. 승리 (WIN)
  // 난이도별 기본 승리 점수
  const difficultyBase: Record<Difficulty, number> = {
    beginner: 3000,
    easy: 5000,
    normal: 7500,
    hard: 10000,
    master: 15000,
  };

  let baseScore = difficultyBase[aiDifficulty] || 7500;
  let earnedPoints = 40;

  if (gameMode === 'puzzle') {
    baseScore = 5000 + puzzleStreak * 500;
    earnedPoints = 50 + puzzleStreak * 10;
  } else if (gameMode === 'mini') {
    baseScore = 6000;
    earnedPoints = 35;
  } else if (gameMode === 'battle') {
    baseScore = 8000;
    earnedPoints = 45;
  } else if (gameMode === 'saju') {
    baseScore = 8000;
    earnedPoints = 40;
  }

  // 외통수(Checkmate) 완승 vs 점수제 승리 보너스
  const isCheckmate = winReason.includes('외통수') || winReason.includes('Checkmate');
  const winBonus = isCheckmate ? 2000 : 1000;

  // 잔여 기물 보너스 (남은 기물 점수 비례)
  const materialBonus = Math.round(myMaterialScore * 50);

  // 수순 효율 보너스 (100수 이내 신속한 승리 시 가산)
  const moveBonus = Math.max(0, (100 - moveCount) * 40);

  // 후공(한나라) 승리 핸디캡 보너스
  const handicapBonus = playerSide === 'han' ? 1500 : 0;

  const totalScore = baseScore + winBonus + materialBonus + moveBonus + handicapBonus;

  return {
    totalScore,
    baseScore,
    winBonus,
    materialBonus,
    moveBonus,
    handicapBonus,
    earnedPoints,
    isWin: true,
    isDraw: false,
  };
}
