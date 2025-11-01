# Faith Portal - 믿음의 포탈 사이트

## 프로젝트 개요
- **프로젝트명**: Faith Portal (믿음의 포탈)
- **목표**: 풀스택 포탈 사이트 구현 (검색, 회원관리, 관리자 시스템)
- **브랜드 컬러**: 파란색 (#1E40AF)
- **기술 스택**: Hono + TypeScript + Cloudflare D1 + TailwindCSS + Chart.js

## 주요 기능

### ✅ 완료된 기능

#### 1. 사용자 기능
- **메인 페이지**
  - Faith Portal 브랜드 검색 UI
  - 파란색 컬러 테마
  - 바로가기 링크 (메일, 카페, 블로그, 쇼핑)
  - 실시간 뉴스 섹션
  - 로그인 상태 표시
  - 관리자 메뉴 표시 (Lv.6 이상)

- **회원가입 기능**
  - 이메일 중복 체크
  - 필수 정보: 이메일, 비밀번호, 이름
  - 선택 정보: 휴대전화
  - 비밀번호 확인 검증
  - D1 데이터베이스 저장
  - 자동 활동 로그 기록
  - 신규 가입 알림 생성

- **로그인 기능**
  - 이메일/비밀번호 인증
  - 토큰 기반 인증 (localStorage)
  - 계정 상태 체크 (활성/정지/삭제)
  - 마지막 로그인 시간 기록
  - 로그인 활동 로그 기록
  - 관리자 자동 리다이렉트
  - 로그아웃 기능

#### 2. 관리자 기능 (Lv.6 이상)

##### 회원 등급 시스템 (10단계)
- **Lv.1**: 일반 회원 (기본)
- **Lv.2**: 정회원
- **Lv.3**: 우수회원
- **Lv.4**: VIP 회원
- **Lv.5**: VVIP 회원
- **Lv.6**: 실버 관리자 (관리자 권한 시작)
- **Lv.7**: 골드 관리자
- **Lv.8**: 플래티넘 관리자 (일괄 처리 권한)
- **Lv.9**: 마스터 관리자
- **Lv.10**: 슈퍼바이저 (최고 관리자)

##### 관리자 대시보드 (`/admin`)
- **통계 카드**
  - 전체 회원 수
  - 활성 회원 수
  - 정지 회원 수
  - 오늘 가입한 회원 수
  
- **등급별 회원 분포 차트** (Chart.js 사용)
- **최근 가입 회원 10명 리스트**

##### 회원 관리 페이지 (`/admin/users`)
- **검색 및 필터**
  - 이메일/이름으로 검색
  - 등급별 필터 (1~10등급)
  - 상태별 필터 (활성/정지/삭제)
  
- **회원 목록 표시**
  - ID, 이메일, 이름, 휴대전화
  - 등급 배지 표시
  - 상태 배지 표시
  - 가입일
  
- **회원 관리 기능**
  - ✏️ 수정: 이름, 휴대전화, 등급 변경
  - 🚫 정지/해제: 계정 정지 및 해제
  - 🗑️ 삭제: 소프트 삭제 (실제 데이터는 유지)
  - 모든 작업은 활동 로그 및 알림 자동 생성

##### 고급 관리자 기능 (API로 구현됨)
- **통계 고도화**
  - 최근 30일 일별 가입자 추세
  - 최근 12개월 월별 가입자 추세
  - 최근 30일 일별 로그인 활동
  - 등급별 활동 통계

- **활동 로그 시스템**
  - 회원가입, 로그인, 관리자 작업 자동 기록
  - 로그 타입별 필터링
  - 최근 활동 조회

- **알림 시스템**
  - 신규 회원 가입 알림
  - 회원 정지/삭제 알림 (우선순위: 높음)
  - 읽음/읽지 않음 상태 관리
  - 관리자별 타겟 알림 지원

- **배치 작업 (Lv.8 이상)**
  - 여러 회원 일괄 등급 변경
  - 여러 회원 일괄 상태 변경
  - 여러 회원 일괄 삭제
  - 일괄 작업 로그 기록

- **CSV 내보내기 (Lv.6 이상)**
  - 전체 회원 데이터 CSV 다운로드
  - ID, 이메일, 이름, 휴대전화, 등급, 상태, 가입일, 최근로그인 포함

## 현재 기능 URI

### 웹 페이지
- **메인 페이지**: `GET /`
- **로그인 페이지**: `GET /login`
- **회원가입 페이지**: `GET /signup`
- **관리자 대시보드**: `GET /admin` (Lv.6 이상)
- **회원 관리**: `GET /admin/users` (Lv.6 이상)

### 사용자 API
- **회원가입**: `POST /api/signup`
  - Body: `{ email, password, name, phone? }`
  - Response: `{ success, message, userId }`
  
- **로그인**: `POST /api/login`
  - Body: `{ email, password }`
  - Response: `{ success, token, user }`
  
- **사용자 정보 조회**: `GET /api/user`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ success, user }`

### 관리자 API (Lv.6 이상)

#### 통계 API
- **기본 통계**: `GET /api/admin/stats`
  - Response: 전체/활성/정지 회원 수, 오늘 가입자, 등급별 분포, 최근 가입 회원
  
- **고급 통계**: `GET /api/admin/stats/trends`
  - Response: 일별/월별 가입 추세, 로그인 활동, 등급별 활동

#### 회원 관리 API
- **회원 목록**: `GET /api/admin/users?search=&level=&status=`
- **회원 상세**: `GET /api/admin/users/:id`
- **회원 수정**: `PUT /api/admin/users/:id`
- **회원 상태 변경**: `PATCH /api/admin/users/:id/status`
- **회원 삭제**: `DELETE /api/admin/users/:id`

#### 고급 기능 API
- **활동 로그**: `GET /api/admin/activity-logs?limit=50&action=`
- **알림 목록**: `GET /api/admin/notifications`
- **알림 읽음 처리**: `PATCH /api/admin/notifications/:id/read`
- **일괄 처리** (Lv.8 이상): `POST /api/admin/users/batch`
  - Body: `{ action: 'change_level'|'change_status'|'delete', userIds: [], value? }`
- **CSV 내보내기**: `GET /api/admin/users/export`

## 배포 URL
- **로컬 개발**: https://3000-ipz6c4a8pwyoci65e6lba-cc2fbc16.sandbox.novita.ai
- **프로덕션**: (배포 후 업데이트 예정)

## 데이터 모델

### Users 테이블
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  level INTEGER,                    -- 회원 등급 (1~10)
  status TEXT,                      -- 상태 (active/suspended/deleted)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  updated_at DATETIME
);
```

