# 🏭 프로덕션 서버 배포 가이드

## 📋 개요

이 프로젝트는 **두 가지 실행 환경**을 지원합니다:

1. **샌드박스 개발 환경** - Wrangler (Cloudflare Pages Dev) 사용
2. **프로덕션 서버** - Node.js + TypeScript 직접 실행

---

## 🚀 프로덕션 서버 배포

### 방법 1: 자동 스크립트 사용 (권장)

```bash
cd ~/faith_dev
./redeploy-production.sh
```

### 방법 2: 수동 배포

```bash
cd ~/faith_dev

# 1. 최신 코드 받기
git fetch origin
git reset --hard origin/main

# 2. 기존 PM2 프로세스 종료
pm2 delete all

# 3. 로그 디렉토리 생성
mkdir -p logs

# 4. 프로덕션 서버 시작
pm2 start ecosystem.production.config.cjs

# 5. PM2 설정 저장 (재부팅 시 자동 시작)
pm2 save

# 6. 상태 확인
pm2 list
pm2 logs faith-portal --nostream --lines 20
```

---

## 📁 PM2 설정 파일

### `ecosystem.config.cjs` (샌드박스 개발용)
- Wrangler Pages Dev 실행
- Cloudflare D1 로컬 개발 환경
- 포트: 3000

### `ecosystem.production.config.cjs` (프로덕션용) ⭐
- Node.js + TypeScript 직접 실행
- SQLite 데이터베이스 사용
- 포트: 3000
- 자동 재시작 설정
- 로그 파일 관리

---

## 🔍 PM2 명령어

### 상태 확인
```bash
pm2 list
pm2 status
```

### 로그 확인
```bash
# 실시간 로그
pm2 logs faith-portal

# 최근 로그 (non-blocking)
pm2 logs faith-portal --nostream --lines 50

# 에러 로그만
pm2 logs faith-portal --err

# 출력 로그만
pm2 logs faith-portal --out
```

### 프로세스 관리
```bash
# 재시작
pm2 restart faith-portal

# 중지
pm2 stop faith-portal

# 삭제
pm2 delete faith-portal

# 모든 프로세스 재시작
pm2 restart all

# 모든 프로세스 삭제
pm2 delete all
```

### PM2 설정 저장/복원
```bash
# 현재 프로세스 목록 저장
pm2 save

# 저장된 프로세스 복원
pm2 resurrect
```

---

## 🐛 문제 해결

### PM2가 계속 재시작되는 경우

**원인**: 서버 시작 실패 또는 크래시

**해결**:
```bash
# 로그 확인
pm2 logs faith-portal --err --lines 50

# 프로세스 삭제 후 재시작
pm2 delete faith-portal
pm2 start ecosystem.production.config.cjs
pm2 save
```

### 포트 3000이 이미 사용 중

**확인**:
```bash
lsof -i :3000
netstat -tlnp | grep 3000
```

**해결**:
```bash
# PM2로 시작한 프로세스 모두 종료
pm2 delete all

# 수동으로 실행 중인 프로세스 종료
pkill -9 node
pkill -9 tsx
```

### Wrangler 오류 발생

**원인**: `ecosystem.config.cjs`를 프로덕션에서 사용 중

**해결**:
```bash
# 프로덕션용 설정 파일 사용
pm2 delete all
pm2 start ecosystem.production.config.cjs
pm2 save
```

---

## ✅ 정상 작동 확인

### 1. PM2 상태 확인
```bash
pm2 list
```

출력 예시:
```
┌────┬─────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name            │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼─────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ faith-portal    │ fork     │ 0    │ online    │ 0%       │ 75.8mb   │
└────┴─────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**확인 포인트**:
- `status`: `online`이어야 함
- `↺` (restart count): 0 또는 낮은 숫자
- `memory`: 500MB 미만

### 2. 서버 응답 확인
```bash
curl -I http://localhost:3000
```

출력 예시:
```
HTTP/1.1 200 OK
content-type: text/html; charset=UTF-8
Date: Thu, 29 Jan 2026 12:00:00 GMT
```

### 3. 로그 확인
```bash
pm2 logs faith-portal --nostream --lines 20
```

**정상 로그 예시**:
```
✅ Database initialized successfully
🚀 Server running on port 3000
```

---

## 🔄 일반 업데이트 워크플로우

### 코드 업데이트 시
```bash
cd ~/faith_dev
./redeploy-production.sh
```

### 환경 변수 변경 시
```bash
# .env 파일 수정 후
pm2 restart faith-portal --update-env
pm2 save
```

### DB 마이그레이션 시
```bash
cd ~/faith_dev
# DB 마이그레이션 실행 (필요시)
pm2 restart faith-portal
pm2 save
```

---

## 📊 모니터링

### PM2 대시보드
```bash
pm2 monit
```

### 메모리 사용량 확인
```bash
pm2 list
```

### 로그 파일 위치
- 출력 로그: `./logs/out.log`
- 에러 로그: `./logs/error.log`
- PM2 로그: `~/.pm2/logs/`

---

## 🎯 체크리스트

배포 전:
- [ ] Git 최신 코드 pull 완료
- [ ] `.env` 파일 설정 확인
- [ ] 데이터베이스 파일 존재 확인 (`faith-portal.db`)

배포 후:
- [ ] PM2 상태 `online` 확인
- [ ] 웹사이트 접속 테스트
- [ ] 로그에 에러 없음 확인
- [ ] PM2 설정 저장 (`pm2 save`)

---

## 📞 긴급 복구

서버가 완전히 다운된 경우:

```bash
cd ~/faith_dev

# 1. 모든 프로세스 강제 종료
pm2 delete all
pkill -9 node
pkill -9 tsx

# 2. 최신 코드 받기
git fetch origin
git reset --hard origin/main

# 3. 프로덕션 서버 시작
pm2 start ecosystem.production.config.cjs
pm2 save

# 4. 확인
pm2 list
curl -I http://localhost:3000
```

---

## 🔐 보안 참고사항

- `.env` 파일은 Git에 커밋되지 않음
- `faith-portal.db`는 Git에서 제외됨 (`.gitignore`)
- PM2 로그 파일은 자동으로 로테이션됨

---

## 📚 추가 리소스

- [PM2 공식 문서](https://pm2.keymetrics.io/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [Node.js 공식 문서](https://nodejs.org/)
