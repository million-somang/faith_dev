# 재미 - 여행 지도 모바일/데스크톱 명칭 및 뱃지 겹침 해결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대한민국 인터랙티브 여행 지도에서 서울·인천·경기, 세종·대전, 광주·전남, 부산·울산 등 밀집된 광역시·도 뱃지와 세부 시·군 핀이 모바일 및 모든 화면 크기에서 글자 겹침 없이 또렷하게 표시되고 편리하게 터치되도록 좌표 오프셋 및 반응형 뱃지 시스템을 전면 개선한다.

**Architecture:**
1. **스마트 앵커 좌표계 (Collision-free Provincial Anchors)**: 17개 광역시·도 메타데이터(`koreaMapData.ts`)에 밀집 권역(수도권, 충청, 호남, 영남)의 물리적 지형 중심 대신 뱃지 겹침을 방지하는 정밀 시각적 앵커 좌표(`anchorX`, `anchorY`) 및 방향성 오프셋을 도입한다.
2. **모바일 반응형 뱃지 스케일링 & 콤팩트 UI**: 모바일 화면(`sm` 미만)에서는 뱃지 크기를 슬림 캡슐(`scale-85 sm:scale-100`, 패딩 축소, 폰트 `text-[10px]`, 카운트 뱃지 인라인화)로 반응형 최적화하여 점유 면적을 45% 이상 절감한다.
3. **시·군 핀 스마트 분산 & 충돌 방지 알고리즘**: 특정 도 확대 시 좌표 거리가 가까운 인접 시·군 핀들(예: 서울 중구-종로구) 간에 최소 여백을 보장하는 인접 분산(Repulsion Offset) 및 시·군 칩 내비게이션과의 상호 연동을 강화한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, SVG ViewBox

---

## Global Constraints

- 17개 광역시·도 및 하위 시·군·구의 클릭 및 내비게이션 기능이 100% 정상 동작해야 한다.
- 모바일(360px ~ 420px 너비) 환경에서 서울, 인천, 경기, 세종, 대전, 광주, 부산의 뱃지가 서로 1px도 겹치지 않고 온전히 읽혀야 한다.
- 카운터 숫자(0건 또는 수십~수천 건)가 포함되어도 뱃지가 지형 밖으로 삐져나가거나 잘리지 않아야 한다.
- 기존의 부드러운 호버/클릭 인터랙션과 줌인 애니메이션을 온전히 유지한다.

---

### Task 1: 17개 광역시·도 뱃지 시각적 앵커 좌표 및 오프셋 정밀 조정 (`koreaMapData.ts`)

**Files:**
- Modify: `apps/main-portal/src/components/travel/koreaMapData.ts`

**Interfaces:**
- Produces: 
  - `ProvinceMeta` 인터페이스에 선택적 뱃지 앵커 좌표 및 오프셋 속성 지원 (`badgeOffsetX?`, `badgeOffsetY?`)
  - 수도권(서울·인천·경기), 충청권(세종·대전), 호남권(광주·전남), 영남권(부산·울산·경남)의 뱃지 중심 좌표 분산 배치

- [ ] **Step 1: `ProvinceMeta` 인터페이스 확장 및 좌표 최적화**

`apps/main-portal/src/components/travel/koreaMapData.ts`에서:
- `badgeOffsetX`, `badgeOffsetY` 필드 추가
- 밀집 권역 뱃지 위치를 시각적으로 겹치지 않는 최적 위치로 분산:
  * **인천**: 서해 쪽으로 서쪽 이동 (X: 188, Y: 158)
  * **서울**: 한강 이북 도심 중심에서 북동향 소폭 이동 (X: 260, Y: 142)
  * **경기**: 서울과 겹치지 않도록 경기 남부 넓은 지형으로 확실히 하향 배치 (X: 295, Y: 195)
  * **세종**: 충남 동북부 경계 (X: 280, Y: 270)
  * **대전**: 세종 하단 남동향으로 분리 (X: 310, Y: 320)
  * **충남**: 서해안 내포 방면 (X: 225, Y: 288)
  * **충북**: 충북 중앙 내륙 (X: 365, Y: 250)
  * **광주**: 무등산 서편 도심 (X: 230, Y: 468)
  * **전남**: 남해안 다도해/순천 방면 (X: 245, Y: 525)
  * **대구**: 팔공산 남측 (X: 432, Y: 382)
  * **울산**: 동해안 방면 (X: 518, Y: 420)
  * **부산**: 남동단 해안가 (X: 495, Y: 480)
  * **경남**: 서부 경남 지리산/진주 방면 (X: 395, Y: 470)

