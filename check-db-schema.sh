#!/bin/bash

echo "🔧 DB 스키마 완전 복구 스크립트"
echo "================================"
echo ""

DB_FILE="./faith-portal.db"

# 먼저 sqlite3가 설치되어 있는지 확인
if ! command -v sqlite3 &> /dev/null; then
    echo "⚠️  sqlite3가 설치되지 않았습니다. 설치 중..."
    apt-get update && apt-get install -y sqlite3
fi

echo "1️⃣ 현재 테이블 목록 확인..."
sqlite3 "$DB_FILE" ".tables"
echo ""

echo "2️⃣ bookmarks 테이블에 news_id 컬럼 추가 (이미 있으면 무시)..."
sqlite3 "$DB_FILE" "ALTER TABLE bookmarks ADD COLUMN news_id INTEGER;" 2>/dev/null || echo "  (이미 존재하거나 추가 불필요)"

echo "3️⃣ user_keywords 테이블 확인..."
sqlite3 "$DB_FILE" "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_keywords';"
echo ""

echo "4️⃣ user_keyword_subscriptions 테이블 확인..."
sqlite3 "$DB_FILE" "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_keyword_subscriptions';"
echo ""

echo "5️⃣ bookmarks 테이블 스키마 확인..."
sqlite3 "$DB_FILE" "SELECT sql FROM sqlite_master WHERE type='table' AND name='bookmarks';"
echo ""

echo "6️⃣ news 테이블에 published_at 컬럼 확인..."
sqlite3 "$DB_FILE" "PRAGMA table_info(news);" | grep published_at || echo "  ⚠️  published_at 컬럼 없음!"
echo ""

echo "✅ 스키마 확인 완료!"
echo ""
echo "🔄 PM2 재시작..."
pm2 restart faith-portal
pm2 save

echo ""
echo "✅ 완료!"
echo ""
echo "📋 테스트 명령어:"
echo "  curl http://localhost:3000/api/user/keywords"
echo "  curl http://localhost:3000/api/bookmarks"
