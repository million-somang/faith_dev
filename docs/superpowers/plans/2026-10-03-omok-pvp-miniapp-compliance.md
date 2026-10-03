# 베라오목 온라인(omok-pvp) miniapp.md 표준 준수 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `onlinegame/omok-pvp`(베라오목 온라인)를 `miniapp.md` 3.0 공식 표준에 완벽히 부합하도록 4초 스플래시, 680px 이내 1화면 완결 Zero-Scroll 컴팩트 대국실, 3탭 시스템(대국/규칙/FAQ), 100% 밝은 3D 뉴모피즘 그래픽, AI 연습 모드 및 마케팅 3단계 캡처(`data-screenshot-*`)를 전면 적용하여 완성합니다.

**Architecture:** 기존 WebSocket 기반 실시간 1:1 대전 엔진 및 로비 시스템을 유지하면서, 상단 3탭(대전/규칙/FAQ) 구조와 4초 스플래시 로더를 신설하고, 대국 화면을 450px × 850px 팝업 기준 순수 680px 이내 무스크롤 레이아웃으로 컴팩트 재설계합니다. 혼자서도 즉시 플레이하고 캡처할 수 있도록 클라이언트 AI 대전 엔진을 보강합니다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti, Web Audio API, WebSocket.

## Global Constraints
- **100% 밝은 배경 (Zero Dark Policy)**: 다크 모드/어두운 배경 금지. 순백색 카드(`bg-white`)와 소프트 슬레이트(`bg-slate-50`) 유지.
- **680px 이내 1화면 완결 (Zero-Scroll)**: 대국 중 브라우저 세로 스크롤 영구 금지. 모든 조작부(헤더, 바둑판, 퀵챗, 기권)가 680px 이내에 100% 노출.
- **4초 스플래시 로딩**: 진입 시 4,000ms 동안 1~100% 카운트 프로그레스 바 + 하단 스폰서 배너 슬롯 의무 노출.
- **3단계 마케팅 자동 캡처 표기**: `data-screenshot-click="action"`, `data-screenshot-click="result"`, `data-screenshot-point="result"` 속성 선언.
- **브랜드 표기**: 'FaithLink' 명칭 전면 배제, 100% 'VeraNex' (베라오목 온라인) 통일.
- **코드 무결성**: `any`, `unknown` 타입 사용 금지, XSS 방어 및 메모리 누수(cleanup) 철저 보장.

---

### Task 1: 타입 선언 보강 및 SEO / AI 검색(GEO) 구조화 데이터 완성

**Files:**
- Modify: `onlinegame/omok-pvp/index.html`
- Create: `onlinegame/omok-pvp/public/llms.txt`
- Modify: `onlinegame/omok-pvp/src/types/omok.ts`

**Interfaces:**
- `omok.ts`:
  - `type AppTab = 'game' | 'rules' | 'faq'`
  - `type GameMode = 'ONLINE_PVP' | 'AI_PRACTICE'`
  - any 제거 및 엄격한 타입 정의

- [ ] **Step 1: `index.html`에 Schema.org JSON-LD (`WebApplication`, `FAQPage`) 및 SEO 메타태그 보강**
  - 구글 SERP 및 AI 검색엔진(ChatGPT, Perplexity, Claude, Gemini)을 위한 `WebApplication` 및 `FAQPage` 구조화 데이터 삽입.
  - 15×15 렌주룰, 실시간 1:1 대전, 비과금 무료 플레이에 관한 Q&A 구조화.

- [ ] **Step 2: `public/llms.txt` 생성**
  - AI 에이전트가 베라오목 온라인의 규칙(흑 33/44/장목 금수, 백 무제한, 30초 턴 제한), 모드, 기술 사양을 1초 만에 파악할 수 있는 마크다운 가이드 작성.

- [ ] **Step 3: `src/types/omok.ts` 타입 정밀화**
  - any 타입 전면 제거, 3탭 내비게이션(`AppTab`) 및 게임 모드(`GameMode`), 타이머 및 소켓 패킷 페이로드 인터페이스 엄격 선언.

---

### Task 2: 4초 스플래시 로딩 화면 & Zero-CLS 배너 컴포넌트 구현

**Files:**
- Create: `onlinegame/omok-pvp/src/components/SplashIntro.tsx`
- Modify: `onlinegame/omok-pvp/src/App.tsx`

