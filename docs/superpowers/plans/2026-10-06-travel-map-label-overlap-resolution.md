# 재미 - 여행 지도 모바일/데스크톱 명칭 겹침 근본 해결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 화면에서 지도가 360px 이하로 대폭 축소될 때 HTML 뱃지가 지형 거리를 초과하여 서로 포개지던 구조적 원인을 해결하고, SVG 스케일 동기화 뱃지 및 해양 여백 스마트 앵커링을 적용하여 모든 화면에서 100% 겹침 없는 선명한 지도를 완성한다.

---

## 1. 근본 원인 분석 (Mathematical Root Cause)

사용자께서 첨부해주신 실제 캡처 화면을 정밀 분석한 결과:
- 지도의 SVG 뷰박스는 `800 x 759`이며, 모바일 스마트폰(화면 폭 ~360px)에서는 지도가 약 **0.45배로 대폭 축소**됩니다.
- 서울(X: 260)과 인천(X: 188)의 뷰박스 상 거리는 72px이지만, 모바일 화면에서는 **단 32.4px (72 × 0.45)** 로 좁혀집니다.
- 반면 기존 HTML 뱃지는 `[ 인천  475 ]` 가로 너비가 **약 75px ~ 85px** 로 고정되어 있어, 중심 거리가 32px밖에 안 되는 두 뱃지가 필연적으로 **40px 이상 겹쳐** 서울 뱃지의 지명이 인천 뱃지 뒤로 숨어버렸습니다 (세종·충남·충북·대전도 동일 현상).

---

## 2. 해결 아키텍처 (Core Architecture)

1. **SVG 벡터 스케일 동기화 뱃지 (SVG-Synchronized Badges)**:
   - 지도 축소와 무관하게 거대한 고정 픽셀을 차지하던 HTML 오버레이 방식의 한계를 극복하고, 지도의 줌/스케일 비율에 1:1로 완벽히 연동되는 **인터랙티브 SVG 벡터 뱃지(`<g className="cursor-pointer">`)**로 전면 전환한다.
   - 모바일에서 지도가 작아지면 뱃지 크기도 지형에 딱 맞게 자연스럽게 축소되어 물리적 겹침이 원천 차단된다.
2. **해양 및 내륙 여백 공간을 활용한 광역 앵커 분산 (Wide Spatial Anchoring)**:
   - **인천**: 서해 바다 공간(X: 145, Y: 155)을 적극 활용하여 수도권 내륙(서울)과 115px 이상의 안전 뷰박스 거리를 확보한다.
   - **서울**: 도심 북동측(X: 260, Y: 135)으로 상향 배치한다.
   - **경기**: 서울과 완전히 분리된 경기 남부 평택/안성(X: 305, Y: 215)으로 하향 배치한다.
   - **세종/대전/충남/충북**: 세종(X: 255, Y: 255 - 서북향), 대전(X: 325, Y: 335 - 동남향), 충남(X: 195, Y: 295 - 태안/서해 방면), 충북(X: 385, Y: 240 - 제천/단양 북동향)으로 십자형 방사상 분산 배치한다.
3. **울트라 슬림 2단 캡슐 디자인**:
   - 가로로 길게 늘어지던 `[ 지명 | 수량 ]` 형태를 가로 42px 이하의 콤팩트 캡슐(지명 위, 수량 아래 또는 인라인 슬림 뱃지)로 다이어트하여 시각적 개방감을 극대화한다.
4. **호버 & 터치 확대 (Spring Pop-on-Touch)**:
   - 모바일 터치 및 마우스 호버 시 뱃지가 1.2배 확대되며 은은한 드롭 섀도우가 켜져 손쉬운 클릭을 지원한다.

---

## Global Constraints

- 17개 광역시·도 및 세부 시·군 핀의 클릭 이벤트가 100% 정상 작동해야 한다.
- 모바일(320px ~ 420px) 뷰포트에서 서울, 인천, 경기, 세종, 대전, 충남, 충북, 광주, 전남, 부산 등 어떤 지역도 서로 1px도 겹치지 않아야 한다.
- 카운터 숫자(0건 ~ 수천 건)가 항상 정확하게 표시되어야 한다.

---

### Task 1: 17개 광역시·도 앵커 좌표 방사상 광역 분산 (`koreaMapData.ts`)

**Files:**
- Modify: `apps/main-portal/src/components/travel/koreaMapData.ts`

**Interfaces:**
- Produces:
  - 17개 광역시·도 앵커 좌표(`centerX`, `centerY`)를 상호 간섭 없는 광역 여백 공간(서해, 남부, 북동부)으로 전면 재배치

- [ ] **Step 1: 광역 분산 앵커 좌표 계산 및 적용**

