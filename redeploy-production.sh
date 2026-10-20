#!/bin/bash
set -e

echo "🔄 1. 최신 코드 불러오는 중 (git fetch & reset)..."
git fetch origin
git reset --hard origin/main

echo "🧹 2. 디스크 캐시 및 미니앱 중복 node_modules 정리 중..."
rm -rf apps/app-*/node_modules onlinegame/*/node_modules ~/.npm /var/lib/apt/lists/*
journalctl --vacuum-size=30M 2>/dev/null || true

echo "🚀 3. PM2 서비스 재시작 중..."
mkdir -p logs
pm2 restart ecosystem.production.config.cjs || pm2 start ecosystem.production.config.cjs
pm2 save

echo "✅ 4. 배포 완료! PM2 서비스 및 디스크 상태:"
pm2 list
df -h /
