# 모바일 메인 최상단 쿠팡 배너·뉴스 우선 노출 & 날씨·증시 위젯 1/5 극소화 구현 계획서

> **실행 규칙:** Next.js App Router(`apps/next-portal`) 기반을 유지하면서, 모바일 메인에서 쿠팡 광고와 실시간 뉴스를 최상단으로 올리고 날씨·증시 위젯을 1/5 크기(원라인 슬림 마이크로 칩)로 극소화합니다.

**목표:**
1. 모바일 환경에서 접속하자마자 **쿠팡 배너**와 **실시간 뉴스**가 첫 화면(스크롤 없이)에 바로 노출되도록 재배치.
2. 날씨 및 증시 위젯을 기존의 큰 카드 형태에서 **정확히 1/5 수준의 한 줄 마이크로 칩(`h-8 ~ h-9`)**으로 대폭 축소.
3. 데스크탑(PC) 화면에서는 정돈된 12열 2컬럼 매거진 레이아웃을 그대로 유지.

---

## 1. 전역 제약 조건

- 플랫폼: Next.js 14 App Router (`apps/next-portal`).
- 운영 서버: PM2 `faith-portal` (포트 3000) 무중단 서비스.
- 모바일 뷰포트 최적화: 폭 360px ~ 430px 환경에서 쿠팡 배너가 최우선 노출되고, 날씨·주식이 한 줄로 컴팩트하게 자리잡아야 함.

---

## 2. 세부 구현 작업

### Task 1: 날씨 및 증시 위젯 1/5 크기 극소화 (Micro-Widget 개편)

- **`apps/next-portal/src/components/homepage/WeatherWidget.tsx`**
  - 모바일 뷰: 기존 두꺼운 박스 카드(`px-4 py-3 min-w-[150px]`)를 제거하고, `text-xs px-2.5 py-1 rounded-xl` 높이 30px 수준의 **마이크로 날씨 인라인 칩**(`☀️ 18.2° 서울 맑음`)으로 변경.
- **`apps/next-portal/src/components/homepage/StockWidget.tsx`**
  - 모바일 뷰: 기존 칩들을 제거하고 `text-xs px-2.5 py-1 rounded-xl` 높이 30px 수준의 **마이크로 환율/증시 인라인 칩**(`💵 USD 1,385원(+0.2%)`)으로 변경.

### Task 2: 모바일 메인 최상단 쿠팡 배너 & 실시간 뉴스 우선 배치 (`page.tsx`)

- **`apps/next-portal/src/app/page.tsx`**
  - 모바일 반응형 순서:
    1. VERA Lounge 라이브 핫토론 띠배너
    2. **[최상단] 쿠팡 파트너스 다이내믹 메인 배너 (`BannerSlot slotKey="home_main_top"`)**
    3. **[최상단] 실시간 뉴스 & 팩트 브리핑 (`LiveNewsSection`)**
    4. **[1/5 극소화] 날씨 & 환율 원라인 초소형 마이크로 바**
    5. 컴팩트 검색창
    6. 지식 가이드 25편 쇼케이스
    7. 스마트 계산기 및 생활 도구
    8. VERA 3대 핵심 서비스 쇼케이스
  - 데스크탑(`lg:`):
    - 좌측 8열(가이드 → 쿠팡배너 → 뉴스), 우측 4열(날씨·증시 → 도구 → 사이드바배너) 구조 유지.

### Task 3: 빌드, 운영 서버 배포 및 라이브 검증

1. 로컬 Next.js 빌드 (`npm.cmd run build` in `apps/next-portal`).
2. `.next` 배포 패키지 생성 및 운영 서버(`faithlinkportal`) 전송.
3. PM2 `faith-portal` 재시작 및 모바일 뷰포트 렌더링 확인.
