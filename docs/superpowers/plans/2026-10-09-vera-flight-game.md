# [베라 플라이트 (Vera Flight)] 1942 스타일 레트로 비행 슈팅 게임 개발 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VeraNex 미니앱 마스터 가이드(`miniapp.md`)를 100% 준수하여, 1942 스타일의 레트로 종스크롤 비행기 슈팅 게임 **"베라 플라이트(Vera Flight)"**를 신규 구축하고 모바일 450px 완결 및 태블릿·PC 반응형 확장 아키텍처로 포털에 통합 배포한다.

**Architecture:** HTML5 Canvas 기반 고성능 60fps 렌더링 루프와 Web Audio API 사운드 신시사이저를 탑재한 독립 서브앱(`apps/app-flight`, Port 5040)을 구축한다. 모바일에서는 450px × 680px 1화면 완결(Zero-Scroll) 세로 뷰로 구동되고, 태블릿(`md:`) 및 PC(`lg:`) 확장 시 좌측 캔버스 + 우측 종합 대시보드(실시간 스코어, 무기 업그레이드 트리, 격추 킬 수 통계, 미션 로그)의 2열 그리드로 자동 반응형 확장된다.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, HTML5 Canvas 2D, Web Audio API, `@faithportal/mini-app-sdk`.

## Global Constraints

- **브랜드 무결성**: 'FaithLink' 명칭을 전면 배제하고 'VeraNex' (베라넥스) 브랜드 100% 통일.
- **디자인 시스템**: 100% 밝은 배경의 프리미엄 클린 뉴모피즘 (`#FAF8F5`, `#F7F4EE`, `#2D2A26`, `#EBE6DD`, `#FFFFFF`). 다크 모드/어두운 배경 배제.
- **화면 레이아웃**: 모바일 퍼스트 450px 뷰포트(680px 이내 1화면 완결 Zero-Scroll) 기본 + 태블릿(`md:`) 및 PC(`lg:`) 반응형 자동 확장(`md:grid md:grid-cols-2`).
- **핵심 게임 메커니즘 (1942 오마주)**:
  - 플레이어 기체: 부드러운 8방향 비행, 기관총 발사(Space/자동), **360도 공중제비 회피 롤(Loop-the-loop 무적 1.5초, Z키)**, **메가 폭탄(화면 탄환 소거 및 전탄 폭발, X키)**.
  - 적기 편대: 지그재그 정찰기, **빨간 편대 비행대(전멸 시 파워업 아이템 드롭)**, 중형 폭격기, **보스 거대 전함(경보 사이렌, 포탑 파괴, 다단계 탄환 패턴)**.
  - 아이템: P(기관총 1~4열 파워업), L(양옆 호위기 2기 동반 비행 옵션), B(폭탄 잔탄 +1), S(이동 속도 증가).
- **스플래시 화면**: 4초 1~100% 실시간 프로그레스 바 + 100% 불투명 옅은 베이지 배경 + 하단 스폰서 광고 슬롯.
- **마케팅 캡처 속성**: `data-screenshot-*` 3단계(진입 ➡️ 조작 ➡️ 결과) 선언.
- **SEO & 애드센스**: 독립 ads.txt, robots.txt, sitemap.xml, 초기 HTML 1,000자 이상 시맨틱 본문, Schema.org JSON-LD(`WebApplication`, `FAQPage`).
- **엔터프라이즈 안정성**: React Error Boundary, requestAnimationFrame 및 오디오 컨텍스트의 철저한 언마운트 해제(`cleanup`), XSS 살균.

---

### Task 1: 프로젝트 스캐폴딩 및 Vite/Tailwind 설정 (`apps/app-flight`)

**Files:**
- Create: `apps/app-flight/package.json`
- Create: `apps/app-flight/tsconfig.json`
- Create: `apps/app-flight/tsconfig.node.json`
- Create: `apps/app-flight/vite.config.ts`
- Create: `apps/app-flight/index.html`
- Create: `apps/app-flight/public/ads.txt`
- Create: `apps/app-flight/public/robots.txt`
- Create: `apps/app-flight/public/sitemap.xml`
- Create: `apps/app-flight/src/index.css`
- Create: `apps/app-flight/src/main.tsx`

**Interfaces:**
- Consumes: None (신규 패키지)
- Produces: `apps/app-flight` 패키지 구동 환경 (Port 5040, base: `/app/flight/`)

- [ ] **Step 1: `apps/app-flight/package.json` 작성**

```json
{
  "name": "app-flight",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@faithportal/mini-app-sdk": "*",
    "@tailwindcss/vite": "^4.2.0",
    "lucide-react": "^0.575.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^5.1.1",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: `apps/app-flight/tsconfig.json` 및 `tsconfig.node.json` 작성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: `apps/app-flight/vite.config.ts` 작성**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react() as any, tailwindcss()] as any,
  server: {
    port: 5040,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4200',
        changeOrigin: true,
      },
    },
  },
  base: '/app/flight/',
});
```

