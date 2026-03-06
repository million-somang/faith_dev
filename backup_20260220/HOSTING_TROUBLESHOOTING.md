#!/bin/bash

# Faith Portal 호스팅 환경 문제 해결 가이드

echo "=========================================="
echo "  Faith Portal 호스팅 문제 진단 및 해결"
echo "=========================================="

# 1. Git Pull DB 충돌 문제 해결
echo -e "\n=== 1. Git Pull DB 충돌 문제 해결 ==="
echo ""
echo "문제: git pull 시 'faith-portal.db' 파일 충돌"
echo "원인: 로컬 DB 파일이 변경되어 Git이 pull을 거부함"
echo ""
echo "해결 방법:"
echo ""
echo "방법 1) DB 파일 무시하고 Pull (권장)"
echo "  git reset --hard origin/main"
echo "  (주의: 로컬 변경사항이 모두 사라집니다)"
echo ""
echo "방법 2) 현재 DB 백업 후 Pull"
echo "  cp faith-portal.db faith-portal.db.backup"
echo "  git checkout -- faith-portal.db"
echo "  git pull origin main"
echo ""
echo "방법 3) DB 파일을 .gitignore에 추가 (근본 해결)"
echo "  echo 'faith-portal.db' >> .gitignore"
echo "  git rm --cached faith-portal.db"
echo "  git commit -m 'Remove DB file from git tracking'"
echo "  git push origin main"
echo ""

# 2. PM2 유지 문제 해결
echo -e "\n=== 2. PM2가 계속 종료되는 문제 해결 ==="
echo ""
echo "문제: PM2로 실행해도 프로세스가 계속 죽음"
echo ""
echo "가능한 원인들:"
echo "  1. 포트 충돌 (3000 포트가 이미 사용 중)"
echo "  2. 메모리 부족"
echo "  3. 애플리케이션 에러로 인한 크래시"
echo "  4. Node.js 버전 문제"
echo "  5. PM2 설정 문제"
echo ""
echo "진단 명령어:"
echo ""
echo "1) PM2 상태 확인:"
echo "   pm2 list"
echo "   pm2 status"
echo ""
echo "2) PM2 로그 확인 (가장 중요!):"
echo "   pm2 logs faith-portal --lines 50"
echo "   pm2 logs faith-portal --err --lines 50"
echo ""
echo "3) 포트 사용 확인:"
echo "   lsof -i :3000"
echo "   netstat -tlnp | grep 3000"
echo ""
echo "4) 프로세스 확인:"
echo "   ps aux | grep node"
echo ""
echo "5) 메모리 사용량 확인:"
echo "   free -h"
echo "   pm2 monit"
echo ""

# 3. PM2 재시작 스크립트
echo -e "\n=== 3. PM2 완전 재시작 스크립트 ==="
echo ""
echo "다음 명령어를 순서대로 실행하세요:"
echo ""
echo "# 1단계: 모든 프로세스 종료"
echo "pm2 delete all 2>/dev/null || true"
echo "pkill -9 node"
echo "pkill -9 tsx"
echo "sleep 2"
echo ""
echo "# 2단계: 포트 정리"
echo "fuser -k 3000/tcp 2>/dev/null || true"
echo "sleep 1"
echo ""
echo "# 3단계: PM2 시작"
echo "cd ~/faith_dev"
echo "NODE_ENV=production pm2 start npm --name faith-portal -- run start:prod"
echo ""
echo "# 4단계: 상태 확인"
echo "sleep 5"
echo "pm2 list"
echo "pm2 logs faith-portal --lines 20 --nostream"
echo ""

