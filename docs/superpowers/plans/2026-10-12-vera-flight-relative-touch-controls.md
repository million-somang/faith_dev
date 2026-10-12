# [베라 플라이트] 모바일 상대 좌표(델타) 터치 조작 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 환경에서 사용자가 화면의 어느 위치(하단, 여백, 상단 등)를 터치하고 드래그하더라도 전투기가 터치 지점으로 강제 이동하지 않고, 손가락 드래그의 상대적 이동 거리(Delta)에 맞춰 비행기를 직관적이고 부드럽게 조작할 수 있는 '상대 좌표 터치 조작계(Virtual Touchpad / Relative Drag)'를 구축한다.

**Architecture:** 기존의 '목표 좌표 추적(Absolute Target Follow)' 방식(터치한 좌표로 플레이어가 유도 비행)을 완전 폐기하고, 터치 시작 시 기준점을 캡처한 뒤 `touchmove`/`mousemove` 시점의 화면 이동 변화량(`deltaX`, `deltaY`)에 캔버스 스케일 배율을 적용하여 플레이어 좌표(`state.player.x`, `state.player.y`)를 1:1로 실시간 갱신하는 델타 기반 상대 드래그 시스템으로 전면 개편한다. 멀티터치 충돌 방지를 위해 조작용 터치 식별자(`identifier`)를 격리하여 하단 폭탄/롤 스킬 버튼 동시 입력 시에도 기체 조작이 튀지 않도록 보호한다.

**Tech Stack:** React 18, TypeScript, HTML5 Canvas 2D, Touch / Pointer Event API, Tailwind CSS, Vite.

## Global Constraints

- **브랜드 무결성**: 100% 'VeraNex' 브랜드 준수 (FaithLink 명칭 전면 배제).
- **공식 로고 유지**: `miniapp.md` Golden Rule 12에 따라 상단 헤더 및 스플래시 화면의 공식 `logo-192.png`와 `V<span className="text-indigo-600">ERANEX</span>` 절대 보존.
- **60fps 무결성 유지**: 터치 이벤트 핸들러에서 불필요한 리액트 상태 리렌더링 없이 `ref` 및 `stateRef.current` 기반으로 즉시 처리하여 60~120fps 고주사율 모바일 기기에서도 입력 지연(Lag) 0ms 보장.
- **화면 경계 이탈 방지**: 상대 이동 중에도 캔버스 뷰포트 경계(상/하/좌/우 마진)를 벗어나지 않도록 클램핑 보장.

---

### Task 1: FlightCanvas 상대 터치 드래그 조작계 구현

**Files:**
- Modify: `apps/app-flight/src/components/FlightCanvas.tsx`

**Interfaces:**
- Consumes: `GameEngineState`, `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `updateGameEngine`, `renderGameEngine`
- Produces: 멀티터치 안전 상대 좌표 드래그 이벤트 핸들러 (`handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, `handleMouseDown`, `handleMouseMove`, `handleMouseUp`)

- [ ] **Step 1: `touchPosRef` 구조를 상대 드래그 상태 관리 구조로 개편**

  `FlightCanvas.tsx`의 절대 좌표 저장용 `touchPosRef`를 제거하고, 마지막 터치 좌표와 활성 터치 ID를 기록하는 `touchDragRef`로 교체한다.

  ```typescript
  // 기존:
  // const touchPosRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

  // 변경:
  const touchDragRef = useRef<{
    active: boolean;
    touchId: number | null;
    lastX: number;
    lastY: number;
  }>({
    active: false,
    touchId: null,
    lastX: 0,
    lastY: 0,
  });
  ```

- [ ] **Step 2: 상대 좌표 계산 및 플레이어 이동 함수 구현**

  터치 및 마우스 드래그 발생 시 스크린 좌표 변화량을 캔버스 내부 해상도(`CANVAS_WIDTH` / `CANVAS_HEIGHT`)로 환산하여 플레이어 위치를 직접 상대 이동시키고 경계를 클램핑하는 헬퍼 함수 구현:

  ```typescript
  const applyRelativeMove = (screenDeltaX: number, screenDeltaY: number) => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || state.status !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const p = state.player;
    p.x += screenDeltaX * scaleX;
    p.y += screenDeltaY * scaleY;

    // 캔버스 가두기 경계 유지
    const halfW = p.width / 2;
    const halfH = p.height / 2;
    if (p.x < halfW + 10) p.x = halfW + 10;
    if (p.x > CANVAS_WIDTH - halfW - 10) p.x = CANVAS_WIDTH - halfW - 10;
    if (p.y < halfH + 20) p.y = halfH + 20;
    if (p.y > CANVAS_HEIGHT - halfH - 15) p.y = CANVAS_HEIGHT - halfH - 15;
  };
  ```