- [ ] **Step 4: `apps/app-flight/index.html` 작성 (시맨틱 본문 1,000자 + JSON-LD + AdSense 규격)**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>베라 플라이트 - 1942 스타일 레트로 공중전 슈팅 | VeraNex</title>
  <meta name="description" content="1942의 전설적인 공중제비 롤링과 빨간 편대 비행대 격추, 거대 보스 전함 공략의 짜릿함을 100% 무료로 즐기는 베라 플라이트 레트로 비행 슈팅 게임입니다." />
  <link rel="canonical" href="https://veranex.app/app/flight/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="베라 플라이트 - 1942 스타일 레트로 공중전 슈팅 | VeraNex" />
  <meta property="og:description" content="360도 공중제비 회피와 메가 폭탄, 편대 비행대를 격파하는 정통 비행기 슈팅 게임을 웹 브라우저에서 바로 플레이하세요." />
  <meta property="og:image" content="https://veranex.app/logo-512.png" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SoftwareApplication", "Game"],
        "name": "베라 플라이트 (Vera Flight)",
        "applicationCategory": "GameApplication",
        "genre": "Shooting",
        "operatingSystem": "All modern web browsers",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
        "description": "1942 스타일의 레트로 종스크롤 아케이드 비행기 슈팅 게임"
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "베라 플라이트의 조작 방법은 어떻게 되나요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "PC에서는 방향키 또는 WASD로 기체를 이동하고, Space 키 또는 마우스 클릭으로 기관총을 연사합니다. Z 또는 J 키로 360도 공중제비 회피 롤을 사용해 위기를 벗어나고, X 또는 K 키로 전 화면 적탄을 소거하는 메가 폭탄을 투하합니다. 모바일에서는 터치 조이스틱과 온스크린 액션 버튼으로 편리하게 조작할 수 있습니다."
            }
          },
          {
            "@type": "Question",
            "name": "파워업 아이템은 어떻게 획득하나요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "특정 구간마다 출현하는 빨간 편대 비행대(Red Formation) 전원을 격추하면 P(기관총 강화), L(호위기 2기 동반 비행), B(메가 폭탄 추가), S(이동 속도 증가) 등의 파워업 아이템이 드롭됩니다."
            }
          }
        ]
      }
    ]
  }
  </script>
</head>
<body class="bg-[#FAF8F5] text-[#2D2A26] antialiased select-none overflow-x-hidden">
  <div id="root">
    <!-- 크롤러용 시맨틱 본문 -->
    <article style="display:none;" aria-hidden="true">
      <h1>베라 플라이트: 1942 아케이드 오마주 정통 비행기 슈팅 게임</h1>
      <p>베라 플라이트는 오락실 황금기를 이끈 고전 비행기 슈팅 게임 1942의 핵심 재미를 현대적인 감각으로 재해석한 웹 브라우저 기반 공중전 아케이드 게임입니다.</p>
      <h2>주요 게임 특징과 전략</h2>
      <p>플레이어는 전설적인 P-38 라이트닝 스타일의 아군 전투기를 조종하여 태평양 상공을 가로지르는 적 전투기, 편대 비행대, 중형 폭격기, 그리고 거대 항공모함형 공중 보스를 격파해야 합니다.</p>
      <h3>1. 360도 공중제비 회피 롤 (Loop-the-loop)</h3>
      <p>빗발치는 적의 탄환 세례를 단숨에 무력화하는 360도 회피 롤은 약 1.5초간 완벽한 무적 상태를 제공하여 탄막을 돌파하는 가장 강력한 회피 수단입니다.</p>
      <h3>2. 빨간 편대 전멸과 무기 업그레이드</h3>
      <p>S자 궤도로 날아오는 붉은색 편대기를 남김없이 격추하면 드롭되는 P 아이템으로 2열 트윈 건, 3열 부채꼴 스프레드 샷, 4열 헤비 캐논으로 무기를 강화할 수 있습니다.</p>
    </article>
  </div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5: `public/ads.txt`, `public/robots.txt`, `public/sitemap.xml` 생성**
- [ ] **Step 6: `src/index.css` 및 `src/main.tsx` 작성**
- [ ] **Step 7: `apps/app-flight` 패키지 빌드 검증 및 커밋**

---

### Task 2: 사운드 엔진 및 엔터프라이즈 유틸리티 (`sound.ts`, `useViewMode.ts`, `ErrorBoundary.tsx`)

**Files:**
- Create: `apps/app-flight/src/utils/sound.ts`
- Create: `apps/app-flight/src/hooks/useViewMode.ts`
- Create: `apps/app-flight/src/components/ErrorBoundary.tsx`
- Create: `apps/app-flight/src/components/BannerSlot.tsx`

