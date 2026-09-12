export type CharacterClass = 'warrior' | 'black_mage' | 'white_mage' | 'thief';

export interface CharacterStats {
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  matk: number;
  gold: number;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  job: CharacterClass;
  stats: CharacterStats;
}

export interface Monster {
  id: string;
  name: string;
  title: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  expReward: number;
  goldReward: number;
  icon: string;
  color: string;
}

export interface DungeonArea {
  id: string;
  name: string;
  difficulty: '초급' | '중급' | '상급' | '레이드';
  recommendedLevel: number;
  description: string;
  monsters: Monster[];
  bossName: string;
}

export interface PartyMember {
  id: string;
  name: string;
  job: CharacterClass;
  level: number;
  isLeader: boolean;
  ready: boolean;
}

export interface PartyRoom {
  id: string;
  title: string;
  dungeonId: string;
  dungeonName: string;
  leaderName: string;
  maxMembers: number;
  members: PartyMember[];
  status: 'waiting' | 'in_dungeon' | 'finished';
}

export type BattleActionType = 'attack' | 'skill' | 'heal' | 'run';

export interface BattleLogEntry {
  id: string;
  text: string;
  type: 'player_attack' | 'monster_attack' | 'heal' | 'system' | 'victory';
}
