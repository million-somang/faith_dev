import Phaser from 'phaser';
import { TextureGenerator } from '../textures/TextureGenerator';
import { EventBus, GAME_EVENTS } from '../../bridge/EventBus';

import warriorImg from '../../assets/sprites/warrior.png';
import whiteMageImg from '../../assets/sprites/white_mage.png';
import blackMageImg from '../../assets/sprites/black_mage.png';
import monkImg from '../../assets/sprites/monk.png';
import bossGolemImg from '../../assets/sprites/boss_golem.png';
import bossKrakenImg from '../../assets/sprites/boss_kraken.png';
import bossBahamutImg from '../../assets/sprites/boss_bahamut.png';
import bossEzekielImg from '../../assets/sprites/boss_ezekiel.png';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 64비트 고해상도 HD 영웅 모든 상태별 프리로드
    const heroPairs = [
      { key: 'hero_warrior', img: warriorImg },
      { key: 'hero_white_mage', img: whiteMageImg },
      { key: 'hero_black_mage', img: blackMageImg },
      { key: 'hero_monk', img: monkImg },
    ];

    const states = ['', '_idle', '_attack', '_danger', '_victory', '_hurt'];

    heroPairs.forEach(({ key, img }) => {
      states.forEach((suffix) => {
        this.load.image(`${key}${suffix}`, img);
      });
    });

    this.load.image('boss_golem', bossGolemImg);
    this.load.image('boss_kraken', bossKrakenImg);
    this.load.image('boss_bahamut', bossBahamutImg);
    this.load.image('boss_ezekiel', bossEzekielImg);
  }

  create() {
    // 1. 마법 및 전투 VFX 텍스처 생성
    TextureGenerator.generateAll(this);

    // 2. 64비트 HD 일러스트레이션 선형 안티앨리어싱 필터 적용
    const allKeys: string[] = ['boss_golem', 'boss_kraken', 'boss_bahamut', 'boss_ezekiel'];
    ['hero_warrior', 'hero_white_mage', 'hero_black_mage', 'hero_monk'].forEach((k) => {
      ['', '_idle', '_attack', '_danger', '_victory', '_hurt'].forEach((s) => {
        allKeys.push(`${k}${s}`);
      });
    });

    allKeys.forEach((key) => {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    });

    // 3. React UI에 부트 완료 알림
    EventBus.emit(GAME_EVENTS.BOOT_COMPLETE);

    // 4. BattleScene 기동
    this.scene.start('BattleScene');
  }
}
