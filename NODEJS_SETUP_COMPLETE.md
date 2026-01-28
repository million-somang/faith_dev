# ✅ Node.js 서버 배포 준비 완료

## 📦 설치된 패키지

```json
{
  "dependencies": {
    "@hono/node-server": "^1.x.x"  // Node.js 서버 실행
  },
  "devDependencies": {
    "tsx": "^4.x.x"  // TypeScript 직접 실행
  }
}
```

---

## 📂 생성된 파일

### 1. `src/server.ts` (Node.js 진입점)

```typescript
import { serve } from '@hono/node-server'
import app from './index'

// Node.js 서버로 실행
serve({
  fetch: app.fetch,
  port: 3000
})

console.log('✅ Faith Portal Server is running on http://localhost:3000')
```

### 2. `NODEJS_DEPLOYMENT.md` (배포 가이드)

- SSH 배포 방법
- PM2 데몬 실행
- systemd 서비스 설정
- Nginx 리버스 프록시
- 환경 변수 관리
- 트러블슈팅

---

## 🚀 실행 명령어

### 로컬 테스트

```bash
npm run start
```

### 프로덕션 실행

```bash
npm run start:prod
```

### PM2로 백그라운드 실행 (권장)

```bash
pm2 start npm --name "faith-portal" -- run start:prod
pm2 save
```

---

## ⚙️ 호스팅 서버 배포 단계

### 1. SSH 접속

```bash
ssh user@your-server.com
```

### 2. 코드 다운로드

```bash
git clone https://github.com/million-somang/faith_dev.git
cd faith_dev
```

### 3. 패키지 설치

```bash
npm install --legacy-peer-deps
```

### 4. 서버 실행

```bash
# 직접 실행 (테스트)
npm run start

# 또는 PM2로 실행 (권장)
pm2 start npm --name "faith-portal" -- run start:prod
```

---

## ⚠️ 중요 사항

### 1. 데이터베이스 문제

현재 코드는 **Cloudflare D1**을 사용하는데, Node.js 환경에서는 작동하지 않습니다.

**해결 방법:**

#### A. 실제 데이터베이스 연결 (권장)

```bash
npm install pg  # PostgreSQL
# 또는
npm install mysql2  # MySQL
```

#### B. SQLite로 전환 (간단)

```bash
npm install better-sqlite3
```

`src/index.tsx`에서 DB 바인딩 수정 필요:

```typescript
// Cloudflare D1 (현재)
const db = c.env.DB

// Node.js SQLite (변경 후)
import Database from 'better-sqlite3'
const db = new Database('faith-portal.db')
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/faithportal
```

### 3. 방화벽 설정

```bash
# 포트 3000 열기
sudo ufw allow 3000/tcp
```

---

## 🔗 GitHub 저장소

- **URL**: https://github.com/million-somang/faith_dev
- **커밋**: `c9a767a - Add Node.js server support for hosting deployment`

---

## 📊 테스트 결과

### ✅ 성공

```bash
$ npm run start
✅ Faith Portal Server is running on http://localhost:3000
```

HTML 페이지가 정상적으로 응답합니다!

### ❌ DB 오류 (예상된 문제)

```
TypeError: Cannot read properties of undefined (reading 'prepare')
```

**원인**: Cloudflare D1은 Node.js에서 사용 불가  
**해결**: 위의 "데이터베이스 문제" 섹션 참조

---

## 📖 다음 단계

1. **데이터베이스 선택 및 연결**
   - PostgreSQL (권장)
   - MySQL
   - SQLite (개발용)

2. **DB 마이그레이션**
   - 스키마 변환
   - 데이터 이전

3. **프로덕션 설정**
   - 환경 변수
   - 로그 설정
   - 모니터링

4. **배포 자동화**
   - GitHub Actions
   - PM2 ecosystem
   - 무중단 배포

---

## 💡 추가 도움말

상세한 가이드는 **`NODEJS_DEPLOYMENT.md`** 파일을 참고하세요!

```bash
cat NODEJS_DEPLOYMENT.md
```

---

**준비 완료!** 🎉  
이제 호스팅 서버에서 `npm install` → `npm run start`만 하면 됩니다!
