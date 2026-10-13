# 생활도구 '이미지 크기 조정 & 일괄 변환기' 완전 복원 구현 계획서

> **문제 현상:** 어제 개발 완료된 '이미지 크기 조정 & 일괄 변환기(`image-resizer`)'가 생활도구 허브(`/lifestyle`, `/utility`) 및 사이드바 도구 목록에서 보이지 않음.
> **원인 규명:**
> 1. 미니앱 본체(`/app/image-resizer/`) 및 상세 페이지(`/tools/image-resizer`)는 이미 정상 빌드 및 배포(HTTP 200 OK)되어 있으나,
> 2. 백엔드 `mini_apps` 데이터베이스 테이블 및 `apps/api-server/src/routes/miniapp.routes.ts`의 자동 시딩(Auto-seeding) 목록에 `image-resizer`가 누락되어 있어 `/api/mini-apps` 응답에서 제외됨.
> 3. 그 결과 생활도구 허브(`/utility`, `/lifestyle`)에서 앱 버튼이 렌더링되지 않았음.

---

## 1. 전역 제약 조건

- 플랫폼: Next.js 14 App Router (`apps/next-portal`) 및 Hono 백엔드 (`apps/api-server`).
- 운영 서버: PM2 `faith-portal` (id: 1) 및 `faith-api` (id: 0).
- 복원 대상: 생활도구 목록(`/utility`, `/lifestyle`), 메인 페이지 사이드바 도구 위젯, 팝업 런처 연동.

---

## 2. 세부 구현 작업

### Task 1: 백엔드 API & DB 시딩 추가
- `apps/api-server/src/routes/miniapp.routes.ts` 내 `image-resizer` 자동 시딩 로직 추가.
- 운영 서버 `faith-portal.db`에 `image-resizer` 레코드 삽입 및 `faith-api` (PM2 id 0) 재시작.

### Task 2: 생활도구 페이지(`/utility`, `/lifestyle`) 누락 방지 강화
- `apps/next-portal/src/app/utility/page.tsx`에 `TOOLS_DATA` 자동 결합(Merge) 로직 추가하여 API 응답과 무관하게 언제나 앱 목록에 노출되도록 보장.

### Task 3: 메인 페이지 사이드바 도구 위젯 연동
- `apps/next-portal/src/components/homepage/SidebarGuidesWidget.tsx`의 '스마트 계산기 & 도구'에 '이미지 크기 조정' 링크 추가.

### Task 4: 빌드, 배포 및 라이브 검증
- Next.js 빌드 및 배포.
- `/utility` 및 `/tools/image-resizer` 정상 노출 및 실행 확인.
