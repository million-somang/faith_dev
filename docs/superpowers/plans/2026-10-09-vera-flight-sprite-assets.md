# [베라 플라이트] 비행기 및 적기 고화질 스프라이트 이미지 직접 생성 및 그래픽 고도화 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `generate_image` 도구를 활용하여 1942 클래식 감성의 고화질 아군기(P-38 라이트닝 스타일, 호위기) 및 적기 4종(정찰기, 빨간 편대기, 중형 폭격기, 거대 보스 전함) 스프라이트 이미지를 직접 생성하고, 투명 배경 캔버스 스프라이트 파이프라인 및 고도 회전 렌더링 엔진을 구축하여 베라 플라이트의 비주얼 완성도를 비약적으로 혁신한다.

**Architecture:** AI 생성 고화질 탑다운 항공기 에셋을 `apps/app-flight/public/assets/sprites/`에 배치하고, `assets.ts` 이미지 프리로더 및 알파 채널 투명화 유틸리티를 통해 캔버스 2D 60fps 렌더링 파이프라인에 주입한다. 기존의 단순 사각형/타원 기하학 도형을 실제 레트로 아케이드 탑다운 비행기 텍스처로 대체하며, 360도 공중제비 롤 3D 원근 축소/확장, 피격 플래시, 프로펠러 블러 및 보스 회전 포탑 렌더링을 정밀 결합한다.

**Tech Stack:** React 18, TypeScript, HTML5 Canvas 2D, `generate_image` AI 이미지 생성 도구, Vite, Tailwind CSS v4.

## Global Constraints

- **브랜드 무결성**: 'FaithLink' 명칭을 전면 배제하고 'VeraNex' (베라넥스) 100% 브랜드 일관성 유지.
- **디자인 시스템**: 100% 밝고 시원한 옅은 베이지 뉴모피즘 UI 및 화사한 에메랄드/스카이 블루 해상 배경과 완벽하게 어우러지는 스프라이트.
- **캔버스 60fps 무결성**: 이미지 렌더링으로 인한 프레임 드랍이 없도록 사전에 전 기체 스프라이트를 프리로드 및 캐싱하여 단 1회의 불필요한 GC(Garbage Collection)도 발생하지 않도록 최적화.
- **투명 알파 배경 보장**: 해상 캔버스 위에서 사각형 테두리나 흰색/검은색 여백이 남지 않도록 완벽한 투명 PNG 스프라이트 보장.
- **서버 용량 최적화**: 원격 서버 디스크 제한을 준수하여 생성된 스프라이트를 WebP/PNG 고압축 포맷으로 번들링.

---

### Task 1: 비행기 6종 고화질 탑다운 스프라이트 AI 생성 및 에셋 파이프라인 구축

**Files:**
- Create: `apps/app-flight/public/assets/sprites/player_p38.png`
- Create: `apps/app-flight/public/assets/sprites/player_escort.png`
- Create: `apps/app-flight/public/assets/sprites/enemy_scout.png`
- Create: `apps/app-flight/public/assets/sprites/enemy_red.png`
- Create: `apps/app-flight/public/assets/sprites/enemy_bomber.png`
- Create: `apps/app-flight/public/assets/sprites/enemy_boss.png`
- Create: `apps/app-flight/src/engine/assets.ts`

**Interfaces:**
- Produces: `GameAssets`, `loadGameAssets(): Promise<GameAssets>`, `getAsset(name): HTMLCanvasElement | HTMLImageElement`

- [ ] **Step 1: 아군 P-38 라이트닝 주력 전투기 이미지 생성 (`player_p38`)**
  - 프롬프트: Top-down 2D sprite of a retro WWII P-38 Lightning fighter plane, pointing directly UP, iconic twin tail booms, twin engines, crisp metallic silver-blue fuselage, yellow spinner propellers, transparent background, isolated game asset, clean crisp retro arcade style.
- [ ] **Step 2: 아군 호위기(옵션) 전투기 이미지 생성 (`player_escort`)**
  - 프롬프트: Top-down 2D sprite of a nimble small escort fighter plane, pointing directly UP, sleek emerald green wings, isolated game asset, retro arcade shooter style.
- [ ] **Step 3: 적군 일반 정찰기 이미지 생성 (`enemy_scout`)**
  - 프롬프트: Top-down 2D sprite of a retro enemy scout fighter airplane, pointing directly DOWN, dark military olive-gray wings with yellow propeller tips, isolated game asset, 1942 arcade shooter style.
- [ ] **Step 4: 적군 빨간 편대기(Red Formation) 이미지 생성 (`enemy_red`)**
  - 프롬프트: Top-down 2D sprite of an elite crimson red fighter airplane, pointing directly DOWN, aggressive delta wings, gold canopy cockpit, isolated game asset, retro arcade shoot-em-up.
- [ ] **Step 5: 적군 중형 폭격기 이미지 생성 (`enemy_bomber`)**
  - 프롬프트: Top-down 2D sprite of a heavy twin-engine military bomber aircraft, pointing directly DOWN, camouflage dark green armor plating, dual wing engines, isolated game asset, retro shooter.
