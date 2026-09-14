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

// 🌟 제 1주인공 레온(Leon) 전용 스프라이트 및 애니메이션 시트
import leonIdleImg from '../../assets/sprites/leon/leon_idle.png';
import leonAttackStrip from '../../assets/sprites/leon/leon_attack_strip4.png';
import leonSkillStrip from '../../assets/sprites/leon/leon_skill_strip4.png';
import leonHurtStrip from '../../assets/sprites/leon/leon_hurt_strip4.png';

// 🌟 제 2주인공 세리아(Seria) 전용 스프라이트 및 애니메이션 시트
import seriaIdleImg from '../../assets/sprites/seria/seria_idle.png';
import seriaAttackStrip from '../../assets/sprites/seria/seria_attack_strip4.png';
import seriaSkillStrip from '../../assets/sprites/seria/seria_skill_strip4.png';
import seriaHurtStrip from '../../assets/sprites/seria/seria_hurt_strip4.png';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 64비트 고해상도 HD 영웅 모든 상태별 프리로드 (흑마도사, 몽크)
    const heroPairs = [
      { key: 'hero_black_mage', img: blackMageImg },
      { key: 'hero_monk', img: monkImg },
    ];

    const states = ['', '_idle', '_attack', '_danger', '_victory', '_hurt'];

    heroPairs.forEach(({ key, img }) => {
      states.forEach((suffix) => {
        this.load.image(`${key}${suffix}`, img);
      });
    });

    // 🌟 제 1주인공 레온(Leon) 전용 애니메이션 스프라이트 시트 (프레임 크기: 320 x 520)
    this.load.spritesheet('leon_attack_sheet', leonAttackStrip, { frameWidth: 320, frameHeight: 520 });
    this.load.spritesheet('leon_skill_sheet', leonSkillStrip, { frameWidth: 320, frameHeight: 520 });
    this.load.spritesheet('leon_hurt_sheet', leonHurtStrip, { frameWidth: 320, frameHeight: 520 });

    // 레온 기본 스탠딩 및 호환 텍스처 전면 등록 (hero_leon 및 hero_warrior의 모든 상태)
    const leonKeys = [
      'leon_idle',
      'hero_leon', 'hero_leon_idle', 'hero_leon_attack', 'hero_leon_danger', 'hero_leon_victory', 'hero_leon_hurt',
      'hero_warrior', 'hero_warrior_idle', 'hero_warrior_attack', 'hero_warrior_danger', 'hero_warrior_victory', 'hero_warrior_hurt'
    ];
    leonKeys.forEach(k => {
      this.load.image(k, leonIdleImg);
    });

    // 🌟 제 2주인공 세리아(Seria) 전용 애니메이션 스프라이트 시트 (프레임 크기: 340 x 540)
    this.load.spritesheet('seria_attack_sheet', seriaAttackStrip, { frameWidth: 340, frameHeight: 540 });
    this.load.spritesheet('seria_skill_sheet', seriaSkillStrip, { frameWidth: 340, frameHeight: 540 });
    this.load.spritesheet('seria_hurt_sheet', seriaHurtStrip, { frameWidth: 340, frameHeight: 540 });

    // 세리아 기본 스탠딩 및 호환 텍스처 전면 등록 (hero_seria 및 hero_white_mage의 모든 상태)
    const seriaKeys = [
      'seria_idle',
      'hero_seria', 'hero_seria_idle', 'hero_seria_attack', 'hero_seria_danger', 'hero_seria_victory', 'hero_seria_hurt',
      'hero_white_mage', 'hero_white_mage_idle', 'hero_white_mage_attack', 'hero_white_mage_danger', 'hero_white_mage_victory', 'hero_white_mage_hurt'
    ];
    seriaKeys.forEach(k => {
      this.load.image(k, seriaIdleImg);
    });

    this.load.image('boss_golem', bossGolemImg);
    this.load.image('boss_kraken', bossKrakenImg);
    this.load.image('boss_bahamut', bossBahamutImg);
    this.load.image('boss_ezekiel', bossEzekielImg);
  }

  create() {
    // 1. 마법 및 전투 VFX 텍스처 생성
    TextureGenerator.generateAll(this);

    // 2. 🌟 레온 전투 애니메이션 등록 (Phaser Animation System)
    if (!this.anims.exists('leon_anim_attack')) {
      this.anims.create({
        key: 'leon_anim_attack',
        frames: this.anims.generateFrameNumbers('leon_attack_sheet', { start: 0, end: 3 }),
        frameRate: 9,
        repeat: 0,
      });
    }

    if (!this.anims.exists('leon_anim_skill')) {
      this.anims.create({
        key: 'leon_anim_skill',
        frames: this.anims.generateFrameNumbers('leon_skill_sheet', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: 0,
      });
    }

    if (!this.anims.exists('leon_anim_hurt')) {
      this.anims.create({
        key: 'leon_anim_hurt',
        frames: this.anims.generateFrameNumbers('leon_hurt_sheet', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      });
    }

    // 🌟 세리아 전투 애니메이션 등록 (Phaser Animation System)
    if (!this.anims.exists('seria_anim_attack')) {
      this.anims.create({
        key: 'seria_anim_attack',
        frames: this.anims.generateFrameNumbers('seria_attack_sheet', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      });
    }

    if (!this.anims.exists('seria_anim_skill')) {
      this.anims.create({
        key: 'seria_anim_skill',
        frames: this.anims.generateFrameNumbers('seria_skill_sheet', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: 0,
      });
    }

    if (!this.anims.exists('seria_anim_hurt')) {
      this.anims.create({
        key: 'seria_anim_hurt',
        frames: this.anims.generateFrameNumbers('seria_hurt_sheet', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      });
    }

    // 3. 64비트 HD 일러스트레이션 선형 안티앨리어싱 필터 적용
    const allKeys: string[] = [
      'boss_golem', 'boss_kraken', 'boss_bahamut', 'boss_ezekiel',
      'leon_idle', 'leon_attack_sheet', 'leon_skill_sheet', 'leon_hurt_sheet',
      'seria_idle', 'seria_attack_sheet', 'seria_skill_sheet', 'seria_hurt_sheet'
    ];
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

    // 4. React UI에 부트 완료 알림
    EventBus.emit(GAME_EVENTS.BOOT_COMPLETE);

    // 5. BattleScene 기동
    this.scene.start('BattleScene');
  }
}
