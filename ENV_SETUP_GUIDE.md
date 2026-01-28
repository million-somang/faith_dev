# 🔐 환경 변수 설정 가이드

## 📋 빠른 시작

### 자동 생성 (권장)

```bash
cd ~/faith_dev

# 환경 변수 자동 생성 스크립트 실행
./setup-env.sh
```

---

## 🔧 수동 설정

### 1. .env 파일 생성

```bash
cd ~/faith_dev

# .env 파일 생성
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_PATH=./faith-portal.db
SESSION_SECRET=임시_시크릿_키
EOF

# 랜덤 시크릿 생성 및 적용
SESSION_SECRET=$(openssl rand -base64 32)
sed -i "s/임시_시크릿_키/$SESSION_SECRET/" .env

# 파일 권한 설정 (보안)
chmod 600 .env
```

### 2. 확인

```bash
# 파일 존재 확인
ls -la .env

# 내용 확인
cat .env
```

---

## 📝 환경 변수 설명

### 필수 변수

| 변수 | 설명 | 기본값 | 예시 |
|------|------|--------|------|
| `NODE_ENV` | 실행 환경 | `production` | `production`, `development` |
| `PORT` | 서버 포트 | `3000` | `3000`, `8080` |
| `DATABASE_PATH` | SQLite DB 경로 | `./faith-portal.db` | `./faith-portal.db` |
| `SESSION_SECRET` | 세션 암호화 키 | (필수 생성) | 최소 32자 랜덤 문자열 |

### 선택 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `LOG_LEVEL` | 로그 수준 | `info` |
| `BROWSERLESS_API_TOKEN` | Browserless API 키 | (선택) |

---

## 🔐 SESSION_SECRET 생성

### OpenSSL 사용 (권장)

```bash
openssl rand -base64 32
```

### Node.js 사용

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 온라인 생성기

- https://randomkeygen.com/
- "Fort Knox Passwords" 섹션 사용

---

## 📂 .env.example 템플릿

`.env.example` 파일을 복사해서 사용:

```bash
cp .env.example .env
nano .env  # 편집기로 열어서 수정
```

---

## ⚠️ 보안 주의사항

### 1. Git에 커밋하지 않기

`.gitignore`에 포함되어 있는지 확인:

```bash
grep ".env" .gitignore
```

출력:
```
.env
.env.local
.env.production
```

### 2. 파일 권한 설정

```bash
# 소유자만 읽기/쓰기 가능
chmod 600 .env

# 확인
ls -la .env
# 출력: -rw------- 1 user user 150 Jan 28 14:00 .env
```

### 3. 서버마다 다른 시크릿 사용

- 개발 서버: 고유한 SESSION_SECRET
- 스테이징 서버: 고유한 SESSION_SECRET
- 프로덕션 서버: 고유한 SESSION_SECRET

❌ **절대 같은 시크릿을 여러 서버에서 재사용하지 마세요!**

---

## 🔄 환경 변수 업데이트

### .env 파일 수정 후

```bash
# 1. .env 파일 수정
nano .env

# 2. 서버 재시작
pm2 restart faith-portal

# 3. 로그 확인
pm2 logs faith-portal --nostream
```

---

## 🧪 환경 변수 테스트

### Node.js에서 확인

```bash
node -e "require('dotenv').config(); console.log(process.env.PORT, process.env.NODE_ENV)"
```

예상 출력:
```
3000 production
```

### 서버 로그에서 확인

```bash
pm2 logs faith-portal --nostream | grep -E "PORT|NODE_ENV"
```

---

## 🐛 트러블슈팅

### .env 파일이 로드되지 않음

**원인:** `dotenv` 패키지 미설치

**해결:**
```bash
npm install dotenv --legacy-peer-deps
```

### SESSION_SECRET 오류

**증상:**
```
Error: Secret must be at least 32 characters
```

**해결:**
```bash
# 새로운 시크릿 생성
openssl rand -base64 32

# .env 파일에 업데이트
nano .env
```

### 파일 권한 오류

**증상:**
```
EACCES: permission denied, open '.env'
```

**해결:**
```bash
# 소유권 확인 및 변경
ls -la .env
sudo chown $USER:$USER .env
chmod 600 .env
```

### 환경 변수가 적용되지 않음

**확인:**
```bash
# 1. .env 파일 존재 확인
ls -la .env

# 2. dotenv 패키지 설치 확인
npm list dotenv

# 3. 서버 재시작
pm2 restart faith-portal

# 4. 로그 확인
pm2 logs faith-portal --lines 20
```

---

## 📚 추가 환경 변수 (필요시)

### PostgreSQL 사용 시

```bash
# .env 파일에 추가
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/faith_portal
```

### 이메일 설정

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 외부 API 키

```bash
# Browserless (웹 스크래핑)
BROWSERLESS_API_TOKEN=your_token_here

# OpenAI API (필요시)
OPENAI_API_KEY=sk-...
```

---

## ✅ 체크리스트

배포 전 확인:

- [ ] `.env` 파일 생성
- [ ] `SESSION_SECRET` 랜덤 생성
- [ ] 파일 권한 600 설정
- [ ] `.gitignore`에 `.env` 포함
- [ ] `dotenv` 패키지 설치
- [ ] 서버 재시작 후 테스트
- [ ] 환경 변수 로드 확인

---

## 🎯 결론

**권장 방법:**

```bash
# 한 줄 명령어
cd ~/faith_dev && ./setup-env.sh && pm2 restart faith-portal
```

이 스크립트가:
1. ✅ `.env` 파일 자동 생성
2. ✅ 랜덤 `SESSION_SECRET` 생성
3. ✅ 파일 권한 자동 설정
4. ✅ 내용 확인 및 안내

---

**추가 도움이 필요하시면 문의하세요!** 🚀
