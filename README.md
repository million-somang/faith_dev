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
  - 바로가기 링크 (메일, 카페, 블로그, 쇼핑, 뉴스)
  - 실시간 뉴스 섹션
  - 로그인 상태 표시
  - 관리자 메뉴 표시 (Lv.6 이상)

- **뉴스 페이지** ✨NEW
  - Google RSS 뉴스 통합
  - 카테고리별 필터링 (전체, 일반, 정치, 경제, IT/과학, 스포츠, 엔터테인먼트)
  - 반응형 그리드 레이아웃 (1열~4열)
  - 실시간 뉴스 업데이트
  - HTML 이스케이프 처리로 안전한 컨텐츠 표시
  - 외부 링크로 뉴스 원문 연결

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

##### 통계 대시보드 페이지 (`/admin/stats`) ✨NEW
- **일별/월별 추세 그래프** (Chart.js)
  - 최근 30일 일별 가입자 추세 (Line Chart)
  - 최근 12개월 월별 가입자 추세 (Bar Chart)
  - 최근 30일 일별 로그인 활동 (Line Chart)
  - 등급별 활동 통계 (Bar Chart)
- **실시간 데이터 시각화**

##### 활동 로그 페이지 (`/admin/logs`) ✨NEW
- **필터링 UI**
  - 액션 타입별 필터 (로그인/회원가입/관리자 작업)
  - 표시 개수 선택 (50/100/200개)
- **실시간 로그 스트리밍**
  - 자동 새로고침 토글 (5초 간격)
  - 타입별 색상 배지
  - 사용자 정보 및 IP 주소 표시
  - 시간순 정렬

##### 알림 센터 페이지 (`/admin/notifications`) ✨NEW
- **알림 목록 UI**
  - 전체/읽지않음/읽음 필터 토글
  - 우선순위 배지 표시 (일반/높음)
  - 타입별 색상 구분
- **읽음/읽지 않음 토글**
  - 클릭하여 읽음 처리
  - 읽지 않은 알림 강조 표시
- **실시간 알림 푸시**
  - 자동 새로고침 (5초 간격)
  - 신규 회원 가입, 회원 정지/삭제 시 자동 알림 생성

##### 배치 작업 UI (`/admin/users` 페이지 통합) ✨NEW
- **체크박스로 회원 선택**
  - 개별 회원 선택
  - 전체 선택/해제 기능
  - 선택된 회원 수 표시
- **일괄 처리 드롭다운**
  - 등급 변경 (선택한 회원들의 등급을 일괄 변경)
  - 상태 변경 (active/suspended/deleted로 일괄 변경)
  - 일괄 삭제 (여러 회원 한 번에 삭제)
- **CSV 내보내기 버튼**
  - 전체 회원 데이터 CSV 다운로드
  - ID, 이메일, 이름, 휴대전화, 등급, 상태, 가입일, 최근로그인 포함
  - 파일명: `users_YYYY-MM-DD.csv`

##### 뉴스 관리 페이지 (`/admin/news`) ✨NEW
- **뉴스 통계 카드**
  - 전체 뉴스 수
  - 카테고리별 뉴스 수 (정치, 경제, 기술)
- **자동 뉴스 가져오기 스케줄 설정** ✨NEW
  - 활성화/비활성화 토글
  - 스케줄 타입 선택:
    - **시간 간격**: 1/2/3/6/12/24시간마다 자동 수집
    - **매일 지정 시간**: 특정 시간에 자동 수집 (한국 시간 기준)
  - 실행 정보 표시 (마지막 실행, 다음 실행 예정)
  - 설정 저장 및 자동 실행
- **뉴스 목록 관리**
  - 카테고리별 필터링
  - 뉴스 상세 정보 표시 (ID, 카테고리, 제목, 발행사, 발행일)
  - 개별 뉴스 삭제
  - 외부 링크로 원문 보기
- **수동 뉴스 가져오기**
  - 전체 카테고리 뉴스 한번에 가져오기

## 현재 기능 URI

