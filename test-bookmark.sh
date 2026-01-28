#!/bin/bash

# 1. 로그인
echo "=== 로그인 ==="
LOGIN_RESPONSE=$(curl -s -c /tmp/test-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}')
echo "$LOGIN_RESPONSE" | jq -r '.user.id' > /tmp/user_id.txt
USER_ID=$(cat /tmp/user_id.txt)
echo "User ID: $USER_ID"

# 2. 북마크 추가 (newsId=83)
echo -e "\n=== 북마크 추가 ==="
ADD_RESPONSE=$(curl -s -b /tmp/test-cookies.txt -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -d "{\"userId\":$USER_ID,\"newsId\":83}")
echo "$ADD_RESPONSE" | jq '.'

# 3. 북마크 확인
echo -e "\n=== 북마크 확인 ==="
CHECK_RESPONSE=$(curl -s -b /tmp/test-cookies.txt "http://localhost:3000/api/bookmarks/check?userId=$USER_ID&link=83")
echo "$CHECK_RESPONSE" | jq '.'

# 4. 북마크 목록 조회
echo -e "\n=== 북마크 목록 ==="
LIST_RESPONSE=$(curl -s -b /tmp/test-cookies.txt "http://localhost:3000/api/user/bookmarks?page=1&limit=10")
echo "$LIST_RESPONSE" | jq '.bookmarks | length' | xargs -I {} echo "북마크 개수: {}"

# 5. 북마크 삭제
echo -e "\n=== 북마크 삭제 ==="
DELETE_RESPONSE=$(curl -s -b /tmp/test-cookies.txt -X DELETE "http://localhost:3000/api/bookmarks/83?userId=$USER_ID")
echo "$DELETE_RESPONSE" | jq '.'

# 6. 삭제 후 확인
echo -e "\n=== 삭제 후 확인 ==="
CHECK_AFTER=$(curl -s -b /tmp/test-cookies.txt "http://localhost:3000/api/bookmarks/check?userId=$USER_ID&link=83")
echo "$CHECK_AFTER" | jq '.'

