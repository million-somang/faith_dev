# 베라오목 온라인 헤더 및 웜 베이지 톤앤매너 리디자인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `onlinegame/omok-pvp`(베라오목 온라인)의 상단 헤더를 슬림 일체형으로 개편하고, 로딩 화면의 3D 바둑판 엠블럼을 로고로 적용하며, 탭 메뉴 글자 꺾임 방지를 위해 2행 분리 구조를 채택하고, 전체 배경을 차가운 화이트에서 따뜻한 옅은 베이지(#f7f4ed) 뉴모피즘으로 전면 리디자인합니다.

**Architecture:** `MiniAppLayout`의 중복 헤더 문제를 해결하여 미니앱 자체의 42px 1행 헤더와 36px 2행 탭 그리드를 결합한 슬림 2행 상단 내비게이션을 구축하고, 웜 베이지 컬러 토큰을 정의하여 로비, 대국실, 규칙, FAQ 전 화면에 일관되게 적용합니다. 팝업 세로 높이를 재계산하여 외부 스크롤바를 100% 제거합니다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Lucide React, Web Audio API.

## Global Constraints
- **옅은 웜 베이지 톤앤매너**: 배경 `#f7f4ed`, 서브 카드 `#fdfbf7`, 보더 `#e8e1d5` / `#dfd7c7`로 따뜻하고 눈이 편안한 바둑 테마 완성.
- **2행 상단 내비게이션**: 1행(로고+타이틀+볼륨+닫기) + 2행(3탭 그리드)으로 분리하여 텍스트 꺾임(`실시간 대\n국`) 원천 차단.
- **3D 바둑판 브랜드 심볼 로고**: 스플래시 화면의 3D 온목재 바둑판 엠블럼(흑돌/백돌 입체 광택)을 헤더 타이틀 앞에 탑재.
- **Zero-Scroll 완결**: 450px × 850px 팝업 기준 세로 스크롤바 완전 제거 (1화면 완결).
- **코드 무결성**: any, unknown 타입 배제, 메모리 누수 방지.

---

### Task 1: 3D 온목재 바둑판 미니 로고 컴포넌트 (`OmokLogo.tsx`) 구현
- [ ] `onlinegame/omok-pvp/src/components/OmokLogo.tsx` 생성
- [ ] 26×26px 크기의 정교한 3D 온목재 질감 + 3×3 격자선 + 3D 흑돌/백돌 입체 엠블럼 작성

### Task 2: 웜 베이지 컬러 팔레트 & 뉴모피즘 CSS 스타일 정의
- [ ] `onlinegame/omok-pvp/src/index.css`에 웜 베이지 토큰 및 그림자 선언
- [ ] 쿨 슬레이트 계열을 따뜻한 한지/우드 베이지 톤으로 전환

### Task 3: 2행 일체형 상단 헤더 & 메뉴 내비게이션 리팩토링
- [ ] `onlinegame/omok-pvp/src/App.tsx` 상단부 2행 구조 구현:
  - 1행: `OmokLogo` + `베라오목 온라인` + `PVP` + `음소거` + `닫기(X)`
  - 2행: `grid grid-cols-3` 3탭 (`실시간 대국`, `경기 규칙`, `FAQ`)
- [ ] `whitespace-nowrap` 적용으로 텍스트 줄바꿈 완전 제거

### Task 4: 로비, 대국실, 규칙, FAQ 전 화면 웜 베이지 & 무스크롤 피팅
- [ ] 로비 프로필, 빠른 매칭, AI 모드, 대기실 카드를 웜 베이지 톤으로 마감
- [ ] 전체 컴포넌트 여백 압축으로 우측 스크롤바 완전 제거
- [ ] 대국실 바둑판 래퍼 및 모달 웜 베이지 조화

### Task 5: 빌드 검증, 자동 캡처, Git 푸시 및 서버 배포
- [ ] `npm.cmd run build` 통과 검증
- [ ] 빌드 산출물 서버 scp 동기화 및 pm2 reload
- [ ] `node scripts/capture-single-miniapp.cjs omok-pvp` 실행으로 3단계 캡처본 갱신
- [ ] Git 커밋 & 푸시
