// ============================================================================
// Phaser 3 고급 마법 및 스킬 특수효과 (VFX) 매니저
// ============================================================================

import Phaser from 'phaser';
import { sfx } from '../../audio/SfxSynthesizer';

export class VfxManager {
  // 1. 흑마법: 파이라 (Fira - 회전 화염구 ➡️ 거대 폭발 ➡️ 화면 플래시)
  public static playFireVfx(scene: Phaser.Scene, targetX: number, targetY: number, onImpact?: () => void) {
    sfx.playFireMagic();

    // 1) 캐스터 발밑 화염 회전 오라
    const aura = scene.add.circle(targetX + 120, targetY, 20, 0xf97316, 0.6);
    aura.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: aura,
      scaleX: 1.8,
      scaleY: 0.6,
      alpha: 0,
      duration: 350,
      onComplete: () => aura.destroy()
    });

    // 2) 비행 화염구 (Fireball)
    const fireball = scene.add.sprite(targetX + 120, targetY - 20, 'vfx_fire').setScale(1.5);
    fireball.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: fireball,
      x: targetX,
      y: targetY,
      rotation: Math.PI * 4,
      duration: 260,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        fireball.destroy();

        // 3) 대폭발 파티클 방출 (16개의 불꽃 조각 사방 비산)
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          const dist = Phaser.Math.Between(25, 55);
          const spark = scene.add.circle(targetX, targetY, Phaser.Math.Between(3, 6), 0xfbbf24, 0.9);
          spark.setBlendMode(Phaser.BlendModes.ADD);

          scene.tweens.add({
            targets: spark,
            x: targetX + Math.cos(angle) * dist,
            y: targetY + Math.sin(angle) * dist,
            scale: 0.2,
            alpha: 0,
            duration: Phaser.Math.Between(300, 500),
            ease: 'Power2',
            onComplete: () => spark.destroy()
          });
        }

        // 4) 중심부 화염 폭발 버스트
        const burst = scene.add.sprite(targetX, targetY, 'vfx_fire').setScale(1.0);
        burst.setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
          targets: burst,
          scale: 3.2,
          alpha: 0,
          duration: 380,
          onComplete: () => burst.destroy()
        });

        // 5) 화면 주황 플래시 및 카메라 흔들림
        scene.cameras.main.flash(120, 249, 115, 22, true);
        scene.cameras.main.shake(160, 0.012);

        if (onImpact) onImpact();
      }
    });
  }

  // 2. 흑마법: 블리자가 (Blizzaga - 절대영도 빙결 고드름 급강하 파쇄)
  public static playIceVfx(scene: Phaser.Scene, targetX: number, targetY: number, onImpact?: () => void) {
    sfx.playFireMagic(); // 고주파 마법음

    // 1) 바닥에 서리 링 생성
    const frostRing = scene.add.ellipse(targetX, targetY + 25, 60, 20, 0x38bdf8, 0.5);
    frostRing.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: frostRing,
      scaleX: 1.5,
      alpha: 0,
      duration: 600,
      onComplete: () => frostRing.destroy()
    });

    // 2) 하늘에서 3개의 거대 고드름 급강하
    const delays = [0, 80, 160];
    delays.forEach((delay, idx) => {
      scene.time.delayedCall(delay, () => {
        const offset = (idx - 1) * 22;
        const icicle = scene.add.sprite(targetX + offset, targetY - 140, 'vfx_ice').setScale(2.2);
        icicle.setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
          targets: icicle,
          y: targetY,
          duration: 180,
          ease: 'Power3',
          onComplete: () => {
            icicle.destroy();

            // 산산조각 파편 스파크
            for (let p = 0; p < 8; p++) {
              const spark = scene.add.rectangle(
                targetX + offset,
                targetY,
                Phaser.Math.Between(2, 4),
                Phaser.Math.Between(4, 8),
                0xe0f2fe
              );
              spark.setBlendMode(Phaser.BlendModes.ADD);
              spark.setRotation(Phaser.Math.FloatBetween(-1, 1));

              scene.tweens.add({
                targets: spark,
                x: spark.x + Phaser.Math.Between(-35, 35),
                y: spark.y + Phaser.Math.Between(-40, 20),
                alpha: 0,
                duration: 350,
                onComplete: () => spark.destroy()
              });
            }

            if (idx === delays.length - 1) {
              scene.cameras.main.flash(100, 56, 189, 248, true);
              scene.cameras.main.shake(140, 0.009);
              if (onImpact) onImpact();
            }
          }
        });
      });
    });
  }

  // 3. 백마법: 케알라 (Curaja - 성스러운 빛기둥과 회전 십자광선)
  public static playHealVfx(scene: Phaser.Scene, targetX: number, targetY: number, onImpact?: () => void) {
    sfx.playHealChime();

    // 1) 하늘에서 쏟아지는 성광 기둥 (Holy Beam)
    const beam = scene.add.rectangle(targetX, targetY - 60, 28, 220, 0x34d399, 0.65);
    beam.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: beam,
      scaleX: 1.4,
      alpha: 0,
      duration: 550,
      onComplete: () => beam.destroy()
    });

    // 2) 회전하며 솟아오르는 4개의 십자성광 (+)
    for (let i = 0; i < 6; i++) {
      scene.time.delayedCall(i * 60, () => {
        const star = scene.add.sprite(
          targetX + Phaser.Math.Between(-18, 18),
          targetY + 15,
          'vfx_heal'
        ).setScale(1.2);
        star.setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
          targets: star,
          y: targetY - 45,
          rotation: Math.PI * 2,
          scale: 0.6,
          alpha: 0,
          duration: 650,
          ease: 'Sine.easeOut',
          onComplete: () => star.destroy()
        });
      });
    }

    if (onImpact) onImpact();
  }

  // 4. 몽크 비기: 백열각 (Flurry of 100 Fists - 반투명 잔상 대시 + 4연타 권격)
  public static playMonkFlurry(
    scene: Phaser.Scene,
    monkSprite: Phaser.GameObjects.Sprite,
    baseX: number,
    baseY: number,
    targetX: number,
    targetY: number,
    onHit: (hitIndex: number) => void,
    onComplete: () => void
  ) {
    // 1) 잔상(Afterimage)을 남기며 목표 앞 35px 지점으로 순간 급속 대시
    const destX = targetX + 50;

    // 잔상 스폰
    const ghost = scene.add.sprite(monkSprite.x, monkSprite.y, monkSprite.texture.key)
      .setScale(monkSprite.scaleX, monkSprite.scaleY)
      .setAlpha(0.55);
    scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 200,
      onComplete: () => ghost.destroy()
    });

    scene.tweens.add({
      targets: monkSprite,
      x: destX,
      y: targetY,
      duration: 140,
      ease: 'Power2',
      onComplete: () => {
        // 2) 4연속 펀치 타격 루프 (80ms 간격)
        let hit = 0;
        const hitTimer = scene.time.addEvent({
          delay: 85,
          repeat: 3,
          callback: () => {
            hit++;
            sfx.playPunch();

            // 충격파 링 스폰
            const punchX = targetX + Phaser.Math.Between(-8, 8);
            const punchY = targetY + Phaser.Math.Between(-10, 10);
            const ring = scene.add.sprite(punchX, punchY, 'vfx_punch').setScale(1.2);
            ring.setBlendMode(Phaser.BlendModes.ADD);

            scene.tweens.add({
              targets: ring,
              scale: 2.2,
              alpha: 0,
              duration: 180,
              onComplete: () => ring.destroy()
            });

            // 몽크 주먹 흔들림
            monkSprite.x = destX + (hit % 2 === 1 ? -6 : 4);

            onHit(hit);

            if (hit === 4) {
              // 4타 피니시: 강력한 넉백 & 크리티컬 카메라 셰이크
              scene.cameras.main.shake(120, 0.01);
              scene.cameras.main.flash(80, 251, 191, 36, true);

              // 3) 멋진 백덤블링 원위치 복귀 트윈
              scene.tweens.add({
                targets: monkSprite,
                x: baseX,
                y: baseY,
                duration: 240,
                ease: 'Power2',
                onComplete: () => {
                  onComplete();
                }
              });
            }
          }
        });
      }
    });
  }

  // 5. 제4막 최종보스 에제키엘: 천공의 심판 (Judgment of the Firmament)
  public static playEzekielJudgment(
    scene: Phaser.Scene,
    heroes: { x: number; y: number }[],
    onComplete?: () => void
  ) {
    sfx.playThunder();

    // 1) 화면 짙은 암전 (Darkening)
    const darkOverlay = scene.add.rectangle(225, 190, 450, 380, 0x0f172a, 0);
    scene.tweens.add({
      targets: darkOverlay,
      fillAlpha: 0.7,
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => darkOverlay.destroy()
    });

    // 2) 영웅들 전역을 강타하는 4개의 거대 황금 벼락 기둥
    heroes.forEach((h, idx) => {
      scene.time.delayedCall(idx * 80, () => {
        const lightning = scene.add.rectangle(h.x, h.y - 100, 16, 280, 0xfacc15, 0.9);
        lightning.setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
          targets: lightning,
          scaleX: 2.2,
          alpha: 0,
          duration: 350,
          onComplete: () => lightning.destroy()
        });
      });
    });

    // 3) 대폭발 플래시 & 대지 흔들림
    scene.time.delayedCall(320, () => {
      scene.cameras.main.flash(200, 254, 240, 138, true);
      scene.cameras.main.shake(300, 0.02);
      if (onComplete) onComplete();
    });
  }
}