```typescript
// 수도권: 인천 서해 바다, 서울 북동측, 경기 남부로 3각 완전 분리
seoul:   { centerX: 260, centerY: 135 }
incheon: { centerX: 145, centerY: 155 } // 서해 바다 쪽으로 확실히 분리
gyeonggi:{ centerX: 305, centerY: 215 } // 경기 남부로 분리

// 충청권: 4개 시도가 십자형 방사상으로 완전 분리
sejong:    { centerX: 260, centerY: 255 }
daejeon:   { centerX: 325, centerY: 335 }
chungnam:  { centerX: 195, centerY: 295 } // 서해안 방면
chungbuk:  { centerX: 385, centerY: 240 } // 충북 북동부

// 호남권: 광주 서북, 전남 남해안
gwangju:   { centerX: 220, centerY: 455 }
jeonnam:   { centerX: 250, centerY: 535 }
jeonbuk:   { centerX: 265, centerY: 395 }

// 영남권: 대구 중앙, 경북 북동, 경남 서남, 부산 동남해안, 울산 동해안
daegu:     { centerX: 430, centerY: 375 }
gyeongbuk: { centerX: 455, centerY: 265 }
gyeongnam: { centerX: 385, centerY: 470 }
busan:     { centerX: 505, centerY: 490 } // 해안가 쪽으로 분리
ulsan:     { centerX: 525, centerY: 415 }
```

- [ ] **Step 2: Commit**

```bash
git add apps/main-portal/src/components/travel/koreaMapData.ts
git commit -m "refactor(travel): widely distribute province anchors into surrounding open space"
```

---

### Task 2: SVG 벡터 연동 뱃지 렌더링 시스템 구현 (`InteractiveKoreaMap.tsx`)

**Files:**
- Modify: `apps/main-portal/src/components/travel/InteractiveKoreaMap.tsx`

**Interfaces:**
- Consumes: `PROVINCES`, `counts: MapCountsData`
- Produces: 
  - 모바일 축소 시 지형과 1:1로 함께 비례 축소되는 SVG 기반 인터랙티브 뱃지 컴포넌트
  - 지명 텍스트 + 카운트 알약 pill SVG 컴포넌트

- [ ] **Step 1: SVG 내부 인터랙티브 뱃지 렌더링 구현**

`InteractiveKoreaMap.tsx`의 SVG 내부에 지형 패스 바로 다음 레이어로 17개 광역시·도 뱃지를 렌더링:
```tsx
{/* 17개 광역시·도 SVG 벡터 뱃지 레이어 (지형과 함께 비례 축소되어 절대 겹치지 않음) */}
<g id="korea-province-badges">
    {(!selectedProvince || !isZoomed) && PROVINCES.map((prov) => {
        const count = provinceCounts[prov.name] || 0;
        const isSelected = selectedProvince === prov.name;
        const isHovered = hoveredProvince === prov.name;
        const cx = prov.centerX;
        const cy = prov.centerY;

        return (
            <g
                key={`svg-badge-${prov.id}`}
                transform={`translate(${cx}, ${cy})`}
                onClick={() => handleProvinceClick(prov)}
                onMouseEnter={() => setHoveredProvince(prov.name)}
                onMouseLeave={() => setHoveredProvince(null)}
                className="cursor-pointer select-none transition-transform duration-200"
                style={{
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))',
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: isHovered || isSelected ? 'scale(1.15)' : 'scale(1)',
                }}
            >
                {/* 뱃지 배경 외곽선 캡슐 */}
                <rect
                    x="-28"
                    y="-13"
                    width="56"
                    height="26"
                    rx="13"
                    fill={isSelected ? '#065f46' : isHovered ? '#047857' : '#ffffff'}
                    stroke={isSelected ? '#ffffff' : count > 0 ? '#10b981' : '#cbd5e1'}
                    strokeWidth="1.5"
                />
                {/* 지명 텍스트 */}
                <text
                    x="-7"
                    y="4"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="900"
                    fill={isSelected || isHovered ? '#ffffff' : '#1e293b'}
                >
                    {prov.shortName}
                </text>
                {/* 수량 알약 뱃지 (우측) */}
                {count > 0 && (
                    <g transform="translate(14, 0)">
                        <rect
                            x="-10"
                            y="-9"
                            width="20"
                            height="18"
                            rx="9"
                            fill={isSelected || isHovered ? '#ffffff' : '#059669'}
                        />
                        <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="900"
                            fill={isSelected || isHovered ? '#065f46' : '#ffffff'}
                        >
                            {count > 999 ? '999+' : count}
                        </text>
                    </g>
                )}
            </g>
        );
    })}
</g>
```

- [ ] **Step 2: 기존의 고정 픽셀 HTML 광역시·도 오버레이 제거**
  - 화면 축소 시 겹침의 원인이었던 HTML `div` 기반 17개 시도 뱃지 코드 완전 삭제.
  - 확대 시 세부 시·군 핀은 해당 도 지형에 맞게 유지하되, 컴팩트한 크기 유지.

- [ ] **Step 3: Commit**

```bash
git add apps/main-portal/src/components/travel/InteractiveKoreaMap.tsx
git commit -m "feat(travel): implement SVG-synchronized vector badges to permanently eliminate mobile overlap"
```

---

### Task 3: 레이아웃 시뮬레이션 검증 및 프로덕션 빌드

**Files:**
- Modify: `scripts/test-mobile-map-layout.ts`

- [ ] **Step 1: 레이아웃 충돌 검증 스크립트 실행**
  * Run: `cmd /c npx tsx scripts/test-mobile-map-layout.ts`
  * Expected: 360px 모바일 화면에서도 모든 지역 100% 무충돌 통과

- [ ] **Step 2: 전체 모노레포 프로덕션 빌드 실행**
  * Run: `cmd /c npm run build`
  * Expected: 34개 태스크 전원 성공

- [ ] **Step 3: Commit**

```bash
git add scripts/test-mobile-map-layout.ts
git commit -m "test(travel): verify collision-free SVG badge layout across all screen sizes"
```