### Activity Logs 테이블
```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,             -- 'login', 'signup', 'admin_action' 등
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Notifications 테이블
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,               -- 'new_signup', 'user_suspended' 등
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_user_id INTEGER,           -- NULL이면 전체 관리자
  is_read INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'normal',   -- 'normal', 'high'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);
```

## 스토리지 서비스
- **Cloudflare D1**: SQLite 기반 회원 정보, 활동 로그, 알림 저장
- **로컬 개발**: `.wrangler/state/v3/d1` (자동 생성)

## 테스트 계정
- **슈퍼바이저 계정**
  - 이메일: test@example.com
  - 비밀번호: test1234
  - 등급: Lv.10 (슈퍼바이저)
  - 권한: 모든 관리자 기능 사용 가능

## 사용 가이드

### 사용자 기능

#### 1. 회원가입
1. 메인 페이지에서 "회원가입" 버튼 클릭
2. 이메일, 비밀번호, 이름 입력
3. 회원가입 완료 후 자동으로 로그인 페이지로 이동
4. 가입 시 자동으로 Lv.1 (일반 회원)으로 설정

#### 2. 로그인
1. 메인 페이지에서 "로그인" 버튼 클릭
2. 이메일과 비밀번호 입력
3. 로그인 성공 시:
   - 일반 회원 (Lv.1~5): 메인 페이지로 이동
   - 관리자 (Lv.6~10): 관리자 대시보드로 자동 이동
