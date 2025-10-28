# NAVER 포탈 사이트

## 프로젝트 개요
- **프로젝트명**: NAVER 스타일 포탈 사이트
- **목표**: 네이버와 같은 포탈 사이트 구현 (검색, 회원가입, 로그인 기능)
- **기술 스택**: Hono + TypeScript + Cloudflare D1 + TailwindCSS

## 주요 기능

### ✅ 완료된 기능
1. **메인 페이지**
   - 네이버 스타일 검색 UI
   - 네이버 그린 컬러 테마
   - 바로가기 링크 (메일, 카페, 블로그, 쇼핑)
   - 실시간 뉴스 섹션
   - 로그인 상태 표시

2. **회원가입 기능**
   - 이메일 중복 체크
   - 필수 정보: 이메일, 비밀번호, 이름
   - 선택 정보: 휴대전화
   - 비밀번호 확인 검증
   - D1 데이터베이스 저장

3. **로그인 기능**
   - 이메일/비밀번호 인증
   - 토큰 기반 인증 (localStorage)
   - 마지막 로그인 시간 기록
   - 로그아웃 기능

## 현재 기능 URI

### 웹 페이지
- **메인 페이지**: `GET /`
- **로그인 페이지**: `GET /login`
- **회원가입 페이지**: `GET /signup`

### API 엔드포인트
- **회원가입**: `POST /api/signup`
  - Body: `{ email, password, name, phone? }`
  - Response: `{ success, message, userId }`

- **로그인**: `POST /api/login`
  - Body: `{ email, password }`
  - Response: `{ success, token, user }`

- **사용자 정보 조회**: `GET /api/user`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ success, user }`

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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

## 스토리지 서비스
- **Cloudflare D1**: SQLite 기반 회원 정보 저장
- **로컬 개발**: `.wrangler/state/v3/d1` (자동 생성)

## 테스트 계정
- **이메일**: test@example.com
- **비밀번호**: test1234

## 사용 가이드

### 1. 회원가입
1. 메인 페이지에서 "회원가입" 버튼 클릭
2. 이메일, 비밀번호, 이름 입력
3. 회원가입 완료 후 자동으로 로그인 페이지로 이동

### 2. 로그인
1. 메인 페이지에서 "로그인" 버튼 클릭
2. 이메일과 비밀번호 입력
3. 로그인 성공 시 메인 페이지로 이동
4. 상단에 사용자 이메일 표시

### 3. 검색
1. 메인 페이지의 검색창에 검색어 입력
2. "검색" 버튼 클릭 또는 Enter 키
3. (현재는 알림창으로 검색어 표시, 향후 실제 검색 구현 예정)

### 4. 로그아웃
1. 로그인 상태에서 상단의 "로그아웃" 버튼 클릭
2. 로그인 정보 삭제 및 페이지 새로고침

## 아직 구현되지 않은 기능

### 📋 계획된 기능
1. **검색 기능**
   - 실제 검색 엔진 연동 (예: Google Custom Search API)
   - 검색 결과 페이지
   - 자동완성 기능

2. **보안 강화**
   - 비밀번호 해싱 (bcrypt)
   - JWT 토큰 인증
   - CSRF 보호
   - Rate Limiting

3. **프로필 관리**
   - 사용자 프로필 페이지
   - 정보 수정 기능
   - 비밀번호 변경
   - 회원 탈퇴

4. **추가 서비스**
   - 네이버 메일 기능
   - 카페/블로그 기능
   - 뉴스 API 연동
   - 쇼핑 기능

5. **소셜 기능**
   - 댓글 시스템
   - 좋아요/북마크
   - 공유 기능

## 권장 다음 단계

### 단기 목표 (1-2주)
1. **보안 강화**: 비밀번호 해싱 구현
2. **검색 기능**: Google Custom Search API 연동
3. **프로필 페이지**: 사용자 정보 수정 기능

### 중기 목표 (1개월)
1. **뉴스 API**: 실시간 뉴스 데이터 연동
2. **게시판**: 간단한 커뮤니티 기능
3. **모바일 최적화**: 반응형 디자인 개선

### 장기 목표 (3개월)
1. **풀스택 포탈**: 메일, 카페, 블로그 서비스
2. **관리자 페이지**: 사용자 관리, 통계
3. **성능 최적화**: 캐싱, CDN 활용

## 로컬 개발 환경

### 필수 요구사항
- Node.js 18+
- npm 또는 pnpm

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
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
│   ├── index.tsx          # 메인 애플리케이션
│   └── renderer.tsx       # JSX 렌더러
├── migrations/            # D1 데이터베이스 마이그레이션
│   └── 0001_create_users_table.sql
├── public/
│   └── static/
│       └── style.css      # 커스텀 CSS
├── dist/                  # 빌드 출력 (자동 생성)
├── .wrangler/            # Wrangler 로컬 상태 (자동 생성)
├── ecosystem.config.cjs   # PM2 설정
├── wrangler.jsonc        # Cloudflare 설정
├── package.json          # 프로젝트 의존성
└── seed.sql              # 테스트 데이터
```

## 기술 스택 상세

### 백엔드
- **Hono**: 경량 웹 프레임워크 (Express와 유사)
- **Cloudflare Workers**: 엣지 런타임
- **Cloudflare D1**: SQLite 기반 데이터베이스

### 프론트엔드
- **TailwindCSS**: 유틸리티 CSS 프레임워크
- **Font Awesome**: 아이콘
- **Axios**: HTTP 클라이언트

### 개발 도구
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **Wrangler**: Cloudflare 개발 CLI
- **PM2**: 프로세스 관리

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 로컬 개발 완료 / ⏳ 프로덕션 배포 대기
- **마지막 업데이트**: 2025-10-28

## 라이선스
MIT License

## 문의 및 지원
- GitHub Issues를 통해 버그 리포트 및 기능 제안
- Pull Request 환영합니다!