- [ ] **Step 6: 적군 거대 보스 공중 요새 전함 이미지 생성 (`enemy_boss`)**
  - 프롬프트: Top-down 2D sprite of a giant retro flying fortress air battleship, pointing directly DOWN, massive heavy industrial ironclad armor, command bridge, multi-cannon weapon turrets, isolated game asset, arcade shooter boss.
- [ ] **Step 7: `apps/app-flight/src/engine/assets.ts` 구현 (오프스크린 알파 투명화 및 싱글톤 프리로더)**
  - 배경색 자동 크로마키/알파 투명화 처리(필요 시 흰색/검은색 배경 자동 클리핑)로 캔버스 바다 배경과 100% 매끄럽게 합성.
- [ ] **Step 8: 커밋**

---

### Task 2: 1942 캔버스 게임 엔진 스프라이트 렌더링 전면 개편 (`engine/gameLoop.ts`)

**Files:**
- Modify: `apps/app-flight/src/engine/gameLoop.ts`
- Modify: `apps/app-flight/src/engine/types.ts`
- Modify: `apps/app-flight/src/components/FlightCanvas.tsx`

**Interfaces:**
- Consumes: `loadGameAssets()`, `getAsset()`
- Produces: 고화질 텍스처 렌더링, 360° 공중제비 3D 회전 변형, 피격 화이트 플래시, 프로펠러 블러

- [ ] **Step 1: `types.ts` 및 `gameLoop.ts`에 에셋 참조 주입**
  - `GameEngineState`에 `assetsLoaded: boolean`, `assets: GameAssets | null` 추가.
  - 플레이어 및 적기 엔티티별 피격 타이머(`hitFlashTimer`) 추가.
- [ ] **Step 2: 플레이어 기체 고화질 렌더링 구현**
  - 단순 도형을 `player_p38` 스프라이트로 대체.
  - 360도 공중제비 롤링 시 `ctx.scale(1, Math.cos(rollRad))`를 스프라이트에 그대로 적용하여 실제 비행기가 공중에서 3D 덤블링하는 역동적 롤링 시각화.
  - 고도 상승에 따른 지면 그림자 분리 렌더링.
  - 호위기(옵션) 장착 시 양 날개 옆에 `player_escort` 스프라이트 대칭 렌더링.
- [ ] **Step 3: 적기 4종 고화질 렌더링 구현**
  - 정찰기: `enemy_scout` 스프라이트 + 조준 탄환 발사 애니메이션.
  - 빨간 편대기: `enemy_red` 스프라이트 + S자 선회 비행 시 날개 기울임 틸트(tilt) 효과.
  - 중형 폭격기: `enemy_bomber` 대형 스프라이트 + 체력바.
  - 거대 보스 전함: `enemy_boss` 거대 요새 스프라이트 + 독립 파괴 가능한 좌우 포탑 오버레이 및 탄막 발사구 발광 이펙트.
- [ ] **Step 4: 로컬 타입체크 및 캔버스 렌더링 테스트**
- [ ] **Step 5: 커밋**

---

### Task 3: 스플래시 화면 및 게임센터 썸네일 고화질 에셋 업그레이드

**Files:**
- Modify: `apps/app-flight/src/components/SplashScreen.tsx`
- Modify: `apps/main-portal/src/pages/GamePage.tsx`
- Modify: `apps/main-portal/scripts/prerender.js`

- [ ] **Step 1: `SplashScreen.tsx` 인트로 그래픽에 고화질 P-38 비행기 에셋 배치**
  - 로딩 화면 중앙에 AI 생성 고화질 기체 그래픽과 펄스 링 연출.
- [ ] **Step 2: `GamePage.tsx` 내 `FlightThumb` 썸네일 개선**
  - 신규 비행기 스프라이트 스타일과 일치하는 미려한 태평양 공중전 배너 그래픽 적용.
- [ ] **Step 3: 포털 사전렌더링 갱신 (`node apps/main-portal/scripts/prerender.js`)**
- [ ] **Step 4: 커밋**

---

### Task 4: 로컬 빌드 검증 및 프로덕션 배포 (`veranex.app`)

**Files:**
- Archive: `dist_flight_sprites.tar.gz`
- Server: `/root/faith_dev/apps/app-flight/dist`, `/root/faith_dev/apps/main-portal/dist`

- [ ] **Step 1: 로컬 빌드 및 에셋 번들 무결성 검증 (`npm --prefix apps/app-flight run build`)**
- [ ] **Step 2: Git push to `origin main`**
- [ ] **Step 3: 원격 서버에 빌드 번들 전송 및 배포 (`scp` & `pm2 restart faith-portal`)**
- [ ] **Step 4: 실제 라이브 팝업 구동 및 고화질 비행기 그래픽 실시간 검증 (`https://veranex.app/app/flight/`)**
