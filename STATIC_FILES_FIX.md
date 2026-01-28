# ✅ 이미지 경로 문제 해결 완료

## 🐛 문제 증상

웹페이지에서 로고 이미지가 깨져서 표시됨:
- 이미지 위치에 "Faith Portal" alt 텍스트만 보임
- 이미지 파일은 `public/logo_fl.png`에 존재
- HTML에서는 `/logo_fl.png`로 정확하게 참조

## 🔍 원인 분석

**Node.js 서버에서 정적 파일 서빙 설정이 없었음!**

- Cloudflare Pages: 자동으로 `public/` 폴더를 서빙 ✅
- Node.js 서버: `serveStatic` 미들웨어 필요 ❌ (설정 안 됨)

## 🛠️ 해결 방법

### 1. `src/index.tsx`에 정적 파일 미들웨어 추가

```typescript
import { serveStatic } from '@hono/node-server/serve-static'

// 정적 파일 서빙 (Node.js 환경용)
// Cloudflare Pages에서는 자동으로 처리되므로 조건부로 적용
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Node.js 환경에서만 정적 파일 서빙
  app.use('/*', serveStatic({ root: './public' }))
}
```

### 2. PM2 설정 파일 생성 (`ecosystem.nodejs.config.cjs`)

```javascript
module.exports = {
  apps: [
    {
      name: 'faith-portal',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
}
```

---

## ✅ 테스트 결과

### 이미지 접근 성공!

```bash
$ curl -I http://localhost:3000/logo_fl.png

HTTP/1.1 200 OK
content-length: 72956
content-type: image/png
Date: Wed, 28 Jan 2026 04:43:29 GMT
Connection: keep-alive
```

### PM2 상태

```bash
$ pm2 status

┌────┬─────────────────┬─────────┬─────────┬──────────┬────────┬──────┬──────────┐
│ id │ name            │ mode    │ pid     │ uptime   │ ↺      │ status │ cpu      │
├────┼─────────────────┼─────────┼─────────┼──────────┼────────┼────────┼──────────┤
│ 0  │ faith-portal    │ fork    │ 87863   │ 3s       │ 0      │ online │ 0%       │
└────┴─────────────────┴─────────┴─────────┴──────────┴────────┴────────┴──────────┘
```

### 웹 페이지 접근

**테스트 URL:** https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai

✅ 로고 이미지 정상 표시!

---

## 📂 수정된 파일

### 1. `src/index.tsx`
- `serveStatic` import 추가
- Node.js 환경 감지 후 조건부 정적 파일 서빙

### 2. `ecosystem.nodejs.config.cjs` (신규)
- Node.js 서버 전용 PM2 설정
- `npm run start:prod` 실행

---

## 🚀 호스팅 서버 배포 방법

### Step 1: 코드 업데이트

```bash
ssh user@your-server.com
cd faith_dev
git pull origin main
```

### Step 2: 패키지 설치 (처음만)

```bash
npm install --legacy-peer-deps
```

### Step 3: PM2로 실행

```bash
# 기존 프로세스 중지 (있다면)
pm2 delete faith-portal

# Node.js 서버 시작
pm2 start ecosystem.nodejs.config.cjs

# 상태 확인
pm2 status
pm2 logs faith-portal --nostream
```

### Step 4: 이미지 확인

```bash
curl -I http://localhost:3000/logo_fl.png
# 또는
curl http://your-domain.com/logo_fl.png
```

---

## 🎯 주요 변경사항

| 항목 | 이전 | 이후 |
|------|------|------|
| 정적 파일 | ❌ 서빙 안 됨 | ✅ 정상 서빙 |
| 로고 이미지 | ❌ 깨짐 | ✅ 정상 표시 |
| PM2 설정 | Wrangler 사용 | Node.js 서버 사용 |
| Cloudflare 호환성 | ✅ 유지 | ✅ 유지 |

---

## 💡 핵심 포인트

### 환경별 처리

1. **Node.js 환경** (호스팅 서버)
   - `serveStatic` 미들웨어로 `public/` 폴더 서빙
   - `npm run start:prod` 실행

2. **Cloudflare Pages** (배포)
   - 자동으로 `public/` 폴더 서빙
   - `wrangler pages deploy dist` 실행

### 조건부 적용

```typescript
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Node.js에서만 실행
  app.use('/*', serveStatic({ root: './public' }))
}
```

---

## 🔗 GitHub 커밋

- **커밋**: `cdabae8 - Fix static file serving for Node.js server`
- **URL**: https://github.com/million-somang/faith_dev

---

## ✅ 완료 체크리스트

- [x] `serveStatic` 미들웨어 추가
- [x] 조건부 환경 감지 구현
- [x] PM2 설정 파일 생성
- [x] 로고 이미지 정상 서빙 확인
- [x] PM2로 서버 실행 테스트
- [x] Git 커밋 및 푸시
- [x] Cloudflare Pages 호환성 유지

---

## 🎉 결과

**이미지가 정상적으로 표시됩니다!**

이제 호스팅 서버에서:
1. `git pull origin main`
2. `pm2 start ecosystem.nodejs.config.cjs`

만 하면 로고를 포함한 모든 정적 파일이 정상 작동합니다! ✅

---

**다음 단계가 필요하신가요?** 
- 데이터베이스 연결
- 도메인 설정
- SSL 인증서
- 기타
