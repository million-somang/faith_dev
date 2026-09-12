// ============================================================================
// 16비트 픽셀 리마스터급 오리지널 레트로 픽셀 스프라이트 & VFX 텍스처 생성기
// 1px 다크 아웃라인 + 3단계 명암 셰이딩 + 대기/공격/피격/승리만세 모션 텍스처
// ============================================================================

import Phaser from 'phaser';

export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene) {
    this.createWarriorSet(scene);
    this.createWhiteMageSet(scene);
    this.createBlackMageSet(scene);
    this.createMonkSet(scene);

    this.createBossGolem(scene);
    this.createBossKraken(scene);
    this.createBossBahamut(scene);
    this.createBossEzekiel(scene);

    this.createVfxTextures(scene);
  }

  // ==========================================================================
  // 1. 전사 (Warrior - 아르반) : 대기, 공격, 피격, 승리만세 4종 텍스처
  // ==========================================================================
  private static createWarriorSet(scene: Phaser.Scene) {
    // 1-1. 대기 (Idle)
    this.drawCanvas(scene, 'hero_warrior_idle', 32, 32, (ctx) => {
      this.drawWarriorBase(ctx, 0, false, false, false);
    });

    // 1-2. 공격 (Attack / Slash)
    this.drawCanvas(scene, 'hero_warrior_attack', 32, 32, (ctx) => {
      this.drawWarriorBase(ctx, 0, true, false, false);
    });

    // 1-3. 피격 (Hurt)
    this.drawCanvas(scene, 'hero_warrior_hurt', 32, 32, (ctx) => {
      this.drawWarriorBase(ctx, 0, false, true, false, false);
    });

    // 1-4. 빈사 (Danger - HP 25% 이하 무릎 꿇기)
    this.drawCanvas(scene, 'hero_warrior_danger', 32, 32, (ctx) => {
      this.drawWarriorBase(ctx, 4, false, false, false, true);
    });

    // 1-5. 승리 (Victory - 양손 만세 점프 포즈!)
    this.drawCanvas(scene, 'hero_warrior_victory', 32, 32, (ctx) => {
      this.drawWarriorBase(ctx, 0, false, false, true, false);
    });
  }

  private static drawWarriorBase(
    ctx: CanvasRenderingContext2D,
    _offsetY: number,
    isAttack: boolean,
    isHurt: boolean,
    isVictory: boolean,
    isDanger: boolean = false
  ) {
    ctx.save();
    if (isDanger) {
      ctx.translate(0, 4);
    }
    const ox = isHurt ? 2 : 0;

    // [망토 - Crimson Red]
    ctx.fillStyle = '#7f1d1d'; // 다크 아웃라인/그림자
    ctx.fillRect(ox + (isVictory ? 5 : 7), 13, isVictory ? 18 : 6, 15);
    ctx.fillStyle = '#dc2626'; // 기본 빨강
    ctx.fillRect(ox + (isVictory ? 6 : 8), 14, isVictory ? 16 : 4, 13);
    ctx.fillStyle = '#f87171'; // 하이라이트
    ctx.fillRect(ox + 8, 14, 2, 8);

    // [투구 & 은빛 서클릿 - 1px 다크 아웃라인]
    ctx.fillStyle = '#0f172a'; // 외곽선
    ctx.fillRect(ox + 9, 3, 14, 11);
    ctx.fillStyle = '#64748b'; // 투구 음영
    ctx.fillRect(ox + 10, 4, 12, 9);
    ctx.fillStyle = '#cbd5e1'; // 투구 기본
    ctx.fillRect(ox + 11, 4, 10, 7);
    ctx.fillStyle = '#f8fafc'; // 투구 하이라이트
    ctx.fillRect(ox + 12, 5, 4, 2);

    // 황금 날개 서클릿
    ctx.fillStyle = '#b45309';
    ctx.fillRect(ox + 9, 7, 14, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(ox + 10, 7, 12, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(ox + 15, 6, 2, 2); // 중심 이마 보석

    // [얼굴]
    ctx.fillStyle = '#ea580c'; // 턱 그림자
    ctx.fillRect(ox + 12, 9, 7, 4);
    ctx.fillStyle = '#fed7aa'; // 살구색 피부
    ctx.fillRect(ox + 12, 9, 7, 3);
    // 푸른 눈동자
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(ox + 13, 10, 2, 2);

    // [파란색 판금 흉갑 (Cobalt Armor)]
    ctx.fillStyle = '#0f172a'; // 외곽선
    ctx.fillRect(ox + 10, 13, 11, 10);
    ctx.fillStyle = '#1e3a8a'; // 갑옷 그림자
    ctx.fillRect(ox + 11, 14, 9, 8);
    ctx.fillStyle = '#2563eb'; // 갑옷 기본 코발트
    ctx.fillRect(ox + 12, 14, 7, 7);
    ctx.fillStyle = '#60a5fa'; // 갑옷 하이라이트
    ctx.fillRect(ox + 13, 15, 3, 4);

    // [팔 & 무기 상태별 분기]
    if (isVictory) {
      // 🌟 양손 만세 승리 포즈 (FF 픽셀 리마스터 대표 포즈!)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 6, 2, 4, 12);
      ctx.fillRect(ox + 18, 2, 4, 12);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(ox + 7, 3, 2, 10);
      ctx.fillRect(ox + 19, 3, 2, 10);
      // 건틀릿 주먹
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(ox + 6, 1, 4, 3);
      ctx.fillRect(ox + 18, 1, 4, 3);
    } else if (isAttack) {
      // ⚔️ 전진 공격 모션: 검을 전방 대각선으로 크게 내리베는 포즈
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 19, 6, 12, 18);
      // 강철 칼날
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ox + 20, 7, 4, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(ox + 23, 8, 2, 10);
      // 황금 코등이 & 손잡이
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox + 19, 18, 7, 2);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ox + 21, 20, 3, 4);
    } else {
      // 대기 자세: 방패와 장검 착용
      // 원형 방패 (왼팔)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 6, 14, 6, 8);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(ox + 7, 15, 4, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox + 8, 16, 2, 4);

      // 장검 (오른손)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ox + 21, 10, 2, 13);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox + 19, 19, 5, 2);
    }

    // [바지 & 철갑 부츠]
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 11, 23, 9, 8);
    ctx.fillStyle = '#475569';
    ctx.fillRect(ox + 12, 23, 3, 6);
    ctx.fillRect(ox + 16, 23, 3, 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(ox + 11, 28, 4, 3);
    ctx.fillRect(ox + 16, 28, 4, 3);
    ctx.restore();
  }

  // ==========================================================================
  // 2. 백마도사 (White Mage - 세레나) : 대기, 영창, 피격, 승리만세
  // ==========================================================================
  private static createWhiteMageSet(scene: Phaser.Scene) {
    this.drawCanvas(scene, 'hero_white_mage_idle', 32, 32, (ctx) => {
      this.drawWhiteMageBase(ctx, false, false, false);
    });

    this.drawCanvas(scene, 'hero_white_mage_attack', 32, 32, (ctx) => {
      this.drawWhiteMageBase(ctx, true, false, false);
    });

    this.drawCanvas(scene, 'hero_white_mage_hurt', 32, 32, (ctx) => {
      this.drawWhiteMageBase(ctx, false, true, false, false);
    });

    // 2-4. 빈사 (Danger)
    this.drawCanvas(scene, 'hero_white_mage_danger', 32, 32, (ctx) => {
      this.drawWhiteMageBase(ctx, false, false, false, true);
    });

    this.drawCanvas(scene, 'hero_white_mage_victory', 32, 32, (ctx) => {
      this.drawWhiteMageBase(ctx, false, false, true, false);
    });
  }

  private static drawWhiteMageBase(
    ctx: CanvasRenderingContext2D,
    isCast: boolean,
    isHurt: boolean,
    isVictory: boolean,
    isDanger: boolean = false
  ) {
    ctx.save();
    if (isDanger) {
      ctx.translate(0, 4);
    }
    const ox = isHurt ? 2 : 0;

    // [상아색 후드 로브 - 다크 아웃라인 & 3단계 셰이딩]
    ctx.fillStyle = '#0f172a'; // 외곽선
    ctx.fillRect(ox + 9, 3, 14, 27);
    ctx.fillStyle = '#cbd5e1'; // 로브 그림자
    ctx.fillRect(ox + 10, 4, 12, 25);
    ctx.fillStyle = '#f8fafc'; // 로브 기본 순백색
    ctx.fillRect(ox + 11, 4, 10, 24);

    // 붉은색 삼각 문양 테두리 (FF 시그니처)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(ox + 9, 5, 2, 3);
    ctx.fillRect(ox + 21, 5, 2, 3);
    ctx.fillRect(ox + 10, 24, 3, 3);
    ctx.fillRect(ox + 15, 24, 3, 3);
    ctx.fillRect(ox + 19, 24, 3, 3);

    // [얼굴 & 갈색 땋은 머리]
    ctx.fillStyle = '#78350f'; // 갈색 머리
    ctx.fillRect(ox + 11, 7, 10, 6);
    ctx.fillStyle = '#fed7aa'; // 피부톤
    ctx.fillRect(ox + 12, 9, 7, 4);
    ctx.fillStyle = '#2563eb'; // 맑은 벽안
    ctx.fillRect(ox + 13, 10, 2, 2);

    // [지팡이 & 팔 모션]
    if (isVictory) {
      // 🌟 승리 환호: 지팡이를 양손으로 하늘 높이 들고 도약
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ox + 15, 1, 3, 18);
      ctx.fillStyle = '#10b981'; // 상단 에메랄드 크리스탈
      ctx.beginPath();
      ctx.arc(ox + 16, 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(ox + 15, 1, 2, 2);

      // 양팔 만세
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ox + 7, 5, 4, 8);
      ctx.fillRect(ox + 21, 5, 4, 8);
    } else if (isCast) {
      // ✨ 영창 모션: 지팡이를 가슴에 모으고 오라 방출
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ox + 18, 6, 3, 20);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(ox + 19, 6, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 대기 자세
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ox + 22, 8, 2, 21);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(ox + 23, 7, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================================================
  // 3. 흑마도사 (Black Mage - 발렌) : 대기, 마법영창, 피격, 승리만세
  // ==========================================================================
  private static createBlackMageSet(scene: Phaser.Scene) {
    this.drawCanvas(scene, 'hero_black_mage_idle', 32, 32, (ctx) => {
      this.drawBlackMageBase(ctx, false, false, false);
    });

    this.drawCanvas(scene, 'hero_black_mage_attack', 32, 32, (ctx) => {
      this.drawBlackMageBase(ctx, true, false, false);
    });

    this.drawCanvas(scene, 'hero_black_mage_hurt', 32, 32, (ctx) => {
      this.drawBlackMageBase(ctx, false, true, false, false);
    });

    // 3-4. 빈사 (Danger)
    this.drawCanvas(scene, 'hero_black_mage_danger', 32, 32, (ctx) => {
      this.drawBlackMageBase(ctx, false, false, false, true);
    });

    this.drawCanvas(scene, 'hero_black_mage_victory', 32, 32, (ctx) => {
      this.drawBlackMageBase(ctx, false, false, true, false);
    });
  }

  private static drawBlackMageBase(
    ctx: CanvasRenderingContext2D,
    isCast: boolean,
    isHurt: boolean,
    isVictory: boolean,
    isDanger: boolean = false
  ) {
    ctx.save();
    if (isDanger) {
      ctx.translate(0, 4);
    }
    const ox = isHurt ? 2 : 0;

    // [원뿔형 고깔 마법 모자 - 별빛 인디고]
    ctx.fillStyle = '#0f172a'; // 외곽선
    ctx.beginPath();
    ctx.moveTo(ox + 16, 0);
    ctx.lineTo(ox + 5, 13);
    ctx.lineTo(ox + 27, 13);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#312e81'; // 모자 그림자
    ctx.beginPath();
    ctx.moveTo(ox + 16, 1);
    ctx.lineTo(ox + 6, 12);
    ctx.lineTo(ox + 26, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4338ca'; // 모자 기본 인디고
    ctx.beginPath();
    ctx.moveTo(ox + 16, 2);
    ctx.lineTo(ox + 8, 11);
    ctx.lineTo(ox + 24, 11);
    ctx.closePath();
    ctx.fill();

    // 황금 놋쇠 버클 띠
    ctx.fillStyle = '#d97706';
    ctx.fillRect(ox + 7, 11, 18, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ox + 14, 10, 4, 4);

    // [검은 그림자 얼굴 속 빛나는 타오르는 노란 눈]
    ctx.fillStyle = '#020617';
    ctx.fillRect(ox + 8, 13, 16, 7);
    ctx.fillStyle = '#fde047'; // 호박색 노란 눈
    ctx.fillRect(ox + 11, 15, 3, 2);
    ctx.fillRect(ox + 17, 15, 3, 2);

    // [푸른 마도사 코트]
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 9, 19, 14, 11);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(ox + 10, 20, 12, 9);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(ox + 11, 20, 8, 8);

    // [손 & 오브 모션]
    if (isVictory) {
      // 🌟 승리 만세: 양손을 하늘로 뻗치며 마법구 들어올림
      ctx.fillStyle = '#f59e0b'; // 황금 장갑
      ctx.fillRect(ox + 6, 4, 4, 6);
      ctx.fillRect(ox + 22, 4, 4, 6);
      ctx.fillStyle = '#ec4899'; // 마법 구체
      ctx.beginPath();
      ctx.arc(ox + 16, 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (isCast) {
      // 🔥 마법 영창: 오브를 앞으로 뻗치며 에너지 집중
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(ox + 24, 17, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(ox + 22, 15, 3, 3);
    } else {
      // 대기 자세
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(ox + 23, 22, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================================================
  // 4. 몽크 (Monk - 렌) : 대기, 연속권격, 피격, 승리만세
  // ==========================================================================
  private static createMonkSet(scene: Phaser.Scene) {
    this.drawCanvas(scene, 'hero_monk_idle', 32, 32, (ctx) => {
      this.drawMonkBase(ctx, false, false, false);
    });

    this.drawCanvas(scene, 'hero_monk_attack', 32, 32, (ctx) => {
      this.drawMonkBase(ctx, true, false, false);
    });

    this.drawCanvas(scene, 'hero_monk_hurt', 32, 32, (ctx) => {
      this.drawMonkBase(ctx, false, true, false, false);
    });

    // 4-4. 빈사 (Danger)
    this.drawCanvas(scene, 'hero_monk_danger', 32, 32, (ctx) => {
      this.drawMonkBase(ctx, false, false, false, true);
    });

    this.drawCanvas(scene, 'hero_monk_victory', 32, 32, (ctx) => {
      this.drawMonkBase(ctx, false, false, true, false);
    });
  }

  private static drawMonkBase(
    ctx: CanvasRenderingContext2D,
    isAttack: boolean,
    isHurt: boolean,
    isVictory: boolean,
    isDanger: boolean = false
  ) {
    ctx.save();
    if (isDanger) {
      ctx.translate(0, 4);
    }
    const ox = isHurt ? 2 : 0;

    // [검은 단발머리 & 붉은 머리띠]
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 10, 3, 12, 10);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox + 11, 4, 10, 8);

    // 붉은 머리띠 및 펄럭이는 끈
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(ox + 9, 7, 13, 2);
    ctx.fillRect(ox + 6, 8, 4, 5); // 휘날리는 끈

    // 다부진 얼굴 & 눈
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(ox + 12, 9, 8, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 13, 10, 2, 2);

    // [주황색 민소매 도복 & 근육질]
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 9, 13, 14, 11);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(ox + 10, 14, 12, 9);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(ox + 11, 14, 10, 8);
    // 검은 허리띠
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 10, 20, 12, 3);

    // [권투 주먹 & 모션 분기]
    if (isVictory) {
      // 🌟 승리 만세: 양 주먹을 불끈 쥐고 하늘로 치켜듦
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 6, 2, 5, 11);
      ctx.fillRect(ox + 19, 2, 5, 11);
      ctx.fillStyle = '#f8fafc'; // 흰 붕대 글러브
      ctx.fillRect(ox + 6, 1, 5, 4);
      ctx.fillRect(ox + 19, 1, 5, 4);
    } else if (isAttack) {
      // 🥊 연속 펀치 타격 자세 (전방 돌출 정권)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 18, 14, 10, 6);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ox + 22, 14, 6, 5);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(ox + 23, 15, 3, 3);
    } else {
      // 대기 격투 자세
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ox + 6, 16, 4, 4);
      ctx.fillRect(ox + 21, 15, 4, 4);
    }

    // 도복 바지 & 권법 신발
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 10, 23, 10, 8);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(ox + 11, 23, 3, 6);
    ctx.fillRect(ox + 16, 23, 3, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 10, 28, 4, 3);
    ctx.fillRect(ox + 16, 28, 4, 3);
    ctx.restore();
  }

  // ==========================================================================
  // 보스 스프라이트 (고품질 1px 아웃라인 & 3단계 셰이딩)
  // ==========================================================================
  private static createBossGolem(scene: Phaser.Scene) {
    this.drawCanvas(scene, 'boss_golem', 48, 48, (ctx) => {
      ctx.fillStyle = '#1c1917'; // 다크 아웃라인
      ctx.fillRect(10, 10, 28, 28);
      ctx.fillStyle = '#57534e'; // 암석 그림자
      ctx.fillRect(11, 11, 26, 26);
      ctx.fillStyle = '#78716c'; // 암석 기본
      ctx.fillRect(13, 13, 22, 22);
      ctx.fillStyle = '#a8a29e'; // 하이라이트
      ctx.fillRect(15, 14, 18, 6);

      // 어깨 갑주
      ctx.fillStyle = '#44403c';
      ctx.fillRect(5, 12, 7, 14);
      ctx.fillRect(36, 12, 7, 14);

      // 코어의 발광 룬
      ctx.fillStyle = '#0891b2';
      ctx.beginPath();
      ctx.arc(24, 24, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(22, 22, 4, 4);
    });
  }

  private static createBossKraken(scene: Phaser.Scene) {
    this.drawCanvas(scene, 'boss_kraken', 52, 52, (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(26, 20, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(26, 20, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.arc(24, 18, 12, 0, Math.PI * 2);
      ctx.fill();

      // 붉은 발광 눈
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(19, 18, 4, 4);
      ctx.fillRect(29, 18, 4, 4);
      ctx.fillStyle = '#fecdd3';
      ctx.fillRect(20, 19, 2, 2);
      ctx.fillRect(30, 19, 2, 2);

      // 꿈틀거리는 5가닥 촉수
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(12, 32, 5, 17);
      ctx.fillRect(18, 34, 5, 15);
      ctx.fillRect(24, 36, 5, 16);
      ctx.fillRect(30, 34, 5, 15);
      ctx.fillRect(36, 32, 5, 17);
    });
  }

  private static createBossBahamut(scene: Phaser.Scene) {
    this.drawCanvas(scene, 'boss_bahamut', 56, 56, (ctx) => {
      // 거대 날개
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(28, 20);
      ctx.lineTo(4, 8);
      ctx.lineTo(12, 32);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(28, 20);
      ctx.lineTo(52, 8);
      ctx.lineTo(44, 32);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#312e81';
      ctx.fillRect(20, 18, 16, 24);

      // 용 머리 & 황금 뿔
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(22, 6, 12, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(18, 2, 4, 8);
      ctx.fillRect(34, 2, 4, 8);

      // 안광
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(24, 11, 3, 2);
      ctx.fillRect(29, 11, 3, 2);
    });
  }

  private static createBossEzekiel(scene: Phaser.Scene) {
    this.drawCanvas(scene, 'boss_ezekiel', 52, 52, (ctx) => {
      // 황금 후광 (Celestial Halo)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(26, 14, 12, 0, Math.PI * 2);
      ctx.stroke();

      // 순백과 황금의 교황 제의
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(17, 18, 18, 30);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(18, 19, 16, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(19, 19, 14, 26);

      // 황금 영대
      ctx.fillStyle = '#d97706';
      ctx.fillRect(24, 18, 4, 28);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(25, 18, 2, 28);

      // 얼굴 & 주교관
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(22, 11, 8, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(26, 2);
      ctx.lineTo(20, 10);
      ctx.lineTo(32, 10);
      ctx.closePath();
      ctx.fill();

      // 양손의 창조신 오브
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(13, 28, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(39, 28, 5, 0, Math.PI * 2);
      ctx.fill();
    });
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
  }
}