### 웹 페이지
- **메인 페이지**: `GET /`
- **로그인 페이지**: `GET /login`
- **회원가입 페이지**: `GET /signup`
- **뉴스 페이지**: `GET /news` ✨NEW
- **관리자 대시보드**: `GET /admin` (Lv.6 이상)
- **회원 관리**: `GET /admin/users` (Lv.6 이상)
- **뉴스 관리**: `GET /admin/news` (Lv.6 이상) ✨NEW
- **통계 대시보드**: `GET /admin/stats` (Lv.6 이상) ✨NEW
- **활동 로그**: `GET /admin/logs` (Lv.6 이상) ✨NEW
- **알림 센터**: `GET /admin/notifications` (Lv.6 이상) ✨NEW

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

#### 뉴스 API ✨NEW
- **뉴스 목록 조회**: `GET /api/news?category=&limit=20`
  - Query: `category` (all/general/politics/economy/tech/sports/entertainment), `limit` (기본 20)
  - Response: `{ success, news, count }`
- **뉴스 가져오기**: `GET /api/news/fetch?category=general`
  - Query: `category` (RSS에서 뉴스 가져와 DB에 저장)
  - Response: `{ success, fetched, saved, message }`
- **뉴스 삭제**: `DELETE /api/news/:id` (관리자 전용)
- **스케줄 설정 조회**: `GET /api/news/schedule`
  - Response: `{ success, schedule }`
- **스케줄 설정 업데이트**: `POST /api/news/schedule`
  - Body: `{ enabled, schedule_type, schedule_time, interval_hours }`
  - Response: `{ success, message, next_run }`
- **스케줄 실행 기록 업데이트**: `POST /api/news/schedule/update-run`
  - 자동 실행 시 호출되어 last_run 및 next_run 업데이트

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

### News 테이블 ✨NEW
```sql
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,           -- 'general', 'politics', 'economy', 'tech', 'sports', 'entertainment'
  title TEXT NOT NULL,
  summary TEXT,
  link TEXT NOT NULL UNIQUE,        -- 뉴스 원문 링크 (중복 방지)
  image_url TEXT,
  publisher TEXT,
  pub_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### News Schedule 테이블 ✨NEW
```sql
CREATE TABLE news_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enabled INTEGER DEFAULT 1,        -- 1: 활성화, 0: 비활성화
  schedule_type TEXT DEFAULT 'hourly', -- 'hourly', 'daily', 'custom'
  schedule_time TEXT,               -- HH:mm 형식 (daily용, 한국 시간 기준)
  interval_hours INTEGER DEFAULT 1, -- hourly용 간격 (시간 단위)
  last_run DATETIME,                -- 마지막 실행 시간
  next_run DATETIME,                -- 다음 실행 예정 시간 (UTC로 저장)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 스토리지 서비스
- **Cloudflare D1**: SQLite 기반 회원 정보, 활동 로그, 알림, 뉴스, 스케줄 설정 저장
- **로컬 개발**: `.wrangler/state/v3/d1` (자동 생성)
- **외부 API**: Google News RSS (뉴스 데이터 소스)

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
3. 회원 클릭하여 상세보기:
   - 기본 정보 (ID, 이메일, 이름, 휴대전화)
   - 등급 변경 (드롭다운)
   - 계정 상태 및 가입일/최근로그인
   - **변경사항 저장**: 이름, 휴대전화, 등급 변경
   - **정지/해제 버튼**: 계정 정지 또는 해제
   - **삭제 버튼**: 계정 삭제 (소프트 삭제)

#### 4. 배치 작업 (회원 관리 페이지) ✨NEW
1. 회원 목록에서 체크박스로 여러 회원 선택
2. "전체 선택" 체크박스로 모든 회원 선택/해제
3. 일괄 작업 드롭다운 선택:
   - **등급 변경**: 선택한 회원들의 등급 일괄 변경
   - **상태 변경**: active/suspended/deleted로 일괄 변경
   - **삭제**: 선택한 회원들 일괄 삭제
4. CSV 내보내기 버튼 클릭하여 전체 회원 데이터 다운로드

