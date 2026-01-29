#!/bin/bash

# DB 파일 경로
DB_FILE="./faith-portal.db"

echo "🔧 북마크 테이블에 news_id 컬럼 추가 중..."

# SQLite로 컬럼 추가
sqlite3 "$DB_FILE" <<EOF
-- news_id 컬럼 추가 (이미 있으면 무시)
ALTER TABLE bookmarks ADD COLUMN news_id INTEGER;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bookmarks_news_id ON bookmarks(news_id);

-- 확인
SELECT sql FROM sqlite_master WHERE type='table' AND name='bookmarks';
EOF

echo "✅ 컬럼 추가 완료!"
echo ""
echo "🔄 PM2 재시작 중..."
pm2 restart faith-portal
pm2 save

echo "✅ 완료!"
