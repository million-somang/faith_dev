#!/bin/bash

# PM2 상태 진단 스크립트
# 사용법: bash check-pm2.sh

echo "=========================================="
echo "  PM2 상태 진단"
echo "=========================================="

# 1. PM2 버전
echo -e "\n=== 1. PM2 버전 ==="
pm2 --version

# 2. Node.js 버전
echo -e "\n=== 2. Node.js 버전 ==="
node --version

# 3. PM2 프로세스 목록
echo -e "\n=== 3. PM2 프로세스 목록 ==="
pm2 list

# 4. PM2 상세 정보
echo -e "\n=== 4. faith-portal 상세 정보 ==="
pm2 show faith-portal 2>/dev/null || echo "faith-portal 프로세스가 없습니다"

# 5. 최근 에러 로그
echo -e "\n=== 5. 최근 에러 로그 (30줄) ==="
pm2 logs faith-portal --err --lines 30 --nostream 2>/dev/null || echo "로그 없음"

# 6. 최근 출력 로그
echo -e "\n=== 6. 최근 출력 로그 (30줄) ==="
pm2 logs faith-portal --out --lines 30 --nostream 2>/dev/null || echo "로그 없음"

# 7. 포트 사용 확인
echo -e "\n=== 7. 포트 3000 사용 확인 ==="
lsof -i :3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep 3000 || echo "포트 3000 사용 중 아님"

# 8. Node 프로세스 확인
echo -e "\n=== 8. 실행 중인 Node 프로세스 ==="
ps aux | grep -E "node|tsx" | grep -v grep || echo "Node 프로세스 없음"

# 9. 메모리 사용량
echo -e "\n=== 9. 메모리 사용량 ==="
free -h

# 10. 디스크 사용량
echo -e "\n=== 10. 디스크 사용량 ==="
df -h | grep -E "Filesystem|/$"

# 11. PM2가 죽는 이유 분석
echo -e "\n=== 11. PM2 재시작 횟수 ==="
pm2 show faith-portal 2>/dev/null | grep -E "restarts|uptime|status" || echo "정보 없음"

echo -e "\n=========================================="
echo "  진단 완료"
echo "=========================================="

# 문제 판단
echo -e "\n=== 문제 판단 ==="
PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -c "faith-portal")

if [ "$PM2_STATUS" -eq "0" ]; then
    echo "❌ faith-portal 프로세스가 실행되지 않음"
    echo ""
    echo "해결 방법:"
    echo "  bash redeploy.sh"
else
    PM2_RESTARTS=$(pm2 jlist 2>/dev/null | grep -o '"restarts":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$PM2_RESTARTS" ] && [ "$PM2_RESTARTS" -gt "5" ]; then
        echo "⚠️  재시작 횟수가 많음 ($PM2_RESTARTS 회)"
        echo ""
        echo "원인 확인:"
        echo "  pm2 logs faith-portal --err --lines 50"
    else
        echo "✅ PM2 정상 작동 중"
    fi
fi

echo ""
