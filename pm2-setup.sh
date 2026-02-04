#!/bin/bash

# PM2 완전 자동화 설정 스크립트

echo "🚀 PM2 자동 재시작 설정 시작..."
echo ""

# 1. PM2 Startup 설정
echo "1️⃣ PM2 Startup 설정 중..."
pm2 startup

echo ""
echo "⚠️ 위에 출력된 'sudo env PATH=...' 명령어를 복사해서 실행하세요!"
echo ""
echo "예시:"
echo "sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username"
echo ""
echo "명령어 실행 후 다음 단계를 진행하세요:"
echo ""
echo "2️⃣ PM2 프로세스 시작 및 저장"
echo "   cd ~/faith_dev"
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo ""
echo "3️⃣ 확인"
echo "   pm2 list"
echo ""
echo "✅ 설정 완료 후 서버 재부팅 시에도 PM2가 자동으로 시작됩니다!"