**Interfaces:**
- `SplashIntro`:
  ```tsx
  interface SplashIntroProps {
    onComplete: () => void;
  }
  ```

- [ ] **Step 1: `SplashIntro.tsx` 컴포넌트 작성**
  - 4,000ms(4초) 동안 1%에서 100%까지 매끄럽게 차오르는 숫자 카운트 및 게이지 바 애니메이션.
  - 100% 밝은 소프트 화이트 배경 + 3D 오목돌 엠블럼 + "공인 15×15 렌주룰 온라인 대전" 뱃지.
  - 하단 공식 스폰서/광고 배너 슬롯(`min-h-[60px]`, `ADVERTISEMENT`) 탑재 (Zero CLS 규격).

- [ ] **Step 2: `App.tsx`에 스플래시 상태 연결**
  - 초기 진입 시 `isSplash: true`로 4초간 표시 후 페이드아웃 전환.
  - 개발/캡처 편의 및 테스트 시 빠르게 진입할 수 있도록 URL 파라미터(`?nosplash=true`) 바이패스 옵션 지원.

---

### Task 3: 씬 콘텐츠 방지용 3탭 시스템 (대국실 / 규칙 가이드 / FAQ & 랭킹) 구현

**Files:**
- Create: `onlinegame/omok-pvp/src/components/RulesTab.tsx`
- Create: `onlinegame/omok-pvp/src/components/FaqTab.tsx`
- Modify: `onlinegame/omok-pvp/src/App.tsx`

**Interfaces:**
- `RulesTab`: 오목 기초 규칙, 흑돌 3·3 / 4·4 / 장목 금수 안내, 렌주룰 다이어그램 및 오목 필승 전략 가이드 (1,000자 이상 풍부한 텍스트).
- `FaqTab`: 실시간 1:1 턴 제한(30초), 기권 및 레이팅(LP) 변동 시스템, 자주 묻는 질문 8종 및 티어 랭킹 체계 안내.

- [ ] **Step 1: `RulesTab.tsx` 구현**
  - 시맨틱 HTML5 구조와 가독성 높은 카드 뉴모피즘 UI로 오목 규칙 설명.
  - 흑돌의 금수(착수 금지 지점) 시각적 예시와 백돌의 승리 전략을 명쾌하게 기술.

- [ ] **Step 2: `FaqTab.tsx` 구현**
  - 단답형 Q&A 카드 및 레이팅 티어(브론즈 ~ 다이아몬드) 안내 패널 작성.

- [ ] **Step 3: `App.tsx` 상단 컴팩트 알약(Pill) 3탭 바 탑재**
  - 높이 34~36px의 컴팩트 탭 바로 `[실시간 대전]`, `[대국 규칙]`, `[FAQ & 랭킹]` 전환 제공.

---

### Task 4: 680px 1화면 완결(Zero-Scroll) 컴팩트 대국실 & 3D 비주얼/사운드 고도화

**Files:**
- Modify: `onlinegame/omok-pvp/src/App.tsx`
- Modify: `onlinegame/omok-pvp/src/index.css`
- Modify: `onlinegame/omok-pvp/src/utils/soundEffects.ts`

**Layout Constraints (680px 규격):**
```
+-------------------------------------------------------------+
| 1. 상단 바 (36px): 로고 + 3탭(대전/규칙/FAQ) + 음소거/공유  |
+-------------------------------------------------------------+
| 2. 원라인(One-Line) 통합 전광판 (46px)                      |
|    - 좌측: 나 (흑/백 + 이름 + 레이팅)                        |
|    - 중앙: 실시간 턴 배지 + 30s 원형 LED 타이머             |
|    - 우측: 상대방 (백/흑 + 이름 + 티어)                      |
+-------------------------------------------------------------+
| 3. 메인 15×15 3D 바둑판 (370px × 370px)                     |
|    - 천연 온목재 텍스처 + 화점 5개 + 3D 방사형 셰이딩 돌   |
|    - 최근 착수 지점 펄스 링 + 승리 5목 골든 네온 레이저    |
+-------------------------------------------------------------+
| 4. 고정 2열 착수 기록 / 게임 피드백 패널 (64px, 고정높이)    |
+-------------------------------------------------------------+
| 5. 컴팩트 퀵챗 독 & 기권 액션 바 (42px)                     |
+-------------------------------------------------------------+
| 🚀 순수 내부 높이: 약 620~650px (680px 이내 완벽 무스크롤)    |
+-------------------------------------------------------------+
```

