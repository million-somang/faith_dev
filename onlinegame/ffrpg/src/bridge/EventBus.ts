// ============================================================================
// Phaser 3 <-> React 18 양방향 이벤트 브리지
// ============================================================================

import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const GAME_EVENTS = {
  // Phaser -> React
  BOOT_COMPLETE: 'BOOT_COMPLETE',
  HERO_TURN_READY: 'HERO_TURN_READY',
  ACTION_EXECUTED: 'ACTION_EXECUTED',
  HP_MP_UPDATE: 'HP_MP_UPDATE',
  BATTLE_VICTORY: 'BATTLE_VICTORY',
  BATTLE_DEFEAT: 'BATTLE_DEFEAT',
  LOG_MESSAGE: 'LOG_MESSAGE',

  // React -> Phaser
  COMMAND_EXECUTE: 'COMMAND_EXECUTE',
  LOAD_ACT: 'LOAD_ACT',
  NEXT_BATTLE: 'NEXT_BATTLE',
  RESTART_BATTLE: 'RESTART_BATTLE',
};