4. 상단에 사용자 이메일 및 관리자 버튼 표시

### 관리자 기능

#### 1. 관리자 대시보드 접근
1. 슈퍼바이저 계정으로 로그인 (test@example.com / test1234)
2. 자동으로 `/admin` 대시보드로 이동
3. 또는 메인 페이지에서 "관리자" 버튼 클릭

#### 2. 대시보드 사용
- 통계 카드에서 전체/활성/정지 회원 수 확인
- 등급별 회원 분포 차트 확인
- 최근 가입 회원 10명 확인

#### 3. 회원 관리
1. 네비게이션에서 "회원 관리" 클릭
2. 검색 필터 사용:
   - 이메일/이름 검색
   - 등급별 필터 (1~10)
   - 상태별 필터 (활성/정지/삭제)
3. 회원 작업:
   - **수정 아이콘**: 회원 정보 및 등급 변경
   - **정지 아이콘**: 계정 정지 또는 해제
   - **삭제 아이콘**: 계정 삭제 (소프트 삭제)

#### 4. CSV 내보내기
1. 회원 관리 페이지에서 (현재는 API로만 가능)
2. API 호출: `GET /api/admin/users/export`
3. `users_YYYY-MM-DD.csv` 파일 다운로드

#### 5. 일괄 처리 (Lv.8 이상)
- API를 통해 여러 회원을 한 번에 처리
- 등급 변경, 상태 변경, 일괄 삭제 가능

## 권한 체계

### 등급별 권한
- **Lv.1~5 (일반 회원)**: 포탈 사용 권한만
- **Lv.6 (실버 관리자)**: 기본 관리자 기능, 통계 조회, 회원 조회/수정/정지/삭제, CSV 내보내기
- **Lv.7 (골드 관리자)**: Lv.6 권한 + 추가 관리 기능
- **Lv.8 (플래티넘 관리자)**: Lv.7 권한 + 일괄 처리 권한
- **Lv.9 (마스터 관리자)**: Lv.8 권한 + 고급 설정
- **Lv.10 (슈퍼바이저)**: 모든 권한 + 다른 관리자 관리

### 상태별 제한
- **active**: 정상 사용 가능
- **suspended**: 로그인 차단 (관리자가 정지)
- **deleted**: 완전 차단 (소프트 삭제)

## 로컬 개발 환경

### 필수 요구사항
- Node.js 18+
- npm 또는 pnpm

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션 (3개 파일)
npm run db:migrate:local

# 테스트 데이터 삽입
npm run db:seed

# 빌드
npm run build

# 개발 서버 실행 (PM2)
pm2 start ecosystem.config.cjs

# 서버 상태 확인
pm2 status

# 로그 확인
pm2 logs --nostream
```

### 데이터베이스 관리
```bash
# 로컬 DB 초기화
npm run db:reset

# 로컬 DB 콘솔
npm run db:console:local

# 프로덕션 마이그레이션
npm run db:migrate:prod
```

## 배포

### Cloudflare Pages 배포
```bash
# 프로덕션 빌드 및 배포
npm run deploy:prod

