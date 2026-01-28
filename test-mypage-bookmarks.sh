#!/bin/bash

# 1. 로그인
echo "=== 로그인 ==="
LOGIN_RESPONSE=$(curl -s -c /tmp/test-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')
echo "User ID: $USER_ID"

# 2. 북마크 추가
echo -e "\n=== 북마크 추가 (newsId=83, 85) ==="
for newsId in 83 85; do
  curl -s -b /tmp/test-cookies.txt -X POST http://localhost:3000/api/bookmarks \
    -H "Content-Type: application/json" \
    -d "{\"userId\":$USER_ID,\"newsId\":$newsId}" | jq '{success, message}'
done

# 3. bookmarks 테이블 확인
echo -e "\n=== bookmarks 테이블 확인 ==="
node -e "
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');
const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').all($USER_ID);
console.log('북마크 개수:', bookmarks.length);
bookmarks.forEach(b => console.log('- news_id:', b.news_id, ', bookmarked_at:', b.bookmarked_at));
db.close();
"

# 4. MyPage 북마크 API 호출
echo -e "\n=== /api/user/bookmarks API 호출 ==="
BOOKMARKS_RESPONSE=$(curl -s -b /tmp/test-cookies.txt "http://localhost:3000/api/user/bookmarks?page=1&limit=10")
echo "$BOOKMARKS_RESPONSE" | jq '{success, total, count: (.bookmarks | length), bookmarks: [.bookmarks[] | {title, category, bookmarked_at}]}'

