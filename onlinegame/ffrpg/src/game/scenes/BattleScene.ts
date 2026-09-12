// ============================================================================
// Phaser 3 정통 파이널 판타지 사이드뷰 ATB 배틀 씬
// ============================================================================

import Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../../bridge/EventBus';
import { HeroBattleUnit, EnemyBattleUnit, BattleActionPayload } from '../../types/rpg';
import { INITIAL_HEROES, STORY_ACTS } from '../../data/storyData';
import { sfx } from '../../audio/SfxSynthesizer';
import { bgm } from '../../audio/BgmSynthesizer';

interface HeroSpriteNode {
  sprite: Phaser.GameObjects.Sprite;
  baseX: number;
  baseY: number;
  indicator: Phaser.GameObjects.Graphics;
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
  private currentActNumber: number = 1;
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

  // 1. 배틀필드 배경 및 레트로 격자 바닥 렌더링
  private createBattleBackground() {
    const bg = this.add.graphics();

    // 상단 하늘 그라데이션
    bg.fillGradientStyle(0x1e1b4b, 0x1e1b4b, 0x312e81, 0x312e81, 1);
    bg.fillRect(0, 0, 450, 240);

    // 하단 배틀필드 대지
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
    for (let i = 0; i < 20; i++) {
      const px = Phaser.Math.Between(10, 440);
      const py = Phaser.Math.Between(20, 230);
      const star = this.add.circle(px, py, Phaser.Math.Between(1, 2), 0x93c5fd, 0.6);
      this.tweens.add({
        targets: star,
        y: py - 15,
        alpha: 0.1,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // 2. 4막 시나리오 보스 및 파티 배치 로드
  public loadAct(actNum: 1 | 2 | 3 | 4) {
    this.currentActNumber = actNum;
    this.isBattleFinished = false;
    this.isProcessingAction = false;
    this.activeHeroIndex = null;
    this.isPausedForInput = false;

    // 기존 스프라이트 클리어
    this.heroes.forEach(h => {
      h.sprite.destroy();
      h.indicator.destroy();
    });
    this.heroes = [];
    if (this.enemy) {
      this.enemy.sprite.destroy();
      this.enemy = null;
    }

    const actData = STORY_ACTS.find(a => a.actNumber === actNum) || STORY_ACTS[0];

    // BGM 전환: 4막 에제키엘은 보스 전용 테마, 나머지는 일반 배틀 테마
    if (actNum === 4) {
      bgm.play('boss');
    } else {
      bgm.play('battle');
    }

    // 좌측: 보스 유닛 생성 (X: 110, Y: 190)
    const enemyData: EnemyBattleUnit = JSON.parse(JSON.stringify(actData.boss));
    const enemySprite = this.add.sprite(110, 190, enemyData.textureKey).setScale(2.2);
    
    // 보스 숨쉬기 아이들 애니메이션
    this.tweens.add({
      targets: enemySprite,
      y: 186,
      scaleX: 2.25,
      scaleY: 2.15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.enemy = {
      sprite: enemySprite,
      baseX: 110,
      baseY: 190,
      data: enemyData
    };

    // 우측: 4인 조율자 파티 생성 (X: 350~370 세로 정렬)
    const partyPositions = [
      { x: 350, y: 85 },  // 전사 (전열)
      { x: 375, y: 155 }, // 백마도사 (후열)
      { x: 375, y: 225 }, // 흑마도사 (후열)
      { x: 350, y: 295 }, // 몽크 (전열)
    ];

    INITIAL_HEROES.forEach((proto, idx) => {
      const pos = partyPositions[idx];
      const heroData: HeroBattleUnit = JSON.parse(JSON.stringify(proto));
      heroData.atb = idx * 20; // 초기 ATB 분산

      const sprite = this.add.sprite(pos.x, pos.y, heroData.textureKey).setScale(2.0);
      
      // 발밑 턴 인디케이터 (황금 링)
      const indicator = this.add.graphics();
      indicator.lineStyle(2, 0xfacc15, 0.9);
      indicator.strokeEllipse(pos.x, pos.y + 26, 24, 10);
      indicator.setVisible(false);

      this.heroes.push({
        sprite,
        baseX: pos.x,
        baseY: pos.y,
        indicator,
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

    // 2) 적 ATB 누적 (영웅이 입력 대기 중이 아닐 때)
    if (!turnReadyFound && this.enemy && !this.enemy.data.hp <= 0 && this.activeHeroIndex === null) {
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

  // 영웅 턴 종료 및 원위치 복귀
  private resetHeroTurn(heroIndex: number) {
    const hero = this.heroes[heroIndex];
    hero.data.atb = 0;
    hero.indicator.setVisible(false);

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

  // [1] 물리 공격 (전진 대시 ➡️ 슬래시 ➡️ 타격 ➡️ 복귀)
  private executeHeroPhysicalAttack(hero: HeroSpriteNode) {
    const target = this.enemy!;
    const damage = Math.max(8, hero.data.atk - Math.floor(target.data.def / 2) + Phaser.Math.Between(1, 6));

    // 고속 대시 (X: 180)
    this.tweens.add({
      targets: hero.sprite,
      x: 180,
      y: target.baseY,
      duration: 220,
      ease: 'Power2',
      onComplete: () => {
        // 슬래시 FX 및 사운드
        sfx.playSlash();
        this.spawnVfx('vfx_slash', target.baseX, target.baseY);

        // 보스 피격 흔들림
        this.cameras.main.shake(120, 0.008);
        this.showDamagePopup(target.baseX, target.baseY - 20, damage, false);

        target.data.hp = Math.max(0, target.data.hp - damage);

        EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
          text: `⚔️ ${hero.data.name}의 돌진 공격! ${target.data.name}에게 ${damage}의 물리 피해!`,
          type: 'player_attack'
        });

        // 원위치 귀환 트윈
        this.tweens.add({
          targets: hero.sprite,
          x: hero.baseX,
          y: hero.baseY,
          duration: 250,
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

  // [2] 직업별 마법 및 고유 스킬 실행
  private executeHeroSkill(hero: HeroSpriteNode, skillId: string) {
    const target = this.enemy!;

    if (skillId === 'flurry') {
      // 몽크의 백열각 (4연타 펀치 대시)
      this.executeMonkFlurry(hero, target);
      return;
    }

    if (skillId === 'cure') {
      // 백마도사의 케알라 (HP 최저 아군 힐)
      this.executeHealSpell(hero);
      return;
    }

    // 마법 영창 (파이라 / 블리자가)
    const isFire = skillId === 'fire';
    hero.data.mp = Math.max(0, hero.data.mp - 15);
    sfx.playFireMagic();

    // 발밑 마법진 오라
    const aura = this.add.circle(hero.baseX, hero.baseY + 15, 18, isFire ? 0xf97316 : 0x38bdf8, 0.5);
    this.tweens.add({
      targets: aura,
      scale: 1.6,
      alpha: 0,
      duration: 450,
      onComplete: () => aura.destroy()
    });

    const magicDamage = Math.floor(hero.data.matk * 1.8) + Phaser.Math.Between(5, 12);

    // 타겟 지점에 파이어/마법 폭발
    this.time.delayedCall(200, () => {
      this.spawnVfx('vfx_fire', target.baseX, target.baseY);
      this.cameras.main.shake(150, 0.012);
      this.showDamagePopup(target.baseX, target.baseY - 20, magicDamage, true);
      target.data.hp = Math.max(0, target.data.hp - magicDamage);

      EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
        text: `🔥 ${hero.data.name}의 대마법 시전! ${target.data.name}에게 ${magicDamage}의 막대한 속성 피해!`,
        type: 'player_attack'
      });

      if (target.data.hp <= 0) {
        this.handleVictory();
      } else {
        this.resetHeroTurn(this.activeHeroIndex!);
      }
    });
  }

  // 몽크 전용 4연타 [백열각] 트윈
  private executeMonkFlurry(hero: HeroSpriteNode, target: EnemySpriteNode) {
    hero.data.mp = Math.max(0, hero.data.mp - 16);

    this.tweens.add({
      targets: hero.sprite,
      x: 170,
      y: target.baseY,
      duration: 180,
      onComplete: () => {
        let count = 0;
        const totalHits = 4;

        const punchTimer = this.time.addEvent({
          delay: 90,
          repeat: totalHits - 1,
          callback: () => {
            count++;
            sfx.playPunch();
            const singleDmg = Math.floor((hero.data.atk * 0.65) + Phaser.Math.Between(2, 6));
            this.spawnVfx('vfx_punch', target.baseX + Phaser.Math.Between(-10, 10), target.baseY + Phaser.Math.Between(-10, 10));
            this.showDamagePopup(target.baseX, target.baseY - 15 - (count * 6), singleDmg, count === 4);
            target.data.hp = Math.max(0, target.data.hp - singleDmg);

            if (count === totalHits) {
              // 4연타 완료 후 넉백 및 복귀
              this.tweens.add({
                targets: target.sprite,
                x: target.baseX - 15,
                duration: 100,
                yoyo: true
              });

              this.tweens.add({
                targets: hero.sprite,
                x: hero.baseX,
                y: hero.baseY,
                duration: 250,
                ease: 'Power2',
                onComplete: () => {
                  EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
                    text: `🥋 ${hero.data.name}의 백열각 4연격 폭발! 적을 맹렬히 압도했습니다!`,
                    type: 'player_attack'
                  });

                  if (target.data.hp <= 0) {
                    this.handleVictory();
                  } else {
                    this.resetHeroTurn(this.activeHeroIndex!);
                  }
                }
              });
            }
          }
        });
      }
    });
  }

  // 케알라 치유 마법
  private executeHealSpell(hero: HeroSpriteNode) {
    hero.data.mp = Math.max(0, hero.data.mp - 14);
    sfx.playHealChime();

    // HP 비율이 가장 낮은 아군 타겟팅
    const wounded = this.heroes
      .filter(h => !h.data.isDead)
      .sort((a, b) => (a.data.hp / a.data.maxHp) - (b.data.hp / b.data.maxHp))[0] || hero;

    const healAmount = 75;
    wounded.data.hp = Math.min(wounded.data.maxHp, wounded.data.hp + healAmount);

    this.spawnVfx('vfx_heal', wounded.baseX, wounded.baseY);
    this.showDamagePopup(wounded.baseX, wounded.baseY - 20, healAmount, false, true);

    EventBus.emit(GAME_EVENTS.LOG_MESSAGE, {
      text: `✨ ${hero.data.name}의 케알라 시전! ${wounded.data.name}의 HP가 ${healAmount} 회복되었습니다.`,
      type: 'heal'
    });

    this.time.delayedCall(400, () => {
      this.resetHeroTurn(this.activeHeroIndex!);
    });
  }

  // [3] 방어 태세
  private executeHeroDefend(hero: HeroSpriteNode) {
    hero.data.isDefending = true;
    sfx.playCursor();

    const shieldRing = this.add.circle(hero.baseX, hero.baseY, 20, 0x38bdf8, 0.4);
    this.tweens.add({
      targets: shieldRing,
      alpha: 0,
      scale: 1.4,
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

    // 살아있는 영웅 중 랜덤 타겟 선정 (전사가 어그로 우선)
    const aliveHeroes = this.heroes.filter(h => !h.data.isDead);
    if (aliveHeroes.length === 0) {
      this.handleDefeat();
      return;
    }

    const targetHero = aliveHeroes[Phaser.Math.Between(0, aliveHeroes.length - 1)];

    // 보스 전진 대시
    this.tweens.add({
      targets: enemy.sprite,
      x: targetHero.baseX - 50,
      y: targetHero.baseY,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        if (enemy.data.isBoss && Phaser.Math.Between(1, 3) === 1) {
          sfx.playThunder();
        } else {
          sfx.playSlash();
        }

        const rawDmg = Math.max(10, enemy.data.atk - Math.floor(targetHero.data.def / 2) + Phaser.Math.Between(2, 8));
        const finalDmg = targetHero.data.isDefending ? Math.floor(rawDmg * 0.5) : rawDmg;
        targetHero.data.isDefending = false;
        targetHero.data.hp = Math.max(0, targetHero.data.hp - finalDmg);

        this.cameras.main.shake(140, 0.01);
        this.showDamagePopup(targetHero.baseX, targetHero.baseY - 20, finalDmg, false);

        // 피격 영웅 플래시 효과
        targetHero.sprite.setTint(0xef4444);
        this.time.delayedCall(150, () => targetHero.sprite.clearTint());

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
    const color = isHeal ? '#10b981' : isCrit ? '#f59e0b' : '#ffffff';

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
      y: y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => dmgText.destroy()
    });
  }

  // 간단한 이펙트 텍스처 스폰
  private spawnVfx(textureKey: string, x: number, y: number) {
    const vfx = this.add.sprite(x, y, textureKey).setScale(1.8).setAlpha(0.9);
    this.tweens.add({
      targets: vfx,
      scale: 2.4,
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

    // 살아남은 영웅들의 FF 승리 축하 점프 포즈
    this.heroes.filter(h => !h.data.isDead).forEach((h, idx) => {
      this.tweens.add({
        targets: h.sprite,
        y: h.baseY - 18,
        duration: 250,
        yoyo: true,
        repeat: 5,
        delay: idx * 60
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

  // 이벤트 리스너 바인딩
  private setupEventListeners() {
    EventBus.on(GAME_EVENTS.COMMAND_EXECUTE, this.handleCommandExecute, this);
    EventBus.on(GAME_EVENTS.LOAD_ACT, (actNum: 1 | 2 | 3 | 4) => this.loadAct(actNum), this);
    EventBus.on(GAME_EVENTS.RESTART_BATTLE, () => this.loadAct(this.currentActNumber as any), this);
  }

  // 언마운트 시 클린업
  shutdown() {
    EventBus.off(GAME_EVENTS.COMMAND_EXECUTE, this.handleCommandExecute, this);
    EventBus.off(GAME_EVENTS.LOAD_ACT);
    EventBus.off(GAME_EVENTS.RESTART_BATTLE);
  }
}
