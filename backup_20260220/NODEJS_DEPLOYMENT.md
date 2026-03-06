# Node.js 서버 배포 가이드

Faith Portal을 **실제 호스팅 서버(Node.js 환경)**에서 실행하는 방법입니다.

## 📋 사전 준비

### 1. 필수 패키지 설치

```bash
npm install --legacy-peer-deps
```

**설치된 Node.js 전용 패키지:**
- `@hono/node-server` - Hono를 Node.js에서 실행
- `tsx` - TypeScript를 직접 실행

---

## 🚀 실행 방법

### 로컬 테스트 (개발 모드)

```bash
npm run start
```

- **포트**: 3000
- **URL**: http://localhost:3000

### 프로덕션 실행

```bash
npm run start:prod
```

- **환경 변수**: `NODE_ENV=production`
- **최적화된 실행**

---

## 🔧 파일 구조

```
webapp/
├── src/
│   ├── index.tsx        # Cloudflare Pages 진입점 (export default app)
│   └── server.ts        # Node.js 서버 진입점 (serve 사용) ← 새로 생성!
├── package.json         # npm 스크립트 추가
└── tsconfig.json
```

### `src/server.ts` 내용

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

---

## 🌐 호스팅 서버 배포 (SSH)

### 1. 코드 업로드

```bash
# GitHub에서 클론
git clone https://github.com/million-somang/faith_dev.git
cd faith_dev

# 또는 rsync로 직접 업로드
rsync -avz webapp/ user@server:/path/to/webapp/
```

### 2. 서버에서 설치

```bash
ssh user@server
cd /path/to/webapp

# Node.js 패키지 설치
npm install --legacy-peer-deps
```

### 3. 서버 실행

#### 방법 A: 직접 실행 (테스트용)

```bash
npm run start
```

#### 방법 B: PM2로 데몬 실행 (권장)

```bash
# PM2 설치 (전역)
npm install -g pm2

# 서버 시작
pm2 start npm --name "faith-portal" -- run start:prod

# 자동 재시작 설정
pm2 startup
pm2 save

# 상태 확인
pm2 status
pm2 logs faith-portal
```

#### 방법 C: systemd 서비스 (Linux)

`/etc/systemd/system/faith-portal.service` 파일 생성:

```ini
[Unit]
Description=Faith Portal Node.js Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/webapp
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=faith-portal

[Install]
WantedBy=multi-user.target
```

서비스 활성화:

```bash
sudo systemctl daemon-reload
sudo systemctl enable faith-portal
sudo systemctl start faith-portal
sudo systemctl status faith-portal
```

---

## 🔒 환경 변수 설정

### `.env` 파일 생성 (프로덕션)

```bash
# /path/to/webapp/.env
NODE_ENV=production
PORT=3000

# 데이터베이스 (필요시)
DATABASE_URL=your_database_url

# API 키 (필요시)
BROWSERLESS_API_TOKEN=your_token
```

### 환경 변수 로드

`src/server.ts` 수정:

```typescript
import { serve } from '@hono/node-server'
import app from './index'
import * as dotenv from 'dotenv'

// .env 파일 로드
dotenv.config()

const port = parseInt(process.env.PORT || '3000')

serve({
  fetch: app.fetch,
  port
})

console.log(`✅ Faith Portal Server is running on http://localhost:${port}`)
```

---

## ⚠️ 중요 사항

### 1. 포트 충돌 방지

```bash
# 3000번 포트가 사용 중이면
fuser -k 3000/tcp
```

### 2. 방화벽 설정

```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp
```

### 3. Nginx 리버스 프록시 (권장)

`/etc/nginx/sites-available/faith-portal`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

활성화:

```bash
sudo ln -s /etc/nginx/sites-available/faith-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 모니터링

### PM2 대시보드

```bash
pm2 monit
```

### 로그 확인

```bash
# PM2 로그
pm2 logs faith-portal

# systemd 로그
sudo journalctl -u faith-portal -f
```

---

## 🐛 트러블슈팅

### 1. 모듈을 찾을 수 없음

```bash
npm install --legacy-peer-deps
```

### 2. 포트 권한 오류 (1024 이하 포트)

```bash
# setcap으로 권한 부여
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

### 3. TypeScript 오류

```bash
# tsx가 제대로 설치되었는지 확인
npx tsx --version
```

---

## 📝 npm 스크립트 요약

| 명령어 | 설명 |
|--------|------|
| `npm run start` | 개발 모드 실행 (포트 3000) |
| `npm run start:prod` | 프로덕션 모드 실행 |
| `npm run dev` | Vite 개발 서버 (Cloudflare 개발) |
| `npm run build` | Cloudflare Pages 빌드 |
| `npm run deploy` | Cloudflare Pages 배포 |

---

## 🔗 관련 문서

- [Hono + Node.js 공식 문서](https://hono.dev/docs/getting-started/nodejs)
- [PM2 공식 문서](https://pm2.keymetrics.io/)
- [Nginx 리버스 프록시 가이드](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] `npm install --legacy-peer-deps` 실행
- [ ] 포트 3000 사용 가능 확인
- [ ] 환경 변수 설정 (필요시)
- [ ] 방화벽 설정
- [ ] PM2 또는 systemd 설정
- [ ] Nginx 리버스 프록시 설정 (선택)
- [ ] HTTPS 인증서 설정 (Let's Encrypt)

---

**배포 완료 후 테스트:**

```bash
curl http://localhost:3000
curl http://localhost:3000/api/health
```

정상 응답이 오면 배포 성공! 🎉
