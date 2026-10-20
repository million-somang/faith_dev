/** 게임 규칙 모드: 4구(Four-Ball) vs 3구(Three-Cushion) */
export type BilliardsRuleMode = 'four-ball' | 'three-cushion';

/** 대전 형태: AI 대전 | 1인 하이런 연습 | 2인 로컬 교대 플레이 */
export type MatchType = 'ai' | 'practice' | 'local-2p';

/** AI 난이도 (다마수/핸디캡 연동) */
export type AiDifficulty = 'beginner' | 'amateur' | 'pro' | 'master';

/** 상단 3단 알약 탭 (`miniapp.md` 표준) */
export type ActiveTab = 'arena' | 'howto' | 'faq';

/** 당구공 식별자 */
export type BallId = 'cue_white' | 'cue_yellow' | 'obj_red1' | 'obj_red2';

/** 개별 당구공 물리 상태 */
export interface BallState {
  id: BallId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: 'white' | 'yellow' | 'red';
  /** 3D 구면 롤링 및 스핀 표현용 회전 위상 (rad) */
  rollAngleX: number;
  rollAngleY: number;
  /** 당점(English)에 의한 좌우/상하 스핀 잔량 (-1.0 ~ 1.0) */
  sideSpin: number;
  topBottomSpin: number;
  /** 수구 발사 및 제1적구 충돌 직전 진행 방향 단위 벡터 (밀어치기/끌어치기 2차 가속 방향 기준) */
  forwardDirX?: number;
  forwardDirY?: number;
  /** 제1적구 충돌 후 라사지 그립 가속(Follow/Draw Curve) 벡터 및 잔여 프레임 */
  spinDriveVx?: number;
  spinDriveVy?: number;
  spinDriveFrames?: number;
  /** 수구가 첫 적구를 맞혔는지 여부 (맞히기 전까지 상하단 스핀 슬라이딩 보존) */
  hasHitFirstBall?: boolean;
}

/** 당점(Cue Tip Offset) 상태: -1.0 ~ +1.0 정규화 좌표 */
export interface SpinOffset {
  /** 좌(-) / 우(+) 회전 (쿠션 반사각 변화) */
  x: number;
  /** 하단 끌어치기(-) / 상단 밀어치기(+) (공 충돌 후 수구 진로 변화) */
  y: number;
}

/** 충돌 파티클 / 쿠션 플래시 이펙트 */
export interface ImpactEffect {
  id: number;
  x: number;
  y: number;
  type: 'ball' | 'cushion' | 'score';
  color: string;
  alpha: number;
  radius: number;
  maxRadius: number;
}

/** 한 이닝(샷) 동안의 실시간 물리 추적 로그 */
export interface ShotTracker {
  cueBallId: BallId;
  hitBalls: Set<BallId>;
  cushionCount: number;
  cushionCountBeforeSecondObject: number;
  firstContactWasCushion: boolean;
  firstObjectHit: BallId | null;
  secondObjectHit: BallId | null;
  maxImpactSpeed: number;
}

/** 샷 판정 결과 */
export interface ShotResult {
  scored: boolean;
  foul: boolean;
  pointsDelta: number;
  headline: string;
  subline: string;
  shotTypeBadge?: 'NICE_SHOT' | 'THREE_CUSHION' | 'BANK_SHOT' | 'HIGH_RUN' | 'FOUL' | 'MISS';
  cushionCount: number;
  isBankShot: boolean;
}

/** 이닝 히스토리 아이템 (고정 높이 2열 그리드 표시용) */
export interface InningRecord {
  id: number;
  inning: number;
  actorName: string;
  isPlayer1: boolean;
  mode: BilliardsRuleMode;
  resultText: string;
  pointsDelta: number;
  isScore: boolean;
  isFoul: boolean;
}

/** 조준 가이드라인 궤적 예측 데이터 */
export interface AimPrediction {
  cueStart: { x: number; y: number };
  impactPoint: { x: number; y: number };
  hitBallId: BallId | null;
  hitCushionNormal: { nx: number; ny: number } | null;
  /** 충돌 후 수구 예상 진행 선분 (밀어치기/끌어치기/스핀 반영) */
  cueDeflectEnd: { x: number; y: number };
  /** 밀어치기/끌어치기 시 휘어지는 2차 궤적 곡선 포인트 배열 */
  cueCurvePoints?: Array<{ x: number; y: number }>;
  /** 피격 적구 예상 진행 선분 */
  targetBallEnd: { x: number; y: number } | null;
}

/** 프리셋 묘수/연습 배치 */
export interface TrickShotPreset {
  id: string;
  label: string;
  badge: string;
  ruleMode: BilliardsRuleMode;
  desc: string;
  aimAngleDeg: number;
  power: number;
  spin: SpinOffset;
  balls: Array<{ id: BallId; x: number; y: number }>;
}
