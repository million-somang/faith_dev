# 포털 카드 클릭 시 상세 안내 페이지 선행 이동 및 miniapp.md 골든 룰 수립 플랜

> **목표**: 베라 플라이트(Vera Flight)를 포함한 모든 게임 및 도구 카드가 포털에서 직접 팝업을 띄우지 않고, 상세 안내/전략 페이지(`/game/:gameId` 또는 `/tools/:slug`)로 먼저 이동한 후 사용자가 [게임 시작]을 눌러 팝업을 실행하도록 표준 플로우를 복원하고, `miniapp.md`에 영구적인 골든 룰로 명문화합니다.

---

## 1. 배경 및 문제 분석

1. **현재 발생한 문제 (룰 위반)**:
   - `apps/main-portal/src/pages/GamePage.tsx`에서 베라장기, 베라오목, 베라 숫자야구, 베라 팝, 스도쿠, 2048 등 다른 8개 게임 카드는 모두 `<button onClick={() => navigate('/game/:gameId')} className="...">` 형태로 구현되어 상세 안내 페이지로 먼저 이동합니다.
   - 반면 **베라 플라이트(Vera Flight)** 카드는 `onClick={() => launchApp('/app/flight/', 'app-flight')}`로 구현되어 카드를 클릭하자마자 소개 페이지 없이 직접 팝업 창이 열리는 일탈(규칙 위반)이 발생했습니다.
2. **상세 페이지 선행 이동 원칙의 중요성**:
   - **SEO / AEO (검색엔진 & AI 오버뷰 최적화)**: 구글 및 AI 검색 에이전트(ChatGPT, Perplexity, Gemini 등)는 상세 페이지(`/game/:id`)의 게임 규칙, 필승 전략 수식, 3단계 이용 가이드, FAQ를 정적으로 크롤링 및 인덱싱합니다. 팝업 직접 호출 시 사용자 및 봇의 접근 경로가 차단됩니다.
   - **사용자 경험(UX) 보장**: 1942 스타일 비행 슈팅 게임의 360도 롤링(무적 회피), 메가 폭탄, 빨간 편대 격추 파워업(P/L/B) 등의 핵심 조작법과 룰을 사전에 파악하지 못한 채 진입하면 조기 격추 및 이탈로 이어집니다.
   - **플랫폼 아이덴티티 일관성**: 모든 VeraNex 미니앱 카드는 일관된 탐색 흐름(카드 클릭 ➔ 상세/전략 페이지 ➔ 게임 시작/도구 실행 팝업)을 제공해야 합니다.

---

## 2. 세부 작업 태스크 (Tasks)

### Task 1: `miniapp.md` 골든 룰 14 수립 및 미니앱 아키텍처 명문화
- **대상 파일**: `miniapp.md`
- **작업 내용**:
  1. **핵심 원칙 요약 (Golden Rules)**에 `14. 포털 카드 클릭 시 상세 안내/전략 페이지 선행 이동 원칙 (Detail Page Precedence & Direct Popups Prohibited)` 추가:
     - 모든 게임/도구 카드는 포털에서 직접 팝업(`launchApp`)을 호출하는 것을 엄격히 금지.
     - 반드시 해당 게임/도구의 상세 소개 및 SEO/AEO 랜딩 페이지(`/game/:id` 또는 `/tools/:slug`)로 먼저 `navigate` 처리.
     - 상세 페이지에서 게임 규칙, 공략 전략, 3단계 이용 가이드, FAQ, 조작법 키 안내를 충분히 제공한 후, 상단/하단의 [게임 시작하기] 또는 [도구 실행하기] 액션 버튼을 클릭했을 때 비로소 450px 모바일 규격 팝업 창이 실행되는 2단계 진입 플로우를 100% 의무화.
  2. 제1장 아키텍처 규격에 상세 안내 페이지 연동 및 진입 시퀀스 다이어그램 명시.

---

### Task 2: `GamePage.tsx` 베라 플라이트 카드 표준화
- **대상 파일**: `apps/main-portal/src/pages/GamePage.tsx`
- **작업 내용**:
  - 기존 669~706라인의 `launchApp('/app/flight/', 'app-flight')` 직접 호출 구조를 제거.
  - 다른 8개 게임 카드와 100% 동일하게 `<button onClick={() => navigate('/game/flight')} className="...">` 구조로 교체.
  - 카드 하단의 부가 텍스트를 `규칙 및 공략 가이드 →` / `웹 무료 플레이`로 통일하여 일관된 룩앤필 제공.

---

### Task 3: 무결성 검증 (빌드 & 사전 렌더링 확인)
- **검증 항목**:
  1. `apps/main-portal/src/pages/GameInfoPage.tsx`의 `GAME_CONFIGS.flight` 설정 무결성 확인 (`appUrl: '/app/flight/'`, `appName: 'app-flight'`).
  2. `apps/main-portal/src/data/gamesSeoData.ts`의 `GAMES_SEO_DATA.flight` AEO 데이터 완비 확인.
  3. `npm.cmd --prefix apps/main-portal run build` 실행하여 TypeScript 컴파일 에러 0건 및 `dist/game/flight/index.html` 정적 사전렌더링 파일 정상 생성 확인.

---

### Task 4: 운영 서버 배포 및 실브라우저 확인
- **배포 및 검증 절차**:
  1. Git commit & push (`refactor(game): enforce detail page precedence for vera flight and update miniapp master rules`).
  2. 원격 서버(`veranex.app`)에 `apps/main-portal/dist` 압축 아카이브 전송 및 갱신 배포, PM2 리로드.
  3. 실브라우저에서 `https://veranex.app/game` 접속:
     - 베라 플라이트 카드 클릭 시 `/game/flight` 상세 안내 페이지로 올바르게 이동하는지 확인.
     - 상세 페이지에서 소개, 360도 롤링 조작법, 공략 원칙, FAQ가 정상 렌더링되는지 확인.
     - [게임 시작하기] 버튼 클릭 시 450px 규격의 베라 플라이트 팝업이 정상 실행되는지 확인.

---

## 3. 완료 판정 기준
- [ ] `miniapp.md`에 골든 룰 14(상세 페이지 선행 이동 원칙)가 공식 추가됨.
- [ ] `GamePage.tsx`의 베라 플라이트 카드가 `/game/flight`로 100% 이동함.
- [ ] 로컬 빌드 및 정적 프리렌더링 통과.
- [ ] 원격 실서버 배포 완료 및 라이브 테스트 통과.
