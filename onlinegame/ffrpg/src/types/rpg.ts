// ============================================================================
// 성좌의 잔향: 부서진 하늘의 조율자들 - 핵심 데이터 모델 및 타입
// ============================================================================

export type CharacterClass = 'warrior' | 'white_mage' | 'black_mage' | 'monk';

export interface HeroBattleUnit {
  id: string;
  name: string;
  job: CharacterClass;
  title: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  matk: number;
  agi: number; // ATB 속도 결정
  atb: number; // 0 ~ 100
  isDefending: boolean;
  isDead: boolean;
  textureKey: string;
}

export interface EnemyBattleUnit {
  id: string;
  name: string;
  title: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  matk: number;
  agi: number;
  atb: number;
  expReward: number;
  goldReward: number;
  textureKey: string;
  isBoss?: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  mpCost: number;
  targetType: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies';
  description: string;
  jobRequired: CharacterClass;
}

export interface StoryAct {
  actNumber: 1 | 2 | 3 | 4;
  title: string;
  subTitle: string;
  locationName: string;
  altitudeMeters: number; // 에테리아 고도 (8400m -> 5000m -> 2500m -> 0m)
  boss: EnemyBattleUnit;
  introDialog: {
    speaker: string;
    avatar: string;
    text: string;
  }[];
  outroDialog: {
    speaker: string;
    avatar: string;
    text: string;
  }[];
}

export interface BattleActionPayload {
  actorType: 'hero' | 'enemy';
  actorIndex: number;
  actionType: 'attack' | 'skill' | 'defend';
  skillId?: string;
  targetIndex: number;
}