#### 5. 통계 대시보드 ✨NEW
1. 네비게이션에서 "통계" 클릭
2. 4개 차트 확인:
   - **일별 가입자 추세**: 최근 30일 Line Chart
   - **월별 가입자 추세**: 최근 12개월 Bar Chart
   - **일별 로그인 활동**: 최근 30일 Line Chart
   - **등급별 활동 통계**: 최근 30일 Bar Chart

#### 6. 활동 로그 ✨NEW
1. 네비게이션에서 "활동 로그" 클릭
2. 필터 설정:
   - **타입 필터**: 전체/로그인/회원가입/관리자 작업
   - **표시 개수**: 50/100/200개
3. 자동 새로고침 토글 (5초 간격)
4. 로그 테이블에서 사용자 활동 추적

#### 7. 알림 센터 ✨NEW
1. 네비게이션에서 "알림 센터" 클릭
2. 필터 버튼:
   - **전체**: 모든 알림
   - **읽지않음**: 읽지 않은 알림만
   - **읽음**: 읽은 알림만
3. 알림 클릭하여 읽음 처리
4. 자동 새로고침 (5초 간격)으로 실시간 알림 확인

#### 8. 뉴스 관리 ✨NEW
1. 네비게이션에서 "컨텐츠관리 > 뉴스관리" 클릭
2. 자동 뉴스 가져오기 설정:
   - **활성화 토글**: 자동 실행 켜기/끄기
   - **스케줄 타입 선택**:
     - 시간 간격: 1/2/3/6/12/24시간마다
     - 매일 지정 시간: 매일 특정 시간 (예: 오전 9시)
   - **설정 저장**: 다음 실행 시간 자동 계산
3. 실행 정보 확인:
   - 마지막 실행 시간
   - 다음 실행 예정 시간 (한국 시간으로 표시)
4. 수동 뉴스 가져오기:
   - "전체 카테고리 뉴스 가져오기" 버튼 클릭
   - 6개 카테고리 뉴스 일괄 수집
5. 뉴스 목록 관리:
   - 카테고리별 필터링
   - 개별 뉴스 삭제
   - 원문 링크로 확인

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
│   ├── index.tsx          # 메인 애플리케이션 (약 2900줄)
│   │                      # - 사용자 페이지 (메인, 로그인, 회원가입)
│   │                      # - 관리자 페이지 (대시보드, 회원관리, 통계, 로그, 알림)
│   │                      # - 모든 API 엔드포인트
│   │                      # - 배치 작업 UI 및 CSV 내보내기
│   └── renderer.tsx       # JSX 렌더러
├── migrations/            # D1 데이터베이스 마이그레이션
│   ├── 0001_create_users_table.sql
│   ├── 0002_add_user_level_and_status.sql
│   ├── 0003_add_activity_logs_and_notifications.sql
│   ├── 0001_create_news_table.sql
│   └── 0002_create_news_schedule_table.sql
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
- **2025-11-01**: 4대 관리자 페이지 완성 ✨
  - 통계 대시보드 (4개 Chart.js 그래프)
  - 활동 로그 페이지 (필터링, 실시간 스트리밍)
  - 알림 센터 (읽음/읽지않음 토글, 실시간 푸시)
  - 배치 작업 UI (회원 선택, 일괄 처리, CSV 내보내기)
- **2025-11-05**: 뉴스 서비스 구현 ✨NEW
  - Google RSS 뉴스 통합 (6개 카테고리)
  - 뉴스 페이지 (카테고리별 필터링, 반응형 디자인)
  - 관리자 뉴스 관리 페이지
  - 자동 뉴스 가져오기 스케줄 시스템
    - 시간 간격 모드 (1~24시간)
    - 매일 지정 시간 모드 (한국 시간 기준)
    - 시간대 자동 변환 (KST ↔ UTC)
    - 클라이언트 측 자동 실행 (1분마다 체크)

## 라이선스
MIT License

## 문의 및 지원
- GitHub Issues를 통해 버그 리포트 및 기능 제안
- Pull Request 환영합니다!