- [ ] **Step 2: 시·군 메타데이터 좌표 정밀화**
  * 서울 자치구: 종로구(260, 132), 중구(263, 148), 마포구(242, 144), 강남구(272, 158)로 상호 20px 이상 간격 확보
  * 부산: 해운대구(502, 465), 중구(480, 482), 기장군(510, 448) 간격 확보

- [ ] **Step 3: Commit**

```bash
git add apps/main-portal/src/components/travel/koreaMapData.ts
git commit -m "refactor(travel): optimize province and city badge anchor coordinates to prevent collision"
```

---

### Task 2: 모바일 반응형 뱃지 스타일링 및 스마트 충돌 방지 렌더링 (`InteractiveKoreaMap.tsx`)

**Files:**
- Modify: `apps/main-portal/src/components/travel/InteractiveKoreaMap.tsx`

**Interfaces:**
- Consumes: `ProvinceMeta`, `MapCountsData`
- Produces: 
  - 모바일 최적화 슬림 뱃지 컴포넌트 구조
  - 뷰박스 좌표계 기반 오프셋 매핑 계산식
  - Z-Index 레이어링 (선택된 도 / 호버된 도 뱃지 최상단 우선 표시)

- [ ] **Step 1: 모바일/데스크톱 반응형 뱃지 디자인 개선**

`InteractiveKoreaMap.tsx`의 17개 광역시·도 뱃지 렌더링 블록:
1. 뱃지 컨테이너 크기 및 패딩 반응형화:
   ```tsx
   // 모바일에서는 px-2 py-0.5 text-[10px], 데스크톱에서는 px-2.5 py-1 text-xs
   className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md text-[10px] sm:text-xs font-black border transition-all ...`}
   ```
2. 카운트 뱃지 슬림화:
   ```tsx
   <span className="px-1 py-0.1 sm:px-1.5 sm:py-0.2 rounded-full text-[9px] sm:text-[10px] font-black ...">
       {count > 999 ? '999+' : count}
   </span>
   ```
3. 좌표 계산식에 `prov.badgeOffsetX`, `prov.badgeOffsetY` 반영:
   ```tsx
   const targetX = prov.centerX + (prov.badgeOffsetX || 0);
   const targetY = prov.centerY + (prov.badgeOffsetY || 0);
   const leftPct = ((targetX - vbX) / vbW) * 100;
   const topPct = ((targetY - vbY) / vbH) * 100;
   ```

- [ ] **Step 2: 세부 시·군 핀 겹침 방지 (Repulsion / Staggered Placement)**

도 확대 시 자치구/시·군 핀 렌더링:
1. 인접한 핀들(거리 25px 이내) 간에 지그재그 교차 오프셋(`index % 2 === 0 ? -6px : +6px`)을 주어 글자 포개짐 차단
2. 모바일에서는 핀 크기를 `scale-90 sm:scale-100`으로 컴팩트하게 축소
3. 호버 및 액티브 시 z-index를 최상위(`z-30`)로 올려 터치 편의성 극대화

- [ ] **Step 3: 모바일 뷰 전용 가독성 개선 가드**
  * 뷰박스 경계 바깥으로 뱃지가 튀어나가지 않도록 클리핑 가드 보강 (`leftPct < 4 || leftPct > 96`)

- [ ] **Step 4: Commit**

```bash
git add apps/main-portal/src/components/travel/InteractiveKoreaMap.tsx
git commit -m "fix(travel): apply mobile responsive scaling and collision avoidance to map labels"
```

---

### Task 3: 빌드 검증, 모바일 뷰포트 시각적 회귀 테스트 및 성능 확인

**Files:**
- Test: 모바일(375px, 390px, 412px) 및 데스크톱 뷰포트 검증

- [ ] **Step 1: 프론트엔드 프로덕션 빌드 실행**
  * Run: `npm run build --workspace=@faithportal/main-portal`
  * Expected: TypeScript 및 Vite 빌드 정상 통과

- [ ] **Step 2: 모바일 뷰포트 레이아웃 및 뱃지 겹침 검증**
  * 브라우저 개발자 도구 및 스크린샷 검증을 통해 서울-인천-경기, 세종-대전, 광주-전남 뱃지가 모바일에서 겹침 없이 선명하게 표시되는지 확인

- [ ] **Step 3: Commit**

```bash
git add apps/main-portal/src/components/travel/koreaMapData.ts apps/main-portal/src/components/travel/InteractiveKoreaMap.tsx
git commit -m "test(travel): verify mobile map badge layout and collision-free rendering"
```
