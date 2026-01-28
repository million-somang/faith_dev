#!/bin/bash

# Faith Portal 환경 변수 설정 스크립트

echo "🔧 Faith Portal 환경 변수 설정 시작..."

# .env 파일이 이미 존재하는지 확인
if [ -f .env ]; then
    echo "⚠️  .env 파일이 이미 존재합니다."
    read -p "덮어쓰시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 취소되었습니다."
        exit 0
    fi
fi

# 랜덤 SESSION_SECRET 생성
SESSION_SECRET=$(openssl rand -base64 32)

# .env 파일 생성
cat > .env << EOF
# Faith Portal 환경 변수
# 생성일: $(date '+%Y-%m-%d %H:%M:%S')

# 서버 설정
NODE_ENV=production
PORT=3000

# 데이터베이스 설정
DATABASE_PATH=./faith-portal.db

# 세션 시크릿 (자동 생성됨)
SESSION_SECRET=$SESSION_SECRET

# 로그 레벨 (debug, info, warn, error)
LOG_LEVEL=info
EOF

# 권한 설정 (읽기/쓰기만 허용)
chmod 600 .env

echo ""
echo "✅ .env 파일이 생성되었습니다!"
echo ""
echo "📁 파일 위치: $(pwd)/.env"
echo "🔐 SESSION_SECRET이 자동으로 생성되었습니다."
echo ""
echo "📝 생성된 .env 내용:"
echo "─────────────────────────────────────"
cat .env
echo "─────────────────────────────────────"
echo ""
echo "⚠️  주의사항:"
echo "   - .env 파일은 Git에 커밋되지 않습니다 (.gitignore에 포함)"
echo "   - 서버마다 다른 SESSION_SECRET을 사용하세요"
echo "   - 파일 권한이 600으로 설정되어 소유자만 읽을 수 있습니다"
echo ""
echo "🚀 다음 단계:"
echo "   1. pm2 restart faith-portal"
echo "   2. pm2 logs faith-portal"
echo ""
