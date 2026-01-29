#!/bin/bash

# 프로덕션 서버 완전 재시작 스크립트

echo "🚀 Faith Portal 프로덕션 서버 재시작 중..."
echo ""

# 1. Git Pull
echo "1️⃣ 최신 코드 받기..."
git fetch origin
git reset --hard origin/main
echo "✅ 코드 업데이트 완료"
echo ""

# 2. PM2 프로세스 종료
echo "2️⃣ 기존 PM2 프로세스 종료..."
pm2 delete all 2>/dev/null || echo "종료할 프로세스 없음"
echo "✅ 프로세스 종료 완료"
echo ""

# 3. 로그 디렉토리 생성
echo "3️⃣ 로그 디렉토리 생성..."
mkdir -p logs
echo "✅ 로그 디렉토리 준비 완료"
echo ""

# 4. PM2로 프로덕션 서버 시작
echo "4️⃣ PM2로 프로덕션 서버 시작..."
pm2 start ecosystem.production.config.cjs
echo "✅ 서버 시작 완료"
echo ""

# 5. PM2 설정 저장
echo "5️⃣ PM2 설정 저장..."
pm2 save
echo "✅ PM2 설정 저장 완료"
echo ""

# 6. 서버 상태 확인
echo "6️⃣ 서버 상태 확인..."
sleep 3
pm2 list
echo ""

# 7. 로그 확인
echo "7️⃣ 최근 로그 확인..."
pm2 logs faith-portal --nostream --lines 20
echo ""

echo "✅ 프로덕션 서버 재시작 완료!"
echo ""
echo "📋 추가 명령어:"
echo "  - 로그 확인: pm2 logs faith-portal"
echo "  - 상태 확인: pm2 list"
echo "  - 재시작: pm2 restart faith-portal"
echo "  - 중지: pm2 stop faith-portal"
