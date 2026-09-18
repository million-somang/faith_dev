# FaithPortal (VERA) 전체 코드 점검 및 품질 감사 보고서 (code.md)

> **문서 목적**: 본 문서는 FaithPortal(VeraNex)의 프론트엔드, 백엔드 API 서버, 공통 패키지, 데이터베이스 전반을 심층 분석하여 **보안 취약점, 잠재적 런타임 에러 요인, 코드 중복, 컴포넌트 구조적 문제, 불필요한 트래픽 및 성능 병목**을 점검하고 구체적인 개선 가이드를 제시합니다.  
> **점검 기준일**: 2026-09-18  
> **대상 워크스페이스**: `apps/api-server`, `apps/main-portal`, `apps/app-*`, `packages/database`, `packages/ui-components`, `packages/mini-app-sdk`, `packages/core-utils`

---

## 📑 목차
1. [보안적인 요소 점검 (Security Audit)](#1-보안적인-요소-점검-security-audit)
2. [에러 유발하는 코드 점검 (Runtime Error & Stability Audit)](#2-에러-유발하는-코드-점검-runtime-error--stability-audit)
3. [중복되는 코드 점검 (Code Duplication Audit)](#3-중복되는-코드-점검-code-duplication-audit)
4. [컴포넌트화 및 구조적 점검 (Component Architecture & Modularity)](#4-컴포넌트화-및-구조적-점검-component-architecture--modularity)
5. [트래픽 및 성능 점검 (Traffic & Performance Optimization)](#5-트래픽-및-성능-점검-traffic--performance-optimization)
6. [우선순위별 개선 로드맵 (Actionable Roadmap)](#6-우선순위별-개선-로드맵-actionable-roadmap)

---

## 1. 보안적인 요소 점검 (Security Audit)

### 🔴 [치명적] 관리자 인증 토큰 서명 미검증 (인증 우회 가능)
- **위치**: `apps/api-server/src/routes/admin.routes.ts` (9~46행)
- **현상**:
  ```ts
  const token = authHeader.replace('Bearer ', '');
  const decoded = Buffer.from(token, 'base64').toString();
  const userId = decoded.split(':')[0];
  const admin = await DB.prepare('SELECT level, status FROM users WHERE id = ?').bind(userId).first();
  ```
- **문제점**:
  - 관리자 인증이 암호학적 서명(HMAC, JWT, 전자서명) 없이 단순 **Base64 디코딩**만으로 유저 ID를 추출하여 권한을 부여합니다.
  - 관리자 유저 ID(예: `1`)를 알고 있는 누구나 `Buffer.from("1:anything").toString("base64")` 형태의 토큰을 헤더에 실어 보내면 모든 관리자 API를 무단 호출할 수 있습니다.
- **개선 방안**:
  - HMAC 서명 기반의 안전한 JWT(JSON Web Token) 또는 서버 세션 스토리지 기반 인증으로 교체해야 합니다.

---

### 🔴 [높음] 비밀번호 해싱 반복 횟수(Iteration) 부족 및 평문 호환 코드 잔존
- **위치**: `apps/api-server/src/middleware/auth.ts` (82~105행)
- **현상**:
  ```ts
  // 1,000회 반복 해싱
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  
  // 평문 비밀번호 비교 허용
  if (!storedHash.includes(':')) {
      if (password === storedHash) return true;
  }
  ```
- **문제점**:
  - OWASP 권장 PBKDF2 반복 횟수는 최소 210,000회(SHA-512 기준)입니다. 1,000회는 최신 GPU로 수초 내에 레인보우 테이블/무차별 대입 공격에 뚫릴 수 있습니다.
  - DB에 콜론이 없는 구형 평문 비밀번호를 그대로 허용하고 있어, 계정 탈취 리스크가 큽니다.
- **개선 방안**:
  - 반복 횟수를 최소 100,000회 이상으로 증액하거나 현대적인 `Argon2id` 또는 `bcrypt` 라이브러리로 전환.
  - 평문 로그인 성공 시 즉시 강력한 해시로 자동 재해싱(Re-hash on login) 적용.

---

### 🟠 [높음] 세션 쿠키 `secure: false` 설정 (MITM 탈취 위험)
- **위치**: `apps/api-server/src/middleware/auth.ts` (65~67행)
- **현상**:
  ```ts
  setCookie(c, 'session_id', sessionId, {
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: true,
      secure: false, // 임시로 HTTPS 강제 제거
      sameSite: 'Lax',
      path: '/'
  });
  ```
- **문제점**: 프로덕션 HTTPS 환경에서도 쿠키가 암호화되지 않은 HTTP 요청에 실려 전송될 수 있어, 와이파이나 네트워크 중간자 공격(MITM) 시 세션 ID 탈취 가능.
- **개선 방안**: `secure: process.env.NODE_ENV === 'production'`으로 환경별 조건부 적용.

---

### 🟠 [높음] Rate Limiting(요청 제한) 부재로 인한 무차별 대입/DoS 노출
- **위치**: `apps/api-server/src/routes/auth.routes.ts`, `analytics.routes.ts`, `server.ts`
- **문제점**:
  - `/api/auth/login` (로그인 무차별 대입 공격 무방비)
  - `/api/auth/signup` (스팸 계정 대량 생성 무방비)
  - `/api/analytics/pageview` (DB에 대량의 더미 페이지뷰 삽입 가능)
  - IP 또는 세션 기반 속도 제한 미들웨어가 전혀 적용되어 있지 않음.
- **개선 방안**:
  - Hono용 레이트 리미터 미들웨어(`hono-rate-limiter` 등) 또는 인메모리 토큰 버킷을 적용하여 엔드포인트별 제한 설정:
    - 로그인: IP당 1분에 최대 5회 시도
    - 일반 API: IP당 1초에 최대 20~30회

---

### 🟡 [중간] 프로덕션 콘솔 로그 내 세션 ID 평문 노출
- **위치**: `apps/api-server/src/middleware/auth.ts` (22행)
- **현상**: `console.log('[DEBUG AUTH] Cookie session_id =', sessionId)`
- **문제점**: 서버 실행 로그 파일이나 PM2 로그에 사용자들의 실시간 세션 ID가 기록되어 내부자 유출 및 로그 탈취 위험 발생.
- **개선 방안**: 디버그 로그 제거 또는 앞 4자리 외 마스킹 처리.

---

### 🟡 [중간] 광고 배너 및 DOM-XSS 위험
- **위치**:
  - `apps/main-portal/src/components/BannerSlot.tsx` (109행): `dangerouslySetInnerHTML={{ __html: banner.ad_code }}`
  - `apps/api-server/src/routes/admin-ui.ts` (1430, 1450행): `document.body.insertAdjacentHTML('beforeend', modalHtml)` 내부 `${message}` 미이스케이프
- **문제점**: 만약 관리자 권한이 침해되거나 잘못된 스크립트가 DB에 삽입될 경우, 방문자 전원에게 영구적 악성 스크립트 실행(Persistent XSS) 가능.
- **개선 방안**: DOMPurify를 통한 살균(Sanitization) 처리 후 주입.

---

## 2. 에러 유발하는 코드 점검 (Runtime Error & Stability Audit)

### 🔴 [치명적] SQLite 동시 쓰기 락 (`SQLITE_BUSY: database is locked`)
- **위치**: `packages/database/src/index.ts` (18~20행)
- **현상**:
  ```ts
  const db = new Database(dbPath);
  ```
- **문제점**:
  - 기본 저널 모드(Rollback Journal) 상태에서는 하나의 쓰기 트랜잭션이 데이터베이스 전체 파일 락을 쥐게 됩니다.
  - 사용자가 페이지를 이동할 때마다 발생하는 `/api/analytics/pageview` 쓰기, 주기적 뉴스 크롤러 백그라운드 수집, 게임 스코어 저장이 동시에 일어날 때 `database is locked` 예외가 발생하여 사용자 요청이 500 에러로 실패합니다.
- **개선 방안**:
  ```ts
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');       // Write-Ahead Logging 활성화 (동시 읽기/쓰기 가능)
  db.pragma('synchronous = NORMAL');     // 디스크 I/O 최적화 및 안정성 보장
  db.pragma('busy_timeout = 5000');      // 락 경합 시 5초간 대기 후 재시도
  ```

---

### 🟠 [높음] SQL 쿼리 파라미터 변환기의 정규식 파싱 오류 리스크
- **위치**: `apps/api-server/src/db/adapter.ts` (8~11행) 및 `packages/database/src/index.ts` (63행)
- **현상**:
  ```ts
  // adapter.ts: ? 를 $1, $2 로 변환
  const toPgQuery = (q: string) => {
      let idx = 1;
      return q.replace(/\?/g, () => `$${idx++}`);
  };
  // index.ts: 다시 $1, $2 를 ? 로 역변환
  .replace(/\$\d+/g, '?')
  ```
- **문제점**:
  - 모든 쿼리가 실행될 때마다 `?` ➔ `$n` ➔ `?`로 불필요한 이중 정규식 변환을 거침.
  - SQL 문자열 리터럴에 물음표가 포함된 경우(예: `WHERE url LIKE '%?id=%'`), 리터럴 내부의 `?`까지 바인딩 매개변수로 치환되어 쿼리 바인딩 순서가 어긋나고 런타임 SQL 구문 오류를 유발함.
- **개선 방안**: 처음부터 SQLite 표준 바인딩(`?`)을 일관되게 사용하고 불필요한 PG 구문 변환 레이어 제거.

---

### 🟡 [중간] 관리자 인증 시 동기식 파일 I/O (`fs.appendFileSync`) 이벤트 루프 블로킹
- **위치**: `apps/api-server/src/routes/admin.routes.ts` (19, 27, 34, 37, 41, 48행)
- **문제점**: 관리자 API가 호출될 때마다 `fs.appendFileSync('admin_auth_debug.log', ...)`를 4~5회씩 동기적으로 수행하여 Node.js 단일 스레드 이벤트 루프를 정체시킴.
- **개선 방안**: 디버그 로그 파일 동기 쓰기 코드 전면 제거 또는 비동기 로거(Winston, Pino 등) 사용.

---

### 🟡 [중간] 날짜 파라미터 `NaN` 오염 시 SQL 구문 오류 발생
- **위치**: `apps/api-server/src/routes/analytics.routes.ts` (86, 104행)
- **현상**:
  ```ts
  const days = parseInt(c.req.query('period') || '7');
  // days가 숫자가 아닌 문자열이면 NaN -> offsetDays = NaN
  return `DATE(${column}, '+9 hours') >= DATE('now', '+9 hours', '-${offsetDays} days')`;
  ```
- **문제점**: 잘못된 쿼리 스트링(`?period=abc`) 유입 시 SQL에 `'-NaN days'`가 결합되어 비정상 동작 유발.
- **개선 방안**: `const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 7;` 유효성 검증 추가.

---

## 3. 중복되는 코드 점검 (Code Duplication Audit)

### 🔴 [높음] 15개 이상 미니앱의 3초 스플래시 로딩 로직 복사-붙여넣기
- **위치**:
  - `apps/app-calculator/src/App.tsx` (33행)
  - `apps/app-ocr/src/App.tsx` (16~22행)
  - `apps/app-age-calc/src/App.tsx` (135행)
  - `apps/app-text-checker/src/App.tsx` (27행)
  - `apps/app-dday-calc/src/App.tsx` (18행)
  - `apps/app-pyeong-calc/src/App.tsx` (97행)
  - `apps/app-severance-calc/src/App.tsx` (19행)
  - `apps/app-interest-calc/src/App.tsx` (18행)
  - `apps/app-webp-converter/src/App.tsx` (51행)
  - `apps/app-customs-calc/src/App.tsx` (16~20행)
  - `apps/app-vera-pop/src/App.tsx` (40~54행) 등
- **현상**:
  모든 미니앱마다 `setTimeout(() => setIsLoading(false), 3000)` 및 수십 줄의 유사한 로딩 마크업/애니메이션 코드가 그대로 복제되어 있음.
- **개선 방안**:
  `@faithportal/mini-app-sdk` 내의 `MiniAppLayout` 또는 `<MiniAppSplash duration={3000} appTitle="..." />` 공통 컴포넌트로 통합.

---

### 🟠 [높음] 금융 계산기 구현체 중복 (`apps/finance` vs `apps/main-portal`)
- **위치**:
  - `apps/finance/src/components/finance/` (SeveranceCalculator, DividendTaxCalculator 등)
  - `apps/main-portal/src/components/finance/` (SeveranceCalculator, DividendTaxCalculator 등)
- **문제점**: 동일한 세무/금융 계산 로직 및 UI가 독립된 두 앱에 복제되어 있어, 세법이나 공식이 변경될 때 한쪽만 수정되어 데이터 불일치가 발생할 위험.
- **개선 방안**: 금융 계산기 컴포넌트들을 `packages/ui-components` 또는 별도 공유 패키지로 이동하여 단일 소스로 관리.

---

### 🟡 [중간] 미사용 Next.js 포털 방치 (`apps/next-portal`)
- **위치**: `apps/next-portal/`
- **문제점**: 현재 운영 중인 서비스는 `apps/main-portal`(Vite 기반 SPA)인데, 과거 개발 도중 중단된 Next.js 프로젝트가 그대로 남아 디스크 용량, npm 의존성, 빌드 파이프라인 혼선을 야기함.
- **개선 방안**: 필요하지 않다면 아카이빙 후 워크스페이스에서 제거.

---

## 4. 컴포넌트화 및 구조적 점검 (Component Architecture & Modularity)

### 🔴 [높음] 메인 포털 `App.tsx`의 비대화 및 라우트 코드 스플리팅 부재
- **위치**: `apps/main-portal/src/App.tsx`
- **문제점**:
  1. **단일 번들 용량 폭증**: 30개 이상의 모든 페이지가 상단에서 정적 `import`되어 빌드 결과 단일 JS 청크가 **940KB (Gzip 후 282KB)**에 달함.
  2. **모놀리식 HomePage**: `HomePage` 함수 컴포넌트가 `App.tsx` 내부에 400라인 넘게 직접 선언되어 있음.
- **개선 방안**:
  - `HomePage`를 `apps/main-portal/src/pages/HomePage.tsx`로 분리.
  - `React.lazy()` 및 `<Suspense>`를 도입하여 라우트별 온디맨드 코드 스플리팅(Code Splitting) 적용:
    ```tsx
    const UtilityPage = React.lazy(() => import('./pages/UtilityPage'));
    const GamePage = React.lazy(() => import('./pages/GamePage'));
    ```
    ➔ 초기 로딩 번들 크기를 940KB에서 200KB 이하로 75% 이상 감축 가능.

---

### 🟠 [높음] SPA 라우팅 미적용 및 브라우저 전체 새로고침 유발
- **위치**:
  - `packages/ui-components/src/index.tsx` (Header, NewsCard)
  - `apps/main-portal/src/pages/NewsDetailPage.tsx`
- **문제점**:
  - UI 컴포넌트 라이브러리(`@faithportal/ui`)가 `react-router-dom`과 분리되어 개발되다 보니, 내부 링크를 `<a href="...">` 및 `window.location.href`로 처리함.
  - 뉴스 기사를 클릭하거나 헤더 메뉴를 누를 때마다 **브라우저 전체가 새로고침(Full Page Reload)**되어 리액트 상태가 파괴되고 940KB 자바스크립트 번들을 매번 처음부터 다시 다운로드함.
- **개선 방안**:
  - `Header`, `NewsCard` 등 공통 UI 컴포넌트가 `LinkComponent` prop을 주입받거나 커스텀 네비게이션 콜백(`onNavigate`)을 지원하도록 리팩토링.

---

### 🟡 [중간] `packages/ui-components/src/index.tsx` 단일 파일 과부하
- **위치**: `packages/ui-components/src/index.tsx` (609라인, 40KB)
- **문제점**: `Button`, `Card`, `NewsCard`, `Header`, `Footer`, `Pagination` 등이 하나의 파일에 통째로 작성되어 있어 트리 셰이킹(Tree-shaking)이 어렵고 코드 탐색성이 떨어짐.
- **개선 방안**: `components/Button.tsx`, `components/Header.tsx`, `components/NewsCard.tsx` 등 디렉터리 기반으로 모듈 분리.

---

## 5. 트래픽 및 성능 점검 (Traffic & Performance Optimization)

### 🔴 [높음] 무의미한 클라이언트 `/api/health` 폴링 트래픽
- **위치**: `apps/main-portal/src/App.tsx` (84행)
- **현상**:
  ```ts
  axios.get<{ status: string }>(`${API_BASE_URL}/api/health`).then(res => setHealth(res.data))...
  ```
- **문제점**: 모든 방문자가 홈 화면에 접속할 때마다 아무런 UI 표출 목적도 없는 헬스체크 API를 호출하여 서버 네트워크 I/O를 낭비함.
- **개선 방안**: 일반 사용자 홈 화면의 헬스체크 API 호출 코드 즉시 제거 (서버 모니터링은 프로메테우스/UptimeRobot 등 외부 툴 담당).

---

### 🟠 [높음] 외부 Yahoo Finance 실시간 무제한 스크래핑 (서버 IP 차단 위험)
- **위치**: `apps/api-server/src/routes/finance.routes.ts` (6~49행)
- **문제점**:
  - 금융 시세 조회 시 인메모리 캐시 없이 매 요청마다 Yahoo Finance 비공식 엔드포인트를 브라우저 User-Agent로 실시간 스크래핑함.
  - 캐시 부재로 인해 사용자가 몰릴 경우 Yahoo Finance로부터 서버 IP가 영구 밴(Rate limit 429/403)당해 금융 기능 전체가 먹통이 될 수 있음.
- **개선 방안**: 최소 1분~5분 유효기간(TTL)의 인메모리 캐시(Node-cache 또는 Map) 필수 적용.

---

### 🟠 [높음] 뉴스 목록 조회 시 주식 데이터 N+1 호출
- **위치**: `apps/api-server/src/routes/news.routes.ts` (47~60행)
- **문제점**:
  - `GET /api/news?includeStocks=true` 호출 시 뉴스 20건 각각에 대해 `Promise.all`로 `fetchBatchStockData`를 개별 반복 호출함.
  - 1회 뉴스 요청에 최대 20회의 추가 비동기 데이터 조회가 발생하여 응답 속도가 현저히 저하됨.
- **개선 방안**: 뉴스 목록에 포함된 모든 관련 종목 티커를 `Set`으로 모아 단 1회의 일괄(Batch) 쿼리로 처리.

---

### 🟡 [중간] API 응답 `Cache-Control` 헤더 미설정
- **위치**: `apps/api-server/src/routes/miniapp.routes.ts`, `news.routes.ts`
- **문제점**: 생활도구 목록(`/api/mini-apps`) 등 변경 빈도가 매우 낮은 API 응답에도 캐시 헤더가 없어, 사용자가 페이지를 이동할 때마다 SQLite DB를 반복 조회함.
- **개선 방안**: `c.header('Cache-Control', 'public, max-age=60, s-maxage=300')` 등 적절한 HTTP 캐시 헤더 부여.

---

### 🟡 [중간] 로그인 사용자의 메인 홈 접근 차단 이슈
- **위치**: `apps/main-portal/src/App.tsx` (68~72행)
- **현상**:
  ```ts
  useEffect(() => {
      if (!isAuthLoading && user) {
          navigate('/mypage', { replace: true });
      }
  }, [user, isAuthLoading, navigate]);
  ```
- **문제점**: 로그인한 사용자가 서비스 로고를 누르거나 홈(`/`)에 방문하면 무조건 마이페이지(`/mypage`)로 강제 튕겨나가 메인 포털 뉴스와 콘텐츠를 이용할 수 없음.
- **개선 방안**: 해당 강제 리다이렉트 로직 제거 또는 필요 시 옵션 처리.

---

## 6. 우선순위별 개선 로드맵 (Actionable Roadmap)

| 우선순위 | 항목 | 대상 파일 | 예상 효과 |
| :--- | :--- | :--- | :--- |
| **P0 (긴급)** | SQLite WAL 저널 모드 활성화 | `packages/database/src/index.ts` | `database is locked` 500 에러 원천 차단 |
| **P0 (긴급)** | 관리자 인증 Base64 토큰 ➔ 서명 검증 전환 | `apps/api-server/src/routes/admin.routes.ts` | 비인가자의 관리자 권한 탈취 보안 취약점 해결 |
| **P1 (높음)** | 메인 포털 라우트 코드 스플리팅(`React.lazy`) | `apps/main-portal/src/App.tsx` | 초기 번들 크기 75% 절감 (940KB ➔ 200KB), 모바일 체감 로딩 대폭 개선 |
| **P1 (높음)** | 불필요한 `/api/health` 클라이언트 호출 제거 | `apps/main-portal/src/App.tsx` | 홈 접속 트래픽 및 서버 리소스 낭비 방지 |
| **P1 (높음)** | Yahoo Finance API 응답 인메모리 캐싱(TTL 60s) | `apps/api-server/src/routes/finance.routes.ts` | Yahoo IP 차단 방지, 금융 API 응답속도 1초 ➔ 5ms 단축 |
| **P2 (보통)** | SPA 내부 라우팅 전환 (`<a href>` ➔ `<Link>`) | `packages/ui-components`, `main-portal` | 페이지 이동 시 전체 새로고침 방지, 매끄러운 앱 경험 제공 |
| **P2 (보통)** | 미니앱 3초 스플래시 로딩 공통 컴포넌트화 | `packages/mini-app-sdk`, `apps/app-*` | 15개 이상 앱의 중복 코드 제거, 유지보수 단일화 |
| **P3 (권장)** | 비밀번호 해싱 알고리즘 강화 및 점진적 재해싱 | `apps/api-server/src/middleware/auth.ts` | 회원 개인정보 및 계정 보안 수준 향상 |
| **P3 (권장)** | 미사용 `apps/next-portal` 프로젝트 정리 | `apps/next-portal` | 저장공간 확보 및 빌드 파이프라인 간소화 |

---

*본 점검 문서는 향후 코드 리팩토링 및 기능 추가 시 체크리스트로 활용할 수 있습니다.*
