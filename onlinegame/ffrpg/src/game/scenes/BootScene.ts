import Phaser from 'phaser';
import { TextureGenerator } from '../textures/TextureGenerator';
import { EventBus, GAME_EVENTS } from '../../bridge/EventBus';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // 1. 런타임 절차적 16비트 레트로 픽셀 스프라이트 & VFX 생성
    TextureGenerator.generateAll(this);

    // 2. React UI에 부트 완료 알림
    EventBus.emit(GAME_EVENTS.BOOT_COMPLETE);

    // 3. BattleScene 기동
    this.scene.start('BattleScene');
  }
}