# 4. ecosystem.config.cjs 파일 설정
echo -e "\n=== 4. PM2 설정 파일 (ecosystem.config.cjs) ==="
echo ""
echo "올바른 설정 예시:"
echo ""
cat << 'EOF'
module.exports = {
  apps: [{
    name: 'faith-portal',
    script: 'tsx',
    args: 'src/server.ts',
    cwd: '/home/user/faith_dev',  // 실제 경로로 수정
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF
echo ""

# 5. 자동 시작 스크립트
echo -e "\n=== 5. 서버 재시작 시 자동 시작 설정 ==="
echo ""
echo "PM2를 시스템 부팅 시 자동 시작하도록 설정:"
echo ""
echo "pm2 startup"
echo "# 위 명령어 실행 후 나오는 명령어를 복사해서 실행"
echo ""
echo "pm2 save"
echo "# 현재 PM2 프로세스 목록을 저장"
echo ""

# 6. 일반적인 에러와 해결책
echo -e "\n=== 6. 일반적인 에러와 해결책 ==="
echo ""
echo "에러 1: 'EADDRINUSE: address already in use'"
echo "  해결: fuser -k 3000/tcp 또는 pkill -9 node"
echo ""
echo "에러 2: 'Cannot find module'"
echo "  해결: npm install --production"
echo ""
echo "에러 3: 'Permission denied'"
echo "  해결: sudo 권한 확인 또는 포트 번호를 3000 이상으로 변경"
echo ""
echo "에러 4: 'Database is locked'"
echo "  해결: DB 파일 권한 확인 (chmod 644 faith-portal.db)"
echo ""
echo "에러 5: PM2가 계속 restart됨"
echo "  해결: pm2 logs로 에러 확인 → 코드 수정 필요"
echo ""

# 7. 완전한 재배포 스크립트
echo -e "\n=== 7. 완전한 재배포 스크립트 ==="
echo ""
cat << 'EOF'
#!/bin/bash
# 완전한 재배포 스크립트

# 1. 기존 프로세스 종료
echo "1. 기존 프로세스 종료 중..."
pm2 delete faith-portal 2>/dev/null || true
pkill -9 node
pkill -9 tsx
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# 2. 프로젝트 디렉토리로 이동
echo "2. 프로젝트 디렉토리로 이동..."
cd ~/faith_dev || exit 1

# 3. Git Pull (DB 충돌 무시)
echo "3. 최신 코드 가져오기..."
git fetch origin
git reset --hard origin/main

# 4. 의존성 설치
echo "4. 의존성 설치 중..."
npm install --production

# 5. DB 최적화 (선택사항)
echo "5. DB 최적화..."
node clean-production-db.cjs 2>/dev/null || echo "DB 최적화 스킵"

# 6. PM2로 시작
echo "6. PM2로 서버 시작..."
NODE_ENV=production pm2 start npm --name faith-portal -- run start:prod

# 7. 결과 확인
sleep 5
echo ""
echo "=== PM2 상태 ==="
pm2 list

echo ""
echo "=== 최근 로그 ==="
pm2 logs faith-portal --lines 20 --nostream

echo ""
echo "=== 서버 접속 테스트 ==="
curl -s http://localhost:3000 | head -10

echo ""
echo "배포 완료!"
EOF
echo ""

# 8. 문제 지속 시 확인사항
echo -e "\n=== 8. 문제가 계속되면 확인할 사항 ==="
echo ""
echo "1. Node.js 버전 확인:"
echo "   node --version"
echo "   (권장: v18 이상)"
echo ""
echo "2. npm 버전 확인:"
echo "   npm --version"
echo ""
echo "3. PM2 버전 확인:"
echo "   pm2 --version"
echo ""
echo "4. 디스크 공간 확인:"
echo "   df -h"
echo ""
echo "5. 메모리 확인:"
echo "   free -h"
echo ""
echo "6. 호스팅 로그 확인:"
echo "   tail -100 /var/log/syslog"
echo ""

echo -e "\n=========================================="
echo "  위 내용을 참고하여 문제를 해결하세요"
echo "=========================================="
echo ""
echo "가장 중요한 명령어:"
echo "  pm2 logs faith-portal --lines 50"
echo ""
echo "이 명령어로 정확한 에러 메시지를 확인하세요!"
echo ""
