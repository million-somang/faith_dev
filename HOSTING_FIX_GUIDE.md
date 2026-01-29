# 🔧 호스팅 서버 문제 완전 해결 가이드

## ⚠️ 발생하는 문제들

### 1. Git Pull 시 DB 충돌
```
error: Your local changes to the following files would be overwritten by merge:
	faith-portal.db
```

### 2. PM2가 자동으로 유지되지 않음
- 서버 재부팅 시 PM2 프로세스 사라짐
- 프로세스가 종료되면 자동으로 재시작 안 됨

---

## ✅ 해결 방법

### 1️⃣ DB 충돌 문제 해결

#### Git에서 DB 파일 추적 중단 (이미 완료됨)
```bash
cd ~/faith_dev
git rm --cached faith-portal.db
git commit -m "Stop tracking database file"
git push origin main
```

#### Pull 시 강제 덮어쓰기
```bash
cd ~/faith_dev
git fetch origin
git reset --hard origin/main
```

⚠️ **주의**: 이 명령은 로컬 변경사항을 모두 삭제합니다!

---

### 2️⃣ PM2 자동 재시작 설정

#### PM2 Startup 설정
```bash
# PM2를 시스템 부팅 시 자동으로 시작하도록 설정
pm2 startup

# 위 명령 실행 후 나오는 명령어를 복사해서 실행하세요!
# 예: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username
```

#### 현재 PM2 프로세스 저장
```bash
cd ~/faith_dev
pm2 start ecosystem.config.cjs
pm2 save
```

이제 **서버가 재부팅되어도 PM2가 자동으로 시작**됩니다!

---

## 🚀 완전 자동화 재배포 스크립트

### 스크립트 생성
`redeploy.sh` 파일을 사용하세요:

```bash
cd ~/faith_dev
chmod +x redeploy.sh
./redeploy.sh
```

### 스크립트 내용 (이미 생성됨)
- Git pull with force
- PM2 프로세스 재시작
- 로그 확인

---

## 📋 PM2 상태 확인 스크립트

### PM2 상태 체크
`check-pm2.sh` 파일을 사용하세요:

```bash
cd ~/faith_dev
chmod +x check-pm2.sh
./check-pm2.sh
```

---

## 🔍 문제 진단

### DB 파일 추적 여부 확인
```bash
cd ~/faith_dev
git ls-files | grep .db
```
→ 아무것도 출력되지 않아야 정상!

### PM2 Startup 설정 확인
```bash
pm2 startup
```
→ 이미 설정되어 있으면 "Already setup" 메시지 출력

### PM2 저장된 프로세스 확인
```bash
pm2 list
pm2 save
```

---

## 💡 추천 워크플로우

### 일반 업데이트 시
```bash
cd ~/faith_dev
./redeploy.sh
```

### PM2 문제 발생 시
```bash
cd ~/faith_dev
./check-pm2.sh
pm2 restart faith-portal
pm2 save
```

### 완전히 새로 시작
```bash
cd ~/faith_dev
git fetch origin
git reset --hard origin/main
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 🎯 최종 체크리스트

- [ ] `.gitignore`에 `*.db` 추가됨
- [ ] Git에서 `faith-portal.db` 추적 중단됨
- [ ] PM2 startup 설정 완료
- [ ] PM2 save 완료
- [ ] `redeploy.sh` 실행 권한 부여
- [ ] `check-pm2.sh` 실행 권한 부여

---

## 📞 문제가 계속되면

### PM2 로그 확인
```bash
pm2 logs faith-portal
pm2 logs faith-portal --err
```

### 시스템 로그 확인
```bash
journalctl -u pm2-username -n 50
```

### PM2 상태 초기화
```bash
pm2 kill
pm2 startup
# 출력된 명령어 실행
pm2 start ecosystem.config.cjs
pm2 save
```
