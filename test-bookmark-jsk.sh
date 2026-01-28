#!/bin/bash

# 정석종 계정으로 로그인
echo "=== 정석종 계정 로그인 ==="
LOGIN_RESPONSE=$(curl -s -c /tmp/jsk-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sukman@naver.com","password":"password"}')
echo "$LOGIN_RESPONSE" | jq '{success, user: {id, name, email}}'

USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')
if [ "$USER_ID" == "null" ]; then
  echo "❌ 로그인 실패"
  exit 1
fi

# 북마크 추가
echo -e "\n=== 북마크 추가 (newsId=83) ==="
ADD_RESPONSE=$(curl -s -b /tmp/jsk-cookies.txt -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -d "{\"userId\":$USER_ID,\"newsId\":83}")
echo "$ADD_RESPONSE" | jq '.'

# 북마크 목록 조회
echo -e "\n=== 북마크 목록 조회 ==="
LIST_RESPONSE=$(curl -s -b /tmp/jsk-cookies.txt "http://localhost:3000/api/user/bookmarks?page=1&limit=10")
echo "$LIST_RESPONSE" | jq '{success, total, bookmarks: [.bookmarks[] | {title, category}]}'