- [ ] **Step 3: 멀티터치 안전 터치 이벤트 핸들러 작성**

  - `onTouchStart`: 활성 드래그 터치가 없을 때 첫 터치 식별자(`identifier`)를 등록하고 `lastX`, `lastY` 저장. (기체 좌표는 변경하지 않음)
  - `onTouchMove`: 등록된 `identifier`에 해당하는 터치를 찾아 `deltaX`, `deltaY`를 계산하고 `applyRelativeMove` 호출 후 `lastX`, `lastY` 갱신.
  - `onTouchEnd`, `onTouchCancel`: 등록된 터치가 종료되면 드래그 비활성화.
  - 마우스 이벤트(`onMouseDown`, `onMouseMove`, `onMouseUp`)도 동일한 델타 방식으로 작동하도록 연동.

- [ ] **Step 4: 렌더링 루프(`loop`) 내의 기존 `touchPosRef` 유도 이동 로직 제거**

  `loop` 함수 내에 남아있던 `dist > 4` 조건의 느린 유도 이동 코드를 완전히 제거하여 오직 상대 드래그와 키보드 입력만으로 민첩하게 조종되도록 정리.

- [ ] **Step 5: TypeScript 컴파일 및 빌드 검증**

  Run: `npm.cmd run build` (in `apps/app-flight`)
  Expected: Vite 빌드 정상 성공 (`built in ...`).

- [ ] **Step 6: 커밋**

  ```bash
  git add apps/app-flight/src/components/FlightCanvas.tsx
  git commit -m "feat(flight): implement relative drag touch controls for mobile"
  ```

---

### Task 2: 조작 가이드 안내 문구 및 UI 툴팁 최적화

**Files:**
- Modify: `apps/app-flight/src/components/HowToModal.tsx`
- Modify: `apps/app-flight/src/components/FlightCanvas.tsx`

**Interfaces:**
- Consumes: 모바일 상대 좌표 조작 사양
- Produces: 명확한 조작 가이드 안내 텍스트

- [ ] **Step 1: `HowToModal.tsx`의 모바일 터치 조작 설명 갱신**

  사용자가 '화면 어디를 터치해도 내 손가락이 기체를 가리지 않고 조종할 수 있다'는 점을 직관적으로 이해할 수 있도록 문구 개선:
  - 기존: `• 이동: 화면 손가락 드래그`
  - 변경: `• 이동: 화면 어디든 터치 후 드래그 (상대 조작 방식, 손가락이 기체를 가리지 않음)`

- [ ] **Step 2: `FlightCanvas.tsx` 시작 대기 화면 설명 개선**

  대기 화면의 텍스트가 상대 조작의 편의성을 반영하도록 점검 및 다듬기:
  `화면 어디든 터치하여 출격하세요!` 안내 유지.

- [ ] **Step 3: 빌드 및 무결성 검증**

  Run: `npm.cmd run build` (in `apps/app-flight`)
  Expected: 오류 없이 클린 빌드 완료.

- [ ] **Step 4: 커밋**

  ```bash
  git add apps/app-flight/src/components/HowToModal.tsx apps/app-flight/src/components/FlightCanvas.tsx
  git commit -m "docs(flight): update touch control manual for relative drag navigation"
  ```

---

### Task 3: 전체 빌드 및 모바일 시뮬레이션 동작 검증

**Files:**
- Test & Verify: `apps/app-flight`

**Interfaces:**
- Consumes: 전체 빌드 아티팩트
- Produces: 빌드 성공 및 런타임 검증 로그

- [ ] **Step 1: 전체 번들 빌드 실행**

  Run: `npm.cmd run build` (in `apps/app-flight`)
  Expected: `dist/` 정상 생성, TS 에러 0건.

- [ ] **Step 2: 최종 커밋 및 변경 이력 점검**

  Run: `git status`
  Expected: 클린 워킹 트리.
