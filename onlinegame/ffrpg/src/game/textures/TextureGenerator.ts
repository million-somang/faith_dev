// ============================================================================
// HTML5 Canvas 기반 무의존성 절차적 16비트 레트로 픽셀 스프라이트 생성기
// 외부 이미지 다운로드 없이 브라우저 런타임에서 즉시 텍스처를 렌더링
// ============================================================================

import Phaser from 'phaser';

export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene) {
    this.createHeroWarrior(scene);
    this.createHeroWhiteMage(scene);
    this.createHeroBlackMage(scene);
    this.createHeroMonk(scene);

    this.createBossGolem(scene);
    this.createBossKraken(scene);
    this.createBossBahamut(scene);
    this.createBossEzekiel(scene);

    this.createVfxTextures(scene);
  }

  // 1. 전사 (Warrior) 스프라이트
  private static createHeroWarrior(scene: Phaser.Scene) {
    if (scene.textures.exists('hero_warrior')) return;
    const canvas = scene.textures.createCanvas('hero_warrior', 32, 32);
    if (!canvas) return;
    const ctx = canvas.context;

    // 은색 투구 & 얼굴
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(10, 4, 12, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(12, 6, 8, 4);
    // 살구색 얼굴
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(13, 10, 6, 4);

    // 붉은색 망토 (등 뒤)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(7, 14, 4, 12);

    // 파란색 판금 갑옷
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(11, 14, 10, 10);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(13, 16, 6, 6);

    // 은색 장검
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(23, 8, 3, 16);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(21, 20, 7, 3); // 손잡이 코등이

    // 원형 방패 (왼팔)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(8, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(7, 17, 2, 2);

    // 바지 & 부츠
    ctx.fillStyle = '#334155';
    ctx.fillRect(11, 24, 4, 6);
    ctx.fillRect(17, 24, 4, 6);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 28, 5, 3);
    ctx.fillRect(17, 28, 5, 3);

    canvas.refresh();
  }

  // 2. 백마도사 (White Mage) 스프라이트
  private static createHeroWhiteMage(scene: Phaser.Scene) {
    if (scene.textures.exists('hero_white_mage')) return;
    const canvas = scene.textures.createCanvas('hero_white_mage', 32, 32);
    if (!canvas) return;
    const ctx = canvas.context;

    // 흰색 후드
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(10, 4, 12, 10);
    // 붉은 삼각 문양 테두리 (FF 상징)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 4, 3, 3);
    ctx.fillRect(19, 4, 3, 3);

    // 얼굴
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(13, 9, 6, 4);

    // 흰색 롱 로브
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(10, 14, 12, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 24, 12, 3); // 하단 붉은 띠

    // 치유의 마법 지팡이
    ctx.fillStyle = '#78350f';
    ctx.fillRect(23, 6, 2, 22);
    ctx.fillStyle = '#10b981'; // 에메랄드 보석
    ctx.beginPath();
    ctx.arc(24, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // 3. 흑마도사 (Black Mage) 스프라이트
  private static createHeroBlackMage(scene: Phaser.Scene) {
    if (scene.textures.exists('hero_black_mage')) return;
    const canvas = scene.textures.createCanvas('hero_black_mage', 32, 32);
    if (!canvas) return;
    const ctx = canvas.context;

    // 갈색/남색 원뿔형 고깔 마법 모자
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.moveTo(16, 2);
    ctx.lineTo(8, 12);
    ctx.lineTo(24, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f59e0b'; // 모자 띠
    ctx.fillRect(8, 11, 16, 2);

    // 검은 그림자 얼굴 & 발광 노란 눈
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 13, 12, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(13, 15, 2, 2);
    ctx.fillRect(17, 15, 2, 2);

    // 푸른 마도사 로브
    ctx.fillStyle = '#3730a3';
    ctx.fillRect(10, 19, 12, 10);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(12, 20, 8, 8);

    // 마법 구체 (오른손)
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(24, 20, 3.5, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // 4. 몽크 (Monk) 스프라이트
  private static createHeroMonk(scene: Phaser.Scene) {
    if (scene.textures.exists('hero_monk')) return;
    const canvas = scene.textures.createCanvas('hero_monk', 32, 32);
    if (!canvas) return;
    const ctx = canvas.context;

    // 검은 머리 & 붉은 머리띠
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(11, 4, 10, 8);
    ctx.fillStyle = '#ef4444'; // 붉은 머리띠
    ctx.fillRect(10, 7, 12, 2);
    ctx.fillRect(7, 8, 3, 5); // 펄럭이는 머리띠 끈

    // 다부진 얼굴
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(12, 9, 8, 5);

    // 주황색 민소매 도복
    ctx.fillStyle = '#f97316';
    ctx.fillRect(10, 14, 12, 10);
    ctx.fillStyle = '#1e293b'; // 허리띠
    ctx.fillRect(10, 20, 12, 3);

    // 하얀 붕대 권투 주먹 (양손)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(6, 17, 4, 4);
    ctx.fillRect(22, 15, 4, 4);

    // 도복 바지 & 신발
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(11, 23, 4, 6);
    ctx.fillRect(17, 23, 4, 6);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 28, 5, 3);
    ctx.fillRect(17, 28, 5, 3);

    canvas.refresh();
  }

  // 보스 1: 유적 수호 골렘 (48×48)
  private static createBossGolem(scene: Phaser.Scene) {
    if (scene.textures.exists('boss_golem')) return;
    const canvas = scene.textures.createCanvas('boss_golem', 48, 48);
    if (!canvas) return;
    const ctx = canvas.context;

    // 거대 암석 몸통
    ctx.fillStyle = '#78716c';
    ctx.fillRect(12, 12, 24, 24);
    ctx.fillStyle = '#57534e';
    ctx.fillRect(16, 16, 16, 16);

    // 암석 머리 & 어깨
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(16, 4, 16, 10);
    ctx.fillRect(6, 14, 8, 12);
    ctx.fillRect(34, 14, 8, 12);

    // 코어의 빛나는 푸른 마법 룬
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(24, 24, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(23, 23, 2, 2);

    // 바위 다리
    ctx.fillStyle = '#44403c';
    ctx.fillRect(14, 36, 8, 10);
    ctx.fillRect(26, 36, 8, 10);

    canvas.refresh();
  }

  // 보스 2: 심연수 네더 크라켄 (48×48)
  private static createBossKraken(scene: Phaser.Scene) {
    if (scene.textures.exists('boss_kraken')) return;
    const canvas = scene.textures.createCanvas('boss_kraken', 48, 48);
    if (!canvas) return;
    const ctx = canvas.context;

    // 심연 보라 촉수 두부
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.arc(24, 18, 14, 0, Math.PI * 2);
    ctx.fill();

    // 붉은 발광 눈
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(18, 16, 3, 3);
    ctx.fillRect(27, 16, 3, 3);

    // 꿈틀거리는 5가닥 촉수
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(10, 28, 4, 16);
    ctx.fillRect(16, 30, 4, 14);
    ctx.fillRect(22, 32, 4, 15);
    ctx.fillRect(28, 30, 4, 14);
    ctx.fillRect(34, 28, 4, 16);

    canvas.refresh();
  }

  // 보스 3: 바하무트의 허상 (52×52)
  private static createBossBahamut(scene: Phaser.Scene) {
    if (scene.textures.exists('boss_bahamut')) return;
    const canvas = scene.textures.createCanvas('boss_bahamut', 52, 52);
    if (!canvas) return;
    const ctx = canvas.context;

    // 드래곤 거대 날개
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(26, 18);
    ctx.lineTo(4, 8);
    ctx.lineTo(12, 28);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(26, 18);
    ctx.lineTo(48, 8);
    ctx.lineTo(40, 28);
    ctx.closePath();
    ctx.fill();

    // 칠흑의 비늘 용 몸통 & 꼬리
    ctx.fillStyle = '#312e81';
    ctx.fillRect(18, 16, 16, 22);

    // 용 머리 & 뿔
    ctx.fillStyle = '#4338ca';
    ctx.fillRect(20, 6, 12, 12);
    ctx.fillStyle = '#f59e0b'; // 황금 뿔
    ctx.fillRect(16, 2, 4, 6);
    ctx.fillRect(32, 2, 4, 6);

    // 용의 붉은 안광
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(22, 10, 2, 2);
    ctx.fillRect(28, 10, 2, 2);

    canvas.refresh();
  }

  // 보스 4: 대사제 에제키엘 (48×48)
  private static createBossEzekiel(scene: Phaser.Scene) {
    if (scene.textures.exists('boss_ezekiel')) return;
    const canvas = scene.textures.createCanvas('boss_ezekiel', 48, 48);
    if (!canvas) return;
    const ctx = canvas.context;

    // 부유하는 황금 성광 후광 (Halo)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 12, 10, 0, Math.PI * 2);
    ctx.stroke();

    // 순백과 황금의 대사제 제의 (Vestments)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 16, 16, 26);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, 16, 4, 26); // 황금 영대

    // 에제키엘 얼굴 & 주교관
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(20, 10, 8, 7);
    ctx.fillStyle = '#f59e0b'; // 주교관 모자
    ctx.beginPath();
    ctx.moveTo(24, 2);
    ctx.lineTo(18, 9);
    ctx.lineTo(30, 9);
    ctx.closePath();
    ctx.fill();

    // 양손에 든 왜곡된 창조신의 오브
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(12, 26, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(36, 26, 4, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // 전투 VFX 텍스처 모음
  private static createVfxTextures(scene: Phaser.Scene) {
    // 1. 슬래시 궤적
    if (!scene.textures.exists('vfx_slash')) {
      const c = scene.textures.createCanvas('vfx_slash', 32, 32);
      if (c) {
        const ctx = c.context;
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(16, 16, 12, -Math.PI / 4, Math.PI / 2);
        ctx.stroke();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();
        c.refresh();
      }
    }

    // 2. 화염 폭발
    if (!scene.textures.exists('vfx_fire')) {
      const c = scene.textures.createCanvas('vfx_fire', 24, 24);
      if (c) {
        const ctx = c.context;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(12, 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(12, 12, 5, 0, Math.PI * 2);
        ctx.fill();
        c.refresh();
      }
    }

    // 3. 치유 십자성광
    if (!scene.textures.exists('vfx_heal')) {
      const c = scene.textures.createCanvas('vfx_heal', 24, 24);
      if (c) {
        const ctx = c.context;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(10, 4, 4, 16);
        ctx.fillRect(4, 10, 16, 4);
        ctx.fillStyle = '#a7f3d0';
        ctx.fillRect(11, 6, 2, 12);
        ctx.fillRect(6, 11, 12, 2);
        c.refresh();
      }
    }

    // 4. 주먹 충격파
    if (!scene.textures.exists('vfx_punch')) {
      const c = scene.textures.createCanvas('vfx_punch', 20, 20);
      if (c) {
        const ctx = c.context;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(10, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(10, 10, 4, 0, Math.PI * 2);
        ctx.fill();
        c.refresh();
      }
    }
  }
}