# 또는 수동 배포
npm run build
npx wrangler pages deploy dist --project-name webapp
```

### 환경 변수 설정
```bash
# Cloudflare API 토큰 설정 필요
# Deploy 탭에서 API 키 설정 후 배포 가능
```

## 프로젝트 구조
```
webapp/
├── src/
│   ├── index.tsx          # 메인 애플리케이션 (약 1900줄)
│   │                      # - 사용자 페이지 (메인, 로그인, 회원가입)
│   │                      # - 관리자 페이지 (대시보드, 회원관리)
│   │                      # - 모든 API 엔드포인트
│   └── renderer.tsx       # JSX 렌더러
├── migrations/            # D1 데이터베이스 마이그레이션
│   ├── 0001_create_users_table.sql
│   ├── 0002_add_user_level_and_status.sql
│   └── 0003_add_activity_logs_and_notifications.sql
├── public/
│   └── static/
│       └── style.css      # 커스텀 CSS
├── dist/                  # 빌드 출력 (자동 생성)
├── .wrangler/             # Wrangler 로컬 상태 (자동 생성)
│   └── state/v3/d1/       # 로컬 SQLite 데이터베이스
├── ecosystem.config.cjs   # PM2 설정
├── wrangler.jsonc         # Cloudflare 설정
├── package.json           # 프로젝트 의존성
└── seed.sql               # 테스트 데이터
```

## 디자인 시스템

### 브랜드 컬러
- **Primary Blue**: #1E40AF (faith-blue)
- **Dark Blue**: #1E3A8A (hover state)
- **Admin Badge**: #EAB308 (노란색 왕관)
- **Status Colors**:
  - Green: 활성 (active)
  - Orange: 정지 (suspended)
  - Red: 삭제 (deleted)

### 컴포넌트
- **배지 (Badges)**: 등급, 상태 표시
- **모달 (Modals)**: 회원 수정
- **차트 (Charts)**: Chart.js 막대 그래프
- **테이블 (Tables)**: 회원 목록, 활동 로그

## 기술 스택 상세

### 백엔드
- **Hono**: 경량 웹 프레임워크 (Express와 유사)
- **Cloudflare Workers**: 엣지 런타임
- **Cloudflare D1**: SQLite 기반 데이터베이스

### 프론트엔드
- **TailwindCSS**: 유틸리티 CSS 프레임워크
- **Font Awesome**: 아이콘
- **Axios**: HTTP 클라이언트
- **Chart.js**: 데이터 시각화

### 개발 도구
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **Wrangler**: Cloudflare 개발 CLI
- **PM2**: 프로세스 관리

## 보안 고려사항

### 현재 구현된 보안
- ✅ 이메일 중복 체크
- ✅ 계정 상태 체크 (정지/삭제 계정 로그인 차단)
- ✅ 관리자 권한 체크 (모든 관리자 API에 적용)
- ✅ 등급별 권한 분리
- ✅ 활동 로그 기록 (감사 추적)
- ✅ 소프트 삭제 (데이터 복구 가능)

### 추가 필요 보안
- ⚠️ 비밀번호 해싱 (bcrypt)
- ⚠️ JWT 토큰 인증
- ⚠️ CSRF 보호
- ⚠️ Rate Limiting
- ⚠️ XSS 방어

## 성능 최적화

### 현재 최적화
- ✅ 인덱스 (이메일, 등급, 상태, 생성일, 활동 로그)
- ✅ 쿼리 최적화 (필요한 컬럼만 조회)
- ✅ 제한된 결과 수 (페이지네이션 준비)

### 추가 최적화 가능
- 페이지네이션 구현
- 캐싱 (KV Storage 활용)
- CDN 활용

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 로컬 개발 완료 / ⏳ 프로덕션 배포 대기
- **브랜드**: Faith Portal (파란색 테마)
- **마지막 업데이트**: 2025-11-01

## 주요 업데이트 이력
- **2025-10-28**: 초기 프로젝트 생성, 기본 사용자 기능
- **2025-10-28**: 브랜딩 변경 (NAVER → Faith Portal, 초록색 → 파란색)
- **2025-10-28**: 관리자 시스템 구현 (10단계 등급, 대시보드, 회원관리)
- **2025-11-01**: 고급 관리자 기능 (통계 고도화, 권한 세분화, 알림 시스템, 배치 작업, CSV 내보내기)

## 라이선스
MIT License

## 문의 및 지원
- GitHub Issues를 통해 버그 리포트 및 기능 제안
- Pull Request 환영합니다!