**Interfaces:**
- Produces: `playGunSound()`, `playExplosionSound()`, `playRollSound()`, `playItemSound()`, `playBossAlertSound()`, `playBombSound()`, `useViewMode()`, `<ErrorBoundary />`, `<BannerSlot />`

- [ ] **Step 1: `apps/app-flight/src/utils/sound.ts` (Web Audio API 무의존성 합성음)**
  - `AudioContext` 싱글톤 생성 및 사용자 최초 인터랙션 시 자동 `resume()`
  - 기관총 사격음: 짧은 고주파 펄스 노이즈
  - 피격/폭발음: 화이트 노이즈 버퍼 + 로우패스 필터 스윕
  - 공중제비 롤 회전음: 사인파 피치 다운-업 스윕 (휘이익 효과)
  - 아이템 획득음: 아르페지오 벨 차임 (E5 -> G5 -> C6)
  - 메가 폭탄음: 묵직한 서브우퍼 저주파 폭발 럼블
  - 보스 출현 사이렌 경보음
- [ ] **Step 2: `apps/app-flight/src/hooks/useViewMode.ts` (포털 팝업 vs 독립/확장 모드 감지)**
- [ ] **Step 3: `apps/app-flight/src/components/ErrorBoundary.tsx` (런타임 예외 복구 UI)**
- [ ] **Step 4: `apps/app-flight/src/components/BannerSlot.tsx` (CLS 0 준수 스폰서 배너)**
- [ ] **Step 5: 커밋**

---

### Task 3: 1942 비행 슈팅 게임 엔진 (`engine/types.ts`, `engine/gameLoop.ts`)

**Files:**
- Create: `apps/app-flight/src/engine/types.ts`
- Create: `apps/app-flight/src/engine/gameLoop.ts`

**Interfaces:**
- Produces:
  - `GameState`, `Player`, `Bullet`, `Enemy`, `Item`, `Particle`, `Boss` 인터페이스
  - `initGame()`, `updateGame()`, `renderGame()`, `handleInput()`

- [ ] **Step 1: `apps/app-flight/src/engine/types.ts` 데이터 타입 정의**
  - 기체 위치(x, y), 속도(vx, vy), 라이프(기본 3기), 폭탄(기본 2발), 무기 레벨(1~4), 롤 상태(isRolling, rollProgress, rollCharges)
  - 호위기(옵션) 2기 좌표 및 사격 상태
  - 적기 타입: `'scout'` (정찰기), `'red-formation'` (빨간 편대기), `'bomber'` (중형 폭격기), `'boss'` (거대 비행정)
  - 아이템 타입: `'P'`(파워업), `'L'`(호위기 2기), `'B'`(폭탄), `'S'`(속도), `'star'`(점수)
  - 파티클(파편, 연기, 스파크)
- [ ] **Step 2: `apps/app-flight/src/engine/gameLoop.ts` 게임 엔진 구현**
  - 60fps Canvas 2D 렌더링:
    - 바다/구름 2중 시차 스크롤 배경 (따뜻하고 화사한 밝은 에메랄드/스카이 블루 해상 맵)
    - 플레이어 전투기 렌더링 (아군 P-38 스타일, 롤링 시 360도 스케일 Y/X 원근 변형 애니메이션)
    - 기관총 탄환 및 4단계 탄막 렌더링
    - 호위기(옵션) 2기 편대 동시 비행
    - 적기 AI 패턴: S자 곡예 비행, 빨간 편대 일제 회전, 폭격기 부채꼴 탄환
    - 보스 페이즈: 사이렌 경보 후 상단에서 서서히 진입, 좌우 포탑 독립 파괴, 방사형 탄환 패턴, 거대 체력바
    - AABB & 원형 충돌 판정 (Hitbox)
    - 파티클 폭발 이펙트 & 플로팅 점수 텍스트
- [ ] **Step 3: 커밋**

---

### Task 4: 모바일/태블릿/PC 반응형 UI 및 컨트롤러 컴포넌트 (`App.tsx`, `components/`)

**Files:**
- Create: `apps/app-flight/src/components/Header.tsx`
- Create: `apps/app-flight/src/components/SplashScreen.tsx`
- Create: `apps/app-flight/src/components/FlightCanvas.tsx`
- Create: `apps/app-flight/src/components/DashboardSidebar.tsx`
- Create: `apps/app-flight/src/components/TouchControls.tsx`
- Create: `apps/app-flight/src/components/GameOverModal.tsx`
- Create: `apps/app-flight/src/components/HowToModal.tsx`
- Create: `apps/app-flight/src/App.tsx`

