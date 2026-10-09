# [베라 플라이트] 비행기 폭발 에셋 AI 생성 및 실감형 폭파 애니메이션 시스템 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `generate_image` AI 도구를 활용하여 적기 및 아군기(P-38)가 공중에서 파괴될 때의 사실감 넘치는 단계별 화염·파편 폭발 애니메이션 스프라이트 시트를 직접 생성하고, 캔버스 2D 60fps 엔진에 다단계 스프라이트 폭파 애니메이션 파이프라인을 구축하여 1942 클래식 아케이드 슈팅의 폭발 타격감을 완성한다.

**Architecture:** AI 생성 폭발 시퀀스 스프라이트시트(`explosion_enemy.png`, `explosion_player.png`)를 알파 투명화 처리하여 `apps/app-flight/public/assets/sprites/`에 탑재하고, `assets.ts` 프리로더로 캐싱한다. `types.ts`에 `Explosion` 애니메이션 엔티티를 추가하고, `gameLoop.ts`에서 적기 파괴 및 아군기 격추 시 해당 좌표에 6~8프레임 프레임 슬라이싱 렌더링, 잔해 회전 파편, 화구 확장 및 충격파 링 연출을 통합한다.

**Tech Stack:** React 18, TypeScript, HTML5 Canvas 2D, `generate_image` AI 생성 도구, Puppeteer (알파 투명화 프로세싱), Vite.

## Global Constraints

- **브랜드 무결성**: 100% 'VeraNex' 브랜드 준수 (FaithLink 명칭 전면 배제).
- **공식 로고 유지**: `miniapp.md` Golden Rule 12에 따라 상단 헤더 및 스플래시 화면의 공식 `logo-192.png`와 `V<span className="text-indigo-600">ERANEX</span>` 절대 보존.
- **캔버스 60fps 무결성**: 폭발 애니메이션 진행 중에도 GC 프레임 드랍이 없도록 스프라이트 시트 사전 캐싱 및 오브젝트 풀링 최적화.
- **배경 투명화 무결성**: 해상 캔버스 위에서 사각형 테두리나 흰색/검은색 박스 여백이 남지 않도록 완벽한 투명 PNG 스프라이트 보장.
- **원격 서버 제한**: 원격 서버 디스크 제한을 준수하여 로컬 빌드 후 압축 전송 배포.

---

### Task 1: 적기 및 아군기 폭발 애니메이션 스프라이트 AI 생성 및 투명화 파이프라인

**Files:**
- Create: `apps/app-flight/public/assets/sprites/explosion_enemy.png`
- Create: `apps/app-flight/public/assets/sprites/explosion_player.png`
- Modify: `scripts/process-sprites.cjs`
- Modify: `apps/app-flight/src/engine/assets.ts`

**Interfaces:**
- Produces: `GameSprites.explosionEnemy: HTMLImageElement`, `GameSprites.explosionPlayer: HTMLImageElement`

- [ ] **Step 1: 적 비행기 폭발 스프라이트 시트 생성 (`explosion_enemy`)**
  - 도구: `generate_image`
  - 프롬프트: `A horizontal sprite sheet sequence of a retro WWII fighter airplane exploding in mid-air, 6 animation frames side by side in a single row on pure white background, showing initial bright flash, expanding orange fireball with dark smoke, disintegrating airplane wings, dispersing debris and fading smoke, clean pixel arcade game asset, top-down view.`
  - 규격: 6~8프레임 균등 가로 분할 시퀀스.
- [ ] **Step 2: 아군 P-38 전투기 대폭발 스프라이트 시트 생성 (`explosion_player`)**
  - 도구: `generate_image`
  - 프롬프트: `A horizontal sprite sheet sequence of a twin-engine fighter airplane massive dramatic explosion in mid-air, 6 animation frames side by side in a single row on pure white background, showing twin engines catching fire, catastrophic structural breakup with huge crimson-yellow fireball, flying shrapnel shockwave, black smoke dissipation, retro arcade game asset, top-down view.`
