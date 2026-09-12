// ============================================================================
// Phaser 3 정통 파이널 판타지 사이드뷰 ATB 배틀 씬 (VFX & 모션 강화 버전)
// ============================================================================

import Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../../bridge/EventBus';
import { HeroBattleUnit, EnemyBattleUnit, BattleActionPayload } from '../../types/rpg';
import { INITIAL_HEROES, STORY_ACTS } from '../../data/storyData';
import { sfx } from '../../audio/SfxSynthesizer';
import { bgm } from '../../audio/BgmSynthesizer';
import { VfxManager } from '../vfx/VfxManager';

interface HeroSpriteNode {
  sprite: Phaser.GameObjects.Sprite;
  baseX: number;
  baseY: number;
  indicator: Phaser.GameObjects.Graphics;
  idleTween?: Phaser.Tweens.Tween;
  data: HeroBattleUnit;
}

interface EnemySpriteNode {
  sprite: Phaser.GameObjects.Sprite;
  baseX: number;
  baseY: number;
  data: EnemyBattleUnit;
}

export class BattleScene extends Phaser.Scene {
  private heroes: HeroSpriteNode[] = [];
  private enemy: EnemySpriteNode | null = null;
  private currentActNumber: 1 | 2 | 3 | 4 = 1;
  private activeHeroIndex: number | null = null;
  private isProcessingAction: boolean = false;
  private isBattleFinished: boolean = false;
  private isPausedForInput: boolean = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#090d16');
    this.createBattleBackground();
    this.setupEventListeners();
    this.loadAct(1);
  }

  // 1. 배틀필드 배경 렌더링
  private createBattleBackground() {
    const bg = this.add.graphics();

    // 상단 하늘 그라데이션
    bg.fillGradientStyle(0x1e1b4b, 0x1e1b4b, 0x312e81, 0x312e81, 1);
    bg.fillRect(0, 0, 450, 240);

    // 하단 대지 그라데이션
    bg.fillGradientStyle(0x334155, 0x334155, 0x1e293b, 0x1e293b, 1);
    bg.fillRect(0, 240, 450, 140);

    // 원근 투시 그리드 선
    bg.lineStyle(1, 0x64748b, 0.25);
    for (let x = -50; x <= 500; x += 40) {
      bg.lineBetween(x, 240, x + (x - 225) * 0.5, 380);
    }
    for (let y = 260; y <= 380; y += 30) {
      bg.lineBetween(0, y, 450, y);
    }

    // 부유하는 크리스탈 먼지 파티클
    for (let i = 0; i < 24; i++) {
      const px = Phaser.Math.Between(10, 440);
      const py = Phaser.Math.Between(20, 230);
      const star = this.add.circle(px, py, Phaser.Math.Between(1, 2), 0x93c5fd, 0.6);
      this.tweens.add({
        targets: star,
        y: py - 18,
        alpha: 0.1,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // 2. 4막 시나리오 보스 및 4인 파티 배치
  public loadAct(actNum: 1 | 2 | 3 | 4) {
    this.currentActNumber = actNum;
    this.isBattleFinished = false;
    this.isProcessingAction = false;
    this.activeHeroIndex = null;
    this.isPausedForInput = false;

    // 기존 스프라이트 정리
    this.heroes.forEach(h => {
      if (h.idleTween) h.idleTween.stop();
      h.sprite.destroy();
      h.indicator.destroy();
    });
    this.heroes = [];
    if (this.enemy) {
      this.enemy.sprite.destroy();
      this.enemy = null;
    }

    const actData = STORY_ACTS.find(a => a.actNumber === actNum) || STORY_ACTS[0];

    // BGM 전환
    if (actNum === 4) {
      bgm.play('boss');
    } else {
      bgm.play('battle');
    }

    // 좌측: 보스 유닛 생성 (X: 110, Y: 185)
    const enemyData: EnemyBattleUnit = JSON.parse(JSON.stringify(actData.boss));
    const enemySprite = this.add.sprite(110, 185, enemyData.textureKey).setScale(2.6);

    // 보스 숨쉬기 아이들 애니메이션
    this.tweens.add({
      targets: enemySprite,
      y: 180,
      scaleX: 2.65,
      scaleY: 2.55,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.enemy = {
      sprite: enemySprite,
      baseX: 110,
      baseY: 185,
      data: enemyData
    };

    // 우측: 4인 조율자 파티 생성 (X: 350~375 세로 정렬)
    const partyPositions = [
      { x: 350, y: 80 },  // 전사 (전열)
      { x: 375, y: 150 }, // 백마도사 (후열)
      { x: 375, y: 220 }, // 흑마도사 (후열)
      { x: 350, y: 290 }, // 몽크 (전열)
    ];

    INITIAL_HEROES.forEach((proto, idx) => {
      const pos = partyPositions[idx];
      const heroData: HeroBattleUnit = JSON.parse(JSON.stringify(proto));
      heroData.atb = idx * 25; // 초기 ATB 분산

      // 🌟 픽셀 리마스터급 2D 스프라이트 대기 텍스처 (3.2배 스케일링)
      const sprite = this.add.sprite(pos.x, pos.y, `${heroData.textureKey}_idle`).setScale(3.2);

      // 영웅 숨쉬기 바운스 트윈 (상하 미세 호흡)
      const idleTween = this.tweens.add({
        targets: sprite,
        y: pos.y - 2,
        duration: 900 + idx * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // 발밑 턴 인디케이터 (황금 링)
      const indicator = this.add.graphics();
      indicator.lineStyle(2, 0xfacc15, 0.9);
      indicator.strokeEllipse(pos.x, pos.y + 42, 26, 10);
      indicator.setVisible(false);

      this.heroes.push({
        sprite,
        baseX: pos.x,
        baseY: pos.y,
        indicator,
        idleTween,
        data: heroData,
      });
    });

    this.syncStatsToReact();
  }

  // 3. 실시간 ATB 루프
  update(_time: number, delta: number) {
    if (this.isBattleFinished || this.isProcessingAction || this.isPausedForInput) return;

    const deltaSec = delta / 1000;
    let turnReadyFound = false;

    // 1) 영웅 ATB 누적
    for (let i = 0; i < this.heroes.length; i++) {
      const hero = this.heroes[i];
      if (hero.data.isDead) continue;

      if (hero.data.atb < 100) {
        const atbGain = (hero.data.agi * 1.5 + 20) * deltaSec;
        hero.data.atb = Math.min(100, hero.data.atb + atbGain);
      }

      // 턴 도달 시
      if (hero.data.atb >= 100 && this.activeHeroIndex === null) {
        this.setHeroTurnActive(i);
        turnReadyFound = true;
        break;
      }
    }

    // 2) 적 ATB 누적 (영웅이 커맨드 입력 중이 아닐 때)
    if (!turnReadyFound && this.enemy && this.enemy.data.hp > 0 && this.activeHeroIndex === null) {
      if (this.enemy.data.atb < 100) {
        const enemyAtbGain = (this.enemy.data.agi * 1.4 + 18) * deltaSec;
        this.enemy.data.atb = Math.min(100, this.enemy.data.atb + enemyAtbGain);
      } else {
        this.executeEnemyAction();
      }
    }

    this.syncStatsToReact();
  }

  // 영웅 턴 활성화 (앞으로 반 걸음 전진 & 인디케이터 표시)
  private setHeroTurnActive(heroIndex: number) {
    this.activeHeroIndex = heroIndex;
    const hero = this.heroes[heroIndex];

    hero.indicator.setVisible(true);
    sfx.playCursor();

    // 전진 트윈 (X: 350 -> 320)
    this.tweens.add({
      targets: [hero.sprite, hero.indicator],
      x: hero.baseX - 25,
      duration: 180,
      ease: 'Power2'
    });

    EventBus.emit(GAME_EVENTS.HERO_TURN_READY, {
      heroIndex,
      heroData: hero.data,
    });
  }

  // 영웅 대기/빈사 텍스처 업데이트
  private updateHeroIdleTexture(hero: HeroSpriteNode) {
    if (hero.data.isDead) return;
    const isDanger = hero.data.hp <= hero.data.maxHp * 0.25;
    hero.sprite.setTexture(`${hero.data.textureKey}_${isDanger ? 'danger' : 'idle'}`);
  }

  // 영웅 턴 종료 및 원위치 복귀
  private resetHeroTurn(heroIndex: number) {
    const hero = this.heroes[heroIndex];
    hero.data.atb = 0;
    hero.indicator.setVisible(false);
    this.updateHeroIdleTexture(hero);

    this.tweens.add({
      targets: [hero.sprite, hero.indicator],
      x: hero.baseX,
      duration: 180,
      ease: 'Power2'
    });

    this.activeHeroIndex = null;
    this.isProcessingAction = false;
    this.isPausedForInput = false;
  }

  // 4. 전투 커맨드 실행 (React -> Phaser)
  private handleCommandExecute(payload: BattleActionPayload) {
    if (this.isProcessingAction || this.activeHeroIndex === null || !this.enemy) return;
    this.isProcessingAction = true;
    const hero = this.heroes[this.activeHeroIndex];

    if (payload.actionType === 'attack') {
      this.executeHeroPhysicalAttack(hero);
    } else if (payload.actionType === 'skill') {
      this.executeHeroSkill(hero, payload.skillId || 'fire');
    } else if (payload.actionType === 'defend') {
      this.executeHeroDefend(hero);
    }
  }

  // [1] 물리 공격 (공격 프레임 전환 ➡️ 전진 대시 ➡️ 슬래시 VFX ➡️ 복귀)
  private executeHeroPhysicalAttack(hero: HeroSpriteNode) {
    const target = this.enemy!;
    const damage = Math.max(8, hero.data.atk - Math.floor(target.data.def / 2) + Phaser.Math.Between(2, 8));

    // ⚔️ 공격 포즈 프레임으로 전환!
    hero.sprite.setTexture(`${hero.data.textureKey}_attack`);

    // 타겟 앞으로 고속 대시 (X: 180)
    this.tweens.add({
      targets: hero.sprite,
      x: 180,
      y: target.baseY,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        sfx.playSlash();
        this.spawnVfx('vfx_slash', target.baseX, target.baseY);

        this.cameras.main.shake(120, 0.009);
        this.showDamagePopup(target.baseX, target.baseY - 20, damage, false);

        target.data.hp = Math.max(0, target.data.hp - damage);

        EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
          text: `⚔️ ${hero.data.name}의 회심의 일격! ${target.data.name}에게 ${damage}의 피해!`,
          type: 'player_attack'
        });

        // 타겟 피격 넉백
        this.tweens.add({
          targets: target.sprite,
          x: target.baseX - 8,
          duration: 70,
          yoyo: true
        });

        // 원위치 귀환 트윈
        this.tweens.add({
          targets: hero.sprite,
          x: hero.baseX,
          y: hero.baseY,
          duration: 240,
          ease: 'Power2',
          onComplete: () => {
            if (target.data.hp <= 0) {
              this.handleVictory();
            } else {
              this.resetHeroTurn(this.activeHeroIndex!);
            }
          }
        });
      }
    });
  }

  // [2] 직업별 마법 및 고유 스킬 실행 (VfxManager 연동)
  private executeHeroSkill(hero: HeroSpriteNode, skillId: string) {
    const target = this.enemy!;

    // 몽크 비기: 백열각 (4연속 권격 타격)
    if (skillId === 'flurry') {
      hero.sprite.setTexture(`${hero.data.textureKey}_attack`);
      hero.data.mp = Math.max(0, hero.data.mp - 16);

      VfxManager.playMonkFlurry(
        this,
        hero.sprite,
        hero.baseX,
        hero.baseY,
        target.baseX,
        target.baseY,
        (hitIdx) => {
          const hitDamage = Math.floor(hero.data.atk * 0.7) + Phaser.Math.Between(2, 6);
          this.showDamagePopup(target.baseX, target.baseY - 10 - (hitIdx * 8), hitDamage, hitIdx === 4);
          target.data.hp = Math.max(0, target.data.hp - hitDamage);
        },
        () => {
          EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
            text: `🥋 ${hero.data.name}의 백열각 4연격 대폭발! 적을 맹렬히 압도했습니다!`,
            type: 'player_attack'
          });

          if (target.data.hp <= 0) {
            this.handleVictory();
          } else {
            this.resetHeroTurn(this.activeHeroIndex!);
          }
        }
      );
      return;
    }

    // 백마도사: 케알라 (성광 치유)
    if (skillId === 'cure') {
      hero.sprite.setTexture(`${hero.data.textureKey}_attack`);
      hero.data.mp = Math.max(0, hero.data.mp - 14);

      const wounded = this.heroes
        .filter(h => !h.data.isDead)
        .sort((a, b) => (a.data.hp / a.data.maxHp) - (b.data.hp / b.data.maxHp))[0] || hero;

      const healAmount = 80;
      wounded.data.hp = Math.min(wounded.data.maxHp, wounded.data.hp + healAmount);

      VfxManager.playHealVfx(this, wounded.baseX, wounded.baseY, () => {
        this.updateHeroIdleTexture(wounded);
        this.showDamagePopup(wounded.baseX, wounded.baseY - 20, healAmount, false, true);
        EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
          text: `✨ ${hero.data.name}의 케알라 시전! ${wounded.data.name}의 HP가 ${healAmount} 회복되었습니다.`,
          type: 'heal'
        });

        this.time.delayedCall(300, () => {
          this.resetHeroTurn(this.activeHeroIndex!);
        });
      });
      return;
    }

    // 흑마도사: 파이라 (화염 대폭발)
    if (skillId === 'fire') {
      hero.sprite.setTexture(`${hero.data.textureKey}_attack`);
      hero.data.mp = Math.max(0, hero.data.mp - 15);

      const magicDamage = Math.floor(hero.data.matk * 1.9) + Phaser.Math.Between(8, 16);

      VfxManager.playFireVfx(this, target.baseX, target.baseY, () => {
        this.showDamagePopup(target.baseX, target.baseY - 20, magicDamage, true);
        target.data.hp = Math.max(0, target.data.hp - magicDamage);

        EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
          text: `🔥 ${hero.data.name}의 파이라 시전! ${target.data.name}에게 ${magicDamage}의 대화염 폭발 피해!`,
          type: 'player_attack'
        });

        if (target.data.hp <= 0) {
          this.handleVictory();
        } else {
          this.resetHeroTurn(this.activeHeroIndex!);
        }
      });
      return;
    }

    // 흑마도사: 블리자가 (빙결 고드름 파쇄)
    if (skillId === 'blizzard') {
      hero.sprite.setTexture(`${hero.data.textureKey}_attack`);
      hero.data.mp = Math.max(0, hero.data.mp - 20);

      const magicDamage = Math.floor(hero.data.matk * 2.2) + Phaser.Math.Between(12, 22);

      VfxManager.playIceVfx(this, target.baseX, target.baseY, () => {
        this.showDamagePopup(target.baseX, target.baseY - 20, magicDamage, true);
        target.data.hp = Math.max(0, target.data.hp - magicDamage);

        EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
          text: `❄️ ${hero.data.name}의 블리자가 시전! ${target.data.name}에게 ${magicDamage}의 빙결 파쇄 피해!`,
          type: 'player_attack'
        });

        if (target.data.hp <= 0) {
          this.handleVictory();
        } else {
          this.resetHeroTurn(this.activeHeroIndex!);
        }
      });
      return;
    }

    // 기타 기본 스킬
    this.executeHeroPhysicalAttack(hero);
  }

  // [3] 방어 태세
  private executeHeroDefend(hero: HeroSpriteNode) {
    hero.data.isDefending = true;
    sfx.playCursor();

    const shieldRing = this.add.circle(hero.baseX, hero.baseY, 22, 0x38bdf8, 0.4);
    this.tweens.add({
      targets: shieldRing,
      alpha: 0,
      scale: 1.5,
      duration: 350,
      onComplete: () => shieldRing.destroy()
    });

    EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
      text: `🛡️ ${hero.data.name}이(가) 방어 태세를 취했습니다. (받는 피해 50% 경감)`,
      type: 'system'
    });

    this.resetHeroTurn(this.activeHeroIndex!);
  }

  // 5. 적/보스 반격 액션 AI
  private executeEnemyAction() {
    if (!this.enemy || this.isProcessingAction) return;
    this.isProcessingAction = true;
    const enemy = this.enemy;
    enemy.data.atb = 0;

    const aliveHeroes = this.heroes.filter(h => !h.data.isDead);
    if (aliveHeroes.length === 0) {
      this.handleDefeat();
      return;
    }

    // 제4막 에제키엘 특수 궁극기: 25% 확률로 [천공의 심판] 광역 번개 발동!
    if (this.currentActNumber === 4 && Phaser.Math.Between(1, 4) === 1) {
      const heroPositions = aliveHeroes.map(h => ({ x: h.baseX, y: h.baseY }));

      VfxManager.playEzekielJudgment(this, heroPositions, () => {
        aliveHeroes.forEach(h => {
          const rawDmg = Math.max(15, enemy.data.matk - Math.floor(h.data.def / 2) + Phaser.Math.Between(5, 12));
          const finalDmg = h.data.isDefending ? Math.floor(rawDmg * 0.5) : rawDmg;
          h.data.isDefending = false;
          h.data.hp = Math.max(0, h.data.hp - finalDmg);

          // 피격 포즈 전환
          h.sprite.setTexture(`${h.data.textureKey}_hurt`);
          this.time.delayedCall(220, () => {
            this.updateHeroIdleTexture(h);
          });

          this.showDamagePopup(h.baseX, h.baseY - 20, finalDmg, true);
          if (h.data.hp <= 0) {
            h.data.isDead = true;
            h.sprite.setAlpha(0.35);
          }
        });

        EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
          text: `⚡ 에제키엘의 [천공의 심판] 발동! 파티 전원에게 파멸적인 성벌이 쏟아졌습니다!`,
          type: 'monster_attack'
        });

        this.isProcessingAction = false;
        if (this.heroes.every(h => h.data.isDead)) {
          this.handleDefeat();
        }
      });
      return;
    }

    // 통상 공격 (단일 대상 전진 타격)
    const targetHero = aliveHeroes[Phaser.Math.Between(0, aliveHeroes.length - 1)];

    this.tweens.add({
      targets: enemy.sprite,
      x: targetHero.baseX - 50,
      y: targetHero.baseY,
      duration: 240,
      ease: 'Power2',
      onComplete: () => {
        sfx.playSlash();
        const rawDmg = Math.max(10, enemy.data.atk - Math.floor(targetHero.data.def / 2) + Phaser.Math.Between(2, 8));
        const finalDmg = targetHero.data.isDefending ? Math.floor(rawDmg * 0.5) : rawDmg;
        targetHero.data.isDefending = false;
        targetHero.data.hp = Math.max(0, targetHero.data.hp - finalDmg);

        this.cameras.main.shake(140, 0.01);
        this.showDamagePopup(targetHero.baseX, targetHero.baseY - 20, finalDmg, false);

        // 🌟 타겟 영웅 피격 포즈 전환!
        targetHero.sprite.setTexture(`${targetHero.data.textureKey}_hurt`);
        this.time.delayedCall(220, () => {
          this.updateHeroIdleTexture(targetHero);
        });

        EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
          text: `💀 ${enemy.data.name}의 강력한 일격! ${targetHero.data.name}에게 ${finalDmg} 피해!`,
          type: 'monster_attack'
        });

        if (targetHero.data.hp <= 0) {
          targetHero.data.isDead = true;
          targetHero.sprite.setAlpha(0.35);
        }

        // 보스 복귀 트윈
        this.tweens.add({
          targets: enemy.sprite,
          x: enemy.baseX,
          y: enemy.baseY,
          duration: 250,
          ease: 'Power2',
          onComplete: () => {
            this.isProcessingAction = false;
            if (this.heroes.every(h => h.data.isDead)) {
              this.handleDefeat();
            }
          }
        });
      }
    });
  }

  // 데미지 플로팅 텍스트 연출
  private showDamagePopup(x: number, y: number, amount: number, isCrit: boolean, isHeal: boolean = false) {
    const textStr = isHeal ? `+${amount}` : `-${amount}`;
    const color = isHeal ? '#34d399' : isCrit ? '#f59e0b' : '#ffffff';

    const dmgText = this.add.text(x, y, textStr, {
      fontSize: isCrit ? '20px' : '15px',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgText,
      y: y - 32,
      alpha: 0,
      duration: 850,
      ease: 'Cubic.easeOut',
      onComplete: () => dmgText.destroy()
    });
  }

  // 간단한 이펙트 텍스처 스폰
  private spawnVfx(textureKey: string, x: number, y: number) {
    const vfx = this.add.sprite(x, y, textureKey).setScale(1.8).setAlpha(0.9);
    this.tweens.add({
      targets: vfx,
      scale: 2.5,
      alpha: 0,
      duration: 300,
      onComplete: () => vfx.destroy()
    });
  }

  // 6. 승리 및 패배 처리
  private handleVictory() {
    this.isBattleFinished = true;
    bgm.play('victory');

    // 보스 소멸 페이드아웃
    if (this.enemy) {
      this.tweens.add({
        targets: this.enemy.sprite,
        alpha: 0,
        scale: 0.5,
        duration: 800
      });
    }

    // 🌟 살아남은 모든 조율자: 첨부 이미지와 동일한 [양손 만세 점프 승리 포즈] 연출!
    this.heroes.filter(h => !h.data.isDead).forEach((h, idx) => {
      // 대기 숨쉬기 트윈 정지 후 승리 텍스처 적용
      if (h.idleTween) h.idleTween.stop();
      h.sprite.setTexture(`${h.data.textureKey}_victory`);

      // 양손을 치켜들고 연속으로 튀어오르는 만세 점프 애니메이션 (FF 클래식!)
      this.tweens.add({
        targets: h.sprite,
        y: h.baseY - 20,
        duration: 240,
        yoyo: true,
        repeat: -1,
        delay: idx * 80,
        ease: 'Power2'
      });
    });

    EventBus.emit(GAME_EVENTS.BATTLE_VICTORY, {
      actNumber: this.currentActNumber,
      exp: this.enemy?.data.expReward || 200,
      gold: this.enemy?.data.goldReward || 300
    });
  }

  private handleDefeat() {
    this.isBattleFinished = true;
    bgm.stop();
    EventBus.emit(GAME_EVENTS.BATTLE_DEFEAT, {
      actNumber: this.currentActNumber
    });
  }

  // React 동기화
  private syncStatsToReact() {
    EventBus.emit(GAME_EVENTS.HP_MP_UPDATE, {
      heroes: this.heroes.map(h => h.data),
      enemy: this.enemy ? this.enemy.data : null,
    });
  }

  private setupEventListeners() {
    EventBus.on(GAME_EVENTS.COMMAND_EXECUTE, this.handleCommandExecute, this);
    EventBus.on(GAME_EVENTS.LOAD_ACT, (actNum: 1 | 2 | 3 | 4) => this.loadAct(actNum), this);
    EventBus.on(GAME_EVENTS.RESTART_BATTLE, () => this.loadAct(this.currentActNumber as any), this);
  }

  shutdown() {
    EventBus.off(GAME_EVENTS.COMMAND_EXECUTE, this.handleCommandExecute, this);
    EventBus.off(GAME_EVENTS.LOAD_ACT);
    EventBus.off(GAME_EVENTS.RESTART_BATTLE);
  }
}
