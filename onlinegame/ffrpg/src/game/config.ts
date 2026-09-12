// ============================================================================
// Phaser 3 게임 설정 (450px × 380px 배틀 필드 캔버스)
// ============================================================================

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { BattleScene } from './scenes/BattleScene';

export const createGameConfig = (parentContainerId: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 450,
  height: 380,
  parent: parentContainerId,
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
  },
  scene: [BootScene, BattleScene],
});