- [ ] **Step 3: Puppeteer 기반 크로마키/알파 투명화 프로세싱 스크립트 실행**
  - 흰색/단색 배경을 깔끔하게 제거하여 투명 PNG(`explosion_enemy.png`, `explosion_player.png`)로 변환 및 `apps/app-flight/public/assets/sprites/`에 저장.
- [ ] **Step 4: `assets.ts`에 폭발 스프라이트 프리로드 추가**
  - `GameSprites` 인터페이스에 `explosionEnemy`, `explosionPlayer` 등록.
  - `preloadAssets()` 목록에 추가.
- [ ] **Step 5: 커밋**

---

### Task 2: 캔버스 폭발 애니메이션 엔티티 시스템 및 렌더링 엔진 구현

**Files:**
- Modify: `apps/app-flight/src/engine/types.ts`
- Modify: `apps/app-flight/src/engine/gameLoop.ts`

**Interfaces:**
- Produces: `Explosion` entity, `createExplosionAnim(state, x, y, type, scale)`

- [ ] **Step 1: `types.ts`에 `Explosion` 인터페이스 및 `GameEngineState.explosions` 추가**
  ```ts
  export interface Explosion {
    id: number;
    x: number;
    y: number;
    type: 'enemy' | 'player' | 'boss';
    frame: number;        // 현재 재생 프레임 (0 ~ totalFrames - 1)
    totalFrames: number;  // 총 프레임 수 (6)
    frameDuration: number;// 프레임당 유지 틱 (예: 3~4프레임 = 약 0.3~0.4초간 재생)
    frameTimer: number;
    scale: number;        // 폭발 크기 배율
    rotation: number;     // 자연스러운 무작위 회전 각도
  }
  ```
- [ ] **Step 2: `gameLoop.ts`에 폭발 애니메이션 생성 함수 `triggerExplosionAnimation()` 구현**
  - 일반 적기 격추 시: `type: 'enemy'`, `scale: 1.0`
  - 중형 폭격기 격추 시: `type: 'enemy'`, `scale: 1.8`
  - 보스 격파 시: 다중 좌표 연속 연쇄 폭발 3~5개 생성 + `type: 'boss'`, `scale: 2.5`
  - 아군기 피격 시: `type: 'player'`, `scale: 1.5`
- [ ] **Step 3: `updateGameEngine`에 폭발 애니메이션 업데이트 루프 추가**
  - 각 폭발 엔티티의 `frameTimer` 및 `frame` 증가, `frame >= totalFrames` 도달 시 배열에서 자동 제거.
- [ ] **Step 4: `renderGameEngine`에 스프라이트 시트 슬라이싱 렌더링 구현**
  - 스프라이트 시트 가로 분할 계산: `frameWidth = img.width / totalFrames`, `frameHeight = img.height`.
  - `ctx.drawImage(img, frame * frameWidth, 0, frameWidth, frameHeight, -targetW/2, -targetH/2, targetW, targetH)`.
  - 폭발 중심부 충격파 링(Shockwave ring) 및 파편 블렌딩.
  - 스프라이트 로드 실패 시 기존 파티클 폭발로 안전하게 자동 폴백.
- [ ] **Step 5: 로컬 타입체크 및 빌드 검증**
  - `npm.cmd --prefix apps/app-flight run build`
- [ ] **Step 6: 커밋**

---

### Task 3: 프로덕션 배포 및 폭발 애니메이션 라이브 시각 검증

**Files:**
- Archive: `flight_explosion_dist.tar.gz`
- Server: `/root/faith_dev/apps/app-flight/dist`

- [ ] **Step 1: 로컬 프로덕션 빌드 완료 및 번들 무결성 확인**
- [ ] **Step 2: Git push to `origin main`**
- [ ] **Step 3: 원격 서버 압축 파일 전송 및 PM2 재기동 (`pm2 restart faith-portal`)**
- [ ] **Step 4: Puppeteer 헤드리스 브라우저로 실제 공중전 폭파 장면 캡처 및 시각적 무결성 확인**
  - 적기 탄환 명중 후 공중 분해 폭발 캡처.
  - 플레이어 피격 시 대폭발 화구 연출 캡처.
  - 완료 보고서 작성.
