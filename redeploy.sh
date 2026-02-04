#!/bin/bash

# Faith Portal - 완전한 재배포 스크립트
# 사용법: bash redeploy.sh

echo "=========================================="
echo "  Faith Portal 완전 재배포"
echo "=========================================="

# 현재 디렉토리 저장
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 1. 기존 프로세스 모두 종료
echo -e "\n[1/7] 기존 프로세스 종료 중..."
pm2 delete faith-portal 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -9 node 2>/dev/null || true
pkill -9 tsx 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 3
echo "✓ 프로세스 종료 완료"

# 2. Git 상태 확인
echo -e "\n[2/7] Git 상태 확인..."
git status

# 3. 로컬 DB 백업
echo -e "\n[3/7] 로컬 DB 백업..."
if [ -f "faith-portal.db" ]; then
    cp faith-portal.db faith-portal.db.backup.$(date +%Y%m%d_%H%M%S)
    echo "✓ DB 백업 완료"
else
    echo "✓ DB 파일 없음 (스킵)"
fi

# 4. 최신 코드 가져오기 (DB 충돌 무시)
echo -e "\n[4/7] 최신 코드 가져오기..."
git fetch origin
git reset --hard origin/main
echo "✓ 코드 업데이트 완료"

# 5. 의존성 설치
echo -e "\n[5/7] 의존성 설치..."
npm install --production
echo "✓ 의존성 설치 완료"

# 6. PM2로 시작
echo -e "\n[6/7] PM2로 서버 시작..."
NODE_ENV=production pm2 start npm --name faith-portal -- run start:prod

# 7. 결과 확인
echo -e "\n[7/7] 배포 결과 확인..."
sleep 5

echo -e "\n=== PM2 상태 ==="
pm2 list

echo -e "\n=== 최근 로그 (20줄) ==="
pm2 logs faith-portal --lines 20 --nostream

echo -e "\n=== 서버 접속 테스트 ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000

echo -e "\n=========================================="
echo "  배포 완료!"
echo "=========================================="
echo ""
echo "서버 상태 확인: pm2 list"
echo "로그 확인: pm2 logs faith-portal"
echo "서버 중지: pm2 stop faith-portal"
echo "서버 재시작: pm2 restart faith-portal"
echo ""
