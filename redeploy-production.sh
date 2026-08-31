#!/bin/bash
set -e

echo "🔄 1. 최신 코드 불러오는 중 (git fetch & reset)..."
git fetch origin
git reset --hard origin/main

echo "📦 2. 패키지 설치 중 (npm install)..."
npm install --legacy-peer-deps

echo "🏗️ 3. 프로젝트 빌드 중 (npm run build)..."
npm run build

echo "🚀 4. PM2 서비스 재시작 중..."
pm2 delete all 2>/dev/null || true
mkdir -p logs
pm2 start ecosystem.production.config.cjs
pm2 save

echo "✅ 5. 배포 완료! PM2 서비스 상태:"
pm2 list