**Interfaces:**
- Produces:
  - `<Header />`: VeraNex 홈 링크 좌측 + 베라 플라이트 로고 우측
  - `<SplashScreen />`: 4초 1~100% 실시간 프로그레스 바 + 하단 배너
  - `<FlightCanvas />`: 캔버스 마운트 및 키보드/터치 이벤트 바인딩
  - `<DashboardSidebar />`: 태블릿/PC 확장 시 우측에 노출되는 대형 전광판 및 업그레이드 트리
  - `<TouchControls />`: 모바일 화면 전용 컴팩트 조이스틱 + 롤/폭탄 퀵 버튼
  - `<App />`: 전체 상태 머신 (`splash` -> `ready` -> `playing` -> `gameover`)

- [ ] **Step 1: `Header.tsx` & `SplashScreen.tsx` 구현**
  - VeraNex 브랜드 일치 및 4초 100% 불투명 프로그레스 로딩.
- [ ] **Step 2: `FlightCanvas.tsx` & `TouchControls.tsx` 구현**
  - 캔버스 크기: 모바일 450px 기준 `aspect-[3/4]` 완결.
  - 마우스 드래그 / 터치 스와이프 / 키보드(WASD, 방향키, Space, Z, X) 듀얼 지원.
  - 마케팅 캡처 속성 표기: `data-screenshot-click="action"`, `data-screenshot-point="result"`.
- [ ] **Step 3: `DashboardSidebar.tsx` 구현 (태블릿/PC 대화면 전용)**
  - 태블릿(`md:`) 및 PC(`lg:`) 확장 시 우측에 자동 노출:
    - 실시간 스코어 & 역대 하이스코어
    - 무기 파워업 레벨 인디케이터 (1~4단계 시각화)
    - 호위기 장착 여부, 공중제비 롤 잔여 횟수, 메가 폭탄 슬롯
    - 격추 킬 수 통계 & 조작 키 바인딩 맵
- [ ] **Step 4: `GameOverModal.tsx` & `HowToModal.tsx` 구현**
- [ ] **Step 5: `App.tsx` 모바일 퍼스트 ➔ 태블릿/PC 반응형 그리드 조합**
  - `md:grid md:grid-cols-2 md:gap-6`
- [ ] **Step 6: 로컬 빌드 검증 (`npm --prefix apps/app-flight run build`) 및 커밋**

---

### Task 5: 포털 시스템 및 API 서버 연동 (`server.ts`, 메인 포털 등록)

**Files:**
- Modify: `apps/api-server/src/server.ts`
- Modify: `apps/main-portal/src/data/gamesData.ts`
- Modify: `apps/main-portal/src/data/gamesSeoData.ts`
- Modify: `apps/main-portal/scripts/prerender.js`
- Modify: `apps/main-portal/public/sitemap.xml`
- Modify: `scripts/test-sitemap-robots.ts`

**Interfaces:**
- Produces:
  - `server.ts`: `/app/flight/*` 정적 서빙 라우트 및 `apps/app-flight/dist` 연결
  - 포털 게임 센터 `/game` 목록에 '베라 플라이트' 카드 및 `/app/flight/` 실행 링크 등록
  - SEO / GEO 사이트맵 및 로봇 크롤러 접근 허용

- [ ] **Step 1: `apps/api-server/src/server.ts`에 `/app/flight` 정적 라우트 추가**

```ts
// miniApps 목록에 'flight' 추가
const miniApps = [
    'calculator', 'text-checker', 'tetris', 'sudoku', 'pyeong-calc',
    '2048', 'minesweeper', 'age-calc', 'dday-calc', 'json-formatter',
    'base64-converter', 'svg-converter', 'news', 'flight'
];
```

- [ ] **Step 2: `apps/main-portal/src/data/gamesData.ts`에 '베라 플라이트' 메타데이터 등록**
- [ ] **Step 3: `apps/main-portal/src/data/gamesSeoData.ts`에 AEO 지식 데이터 등록**
- [ ] **Step 4: `scripts/test-sitemap-robots.ts` 및 sitemap.xml 갱신**
- [ ] **Step 5: 전체 타입체크 및 로컬 빌드 테스트 (`turbo run build` / tsc)**
- [ ] **Step 6: 커밋**

---

### Task 6: 프로덕션 배포 및 라이브 검증 (`veranex.app`)

**Files:**
- Archive: `dist_flight.tar.gz`
- Server: `/root/faith_dev/apps/app-flight/dist`

- [ ] **Step 1: Git push to `origin main`**
- [ ] **Step 2: 원격 서버 코드 pull 및 번들 업로드**
- [ ] **Step 3: PM2 서비스 재시작 (`pm2 restart faith-portal`)**
- [ ] **Step 4: 라이브 URL HTTP 200 OK 검증 (`https://veranex.app/app/flight/`)**
- [ ] **Step 5: 모바일 뷰 및 PC 와이드 대시보드 동작 검증**
