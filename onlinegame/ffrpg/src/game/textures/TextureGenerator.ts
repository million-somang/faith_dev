// ============================================================================
// 16비트 픽셀 리마스터급 오리지널 레트로 픽셀 스프라이트 & VFX 텍스처 생성기
// 1px 다크 아웃라인 + 3단계 명암 셰이딩 + PixelSpriteData 기반 정밀 도트 렌더링
// ============================================================================

import Phaser from 'phaser';

export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene) {
    // 마법 및 전투 VFX 텍스처 생성 (영웅/보스는 64비트 HD 일러스트 에셋 사용)
    this.createVfxTextures(scene);
  }

  // ==========================================================================
  // 마법 및 전투 VFX 텍스처
  // ==========================================================================
  private static createVfxTextures(scene: Phaser.Scene) {
    // 1. 슬래시 호선
    this.drawCanvas(scene, 'vfx_slash', 32, 32, (ctx) => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(16, 16, 12, -Math.PI / 4, Math.PI / 2);
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 2. 파이라 화염구
    this.drawCanvas(scene, 'vfx_fire', 24, 24, (ctx) => {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(12, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(12, 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(12, 12, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. 블리자가 얼음 고드름
    this.drawCanvas(scene, 'vfx_ice', 24, 36, (ctx) => {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(12, 34);
      ctx.lineTo(4, 4);
      ctx.lineTo(20, 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(12, 30);
      ctx.lineTo(6, 6);
      ctx.lineTo(18, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(11, 6, 2, 20);
    });

    // 4. 케알라 십자성광
    this.drawCanvas(scene, 'vfx_heal', 24, 24, (ctx) => {
      ctx.fillStyle = '#059669';
      ctx.fillRect(9, 3, 6, 18);
      ctx.fillRect(3, 9, 18, 6);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(10, 4, 4, 16);
      ctx.fillRect(4, 10, 16, 4);
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(11, 5, 2, 14);
      ctx.fillRect(5, 11, 14, 2);
    });

    // 5. 몽크 펀치 충격파
    this.drawCanvas(scene, 'vfx_punch', 24, 24, (ctx) => {
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(12, 12, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(10, 10, 4, 4);
    });
  }

  // 캔버스 텍스처 생성 헬퍼
  private static drawCanvas(
    scene: Phaser.Scene,
    key: string,
    w: number,
    h: number,
    drawFn: (ctx: CanvasRenderingContext2D) => void
  ) {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, w, h);
    if (!canvas) return;
    drawFn(canvas.context);
    canvas.refresh();
    canvas.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}
