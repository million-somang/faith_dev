# 🚀 호스팅 환경 문제 해결 가이드

## 📋 목차
1. [Git Pull DB 충돌 문제](#1-git-pull-db-충돌-문제)
2. [PM2 유지 안 되는 문제](#2-pm2-유지-안-되는-문제)
3. [빠른 해결 방법](#3-빠른-해결-방법)

---

## 1. Git Pull DB 충돌 문제

### 🔴 문제 증상
```bash
$ git pull origin main
error: Your local changes to the following files would be overwritten by merge:
        faith-portal.db
Please commit your changes or stash them before you merge.
```

### ✅ 원인
- 로컬 DB 파일(`faith-portal.db`)이 변경되어 Git이 pull을 거부함
- DB 파일은 매번 변경되므로 Git에서 추적하면 안 됨

### ✅ 해결 방법

#### 방법 1: 자동 배포 스크립트 사용 (권장)
```bash
cd ~/faith_dev
bash redeploy.sh
```

#### 방법 2: 수동 해결
```bash
cd ~/faith_dev

# DB 백업 (선택)
cp faith-portal.db faith-portal.db.backup

# 로컬 변경사항 무시하고 Pull
git fetch origin
git reset --hard origin/main

# 의존성 설치
npm install --production
```

### ✅ 근본 해결 (이미 적용됨)
- `.gitignore`에 DB 파일 추가 완료
- Git에서 DB 파일 추적 제거 완료
- 이제부터는 DB 충돌 문제가 발생하지 않음

---

## 2. PM2 유지 안 되는 문제

### 🔴 문제 증상
```bash
$ pm2 start ...
$ pm2 list
# 프로세스가 'errored' 상태이거나 계속 재시작됨
```

### ✅ 원인 진단

#### 1단계: PM2 로그 확인 (가장 중요!)
```bash
pm2 logs faith-portal --lines 50
pm2 logs faith-portal --err --lines 50
```

#### 2단계: PM2 상태 진단
```bash
# 진단 스크립트 실행
bash check-pm2.sh

# 또는 수동으로
pm2 list
pm2 show faith-portal
```

### ✅ 일반적인 원인과 해결책

#### 원인 1: 포트 충돌 (EADDRINUSE)
```bash
# 증상: Error: listen EADDRINUSE: address already in use :::3000

# 해결:
fuser -k 3000/tcp
# 또는
pkill -9 node
```

#### 원인 2: 애플리케이션 에러
```bash
# 증상: pm2 logs에서 JavaScript 에러 발생

# 해결:
# 1. 로그에서 에러 확인
pm2 logs faith-portal --err --lines 100

# 2. 최신 코드 받기
git pull origin main

# 3. 의존성 재설치
npm install --production
```

#### 원인 3: 메모리 부족
```bash
# 확인:
free -h
pm2 monit

# 해결:
# ecosystem.config.cjs에서 메모리 제한 설정
max_memory_restart: '500M'
```

#### 원인 4: 데이터베이스 Lock
```bash
# 증상: SqliteError: database is locked

# 해결:
pkill -9 node
rm -f faith-portal.db-shm faith-portal.db-wal
```

---

## 3. 빠른 해결 방법

### 🎯 완전 재배포 (가장 확실한 방법)

```bash
# 호스팅 서버에 SSH 접속 후
cd ~/faith_dev

# 자동 재배포 스크립트 실행
bash redeploy.sh
```

**이 스크립트가 자동으로 수행하는 작업:**
1. ✅ 기존 프로세스 모두 종료
2. ✅ 포트 3000 정리
3. ✅ DB 백업 (타임스탬프 포함)
4. ✅ 최신 코드 가져오기 (DB 충돌 무시)
5. ✅ 의존성 설치
6. ✅ PM2로 서버 시작
7. ✅ 상태 확인 및 로그 출력

### 🔍 PM2 상태 진단

```bash
cd ~/faith_dev
bash check-pm2.sh
```

**이 스크립트가 확인하는 내용:**
- PM2 버전 및 프로세스 목록
- 최근 에러 로그
- 포트 사용 현황
- 메모리/디스크 사용량
- 재시작 횟수 분석

---

## 4. 주요 명령어 치트시트

### Git 관련
```bash
# 최신 코드 가져오기 (DB 충돌 무시)
git fetch origin
git reset --hard origin/main

# 상태 확인
git status
```

### PM2 관련
```bash
# 상태 확인
pm2 list
pm2 status

# 로그 확인
pm2 logs faith-portal
pm2 logs faith-portal --err --lines 50

# 서버 제어
pm2 start faith-portal
pm2 stop faith-portal
pm2 restart faith-portal
pm2 delete faith-portal

# 모니터링
pm2 monit

# PM2 저장 (재부팅 시 자동 시작)
pm2 save
pm2 startup
```

### 프로세스 관리
```bash
# 모든 Node 프로세스 종료
pkill -9 node
pkill -9 tsx

# 포트 확인 및 종료
lsof -i :3000
fuser -k 3000/tcp

# 프로세스 확인
ps aux | grep node
```

### 시스템 상태
```bash
# 메모리 확인
free -h

# 디스크 확인
df -h

# 포트 사용 확인
netstat -tlnp | grep 3000
```

---

## 5. 프로덕션 배포 체크리스트

### 배포 전
- [ ] SSH로 서버 접속
- [ ] 프로젝트 디렉토리로 이동 (`cd ~/faith_dev`)
- [ ] 현재 PM2 상태 확인 (`pm2 list`)

### 배포 실행
- [ ] 재배포 스크립트 실행 (`bash redeploy.sh`)
- [ ] 또는 수동 배포:
  ```bash
  pm2 delete faith-portal
  git reset --hard origin/main
  npm install --production
  pm2 start npm --name faith-portal -- run start:prod
  ```

### 배포 후
- [ ] PM2 상태 확인 (`pm2 list`)
- [ ] 로그 확인 (`pm2 logs faith-portal --lines 30 --nostream`)
- [ ] 브라우저에서 접속 테스트
- [ ] 주요 기능 테스트 (로그인, 게임, 뉴스 등)

---

## 6. 문제 해결 플로우차트

```
Git Pull 실패?
├─ YES → bash redeploy.sh
└─ NO
   └─ PM2가 계속 죽음?
      ├─ YES → bash check-pm2.sh
      │        └─ pm2 logs 확인
      │           ├─ 포트 충돌? → fuser -k 3000/tcp
      │           ├─ 코드 에러? → git pull + npm install
      │           ├─ DB Lock? → rm *.db-shm *.db-wal
      │           └─ 메모리 부족? → 호스팅 업그레이드
      └─ NO → 정상 작동 중
```

---

## 7. 긴급 복구

**모든 것이 안 될 때:**

```bash
# 1. 완전 초기화
cd ~/faith_dev
pm2 delete all
pkill -9 node
pkill -9 tsx
fuser -k 3000/tcp 2>/dev/null

# 2. 클린 상태로 시작
git fetch origin
git reset --hard origin/main
rm -rf node_modules
npm cache clean --force
npm install --production

# 3. PM2 재시작
NODE_ENV=production pm2 start npm --name faith-portal -- run start:prod

# 4. 확인
sleep 5
pm2 logs faith-portal --lines 20 --nostream
```

---

## 8. 연락처 및 지원

**문제가 해결되지 않으면:**
1. `pm2 logs faith-portal --lines 100` 실행
2. 출력된 로그 전체를 복사
3. 에러 메시지와 함께 문의

**주요 파일:**
- `HOSTING_TROUBLESHOOTING.md` - 이 문서
- `redeploy.sh` - 자동 재배포 스크립트
- `check-pm2.sh` - PM2 진단 스크립트
- `clean-production-db.cjs` - DB 정리 스크립트

---

**GitHub**: https://github.com/million-somang/faith_dev  
**최신 커밋**: 3e1a2fd - Add hosting troubleshooting guides and scripts