- [ ] **Step 1: 원라인(One-Line) 좌우 분할 통합 전광판 리팩토링**
  - 불필요하게 2단으로 높이를 차지하던 헤더를 46px 단일 행으로 결합.
  - 내 정보, 턴 표시, 30초 LED 프로그레스 링 타이머, 상대 정보를 컴팩트하게 배치.

- [ ] **Step 2: 15×15 바둑판 세로 공간 최적화**
  - 450px 팝업에서 스크롤바가 전혀 생기지 않도록 바둑판 크기를 370px 내외로 정밀 조정.
  - 흑돌/백돌에 입체 광택 하이라이트(`radial-gradient`) 및 드롭 섀도우를 부여하여 고급 수제 바둑알 질감 완성.
  - 착수 시 `active:scale-95` 및 `animate-stone-drop` 탄성 바운스 모션 추가.

- [ ] **Step 3: Web Audio API 사운드 및 모션 효과 보강**
  - 맑고 경쾌한 촥! 바둑판 타격음 및 승리 5목 완성 시 황금빛 레이저 빔 + 승리 팡파르 합성음 + 콘페티 연출.

---

### Task 5: AI 싱글 연습 모드 및 마케팅 3단계 캡처 속성(`data-screenshot-*`) 완비

**Files:**
- Create: `onlinegame/omok-pvp/src/utils/aiOpponent.ts`
- Modify: `onlinegame/omok-pvp/src/App.tsx`

**Features:**
- 상대방 접속을 기다리지 않고도 3단계 마케팅 화면을 완벽하게 재현·캡처할 수 있도록 클라이언트 AI 대전 엔진 내장.
- `miniapp.md` 공식 3단계 캡처 속성 표기:
  - 1단계(진입): 로비 화면 기본 노출
  - 2단계(조작): `<button data-screenshot-click="action">` (빠른 대전 또는 연습 대국 착수)
  - 3단계(결과): `<button data-screenshot-click="result">`, `<div data-screenshot-point="result">` (대국 승리 리포트 모달)

- [ ] **Step 1: 경량 오목 AI 엔진 (`aiOpponent.ts`) 작성**
  - 3목, 4목 방어 및 연속 5목 완성을 계산하는 휴리스틱 평가 함수 구현.
  - 유저 착수 후 0.4초 만에 자연스럽게 착수 응답.

- [ ] **Step 2: 로비에 'AI 싱글 연습 모드' 버튼 추가 및 `data-screenshot-*` 선언**
  - 로비의 '빠른 1:1 매칭' 및 'AI 연습 대국' 버튼에 `data-screenshot-click="action"` 선언.
  - 바둑판 특정 착수 지점 및 승리 모달에 `data-screenshot-point="result"`, `data-screenshot-click="result"` 선언.

- [ ] **Step 3: 로비 대기실 화면 850px 전체 균등 분할 밸런스 조정**
  - 상단 쏠림 방지: 프로필 카드 ➔ 빠른 매칭 & AI 연습 CTA ➔ 실시간 대기실 목록 ➔ 하단 실시간 네트워크 메트릭 & 보안 푸터가 850px에 걸쳐 아름다운 대칭을 이루도록 배치.

---

### Task 6: 빌드 검증, 자동 캡처 실행, Git 커밋 및 프로덕션 배포

**Files:**
- Target App: `onlinegame/omok-pvp`
- Global Scripts: `scripts/capture-single-miniapp.cjs`

- [ ] **Step 1: 로컬 빌드 및 타입 무결성 검증**
  - `npm run build` (in `onlinegame/omok-pvp`) 실행하여 TypeScript 및 Tailwind 빌드 통과 확인.
  - any, unknown 잔여 타입 0 확인.

- [ ] **Step 2: `npm run capture:app omok-pvp` 자동 캡처 검증**
  - 1단계(진입), 2단계(조작), 3단계(결과) 고해상도 실제 화면 PNG 자동 생성 및 크기 검증.

- [ ] **Step 3: Git 커밋, 원격 푸시 및 프로덕션 서버 배포**
  - `git commit -m "feat(omok-pvp): full compliance with miniapp.md 3.0 standards"`
  - `git push origin main`
  - 프로덕션 서버(`faithlinkportal`) 배포 및 실시간 서빙 검증.
